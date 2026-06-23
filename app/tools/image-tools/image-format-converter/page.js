"use client";

import { useState, useEffect } from "react";
import ImageToolLayout from "../components/ImageToolLayout";

export default function ImageFormatConverterPage() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [convertedUrl, setConvertedUrl] = useState(null);
  const [convertedSize, setConvertedSize] = useState(null);
  const [targetMime, setTargetMime] = useState("image/webp");
  const [processing, setProcessing] = useState(false);

  // Clean up previewUrl safely on change or unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Clean up convertedUrl safely on change or unmount
  useEffect(() => {
    return () => {
      if (convertedUrl) URL.revokeObjectURL(convertedUrl);
    };
  }, [convertedUrl]);

  const handleFileUploaded = (uploadedFile) => {
    setFile(uploadedFile);
    setPreviewUrl(URL.createObjectURL(uploadedFile));
    setConvertedUrl(null);
    setConvertedSize(null);
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setConvertedUrl(null);
    setConvertedSize(null);
  };

  const convertFormat = () => {
    if (!file || !previewUrl) return;
    setProcessing(true);

    const img = new Image();
    img.src = previewUrl;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          setConvertedUrl(URL.createObjectURL(blob));
          setConvertedSize(blob.size);
        }
        setProcessing(false);
      }, targetMime, 0.92);
    };
    img.onerror = () => setProcessing(false);
  };

  // Re-run conversion when target format changes
  useEffect(() => {
    if (file && previewUrl) {
      convertFormat();
    }
  }, [targetMime, file, previewUrl]);

  const handleDownload = () => {
    if (!convertedUrl) return;
    const a = document.createElement("a");
    a.href = convertedUrl;
    
    const extMap = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/avif": "avif"
    };
    const extension = extMap[targetMime];
    const baseName = file.name.substring(0, file.name.lastIndexOf("."));
    a.download = `${baseName}_converted.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const sidebarControls = (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
        Target Format
      </label>
      <select
        value={targetMime}
        onChange={(e) => setTargetMime(e.target.value)}
        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none"
      >
        <option value="image/webp">WEBP (Highly Compressed/Modern)</option>
        <option value="image/png">PNG (Lossless/Transparent)</option>
        <option value="image/jpeg">JPEG (Standard Photo Format)</option>
        <option value="image/avif">AVIF (Ultra-Efficient/Next-Gen)</option>
      </select>
      <p className="text-[9px] font-semibold text-zinc-400 leading-relaxed mt-1 select-none">
        Note: AVIF writing requires a modern browser supporting AVIF canvas export. If unsupported, the browser will export as webp or png automatically.
      </p>
    </div>
  );

  return (
    <ImageToolLayout
      title="Image Format Converter"
      description="Convert images instantly between JPG, PNG, WEBP, and AVIF formats, processed 100% locally in your browser."
      sidebarControls={sidebarControls}
      onFileUploaded={handleFileUploaded}
      onReset={handleReset}
      onDownload={handleDownload}
      downloadDisabled={!convertedUrl}
      originalFile={file}
      processedUrl={convertedUrl}
      processedSize={convertedSize}
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

        {/* Converted Image Preview */}
        <div className="bg-white dark:bg-[#262930] rounded-2xl shadow-md overflow-hidden border border-purple-500/20 flex flex-col justify-between h-[380px]">
          <div className="bg-purple-50 dark:bg-purple-950/20 px-4 py-2.5 border-b border-purple-500/20 flex justify-between items-center select-none">
            <h3 className="font-extrabold text-purple-600 dark:text-purple-400 text-xs">Converted Output</h3>
            <span className="text-[10px] font-mono text-purple-500 uppercase">
              {targetMime.split("/")[1]}
            </span>
          </div>
          <div className="p-4 flex items-center justify-center flex-grow bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2Y5ZmRmZCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjJmMmYyIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmMmYyZjIiLz48L3N2Zz4=')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMjYyOTMwIi8+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMWQxZjI0Ii8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMxZDFmMjQiLz48L3N2Zz4=')] overflow-hidden">
            {processing ? (
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-3"></div>
                <p className="text-xs font-semibold text-purple-500">Converting image...</p>
              </div>
            ) : convertedUrl ? (
              <img src={convertedUrl} className="max-h-full max-w-full object-contain rounded shadow-sm animate-fade-in" alt="Converted" />
            ) : (
              <p className="text-xs font-semibold text-zinc-400">Processing...</p>
            )}
          </div>
        </div>
      </div>
    </ImageToolLayout>
  );
}
