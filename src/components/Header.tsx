import React from "react";
import { ShieldCheck, Download, Code2, PlayCircle, BookOpen } from "lucide-react";

interface HeaderProps {
  activeTab: "simulator" | "code" | "guide";
  setActiveTab: (tab: "simulator" | "code" | "guide") => void;
  onDownloadZip: () => void;
  isDownloading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onDownloadZip,
  isDownloading
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="text-base font-bold tracking-tight text-white">
            PayGuard <span className="text-xs font-normal text-slate-400 ml-1">Manifest V3</span>
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("simulator")}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === "simulator"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <PlayCircle className="w-3.5 h-3.5 text-sky-400" />
            <span>Live Studio & Sandbox</span>
          </button>

          <button
            onClick={() => setActiveTab("code")}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === "code"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Extension Source Code</span>
          </button>

          <button
            onClick={() => setActiveTab("guide")}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === "guide"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>60-Second Setup Wizard</span>
          </button>
        </nav>

        {/* Zone 3: Primary action button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onDownloadZip}
            disabled={isDownloading}
            className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 disabled:opacity-50 rounded-xl transition-colors flex items-center gap-2 shadow-sm whitespace-nowrap cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDownloading ? "Bundling..." : "Download Extension (.zip)"}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
