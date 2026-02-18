

1.script 

make executable : 
chmod +x ~/pg_backup_15min.sh


3) Add cron (every 15 minutes)

Edit crontab:

crontab -e

add
# m h  dom mon dow   command
*/15 * * * * DB=lsevin USER_NAME=lsevin PGPASSWORD='CHANGE_ME_DB_PASSWORD' /root/backupscript/pg_ba>






Restore (quick sanity)

To restore a .dump created with -Fc:

pg_restore -d your_db -U postgres /path/to/your_db_YYYY-MM-DD_HH-MM-SS.dump

Step 1 — Find the full path

Run this:

echo $HOME



backups: 
/var/backups/postgres