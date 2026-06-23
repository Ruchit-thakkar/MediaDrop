"use client";

import { useEffect, useRef, useState } from "react";

export default function WaveformVisualizer({
  audioBuffer,
  currentTime = 0,
  duration = 0,
  onSeek = null
}) {
  const canvasRef = useRef(null);
  const [peaks, setPeaks] = useState([]);

  // Analyze audioBuffer to extract downsampled peak values
  useEffect(() => {
    if (!audioBuffer) {
      setPeaks([]);
      return;
    }

    const numBars = 150;
    const channelData = audioBuffer.getChannelData(0);
    const samplesPerBar = Math.floor(channelData.length / numBars) || 1;
    const extractedPeaks = [];

    // Extract maximum amplitude in each sub-segment
    for (let i = 0; i < numBars; i++) {
      let max = 0;
      const startSample = i * samplesPerBar;
      for (let j = 0; j < samplesPerBar; j++) {
        if (startSample + j >= channelData.length) break;
        const val = Math.abs(channelData[startSample + j]);
        if (val > max) max = val;
      }
      extractedPeaks.push(max);
    }

    // Normalize peaks to be between 0.05 and 1.0 to look good
    const maxPeak = Math.max(...extractedPeaks) || 1;
    const normalized = extractedPeaks.map(p => Math.max(0.06, p / maxPeak));
    setPeaks(normalized);
  }, [audioBuffer]);

  // Render the waveform bars on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    
    // Size canvas with device pixel ratio to look crisp on Retina displays
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    ctx.clearRect(0, 0, w, h);

    if (peaks.length === 0) return;

    const barWidth = 3;
    const gap = 2;
    const totalBarWidth = barWidth + gap;
    
    // Center the waveform horizontally if bars don't fill the canvas
    const startX = Math.max(0, (w - peaks.length * totalBarWidth) / 2);
    
    // Determine active (played) bar limit based on current progress
    const progress = duration > 0 ? currentTime / duration : 0;
    const activeLimit = Math.floor(progress * peaks.length);

    for (let i = 0; i < peaks.length; i++) {
      const peak = peaks[i];
      const barHeight = peak * h * 0.8;
      const x = startX + i * totalBarWidth;
      const y = (h - barHeight) / 2;

      // Color active bars with a beautiful purple-indigo gradient
      if (i < activeLimit) {
        const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
        gradient.addColorStop(0, "#a855f7"); // Purple-500
        gradient.addColorStop(1, "#6366f1"); // Indigo-500
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = "rgba(113, 113, 122, 0.25)"; // zinc-500 at 25% opacity
      }

      // Draw rounded bars
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 1.5);
      ctx.fill();
    }
  }, [peaks, currentTime, duration]);

  const handleCanvasClick = (e) => {
    if (!onSeek || !canvasRef.current || duration <= 0) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    
    const barWidth = 3;
    const gap = 2;
    const totalBarWidth = barWidth + gap;
    const startX = Math.max(0, (rect.width - peaks.length * totalBarWidth) / 2);

    const relativeX = clickX - startX;
    if (relativeX < 0) return;

    const barIndex = Math.min(peaks.length - 1, Math.floor(relativeX / totalBarWidth));
    const seekFraction = Math.max(0, Math.min(1, barIndex / peaks.length));
    onSeek(seekFraction * duration);
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="relative w-full h-24 bg-zinc-950/40 border border-zinc-200/5 dark:border-zinc-800/80 rounded-2xl overflow-hidden cursor-pointer select-none">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full h-full block"
        />
      </div>
      <div className="flex justify-between text-[10px] font-mono text-zinc-500 px-1 select-none">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}

// Helper to format duration to mm:ss
function formatTime(secs) {
  if (isNaN(secs) || secs === Infinity) return "00:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
