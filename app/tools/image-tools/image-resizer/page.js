"use client";

import { useState, useEffect } from "react";
import ImageToolLayout from "../components/ImageToolLayout";

export default function ImageResizerPage() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [resizedUrl, setResizedUrl] = useState(null);
  const [resizedSize, setResizedSize] = useState(null);
  
  // Custom Controls
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [lockAspect, setLockAspect] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [naturalWidth, setNaturalWidth] = useState(0);
  const [naturalHeight, setNaturalHeight] = useState(0);
  const [processing, setProcessing] = useState(false);

  // Clean up previewUrl safely on change or unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Clean up resizedUrl safely on change or unmount
  useEffect(() => {
    return () => {
      if (resizedUrl) URL.revokeObjectURL(resizedUrl);
    };
  }, [resizedUrl]);

  const handleFileUploaded = (uploadedFile) => {
    setFile(uploadedFile);
    const url = URL.createObjectURL(uploadedFile);
    setPreviewUrl(url);
    setResizedUrl(null);
    setResizedSize(null);

    // Load image metadata to get dimensions
    const img = new Image();
    img.src = url;
    img.onload = () => {
      setNaturalWidth(img.naturalWidth);
      setNaturalHeight(img.naturalHeight);
      setWidth(img.naturalWidth.toString());
      setHeight(img.naturalHeight.toString());
      setAspectRatio(img.naturalWidth / img.naturalHeight);
    };
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setResizedUrl(null);
    setResizedSize(null);
    setWidth("");
    setHeight("");
    setNaturalWidth(0);
    setNaturalHeight(0);
  };

  const handleWidthChange = (val) => {
    setWidth(val);
    const num = parseInt(val);
    if (!isNaN(num) && lockAspect && aspectRatio) {
      setHeight(Math.round(num / aspectRatio).toString());
    }
  };

  const handleHeightChange = (val) => {
    setHeight(val);
    const num = parseInt(val);
    if (!isNaN(num) && lockAspect && aspectRatio) {
      setWidth(Math.round(num * aspectRatio).toString());
    }
  };

  const applyPreset = (scale) => {
    if (!naturalWidth || !naturalHeight) return;
    const targetW = Math.round(naturalWidth * scale);
    const targetH = Math.round(naturalHeight * scale);
    setWidth(targetW.toString());
    setHeight(targetH.toString());
  };

  const resizeImage = () => {
    if (!file || !previewUrl) return;
    const wVal = parseInt(width);
    const hVal = parseInt(height);
    if (isNaN(wVal) || isNaN(hVal) || wVal <= 0 || hVal <= 0) return;

    setProcessing(true);

    const img = new Image();
    img.src = previewUrl;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = wVal;
      canvas.height = hVal;

      // Draw resized image
      ctx.drawImage(img, 0, 0, wVal, hVal);

      canvas.toBlob((blob) => {
        if (blob) {
          setResizedUrl(URL.createObjectURL(blob));
          setResizedSize(blob.size);
        }
        setProcessing(false);
      }, file.type);
    };
    img.onerror = () => setProcessing(false);
  };

  // Run resizer whenever width or height is modified
  useEffect(() => {
    if (file && width && height && previewUrl) {
      const delayDebounce = setTimeout(() => {
        resizeImage();
      }, 400); // Debounce resizing on text edits
      return () => clearTimeout(delayDebounce);
    }
  }, [width, height, file, previewUrl]);

  const handleDownload = () => {
    if (!resizedUrl) return;
    const a = document.createElement("a");
    a.href = resizedUrl;
    const extension = file.name.substring(file.name.lastIndexOf(".") + 1);
    const baseName = file.name.substring(0, file.name.lastIndexOf("."));
    a.download = `${baseName}_resized.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const sidebarControls = (
    <>
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Scale Presets
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {[0.25, 0.5, 0.75, 1.0].map((scale) => (
            <button
              key={scale}
              onClick={() => applyPreset(scale)}
              className="py-1.5 px-2 text-[10px] font-extrabold rounded-xl border bg-white/5 dark:bg-white/[0.01] text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-800 dark:hover:text-white cursor-pointer select-none"
            >
              {scale * 100}%
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5 mt-4">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Dimensions (px)
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-bold text-zinc-500">Width</span>
            <input
              type="number"
              value={width}
              onChange={(e) => handleWidthChange(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-700 dark:text-zinc-300 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-bold text-zinc-500">Height</span>
            <input
              type="number"
              value={height}
              onChange={(e) => handleHeightChange(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-700 dark:text-zinc-300 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4 select-none">
        <input
          type="checkbox"
          id="lock-aspect"
          checked={lockAspect}
          onChange={(e) => setLockAspect(e.target.checked)}
          className="rounded border-zinc-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer accent-purple-500"
        />
        <label htmlFor="lock-aspect" className="text-xs font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer">
          Lock Aspect Ratio
        </label>
      </div>

      {naturalWidth > 0 && (
        <div className="mt-4 p-3 bg-zinc-50 dark:bg-white/[0.01] rounded-2xl border border-zinc-200 dark:border-zinc-800 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 space-y-1.5 select-none">
          <div className="flex justify-between">
            <span>Natural Size:</span>
            <span>{naturalWidth} × {naturalHeight} px</span>
          </div>
          <div className="flex justify-between text-purple-500">
            <span>Resized Size:</span>
            <span>{width || "0"} × {height || "0"} px</span>
          </div>
        </div>
      )}
    </>
  );

  return (
    <ImageToolLayout
      title="Image Resizer"
      description="Resize images to custom width and height dimensions with aspect ratio lock entirely in your browser."
      sidebarControls={sidebarControls}
      onFileUploaded={handleFileUploaded}
      onReset={handleReset}
      onDownload={handleDownload}
      downloadDisabled={!resizedUrl}
      originalFile={file}
      processedUrl={resizedUrl}
      processedSize={resizedSize}
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

        {/* Resized Image Preview */}
        <div className="bg-white dark:bg-[#262930] rounded-2xl shadow-md overflow-hidden border border-purple-500/20 flex flex-col justify-between h-[380px]">
          <div className="bg-purple-50 dark:bg-purple-950/20 px-4 py-2.5 border-b border-purple-500/20 flex justify-between items-center select-none">
            <h3 className="font-extrabold text-purple-600 dark:text-purple-400 text-xs">Resized Output</h3>
            {width && height && (
              <span className="text-[10px] font-mono text-purple-500">{width} × {height} px</span>
            )}
          </div>
          <div className="p-4 flex items-center justify-center flex-grow bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2Y5ZmRmZCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjJmMmYyIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmMmYyZjIiLz48L3N2Zz4=')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMjYyOTMwIi8+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMWQxZjI0Ii8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMxZDFmMjQiLz48L3N2Zz4=')] overflow-hidden">
            {processing ? (
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-3"></div>
                <p className="text-xs font-semibold text-purple-500">Resizing image...</p>
              </div>
            ) : resizedUrl ? (
              <img src={resizedUrl} className="max-h-full max-w-full object-contain rounded shadow-sm animate-fade-in" alt="Resized" />
            ) : (
              <p className="text-xs font-semibold text-zinc-400">Processing...</p>
            )}
          </div>
        </div>
      </div>
    </ImageToolLayout>
  );
}
