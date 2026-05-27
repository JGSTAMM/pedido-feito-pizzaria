# Ubuntu VPS Setup Guide

This comprehensive guide walks you through provisioning a bare Ubuntu 22.04 or 24.04 VPS to host the Laravel 11 (React/Inertia) application with Reverb WebSockets.

## Step 1: System Update & Prerequisites
First, log into your new server as `root` (or a user with sudo privileges) and update the package list.

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git unzip wget software-properties-common
```

## Step 2: Install Nginx & MariaDB
Install Nginx as the web server and MariaDB as the database server.

```bash
sudo apt install -y nginx mariadb-server
```

Secure your MariaDB installation (you will be prompted to set a root password and answer Y to security questions):
```bash
sudo mysql_secure_installation
```

Log into MySQL to create your database and user:
```bash
sudo mysql -u root -p
```
*Inside the MySQL prompt:*
```sql
CREATE DATABASE pedido_feito;
CREATE USER 'pedido_user'@'localhost' IDENTIFIED BY 'StrongPassword123!';
GRANT ALL PRIVILEGES ON pedido_feito.* TO 'pedido_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## Step 3: Install PHP 8.3
Add the `ondrej/php` PPA repository to install the latest PHP version, along with the required extensions for Laravel and SQLite/MySQL.

```bash
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update
sudo apt install -y php8.3-fpm php8.3-mysql php8.3-xml php8.3-mbstring php8.3-curl php8.3-zip php8.3-bcmath php8.3-sqlite3 php8.3-intl php8.3-redis
```

Verify your PHP version:
```bash
php -v
```

## Step 4: Install Composer & Node.js
**Composer:**
```bash
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
```

**Node.js (v20 LTS):**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

## Step 5: Install Supervisor & Redis
Supervisor will manage our persistent Laravel queues and Reverb WebSocket daemon. Redis is highly recommended for Reverb scaling and caching.

```bash
sudo apt install -y supervisor redis-server
sudo systemctl enable supervisor
sudo systemctl enable redis-server
```

## Step 6: Clone & Configure Application
Clone your repository into the `/var/www/` directory.

```bash
cd /var/www
sudo git clone https://github.com/JGSTAMM/pedido-feito-pizzaria.git pedido-feito
cd pedido-feito

# Fix permissions
sudo chown -R $USER:www-data /var/www/pedido-feito
sudo find /var/www/pedido-feito -type f -exec chmod 664 {} \;
sudo find /var/www/pedido-feito -type d -exec chmod 775 {} \;
sudo chmod -R 775 storage bootstrap/cache

# Setup environment variables
cp .env.example .env
nano .env # (Enter your DB credentials, APP_URL, and Reverb config here)

# Install Composer dependencies temporarily to generate key
composer install --no-dev --optimize-autoloader
php artisan key:generate
```

## Step 7: Apply Infrastructure Files
Link the infrastructure configurations we generated previously.

**Nginx:**
```bash
sudo rm /etc/nginx/sites-enabled/default
sudo ln -s /var/www/pedido-feito/infrastructure/nginx-production.conf /etc/nginx/sites-available/pedido-feito.conf
sudo ln -s /etc/nginx/sites-available/pedido-feito.conf /etc/nginx/sites-enabled/

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

**Supervisor:**
```bash
sudo cp /var/www/pedido-feito/infrastructure/supervisor-reverb-queue.conf /etc/supervisor/conf.d/
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start all
```

## Step 8: First Deployment
Execute our automated deployment script to build the frontend, run migrations, and optimize caches.

```bash
chmod +x infrastructure/deploy.sh
./infrastructure/deploy.sh
```

## Step 9: SSL/HTTPS (Certbot)
To enable secure HTTPS connections (required for WebSockets `wss://`), use Let's Encrypt.

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```
Follow the prompts to automatically configure your Nginx file for HTTPS.
