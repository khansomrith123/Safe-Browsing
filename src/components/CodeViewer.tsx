import React, { useState } from "react";
import { getCustomizedExtensionFiles, ExtensionFile } from "../extensionCode";
import { Copy, Check, Download, FileCode, FileJson, FileText, Key } from "lucide-react";
import { downloadBlob } from "../utils/extensionZip";

interface CodeViewerProps {
  apiKey: string;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ apiKey }) => {
  const currentFiles = getCustomizedExtensionFiles(apiKey);
  const fileKeys = Object.keys(currentFiles);
  const [activeFileName, setActiveFileName] = useState<string>("manifest.json");
  const [copied, setCopied] = useState(false);

  const activeFile = currentFiles[activeFileName] || currentFiles["manifest.json"];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSingle = () => {
    const blob = new Blob([activeFile.content], { type: "text/plain;charset=utf-8" });
    downloadBlob(blob, activeFile.name);
  };

  const getFileIcon = (filename: string) => {
    if (filename.endsWith(".json")) return <FileJson className="w-4 h-4 text-amber-400" />;
    if (filename.endsWith(".html")) return <FileCode className="w-4 h-4 text-orange-400" />;
    if (filename.endsWith(".css")) return <FileCode className="w-4 h-4 text-sky-400" />;
    if (filename.endsWith(".md")) return <FileText className="w-4 h-4 text-emerald-400" />;
    return <FileCode className="w-4 h-4 text-yellow-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-base font-bold text-white">Manifest V3 Extension Source Files</h2>
            {apiKey && apiKey.trim() && apiKey.trim() !== "YOUR_API_KEY" && (
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Key className="w-3 h-3" />
                Custom Key Baked In
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Clean, modular Manifest V3 architecture. Copy each file directly or download the full ZIP to load straight into Google Chrome.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Current File</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadSingle}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download {activeFile.name}</span>
          </button>
        </div>
      </div>

      {/* Editor Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* File Navigator Sidebar */}
        <div className="lg:col-span-3 space-y-2">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2">
            Project Files
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 space-y-1">
            {fileKeys.map((name) => {
              const file = currentFiles[name];
              const isSelected = activeFileName === name;
              return (
                <button
                  key={name}
                  onClick={() => {
                    setActiveFileName(name);
                    setCopied(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-mono transition-colors text-left cursor-pointer ${
                    isSelected
                      ? "bg-slate-800 text-sky-300 font-semibold shadow-sm border border-slate-700/60"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                  }`}
                >
                  {getFileIcon(name)}
                  <span className="truncate">{file.name}</span>
                </button>
              );
            })}
          </div>

          {/* Active File Context Pill */}
          <div className="p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-1.5">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              File Purpose
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {activeFile.description}
            </p>
          </div>
        </div>

        {/* Code Content Container */}
        <div className="lg:col-span-9 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
          {/* Top Bar of Code Window */}
          <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getFileIcon(activeFile.name)}
              <span className="text-xs font-mono font-semibold text-white">{activeFile.name}</span>
              <span className="text-[11px] text-slate-500 font-sans">
                ({activeFile.content.split("\n").length} lines)
              </span>
            </div>

            <button
              onClick={handleCopy}
              className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>

          {/* Code Text with Line Numbers */}
          <div className="p-4 bg-slate-950/70 overflow-x-auto max-h-[600px] overflow-y-auto font-mono text-xs leading-relaxed text-slate-300 select-text">
            <pre className="flex">
              {/* Line numbers column */}
              <span className="select-none text-slate-600 text-right pr-4 border-r border-slate-800/80 font-mono shrink-0">
                {activeFile.content.split("\n").map((_, i) => (
                  <span key={i} className="block leading-relaxed">
                    {i + 1}
                  </span>
                ))}
              </span>

              {/* Code content */}
              <code className="pl-4 font-mono leading-relaxed block overflow-x-auto whitespace-pre">
                {activeFile.content}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
