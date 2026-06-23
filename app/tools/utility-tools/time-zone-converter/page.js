"use client";

import { useState, useEffect } from "react";
import UtilityToolLayout from "../components/UtilityToolLayout";

const ZONES = [
  { label: "IST (India Standard Time)", value: "Asia/Kolkata", abbr: "IST" },
  { label: "UTC (Coordinated Universal Time)", value: "UTC", abbr: "UTC" },
  { label: "EST (Eastern Standard Time)", value: "America/New_York", abbr: "EST" },
  { label: "PST (Pacific Standard Time)", value: "America/Los_Angeles", abbr: "PST" },
  { label: "GMT (Greenwich Mean Time)", value: "Europe/London", abbr: "GMT" }
];

export default function TimeZoneConverterPage() {
  const [currentTime, setCurrentTime] = useState(null);
  
  // Meeting planner states
  const [plannerDate, setPlannerDate] = useState("");
  const [plannerHour, setPlannerHour] = useState(12); // 0 to 23
  const [plannerMin, setPlannerMin] = useState(0); // 0 to 59
  const [sourceZone, setSourceZone] = useState("UTC");
  const [targetZone, setTargetZone] = useState("Asia/Kolkata");
  const [convertedPlannerTime, setConvertedPlannerTime] = useState("");

  // Clock updates every second
  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize planner date
  useEffect(() => {
    const today = new Date();
    setPlannerDate(today.toISOString().split("T")[0]);
    setPlannerHour(today.getHours());
    setPlannerMin(today.getMinutes());
  }, []);

  // Calculate planner conversion
  useEffect(() => {
    if (!plannerDate) {
      setConvertedPlannerTime("");
      return;
    }

    try {
      // Build a date in the source timezone
      const [year, month, day] = plannerDate.split("-").map(Number);
      
      // We can construct a target ISO string representing the local time,
      // then parse it as the source timezone.
      // E.g., Date string representation: "YYYY-MM-DDTHH:MM:SS"
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(plannerHour).padStart(2, "0")}:${String(plannerMin).padStart(2, "0")}:00`;
      
      // Use Intl to get offset or perform timezone conversion
      // Standard trick: construct date object representing this local date
      const localDate = new Date(dateStr);
      
      // Parse in source timezone: we want to find the UTC time that matches this dateStr in sourceZone.
      // We can compute the difference by formatting a dummy date.
      const sourceFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: sourceZone,
        year: "numeric", month: "numeric", day: "numeric",
        hour: "numeric", minute: "numeric", second: "numeric",
        hourCycle: "h23"
      });

      // Target formatter
      const targetFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: targetZone,
        dateStyle: "full",
        timeStyle: "long"
      });

      // Let's find the correct offset.
      // We can iterate/adjust or simply do the conversion using the timezone offset trick:
      // Formatted date in source time zone for an arbitrary time tells us how far off it is.
      // Let's do a reliable timezone-specific conversion:
      // We can represent the time in UTC and subtract the timezone's offset.
      // Since window.Intl is standard, let's write a robust converter helper:
      const parts = sourceFormatter.formatToParts(localDate);
      const parsedParts = {};
      parts.forEach(p => { parsedParts[p.type] = p.value; });

      // Calculate difference between localDate's representation and parsed parts
      const sourceYear = Number(parsedParts.year);
      const sourceMonth = Number(parsedParts.month) - 1;
      const sourceDay = Number(parsedParts.day);
      const sourceHr = Number(parsedParts.hour);
      const sourceMin = Number(parsedParts.minute);

      const sourceDummy = new Date(Date.UTC(sourceYear, sourceMonth, sourceDay, sourceHr, sourceMin));
      const diffMs = localDate.getTime() - sourceDummy.getTime();

      // True UTC time matching the selected planner hour in the source timezone
      const trueUtcTime = new Date(localDate.getTime() + diffMs);

      setConvertedPlannerTime(targetFormatter.format(trueUtcTime));
    } catch (err) {
      console.warn("Timezone calculation failed:", err);
      setConvertedPlannerTime("Calculation Error");
    }
  }, [plannerDate, plannerHour, plannerMin, sourceZone, targetZone]);

  const handleReset = () => {
    const today = new Date();
    setPlannerDate(today.toISOString().split("T")[0]);
    setPlannerHour(today.getHours());
    setPlannerMin(today.getMinutes());
    setSourceZone("UTC");
    setTargetZone("Asia/Kolkata");
  };

  const formatZoneTime = (zone) => {
    if (!currentTime) return "Loading...";
    try {
      return new Intl.DateTimeFormat("en-US", {
        timeZone: zone,
        timeStyle: "medium",
        hourCycle: "h23"
      }).format(currentTime);
    } catch (e) {
      return "Error";
    }
  };

  const formatZoneDate = (zone) => {
    if (!currentTime) return "Loading...";
    try {
      return new Intl.DateTimeFormat("en-US", {
        timeZone: zone,
        dateStyle: "medium"
      }).format(currentTime);
    } catch (e) {
      return "Error";
    }
  };

  const handleSetTimePreset = (hr) => {
    setPlannerHour(hr);
    setPlannerMin(0);
  };

  const sidebarControls = (
    <div className="space-y-4 select-none">
      <div className="space-y-1.5">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-555">
          Preset Times
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { label: "Morning (9 AM)", hr: 9 },
            { label: "Noon (12 PM)", hr: 12 },
            { label: "Evening (5 PM)", hr: 17 },
            { label: "Night (10 PM)", hr: 22 }
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => handleSetTimePreset(preset.hr)}
              className="py-2 rounded-xl text-[10px] font-bold bg-black/5 dark:bg-black/20 text-zinc-650 dark:text-zinc-400 hover:bg-black/10 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => {
          const now = new Date();
          setPlannerHour(now.getHours());
          setPlannerMin(now.getMinutes());
        }}
        className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-purple-600/15"
      >
        <span className="material-symbols-outlined text-[15px]">schedule</span>
        Use Current Time
      </button>
    </div>
  );

  return (
    <UtilityToolLayout
      title="Time Zone Converter"
      description="Compare and plan events across global timezones client-side. Automatically formats local times, offsets, and daylight savings."
      sidebarControls={sidebarControls}
      onReset={handleReset}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* World Clocks Column */}
        <div className="lg:col-span-1 flex flex-col bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 select-none">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-450 mb-4 block">World Clocks (Live)</span>
          
          <div className="space-y-3.5 my-auto">
            {ZONES.map((zone) => (
              <div
                key={zone.value}
                className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-2 hover:border-purple-500/20 transition-all duration-300"
              >
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400 shrink-0 font-mono">
                    {zone.abbr}
                  </span>
                  <span className="text-[8px] text-zinc-450 leading-tight truncate max-w-[140px] font-semibold mt-0.5">
                    {zone.label.split(" (")[1]?.replace(")", "") || zone.label}
                  </span>
                </div>
                <div className="text-right font-mono">
                  <div className="text-xs font-bold text-zinc-800 dark:text-zinc-250 leading-none mb-0.5">
                    {formatZoneTime(zone.value)}
                  </div>
                  <div className="text-[8px] text-zinc-400 leading-none">
                    {formatZoneDate(zone.value)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Planner Workspace Column */}
        <div className="lg:col-span-2 bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-between min-h-[340px]">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-450 select-none mb-4">Meeting Time Planner</span>
          
          <div className="space-y-4 flex-grow flex flex-col justify-center">
            {/* Source and Target select row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-400 select-none">Source Zone</label>
                <select
                  value={sourceZone}
                  onChange={(e) => setSourceZone(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
                >
                  {ZONES.map((zone) => (
                    <option key={zone.value} value={zone.value}>
                      {zone.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-400 select-none">Target Zone</label>
                <select
                  value={targetZone}
                  onChange={(e) => setTargetZone(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
                >
                  {ZONES.map((zone) => (
                    <option key={zone.value} value={zone.value}>
                      {zone.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date input and slider */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div className="flex flex-col gap-1 sm:col-span-1">
                <label className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-400 select-none">Date</label>
                <input
                  type="date"
                  value={plannerDate}
                  onChange={(e) => setPlannerDate(e.target.value)}
                  className="w-full bg-gray-50/50 dark:bg-zinc-900/30 border border-zinc-150 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-purple-500/50 cursor-pointer"
                />
              </div>

              {/* Hour Slider */}
              <div className="flex flex-col gap-1 sm:col-span-2">
                <div className="flex justify-between items-center text-[9px] font-extrabold uppercase tracking-wider text-zinc-400 select-none">
                  <span>Selected Time</span>
                  <span className="font-mono text-purple-500 font-bold">
                    {String(plannerHour).padStart(2, "0")}:{String(plannerMin).padStart(2, "0")}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {/* Hour Range */}
                  <input
                    type="range"
                    min="0"
                    max="23"
                    value={plannerHour}
                    onChange={(e) => setPlannerHour(Number(e.target.value))}
                    className="flex-grow accent-purple-600 bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  {/* Min Range */}
                  <input
                    type="range"
                    min="0"
                    max="59"
                    step="5"
                    value={plannerMin}
                    onChange={(e) => setPlannerMin(Number(e.target.value))}
                    className="w-20 accent-purple-600 bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Display output */}
            <div className="bg-purple-500/5 dark:bg-purple-500/[0.02] border border-purple-500/10 rounded-2xl p-4 flex flex-col mt-2 select-text">
              <span className="text-[8px] font-extrabold uppercase tracking-widest text-zinc-400 mb-1 select-none">Converted Target Time</span>
              <div className="text-xs sm:text-sm font-black text-purple-600 dark:text-purple-400">
                {convertedPlannerTime || "Configure planner to view converted details"}
              </div>
            </div>

          </div>
        </div>

      </div>
    </UtilityToolLayout>
  );
}
