from __future__ import annotations

import argparse
import datetime as dt
import fnmatch
import json
import os
import re
import shutil
import subprocess
import sys
import textwrap
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml
from langchain.agents import create_agent
from langchain.tools import tool
from langchain_ollama import ChatOllama
from pydantic import BaseModel, Field
from rich.console import Console
from rich.panel import Panel
from rich.table import Table


console = Console()


# -----------------------------
# Config models
# -----------------------------


@dataclass
class AgentConfig:
    project_root: Path
    ollama_base_url: str
    ollama_model: str
    ollama_temperature: float
    recursion_limit: int
    max_file_chars: int
    max_search_results: int
    auto_task_history_limit: int
    allow_writes: bool
    allow_command_execution: bool
    require_exact_patch: bool
    snapshots_enabled: bool
    prefer_winrar: bool
    archive_format: str
    winrar_path: Path
    archive_name: str
    database_schema_path: str
    source_extensions: List[str]
    pack_extensions: List[str]
    excluded_dirs: List[str]
    excluded_file_patterns: List[str]
    check_commands: List[str]
    allowed_command_prefixes: List[str]

    @property
    def state_dir(self) -> Path:
        return self.project_root / ".lsevin-agent"

    @property
    def backup_dir(self) -> Path:
        return self.state_dir / "backups"

    @property
    def snapshot_dir(self) -> Path:
        return self.state_dir / "snapshots"

    @property
    def log_dir(self) -> Path:
        return self.state_dir / "logs"

    @property
    def completed_tasks_path(self) -> Path:
        return self.state_dir / "completed_tasks.json"

    @property
    def edited_files_path(self) -> Path:
        return self.state_dir / "edited_files.json"


def load_config(config_path: Path) -> AgentConfig:
    if not config_path.exists():
        raise FileNotFoundError(f"Config file not found: {config_path}")

    raw = yaml.safe_load(config_path.read_text(encoding="utf-8")) or {}

    project_root = Path(raw.get("project_root", ".")).expanduser().resolve()
    ollama = raw.get("ollama", {})
    agent = raw.get("agent", {})
    safety = raw.get("safety", {})
    snapshots = raw.get("snapshots", {})
    project = raw.get("project", {})
    checks = raw.get("checks", {})

    return AgentConfig(
        project_root=project_root,
        ollama_base_url=ollama.get("base_url", "http://localhost:11434"),
        ollama_model=ollama.get("model", "qwen2.5-coder:14b-instruct"),
        ollama_temperature=float(ollama.get("temperature", 0)),
        recursion_limit=int(agent.get("recursion_limit", 80)),
        max_file_chars=int(agent.get("max_file_chars", 60000)),
        max_search_results=int(agent.get("max_search_results", 80)),
        auto_task_history_limit=int(agent.get("auto_task_history_limit", 30)),
        allow_writes=bool(safety.get("allow_writes", True)),
        allow_command_execution=bool(safety.get("allow_command_execution", True)),
        require_exact_patch=bool(safety.get("require_exact_patch", True)),
        snapshots_enabled=bool(snapshots.get("enabled", True)),
        prefer_winrar=bool(snapshots.get("prefer_winrar", True)),
        archive_format=str(snapshots.get("archive_format", "zip")).lower(),
        winrar_path=Path(snapshots.get("winrar_path", "C:/Program Files/WinRAR/WinRAR.exe")),
        archive_name=str(snapshots.get("archive_name", "ts-tsx-source")),
        database_schema_path=str(project.get("database_schema_path", "database-schema.sql")),
        source_extensions=list(project.get("source_extensions", [".ts", ".tsx", ".sql", ".json", ".css", ".md"])),
        pack_extensions=list(project.get("pack_extensions", [".ts", ".tsx"])),
        excluded_dirs=list(project.get("excluded_dirs", ["node_modules", ".next", "dist", "build", ".git", ".turbo", ".lsevin-agent"])),
        excluded_file_patterns=list(project.get("excluded_file_patterns", [])),
        check_commands=list(checks.get("commands", ["pnpm lint", "pnpm typecheck"])),
        allowed_command_prefixes=list(raw.get("allowed_command_prefixes", ["pnpm ", "npm ", "npx ", "git status", "git diff"])),
    )


# -----------------------------
# Project context and utilities
# -----------------------------


