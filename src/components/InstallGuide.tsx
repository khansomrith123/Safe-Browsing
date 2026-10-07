import React, { useState } from "react";
import {
  Download,
  Copy,
  Check,
  ExternalLink,
  Shield,
  Key,
  FolderArchive,
  MousePointerClick,
  Pin,
  RefreshCw,
  Sparkles
} from "lucide-react";

interface InstallGuideProps {
  onDownloadZip: () => void;
  apiKey: string;
  setApiKey: (key: string) => void;
}

export const InstallGuide: React.FC<InstallGuideProps> = ({
  onDownloadZip,
  apiKey,
  setApiKey
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({
    1: false,
    2: false,
    3: false,
    4: false,
    5: false
  });

  const toggleStep = (stepNumber: number) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepNumber]: !prev[stepNumber]
    }));
  };

  const handleCopyExtensionsUrl = () => {
    navigator.clipboard.writeText("chrome://extensions");
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const allCompleted = Object.values(completedSteps).every(Boolean);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white">
                Chrome Developer Mode Setup Wizard
              </span>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs text-sky-400 font-medium">Anyone Can Do It in 60s</span>
            </div>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              No command line or technical setup required. Follow these 5 guided steps to load the extension straight into Google Chrome. Check off each step as you go.
            </p>
          </div>

          <button
            onClick={onDownloadZip}
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer shrink-0 shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Download Extension Package (.zip)</span>
          </button>
        </div>

        {/* Interactive Progress Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-400 font-medium">Installation Progress</span>
            <span className="text-sky-400 font-mono font-semibold">
              {Object.values(completedSteps).filter(Boolean).length} of 5 Completed
            </span>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-sky-500 h-full transition-all duration-300"
              style={{
                width: `${(Object.values(completedSteps).filter(Boolean).length / 5) * 100}%`
              }}
            />
          </div>
        </div>
      </div>

      {/* 5-Step Visual Walkthrough */}
      <div className="space-y-4">
        {/* STEP 1 */}
        <div
          className={`bg-slate-900 border rounded-2xl p-5 transition-all ${
            completedSteps[1] ? "border-emerald-600/60 bg-slate-900/90" : "border-slate-800"
          }`}
        >
          <div className="flex items-start gap-4">
            <button
              onClick={() => toggleStep(1)}
              className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                completedSteps[1]
                  ? "bg-emerald-600 border-emerald-500 text-white"
                  : "bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-500"
              }`}
            >
              {completedSteps[1] ? <Check className="w-4 h-4" /> : <span className="text-xs font-bold">1</span>}
            </button>

            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FolderArchive className="w-4 h-4 text-sky-400" />
                  <span>Download and Unzip the Extension Folder</span>
                </h3>
                <button
                  onClick={() => toggleStep(1)}
                  className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {completedSteps[1] ? "Mark incomplete" : "Mark done"}
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Click the download button below. Once downloaded, <strong>right-click the ZIP file and extract/unzip it</strong> to a folder on your computer (e.g. your Downloads or Desktop).
              </p>

              <div className="pt-1 flex items-center gap-3">
                <button
                  onClick={onDownloadZip}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-sky-400" />
                  <span>Download payguard-extension.zip</span>
                </button>
                <span className="text-xs text-slate-500 font-mono">Contains manifest.json, background.js, content.js</span>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 2 */}
        <div
          className={`bg-slate-900 border rounded-2xl p-5 transition-all ${
            completedSteps[2] ? "border-emerald-600/60 bg-slate-900/90" : "border-slate-800"
          }`}
        >
          <div className="flex items-start gap-4">
            <button
              onClick={() => toggleStep(2)}
              className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                completedSteps[2]
                  ? "bg-emerald-600 border-emerald-500 text-white"
                  : "bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-500"
              }`}
            >
              {completedSteps[2] ? <Check className="w-4 h-4" /> : <span className="text-xs font-bold">2</span>}
            </button>

            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-sky-400" />
                  <span>Open the Chrome Extensions Page</span>
                </h3>
                <button
                  onClick={() => toggleStep(2)}
                  className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {completedSteps[2] ? "Mark incomplete" : "Mark done"}
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Open a new tab in Google Chrome, paste the following URL into the address bar, and press <strong>Enter</strong>:
              </p>

              <div className="flex items-center gap-2">
                <div className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-sky-300 flex-1">
                  chrome://extensions
                </div>
                <button
                  onClick={handleCopyExtensionsUrl}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  {copiedUrl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy URL</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 3 */}
        <div
          className={`bg-slate-900 border rounded-2xl p-5 transition-all ${
            completedSteps[3] ? "border-emerald-600/60 bg-slate-900/90" : "border-slate-800"
          }`}
        >
          <div className="flex items-start gap-4">
            <button
              onClick={() => toggleStep(3)}
              className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                completedSteps[3]
                  ? "bg-emerald-600 border-emerald-500 text-white"
                  : "bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-500"
              }`}
            >
              {completedSteps[3] ? <Check className="w-4 h-4" /> : <span className="text-xs font-bold">3</span>}
            </button>

            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MousePointerClick className="w-4 h-4 text-sky-400" />
                  <span>Turn ON "Developer mode"</span>
                </h3>
                <button
                  onClick={() => toggleStep(3)}
                  className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {completedSteps[3] ? "Mark incomplete" : "Mark done"}
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                In the <strong>top-right corner</strong> of <code className="text-sky-300 font-mono">chrome://extensions</code>, flip the <strong>Developer mode</strong> toggle switch to <strong>ON</strong>.
              </p>

              {/* Visual Mockup */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs max-w-sm">
                <span className="text-slate-300 font-medium">Developer mode</span>
                <div className="w-11 h-6 bg-sky-600 rounded-full flex items-center justify-end px-1 shadow-inner">
                  <div className="w-4 h-4 bg-white rounded-full shadow" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 4 */}
        <div
          className={`bg-slate-900 border rounded-2xl p-5 transition-all ${
            completedSteps[4] ? "border-emerald-600/60 bg-slate-900/90" : "border-slate-800"
          }`}
        >
          <div className="flex items-start gap-4">
            <button
              onClick={() => toggleStep(4)}
              className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                completedSteps[4]
                  ? "bg-emerald-600 border-emerald-500 text-white"
                  : "bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-500"
              }`}
            >
              {completedSteps[4] ? <Check className="w-4 h-4" /> : <span className="text-xs font-bold">4</span>}
            </button>

            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FolderArchive className="w-4 h-4 text-sky-400" />
                  <span>Click "Load unpacked" & Pick the Folder</span>
                </h3>
                <button
                  onClick={() => toggleStep(4)}
                  className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {completedSteps[4] ? "Mark incomplete" : "Mark done"}
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                A new toolbar appears at the top left. Click <strong>Load unpacked</strong>, then select the unzipped directory containing <code className="text-sky-300 font-mono">manifest.json</code> and click <strong>Select Folder</strong>.
              </p>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2 text-xs max-w-sm">
                <button className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-sky-400 rounded-lg font-semibold pointer-events-none">
                  Load unpacked
                </button>
                <span className="text-slate-400">← Click this button</span>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 5 */}
        <div
          className={`bg-slate-900 border rounded-2xl p-5 transition-all ${
            completedSteps[5] ? "border-emerald-600/60 bg-slate-900/90" : "border-slate-800"
          }`}
        >
          <div className="flex items-start gap-4">
            <button
              onClick={() => toggleStep(5)}
              className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                completedSteps[5]
                  ? "bg-emerald-600 border-emerald-500 text-white"
                  : "bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-500"
              }`}
            >
              {completedSteps[5] ? <Check className="w-4 h-4" /> : <span className="text-xs font-bold">5</span>}
            </button>

            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Pin className="w-4 h-4 text-emerald-400" />
                  <span>Pin the Extension & You're Protected!</span>
                </h3>
                <button
                  onClick={() => toggleStep(5)}
                  className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {completedSteps[5] ? "Mark incomplete" : "Mark done"}
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Click Chrome's puzzle piece icon (Extensions menu) in the top toolbar and click the <strong>Pin 📌</strong> icon next to PayGuard. Now you can click the shield anytime to check any checkout page!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Google Safe Browsing API Key Guide */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-white">
              Google Cloud API Key Configuration (Optional)
            </h3>
          </div>
          <span className="text-xs text-slate-400">Pre-configured with test vectors</span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          The extension works immediately with standard test URLs out-of-the-box. If you want live Google Cloud lookups on every domain you visit, enter your key below:
        </p>

        <div className="flex flex-col sm:flex-row gap-2 max-w-lg">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Paste Google Cloud Safe Browsing API Key..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono outline-none focus:border-sky-500"
          />
          <button
            onClick={onDownloadZip}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors shrink-0"
          >
            Download ZIP with Key
          </button>
        </div>

        <div className="text-[11px] text-slate-500 leading-relaxed">
          Where to get an API key: Go to <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">console.cloud.google.com</a> → <strong>APIs & Services</strong> → enable <strong>Safe Browsing API</strong> → create an API Key.
        </div>
      </div>
    </div>
  );
};
