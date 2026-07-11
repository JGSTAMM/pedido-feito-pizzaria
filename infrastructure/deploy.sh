#!/bin/bash
set -e

echo "Deploying Pedido Feito..."

# Define application path
APP_DIR="/var/www/pedido-feito"
cd $APP_DIR

# 1. Enter maintenance mode
echo "Entering maintenance mode..."
php artisan down || true

# 2. Pull latest code
echo "Pulling latest code from main branch..."
git pull origin main

# 3. Install/Update Composer dependencies
echo "Installing Composer dependencies..."
composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev

# 4. Install NPM dependencies & Build Assets
echo "Building frontend assets..."
npm install
npm run build

# 5. Run Database Migrations
echo "Running database migrations..."
php artisan migrate --force

# 6. Clear and Cache Configurations
echo "Optimizing application caches..."
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# 7. Restart services (Supervisor and PHP-FPM)
echo "Restarting background workers and PHP-FPM..."
sudo supervisorctl restart all
sudo systemctl reload php8.4-fpm

# 8. Exit maintenance mode
echo "Exiting maintenance mode..."
php artisan up

echo "Deployment finished successfully!"
