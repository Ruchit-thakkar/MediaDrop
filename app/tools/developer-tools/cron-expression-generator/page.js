"use client";

import { useState, useEffect } from "react";
import DevToolLayout from "../components/DevToolLayout";

export default function CronExpressionGeneratorPage() {
  const [minute, setMinute] = useState("*");
  const [hour, setHour] = useState("*");
  const [day, setDay] = useState("*");
  const [month, setMonth] = useState("*");
  const [weekday, setWeekday] = useState("*");
  
  const [cronExpression, setCronExpression] = useState("* * * * *");
  const [cronExplanation, setCronExplanation] = useState("Runs every minute.");
  const [isCopied, setIsCopied] = useState(false);

  // Recompile cron when selectors change
  useEffect(() => {
    const expr = `${minute} ${hour} ${day} ${month} ${weekday}`;
    setCronExpression(expr);

    // Human Explanation
    let minuteText = "every minute";
    if (minute !== "*") {
      if (minute.startsWith("*/")) {
        minuteText = `every ${minute.split("/")[1]} minutes`;
      } else {
        minuteText = `at minute ${minute}`;
      }
    }

    let hourText = "every hour";
    if (hour !== "*") {
      if (hour.startsWith("*/")) {
        hourText = `every ${hour.split("/")[1]} hours`;
      } else {
        const hourNum = parseInt(hour);
        const ampm = hourNum >= 12 ? "PM" : "AM";
        const displayHour = hourNum % 12 === 0 ? 12 : hourNum % 12;
        hourText = `at ${displayHour} ${ampm}`;
      }
    }

    let dayText = "every day of the month";
    if (day !== "*") {
      dayText = `on day ${day} of the month`;
    }

    let monthText = "every month";
    if (month !== "*") {
      const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      monthText = `in ${months[parseInt(month) - 1]}`;
    }

    let weekdayText = "every day of the week";
    if (weekday !== "*") {
      const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      if (weekday === "1-5") {
        weekdayText = "Monday through Friday";
      } else {
        weekdayText = `on ${weekdays[parseInt(weekday)]}`;
      }
    }

    // Combine
    let explanation = "";
    if (minute === "*" && hour === "*" && day === "*" && month === "*" && weekday === "*") {
      explanation = "Runs every minute.";
    } else {
      explanation = `Runs ${minuteText}, ${hourText}, ${dayText}, ${monthText}, and ${weekdayText}.`;
    }

    setCronExplanation(explanation);
  }, [minute, hour, day, month, weekday]);

  const handleCopy = () => {
    navigator.clipboard.writeText(cronExpression);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handlePreset = (preset) => {
    if (preset === "every-minute") {
      setMinute("*"); setHour("*"); setDay("*"); setMonth("*"); setWeekday("*");
    } else if (preset === "every-5-min") {
      setMinute("*/5"); setHour("*"); setDay("*"); setMonth("*"); setWeekday("*");
    } else if (preset === "hourly") {
      setMinute("0"); setHour("*"); setDay("*"); setMonth("*"); setWeekday("*");
    } else if (preset === "daily") {
      setMinute("0"); setHour("0"); setDay("*"); setMonth("*"); setWeekday("*");
    } else if (preset === "weekly-sun") {
      setMinute("0"); setHour("0"); setDay("*"); setMonth("*"); setWeekday("0");
    } else if (preset === "weekdays") {
      setMinute("0"); setHour("9"); setDay("*"); setMonth("*"); setWeekday("1-5");
    }
  };

  const handleReset = () => {
    handlePreset("every-minute");
  };

  const sidebarControls = (
    <>
      {/* Quick Presets */}
      <div className="flex flex-col gap-1.5 select-none">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Quick Presets
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: "every-minute", label: "Every Minute" },
            { key: "every-5-min", label: "Every 5 Min" },
            { key: "hourly", label: "Hourly" },
            { key: "daily", label: "Daily Midnight" },
            { key: "weekly-sun", label: "Weekly Sun" },
            { key: "weekdays", label: "9 AM Weekdays" }
          ].map((preset) => (
            <button
              key={preset.key}
              onClick={() => handlePreset(preset.key)}
              className="py-1.5 px-2 text-[10px] font-extrabold rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/5 dark:bg-white/[0.01] text-zinc-500 dark:text-zinc-400 hover:text-purple-500 hover:border-purple-500/30 transition-all cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <DevToolLayout
      title="Cron Expression Generator"
      description="Design crontab timing schedule expressions visually, and get plain English explanations instantly."
      sidebarControls={sidebarControls}
      onReset={handleReset}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        
        {/* Selectors Column */}
        <div className="bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col gap-4 select-none">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-450">Schedule Settings</span>
          
          {/* Minute */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-zinc-450 uppercase">Minute</label>
            <select
              value={minute}
              onChange={(e) => setMinute(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none"
            >
              <option value="*">Every minute (*)</option>
              <option value="*/2">Every 2 minutes (*/2)</option>
              <option value="*/5">Every 5 minutes (*/5)</option>
              <option value="*/10">Every 10 minutes (*/10)</option>
              <option value="*/15">Every 15 minutes (*/15)</option>
              <option value="*/30">Every 30 minutes (*/30)</option>
              <option value="0">At start of hour (0)</option>
            </select>
          </div>

          {/* Hour */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-zinc-450 uppercase">Hour</label>
            <select
              value={hour}
              onChange={(e) => setHour(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none"
            >
              <option value="*">Every hour (*)</option>
              <option value="*/2">Every 2 hours (*/2)</option>
              <option value="*/4">Every 4 hours (*/4)</option>
              <option value="*/6">Every 6 hours (*/6)</option>
              <option value="*/12">Every 12 hours (*/12)</option>
              <option value="0">12 AM Midnight (0)</option>
              <option value="6">6 AM (6)</option>
              <option value="9">9 AM (9)</option>
              <option value="12">12 PM Noon (12)</option>
              <option value="18">6 PM (18)</option>
            </select>
          </div>

          {/* Day of Month */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-zinc-450 uppercase">Day of Month</label>
            <select
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none"
            >
              <option value="*">Every day of the month (*)</option>
              <option value="1">1st of the month (1)</option>
              <option value="15">15th of the month (15)</option>
              <option value="31">Last day of the month (31)</option>
            </select>
          </div>

          {/* Month */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-zinc-450 uppercase">Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none"
            >
              <option value="*">Every month (*)</option>
              <option value="1">January (1)</option>
              <option value="6">June (6)</option>
              <option value="12">December (12)</option>
            </select>
          </div>

          {/* Day of Week */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-zinc-450 uppercase">Day of Week</label>
            <select
              value={weekday}
              onChange={(e) => setWeekday(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none"
            >
              <option value="*">Every day (*)</option>
              <option value="1-5">Weekdays (Mon-Fri) (1-5)</option>
              <option value="0">Sunday (0)</option>
              <option value="1">Monday (1)</option>
              <option value="6">Saturday (6)</option>
            </select>
          </div>
        </div>

        {/* Expression Output Column */}
        <div className="bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-between min-h-[350px]">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-450 select-none">Cron Output</span>
          
          <div className="flex-grow flex flex-col justify-center gap-6">
            {/* Expression String */}
            <div className="flex flex-col gap-1 w-full">
              <div className="flex justify-between text-[10px] font-bold text-zinc-450 select-none">
                <span>CRONTAB EXPRESSION</span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 hover:text-purple-500 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[12px]">{isCopied ? "check" : "content_copy"}</span>
                  <span>{isCopied ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <div className="bg-gray-50/50 dark:bg-zinc-900/30 border border-zinc-150 dark:border-zinc-800 rounded-xl px-4 py-3 font-mono text-base font-black text-center text-purple-650 dark:text-purple-400 select-all">
                {cronExpression}
              </div>
            </div>

            {/* Explanation Description */}
            <div className="bg-purple-500/[0.02] border border-purple-500/20 rounded-2xl p-4 select-none flex flex-col gap-1.5">
              <span className="text-[8px] font-extrabold uppercase tracking-widest text-zinc-400">Description Translation</span>
              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 leading-relaxed">
                {cronExplanation}
              </p>
            </div>
          </div>
        </div>

      </div>
    </DevToolLayout>
  );
}
