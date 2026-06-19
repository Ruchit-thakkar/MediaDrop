"use client";

import URLInput from "./URLInput";

export default function Hero({ url, setUrl, isLoading, handleExtract }) {
  const platforms = [
    { name: "YouTube", icon: "play_circle", hoverColor: "hover:border-red-600 hover:text-red-500 hover:bg-red-500/5" },
    { name: "Instagram", icon: "photo_camera", hoverColor: "hover:border-pink-600 hover:text-pink-500 hover:bg-pink-500/5" },
    { name: "TikTok", icon: "music_video", hoverColor: "hover:border-white hover:text-white hover:bg-white/5" },
    { name: "Facebook", icon: "face_nod", hoverColor: "hover:border-blue-600 hover:text-blue-500 hover:bg-blue-500/5" },
    { name: "X", icon: "close", hoverColor: "hover:border-zinc-400 hover:text-white hover:bg-white/5" },
    { name: "Pinterest", icon: "push_pin", hoverColor: "hover:border-red-500 hover:text-red-500 hover:bg-red-500/5" },
  ];

  return (
    <section className="relative w-full max-w-4xl mx-auto px-6 pt-16 pb-12 text-center flex flex-col items-center">
      {/* Visual Badge indicator */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/5 bg-white/[0.02] text-[10px] uppercase font-bold tracking-wider text-purple-400 mb-6 shadow-sm select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
        Premium Media Downloader
      </div>

      {/* Main Headline */}
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-4 leading-[1.08] max-w-3xl">
        Download Videos, Reels, <br className="hidden sm:inline" />
        Photos & MP3 <span className="text-gradient">Instantly</span>
      </h1>

      {/* Subheadline */}
      <p className="text-zinc-400 text-base md:text-lg max-w-xl mb-10 font-medium">
        Fast and free downloader for YouTube, Instagram, TikTok, Facebook, X, and Pinterest.
      </p>

      {/* URL Input Form */}
      <div className="w-full mb-6">
        <URLInput
          url={url}
          setUrl={setUrl}
          isLoading={isLoading}
          handleExtract={handleExtract}
        />
      </div>

      {/* Small Note */}
      <div className="text-xs text-zinc-500 font-medium tracking-wide flex items-center justify-center gap-1.5 flex-wrap select-none mb-10">
        <span>No sign up required</span>
        <span className="text-zinc-700">•</span>
        <span>No database</span>
        <span className="text-zinc-700">•</span>
        <span>Instant downloads</span>
      </div>

      {/* Supported Platforms Badges */}
      <div className="flex items-center justify-center gap-2.5 flex-wrap select-none">
        {platforms.map((plat) => (
          <div
            key={plat.name}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/5 bg-[#111113]/40 text-xs font-semibold text-zinc-400 transition-all duration-300 ${plat.hoverColor}`}
          >
            <span className="material-symbols-outlined text-[15px]">{plat.icon}</span>
            <span>{plat.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
