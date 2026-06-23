"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const categories = [
  { name: "Image Tools", path: "image-tools", icon: "image" },
  { name: "Video Tools", path: "video-tools", icon: "movie" },
  { name: "Audio Tools", path: "audio-tools", icon: "audiotrack" },
  { name: "File Tools", path: "file-tools", icon: "folder_open" },
  { name: "Text Tools", path: "text-tools", icon: "description" },
  { name: "Developer Tools", path: "developer-tools", icon: "terminal" },
  { name: "Utility Tools", path: "utility-tools", icon: "construction" },
];

export default function Navbar({ theme, onToggleTheme }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isToolsExpanded, setIsToolsExpanded] = useState(false);

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

  // Prevent scroll when mobile drawer is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
          ? "bg-background/80 backdrop-blur-md border-b border-border-subtle py-3 h-14"
          : "bg-transparent py-5 h-20"
          }`}
      >
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
          {/* Left: Brand logo */}
          <Link href="/" className="flex items-center gap-2.5 group cursor-pointer select-none">
            <img
              src={theme === "light" ? "https://ik.imagekit.io/devnext/MediaDroplight.png" : "https://ik.imagekit.io/devnext/MediaDropDark.png"}
              alt="MediaDrop Logo"
              className="h-6.5 sm:h-7 w-auto object-contain group-hover:scale-[1.01] transition-transform duration-300"
            />
            {/* Left Accent Bar: Gives it an application feel rather than just a website */}
            <div className="h-5 w-[3px] bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 rounded-full opacity-40 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="flex items-center gap-1.5">
              {/* Main Text with a subtle premium tracking and gradient mask on hover */}
              <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white bg-clip-text group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-zinc-900 group-hover:via-zinc-700 group-hover:to-zinc-500 dark:group-hover:from-white dark:group-hover:via-slate-200 dark:group-hover:to-slate-400 transition-all duration-300 ease-out">
                MediaDrop
              </span>
            </div>
          </Link>

          {/* Center: Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-xs font-semibold text-zinc-800 dark:text-white/90 hover:text-zinc-950 dark:hover:text-white transition-colors"
            >
              Home
            </Link>

            {/* Desktop Dropdown for Tools */}
            <div className="relative group py-2">
              <Link
                href="/tools"
                className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center gap-0.5"
              >
                Tools
                <span className="material-symbols-outlined text-[15px] transition-transform duration-300 group-hover:rotate-180 select-none">
                  keyboard_arrow_down
                </span>
              </Link>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-52 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                <div className="premium-card rounded-2xl p-2 border border-white/5 shadow-xl flex flex-col gap-0.5">
                  {categories.map((cat) => (
                    <Link
                      key={cat.path}
                      href={`/tools/${cat.path}`}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px] text-purple-500">{cat.icon}</span>
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <Link
              href="/#features"
              className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              Features
            </Link>
            <Link
              href="/gemini-remover"
              className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              Gemini Remover
            </Link>
            <Link
              href="/#platforms"
              className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              Supported Platforms
            </Link>
            <Link
              href="/#faq"
              className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              FAQ
            </Link>
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

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open navigation menu"
              className="md:hidden w-9 h-9 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-center transition-colors text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">menu</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      {isMenuOpen && (
        <div
          onClick={() => setIsMenuOpen(false)}
          className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 md:hidden transition-opacity duration-300"
        />
      )}

      {/* Mobile Drawer Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-[300px] max-w-[80vw] z-50 bg-background/95 backdrop-blur-lg border-l border-border-subtle flex flex-col p-6 shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar">
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Navigation</span>
            <button
              onClick={() => setIsMenuOpen(false)}
              aria-label="Close navigation menu"
              className="w-8 h-8 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col gap-1">
            <Link
              href="/"
              onClick={() => setIsMenuOpen(false)}
              className="text-sm font-semibold text-zinc-800 dark:text-white/90 hover:text-zinc-950 dark:hover:text-white py-2.5 px-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all"
            >
              Home
            </Link>
            
            {/* Expandable Tools Accordion */}
            <div className="flex flex-col">
              <button
                onClick={() => setIsToolsExpanded(!isToolsExpanded)}
                className="flex items-center justify-between text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white py-2.5 px-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer text-left w-full"
              >
                <span>Tools</span>
                <span
                  className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${
                    isToolsExpanded ? "rotate-90" : ""
                  }`}
                >
                  chevron_right
                </span>
              </button>
              
              {/* Accordion Submenu */}
              <div
                className={`transition-all duration-300 overflow-hidden flex flex-col pl-6 gap-1 mt-1 ${
                  isToolsExpanded ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                {categories.map((cat) => (
                  <Link
                    key={cat.path}
                    href={`/tools/${cat.path}`}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2.5 py-2 px-3 rounded-xl text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px] text-purple-500">{cat.icon}</span>
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>

            <Link
              href="/#features"
              onClick={() => setIsMenuOpen(false)}
              className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white py-2.5 px-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all"
            >
              Features
            </Link>
            <Link
              href="/gemini-remover"
              onClick={() => setIsMenuOpen(false)}
              className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white py-2.5 px-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all"
            >
              Gemini Remover
            </Link>
            <Link
              href="/#platforms"
              onClick={() => setIsMenuOpen(false)}
              className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white py-2.5 px-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all"
            >
              Supported Platforms
            </Link>
            <Link
              href="/#faq"
              onClick={() => setIsMenuOpen(false)}
              className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white py-2.5 px-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all"
            >
              FAQ
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
