"use client";

import { useState, useEffect, useRef } from "react";
import VideoToolLayout, { formatBytes } from "../components/VideoToolLayout";

export default function ReverseVideoPage() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [reversedUrl, setReversedUrl] = useState(null);
  const [reversedSize, setReversedSize] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const recorderRef = useRef(null);
  const timeoutRef = useRef(null);

  // Clean up
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      if (reversedUrl) URL.revokeObjectURL(reversedUrl);
    };
  }, [reversedUrl]);

  const handleFileUploaded = (uploadedFile) => {
    setFile(uploadedFile);
    setPreviewUrl(URL.createObjectURL(uploadedFile));
    setReversedUrl(null);
    setReversedSize(null);
    setProgress(0);
  };

  const handleReset = () => {
    if (processing) {
      handleCancel();
    }
    setFile(null);
    setPreviewUrl(null);
    setReversedUrl(null);
    setReversedSize(null);
    setProgress(0);
  };

  const handleCancel = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setProcessing(false);
    setProgress(0);
  };

  const startReversing = async () => {
    if (!file || !videoRef.current || !canvasRef.current) return;

    setProcessing(true);
    setProgress(0);
    setReversedUrl(null);
    setReversedSize(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const fps = 25;
    const frameDuration = 1 / fps;
    let currentTime = video.duration;

    const canvasStream = canvas.captureStream(fps);
    // Reverse video typically strips audio (standard practice for local client-side reverse)
    const outputTracks = [...canvasStream.getVideoTracks()];
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
      const reversedBlob = new Blob(chunks, { type: mimeType });
      setReversedUrl(URL.createObjectURL(reversedBlob));
      setReversedSize(reversedBlob.size);
      setProcessing(false);
      setProgress(100);
    };

    recorder.start();

    // Frame-by-frame backward seek loop
    const seekAndDraw = async () => {
      if (currentTime <= 0 || !processing) {
        if (recorder.state !== "inactive") {
          recorder.stop();
        }
        return;
      }

      video.currentTime = currentTime;

      await new Promise((resolve) => {
        const onSeeked = () => {
          video.removeEventListener("seeked", onSeeked);
          resolve();
        };
        video.addEventListener("seeked", onSeeked);
      });

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const currentProgress = Math.min(99, Math.round(((video.duration - currentTime) / video.duration) * 100));
      setProgress(currentProgress);

      currentTime -= frameDuration;

      // Small delay to allow the MediaRecorder to process the frames in sequence
      timeoutRef.current = setTimeout(seekAndDraw, 40); // 40ms = 25fps
    };

    seekAndDraw();
  };

  const handleDownload = () => {
    if (!reversedUrl) return;
    const a = document.createElement("a");
    a.href = reversedUrl;
    const baseName = file.name.substring(0, file.name.lastIndexOf("."));
    a.download = `${baseName}_reversed.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const sidebarControls = (
    <>
      <div className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 space-y-2 select-none">
        <p className="leading-relaxed">
          This tool plays the video clips backwards. Due to client-side recording constraints, reversed output does not contain audio.
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-border-subtle">
        <button
          onClick={startReversing}
          disabled={processing || !file}
          className={`w-full py-2.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
            processing || !file
              ? "bg-zinc-300 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 shadow-none cursor-not-allowed opacity-50"
              : "bg-purple-600 hover:bg-purple-700 shadow-purple-500/20 hover:scale-[1.01]"
          }`}
        >
          <span className="material-symbols-outlined text-sm">settings_backup_restore</span>
          Reverse Video
        </button>
      </div>
    </>
  );

  return (
    <VideoToolLayout
      title="Reverse Video"
      description="Rewind or play your video clips backwards, 100% locally inside your browser."
      sidebarControls={sidebarControls}
      onFileUploaded={handleFileUploaded}
      onReset={handleReset}
      onDownload={handleDownload}
      downloadDisabled={!reversedUrl}
      originalFile={file}
      processedUrl={reversedUrl}
      processedSize={reversedSize}
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
            <h3 className="font-extrabold text-purple-600 dark:text-purple-400 text-xs">Reversed Output</h3>
            {reversedSize && (
              <span className="text-[10px] font-mono text-purple-500">{formatBytes(reversedSize)}</span>
            )}
          </div>
          <div className="p-4 flex items-center justify-center flex-grow bg-zinc-950/40 overflow-hidden relative">
            {processing ? (
              <div className="flex flex-col items-center justify-center w-full h-full bg-zinc-950/60 absolute inset-0 z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-3"></div>
                <p className="text-xs font-semibold text-purple-400">Reversing frames... {progress}%</p>
                <button
                  onClick={handleCancel}
                  className="mt-4 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : null}

            {reversedUrl ? (
              <video
                src={reversedUrl}
                controls
                className="max-h-full max-w-full object-contain rounded shadow-sm animate-fade-in"
              />
            ) : (
              <div className="text-center">
                <p className="text-xs font-semibold text-zinc-400 leading-relaxed font-semibold leading-relaxed">
                  Click 'Reverse Video' to process frame rewinding
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
