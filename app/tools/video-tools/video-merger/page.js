"use client";

import { useState, useEffect, useRef } from "react";
import VideoToolLayout, { formatBytes } from "../components/VideoToolLayout";

export default function VideoMergerPage() {
  const [uploadedFiles, setUploadedFiles] = useState([]); // [{ id, file, name, size, url }]
  const [mergedUrl, setMergedUrl] = useState(null);
  const [mergedSize, setMergedSize] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const recorderRef = useRef(null);
  const animationFrameRef = useRef(null);
  const audioCtxRef = useRef(null);

  // Cleanup object URLs on unmount or file reset
  useEffect(() => {
    return () => {
      uploadedFiles.forEach((f) => URL.revokeObjectURL(f.url));
      if (mergedUrl) URL.revokeObjectURL(mergedUrl);
    };
  }, []);

  const handleFilesUploaded = (filesList) => {
    const newFiles = Array.from(filesList).map((f, idx) => ({
      id: `${Date.now()}-${idx}-${Math.random()}`,
      file: f,
      name: f.name,
      size: f.size,
      url: URL.createObjectURL(f)
    }));
    setUploadedFiles((prev) => [...prev, ...newFiles]);
    setMergedUrl(null);
    setMergedSize(null);
    setProgress(0);
  };

  const moveUp = (idx) => {
    if (idx === 0) return;
    setUploadedFiles((prev) => {
      const arr = [...prev];
      const temp = arr[idx];
      arr[idx] = arr[idx - 1];
      arr[idx - 1] = temp;
      return arr;
    });
  };

  const moveDown = (idx) => {
    if (idx === uploadedFiles.length - 1) return;
    setUploadedFiles((prev) => {
      const arr = [...prev];
      const temp = arr[idx];
      arr[idx] = arr[idx + 1];
      arr[idx + 1] = temp;
      return arr;
    });
  };

  const removeFile = (id, url) => {
    URL.revokeObjectURL(url);
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
    setMergedUrl(null);
    setMergedSize(null);
  };

  const handleReset = () => {
    if (processing) {
      handleCancel();
    }
    uploadedFiles.forEach((f) => URL.revokeObjectURL(f.url));
    setUploadedFiles([]);
    if (mergedUrl) URL.revokeObjectURL(mergedUrl);
    setMergedUrl(null);
    setMergedSize(null);
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

  const startMerging = async () => {
    if (uploadedFiles.length < 2 || !videoRef.current || !canvasRef.current) return;

    setProcessing(true);
    setProgress(0);
    setMergedUrl(null);
    setMergedSize(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Initialize Web Audio API for seamless sequential audio recording
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    const audioCtx = audioCtxRef.current;
    if (audioCtx.state === "suspended") {
      await audioCtx.resume();
    }

    // Set canvas dimensions based on first video
    // To ensure files can be drawn, we need to preload them or just wait for loadstart.
    // Let's set a default standard resolution (1280x720) or wait for metadata.
    canvas.width = 1280;
    canvas.height = 720;

    // Connect video audio to Web Audio destination node
    let audioDest;
    let outputTracks = [];
    
    const canvasStream = canvas.captureStream(30);
    outputTracks.push(...canvasStream.getVideoTracks());

    try {
      audioDest = audioCtx.createMediaStreamDestination();
      const sourceNode = audioCtx.createMediaElementSource(video);
      sourceNode.connect(audioDest);
      // Optional: connect to speakers so user can hear it while merging, but keep it muted by default
      // sourceNode.connect(audioCtx.destination);
      
      const audioTracks = audioDest.stream.getAudioTracks();
      if (audioTracks.length > 0) {
        outputTracks.push(audioTracks[0]);
      }
    } catch (e) {
      console.warn("Audio Context setup skipped (might already be connected):", e);
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
      const mergedBlob = new Blob(chunks, { type: mimeType });
      setMergedUrl(URL.createObjectURL(mergedBlob));
      setMergedSize(mergedBlob.size);
      setProcessing(false);
      setProgress(100);
    };

    recorder.start();

    // Sequentially play each video
    for (let i = 0; i < uploadedFiles.length; i++) {
      const activeFile = uploadedFiles[i];
      video.src = activeFile.url;
      video.muted = true; // Mute to keep it silent during headless merge
      
      await new Promise((resolve) => {
        const onLoaded = () => {
          video.removeEventListener("loadedmetadata", onLoaded);
          // Adjust canvas width/height to fit active video
          canvas.width = video.videoWidth || 1280;
          canvas.height = video.videoHeight || 720;
          resolve();
        };
        video.addEventListener("loadedmetadata", onLoaded);
      });

      video.play();

      const drawLoop = () => {
        if (video.paused || video.ended) {
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Progress tracking
        const currentVideoProgress = video.duration ? (video.currentTime / video.duration) : 0;
        const totalProgress = Math.min(99, Math.round(((i + currentVideoProgress) / uploadedFiles.length) * 100));
        setProgress(totalProgress);

        animationFrameRef.current = requestAnimationFrame(drawLoop);
      };

      video.onplay = () => {
        drawLoop();
      };

      await new Promise((resolveEnd) => {
        video.onended = () => {
          if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
          resolveEnd();
        };
      });
    }

    if (recorder.state !== "inactive") {
      recorder.stop();
    }
  };

  const handleDownload = () => {
    if (!mergedUrl) return;
    const a = document.createElement("a");
    a.href = mergedUrl;
    a.download = "merged_video.webm";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const sidebarControls = (
    <>
      <div className="flex flex-col gap-2 select-none">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Video Sequence Order
        </label>
        {uploadedFiles.length === 0 ? (
          <p className="text-[10px] text-zinc-500 font-semibold italic">No videos uploaded yet</p>
        ) : (
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {uploadedFiles.map((fileObj, idx) => (
              <div
                key={fileObj.id}
                className="flex items-center justify-between bg-zinc-50 dark:bg-black/30 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800"
              >
                <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                  <span className="text-[10px] font-extrabold text-zinc-700 dark:text-zinc-300 truncate max-w-[120px]">
                    {fileObj.name}
                  </span>
                  <span className="text-[8px] font-bold text-zinc-400 font-mono">
                    {formatBytes(fileObj.size)}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => moveUp(idx)}
                    disabled={idx === 0}
                    className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded disabled:opacity-30 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xs select-none">arrow_upward</span>
                  </button>
                  <button
                    onClick={() => moveDown(idx)}
                    disabled={idx === uploadedFiles.length - 1}
                    className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded disabled:opacity-30 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xs select-none">arrow_downward</span>
                  </button>
                  <button
                    onClick={() => removeFile(fileObj.id, fileObj.url)}
                    className="p-1 hover:bg-red-500/10 hover:text-red-500 rounded cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xs select-none">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-border-subtle">
        <button
          onClick={startMerging}
          disabled={processing || uploadedFiles.length < 2}
          className={`w-full py-2.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
            processing || uploadedFiles.length < 2
              ? "bg-zinc-300 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 shadow-none cursor-not-allowed opacity-50"
              : "bg-purple-600 hover:bg-purple-700 shadow-purple-500/20 hover:scale-[1.01]"
          }`}
        >
          <span className="material-symbols-outlined text-sm">merge</span>
          Merge Videos
        </button>
      </div>
    </>
  );

  return (
    <VideoToolLayout
      title="Video Merger"
      description="Stitch multiple video clips together sequentially into a single file, 100% inside your browser."
      sidebarControls={sidebarControls}
      onFilesUploaded={handleFilesUploaded}
      allowMultiple={true}
      uploadedFiles={uploadedFiles}
      onReset={handleReset}
      onDownload={handleDownload}
      downloadDisabled={!mergedUrl}
      processedUrl={mergedUrl}
      processedSize={mergedSize}
      processing={processing}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full items-stretch">
        {/* Workspace Uploaded List */}
        <div className="bg-white dark:bg-[#262930] rounded-2xl shadow-sm overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between h-[380px]">
          <div className="bg-gray-50 dark:bg-zinc-800/80 px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center select-none">
            <h3 className="font-extrabold text-zinc-700 dark:text-zinc-300 text-xs">Clips to Merge</h3>
            <span className="text-[10px] font-mono text-zinc-500">{uploadedFiles.length} Selected</span>
          </div>
          <div className="p-4 flex flex-col items-center justify-center flex-grow bg-zinc-950/40 overflow-y-auto min-h-[300px]">
            {uploadedFiles.length > 0 ? (
              <div className="w-full grid grid-cols-2 gap-3">
                {uploadedFiles.map((fileObj, idx) => (
                  <div key={fileObj.id} className="relative group bg-black/40 rounded-xl overflow-hidden border border-zinc-800">
                    <video src={fileObj.url} className="w-full h-24 object-cover" />
                    <div className="absolute top-1 left-1 bg-black/60 px-2 py-0.5 rounded text-[8px] font-mono text-white select-none">
                      #{idx + 1}
                    </div>
                    <div className="p-2 flex flex-col">
                      <span className="text-[9px] font-extrabold text-zinc-300 truncate">{fileObj.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center">
                <p className="text-xs font-semibold text-zinc-400 leading-relaxed">
                  Drag and drop multiple video files here or click the settings sidebar to arrange them
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Output Preview */}
        <div className="bg-white dark:bg-[#262930] rounded-2xl shadow-md overflow-hidden border border-purple-500/20 flex flex-col justify-between h-[380px]">
          <div className="bg-purple-50 dark:bg-purple-950/20 px-4 py-2.5 border-b border-purple-500/20 flex justify-between items-center select-none">
            <h3 className="font-extrabold text-purple-600 dark:text-purple-400 text-xs">Merged Video</h3>
            {mergedSize && (
              <span className="text-[10px] font-mono text-purple-500">{formatBytes(mergedSize)}</span>
            )}
          </div>
          <div className="p-4 flex items-center justify-center flex-grow bg-zinc-950/40 overflow-hidden relative">
            {processing ? (
              <div className="flex flex-col items-center justify-center w-full h-full bg-zinc-950/60 absolute inset-0 z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-3"></div>
                <p className="text-xs font-semibold text-purple-400">Merging tracks... {progress}%</p>
                <button
                  onClick={handleCancel}
                  className="mt-4 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : null}

            {mergedUrl ? (
              <video
                src={mergedUrl}
                controls
                className="max-h-full max-w-full object-contain rounded shadow-sm animate-fade-in"
              />
            ) : (
              <div className="text-center">
                <p className="text-xs font-semibold text-zinc-400 leading-relaxed">
                  Upload at least 2 clips and click 'Merge Videos' to render the output
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <video ref={videoRef} className="hidden" />
      <canvas ref={canvasRef} className="hidden" />
    </VideoToolLayout>
  );
}
