"use client";

export default function PlatformGrid() {
  const platforms = [
    {
      name: "YouTube",
      icon: "play_circle",
      types: ["Videos (up to 4K)", "MP3 Audio", "Thumbnails"],
      color: "group-hover:text-red-500",
      bgHover: "hover:border-red-500/20 hover:shadow-[0_0_30px_rgba(239,68,68,0.1)]",
      iconBg: "bg-red-500/10 text-red-400",
    },
    {
      name: "Instagram",
      icon: "photo_camera",
      types: ["Reels", "Photos & Videos", "Carousels / Albums"],
      color: "group-hover:text-pink-500",
      bgHover: "hover:border-pink-500/20 hover:shadow-[0_0_30px_rgba(236,72,153,0.1)]",
      iconBg: "bg-pink-500/10 text-pink-400",
    },
    {
      name: "TikTok",
      icon: "music_video",
      types: ["HD Videos", "Original Audios", "Slideshows"],
      color: "group-hover:text-zinc-100",
      bgHover: "hover:border-zinc-400/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.06)]",
      iconBg: "bg-white/10 text-zinc-300",
    },
    {
      name: "Facebook",
      icon: "face_nod",
      types: ["Videos (SD/HD)", "Reels", "Audios"],
      color: "group-hover:text-blue-500",
      bgHover: "hover:border-blue-500/20 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)]",
      iconBg: "bg-blue-500/10 text-blue-400",
    },
    {
      name: "X / Twitter",
      icon: "close",
      types: ["Tweets Videos", "Post Photos", "GIFs"],
      color: "group-hover:text-zinc-200",
      bgHover: "hover:border-zinc-500/20 hover:shadow-[0_0_30px_rgba(156,163,175,0.08)]",
      iconBg: "bg-zinc-800 text-zinc-300",
    },
    {
      name: "Pinterest",
      icon: "push_pin",
      types: ["Video Pins", "Image Pins", "Idea Pins"],
      color: "group-hover:text-red-400",
      bgHover: "hover:border-red-500/20 hover:shadow-[0_0_30px_rgba(239,68,68,0.08)]",
      iconBg: "bg-red-500/10 text-red-400",
    },
  ];

  return (
    <section id="platforms" className="w-full max-w-6xl mx-auto px-6 py-20 border-t border-white/5">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-extrabold tracking-tight text-white mb-3">
          Seamless Platform Support
        </h2>
        <p className="text-zinc-400 max-w-lg mx-auto text-sm font-medium">
          Extract and download native content formats from all major social sharing applications.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {platforms.map((plat) => (
          <div
            key={plat.name}
            className={`premium-card p-6 rounded-2xl border border-white/5 flex flex-col items-start gap-4 transition-all duration-300 group cursor-default ${plat.bgHover}`}
          >
            {/* Header with Icon */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-inner ${plat.iconBg}`}>
              <span className="material-symbols-outlined text-[22px]">{plat.icon}</span>
            </div>

            {/* Content Details */}
            <div>
              <h3 className={`text-base font-bold text-white transition-colors duration-300 ${plat.color}`}>
                {plat.name}
              </h3>
              
              <ul className="mt-3.5 space-y-2 select-none">
                {plat.types.map((type) => (
                  <li key={type} className="flex items-center gap-2 text-xs text-zinc-400/90 font-medium">
                    <span className="w-1 h-1 rounded-full bg-purple-500/60 shrink-0"></span>
                    <span>{type}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
