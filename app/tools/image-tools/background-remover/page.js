"use client";

import { useState, useEffect, useRef } from "react";
import ImageToolLayout from "../components/ImageToolLayout";

export default function BackgroundRemoverPage() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [removedUrl, setRemovedUrl] = useState(null);
  const [removedSize, setRemovedSize] = useState(null);
  
  // Custom Controls
  const [tolerance, setTolerance] = useState(30); // 0 to 100
  const [feather, setFeather] = useState(2); // 0 to 10
  const [bgMode, setBgMode] = useState("transparent"); // transparent, color, gradient
  const [bgColor, setBgColor] = useState("#ffffff");
  const [keyColor, setKeyColor] = useState(null); // Auto-detected or selected color [r, g, b]
  const [processing, setProcessing] = useState(false);

  const canvasRef = useRef(null);

  // Clean up previewUrl safely on change or unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Clean up removedUrl safely on change or unmount
  useEffect(() => {
    return () => {
      if (removedUrl) URL.revokeObjectURL(removedUrl);
    };
  }, [removedUrl]);

  const handleFileUploaded = (uploadedFile) => {
    setFile(uploadedFile);
    setPreviewUrl(URL.createObjectURL(uploadedFile));
    setRemovedUrl(null);
    setRemovedSize(null);
    setKeyColor(null); // Reset key color
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setRemovedUrl(null);
    setRemovedSize(null);
    setKeyColor(null);
  };

  const removeBackground = () => {
    if (!file || !previewUrl) return;
    setProcessing(true);

    const img = new Image();
    img.src = previewUrl;
    img.onload = () => {
      const canvas = canvasRef.current || document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // 1. Determine key color (if not selected, auto-detect from top-left corner)
      let rKey = 255, gKey = 255, bKey = 255;
      if (keyColor) {
        [rKey, gKey, bKey] = keyColor;
      } else {
        rKey = data[0];
        gKey = data[1];
        bKey = data[2];
        setKeyColor([rKey, gKey, bKey]);
      }

      // Convert tolerance (0-100) to RGB distance metric (0-441 max distance)
      const maxDist = 442;
      const targetDist = (tolerance / 100) * maxDist;

      // 2. Remove matching colors
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Euclidean distance in color space
        const dist = Math.sqrt(
          Math.pow(r - rKey, 2) +
          Math.pow(g - gKey, 2) +
          Math.pow(b - bKey, 2)
        );

        if (dist < targetDist) {
          // If within immediate tolerance boundary
          if (feather > 0 && dist > targetDist - (feather * 10)) {
            // Apply smoothing feathering ratio near borders
            const ratio = (dist - (targetDist - (feather * 10))) / (feather * 10);
            data[i + 3] = Math.round(ratio * 255);
          } else {
            data[i + 3] = 0; // Transparent
          }
        }
      }

      // 3. Clear canvas and write transparent image
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext("2d");
      tempCtx.putImageData(imgData, 0, 0);

      // Draw background mode if solid or gradient
      if (bgMode === "color") {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (bgMode === "gradient") {
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, "#7C3AED");
        grad.addColorStop(1, "#2563EB");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Draw the keyed transparency on top
      ctx.drawImage(tempCanvas, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          setRemovedUrl(URL.createObjectURL(blob));
          setRemovedSize(blob.size);
        }
        setProcessing(false);
      }, "image/png");
    };
    img.onerror = () => setProcessing(false);
  };

  // Re-run color removal filter when controls modify
  useEffect(() => {
    if (file && previewUrl) {
      removeBackground();
    }
  }, [file, previewUrl, tolerance, feather, bgMode, bgColor, keyColor]);

  // Click on original preview to pick specific key color
  const handleColorPick = (e) => {
    if (!file) return;
    const img = e.currentTarget;
    const rect = img.getBoundingClientRect();
    
    // Scale click coords to natural image size
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * img.naturalWidth);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * img.naturalHeight);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);

    const pixel = ctx.getImageData(x, y, 1, 1).data;
    setKeyColor([pixel[0], pixel[1], pixel[2]]);
  };

  const handleDownload = () => {
    if (!removedUrl) return;
    const a = document.createElement("a");
    a.href = removedUrl;
    const baseName = file.name.substring(0, file.name.lastIndexOf("."));
    a.download = `${baseName}_bg_removed.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Convert RGB back to HEX for display
  const keyColorHex = keyColor 
    ? "#" + keyColor.map(x => x.toString(16).padStart(2, "0")).join("")
    : "#ffffff";

  const sidebarControls = (
    <>
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex justify-between">
          <span>Tolerance</span>
          <span className="font-mono text-purple-500">{tolerance}%</span>
        </label>
        <input
          type="range"
          min="5"
          max="80"
          value={tolerance}
          onChange={(e) => setTolerance(parseInt(e.target.value))}
          className="w-full accent-purple-500 cursor-pointer"
        />
        <p className="text-[9px] font-semibold text-zinc-400 leading-relaxed mt-1">
          Increase to remove similar shades near background color.
        </p>
      </div>

      <div className="flex flex-col gap-1.5 mt-4">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex justify-between">
          <span>Edge Feathering</span>
          <span className="font-mono text-purple-500">{feather}px</span>
        </label>
        <input
          type="range"
          min="0"
          max="10"
          value={feather}
          onChange={(e) => setFeather(parseInt(e.target.value))}
          className="w-full accent-purple-500 cursor-pointer"
        />
      </div>

      <div className="flex flex-col gap-1.5 mt-4">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Selected Backdrop Color
        </label>
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-lg border border-border-subtle" 
            style={{ backgroundColor: keyColorHex }}
          />
          <span className="font-mono text-xs text-zinc-600 dark:text-zinc-300 uppercase">{keyColorHex}</span>
        </div>
        <p className="text-[9px] font-semibold text-zinc-400 leading-relaxed mt-1">
          Auto-detected top-left pixel. Click anywhere on the Original Preview to pick a different background color.
        </p>
      </div>

      <div className="flex flex-col gap-1.5 mt-4">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Backdrop Mode
        </label>
        <select
          value={bgMode}
          onChange={(e) => setBgMode(e.target.value)}
          className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none"
        >
          <option value="transparent">Transparent PNG</option>
          <option value="color">Solid Background Color</option>
          <option value="gradient">Sample Gradient Overlay</option>
        </select>
      </div>

      {bgMode === "color" && (
        <div className="flex flex-col gap-1.5 mt-2.5">
          <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            Solid Color Picker
          </label>
          <input
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            className="w-full h-8 rounded-xl border border-zinc-200 dark:border-zinc-800 cursor-pointer bg-transparent"
          />
        </div>
      )}
    </>
  );

  return (
    <ImageToolLayout
      title="Background Remover"
      description="Remove image backgrounds locally. Select target background colors dynamically with adjustable edge tolerance controls."
      sidebarControls={sidebarControls}
      onFileUploaded={handleFileUploaded}
      onReset={handleReset}
      onDownload={handleDownload}
      downloadDisabled={!removedUrl}
      originalFile={file}
      processedUrl={removedUrl}
      processedSize={removedSize}
      processing={processing}
    >
      <canvas ref={canvasRef} className="hidden" />

      {/* Workspace Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full items-stretch">
        {/* Original Image Preview */}
        <div className="bg-white dark:bg-[#262930] rounded-2xl shadow-sm overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between h-[380px]">
          <div className="bg-gray-50 dark:bg-zinc-800/80 px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center select-none">
            <h3 className="font-extrabold text-zinc-700 dark:text-zinc-300 text-xs">Original (Click to Pick Color)</h3>
            <span className="text-[10px] font-mono text-zinc-500">Source</span>
          </div>
          <div className="p-4 flex items-center justify-center flex-grow bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2Y5ZmRmZCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjJmMmYyIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmMmYyZjIiLz48L3N2Zz4=')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMjYyOTMwIi8+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMWQxZjI0Ii8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMxZDFmMjQiLz48L3N2Zz4=')] overflow-hidden">
            <img 
              src={previewUrl} 
              onClick={handleColorPick}
              className="max-h-full max-w-full object-contain rounded shadow-sm cursor-crosshair active:scale-[0.99] transition-transform" 
              alt="Original" 
            />
          </div>
        </div>

        {/* Removed Background Image Preview */}
        <div className="bg-white dark:bg-[#262930] rounded-2xl shadow-md overflow-hidden border border-purple-500/20 flex flex-col justify-between h-[380px]">
          <div className="bg-purple-50 dark:bg-purple-950/20 px-4 py-2.5 border-b border-purple-500/20 flex justify-between items-center select-none">
            <h3 className="font-extrabold text-purple-600 dark:text-purple-400 text-xs">Removed Background</h3>
            <span className="text-[10px] font-mono text-purple-500">Output PNG</span>
          </div>
          <div className="p-4 flex items-center justify-center flex-grow bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2Y5ZmRmZCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjJmMmYyIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmMmYyZjIiLz48L3N2Zz4=')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMjYyOTMwIi8+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMWQxZjI0Ii8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMxZDFmMjQiLz48L3N2Zz4=')] overflow-hidden">
            {processing ? (
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-3"></div>
                <p className="text-xs font-semibold text-purple-500">Cleansing background...</p>
              </div>
            ) : removedUrl ? (
              <img src={removedUrl} className="max-h-full max-w-full object-contain rounded shadow-sm animate-fade-in" alt="Removed Background" />
            ) : (
              <p className="text-xs font-semibold text-zinc-400">Processing...</p>
            )}
          </div>
        </div>
      </div>
    </ImageToolLayout>
  );
}
