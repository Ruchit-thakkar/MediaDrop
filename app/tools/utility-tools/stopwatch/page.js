"use client";

import { useState, useEffect, useRef } from "react";
import UtilityToolLayout from "../components/UtilityToolLayout";

export default function StopwatchPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0); // in milliseconds
  const [laps, setLaps] = useState([]);
  
  const timerRef = useRef(null);
  const startTimeRef = useRef(0);
  const elapsedRef = useRef(0);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
    };
  }, []);

  const updateTimer = () => {
    const now = Date.now();
    const currentElapsed = now - startTimeRef.current;
    setTime(currentElapsed);
    elapsedRef.current = currentElapsed;
    timerRef.current = requestAnimationFrame(updateTimer);
  };

  const handleStartPause = () => {
    if (isRunning) {
      // Pause
      setIsRunning(false);
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
      }
    } else {
      // Start/Resume
      setIsRunning(true);
      startTimeRef.current = Date.now() - elapsedRef.current;
      timerRef.current = requestAnimationFrame(updateTimer);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
    }
    setTime(0);
    elapsedRef.current = 0;
    setLaps([]);
  };

  const handleLap = () => {
    if (!isRunning) return;
    
    const splitTime = elapsedRef.current;
    const previousSplit = laps.length > 0 ? laps[0].split : 0;
    const lapTime = splitTime - previousSplit;

    const newLap = {
      id: laps.length + 1,
      lap: lapTime,
      split: splitTime
    };

    // Prepend new lap to list
    setLaps((prev) => [newLap, ...prev]);
  };

  // Helper to format ms to MM:SS.CC
  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
  };

  // Identify fastest and slowest laps
  const getLapType = (lapId) => {
    if (laps.length < 2) return null;
    
    // Find min and max lap durations
    const lapTimes = laps.map(l => l.lap);
    const minTime = Math.min(...lapTimes);
    const maxTime = Math.max(...lapTimes);

    const currentLapObj = laps.find(l => l.id === lapId);
    if (!currentLapObj) return null;

    if (currentLapObj.lap === minTime) return "fastest";
    if (currentLapObj.lap === maxTime) return "slowest";
    return null;
  };

  // Calculate statistics
  const getAverageLapTime = () => {
    if (laps.length === 0) return 0;
    const sum = laps.reduce((acc, l) => acc + l.lap, 0);
    return sum / laps.length;
  };

  const sidebarControls = (
    <div className="space-y-4 select-none">
      <div className="bg-black/5 dark:bg-black/25 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-[10px] text-zinc-500 dark:text-zinc-450 leading-relaxed font-semibold">
        <span className="text-purple-500 uppercase tracking-widest font-extrabold text-[8px] block mb-1">Stopwatch Stats</span>
        <div className="flex justify-between mb-1">
          <span>Laps Recorded:</span>
          <span className="font-bold text-zinc-700 dark:text-zinc-350">{laps.length}</span>
        </div>
        {laps.length > 0 && (
          <div className="flex justify-between">
            <span>Avg Lap Time:</span>
            <span className="font-bold text-zinc-700 dark:text-zinc-350 font-mono">
              {formatTime(getAverageLapTime())}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <UtilityToolLayout
      title="Stopwatch"
      description="Record precise split times and laps using a high-precision, drift-free client-side stopwatch."
      sidebarControls={sidebarControls}
      onReset={handleReset}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Stopwatch Display Column */}
        <div className="lg:col-span-1.5 flex flex-col bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 items-center justify-between min-h-[300px] select-none">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-450 self-start">Stopwatch Readout</span>
          
          {/* Circular Pulse Graphic */}
          <div className="relative w-44 h-44 my-auto flex items-center justify-center">
            {/* Visual Ring */}
            <div className={`absolute inset-0 rounded-full border-4 border-dashed border-purple-500/20 ${
              isRunning ? "animate-spin [animation-duration:12s]" : ""
            }`} />
            
            {/* Pulse Glow */}
            <div className={`absolute inset-2 rounded-full bg-purple-500/5 dark:bg-purple-500/[0.02] border border-purple-500/10 transition-transform ${
              isRunning ? "scale-105 animate-pulse" : ""
            }`} />

            <div className="absolute font-mono text-3xl font-black text-purple-650 dark:text-purple-400">
              {formatTime(time)}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-4 w-full">
            <button
              onClick={handleStartPause}
              className={`flex-grow py-3 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                isRunning
                  ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/15"
                  : "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/15"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {isRunning ? "pause" : "play_arrow"}
              </span>
              {isRunning ? "Pause" : "Start"}
            </button>

            <button
              onClick={isRunning ? handleLap : handleReset}
              disabled={time === 0}
              className="flex-grow py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-850 dark:text-zinc-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-zinc-200 dark:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[16px]">
                {isRunning ? "flag" : "refresh"}
              </span>
              {isRunning ? "Lap" : "Reset"}
            </button>
          </div>
        </div>

        {/* Laps List Column */}
        <div className="lg:col-span-1.5 bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-between h-[300px]">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-450 select-none mb-4">Laps Log</span>
          
          <div className="flex-grow overflow-y-auto pr-1">
            {laps.length > 0 ? (
              <table className="w-full text-left font-semibold text-xs border-collapse">
                <thead>
                  <tr className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 dark:border-zinc-800/80 pb-2 select-none">
                    <th className="py-2">Lap</th>
                    <th className="py-2 text-right">Lap Time</th>
                    <th className="py-2 text-right">Overall Split</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/40">
                  {laps.map((lap) => {
                    const lapType = getLapType(lap.id);
                    return (
                      <tr key={lap.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                        <td className="py-2.5 flex items-center gap-1.5">
                          <span className="font-mono text-zinc-400">#{lap.id}</span>
                          {lapType === "fastest" && (
                            <span className="text-[8px] font-black uppercase text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-md select-none">
                              Fastest
                            </span>
                          )}
                          {lapType === "slowest" && (
                            <span className="text-[8px] font-black uppercase text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-md select-none">
                              Slowest
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 text-right font-mono text-zinc-700 dark:text-zinc-300 font-bold">
                          {formatTime(lap.lap)}
                        </td>
                        <td className="py-2.5 text-right font-mono text-zinc-500">
                          {formatTime(lap.split)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-400 text-xs italic select-none">
                Start the stopwatch and click Lap to record splits
              </div>
            )}
          </div>
        </div>

      </div>
    </UtilityToolLayout>
  );
}
