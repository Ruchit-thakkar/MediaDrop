"use client";

import { useState, useEffect } from "react";
import ImageToolLayout from "../components/ImageToolLayout";

export default function FlipImagePage() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [flippedUrl, setFlippedUrl] = useState(null);
  const [flippedSize, setFlippedSize] = useState(null);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Clean up previewUrl safely on change or unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Clean up flippedUrl safely on change or unmount
  useEffect(() => {
    return () => {
      if (flippedUrl) URL.revokeObjectURL(flippedUrl);
    };
  }, [flippedUrl]);

  const handleFileUploaded = (uploadedFile) => {
    setFile(uploadedFile);
    setPreviewUrl(URL.createObjectURL(uploadedFile));
    setFlippedUrl(null);
    setFlippedSize(null);
    setFlipH(false);
    setFlipV(false);
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setFlippedUrl(null);
    setFlippedSize(null);
    setFlipH(false);
    setFlipV(false);
  };

  const flipImage = () => {
    if (!file || !previewUrl) return;
    setProcessing(true);

    const img = new Image();
    img.src = previewUrl;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      // Handle flipping transformation
      ctx.translate(flipH ? canvas.width : 0, flipV ? canvas.height : 0);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          setFlippedUrl(URL.createObjectURL(blob));
          setFlippedSize(blob.size);
        }
        setProcessing(false);
      }, file.type);
    };
    img.onerror = () => setProcessing(false);
  };

  // Process flip whenever toggles modify
  useEffect(() => {
    if (file && previewUrl) {
      flipImage();
    }
  }, [flipH, flipV, file, previewUrl]);

  const handleDownload = () => {
    if (!flippedUrl) return;
    const a = document.createElement("a");
    a.href = flippedUrl;
    const extension = file.name.substring(file.name.lastIndexOf(".") + 1);
    const baseName = file.name.substring(0, file.name.lastIndexOf("."));
    a.download = `${baseName}_flipped.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const sidebarControls = (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
        Flip Controls
      </label>
      <div className="flex flex-col gap-3">
        <button
          onClick={() => setFlipH(prev => !prev)}
          className={`py-2.5 px-4 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2 select-none ${
            flipH
              ? "bg-purple-500/10 text-purple-500 border-purple-500/30"
              : "bg-white/5 dark:bg-white/[0.01] text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-800 dark:hover:text-white"
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
          Flip Horizontally
        </button>
        <button
          onClick={() => setFlipV(prev => !prev)}
          className={`py-2.5 px-4 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2 select-none ${
            flipV
              ? "bg-purple-500/10 text-purple-500 border-purple-500/30"
              : "bg-white/5 dark:bg-white/[0.01] text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-800 dark:hover:text-white"
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">swap_vert</span>
          Flip Vertically
        </button>
      </div>
      <p className="text-[9px] font-semibold text-zinc-400 leading-relaxed mt-1">
        Flipping can be combined horizontally and vertically simultaneously.
      </p>
    </div>
  );

  return (
    <ImageToolLayout
      title="Flip Image"
      description="Reflect your images horizontally or vertically in real time, 100% inside your browser."
      sidebarControls={sidebarControls}
      onFileUploaded={handleFileUploaded}
      onReset={handleReset}
      onDownload={handleDownload}
      downloadDisabled={!flippedUrl}
      originalFile={file}
      processedUrl={flippedUrl}
      processedSize={flippedSize}
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

        {/* Flipped Image Preview */}
        <div className="bg-white dark:bg-[#262930] rounded-2xl shadow-md overflow-hidden border border-purple-500/20 flex flex-col justify-between h-[380px]">
          <div className="bg-purple-50 dark:bg-purple-950/20 px-4 py-2.5 border-b border-purple-500/20 flex justify-between items-center select-none">
            <h3 className="font-extrabold text-purple-600 dark:text-purple-400 text-xs">Flipped Output</h3>
            <span className="text-[10px] font-mono text-purple-500">
              {flipH ? "H-Flipped" : ""} {flipV ? "V-Flipped" : ""} {!flipH && !flipV ? "No Flip" : ""}
            </span>
          </div>
          <div className="p-4 flex items-center justify-center flex-grow bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2Y5ZmRmZCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjJmMmYyIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmMmYyZjIiLz48L3N2Zz4=')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMjYyOTMwIi8+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMWQxZjI0Ii8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMxZDFmMjQiLz48L3N2Zz4=')] overflow-hidden">
            {processing ? (
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-3"></div>
                <p className="text-xs font-semibold text-purple-500">Mirroring image...</p>
              </div>
            ) : flippedUrl ? (
              <img src={flippedUrl} className="max-h-full max-w-full object-contain rounded shadow-sm animate-fade-in" alt="Flipped" />
            ) : (
              <p className="text-xs font-semibold text-zinc-400">Processing...</p>
            )}
          </div>
        </div>
      </div>
    </ImageToolLayout>
  );
}
