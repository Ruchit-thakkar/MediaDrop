"use client";

import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function PrivacyPolicy() {
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

  const handleToggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark");
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col relative overflow-x-hidden selection:bg-purple-500/30">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full ambient-glow-1 blur-[130px] pointer-events-none z-[-1]"></div>
      <div className="absolute top-[40%] right-[-10%] w-[45vw] h-[45vw] rounded-full ambient-glow-2 blur-[130px] pointer-events-none z-[-1]"></div>

      {/* Navigation Bar */}
      <Navbar theme={theme} onToggleTheme={handleToggleTheme} />

      {/* Main Content */}
      <main className="pt-28 pb-20 flex-grow max-w-3xl mx-auto px-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-3">
          Privacy Policy
        </h1>
        <p className="text-zinc-500 text-xs font-mono mb-8 uppercase tracking-widest">
          Last updated: June 19, 2026
        </p>

        <div className="space-y-8 text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed font-medium">
          <section className="premium-card p-6 rounded-2xl border border-white/5 bg-white/[0.01]">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-400 text-base">verified_user</span>
              1. Zero Logging Policy
            </h2>
            <p>
              MediaDrop is designed to operate as a completely private, self-cleaning system. We do not maintain user databases, store your IP address, or log any search queries and media URLs submitted to our service.
            </p>
          </section>

          <section className="premium-card p-6 rounded-2xl border border-white/5 bg-white/[0.01]">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-400 text-base">auto_delete</span>
              2. Temporary Caching
            </h2>
            <p>
              To process media streams (e.g. stitching high-quality video with high-bitrate audio), our servers use temporary directories. These cached source segments are immediately and permanently erased from our disk storage immediately after your browser download starts. No media traces remain.
            </p>
          </section>

          <section className="premium-card p-6 rounded-2xl border border-white/5 bg-white/[0.01]">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-400 text-base">cookie</span>
              3. No Cookies or Trackers
            </h2>
            <p>
              We do not store cookies, tracking pixels, or use third-party analytics scripts that profile your activity. Your sessions are fully anonymous, secure, and private.
            </p>
          </section>

          <section className="premium-card p-6 rounded-2xl border border-white/5 bg-white/[0.01]">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-400 text-base">gavel</span>
              4. External Content
            </h2>
            <p>
              All downloaded streams originate from external platforms (YouTube, Instagram, TikTok, etc.). MediaDrop is an independent utility and is not affiliated with, nor does it control, the privacy policies of the host platforms.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <Footer theme={theme} />
    </div>
  );
}
