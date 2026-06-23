"use client";

import { useState, useEffect, useRef } from "react";
import VideoToolLayout, { formatBytes } from "../components/VideoToolLayout";

export default function VideoCutterPage() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Split settings
  const [duration, setDuration] = useState(0);
  const [cutMode, setCutMode] = useState("timestamp"); // timestamp, equal
  const [splitPoint, setSplitPoint] = useState(0);
  const [numSegments, setNumSegments] = useState(2);
  const [cutSegments, setCutSegments] = useState([]); // [{ name, url, size }]

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
      cutSegments.forEach((seg) => URL.revokeObjectURL(seg.url));
    };
  }, [cutSegments]);

  const handleFileUploaded = (uploadedFile) => {
    setFile(uploadedFile);
    setPreviewUrl(URL.createObjectURL(uploadedFile));
    setCutSegments([]);
    setProgress(0);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setDuration(dur);
      setSplitPoint(dur / 2);
    }
  };

  const handleReset = () => {
    if (processing) {
      handleCancel();
    }
    setFile(null);
    setPreviewUrl(null);
    setCutSegments([]);
    setProgress(0);
    setDuration(0);
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

  const startCutting = async () => {
    if (!file || !videoRef.current || !canvasRef.current) return;

    setProcessing(true);
    setProgress(0);
    
    // Revoke old cut URLs
    cutSegments.forEach((seg) => URL.revokeObjectURL(seg.url));
    setCutSegments([]);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Define segments to record: [{ start, end, name }]
    let segments = [];
    const baseName = file.name.substring(0, file.name.lastIndexOf("."));

    if (cutMode === "timestamp") {
      segments = [
        { start: 0, end: splitPoint, name: `${baseName}_part1` },
        { start: splitPoint, end: duration, name: `${baseName}_part2` }
      ];
    } else {
      const segmentDur = duration / numSegments;
      for (let i = 0; i < numSegments; i++) {
        segments.push({
          start: i * segmentDur,
          end: (i + 1) * segmentDur,
          name: `${baseName}_part${i + 1}`
        });
      }
    }

    const recordedSegments = [];

    // Loop through each segment sequentially
    for (let idx = 0; idx < segments.length; idx++) {
      const seg = segments[idx];
      
      // Seek to segment start
      video.currentTime = seg.start;
      video.muted = true;

      await new Promise(resolve => {
        const onSeeked = () => {
          video.removeEventListener("seeked", onSeeked);
          resolve();
        };
        video.addEventListener("seeked", onSeeked);
      });

      video.play();

      const canvasStream = canvas.captureStream(30);
      const outputTracks = [...canvasStream.getVideoTracks()];

      try {
        const originalStream = video.captureStream ? video.captureStream() : (video.mozCaptureStream ? video.mozCaptureStream() : null);
        if (originalStream) {
          const audioTracks = originalStream.getAudioTracks();
          if (audioTracks.length > 0) {
            outputTracks.push(audioTracks[0]);
          }
        }
      } catch (e) {
        console.warn("Could not capture audio for cutting:", e);
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

      const segPromise = new Promise((resolveStop) => {
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType });
          recordedSegments.push({
            name: seg.name,
            url: URL.createObjectURL(blob),
            size: blob.size
          });
          resolveStop();
        };
      });

      const segDuration = seg.end - seg.start;

      // Draw frames for this segment
      const drawFrames = () => {
        if (video.paused || video.ended || video.currentTime >= seg.end) {
          if (recorder.state !== "inactive") {
            recorder.stop();
          }
          video.pause();
          return;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Progress of overall cutting
        const currentElapsed = video.currentTime - seg.start;
        const totalElapsedSoFar = idx * (duration / segments.length) + (currentElapsed / segDuration) * (duration / segments.length);
        const overallProgress = Math.min(99, Math.round((totalElapsedSoFar / duration) * 100));
        setProgress(overallProgress);

        animationFrameRef.current = requestAnimationFrame(drawFrames);
      };

      recorder.start();
      drawFrames();

      video.onplay = () => {
        drawFrames();
      };

      await segPromise;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }

    setCutSegments(recordedSegments);
    setProcessing(false);
    setProgress(100);
  };

  const sidebarControls = (
    <>
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Cutter Mode
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: "timestamp", label: "Split Time" },
            { key: "equal", label: "Equal Parts" }
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setCutMode(item.key)}
              className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                cutMode === item.key
                  ? "bg-purple-500/10 text-purple-500 border-purple-500/30"
                  : "bg-white/5 dark:bg-white/[0.01] text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-800 dark:hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {cutMode === "timestamp" ? (
        <div className="flex flex-col gap-1.5 mt-4">
          <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex justify-between select-none">
            <span>Split Point</span>
            <span className="font-mono text-purple-500">{splitPoint.toFixed(1)}s</span>
          </label>
          <input
            type="range"
            min="0.1"
            max={duration ? duration - 0.1 : 100}
            step="0.1"
            value={splitPoint}
            onChange={(e) => setSplitPoint(parseFloat(e.target.value))}
            className="w-full accent-purple-500 cursor-pointer"
          />
          <p className="text-[9px] text-zinc-400 font-medium mt-1 leading-relaxed">
            Splits video into 2 parts: 0s to {splitPoint.toFixed(1)}s, and {splitPoint.toFixed(1)}s to end.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 mt-4">
          <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex justify-between select-none">
            <span>Number of Parts</span>
            <span className="font-mono text-purple-500">{numSegments}</span>
          </label>
          <input
            type="range"
            min="2"
            max="6"
            step="1"
            value={numSegments}
            onChange={(e) => setNumSegments(parseInt(e.target.value))}
            className="w-full accent-purple-500 cursor-pointer"
          />
          <p className="text-[9px] text-zinc-400 font-medium mt-1 leading-relaxed">
            Divides the video file into {numSegments} parts of equal length.
          </p>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-border-subtle">
        <button
          onClick={startCutting}
          disabled={processing || duration === 0}
          className={`w-full py-2.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
            processing || duration === 0
              ? "bg-zinc-300 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 shadow-none cursor-not-allowed opacity-50"
              : "bg-purple-600 hover:bg-purple-700 shadow-purple-500/20 hover:scale-[1.01]"
          }`}
        >
          <span className="material-symbols-outlined text-sm">view_week</span>
          Cut/Split Video
        </button>
      </div>
    </>
  );

  return (
    <VideoToolLayout
      title="Video Cutter"
      description="Split long videos into shorter chunks or equal duration segments with instant downloads."
      sidebarControls={sidebarControls}
      onFileUploaded={handleFileUploaded}
      onReset={handleReset}
      onDownload={() => {
        // Download all segments sequentially
        cutSegments.forEach((seg) => {
          const a = document.createElement("a");
          a.href = seg.url;
          a.download = `${seg.name}.webm`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        });
      }}
      downloadDisabled={cutSegments.length === 0}
      originalFile={file}
      processing={processing}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full items-stretch">
        {/* Original */}
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

        {/* Segments Output */}
        <div className="bg-white dark:bg-[#262930] rounded-2xl shadow-md overflow-hidden border border-purple-500/20 flex flex-col justify-between h-[380px]">
          <div className="bg-purple-50 dark:bg-purple-950/20 px-4 py-2.5 border-b border-purple-500/20 flex justify-between items-center select-none">
            <h3 className="font-extrabold text-purple-600 dark:text-purple-400 text-xs">Cut Segments</h3>
            <span className="text-[10px] font-mono text-purple-500">{cutSegments.length} Parts</span>
          </div>
          <div className="p-4 flex flex-col items-center justify-center flex-grow bg-zinc-950/40 overflow-y-auto relative min-h-[300px]">
            {processing ? (
              <div className="flex flex-col items-center justify-center w-full h-full bg-zinc-950/65 absolute inset-0 z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-3"></div>
                <p className="text-xs font-semibold text-purple-400">Splitting video tracks... {progress}%</p>
                <button
                  onClick={handleCancel}
                  className="mt-4 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : null}

            {cutSegments.length > 0 ? (
              <div className="w-full space-y-3 p-2">
                {cutSegments.map((seg, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-white/5 dark:bg-black/20 p-3 rounded-xl border border-zinc-200/20 dark:border-zinc-800/80 hover:border-purple-500/30 transition-all duration-300 select-none"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200 font-mono truncate max-w-[150px]">
                        {seg.name}.webm
                      </span>
                      <span className="text-[9px] font-bold text-zinc-400">
                        Size: {formatBytes(seg.size)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={seg.url}
                        download={`${seg.name}.webm`}
                        className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-xs">download</span>
                        Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-4">
                <p className="text-xs font-semibold text-zinc-400 leading-relaxed">
                  Configure cut options in the settings sidebar, then click 'Cut/Split Video'
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
