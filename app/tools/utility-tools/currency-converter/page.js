"use client";

import { useState, useEffect } from "react";
import UtilityToolLayout from "../components/UtilityToolLayout";

const CURRENCIES = {
  USD: { name: "US Dollar", symbol: "$" },
  INR: { name: "Indian Rupee", symbol: "₹" },
  EUR: { name: "Euro", symbol: "€" },
  GBP: { name: "British Pound", symbol: "£" },
  AED: { name: "UAE Dirham", symbol: "د.إ" },
  JPY: { name: "Japanese Yen", symbol: "¥" }
};

// Hardcoded fallback rates (based on 1 USD)
const FALLBACK_RATES = {
  USD: 1.0,
  INR: 83.50,
  EUR: 0.92,
  GBP: 0.79,
  AED: 3.67,
  JPY: 158.0
};

export default function CurrencyConverterPage() {
  const [amount, setAmount] = useState("100");
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("INR");
  const [rates, setRates] = useState(FALLBACK_RATES);
  const [status, setStatus] = useState("loading"); // loading, live, cached, fallback
  const [lastUpdated, setLastUpdated] = useState(null);
  const [convertedAmount, setConvertedAmount] = useState("");
  const [copiedKey, setCopiedKey] = useState(null);

  const fetchRates = async (force = false) => {
    try {
      setStatus("loading");
      
      // Check cache first if not forced
      if (!force) {
        const cached = localStorage.getItem("mediadrop_exchange_rates");
        if (cached) {
          const parsed = JSON.parse(cached);
          const cacheAgeMs = Date.now() - parsed.timestamp;
          const twentyFourHours = 24 * 60 * 60 * 1000;
          
          if (cacheAgeMs < twentyFourHours && parsed.rates) {
            setRates(parsed.rates);
            setLastUpdated(new Date(parsed.timestamp));
            setStatus("cached");
            return;
          }
        }
      }

      // Fetch live rates
      const res = await fetch("https://open.er-api.com/v6/latest/USD");
      if (!res.ok) throw new Error("API response error");
      const data = await res.json();

      if (data && data.rates) {
        // Filter only our supported currencies
        const filteredRates = {};
        Object.keys(CURRENCIES).forEach(code => {
          filteredRates[code] = data.rates[code] || FALLBACK_RATES[code];
        });

        setRates(filteredRates);
        setLastUpdated(new Date());
        setStatus("live");

        // Save to cache
        localStorage.setItem(
          "mediadrop_exchange_rates",
          JSON.stringify({
            rates: filteredRates,
            timestamp: Date.now()
          })
        );
      } else {
        throw new Error("Invalid rate format");
      }
    } catch (err) {
      console.warn("Currency rate fetch failed, using fallback:", err);
      // Fallback to cache if exists, otherwise fallback to hardcoded
      const cached = localStorage.getItem("mediadrop_exchange_rates");
      if (cached) {
        const parsed = JSON.parse(cached);
        setRates(parsed.rates || FALLBACK_RATES);
        setLastUpdated(new Date(parsed.timestamp));
        setStatus("cached");
      } else {
        setRates(FALLBACK_RATES);
        setLastUpdated(new Date());
        setStatus("fallback");
      }
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  // Calculate conversion
  useEffect(() => {
    if (!amount.trim() || isNaN(Number(amount))) {
      setConvertedAmount("");
      return;
    }

    const value = Number(amount);
    
    // rate = targetRate / sourceRate (relative to USD)
    const sourceRate = rates[fromCurrency] || 1;
    const targetRate = rates[toCurrency] || 1;
    const calculated = value * (targetRate / sourceRate);
    
    setConvertedAmount(calculated.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }));
  }, [amount, fromCurrency, toCurrency, rates]);

  const handleSwap = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  const handleReset = () => {
    setAmount("100");
    setFromCurrency("USD");
    setToCurrency("INR");
  };

  const handleCopy = (val, key) => {
    if (!val) return;
    // Strip commas for easier copy pasting of values
    const rawVal = val.replace(/,/g, "");
    navigator.clipboard.writeText(rawVal);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const currentRate = (rates[toCurrency] || 1) / (rates[fromCurrency] || 1);

  const sidebarControls = (
    <div className="space-y-4 select-none">
      <div className="bg-black/5 dark:bg-black/25 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-[10px] text-zinc-500 dark:text-zinc-450 leading-relaxed font-semibold">
        <div className="flex justify-between mb-1">
          <span>Rates Status:</span>
          <span className={`font-bold uppercase ${
            status === "live" ? "text-green-500" :
            status === "cached" ? "text-purple-500" :
            status === "fallback" ? "text-yellow-500" : "text-zinc-500"
          }`}>{status}</span>
        </div>
        {lastUpdated && (
          <div className="flex justify-between">
            <span>Last Updated:</span>
            <span className="font-bold text-zinc-700 dark:text-zinc-300 font-mono">
              {lastUpdated.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        )}
      </div>

      <button
        onClick={() => fetchRates(true)}
        className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-purple-600/15"
      >
        <span className="material-symbols-outlined text-[15px]">sync</span>
        Force Refresh Rates
      </button>
    </div>
  );

  return (
    <UtilityToolLayout
      title="Currency Converter"
      description="Convert currencies in real time using public exchange rate data, cached locally for fast offline access."
      sidebarControls={sidebarControls}
      onReset={handleReset}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
        
        {/* Source Currency Input */}
        <div className="bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-between h-[220px]">
          <div className="flex justify-between items-center select-none mb-4">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-450">Source Amount</span>
            <button
              onClick={() => handleCopy(amount, "from")}
              className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 dark:text-zinc-550 hover:text-purple-500 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[13px]">
                {copiedKey === "from" ? "check" : "content_copy"}
              </span>
              <span>{copiedKey === "from" ? "Copied" : "Copy"}</span>
            </button>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm font-bold text-zinc-400">
                {CURRENCIES[fromCurrency]?.symbol || "$"}
              </span>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="Enter amount..."
                className="w-full bg-gray-50/50 dark:bg-zinc-900/30 border border-zinc-150 dark:border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 font-mono text-sm font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-purple-500/50"
              />
            </div>

            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
            >
              {Object.entries(CURRENCIES).map(([code, cur]) => (
                <option key={code} value={code}>
                  {code} - {cur.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap & Target Output */}
        <div className="relative">
          {/* Swap Button */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex justify-center -mt-3 lg:mt-0">
            <button
              onClick={handleSwap}
              className="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center cursor-pointer shadow-lg shadow-purple-600/25 transition-transform duration-300 active:scale-95"
            >
              <span className="material-symbols-outlined text-sm rotate-90 lg:rotate-0">swap_horiz</span>
            </button>
          </div>

          <div className="bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-between h-[220px]">
            <div className="flex justify-between items-center select-none mb-4">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-450">Converted Amount</span>
              <button
                onClick={() => handleCopy(convertedAmount, "to")}
                className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 dark:text-zinc-555 hover:text-purple-500 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[13px]">
                  {copiedKey === "to" ? "check" : "content_copy"}
                </span>
                <span>{copiedKey === "to" ? "Copied" : "Copy"}</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm font-bold text-purple-500">
                  {CURRENCIES[toCurrency]?.symbol || "$"}
                </span>
                <div className="w-full bg-purple-500/5 dark:bg-purple-500/[0.02] border border-purple-500/10 rounded-xl pl-9 pr-4 py-2.5 font-mono text-sm font-bold text-purple-600 dark:text-purple-400 min-h-[46px] flex items-center overflow-x-auto whitespace-nowrap">
                  {convertedAmount || "0.00"}
                </div>
              </div>

              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
              >
                {Object.entries(CURRENCIES).map(([code, cur]) => (
                  <option key={code} value={code}>
                    {code} - {cur.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

      </div>

      {/* Exchange Rate Info Card */}
      {!amount || isNaN(Number(amount)) ? null : (
        <div className="bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 select-none mt-6">
          <h3 className="font-extrabold text-zinc-800 dark:text-zinc-200 text-xs mb-3">Conversion Details</h3>
          <div className="flex flex-col md:flex-row justify-between gap-4 font-mono text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              <span className="font-sans text-zinc-400">Current Exchange Rate:</span>
              <span className="font-bold text-zinc-800 dark:text-zinc-200">
                1 {fromCurrency} = {currentRate.toFixed(6)} {toCurrency}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-sans text-zinc-400">Inverse Rate:</span>
              <span className="font-bold text-zinc-800 dark:text-zinc-200">
                1 {toCurrency} = {(1 / currentRate).toFixed(6)} {fromCurrency}
              </span>
            </div>
          </div>
        </div>
      )}
    </UtilityToolLayout>
  );
}
