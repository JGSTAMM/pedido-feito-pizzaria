# 🌐 Ngrok Demo Guide — Lucchese Pizza System

> **Audience:** Developer running the demo from a local notebook (8 GB RAM).
> **Goal:** Expose the app to a client over the internet using Ngrok Free Tier.
> **Last updated:** 2026-06-25

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Phase 1 — Freeing Up RAM (Crucial)](#phase-1--freeing-up-ram-crucial)
3. [Phase 2 — Starting Local Services](#phase-2--starting-local-services)
4. [Phase 3 — Starting Ngrok](#phase-3--starting-ngrok)
5. [Phase 4 — Connecting the Dots (.env)](#phase-4--connecting-the-dots-env)
6. [Phase 5 — The Real-Time Disclaimer (Reverb / WebSockets)](#phase-5--the-real-time-disclaimer-reverb--websockets)
7. [Quick Reference — Terminal Layout](#quick-reference--terminal-layout)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, make sure you have:

| Requirement | Check |
|---|---|
| **PHP ≥ 8.2** with required extensions | `php -v` |
| **Composer** installed | `composer --version` |
| **Node.js ≥ 18** and npm | `node -v && npm -v` |
| **MySQL** running with the `lucchese_pizza` database | Access via `mysql -u root -p` |
| **Ngrok** installed and authenticated | `ngrok version` |
| All Composer dependencies installed | `composer install` |
| All npm dependencies installed | `npm install` |

> [!IMPORTANT]
> If you haven't installed Ngrok yet, download it from [https://ngrok.com/download](https://ngrok.com/download), unzip it, and run `ngrok config add-authtoken YOUR_TOKEN` with your free-tier auth token.

---

## Phase 1 — Freeing Up RAM (Crucial)

**Why this matters:** The Vite dev server (`npm run dev`) keeps a Node.js process running that consumes **~400–800 MB of RAM** for Hot Module Replacement (HMR). On an 8 GB machine already running PHP, MySQL, and Reverb, this causes the system to freeze and swap heavily. **We eliminate this entirely by pre-building the assets.**

### Step 1.1 — Stop the Vite Dev Server

If `npm run dev` is currently running in any terminal, **stop it now** with `Ctrl + C`.

```powershell
# If you see a terminal running Vite — press Ctrl+C to stop it.
# You will NOT need npm run dev again for the entire demo.
```

> [!CAUTION]
> **Do NOT run `npm run dev` at any point during the demo.** It will eat your RAM and the notebook will freeze. The pre-built assets are all you need.

### Step 1.2 — Build the Production Assets (Once)

Run the build command **once**. This compiles all React/JSX, Tailwind CSS, and JavaScript into optimized static files inside `public/build/`.

```powershell
npm run build
```

**Expected output (summary):**

```
vite v7.x.x building for production...
✓ 123 modules transformed.
public/build/manifest.json             0.xx kB
public/build/assets/app-XXXXXXXX.css   xx.xx kB
public/build/assets/app-XXXXXXXX.js    xxx.xx kB
...
✓ built in X.XXs
```

> [!TIP]
> After the build finishes, the Node.js process exits completely — **zero ongoing RAM usage** from the frontend toolchain. Laravel will automatically serve the compiled assets from `public/build/` using the manifest.

### Step 1.3 — Verify the Build Exists

```powershell
# You should see the manifest file and asset chunks:
dir public\build
```

You should see files like:
- `manifest.json`
- `assets/` folder with `.js` and `.css` files

If you see these files, you're ready. **Close any terminal that was running `npm run dev`.**

---

## Phase 2 — Starting Local Services

You need **3 terminal windows** open simultaneously. Keep them all visible (tile them or use Windows Terminal tabs).

### Terminal 1 — Laravel HTTP Server (Port 8000)

```powershell
php artisan serve
```

**Expected output:**

```
INFO  Server running on [http://127.0.0.1:8000].
Press Ctrl+C to stop the server.
```

> [!NOTE]
> This is the main web server. Ngrok will tunnel to this port.

---

### Terminal 2 — Laravel Reverb WebSocket Server (Port 8080)

```powershell
php artisan reverb:start
```

**Expected output:**

```
INFO  Starting server on 0.0.0.0:8080 (localhost)
```

> [!NOTE]
> Reverb handles real-time WebSocket connections (order status updates, kitchen notifications). It runs on port 8080 and is **separate** from the HTTP server on port 8000. See [Phase 5](#phase-5--the-real-time-disclaimer-reverb--websockets) for the Ngrok limitation.

---

### Terminal 3 — Laravel Queue Worker

```powershell
php artisan queue:work
```

**Expected output:**

```
INFO  Processing jobs from the [default] queue.
```

> [!NOTE]
> The queue worker processes background jobs like sending order notifications and broadcasting events to Reverb. Without it, real-time events won't fire even locally.

---

### ✅ Phase 2 Checklist

| Terminal | Command | Port | Status |
|---|---|---|---|
| 1 | `php artisan serve` | 8000 | Running |
| 2 | `php artisan reverb:start` | 8080 | Running |
| 3 | `php artisan queue:work` | — | Processing |

**Do not close any of these terminals during the demo.**

---

## Phase 3 — Starting Ngrok

### Terminal 4 — Ngrok Tunnel

Open a **4th terminal** and run:

```powershell
ngrok http 8000
```

**Expected output (Ngrok Free Tier):**

```
Session Status                online
Account                       your-email@example.com (Plan: Free)
Version                       3.x.x
Region                        South America (sa)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://xxxx-xxxx-xxxx.ngrok-free.app -> http://localhost:8000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

### 🎯 Copy the Forwarding URL

Look for the line that says `Forwarding` and copy the **HTTPS URL**:

```
https://xxxx-xxxx-xxxx.ngrok-free.app
```

> [!IMPORTANT]
> **Copy this URL now** — you will need it in the next phase. The URL changes every time you restart Ngrok (free tier has no static domains).

### Ngrok Web Inspector

Ngrok also starts a local web inspector at `http://127.0.0.1:4040`. Open it in your browser to:
- See all HTTP requests flowing through the tunnel
- Inspect request/response headers and bodies
- Replay requests for debugging

---

## Phase 4 — Connecting the Dots (.env)

Now you need to tell Laravel that the app is being accessed through the Ngrok URL instead of `localhost:8000`.

### Step 4.1 — Update the `.env` File

Open the `.env` file in the project root and update **exactly these 2 lines**:

```dotenv
# BEFORE (local development):
APP_URL=http://localhost:8000
ASSET_URL=http://localhost:8000

# AFTER (Ngrok demo — replace with YOUR actual Ngrok URL):
APP_URL=https://xxxx-xxxx-xxxx.ngrok-free.app
ASSET_URL=https://xxxx-xxxx-xxxx.ngrok-free.app
```

> [!WARNING]
> Replace `xxxx-xxxx-xxxx` with the **actual subdomain** from your Ngrok output. Do NOT include a trailing slash.

### Step 4.2 — Clear All Laravel Caches

After editing `.env`, you **must** clear all cached configuration. Run this in any available terminal (or open a 5th one):

```powershell
php artisan optimize:clear
```

**Expected output:**

```
INFO  Clearing cached bootstrap files.

   events ........... DONE
   views ............ DONE
   cache ............ DONE
   route ............ DONE
   config ........... DONE
   compiled ......... DONE
```

> [!TIP]
> If you ever restart Ngrok and get a **new URL**, you must repeat Steps 4.1 and 4.2 with the new URL.

### Step 4.3 — Verify It Works

1. Open the Ngrok URL in your browser: `https://xxxx-xxxx-xxxx.ngrok-free.app`
2. You will see an **Ngrok interstitial page** saying "You are about to visit..." — click **"Visit Site"**
3. The Lucchese Pizza System should load with all styles and assets working correctly

> [!NOTE]
> The Ngrok Free Tier interstitial page only appears **once per session** for each visitor. After clicking "Visit Site", the client won't see it again until they close and reopen the browser.

---

## Phase 5 — The Real-Time Disclaimer (Reverb / WebSockets)

### ⚠️ The Limitation

**Ngrok Free Tier only allows 1 tunnel at a time.**

Your current setup has **two** services that need internet exposure:

| Service | Port | Protocol | Ngrok Tunnel? |
|---|---|---|---|
| Laravel HTTP Server | 8000 | HTTP/HTTPS | ✅ **YES** (the tunnel you created) |
| Laravel Reverb (WebSockets) | 8080 | WS/WSS | ❌ **NO** (no second tunnel available) |

This means:

- ✅ **Locally on your notebook**: Everything works perfectly — the browser connects to Reverb at `localhost:8080` and receives real-time order status updates, kitchen notifications, etc.
- ❌ **For the client viewing via Ngrok**: The browser will try to connect to Reverb at `localhost:8080` but **that points to their own machine** (where Reverb is not running). WebSocket connections will silently fail.

### What the Client Will Experience

| Feature | Works via Ngrok? | Notes |
|---|---|---|
| Browsing the digital menu | ✅ Yes | Fully functional |
| Adding items to cart | ✅ Yes | Fully functional |
| Placing an order (checkout) | ✅ Yes | Fully functional |
| Making a payment (Mercado Pago) | ✅ Yes | Sandbox mode works |
| **Real-time order status updates** | ❌ No | Client must **refresh the page** to see changes |
| **Kitchen live notifications** | ❌ No | Only works on your local notebook |

### How to Handle This During the Demo

**Recommended approach for the presentation:**

1. **Show the client the complete checkout flow** via the Ngrok URL — this works perfectly end-to-end
2. **For the real-time features**, switch to sharing your screen (via Google Meet, Zoom, etc.) and demonstrate locally at `http://localhost:8000`:
   - Place an order on the customer menu
   - Switch to the admin/kitchen panel and show the order appearing in real-time
   - Update the order status and show it reflecting instantly on the customer side
3. **Tell the client:** *"Real-time updates use WebSockets which require a dedicated server connection. In the production deployment, this will work seamlessly for all users. For this demo, I'll show the real-time features from my machine directly."*

### Alternative: The Client Can Manually Refresh

If the client is browsing the Ngrok URL and places an order, they can simply **refresh the page** (F5) to see updated order statuses. The data is correct in the database — only the instant push notification is missing.

---

## Quick Reference — Terminal Layout

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR NOTEBOOK (8 GB RAM)                  │
│                                                             │
│  ┌──────────────────────┐  ┌──────────────────────────┐     │
│  │ Terminal 1            │  │ Terminal 2                │     │
│  │ php artisan serve     │  │ php artisan reverb:start  │     │
│  │ → Port 8000           │  │ → Port 8080               │     │
│  └──────────────────────┘  └──────────────────────────┘     │
│                                                             │
│  ┌──────────────────────┐  ┌──────────────────────────┐     │
│  │ Terminal 3            │  │ Terminal 4                │     │
│  │ php artisan queue:work│  │ ngrok http 8000           │     │
│  │ → Background jobs     │  │ → Tunnel to internet      │     │
│  └──────────────────────┘  └──────────────────────────┘     │
│                                                             │
│  .env → APP_URL = https://xxxx.ngrok-free.app               │
│  Built assets in → public/build/ (no Vite running!)         │
│                                                             │
│  RAM usage: ~300-500 MB total (vs 1.2+ GB with Vite)        │
└─────────────────────────────────────────────────────────────┘
```

---

## Troubleshooting

### ❌ "Page loads but no styles/JS"

**Cause:** Assets not built or `ASSET_URL` not updated.

```powershell
# Rebuild assets:
npm run build

# Verify .env has:
# ASSET_URL=https://xxxx-xxxx-xxxx.ngrok-free.app

# Then clear caches:
php artisan optimize:clear
```

---

### ❌ "502 Bad Gateway" from Ngrok

**Cause:** `php artisan serve` is not running on port 8000.

```powershell
# Make sure Terminal 1 is running:
php artisan serve
```

---

### ❌ "ERR_NGROK_3200" or "Tunnel session not found"

**Cause:** Ngrok auth token expired or not configured.

```powershell
ngrok config add-authtoken YOUR_AUTH_TOKEN
ngrok http 8000
```

---

### ❌ Notebook freezing during demo

**Cause:** `npm run dev` is running somewhere. Find and kill it:

```powershell
# Find any Node.js processes:
tasklist | findstr "node"

# Kill them:
taskkill /f /im node.exe
```

Then ensure you're only running the 4 terminals from this guide.

---

### ❌ "CSRF token mismatch" errors

**Cause:** Domain mismatch between `APP_URL` and the actual Ngrok URL.

```powershell
# Verify .env APP_URL matches exactly the Ngrok forwarding URL
# Then:
php artisan optimize:clear
```

---

### ❌ Orders not appearing in kitchen panel (via Ngrok)

**Cause:** This is the expected WebSocket limitation (see [Phase 5](#phase-5--the-real-time-disclaimer-reverb--websockets)). The queue worker must also be running:

```powershell
# Verify Terminal 3 is running:
php artisan queue:work
```

If viewing locally, orders should appear in real-time. If viewing via Ngrok, refresh the page.

---

### ❌ New Ngrok URL after restart

Every time you restart Ngrok, you get a new URL. Repeat:

1. Copy the new `https://xxxx.ngrok-free.app` URL
2. Update `APP_URL` and `ASSET_URL` in `.env`
3. Run `php artisan optimize:clear`

---

## 🏁 Post-Demo: Restoring Local Development

When the demo is done and you want to go back to normal development:

```powershell
# 1. Stop Ngrok (Ctrl+C in Terminal 4)

# 2. Restore .env to local values:
#    APP_URL=http://localhost:8000
#    ASSET_URL=http://localhost:8000

# 3. Clear caches:
php artisan optimize:clear

# 4. Start Vite dev server again (for hot reload during development):
npm run dev
```

---

> **Remember:** The core value proposition (menu browsing, cart, checkout, payment) works **flawlessly** through Ngrok. The only limitation is real-time push updates — and that's easily demonstrated via screen sharing from your local machine.
