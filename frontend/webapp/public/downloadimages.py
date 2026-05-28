#!/usr/bin/env python3
"""
Recursively searches all files in a directory for Unsplash image URLs,
downloads them into a local folder, and replaces the URLs in the files
so the project works offline.
"""

import os
import re
import sys
import ssl
import logging
import urllib.request
from pathlib import Path
from urllib.parse import urlparse

# Bypass SSL certificate verification (handles expired/self-signed certs on Unsplash CDN)
SSL_CONTEXT = ssl.create_default_context()
SSL_CONTEXT.check_hostname = False
SSL_CONTEXT.verify_mode = ssl.CERT_NONE

# ── Logging setup ─────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
    handlers=[
        logging.StreamHandler(sys.stdout),                        # console
        logging.FileHandler("download_unsplash.log", mode="w"),   # file
    ],
)
log = logging.getLogger(__name__)
# ─────────────────────────────────────────────────────────────────────────────

# ── Configuration ────────────────────────────────────────────────────────────
SEARCH_DIR   = "./src"                        # Root directory to scan (change as needed)
DOWNLOAD_DIR = "unsplash_images"          # Local folder where images are saved
URL_PREFIX   = "https://images.unsplash.com/"

# File extensions to scan for URLs (add/remove as needed)
SCAN_EXTENSIONS = {
    ".ts", ".tsx", ".js", ".jsx",
    ".html", ".css", ".json", ".md",
    ".txt", ".yaml", ".yml", ".env",
}

# Regex: matches any URL starting with https://images.unsplash.com/
UNSPLASH_RE = re.compile(
    r'https://images\.unsplash\.com/[^\s\'"`)}>]+'
)
# ─────────────────────────────────────────────────────────────────────────────


def sanitize_filename(url: str) -> str:
    """
    Converts a full Unsplash URL into a safe local file path.

    Example:
        https://images.unsplash.com/photo-123?w=400&h=300&fit=crop
        → photo-123_w=400&h=300&fit=crop.jpg
    """
    parsed = urlparse(url)
    # path part after the leading slash, e.g. "photo-1537996194471-e657df975ab4"
    path_part = parsed.path.lstrip("/").replace("/", "__")
    query_part = parsed.query  # e.g. "w=400&h=300&fit=crop"

    # Build filename
    if query_part:
        filename = f"{path_part}__{query_part}"
    else:
        filename = path_part

    # Replace characters that are problematic on Windows / Linux
    filename = re.sub(r'[<>:"/\\|?*]', '_', filename)

    # Ensure a .jpg extension so browsers / image viewers recognise the file
    if not filename.lower().endswith((".jpg", ".jpeg", ".png", ".webp", ".gif")):
        filename += ".jpg"

    return filename


def collect_urls(search_dir: str) -> dict[str, str]:
    """
    Walk *search_dir* recursively, find every unique Unsplash URL,
    and return a mapping  { url → local_filename }.
    """
    url_map: dict[str, str] = {}
    scanned = 0
    skipped = 0

    log.info("Walking directory: %s", search_dir)

    for root, dirs, files in os.walk(search_dir):
        # Skip the download folder itself so we don't scan it
        dirs[:] = [d for d in dirs if os.path.join(root, d) != os.path.abspath(DOWNLOAD_DIR)]

        log.debug("Entering folder: %s  (%d files)", root, len(files))

        for fname in files:
            ext = Path(fname).suffix.lower()
            if ext not in SCAN_EXTENSIONS:
                skipped += 1
                log.debug("  SKIP (extension '%s'): %s", ext, fname)
                continue

            filepath = os.path.join(root, fname)
            log.debug("  Scanning: %s", filepath)
            scanned += 1

            try:
                text = Path(filepath).read_text(encoding="utf-8", errors="ignore")
            except OSError as exc:
                log.warning("  Could not read %s: %s", filepath, exc)
                continue

            found = UNSPLASH_RE.findall(text)
            if found:
                log.info("  Found %d URL(s) in %s", len(found), filepath)
            for url in found:
                if url not in url_map:
                    url_map[url] = sanitize_filename(url)
                    log.debug("    + %s", url)

    log.info("Scan complete — %d file(s) scanned, %d skipped, %d unique URL(s) found.",
             scanned, skipped, len(url_map))
    return url_map


