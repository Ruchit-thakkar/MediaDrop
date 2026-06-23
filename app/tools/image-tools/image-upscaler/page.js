"use client";

import { useState, useEffect } from "react";
import ImageToolLayout from "../components/ImageToolLayout";

export default function ImageUpscalerPage() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [upscaledUrl, setUpscaledUrl] = useState(null);
  const [upscaledSize, setUpscaledSize] = useState(null);
  
  // Custom Controls
  const [scale, setScale] = useState(2); // 2x or 4x
  const [smoothScale, setSmoothScale] = useState(true); // true = bicubic/bilinear, false = nearest neighbor (pixel art)
  const [processing, setProcessing] = useState(false);
  const [naturalWidth, setNaturalWidth] = useState(0);
  const [naturalHeight, setNaturalHeight] = useState(0);

  // Clean up previewUrl safely on change or unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Clean up upscaledUrl safely on change or unmount
  useEffect(() => {
    return () => {
      if (upscaledUrl) URL.revokeObjectURL(upscaledUrl);
    };
  }, [upscaledUrl]);

  const handleFileUploaded = (uploadedFile) => {
    setFile(uploadedFile);
    const url = URL.createObjectURL(uploadedFile);
    setPreviewUrl(url);
    setUpscaledUrl(null);
    setUpscaledSize(null);

    const img = new Image();
    img.src = url;
    img.onload = () => {
      setNaturalWidth(img.naturalWidth);
      setNaturalHeight(img.naturalHeight);
    };
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setUpscaledUrl(null);
    setUpscaledSize(null);
    setNaturalWidth(0);
    setNaturalHeight(0);
  };

  const upscaleImage = () => {
    if (!file || !previewUrl) return;
    setProcessing(true);

    const img = new Image();
    img.src = previewUrl;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;

      canvas.width = w;
      canvas.height = h;

      // Handle scaling algorithm
      ctx.imageSmoothingEnabled = smoothScale;
      if (smoothScale) {
        ctx.imageSmoothingQuality = "high";
      }

      ctx.drawImage(img, 0, 0, w, h);

      canvas.toBlob((blob) => {
        if (blob) {
          setUpscaledUrl(URL.createObjectURL(blob));
          setUpscaledSize(blob.size);
        }
        setProcessing(false);
      }, file.type);
    };
    img.onerror = () => setProcessing(false);
  };

  // Re-run upscaler on options changes
  useEffect(() => {
    if (file && previewUrl) {
      upscaleImage();
    }
  }, [scale, smoothScale, file, previewUrl]);

  const handleDownload = () => {
    if (!upscaledUrl) return;
    const a = document.createElement("a");
    a.href = upscaledUrl;
    const extension = file.name.substring(file.name.lastIndexOf(".") + 1);
    const baseName = file.name.substring(0, file.name.lastIndexOf("."));
    a.download = `${baseName}_upscaled_${scale}x.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const sidebarControls = (
    <>
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Upscaling Factor
        </label>
        <div className="grid grid-cols-2 gap-3">
          {[2, 4].map((f) => (
            <button
              key={f}
              onClick={() => setScale(f)}
              className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                scale === f
                  ? "bg-purple-500/10 text-purple-500 border-purple-500/30"
                  : "bg-white/5 dark:bg-white/[0.01] text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-800 dark:hover:text-white"
              }`}
            >
              {f}x Scale
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4 select-none">
        <input
          type="checkbox"
          id="smooth-scale"
          checked={smoothScale}
          onChange={(e) => setSmoothScale(e.target.checked)}
          className="rounded border-zinc-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer accent-purple-500"
        />
        <label htmlFor="smooth-scale" className="text-xs font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer">
          Bicubic Smoothing
        </label>
      </div>
      <p className="text-[9px] font-semibold text-zinc-400 leading-relaxed mt-1 select-none">
        Keep checked for photos (smooth borders). Uncheck for retro pixel art (sharp, blocky pixels).
      </p>

      {naturalWidth > 0 && (
        <div className="mt-4 p-3 bg-zinc-50 dark:bg-white/[0.01] rounded-2xl border border-zinc-200 dark:border-zinc-800 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 space-y-1.5 select-none">
          <div className="flex justify-between">
            <span>Natural Size:</span>
            <span>{naturalWidth} × {naturalHeight} px</span>
          </div>
          <div className="flex justify-between text-purple-500">
            <span>Upscaled Size:</span>
            <span>{naturalWidth * scale} × {naturalHeight * scale} px</span>
          </div>
        </div>
      )}
    </>
  );

  return (
    <ImageToolLayout
      title="Image Upscaler"
      description="Upscale image resolutions locally in your browser. Select between 2x and 4x scaling multipliers with custom pixel blending modes."
      sidebarControls={sidebarControls}
      onFileUploaded={handleFileUploaded}
      onReset={handleReset}
      onDownload={handleDownload}
      downloadDisabled={!upscaledUrl}
      originalFile={file}
      processedUrl={upscaledUrl}
      processedSize={upscaledSize}
      processing={processing}
    >
      {/* Workspace Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full items-stretch">
        {/* Original Image Preview */}
        <div className="bg-white dark:bg-[#262930] rounded-2xl shadow-sm overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between h-[380px]">
          <div className="bg-gray-50 dark:bg-zinc-800/80 px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center select-none">
            <h3 className="font-extrabold text-zinc-700 dark:text-zinc-300 text-xs">Original</h3>
            {naturalWidth > 0 && (
              <span className="text-[10px] font-mono text-zinc-500">{naturalWidth} × {naturalHeight} px</span>
            )}
          </div>
          <div className="p-4 flex items-center justify-center flex-grow bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2Y5ZmRmZCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjJmMmYyIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmMmYyZjIiLz48L3N2Zz4=')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMjYyOTMwIi8+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMWQxZjI0Ii8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMxZDFmMjQiLz48L3N2Zz4=')] overflow-hidden">
            <img src={previewUrl} className="max-h-full max-w-full object-contain rounded shadow-sm" alt="Original" />
          </div>
        </div>

        {/* Upscaled Image Preview */}
        <div className="bg-white dark:bg-[#262930] rounded-2xl shadow-md overflow-hidden border border-purple-500/20 flex flex-col justify-between h-[380px]">
          <div className="bg-purple-50 dark:bg-purple-950/20 px-4 py-2.5 border-b border-purple-500/20 flex justify-between items-center select-none">
            <h3 className="font-extrabold text-purple-600 dark:text-purple-400 text-xs">Upscaled Output</h3>
            {naturalWidth > 0 && (
              <span className="text-[10px] font-mono text-purple-500">{naturalWidth * scale} × {naturalHeight * scale} px</span>
            )}
          </div>
          <div className="p-4 flex items-center justify-center flex-grow bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2Y5ZmRmZCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjJmMmYyIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmMmYyZjIiLz48L3N2Zz4=')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMjYyOTMwIi8+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMWQxZjI0Ii8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMxZDFmMjQiLz48L3N2Zz4=')] overflow-hidden">
            {processing ? (
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-3"></div>
                <p className="text-xs font-semibold text-purple-500">Upscaling image...</p>
              </div>
            ) : upscaledUrl ? (
              <img src={upscaledUrl} className="max-h-full max-w-full object-contain rounded shadow-sm animate-fade-in" alt="Upscaled" />
            ) : (
              <p className="text-xs font-semibold text-zinc-400">Processing...</p>
            )}
          </div>
        </div>
      </div>
    </ImageToolLayout>
  );
}
