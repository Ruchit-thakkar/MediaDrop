"use client";

import { useState, useEffect } from "react";
import ImageToolLayout from "../components/ImageToolLayout";

export default function SvgConverterPage() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [outputUrl, setOutputUrl] = useState(null);
  const [outputSize, setOutputSize] = useState(null);
  const [format, setFormat] = useState("image/png"); // image/png, image/jpeg, image/webp
  const [scale, setScale] = useState(1); // 1x, 2x, 3x, 4x resolution multiplier
  const [processing, setProcessing] = useState(false);
  const [svgDimensions, setSvgDimensions] = useState({ width: 300, height: 300 });

  // Clean up previewUrl safely on change or unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Clean up outputUrl safely on change or unmount
  useEffect(() => {
    return () => {
      if (outputUrl) URL.revokeObjectURL(outputUrl);
    };
  }, [outputUrl]);

  const handleFileUploaded = (uploadedFile) => {
    setFile(uploadedFile);
    const url = URL.createObjectURL(uploadedFile);
    setPreviewUrl(url);
    setOutputUrl(null);
    setOutputSize(null);

    // Auto-detect natural size of SVG
    const img = new Image();
    img.src = url;
    img.onload = () => {
      const w = img.naturalWidth || 300;
      const h = img.naturalHeight || 300;
      setSvgDimensions({ width: w, height: h });
    };
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setOutputUrl(null);
    setOutputSize(null);
    setSvgDimensions({ width: 300, height: 300 });
  };

  const convertSvg = () => {
    if (!file || !previewUrl) return;
    setProcessing(true);

    const img = new Image();
    img.src = previewUrl;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Scale vector elements without loss of detail
      const targetWidth = svgDimensions.width * scale;
      const targetHeight = svgDimensions.height * scale;

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Draw SVG on Canvas
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      canvas.toBlob((blob) => {
        if (blob) {
          setOutputUrl(URL.createObjectURL(blob));
          setOutputSize(blob.size);
        }
        setProcessing(false);
      }, format, 0.95);
    };
    img.onerror = () => setProcessing(false);
  };

  // Re-run SVG rendering when scale or output format changes
  useEffect(() => {
    if (file && previewUrl) {
      convertSvg();
    }
  }, [file, previewUrl, format, scale, svgDimensions]);

  const handleDownload = () => {
    if (!outputUrl) return;
    const a = document.createElement("a");
    a.href = outputUrl;
    
    const extMap = {
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/webp": "webp"
    };
    const extension = extMap[format];
    const baseName = file.name.substring(0, file.name.lastIndexOf("."));
    a.download = `${baseName}_converted.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const sidebarControls = (
    <>
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Output Format
        </label>
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none"
        >
          <option value="image/png">PNG (Supports Transparency)</option>
          <option value="image/jpeg">JPEG (Solid Background)</option>
          <option value="image/webp">WEBP (Lossy/Modern Compression)</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5 mt-4">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Scale Vector Resolution
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {[1, 2, 3, 4].map((mult) => (
            <button
              key={mult}
              onClick={() => setScale(mult)}
              className={`py-1.5 px-2 text-[10px] font-extrabold rounded-xl border transition-all cursor-pointer ${
                scale === mult
                  ? "bg-purple-500/10 text-purple-500 border-purple-500/30"
                  : "bg-white/5 dark:bg-white/[0.01] text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-800 dark:hover:text-white"
              }`}
            >
              {mult}x
            </button>
          ))}
        </div>
        <p className="text-[9px] font-semibold text-zinc-400 leading-relaxed mt-1 select-none">
          Scale multiplier increases target image canvas resolution for sharp details.
        </p>
      </div>
    </>
  );

  return (
    <ImageToolLayout
      title="SVG Converter"
      description="Convert SVG vector files to PNG, JPEG, or WEBP images at customizable resolution scaling factors."
      sidebarControls={sidebarControls}
      onFileUploaded={handleFileUploaded}
      onReset={handleReset}
      onDownload={handleDownload}
      downloadDisabled={!outputUrl}
      originalFile={file}
      processedUrl={outputUrl}
      processedSize={outputSize}
      processing={processing}
    >
      {/* Workspace Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full items-stretch">
        {/* Original Image Preview */}
        <div className="bg-white dark:bg-[#262930] rounded-2xl shadow-sm overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between h-[380px]">
          <div className="bg-gray-50 dark:bg-zinc-800/80 px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center select-none">
            <h3 className="font-extrabold text-zinc-700 dark:text-zinc-300 text-xs">Vector SVG Preview</h3>
            <span className="text-[10px] font-mono text-zinc-500">{svgDimensions.width} × {svgDimensions.height} px</span>
          </div>
          <div className="p-4 flex items-center justify-center flex-grow bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2Y5ZmRmZCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjJmMmYyIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmMmYyZjIiLz48L3N2Zz4=')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMjYyOTMwIi8+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMWQxZjI0Ii8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMxZDFmMjQiLz48L3N2Zz4=')] overflow-hidden">
            <img src={previewUrl} className="max-h-full max-w-full object-contain rounded shadow-sm" alt="Original SVG" />
          </div>
        </div>

        {/* Output Image Preview */}
        <div className="bg-white dark:bg-[#262930] rounded-2xl shadow-md overflow-hidden border border-purple-500/20 flex flex-col justify-between h-[380px]">
          <div className="bg-purple-50 dark:bg-purple-950/20 px-4 py-2.5 border-b border-purple-500/20 flex justify-between items-center select-none">
            <h3 className="font-extrabold text-purple-600 dark:text-purple-400 text-xs">Rasterized Image</h3>
            <span className="text-[10px] font-mono text-purple-500">
              {Math.round(svgDimensions.width * scale)} × {Math.round(svgDimensions.height * scale)} px
            </span>
          </div>
          <div className="p-4 flex items-center justify-center flex-grow bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2Y5ZmRmZCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjJmMmYyIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmMmYyZjIiLz48L3N2Zz4=')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMjYyOTMwIi8+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMWQxZjI0Ii8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMxZDFmMjQiLz48L3N2Zz4=')] overflow-hidden">
            {processing ? (
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-3"></div>
                <p className="text-xs font-semibold text-purple-500">Rasterizing SVG...</p>
              </div>
            ) : outputUrl ? (
              <img src={outputUrl} className="max-h-full max-w-full object-contain rounded shadow-sm animate-fade-in" alt="Rasterized Output" />
            ) : (
              <p className="text-xs font-semibold text-zinc-400">Processing...</p>
            )}
          </div>
        </div>
      </div>
    </ImageToolLayout>
  );
}
