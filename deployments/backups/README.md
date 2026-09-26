# Production backups

The production host keeps verified, rotating backups under `/var/backups/lsevin`:

- `config`: secrets/configuration, deployment definitions, and systemd units.
- `uploads`: immutable hard-linked snapshots of legacy uploaded files.
- `object-storage`: S3 object snapshots created by the SeaweedFS CronJob.
- `jenkins`: Jenkins controller archives.

PostgreSQL logical and pgBackRest backups are under `/opt/lsevin/backups` for the
current installation. Restore instructions live with the database Ansible role.

Run `sudo deployments/backups/install.sh` on a fresh server after the repository
and `/etc/lsevin` secrets have been restored. The Jenkins, media, and database
timers are installed by their existing Ansible roles.

`/var/backups` and `/opt/lsevin/backups` must be replicated or mounted off-host
(encrypted disk/NFS/object storage). Backups on the production disk protect from
application mistakes but do not protect from complete server loss.

## Windows backup downloader

`download_backups_gui.py` provides an English/Persian Tkinter interface for
recursively downloading a server backup directory over SFTP. The password is
stored through Python `keyring` in the operating-system credential vault, never
in the settings JSON. The first connection asks the operator to verify and trust
the SSH host key.

```powershell
py -m pip install -r deployments\backups\requirements-downloader.txt
py deployments\backups\download_backups_gui.py
```

The SSH account must have read permission for the selected directory. Use
`/opt/lsevin/backups` for PostgreSQL backups and `/var/backups/lsevin` for
configuration, Jenkins, uploads, and object-storage snapshots.

Grant the downloader account read-only access (including future backup files):

```bash
sudo deployments/backups/grant-backup-download-access agent
```
