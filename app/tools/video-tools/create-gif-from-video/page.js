"use client";

import { useState, useEffect, useRef } from "react";
import VideoToolLayout, { formatBytes } from "../components/VideoToolLayout";

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

export default function CreateGifFromVideoPage() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [gifUrl, setGifUrl] = useState(null);
  const [gifSize, setGifSize] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [libLoaded, setLibLoaded] = useState(false);

  // Settings
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [fps, setFps] = useState(5); // 2 to 15 FPS
  const [gifWidth, setGifWidth] = useState(320);

  const videoRef = useRef(null);

  // Load gifshot
  useEffect(() => {
    loadScript("https://cdnjs.cloudflare.com/ajax/libs/gifshot/0.3.2/gifshot.min.js")
      .then(() => setLibLoaded(true))
      .catch((err) => console.error("Failed to load gifshot:", err));
  }, []);

  // Cleanup URLs
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      if (gifUrl) URL.revokeObjectURL(gifUrl);
    };
  }, [gifUrl]);

  const handleFileUploaded = (uploadedFile) => {
    setFile(uploadedFile);
    setPreviewUrl(URL.createObjectURL(uploadedFile));
    setGifUrl(null);
    setGifSize(null);
    setProgress(0);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setDuration(dur);
      setStartTime(0);
      setEndTime(Math.min(dur, 6)); // default to max 6 seconds to avoid massive GIF sizes
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setGifUrl(null);
    setGifSize(null);
    setProgress(0);
    setDuration(0);
  };

  const startGifGeneration = async () => {
    if (!file || !videoRef.current || !libLoaded) return;

    setProcessing(true);
    setProgress(0);
    setGifUrl(null);
    setGifSize(null);

    const video = videoRef.current;
    
    // Determine canvas dimensions
    const ratio = video.videoHeight / video.videoWidth;
    const gifHeight = Math.round(gifWidth * ratio);

    const canvas = document.createElement("canvas");
    canvas.width = gifWidth;
    canvas.height = gifHeight;
    const ctx = canvas.getContext("2d");

    const trimDuration = endTime - startTime;
    const numFrames = Math.max(3, Math.min(100, Math.floor(trimDuration * fps)));
    const timeStep = trimDuration / numFrames;

    const frames = [];

    try {
      // Seek video to extract frames
      for (let i = 0; i < numFrames; i++) {
        video.currentTime = startTime + i * timeStep;

        await new Promise((resolve) => {
          const onSeeked = () => {
            video.removeEventListener("seeked", onSeeked);
            resolve();
          };
          video.addEventListener("seeked", onSeeked);
        });

        ctx.drawImage(video, 0, 0, gifWidth, gifHeight);
        frames.push(canvas.toDataURL("image/jpeg", 0.7)); // compress frames a bit

        // Progress up to 80% is frame extraction
        setProgress(Math.round((i / numFrames) * 80));
      }

      setProgress(85);

      // Compile frames to GIF
      window.gifshot.createGIF(
        {
          images: frames,
          gifWidth: gifWidth,
          gifHeight: gifHeight,
          interval: 1 / fps,
          numFrames: frames.length,
          sampleInterval: 10,
          numWorkers: 2
        },
        (obj) => {
          if (obj.error) {
            console.error("Gifshot error:", obj.error);
            alert("GIF compilation failed.");
            setProcessing(false);
          } else {
            setProgress(100);
            
            // Convert dataURL to Blob to read size and create objectURL
            fetch(obj.image)
              .then((res) => res.blob())
              .then((blob) => {
                setGifUrl(URL.createObjectURL(blob));
                setGifSize(blob.size);
                setProcessing(false);
              });
          }
        }
      );
    } catch (e) {
      console.error(e);
      alert("Error generating GIF from video.");
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!gifUrl) return;
    const a = document.createElement("a");
    a.href = gifUrl;
    const baseName = file.name.substring(0, file.name.lastIndexOf("."));
    a.download = `${baseName}.gif`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const sidebarControls = (
    <>
      <div className="flex flex-col gap-3 select-none">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex justify-between">
            <span>Start Time</span>
            <span className="font-mono text-purple-500">{startTime.toFixed(1)}s</span>
          </label>
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={startTime}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setStartTime(Math.min(val, endTime - 0.5));
            }}
            className="w-full accent-purple-500 cursor-pointer"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex justify-between">
            <span>End Time</span>
            <span className="font-mono text-purple-500">{endTime.toFixed(1)}s</span>
          </label>
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={endTime}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setEndTime(Math.max(val, startTime + 0.5));
            }}
            className="w-full accent-purple-500 cursor-pointer"
          />
        </div>

        <div className="flex flex-col gap-1 mt-2">
          <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex justify-between">
            <span>Frame Rate (FPS)</span>
            <span className="font-mono text-purple-500">{fps} FPS</span>
          </label>
          <input
            type="range"
            min="2"
            max="15"
            step="1"
            value={fps}
            onChange={(e) => setFps(parseInt(e.target.value))}
            className="w-full accent-purple-500 cursor-pointer"
          />
        </div>

        <div className="flex flex-col gap-1.5 mt-2">
          <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            GIF Width
          </label>
          <select
            value={gifWidth}
            onChange={(e) => setGifWidth(parseInt(e.target.value))}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none"
          >
            <option value="240">240px (Small, Fast)</option>
            <option value="320">320px (Medium)</option>
            <option value="480">480px (Large)</option>
          </select>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-border-subtle">
        <button
          onClick={startGifGeneration}
          disabled={processing || duration === 0 || !libLoaded}
          className={`w-full py-2.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
            processing || duration === 0 || !libLoaded
              ? "bg-zinc-300 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 shadow-none cursor-not-allowed opacity-50"
              : "bg-purple-600 hover:bg-purple-700 shadow-purple-500/20 hover:scale-[1.01]"
          }`}
        >
          <span className="material-symbols-outlined text-sm">gif</span>
          Generate GIF
        </button>
      </div>
    </>
  );

  return (
    <VideoToolLayout
      title="Create GIF from Video"
      description="Convert short video clips into high-quality animated GIFs, 100% inside your browser."
      sidebarControls={sidebarControls}
      onFileUploaded={handleFileUploaded}
      onReset={handleReset}
      onDownload={handleDownload}
      downloadDisabled={!gifUrl}
      originalFile={file}
      processedUrl={gifUrl}
      processedSize={gifSize}
      processing={processing}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full items-stretch">
        <div className="bg-white dark:bg-[#262930] rounded-2xl shadow-sm overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between h-[380px]">
          <div className="bg-gray-50 dark:bg-zinc-800/80 px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center select-none">
            <h3 className="font-extrabold text-zinc-700 dark:text-zinc-300 text-xs">Original Video</h3>
            <span className="text-[10px] font-mono text-zinc-500">{file?.name}</span>
          </div>
          <div className="p-4 flex items-center justify-center flex-grow bg-zinc-950/40 overflow-hidden">
            <video
              ref={videoRef}
              src={previewUrl}
              controls
              onLoadedMetadata={handleLoadedMetadata}
              className="max-h-full max-w-full object-contain rounded shadow-sm"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-[#262930] rounded-2xl shadow-md overflow-hidden border border-purple-500/20 flex flex-col justify-between h-[380px]">
          <div className="bg-purple-50 dark:bg-purple-950/20 px-4 py-2.5 border-b border-purple-500/20 flex justify-between items-center select-none">
            <h3 className="font-extrabold text-purple-600 dark:text-purple-400 text-xs">Animated GIF Output</h3>
            {gifSize && (
              <span className="text-[10px] font-mono text-purple-500">{formatBytes(gifSize)}</span>
            )}
          </div>
          <div className="p-4 flex items-center justify-center flex-grow bg-zinc-950/40 overflow-hidden relative">
            {processing ? (
              <div className="flex flex-col items-center justify-center w-full h-full bg-zinc-950/60 absolute inset-0 z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-3"></div>
                <p className="text-xs font-semibold text-purple-400">Processing frames... {progress}%</p>
              </div>
            ) : null}

            {gifUrl ? (
              <img
                src={gifUrl}
                className="max-h-full max-w-full object-contain rounded shadow-sm animate-fade-in"
                alt="Animated GIF"
              />
            ) : (
              <div className="text-center">
                <p className="text-xs font-semibold text-zinc-400 leading-relaxed font-semibold leading-relaxed">
                  Select start and end times, then click 'Generate GIF'
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </VideoToolLayout>
  );
}
