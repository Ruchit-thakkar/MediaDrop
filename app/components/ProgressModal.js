"use client";

import { useState, useEffect, useRef } from "react";

export default function ProgressModal({ preparingDownload, metadata }) {
  const [isOpen, setIsOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState("0.0 MB/s");
  const [eta, setEta] = useState("--");
  const [statusText, setStatusText] = useState("Preparing your download...");
  const [isSuccess, setIsSuccess] = useState(false);

  const prevPreparing = useRef(null);
  const timerRef = useRef(null);

  // Dynamic file name based on current download format
  const getDownloadFilename = () => {
    if (!metadata) return "media_file.mp4";
    const title = metadata.title || "Media File";
    const safeTitle = title.replace(/[^\w\s-]/gi, '').trim() || "download";
    
    const dlKey = preparingDownload ? preparingDownload.toLowerCase() : "";
    if (dlKey.includes("mp3") || dlKey.includes("audio")) {
      return `${safeTitle}.mp3`;
    }
    if (dlKey.includes("thumbnail") || dlKey.includes("jpg") || dlKey.includes("image")) {
      return `${safeTitle}.jpg`;
    }
    if (dlKey.includes("zip")) {
      return `${safeTitle}_images.zip`;
    }
    return `${safeTitle}.mp4`;
  };

  const filename = getDownloadFilename();

  useEffect(() => {
    // Detect download start
    if (preparingDownload && !prevPreparing.current) {
      setIsOpen(true);
      setIsSuccess(false);
      setProgress(0);
      setStatusText("Preparing your download...");
      setSpeed("1.2 MB/s");
      setEta("Calculating...");

      // Start progress simulation
      let currentProgress = 0;
      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        let increment = 0;
        if (currentProgress < 20) {
          increment = Math.random() * 6 + 2;
        } else if (currentProgress < 60) {
          increment = Math.random() * 3 + 1;
        } else if (currentProgress < 90) {
          increment = Math.random() * 1.5 + 0.5;
        } else {
          increment = Math.random() * 0.15 + 0.05; // hold near end
        }

        currentProgress = Math.min(97, currentProgress + increment);
        const nextProgress = Math.floor(currentProgress);
        setProgress(nextProgress);

        // Update status text based on progress
        if (nextProgress < 15) {
          setStatusText("Preparing your download...");
        } else if (nextProgress < 50) {
          setStatusText("Downloading media stream...");
        } else if (nextProgress < 80) {
          setStatusText("Processing audio stream...");
        } else {
          setStatusText("Generating output file...");
        }

        // Simulate speed (e.g. 4.2 MB/s, changing slightly)
        const simulatedSpeed = (Math.random() * 0.8 + 3.8).toFixed(1);
        setSpeed(`${simulatedSpeed} MB/s`);
        
        // Calculate ETA
        const remainingSeconds = Math.max(1, Math.round((98 - nextProgress) * 0.35));
        setEta(`${remainingSeconds} sec left`);
      }, 200);
    }

    // Detect download completion
    if (!preparingDownload && prevPreparing.current && isOpen) {
      if (timerRef.current) clearInterval(timerRef.current);

      setProgress(100);
      setStatusText("Ready!");
      setIsSuccess(true);

      // Close modal slide-out after 1.8 seconds
      setTimeout(() => {
        setIsOpen(false);
      }, 1800);
    }

    prevPreparing.current = preparingDownload;

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [preparingDownload, isOpen, metadata]);

  if (!isOpen) return null;

  const radius = 32;
  const stroke = 3.5;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="fixed bottom-6 right-6 z-[100] w-80 max-w-sm premium-card rounded-2xl p-4 border border-purple-500/20 shadow-[0_10px_40px_-10px_rgba(124,58,237,0.3)] animate-slide-in select-none">
      {/* Glow backdrop inside popup */}
      <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] rounded-full bg-radial from-purple-500/5 to-transparent pointer-events-none z-[-1]"></div>

      <div className="flex items-center gap-4">
        {/* Left Column: Circular Progress Percentage Ring */}
        <div className="relative flex items-center justify-center w-16 h-16 shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              className="text-zinc-800/80"
              strokeWidth={stroke}
              stroke="currentColor"
              fill="transparent"
              r={normalizedRadius}
              cx={32}
              cy={32}
            />
            <circle
              className="text-purple-500 transition-all duration-300"
              strokeWidth={stroke}
              strokeDasharray={circumference + " " + circumference}
              style={{ strokeDashoffset }}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r={normalizedRadius}
              cx={32}
              cy={32}
            />
          </svg>
          <div className="absolute text-xs font-extrabold text-white">
            {isSuccess ? (
              <span className="material-symbols-outlined text-emerald-400 text-lg font-bold">check</span>
            ) : (
              `${progress}%`
            )}
          </div>
        </div>

        {/* Right Column: Title, Filename, Waveform, Speed */}
        <div className="flex-grow min-w-0">
          <h4 className="text-white font-extrabold text-sm leading-none">
            {isSuccess ? "Finished Download" : "Downloading..."}
          </h4>
          <p className="text-[10px] text-zinc-400 font-bold truncate mt-1.5" title={filename}>
            {filename}
          </p>

          {/* Animated Waveform & Speed details */}
          {!isSuccess && (
            <div className="mt-2.5 flex items-center gap-3">
              {/* Flexbox audio-style waveform (gradient purple to blue) */}
              <div className="flex items-end gap-[2px] h-4 w-14 shrink-0 overflow-hidden">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((bar) => {
                  const heights = ["h-2", "h-3", "h-4", "h-2.5", "h-3.5", "h-2", "h-3", "h-4", "h-2.5", "h-3"];
                  return (
                    <div
                      key={bar}
                      className={`w-[2px] ${heights[bar-1]} bg-gradient-to-t from-purple-500 to-blue-500 rounded-full wave-bar`}
                    ></div>
                  );
                })}
              </div>

              {/* Speed rate and ETA */}
              <div className="flex items-center gap-2 text-[9px] font-mono text-zinc-400 font-bold">
                <span className="material-symbols-outlined text-[11px] text-purple-400 font-extrabold">download</span>
                <span>{speed}</span>
                <span className="text-zinc-600">•</span>
                <span>{eta}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Status bar with green pulse dot */}
      <div className="mt-3.5 pt-2.5 border-t border-white/[0.04] flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSuccess ? 'bg-emerald-400' : 'bg-emerald-500 animate-pulse'}`}></span>
        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide">
          {statusText}
        </span>
      </div>
    </div>
  );
}
