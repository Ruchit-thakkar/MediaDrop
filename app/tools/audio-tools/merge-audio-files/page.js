"use client";

import { useState, useEffect, useRef } from "react";
import AudioToolLayout, { formatBytes } from "../components/AudioToolLayout";
import WaveformVisualizer from "../components/WaveformVisualizer";

export default function MergeAudioPage() {
  const [uploadedFiles, setUploadedFiles] = useState([]); // [{ id, file, name, size, url, buffer }]
  const [mergedUrl, setMergedUrl] = useState(null);
  const [mergedSize, setMergedSize] = useState(null);
  const [mergedBuffer, setMergedBuffer] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef(null);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      uploadedFiles.forEach((f) => URL.revokeObjectURL(f.url));
      if (mergedUrl) URL.revokeObjectURL(mergedUrl);
    };
  }, []);

  const handleFilesUploaded = async (filesList) => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioCtx();

    const newFiles = await Promise.all(
      Array.from(filesList).map(async (f, idx) => {
        const url = URL.createObjectURL(f);
        let buffer = null;
        try {
          const arrayBuffer = await f.arrayBuffer();
          buffer = await audioCtx.decodeAudioData(arrayBuffer);
        } catch (e) {
          console.error("Failed to decode audio track:", e);
        }
        return {
          id: `${Date.now()}-${idx}-${Math.random()}`,
          file: f,
          name: f.name,
          size: f.size,
          url,
          buffer
        };
      })
    );

    setUploadedFiles((prev) => [...prev, ...newFiles]);
    setMergedUrl(null);
    setMergedSize(null);
    setMergedBuffer(null);
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
    setMergedBuffer(null);
  };

  const handleReset = () => {
    uploadedFiles.forEach((f) => URL.revokeObjectURL(f.url));
    setUploadedFiles([]);
    if (mergedUrl) URL.revokeObjectURL(mergedUrl);
    setMergedUrl(null);
    setMergedSize(null);
    setMergedBuffer(null);
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

  const startMerging = () => {
    const validFiles = uploadedFiles.filter(f => f.buffer !== null);
    if (validFiles.length < 2) return;

    setProcessing(true);
    setProgress(10);
    setMergedUrl(null);
    setMergedSize(null);
    setMergedBuffer(null);

    setTimeout(() => {
      try {
        const sampleRate = validFiles[0].buffer.sampleRate;
        const numOfChan = Math.max(...validFiles.map(f => f.buffer.numberOfChannels));
        
        // Sum total lengths
        const totalLength = validFiles.reduce((acc, f) => acc + f.buffer.length, 0);
        setProgress(40);

        // Allocate unified buffer
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const outputBuffer = audioCtx.createBuffer(
          numOfChan,
          totalLength,
          sampleRate
        );

        let offset = 0;
        validFiles.forEach((fileObj, idx) => {
          const buf = fileObj.buffer;
          for (let channel = 0; channel < buf.numberOfChannels; channel++) {
            const channelData = buf.getChannelData(channel);
            outputBuffer.getChannelData(channel).set(channelData, offset);
          }
          offset += buf.length;
          setProgress(Math.round(40 + (idx / validFiles.length) * 30));
        });

        // Encode to WAV Blob
        const wavBlob = bufferToWav(outputBuffer);

        setMergedUrl(URL.createObjectURL(wavBlob));
        setMergedSize(wavBlob.size);
        setMergedBuffer(outputBuffer);
        setDuration(outputBuffer.duration);
        setProgress(100);
        setProcessing(false);
      } catch (e) {
        console.error("Merging failed:", e);
        alert("Failed to merge audio files.");
        setProcessing(false);
        setProgress(0);
      }
    }, 200);
  };

  const handleDownload = () => {
    if (!mergedUrl) return;
    const a = document.createElement("a");
    a.href = mergedUrl;
    a.download = "merged_audio.wav";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const sidebarControls = (
    <>
      <div className="flex flex-col gap-2 select-none">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Audio Playback Order
        </label>
        {uploadedFiles.length === 0 ? (
          <p className="text-[10px] text-zinc-500 font-semibold italic">No audio tracks uploaded</p>
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
          Merge Audios
        </button>
      </div>
    </>
  );

  return (
    <AudioToolLayout
      title="Merge Audio Files"
      description="Stitch multiple audio clips together sequentially into a continuous continuous mix."
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
        <div className="bg-white dark:bg-[#262930] rounded-2xl shadow-sm overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between h-[380px]">
          <div className="bg-gray-50 dark:bg-zinc-800/80 px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center select-none">
            <h3 className="font-extrabold text-zinc-700 dark:text-zinc-300 text-xs">Clips to Merge</h3>
            <span className="text-[10px] font-mono text-zinc-500">{uploadedFiles.length} Selected</span>
          </div>
          <div className="p-4 flex flex-col items-center justify-center flex-grow bg-zinc-950/40 overflow-y-auto min-h-[300px]">
            {uploadedFiles.length > 0 ? (
              <div className="w-full grid grid-cols-1 gap-2.5">
                {uploadedFiles.map((fileObj, idx) => (
                  <div key={fileObj.id} className="flex items-center justify-between bg-black/40 rounded-xl p-3 border border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-500/20 text-purple-400 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono">
                        {idx + 1}
                      </div>
                      <span className="text-[11px] font-bold text-zinc-300 truncate max-w-[200px]">{fileObj.name}</span>
                    </div>
                    {fileObj.buffer ? (
                      <span className="text-[9px] font-mono text-zinc-500">{fileObj.buffer.duration.toFixed(1)}s</span>
                    ) : (
                      <span className="text-[9px] text-zinc-500 animate-pulse">loading...</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center">
                <p className="text-xs font-semibold text-zinc-400 leading-relaxed font-semibold leading-relaxed">
                  Drag and drop multiple audio clips here or select them using the uploader, then order in settings.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-[#262930] rounded-2xl shadow-md overflow-hidden border border-purple-500/20 flex flex-col justify-between h-[380px]">
          <div className="bg-purple-50 dark:bg-purple-950/20 px-4 py-2.5 border-b border-purple-500/20 flex justify-between items-center select-none">
            <h3 className="font-extrabold text-purple-600 dark:text-purple-400 text-xs">Merged Mix Output</h3>
            {mergedSize && (
              <span className="text-[10px] font-mono text-purple-500">{formatBytes(mergedSize)}</span>
            )}
          </div>
          <div className="p-6 flex flex-col items-center justify-center flex-grow bg-zinc-950/40 relative justify-center gap-6">
            {processing ? (
              <div className="flex flex-col items-center justify-center w-full h-full bg-zinc-950/60 absolute inset-0 z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-3"></div>
                <p className="text-xs font-semibold text-purple-400">Merging buffers... {progress}%</p>
              </div>
            ) : null}

            {mergedUrl ? (
              <>
                <WaveformVisualizer
                  audioBuffer={mergedBuffer}
                  currentTime={currentTime}
                  duration={duration}
                  onSeek={handleSeek}
                />
                <audio
                  ref={audioRef}
                  src={mergedUrl}
                  onTimeUpdate={handleAudioTimeUpdate}
                  controls
                  className="w-full h-8"
                />
              </>
            ) : (
              <div className="text-center p-4">
                <p className="text-xs font-semibold text-zinc-400 leading-relaxed font-semibold leading-relaxed">
                  Add at least 2 audio files and click 'Merge Audios' to compile the continuous mix.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AudioToolLayout>
  );
}
