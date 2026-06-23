"use client";

import { useState, useEffect } from "react";
import UtilityToolLayout from "../components/UtilityToolLayout";

export default function AgeCalculatorPage() {
  const [dob, setDob] = useState("2000-01-01");
  const [targetDate, setTargetDate] = useState("");
  const [ageParts, setAgeParts] = useState(null);
  const [extraStats, setExtraStats] = useState(null);
  const [birthdayCountdown, setBirthdayCountdown] = useState(null);
  const [error, setError] = useState("");

  // Default target date to today
  useEffect(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    setTargetDate(todayStr);
  }, []);

  useEffect(() => {
    if (!dob || !targetDate) {
      setAgeParts(null);
      setExtraStats(null);
      setBirthdayCountdown(null);
      setError("");
      return;
    }

    try {
      setError("");
      const birth = new Date(dob);
      const target = new Date(targetDate);

      if (isNaN(birth.getTime()) || isNaN(target.getTime())) {
        throw new Error("Invalid dates selected.");
      }

      if (birth > target) {
        throw new Error("Date of Birth cannot be after the calculation date.");
      }

      // Calculate years, months, days
      let years = target.getFullYear() - birth.getFullYear();
      let months = target.getMonth() - birth.getMonth();
      let days = target.getDate() - birth.getDate();

      if (days < 0) {
        const prevMonth = new Date(target.getFullYear(), target.getMonth(), 0);
        days += prevMonth.getDate();
        months--;
      }
      if (months < 0) {
        months += 12;
        years--;
      }

      setAgeParts({ years, months, days });

      // Extra statistics
      const diffMs = target.getTime() - birth.getTime();
      const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const totalWeeks = Math.floor(totalDays / 7);
      const remainingDaysOfWeek = totalDays % 7;
      const totalMonths = (target.getFullYear() - birth.getFullYear()) * 12 + (target.getMonth() - birth.getMonth());

      setExtraStats({
        months: totalMonths,
        weeks: `${totalWeeks} weeks, ${remainingDaysOfWeek} days`,
        days: totalDays.toLocaleString(),
        hours: Math.floor(diffMs / (1000 * 60 * 60)).toLocaleString(),
        minutes: Math.floor(diffMs / (1000 * 60)).toLocaleString(),
        seconds: Math.floor(diffMs / 1000).toLocaleString()
      });

      // Calculate next birthday countdown
      const nextBday = new Date(target.getFullYear(), birth.getMonth(), birth.getDate());
      if (nextBday < target) {
        nextBday.setFullYear(target.getFullYear() + 1);
      }

      const countdownMs = nextBday.getTime() - target.getTime();
      const countdownDays = Math.ceil(countdownMs / (1000 * 60 * 60 * 24));
      
      let cdMonths = nextBday.getMonth() - target.getMonth();
      let cdDays = nextBday.getDate() - target.getDate();

      if (cdDays < 0) {
        const prevMonth = new Date(nextBday.getFullYear(), nextBday.getMonth(), 0);
        cdDays += prevMonth.getDate();
        cdMonths--;
      }
      if (cdMonths < 0) {
        cdMonths += 12;
      }

      setBirthdayCountdown({
        totalDays: countdownDays,
        months: cdMonths,
        days: cdDays
      });

    } catch (err) {
      setError(err.message);
      setAgeParts(null);
      setExtraStats(null);
      setBirthdayCountdown(null);
    }
  }, [dob, targetDate]);

  const handleReset = () => {
    setDob("2000-01-01");
    setTargetDate(new Date().toISOString().split("T")[0]);
    setError("");
  };

  const sidebarControls = (
    <div className="space-y-4 select-none">
      <div className="space-y-1.5">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-555">
          Calculation Date
        </label>
        <input
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
        />
      </div>

      <button
        onClick={() => setTargetDate(new Date().toISOString().split("T")[0])}
        className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-purple-600/15"
      >
        <span className="material-symbols-outlined text-[15px]">today</span>
        Reset to Today
      </button>

      {birthdayCountdown && !error && (
        <div className="bg-purple-500/5 dark:bg-purple-500/5 border border-purple-500/10 rounded-xl p-3 text-[10px] text-zinc-500 dark:text-zinc-450 leading-relaxed font-semibold">
          <span className="text-purple-500 uppercase tracking-widest font-extrabold text-[8px] block mb-1">Next Birthday</span>
          {birthdayCountdown.totalDays === 365 || birthdayCountdown.totalDays === 0 ? (
            <div className="font-bold text-green-500 text-xs flex items-center gap-1 animate-pulse">
              <span className="material-symbols-outlined text-sm">cake</span>
              Happy Birthday! 🎉
            </div>
          ) : (
            <div className="font-bold text-zinc-700 dark:text-zinc-300">
              In {birthdayCountdown.months > 0 ? `${birthdayCountdown.months} months, ` : ""}{birthdayCountdown.days} days
              <span className="block font-normal text-[9px] text-zinc-400 font-mono mt-0.5">({birthdayCountdown.totalDays} days remaining)</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <UtilityToolLayout
      title="Age Calculator"
      description="Compute your exact age in years, months, and days, along with a countdown to your next birthday and fun total lifetime statistics."
      sidebarControls={sidebarControls}
      onReset={handleReset}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Input Column */}
        <div className="lg:col-span-1 flex flex-col bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-450 select-none mb-4">Date of Birth</span>
          
          <div className="space-y-4 my-auto">
            <div className="flex flex-col gap-1">
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full bg-gray-50/50 dark:bg-zinc-900/30 border border-zinc-150 dark:border-zinc-800 rounded-xl px-4 py-2.5 font-mono text-sm font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-purple-500/50 cursor-pointer"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/25 p-3 rounded-xl text-[9px] font-bold text-red-500 uppercase tracking-widest select-none">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Big Displays Column */}
        <div className="lg:col-span-2 bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-between min-h-[220px]">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-450 select-none mb-4">Exact Age</span>
          
          {ageParts ? (
            <div className="grid grid-cols-3 gap-4 my-auto">
              <div className="flex flex-col items-center bg-gray-50/50 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-4">
                <span className="text-3xl sm:text-4xl font-black text-purple-600 dark:text-purple-400 font-mono">
                  {ageParts.years}
                </span>
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-450 mt-1">Years</span>
              </div>

              <div className="flex flex-col items-center bg-gray-50/50 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-4">
                <span className="text-3xl sm:text-4xl font-black text-purple-600 dark:text-purple-400 font-mono">
                  {ageParts.months}
                </span>
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-450 mt-1">Months</span>
              </div>

              <div className="flex flex-col items-center bg-gray-50/50 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-4">
                <span className="text-3xl sm:text-4xl font-black text-purple-600 dark:text-purple-400 font-mono">
                  {ageParts.days}
                </span>
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-450 mt-1">Days</span>
              </div>
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center text-zinc-400 text-xs italic py-6 select-none">
              Select DOB to view age
            </div>
          )}
        </div>

      </div>

      {/* Extra Life Stats Table */}
      {extraStats && (
        <div className="bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 select-none mt-6">
          <h3 className="font-extrabold text-zinc-800 dark:text-zinc-200 text-xs mb-4 uppercase tracking-wider">Your Lifetime Metrics</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 font-semibold text-xs text-zinc-650 dark:text-zinc-400">
            <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Total Months</span>
              <span className="font-mono text-zinc-850 dark:text-zinc-250 font-bold">{extraStats.months}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Total Weeks</span>
              <span className="font-mono text-zinc-850 dark:text-zinc-250 font-bold">{extraStats.weeks}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Total Days</span>
              <span className="font-mono text-zinc-850 dark:text-zinc-250 font-bold">{extraStats.days}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Total Hours</span>
              <span className="font-mono text-zinc-850 dark:text-zinc-250 font-bold">{extraStats.hours}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Total Minutes</span>
              <span className="font-mono text-zinc-850 dark:text-zinc-250 font-bold">{extraStats.minutes}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Total Seconds</span>
              <span className="font-mono text-zinc-850 dark:text-zinc-250 font-bold">{extraStats.seconds}</span>
            </div>
          </div>
        </div>
      )}
    </UtilityToolLayout>
  );
}
