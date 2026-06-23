"use client";

import { useState, useEffect, useRef } from "react";
import AudioToolLayout, { formatBytes } from "../components/AudioToolLayout";

export default function VoiceRecorderPage() {
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState(null);
  const [recordedSize, setRecordedSize] = useState(null);
  const [recordFormat, setRecordFormat] = useState("wav"); // wav, mp3 (webm)
  const [duration, setDuration] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const audioCtxRef = useRef(null);
  const durationIntervalRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupStream();
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    };
  }, []);

  const cleanupStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  };

  const handleReset = () => {
    cleanupStream();
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl(null);
    setRecordedSize(null);
    setRecording(false);
    setPaused(false);
    setDuration(0);
    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
  };

  // Convert Float32 PCM arrays (from decoded recording) to WAV
  const bufferToWav = (buffer) => {
    let numOfChan = Math.min(2, buffer.numberOfChannels),
        length = buffer.length * numOfChan * 2 + 44,
        bufferArr = new ArrayBuffer(length),
        view = new DataView(bufferArr),
        channels = [], i, sample,
        offset = 0,
        pos = 0;

    const setUint16 = (posVal, data) => view.setUint16(posVal, data, true);
    const setUint32 = (posVal, data) => view.setUint32(posVal, data, true);
    const writeString = (posVal, string) => {
      for (let j = 0; j < string.length; j++) {
        view.setUint8(posVal + j, string.charCodeAt(j));
      }
    };

    writeString(0, 'RIFF');
    setUint32(4, length - 8);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    setUint32(16, 16);
    setUint16(20, 1);
    setUint16(22, numOfChan);
    setUint32(24, buffer.sampleRate);
    setUint32(28, buffer.sampleRate * numOfChan * 2);
    setUint16(32, numOfChan * 2);
    setUint16(34, 16);
    writeString(36, 'data');
    setUint32(40, buffer.length * numOfChan * 2);

    for (i = 0; i < numOfChan; i++) {
      channels.push(buffer.getChannelData(i));
    }

    pos = 44;
    while (pos < length) {
      for (i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][offset] || 0));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([bufferArr], { type: "audio/wav" });
  };

  const startRecording = async () => {
    audioChunksRef.current = [];
    setDuration(0);
    setRecordedUrl(null);
    setRecordedSize(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Determine mimeType
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const rawBlob = new Blob(audioChunksRef.current, { type: mimeType || "audio/webm" });
        cleanupStream();

        if (recordFormat === "wav") {
          // Decode raw recording to WAV instantly
          try {
            const arrayBuffer = await rawBlob.arrayBuffer();
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            const tempCtx = new AudioCtx();
            const decodedBuffer = await tempCtx.decodeAudioData(arrayBuffer);
            const wavBlob = bufferToWav(decodedBuffer);
            setRecordedUrl(URL.createObjectURL(wavBlob));
            setRecordedSize(wavBlob.size);
          } catch (err) {
            console.error("WAV conversion failed, using WebM fallback:", err);
            setRecordedUrl(URL.createObjectURL(rawBlob));
            setRecordedSize(rawBlob.size);
          }
        } else {
          setRecordedUrl(URL.createObjectURL(rawBlob));
          setRecordedSize(rawBlob.size);
        }

        setRecording(false);
        setPaused(false);
      };

      // Set up real-time canvas visualization
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioCtxRef.current = audioCtx;

      const sourceNode = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      sourceNode.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      const drawVisuals = () => {
        if (!streamRef.current) return;
        animationFrameRef.current = requestAnimationFrame(drawVisuals);

        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        analyser.getByteFrequencyData(dataArray);

        // Draw frequency bars
        const barWidth = (w / bufferLength) * 1.8;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          barHeight = (dataArray[i] / 255) * h * 0.85;

          // Draw double-sided symmetric bars relative to horizontal center line
          const yTop = (h - barHeight) / 2;
          
          const gradient = ctx.createLinearGradient(x, yTop, x, yTop + barHeight);
          gradient.addColorStop(0, "#c084fc"); // purple-400
          gradient.addColorStop(1, "#818cf8"); // indigo-400
          ctx.fillStyle = gradient;

          ctx.beginPath();
          ctx.roundRect(x, yTop, barWidth, barHeight, 1);
          ctx.fill();

          x += barWidth + 1.5;
        }
      };

      mediaRecorder.start();
      setRecording(true);
      setPaused(false);
      drawVisuals();

      // Start duration counter
      durationIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

    } catch (e) {
      console.error("Microphone access denied or failed:", e);
      alert("Microphone permission denied or device not found.");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      setPaused(true);
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      setPaused(false);
      durationIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    }
  };

  const handleDownload = () => {
    if (!recordedUrl) return;
    const a = document.createElement("a");
    a.href = recordedUrl;
    const ext = recordFormat;
    a.download = `voice_recording.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const sidebarControls = (
    <>
      <div className="flex flex-col gap-1.5 select-none">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Recording Format
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: "wav", label: "WAV (High Quality)" },
            { key: "webm", label: "WebM Audio" }
          ].map((item) => (
            <button
              key={item.key}
              disabled={recording}
              onClick={() => setRecordFormat(item.key)}
              className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                recordFormat === item.key
                  ? "bg-purple-500/10 text-purple-500 border-purple-500/30"
                  : "bg-white/5 dark:bg-white/[0.01] text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-800 dark:hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <AudioToolLayout
      title="Voice Recorder"
      description="Record audio clips using your device's microphone and export to high-quality audio files locally."
      sidebarControls={sidebarControls}
      onFileUploaded={() => {}}
      onReset={handleReset}
      onDownload={handleDownload}
      downloadDisabled={!recordedUrl}
      originalFile={recordedUrl ? { size: recordedSize } : null}
      processedSize={recordedSize}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full items-stretch">
        {/* Recorder Controls */}
        <div className="bg-white dark:bg-[#262930] rounded-2xl shadow-sm overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between h-[380px]">
          <div className="bg-gray-50 dark:bg-zinc-800/80 px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center select-none">
            <h3 className="font-extrabold text-zinc-700 dark:text-zinc-300 text-xs">Microphone Input</h3>
            {recording && (
              <div className="flex items-center gap-1.5 text-red-500 font-extrabold text-[10px] uppercase tracking-wider animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                Recording
              </div>
            )}
          </div>
          <div className="p-6 flex flex-col items-center justify-center flex-grow bg-zinc-950/40 gap-6">
            
            {/* Visualizer Canvas */}
            <div className="w-full h-24 bg-black/35 rounded-2xl border border-zinc-900 overflow-hidden relative">
              <canvas ref={canvasRef} width="400" height="96" className="w-full h-full block" />
              {!recording && !recordedUrl && (
                <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-zinc-500 select-none">
                  Microphone stream inactive
                </div>
              )}
            </div>

            {/* Time Indicator */}
            <div className="text-3xl font-black font-mono tracking-wider text-zinc-800 dark:text-zinc-100 select-none">
              {formatTime(duration)}
            </div>

            {/* Control Panel */}
            <div className="flex items-center gap-3">
              {!recording && !recordedUrl ? (
                <button
                  onClick={startRecording}
                  className="px-6 py-2.5 rounded-xl font-bold bg-purple-600 hover:bg-purple-700 text-white text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-500/20"
                >
                  <span className="material-symbols-outlined text-sm">mic</span>
                  Start Recording
                </button>
              ) : null}

              {recording ? (
                <>
                  {paused ? (
                    <button
                      onClick={resumeRecording}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">play_arrow</span>
                      Resume
                    </button>
                  ) : (
                    <button
                      onClick={pauseRecording}
                      className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">pause</span>
                      Pause
                    </button>
                  )}
                  <button
                    onClick={stopRecording}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">stop</span>
                    Stop
                  </button>
                </>
              ) : null}

              {recordedUrl ? (
                <button
                  onClick={handleReset}
                  className="px-5 py-2.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  Record Again
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Audio Output Preview */}
        <div className="bg-white dark:bg-[#262930] rounded-2xl shadow-md overflow-hidden border border-purple-500/20 flex flex-col justify-between h-[380px]">
          <div className="bg-purple-50 dark:bg-purple-950/20 px-4 py-2.5 border-b border-purple-500/20 flex justify-between items-center select-none">
            <h3 className="font-extrabold text-purple-600 dark:text-purple-400 text-xs">Playback Audio</h3>
            {recordedSize && (
              <span className="text-[10px] font-mono text-purple-500">{formatBytes(recordedSize)}</span>
            )}
          </div>
          <div className="p-6 flex items-center justify-center flex-grow bg-zinc-950/40 relative">
            {recordedUrl ? (
              <div className="flex flex-col items-center gap-6 w-full select-none">
                <span className="material-symbols-outlined text-[64px] text-purple-500 animate-pulse">keyboard_voice</span>
                <audio src={recordedUrl} controls className="w-full h-8" />
              </div>
            ) : (
              <div className="text-center p-4">
                <p className="text-xs font-semibold text-zinc-400 leading-relaxed font-semibold leading-relaxed">
                  {recording 
                    ? "Recording audio live from microphone..." 
                    : "Configure format settings and click 'Start Recording' to record voice."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AudioToolLayout>
  );
}

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
