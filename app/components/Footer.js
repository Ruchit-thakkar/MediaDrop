"use client";

export default function Footer({ theme }) {
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
              <div className="flex items-center gap-2.5 group cursor-pointer select-none">
                {/* Left Accent Bar: Gives it an application feel rather than just a website */}
                <div className="h-5 w-[3px] bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 rounded-full opacity-40 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="flex items-center gap-1.5">
                  {/* Main Text with a subtle premium tracking and gradient mask on hover */}
                  <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white bg-clip-text group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-zinc-900 group-hover:via-zinc-700 group-hover:to-zinc-500 dark:group-hover:from-white dark:group-hover:via-slate-200 dark:group-hover:to-slate-400 transition-all duration-300 ease-out">
                    MediaDrop
                  </span>
                </div>
              </div>
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
                <a href="#" className="hover:text-purple-400 transition-colors">
                  Video Downloader
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-purple-400 transition-colors">
                  MP3 Audio Extractor
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-purple-400 transition-colors">
                  Story & Reel Saver
                </a>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div className="md:col-span-3">
            <h4 className="text-zinc-900 dark:text-white text-[10px] font-bold uppercase tracking-wider mb-4">Legal</h4>
            <ul className="space-y-2 text-xs font-medium text-zinc-400">
              <li>
                <a href="#" className="hover:text-purple-400 transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-purple-400 transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-purple-400 transition-colors">
                  Status Page
                </a>
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

        {/* Tech Stack and Copyright */}
        <div className="mt-12 pt-6 border-t border-border-subtle flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest text-center sm:text-left">
          <span>© 2026 MediaDrop. All rights reserved.</span>
          <span className="normal-case tracking-normal text-zinc-500 font-sans font-medium">
            Built with Next.js, Node.js, Express, Python, yt-dlp and FFmpeg.
          </span>
        </div>
      </div>
    </footer>
  );
}
