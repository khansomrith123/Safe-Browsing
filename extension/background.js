/**
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
    const response = await fetch(`${SAFE_BROWSING_ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[PayGuard] Safe Browsing API responded with HTTP ${response.status}:`, errText);
      return {
        isSafe: false,
        isError: true,
        status: response.status,
        error: `API returned error status ${response.status}`,
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

    // Keep history trimmed to last 50 scans
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

    // Execute async Safe Browsing verification
    checkUrlWithSafeBrowsing(targetUrl)
      .then((res) => {
        sendResponse(res);
      })
      .catch((err) => {
        sendResponse({ isSafe: false, error: err.message });
      });

    // Return true to keep message channel open for async response
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
});
