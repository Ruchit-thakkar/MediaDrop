"use client";

import { useState, useEffect } from "react";
import UtilityToolLayout from "../components/UtilityToolLayout";

export default function GstCalculatorPage() {
  const [amount, setAmount] = useState("1000");
  const [gstRate, setGstRate] = useState("18"); // 5, 12, 18, 28, or custom
  const [customRate, setCustomRate] = useState("");
  const [isInclusive, setIsInclusive] = useState(false); // Exclusive by default

  const [netAmount, setNetAmount] = useState(0);
  const [gstAmount, setGstAmount] = useState(0);
  const [cgst, setCgst] = useState(0);
  const [sgst, setSgst] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [copiedKey, setCopiedKey] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      setError("");
      const p = Number(amount);
      let r = gstRate === "custom" ? Number(customRate) : Number(gstRate);

      if (isNaN(p) || p < 0) {
        throw new Error("Please enter a valid positive amount.");
      }
      if (isNaN(r) || r < 0 || r > 100) {
        throw new Error("Please enter a valid GST rate percentage (0 - 100).");
      }

      let net = 0;
      let tax = 0;
      let gross = 0;

      if (isInclusive) {
        // GST Inclusive: Amount includes tax
        net = p / (1 + r / 100);
        tax = p - net;
        gross = p;
      } else {
        // GST Exclusive: Tax is added to Amount
        net = p;
        tax = p * (r / 100);
        gross = p + tax;
      }

      setNetAmount(net);
      setGstAmount(tax);
      setCgst(tax / 2);
      setSgst(tax / 2);
      setTotalAmount(gross);

    } catch (err) {
      setError(err.message);
      setNetAmount(0);
      setGstAmount(0);
      setCgst(0);
      setSgst(0);
      setTotalAmount(0);
    }
  }, [amount, gstRate, customRate, isInclusive]);

  const handleReset = () => {
    setAmount("1000");
    setGstRate("18");
    setCustomRate("");
    setIsInclusive(false);
    setError("");
  };

  const handleCopy = (val, key) => {
    if (!val) return;
    navigator.clipboard.writeText(val.toFixed(2));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const formatCurrencyVal = (val) => {
    return val.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const sidebarControls = (
    <div className="space-y-4 select-none">
      {/* Inclusive / Exclusive Toggle */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-555">
          GST Calculation Mode
        </label>
        <div className="grid grid-cols-2 gap-1 bg-black/5 dark:bg-black/25 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setIsInclusive(false)}
            className={`py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-colors cursor-pointer ${
              !isInclusive
                ? "bg-purple-600 text-white shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:text-purple-500 hover:bg-black/5"
            }`}
          >
            Exclusive
          </button>
          <button
            onClick={() => setIsInclusive(true)}
            className={`py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-colors cursor-pointer ${
              isInclusive
                ? "bg-purple-600 text-white shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:text-purple-500 hover:bg-black/5"
            }`}
          >
            Inclusive
          </button>
        </div>
      </div>

      {/* Preset Rates */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-555">
          GST Rate Options
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {["5", "12", "18", "28"].map((rate) => (
            <button
              key={rate}
              onClick={() => setGstRate(rate)}
              className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                gstRate === rate
                  ? "bg-purple-600 text-white"
                  : "bg-black/5 dark:bg-black/20 text-zinc-650 dark:text-zinc-400 hover:bg-black/10 dark:hover:bg-zinc-800"
              }`}
            >
              {rate}%
            </button>
          ))}
          <button
            onClick={() => setGstRate("custom")}
            className={`py-2 col-span-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              gstRate === "custom"
                ? "bg-purple-600 text-white"
                : "bg-black/5 dark:bg-black/20 text-zinc-650 dark:text-zinc-400 hover:bg-black/10 dark:hover:bg-zinc-800"
            }`}
          >
            Custom Rate
          </button>
        </div>
      </div>

      {gstRate === "custom" && (
        <div className="space-y-1.5 animate-fade-in">
          <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-555">
            Enter Tax Rate (%)
          </label>
          <input
            type="text"
            value={customRate}
            onChange={(e) => setCustomRate(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="e.g. 15"
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 focus:outline-none"
          />
        </div>
      )}
    </div>
  );

  return (
    <UtilityToolLayout
      title="GST Calculator"
      description="Calculate inclusive or exclusive Goods and Services Tax (GST) splits locally, including CGST and SGST details."
      sidebarControls={sidebarControls}
      onReset={handleReset}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Input Column */}
        <div className="lg:col-span-1 flex flex-col bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-450 select-none mb-6">Original Amount</span>
          
          <div className="space-y-4 my-auto">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm font-bold text-zinc-400">
                ₹
              </span>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="Enter base price..."
                className="w-full bg-gray-50/50 dark:bg-zinc-900/30 border border-zinc-150 dark:border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 font-mono text-sm font-bold text-zinc-850 dark:text-zinc-200 focus:outline-none focus:border-purple-500/50"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/25 p-3 rounded-xl text-[9px] font-bold text-red-500 uppercase tracking-widest select-none">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Splits Details Output */}
        <div className="lg:col-span-2 bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-between min-h-[300px] select-none">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-450 select-none mb-4">GST Tax Breakdown</span>
          
          <div className="space-y-4 flex-grow flex flex-col justify-center">
            {/* Net Amount / Original */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-2">
              <div className="flex flex-col">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-400">Net price (Original)</span>
                <span className="font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200">{formatCurrencyVal(netAmount)}</span>
              </div>
              <button
                onClick={() => handleCopy(netAmount, "net")}
                className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 hover:text-purple-500 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[13px]">{copiedKey === "net" ? "check" : "content_copy"}</span>
                <span>{copiedKey === "net" ? "Copied" : "Copy"}</span>
              </button>
            </div>

            {/* CGST */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-2">
              <div className="flex flex-col">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-400">CGST (Central Tax)</span>
                <span className="font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200">{formatCurrencyVal(cgst)}</span>
              </div>
              <button
                onClick={() => handleCopy(cgst, "cgst")}
                className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 hover:text-purple-500 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[13px]">{copiedKey === "cgst" ? "check" : "content_copy"}</span>
                <span>{copiedKey === "cgst" ? "Copied" : "Copy"}</span>
              </button>
            </div>

            {/* SGST */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-2">
              <div className="flex flex-col">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-400">SGST (State Tax)</span>
                <span className="font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200">{formatCurrencyVal(sgst)}</span>
              </div>
              <button
                onClick={() => handleCopy(sgst, "sgst")}
                className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 hover:text-purple-500 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[13px]">{copiedKey === "sgst" ? "check" : "content_copy"}</span>
                <span>{copiedKey === "sgst" ? "Copied" : "Copy"}</span>
              </button>
            </div>

            {/* Total GST */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-2">
              <div className="flex flex-col">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-450">Total GST Tax</span>
                <span className="font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200">{formatCurrencyVal(gstAmount)}</span>
              </div>
              <button
                onClick={() => handleCopy(gstAmount, "gst")}
                className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 hover:text-purple-500 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[13px]">{copiedKey === "gst" ? "check" : "content_copy"}</span>
                <span>{copiedKey === "gst" ? "Copied" : "Copy"}</span>
              </button>
            </div>

            {/* Gross Total */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex flex-col">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-purple-500">Gross Total Amount</span>
                <span className="font-mono text-lg font-black text-purple-600 dark:text-purple-400">{formatCurrencyVal(totalAmount)}</span>
              </div>
              <button
                onClick={() => handleCopy(totalAmount, "total")}
                className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 hover:text-purple-500 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[13px]">{copiedKey === "total" ? "check" : "content_copy"}</span>
                <span>{copiedKey === "total" ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </UtilityToolLayout>
  );
}
