"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";

export default function DevToolLayout({
  title,
  description,
  sidebarControls = null,
  onReset = null,
  children
}) {
  const [theme, setTheme] = useState("dark");

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
            <Link href="/tools/developer-tools" className="hover:text-purple-500 transition-colors text-zinc-500 dark:text-zinc-400">Developer Tools</Link>
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
              
              {/* Main Content Area */}
              <div className="flex-grow flex flex-col gap-6 min-w-0">
                {children}
              </div>

              {/* Sidebar Configuration Area (only rendered if sidebarControls is provided) */}
              {sidebarControls && (
                <div className="actions-sidebar">
                  <div className="actions-card text-center lg:text-left flex flex-col h-full justify-between">
                    <div>
                      <h2 className="font-extrabold text-zinc-900 dark:text-white mb-4 text-xs uppercase tracking-wider select-none border-b border-border-subtle pb-2">
                        Settings
                      </h2>
                      <div className="space-y-4">
                        {sidebarControls}
                      </div>
                    </div>

                    {onReset && (
                      <div className="mt-8 pt-4 border-t border-border-subtle">
                        <button
                          onClick={onReset}
                          className="w-full py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-purple-500/40 hover:text-purple-500 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">refresh</span>
                          Reset
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </section>
      </main>

      <Footer theme={theme} />
    </div>
  );
}
