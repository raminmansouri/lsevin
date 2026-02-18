import os
import fnmatch
from datetime import datetime, timedelta
import paramiko

# -------- CONFIG (EDIT THESE) --------
HOST = "45.90.98.111"
PORT = 22
USERNAME = "root"

# Choose ONE auth method:

# Method A) Password
PASSWORD = "foJO0UdZSfbkbCvBVpBH"  # e.g. "secret"  (leave empty if using key)

# Method B) Private key (Bitvise often gives you a key)
# Example: r"C:\Users\You\.ssh\id_rsa"
KEY_PATH = r""  # leave empty if using password

REMOTE_DIR = "/var/backups/postgres"
PATTERN = "lsevin_*.dump"      # match your dump files
LOCAL_DIR = r"C:\pg_backups"    # where to store locally
KEEP_DAYS = 2                   # keep last 2 days locally
# ------------------------------------

def ensure_dir(path: str):
    os.makedirs(path, exist_ok=True)

def connect_sftp():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    if KEY_PATH:
        # If your key is encrypted, you can set KEY_PASSPHRASE via env var
        passphrase = os.environ.get("KEY_PASSPHRASE", None)
        pkey = paramiko.RSAKey.from_private_key_file(KEY_PATH, password=passphrase)
        client.connect(HOST, port=PORT, username=USERNAME, pkey=pkey)
    else:
        if not PASSWORD:
            raise RuntimeError("No auth set: provide PASSWORD or KEY_PATH.")
        client.connect(HOST, port=PORT, username=USERNAME, password=PASSWORD)

    return client, client.open_sftp()

def pick_latest(sftp):
    entries = sftp.listdir_attr(REMOTE_DIR)
    matches = [e for e in entries if fnmatch.fnmatch(e.filename, PATTERN)]
    if not matches:
        raise RuntimeError(f"No files match {PATTERN} in {REMOTE_DIR}")
    latest = max(matches, key=lambda e: e.st_mtime)
    return latest.filename, latest.st_mtime

def cleanup_local():
    cutoff = datetime.now() - timedelta(days=KEEP_DAYS)
    for name in os.listdir(LOCAL_DIR):
        path = os.path.join(LOCAL_DIR, name)
        if not os.path.isfile(path):
            continue
        mtime = datetime.fromtimestamp(os.path.getmtime(path))
        if mtime < cutoff:
            os.remove(path)

def main():
    ensure_dir(LOCAL_DIR)

    client = None
    sftp = None
    try:
        client, sftp = connect_sftp()

        latest_name, latest_mtime = pick_latest(sftp)
        remote_path = f"{REMOTE_DIR.rstrip('/')}/{latest_name}"

        # Prefix local file with download date so multiple days don’t overwrite each other
        dl_day = datetime.now().strftime("%Y-%m-%d")
        local_name = f"{dl_day}__{latest_name}"
        local_path = os.path.join(LOCAL_DIR, local_name)

        # Skip if we already downloaded today’s copy
        if os.path.exists(local_path):
            print(f"Already exists: {local_path} (skipping)")
        else:
            tmp_path = local_path + ".part"
            print(f"Downloading {remote_path} -> {local_path}")
            sftp.get(remote_path, tmp_path)
            os.replace(tmp_path, local_path)
            print("Done.")

        cleanup_local()
        print(f"Cleanup: kept last {KEEP_DAYS} days in {LOCAL_DIR}")

    finally:
        try:
            if sftp: sftp.close()
        except Exception:
            pass
        try:
            if client: client.close()
        except Exception:
            pass

if __name__ == "__main__":
    main()
