"use client";

import { useState, useEffect, useRef } from "react";
import ImageToolLayout from "../components/ImageToolLayout";

// Helper to convert RGB to HSL
function rgbToHsl(r, g, b) {
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
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

export default function ColorPickerPage() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  // Custom states
  const [hoverColor, setHoverColor] = useState({ hex: "#ffffff", rgb: "rgb(255,255,255)" });
  const [selectedColor, setSelectedColor] = useState({ hex: "#7C3AED", rgb: "rgb(124,58,237)", hsl: "hsl(258,81%,58%)" });
  const [colorHistory, setColorHistory] = useState([]);
  const [copiedText, setCopiedText] = useState("");

  const canvasRef = useRef(null);
  const loupeRef = useRef(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileUploaded = (uploadedFile) => {
    setFile(uploadedFile);
    setPreviewUrl(URL.createObjectURL(uploadedFile));
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setColorHistory([]);
    setHoverColor({ hex: "#ffffff", rgb: "rgb(255,255,255)" });
    setSelectedColor({ hex: "#7C3AED", rgb: "rgb(124,58,237)", hsl: "hsl(258,81%,58%)" });
  };

  // Process mouse move over the image to read pixel data and update loupe
  const handleMouseMove = (e) => {
    if (!file || !previewUrl) return;
    const img = e.currentTarget;
    const rect = img.getBoundingClientRect();
    
    // Scale client coords to natural dimensions
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * img.naturalWidth);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * img.naturalHeight);

    const canvas = canvasRef.current || document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);

    try {
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const r = pixel[0];
      const g = pixel[1];
      const b = pixel[2];

      const hex = "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("");
      const rgb = `rgb(${r},${g},${b})`;
      setHoverColor({ hex, rgb });

      // Update Loupe magnifying glass
      if (loupeRef.current) {
        const lCanvas = loupeRef.current;
        const lCtx = lCanvas.getContext("2d");
        lCtx.imageSmoothingEnabled = false;
        
        // Clear loupe
        lCtx.clearRect(0, 0, lCanvas.width, lCanvas.height);
        
        // Draw 9x9 zoomed grid around cursor
        const zoomSize = 9;
        const offset = Math.floor(zoomSize / 2);
        lCtx.drawImage(
          canvas,
          x - offset, y - offset, zoomSize, zoomSize,
          0, 0, lCanvas.width, lCanvas.height
        );

        // Draw crosshair in center of loupe
        lCtx.strokeStyle = "rgba(124, 58, 237, 0.8)";
        lCtx.lineWidth = 1.5;
        const center = lCanvas.width / 2;
        const pixelScale = lCanvas.width / zoomSize;
        lCtx.strokeRect(center - pixelScale/2, center - pixelScale/2, pixelScale, pixelScale);
      }
    } catch (err) {
      console.warn("Unable to pick pixel color (likely CORS or Canvas issue):", err);
    }
  };

  const handleMouseClick = () => {
    const [r, g, b] = hoverColor.rgb.match(/\d+/g).map(Number);
    const [h, s, l] = rgbToHsl(r, g, b);
    const hsl = `hsl(${h},${s}%,${l}%)`;

    const newColor = {
      hex: hoverColor.hex,
      rgb: hoverColor.rgb,
      hsl
    };

    setSelectedColor(newColor);

    // Add to history (limit to 6 entries)
    setColorHistory(prev => {
      if (prev.some(c => c.hex === newColor.hex)) return prev;
      return [newColor, ...prev.slice(0, 5)];
    });
  };

  const handleCopy = (text, formatName) => {
    navigator.clipboard.writeText(text);
    setCopiedText(formatName);
    setTimeout(() => setCopiedText(""), 1500);
  };

  const sidebarControls = (
    <>
      {/* Loupe magnifying glass */}
      <div className="flex flex-col gap-1.5 items-center justify-center py-2 bg-zinc-50 dark:bg-white/[0.01] rounded-2xl border border-zinc-200 dark:border-zinc-800 select-none">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">
          Pixel Zoom Loupe
        </span>
        <canvas 
          ref={loupeRef} 
          width={108} 
          height={108} 
          className="rounded-full border border-purple-500/30 shadow-md bg-zinc-900"
        />
        <span className="font-mono text-[9px] text-zinc-400 mt-1">Hover to magnify</span>
      </div>

      {/* Selected Color info */}
      <div className="flex flex-col gap-3 mt-4">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 select-none">
          Active Selection
        </label>
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-xl border border-border-subtle shadow-inner shrink-0" 
            style={{ backgroundColor: selectedColor.hex }}
          />
          <div className="flex flex-col min-w-0">
            <span className="font-mono text-sm font-extrabold text-zinc-800 dark:text-white uppercase">
              {selectedColor.hex}
            </span>
            <span className="text-[9px] font-bold text-zinc-400 truncate">
              {selectedColor.rgb}
            </span>
          </div>
        </div>

        {/* Copy Codes Section */}
        <div className="space-y-2 mt-2">
          {[
            { label: "HEX", val: selectedColor.hex },
            { label: "RGB", val: selectedColor.rgb },
            { label: "HSL", val: selectedColor.hsl }
          ].map(fmt => (
            <button
              key={fmt.label}
              onClick={() => handleCopy(fmt.val, fmt.label)}
              className="w-full flex items-center justify-between py-2 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white/5 dark:bg-white/[0.01] hover:bg-black/5 dark:hover:bg-white/5 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white cursor-pointer transition-all"
            >
              <span>{fmt.label}: <span className="font-mono text-[10px] ml-1">{fmt.val}</span></span>
              <span className="material-symbols-outlined text-[15px]">
                {copiedText === fmt.label ? "check" : "content_copy"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* History */}
      {colorHistory.length > 0 && (
        <div className="flex flex-col gap-1.5 mt-4 select-none">
          <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            Swatches History
          </label>
          <div className="flex flex-wrap gap-2">
            {colorHistory.map((c) => (
              <button
                key={c.hex}
                onClick={() => setSelectedColor(c)}
                title={c.hex}
                className="w-7 h-7 rounded-lg border border-border-subtle cursor-pointer transition-transform hover:scale-105 active:scale-95"
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );

  return (
    <ImageToolLayout
      title="Image Color Picker"
      description="Pick precise pixel color codes from your images. Hover to zoom and click to copy HEX, RGB, or HSL values."
      sidebarControls={sidebarControls}
      onFileUploaded={handleFileUploaded}
      onReset={handleReset}
      downloadDisabled={true} // Non-saving tool
      originalFile={file}
    >
      <canvas ref={canvasRef} className="hidden" />

      {/* Workspace Preview */}
      <div className="bg-white dark:bg-[#262930] rounded-2xl shadow-sm overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between h-[380px] w-full">
        <div className="bg-gray-50 dark:bg-zinc-800/80 px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center select-none">
          <h3 className="font-extrabold text-zinc-700 dark:text-zinc-300 text-xs">Color Picker Workspace</h3>
          <span className="text-[10px] font-mono text-zinc-500">Click Image to Lock Color</span>
        </div>
        <div className="p-4 flex items-center justify-center flex-grow bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2Y5ZmRmZCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjJmMmYyIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmMmYyZjIiLz48L3N2Zz4=')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMjYyOTMwIi8+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMWQxZjI0Ii8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMxZDFmMjQiLz48L3N2Zz4=')] overflow-hidden relative">
          <div className="max-h-full max-w-full flex items-center justify-center">
            <img 
              src={previewUrl} 
              onMouseMove={handleMouseMove}
              onClick={handleMouseClick}
              className="max-h-[300px] max-w-full block cursor-crosshair select-none rounded shadow-sm border border-zinc-200 dark:border-zinc-800" 
              alt="Workspace Color Pick" 
            />
          </div>
        </div>
      </div>
    </ImageToolLayout>
  );
}
