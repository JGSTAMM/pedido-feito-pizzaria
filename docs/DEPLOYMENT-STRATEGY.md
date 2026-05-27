# Deployment Strategy for Pedido-Feito 2.0

This document outlines the generic deployment requirements and server architecture for hosting the Laravel 11 + React (Inertia) application, including real-time WebSocket capabilities via Laravel Reverb.

## 🖥️ Server Requirements

To ensure smooth operation, the production server must meet the following minimum requirements:

### PHP & Extensions
- **PHP Version:** `^8.2` or higher (PHP 8.3 recommended)
- **Required Extensions:**
  - `BCMath`
  - `Ctype`
  - `Fileinfo`
  - `JSON`
  - `Mbstring`
  - `OpenSSL`
  - `PDO`
  - `Tokenizer`
  - `XML`
  - `cURL`
  - Database Driver: `pdo_sqlite` (if using SQLite) or `pdo_mysql` (if using MySQL/MariaDB)
  - Memory Cache: `Redis` extension (optional but highly recommended for Reverb scaling and caching)

### Node.js & NPM
- **Node.js:** v18.0 or higher (v20+ LTS recommended)
- **NPM:** v9 or higher (to build the React/Vite frontend assets)

### Web Server
- **Nginx** (preferred) or Apache
- Must support reverse proxying WebSocket connections (`Upgrade` headers) to the Reverb port.

---

## ⚙️ Process Management (Daemons)

The application relies on persistent background processes that must be kept alive indefinitely. A process monitor like **Supervisor** (or **PM2**) is **mandatory** for production.

### 1. Laravel Reverb (WebSockets)
**Command:** `php artisan reverb:start --host="0.0.0.0" --port=8080`
- **Why it's mandatory:** Reverb handles all real-time bidirectional communication. It powers the Kitchen Display System (KDS), Waiter App table updates, and live order status tracking for customers. If this process stops, the real-time functionality of the POS and kitchen screens will fail.
- **Reverse Proxy:** Nginx must be configured to proxy WebSocket requests (e.g., `/ws` or port 8080) to the internal Reverb daemon.

### 2. Laravel Queue Worker
**Command:** `php artisan queue:work --sleep=3 --tries=3`
- **Why it's mandatory:** It processes background jobs asynchronously. For this project, it is essential for sending webhooks, processing Mercado Pago callbacks, triggering emails, or communicating with external APIs (like iFood) without blocking the HTTP request.

---

## 🔒 Environment Variables

Before launching, the `.env` file must be meticulously configured. The following variables are critical for a secure and functional production environment:

### Application & Environment
```dotenv
APP_NAME="Pedido Feito"
APP_ENV=production
APP_KEY="base64:..." # Must be generated using `php artisan key:generate`
APP_DEBUG=false      # CRITICAL: Must be false to prevent stack trace leaks
APP_URL=https://yourdomain.com
```

### Database
```dotenv
DB_CONNECTION=sqlite # Or mysql / pgsql
# If sqlite: ensure database/database.sqlite exists and has correct permissions
# If mysql: define DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD
```

### Reverb (WebSockets)
```dotenv
REVERB_APP_ID=my-app-id
REVERB_APP_KEY=my-app-key
REVERB_APP_SECRET=my-app-secret
REVERB_HOST="yourdomain.com"
REVERB_PORT=443
REVERB_SCHEME=https

VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
VITE_REVERB_HOST="${REVERB_HOST}"
VITE_REVERB_PORT="${REVERB_PORT}"
VITE_REVERB_SCHEME="${REVERB_SCHEME}"
```

### Mercado Pago Integrations
```dotenv
# Production Keys (Must use APP_USR- prefix, not TEST-)
MERCADOPAGO_PUBLIC_KEY="APP_USR-your-production-public-key"
VITE_MERCADOPAGO_PUBLIC_KEY="${MERCADOPAGO_PUBLIC_KEY}"

# Webhook Secret (Required for HMAC-SHA256 validation to prevent spoofing)
MERCADOPAGO_WEBHOOK_SECRET="your-webhook-secret"
MERCADOPAGO_WEBHOOK_URL="https://yourdomain.com/api/webhooks/mercadopago"
```
*(Note: `MERCADOPAGO_ACCESS_TOKEN` is dynamically loaded from the database settings, but webhook secrets and public keys must be firmly set in the `.env`.)*

---

## 🚀 Build & Cache Commands

During the CI/CD pipeline or manual deployment on the server, execute the following commands exactly in this sequence to ensure the application is optimized and the frontend is compiled.

### 1. Install Dependencies
```bash
composer install --optimize-autoloader --no-dev
npm install
```

### 2. Build Frontend Assets
```bash
npm run build
```
*(This compiles React/Vite assets into the `public/build` directory.)*

### 3. Run Migrations
```bash
php artisan migrate --force
```

### 4. Optimize Laravel Caches
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```
*(Caching drastically improves Laravel's boot time. Note: Once `config:cache` is executed, the `env()` helper will return `null` outside of config files. Ensure all your config files properly map `.env` variables.)*

### 5. Restart Daemons
```bash
# Example if using Supervisor
sudo supervisorctl restart all
```
*(Queue workers must be restarted after code changes, otherwise they will continue running the old code loaded in memory.)*
