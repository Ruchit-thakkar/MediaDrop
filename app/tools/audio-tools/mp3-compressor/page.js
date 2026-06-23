"use client";

import { useState, useEffect, useRef } from "react";
import AudioToolLayout, { formatBytes } from "../components/AudioToolLayout";
import WaveformVisualizer from "../components/WaveformVisualizer";

export default function Mp3CompressorPage() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [compressedUrl, setCompressedUrl] = useState(null);
  const [compressedSize, setCompressedSize] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Settings
  const [quality, setQuality] = useState("medium"); // low, medium, high
  const [compressMethod, setCompressMethod] = useState("fast"); // fast (WAV downsample), standard (WebM bitrate)

  const audioRef = useRef(null);
  const recorderRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Cleanup object URLs
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

  const handleFileUploaded = async (uploadedFile) => {
    setFile(uploadedFile);
    setPreviewUrl(URL.createObjectURL(uploadedFile));
    setCompressedUrl(null);
    setCompressedSize(null);
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
      alert("Failed to read audio file metadata. Waveform preview disabled.");
    }
  };

  const handleReset = () => {
    if (processing) {
      handleCancel();
    }
    setFile(null);
    setPreviewUrl(null);
    setAudioBuffer(null);
    setCompressedUrl(null);
    setCompressedSize(null);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
  };

  const handleCancel = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setProcessing(false);
    setProgress(0);
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

  // Instant WAV downsample compression in memory
  const compressWavInMemory = (buffer, targetQuality) => {
    let targetSampleRate = 22050; // medium
    let makeMono = true;

    if (targetQuality === "low") {
      targetSampleRate = 16000;
      makeMono = true;
    } else if (targetQuality === "high") {
      targetSampleRate = 32000;
      makeMono = false;
    }

    const numOfChan = makeMono ? 1 : Math.min(2, buffer.numberOfChannels);
    const ratio = buffer.sampleRate / targetSampleRate;
    const targetLength = Math.round(buffer.length / ratio);

    const length = targetLength * numOfChan * 2 + 44;
    const bufferArr = new ArrayBuffer(length);
    const view = new DataView(bufferArr);

    // Write WAV header
    const setUint16 = (pos, data) => view.setUint16(pos, data, true);
    const setUint32 = (pos, data) => view.setUint32(pos, data, true);

    const writeString = (pos, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(pos + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    setUint32(4, length - 8);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    setUint32(16, 16);
    setUint16(20, 1); // Raw PCM
    setUint16(22, numOfChan);
    setUint32(24, targetSampleRate);
    setUint32(28, targetSampleRate * numOfChan * 2); // Byte rate
    setUint16(32, numOfChan * 2); // Block align
    setUint16(34, 16); // 16-bit
    writeString(36, 'data');
    setUint32(40, targetLength * numOfChan * 2);

    // Downsample and interleave channel buffers
    const sourceData = [];
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      sourceData.push(buffer.getChannelData(c));
    }

    let pos = 44;
    for (let i = 0; i < targetLength; i++) {
      const sourceIndex = Math.round(i * ratio);
      
      if (makeMono) {
        // Average channels for mono
        let sample = 0;
        for (let c = 0; c < buffer.numberOfChannels; c++) {
          sample += sourceData[c][sourceIndex] || 0;
        }
        sample /= buffer.numberOfChannels;
        sample = Math.max(-1, Math.min(1, sample));
        const val = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(pos, val, true);
        pos += 2;
      } else {
        // Stereo interleave
        for (let c = 0; c < numOfChan; c++) {
          const sample = Math.max(-1, Math.min(1, sourceData[c][sourceIndex] || 0));
          const val = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
          view.setInt16(pos, val, true);
          pos += 2;
        }
      }
    }

    return new Blob([bufferArr], { type: "audio/wav" });
  };

  const startCompression = async () => {
    if (!file || !audioBuffer) return;

    setProcessing(true);
    setProgress(10);
    setCompressedUrl(null);
    setCompressedSize(null);

    if (compressMethod === "fast") {
      // Fast in-memory downsample compression
      setTimeout(() => {
        try {
          const blob = compressWavInMemory(audioBuffer, quality);
          setProgress(100);
          setCompressedUrl(URL.createObjectURL(blob));
          setCompressedSize(blob.size);
          setProcessing(false);
        } catch (e) {
          console.error("In-memory compression failed:", e);
          alert("Compression failed. Try using standard recording method.");
          setProcessing(false);
        }
      }, 300);
    } else {
      // Standard real-time MediaRecorder compression
      const audio = audioRef.current;
      audio.currentTime = 0;
      audio.muted = true;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      const sourceNode = audioCtx.createMediaElementSource(audio);
      const destNode = audioCtx.createMediaStreamDestination();
      sourceNode.connect(destNode);

      let targetBitrate = 192000; // 192kbps
      if (quality === "low") targetBitrate = 96000;
      else if (quality === "high") targetBitrate = 320000;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg";
      const chunks = [];
      const recorder = new MediaRecorder(destNode.stream, {
        mimeType,
        audioBitsPerSecond: targetBitrate
      });
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const compressedBlob = new Blob(chunks, { type: mimeType });
        setCompressedUrl(URL.createObjectURL(compressedBlob));
        setCompressedSize(compressedBlob.size);
        setProcessing(false);
        setProgress(100);
      };

      audio.play();
      recorder.start();

      const updateProgress = () => {
        if (audio.paused || audio.ended) {
          if (recorder.state !== "inactive") recorder.stop();
          return;
        }
        const currentProgress = Math.min(99, Math.round((audio.currentTime / audio.duration) * 100));
        setProgress(currentProgress);
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      };

      audio.onplay = () => {
        updateProgress();
      };

      audio.onended = () => {
        if (recorder.state !== "inactive") recorder.stop();
      };
    }
  };

  const handleDownload = () => {
    if (!compressedUrl) return;
    const a = document.createElement("a");
    a.href = compressedUrl;
    const ext = compressMethod === "fast" ? "wav" : "webm";
    const baseName = file.name.substring(0, file.name.lastIndexOf("."));
    a.download = `${baseName}_compressed.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const sidebarControls = (
    <>
      <div className="flex flex-col gap-1.5 select-none">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Compression Quality
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: "low", label: "Low (96k)" },
            { key: "medium", label: "Medium (192k)" },
            { key: "high", label: "High (320k)" }
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setQuality(item.key)}
              className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
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

      <div className="flex flex-col gap-1.5 mt-4 select-none">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Processing Speed
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: "fast", label: "Instant (WAV)" },
            { key: "standard", label: "Standard (WebM)" }
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setCompressMethod(item.key)}
              className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                compressMethod === item.key
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
          onClick={startCompression}
          disabled={processing || !audioBuffer}
          className={`w-full py-2.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
            processing || !audioBuffer
              ? "bg-zinc-300 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 shadow-none cursor-not-allowed opacity-50"
              : "bg-purple-600 hover:bg-purple-700 shadow-purple-500/20 hover:scale-[1.01]"
          }`}
        >
          <span className="material-symbols-outlined text-sm">settings_input_component</span>
          Compress Audio
        </button>
      </div>
    </>
  );

  return (
    <AudioToolLayout
      title="MP3 Compressor"
      description="Reduce MP3, WAV, or AAC audio file size locally inside your browser using in-memory compression."
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
        {/* Original */}
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

        {/* Compressed */}
        <div className="bg-white dark:bg-[#262930] rounded-2xl shadow-md overflow-hidden border border-purple-500/20 flex flex-col justify-between h-[380px]">
          <div className="bg-purple-50 dark:bg-purple-950/20 px-4 py-2.5 border-b border-purple-500/20 flex justify-between items-center select-none">
            <h3 className="font-extrabold text-purple-600 dark:text-purple-400 text-xs">Compressed Output</h3>
            {compressedSize && (
              <span className="text-[10px] font-mono text-purple-500">{formatBytes(compressedSize)}</span>
            )}
          </div>
          <div className="p-6 flex items-center justify-center flex-grow bg-zinc-950/40 relative">
            {processing ? (
              <div className="flex flex-col items-center justify-center w-full h-full bg-zinc-950/60 absolute inset-0 z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-3"></div>
                <p className="text-xs font-semibold text-purple-400">Compressing audio tracks... {progress}%</p>
                {compressMethod === "standard" && (
                  <button
                    onClick={handleCancel}
                    className="mt-4 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            ) : null}

            {compressedUrl ? (
              <div className="flex flex-col items-center gap-6 w-full">
                <span className="material-symbols-outlined text-[56px] text-purple-500 animate-pulse">music_video</span>
                <audio src={compressedUrl} controls className="w-full h-8" />
              </div>
            ) : (
              <div className="text-center p-4">
                <p className="text-xs font-semibold text-zinc-400 leading-relaxed font-semibold leading-relaxed">
                  Adjust quality settings in the sidebar and click 'Compress Audio' to run the local compression.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AudioToolLayout>
  );
}
