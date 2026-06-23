"use client";

import { useState, useEffect } from "react";
import DevToolLayout from "../components/DevToolLayout";

// Color parsing helpers
const hexToRgb = (hex) => {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : { r: 0, g: 0, b: 0 };
};

const rgbToHsl = (r, g, b) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
};

const SWATCH_PALETTE = [
  "#f43f5e", "#ec4899", "#d946ef", "#a855f7", "#8b5cf6", "#6366f1",
  "#3b82f6", "#0ea5e9", "#06b6d4", "#14b8a6", "#10b981", "#22c55e",
  "#84cc16", "#eab308", "#f97316", "#ef4444", "#78716c", "#71717a"
];

export default function ColorPickerPage() {
  const [color, setColor] = useState("#a855f7"); // Default purple
  const [rgb, setRgb] = useState({ r: 168, g: 85, b: 247 });
  const [hsl, setHsl] = useState({ h: 271, s: 92, l: 65 });
  const [copiedKey, setCopiedKey] = useState(null);
  const [eyeDropperSupported, setEyeDropperSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.EyeDropper) {
      setEyeDropperSupported(true);
    }
  }, []);

  const handleColorChange = (newHex) => {
    setColor(newHex);
    const convertedRgb = hexToRgb(newHex);
    setRgb(convertedRgb);
    setHsl(rgbToHsl(convertedRgb.r, convertedRgb.g, convertedRgb.b));
  };

  const handleEyeDropper = async () => {
    if (!eyeDropperSupported) return;
    try {
      const ed = new window.EyeDropper();
      const result = await ed.open();
      handleColorChange(result.sRGBHex);
    } catch (e) {
      console.warn("EyeDropper failed or cancelled:", e);
    }
  };

  const handleCopy = (val, key) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleReset = () => {
    handleColorChange("#a855f7");
  };

  const formattedRgb = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  const formattedHsl = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;

  const sidebarControls = (
    <>
      {/* EyeDropper button */}
      {eyeDropperSupported && (
        <div className="space-y-2 select-none">
          <button
            onClick={handleEyeDropper}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-purple-600/15"
          >
            <span className="material-symbols-outlined text-[16px]">colorize</span>
            Pick Color From Screen
          </button>
          <p className="text-[9px] font-semibold text-zinc-400 leading-relaxed text-center">
            Leverages EyeDropper API to pick colors directly from any pixel on your desktop screen.
          </p>
        </div>
      )}

      {/* Swatches */}
      <div className="flex flex-col gap-1.5 mt-4">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Palette Swatches
        </label>
        <div className="grid grid-cols-6 gap-2">
          {SWATCH_PALETTE.map((hex) => (
            <button
              key={hex}
              onClick={() => handleColorChange(hex)}
              className="w-8 h-8 rounded-lg border border-black/10 dark:border-white/10 hover:scale-105 transition-all cursor-pointer shadow-sm relative group focus:outline-none"
              style={{ backgroundColor: hex }}
              title={hex}
            >
              {color.toLowerCase() === hex.toLowerCase() && (
                <div className="absolute inset-0 flex items-center justify-center text-white font-black text-xs mix-blend-difference select-none">
                  ✓
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <DevToolLayout
      title="Color Picker & Converter"
      description="Inspect colors on your screen and translate them between HEX, RGB, and HSL formats locally."
      sidebarControls={sidebarControls}
      onReset={handleReset}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        
        {/* Color Spectrum / Input Column */}
        <div className="bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col gap-6 items-center justify-center min-h-[350px]">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-450 self-start select-none">Color Wheel Input</span>
          
          <div
            className="w-36 h-36 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-md relative transition-all duration-300"
            style={{ backgroundColor: color }}
          ></div>

          {/* HTML Color Input */}
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={color}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-10 h-10 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden cursor-pointer"
            />
            <div className="flex flex-col select-none">
              <span className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200">Adjust Hex Spectrum</span>
              <span className="text-[9px] font-semibold text-zinc-400 mt-0.5">Click swatch to open dialog</span>
            </div>
          </div>
        </div>

        {/* Output Formats Column */}
        <div className="bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-between min-h-[350px]">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-450 select-none">Output Codes</span>
          
          <div className="space-y-4 flex-grow flex flex-col justify-center">
            {/* Hex */}
            <div className="flex flex-col gap-1 w-full">
              <div className="flex justify-between text-[10px] font-bold text-zinc-400 dark:text-zinc-550 select-none">
                <span>HEX CODE</span>
                <button
                  onClick={() => handleCopy(color.toUpperCase(), "hex")}
                  className="flex items-center gap-1 hover:text-purple-500 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[12px]">{copiedKey === "hex" ? "check" : "content_copy"}</span>
                  <span>{copiedKey === "hex" ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <div className="flex items-center bg-gray-50/50 dark:bg-zinc-900/30 border border-zinc-150 dark:border-zinc-800 rounded-xl px-3 py-2 font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200">
                {color.toUpperCase()}
              </div>
            </div>

            {/* RGB */}
            <div className="flex flex-col gap-1 w-full">
              <div className="flex justify-between text-[10px] font-bold text-zinc-400 dark:text-zinc-550 select-none">
                <span>RGB FORMAT</span>
                <button
                  onClick={() => handleCopy(formattedRgb, "rgb")}
                  className="flex items-center gap-1 hover:text-purple-500 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[12px]">{copiedKey === "rgb" ? "check" : "content_copy"}</span>
                  <span>{copiedKey === "rgb" ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <div className="flex items-center bg-gray-50/50 dark:bg-zinc-900/30 border border-zinc-150 dark:border-zinc-800 rounded-xl px-3 py-2 font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200">
                {formattedRgb}
              </div>
            </div>

            {/* HSL */}
            <div className="flex flex-col gap-1 w-full">
              <div className="flex justify-between text-[10px] font-bold text-zinc-400 dark:text-zinc-550 select-none">
                <span>HSL FORMAT</span>
                <button
                  onClick={() => handleCopy(formattedHsl, "hsl")}
                  className="flex items-center gap-1 hover:text-purple-500 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[12px]">{copiedKey === "hsl" ? "check" : "content_copy"}</span>
                  <span>{copiedKey === "hsl" ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <div className="flex items-center bg-gray-50/50 dark:bg-zinc-900/30 border border-zinc-150 dark:border-zinc-800 rounded-xl px-3 py-2 font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200">
                {formattedHsl}
              </div>
            </div>
          </div>
        </div>

      </div>
    </DevToolLayout>
  );
}
