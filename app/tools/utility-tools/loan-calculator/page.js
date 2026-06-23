"use client";

import { useState, useEffect } from "react";
import UtilityToolLayout from "../components/UtilityToolLayout";

export default function LoanCalculatorPage() {
  const [principal, setPrincipal] = useState("500000");
  const [interestRate, setInterestRate] = useState("7.5");
  const [years, setYears] = useState("5");
  const [calcMethod, setCalcMethod] = useState("amortized"); // amortized, simple, compound

  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
  const [totalRepayment, setTotalRepayment] = useState(0);
  const [interestRatio, setInterestRatio] = useState(20);
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      setError("");
      const p = Number(principal);
      const r = Number(interestRate);
      const t = Number(years);

      if (isNaN(p) || isNaN(r) || isNaN(t) || p <= 0 || r < 0 || t <= 0) {
        throw new Error("Enter positive numbers for Principal, Interest Rate, and Years.");
      }

      let monthly = 0;
      let interest = 0;
      let total = 0;

      if (r === 0) {
        total = p;
        interest = 0;
        monthly = p / (t * 12);
      } else if (calcMethod === "simple") {
        interest = (p * r * t) / 100;
        total = p + interest;
        monthly = total / (t * 12);
      } else if (calcMethod === "compound") {
        total = p * Math.pow(1 + r / 100, t);
        interest = total - p;
        monthly = total / (t * 12);
      } else {
        // Amortized (EMI) Method
        const rMonthly = r / (12 * 100);
        const nMonths = t * 12;
        monthly = (p * rMonthly * Math.pow(1 + rMonthly, nMonths)) / (Math.pow(1 + rMonthly, nMonths) - 1);
        total = monthly * nMonths;
        interest = total - p;
      }

      if (isNaN(monthly) || !isFinite(monthly)) {
        throw new Error("Invalid calculation parameters.");
      }

      setMonthlyPayment(monthly);
      setTotalInterest(interest);
      setTotalRepayment(total);

      const ratio = (interest / total) * 100;
      setInterestRatio(ratio);

    } catch (err) {
      setError(err.message);
      setMonthlyPayment(0);
      setTotalInterest(0);
      setTotalRepayment(0);
      setInterestRatio(20);
    }
  }, [principal, interestRate, years, calcMethod]);

  const handleReset = () => {
    setPrincipal("500000");
    setInterestRate("7.5");
    setYears("5");
    setCalcMethod("amortized");
    setError("");
  };

  const formatCurrency = (val) => {
    return Number(val.toFixed(0)).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    });
  };

  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const interestAngle = (interestRatio / 100) * circumference;
  const principalAngle = circumference - interestAngle;

  const sidebarControls = (
    <div className="space-y-4 select-none">
      <div className="space-y-1.5">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-555">
          Calculation Model
        </label>
        <div className="flex flex-col gap-1">
          {[
            { id: "amortized", name: "Amortized (EMI)", desc: "Standard bank loan monthly compounds" },
            { id: "simple", name: "Simple Interest", desc: "Principal * Rate * Years" },
            { id: "compound", name: "Compound Interest", desc: "Annual compounding interest" }
          ].map((method) => (
            <button
              key={method.id}
              onClick={() => setCalcMethod(method.id)}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold text-left flex flex-col transition-all cursor-pointer ${
                calcMethod === method.id
                  ? "bg-purple-600 text-white shadow-sm shadow-purple-600/15"
                  : "bg-black/5 dark:bg-black/20 text-zinc-650 dark:text-zinc-450 hover:bg-black/10 dark:hover:bg-zinc-800"
              }`}
            >
              <span>{method.name}</span>
              <span className={`text-[8px] font-normal leading-tight mt-0.5 ${
                calcMethod === method.id ? "text-purple-200" : "text-zinc-450"
              }`}>{method.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <UtilityToolLayout
      title="Loan Calculator"
      description="Calculate monthly payments, total interest, and repayments for amortized, simple, or compound interest loans."
      sidebarControls={sidebarControls}
      onReset={handleReset}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Sliders and Inputs Column */}
        <div className="lg:col-span-1.5 flex flex-col bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 gap-5">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-450 select-none">Configure Parameters</span>
          
          <div className="space-y-4 flex-grow flex flex-col justify-center">
            {/* Amount */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 select-none">
                <span>Principal Amount (₹)</span>
                <input
                  type="text"
                  value={principal}
                  onChange={(e) => setPrincipal(e.target.value.replace(/[^0-9]/g, ""))}
                  className="w-24 bg-gray-50/50 dark:bg-zinc-900/30 border border-zinc-150 dark:border-zinc-800 rounded-lg px-2 py-0.5 font-mono text-right font-bold text-zinc-800 dark:text-zinc-250 focus:outline-none"
                />
              </div>
              <input
                type="range"
                min="5000"
                max="10000000"
                step="5000"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                className="w-full accent-purple-600 bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Interest */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 select-none">
                <span>Interest Rate (% P.A.)</span>
                <input
                  type="text"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value.replace(/[^0-9.]/g, ""))}
                  className="w-16 bg-gray-50/50 dark:bg-zinc-900/30 border border-zinc-150 dark:border-zinc-800 rounded-lg px-2 py-0.5 font-mono text-right font-bold text-zinc-800 dark:text-zinc-250 focus:outline-none"
                />
              </div>
              <input
                type="range"
                min="1"
                max="25"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="w-full accent-purple-600 bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Duration */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 select-none">
                <span>Duration (Years)</span>
                <input
                  type="text"
                  value={years}
                  onChange={(e) => setYears(e.target.value.replace(/[^0-9]/g, ""))}
                  className="w-16 bg-gray-50/50 dark:bg-zinc-900/30 border border-zinc-150 dark:border-zinc-800 rounded-lg px-2 py-0.5 font-mono text-right font-bold text-zinc-800 dark:text-zinc-250 focus:outline-none"
                />
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={years}
                onChange={(e) => setYears(e.target.value)}
                className="w-full accent-purple-600 bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/25 p-3 rounded-xl text-[9px] font-bold text-red-500 uppercase tracking-widest select-none">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Results and Pie Chart Column */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Numeric breakdown */}
          <div className="bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-455 select-none">Summary Outputs</span>

            <div className="space-y-4 my-auto">
              <div className="flex flex-col">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-400">Monthly Payment</span>
                <span className="text-xl font-black text-purple-600 dark:text-purple-400 font-mono">
                  {formatCurrency(monthlyPayment)}
                </span>
              </div>

              <div className="flex flex-col border-t border-zinc-100 dark:border-zinc-800/80 pt-2">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-400">Total Interest</span>
                <span className="text-md font-bold text-zinc-850 dark:text-zinc-250 font-mono">
                  {formatCurrency(totalInterest)}
                </span>
              </div>

              <div className="flex flex-col border-t border-zinc-100 dark:border-zinc-800/80 pt-2">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-400">Total Repayment</span>
                <span className="text-md font-bold text-zinc-850 dark:text-zinc-250 font-mono">
                  {formatCurrency(totalRepayment)}
                </span>
              </div>
            </div>
          </div>

          {/* SVG Pie Chart */}
          <div className="bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-between items-center relative min-h-[220px]">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-450 select-none w-full text-left">Breakdown Chart</span>

            {monthlyPayment > 0 ? (
              <div className="flex flex-col items-center justify-center relative w-36 h-36 my-auto select-none">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="transparent"
                    stroke="#8b5cf6"
                    strokeWidth="16"
                    strokeDasharray={`${principalAngle} ${circumference}`}
                    className="transition-all duration-500 cursor-pointer hover:stroke-purple-500 hover:stroke-[18px]"
                    onMouseEnter={() => setHoveredSegment("principal")}
                    onMouseLeave={() => setHoveredSegment(null)}
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="transparent"
                    stroke="#fbbf24"
                    strokeWidth="16"
                    strokeDasharray={`${interestAngle} ${circumference}`}
                    strokeDashoffset={-principalAngle}
                    className="transition-all duration-500 cursor-pointer hover:stroke-amber-400 hover:stroke-[18px]"
                    onMouseEnter={() => setHoveredSegment("interest")}
                    onMouseLeave={() => setHoveredSegment(null)}
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  {hoveredSegment === "interest" ? (
                    <>
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-500">Interest</span>
                      <span className="text-xs font-black font-mono text-zinc-800 dark:text-zinc-200">{interestRatio.toFixed(1)}%</span>
                    </>
                  ) : hoveredSegment === "principal" ? (
                    <>
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-purple-500">Principal</span>
                      <span className="text-xs font-black font-mono text-zinc-800 dark:text-zinc-200">{(100 - interestRatio).toFixed(1)}%</span>
                    </>
                  ) : (
                    <>
                      <span className="text-[8px] font-extrabold uppercase tracking-widest text-zinc-400">Total Ratio</span>
                      <span className="text-[10px] font-black text-zinc-700 dark:text-zinc-300 font-mono">100%</span>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-grow flex items-center justify-center text-zinc-400 text-xs italic py-6 select-none">
                No breakdown available
              </div>
            )}

            <div className="flex justify-center gap-4 text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 mt-2 select-none">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-purple-500 shrink-0" />
                <span>Principal</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-amber-500 shrink-0" />
                <span>Interest</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </UtilityToolLayout>
  );
}
