/**
 * PayGuard - Content Script (Manifest V3)
 * Monitors checkout URLs, intercepts checkout button interactions,
 * and renders interstitial threat warnings or verified badges.
 */

(() => {
  // Guard against multiple injections in the same frame
  if (window.__PAYGUARD_INITIALIZED__) return;
  window.__PAYGUARD_INITIALIZED__ = true;

  // Checkout and payment keyword heuristics
  const CHECKOUT_PATTERNS = [
    /checkout/i,
    /payment/i,
    /\bpay\b/i,
    /\bbuy\b/i,
    /\bcart\b/i,
    /billing/i,
    /purchase/i,
    /order[-_]?confirm/i,
    /paypal\.com/i,
    /stripe\.com/i
  ];

  // Button text patterns to intercept
  const BUTTON_PATTERNS = [
    /\bcheckout\b/i,
    /\bproceed to checkout\b/i,
    /\bpay\b/i,
    /\bpay now\b/i,
    /\bbuy now\b/i,
    /\bplace order\b/i,
    /\bcomplete order\b/i,
    /\bconfirm payment\b/i,
    /\bview cart\b/i,
    /\bcart\b/i
  ];

  let lastCheckedUrl = "";
  let isChecking = false;
  let hasActiveWarning = false;

  /**
   * Determine if the current or destination URL looks like a payment/checkout context
   */
  function isCheckoutUrl(url) {
    if (!url) return false;
    try {
      const parsed = new URL(url, window.location.href);
      const testString = `${parsed.pathname} ${parsed.search} ${parsed.hostname}`.toLowerCase();
      return CHECKOUT_PATTERNS.some((pattern) => pattern.test(testString));
    } catch {
      return CHECKOUT_PATTERNS.some((pattern) => pattern.test(url));
    }
  }

  /**
   * Determine if an element looks like a checkout/pay action
   */
  function isCheckoutElement(el) {
    if (!el || !(el instanceof Element)) return false;

    // Check tag and roles
    const isInteractive =
      el.matches("button, a, input[type='submit'], input[type='button'], [role='button'], [role='link']") ||
      el.closest("button, a, input[type='submit'], input[type='button'], [role='button'], [role='link']");

    if (!isInteractive) return false;

    const targetEl = el.closest("button, a, input[type='submit'], input[type='button'], [role='button'], [role='link']") || el;

    const textContent = (targetEl.innerText || targetEl.textContent || "").trim();
    const valueContent = targetEl.getAttribute("value") || "";
    const ariaLabel = targetEl.getAttribute("aria-label") || "";
    const title = targetEl.getAttribute("title") || "";
    const id = targetEl.id || "";
    const className = typeof targetEl.className === "string" ? targetEl.className : "";

    const combined = `${textContent} ${valueContent} ${ariaLabel} ${title} ${id} ${className}`;

    return BUTTON_PATTERNS.some((pattern) => pattern.test(combined));
  }

  /**
   * Send the target URL to background service worker for Google Safe Browsing verification
   */
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
            // Flagged as unsafe by Google Safe Browsing
            const threatType = response.threatType || (response.threats && response.threats[0]) || "MALWARE";
            showWarningOverlay(url, threatType);
          } else if (response.isSafe) {
            // Verified Safe
            showSafeBadge();
          }
        }
      );
    } catch (err) {
      isChecking = false;
      console.warn("[PayGuard] Failed sending check message:", err);
    }
  }

  /**
   * Display the warning overlay interstitial banner
   * "⚠️ WARNING: This checkout page was flagged as unsafe by Google Safe Browsing. Proceed with caution."
   */
  function showWarningOverlay(url, threatType) {
    if (document.getElementById("payguard-threat-overlay")) return;
    hasActiveWarning = true;

    // Remove any safe badge if present
    const existingBadge = document.getElementById("payguard-safe-badge");
    if (existingBadge) existingBadge.remove();

    const overlay = document.createElement("div");
    overlay.id = "payguard-threat-overlay";
    overlay.className = "payguard-overlay-backdrop";

    // Format human-friendly threat type
    const friendlyThreat = {
      MALWARE: "Malicious Software Detected",
      SOCIAL_ENGINEERING: "Phishing & Deceptive Site Detected",
      UNWANTED_SOFTWARE: "Unwanted / Harmful Software Detected",
      POTENTIALLY_HARMFUL_APPLICATION: "Potentially Harmful Application"
    }[threatType] || threatType;

    overlay.innerHTML = `
      <div class="payguard-modal-card" role="alertdialog" aria-modal="true" aria-labelledby="payguard-title">
        <div class="payguard-modal-header">
          <div class="payguard-icon-wrapper">
            <span class="payguard-warning-icon">⚠️</span>
          </div>
          <div>
            <h2 id="payguard-title" class="payguard-title">Security Alert: Threat Detected</h2>
            <div class="payguard-badge-threat">${escapeHtml(friendlyThreat)}</div>
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
            <span class="payguard-url-text">${escapeHtml(url)}</span>
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
    `;

    document.documentElement.appendChild(overlay);

    // Bind action buttons
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

  /**
   * Display temporary "✅ Link Verified Safe" badge
   */
  function showSafeBadge() {
    if (document.getElementById("payguard-safe-badge")) return;
    if (hasActiveWarning) return;

    const badge = document.createElement("div");
    badge.id = "payguard-safe-badge";
    badge.className = "payguard-safe-badge";
    badge.setAttribute("role", "status");
    badge.innerHTML = `
      <span class="payguard-safe-icon">✅</span>
      <div class="payguard-safe-content">
        <span class="payguard-safe-text">Link Verified Safe</span>
        <span class="payguard-safe-sub">Google Safe Browsing</span>
      </div>
    `;

    document.documentElement.appendChild(badge);

    // Auto dismiss after 3.5 seconds
    setTimeout(() => {
      badge.classList.add("payguard-badge-hidden");
      setTimeout(() => {
        if (badge.parentNode) badge.remove();
      }, 300);
    }, 3500);
  }

  /**
   * Helper to escape raw HTML text
   */
  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /**
   * Inspect current page on initial load or SPA route transition
   */
  function evaluateCurrentPage() {
    const currentUrl = window.location.href;
    if (isCheckoutUrl(currentUrl)) {
      verifyUrlWithBackground(currentUrl, "page_url");
    }
  }

  /**
   * Global Click Event Delegation
   * Intercept clicks on buttons matching checkout / payment terms
   */
  document.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      if (!target) return;

      if (isCheckoutElement(target)) {
        // Find destination if anchor, otherwise use current page URL
        const anchor = target.closest("a");
        let targetUrl = window.location.href;

        if (anchor && anchor.href && !anchor.href.startsWith("javascript:")) {
          targetUrl = anchor.href;
        }

        // Trigger threat verification for this checkout attempt
        verifyUrlWithBackground(targetUrl, "button_click");
      }
    },
    true // Capture phase for reliable interception
  );

  // Monitor SPA history changes
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

  // Initial check on page load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", evaluateCurrentPage);
  } else {
    evaluateCurrentPage();
  }
})();
