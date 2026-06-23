"use client";

import { useState, useEffect, useRef } from "react";
import VideoToolLayout, { formatBytes } from "../components/VideoToolLayout";

export default function VideoCompressorPage() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [compressedUrl, setCompressedUrl] = useState(null);
  const [compressedSize, setCompressedSize] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Settings
  const [mode, setMode] = useState("size"); // size, quality
  const [targetSize, setTargetSize] = useState(10); // target size in MB
  const [quality, setQuality] = useState("medium"); // low, medium, high
  const [resolution, setResolution] = useState("original"); // original, 720p, 480p
  const [format, setFormat] = useState("webm"); // webm, mp4

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const recorderRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      if (compressedUrl) URL.revokeObjectURL(compressedUrl);
    };
  }, [compressedUrl]);

  const handleFileUploaded = (uploadedFile) => {
    setFile(uploadedFile);
    setPreviewUrl(URL.createObjectURL(uploadedFile));
    setCompressedUrl(null);
    setCompressedSize(null);
    setProgress(0);
  };

  const handleReset = () => {
    if (processing) {
      handleCancel();
    }
    setFile(null);
    setPreviewUrl(null);
    setCompressedUrl(null);
    setCompressedSize(null);
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

  const startCompression = async () => {
    if (!file || !videoRef.current || !canvasRef.current) return;

    setProcessing(true);
    setProgress(0);
    setCompressedUrl(null);
    setCompressedSize(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Reset video to start
    video.currentTime = 0;
    video.muted = true; // Mute to prevent audio feedback during fast processing/recording
    video.play();

    // Determine target resolution dimensions
    let targetWidth = video.videoWidth;
    let targetHeight = video.videoHeight;

    if (resolution === "720p") {
      const scale = Math.min(1, 720 / Math.min(video.videoWidth, video.videoHeight));
      targetWidth = Math.round(video.videoWidth * scale);
      targetHeight = Math.round(video.videoHeight * scale);
    } else if (resolution === "480p") {
      const scale = Math.min(1, 480 / Math.min(video.videoWidth, video.videoHeight));
      targetWidth = Math.round(video.videoWidth * scale);
      targetHeight = Math.round(video.videoHeight * scale);
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // Calculate target bitrate (bps)
    let bitrate = 1500000; // default 1.5 Mbps
    if (mode === "size") {
      const duration = video.duration || 10;
      bitrate = Math.round(((targetSize * 1024 * 1024 * 8) / duration));
      // clamp bitrate between 150kbps and 12mbps
      bitrate = Math.max(150000, Math.min(12000000, bitrate));
    } else {
      if (quality === "low") bitrate = 500000;
      else if (quality === "medium") bitrate = 1500000;
      else if (quality === "high") bitrate = 4000000;
    }

    // Capture video stream from canvas
    const canvasStream = canvas.captureStream(30);
    const outputTracks = [...canvasStream.getVideoTracks()];

    // Add audio track if available
    try {
      const originalStream = video.captureStream ? video.captureStream() : (video.mozCaptureStream ? video.mozCaptureStream() : null);
      if (originalStream) {
        const audioTracks = originalStream.getAudioTracks();
        if (audioTracks.length > 0) {
          outputTracks.push(audioTracks[0]);
        }
      }
    } catch (e) {
      console.warn("Could not capture original audio tracks:", e);
    }

    const combinedStream = new MediaStream(outputTracks);

    // Determine MIME type
    let mimeType = "video/webm;codecs=vp9";
    if (format === "mp4") {
      if (MediaRecorder.isTypeSupported("video/mp4;codecs=avc1.42E01E")) {
        mimeType = "video/mp4;codecs=avc1.42E01E";
      } else if (MediaRecorder.isTypeSupported("video/mp4")) {
        mimeType = "video/mp4";
      } else {
        mimeType = "video/webm;codecs=vp8"; // fallback
      }
    } else {
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp8") ? "video/webm;codecs=vp8" : "video/webm";
      }
    }

    const chunks = [];
    const recorder = new MediaRecorder(combinedStream, {
      mimeType,
      videoBitsPerSecond: bitrate
    });

    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    recorder.onstop = () => {
      const compressedBlob = new Blob(chunks, { type: mimeType });
      setCompressedUrl(URL.createObjectURL(compressedBlob));
      setCompressedSize(compressedBlob.size);
      setProcessing(false);
      setProgress(100);
    };

    // Draw frame loop
    const drawFrame = () => {
      if (video.paused || video.ended) {
        if (video.ended && recorder.state !== "inactive") {
          recorder.stop();
        }
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Update progress
      const currentProgress = Math.min(99, Math.round((video.currentTime / video.duration) * 100));
      setProgress(currentProgress);

      animationFrameRef.current = requestAnimationFrame(drawFrame);
    };

    // Start recording
    recorder.start();

    // Start animation frame loop
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
    if (!compressedUrl) return;
    const a = document.createElement("a");
    a.href = compressedUrl;
    const ext = format === "mp4" ? "mp4" : "webm";
    const baseName = file.name.substring(0, file.name.lastIndexOf("."));
    a.download = `${baseName}_compressed.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const sidebarControls = (
    <>
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Compression Mode
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: "size", label: "Target Size" },
            { key: "quality", label: "Quality Settings" }
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
            <span className="font-mono text-purple-500">{targetSize} MB</span>
          </label>

          <div className="grid grid-cols-3 gap-1.5 mb-2">
            {[
              { label: "5 MB", value: 5 },
              { label: "10 MB", value: 10 },
              { label: "25 MB", value: 25 }
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
            min="1"
            max="100"
            step="1"
            value={targetSize}
            onChange={(e) => setTargetSize(parseInt(e.target.value))}
            className="w-full accent-purple-500 cursor-pointer"
          />
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 mt-4">
          <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            Compression Level
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { key: "low", label: "Low" },
              { key: "medium", label: "Medium" },
              { key: "high", label: "High" }
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setQuality(item.key)}
                className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  quality === item.key
                    ? "bg-purple-500/10 text-purple-500 border-purple-500/30"
                    : "bg-white/5 dark:bg-white/[0.01] text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-800 dark:hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5 mt-4">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Target Resolution
        </label>
        <select
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
          className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-purple-500/50"
        >
          <option value="original">Original Size</option>
          <option value="720p">720p (HD)</option>
          <option value="480p">480p (SD)</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5 mt-4">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Output Format
        </label>
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-purple-500/50"
        >
          <option value="webm">WebM (Highly Compatible, Faster)</option>
          <option value="mp4">MP4 (Standard H.264/AAC)</option>
        </select>
      </div>

      <div className="mt-6 pt-4 border-t border-border-subtle">
        <button
          onClick={startCompression}
          disabled={processing}
          className={`w-full py-2.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
            processing
              ? "bg-zinc-300 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 shadow-none cursor-not-allowed opacity-50"
              : "bg-purple-600 hover:bg-purple-700 shadow-purple-500/20 hover:scale-[1.01]"
          }`}
        >
          <span className="material-symbols-outlined text-sm">settings_backup_restore</span>
          Start Compression
        </button>
      </div>
    </>
  );

  return (
    <VideoToolLayout
      title="Video Compressor"
      description="Reduce video file size by adjusting bitrate, resolution, and formats, 100% inside your browser."
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full items-stretch">
        {/* Original Preview */}
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

        {/* Output Preview */}
        <div className="bg-white dark:bg-[#262930] rounded-2xl shadow-md overflow-hidden border border-purple-500/20 flex flex-col justify-between h-[380px]">
          <div className="bg-purple-50 dark:bg-purple-950/20 px-4 py-2.5 border-b border-purple-500/20 flex justify-between items-center select-none">
            <h3 className="font-extrabold text-purple-600 dark:text-purple-400 text-xs">Compressed Output</h3>
            {compressedSize && (
              <span className="text-[10px] font-mono text-purple-500">{formatBytes(compressedSize)}</span>
            )}
          </div>
          <div className="p-4 flex items-center justify-center flex-grow bg-zinc-950/40 overflow-hidden relative">
            {processing ? (
              <div className="flex flex-col items-center justify-center w-full h-full bg-zinc-950/60 absolute inset-0 z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-3"></div>
                <p className="text-xs font-semibold text-purple-400">Compressing video... {progress}%</p>
                <button
                  onClick={handleCancel}
                  className="mt-4 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : null}

            {compressedUrl ? (
              <video
                src={compressedUrl}
                controls
                className="max-h-full max-w-full object-contain rounded shadow-sm animate-fade-in"
              />
            ) : (
              <div className="text-center">
                <p className="text-xs font-semibold text-zinc-400">Configure parameters and click 'Start Compression'</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </VideoToolLayout>
  );
}
