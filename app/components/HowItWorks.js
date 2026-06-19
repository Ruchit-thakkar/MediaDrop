"use client";

export default function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Paste URL",
      desc: "Copy the media URL from your browser or social app and paste it into the downloader field.",
      icon: "content_paste_go",
    },
    {
      num: "02",
      title: "Fetch Metadata",
      desc: "Our high-speed cloud engine extracts all downloadable stream streams and formats automatically.",
      icon: "settings_suggest",
    },
    {
      num: "03",
      title: "Download Content",
      desc: "Choose your desired quality format and click download to save the file direct to device storage.",
      icon: "cloud_download",
    },
  ];

  return (
    <section className="w-full max-w-6xl mx-auto px-6 py-20 border-t border-white/5 relative">
      {/* Centered Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-purple-500/5 blur-[120px] pointer-events-none"></div>

      <div className="text-center mb-16 relative">
        <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-3">
          Simple Extraction
        </h2>
        <p className="text-zinc-400 max-w-lg mx-auto text-sm font-medium">
          MediaDrop performs the heavy lifting, saving your content in three simple steps.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
        {steps.map((step) => (
          <div key={step.num} className="text-center group relative">
            {/* Step Icon & Floating Number */}
            <div className="w-16 h-16 premium-card rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-105 group-hover:border-purple-500/30 transition-all duration-300 relative select-none">
              <span className="material-symbols-outlined text-2xl text-purple-400 group-hover:text-purple-300">
                {step.icon}
              </span>

              {/* Step number badge */}
              <div className="absolute -top-2.5 -right-2.5 w-7 h-7 primary-gradient text-white font-extrabold rounded-full text-xs flex items-center justify-center shadow-lg border border-purple-500/20">
                {step.num}
              </div>
            </div>

            {/* Step Title & description */}
            <h3 className="text-zinc-900 dark:text-white font-bold mb-2.5 text-base tracking-tight group-hover:text-purple-400 transition-colors">
              {step.title}
            </h3>
            <p className="text-zinc-400 text-xs leading-relaxed max-w-[240px] mx-auto font-medium">
              {step.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
