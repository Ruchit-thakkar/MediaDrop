"use client";

import { useState, useEffect } from "react";
import ImageToolLayout from "../components/ImageToolLayout";

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

export default function GifMakerPage() {
  const [frames, setFrames] = useState([]); // Array of { id, file, url }
  const [gifUrl, setGifUrl] = useState(null);
  const [gifSize, setGifSize] = useState(null);
  const [libLoaded, setLibLoaded] = useState(false);
  const [fps, setFps] = useState(4); // 1 to 15 FPS
  const [gifSizePreset, setGifSizePreset] = useState("320x320");
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Load gifshot dynamically
  useEffect(() => {
    loadScript("https://cdnjs.cloudflare.com/ajax/libs/gifshot/0.3.2/gifshot.min.js")
      .then(() => setLibLoaded(true))
      .catch((err) => console.error("Failed to load gifshot:", err));
  }, []);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      frames.forEach((f) => URL.revokeObjectURL(f.url));
      if (gifUrl) URL.revokeObjectURL(gifUrl);
    };
  }, []);

  const handleFilesUploaded = (fileList) => {
    setErrorMsg("");
    const newFrames = Array.from(fileList)
      .filter((f) => f.type.startsWith("image/"))
      .map((f, idx) => ({
        id: `${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`,
        file: f,
        url: URL.createObjectURL(f)
      }));

    if (newFrames.length === 0) return;
    setFrames((prev) => [...prev, ...newFrames]);
  };

  const handleReset = () => {
    frames.forEach((f) => URL.revokeObjectURL(f.url));
    setFrames([]);
    if (gifUrl) URL.revokeObjectURL(gifUrl);
    setGifUrl(null);
    setGifSize(null);
    setErrorMsg("");
  };

  const deleteFrame = (id) => {
    setFrames((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((f) => f.id !== id);
    });
  };

  const moveFrame = (index, direction) => {
    if (index < 0 || index >= frames.length) return;
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= frames.length) return;

    setFrames((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIdx];
      next[targetIdx] = temp;
      return next;
    });
  };

  const generateGif = () => {
    if (frames.length < 2 || !libLoaded) return;
    setProcessing(true);
    setErrorMsg("");

    if (typeof window.gifshot === "undefined") {
      setErrorMsg("GIF library failed to initialize.");
      setProcessing(false);
      return;
    }

    const [w, h] = gifSizePreset.split("x").map(Number);
    const imageUrls = frames.map((f) => f.url);

    window.gifshot.createGIF(
      {
        images: imageUrls,
        interval: 1 / fps, // delay in seconds
        gifWidth: w,
        gifHeight: h,
        numWorkers: 2,
        progressCallback: () => {}
      },
      function (obj) {
        if (obj.error) {
          console.error("gifshot error:", obj.errorMsg);
          setErrorMsg("Could not create GIF. Make sure your browser supports Canvas rendering.");
          setProcessing(false);
        } else {
          const base64Image = obj.image;
          // Convert base64 data to blob
          fetch(base64Image)
            .then((res) => res.blob())
            .then((blob) => {
              if (gifUrl) URL.revokeObjectURL(gifUrl);
              setGifUrl(URL.createObjectURL(blob));
              setGifSize(blob.size);
              setProcessing(false);
            })
            .catch(() => {
              setErrorMsg("Failed to convert image binary.");
              setProcessing(false);
            });
        }
      }
    );
  };

  // Re-run GIF compile when options adjust
  useEffect(() => {
    if (frames.length >= 2) {
      const debounce = setTimeout(() => {
        generateGif();
      }, 500);
      return () => clearTimeout(debounce);
    } else {
      if (gifUrl) URL.revokeObjectURL(gifUrl);
      setGifUrl(null);
      setGifSize(null);
    }
  }, [frames, fps, gifSizePreset, libLoaded]);

  const handleDownload = () => {
    if (!gifUrl) return;
    const a = document.createElement("a");
    a.href = gifUrl;
    a.download = `animated_creation_${Date.now()}.gif`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const sidebarControls = (
    <>
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex justify-between">
          <span>Frame Rate</span>
          <span className="font-mono text-purple-500">{fps} FPS</span>
        </label>
        <input
          type="range"
          min="1"
          max="15"
          value={fps}
          onChange={(e) => setFps(parseInt(e.target.value))}
          className="w-full accent-purple-500 cursor-pointer"
        />
        <p className="text-[9px] font-semibold text-zinc-400 leading-relaxed mt-1">
          Adjust delay between frame transitions.
        </p>
      </div>

      <div className="flex flex-col gap-1.5 mt-4">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          GIF Dimensions
        </label>
        <select
          value={gifSizePreset}
          onChange={(e) => setGifSizePreset(e.target.value)}
          className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none"
        >
          <option value="320x320">Square Small (320 × 320 px)</option>
          <option value="480x480">Square Medium (480 × 480 px)</option>
          <option value="640x480">Standard Landscape (640 × 480 px)</option>
        </select>
      </div>

      {frames.length > 0 && (
        <div className="mt-4 p-3 bg-zinc-50 dark:bg-white/[0.01] rounded-2xl border border-zinc-200 dark:border-zinc-800 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 space-y-1 select-none">
          <div className="flex justify-between">
            <span>Total Frames:</span>
            <span>{frames.length} images</span>
          </div>
        </div>
      )}
    </>
  );

  return (
    <ImageToolLayout
      title="GIF Maker"
      description="Create animated GIF files from multiple pictures. Reorder frames, control frame speeds (FPS), and download creations locally."
      sidebarControls={sidebarControls}
      onFilesUploaded={handleFilesUploaded}
      onReset={handleReset}
      onDownload={handleDownload}
      downloadDisabled={!gifUrl}
      allowMultiple={true}
      uploadedFiles={frames}
      processing={processing}
      processedSize={gifSize}
    >
      {/* Workspace Split Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-stretch">
        
        {/* Left Column: Frame ordering strip */}
        <div className="lg:col-span-7 bg-white dark:bg-[#262930] rounded-2xl shadow-sm overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between min-h-[380px] lg:h-[400px]">
          <div className="bg-gray-50 dark:bg-zinc-800/80 px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center select-none">
            <h3 className="font-extrabold text-zinc-700 dark:text-zinc-300 text-xs">GIF Frames</h3>
            <span className="text-[10px] font-mono text-zinc-500">{frames.length} Frames loaded</span>
          </div>

          <div className="p-4 flex flex-col justify-start flex-grow overflow-y-auto custom-scrollbar gap-2 bg-gray-50/20 dark:bg-zinc-950/10">
            {frames.map((frame, index) => (
              <div 
                key={frame.id} 
                className="flex items-center gap-3 bg-white/5 border border-zinc-200 dark:border-zinc-800/40 p-2 rounded-xl group relative hover:border-purple-500/20 transition-all select-none"
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                  <img src={frame.url} className="max-h-full max-w-full object-contain" alt="frame" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 truncate max-w-[140px]">
                    {frame.file.name}
                  </span>
                  <span className="text-[8px] font-semibold text-zinc-400">Frame #{index + 1}</span>
                </div>

                <div className="ml-auto flex items-center gap-1.5">
                  <button
                    disabled={index === 0}
                    onClick={() => moveFrame(index, -1)}
                    className="w-6 h-6 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:text-purple-500 flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                  </button>
                  <button
                    disabled={index === frames.length - 1}
                    onClick={() => moveFrame(index, 1)}
                    className="w-6 h-6 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:text-purple-500 flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
                  </button>
                  <button
                    onClick={() => deleteFrame(frame.id)}
                    className="w-6 h-6 rounded-lg border border-red-500/10 text-red-500/60 hover:text-red-500 hover:bg-red-500/5 flex items-center justify-center cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={() => document.querySelector("input[type='file']")?.click()}
              className="py-4 border border-dashed border-zinc-200 dark:border-zinc-800 text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 hover:text-purple-500 hover:border-purple-500/30 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Add More Frames
            </button>
          </div>
        </div>

        {/* Right Column: GIF Output preview */}
        <div className="lg:col-span-5 bg-white dark:bg-[#262930] rounded-2xl shadow-md overflow-hidden border border-purple-500/20 flex flex-col justify-between min-h-[380px] lg:h-[400px]">
          <div className="bg-purple-50 dark:bg-purple-950/20 px-4 py-2.5 border-b border-purple-500/20 flex justify-between items-center select-none">
            <h3 className="font-extrabold text-purple-600 dark:text-purple-400 text-xs">GIF Output Preview</h3>
            <span className="text-[10px] font-mono text-purple-500">ANIMATED</span>
          </div>

          <div className="p-4 flex items-center justify-center flex-grow bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2Y5ZmRmZCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjJmMmYyIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmMmYyZjIiLz48L3N2Zz4=')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMjYyOTMwIi8+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMWQxZjI0Ii8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMxZDFmMjQiLz48L3N2Zz4=')] overflow-hidden">
            {processing ? (
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-3"></div>
                <p className="text-xs font-semibold text-purple-500">Rendering GIF frames...</p>
              </div>
            ) : errorMsg ? (
              <div className="flex flex-col items-center justify-center p-4">
                <span className="material-symbols-outlined text-red-500 text-3xl mb-2">warning</span>
                <p className="text-zinc-500 dark:text-zinc-400 text-[11px] font-semibold text-center">{errorMsg}</p>
              </div>
            ) : gifUrl ? (
              <img src={gifUrl} className="max-h-full max-w-full object-contain rounded shadow-sm animate-fade-in" alt="GIF Output" />
            ) : (
              <div className="text-center p-4">
                <p className="text-xs font-semibold text-zinc-400">Add 2 or more frames on the left to generate an animated GIF.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ImageToolLayout>
  );
}
