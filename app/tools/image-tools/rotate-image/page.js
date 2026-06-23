"use client";

import { useState, useEffect } from "react";
import ImageToolLayout from "../components/ImageToolLayout";

export default function RotateImagePage() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [rotatedUrl, setRotatedUrl] = useState(null);
  const [rotatedSize, setRotatedSize] = useState(null);
  const [angle, setAngle] = useState(0); // -180 to 180 degrees
  const [processing, setProcessing] = useState(false);

  // Clean up previewUrl safely on change or unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Clean up rotatedUrl safely on change or unmount
  useEffect(() => {
    return () => {
      if (rotatedUrl) URL.revokeObjectURL(rotatedUrl);
    };
  }, [rotatedUrl]);

  const handleFileUploaded = (uploadedFile) => {
    setFile(uploadedFile);
    setPreviewUrl(URL.createObjectURL(uploadedFile));
    setRotatedUrl(null);
    setRotatedSize(null);
    setAngle(0);
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setRotatedUrl(null);
    setRotatedSize(null);
    setAngle(0);
  };

  const rotateImage = () => {
    if (!file || !previewUrl) return;
    setProcessing(true);

    const img = new Image();
    img.src = previewUrl;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Recalculate canvas size to fit the rotated bounding box
      const rad = (angle * Math.PI) / 180;
      const cos = Math.abs(Math.cos(rad));
      const sin = Math.abs(Math.sin(rad));
      const newWidth = Math.round(img.naturalWidth * cos + img.naturalHeight * sin);
      const newHeight = Math.round(img.naturalWidth * sin + img.naturalHeight * cos);

      canvas.width = newWidth;
      canvas.height = newHeight;

      // Draw rotated image onto center
      ctx.translate(newWidth / 2, newHeight / 2);
      ctx.rotate(rad);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

      canvas.toBlob((blob) => {
        if (blob) {
          setRotatedUrl(URL.createObjectURL(blob));
          setRotatedSize(blob.size);
        }
        setProcessing(false);
      }, file.type);
    };
    img.onerror = () => setProcessing(false);
  };

  // Process rotation when angle adjustments settle
  useEffect(() => {
    if (file && previewUrl) {
      const debounce = setTimeout(() => {
        rotateImage();
      }, 200);
      return () => clearTimeout(debounce);
    }
  }, [angle, file, previewUrl]);

  const handleRotateLeft = () => {
    setAngle((prev) => {
      let next = prev - 90;
      if (next < -180) next += 360;
      return next;
    });
  };

  const handleRotateRight = () => {
    setAngle((prev) => {
      let next = prev + 90;
      if (next > 180) next -= 360;
      return next;
    });
  };

  const handleDownload = () => {
    if (!rotatedUrl) return;
    const a = document.createElement("a");
    a.href = rotatedUrl;
    const extension = file.name.substring(file.name.lastIndexOf(".") + 1);
    const baseName = file.name.substring(0, file.name.lastIndexOf("."));
    a.download = `${baseName}_rotated.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const sidebarControls = (
    <>
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Rotate Presets
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleRotateLeft}
            className="py-2 px-3 text-xs font-bold rounded-xl border bg-white/5 dark:bg-white/[0.01] text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-800 dark:hover:text-white cursor-pointer flex items-center justify-center gap-1.5 select-none"
          >
            <span className="material-symbols-outlined text-sm">rotate_left</span>
            -90° Left
          </button>
          <button
            onClick={handleRotateRight}
            className="py-2 px-3 text-xs font-bold rounded-xl border bg-white/5 dark:bg-white/[0.01] text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-800 dark:hover:text-white cursor-pointer flex items-center justify-center gap-1.5 select-none"
          >
            <span className="material-symbols-outlined text-sm">rotate_right</span>
            +90° Right
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 mt-4">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex justify-between">
          <span>Custom Angle</span>
          <span className="font-mono text-purple-500">{angle}°</span>
        </label>
        <input
          type="range"
          min="-180"
          max="180"
          value={angle}
          onChange={(e) => setAngle(parseInt(e.target.value))}
          className="w-full accent-purple-500 cursor-pointer"
        />
      </div>
    </>
  );

  return (
    <ImageToolLayout
      title="Rotate Image"
      description="Rotate images clockwise, counter-clockwise, or specify custom angles up to 360 degrees locally in your browser."
      sidebarControls={sidebarControls}
      onFileUploaded={handleFileUploaded}
      onReset={handleReset}
      onDownload={handleDownload}
      downloadDisabled={!rotatedUrl}
      originalFile={file}
      processedUrl={rotatedUrl}
      processedSize={rotatedSize}
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

        {/* Rotated Image Preview */}
        <div className="bg-white dark:bg-[#262930] rounded-2xl shadow-md overflow-hidden border border-purple-500/20 flex flex-col justify-between h-[380px]">
          <div className="bg-purple-50 dark:bg-purple-950/20 px-4 py-2.5 border-b border-purple-500/20 flex justify-between items-center select-none">
            <h3 className="font-extrabold text-purple-600 dark:text-purple-400 text-xs">Rotated Output</h3>
            <span className="text-[10px] font-mono text-purple-500">{angle}°</span>
          </div>
          <div className="p-4 flex items-center justify-center flex-grow bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2Y5ZmRmZCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjJmMmYyIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmMmYyZjIiLz48L3N2Zz4=')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMjYyOTMwIi8+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMWQxZjI0Ii8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMxZDFmMjQiLz48L3N2Zz4=')] overflow-hidden">
            {processing ? (
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-3"></div>
                <p className="text-xs font-semibold text-purple-500">Rotating image...</p>
              </div>
            ) : rotatedUrl ? (
              <img src={rotatedUrl} className="max-h-full max-w-full object-contain rounded shadow-sm animate-fade-in" alt="Rotated" />
            ) : (
              <p className="text-xs font-semibold text-zinc-400">Processing...</p>
            )}
          </div>
        </div>
      </div>
    </ImageToolLayout>
  );
}
