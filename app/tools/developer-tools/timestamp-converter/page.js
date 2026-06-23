"use client";

import { useState, useEffect } from "react";
import DevToolLayout from "../components/DevToolLayout";

export default function TimestampConverterPage() {
  const [dateInput, setDateInput] = useState("");
  const [timestampSeconds, setTimestampSeconds] = useState("");
  const [timestampMs, setTimestampMs] = useState("");
  const [isoString, setIsoString] = useState("");
  const [utcString, setUtcString] = useState("");
  const [localString, setLocalString] = useState("");
  const [error, setError] = useState("");
  const [copiedKey, setCopiedKey] = useState(null);

  // Set default to current time on mount
  useEffect(() => {
    const now = new Date();
    setDateInput(now.toString());
  }, []);

  useEffect(() => {
    if (!dateInput.trim()) {
      setTimestampSeconds("");
      setTimestampMs("");
      setIsoString("");
      setUtcString("");
      setLocalString("");
      setError("");
      return;
    }

    try {
      setError("");
      const parsedDate = new Date(dateInput);
      if (isNaN(parsedDate.getTime())) {
        throw new Error("Could not parse date string. Try ISO (YYYY-MM-DDTHH:mm:ssZ) or a standard date format.");
      }

      const timeVal = parsedDate.getTime();
      setTimestampSeconds(Math.floor(timeVal / 1000).toString());
      setTimestampMs(timeVal.toString());
      setIsoString(parsedDate.toISOString());
      setUtcString(parsedDate.toUTCString());
      setLocalString(parsedDate.toString());

    } catch (err) {
      setError(err.message);
      setTimestampSeconds("");
      setTimestampMs("");
      setIsoString("");
      setUtcString("");
      setLocalString("");
    }
  }, [dateInput]);

  const handleReset = () => {
    const now = new Date();
    setDateInput(now.toString());
    setError("");
  };

  const handleCopy = (val, key) => {
    if (!val) return;
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleSetCurrent = () => {
    setDateInput(new Date().toString());
  };

  const sidebarControls = (
    <div className="space-y-2 select-none">
      <button
        onClick={handleSetCurrent}
        className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-purple-600/15"
      >
        <span className="material-symbols-outlined text-[15px]">schedule</span>
        Use Current Time
      </button>
    </div>
  );

  return (
    <DevToolLayout
      title="Date to Timestamp Converter"
      description="Translate standard human-readable date-time strings into Unix epoch timestamps (seconds and milliseconds) client-side."
      sidebarControls={sidebarControls}
      onReset={handleReset}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        
        {/* Date Input Column */}
        <div className="flex flex-col bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden h-[380px]">
          <div className="bg-gray-50 dark:bg-zinc-800/80 px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center select-none">
            <h3 className="font-extrabold text-zinc-700 dark:text-zinc-300 text-xs">Human Date String</h3>
            <button
              onClick={() => setDateInput("")}
              disabled={!dateInput}
              className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-450 hover:text-red-500 disabled:opacity-40 transition-colors flex items-center gap-0.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[12px]">delete</span>
              Clear
            </button>
          </div>
          <textarea
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            placeholder="Type your date string (e.g. 2026-06-23 17:51:06, ISO formats, UTC string, or browser date format)..."
            className="w-full flex-grow p-4 bg-transparent text-zinc-800 dark:text-zinc-200 text-xs font-mono placeholder-zinc-400 focus:outline-none resize-none leading-relaxed"
          />
          {error && (
            <div className="bg-red-500/10 border-t border-red-500/25 p-3 text-[9px] font-bold text-red-500 uppercase tracking-widest select-none">
              {error}
            </div>
          )}
        </div>

        {/* Timestamps Output Column */}
        <div className="bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-between min-h-[380px]">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-450 select-none font-bold">Epoch & ISO Formats</span>
          
          <div className="space-y-4 flex-grow flex flex-col justify-center">
            {/* Seconds */}
            <div className="flex flex-col gap-1 w-full">
              <div className="flex justify-between text-[10px] font-bold text-zinc-400 dark:text-zinc-550 select-none">
                <span>UNIX EPOCH (SECONDS)</span>
                <button
                  onClick={() => handleCopy(timestampSeconds, "secs")}
                  className="flex items-center gap-1 hover:text-purple-500 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[12px]">{copiedKey === "secs" ? "check" : "content_copy"}</span>
                  <span>{copiedKey === "secs" ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <div className="flex items-center bg-gray-50/50 dark:bg-zinc-900/30 border border-zinc-150 dark:border-zinc-800 rounded-xl px-3 py-1.5 font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200 min-h-[32px]">
                {timestampSeconds}
              </div>
            </div>

            {/* Milliseconds */}
            <div className="flex flex-col gap-1 w-full">
              <div className="flex justify-between text-[10px] font-bold text-zinc-400 dark:text-zinc-550 select-none">
                <span>UNIX EPOCH (MILLISECONDS)</span>
                <button
                  onClick={() => handleCopy(timestampMs, "ms")}
                  className="flex items-center gap-1 hover:text-purple-500 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[12px]">{copiedKey === "ms" ? "check" : "content_copy"}</span>
                  <span>{copiedKey === "ms" ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <div className="flex items-center bg-gray-50/50 dark:bg-zinc-900/30 border border-zinc-150 dark:border-zinc-800 rounded-xl px-3 py-1.5 font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200 min-h-[32px]">
                {timestampMs}
              </div>
            </div>

            {/* ISO */}
            <div className="flex flex-col gap-1 w-full">
              <div className="flex justify-between text-[10px] font-bold text-zinc-400 dark:text-zinc-550 select-none">
                <span>ISO 8601 STRING</span>
                <button
                  onClick={() => handleCopy(isoString, "iso")}
                  className="flex items-center gap-1 hover:text-purple-500 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[12px]">{copiedKey === "iso" ? "check" : "content_copy"}</span>
                  <span>{copiedKey === "iso" ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <div className="flex items-center bg-gray-50/50 dark:bg-zinc-900/30 border border-zinc-150 dark:border-zinc-800 rounded-xl px-3 py-1.5 font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200 min-h-[32px]">
                {isoString}
              </div>
            </div>
          </div>
        </div>

      </div>
    </DevToolLayout>
  );
}
