"use client";

import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function TermsOfService() {
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
          Terms of Service
        </h1>
        <p className="text-zinc-500 text-xs font-mono mb-8 uppercase tracking-widest">
          Last updated: June 19, 2026
        </p>

        <div className="space-y-8 text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed font-medium">
          <section className="premium-card p-6 rounded-2xl border border-white/5 bg-white/[0.01]">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-400 text-base">gavel</span>
              1. Agreement to Terms
            </h2>
            <p>
              By accessing and using MediaDrop, you agree to comply with and be bound by these Terms of Service. If you do not agree with any part of these terms, you are prohibited from using this website.
            </p>
          </section>

          <section className="premium-card p-6 rounded-2xl border border-white/5 bg-white/[0.01]">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-400 text-base">copyright</span>
              2. Intellectual Property Rights
            </h2>
            <p>
              MediaDrop is a tool created for personal, educational, and backup extraction purposes only. Users must own or have explicit legal permissions from the rights holders before extracting copyrighted materials. We do not store or host any files.
            </p>
          </section>

          <section className="premium-card p-6 rounded-2xl border border-white/5 bg-white/[0.01]">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-400 text-base">block</span>
              3. Prohibited Activities
            </h2>
            <p>
              You agree not to bypass any security protections of the service, scrape site contents automatedly, overload the API servers, or utilize our extraction pipeline to download illegal or harmful media types.
            </p>
          </section>

          <section className="premium-card p-6 rounded-2xl border border-white/5 bg-white/[0.01]">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-400 text-base">warning</span>
              4. Disclaimer of Warranties
            </h2>
            <p>
              MediaDrop is provided &ldquo;as is&rdquo; without any warranty of any kind, express or implied. We do not guarantee uninterrupted operations, continuous availability, or that all formats will extract on all URL matches.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <Footer theme={theme} />
    </div>
  );
}
