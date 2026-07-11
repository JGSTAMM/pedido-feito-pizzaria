# 🔐 Ngrok Authtoken Recovery Guide (ERR_NGROK_107)

> **Incident:** Active Ngrok Authtoken leaked in a screenshot / Invalid Authtoken detected.
> **Status:** Critical (Security Reset Required)

This guide walks you through invalidating the compromised Ngrok authtoken, generating a new one, and updating your local environment configuration to resolve the `ERR_NGROK_107` error.

---

## 🛠️ Step-by-Step Recovery Plan

### Step 1: Security Reset
Because your authtoken was exposed, it must be invalidated immediately to prevent unauthorized access to your local machine.

1. Open your browser and navigate to the Ngrok Dashboard:
   👉 **[Ngrok Authtoken Dashboard](https://dashboard.ngrok.com/get-started/your-authtoken)**
2. Locate the **Reset Token** button on the page.
3. Click **Reset Token** and confirm the prompt. This instantly invalidates the leaked token globally.

---

### Step 2: Copy the New Token
Once reset, the dashboard will display your brand new token.

1. Click the **Copy** icon next to the new token.
2. The token will look similar to: `2kFHZ...` (a long alphanumeric string).

---

### Step 3: Overwrite Local Config
You do not need to manually edit configuration files. Ngrok provides a CLI command to automatically replace your local authtoken.

1. Open a terminal in VS Code.
2. Run the following command (replace `YOUR_NEW_TOKEN` with the token you copied in Step 2):

```powershell
ngrok config add-authtoken YOUR_NEW_TOKEN
```

**Expected output:**
```text
Authtoken saved to configuration file: C:\Users\Admin\AppData\Local\ngrok\ngrok.yml
```

> [!NOTE]
> This command will safely overwrite your old, invalidated token in the default Ngrok configuration file.

---

### Step 4: Start the Tunnel
Now that your local configuration has been updated with the new valid token, restart the tunnel.

1. In your terminal, execute:

```powershell
ngrok http 8000
```

2. Confirm that the tunnel status changes to `online` and you are presented with a new `Forwarding` URL.

---

## 🔍 Verification Checklist

- [ ] Old token invalidated in Ngrok Dashboard
- [ ] New token successfully applied via CLI command
- [ ] Tunnel starts successfully on port 8000 without errors
- [ ] New forwarding URL copied to `.env` (as detailed in [NGROK-DEMO-GUIDE.md](file:///c:/Users/Admin/Desktop/PROJETOS/Pedido-Feito%202.0/docs/NGROK-DEMO-GUIDE.md))
- [ ] Run `php artisan optimize:clear` to apply the updated environment config
