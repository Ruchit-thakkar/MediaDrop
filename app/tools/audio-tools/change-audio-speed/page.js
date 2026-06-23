"use client";

import { useState, useEffect, useRef } from "react";
import AudioToolLayout, { formatBytes } from "../components/AudioToolLayout";
import WaveformVisualizer from "../components/WaveformVisualizer";

export default function ChangeAudioSpeedPage() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [processedUrl, setProcessedUrl] = useState(null);
  const [processedSize, setProcessedSize] = useState(null);
  const [processedBuffer, setProcessedBuffer] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Settings
  const [speed, setSpeed] = useState(1.5); // 0.5, 1.0, 1.25, 1.5, 2.0

  const audioRef = useRef(null);

  // Cleanup
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      if (processedUrl) URL.revokeObjectURL(processedUrl);
    };
  }, [processedUrl]);

  const handleFileUploaded = async (uploadedFile) => {
    setFile(uploadedFile);
    setPreviewUrl(URL.createObjectURL(uploadedFile));
    setProcessedUrl(null);
    setProcessedSize(null);
    setProcessedBuffer(null);
    setAudioBuffer(null);
    setProgress(0);

    try {
      const arrayBuffer = await uploadedFile.arrayBuffer();
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      setAudioBuffer(decodedBuffer);
      setDuration(decodedBuffer.duration);
    } catch (e) {
      console.error("Failed to decode audio file:", e);
      alert("Failed to decode audio file metadata. Waveform preview disabled.");
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setAudioBuffer(null);
    setProcessedUrl(null);
    setProcessedSize(null);
    setProcessedBuffer(null);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleSeek = (newTime) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Convert AudioBuffer to 16-bit WAV Blob
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

  const startProcessing = async () => {
    if (!file || !audioBuffer) return;

    setProcessing(true);
    setProgress(20);
    setProcessedUrl(null);
    setProcessedSize(null);
    setProcessedBuffer(null);

    setTimeout(async () => {
      try {
        const sampleRate = audioBuffer.sampleRate;
        const targetLength = Math.floor(audioBuffer.length / speed);
        
        // Setup OfflineAudioContext for fast rendering
        const offlineCtx = new OfflineAudioContext(
          audioBuffer.numberOfChannels,
          targetLength,
          sampleRate
        );

        setProgress(40);

        const bufferSource = offlineCtx.createBufferSource();
        bufferSource.buffer = audioBuffer;
        bufferSource.playbackRate.value = speed;
        bufferSource.connect(offlineCtx.destination);
        bufferSource.start(0);

        setProgress(60);

        const renderedBuffer = await offlineCtx.startRendering();
        setProgress(85);

        // Encode output to WAV Blob
        const wavBlob = bufferToWav(renderedBuffer);

        setProcessedUrl(URL.createObjectURL(wavBlob));
        setProcessedSize(wavBlob.size);
        setProcessedBuffer(renderedBuffer);
        setProgress(100);
        setProcessing(false);
      } catch (e) {
        console.error("Speed change failed:", e);
        alert("Failed to modify audio playback speed.");
        setProcessing(false);
        setProgress(0);
      }
    }, 200);
  };

  const handleDownload = () => {
    if (!processedUrl) return;
    const a = document.createElement("a");
    a.href = processedUrl;
    const baseName = file.name.substring(0, file.name.lastIndexOf("."));
    a.download = `${baseName}_speed_${speed}x.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const sidebarControls = (
    <>
      <div className="flex flex-col gap-1.5 select-none">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Playback Speed
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 0.5, label: "0.5x (Slow)" },
            { value: 1.0, label: "1.0x (Normal)" },
            { value: 1.25, label: "1.25x" },
            { value: 1.5, label: "1.5x (Fast)" },
            { value: 2.0, label: "2.0x (Double)" }
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setSpeed(item.value)}
              className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                speed === item.value
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
          onClick={startProcessing}
          disabled={processing || !audioBuffer}
          className={`w-full py-2.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
            processing || !audioBuffer
              ? "bg-zinc-300 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 shadow-none cursor-not-allowed opacity-50"
              : "bg-purple-600 hover:bg-purple-700 shadow-purple-500/20 hover:scale-[1.01]"
          }`}
        >
          <span className="material-symbols-outlined text-sm">speed</span>
          Apply Speed
        </button>
      </div>
    </>
  );

  return (
    <AudioToolLayout
      title="Change Audio Speed"
      description="Speed up or slow down audio playback rates locally inside your browser, maintaining pitch control."
      sidebarControls={sidebarControls}
      onFileUploaded={handleFileUploaded}
      onReset={handleReset}
      onDownload={handleDownload}
      downloadDisabled={!processedUrl}
      originalFile={file}
      processedUrl={processedUrl}
      processedSize={processedSize}
      processing={processing}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full items-stretch">
        <div className="bg-white dark:bg-[#262930] rounded-2xl shadow-sm overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between h-[380px]">
          <div className="bg-gray-50 dark:bg-zinc-800/80 px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center select-none">
            <h3 className="font-extrabold text-zinc-700 dark:text-zinc-300 text-xs">Original Audio</h3>
            <span className="text-[10px] font-mono text-zinc-500">{file?.name}</span>
          </div>
          <div className="p-6 flex flex-col items-center justify-center flex-grow bg-zinc-950/40 gap-6">
            <WaveformVisualizer
              audioBuffer={audioBuffer}
              currentTime={currentTime}
              duration={duration}
              onSeek={handleSeek}
            />
            <audio
              ref={audioRef}
              src={previewUrl}
              onTimeUpdate={handleAudioTimeUpdate}
              controls
              className="w-full h-8"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-[#262930] rounded-2xl shadow-md overflow-hidden border border-purple-500/20 flex flex-col justify-between h-[380px]">
          <div className="bg-purple-50 dark:bg-purple-950/20 px-4 py-2.5 border-b border-purple-500/20 flex justify-between items-center select-none">
            <h3 className="font-extrabold text-purple-600 dark:text-purple-400 text-xs">Speed Altered Output</h3>
            {processedSize && (
              <span className="text-[10px] font-mono text-purple-500">{formatBytes(processedSize)}</span>
            )}
          </div>
          <div className="p-6 flex flex-col items-center justify-center flex-grow bg-zinc-950/40 relative justify-center gap-6">
            {processing ? (
              <div className="flex flex-col items-center justify-center w-full h-full bg-zinc-950/60 absolute inset-0 z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-3"></div>
                <p className="text-xs font-semibold text-purple-400">Rendering speed changes... {progress}%</p>
              </div>
            ) : null}

            {processedUrl ? (
              <>
                <WaveformVisualizer
                  audioBuffer={processedBuffer}
                  currentTime={currentTime}
                  duration={duration / speed}
                  onSeek={handleSeek}
                />
                <audio src={processedUrl} controls className="w-full h-8" />
              </>
            ) : (
              <div className="text-center p-4">
                <p className="text-xs font-semibold text-zinc-400 leading-relaxed font-semibold leading-relaxed">
                  Select playback speed rate in settings and click 'Apply Speed' to transcode.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AudioToolLayout>
  );
}
