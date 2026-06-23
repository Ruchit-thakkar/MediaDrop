"use client";

import { useState, useEffect } from "react";
import ImageToolLayout from "../components/ImageToolLayout";

export default function WatermarkImagePage() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [watermarkedUrl, setWatermarkedUrl] = useState(null);
  const [watermarkedSize, setWatermarkedSize] = useState(null);
  
  // Custom Controls
  const [text, setText] = useState("MediaDrop");
  const [opacity, setOpacity] = useState(0.4); // 0 to 1
  const [position, setPosition] = useState("center"); // center, topLeft, topRight, bottomLeft, bottomRight, tile
  const [fontSize, setFontSize] = useState(36); // 12 to 128
  const [color, setColor] = useState("#ffffff");
  const [processing, setProcessing] = useState(false);

  // Clean up previewUrl safely on change or unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Clean up watermarkedUrl safely on change or unmount
  useEffect(() => {
    return () => {
      if (watermarkedUrl) URL.revokeObjectURL(watermarkedUrl);
    };
  }, [watermarkedUrl]);

  const handleFileUploaded = (uploadedFile) => {
    setFile(uploadedFile);
    setPreviewUrl(URL.createObjectURL(uploadedFile));
    setWatermarkedUrl(null);
    setWatermarkedSize(null);
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setWatermarkedUrl(null);
    setWatermarkedSize(null);
    setText("MediaDrop");
    setOpacity(0.4);
    setPosition("center");
    setFontSize(36);
    setColor("#ffffff");
  };

  const applyWatermark = () => {
    if (!file || !previewUrl) return;
    setProcessing(true);

    const img = new Image();
    img.src = previewUrl;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const w = img.naturalWidth;
      const h = img.naturalHeight;

      canvas.width = w;
      canvas.height = h;

      // 1. Draw base image
      ctx.drawImage(img, 0, 0);

      // 2. Set text styles
      ctx.fillStyle = color;
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.globalAlpha = opacity;
      ctx.textBaseline = "middle";

      // 3. Draw based on position selection
      if (position === "center") {
        ctx.textAlign = "center";
        ctx.fillText(text, w / 2, h / 2);
      } else if (position === "topLeft") {
        ctx.textAlign = "left";
        ctx.fillText(text, 30, 30 + fontSize / 2);
      } else if (position === "topRight") {
        ctx.textAlign = "right";
        ctx.fillText(text, w - 30, 30 + fontSize / 2);
      } else if (position === "bottomLeft") {
        ctx.textAlign = "left";
        ctx.fillText(text, 30, h - 30 - fontSize / 2);
      } else if (position === "bottomRight") {
        ctx.textAlign = "right";
        ctx.fillText(text, w - 30, h - 30 - fontSize / 2);
      } else if (position === "tile") {
        ctx.textAlign = "center";
        // Tile repeating watermark diagonally or in grid spacing
        const xStep = Math.max(150, fontSize * text.length * 0.8);
        const yStep = Math.max(120, fontSize * 2.5);
        ctx.save();
        ctx.rotate(-25 * Math.PI / 180); // Slight angle for stylish tiled look
        
        // Loop over dimensions, extending boundaries to account for rotation
        const diag = Math.sqrt(w*w + h*h);
        for (let x = -diag; x < diag; x += xStep) {
          for (let y = -diag; y < diag; y += yStep) {
            ctx.fillText(text, x, y);
          }
        }
        ctx.restore();
      }

      canvas.toBlob((blob) => {
        if (blob) {
          setWatermarkedUrl(URL.createObjectURL(blob));
          setWatermarkedSize(blob.size);
        }
        setProcessing(false);
      }, file.type);
    };
    img.onerror = () => setProcessing(false);
  };

  // Re-render watermark canvas on settings changes
  useEffect(() => {
    if (file && previewUrl) {
      const debounce = setTimeout(() => {
        applyWatermark();
      }, 300);
      return () => clearTimeout(debounce);
    }
  }, [text, opacity, position, fontSize, color, file, previewUrl]);

  const handleDownload = () => {
    if (!watermarkedUrl) return;
    const a = document.createElement("a");
    a.href = watermarkedUrl;
    const extension = file.name.substring(file.name.lastIndexOf(".") + 1);
    const baseName = file.name.substring(0, file.name.lastIndexOf("."));
    a.download = `${baseName}_watermarked.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const sidebarControls = (
    <>
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Watermark Text
        </label>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter watermark..."
          maxLength={40}
          className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1.5 mt-4">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex justify-between">
          <span>Opacity</span>
          <span className="font-mono text-purple-500">{Math.round(opacity * 100)}%</span>
        </label>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.05"
          value={opacity}
          onChange={(e) => setOpacity(parseFloat(e.target.value))}
          className="w-full accent-purple-500 cursor-pointer"
        />
      </div>

      <div className="flex flex-col gap-1.5 mt-4">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex justify-between">
          <span>Font Size</span>
          <span className="font-mono text-purple-500">{fontSize}px</span>
        </label>
        <input
          type="range"
          min="12"
          max="120"
          value={fontSize}
          onChange={(e) => setFontSize(parseInt(e.target.value))}
          className="w-full accent-purple-500 cursor-pointer"
        />
      </div>

      <div className="flex flex-col gap-1.5 mt-4">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Watermark Color
        </label>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-full h-8 rounded-xl border border-zinc-200 dark:border-zinc-800 cursor-pointer bg-transparent"
        />
      </div>

      <div className="flex flex-col gap-1.5 mt-4">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Placement Layout
        </label>
        <select
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none"
        >
          <option value="center">Absolute Center</option>
          <option value="topLeft">Top Left Corner</option>
          <option value="topRight">Top Right Corner</option>
          <option value="bottomLeft">Bottom Left Corner</option>
          <option value="bottomRight">Bottom Right Corner</option>
          <option value="tile">Tiled Grid (Repeating)</option>
        </select>
      </div>
    </>
  );

  return (
    <ImageToolLayout
      title="Watermark Image"
      description="Overlay customizable text watermarks onto your images with layout position, color, and opacity controls."
      sidebarControls={sidebarControls}
      onFileUploaded={handleFileUploaded}
      onReset={handleReset}
      onDownload={handleDownload}
      downloadDisabled={!watermarkedUrl}
      originalFile={file}
      processedUrl={watermarkedUrl}
      processedSize={watermarkedSize}
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

        {/* Watermarked Image Preview */}
        <div className="bg-white dark:bg-[#262930] rounded-2xl shadow-md overflow-hidden border border-purple-500/20 flex flex-col justify-between h-[380px]">
          <div className="bg-purple-50 dark:bg-purple-950/20 px-4 py-2.5 border-b border-purple-500/20 flex justify-between items-center select-none">
            <h3 className="font-extrabold text-purple-600 dark:text-purple-400 text-xs">Watermarked Output</h3>
            <span className="text-[10px] font-mono text-purple-500 uppercase">{position}</span>
          </div>
          <div className="p-4 flex items-center justify-center flex-grow bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2Y5ZmRmZCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjJmMmYyIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmMmYyZjIiLz48L3N2Zz4=')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMjYyOTMwIi8+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMWQxZjI0Ii8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMxZDFmMjQiLz48L3N2Zz4=')] overflow-hidden">
            {processing ? (
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-3"></div>
                <p className="text-xs font-semibold text-purple-500">Applying watermark...</p>
              </div>
            ) : watermarkedUrl ? (
              <img src={watermarkedUrl} className="max-h-full max-w-full object-contain rounded shadow-sm animate-fade-in" alt="Watermarked" />
            ) : (
              <p className="text-xs font-semibold text-zinc-400">Processing...</p>
            )}
          </div>
        </div>
      </div>
    </ImageToolLayout>
  );
}
