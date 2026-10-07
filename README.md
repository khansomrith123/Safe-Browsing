# PayGuard: Payment Safety Guard Chrome Extension (Manifest V3)

[![Manifest V3](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-blue?logo=google-chrome)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Google Safe Browsing](https://img.shields.io/badge/Google%20Safe%20Browsing-API%20v4-4285F4?logo=google)](https://developers.google.com/safe-browsing)
[![TypeScript & React](https://img.shields.io/badge/Studio-React%2019%20%2B%20Tailwind-38bdf8)](https://vitejs.dev/)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-green.svg)](https://opensource.org/licenses/Apache-2.0)

**PayGuard** is an enterprise-grade Google Chrome Extension built on **Manifest V3** that acts as an automated security guard on payment, billing, and checkout pages. It proactively intercepts interactions on checkout flows and validates destinations against the **Google Safe Browsing API (v4)** to protect users against financial phishing scams, fraudulent payment gateways, and malicious checkout malware.

Included in this repository is both the **complete extension codebase** (ready to load unpacked into Chrome) and an **Interactive Development Studio & Sandbox** for testing threat vectors, simulating checkout pages, and 1-click package generation.

---

## Table of Contents

- [Key Features](#key-features)
- [Extension Architecture & Files](#extension-architecture--files)
- [How Threat Detection Works](#how-threat-detection-works)
- [How to Load into Chrome Developer Mode](#how-to-load-into-chrome-developer-mode)
- [Google Safe Browsing API Configuration](#google-safe-browsing-api-configuration)
- [Built-In Test Vectors](#built-in-test-vectors)
- [Interactive Studio & Sandbox](#interactive-studio--sandbox)
- [Local Development Setup](#local-development-setup)
- [Security & Manifest V3 Compliance](#security--manifest-v3-compliance)

---

## Key Features

1. **Intelligent URL & Button Interception (`content.js`)**:
   - Continuously evaluates page URLs for checkout patterns (`/checkout`, `/payment`, `/pay`, `/cart`, `/billing`, `paypal`, `stripe`).
   - Hooks into global click events to detect user engagement with checkout buttons matching terms such as *"Proceed to Checkout"*, *"Pay Now"*, *"Buy with 1-Click"*, and *"View Cart"*.
   - Evaluates target links before navigation occurs or immediately scans the active checkout page.

2. **Google Safe Browsing API Integration (`background.js`)**:
   - Queries Google's official v4 `threatMatches:find` endpoint asynchronously.
   - Detects `MALWARE`, `SOCIAL_ENGINEERING` (Phishing), `UNWANTED_SOFTWARE`, and harmful applications.
   - Built-in 5-minute memory and local storage cache to minimize network latency and respect API rate limits.
   - Works immediately out-of-the-box using official test vectors even before a custom API key is supplied.

3. **Interstitial Warning Overlay**:
   - When a checkout link is flagged as unsafe, injects a prominent, isolated full-screen overlay banner:  
     > **⚠️ WARNING: This checkout page was flagged as unsafe by Google Safe Browsing. Proceed with caution.**
   - Details the specific threat category and flagged destination URL.
   - Provides an immediate safe escape action (`🛡️ Leave Page (Recommended)`) and an explicit override button (`I understand the risks, proceed`).

4. **Temporary "Verified Safe" Floating Badge**:
   - When clean, injects a high-trust floating badge in the bottom right:  
     > **✅ Link Verified Safe** — *Google Safe Browsing*
   - Smoothly auto-dismisses after 3.5 seconds to remain non-intrusive.

5. **Popup Toolbar Interface (`popup.html` & `popup.js`)**:
   - Allows users to paste and inspect any checkout or payment link on demand.
   - Includes 1-click test scenarios (Safe store, Phishing test, Malware test, Current tab check).
   - Allows dynamically setting or updating the Google Safe Browsing API key stored in `chrome.storage.local`.

---

## Extension Architecture & Files

The extension source code is organized cleanly in the `/extension` directory:

```text
extension/
├── manifest.json       # Manifest V3 configuration, permissions, content scripts declaration
├── background.js      # Background Service Worker handling Google Safe Browsing API v4 lookups
├── content.js         # Content Script monitoring URLs & clicks, rendering UI overlays
├── content.css        # Scoped styles for the warning overlay and verified safe badge
├── popup.html         # Chrome Action popup layout for manual checkout checks
├── popup.js           # Logic for manual lookups and chrome.storage key persistence
├── README.md          # Extension quick-reference guide
└── icons/
    ├── icon16.png     # 16x16 toolbar icon
    ├── icon48.png     # 48x48 extensions manager icon
    └── icon128.png    # 128x128 Chrome Web Store icon
```

### File Breakdown

| File | Purpose | Manifest V3 Role |
| :--- | :--- | :--- |
| `manifest.json` | Extension declaration | Manifest V3 schema (`action`, `service_worker`, `host_permissions`) |
| `background.js` | Service Worker | Queries `safebrowsing.googleapis.com`, caches responses, manages alarms |
| `content.js` | Content Script | Runs in web page DOM (`document_end`), listens for button clicks & URL changes |
| `content.css` | Stylesheet | Scoped CSS (`z-index: 2147483647`, isolated from host page styles) |
| `popup.html` | UI Popup | Zero inline scripts (CSP compliant), clean modern dark layout |
| `popup.js` | Popup Controller | Communicates via `chrome.runtime.sendMessage` with service worker |

---

## How Threat Detection Works

When `content.js` triggers a check, it sends a message to `background.js`:

```javascript
chrome.runtime.sendMessage({
  action: "CHECK_PAYMENT_URL",
  url: targetUrl,
  source: "button_click" // or "page_load"
}, (response) => {
  if (!response.isSafe) {
    showWarningOverlay(url, response.threatType);
  } else {
    showSafeBadge();
  }
});
```

`background.js` formats the Google Safe Browsing API v4 JSON payload:

```json
{
  "client": {
    "clientId": "payguard-payment-guard",
    "clientVersion": "1.0.0"
  },
  "threatInfo": {
    "threatTypes": [
      "MALWARE",
      "SOCIAL_ENGINEERING",
      "UNWANTED_SOFTWARE",
      "POTENTIALLY_HARMFUL_APPLICATION"
    ],
    "platformTypes": ["ANY_PLATFORM"],
    "threatEntryTypes": ["URL"],
    "threatEntries": [
      { "url": "https://suspicious-store.example.com/checkout" }
    ]
  }
}
```

- **Threat Matched**: Google returns a `matches` array with threat types. `content.js` renders the warning interstitial.
- **No Threats Found**: Response is clean (`{}`). `content.js` displays the verified safe badge.

---

## How to Load into Chrome Developer Mode

Anyone can install and run PayGuard in Google Chrome in less than 60 seconds without compiling or installing build tools:

### Step 1: Download the Extension Files
- Click **Download Extension (.zip)** in the top-right corner of the web app, **or** download the `/extension` folder from this repo.
- Unzip/extract the package to a folder on your computer (e.g. `Desktop/payguard-extension`). Ensure `manifest.json` is directly inside this folder.

### Step 2: Open Extensions in Google Chrome
- Open Google Chrome.
- In the address bar, type:
  ```text
  chrome://extensions
  ```
  and press **Enter**.

### Step 3: Turn ON Developer Mode
- In the top-right corner of the extensions page, toggle the switch for **Developer mode** to **ON**.

### Step 4: Load the Unpacked Folder
- Click the **Load unpacked** button that appears in the top-left toolbar.
- In the file selection window, select your `payguard-extension` folder (the folder containing `manifest.json`).
- Click **Select Folder** (or **Open**).

### Step 5: Pin and Use
- **PayGuard - Payment Safety Guard** will now appear in your active extensions list.
- Click Chrome's puzzle piece icon (**Extensions**) in the top browser bar and click the **Pin (📌)** icon next to PayGuard.
- Click the shield icon anytime to test checkout URLs!

---

## Google Safe Browsing API Configuration

The extension comes pre-configured with a placeholder `"YOUR_API_KEY"` in `background.js`.

### How to get a free Google Safe Browsing API Key:
1. Visit the [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a Google Cloud project.
3. In the left navigation, go to **APIs & Services → Library**.
4. Search for **Safe Browsing API** and click **Enable**.
5. Go to **APIs & Services → Credentials** and click **Create Credentials → API Key**.
6. Copy your generated API key.

### How to apply your key:
You can use either method:
- **Method A (Zero Code / Popup)**: Click the PayGuard icon in your Chrome toolbar, open the **Google Safe Browsing API Key** accordion, paste your key, and click **Save Key**.
- **Method B (File Edit)**: Open `background.js`, locate `const DEFAULT_API_KEY = "YOUR_API_KEY";`, and replace `"YOUR_API_KEY"` with your key. Then click **Refresh (↻)** on the PayGuard card in `chrome://extensions`.
- **Method C (Web App Auto-Baker)**: Type your API key into the top bar of this web studio and click **Download Extension (.zip)**; the app bakes your key directly into `background.js` automatically!

---

## Built-In Test Vectors

You can test the extension's behavior immediately using Google's official testing domains without needing to trigger a real attack:

| Test Scenario | Test URL | Expected Extension Response |
| :--- | :--- | :--- |
| **Phishing Scam** | `https://testsafebrowsing.appspot.com/s/phishing.html` | ⚠️ Interstitial warning modal (`SOCIAL_ENGINEERING`) |
| **Malware Host** | `http://malware.testing.google.test/testing/malware/` | ⚠️ Interstitial warning modal (`MALWARE`) |
| **Unwanted Software**| `https://testsafebrowsing.appspot.com/s/unwanted.html` | ⚠️ Interstitial warning modal (`UNWANTED_SOFTWARE`) |
| **Legitimate Store** | `https://store.merchline.com/checkout?step=payment` | ✅ Floating badge (*"Link Verified Safe"*) |

---

## Interactive Studio & Sandbox

This repository includes a full-featured web studio built with React 19, Tailwind CSS, and Vite:

- **Live E-Commerce Sandbox**: A simulated checkout page with interactive payment and checkout buttons (*"Proceed to Checkout"*, *"Pay $89.00 Now"*, *"Buy with 1-Click"*, *"View Cart"*).
- **Synchronized Popup Mirror**: Live mirror of `popup.html` and `popup.js` that stays in sync with your sandbox session.
- **Real-Time Message Stream**: Live log showing runtime message passing between `content.js`, `background.js`, and the Safe Browsing API.
- **60-Second Setup Wizard**: An interactive checklist with progress tracking and 1-click copy buttons.
- **In-Browser Code Inspector**: View, copy, or download any individual source file.
- **1-Click Dynamic ZIP Generator**: Packages all extension files and valid icons into a ready-to-load ZIP file using `jszip`.

---

## Local Development Setup

To run the interactive web studio and simulator locally:

```bash
# 1. Clone this repository
git clone https://github.com/your-username/payguard-chrome-extension.git
cd payguard-chrome-extension

# 2. Install dependencies
npm install

# 3. Start the Vite development server
npm run dev

# 4. Open in browser
# Navigate to http://localhost:3000
```

To build for production:

```bash
npm run build
```

To regenerate the extension icons:

```bash
node scripts/generate-icons.js
```

---

## Security & Manifest V3 Compliance

PayGuard strictly follows Google's Manifest V3 security requirements:

- **No Remote Code Execution**: No `eval()`, `new Function()`, or remotely hosted code. All JavaScript runs locally from within the extension package.
- **Service Worker Architecture**: Uses standard `service_worker` in `background.js` with declarative lifecycle management.
- **Content Security Policy (CSP)**: `popup.html` contains no inline scripts; all logic is cleanly decoupled in `popup.js`.
- **Principle of Least Privilege**:
  - `storage`: Required for local threat caching and saving user preferences.
  - `activeTab`: Used to inspect the current checkout tab upon user popup interaction.
  - `host_permissions`: Scoped strictly to `https://safebrowsing.googleapis.com/*` and web pages being checked.
- **Style Isolation**: All injected content DOM elements use isolated CSS styles with specific class prefixes (`payguard-*`) and `all: initial` fallbacks to avoid conflicts with host page stylesheets.

---

## License

Apache-2.0 License. Open source and free for commercial and personal security use.
