"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";

// Helper to format bytes to human-readable string
export function formatBytes(bytes, decimals = 2) {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export default function AudioToolLayout({
  title,
  description,
  sidebarControls,
  onFileUploaded,
  onReset,
  onDownload,
  downloadDisabled = true,
  originalFile = null,
  processedUrl = null,
  processedSize = null,
  processing = false,
  allowMultiple = false,
  uploadedFiles = [],
  onFilesUploaded = null,
  accept = "audio/*",
  children
}) {
  const [theme, setTheme] = useState("dark");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

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
      if (allowMultiple) {
        if (onFilesUploaded) onFilesUploaded(e.dataTransfer.files);
      } else {
        const file = e.dataTransfer.files[0];
        if (onFileUploaded && file.type.startsWith("audio/")) {
          onFileUploaded(file);
        }
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      if (allowMultiple) {
        if (onFilesUploaded) onFilesUploaded(e.target.files);
      } else {
        const file = e.target.files[0];
        if (onFileUploaded && file.type.startsWith("audio/")) {
          onFileUploaded(file);
        }
      }
      e.target.value = "";
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const hasFiles = allowMultiple ? uploadedFiles.length > 0 : !!originalFile;

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col relative overflow-x-hidden selection:bg-purple-500/30">
      {/* Background ambient glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full ambient-glow-1 blur-[130px] pointer-events-none z-[-1]"></div>
      <div className="absolute top-[40%] right-[-10%] w-[45vw] h-[45vw] rounded-full ambient-glow-2 blur-[130px] pointer-events-none z-[-1]"></div>

      <Navbar theme={theme} onToggleTheme={handleToggleTheme} />

      <main className="pt-28 pb-20 flex-grow max-w-6xl w-full mx-auto px-6">
        {/* Breadcrumb Navigation */}
        <div className="mb-6 animate-fade-in">
          <nav className="flex flex-wrap items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            <Link href="/" className="hover:text-purple-500 transition-colors">Home</Link>
            <span className="material-symbols-outlined text-[12px] select-none">chevron_right</span>
            <Link href="/tools" className="hover:text-purple-500 transition-colors">Tools</Link>
            <span className="material-symbols-outlined text-[12px] select-none">chevron_right</span>
            <Link href="/tools/audio-tools" className="hover:text-purple-500 transition-colors text-zinc-500 dark:text-zinc-400">Audio Tools</Link>
            <span className="material-symbols-outlined text-[12px] select-none">chevron_right</span>
            <span className="text-zinc-800 dark:text-white select-none">{title}</span>
          </nav>
        </div>

        {/* Title Section */}
        <section className="text-center pt-2 pb-8 relative overflow-hidden animate-fade-in">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-[80px] pointer-events-none z-[-1]"></div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3 bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-200 dark:to-zinc-500">
            {title}
          </h1>
          <p className="max-w-xl mx-auto text-xs text-zinc-500 dark:text-zinc-400 font-semibold leading-relaxed">
            {description}
          </p>
        </section>

        {/* Workspace Block */}
        <section className="max-w-5xl w-full mx-auto relative z-10 animate-fade-in">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple={allowMultiple}
            accept={accept}
            onChange={handleFileChange}
          />

          <div className="upload-card">
            {!hasFiles ? (
              /* Dropzone Upload Area */
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerUpload}
                className={`upload-area ${dragActive ? "drag-active" : ""}`}
              >
                <div className="flex flex-col items-center justify-center">
                  <div className="upload-icon-wrap">
                    <span className="material-symbols-outlined upload-icon">audiotrack</span>
                  </div>
                  <p className="upload-title">
                    Click to upload or drag audio files
                  </p>
                  <p className="upload-hint">
                    MP3, WAV, M4A, OGG · processed 100% locally
                  </p>
                </div>
              </div>
            ) : (
              /* Interactive Workspace Panel */
              <div className="preview-layout text-left items-stretch">
                {/* Main Workspace (Preview Area) */}
                <div className="flex-grow flex flex-col gap-6 min-w-0">
                  {children}
                </div>

                {/* Sidebar Controls Area */}
                <div className="actions-sidebar">
                  <div className="actions-card text-center lg:text-left flex flex-col h-full justify-between">
                    <div>
                      <h2 className="font-extrabold text-zinc-900 dark:text-white mb-4 text-xs uppercase tracking-wider select-none border-b border-border-subtle pb-2">
                        Settings
                      </h2>
                      
                      {/* Sidebar specific widgets passed from page */}
                      <div className="space-y-4">
                        {sidebarControls}
                      </div>

                      {/* Display File Size Statistics automatically if available */}
                      {originalFile && (
                        <div className="mt-6 pt-4 border-t border-border-subtle text-[11px] font-bold text-zinc-500 dark:text-zinc-400 space-y-2 select-none">
                          <div className="flex justify-between">
                            <span>Original Size:</span>
                            <span className="font-mono text-zinc-800 dark:text-zinc-200">{formatBytes(originalFile.size)}</span>
                          </div>
                          {processedSize && (
                            <div className="flex justify-between">
                              <span>Output Size:</span>
                              <span className="font-mono text-zinc-800 dark:text-zinc-200">{formatBytes(processedSize)}</span>
                            </div>
                          )}
                          {originalFile.size && processedSize && (
                            <div className="flex justify-between text-purple-500">
                              <span>Savings:</span>
                              <span>
                                {Math.max(0, Math.round(((originalFile.size - processedSize) / originalFile.size) * 100))}%
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions Panel */}
                    <div className="mt-8 pt-4 border-t border-border-subtle space-y-3">
                      {/* Download Button */}
                      <button
                        onClick={onDownload}
                        disabled={downloadDisabled || processing}
                        className={`group w-full py-2.5 relative overflow-hidden rounded-xl font-bold text-white shadow-lg transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                          downloadDisabled || processing
                            ? "bg-zinc-300 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 shadow-none cursor-not-allowed opacity-50"
                            : "shadow-purple-500/20 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 hover:scale-[1.01]"
                        }`}
                      >
                        {processing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-sm">download</span>
                            Download Audio
                          </>
                        )}
                      </button>

                      {/* Reset Button */}
                      <button
                        onClick={onReset}
                        className="w-full py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-purple-500/40 hover:text-purple-500 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">refresh</span>
                        Reset File
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer theme={theme} />
    </div>
  );
}
