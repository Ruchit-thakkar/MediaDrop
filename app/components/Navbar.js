"use client";

import { useState, useEffect } from "react";

export default function Navbar({ theme, onToggleTheme }) {
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
        ? "bg-background/80 backdrop-blur-md border-b border-border-subtle py-3 h-14"
        : "bg-transparent py-5 h-20"
        }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
        {/* Left: Brand logo */}
        <div className="flex items-center gap-2.5 group cursor-pointer select-none">
          <img
            src={theme === "light" ? "https://ik.imagekit.io/devnext/MediaDroplight.png" : "https://ik.imagekit.io/devnext/MediaDropDark.png"}
            alt="MediaDrop Logo"
            className="h-6.5 sm:h-7 w-auto object-contain group-hover:scale-[1.01] transition-transform duration-300"
          />
          <div className="flex items-center gap-2.5 group cursor-pointer select-none">
            {/* Left Accent Bar: Gives it an application feel rather than just a website */}
            <div className="h-5 w-[3px] bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 rounded-full opacity-40 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="flex items-center gap-1.5">
              {/* Main Text with a subtle premium tracking and gradient mask on hover */}
              {/* Main Text with a subtle premium tracking and gradient mask on hover */}
              <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white bg-clip-text group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-zinc-900 group-hover:via-zinc-700 group-hover:to-zinc-500 dark:group-hover:from-white dark:group-hover:via-slate-200 dark:group-hover:to-slate-400 transition-all duration-300 ease-out">
                MediaDrop
              </span>
            </div>
          </div>
        </div>

        {/* Center: Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          <a
            href="#"
            className="text-xs font-semibold text-zinc-800 dark:text-white/90 hover:text-zinc-950 dark:hover:text-white transition-colors"
          >
            Home
          </a>
          <a
            href="#features"
            className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            Features
          </a>
          <a
            href="#platforms"
            className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            Supported Platforms
          </a>
          <a
            href="#faq"
            className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            FAQ
          </a>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="w-9 h-9 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-center transition-colors text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
          >
            <span className="material-symbols-outlined text-[19px]">
              {theme === "dark" ? "light_mode" : "dark_mode"}
            </span>
          </button>

          {/* GitHub Button */}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            title="GitHub Repository"
            className="w-9 h-9 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-center transition-colors text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          >
            <span className="material-symbols-outlined text-[19px]">code</span>
          </a>
        </div>
      </div>
    </nav>
  );
}
