"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { WatermarkEngine } from "./watermarkEngine";
import JSZip from "jszip";

export default function GeminiRemoverPage() {
  const [theme, setTheme] = useState("dark");
  const [engine, setEngine] = useState(null);
  const [engineLoading, setEngineLoading] = useState(true);
  const [engineError, setEngineError] = useState(false);
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const fileInputRef = useRef(null);

  // Sync theme with local storage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
  }, []);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const handleToggleTheme = () => setTheme(prev => prev === "dark" ? "light" : "dark");

  // Load Watermark Engine
  useEffect(() => {
    WatermarkEngine.create()
      .then(inst => {
        setEngine(inst);
        setEngineLoading(false);
      })
      .catch(err => {
        console.error("Failed to load watermark engine:", err);
        setEngineError(true);
        setEngineLoading(false);
      });
  }, []);

  // Clean up Object URLs on unmount or reset
  const cleanupUrls = (fileList) => {
    fileList.forEach(f => {
      if (f.originalUrl) URL.revokeObjectURL(f.originalUrl);
      if (f.cleanedUrl) URL.revokeObjectURL(f.cleanedUrl);
    });
  };

  useEffect(() => {
    return () => {
      cleanupUrls(files);
    };
  }, []);

  const processFile = async (fileRecord, currentEngine) => {
    let activeEngine = currentEngine || engine;
    if (!activeEngine) {
      try {
        activeEngine = await WatermarkEngine.create();
        setEngine(activeEngine);
      } catch (err) {
        console.error("Failed to initialize engine:", err);
        setFiles(prev => prev.map(f => f.id === fileRecord.id ? { ...f, status: "error", error: "Engine failed to initialize." } : f));
        return;
      }
    }

    try {
      const analysisResult = await activeEngine.analyze(fileRecord.file);
      const restoreResult = await activeEngine.restore(analysisResult);
      const cleanedUrl = URL.createObjectURL(restoreResult.blob);

      setFiles(prev => prev.map(f => f.id === fileRecord.id ? {
        ...f,
        cleanedUrl,
        blob: restoreResult.blob,
        width: restoreResult.width,
        height: restoreResult.height,
        status: "completed",
        analysis: analysisResult
      } : f));
    } catch (err) {
      console.error("Processing failed for", fileRecord.name, err);
      setFiles(prev => prev.map(f => f.id === fileRecord.id ? { ...f, status: "error", error: "Failed to process image." } : f));
    }
  };

  const handleFiles = async (incomingFiles) => {
    const validFiles = Array.from(incomingFiles).filter(f => f.type.startsWith("image/"));
    if (validFiles.length === 0) return;

    let activeEngine = engine;
    if (!activeEngine) {
      try {
        activeEngine = await WatermarkEngine.create();
        setEngine(activeEngine);
      } catch (err) {
        console.error("Failed to load watermark engine:", err);
        setEngineError(true);
        return;
      }
    }

    const newFileRecords = validFiles.map((file, idx) => {
      const id = `${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`;
      return {
        id,
        name: file.name,
        file,
        originalUrl: URL.createObjectURL(file),
        cleanedUrl: null,
        width: 0,
        height: 0,
        status: "analyzing",
        error: null,
        analysis: null
      };
    });

    setFiles(prev => [...prev, ...newFileRecords]);

    newFileRecords.forEach(record => {
      processFile(record, activeEngine);
    });
  };

  const handleRetry = (fileRecord) => {
    setFiles(prev => prev.map(f => f.id === fileRecord.id ? { ...f, status: "analyzing", error: null } : f));
    processFile(fileRecord, engine);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleReset = () => {
    cleanupUrls(files);
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const downloadSingleFile = (fileRecord) => {
    if (!fileRecord || fileRecord.status !== "completed") return;
    const a = document.createElement("a");
    a.href = fileRecord.cleanedUrl;
    const baseName = fileRecord.name.substring(0, fileRecord.name.lastIndexOf("."));
    a.download = `clean_${baseName}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadAllZip = async () => {
    const completed = files.filter(f => f.status === "completed");
    if (completed.length === 0) return;

    const zip = new JSZip();
    const usedNames = new Set();

    completed.forEach(item => {
      const lastDot = item.name.lastIndexOf(".");
      const baseName = lastDot !== -1 ? item.name.substring(0, lastDot) : item.name;
      
      let finalName = `clean_${baseName}.png`;
      let counter = 1;
      
      while (usedNames.has(finalName)) {
        finalName = `clean_${baseName}_${counter}.png`;
        counter++;
      }
      usedNames.add(finalName);
      
      zip.file(finalName, item.blob);
    });

    try {
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cleaned_gemini_images_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error("ZIP Generation failed:", err);
    }
  };

  const bgPattern = "bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2Y5ZmRmZCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjJmMmYyIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGwlMmYyZjIiLz48L3N2Zz4=')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMjYyOTMwIi8+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMWQxZjI0Ii8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMxZDFmMjQiLz48L3N2Zz4=')]";

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col relative overflow-x-hidden selection:bg-purple-500/30">
      {/* Background glow graphics */}
      <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full ambient-glow-1 blur-[130px] pointer-events-none z-[-1]"></div>
      <div className="absolute top-[40%] right-[-10%] w-[45vw] h-[45vw] rounded-full ambient-glow-2 blur-[130px] pointer-events-none z-[-1]"></div>

      <Navbar theme={theme} onToggleTheme={handleToggleTheme} />

      <main className="pt-28 pb-20 flex-grow max-w-6xl w-full mx-auto px-6">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept="image/*"
          onChange={handleFileChange}
        />

        {/* Creative Premium Hero Section */}
        <section className="text-center pt-8 pb-12 relative overflow-hidden animate-fade-in">
          {/* Decorative ambient background glow behind title */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-[80px] pointer-events-none z-[-1]"></div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 dark:bg-white/[0.02] border border-white/10 dark:border-white/5 shadow-inner mb-6 hover:border-purple-500/30 transition-colors duration-500">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              In-Browser Reverse Alpha Engine
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-none mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-200 dark:to-zinc-500">
              Cleanse Your
            </span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 font-extrabold drop-shadow-[0_2px_20px_rgba(168,85,247,0.15)]">
              Gemini Creations
            </span>
          </h1>

          <p className="max-w-xl mx-auto text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-semibold leading-relaxed mb-8">
            Instantly remove the visible sparkle watermark through algebraic pixel inversion. Zero compression, zero artifacts, processed 100% locally on your machine.
          </p>

          {/* Interactive Micro Dashboard / Feature Highlights */}
          <div className="flex flex-wrap items-center justify-center gap-4 max-w-xl mx-auto text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-2 bg-white/5 dark:bg-white/[0.01] border border-zinc-200 dark:border-zinc-800/80 px-4 py-2.5 rounded-2xl shadow-sm hover:border-purple-500/20 transition-all duration-300 group">
              <span className="material-symbols-outlined text-[17px] text-blue-500 group-hover:scale-110 transition-transform">verified_user</span>
              <span>Private Sandbox</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 dark:bg-white/[0.01] border border-zinc-200 dark:border-zinc-800/80 px-4 py-2.5 rounded-2xl shadow-sm hover:border-purple-500/20 transition-all duration-300 group">
              <span className="material-symbols-outlined text-[17px] text-indigo-500 group-hover:scale-110 transition-transform">bolt</span>
              <span>Instant Restoration</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 dark:bg-white/[0.01] border border-zinc-200 dark:border-zinc-800/80 px-4 py-2.5 rounded-2xl shadow-sm hover:border-purple-500/20 transition-all duration-300 group">
              <span className="material-symbols-outlined text-[17px] text-purple-500 group-hover:scale-110 transition-transform">high_quality</span>
              <span>100% Lossless</span>
            </div>
          </div>
        </section>

        {engineError && (
          <section className="mb-8">
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 flex items-start gap-3 shadow-lg max-w-2xl mx-auto">
              <span className="material-symbols-outlined text-xl shrink-0">error</span>
              <div className="text-xs font-semibold">
                <span className="font-extrabold uppercase">Initialization Failed:</span> Failed to load reference alpha maps. Make sure the background PNG assets exist in `/watermark/`.
              </div>
            </div>
          </section>
        )}

        {/* Workspace Block */}
        <section className="max-w-5xl w-full mx-auto relative z-10">
          <div className="upload-card">
            {files.length === 0 ? (
              /* Upload Area */
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`upload-area ${dragActive ? "drag-active" : ""}`}
              >
                <div className="flex flex-col items-center justify-center">
                  <div className="upload-icon-wrap">
                    <span className="material-symbols-outlined upload-icon">cloud_upload</span>
                  </div>
                  <p className="upload-title">
                    Click to upload or drag images
                  </p>
                  <p className="upload-hint">PNG, JPG, WebP · Multiple files supported</p>
                </div>
              </div>
            ) : (
              /* Workspace Split Layout */
              <div className="preview-layout text-left">
                {/* Left Column: Files list */}
                <div className="flex-1 space-y-6 min-w-0">
                  {files.map((fileRecord) => (
                    <div key={fileRecord.id} className="preview-card">

                      {/* Left Panel: Original Image */}
                      <div className="bg-white dark:bg-[#262930] rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                        <div className="bg-gray-50 dark:bg-gray-800/80 px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                          <h3 className="font-bold text-slate-700 dark:text-slate-200 text-xs">Original</h3>
                          <div className="text-[10px] font-mono text-slate-500">
                            {fileRecord.width > 0 && fileRecord.height > 0 ? `${fileRecord.width} × ${fileRecord.height} px` : "Dimensions pending..."}
                          </div>
                        </div>
                        <div className={`p-3 ${bgPattern} flex justify-center items-center h-64`}>
                          <img src={fileRecord.originalUrl} className="max-h-full object-contain rounded shadow-sm mx-auto" alt="Original" />
                        </div>
                      </div>

                      {/* Right Panel: Cleaned / Processing State */}
                      {fileRecord.status === "analyzing" && (
                        <div className="bg-white dark:bg-[#262930] rounded-xl shadow-md overflow-hidden border border-purple-500/30">
                          <div className="bg-purple-50 dark:bg-purple-900/20 px-3 py-2 border-b border-purple-500/20 font-bold text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1.5 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                            Processing...
                          </div>
                          <div className={`p-3 ${bgPattern} flex flex-col items-center justify-center h-64`}>
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 dark:border-purple-400 mb-3"></div>
                            <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">Removing watermark...</p>
                          </div>
                        </div>
                      )}

                      {fileRecord.status === "completed" && (
                        <div className="bg-white dark:bg-[#262930] rounded-xl shadow-md overflow-hidden border border-green-500/40 ring-2 ring-green-500/20">
                          <div className="bg-green-50 dark:bg-green-900/20 px-3 py-2 border-b border-green-500/30 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-green-600 dark:text-green-400">check_circle</span>
                            <span className="font-bold text-green-600 dark:text-green-400 text-xs">Cleaned</span>
                          </div>
                          <div className={`p-3 ${bgPattern} flex justify-center items-center h-64`}>
                            <img src={fileRecord.cleanedUrl} className="max-h-full object-contain rounded shadow-sm mx-auto" alt="Cleaned" />
                          </div>
                          <div className="p-3 border-t border-green-500/20 bg-green-50/5 dark:bg-green-950/5">
                            <button
                              onClick={() => downloadSingleFile(fileRecord)}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-all active:scale-95 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-sm">download</span> Download
                            </button>
                          </div>
                        </div>
                      )}

                      {fileRecord.status === "error" && (
                        <div className="bg-white dark:bg-[#262930] rounded-xl shadow-md overflow-hidden border border-red-500/30">
                          <div className="bg-red-50 dark:bg-red-900/20 px-3 py-2 border-b border-red-500/20 font-bold text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px]">error</span>
                            <span className="font-bold text-xs">Failed</span>
                          </div>
                          <div className={`p-3 ${bgPattern} flex flex-col items-center justify-center h-64`}>
                            <span className="material-symbols-outlined text-red-500 text-3xl mb-2">warning</span>
                            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold mb-3 max-w-[200px] text-center">{fileRecord.error}</p>
                            <button
                              onClick={() => handleRetry(fileRecord)}
                              className="px-4 py-2 border border-red-500/20 text-red-400 hover:text-white rounded-xl text-xs font-bold hover:bg-red-500/10 cursor-pointer transition-colors"
                            >
                              Retry
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  ))}
                </div>

                {/* Right Column: Actions Sidebar */}
                <div className="actions-sidebar">
                  <div className="actions-card text-center lg:text-left">
                    <h2 className="font-bold text-slate-900 dark:text-white mb-4 text-base">Actions</h2>

                    {/* Download single completed */}
                    {files.filter(f => f.status === "completed").length === 1 && (
                      <button
                        onClick={() => downloadSingleFile(files.find(f => f.status === "completed"))}
                        className="group w-full py-3.5 relative overflow-hidden rounded-xl font-bold mb-3 text-white shadow-lg shadow-purple-500/30 transition-all duration-300 cursor-pointer"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 opacity-100 group-hover:scale-110 transition-transform duration-500"></div>
                        <div className="relative flex items-center justify-center gap-2">
                          <span className="material-symbols-outlined text-sm">download</span> Download
                        </div>
                      </button>
                    )}

                    {/* Download all zip */}
                    {files.filter(f => f.status === "completed").length > 1 && (
                      <button
                        onClick={downloadAllZip}
                        className="group w-full py-3.5 relative overflow-hidden rounded-xl font-bold mb-3 text-white shadow-lg shadow-green-500/30 transition-all duration-300 cursor-pointer"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 opacity-100 group-hover:scale-110 transition-transform duration-500"></div>
                        <div className="relative flex items-center justify-center gap-2">
                          <span className="material-symbols-outlined text-sm">archive</span> Download All ZIP
                        </div>
                      </button>
                    )}

                    {/* Add More */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-3.5 mb-3 bg-white/5 dark:bg-white/[0.02] border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">add</span> Add More
                    </button>

                    {/* Process Another / Reset */}
                    <button
                      onClick={handleReset}
                      className="w-full py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-slate-600 dark:text-slate-300 hover:border-purple-500 hover:text-purple-500 rounded-xl font-bold transition-all duration-300 cursor-pointer"
                    >
                      Process Another
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>



        {/* Informational Section */}
        <section className="mt-20 border-t border-zinc-200 dark:border-white/5 pt-16 animate-fade-in">
          
          {/* Core Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {/* 100% Lossless */}
            <div className="premium-card rounded-2xl p-6 border border-white/5 hover:border-purple-500/30 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-purple-400">high_quality</span>
              </div>
              <h3 className="text-zinc-900 dark:text-white font-extrabold text-sm mb-2">100% Lossless</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold leading-relaxed">
                The quality stays 100% perfect. No compression, no artifacts. It restores the original pixels mathematically.
              </p>
            </div>

            {/* Privacy First */}
            <div className="premium-card rounded-2xl p-6 border border-white/5 hover:border-blue-500/30 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-blue-400">lock</span>
              </div>
              <h3 className="text-zinc-900 dark:text-white font-extrabold text-sm mb-2">Privacy First</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold leading-relaxed">
                It works 100% inside your browser (Client-Side). Your photos are never uploaded to any server.
              </p>
            </div>

            {/* Open Source */}
            <div className="premium-card rounded-2xl p-6 border border-white/5 hover:border-green-500/30 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-green-400">code</span>
              </div>
              <h3 className="text-zinc-900 dark:text-white font-extrabold text-sm mb-2">Open Source</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold leading-relaxed">
                Completely free and open source. Developers can inspect the code on <a href="https://github.com" target="_blank" rel="noreferrer" className="text-purple-500 hover:underline">GitHub</a>.
              </p>
            </div>
          </div>

          {/* Quick Note & Important Rule Split Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* A Quick Note */}
            <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 flex flex-col justify-center">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="material-symbols-outlined text-zinc-500 dark:text-zinc-400">info</span>
                <h3 className="font-extrabold text-zinc-900 dark:text-white text-sm">A Quick Note</h3>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold leading-relaxed">
                This tool removes only the visible logo for aesthetic purposes (like presentations or mockups). It does not remove the invisible "SynthID" watermark that Google embeds for safety.
              </p>
            </div>

            {/* One Important Rule */}
            <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="material-symbols-outlined text-amber-500">warning</span>
                <h3 className="font-extrabold text-zinc-900 dark:text-white text-sm">One Important Rule</h3>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold leading-relaxed mb-4">
                For the math to work, you must use the actual downloaded image file.
              </p>
              <div className="space-y-2 text-[10px] font-bold text-zinc-600 dark:text-zinc-400">
                <div className="flex items-center gap-2 bg-red-500/5 dark:bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/10 text-red-600 dark:text-red-400">
                  <span className="font-extrabold text-sm leading-none">×</span>
                  <span>Don't right-click "Save As"</span>
                </div>
                <div className="flex items-center gap-2 bg-red-500/5 dark:bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/10 text-red-600 dark:text-red-400">
                  <span className="font-extrabold text-sm leading-none">×</span>
                  <span>Don't use screenshots</span>
                </div>
                <div className="flex items-center gap-2 bg-green-500/5 dark:bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/10 text-green-600 dark:text-green-400">
                  <span className="font-extrabold text-sm leading-none">✓</span>
                  <span>Use the Download button in Gemini</span>
                </div>
              </div>
            </div>
          </div>

        </section>

      </main>

      <Footer theme={theme} />
    </div>
  );
}
