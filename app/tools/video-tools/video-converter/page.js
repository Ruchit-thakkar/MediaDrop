"use client";

import { useState, useEffect, useRef } from "react";
import VideoToolLayout, { formatBytes } from "../components/VideoToolLayout";

export default function VideoConverterPage() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [convertedUrl, setConvertedUrl] = useState(null);
  const [convertedSize, setConvertedSize] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Settings
  const [targetFormat, setTargetFormat] = useState("webm"); // webm, mp4
  const [videoQuality, setVideoQuality] = useState("medium"); // low, medium, high

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const recorderRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Clean up URLs
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

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
    setProgress(0);
  };

  const handleReset = () => {
    if (processing) {
      handleCancel();
    }
    setFile(null);
    setPreviewUrl(null);
    setConvertedUrl(null);
    setConvertedSize(null);
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

  const startConversion = async () => {
    if (!file || !videoRef.current || !canvasRef.current) return;

    setProcessing(true);
    setProgress(0);
    setConvertedUrl(null);
    setConvertedSize(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Reset video
    video.currentTime = 0;
    video.muted = true;
    video.play();

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Define bitrate based on selected quality
    let bitrate = 2000000; // 2 Mbps
    if (videoQuality === "low") bitrate = 800000;
    else if (videoQuality === "high") bitrate = 5000000;

    // Capture stream
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
      console.warn("Could not capture audio for converter:", e);
    }

    const combinedStream = new MediaStream(outputTracks);

    // Determine target format mimeType
    let mimeType = "video/webm;codecs=vp9";
    if (targetFormat === "mp4") {
      if (MediaRecorder.isTypeSupported("video/mp4;codecs=avc1.42E01E")) {
        mimeType = "video/mp4;codecs=avc1.42E01E";
      } else if (MediaRecorder.isTypeSupported("video/mp4")) {
        mimeType = "video/mp4";
      } else {
        mimeType = "video/webm;codecs=vp8";
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
      const convertedBlob = new Blob(chunks, { type: mimeType });
      setConvertedUrl(URL.createObjectURL(convertedBlob));
      setConvertedSize(convertedBlob.size);
      setProcessing(false);
      setProgress(100);
    };

    const drawFrame = () => {
      if (video.paused || video.ended) {
        if (video.ended && recorder.state !== "inactive") {
          recorder.stop();
        }
        return;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const currentProgress = Math.min(99, Math.round((video.currentTime / video.duration) * 100));
      setProgress(currentProgress);
      animationFrameRef.current = requestAnimationFrame(drawFrame);
    };

    recorder.start();

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
    if (!convertedUrl) return;
    const a = document.createElement("a");
    a.href = convertedUrl;
    const ext = targetFormat;
    const baseName = file.name.substring(0, file.name.lastIndexOf("."));
    a.download = `${baseName}_converted.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const sidebarControls = (
    <>
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Target Format
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: "webm", label: "WebM" },
            { key: "mp4", label: "MP4" }
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setTargetFormat(item.key)}
              className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                targetFormat === item.key
                  ? "bg-purple-500/10 text-purple-500 border-purple-500/30"
                  : "bg-white/5 dark:bg-white/[0.01] text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-800 dark:hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5 mt-4">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Encoding Quality
        </label>
        <select
          value={videoQuality}
          onChange={(e) => setVideoQuality(e.target.value)}
          className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-purple-500/50"
        >
          <option value="low">Low (Smaller file size)</option>
          <option value="medium">Medium (Standard quality)</option>
          <option value="high">High (Maximum quality)</option>
        </select>
      </div>

      <div className="mt-6 pt-4 border-t border-border-subtle">
        <button
          onClick={startConversion}
          disabled={processing}
          className={`w-full py-2.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
            processing
              ? "bg-zinc-300 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 shadow-none cursor-not-allowed opacity-50"
              : "bg-purple-600 hover:bg-purple-700 shadow-purple-500/20 hover:scale-[1.01]"
          }`}
        >
          <span className="material-symbols-outlined text-sm">transform</span>
          Convert Video
        </button>
      </div>
    </>
  );

  return (
    <VideoToolLayout
      title="Video Converter"
      description="Convert video files to modern WebM or MP4 container standards, 100% inside your browser."
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
            <h3 className="font-extrabold text-purple-600 dark:text-purple-400 text-xs">Converted Output</h3>
            {convertedSize && (
              <span className="text-[10px] font-mono text-purple-500">{formatBytes(convertedSize)}</span>
            )}
          </div>
          <div className="p-4 flex items-center justify-center flex-grow bg-zinc-950/40 overflow-hidden relative">
            {processing ? (
              <div className="flex flex-col items-center justify-center w-full h-full bg-zinc-950/60 absolute inset-0 z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-3"></div>
                <p className="text-xs font-semibold text-purple-400">Converting video... {progress}%</p>
                <button
                  onClick={handleCancel}
                  className="mt-4 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : null}

            {convertedUrl ? (
              <video
                src={convertedUrl}
                controls
                className="max-h-full max-w-full object-contain rounded shadow-sm animate-fade-in"
              />
            ) : (
              <div className="text-center">
                <p className="text-xs font-semibold text-zinc-400">Select target format and click 'Convert Video'</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </VideoToolLayout>
  );
}
