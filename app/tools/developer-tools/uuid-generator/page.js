"use client";

import { useState, useEffect } from "react";
import DevToolLayout from "../components/DevToolLayout";

const generateUUID = () => {
  if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
    try {
      return window.crypto.randomUUID();
    } catch (e) {
      // Fallback if secure context check blocks it
    }
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export default function UuidGeneratorPage() {
  const [uuids, setUuids] = useState([]);
  const [count, setCount] = useState(10);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleGenerate = () => {
    const list = [];
    for (let i = 0; i < count; i++) {
      list.push(generateUUID());
    }
    setUuids(list);
  };

  // Generate on first mount
  useEffect(() => {
    handleGenerate();
  }, []);

  const handleReset = () => {
    setCount(10);
    setCopiedIndex(null);
    handleGenerate();
  };

  const handleCopySingle = (uuid, index) => {
    navigator.clipboard.writeText(uuid);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAll = () => {
    if (uuids.length === 0) return;
    navigator.clipboard.writeText(uuids.join("\n"));
    alert("Copied all generated UUIDs to clipboard!");
  };

  const handleDownload = () => {
    if (uuids.length === 0) return;
    const text = uuids.join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `uuids_${count}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sidebarControls = (
    <>
      {/* Count slider */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex justify-between select-none">
          <span>Amount</span>
          <span className="font-mono text-purple-500">{count} UUIDs</span>
        </label>
        <input
          type="range"
          min="1"
          max="100"
          step="1"
          value={count}
          onChange={(e) => setCount(parseInt(e.target.value))}
          className="w-full accent-purple-500 cursor-pointer"
        />
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 mt-4">
        <button
          onClick={handleGenerate}
          className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-purple-600/15"
        >
          <span className="material-symbols-outlined text-[15px]">refresh</span>
          Generate New
        </button>

        <button
          onClick={handleCopyAll}
          disabled={uuids.length === 0}
          className="w-full py-2 bg-zinc-800 hover:bg-zinc-900 dark:bg-zinc-900 dark:hover:bg-zinc-950 border border-zinc-700 disabled:opacity-40 disabled:pointer-events-none text-zinc-350 dark:text-zinc-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[15px]">content_copy</span>
          Copy All
        </button>

        <button
          onClick={handleDownload}
          disabled={uuids.length === 0}
          className="w-full py-2 bg-zinc-850 hover:bg-zinc-950 dark:bg-zinc-900/60 dark:hover:bg-zinc-950/80 border border-zinc-800 disabled:opacity-40 disabled:pointer-events-none text-zinc-350 dark:text-zinc-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[15px]">download</span>
          Download TXT
        </button>
      </div>
    </>
  );

  return (
    <DevToolLayout
      title="UUID v4 Generator"
      description="Generate standard cryptographically secure random UUID version 4 strings in bulk instantly."
      sidebarControls={sidebarControls}
      onReset={handleReset}
    >
      {/* Workspace Display List */}
      <div className="bg-white dark:bg-[#262930] rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col min-h-[350px]">
        {/* Header */}
        <div className="bg-gray-50 dark:bg-zinc-800/80 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center select-none rounded-t-2xl">
          <h3 className="font-extrabold text-zinc-700 dark:text-zinc-300 text-xs">Generated UUID List</h3>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full border border-black/5 dark:border-white/5">
            {uuids.length} Keys
          </span>
        </div>

        {/* List Body */}
        <div className="p-4 flex-grow overflow-y-auto max-h-[360px] space-y-2.5">
          {uuids.map((uuid, idx) => {
            const isCopied = copiedIndex === idx;
            return (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl border border-zinc-150 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/30 hover:border-purple-500/20 hover:bg-purple-500/[0.01] transition-all"
              >
                <div className="flex items-center gap-3 min-w-0 pr-4">
                  <span className="text-[10px] font-mono font-black text-zinc-400 dark:text-zinc-500 w-5 select-none text-right">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 select-all truncate">
                    {uuid}
                  </span>
                </div>

                <button
                  onClick={() => handleCopySingle(uuid, idx)}
                  className={`py-1 px-2.5 rounded-lg border transition-all text-[10px] font-extrabold uppercase tracking-wider cursor-pointer ${
                    isCopied
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                      : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-purple-500 hover:border-purple-500/30"
                  }`}
                >
                  {isCopied ? "Copied" : "Copy"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </DevToolLayout>
  );
}
