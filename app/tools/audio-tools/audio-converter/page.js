"use client";

import { useState, useEffect, useRef } from "react";
import AudioToolLayout, { formatBytes } from "../components/AudioToolLayout";
import WaveformVisualizer from "../components/WaveformVisualizer";

export default function AudioConverterPage() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [convertedUrl, setConvertedUrl] = useState(null);
  const [convertedSize, setConvertedSize] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Settings
  const [targetFormat, setTargetFormat] = useState("wav"); // wav, webm, ogg

  const audioRef = useRef(null);
  const recorderRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Cleanup URLs
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

  const handleFileUploaded = async (uploadedFile) => {
    setFile(uploadedFile);
    setPreviewUrl(URL.createObjectURL(uploadedFile));
    setConvertedUrl(null);
    setConvertedSize(null);
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
    if (processing) {
      handleCancel();
    }
    setFile(null);
    setPreviewUrl(null);
    setAudioBuffer(null);
    setConvertedUrl(null);
    setConvertedSize(null);
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
    setUint16(20, 1); // PCM Raw
    setUint16(22, numOfChan);
    setUint32(24, buffer.sampleRate);
    setUint32(28, buffer.sampleRate * numOfChan * 2); // Byte rate
    setUint16(32, numOfChan * 2); // Block align
    setUint16(34, 16); // 16-bit
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

  const startConversion = async () => {
    if (!file || !audioBuffer) return;

    setProcessing(true);
    setProgress(10);
    setConvertedUrl(null);
    setConvertedSize(null);

    if (targetFormat === "wav") {
      // Instant WAV rendering
      setTimeout(() => {
        try {
          const blob = bufferToWav(audioBuffer);
          setProgress(100);
          setConvertedUrl(URL.createObjectURL(blob));
          setConvertedSize(blob.size);
          setProcessing(false);
        } catch (e) {
          console.error("WAV conversion failed:", e);
          alert("WAV encoding failed locally.");
          setProcessing(false);
        }
      }, 300);
    } else {
      // Standard real-time MediaRecorder recording
      const audio = audioRef.current;
      audio.currentTime = 0;
      audio.muted = true;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      const sourceNode = audioCtx.createMediaElementSource(audio);
      const destNode = audioCtx.createMediaStreamDestination();
      sourceNode.connect(destNode);

      const mimeType = targetFormat === "webm" 
        ? (MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "") 
        : (MediaRecorder.isTypeSupported("audio/ogg") ? "audio/ogg" : "");

      const chunks = [];
      const recorder = new MediaRecorder(destNode.stream, { mimeType });
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const convertedBlob = new Blob(chunks, { type: mimeType || "audio/webm" });
        setConvertedUrl(URL.createObjectURL(convertedBlob));
        setConvertedSize(convertedBlob.size);
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
      <div className="flex flex-col gap-1.5 select-none">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Target Format
        </label>
        <select
          value={targetFormat}
          onChange={(e) => setTargetFormat(e.target.value)}
          className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none"
        >
          <option value="wav">WAV (CD Quality uncompressed)</option>
          <option value="webm">WebM Audio (Compressed/Chrome/Firefox)</option>
          <option value="ogg">OGG Audio (Compressed/Firefox)</option>
        </select>
      </div>

      <div className="mt-6 pt-4 border-t border-border-subtle">
        <button
          onClick={startConversion}
          disabled={processing || !audioBuffer}
          className={`w-full py-2.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
            processing || !audioBuffer
              ? "bg-zinc-300 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 shadow-none cursor-not-allowed opacity-50"
              : "bg-purple-600 hover:bg-purple-700 shadow-purple-500/20 hover:scale-[1.01]"
          }`}
        >
          <span className="material-symbols-outlined text-sm">transform</span>
          Convert Audio
        </button>
      </div>
    </>
  );

  return (
    <AudioToolLayout
      title="Audio Converter"
      description="Transcode audio files into modern standard container formats (WAV, WebM, OGG) completely inside your browser."
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
            <h3 className="font-extrabold text-purple-600 dark:text-purple-400 text-xs">Converted Output</h3>
            {convertedSize && (
              <span className="text-[10px] font-mono text-purple-500">{formatBytes(convertedSize)}</span>
            )}
          </div>
          <div className="p-6 flex items-center justify-center flex-grow bg-zinc-950/40 relative">
            {processing ? (
              <div className="flex flex-col items-center justify-center w-full h-full bg-zinc-950/60 absolute inset-0 z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-3"></div>
                <p className="text-xs font-semibold text-purple-400">Converting audio file... {progress}%</p>
                {targetFormat !== "wav" && (
                  <button
                    onClick={handleCancel}
                    className="mt-4 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            ) : null}

            {convertedUrl ? (
              <div className="flex flex-col items-center gap-6 w-full">
                <span className="material-symbols-outlined text-[56px] text-purple-500 animate-pulse">music_video</span>
                <audio src={convertedUrl} controls className="w-full h-8" />
              </div>
            ) : (
              <div className="text-center p-4">
                <p className="text-xs font-semibold text-zinc-400 leading-relaxed font-semibold leading-relaxed">
                  Choose target output format in the settings sidebar and click 'Convert Audio' to transcode.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AudioToolLayout>
  );
}
