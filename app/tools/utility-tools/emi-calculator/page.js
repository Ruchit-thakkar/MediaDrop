"use client";

import { useState, useEffect } from "react";
import UtilityToolLayout from "../components/UtilityToolLayout";

export default function EmiCalculatorPage() {
  const [loanAmount, setLoanAmount] = useState("1000000");
  const [interestRate, setInterestRate] = useState("8.5");
  const [duration, setDuration] = useState("20");
  const [durationType, setDurationType] = useState("years"); // years, months

  const [emi, setEmi] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
  const [totalPayable, setTotalPayable] = useState(0);
  const [interestRatio, setInterestRatio] = useState(30); // in percent
  const [hoveredSegment, setHoveredSegment] = useState(null); // null, 'principal', 'interest'
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      setError("");
      const p = Number(loanAmount);
      const rAnnual = Number(interestRate);
      let n = Number(duration);

      if (isNaN(p) || isNaN(rAnnual) || isNaN(n) || p <= 0 || rAnnual < 0 || n <= 0) {
        throw new Error("Enter positive values for amount, rate, and duration.");
      }

      if (durationType === "years") {
        n = n * 12;
      }

      if (rAnnual === 0) {
        const calculatedEmi = p / n;
        setEmi(calculatedEmi);
        setTotalInterest(0);
        setTotalPayable(p);
        setInterestRatio(0);
        return;
      }

      const rMonthly = rAnnual / (12 * 100);
      const emiValue = (p * rMonthly * Math.pow(1 + rMonthly, n)) / (Math.pow(1 + rMonthly, n) - 1);
      
      if (isNaN(emiValue) || !isFinite(emiValue)) {
        throw new Error("Invalid calculation parameters.");
      }

      const payable = emiValue * n;
      const interest = payable - p;

      setEmi(emiValue);
      setTotalInterest(interest);
      setTotalPayable(payable);

      // Percentage of interest vs total payable
      const pct = (interest / payable) * 100;
      setInterestRatio(pct);

    } catch (err) {
      setError(err.message);
      setEmi(0);
      setTotalInterest(0);
      setTotalPayable(0);
      setInterestRatio(30);
    }
  }, [loanAmount, interestRate, duration, durationType]);

  const handleReset = () => {
    setLoanAmount("1000000");
    setInterestRate("8.5");
    setDuration("20");
    setDurationType("years");
    setError("");
  };

  const formatCurrency = (val) => {
    return Number(val.toFixed(0)).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    });
  };

  // SVG Donut details
  const radius = 50;
  const circumference = 2 * Math.PI * radius; // ~314.159
  const interestAngle = (interestRatio / 100) * circumference;
  const principalAngle = circumference - interestAngle;

  const sidebarControls = (
    <div className="space-y-4 select-none">
      <div className="space-y-1.5">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-555">
          Duration Unit
        </label>
        <div className="grid grid-cols-2 gap-1 bg-black/5 dark:bg-black/25 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
          {["years", "months"].map((type) => (
            <button
              key={type}
              onClick={() => {
                setDurationType(type);
                if (type === "years" && duration > 30) setDuration("20");
                else if (type === "months" && duration <= 30) setDuration((Number(duration) * 12).toString());
              }}
              className={`py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-colors cursor-pointer ${
                durationType === type
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-purple-500 hover:bg-black/5"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <UtilityToolLayout
      title="Home Loan EMI Calculator"
      description="Estimate your monthly loan installments (EMI), total interest, and total payable amount with an interactive visual breakdown chart."
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
                <span>Loan Amount (₹)</span>
                <input
                  type="text"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value.replace(/[^0-9]/g, ""))}
                  className="w-24 bg-gray-50/50 dark:bg-zinc-900/30 border border-zinc-150 dark:border-zinc-800 rounded-lg px-2 py-0.5 font-mono text-right font-bold text-zinc-800 dark:text-zinc-250 focus:outline-none"
                />
              </div>
              <input
                type="range"
                min="10000"
                max="20000000"
                step="10000"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
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
                max="20"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="w-full accent-purple-600 bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Duration */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 select-none">
                <span>Duration ({durationType})</span>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value.replace(/[^0-9]/g, ""))}
                  className="w-16 bg-gray-50/50 dark:bg-zinc-900/30 border border-zinc-150 dark:border-zinc-800 rounded-lg px-2 py-0.5 font-mono text-right font-bold text-zinc-800 dark:text-zinc-250 focus:outline-none"
                />
              </div>
              <input
                type="range"
                min="1"
                max={durationType === "years" ? "30" : "360"}
                step="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
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
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-450 select-none">Summary Outputs</span>

            <div className="space-y-4 my-auto">
              <div className="flex flex-col">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-400">Monthly EMI</span>
                <span className="text-xl font-black text-purple-600 dark:text-purple-400 font-mono">
                  {formatCurrency(emi)}
                </span>
              </div>

              <div className="flex flex-col border-t border-zinc-100 dark:border-zinc-800/80 pt-2">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-400">Total Interest</span>
                <span className="text-md font-bold text-zinc-850 dark:text-zinc-250 font-mono">
                  {formatCurrency(totalInterest)}
                </span>
              </div>

              <div className="flex flex-col border-t border-zinc-100 dark:border-zinc-800/80 pt-2">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-400">Total Payment</span>
                <span className="text-md font-bold text-zinc-850 dark:text-zinc-250 font-mono">
                  {formatCurrency(totalPayable)}
                </span>
              </div>
            </div>
          </div>

          {/* SVG Pie Chart */}
          <div className="bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-between items-center relative min-h-[220px]">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-450 select-none w-full text-left">Breakdown Chart</span>

            {emi > 0 ? (
              <div className="flex flex-col items-center justify-center relative w-36 h-36 my-auto select-none">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                  {/* Principal Circle Segment */}
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
                  {/* Interest Circle Segment */}
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

                {/* Center Hover Label */}
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
                      <span className="text-[8px] font-extrabold uppercase tracking-widest text-zinc-400">Total ratio</span>
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

            {/* Chart Legend */}
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
