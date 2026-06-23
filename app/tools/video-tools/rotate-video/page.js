"use client";

import { useState, useEffect, useRef } from "react";
import VideoToolLayout, { formatBytes } from "../components/VideoToolLayout";

export default function RotateVideoPage() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [rotatedUrl, setRotatedUrl] = useState(null);
  const [rotatedSize, setRotatedSize] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Settings
  const [rotation, setRotation] = useState(90); // 90, 180, 270

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
      if (rotatedUrl) URL.revokeObjectURL(rotatedUrl);
    };
  }, [rotatedUrl]);

  const handleFileUploaded = (uploadedFile) => {
    setFile(uploadedFile);
    setPreviewUrl(URL.createObjectURL(uploadedFile));
    setRotatedUrl(null);
    setRotatedSize(null);
    setProgress(0);
  };

  const handleReset = () => {
    if (processing) {
      handleCancel();
    }
    setFile(null);
    setPreviewUrl(null);
    setRotatedUrl(null);
    setRotatedSize(null);
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

  const startRotating = async () => {
    if (!file || !videoRef.current || !canvasRef.current) return;

    setProcessing(true);
    setProgress(0);
    setRotatedUrl(null);
    setRotatedSize(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Reset video
    video.currentTime = 0;
    video.muted = true;
    video.play();

    // Adjust canvas dimensions according to rotation angle
    if (rotation === 90 || rotation === 270) {
      canvas.width = video.videoHeight;
      canvas.height = video.videoWidth;
    } else {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    // Set up audio context for routing original sound track silently
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
      const rotatedBlob = new Blob(chunks, { type: mimeType });
      setRotatedUrl(URL.createObjectURL(rotatedBlob));
      setRotatedSize(rotatedBlob.size);
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
      ctx.save();

      if (rotation === 90) {
        ctx.translate(canvas.width, 0);
        ctx.rotate((90 * Math.PI) / 180);
        ctx.drawImage(video, 0, 0, canvas.height, canvas.width);
      } else if (rotation === 180) {
        ctx.translate(canvas.width, canvas.height);
        ctx.rotate((180 * Math.PI) / 180);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      } else if (rotation === 270) {
        ctx.translate(0, canvas.height);
        ctx.rotate((270 * Math.PI) / 180);
        ctx.drawImage(video, 0, 0, canvas.height, canvas.width);
      } else {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }

      ctx.restore();

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
    if (!rotatedUrl) return;
    const a = document.createElement("a");
    a.href = rotatedUrl;
    const baseName = file.name.substring(0, file.name.lastIndexOf("."));
    a.download = `${baseName}_rotated_${rotation}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const sidebarControls = (
    <>
      <div className="flex flex-col gap-1.5 select-none">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Rotation Angle
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 90, label: "90° CW" },
            { value: 180, label: "180°" },
            { value: 270, label: "270° CW" }
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setRotation(item.value)}
              className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                rotation === item.value
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
          onClick={startRotating}
          disabled={processing || !file}
          className={`w-full py-2.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
            processing || !file
              ? "bg-zinc-300 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 shadow-none cursor-not-allowed opacity-50"
              : "bg-purple-600 hover:bg-purple-700 shadow-purple-500/20 hover:scale-[1.01]"
          }`}
        >
          <span className="material-symbols-outlined text-sm">rotate_right</span>
          Rotate Video
        </button>
      </div>
    </>
  );

  return (
    <VideoToolLayout
      title="Rotate Video"
      description="Rotate your video orientations by 90, 180, or 270 degrees clockwise, 100% inside your browser."
      sidebarControls={sidebarControls}
      onFileUploaded={handleFileUploaded}
      onReset={handleReset}
      onDownload={handleDownload}
      downloadDisabled={!rotatedUrl}
      originalFile={file}
      processedUrl={rotatedUrl}
      processedSize={rotatedSize}
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
            <h3 className="font-extrabold text-purple-600 dark:text-purple-400 text-xs">Rotated Output</h3>
            {rotatedSize && (
              <span className="text-[10px] font-mono text-purple-500">{formatBytes(rotatedSize)}</span>
            )}
          </div>
          <div className="p-4 flex items-center justify-center flex-grow bg-zinc-950/40 overflow-hidden relative">
            {processing ? (
              <div className="flex flex-col items-center justify-center w-full h-full bg-zinc-950/60 absolute inset-0 z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-3"></div>
                <p className="text-xs font-semibold text-purple-400">Rotating video tracks... {progress}%</p>
                <button
                  onClick={handleCancel}
                  className="mt-4 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : null}

            {rotatedUrl ? (
              <video
                src={rotatedUrl}
                controls
                className="max-h-full max-w-full object-contain rounded shadow-sm animate-fade-in"
              />
            ) : (
              <div className="text-center">
                <p className="text-xs font-semibold text-zinc-400 leading-relaxed font-semibold leading-relaxed">
                  Choose angle rotation in the sidebar and click 'Rotate Video'
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
