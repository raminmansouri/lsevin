#!/usr/bin/env python3
"""Secure Tkinter/SFTP downloader for LSevin backup directories."""

from __future__ import annotations

import json
import locale
import os
import queue
import base64
import hashlib
import stat
import threading
from pathlib import Path, PurePosixPath
import tkinter as tk
from tkinter import filedialog, messagebox, ttk

try:
    import keyring
    import paramiko
except ImportError as exc:  # pragma: no cover - displayed before the GUI exists
    raise SystemExit("Install dependencies with: pip install paramiko keyring") from exc


APP_NAME = "LSevinBackupDownloader"
KEYRING_SERVICE = "lsevin-backup-downloader"
CONFIG_DIR = Path(os.getenv("LOCALAPPDATA", Path.home() / ".config")) / APP_NAME
CONFIG_FILE = CONFIG_DIR / "settings.json"
KNOWN_HOSTS_FILE = CONFIG_DIR / "known_hosts"

TEXT = {
    "en": {
        "title": "LSevin backup downloader",
        "host": "Server",
        "port": "Port",
        "username": "Username",
        "password": "Password",
        "remote": "Remote backup folder",
        "local": "Local destination",
        "browse": "Browse…",
        "save_password": "Save password in the operating-system credential vault",
        "download": "Download backups",
        "forget": "Forget saved password",
        "idle": "Ready",
        "connecting": "Connecting securely…",
        "scanning": "Scanning remote backup files…",
        "complete": "Backup download completed.",
        "forgotten": "The saved password was removed.",
        "missing": "Complete all connection fields and choose a destination.",
        "error": "Backup download failed",
        "unknown_host": "Unknown SSH host key",
        "trust_host": "Trust this server and save its SSH host key?\n\n{host}\nSHA256: {fingerprint}",
        "changed_host": "The server SSH host key changed. Connection was refused.",
        "files": "{done}/{total} files — {name}",
    },
    "fa": {
        "title": "دریافت نسخه پشتیبان ال‌سون",
        "host": "سرور",
        "port": "پورت",
        "username": "نام کاربری",
        "password": "رمز عبور",
        "remote": "پوشه پشتیبان روی سرور",
        "local": "مسیر ذخیره محلی",
        "browse": "انتخاب…",
        "save_password": "ذخیره رمز در مخزن امن سیستم‌عامل",
        "download": "دریافت نسخه پشتیبان",
        "forget": "حذف رمز ذخیره‌شده",
        "idle": "آماده",
        "connecting": "در حال اتصال امن…",
        "scanning": "در حال بررسی فایل‌های پشتیبان…",
        "complete": "دریافت نسخه پشتیبان کامل شد.",
        "forgotten": "رمز ذخیره‌شده حذف شد.",
        "missing": "اطلاعات اتصال و مسیر ذخیره را کامل کنید.",
        "error": "دریافت نسخه پشتیبان ناموفق بود",
        "unknown_host": "کلید SSH سرور ناشناخته است",
        "trust_host": "آیا به این سرور اعتماد دارید و کلید SSH آن ذخیره شود؟\n\n{host}\nSHA256: {fingerprint}",
        "changed_host": "کلید SSH سرور تغییر کرده است؛ اتصال رد شد.",
        "files": "{done}/{total} فایل — {name}",
    },
}


def default_language() -> str:
    language = (locale.getlocale()[0] or "en").lower()
    return "fa" if language.startswith("fa") else "en"


def load_settings() -> dict[str, object]:
    defaults: dict[str, object] = {
        "host": "202.133.90.50",
        "port": 22,
        "username": "agent",
        "remote": "/opt/lsevin/backups",
        "local": str(Path.home() / "LSevin Backups"),
        "language": default_language(),
        "save_password": True,
    }
    try:
        defaults.update(json.loads(CONFIG_FILE.read_text(encoding="utf-8")))
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        pass
    return defaults


class ConfirmHostKeyPolicy(paramiko.MissingHostKeyPolicy):
    def __init__(self, app: "BackupApp") -> None:
        self.app = app

    def missing_host_key(self, client, hostname, key):  # noqa: ANN001
        fingerprint = base64.b64encode(hashlib.sha256(key.asbytes()).digest()).decode("ascii").rstrip("=")
        accepted = self.app.ask_from_worker(
            self.app.t("unknown_host"),
            self.app.t("trust_host").format(host=hostname, fingerprint=fingerprint),
        )
        if not accepted:
            raise paramiko.SSHException("SSH host key was not trusted")
        CONFIG_DIR.mkdir(parents=True, exist_ok=True)
        client.get_host_keys().add(hostname, key.get_name(), key)
        client.save_host_keys(str(KNOWN_HOSTS_FILE))