class ProjectContext:
    def __init__(self, cfg: AgentConfig):
        self.cfg = cfg
        self.cfg.state_dir.mkdir(parents=True, exist_ok=True)
        self.cfg.backup_dir.mkdir(parents=True, exist_ok=True)
        self.cfg.snapshot_dir.mkdir(parents=True, exist_ok=True)
        self.cfg.log_dir.mkdir(parents=True, exist_ok=True)

    def safe_path(self, relative_path: str) -> Path:
        normalized = relative_path.replace("\\", "/").strip().lstrip("/")
        path = (self.cfg.project_root / normalized).resolve()
        root = self.cfg.project_root.resolve()

        try:
            path.relative_to(root)
        except ValueError as exc:
            raise ValueError(f"Unsafe path outside project root: {relative_path}") from exc

        return path

    def rel(self, path: Path) -> str:
        return str(path.resolve().relative_to(self.cfg.project_root.resolve())).replace("\\", "/")

    def is_excluded(self, path: Path) -> bool:
        rel_parts = set(self.rel(path).split("/")) if path.exists() or str(path).startswith(str(self.cfg.project_root)) else set(path.parts)

        for excluded in self.cfg.excluded_dirs:
            if excluded in rel_parts:
                return True

        name = path.name
        for pattern in self.cfg.excluded_file_patterns:
            if fnmatch.fnmatch(name, pattern):
                return True

        return False

    def iter_source_files(self, pack_only: bool = False) -> List[Path]:
        extensions = set(self.cfg.pack_extensions if pack_only else self.cfg.source_extensions)
        result: List[Path] = []

        if not self.cfg.project_root.exists():
            return result

        for path in self.cfg.project_root.rglob("*"):
            if not path.is_file():
                continue
            if self.is_excluded(path):
                continue
            if path.suffix.lower() in extensions:
                result.append(path)

        result.sort(key=lambda p: self.rel(p).lower())
        return result

    def read_text(self, relative_path: str, max_chars: Optional[int] = None) -> str:
        path = self.safe_path(relative_path)
        if not path.exists():
            return f"ERROR: file not found: {relative_path}"
        if not path.is_file():
            return f"ERROR: not a file: {relative_path}"

        text = path.read_text(encoding="utf-8", errors="replace")
        limit = max_chars or self.cfg.max_file_chars
        if len(text) > limit:
            return text[:limit] + f"\n\n...[TRUNCATED after {limit} chars. Ask for a smaller section or increase max_file_chars.]"
        return text

    def backup_file(self, relative_path: str) -> Optional[Path]:
        path = self.safe_path(relative_path)
        if not path.exists():
            return None

        stamp = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
        backup_name = relative_path.replace("\\", "__").replace("/", "__")
        backup_path = self.cfg.backup_dir / f"{stamp}__{backup_name}"
        backup_path.parent.mkdir(parents=True, exist_ok=True)
        backup_path.write_text(path.read_text(encoding="utf-8", errors="replace"), encoding="utf-8")
        return backup_path

    def record_edited_file(self, relative_path: str, operation: str) -> None:
        data = self.load_json(self.cfg.edited_files_path, default=[])
        data.append(
            {
                "at": dt.datetime.now().isoformat(timespec="seconds"),
                "file": relative_path,
                "operation": operation,
            }
        )
        self.write_json(self.cfg.edited_files_path, data)

    def load_json(self, path: Path, default: Any) -> Any:
        if not path.exists():
            return default
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            return default

    def write_json(self, path: Path, data: Any) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    def load_completed_tasks(self) -> List[Dict[str, Any]]:
        return self.load_json(self.cfg.completed_tasks_path, default=[])

    def append_completed_task(self, title: str, summary: str, files: List[str]) -> None:
        data = self.load_completed_tasks()
        data.append(
            {
                "at": dt.datetime.now().isoformat(timespec="seconds"),
                "title": title,
                "summary": summary,
                "files": files,
            }
        )
        self.write_json(self.cfg.completed_tasks_path, data)

    def get_state_summary(self) -> str:
        tasks = self.load_completed_tasks()[-self.cfg.auto_task_history_limit :]
        edited = self.load_json(self.cfg.edited_files_path, default=[])[-50:]

        return json.dumps(
            {
                "recent_completed_tasks": tasks,
                "recent_edited_files": edited,
            },
            ensure_ascii=False,
            indent=2,
        )

    def pack_source_internal(self) -> str:
        if not self.cfg.snapshots_enabled:
            return "Snapshots disabled by config."

        self.cfg.snapshot_dir.mkdir(parents=True, exist_ok=True)
        stamp = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
        fmt = "rar" if self.cfg.archive_format == "rar" else "zip"
        archive_path = self.cfg.snapshot_dir / f"{self.cfg.archive_name}-{stamp}.{fmt}"

        winrar = self.cfg.winrar_path
        if self.cfg.prefer_winrar and winrar.exists():
            if fmt == "zip":
                args = [
                    str(winrar),
                    "a",
                    "-afzip",
                    "-r",
                    str(archive_path),
                ]
            else:
                args = [
                    str(winrar),
                    "a",
                    "-r",
                    str(archive_path),
                ]

            include_patterns = [f"*{ext}" for ext in self.cfg.pack_extensions]
            exclude_patterns = []
            for d in self.cfg.excluded_dirs:
                exclude_patterns.append(f"-x*\\{d}\\*")
                exclude_patterns.append(f"-x*/{d}/*")

            args.extend(include_patterns)
            args.extend(exclude_patterns)

            completed = subprocess.run(
                args,
                cwd=str(self.cfg.project_root),
                capture_output=True,
                text=True,
                timeout=300,
            )

            if completed.returncode == 0 and archive_path.exists():
                return f"Snapshot created with WinRAR: {archive_path}"

            return (
                "WinRAR snapshot failed; falling back to Python zip.\n"
                f"EXIT CODE: {completed.returncode}\n"
                f"STDOUT:\n{completed.stdout[-4000:]}\n"
                f"STDERR:\n{completed.stderr[-4000:]}\n"
                + self._pack_with_python_zip(archive_path.with_suffix(".zip"))
            )

        return self._pack_with_python_zip(archive_path.with_suffix(".zip"))

    def _pack_with_python_zip(self, archive_path: Path) -> str:
        files = self.iter_source_files(pack_only=True)
        with zipfile.ZipFile(archive_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
            for path in files:
                zf.write(path, self.rel(path))
        return f"Snapshot created with Python zip: {archive_path} ({len(files)} files)"


CTX: Optional[ProjectContext] = None


def ctx() -> ProjectContext:
    if CTX is None:
        raise RuntimeError("Project context is not initialized.")
    return CTX


# -----------------------------
# Tool schemas
# -----------------------------


class ReadFileInput(BaseModel):
    relative_path: str = Field(description="Path relative to project root.")
    max_chars: Optional[int] = Field(default=None, description="Optional max characters to return.")


class ReadFilesInput(BaseModel):
    relative_paths: List[str] = Field(description="Paths relative to project root.")
    max_chars_per_file: Optional[int] = Field(default=None, description="Optional max characters per file.")


class SearchInput(BaseModel):
    query: str = Field(description="Case-insensitive search query.")
    max_results: Optional[int] = Field(default=None, description="Maximum number of results.")
    extensions: Optional[List[str]] = Field(default=None, description="Optional extensions like .ts, .tsx.")


class PatchInput(BaseModel):
    relative_path: str = Field(description="Path relative to project root.")
    old_text: str = Field(description="Exact existing text to replace.")
    new_text: str = Field(description="Replacement text.")


class WriteFileInput(BaseModel):
    relative_path: str = Field(description="Path relative to project root.")
    content: str = Field(description="Full new file content.")


class CommandInput(BaseModel):
    command: str = Field(description="Allowed command to run in project root.")


class CompletedTaskInput(BaseModel):
    title: str = Field(description="Short completed task title.")
    summary: str = Field(description="Brief summary of what changed.")
    files: List[str] = Field(default_factory=list, description="Files changed.")


# -----------------------------
# LangChain tools
# -----------------------------


@tool
def get_lsevin_project_definition() -> str:
    """Return the permanent business and technical definition of the LSevin booking system."""
    return Path(__file__).parent.joinpath("prompts", "lsevin_system_prompt.md").read_text(encoding="utf-8")


@tool
def pack_source() -> str:
    """Create a safety snapshot of TS/TSX source files before development work."""
    return ctx().pack_source_internal()


@tool
def read_database_schema() -> str:
    """Read database-schema.sql from the configured project root."""
    c = ctx()
    schema_path = c.safe_path(c.cfg.database_schema_path)
    if not schema_path.exists():
        return f"ERROR: database schema not found at {c.cfg.database_schema_path}. Put database-schema.sql in project root or update config."
    text = schema_path.read_text(encoding="utf-8", errors="replace")
    if len(text) > c.cfg.max_file_chars:
        return text[: c.cfg.max_file_chars] + f"\n\n...[TRUNCATED after {c.cfg.max_file_chars} chars]"
    return text


@tool
def list_project_files() -> str:
    """List relevant source files in the project."""
    c = ctx()
    files = [c.rel(p) for p in c.iter_source_files(pack_only=False)]
    return json.dumps(
        {
            "project_root": str(c.cfg.project_root),
            "count": len(files),
            "files": files[:2000],
            "truncated": len(files) > 2000,
        },
        ensure_ascii=False,
        indent=2,
    )


@tool(args_schema=SearchInput)
def search_code(query: str, max_results: Optional[int] = None, extensions: Optional[List[str]] = None) -> str:
    """Search filenames and file contents for a case-insensitive query."""
    c = ctx()
    q = query.lower()
    limit = max_results or c.cfg.max_search_results
    ext_set = set(extensions or c.cfg.source_extensions)

    results = []
    for path in c.iter_source_files(pack_only=False):
        if path.suffix.lower() not in ext_set:
            continue

        rel = c.rel(path)
        filename_hit = q in rel.lower()
        content_hit = False
        snippets = []

        try:
            text = path.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue

        lower = text.lower()
        idx = lower.find(q)
        if idx >= 0:
            content_hit = True
            start = max(0, idx - 180)
            end = min(len(text), idx + len(query) + 220)
            snippets.append(text[start:end])

        if filename_hit or content_hit:
            results.append(
                {
                    "file": rel,
                    "filename_hit": filename_hit,
                    "content_hit": content_hit,
                    "snippets": snippets,
                }
            )

        if len(results) >= limit:
            break

    return json.dumps(
        {"query": query, "count": len(results), "results": results},
        ensure_ascii=False,
        indent=2,
    )


@tool(args_schema=ReadFileInput)
def read_file(relative_path: str, max_chars: Optional[int] = None) -> str:
    """Read a project file by relative path."""
    return ctx().read_text(relative_path, max_chars=max_chars)


@tool(args_schema=ReadFilesInput)
def read_files(relative_paths: List[str], max_chars_per_file: Optional[int] = None) -> str:
    """Read several project files by relative path."""
    c = ctx()
    output = {}
    for p in relative_paths:
        output[p] = c.read_text(p, max_chars=max_chars_per_file)
    return json.dumps(output, ensure_ascii=False, indent=2)


@tool(args_schema=PatchInput)
def apply_patch(relative_path: str, old_text: str, new_text: str) -> str:
    """Replace exact old_text with new_text in a project file after creating a backup."""
    c = ctx()

    if not c.cfg.allow_writes:
        return "WRITE BLOCKED: safety.allow_writes is false."

    path = c.safe_path(relative_path)
    if not path.exists():
        return f"ERROR: file not found: {relative_path}"

    current = path.read_text(encoding="utf-8", errors="replace")
    count = current.count(old_text)

    if count == 0:
        return (
            f"PATCH FAILED: old_text was not found in {relative_path}. "
            "Read the file again and use an exact block."
        )

    if count > 1:
        return (
            f"PATCH FAILED: old_text appears {count} times in {relative_path}. "
            "Use a larger unique exact block."
        )

    backup_path = c.backup_file(relative_path)
    updated = current.replace(old_text, new_text, 1)
    path.write_text(updated, encoding="utf-8")
    c.record_edited_file(relative_path, "apply_patch")

    return f"PATCH OK: {relative_path}. Backup: {backup_path}"


@tool(args_schema=WriteFileInput)
def write_file(relative_path: str, content: str) -> str:
    """Write a full file after creating a backup. Prefer apply_patch for existing files."""
    c = ctx()

    if not c.cfg.allow_writes:
        return "WRITE BLOCKED: safety.allow_writes is false."

    path = c.safe_path(relative_path)
    backup_path = c.backup_file(relative_path) if path.exists() else None
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    c.record_edited_file(relative_path, "write_file")

    return f"WRITE OK: {relative_path}. Backup: {backup_path}"


@tool(args_schema=CommandInput)
def run_command(command: str) -> str:
    """Run a whitelisted project command in project root."""
    c = ctx()

    if not c.cfg.allow_command_execution:
        return "COMMAND BLOCKED: safety.allow_command_execution is false."

    if not any(command.startswith(prefix) for prefix in c.cfg.allowed_command_prefixes):
        return f"COMMAND BLOCKED: not allowed by allowed_command_prefixes: {command}"

    completed = subprocess.run(
        command,
        cwd=str(c.cfg.project_root),
        shell=True,
        capture_output=True,
        text=True,
        timeout=240,
    )

    return (
        f"COMMAND: {command}\n"
        f"EXIT CODE: {completed.returncode}\n\n"
        f"STDOUT:\n{completed.stdout[-12000:]}\n\n"
        f"STDERR:\n{completed.stderr[-12000:]}"
    )


@tool
def run_project_checks() -> str:
    """Run configured project check commands such as pnpm lint and pnpm typecheck."""
    c = ctx()

    if not c.cfg.allow_command_execution:
        return "CHECKS BLOCKED: safety.allow_command_execution is false."

    outputs = []
    for command in c.cfg.check_commands:
        if not any(command.startswith(prefix) for prefix in c.cfg.allowed_command_prefixes):
            outputs.append(f"COMMAND BLOCKED: {command}")
            continue

        completed = subprocess.run(
            command,
            cwd=str(c.cfg.project_root),
            shell=True,
            capture_output=True,
            text=True,
            timeout=300,
        )

        outputs.append(
            f"COMMAND: {command}\n"
            f"EXIT CODE: {completed.returncode}\n\n"
            f"STDOUT:\n{completed.stdout[-10000:]}\n\n"
            f"STDERR:\n{completed.stderr[-10000:]}"
        )

    return "\n\n" + ("=" * 80 + "\n\n").join(outputs)


@tool
def get_recent_state() -> str:
    """Return recent completed tasks and edited files so auto mode avoids repetition."""
    return ctx().get_state_summary()


@tool(args_schema=CompletedTaskInput)
def mark_task_completed(title: str, summary: str, files: List[str]) -> str:
    """Record completed work in local state."""
    ctx().append_completed_task(title=title, summary=summary, files=files)
    return f"Recorded completed task: {title}"


TOOLS = [
    get_lsevin_project_definition,
    pack_source,
    read_database_schema,
    list_project_files,
    search_code,
    read_file,
    read_files,
    apply_patch,
    write_file,
    run_command,
    run_project_checks,
    get_recent_state,
    mark_task_completed,
]


# -----------------------------
# Agent runner
# -----------------------------


def load_prompt(name: str) -> str:
    return Path(__file__).parent.joinpath("prompts", name).read_text(encoding="utf-8")


def build_agent(cfg: AgentConfig):
    model = ChatOllama(
        model=cfg.ollama_model,
        base_url=cfg.ollama_base_url,
        temperature=cfg.ollama_temperature,
    )

    system_prompt = load_prompt("lsevin_system_prompt.md")

    return create_agent(
        model=model,
        tools=TOOLS,
        system_prompt=system_prompt,
    )


def stringify_agent_result(result: Any) -> str:
    if isinstance(result, dict) and "messages" in result:
        messages = result["messages"]
        if not messages:
            return ""
        last = messages[-1]
        content = getattr(last, "content", None)
        if isinstance(content, str):
            return content
        return str(content)

    return str(result)


def write_run_log(cfg: AgentConfig, mode: str, prompt: str, output: str) -> Path:
    stamp = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    path = cfg.log_dir / f"{stamp}__{mode}.md"
    path.write_text(
        f"# LSevin Agent Run\n\n"
        f"Mode: {mode}\n\n"
        f"Time: {dt.datetime.now().isoformat(timespec='seconds')}\n\n"
        f"## Prompt\n\n{prompt}\n\n"
        f"## Output\n\n{output}\n",
        encoding="utf-8",
    )
    return path


def run_agent_once(cfg: AgentConfig, mode: str, prompt: str) -> str:
    agent = build_agent(cfg)

    result = agent.invoke(
        {"messages": [{"role": "user", "content": prompt}]},
        config={"recursion_limit": cfg.recursion_limit},
    )

    output = stringify_agent_result(result)
    log_path = write_run_log(cfg, mode, prompt, output)
    return output + f"\n\nRun log: {log_path}"


def ensure_project_root(cfg: AgentConfig) -> None:
    if not cfg.project_root.exists():
        raise FileNotFoundError(f"Project root does not exist: {cfg.project_root}")

    if not cfg.project_root.is_dir():
        raise NotADirectoryError(f"Project root is not a directory: {cfg.project_root}")


def preflight_snapshot(ctx_obj: ProjectContext) -> None:
    console.print(Panel("Creating source snapshot before agent work", style="cyan"))
    result = ctx_obj.pack_source_internal()
    console.print(result)


def command_pack(cfg: AgentConfig, ctx_obj: ProjectContext) -> None:
    console.print(ctx_obj.pack_source_internal())


def command_manual(cfg: AgentConfig, ctx_obj: ProjectContext, feature_request: str) -> None:
    preflight_snapshot(ctx_obj)

    prompt_template = load_prompt("manual_mode.md")
    prompt = prompt_template.format(feature_request=feature_request)

    console.print(Panel("Running manual feature mode", style="green"))
    output = run_agent_once(cfg, "manual", prompt)
    console.print(Panel(output, title="Agent output", style="green"))


def command_auto(cfg: AgentConfig, ctx_obj: ProjectContext, iterations: int) -> None:
    for i in range(1, iterations + 1):
        preflight_snapshot(ctx_obj)

        prompt_template = load_prompt("auto_mode.md")
        prompt = prompt_template.format(
            iteration=i,
            iterations=iterations,
            state_summary=ctx_obj.get_state_summary(),
        )

        console.print(Panel(f"Running auto mode iteration {i}/{iterations}", style="magenta"))
        output = run_agent_once(cfg, "auto", prompt)
        console.print(Panel(output, title=f"Auto iteration {i} output", style="magenta"))


def command_status(cfg: AgentConfig, ctx_obj: ProjectContext) -> None:
    table = Table(title="LSevin Agent Status")
    table.add_column("Field")
    table.add_column("Value")

    table.add_row("Project root", str(cfg.project_root))
    table.add_row("Ollama model", cfg.ollama_model)
    table.add_row("Ollama base URL", cfg.ollama_base_url)
    table.add_row("Allow writes", str(cfg.allow_writes))
    table.add_row("Allow commands", str(cfg.allow_command_execution))
    table.add_row("Snapshot dir", str(cfg.snapshot_dir))
    table.add_row("Completed tasks", str(len(ctx_obj.load_completed_tasks())))

    console.print(table)
    console.print(Panel(ctx_obj.get_state_summary(), title="Recent state"))


def parse_args(argv: List[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="LSevin LangChain Dev Agent")
    parser.add_argument(
        "--config",
        default="lsevin-agent.config.yaml",
        help="Path to YAML config.",
    )

    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("pack", help="Create a source snapshot only.")
    sub.add_parser("status", help="Show state and config summary.")

    manual = sub.add_parser("manual", help="Manual feature request mode.")
    manual.add_argument("feature_request", nargs="*", help="Feature request text.")

    auto = sub.add_parser("auto", help="Autonomous improvement mode.")
    auto.add_argument("--iterations", type=int, default=1, help="Number of auto iterations.")

    return parser.parse_args(argv)


def main(argv: List[str]) -> int:
    global CTX

    args = parse_args(argv)
    cfg = load_config(Path(args.config).resolve())
    ensure_project_root(cfg)

    CTX = ProjectContext(cfg)

    if args.command == "pack":
        command_pack(cfg, CTX)
        return 0

    if args.command == "status":
        command_status(cfg, CTX)
        return 0

    if args.command == "manual":
        feature_request = " ".join(args.feature_request).strip()
        if not feature_request:
            console.print("[yellow]Enter the feature request. Finish with Ctrl+Z then Enter on Windows, or Ctrl+D on Linux/macOS.[/yellow]")
            feature_request = sys.stdin.read().strip()

        if not feature_request:
            raise ValueError("Manual mode requires a feature request.")

        command_manual(cfg, CTX, feature_request)
        return 0

    if args.command == "auto":
        iterations = max(1, int(args.iterations))
        command_auto(cfg, CTX, iterations)
        return 0

    raise ValueError(f"Unknown command: {args.command}")


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
