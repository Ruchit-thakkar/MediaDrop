"use client";

import Link from "next/link";

export default function Footer({ theme }) {
  const socialLinks = [
    { 
      name: 'Instagram', 
      href: 'https://www.instagram.com/ruchit1744', 
      icon: (props) => (
        <svg suppressHydrationWarning viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
        </svg>
      ),
      color: 'hover:text-pink-500 hover:bg-pink-500/10 hover:border-pink-500/30' 
    },
    { 
      name: 'LinkedIn', 
      href: 'https://www.linkedin.com/in/ruchit-thakkar-38ab37379', 
      icon: (props) => (
        <svg suppressHydrationWarning viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
          <rect x="2" y="9" width="4" height="12"></rect>
          <circle cx="4" cy="4" r="2"></circle>
        </svg>
      ),
      color: 'hover:text-blue-500 hover:bg-blue-500/10 hover:border-blue-500/30' 
    },
    { 
      name: 'GitHub', 
      href: 'https://github.com/Ruchit-thakkar', 
      icon: (props) => (
        <svg suppressHydrationWarning viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
        </svg>
      ),
      color: 'hover:text-zinc-950 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 hover:border-black/20 dark:hover:border-white/30' 
    },
    { 
      name: 'X', 
      href: 'https://x.com/RuchitThakkar19', 
      icon: (props) => (
        <svg suppressHydrationWarning viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      color: 'hover:text-sky-500 hover:bg-sky-500/10 hover:border-sky-500/30' 
    },
    { 
      name: 'Email', 
      href: 'mailto:ruchitthakkar12@gmail.com', 
      icon: (props) => (
        <svg suppressHydrationWarning viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
          <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
      ),
      color: 'hover:text-emerald-500 hover:bg-emerald-500/10 hover:border-emerald-500/30' 
    }
  ];

  return (
    <footer className="border-t border-border-subtle bg-background/40 py-14 select-none">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">

          {/* Logo & Description */}
          <div className="md:col-span-4">
            <div className="flex items-center gap-2.5 mb-4">
              <img
                src={theme === "light" ? "https://ik.imagekit.io/devnext/MediaDroplight.png" : "https://ik.imagekit.io/devnext/MediaDropDark.png"}
                alt="MediaDrop Logo"
                className="h-6 w-auto object-contain"
              />
              <Link href="/" className="flex items-center gap-2.5 group cursor-pointer select-none">
                {/* Left Accent Bar: Gives it an application feel rather than just a website */}
                <div className="h-5 w-[3px] bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 rounded-full opacity-40 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="flex items-center gap-1.5">
                  {/* Main Text with a subtle premium tracking and gradient mask on hover */}
                  <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white bg-clip-text group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-zinc-900 group-hover:via-zinc-700 group-hover:to-zinc-500 dark:group-hover:from-white dark:group-hover:via-slate-200 dark:group-hover:to-slate-400 transition-all duration-300 ease-out">
                    MediaDrop
                  </span>
                </div>
              </Link>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed max-w-xs font-medium">
              High-performance media extraction for a modern web. Simple, fast, and completely private by design.
            </p>
          </div>

          {/* Quick Links Column */}
          <div className="md:col-span-3">
            <h4 className="text-zinc-900 dark:text-white text-[10px] font-bold uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-2 text-xs font-medium text-zinc-400">
              <li>
                <Link href="/" className="hover:text-purple-400 transition-colors">
                  Video Downloader
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-purple-400 transition-colors">
                  MP3 Audio Extractor
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-purple-400 transition-colors">
                  Story & Reel Saver
                </Link>
              </li>
              <li>
                <Link href="/gemini-remover" className="hover:text-purple-400 transition-colors">
                  Gemini Watermark Remover
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div className="md:col-span-3">
            <h4 className="text-zinc-900 dark:text-white text-[10px] font-bold uppercase tracking-wider mb-4">Legal</h4>
            <ul className="space-y-2 text-xs font-medium text-zinc-400">
              <li>
                <Link href="/privacy" className="hover:text-purple-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-purple-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Github Column */}
          <div className="md:col-span-2">
            <h4 className="text-zinc-900 dark:text-white text-[10px] font-bold uppercase tracking-wider mb-4">Community</h4>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">code</span>
              <span>GitHub</span>
            </a>
          </div>
        </div>

        {/* Tech Stack, Copyright & Social Links */}
        <div className="mt-12 pt-8 border-t border-border-subtle flex flex-col gap-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-zinc-500 font-medium">
            
            {/* Left side: Copyright & Credit */}
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
              <span>© 2026 MediaDrop. All rights reserved.</span>
              <span className="hidden sm:inline text-zinc-300 dark:text-zinc-800">|</span>
              <span className="flex items-center gap-1.5">
                Made by <span className="font-semibold text-zinc-700 dark:text-zinc-300">Ruchit</span> <span className="text-red-500 animate-pulse">❤️</span>
              </span>
            </div>

            {/* Middle: Tech Stack */}
            <span className="text-[10px] font-mono uppercase tracking-wider text-center md:text-left">
              Built with Next.js, Express, Python & yt-dlp
            </span>

            {/* Right side: Social Icons */}
            <div className="flex items-center gap-2.5">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={social.name}
                    className={`w-8 h-8 rounded-lg border border-zinc-200 dark:border-white/5 bg-zinc-100/40 dark:bg-white/[0.01] flex items-center justify-center text-zinc-400 transition-all duration-300 ${social.color}`}
                  >
                    <Icon className="w-4.5 h-4.5" />
                  </a>
                );
              })}
            </div>

          </div>
        </div>
      </div>
    </footer>
  );
}