class BackupApp:
    def __init__(self, root: tk.Tk) -> None:
        self.root = root
        self.settings = load_settings()
        self.events: queue.Queue[tuple[str, object]] = queue.Queue()
        self.variables = {
            key: tk.StringVar(value=str(self.settings[key]))
            for key in ("host", "port", "username", "remote", "local")
        }
        account = self.credential_account()
        self.password = tk.StringVar(value=keyring.get_password(KEYRING_SERVICE, account) or "")
        self.save_password = tk.BooleanVar(value=bool(self.settings["save_password"]))
        self.language = tk.StringVar(value=str(self.settings["language"]))
        self.status = tk.StringVar()
        self.build()
        self.root.after(100, self.process_events)

    def t(self, key: str) -> str:
        return TEXT.get(self.language.get(), TEXT["en"])[key]

    def credential_account(self) -> str:
        host = str(self.settings.get("host", "202.133.90.50"))
        port = str(self.settings.get("port", 22))
        username = str(self.settings.get("username", "agent"))
        return f"{username}@{host}:{port}"

    def current_account(self) -> str:
        return f"{self.variables['username'].get()}@{self.variables['host'].get()}:{self.variables['port'].get()}"

    def build(self) -> None:
        self.root.title(self.t("title"))
        self.root.minsize(650, 430)
        frame = ttk.Frame(self.root, padding=18)
        frame.grid(sticky="nsew")
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        frame.columnconfigure(1, weight=1)

        fields = ("host", "port", "username", "password", "remote", "local")
        for row, key in enumerate(fields):
            ttk.Label(frame, text=self.t(key)).grid(row=row, column=0, sticky="w", padx=(0, 10), pady=6)
            variable = self.password if key == "password" else self.variables[key]
            entry = ttk.Entry(frame, textvariable=variable, show="•" if key == "password" else "")
            entry.grid(row=row, column=1, sticky="ew", pady=6)
            if key == "local":
                ttk.Button(frame, text=self.t("browse"), command=self.choose_folder).grid(
                    row=row, column=2, padx=(8, 0), pady=6
                )

        ttk.Checkbutton(frame, text=self.t("save_password"), variable=self.save_password).grid(
            row=6, column=1, columnspan=2, sticky="w", pady=8
        )
        language_box = ttk.Combobox(frame, textvariable=self.language, values=("en", "fa"), width=5, state="readonly")
        language_box.grid(row=7, column=0, sticky="w", pady=8)
        language_box.bind("<<ComboboxSelected>>", lambda _event: self.rebuild())

        actions = ttk.Frame(frame)
        actions.grid(row=7, column=1, columnspan=2, sticky="e", pady=8)
        ttk.Button(actions, text=self.t("forget"), command=self.forget_password).pack(side="left", padx=4)
        self.download_button = ttk.Button(actions, text=self.t("download"), command=self.start_download)
        self.download_button.pack(side="left", padx=4)

        self.progress = ttk.Progressbar(frame, mode="determinate")
        self.progress.grid(row=8, column=0, columnspan=3, sticky="ew", pady=(14, 5))
        ttk.Label(frame, textvariable=self.status).grid(row=9, column=0, columnspan=3, sticky="w")
        self.status.set(self.t("idle"))

    def rebuild(self) -> None:
        self.settings["language"] = self.language.get()
        for child in self.root.winfo_children():
            child.destroy()
        self.build()

    def choose_folder(self) -> None:
        selected = filedialog.askdirectory(initialdir=self.variables["local"].get())
        if selected:
            self.variables["local"].set(selected)

    def forget_password(self) -> None:
        try:
            keyring.delete_password(KEYRING_SERVICE, self.current_account())
        except keyring.errors.PasswordDeleteError:
            pass
        self.password.set("")
        messagebox.showinfo(self.t("title"), self.t("forgotten"))

    def ask_from_worker(self, title: str, text: str) -> bool:
        answer: queue.Queue[bool] = queue.Queue(maxsize=1)
        self.events.put(("ask", (title, text, answer)))
        return answer.get()

    def start_download(self) -> None:
        values = {key: variable.get().strip() for key, variable in self.variables.items()}
        if not all(values.values()) or not self.password.get():
            messagebox.showerror(self.t("title"), self.t("missing"))
            return
        try:
            port = int(values["port"])
        except ValueError:
            messagebox.showerror(self.t("title"), self.t("missing"))
            return

        self.settings.update(values | {"port": port, "language": self.language.get(), "save_password": self.save_password.get()})
        CONFIG_DIR.mkdir(parents=True, exist_ok=True)
        CONFIG_FILE.write_text(json.dumps(self.settings, ensure_ascii=False, indent=2), encoding="utf-8")
        if self.save_password.get():
            keyring.set_password(KEYRING_SERVICE, self.current_account(), self.password.get())
        else:
            try:
                keyring.delete_password(KEYRING_SERVICE, self.current_account())
            except keyring.errors.PasswordDeleteError:
                pass

        self.download_button.state(["disabled"])
        self.progress.configure(value=0, maximum=1)
        threading.Thread(target=self.download_worker, daemon=True).start()

    def download_worker(self) -> None:
        client = paramiko.SSHClient()
        client.load_system_host_keys()
        if KNOWN_HOSTS_FILE.exists():
            client.load_host_keys(str(KNOWN_HOSTS_FILE))
        client.set_missing_host_key_policy(ConfirmHostKeyPolicy(self))
        try:
            self.events.put(("status", self.t("connecting")))
            client.connect(
                hostname=str(self.settings["host"]),
                port=int(self.settings["port"]),
                username=str(self.settings["username"]),
                password=self.password.get(),
                look_for_keys=False,
                allow_agent=False,
                timeout=20,
                banner_timeout=20,
                auth_timeout=20,
            )
            with client.open_sftp() as sftp:
                remote_root = PurePosixPath(str(self.settings["remote"]))
                local_root = Path(str(self.settings["local"])) / remote_root.name
                self.events.put(("status", self.t("scanning")))
                files = self.collect_files(sftp, remote_root)
                self.events.put(("maximum", len(files) or 1))
                for index, (remote_file, attributes) in enumerate(files, 1):
                    relative = remote_file.relative_to(remote_root)
                    local_file = local_root.joinpath(*relative.parts)
                    local_file.parent.mkdir(parents=True, exist_ok=True)
                    temporary = local_file.with_name(local_file.name + ".part")
                    sftp.get(str(remote_file), str(temporary))
                    os.utime(temporary, (attributes.st_mtime, attributes.st_mtime))
                    temporary.replace(local_file)
                    self.events.put(("progress", (index, len(files), str(relative))))
            self.events.put(("complete", self.t("complete")))
        except Exception as exc:  # surface connection/filesystem details without exposing the password
            self.events.put(("error", str(exc)))
        finally:
            client.close()

    @staticmethod
    def collect_files(sftp: paramiko.SFTPClient, root: PurePosixPath):
        files = []
        pending = [root]
        while pending:
            directory = pending.pop()
            for item in sftp.listdir_attr(str(directory)):
                path = directory / item.filename
                if stat.S_ISDIR(item.st_mode):
                    pending.append(path)
                elif stat.S_ISREG(item.st_mode):
                    files.append((path, item))
        files.sort(key=lambda value: str(value[0]))
        return files

    def process_events(self) -> None:
        try:
            while True:
                event, payload = self.events.get_nowait()
                if event == "ask":
                    title, text, answer = payload
                    answer.put(messagebox.askyesno(title, text))
                elif event == "status":
                    self.status.set(str(payload))
                elif event == "maximum":
                    self.progress.configure(maximum=int(payload))
                elif event == "progress":
                    done, total, name = payload
                    self.progress.configure(value=done)
                    self.status.set(self.t("files").format(done=done, total=total, name=name))
                elif event == "complete":
                    self.download_button.state(["!disabled"])
                    self.status.set(str(payload))
                    messagebox.showinfo(self.t("title"), str(payload))
                elif event == "error":
                    self.download_button.state(["!disabled"])
                    self.status.set(self.t("error"))
                    messagebox.showerror(self.t("error"), str(payload))
        except queue.Empty:
            pass
        self.root.after(100, self.process_events)


def main() -> None:
    root = tk.Tk()
    BackupApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
