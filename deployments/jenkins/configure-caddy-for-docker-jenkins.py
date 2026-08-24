#!/usr/bin/env python3
from __future__ import annotations

import pathlib
import re
import sys

NEW_BLOCK = '''# Jenkins runs as a Docker service on the shared LSevin network.
{$JENKINS_DOMAIN:devops.lsevin.com} {
\timport common_headers
\treverse_proxy jenkins:8080 {
\t\theader_up Host {host}
\t\theader_up X-Forwarded-Host {host}
\t\theader_up X-Forwarded-Proto {scheme}
\t\theader_up X-Forwarded-Port {server_port}
\t}
}
'''

SITE_LINE = re.compile(r'(?m)^[ \t]*(?:\{\$JENKINS_DOMAIN:[^}]+\}|(?:jenkins|devops)\.lsevin\.com)[ \t]*\{')


def block_span(text: str, match: re.Match[str]) -> tuple[int, int]:
    brace = text.find('{', match.start())
    if text.startswith('{$', brace):
        brace = text.find('{', text.find('}', brace) + 1)
    if brace < 0:
        raise RuntimeError('Malformed Jenkins Caddy site block')
    depth = 0
    end = None
    for index in range(brace, len(text)):
        char = text[index]
        if char == '{':
            depth += 1
        elif char == '}':
            depth -= 1
            if depth == 0:
                end = index + 1
                break
    if end is None:
        raise RuntimeError('Unclosed Jenkins Caddy site block')

    start = text.rfind('\n', 0, match.start()) + 1
    lines = text[:start].splitlines(keepends=True)
    while lines and (not lines[-1].strip() or lines[-1].lstrip().startswith('#')):
        lines.pop()
    start = sum(len(line) for line in lines)
    while end < len(text) and text[end] in ' \t\r\n':
        end += 1
    return start, end


def replace_site(path: pathlib.Path) -> bool:
    text = path.read_text(encoding='utf-8')
    matches = list(SITE_LINE.finditer(text))
    if not matches:
        prefix = '' if text.endswith('\n') else '\n'
        path.write_text(text + prefix + '\n' + NEW_BLOCK, encoding='utf-8')
        return True

    spans = [block_span(text, match) for match in matches]
    updated = text
    first_original = spans[0]
    for start, end in reversed(spans):
        updated = updated[:start] + updated[end:]
    insertion = first_original[0]
    updated = updated[:insertion] + NEW_BLOCK + ('\n' if insertion < len(updated) else '') + updated[insertion:]
    if updated == text:
        return False
    path.write_text(updated, encoding='utf-8')
    return True


def main() -> int:
    if len(sys.argv) < 2:
        print(f'Usage: {sys.argv[0]} <Caddyfile> [<Caddyfile> ...]', file=sys.stderr)
        return 2
    for raw in sys.argv[1:]:
        path = pathlib.Path(raw)
        if not path.is_file():
            print(f'Skip missing file: {path}')
            continue
        changed = replace_site(path)
        print(f'{"Updated" if changed else "Already configured"}: {path}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
