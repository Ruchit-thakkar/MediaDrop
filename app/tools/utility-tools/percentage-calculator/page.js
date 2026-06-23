"use client";

import { useState, useEffect } from "react";
import UtilityToolLayout from "../components/UtilityToolLayout";

export default function PercentageCalculatorPage() {
  // Calculator 1: A% of B
  const [c1A, setC1A] = useState("25");
  const [c1B, setC1B] = useState("400");
  const [c1Res, setC1Res] = useState("");

  // Calculator 2: A is what % of B
  const [c2A, setC2A] = useState("50");
  const [c2B, setC2B] = useState("200");
  const [c2Res, setC2Res] = useState("");

  // Calculator 3: % Increase/Decrease from A to B
  const [c3A, setC3A] = useState("100");
  const [c3B, setC3B] = useState("150");
  const [c3Res, setC3Res] = useState("");
  const [c3Direction, setC3Direction] = useState("increase"); // increase, decrease, no change

  // Calculator 4: Add/Subtract B% to/from A
  const [c4A, setC4A] = useState("200");
  const [c4B, setC4B] = useState("15");
  const [c4Op, setC4Op] = useState("add"); // add, subtract
  const [c4Res, setC4Res] = useState("");

  const [copiedKey, setCopiedKey] = useState(null);

  // Calc 1
  useEffect(() => {
    const a = Number(c1A);
    const b = Number(c1B);
    if (isNaN(a) || isNaN(b)) {
      setC1Res("");
      return;
    }
    const val = (a / 100) * b;
    setC1Res(parseFloat(val.toFixed(8)).toString());
  }, [c1A, c1B]);

  // Calc 2
  useEffect(() => {
    const a = Number(c2A);
    const b = Number(c2B);
    if (isNaN(a) || isNaN(b) || b === 0) {
      setC2Res("");
      return;
    }
    const val = (a / b) * 100;
    setC2Res(parseFloat(val.toFixed(8)).toString());
  }, [c2A, c2B]);

  // Calc 3
  useEffect(() => {
    const a = Number(c3A);
    const b = Number(c3B);
    if (isNaN(a) || isNaN(b) || a === 0) {
      setC3Res("");
      setC3Direction("no change");
      return;
    }
    const diff = b - a;
    const pct = (diff / a) * 100;
    
    if (pct > 0) {
      setC3Direction("increase");
    } else if (pct < 0) {
      setC3Direction("decrease");
    } else {
      setC3Direction("no change");
    }

    setC3Res(parseFloat(Math.abs(pct).toFixed(8)).toString());
  }, [c3A, c3B]);

  // Calc 4
  useEffect(() => {
    const a = Number(c4A);
    const b = Number(c4B);
    if (isNaN(a) || isNaN(b)) {
      setC4Res("");
      return;
    }
    const factor = b / 100;
    const val = c4Op === "add" ? a * (1 + factor) : a * (1 - factor);
    setC4Res(parseFloat(val.toFixed(8)).toString());
  }, [c4A, c4B, c4Op]);

  const handleReset = () => {
    setC1A("25"); setC1B("400");
    setC2A("50"); setC2B("200");
    setC3A("100"); setC3B("150");
    setC4A("200"); setC4B("15"); setC4Op("add");
  };

  const handleCopy = (val, key) => {
    if (!val) return;
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <UtilityToolLayout
      title="Percentage Calculator"
      description="Perform common percentage operations like proportions, increases, decreases, and adjustments client-side."
      onReset={handleReset}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch select-none">
        
        {/* Calculator 1: What is A% of B? */}
        <div className="bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 flex flex-col justify-between h-[210px]">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">Calculate percentage value</span>
            <button
              onClick={() => handleCopy(c1Res, "c1")}
              className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 dark:text-zinc-550 hover:text-purple-500 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[13px]">{copiedKey === "c1" ? "check" : "content_copy"}</span>
              <span>{copiedKey === "c1" ? "Copied" : "Copy"}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-zinc-500 font-semibold">What is</span>
            <input
              type="text"
              value={c1A}
              onChange={(e) => setC1A(e.target.value.replace(/[^0-9.]/g, ""))}
              className="w-16 bg-gray-50/50 dark:bg-zinc-900/30 border border-zinc-150 dark:border-zinc-800 rounded-xl px-2 py-1 font-mono text-xs font-bold text-center text-zinc-850 dark:text-zinc-200 focus:outline-none focus:border-purple-500/50"
            />
            <span className="text-xs text-zinc-500 font-semibold">% of</span>
            <input
              type="text"
              value={c1B}
              onChange={(e) => setC1B(e.target.value.replace(/[^0-9.]/g, ""))}
              className="w-24 bg-gray-50/50 dark:bg-zinc-900/30 border border-zinc-150 dark:border-zinc-800 rounded-xl px-2 py-1 font-mono text-xs font-bold text-center text-zinc-850 dark:text-zinc-200 focus:outline-none focus:border-purple-500/50"
            />
            <span className="text-xs text-zinc-500 font-semibold">?</span>
          </div>

          <div className="bg-purple-500/5 dark:bg-purple-500/[0.02] border border-purple-500/10 rounded-xl p-3 font-mono text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center justify-between">
            <span>Result:</span>
            <span>{c1Res || "0"}</span>
          </div>
        </div>

        {/* Calculator 2: A is what % of B? */}
        <div className="bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 flex flex-col justify-between h-[210px]">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">Calculate percentage ratio</span>
            <button
              onClick={() => handleCopy(c2Res + "%", "c2")}
              className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 dark:text-zinc-550 hover:text-purple-500 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[13px]">{copiedKey === "c2" ? "check" : "content_copy"}</span>
              <span>{copiedKey === "c2" ? "Copied" : "Copy"}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <input
              type="text"
              value={c2A}
              onChange={(e) => setC2A(e.target.value.replace(/[^0-9.]/g, ""))}
              className="w-20 bg-gray-50/50 dark:bg-zinc-900/30 border border-zinc-150 dark:border-zinc-800 rounded-xl px-2 py-1 font-mono text-xs font-bold text-center text-zinc-850 dark:text-zinc-200 focus:outline-none focus:border-purple-500/50"
            />
            <span className="text-xs text-zinc-500 font-semibold">is what % of</span>
            <input
              type="text"
              value={c2B}
              onChange={(e) => setC2B(e.target.value.replace(/[^0-9.]/g, ""))}
              className="w-20 bg-gray-50/50 dark:bg-zinc-900/30 border border-zinc-150 dark:border-zinc-800 rounded-xl px-2 py-1 font-mono text-xs font-bold text-center text-zinc-850 dark:text-zinc-200 focus:outline-none focus:border-purple-500/50"
            />
            <span className="text-xs text-zinc-500 font-semibold">?</span>
          </div>

          <div className="bg-purple-500/5 dark:bg-purple-500/[0.02] border border-purple-500/10 rounded-xl p-3 font-mono text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center justify-between">
            <span>Result:</span>
            <span>{c2Res ? `${c2Res}%` : "0%"}</span>
          </div>
        </div>

        {/* Calculator 3: % Increase/Decrease from A to B */}
        <div className="bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 flex flex-col justify-between h-[210px]">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">Calculate percentage change</span>
            <button
              onClick={() => handleCopy(c3Res + "%", "c3")}
              className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 dark:text-zinc-555 hover:text-purple-500 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[13px]">{copiedKey === "c3" ? "check" : "content_copy"}</span>
              <span>{copiedKey === "c3" ? "Copied" : "Copy"}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-zinc-500 font-semibold">Change from</span>
            <input
              type="text"
              value={c3A}
              onChange={(e) => setC3A(e.target.value.replace(/[^0-9.]/g, ""))}
              className="w-20 bg-gray-50/50 dark:bg-zinc-900/30 border border-zinc-150 dark:border-zinc-800 rounded-xl px-2 py-1 font-mono text-xs font-bold text-center text-zinc-850 dark:text-zinc-200 focus:outline-none focus:border-purple-500/50"
            />
            <span className="text-xs text-zinc-500 font-semibold">to</span>
            <input
              type="text"
              value={c3B}
              onChange={(e) => setC3B(e.target.value.replace(/[^0-9.]/g, ""))}
              className="w-20 bg-gray-50/50 dark:bg-zinc-900/30 border border-zinc-150 dark:border-zinc-800 rounded-xl px-2 py-1 font-mono text-xs font-bold text-center text-zinc-850 dark:text-zinc-200 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          <div className="bg-purple-500/5 dark:bg-purple-500/[0.02] border border-purple-500/10 rounded-xl p-3 font-mono text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center justify-between">
            <span>Result:</span>
            <span className="flex items-center gap-1.5">
              <span>{c3Res ? `${c3Res}%` : "0%"}</span>
              {c3Res && c3Direction !== "no change" && (
                <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${
                  c3Direction === "increase" ? "text-emerald-500 bg-emerald-500/10" : "text-red-500 bg-red-500/10"
                }`}>
                  {c3Direction}
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Calculator 4: Add/Subtract B% to/from A */}
        <div className="bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 flex flex-col justify-between h-[210px]">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">Calculate value offset</span>
            <button
              onClick={() => handleCopy(c4Res, "c4")}
              className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 dark:text-zinc-555 hover:text-purple-500 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[13px]">{copiedKey === "c4" ? "check" : "content_copy"}</span>
              <span>{copiedKey === "c4" ? "Copied" : "Copy"}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-zinc-500 font-semibold">Value</span>
            <input
              type="text"
              value={c4A}
              onChange={(e) => setC4A(e.target.value.replace(/[^0-9.]/g, ""))}
              className="w-20 bg-gray-50/50 dark:bg-zinc-900/30 border border-zinc-150 dark:border-zinc-800 rounded-xl px-2 py-1 font-mono text-xs font-bold text-center text-zinc-850 dark:text-zinc-200 focus:outline-none focus:border-purple-500/50"
            />
            <select
              value={c4Op}
              onChange={(e) => setC4Op(e.target.value)}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2 py-1 text-xs font-bold text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
            >
              <option value="add">Add (+)</option>
              <option value="subtract">Subtract (-)</option>
            </select>
            <input
              type="text"
              value={c4B}
              onChange={(e) => setC4B(e.target.value.replace(/[^0-9.]/g, ""))}
              className="w-16 bg-gray-50/50 dark:bg-zinc-900/30 border border-zinc-150 dark:border-zinc-800 rounded-xl px-2 py-1 font-mono text-xs font-bold text-center text-zinc-850 dark:text-zinc-200 focus:outline-none focus:border-purple-500/50"
            />
            <span className="text-xs text-zinc-500 font-semibold">%</span>
          </div>

          <div className="bg-purple-500/5 dark:bg-purple-500/[0.02] border border-purple-500/10 rounded-xl p-3 font-mono text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center justify-between">
            <span>Result:</span>
            <span>{c4Res || "0"}</span>
          </div>
        </div>

      </div>
    </UtilityToolLayout>
  );
}