def download_images(url_map: dict[str, str], download_dir: str) -> dict[str, str]:
    """
    Download every URL in *url_map* into *download_dir*.
    Returns a mapping  { url → local_relative_path }  for the replacement step.
    """
    os.makedirs(download_dir, exist_ok=True)
    log.info("Download folder ready: %s", os.path.abspath(download_dir))

    replacement_map: dict[str, str] = {}
    total = len(url_map)

    for idx, (url, filename) in enumerate(url_map.items(), start=1):
        local_path = os.path.join(download_dir, filename)
        relative_path = f"{download_dir}/{filename}"

        if os.path.exists(local_path):
            size = os.path.getsize(local_path)
            log.info("[%d/%d] SKIP (cached, %d bytes): %s", idx, total, size, filename)
        else:
            log.info("[%d/%d] Downloading: %s", idx, total, url)
            try:
                req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(req, timeout=30, context=SSL_CONTEXT) as resp, \
                     open(local_path, "wb") as out:
                    data = resp.read()
                    out.write(data)
                log.info("         Saved %d bytes → %s", len(data), filename)
            except Exception as exc:
                log.error("         FAILED %s: %s", url, exc)
                replacement_map[url] = url   # keep original URL on failure
                continue

        replacement_map[url] = relative_path

    log.info("Downloads complete: %d succeeded, %d kept original.",
             sum(1 for v in replacement_map.values() if not v.startswith("http")),
             sum(1 for v in replacement_map.values() if v.startswith("http")))
    return replacement_map


def replace_urls_in_files(search_dir: str, replacement_map: dict[str, str]) -> None:
    """
    Walk *search_dir* again and replace every Unsplash URL with its
    local relative path.
    """
    files_changed = 0

    for root, dirs, files in os.walk(search_dir):
        dirs[:] = [d for d in dirs if os.path.join(root, d) != os.path.abspath(DOWNLOAD_DIR)]

        for fname in files:
            ext = Path(fname).suffix.lower()
            if ext not in SCAN_EXTENSIONS:
                continue

            filepath = os.path.join(root, fname)
            try:
                original = Path(filepath).read_text(encoding="utf-8", errors="ignore")
            except OSError as exc:
                log.warning("Could not read %s: %s", filepath, exc)
                continue

            updated = original
            replacements_in_file = 0
            for url, local_path in replacement_map.items():
                if url in updated:
                    updated = updated.replace(url, local_path)
                    replacements_in_file += 1
                    log.debug("  Replaced in %s:\n    %s\n    → %s", filepath, url, local_path)

            if updated != original:
                Path(filepath).write_text(updated, encoding="utf-8")
                log.info("Updated (%d replacement(s)): %s", replacements_in_file, filepath)
                files_changed += 1

    log.info("Replace step done — %d file(s) modified.", files_changed)


def main() -> None:
    search_dir = sys.argv[1] if len(sys.argv) > 1 else SEARCH_DIR
    search_dir = os.path.abspath(search_dir)

    log.info("=" * 60)
    log.info("Unsplash image downloader starting")
    log.info("Scan root : %s", search_dir)
    log.info("Save to   : %s", os.path.abspath(DOWNLOAD_DIR))
    log.info("=" * 60)

    # 1. Collect all unique URLs
    log.info("► Step 1/3 — Collecting Unsplash URLs …")
    url_map = collect_urls(search_dir)
    if not url_map:
        log.warning("No Unsplash URLs found. Nothing to do.")
        return
    log.info("Step 1 complete — %d unique URL(s) collected.\n", len(url_map))

    # 2. Download images
    log.info("► Step 2/3 — Downloading images …")
    replacement_map = download_images(url_map, DOWNLOAD_DIR)
    log.info("Step 2 complete.\n")

    # 3. Replace URLs in source files
    log.info("► Step 3/3 — Replacing URLs in source files …")
    replace_urls_in_files(search_dir, replacement_map)
    log.info("Step 3 complete.\n")

    log.info("✓ All done! Images saved to '%s/'", DOWNLOAD_DIR)
    log.info("  Full log written to: download_unsplash.log")


if __name__ == "__main__":
    main()