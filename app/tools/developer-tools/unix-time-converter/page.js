"use client";

import { useState, useEffect } from "react";
import DevToolLayout from "../components/DevToolLayout";

export default function UnixTimeConverterPage() {
  const [epochInput, setEpochInput] = useState("");
  const [unitMode, setUnitMode] = useState("auto"); // auto, seconds, ms
  const [detectedUnit, setDetectedUnit] = useState("seconds");
  const [localString, setLocalString] = useState("");
  const [utcString, setUtcString] = useState("");
  const [isoString, setIsoString] = useState("");
  const [relativeTime, setRelativeTime] = useState("");
  const [breakdown, setBreakdown] = useState(null);
  const [error, setError] = useState("");
  const [copiedKey, setCopiedKey] = useState(null);

  // Set initial to current timestamp on mount
  useEffect(() => {
    setEpochInput(Math.floor(Date.now() / 1000).toString());
  }, []);

  useEffect(() => {
    if (!epochInput.trim()) {
      setLocalString("");
      setUtcString("");
      setIsoString("");
      setRelativeTime("");
      setBreakdown(null);
      setError("");
      return;
    }

    try {
      setError("");
      const numericVal = Number(epochInput);
      if (isNaN(numericVal)) {
        throw new Error("Please enter a valid numeric epoch timestamp.");
      }

      // Determine unit (Seconds vs Milliseconds)
      let isMs = false;
      if (unitMode === "ms") {
        isMs = true;
      } else if (unitMode === "seconds") {
        isMs = false;
      } else {
        // Auto-detect: if length > 11 or value > 50,000,000,000 (roughly year 3550 in seconds), treat as ms
        isMs = epochInput.trim().length > 11 || numericVal > 50000000000;
      }

      setDetectedUnit(isMs ? "milliseconds" : "seconds");

      const timeVal = isMs ? numericVal : numericVal * 1000;
      const parsedDate = new Date(timeVal);

      if (isNaN(parsedDate.getTime())) {
        throw new Error("Invalid timestamp value. Out of date range.");
      }

      setLocalString(parsedDate.toString());
      setUtcString(parsedDate.toUTCString());
      setIsoString(parsedDate.toISOString());

      // Calculate relative time
      const diffMs = timeVal - Date.now();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHrs = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHrs / 24);

      let relStr = "";
      if (Math.abs(diffSecs) < 5) {
        relStr = "just now";
      } else if (Math.abs(diffSecs) < 60) {
        relStr = diffSecs > 0 ? `in ${diffSecs} seconds` : `${Math.abs(diffSecs)} seconds ago`;
      } else if (Math.abs(diffMins) < 60) {
        relStr = diffMins > 0 ? `in ${diffMins} minutes` : `${Math.abs(diffMins)} minutes ago`;
      } else if (Math.abs(diffHrs) < 24) {
        relStr = diffHrs > 0 ? `in ${diffHrs} hours` : `${Math.abs(diffHrs)} hours ago`;
      } else {
        relStr = diffDays > 0 ? `in ${diffDays} days` : `${Math.abs(diffDays)} days ago`;
      }
      setRelativeTime(relStr);

      // Components breakdown
      const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

      setBreakdown({
        year: parsedDate.getFullYear(),
        month: `${months[parsedDate.getMonth()]} (${String(parsedDate.getMonth() + 1).padStart(2, '0')})`,
        day: String(parsedDate.getDate()).padStart(2, '0'),
        weekday: weekdays[parsedDate.getDay()],
        hours: String(parsedDate.getHours()).padStart(2, '0'),
        minutes: String(parsedDate.getMinutes()).padStart(2, '0'),
        seconds: String(parsedDate.getSeconds()).padStart(2, '0'),
        ms: String(parsedDate.getMilliseconds()).padStart(3, '0'),
        offset: parsedDate.getTimezoneOffset()
      });

    } catch (err) {
      setError(err.message);
      setLocalString("");
      setUtcString("");
      setIsoString("");
      setRelativeTime("");
      setBreakdown(null);
    }
  }, [epochInput, unitMode]);

  const handleReset = () => {
    setEpochInput(Math.floor(Date.now() / 1000).toString());
    setUnitMode("auto");
    setError("");
  };

  const handleCopy = (val, key) => {
    if (!val) return;
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleSetCurrent = () => {
    const isMs = unitMode === "ms" || (unitMode === "auto" && detectedUnit === "milliseconds");
    const now = Date.now();
    setEpochInput(isMs ? now.toString() : Math.floor(now / 1000).toString());
  };

  const sidebarControls = (
    <div className="space-y-4 select-none">
      <div className="space-y-1.5">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-550">
          Timestamp Unit
        </label>
        <div className="grid grid-cols-3 gap-1 bg-black/5 dark:bg-black/25 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
          {["auto", "seconds", "ms"].map((mode) => (
            <button
              key={mode}
              onClick={() => setUnitMode(mode)}
              className={`py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-colors cursor-pointer ${
                unitMode === mode
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-purple-500 hover:bg-black/5"
              }`}
            >
              {mode === "auto" ? "Auto" : mode === "seconds" ? "Sec" : "Ms"}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSetCurrent}
        className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-purple-600/15"
      >
        <span className="material-symbols-outlined text-[15px]">schedule</span>
        Use Current Time
      </button>

      {epochInput && !error && (
        <div className="bg-purple-500/5 dark:bg-purple-500/5 border border-purple-500/10 rounded-xl p-3 text-[10px] text-zinc-500 dark:text-zinc-450 leading-relaxed font-semibold">
          <div className="flex justify-between mb-1">
            <span>Detected unit:</span>
            <span className="font-bold text-purple-500 capitalize">{detectedUnit}</span>
          </div>
          <div className="flex justify-between">
            <span>Relative:</span>
            <span className="font-bold text-zinc-700 dark:text-zinc-300 capitalize">{relativeTime}</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <DevToolLayout
      title="Unix Epoch Time Converter"
      description="Convert Unix timestamp epochs (seconds or milliseconds) into structured, readable local, UTC, and relative date-time parts."
      sidebarControls={sidebarControls}
      onReset={handleReset}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        
        {/* Epoch Input Column */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden h-[180px]">
            <div className="bg-gray-50 dark:bg-zinc-800/80 px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center select-none">
              <h3 className="font-extrabold text-zinc-700 dark:text-zinc-300 text-xs">Enter Unix Timestamp</h3>
              <button
                onClick={() => setEpochInput("")}
                disabled={!epochInput}
                className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-450 hover:text-red-500 disabled:opacity-40 transition-colors flex items-center gap-0.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[12px]">delete</span>
                Clear
              </button>
            </div>
            <textarea
              value={epochInput}
              onChange={(e) => setEpochInput(e.target.value.replace(/[^0-9\-]/g, ""))}
              placeholder="e.g. 1782207948 or 1782207948000"
              className="w-full flex-grow p-4 bg-transparent text-zinc-800 dark:text-zinc-200 text-sm font-mono placeholder-zinc-450 focus:outline-none resize-none leading-relaxed"
            />
            {error && (
              <div className="bg-red-500/10 border-t border-red-500/25 p-3 text-[9px] font-bold text-red-500 uppercase tracking-widest select-none">
                {error}
              </div>
            )}
          </div>

          {/* Time breakdown details */}
          <div className="bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-between flex-grow">
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-450 select-none font-bold mb-4">Time breakdown</span>
            
            {breakdown ? (
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 font-semibold text-xs leading-relaxed text-zinc-650 dark:text-zinc-400">
                <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Year</span>
                  <span className="font-mono text-zinc-800 dark:text-zinc-200">{breakdown.year}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Month</span>
                  <span className="font-mono text-zinc-800 dark:text-zinc-200">{breakdown.month}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Day</span>
                  <span className="font-mono text-zinc-800 dark:text-zinc-200">{breakdown.day}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Weekday</span>
                  <span className="text-zinc-800 dark:text-zinc-200">{breakdown.weekday}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Hours</span>
                  <span className="font-mono text-zinc-800 dark:text-zinc-200">{breakdown.hours}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Minutes</span>
                  <span className="font-mono text-zinc-800 dark:text-zinc-200">{breakdown.minutes}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Seconds</span>
                  <span className="font-mono text-zinc-800 dark:text-zinc-200">{breakdown.seconds}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Milliseconds</span>
                  <span className="font-mono text-zinc-800 dark:text-zinc-200">{breakdown.ms}</span>
                </div>
                <div className="flex justify-between col-span-2 pt-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Timezone Offset</span>
                  <span className="font-mono text-zinc-850 dark:text-zinc-250">
                    {breakdown.offset > 0 ? "-" : "+"}
                    {String(Math.abs(Math.floor(breakdown.offset / 60))).padStart(2, "0")}
                    :{String(Math.abs(breakdown.offset % 60)).padStart(2, "0")} (GMT{breakdown.offset > 0 ? "" : "+"}{-breakdown.offset / 60} hours)
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex-grow flex items-center justify-center text-zinc-400 text-xs italic py-6 select-none">
                Enter a valid timestamp above
              </div>
            )}
          </div>
        </div>

        {/* Timestamps Output Column */}
        <div className="bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-between min-h-[380px]">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-450 select-none font-bold">Standard Formats</span>
          
          <div className="space-y-4 flex-grow flex flex-col justify-center">
            {/* UTC string */}
            <div className="flex flex-col gap-1 w-full">
              <div className="flex justify-between text-[10px] font-bold text-zinc-400 dark:text-zinc-550 select-none">
                <span>UTC / GMT STRING</span>
                <button
                  onClick={() => handleCopy(utcString, "utc")}
                  className="flex items-center gap-1 hover:text-purple-500 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[12px]">{copiedKey === "utc" ? "check" : "content_copy"}</span>
                  <span>{copiedKey === "utc" ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <div className="flex items-center bg-gray-50/50 dark:bg-zinc-900/30 border border-zinc-150 dark:border-zinc-800 rounded-xl px-3 py-1.5 font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200 min-h-[32px]">
                {utcString}
              </div>
            </div>

            {/* ISO string */}
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

            {/* Local String */}
            <div className="flex flex-col gap-1 w-full">
              <div className="flex justify-between text-[10px] font-bold text-zinc-400 dark:text-zinc-550 select-none">
                <span>LOCAL TIMEZONE STRING</span>
                <button
                  onClick={() => handleCopy(localString, "local")}
                  className="flex items-center gap-1 hover:text-purple-500 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[12px]">{copiedKey === "local" ? "check" : "content_copy"}</span>
                  <span>{copiedKey === "local" ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <div className="flex items-center bg-gray-50/50 dark:bg-zinc-900/30 border border-zinc-150 dark:border-zinc-800 rounded-xl px-3 py-1.5 font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200 min-h-[32px]">
                {localString}
              </div>
            </div>
          </div>
        </div>

      </div>
    </DevToolLayout>
  );
}
