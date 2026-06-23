"use client";

import { useState, useEffect, useRef } from "react";
import VideoToolLayout, { formatBytes } from "../components/VideoToolLayout";

export default function ExtractAudioPage() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioSize, setAudioSize] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Settings
  const [targetFormat, setTargetFormat] = useState("wav"); // wav, webm

  // Clean up
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const handleFileUploaded = (uploadedFile) => {
    setFile(uploadedFile);
    setPreviewUrl(URL.createObjectURL(uploadedFile));
    setAudioUrl(null);
    setAudioSize(null);
    setProgress(0);
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setAudioUrl(null);
    setAudioSize(null);
    setProgress(0);
  };

  // Convert AudioBuffer to 16-bit WAV Blob
  const bufferToWav = (buffer) => {
    let numOfChan = buffer.numberOfChannels,
        length = buffer.length * numOfChan * 2 + 44,
        bufferArr = new ArrayBuffer(length),
        view = new DataView(bufferArr),
        channels = [], i, sample,
        offset = 0,
        pos = 0;

    // Write WAV header
    const setUint16 = (data) => {
      view.setUint16(pos, data, true);
      pos += 2;
    };

    const setUint32 = (data) => {
      view.setUint32(pos, data, true);
      pos += 4;
    };

    setUint32(0x46464f52);                         // "RIFF"
    setUint32(length - 8);                         // file length - 8
    setUint32(0x45564157);                         // "WAVE"

    setUint32(0x20746d66);                         // "fmt " chunk
    setUint32(16);                                 // chunk length
    setUint16(1);                                  // sample format (raw PCM)
    setUint16(numOfChan);                          // channel count
    setUint32(buffer.sampleRate);                  // sample rate
    setUint32(buffer.sampleRate * 2 * numOfChan);  // byte rate
    setUint16(numOfChan * 2);                      // block align
    setUint16(16);                                 // bits per sample

    setUint32(0x61746164);                         // "data" - chunk
    setUint32(length - pos - 4);                   // chunk length

    for(i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    while(pos < length) {
      for(i = 0; i < numOfChan; i++) {             // interleave channels
        sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
        sample = (sample < 0 ? sample * 0x8000 : sample * 0x7FFF); // scale to 16-bit signed
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([bufferArr], { type: "audio/wav" });
  };

  const startExtraction = async () => {
    if (!file) return;

    setProcessing(true);
    setProgress(10);
    setAudioUrl(null);
    setAudioSize(null);

    try {
      // Step 1: Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      setProgress(30);

      // Step 2: Decode audio data
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      setProgress(50);
      
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      setProgress(75);

      if (targetFormat === "wav") {
        // Step 3: Encode to WAV
        const wavBlob = bufferToWav(audioBuffer);
        setAudioUrl(URL.createObjectURL(wavBlob));
        setAudioSize(wavBlob.size);
      } else {
        // Encode to WebM audio stream using MediaStreamAudioDestinationNode and MediaRecorder
        const offlineCtx = new OfflineAudioContext(
          audioBuffer.numberOfChannels,
          audioBuffer.length,
          audioBuffer.sampleRate
        );
        
        const bufferSource = offlineCtx.createBufferSource();
        bufferSource.buffer = audioBuffer;

        const mediaDest = offlineCtx.createMediaStreamDestination();
        bufferSource.connect(mediaDest);
        bufferSource.start();

        const recorder = new MediaRecorder(mediaDest.stream, {
          mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : ""
        });

        const chunks = [];
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        const recordingFinished = new Promise((resolve) => {
          recorder.onstop = () => {
            const blob = new Blob(chunks, { type: "audio/webm" });
            resolve(blob);
          };
        });

        recorder.start();
        await offlineCtx.startRendering();
        recorder.stop();

        const webmBlob = await recordingFinished;
        setAudioUrl(URL.createObjectURL(webmBlob));
        setAudioSize(webmBlob.size);
      }

      setProgress(100);
      setProcessing(false);
    } catch (err) {
      console.error("Audio extraction failed:", err);
      alert("Failed to extract audio track. Ensure the video file contains a valid audio stream.");
      setProcessing(false);
      setProgress(0);
    }
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement("a");
    a.href = audioUrl;
    const ext = targetFormat;
    const baseName = file.name.substring(0, file.name.lastIndexOf("."));
    a.download = `${baseName}_audio.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const sidebarControls = (
    <>
      <div className="flex flex-col gap-1.5 select-none">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Audio Output Format
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: "wav", label: "WAV (CD Quality)" },
            { key: "webm", label: "WebM Audio" }
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setTargetFormat(item.key)}
              className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                targetFormat === item.key
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
          onClick={startExtraction}
          disabled={processing || !file}
          className={`w-full py-2.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
            processing || !file
              ? "bg-zinc-300 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 shadow-none cursor-not-allowed opacity-50"
              : "bg-purple-600 hover:bg-purple-700 shadow-purple-500/20 hover:scale-[1.01]"
          }`}
        >
          <span className="material-symbols-outlined text-sm">audiotrack</span>
          Extract Audio
        </button>
      </div>
    </>
  );

  return (
    <VideoToolLayout
      title="Extract Audio from Video"
      description="Extract background music or voices from your video files and export to WAV or WebM format."
      sidebarControls={sidebarControls}
      onFileUploaded={handleFileUploaded}
      onReset={handleReset}
      onDownload={handleDownload}
      downloadDisabled={!audioUrl}
      originalFile={file}
      processedUrl={audioUrl}
      processedSize={audioSize}
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
              src={previewUrl}
              controls
              className="max-h-full max-w-full object-contain rounded shadow-sm"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-[#262930] rounded-2xl shadow-md overflow-hidden border border-purple-500/20 flex flex-col justify-between h-[380px]">
          <div className="bg-purple-50 dark:bg-purple-950/20 px-4 py-2.5 border-b border-purple-500/20 flex justify-between items-center select-none">
            <h3 className="font-extrabold text-purple-600 dark:text-purple-400 text-xs">Extracted Audio Track</h3>
            {audioSize && (
              <span className="text-[10px] font-mono text-purple-500">{formatBytes(audioSize)}</span>
            )}
          </div>
          <div className="p-4 flex items-center justify-center flex-grow bg-zinc-950/40 overflow-hidden relative">
            {processing ? (
              <div className="flex flex-col items-center justify-center w-full h-full bg-zinc-950/60 absolute inset-0 z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-3"></div>
                <p className="text-xs font-semibold text-purple-400">Decoding audio channels... {progress}%</p>
              </div>
            ) : null}

            {audioUrl ? (
              <div className="flex flex-col items-center gap-4 w-full p-6 select-none">
                <span className="material-symbols-outlined text-[64px] text-purple-500 animate-pulse">music_note</span>
                <audio src={audioUrl} controls className="w-full" />
              </div>
            ) : (
              <div className="text-center">
                <p className="text-xs font-semibold text-zinc-400 leading-relaxed">
                  Choose output format and click 'Extract Audio' to start rendering
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </VideoToolLayout>
  );
}
