import React, { useState } from "react";
import { ShieldCheck, Search, ChevronDown, ChevronUp, Check, AlertTriangle, Key } from "lucide-react";

export const PopupPreview: React.FC = () => {
  const [urlInput, setUrlInput] = useState("https://store.merchline.com/checkout?step=payment");
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<{
    status: "idle" | "safe" | "threat";
    threatType?: string;
    url?: string;
  }>({
    status: "safe",
    url: "https://store.merchline.com/checkout?step=payment"
  });

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [keySaved, setKeySaved] = useState(false);

  const handleCheck = (targetUrl: string) => {
    if (!targetUrl.trim()) return;
    setIsChecking(true);

    setTimeout(() => {
      setIsChecking(false);
      const isTestPhishing = targetUrl.includes("phishing");
      const isTestMalware = targetUrl.includes("malware") || targetUrl.includes("ianfette");
      const isTestUnwanted = targetUrl.includes("unwanted");

      if (isTestPhishing || isTestMalware || isTestUnwanted) {
        setResult({
          status: "threat",
          threatType: isTestPhishing
            ? "SOCIAL_ENGINEERING"
            : isTestMalware
            ? "MALWARE"
            : "UNWANTED_SOFTWARE",
          url: targetUrl
        });
      } else {
        setResult({
          status: "safe",
          url: targetUrl
        });
      }
    }, 300);
  };

  const handleSaveKey = () => {
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h2 className="text-base font-bold text-white mb-1">Extension Popup Preview (`popup.html` & `popup.js`)</h2>
        <p className="text-xs text-slate-400">
          This is an exact interactive simulation of how your Chrome Extension looks and behaves when the user clicks the PayGuard icon in their browser toolbar.
        </p>
      </div>

      <div className="flex justify-center py-4">
        {/* Chrome Popup Card Frame */}
        <div className="w-[380px] bg-slate-900 text-slate-100 rounded-2xl border border-slate-700 shadow-2xl p-4 space-y-3.5 relative overflow-hidden font-sans">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🛡️</span>
              <span className="font-bold text-sm text-white">PayGuard</span>
            </div>
            <span className="text-[11px] font-semibold text-sky-400 bg-sky-950/60 border border-sky-800/60 px-2 py-0.5 rounded-full">
              Safe Browsing v4
            </span>
          </div>

          {/* Section: Manual Check */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Manual Checkout URL Check
            </div>
            <div className="space-y-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCheck(urlInput)}
                placeholder="Paste payment or checkout URL..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-sky-500 font-mono"
              />
              <button
                onClick={() => handleCheck(urlInput)}
                disabled={isChecking}
                className="w-full bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-semibold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>🔍</span>
                <span>{isChecking ? "Checking Safe Browsing..." : "Verify Checkout Safety"}</span>
              </button>
            </div>
          </div>

          {/* Quick Scenario Chips */}
          <div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Quick Test Presets
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => {
                  const url = "https://store.merchline.com/checkout?step=payment";
                  setUrlInput(url);
                  handleCheck(url);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] px-2.5 py-1 rounded-md border border-slate-700 transition-colors cursor-pointer"
              >
                ✅ Safe Store
              </button>
              <button
                onClick={() => {
                  const url = "https://testsafebrowsing.appspot.com/s/phishing.html";
                  setUrlInput(url);
                  handleCheck(url);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] px-2.5 py-1 rounded-md border border-slate-700 transition-colors cursor-pointer"
              >
                ⚠️ Phishing Test
              </button>
              <button
                onClick={() => {
                  const url = "http://malware.testing.google.test/testing/malware/";
                  setUrlInput(url);
                  handleCheck(url);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] px-2.5 py-1 rounded-md border border-slate-700 transition-colors cursor-pointer"
              >
                ⚠️ Malware Test
              </button>
            </div>
          </div>

          {/* Dynamic Result Box */}
          {result.status === "safe" && (
            <div className="rounded-xl p-3 bg-emerald-950/40 border border-emerald-500/80 text-emerald-200 space-y-1">
              <div className="font-bold text-xs flex items-center gap-1.5 text-emerald-400">
                <span>✅</span>
                <span>Link Verified Safe</span>
              </div>
              <div className="text-[11px] text-slate-300 leading-relaxed">
                <strong>Clean Record:</strong> No malicious software, deceptive phishing, or fraud flags detected by Google Safe Browsing.
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate mt-1">
                {result.url}
              </div>
            </div>
          )}

          {result.status === "threat" && (
            <div className="rounded-xl p-3 bg-rose-950/50 border border-rose-500 text-rose-200 space-y-1">
              <div className="font-bold text-xs flex items-center gap-1.5 text-rose-400">
                <span>⚠️</span>
                <span>Dangerous: {result.threatType}</span>
              </div>
              <div className="text-[11px] text-rose-100 leading-relaxed">
                <strong>⚠️ WARNING:</strong> This checkout page was flagged as unsafe by Google Safe Browsing. Proceed with caution.
              </div>
              <div className="text-[10px] text-rose-300 font-mono truncate mt-1">
                Never submit payment credentials to this link.
              </div>
            </div>
          )}

          {/* Accordion Settings for API Key */}
          <div className="border-t border-slate-800 pt-2.5">
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="w-full flex items-center justify-between text-slate-400 hover:text-slate-200 text-[11px] font-medium py-1 cursor-pointer transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Key className="w-3 h-3 text-slate-400" />
                <span>Google Safe Browsing API Key</span>
              </span>
              {settingsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {settingsOpen && (
              <div className="mt-2 space-y-2 pt-1">
                <p className="text-[11px] text-slate-400">
                  Replace <code className="text-sky-300 font-mono">"YOUR_API_KEY"</code> in <code className="text-slate-300 font-mono">background.js</code> or enter your Google Cloud key here:
                </p>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy... (optional runtime override)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none font-mono"
                />
                <button
                  onClick={handleSaveKey}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  Save Key in chrome.storage
                </button>
                {keySaved && (
                  <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Key saved to extension storage
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
