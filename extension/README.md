# PayGuard: Manifest V3 Payment Safety Guard Chrome Extension

An enterprise-grade Chrome Extension built with Manifest V3 to guard users on checkout and payment pages by proactively validating URLs against the Google Safe Browsing API.

## Features
- **URL & Button Interception**: `content.js` monitors page URLs and click events on buttons containing checkout-related terms (`checkout`, `pay`, `buy`, `cart`, `order`).
- **Threat Detection**: `background.js` queries Google Safe Browsing API v4 (`threatMatches:find`) for `MALWARE`, `SOCIAL_ENGINEERING`, and `UNWANTED_SOFTWARE`.
- **Interstitial Warning Modal**: Renders a warning overlay banner on dangerous checkout pages:
  `⚠️ WARNING: This checkout page was flagged as unsafe by Google Safe Browsing. Proceed with caution.`
- **Verified Safe Badge**: Shows a clean auto-dismissing `✅ Link Verified Safe` badge on clean checkouts.
- **Popup Interface**: Manual URL inspector, test presets, and dynamic API key storage in `chrome.storage.local`.

## Quick Setup in Chrome Developer Mode
1. Open Google Chrome and go to `chrome://extensions` in the address bar.
2. Turn ON **Developer mode** toggle in the top-right corner.
3. Click **Load unpacked** in the top-left toolbar.
4. Select this directory containing `manifest.json`.
5. (Optional) Open `background.js` and replace `"YOUR_API_KEY"` with your Google Cloud API key, or click the extension icon and enter it in Settings.
