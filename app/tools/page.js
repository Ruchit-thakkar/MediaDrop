"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const categories = [
  {
    name: "Image Tools",
    path: "image-tools",
    icon: "image",
    count: 15,
    description: "Compress, resize, crop, rotate, flip, and convert images instantly in your browser."
  },
  {
    name: "Video Tools",
    path: "video-tools",
    icon: "movie",
    count: 12,
    description: "Cut, trim, merge, compress, and convert videos entirely on your local machine."
  },
  {
    name: "Audio Tools",
    path: "audio-tools",
    icon: "audiotrack",
    count: 7,
    description: "Compress, trim, merge, and boost volume of audio files locally."
  },
  {
    name: "File Tools",
    path: "file-tools",
    icon: "folder_open",
    count: 8,
    description: "Extract archives, check file sizes, and detect duplicate files securely."
  },
  {
    name: "Text Tools",
    path: "text-tools",
    icon: "description",
    count: 15,
    description: "Format, sort, generate, and convert text elements inside your browser."
  },
  {
    name: "Developer Tools",
    path: "developer-tools",
    icon: "terminal",
    count: 13,
    description: "Generate UUIDs, QR codes, passwords, cron expressions, and decode JWTs."
  },
  {
    name: "Utility Tools",
    path: "utility-tools",
    icon: "construction",
    count: 10,
    description: "Quick calculators, converters, time zone tools, and stopwatches."
  }
];

export default function ToolsIndexPage() {
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
      {/* Background radial glow graphics */}
      <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full ambient-glow-1 blur-[130px] pointer-events-none z-[-1]"></div>
      <div className="absolute top-[40%] right-[-10%] w-[45vw] h-[45vw] rounded-full ambient-glow-2 blur-[130px] pointer-events-none z-[-1]"></div>

      <Navbar theme={theme} onToggleTheme={handleToggleTheme} />

      <main className="pt-28 pb-20 flex-grow max-w-6xl w-full mx-auto px-6">
        
        {/* Creative Premium Hero Section */}
        <section className="text-center pt-8 pb-12 relative overflow-hidden animate-fade-in">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-[80px] pointer-events-none z-[-1]"></div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 dark:bg-white/[0.02] border border-white/10 dark:border-white/5 shadow-inner mb-6 hover:border-purple-500/30 transition-colors duration-500">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              Web Sandbox Toolkit
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-none mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-200 dark:to-zinc-500">
              Browser-Based
            </span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 font-extrabold drop-shadow-[0_2px_20px_rgba(168,85,247,0.15)]">
              Developer & Utility Tools
            </span>
          </h1>

          <p className="max-w-xl mx-auto text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-semibold leading-relaxed mb-8">
            A comprehensive suite of client-side tools that run entirely inside your browser. No files are uploaded to any server, ensuring 100% privacy and security.
          </p>
        </section>

        {/* Responsive Grid for Categories */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {categories.map((cat) => (
            <Link
              key={cat.path}
              href={`/tools/${cat.path}`}
              className="premium-card premium-glow-hover rounded-3xl p-6 border border-white/5 flex flex-col gap-4 select-none cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 dark:bg-purple-500/5 flex items-center justify-center border border-purple-500/20">
                  <span className="material-symbols-outlined text-[24px] text-purple-500 select-none">{cat.icon}</span>
                </div>
                <div>
                  <h3 className="text-zinc-900 dark:text-white font-extrabold text-sm tracking-tight">{cat.name}</h3>
                  <span className="text-[9px] font-extrabold text-purple-500 uppercase tracking-widest bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/10">
                    {cat.count} Tools
                  </span>
                </div>
              </div>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold leading-relaxed">
                {cat.description}
              </p>
              <div className="mt-auto pt-4 border-t border-border-subtle flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors">
                Explore Category
                <span className="material-symbols-outlined text-[13px] ml-0.5">arrow_forward</span>
              </div>
            </Link>
          ))}
        </section>

      </main>

      <Footer theme={theme} />
    </div>
  );
}
