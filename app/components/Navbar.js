"use client";

import { useState, useEffect } from "react";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#09090B]/80 backdrop-blur-md border-b border-white/5 py-3 h-14"
          : "bg-transparent py-5 h-20"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
        {/* Left: Brand logo */}
        <div className="flex items-center gap-2.5 cursor-pointer group select-none">
          <div className="w-8 h-8 rounded-lg primary-gradient flex items-center justify-center shadow-lg shadow-purple-900/30 group-hover:scale-105 transition-transform duration-300">
            <span className="material-symbols-outlined text-white text-lg font-bold">
              download
            </span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white group-hover:opacity-90 transition-opacity">
            MediaDrop
          </span>
        </div>

        {/* Center: Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          <a
            href="#"
            className="text-xs font-semibold text-white/90 hover:text-white transition-colors"
          >
            Home
          </a>
          <a
            href="#features"
            className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            Features
          </a>
          <a
            href="#platforms"
            className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            Supported Platforms
          </a>
          <a
            href="#faq"
            className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            FAQ
          </a>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            title="Theme Mode"
            className="w-9 h-9 rounded-lg hover:bg-white/5 border border-white/5 flex items-center justify-center transition-colors text-zinc-400 hover:text-white cursor-pointer"
          >
            <span className="material-symbols-outlined text-[19px]">dark_mode</span>
          </button>
          
          {/* GitHub Button */}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            title="GitHub Repository"
            className="w-9 h-9 rounded-lg hover:bg-white/5 border border-white/5 flex items-center justify-center transition-colors text-zinc-400 hover:text-white"
          >
            <span className="material-symbols-outlined text-[19px]">code</span>
          </a>
        </div>
      </div>
    </nav>
  );
}
