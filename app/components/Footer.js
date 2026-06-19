"use client";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#050507] py-14 select-none">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Logo & Description */}
          <div className="md:col-span-4">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg primary-gradient flex items-center justify-center shadow-lg shadow-purple-900/30">
                <span className="material-symbols-outlined text-white text-base font-bold">
                  download
                </span>
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                MediaDrop
              </span>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed max-w-xs font-medium">
              High-performance media extraction for a modern web. Simple, fast, and completely private by design.
            </p>
          </div>

          {/* Quick Links Column */}
          <div className="md:col-span-3">
            <h4 className="text-white text-[10px] font-bold uppercase tracking-wider mb-4">Product</h4>
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
            <h4 className="text-white text-[10px] font-bold uppercase tracking-wider mb-4">Legal</h4>
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
            <h4 className="text-white text-[10px] font-bold uppercase tracking-wider mb-4">Community</h4>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">code</span>
              <span>GitHub</span>
            </a>
          </div>
        </div>

        {/* Tech Stack and Copyright */}
        <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest text-center sm:text-left">
          <span>© 2026 MediaDrop. All rights reserved.</span>
          <span className="normal-case tracking-normal text-zinc-500 font-sans font-medium">
            Built with Next.js, Node.js, Express, Python, yt-dlp and FFmpeg.
          </span>
        </div>
      </div>
    </footer>
  );
}
