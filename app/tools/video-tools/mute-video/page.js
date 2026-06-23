"use client";

import { useState, useEffect, useRef } from "react";
import VideoToolLayout, { formatBytes } from "../components/VideoToolLayout";

export default function MuteVideoPage() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [mutedUrl, setMutedUrl] = useState(null);
  const [mutedSize, setMutedSize] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const recorderRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Cleanup
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      if (mutedUrl) URL.revokeObjectURL(mutedUrl);
    };
  }, [mutedUrl]);

  const handleFileUploaded = (uploadedFile) => {
    setFile(uploadedFile);
    setPreviewUrl(URL.createObjectURL(uploadedFile));
    setMutedUrl(null);
    setMutedSize(null);
    setProgress(0);
  };

  const handleReset = () => {
    if (processing) {
      handleCancel();
    }
    setFile(null);
    setPreviewUrl(null);
    setMutedUrl(null);
    setMutedSize(null);
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

  const startMuting = async () => {
    if (!file || !videoRef.current || !canvasRef.current) return;

    setProcessing(true);
    setProgress(0);
    setMutedUrl(null);
    setMutedSize(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Reset video
    video.currentTime = 0;
    video.muted = true;
    video.play();

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Capture ONLY video track from canvas stream (silencing output)
    const canvasStream = canvas.captureStream(30);
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
      const mutedBlob = new Blob(chunks, { type: mimeType });
      setMutedUrl(URL.createObjectURL(mutedBlob));
      setMutedSize(mutedBlob.size);
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
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
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
    if (!mutedUrl) return;
    const a = document.createElement("a");
    a.href = mutedUrl;
    const baseName = file.name.substring(0, file.name.lastIndexOf("."));
    a.download = `${baseName}_muted.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const sidebarControls = (
    <>
      <div className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 space-y-2 select-none">
        <p className="leading-relaxed">
          Strips all audio tracks from the video file locally, saving a clean, silent file.
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-border-subtle">
        <button
          onClick={startMuting}
          disabled={processing || !file}
          className={`w-full py-2.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
            processing || !file
              ? "bg-zinc-300 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 shadow-none cursor-not-allowed opacity-50"
              : "bg-purple-600 hover:bg-purple-700 shadow-purple-500/20 hover:scale-[1.01]"
          }`}
        >
          <span className="material-symbols-outlined text-sm">volume_off</span>
          Mute Video
        </button>
      </div>
    </>
  );

  return (
    <VideoToolLayout
      title="Mute Video"
      description="Remove audio tracks from video files locally inside your browser, outputting silent videos."
      sidebarControls={sidebarControls}
      onFileUploaded={handleFileUploaded}
      onReset={handleReset}
      onDownload={handleDownload}
      downloadDisabled={!mutedUrl}
      originalFile={file}
      processedUrl={mutedUrl}
      processedSize={mutedSize}
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
            <h3 className="font-extrabold text-purple-600 dark:text-purple-400 text-xs">Muted Output</h3>
            {mutedSize && (
              <span className="text-[10px] font-mono text-purple-500">{formatBytes(mutedSize)}</span>
            )}
          </div>
          <div className="p-4 flex items-center justify-center flex-grow bg-zinc-950/40 overflow-hidden relative">
            {processing ? (
              <div className="flex flex-col items-center justify-center w-full h-full bg-zinc-950/60 absolute inset-0 z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-3"></div>
                <p className="text-xs font-semibold text-purple-400">Removing audio... {progress}%</p>
                <button
                  onClick={handleCancel}
                  className="mt-4 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : null}

            {mutedUrl ? (
              <video
                src={mutedUrl}
                controls
                className="max-h-full max-w-full object-contain rounded shadow-sm animate-fade-in"
              />
            ) : (
              <div className="text-center">
                <p className="text-xs font-semibold text-zinc-400 leading-relaxed font-semibold leading-relaxed">
                  Click 'Mute Video' to start processing silent render
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
