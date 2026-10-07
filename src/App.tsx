import React, { useState } from "react";
import { Header } from "./components/Header";
import { Simulator } from "./components/Simulator";
import { CodeViewer } from "./components/CodeViewer";
import { InstallGuide } from "./components/InstallGuide";
import { generateExtensionZip, downloadBlob } from "./utils/extensionZip";
import { Check, ShieldCheck, Download, ExternalLink, Sparkles } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"simulator" | "code" | "guide">("simulator");
  const [apiKey, setApiKey] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownloadZip = async () => {
    try {
      setIsDownloading(true);
      const zipBlob = await generateExtensionZip(apiKey);
      downloadBlob(zipBlob, "payguard-chrome-extension-mv3.zip");
      setIsDownloading(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (err) {
      console.error("Failed to generate zip:", err);
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500/20 selection:text-sky-300">
      {/* Top Bar Contract (Wordmark - Navigation - Action) */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onDownloadZip={handleDownloadZip}
        isDownloading={isDownloading}
      />

      {/* Download Feedback Notification Toast */}
      {downloadSuccess && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-950 border border-emerald-500 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs animate-in slide-in-from-top duration-200">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <Check className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-bold text-white">Extension Package Downloaded!</div>
            <div className="text-[11px] text-emerald-300">
              Unzip the folder and load into <code className="font-mono">chrome://extensions</code>.
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === "simulator" && (
          <Simulator apiKey={apiKey} setApiKey={setApiKey} />
        )}
        {activeTab === "code" && <CodeViewer apiKey={apiKey} />}
        {activeTab === "guide" && (
          <InstallGuide
            onDownloadZip={handleDownloadZip}
            apiKey={apiKey}
            setApiKey={setApiKey}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">PayGuard Payment Safety Guard</span>
            <span aria-hidden="true">·</span>
            <span>Manifest V3</span>
            <span aria-hidden="true">·</span>
            <span>Google Safe Browsing v4</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setActiveTab("guide")}
              className="hover:text-slate-200 transition-colors cursor-pointer"
            >
              60-Second Setup Wizard
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setActiveTab("code")}
              className="hover:text-slate-200 transition-colors cursor-pointer"
            >
              Source Code
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={handleDownloadZip}
              className="hover:text-slate-200 transition-colors cursor-pointer text-sky-400"
            >
              Download ZIP
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
