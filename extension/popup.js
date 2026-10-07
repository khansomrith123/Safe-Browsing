/**
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

  // Load existing API key from storage
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(["userApiKey"], (data) => {
      if (data && data.userApiKey) {
        apiKeyInput.value = data.userApiKey;
        keyStatus.textContent = "✓ Custom key configured in storage";
      }
    });
  }

  // Toggle settings accordion
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

  // Save API Key
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

  // Check URL function
  function runCheck(targetUrl) {
    if (!targetUrl) {
      alert("Please enter a valid URL to check.");
      return;
    }

    // Set loading UI
    resultBox.className = "result-box loading";
    resultHeader.textContent = "⏳ Analyzing with Google Safe Browsing...";
    resultDetails.textContent = `Target: ${targetUrl}`;

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
          resultDetails.innerHTML = `
            <strong>Clean Record:</strong> No malicious software, deceptive phishing, or fraud flags detected by Google Safe Browsing.
            <div style="margin-top: 4px; font-size: 11px; opacity: 0.8;">URL: ${escapeHtml(targetUrl)}</div>
          `;
        } else {
          resultBox.className = "result-box threat";
          const threat = response.threatType || "THREAT_DETECTED";
          resultHeader.innerHTML = `<span>⚠️</span> <span>Dangerous: ${escapeHtml(threat)}</span>`;
          resultDetails.innerHTML = `
            <strong>⚠️ WARNING:</strong> This checkout page was flagged as unsafe by Google Safe Browsing. Proceed with caution.
            <div style="margin-top: 4px; font-size: 11px; color: #fca5a5;">Never submit credit cards or credentials to this destination.</div>
          `;
        }
      }
    );
  }

  // Trigger manual check
  checkBtn.addEventListener("click", () => {
    runCheck(urlInput.value.trim());
  });

  urlInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      runCheck(urlInput.value.trim());
    }
  });

  // Quick test triggers
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
});
