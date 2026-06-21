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

  const handleFiles = async (incomingFiles) => {
    const validFiles = Array.from(incomingFiles).filter(f => f.type.startsWith("image/"));
    if (validFiles.length === 0) return;

    // Create file records
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
        status: "loading",
        error: null
      };
    });

    setFiles(prev => [...prev, ...newFileRecords]);

    // Process each file sequentially
    for (const record of newFileRecords) {
      if (!engine) {
        // Wait briefly for engine if it's still loading
        let currentEngine = engine;
        if (!currentEngine) {
          try {
            currentEngine = await WatermarkEngine.create();
            setEngine(currentEngine);
          } catch (err) {
            setFiles(prev => prev.map(f => f.id === record.id ? { ...f, status: "error", error: "Engine failed to initialize." } : f));
            continue;
          }
        }
      }

      try {
        const result = await engine.process(record.file);
        const cleanedUrl = URL.createObjectURL(result.blob);
        setFiles(prev => prev.map(f => f.id === record.id ? {
          ...f,
          cleanedUrl,
          blob: result.blob,
          width: result.width,
          height: result.height,
          status: "completed"
        } : f));
      } catch (err) {
        console.error("Error processing file", record.name, err);
        setFiles(prev => prev.map(f => f.id === record.id ? {
          ...f,
          status: "error",
          error: "Failed to remove watermark. Ensure this is a standard Gemini image."
        } : f));
      }
    }
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
    }
  };

  const handleReset = () => {
    cleanupUrls(files);
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const downloadSingleFile = (fileRecord) => {
    if (fileRecord.status !== "completed") return;
    const a = document.createElement("a");
    a.href = fileRecord.cleanedUrl;
    const extension = fileRecord.name.split(".").pop();
    const baseName = fileRecord.name.substring(0, fileRecord.name.lastIndexOf("."));
    a.download = `clean_${baseName}.png`; // Processed files are returned as PNG blobs
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadAllZip = async () => {
    const completed = files.filter(f => f.status === "completed");
    if (completed.length === 0) return;

    const zip = new JSZip();
    completed.forEach(item => {
      const baseName = item.name.substring(0, item.name.lastIndexOf("."));
      zip.file(`clean_${baseName}.png`, item.blob);
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

  const bgPattern = "bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2Y5ZmRmZCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjJmMmYyIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmMmYyZjIiLz48L3N2Zz4=')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMjYyOTMwIi8+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMWQxZjI0Ii8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMxZDFmMjQiLz48L3N2Zz4=')]";

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col relative overflow-x-hidden selection:bg-purple-500/30">
      {/* Background glow graphics */}
      <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full ambient-glow-1 blur-[130px] pointer-events-none z-[-1]"></div>
      <div className="absolute top-[40%] right-[-10%] w-[45vw] h-[45vw] rounded-full ambient-glow-2 blur-[130px] pointer-events-none z-[-1]"></div>

      <Navbar theme={theme} onToggleTheme={handleToggleTheme} />

      <main className="pt-28 pb-20 flex-grow max-w-6xl w-full mx-auto px-6">
        
        {/* Header Section */}
        <section className="text-center mb-12 animate-fade-in">
          <div className="mb-4 inline-flex items-center">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-3.5 py-1.5 rounded-full border border-purple-500/20 shadow-inner">
              ✨ 100% Client-Side Engine
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4 text-zinc-900 dark:text-white">
            Gemini <span className="text-gradient">Watermark Remover</span>
          </h1>
          <p className="max-w-2xl mx-auto text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
            Mathematically precise Reverse Alpha Blending restores original pixel coordinates from Google Gemini generated images with zero quality loss. Entirely processed locally in your browser.
          </p>
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

        {/* Upload Zone */}
        {files.length === 0 ? (
          <section className="max-w-2xl mx-auto animate-fade-in">
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`premium-card rounded-3xl p-12 text-center border border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
                dragActive
                  ? "border-purple-500 bg-purple-500/10 scale-[1.01] shadow-2xl"
                  : "border-white/10 hover:border-purple-500/40 hover:bg-white/[0.02]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                accept="image/*"
                onChange={handleFileChange}
              />
              
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-6 shadow-inner">
                <span className="material-symbols-outlined text-3xl text-purple-400">
                  cloud_upload
                </span>
              </div>
              
              <h3 className="text-zinc-900 dark:text-white font-extrabold text-sm sm:text-base mb-2">
                Drag & Drop your Gemini Images
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium max-w-sm mb-6">
                Or click here to browse files. Supports high resolution PNG, JPEG, and WebP images.
              </p>

              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 bg-white/5 dark:bg-white/[0.02] px-4 py-2 rounded-full border border-white/5">
                Automatically detects watermark size (48px / 96px)
              </span>
            </div>
          </section>
        ) : (
          /* Processed List Section */
          <section className="space-y-6 animate-fade-in">
            
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/5 dark:bg-white/[0.02] premium-card rounded-2xl p-4 border border-white/5">
              <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse"></span>
                Uploaded Files: <span className="text-zinc-900 dark:text-white">{files.length}</span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-extrabold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border border-white/10 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">add</span> Add More
                </button>

                <button
                  onClick={handleReset}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-extrabold text-red-500 hover:text-red-600 border border-red-500/10 rounded-xl hover:bg-red-500/5 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">delete</span> Clear All
                </button>

                {files.filter(f => f.status === "completed").length > 1 && (
                  <button
                    onClick={downloadAllZip}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-extrabold text-white primary-gradient rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-md cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">archive</span> Download ZIP
                  </button>
                )}
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              accept="image/*"
              onChange={handleFileChange}
            />

            {/* Cards Grid */}
            <div className="grid grid-cols-1 gap-6">
              {files.map((fileRecord) => (
                <div
                  key={fileRecord.id}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-5 bg-white dark:bg-card-bg rounded-3xl border border-white/5 shadow-xl transition-all"
                >
                  
                  {/* Left Side: Original Preview */}
                  <div className="premium-card rounded-2xl overflow-hidden border border-white/5 flex flex-col justify-between">
                    <div className="bg-white/5 dark:bg-white/[0.01] px-4 py-3 border-b border-white/5 flex justify-between items-center select-none">
                      <span className="font-extrabold text-zinc-900 dark:text-zinc-200 text-xs flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span> Original
                      </span>
                      <span className="font-mono text-[10px] text-zinc-500 truncate max-w-[200px]" title={fileRecord.name}>
                        {fileRecord.name}
                      </span>
                    </div>

                    <div className={`p-4 ${bgPattern} flex items-center justify-center h-72 relative`}>
                      <img
                        src={fileRecord.originalUrl}
                        alt="Original watermarked image"
                        className="max-h-full max-w-full object-contain rounded shadow-lg"
                      />
                    </div>
                  </div>

                  {/* Right Side: Processed Output */}
                  <div className="premium-card rounded-2xl overflow-hidden border border-white/5 flex flex-col justify-between">
                    
                    <div className="bg-white/5 dark:bg-white/[0.01] px-4 py-3 border-b border-white/5 flex justify-between items-center select-none">
                      <span className="font-extrabold text-zinc-900 dark:text-zinc-200 text-xs flex items-center gap-1.5">
                        {fileRecord.status === "completed" && (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-green-500">Restored</span>
                          </>
                        )}
                        {fileRecord.status === "loading" && (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                            <span className="text-purple-500">Processing</span>
                          </>
                        )}
                        {fileRecord.status === "error" && (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            <span className="text-red-500">Failed</span>
                          </>
                        )}
                      </span>

                      {fileRecord.status === "completed" && (
                        <span className="font-mono text-[10px] text-zinc-500">
                          {fileRecord.width} × {fileRecord.height} px
                        </span>
                      )}
                    </div>

                    <div className={`p-4 ${bgPattern} flex items-center justify-center h-72 relative`}>
                      {fileRecord.status === "loading" && (
                        <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3">
                          <div className="w-10 h-10 rounded-full border-2 border-purple-500/20 border-t-purple-500 animate-spin"></div>
                          <p className="text-xs font-bold text-purple-400">Removing watermark logo...</p>
                        </div>
                      )}

                      {fileRecord.status === "error" && (
                        <div className="p-6 text-center max-w-sm">
                          <span className="material-symbols-outlined text-red-500 text-3xl mb-2">warning</span>
                          <p className="text-xs font-semibold text-red-500">{fileRecord.error}</p>
                        </div>
                      )}

                      {fileRecord.status === "completed" && (
                        <img
                          src={fileRecord.cleanedUrl}
                          alt="Cleaned watermark free image"
                          className="max-h-full max-w-full object-contain rounded shadow-lg animate-fade-in"
                        />
                      )}
                    </div>

                    {fileRecord.status === "completed" && (
                      <div className="p-4 border-t border-white/5 bg-white/5 dark:bg-white/[0.01]">
                        <button
                          onClick={() => downloadSingleFile(fileRecord)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-extrabold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">download</span> Download Image
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>

          </section>
        )}

        {/* Informational Algorithm Section */}
        <section className="mt-20 border-t border-white/5 pt-16">
          <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white mb-8 text-center sm:text-left">
            How The Mathematical Restoration Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Blending Card */}
            <div className="premium-card rounded-2xl p-6 border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-purple-400">layers</span>
              </div>
              <h3 className="text-zinc-900 dark:text-white font-extrabold text-sm mb-2">1. The Blending Equation</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium leading-relaxed mb-4">
                Gemini overlays its watermark by blending a semi-transparent white logo onto the original pixels.
              </p>
              <div className="bg-white/5 dark:bg-white/[0.02] p-3 rounded-xl border border-white/5 text-center font-mono text-[10px] text-zinc-900 dark:text-zinc-300">
                Pixel_final = (α × 255) + (1 - α) × Pixel_original
              </div>
            </div>

            {/* Inversion Card */}
            <div className="premium-card rounded-2xl p-6 border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-blue-400">calculate</span>
              </div>
              <h3 className="text-zinc-900 dark:text-white font-extrabold text-sm mb-2">2. Algebraic Inversion</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium leading-relaxed mb-4">
                By rearranging the blending formula, the algorithm subtracts the exact white values.
              </p>
              <div className="bg-white/5 dark:bg-white/[0.02] p-3 rounded-xl border border-white/5 text-center font-mono text-[10px] text-zinc-900 dark:text-zinc-300">
                Pixel_original = (Pixel_final - α × 255) / (1 - α)
              </div>
            </div>

            {/* Privacy Card */}
            <div className="premium-card rounded-2xl p-6 border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-green-400">security</span>
              </div>
              <h3 className="text-zinc-900 dark:text-white font-extrabold text-sm mb-2">3. Zero Data Leakage</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium leading-relaxed mb-4">
                All image array calculations are processed using Float32 buffers inside your browser. No files are uploaded to any external server.
              </p>
              <div className="bg-white/5 dark:bg-white/[0.02] p-3 rounded-xl border border-white/5 text-center font-mono text-[10px] text-green-600 dark:text-green-400 uppercase font-extrabold">
                🔒 100% Browser Local
              </div>
            </div>

          </div>

          {/* Legal / Note Disclaimer */}
          <div className="mt-8 p-4 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 text-zinc-500 dark:text-zinc-400 flex items-start gap-3 max-w-4xl mx-auto">
            <span className="material-symbols-outlined text-xl shrink-0 text-zinc-400">info</span>
            <div className="text-[11px] font-medium leading-normal">
              <span className="font-extrabold text-zinc-900 dark:text-white">Note: </span>
              This tool only removes visible logo watermarks added via standard blending. It does not remove invisible, steganographic SynthID watermarks embedded in the high-frequency components of the image data. Please use this tool in compliance with licensing terms and respect original creators.
            </div>
          </div>

        </section>

      </main>

      <Footer theme={theme} />
    </div>
  );
}
