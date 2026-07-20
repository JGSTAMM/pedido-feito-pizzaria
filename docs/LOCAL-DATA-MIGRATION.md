# Local Data Migration to Cloud VPS

This guide provides the exact PowerShell commands required to extract your local development data (database and images) and prepare them for migration to your cloud VPS.

## Prerequisites
- You must run these commands from the root directory of your Laravel project.
- You must have `mysqldump` available in your system's PATH.

## Step 1: Create a Backup Directory
Create a dedicated folder at the project root to store the backup files.
```powershell
mkdir backup_nuvem
```

## Step 2: Dump the Database
Export the local MySQL database. 
*Note: If your local database user requires a password, add the `-p` flag to the command (e.g., `mysqldump -u root -p pedido_feito > backup_nuvem/backup.sql`).*
```powershell
mysqldump -u root pedido_feito > backup_nuvem/backup.sql
```

## Step 3: Compress the Public Images
Zip the public storage directory containing the product images.
```powershell
Compress-Archive -Path "storage/app/public/*" -DestinationPath "backup_nuvem/fotos.zip"
```

## Step 4: SFTP Upload (Preview)
Once the backup files are generated, you will use `scp` to send these two files to your server.
```powershell
# Replace [SERVER-IP] with your actual server IP address
scp -r backup_nuvem root@[SERVER-IP]:/root/
```
