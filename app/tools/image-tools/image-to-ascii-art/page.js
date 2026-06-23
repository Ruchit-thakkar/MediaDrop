"use client";

import { useState, useEffect } from "react";
import ImageToolLayout from "../components/ImageToolLayout";

const charPresets = {
  standard: "@#S%?*+;:-. ",
  blocks: "█▓▒░ ",
  binary: "10",
  simple: "#+. "
};

export default function ImageToAsciiPage() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [asciiText, setAsciiText] = useState("");
  
  // Custom Controls
  const [density, setDensity] = useState(80); // Width in characters (30 to 150)
  const [charPreset, setCharPreset] = useState("standard");
  const [processing, setProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileUploaded = (uploadedFile) => {
    setFile(uploadedFile);
    setPreviewUrl(URL.createObjectURL(uploadedFile));
    setAsciiText("");
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setAsciiText("");
    setDensity(80);
    setCharPreset("standard");
    setCopied(false);
  };

  const convertToAscii = () => {
    if (!file || !previewUrl) return;
    setProcessing(true);

    const img = new Image();
    img.src = previewUrl;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Recalculate dimensions. Monospace characters are typically taller than they are wide (approx. ratio of 0.55)
      const aspect = img.naturalWidth / img.naturalHeight;
      const targetWidth = density;
      const targetHeight = Math.round(density / aspect * 0.52);

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Draw downscaled image
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
      const data = imgData.data;
      const charSet = charPresets[charPreset];

      let asciiResult = "";
      for (let y = 0; y < targetHeight; y++) {
        for (let x = 0; x < targetWidth; x++) {
          const idx = (y * targetWidth + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          // Compute relative grayscale brightness
          const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
          
          // Map brightness to character index
          const charIdx = Math.floor((brightness / 255) * (charSet.length - 1));
          asciiResult += charSet[charIdx];
        }
        asciiResult += "\n";
      }

      setAsciiText(asciiResult);
      setProcessing(false);
    };
    img.onerror = () => setProcessing(false);
  };

  // Re-run ASCII conversion when settings modify
  useEffect(() => {
    if (file && previewUrl) {
      const debounce = setTimeout(() => {
        convertToAscii();
      }, 300);
      return () => clearTimeout(debounce);
    }
  }, [density, charPreset, file, previewUrl]);

  const handleCopyText = () => {
    if (!asciiText) return;
    navigator.clipboard.writeText(asciiText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!asciiText) return;
    const blob = new Blob([asciiText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const baseName = file.name.substring(0, file.name.lastIndexOf("."));
    a.download = `${baseName}_ascii_art.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sidebarControls = (
    <>
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex justify-between">
          <span>Density (Width)</span>
          <span className="font-mono text-purple-500">{density} chars</span>
        </label>
        <input
          type="range"
          min="40"
          max="120"
          step="5"
          value={density}
          onChange={(e) => setDensity(parseInt(e.target.value))}
          className="w-full accent-purple-500 cursor-pointer"
        />
        <p className="text-[9px] font-semibold text-zinc-400 leading-relaxed mt-1 select-none">
          Lower density generates cleaner fits; higher density shows more pixel details.
        </p>
      </div>

      <div className="flex flex-col gap-1.5 mt-4">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Character Map
        </label>
        <select
          value={charPreset}
          onChange={(e) => setCharPreset(e.target.value)}
          className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none"
        >
          <option value="standard">Standard (@#S%?*+;:-.)</option>
          <option value="blocks">Blocks (█▓▒░ )</option>
          <option value="binary">Binary (10)</option>
          <option value="simple">Simple (#+.)</option>
        </select>
      </div>

      {asciiText && (
        <button
          onClick={handleCopyText}
          className="w-full mt-4 py-2 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white/5 dark:bg-white/[0.01] hover:bg-black/5 dark:hover:bg-white/5 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white cursor-pointer transition-all flex items-center justify-between"
        >
          <span>Copy ASCII Art</span>
          <span className="material-symbols-outlined text-[16px]">
            {copied ? "check" : "content_copy"}
          </span>
        </button>
      )}
    </>
  );

  return (
    <ImageToolLayout
      title="Image to ASCII Art"
      description="Convert pictures into stylized plain-text ASCII character art, copy results, and download text files locally."
      sidebarControls={sidebarControls}
      onFileUploaded={handleFileUploaded}
      onReset={handleReset}
      onDownload={handleDownload}
      downloadDisabled={!asciiText}
      originalFile={file}
      processing={processing}
    >
      {/* Workspace Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full items-stretch">
        {/* Original Image Preview */}
        <div className="bg-white dark:bg-[#262930] rounded-2xl shadow-sm overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between h-[380px]">
          <div className="bg-gray-50 dark:bg-zinc-800/80 px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center select-none">
            <h3 className="font-extrabold text-zinc-700 dark:text-zinc-300 text-xs">Original</h3>
            <span className="text-[10px] font-mono text-zinc-500">Source</span>
          </div>
          <div className="p-4 flex items-center justify-center flex-grow bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2Y5ZmRmZCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjJmMmYyIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmMmYyZjIiLz48L3N2Zz4=')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMjYyOTMwIi8+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMWQxZjI0Ii8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMxZDFmMjQiLz48L3N2Zz4=')] overflow-hidden">
            <img src={previewUrl} className="max-h-full max-w-full object-contain rounded shadow-sm" alt="Original" />
          </div>
        </div>

        {/* ASCII Art Preview */}
        <div className="bg-white dark:bg-[#262930] rounded-2xl shadow-md overflow-hidden border border-purple-500/20 flex flex-col justify-between h-[380px]">
          <div className="bg-purple-50 dark:bg-purple-950/20 px-4 py-2.5 border-b border-purple-500/20 flex justify-between items-center select-none">
            <h3 className="font-extrabold text-purple-600 dark:text-purple-400 text-xs">ASCII Output</h3>
            <span className="text-[10px] font-mono text-purple-500">Plain Text</span>
          </div>
          <div className="p-4 flex flex-col justify-start flex-grow bg-zinc-950 overflow-auto custom-scrollbar select-all">
            {processing ? (
              <div className="flex flex-col items-center justify-center m-auto">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-3"></div>
                <p className="text-xs font-semibold text-purple-500">Generating ASCII characters...</p>
              </div>
            ) : asciiText ? (
              <pre className="font-mono text-[7px] leading-[0.9] text-zinc-300 whitespace-pre tracking-normal m-auto">
                {asciiText}
              </pre>
            ) : (
              <p className="text-xs font-semibold text-zinc-500 m-auto">Processing...</p>
            )}
          </div>
        </div>
      </div>
    </ImageToolLayout>
  );
}
