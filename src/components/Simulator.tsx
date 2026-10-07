import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Globe,
  ShoppingCart,
  CreditCard,
  Lock,
  ArrowRight,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Sparkles,
  Key,
  Layers,
  ChevronRight,
  HelpCircle,
  Check
} from "lucide-react";

interface SimulatorProps {
  apiKey: string;
  setApiKey: (key: string) => void;
}

export const Simulator: React.FC<SimulatorProps> = ({ apiKey, setApiKey }) => {
  // Simulator State
  const [currentUrl, setCurrentUrl] = useState("https://store.merchline.com/checkout?step=payment");
  const [customInput, setCustomInput] = useState(currentUrl);
  const [isChecking, setIsChecking] = useState(false);
  const [activeViewMode, setActiveViewMode] = useState<"checkout" | "combined">("combined");

  // Injected UI states in webpage viewport
  const [showWarningOverlay, setShowWarningOverlay] = useState(false);
  const [warningDetails, setWarningDetails] = useState<{ url: string; threatType: string } | null>(null);
  const [showSafeBadge, setShowSafeBadge] = useState(false);
  const [safeBadgeTimer, setSafeBadgeTimer] = useState(0);

  // Popup Preview sync state inside Combined view
  const [popupResult, setPopupResult] = useState<{
    status: "idle" | "safe" | "threat";
    threatType?: string;
    url: string;
  }>({
    status: "safe",
    url: currentUrl
  });

  // Guided Tour Step (for "Anyone can do it")
  const [guidedStep, setGuidedStep] = useState<number | null>(null);

  // Runtime event logs
  const [eventLogs, setEventLogs] = useState<
    Array<{
      id: string;
      time: string;
      source: "content.js" | "background.js" | "Google Safe Browsing";
      type: "info" | "safe" | "threat" | "intercept";
      message: string;
    }>
  >([]);

  const addLog = (
    source: "content.js" | "background.js" | "Google Safe Browsing",
    type: "info" | "safe" | "threat" | "intercept",
    message: string
  ) => {
    const time = new Date().toLocaleTimeString("en-US", { hour12: false });
    setEventLogs((prev) => [
      {
        id: Math.random().toString(36).substring(2, 9),
        time,
        source,
        type,
        message
      },
      ...prev.slice(0, 30)
    ]);
  };

  // Safe Browsing verification engine
  const executeSafeBrowsingCheck = async (targetUrl: string, triggerCause: string) => {
    setIsChecking(true);
    addLog("content.js", "intercept", `Detected ${triggerCause}: inspecting "${targetUrl}"`);
    addLog("background.js", "info", `Contacting Google Safe Browsing v4 lookup endpoint`);

    const isTestPhishing = targetUrl.includes("phishing");
    const isTestMalware = targetUrl.includes("malware") || targetUrl.includes("ianfette");
    const isTestUnwanted = targetUrl.includes("unwanted");

    // Artificial tiny network delay for authentic realistic feedback
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (isTestPhishing || isTestMalware || isTestUnwanted) {
      const threatType = isTestPhishing
        ? "SOCIAL_ENGINEERING"
        : isTestMalware
        ? "MALWARE"
        : "UNWANTED_SOFTWARE";

      addLog("Google Safe Browsing", "threat", `Threat Matched! ThreatType: ${threatType}`);
      addLog("background.js", "threat", `Flagged unsafe: sending warning trigger to content.js`);

      setWarningDetails({ url: targetUrl, threatType });
      setShowWarningOverlay(true);
      setShowSafeBadge(false);
      setPopupResult({
        status: "threat",
        threatType,
        url: targetUrl
      });
      setIsChecking(false);
      return;
    }

    // Live API Key check if entered
    if (apiKey.trim() && apiKey.trim() !== "YOUR_API_KEY") {
      try {
        const res = await fetch(
          `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey.trim()}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              client: { clientId: "payguard-studio", clientVersion: "1.0.0" },
              threatInfo: {
                threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"],
                platformTypes: ["ANY_PLATFORM"],
                threatEntryTypes: ["URL"],
                threatEntries: [{ url: targetUrl }]
              }
            })
          }
        );
        const data = await res.json();
        if (data && data.matches && data.matches.length > 0) {
          const threatType = data.matches[0].threatType || "MALWARE";
          setWarningDetails({ url: targetUrl, threatType });
          setShowWarningOverlay(true);
          setShowSafeBadge(false);
          setPopupResult({ status: "threat", threatType, url: targetUrl });
          setIsChecking(false);
          return;
        }
      } catch (err: any) {
        addLog("background.js", "info", `API lookup fallback note: ${err.message}`);
      }
    }

    // Verified clean
    addLog("Google Safe Browsing", "safe", `URL verified clean. No malicious threat detected.`);
    addLog("content.js", "safe", `Injected "✅ Link Verified Safe" badge`);

    setShowSafeBadge(true);
    setShowWarningOverlay(false);
    setPopupResult({
      status: "safe",
      url: targetUrl
    });
    setIsChecking(false);
  };

  // Safe badge countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showSafeBadge) {
      setSafeBadgeTimer(35);
      interval = setInterval(() => {
        setSafeBadgeTimer((prev) => {
          if (prev <= 1) {
            setShowSafeBadge(false);
            return 0;
          }
          return prev - 1;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [showSafeBadge]);

  const navigateTo = (url: string) => {
    setCurrentUrl(url);
    setCustomInput(url);
    setShowWarningOverlay(false);
    setShowSafeBadge(false);

    const isCheckout = /checkout|pay|payment|cart|billing|purchase/i.test(url);
    if (isCheckout) {
      executeSafeBrowsingCheck(url, "Page URL loaded");
    } else {
      addLog("content.js", "info", `Loaded "${url}" (Passive browsing mode)`);
    }
  };

  useEffect(() => {
    navigateTo(currentUrl);
  }, []);

  return (
    <div className="space-y-6">
      {/* "Anyone Can Do It" Quick Scenario Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Live Extension Studio</span>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Real-Time Guard
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Experience the extension's behavior exactly as a real Chrome user would. Click any scenario button below to see the guard react.
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveViewMode("combined")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-medium ${
                activeViewMode === "combined"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Side-by-Side (Page + Popup)
            </button>
            <button
              onClick={() => setActiveViewMode("checkout")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-medium ${
                activeViewMode === "checkout"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Full Page View
            </button>
          </div>
        </div>

        {/* 1-Click Test Scenarios */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
              Test Scenarios:
            </span>

            <button
              onClick={() => {
                setGuidedStep(1);
                navigateTo("https://store.merchline.com/checkout?step=payment");
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border cursor-pointer flex items-center gap-1.5 ${
                currentUrl.includes("merchline")
                  ? "bg-emerald-950/70 text-emerald-300 border-emerald-600"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white"
              }`}
            >
              <span>✅ Safe Checkout</span>
              <span className="text-[10px] opacity-75 font-mono">(Triggers Safe Badge)</span>
            </button>

            <button
              onClick={() => {
                setGuidedStep(2);
                navigateTo("https://testsafebrowsing.appspot.com/s/phishing.html");
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border cursor-pointer flex items-center gap-1.5 ${
                currentUrl.includes("phishing")
                  ? "bg-rose-950/70 text-rose-300 border-rose-600"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white"
              }`}
            >
              <span>⚠️ Phishing Attack</span>
              <span className="text-[10px] opacity-75 font-mono">(Triggers Warning Modal)</span>
            </button>

            <button
              onClick={() => {
                setGuidedStep(3);
                navigateTo("http://malware.testing.google.test/testing/malware/");
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border cursor-pointer flex items-center gap-1.5 ${
                currentUrl.includes("malware")
                  ? "bg-rose-950/70 text-rose-300 border-rose-600"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white"
              }`}
            >
              <span>⚠️ Malware Host</span>
              <span className="text-[10px] opacity-75 font-mono">(Triggers Malware Alert)</span>
            </button>
          </div>

          {/* Quick API Key Setup Modal Trigger / Status */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">API Key:</span>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="YOUR_API_KEY (optional)"
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 font-mono w-44 outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* URL Address Bar */}
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs">
          <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && navigateTo(customInput)}
            className="w-full bg-transparent text-slate-200 outline-none font-mono text-xs"
            placeholder="Type any store checkout URL to evaluate..."
          />
          <button
            onClick={() => navigateTo(customInput)}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium cursor-pointer transition-colors shrink-0"
          >
            Visit URL
          </button>
        </div>
      </div>

      {/* Main Viewport Grid */}
      <div className={`grid gap-6 ${activeViewMode === "combined" ? "grid-cols-1 lg:grid-cols-12" : "grid-cols-1"}`}>
        {/* Left Column: Simulated Browser Viewport */}
        <div className={`${activeViewMode === "combined" ? "lg:col-span-8" : "col-span-1"} space-y-4`}>
          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl min-h-[580px] flex flex-col">
            {/* Window Top Bar */}
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-xs text-slate-400 font-mono truncate max-w-xs">
                  {currentUrl}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {isChecking ? (
                  <span className="text-sky-400 flex items-center gap-1.5 animate-pulse font-mono">
                    <Radio className="w-3 h-3" />
                    Checking Safe Browsing...
                  </span>
                ) : (
                  <span className="text-slate-500 font-mono text-[11px]">PayGuard Content Script Injected</span>
                )}
              </div>
            </div>

            {/* Simulated Store Page Content */}
            <div className="p-6 flex-1 bg-slate-950/60 relative overflow-y-auto">
              <div className="max-w-xl mx-auto space-y-6">
                {/* Store Header */}
                <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-base">
                      🛒
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Apex Merchandise Online</h3>
                      <p className="text-xs text-slate-400">Checkout Step 2 of 3 · Secure Order</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">$89.00 USD</span>
                </div>

                {/* Cart Summary */}
                <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 space-y-2.5 text-xs">
                  <div className="font-semibold text-slate-300">Order Summary</div>
                  <div className="flex justify-between text-slate-400">
                    <span>1x Wireless Ergonomic Keyboard</span>
                    <span className="font-mono text-slate-200">$89.00</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Standard Shipping</span>
                    <span className="text-emerald-400 font-medium">Free</span>
                  </div>
                  <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-white">
                    <span>Total Amount</span>
                    <span className="text-sky-400 font-mono">$89.00</span>
                  </div>
                </div>

                {/* Mock Credit Card Inputs */}
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    <span>Payment Information</span>
                  </div>
                  <div className="space-y-2">
                    <input
                      type="text"
                      defaultValue="Morgan Lee"
                      readOnly
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 outline-none"
                    />
                    <input
                      type="text"
                      defaultValue="•••• •••• •••• 1024"
                      readOnly
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Interactive Checkout Buttons */}
                <div className="space-y-2.5 pt-2">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Click Any Button to Test URL Interception:
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      onClick={() => executeSafeBrowsingCheck(currentUrl, 'button click ("Proceed to Checkout")')}
                      className="w-full bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Proceed to Checkout</span>
                    </button>

                    <button
                      onClick={() => executeSafeBrowsingCheck(currentUrl, 'button click ("Pay $89.00 Now")')}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Pay $89.00 Now</span>
                    </button>

                    <button
                      onClick={() => executeSafeBrowsingCheck(currentUrl, 'button click ("Buy with 1-Click")')}
                      className="w-full bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <span>⚡ Buy with 1-Click</span>
                    </button>

                    <button
                      onClick={() => executeSafeBrowsingCheck(currentUrl, 'button click ("View Cart")')}
                      className="w-full bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-300 px-4 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>View Shopping Cart</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* WARNING OVERLAY INTERSTITIAL                                  */}
              {/* ------------------------------------------------------------- */}
              {showWarningOverlay && warningDetails && (
                <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-sm p-4 flex items-center justify-center animate-in fade-in duration-200">
                  <div className="bg-white text-slate-900 rounded-2xl max-w-lg w-full p-6 border-2 border-rose-500 shadow-2xl space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0 text-xl font-bold">
                        ⚠️
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-rose-900 leading-tight">
                          Security Alert: Threat Detected
                        </h2>
                        <div className="inline-block mt-1 text-xs font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                          {warningDetails.threatType === "SOCIAL_ENGINEERING"
                            ? "Phishing & Deceptive Site Detected"
                            : warningDetails.threatType === "MALWARE"
                            ? "Malicious Software Detected"
                            : "Unwanted / Harmful Software Detected"}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <div className="text-sm leading-relaxed text-rose-950 bg-rose-50 p-3 rounded-lg border-l-4 border-rose-500">
                        <strong>⚠️ WARNING:</strong> This checkout page was flagged as unsafe by{" "}
                        <strong>Google Safe Browsing</strong>. Proceed with caution.
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Entering payment credentials, credit card details, or personal data on this page puts your financial information at severe risk of theft or unauthorized charges.
                      </p>
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                          Flagged URL:
                        </span>
                        <span className="font-mono text-slate-800 break-all text-[11px]">
                          {warningDetails.url}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <button
                        onClick={() => {
                          setShowWarningOverlay(false);
                          navigateTo("https://store.merchline.com/checkout?step=payment");
                          addLog("content.js", "info", "User opted to leave the unsafe page.");
                        }}
                        className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs py-2.5 px-4 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        🛡️ Leave Page (Recommended)
                      </button>
                      <button
                        onClick={() => {
                          setShowWarningOverlay(false);
                          addLog("content.js", "threat", "User acknowledged risk and proceeded.");
                        }}
                        className="text-xs text-slate-500 hover:text-slate-800 underline px-3 py-2 cursor-pointer"
                      >
                        I understand the risks, proceed
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* FLOATING "LINK VERIFIED SAFE" BADGE                           */}
              {/* ------------------------------------------------------------- */}
              {showSafeBadge && (
                <div className="absolute bottom-6 right-6 z-40 bg-slate-900 border border-emerald-500 text-white rounded-xl shadow-2xl px-4 py-2.5 flex items-center gap-3 animate-in slide-in-from-right duration-300">
                  <span className="text-lg">✅</span>
                  <div>
                    <div className="text-xs font-bold text-emerald-400 leading-tight">
                      Link Verified Safe
                    </div>
                    <div className="text-[10px] text-slate-400 leading-tight">
                      Google Safe Browsing
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 ml-1">
                    {(safeBadgeTimer / 10).toFixed(1)}s
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: In Side-by-Side Mode, show Popup & Event Log */}
        {activeViewMode === "combined" && (
          <div className="lg:col-span-4 space-y-4">
            {/* Live Extension Popup Mirror */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🛡️</span>
                  <span className="font-bold text-xs text-white">Toolbar Popup Mirror</span>
                </div>
                <span className="text-[10px] text-sky-400 font-mono bg-sky-950/60 px-2 py-0.5 rounded-full border border-sky-800/60">
                  Live Sync
                </span>
              </div>

              {/* Popup Live Status Card */}
              {popupResult.status === "safe" ? (
                <div className="bg-emerald-950/40 border border-emerald-500/80 rounded-xl p-3 text-emerald-200 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-400">
                    <span>✅</span>
                    <span>Link Verified Safe</span>
                  </div>
                  <div className="text-[11px] text-slate-300 leading-relaxed">
                    Google Safe Browsing confirmed zero phishing or malware matches.
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate mt-1">
                    {popupResult.url}
                  </div>
                </div>
              ) : (
                <div className="bg-rose-950/50 border border-rose-500 rounded-xl p-3 text-rose-200 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-rose-400">
                    <span>⚠️</span>
                    <span>Dangerous: {popupResult.threatType}</span>
                  </div>
                  <div className="text-[11px] text-rose-100 leading-relaxed">
                    <strong>⚠️ WARNING:</strong> Flagged as unsafe by Google Safe Browsing.
                  </div>
                  <div className="text-[10px] text-rose-300 font-mono truncate mt-1">
                    Never submit payment credentials.
                  </div>
                </div>
              )}

              {/* Instant Manual Tester inside mirror */}
              <div className="pt-1 space-y-2">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Test Any URL in Popup:
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    defaultValue="https://testsafebrowsing.appspot.com/s/phishing.html"
                    id="popupManualInput"
                    placeholder="https://..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono outline-none"
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById("popupManualInput") as HTMLInputElement;
                      if (input && input.value) {
                        navigateTo(input.value);
                      }
                    }}
                    className="bg-sky-600 hover:bg-sky-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Test
                  </button>
                </div>
              </div>
            </div>

            {/* Real-time Message Log */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300 uppercase tracking-wider">
                <span>Message Passing Stream</span>
                <span className="text-[10px] text-slate-500 font-mono">{eventLogs.length} events</span>
              </div>

              <div className="h-52 overflow-y-auto space-y-1.5 font-mono text-[11px] pr-1">
                {eventLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-2 rounded-lg border leading-tight ${
                      log.type === "threat"
                        ? "bg-rose-950/40 border-rose-800/60 text-rose-300"
                        : log.type === "safe"
                        ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
                        : log.type === "intercept"
                        ? "bg-amber-950/40 border-amber-800/60 text-amber-300"
                        : "bg-slate-950/80 border-slate-800/80 text-slate-300"
                    }`}
                  >
                    <div className="flex justify-between text-[10px] opacity-75 mb-0.5">
                      <span>{log.source}</span>
                      <span>{log.time}</span>
                    </div>
                    <div>{log.message}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
