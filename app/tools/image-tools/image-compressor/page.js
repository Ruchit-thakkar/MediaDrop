"use client";

import { useState, useEffect } from "react";
import ImageToolLayout, { formatBytes } from "../components/ImageToolLayout";

export default function ImageCompressorPage() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [compressedUrl, setCompressedUrl] = useState(null);
  const [compressedSize, setCompressedSize] = useState(null);
  const [compressedFormat, setCompressedFormat] = useState("");
  const [mode, setMode] = useState("size"); // size, quality
  const [targetSize, setTargetSize] = useState(100); // target size in KB
  const [quality, setQuality] = useState("medium"); // low, medium, high, lossless
  const [targetFormat, setTargetFormat] = useState("original"); // original, image/jpeg, image/png, image/webp
  const [processing, setProcessing] = useState(false);

  // Clean up object URLs on change or unmount safely
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      if (compressedUrl) {
        URL.revokeObjectURL(compressedUrl);
      }
    };
  }, [compressedUrl]);

  const handleFileUploaded = (uploadedFile) => {
    setFile(uploadedFile);
    setPreviewUrl(URL.createObjectURL(uploadedFile));
    setCompressedUrl(null);
    setCompressedSize(null);
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setCompressedUrl(null);
    setCompressedSize(null);
    setCompressedFormat("");
  };

  // Run compression automatically when options change with debouncing and active task tracking
  useEffect(() => {
    if (!file || !previewUrl) return;

    let active = true;
    setProcessing(true);

    const debounce = setTimeout(() => {
      const img = new Image();
      img.src = previewUrl;
      img.onload = async () => {
        if (!active) return;

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Determine output MIME type
        let mimeType = file.type;
        if (targetFormat !== "original") {
          mimeType = targetFormat;
        }

        // Automatic format conversion for PNG when lossy compression is requested
        if (mimeType === "image/png" && (mode === "size" || quality !== "lossless")) {
          mimeType = "image/webp"; // WEBP preserves transparency and supports lossy compression
        }

        if (active) {
          setCompressedFormat(mimeType);
        }

        if (mode === "size") {
          // Target file size mode
          const targetBytes = targetSize * 1024;

          if (mimeType === "image/png") {
            // PNG does not support lossy toBlob quality compression natively
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            ctx.drawImage(img, 0, 0);
            
            canvas.toBlob(
              (blob) => {
                if (!active) return;
                if (blob) {
                  setCompressedUrl(URL.createObjectURL(blob));
                  setCompressedSize(blob.size);
                }
                setProcessing(false);
              },
              mimeType
            );
          } else {
            // Binary search for quality to hit target size (JPEG, WEBP, AVIF)
            let minQ = 0.01;
            let maxQ = 0.99;
            let bestBlob = null;
            let scaleFactor = 1.0;

            // Loop to downscale if even min quality is too large
            while (scaleFactor > 0.1 && active) {
              canvas.width = Math.round(img.naturalWidth * scaleFactor);
              canvas.height = Math.round(img.naturalHeight * scaleFactor);
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

              let currentBest = null;
              minQ = 0.01;
              maxQ = 0.99;

              for (let i = 0; i < 7; i++) {
                if (!active) break;
                let midQ = (minQ + maxQ) / 2;
                const blob = await new Promise((resolve) => canvas.toBlob(resolve, mimeType, midQ));
                if (!blob) break;

                if (blob.size <= targetBytes) {
                  currentBest = blob;
                  minQ = midQ; // Try to get higher quality
                } else {
                  maxQ = midQ; // Too big, need lower quality
                }
              }

              if (currentBest) {
                bestBlob = currentBest;
                break; // Found a fit!
              } else {
                scaleFactor -= 0.15; // Downscale and retry
              }
            }

            if (active && bestBlob) {
              setCompressedUrl(URL.createObjectURL(bestBlob));
              setCompressedSize(bestBlob.size);
            }
            if (active) setProcessing(false);
          }
        } else {
          // Quality / Lossless mode
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          ctx.drawImage(img, 0, 0);

          let qualityVal = 0.8;
          if (quality === "lossless") {
            qualityVal = 1.0;
          } else if (quality === "high") {
            qualityVal = 0.9;
          } else if (quality === "medium") {
            qualityVal = 0.65;
          } else if (quality === "low") {
            qualityVal = 0.3;
          }

          canvas.toBlob(
            (blob) => {
              if (!active) return;
              if (blob) {
                setCompressedUrl(URL.createObjectURL(blob));
                setCompressedSize(blob.size);
              }
              setProcessing(false);
            },
            mimeType,
            quality === "lossless" && mimeType === "image/png" ? undefined : qualityVal
          );
        }
      };
      img.onerror = () => {
        if (active) setProcessing(false);
      };
    }, 350);

    return () => {
      active = false;
      clearTimeout(debounce);
    };
  }, [file, previewUrl, mode, targetSize, quality, targetFormat]);

  const handleDownload = () => {
    if (!compressedUrl) return;
    const a = document.createElement("a");
    a.href = compressedUrl;
    
    // Generate filename
    const extMap = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp"
    };
    const extension = extMap[compressedFormat] || "jpg";

    const baseName = file.name.substring(0, file.name.lastIndexOf("."));
    a.download = `${baseName}_compressed.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Sidebar Controls UI
  const sidebarControls = (
    <>
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Compression Mode
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: "size", label: "Target Size" },
            { key: "quality", label: "Quality / Lossless" }
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setMode(item.key)}
              className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                mode === item.key
                  ? "bg-purple-500/10 text-purple-500 border-purple-500/30"
                  : "bg-white/5 dark:bg-white/[0.01] text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-800 dark:hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {mode === "size" ? (
        <div className="flex flex-col gap-1.5 mt-4">
          <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex justify-between select-none">
            <span>Target File Size</span>
            <span className="font-mono text-purple-500">{targetSize >= 1000 ? `${(targetSize / 1024).toFixed(1)} MB` : `${targetSize} KB`}</span>
          </label>
          
          {/* Preset Buttons */}
          <div className="grid grid-cols-3 gap-1.5 mb-2">
            {[
              { label: "50 KB", value: 50 },
              { label: "100 KB", value: 100 },
              { label: "1 MB", value: 1024 }
            ].map((preset) => (
              <button
                key={preset.value}
                onClick={() => setTargetSize(preset.value)}
                className={`py-1.5 px-2 text-[10px] font-extrabold rounded-lg border transition-all cursor-pointer ${
                  targetSize === preset.value
                    ? "bg-purple-500/20 text-purple-500 border-purple-500/40"
                    : "bg-white/5 dark:bg-white/[0.01] text-zinc-500 dark:text-zinc-400 border-zinc-200/60 dark:border-zinc-800/80 hover:text-zinc-800 dark:hover:text-white"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <input
            type="range"
            min="10"
            max="3000"
            step="10"
            value={targetSize}
            onChange={(e) => setTargetSize(parseInt(e.target.value))}
            className="w-full accent-purple-500 cursor-pointer"
          />
          <p className="text-[9px] font-semibold text-zinc-400 leading-relaxed mt-1">
            Best quality parameters will be dynamically calculated to fit inside this target threshold.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 mt-4">
          <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            Compression Level
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: "low", label: "Low Quality" },
              { key: "medium", label: "Medium" },
              { key: "high", label: "High Quality" },
              { key: "lossless", label: "Lossless" }
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setQuality(item.key)}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  quality === item.key
                    ? "bg-purple-500/10 text-purple-500 border-purple-500/30"
                    : "bg-white/5 dark:bg-white/[0.01] text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-800 dark:hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="text-[9px] font-semibold text-zinc-400 leading-relaxed mt-1">
            {quality === "lossless" 
              ? "Lossless outputs original fidelity without any compression artifacts." 
              : "Lower quality yields smaller file sizes with progressive details reduction."}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-1.5 mt-4">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Output Format
        </label>
        <select
          value={targetFormat}
          onChange={(e) => setTargetFormat(e.target.value)}
          className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-purple-500/50"
        >
          <option value="original">Original Format</option>
          <option value="image/jpeg">JPEG (Best for Photos)</option>
          <option value="image/png">PNG (Best for Graphics)</option>
          <option value="image/webp">WEBP (Modern/Highly Compressed)</option>
        </select>
        {targetFormat === "image/png" && mode === "size" && (
          <p className="text-[9px] font-semibold text-amber-500 leading-relaxed mt-1 flex items-start gap-1 select-none">
            <span className="material-symbols-outlined text-[12px] shrink-0 mt-0.5">info</span>
            PNG is lossless; Target Size may not be reached without changing format to WEBP/JPEG.
          </p>
        )}
      </div>
    </>
  );

  return (
    <ImageToolLayout
      title="Image Compressor"
      description="Reduce image file size with fully adjustable quality compression, 100% inside your browser."
      sidebarControls={sidebarControls}
      onFileUploaded={handleFileUploaded}
      onReset={handleReset}
      onDownload={handleDownload}
      downloadDisabled={!compressedUrl}
      originalFile={file}
      processedUrl={compressedUrl}
      processedSize={compressedSize}
      processing={processing}
    >
      {/* Workspace Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full items-stretch">
        {/* Original Image Preview */}
        <div className="bg-white dark:bg-[#262930] rounded-2xl shadow-sm overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between h-[380px]">
          <div className="bg-gray-50 dark:bg-zinc-800/80 px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center select-none">
            <h3 className="font-extrabold text-zinc-700 dark:text-zinc-300 text-xs">Original Preview</h3>
            <span className="text-[10px] font-mono text-zinc-500">{file?.name}</span>
          </div>
          <div className="p-4 flex items-center justify-center flex-grow bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2Y5ZmRmZCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjJmMmYyIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmMmYyZjIiLz48L3N2Zz4=')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMjYyOTMwIi8+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMWQxZjI0Ii8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMxZDFmMjQiLz48L3N2Zz4=')] overflow-hidden">
            <img src={previewUrl} className="max-h-full max-w-full object-contain rounded shadow-sm" alt="Original" />
          </div>
        </div>

        {/* Compressed Image Preview */}
        <div className="bg-white dark:bg-[#262930] rounded-2xl shadow-md overflow-hidden border border-purple-500/20 flex flex-col justify-between h-[380px]">
          <div className="bg-purple-50 dark:bg-purple-950/20 px-4 py-2.5 border-b border-purple-500/20 flex justify-between items-center select-none">
            <h3 className="font-extrabold text-purple-600 dark:text-purple-400 text-xs">Compressed Output</h3>
            {compressedSize && (
              <span className="text-[10px] font-mono text-purple-500">{formatBytes(compressedSize)}</span>
            )}
          </div>
          <div className="p-4 flex items-center justify-center flex-grow bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2Y5ZmRmZCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjJmMmYyIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmMmYyZjIiLz48L3N2Zz4=')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMjYyOTMwIi8+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMWQxZjI0Ii8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMxZDFmMjQiLz48L3N2Zz4=')] overflow-hidden">
            {processing ? (
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-3"></div>
                <p className="text-xs font-semibold text-purple-500">Compressing image...</p>
              </div>
            ) : compressedUrl ? (
              <img src={compressedUrl} className="max-h-full max-w-full object-contain rounded shadow-sm animate-fade-in" alt="Compressed" />
            ) : (
              <p className="text-xs font-semibold text-zinc-400">Waiting for compression...</p>
            )}
          </div>
        </div>
      </div>
    </ImageToolLayout>
  );
}
