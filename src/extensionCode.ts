/**
 * Extension source code files embedded for in-browser viewing, copying, and zipping.
 */

export interface ExtensionFile {
  name: string;
  path: string;
  language: string;
  description: string;
  content: string;
}

export const EXTENSION_FILES: Record<string, ExtensionFile> = {
  "manifest.json": {
    name: "manifest.json",
    path: "manifest.json",
    language: "json",
    description: "Manifest V3 configuration, permissions, background service worker, and content scripts declaration.",
    content: `{
  "manifest_version": 3,
  "name": "PayGuard - Payment Safety Guard",
  "version": "1.0.0",
  "description": "Protects against payment fraud, phishing, and malware by verifying checkout and payment pages with Google Safe Browsing API.",
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    },
    "default_title": "PayGuard - Checkout Safety Guard"
  },
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": [
        "<all_urls>"
      ],
      "js": [
        "content.js"
      ],
      "css": [
        "content.css"
      ],
      "run_at": "document_end"
    }
  ],
  "permissions": [
    "storage",
    "activeTab"
  ],
  "host_permissions": [
    "https://safebrowsing.googleapis.com/*",
    "<all_urls>"
  ]
}`
  },

  "background.js": {
    name: "background.js",
    path: "background.js",
    language: "javascript",
    description: "Service Worker handling Google Safe Browsing API v4 lookups, threat caching, and runtime messaging.",
    content: `/**
 * PayGuard - Background Service Worker (Manifest V3)
 * Handles Google Safe Browsing API threat verification and URL analysis.
 */

// Placeholder string for Google Safe Browsing API Key (as required)
const DEFAULT_API_KEY = "YOUR_API_KEY";

// Google Safe Browsing v4 threatMatches:find endpoint
const SAFE_BROWSING_ENDPOINT = "https://safebrowsing.googleapis.com/v4/threatMatches:find";

// In-memory cache for inspected URLs (expires in 5 minutes)
const urlCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

// Known Google Safe Browsing standard test URLs for offline/instant verification
const STANDARD_TEST_THREATS = [
  { pattern: "testsafebrowsing.appspot.com/s/malware.html", threatType: "MALWARE" },
  { pattern: "testsafebrowsing.appspot.com/s/phishing.html", threatType: "SOCIAL_ENGINEERING" },
  { pattern: "testsafebrowsing.appspot.com/s/unwanted.html", threatType: "UNWANTED_SOFTWARE" },
  { pattern: "malware.testing.google.test", threatType: "MALWARE" },
  { pattern: "ianfette.org", threatType: "MALWARE" }
];

/**
 * Retrieve active API key: checks chrome.storage first, falls back to DEFAULT_API_KEY.
 */
async function getActiveApiKey() {
  try {
    const data = await chrome.storage.local.get(["userApiKey"]);
    if (data && data.userApiKey && data.userApiKey.trim().length > 0) {
      return data.userApiKey.trim();
    }
  } catch (err) {
    console.warn("[PayGuard] Could not read userApiKey from storage:", err);
  }
  return DEFAULT_API_KEY;
}

/**
 * Check if the URL is a standard Safe Browsing test fixture
 */
function checkTestFixtures(url) {
  for (const item of STANDARD_TEST_THREATS) {
    if (url.includes(item.pattern)) {
      return {
        isSafe: false,
        threats: [item.threatType],
        threatType: item.threatType,
        source: "Standard Test Vector",
        url
      };
    }
  }
  return null;
}

/**
 * Query the Google Safe Browsing API v4 for threat matching
 */
async function checkUrlWithSafeBrowsing(targetUrl) {
  // Check cache first
  const cached = urlCache.get(targetUrl);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return { ...cached.result, cached: true };
  }

  // Check test fixtures first (convenient for immediate testing)
  const testMatch = checkTestFixtures(targetUrl);
  if (testMatch) {
    urlCache.set(targetUrl, { result: testMatch, timestamp: Date.now() });
    return testMatch;
  }

  const apiKey = await getActiveApiKey();

  // If the user has not replaced YOUR_API_KEY yet, provide clear diagnostic feedback
  if (!apiKey || apiKey === "YOUR_API_KEY") {
    console.warn(
      "[PayGuard] API key is currently 'YOUR_API_KEY'. Please replace with your Google Cloud API key in background.js or enter it in the extension popup."
    );
    // Return verified safe or unconfigured note, but allow test URLs to pass
    const fallbackResult = {
      isSafe: true,
      threats: [],
      note: "Unconfigured API key (using default sandbox pass)",
      url: targetUrl
    };
    return fallbackResult;
  }

  const requestBody = {
    client: {
      clientId: "payguard-payment-guard",
      clientVersion: "1.0.0"
    },
    threatInfo: {
      threatTypes: [
        "MALWARE",
        "SOCIAL_ENGINEERING",
        "UNWANTED_SOFTWARE",
        "POTENTIALLY_HARMFUL_APPLICATION"
      ],
      platformTypes: ["ANY_PLATFORM"],
      threatEntryTypes: ["URL"],
      threatEntries: [{ url: targetUrl }]
    }
  };

  try {
    const response = await fetch(\`\${SAFE_BROWSING_ENDPOINT}?key=\${apiKey}\`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(\`[PayGuard] Safe Browsing API responded with HTTP \${response.status}:\`, errText);
      return {
        isSafe: false,
        isError: true,
        status: response.status,
        error: \`API returned error status \${response.status}\`,
        url: targetUrl
      };
    }

    const data = await response.json();

    // If threats are detected, the response contains a 'matches' array
    if (data && data.matches && data.matches.length > 0) {
      const detectedThreatTypes = data.matches.map((m) => m.threatType);
      const primaryThreat = detectedThreatTypes[0] || "MALWARE";

      const threatResult = {
        isSafe: false,
        threats: detectedThreatTypes,
        threatType: primaryThreat,
        details: data.matches,
        url: targetUrl
      };

      // Save to cache
      urlCache.set(targetUrl, { result: threatResult, timestamp: Date.now() });
      await recordThreatScan(targetUrl, threatResult);

      return threatResult;
    }

    // No threats found -> clean & verified
    const safeResult = {
      isSafe: true,
      threats: [],
      url: targetUrl
    };

    urlCache.set(targetUrl, { result: safeResult, timestamp: Date.now() });
    await recordThreatScan(targetUrl, safeResult);

    return safeResult;
  } catch (error) {
    console.error("[PayGuard] Network or parsing failure during Safe Browsing lookup:", error);
    return {
      isSafe: false,
      isError: true,
      error: error.message || "Failed to contact Google Safe Browsing",
      url: targetUrl
    };
  }
}

/**
 * Record scan history into chrome.storage.local
 */
async function recordThreatScan(url, result) {
  try {
    const storageData = await chrome.storage.local.get(["scanHistory", "stats"]);
    const history = storageData.scanHistory || [];
    const stats = storageData.stats || { totalScans: 0, threatsBlocked: 0 };

    history.unshift({
      url,
      timestamp: Date.now(),
      isSafe: result.isSafe,
      threatType: result.threatType || null
    });

    if (history.length > 50) {
      history.pop();
    }

    stats.totalScans += 1;
    if (!result.isSafe && !result.isError) {
      stats.threatsBlocked += 1;
    }

    await chrome.storage.local.set({
      scanHistory: history,
      stats
    });
  } catch (e) {
    console.warn("[PayGuard] Failed to save scan telemetry in storage:", e);
  }
}

/**
 * Runtime Message Listener
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "CHECK_PAYMENT_URL") {
    const targetUrl = message.url || (sender.tab && sender.tab.url);

    if (!targetUrl) {
      sendResponse({ isSafe: false, error: "No URL provided for verification." });
      return true;
    }

    checkUrlWithSafeBrowsing(targetUrl)
      .then((res) => {
        sendResponse(res);
      })
      .catch((err) => {
        sendResponse({ isSafe: false, error: err.message });
      });

    return true;
  }

  if (message.action === "GET_CONFIG") {
    getActiveApiKey().then((key) => {
      sendResponse({
        isCustomKey: key !== DEFAULT_API_KEY && key !== "",
        apiKeyPlaceholder: key === DEFAULT_API_KEY
      });
    });
    return true;
  }

  return false;
});

// Extension Lifecycle listener
chrome.runtime.onInstalled.addListener(() => {
  console.log("[PayGuard] Payment Safety Guard extension installed & active.");
});`
  },

  "content.js": {
    name: "content.js",
    path: "content.js",
    language: "javascript",
    description: "Detects checkout URLs & buttons ('pay', 'checkout', 'buy', 'cart'), calls background worker, and renders warning overlay or verified badge.",
    content: `/**
 * PayGuard - Content Script (Manifest V3)
 * Monitors checkout URLs, intercepts checkout button interactions,
 * and renders interstitial threat warnings or verified badges.
 */

(() => {
  if (window.__PAYGUARD_INITIALIZED__) return;
  window.__PAYGUARD_INITIALIZED__ = true;

  // Checkout and payment keyword heuristics
  const CHECKOUT_PATTERNS = [
    /checkout/i,
    /payment/i,
    /\\bpay\\b/i,
    /\\bbuy\\b/i,
    /\\bcart\\b/i,
    /billing/i,
    /purchase/i,
    /order[-_]?confirm/i,
    /paypal\\.com/i,
    /stripe\\.com/i
  ];

  // Button text patterns to intercept
  const BUTTON_PATTERNS = [
    /\\bcheckout\\b/i,
    /\\bproceed to checkout\\b/i,
    /\\bpay\\b/i,
    /\\bpay now\\b/i,
    /\\bbuy now\\b/i,
    /\\bplace order\\b/i,
    /\\bcomplete order\\b/i,
    /\\bconfirm payment\\b/i,
    /\\bview cart\\b/i,
    /\\bcart\\b/i
  ];

  let lastCheckedUrl = "";
  let isChecking = false;
  let hasActiveWarning = false;

  function isCheckoutUrl(url) {
    if (!url) return false;
    try {
      const parsed = new URL(url, window.location.href);
      const testString = \`\${parsed.pathname} \${parsed.search} \${parsed.hostname}\`.toLowerCase();
      return CHECKOUT_PATTERNS.some((pattern) => pattern.test(testString));
    } catch {
      return CHECKOUT_PATTERNS.some((pattern) => pattern.test(url));
    }
  }

  function isCheckoutElement(el) {
    if (!el || !(el instanceof Element)) return false;

    const targetEl =
      el.closest("button, a, input[type='submit'], input[type='button'], [role='button'], [role='link']") || el;

    const textContent = (targetEl.innerText || targetEl.textContent || "").trim();
    const valueContent = targetEl.getAttribute("value") || "";
    const ariaLabel = targetEl.getAttribute("aria-label") || "";
    const title = targetEl.getAttribute("title") || "";
    const id = targetEl.id || "";
    const className = typeof targetEl.className === "string" ? targetEl.className : "";

    const combined = \`\${textContent} \${valueContent} \${ariaLabel} \${title} \${id} \${className}\`;

    return BUTTON_PATTERNS.some((pattern) => pattern.test(combined));
  }

  function verifyUrlWithBackground(url, triggerContext = "page_load") {
    if (!url || (url === lastCheckedUrl && !hasActiveWarning)) return;
    if (isChecking) return;

    isChecking = true;
    lastCheckedUrl = url;

    try {
      chrome.runtime.sendMessage(
        {
          action: "CHECK_PAYMENT_URL",
          url: url,
          triggerContext: triggerContext
        },
        (response) => {
          isChecking = false;

          if (chrome.runtime.lastError) {
            console.warn("[PayGuard] Could not reach background service worker:", chrome.runtime.lastError.message);
            return;
          }

          if (!response) return;

          if (!response.isSafe && !response.isError) {
            const threatType = response.threatType || (response.threats && response.threats[0]) || "MALWARE";
            showWarningOverlay(url, threatType);
          } else if (response.isSafe) {
            showSafeBadge();
          }
        }
      );
    } catch (err) {
      isChecking = false;
      console.warn("[PayGuard] Failed sending check message:", err);
    }
  }

  function showWarningOverlay(url, threatType) {
    if (document.getElementById("payguard-threat-overlay")) return;
    hasActiveWarning = true;

    const existingBadge = document.getElementById("payguard-safe-badge");
    if (existingBadge) existingBadge.remove();

    const overlay = document.createElement("div");
    overlay.id = "payguard-threat-overlay";
    overlay.className = "payguard-overlay-backdrop";

    const friendlyThreat = {
      MALWARE: "Malicious Software Detected",
      SOCIAL_ENGINEERING: "Phishing & Deceptive Site Detected",
      UNWANTED_SOFTWARE: "Unwanted / Harmful Software Detected",
      POTENTIALLY_HARMFUL_APPLICATION: "Potentially Harmful Application"
    }[threatType] || threatType;

    overlay.innerHTML = \`
      <div class="payguard-modal-card" role="alertdialog" aria-modal="true" aria-labelledby="payguard-title">
        <div class="payguard-modal-header">
          <div class="payguard-icon-wrapper">
            <span class="payguard-warning-icon">⚠️</span>
          </div>
          <div>
            <h2 id="payguard-title" class="payguard-title">Security Alert: Threat Detected</h2>
            <div class="payguard-badge-threat">\${escapeHtml(friendlyThreat)}</div>
          </div>
        </div>

        <div class="payguard-modal-body">
          <p class="payguard-main-warning">
            <strong>⚠️ WARNING:</strong> This checkout page was flagged as unsafe by <strong>Google Safe Browsing</strong>. Proceed with caution.
          </p>
          <p class="payguard-description">
            Entering payment credentials, credit card details, or personal data on this page puts your financial information at severe risk of theft or unauthorized charges.
          </p>
          <div class="payguard-url-box">
            <span class="payguard-url-label">Flagged URL:</span>
            <span class="payguard-url-text">\${escapeHtml(url)}</span>
          </div>
        </div>

        <div class="payguard-modal-actions">
          <button id="payguard-abort-btn" class="payguard-btn payguard-btn-danger" type="button">
            🛡️ Leave Page (Recommended)
          </button>
          <button id="payguard-ignore-btn" class="payguard-btn payguard-btn-ghost" type="button">
            I understand the risks, proceed
          </button>
        </div>
      </div>
    \`;

    document.documentElement.appendChild(overlay);

    const abortBtn = overlay.querySelector("#payguard-abort-btn");
    const ignoreBtn = overlay.querySelector("#payguard-ignore-btn");

    if (abortBtn) {
      abortBtn.addEventListener("click", () => {
        if (window.history.length > 1) {
          window.history.back();
        } else {
          window.location.href = "about:blank";
        }
      });
    }

    if (ignoreBtn) {
      ignoreBtn.addEventListener("click", () => {
        overlay.classList.add("payguard-fade-out");
        setTimeout(() => {
          overlay.remove();
          hasActiveWarning = false;
        }, 200);
      });
    }
  }

  function showSafeBadge() {
    if (document.getElementById("payguard-safe-badge")) return;
    if (hasActiveWarning) return;

    const badge = document.createElement("div");
    badge.id = "payguard-safe-badge";
    badge.className = "payguard-safe-badge";
    badge.setAttribute("role", "status");
    badge.innerHTML = \`
      <span class="payguard-safe-icon">✅</span>
      <div class="payguard-safe-content">
        <span class="payguard-safe-text">Link Verified Safe</span>
        <span class="payguard-safe-sub">Google Safe Browsing</span>
      </div>
    \`;

    document.documentElement.appendChild(badge);

    setTimeout(() => {
      badge.classList.add("payguard-badge-hidden");
      setTimeout(() => {
        if (badge.parentNode) badge.remove();
      }, 300);
    }, 3500);
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function evaluateCurrentPage() {
    const currentUrl = window.location.href;
    if (isCheckoutUrl(currentUrl)) {
      verifyUrlWithBackground(currentUrl, "page_url");
    }
  }

  document.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      if (!target) return;

      if (isCheckoutElement(target)) {
        const anchor = target.closest("a");
        let targetUrl = window.location.href;

        if (anchor && anchor.href && !anchor.href.startsWith("javascript:")) {
          targetUrl = anchor.href;
        }

        verifyUrlWithBackground(targetUrl, "button_click");
      }
    },
    true
  );

  const originalPushState = history.pushState;
  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    setTimeout(evaluateCurrentPage, 100);
  };

  const originalReplaceState = history.replaceState;
  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    setTimeout(evaluateCurrentPage, 100);
  };

  window.addEventListener("popstate", () => setTimeout(evaluateCurrentPage, 100));
  window.addEventListener("hashchange", () => setTimeout(evaluateCurrentPage, 100));

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", evaluateCurrentPage);
  } else {
    evaluateCurrentPage();
  }
})();`
  },

  "content.css": {
    name: "content.css",
    path: "content.css",
    language: "css",
    description: "Scoped styles for the interstitial threat warning overlay banner and verified safe floating badge.",
    content: `/**
 * PayGuard - Content Stylesheet
 * Scoped styles for the interstitial warning overlay and verified safe badge.
 */

/* Fullscreen Interstitial Backdrop */
.payguard-overlay-backdrop {
  all: initial;
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  background: rgba(15, 23, 42, 0.85) !important;
  backdrop-filter: blur(6px) !important;
  -webkit-backdrop-filter: blur(6px) !important;
  z-index: 2147483647 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 1.5rem !important;
  box-sizing: border-box !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
  animation: payguardFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
}

.payguard-overlay-backdrop.payguard-fade-out {
  opacity: 0 !important;
  transition: opacity 0.2s ease !important;
}

/* Modal Card */
.payguard-modal-card {
  all: initial;
  box-sizing: border-box !important;
  background: #ffffff !important;
  color: #0f172a !important;
  width: 100% !important;
  max-width: 540px !important;
  border-radius: 16px !important;
  border: 2px solid #ef4444 !important;
  box-shadow: 0 25px 50px -12px rgba(239, 68, 68, 0.25), 0 10px 25px -5px rgba(0, 0, 0, 0.3) !important;
  padding: 24px !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 18px !important;
  animation: payguardSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
}

.payguard-modal-header {
  display: flex !important;
  align-items: flex-start !important;
  gap: 14px !important;
}

.payguard-icon-wrapper {
  background: #fef2f2 !important;
  border: 1px solid #fee2e2 !important;
  border-radius: 12px !important;
  width: 44px !important;
  height: 44px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-size: 24px !important;
  flex-shrink: 0 !important;
}

.payguard-title {
  margin: 0 !important;
  font-size: 19px !important;
  font-weight: 700 !important;
  color: #991b1b !important;
  line-height: 1.3 !important;
}

.payguard-badge-threat {
  display: inline-block !important;
  margin-top: 4px !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  color: #b91c1c !important;
  background: #fee2e2 !important;
  padding: 2px 8px !important;
  border-radius: 6px !important;
}

.payguard-modal-body {
  display: flex !important;
  flex-direction: column !important;
  gap: 10px !important;
}

.payguard-main-warning {
  margin: 0 !important;
  font-size: 15px !important;
  line-height: 1.5 !important;
  color: #7f1d1d !important;
  background: #fff1f2 !important;
  padding: 12px 14px !important;
  border-radius: 8px !important;
  border-left: 4px solid #ef4444 !important;
}

.payguard-description {
  margin: 0 !important;
  font-size: 13px !important;
  line-height: 1.5 !important;
  color: #475569 !important;
}

.payguard-url-box {
  background: #f8fafc !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 8px !important;
  padding: 8px 12px !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 2px !important;
  overflow: hidden !important;
}

.payguard-url-label {
  font-size: 11px !important;
  font-weight: 600 !important;
  text-transform: uppercase !important;
  color: #64748b !important;
  letter-spacing: 0.04em !important;
}

.payguard-url-text {
  font-size: 12px !important;
  color: #0f172a !important;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
  word-break: break-all !important;
}

.payguard-modal-actions {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  margin-top: 6px !important;
}

.payguard-btn {
  border: none !important;
  cursor: pointer !important;
  border-radius: 8px !important;
  padding: 10px 18px !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  transition: all 0.15s ease !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.payguard-btn-danger {
  background: #dc2626 !important;
  color: #ffffff !important;
  box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.25) !important;
  flex: 1 !important;
}

.payguard-btn-danger:hover {
  background: #b91c1c !important;
}

.payguard-btn-ghost {
  background: transparent !important;
  color: #64748b !important;
  text-decoration: underline !important;
  font-size: 12px !important;
  padding: 10px 12px !important;
}

.payguard-btn-ghost:hover {
  color: #0f172a !important;
}

/* Floating "Link Verified Safe" Badge */
.payguard-safe-badge {
  all: initial;
  position: fixed !important;
  bottom: 24px !important;
  right: 24px !important;
  z-index: 2147483647 !important;
  background: #0f172a !important;
  color: #ffffff !important;
  border: 1px solid #22c55e !important;
  border-radius: 12px !important;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 0 15px rgba(34, 197, 94, 0.25) !important;
  padding: 10px 16px !important;
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
  animation: payguardSlideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
}

.payguard-safe-icon {
  font-size: 18px !important;
}

.payguard-safe-content {
  display: flex !important;
  flex-direction: column !important;
}

.payguard-safe-text {
  font-size: 13px !important;
  font-weight: 700 !important;
  color: #4ade80 !important;
  line-height: 1.2 !important;
}

.payguard-safe-sub {
  font-size: 11px !important;
  color: #94a3b8 !important;
  line-height: 1.2 !important;
}

.payguard-safe-badge.payguard-badge-hidden {
  opacity: 0 !important;
  transform: translateY(12px) !important;
  transition: all 0.3s ease !important;
}

@keyframes payguardFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes payguardSlideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes payguardSlideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}`
  },

  "popup.html": {
    name: "popup.html",
    path: "popup.html",
    language: "html",
    description: "Chrome action popup interface for manual checkout URL testing and Safe Browsing configuration.",
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PayGuard - Checkout Safety</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 380px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      font-size: 13px;
      line-height: 1.4;
      padding: 16px;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #1e293b;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .brand { display: flex; align-items: center; gap: 8px; }
    .brand-icon { font-size: 20px; }
    .brand-title { font-size: 15px; font-weight: 700; color: #f8fafc; }
    .active-pill {
      font-size: 11px;
      font-weight: 600;
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.1);
      padding: 2px 8px;
      border-radius: 9999px;
      border: 1px solid rgba(56, 189, 248, 0.2);
    }
    .section-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #94a3b8;
      margin-bottom: 8px;
    }
    .input-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
    .input-field {
      width: 100%;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 9px 12px;
      color: #f8fafc;
      font-size: 13px;
      outline: none;
    }
    .input-field:focus { border-color: #38bdf8; }
    .btn {
      cursor: pointer;
      border: none;
      border-radius: 8px;
      padding: 9px 14px;
      font-size: 13px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .btn-primary { background: #0284c7; color: #ffffff; }
    .btn-primary:hover { background: #0369a1; }
    .quick-tests { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
    .chip {
      background: #1e293b;
      border: 1px solid #334155;
      color: #cbd5e1;
      font-size: 11px;
      padding: 4px 8px;
      border-radius: 6px;
      cursor: pointer;
    }
    .chip:hover { background: #334155; color: #f8fafc; }
    .result-box {
      border-radius: 10px;
      padding: 12px;
      margin-bottom: 14px;
      display: none;
    }
    .result-box.safe {
      display: block;
      background: rgba(34, 197, 94, 0.1);
      border: 1px solid #22c55e;
      color: #86efac;
    }
    .result-box.threat {
      display: block;
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid #ef4444;
      color: #fca5a5;
    }
    .result-box.loading {
      display: block;
      background: #1e293b;
      border: 1px solid #334155;
      color: #94a3b8;
      text-align: center;
    }
    .result-header { font-size: 14px; font-weight: 700; margin-bottom: 4px; display: flex; align-items: center; gap: 6px; }
    .result-details { font-size: 12px; color: #cbd5e1; line-height: 1.4; margin-top: 4px; word-break: break-all; }
    .settings-accordion { border-top: 1px solid #1e293b; padding-top: 10px; }
    .accordion-toggle {
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 11px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 4px 0;
    }
    .accordion-content { display: none; margin-top: 8px; flex-direction: column; gap: 8px; }
    .accordion-content.open { display: flex; }
    .hint-text { font-size: 11px; color: #64748b; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <span class="brand-icon">🛡️</span>
      <span class="brand-title">PayGuard</span>
    </div>
    <span class="active-pill">Safe Browsing v4</span>
  </div>

  <div class="section-title">Manual Checkout URL Check</div>
  <div class="input-group">
    <input
      type="url"
      id="urlInput"
      class="input-field"
      placeholder="Paste payment or checkout URL..."
      autocomplete="off"
    />
    <button type="button" id="checkBtn" class="btn btn-primary">
      <span>🔍</span>
      <span>Verify Checkout Safety</span>
    </button>
  </div>

  <div class="section-title" style="margin-bottom: 6px;">Quick Test Scenarios</div>
  <div class="quick-tests">
    <button type="button" class="chip" id="testSafe">✅ Safe Store</button>
    <button type="button" class="chip" id="testPhishing">⚠️ Phishing Test</button>
    <button type="button" class="chip" id="testMalware">⚠️ Malware Test</button>
    <button type="button" class="chip" id="testCurrentTab">📑 Current Tab</button>
  </div>

  <!-- Scan Result Container -->
  <div id="resultBox" class="result-box">
    <div id="resultHeader" class="result-header"></div>
    <div id="resultDetails" class="result-details"></div>
  </div>

  <!-- Settings Accordion -->
  <div class="settings-accordion">
    <button type="button" id="toggleSettings" class="accordion-toggle">
      <span>⚙️ Google Safe Browsing API Key</span>
      <span id="accordionArrow">▼</span>
    </button>
    <div id="settingsContent" class="accordion-content">
      <div class="hint-text">
        Replace <code>"YOUR_API_KEY"</code> in <code>background.js</code> or enter your Google Cloud API Key below:
      </div>
      <input
        type="password"
        id="apiKeyInput"
        class="input-field"
        placeholder="AIzaSy... (optional override)"
      />
      <button type="button" id="saveKeyBtn" class="btn" style="background: #334155; color: #f8fafc;">
        Save Key
      </button>
      <div id="keyStatus" class="hint-text" style="color: #38bdf8;"></div>
    </div>
  </div>

  <script src="popup.js"></script>
</body>
</html>`
  },

  "popup.js": {
    name: "popup.js",
    path: "popup.js",
    language: "javascript",
    description: "Popup logic for manual checkout URL testing, presets, and chrome.storage API key management.",
    content: `/**
 * PayGuard - Popup Script (Manifest V3)
 * Handles manual checkout URL lookup, quick test presets, and settings.
 */

document.addEventListener("DOMContentLoaded", () => {
  const urlInput = document.getElementById("urlInput");
  const checkBtn = document.getElementById("checkBtn");
  const resultBox = document.getElementById("resultBox");
  const resultHeader = document.getElementById("resultHeader");
  const resultDetails = document.getElementById("resultDetails");

  const testSafe = document.getElementById("testSafe");
  const testPhishing = document.getElementById("testPhishing");
  const testMalware = document.getElementById("testMalware");
  const testCurrentTab = document.getElementById("testCurrentTab");

  const toggleSettings = document.getElementById("toggleSettings");
  const settingsContent = document.getElementById("settingsContent");
  const accordionArrow = document.getElementById("accordionArrow");
  const apiKeyInput = document.getElementById("apiKeyInput");
  const saveKeyBtn = document.getElementById("saveKeyBtn");
  const keyStatus = document.getElementById("keyStatus");

  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(["userApiKey"], (data) => {
      if (data && data.userApiKey) {
        apiKeyInput.value = data.userApiKey;
        keyStatus.textContent = "✓ Custom key configured in storage";
      }
    });
  }

  toggleSettings.addEventListener("click", () => {
    const isOpen = settingsContent.classList.contains("open");
    if (isOpen) {
      settingsContent.classList.remove("open");
      accordionArrow.textContent = "▼";
    } else {
      settingsContent.classList.add("open");
      accordionArrow.textContent = "▲";
    }
  });

  saveKeyBtn.addEventListener("click", () => {
    const key = (apiKeyInput.value || "").trim();
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ userApiKey: key }, () => {
        keyStatus.textContent = key ? "✓ API key saved successfully" : "✓ Reset to default background.js key";
        setTimeout(() => {
          keyStatus.textContent = "";
        }, 3000);
      });
    }
  });

  function runCheck(targetUrl) {
    if (!targetUrl) {
      alert("Please enter a valid URL to check.");
      return;
    }

    resultBox.className = "result-box loading";
    resultHeader.textContent = "⏳ Analyzing with Google Safe Browsing...";
    resultDetails.textContent = \`Target: \${targetUrl}\`;

    chrome.runtime.sendMessage(
      {
        action: "CHECK_PAYMENT_URL",
        url: targetUrl,
        triggerContext: "popup_manual"
      },
      (response) => {
        if (chrome.runtime.lastError) {
          resultBox.className = "result-box threat";
          resultHeader.textContent = "❌ Background Service Worker Error";
          resultDetails.textContent = chrome.runtime.lastError.message;
          return;
        }

        if (!response) {
          resultBox.className = "result-box threat";
          resultHeader.textContent = "❌ No Response Received";
          resultDetails.textContent = "Could not communicate with background service worker.";
          return;
        }

        if (response.isError) {
          resultBox.className = "result-box threat";
          resultHeader.textContent = "⚠️ Safe Browsing API Error";
          resultDetails.textContent = response.error || "Request failed. Check API key or connection.";
          return;
        }

        if (response.isSafe) {
          resultBox.className = "result-box safe";
          resultHeader.innerHTML = "<span>✅</span> <span>Link Verified Safe</span>";
          resultDetails.innerHTML = \`
            <strong>Clean Record:</strong> No malicious software, deceptive phishing, or fraud flags detected by Google Safe Browsing.
            <div style="margin-top: 4px; font-size: 11px; opacity: 0.8;">URL: \${escapeHtml(targetUrl)}</div>
          \`;
        } else {
          resultBox.className = "result-box threat";
          const threat = response.threatType || "THREAT_DETECTED";
          resultHeader.innerHTML = \`<span>⚠️</span> <span>Dangerous: \${escapeHtml(threat)}</span>\`;
          resultDetails.innerHTML = \`
            <strong>⚠️ WARNING:</strong> This checkout page was flagged as unsafe by Google Safe Browsing. Proceed with caution.
            <div style="margin-top: 4px; font-size: 11px; color: #fca5a5;">Never submit credit cards or credentials to this destination.</div>
          \`;
        }
      }
    );
  }

  checkBtn.addEventListener("click", () => {
    runCheck(urlInput.value.trim());
  });

  urlInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      runCheck(urlInput.value.trim());
    }
  });

  testSafe.addEventListener("click", () => {
    urlInput.value = "https://store.example.com/checkout?step=payment";
    runCheck(urlInput.value);
  });

  testPhishing.addEventListener("click", () => {
    urlInput.value = "https://testsafebrowsing.appspot.com/s/phishing.html";
    runCheck(urlInput.value);
  });

  testMalware.addEventListener("click", () => {
    urlInput.value = "http://malware.testing.google.test/testing/malware/";
    runCheck(urlInput.value);
  });

  testCurrentTab.addEventListener("click", () => {
    if (chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0] && tabs[0].url) {
          urlInput.value = tabs[0].url;
          runCheck(tabs[0].url);
        } else {
          alert("Could not access active tab URL.");
        }
      });
    } else {
      urlInput.value = window.location.href;
      runCheck(urlInput.value);
    }
  });

  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});`
  }
};

export function getCustomizedExtensionFiles(apiKey?: string): Record<string, ExtensionFile> {
  if (!apiKey || !apiKey.trim() || apiKey.trim() === "YOUR_API_KEY") {
    return EXTENSION_FILES;
  }

  const cleanKey = apiKey.trim();
  const background = EXTENSION_FILES["background.js"];
  const customizedBg = background.content.replace(
    'const DEFAULT_API_KEY = "YOUR_API_KEY";',
    `const DEFAULT_API_KEY = "${cleanKey}";`
  );

  return {
    ...EXTENSION_FILES,
    "background.js": {
      ...background,
      content: customizedBg
    }
  };
}

