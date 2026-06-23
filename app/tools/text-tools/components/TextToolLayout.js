"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";

export default function TextToolLayout({
  title,
  description,
  inputValue = "",
  onInputChange,
  inputPlaceholder = "Type or paste your text here...",
  outputValue = "",
  outputPlaceholder = "Output will appear here...",
  readOnlyOutput = true,
  onOutputChange = null,
  sidebarControls = null,
  actionButtons = null,
  onCopy = null,
  onClear = null,
  onDownload = null,
  downloadFileName = "output.txt",
  onReset = null,
  showOutput = true,
  children = null
}) {
  const [theme, setTheme] = useState("dark");
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);

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

  // Standard Clear Handler
  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      if (onInputChange) onInputChange("");
      if (onOutputChange) onOutputChange("");
    }
  };

  // Standard Copy Handler
  const handleCopy = () => {
    if (onCopy) {
      onCopy();
    } else if (outputValue) {
      navigator.clipboard.writeText(outputValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Standard Download Handler
  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else if (outputValue) {
      const blob = new Blob([outputValue], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Stats
  const charCount = inputValue.length;
  const wordCount = inputValue.trim() === "" ? 0 : inputValue.trim().split(/\s+/).length;
  const lineCount = inputValue === "" ? 0 : inputValue.split("\n").length;

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
            <Link href="/tools/text-tools" className="hover:text-purple-500 transition-colors text-zinc-500 dark:text-zinc-400">Text Tools</Link>
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

        {/* Workspace Layout */}
        <section className="max-w-5xl w-full mx-auto relative z-10 animate-fade-in">
          <div className="upload-card p-6">
            <div className="preview-layout text-left items-stretch gap-6">
              
              {/* Main Text Area Panel */}
              <div className="flex-grow flex flex-col gap-6 min-w-0">
                {children ? (
                  /* Custom Children override (e.g. for Markdown editor) */
                  children
                ) : (
                  /* Standard Split Input/Output Panel */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                    
                    {/* Input Panel */}
                    <div className="flex flex-col bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden h-[420px]">
                      <div className="bg-gray-50 dark:bg-zinc-800/80 px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center select-none">
                        <h3 className="font-extrabold text-zinc-700 dark:text-zinc-300 text-xs">Input Text</h3>
                        <button
                          onClick={handleClear}
                          disabled={!inputValue}
                          className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-450 hover:text-red-500 disabled:opacity-40 transition-colors flex items-center gap-0.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[12px]">delete</span>
                          Clear
                        </button>
                      </div>
                      <textarea
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => onInputChange(e.target.value)}
                        placeholder={inputPlaceholder}
                        className="w-full flex-grow p-4 bg-transparent text-zinc-800 dark:text-zinc-200 text-xs font-semibold placeholder-zinc-400 focus:outline-none resize-none leading-relaxed"
                      />
                      <div className="bg-gray-50 dark:bg-zinc-800/30 border-t border-zinc-200 dark:border-zinc-800 px-4 py-2 flex justify-between items-center select-none text-[9px] font-bold text-zinc-450 uppercase tracking-widest">
                        <span>Lines: {lineCount}</span>
                        <span>Words: {wordCount}</span>
                        <span>Chars: {charCount}</span>
                      </div>
                    </div>

                    {/* Output Panel */}
                    {showOutput && (
                      <div className="flex flex-col bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden h-[420px]">
                        <div className="bg-gray-50 dark:bg-zinc-800/80 px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center select-none">
                          <h3 className="font-extrabold text-zinc-700 dark:text-zinc-300 text-xs">Output Result</h3>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={handleCopy}
                              disabled={!outputValue}
                              className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-450 hover:text-purple-500 disabled:opacity-40 transition-colors flex items-center gap-0.5 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[12px]">{copied ? "check" : "content_copy"}</span>
                              {copied ? "Copied" : "Copy"}
                            </button>
                            {onDownload && (
                              <button
                                onClick={handleDownload}
                                disabled={!outputValue}
                                className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-450 hover:text-purple-500 disabled:opacity-40 transition-colors flex items-center gap-0.5 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[12px]">download</span>
                                Download
                              </button>
                            )}
                          </div>
                        </div>
                        <textarea
                          readOnly={readOnlyOutput}
                          value={outputValue}
                          onChange={(e) => onOutputChange && onOutputChange(e.target.value)}
                          placeholder={outputPlaceholder}
                          className="w-full flex-grow p-4 bg-transparent text-zinc-800 dark:text-zinc-200 text-xs font-mono placeholder-zinc-450 focus:outline-none resize-none leading-relaxed"
                        />
                        <div className="bg-gray-50 dark:bg-zinc-800/30 border-t border-zinc-200 dark:border-zinc-800 px-4 py-2 flex justify-between items-center select-none text-[9px] font-bold text-zinc-450 uppercase tracking-widest">
                          <span>Result Length: {outputValue.length} chars</span>
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>

              {/* Sidebar Settings Panel */}
              <div className="actions-sidebar">
                <div className="actions-card text-center lg:text-left flex flex-col h-full justify-between">
                  <div>
                    <h2 className="font-extrabold text-zinc-900 dark:text-white mb-4 text-xs uppercase tracking-wider select-none border-b border-border-subtle pb-2">
                      Configuration
                    </h2>

                    <div className="space-y-4">
                      {sidebarControls}
                    </div>

                    {actionButtons && (
                      <div className="mt-4 pt-4 border-t border-border-subtle space-y-2">
                        {actionButtons}
                      </div>
                    )}
                  </div>

                  <div className="mt-8 pt-4 border-t border-border-subtle">
                    {onReset && (
                      <button
                        onClick={onReset}
                        className="w-full py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-purple-500/40 hover:text-purple-500 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">refresh</span>
                        Reset
                      </button>
                    )}
                  </div>
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
