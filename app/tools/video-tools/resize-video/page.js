"use client";

import { useState, useEffect, useRef } from "react";
import VideoToolLayout, { formatBytes } from "../components/VideoToolLayout";

export default function ResizeVideoPage() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [resizedUrl, setResizedUrl] = useState(null);
  const [resizedSize, setResizedSize] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Settings
  const [preset, setPreset] = useState("16-9"); // 16-9, 9-16, 1-1, 4-3
  const [fitMode, setFitMode] = useState("contain"); // contain, cover

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const recorderRef = useRef(null);
  const animationFrameRef = useRef(null);
  const audioCtxRef = useRef(null);

  // Cleanup
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      if (resizedUrl) URL.revokeObjectURL(resizedUrl);
    };
  }, [resizedUrl]);

  const handleFileUploaded = (uploadedFile) => {
    setFile(uploadedFile);
    setPreviewUrl(URL.createObjectURL(uploadedFile));
    setResizedUrl(null);
    setResizedSize(null);
    setProgress(0);
  };

  const handleReset = () => {
    if (processing) {
      handleCancel();
    }
    setFile(null);
    setPreviewUrl(null);
    setResizedUrl(null);
    setResizedSize(null);
    setProgress(0);
  };

  const handleCancel = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setProcessing(false);
    setProgress(0);
  };

  const startResizing = async () => {
    if (!file || !videoRef.current || !canvasRef.current) return;

    setProcessing(true);
    setProgress(0);
    setResizedUrl(null);
    setResizedSize(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Reset video
    video.currentTime = 0;
    video.muted = true;
    video.play();

    // Determine target canvas dimensions
    let targetWidth = 1280;
    let targetHeight = 720;

    if (preset === "9-16") {
      targetWidth = 720;
      targetHeight = 1280;
    } else if (preset === "1-1") {
      targetWidth = 720;
      targetHeight = 720;
    } else if (preset === "4-3") {
      targetWidth = 960;
      targetHeight = 720;
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // Web Audio setup for silent audio routing
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    const audioCtx = audioCtxRef.current;
    if (audioCtx.state === "suspended") {
      await audioCtx.resume();
    }

    const canvasStream = canvas.captureStream(30);
    const outputTracks = [...canvasStream.getVideoTracks()];

    try {
      const audioDest = audioCtx.createMediaStreamDestination();
      const sourceNode = audioCtx.createMediaElementSource(video);
      sourceNode.connect(audioDest);

      const audioTracks = audioDest.stream.getAudioTracks();
      if (audioTracks.length > 0) {
        outputTracks.push(audioTracks[0]);
      }
    } catch (e) {
      console.warn("Audio Context route skipped:", e);
    }

    const combinedStream = new MediaStream(outputTracks);
    let mimeType = "video/webm;codecs=vp9";
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp8") ? "video/webm;codecs=vp8" : "video/webm";
    }

    const chunks = [];
    const recorder = new MediaRecorder(combinedStream, { mimeType });
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    recorder.onstop = () => {
      const resizedBlob = new Blob(chunks, { type: mimeType });
      setResizedUrl(URL.createObjectURL(resizedBlob));
      setResizedSize(resizedBlob.size);
      setProcessing(false);
      setProgress(100);
    };

    recorder.start();

    const drawFrame = () => {
      if (video.paused || video.ended) {
        if (video.ended && recorder.state !== "inactive") {
          recorder.stop();
        }
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const vW = video.videoWidth;
      const vH = video.videoHeight;
      const cW = canvas.width;
      const cH = canvas.height;

      if (fitMode === "contain") {
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, cW, cH);
        const scale = Math.min(cW / vW, cH / vH);
        const x = (cW - vW * scale) / 2;
        const y = (cH - vH * scale) / 2;
        ctx.drawImage(video, x, y, vW * scale, vH * scale);
      } else {
        // cover mode (scale to cover, crop overflow)
        const scale = Math.max(cW / vW, cH / vH);
        const x = (cW - vW * scale) / 2;
        const y = (cH - vH * scale) / 2;
        ctx.drawImage(video, x, y, vW * scale, vH * scale);
      }

      const currentProgress = Math.min(99, Math.round((video.currentTime / video.duration) * 100));
      setProgress(currentProgress);
      animationFrameRef.current = requestAnimationFrame(drawFrame);
    };

    video.onplay = () => {
      drawFrame();
    };

    video.onended = () => {
      if (recorder.state !== "inactive") {
        recorder.stop();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  };

  const handleDownload = () => {
    if (!resizedUrl) return;
    const a = document.createElement("a");
    a.href = resizedUrl;
    const baseName = file.name.substring(0, file.name.lastIndexOf("."));
    a.download = `${baseName}_resized_${preset}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const sidebarControls = (
    <>
      <div className="flex flex-col gap-1.5 select-none">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Aspect Ratio Preset
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: "16-9", label: "16:9 Landscape" },
            { key: "9-16", label: "9:16 Portrait" },
            { key: "1-1", label: "1:1 Square" },
            { key: "4-3", label: "4:3 Standard" }
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setPreset(item.key)}
              className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                preset === item.key
                  ? "bg-purple-500/10 text-purple-500 border-purple-500/30"
                  : "bg-white/5 dark:bg-white/[0.01] text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-800 dark:hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5 mt-4 select-none">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Scaling Fit Mode
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: "contain", label: "Contain (Letterbox)" },
            { key: "cover", label: "Cover (Crop)" }
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setFitMode(item.key)}
              className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                fitMode === item.key
                  ? "bg-purple-500/10 text-purple-500 border-purple-500/30"
                  : "bg-white/5 dark:bg-white/[0.01] text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-800 dark:hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-border-subtle">
        <button
          onClick={startResizing}
          disabled={processing || !file}
          className={`w-full py-2.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
            processing || !file
              ? "bg-zinc-300 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 shadow-none cursor-not-allowed opacity-50"
              : "bg-purple-600 hover:bg-purple-700 shadow-purple-500/20 hover:scale-[1.01]"
          }`}
        >
          <span className="material-symbols-outlined text-sm">aspect_ratio</span>
          Resize Video
        </button>
      </div>
    </>
  );

  return (
    <VideoToolLayout
      title="Resize Video"
      description="Change aspect ratio, cropping presets, or resize resolution formats locally inside your browser."
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
              className="max-h-full max-w-full object-contain rounded shadow-sm"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-[#262930] rounded-2xl shadow-md overflow-hidden border border-purple-500/20 flex flex-col justify-between h-[380px]">
          <div className="bg-purple-50 dark:bg-purple-950/20 px-4 py-2.5 border-b border-purple-500/20 flex justify-between items-center select-none">
            <h3 className="font-extrabold text-purple-600 dark:text-purple-400 text-xs">Resized Output</h3>
            {resizedSize && (
              <span className="text-[10px] font-mono text-purple-500">{formatBytes(resizedSize)}</span>
            )}
          </div>
          <div className="p-4 flex items-center justify-center flex-grow bg-zinc-950/40 overflow-hidden relative">
            {processing ? (
              <div className="flex flex-col items-center justify-center w-full h-full bg-zinc-950/60 absolute inset-0 z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-3"></div>
                <p className="text-xs font-semibold text-purple-400">Resizing video dimensions... {progress}%</p>
                <button
                  onClick={handleCancel}
                  className="mt-4 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : null}

            {resizedUrl ? (
              <video
                src={resizedUrl}
                controls
                className="max-h-full max-w-full object-contain rounded shadow-sm animate-fade-in"
              />
            ) : (
              <div className="text-center">
                <p className="text-xs font-semibold text-zinc-400 leading-relaxed font-semibold leading-relaxed">
                  Select aspect ratio and fit options in the sidebar and click 'Resize Video'
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </VideoToolLayout>
  );
}
