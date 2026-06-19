"use client";

export default function FeaturesSection() {
  const features = [
    {
      title: "Lightning Fast",
      desc: "Our processing pipeline extracts media streams in under 800ms. No waiting.",
      icon: "bolt",
      gradient: "from-amber-400 to-orange-500",
    },
    {
      title: "High Quality Downloads",
      desc: "Access source files at their native resolution, all the way up to 4K Ultra HD.",
      icon: "high_quality",
      gradient: "from-blue-400 to-indigo-500",
    },
    {
      title: "MP3 Conversion",
      desc: "Convert and extract high-bitrate studio audio files at up to 320kbps.",
      icon: "album",
      gradient: "from-purple-400 to-pink-500",
    },
    {
      title: "Thumbnail Downloader",
      desc: "Grab full-size cover images and thumbnails from YouTube or social posts.",
      icon: "image",
      gradient: "from-emerald-400 to-teal-500",
    },
    {
      title: "No Account Required",
      desc: "Zero registration required. No sign-ups, no cookies, no database logging.",
      icon: "person_off",
      gradient: "from-red-400 to-rose-500",
    },
    {
      title: "Mobile Friendly",
      desc: "Optimized interface for effortless downloads on phone, tablet, and desktop.",
      icon: "devices",
      gradient: "from-cyan-400 to-blue-500",
    },
  ];

  return (
    <section id="features" className="w-full max-w-6xl mx-auto px-6 py-20 border-t border-white/5">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-3">
          Built for Performance
        </h2>
        <p className="text-zinc-400 max-w-lg mx-auto text-sm font-medium">
          A minimalist toolkit packed with premium features to make media extraction seamless.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feat) => (
          <div
            key={feat.title}
            className="premium-card p-8 rounded-2xl border border-white/5 hover:border-purple-500/20 hover:shadow-[0_0_25px_-5px_rgba(124,58,237,0.1)] group flex flex-col items-start"
          >
            {/* Gradient Icon Wrapper */}
            <div className={`w-12 h-12 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center mb-6 shadow-inner group-hover:scale-105 transition-transform duration-300`}>
              <span className={`material-symbols-outlined text-2xl bg-gradient-to-br ${feat.gradient} bg-clip-text text-transparent`}>
                {feat.icon}
              </span>
            </div>

            {/* Title & Desc */}
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 tracking-tight group-hover:text-purple-400 transition-colors">
              {feat.title}
            </h3>
            <p className="text-zinc-400 text-xs leading-relaxed font-medium">
              {feat.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
