"use client";

import { useState } from "react";
import DevToolLayout from "../components/DevToolLayout";

export default function GradientGeneratorPage() {
  const [type, setType] = useState("linear"); // linear, radial
  const [angle, setAngle] = useState(135); // 0 to 360
  const [color1, setColor1] = useState("#a855f7"); // purple
  const [stop1, setStop1] = useState(0); // 0 to 100
  const [color2, setColor2] = useState("#06b6d4"); // cyan
  const [stop2, setStop2] = useState(100); // 0 to 100
  const [isCopied, setIsCopied] = useState(false);

  const getGradientCss = () => {
    if (type === "linear") {
      return `linear-gradient(${angle}deg, ${color1} ${stop1}%, ${color2} ${stop2}%)`;
    }
    return `radial-gradient(circle, ${color1} ${stop1}%, ${color2} ${stop2}%)`;
  };

  const gradientCss = getGradientCss();
  const cssStyle = { background: gradientCss };

  const handleCopyCss = () => {
    const fullSnippet = `background: ${color1};\nbackground: ${gradientCss};`;
    navigator.clipboard.writeText(fullSnippet);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleReset = () => {
    setType("linear");
    setAngle(135);
    setColor1("#a855f7");
    setStop1(0);
    setColor2("#06b6d4");
    setStop2(100);
  };

  const sidebarControls = (
    <>
      {/* Gradient Type */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Gradient Type
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: "linear", label: "Linear" },
            { key: "radial", label: "Radial" }
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setType(item.key)}
              className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                type === item.key
                  ? "bg-purple-500/10 text-purple-500 border-purple-500/30"
                  : "bg-white/5 dark:bg-white/[0.01] text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-800 dark:hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Angle Slider (linear only) */}
      {type === "linear" && (
        <div className="flex flex-col gap-1.5 mt-2">
          <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex justify-between select-none">
            <span>Gradient Angle</span>
            <span className="font-mono text-purple-500">{angle}°</span>
          </label>
          <input
            type="range"
            min="0"
            max="360"
            step="1"
            value={angle}
            onChange={(e) => setAngle(parseInt(e.target.value))}
            className="w-full accent-purple-500 cursor-pointer"
          />
        </div>
      )}

      {/* Stop 1 Controls */}
      <div className="border-t border-border-subtle pt-3 mt-2 flex flex-col gap-2">
        <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400">Color Stop 1</span>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={color1}
            onChange={(e) => setColor1(e.target.value)}
            className="w-8 h-8 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 cursor-pointer"
          />
          <input
            type="range"
            min="0"
            max="100"
            value={stop1}
            onChange={(e) => setStop1(parseInt(e.target.value))}
            className="flex-grow accent-purple-500 cursor-pointer"
          />
          <span className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 select-none w-8 text-right">
            {stop1}%
          </span>
        </div>
      </div>

      {/* Stop 2 Controls */}
      <div className="border-t border-border-subtle pt-3 mt-2 flex flex-col gap-2">
        <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400">Color Stop 2</span>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={color2}
            onChange={(e) => setColor2(e.target.value)}
            className="w-8 h-8 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 cursor-pointer"
          />
          <input
            type="range"
            min="0"
            max="100"
            value={stop2}
            onChange={(e) => setStop2(parseInt(e.target.value))}
            className="flex-grow accent-purple-500 cursor-pointer"
          />
          <span className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 select-none w-8 text-right">
            {stop2}%
          </span>
        </div>
      </div>
    </>
  );

  return (
    <DevToolLayout
      title="Gradient Generator"
      description="Design linear or radial CSS gradients, preview layouts, and copy copy-pasteable background tags."
      sidebarControls={sidebarControls}
      onReset={handleReset}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        
        {/* Live Preview Column */}
        <div className="bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-between min-h-[350px]">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-450 select-none">Live CSS Preview</span>
          
          <div
            className="w-full flex-grow rounded-2xl border border-zinc-250 dark:border-zinc-750 shadow-md min-h-[220px] transition-all duration-300 mt-4"
            style={cssStyle}
          ></div>
        </div>

        {/* Copy CSS Code Column */}
        <div className="bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-between min-h-[350px]">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-450 select-none">Generated CSS Code</span>
          
          <div className="flex-grow flex flex-col justify-center gap-4">
            <div className="flex flex-col gap-1 w-full mt-4">
              <div className="flex justify-between text-[10px] font-bold text-zinc-450 select-none">
                <span>CSS STYLESHEET SNIPPET</span>
                <button
                  onClick={handleCopyCss}
                  className="flex items-center gap-1 hover:text-purple-500 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[12px]">{isCopied ? "check" : "content_copy"}</span>
                  <span>{isCopied ? "Copied" : "Copy Code"}</span>
                </button>
              </div>
              <div className="bg-gray-50/50 dark:bg-zinc-900/30 border border-zinc-150 dark:border-zinc-800 rounded-xl p-4 font-mono text-[10px] font-bold text-zinc-800 dark:text-zinc-200 select-all leading-relaxed whitespace-pre-wrap break-all">
                {`/* CSS Gradient styling */\nbackground: ${color1};\nbackground: ${gradientCss};`}
              </div>
            </div>
          </div>
        </div>

      </div>
    </DevToolLayout>
  );
}
