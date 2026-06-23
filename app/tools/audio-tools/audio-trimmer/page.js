"use client";

import { useState, useEffect, useRef } from "react";
import AudioToolLayout, { formatBytes } from "../components/AudioToolLayout";
import WaveformVisualizer from "../components/WaveformVisualizer";

export default function AudioTrimmerPage() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [trimmedUrl, setTrimmedUrl] = useState(null);
  const [trimmedSize, setTrimmedSize] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Settings
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);

  const audioRef = useRef(null);

  // Cleanup URLs
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      if (trimmedUrl) URL.revokeObjectURL(trimmedUrl);
    };
  }, [trimmedUrl]);

  const handleFileUploaded = async (uploadedFile) => {
    setFile(uploadedFile);
    setPreviewUrl(URL.createObjectURL(uploadedFile));
    setTrimmedUrl(null);
    setTrimmedSize(null);
    setAudioBuffer(null);
    setProgress(0);

    try {
      const arrayBuffer = await uploadedFile.arrayBuffer();
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      setAudioBuffer(decodedBuffer);
      setDuration(decodedBuffer.duration);
      setStartTime(0);
      setEndTime(decodedBuffer.duration);
    } catch (e) {
      console.error("Failed to decode audio file:", e);
      alert("Failed to decode audio file metadata. Waveform preview disabled.");
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setAudioBuffer(null);
    setTrimmedUrl(null);
    setTrimmedSize(null);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    setStartTime(0);
    setEndTime(0);
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

  const startTrimming = () => {
    if (!file || !audioBuffer) return;

    setProcessing(true);
    setProgress(20);
    setTrimmedUrl(null);
    setTrimmedSize(null);

    setTimeout(() => {
      try {
        const sampleRate = audioBuffer.sampleRate;
        const startSample = Math.floor(startTime * sampleRate);
        const endSample = Math.floor(endTime * sampleRate);
        const trimLength = endSample - startSample;

        if (trimLength <= 0) {
          throw new Error("Invalid trim length.");
        }

        setProgress(50);

        // Allocate a new in-memory AudioBuffer for the sub-segment
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const trimmedBuffer = audioCtx.createBuffer(
          audioBuffer.numberOfChannels,
          trimLength,
          sampleRate
        );

        // Copy matching indexes
        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
          const oldData = audioBuffer.getChannelData(channel);
          const newData = trimmedBuffer.getChannelData(channel);
          // subarray is extremely fast and avoids copying element-by-element manually
          newData.set(oldData.subarray(startSample, endSample));
        }

        setProgress(80);

        // Encode to WAV Blob
        const wavBlob = bufferToWav(trimmedBuffer);
        
        setTrimmedUrl(URL.createObjectURL(wavBlob));
        setTrimmedSize(wavBlob.size);
        setProgress(100);
        setProcessing(false);
      } catch (e) {
        console.error("Trimming failed:", e);
        alert("Failed to trim audio.");
        setProcessing(false);
        setProgress(0);
      }
    }, 200);
  };

  const handleDownload = () => {
    if (!trimmedUrl) return;
    const a = document.createElement("a");
    a.href = trimmedUrl;
    const baseName = file.name.substring(0, file.name.lastIndexOf("."));
    a.download = `${baseName}_trimmed.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const sidebarControls = (
    <>
      <div className="flex flex-col gap-3 select-none">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex justify-between">
            <span>Start Time</span>
            <span className="font-mono text-purple-500">{startTime.toFixed(1)}s</span>
          </label>
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={startTime}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setStartTime(Math.min(val, endTime - 0.2));
            }}
            className="w-full accent-purple-500 cursor-pointer"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex justify-between">
            <span>End Time</span>
            <span className="font-mono text-purple-500">{endTime.toFixed(1)}s</span>
          </label>
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={endTime}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setEndTime(Math.max(val, startTime + 0.2));
            }}
            className="w-full accent-purple-500 cursor-pointer"
          />
        </div>

        <div className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 border-t border-border-subtle pt-2 space-y-1 select-none">
          <div className="flex justify-between">
            <span>Full Length:</span>
            <span className="font-mono text-zinc-800 dark:text-zinc-200">{duration.toFixed(1)}s</span>
          </div>
          <div className="flex justify-between">
            <span>Trim Length:</span>
            <span className="font-mono text-purple-500">{(endTime - startTime).toFixed(1)}s</span>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-border-subtle">
        <button
          onClick={startTrimming}
          disabled={processing || duration === 0}
          className={`w-full py-2.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
            processing || duration === 0
              ? "bg-zinc-300 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 shadow-none cursor-not-allowed opacity-50"
              : "bg-purple-600 hover:bg-purple-700 shadow-purple-500/20 hover:scale-[1.01]"
          }`}
        >
          <span className="material-symbols-outlined text-sm">content_cut</span>
          Trim Audio
        </button>
      </div>
    </>
  );

  return (
    <AudioToolLayout
      title="Audio Trimmer"
      description="Cut specific parts of an audio file locally inside your browser with instant memory buffers extraction."
      sidebarControls={sidebarControls}
      onFileUploaded={handleFileUploaded}
      onReset={handleReset}
      onDownload={handleDownload}
      downloadDisabled={!trimmedUrl}
      originalFile={file}
      processedUrl={trimmedUrl}
      processedSize={trimmedSize}
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
            <h3 className="font-extrabold text-purple-600 dark:text-purple-400 text-xs">Trimmed Output</h3>
            {trimmedSize && (
              <span className="text-[10px] font-mono text-purple-500">{formatBytes(trimmedSize)}</span>
            )}
          </div>
          <div className="p-6 flex items-center justify-center flex-grow bg-zinc-950/40 relative">
            {processing ? (
              <div className="flex flex-col items-center justify-center w-full h-full bg-zinc-950/60 absolute inset-0 z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-3"></div>
                <p className="text-xs font-semibold text-purple-400">Trimming audio file... {progress}%</p>
              </div>
            ) : null}

            {trimmedUrl ? (
              <div className="flex flex-col items-center gap-6 w-full">
                <span className="material-symbols-outlined text-[56px] text-purple-500 animate-pulse">scissors</span>
                <audio src={trimmedUrl} controls className="w-full h-8" />
              </div>
            ) : (
              <div className="text-center p-4">
                <p className="text-xs font-semibold text-zinc-400 leading-relaxed font-semibold leading-relaxed">
                  Select start and end points in the settings sidebar and click 'Trim Audio' to compile.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AudioToolLayout>
  );
}
