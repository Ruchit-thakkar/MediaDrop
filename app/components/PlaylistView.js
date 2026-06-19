"use client";

import MetadataCard from "./MetadataCard";

export default function PlaylistView({ metadata, preparingDownload, onDownload, copied, onCopyText }) {
  return (
    <div className="w-full max-w-6xl mx-auto px-6 mb-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Playlist Card */}
        <div className="lg:col-span-5">
          <MetadataCard
            metadata={metadata}
            copied={copied}
            onCopyText={onCopyText}
          />
        </div>

        {/* Right Column: Playlist Items list */}
        <div className="lg:col-span-7 premium-card rounded-2xl p-5 border border-white/5 flex flex-col justify-between max-h-[500px]">
          <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
              Album Contents
            </span>
            <span className="px-2 py-0.5 rounded-lg border border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-300 text-[10px] font-bold tracking-wider font-mono">
              {metadata.entries?.length || 0} ITEMS
            </span>
          </div>

          {/* Scrollable list */}
          <div className="overflow-y-auto space-y-3.5 pr-1 custom-scrollbar flex-grow">
            {metadata.entries?.map((entry) => (
              <div
                key={entry.index}
                className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
              >
                {/* Entry Left: thumbnail and index + title */}
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-zinc-900 rounded-lg overflow-hidden shrink-0 border border-white/5 select-none">
                    <img
                      src={entry.thumbnail || metadata.thumbnail || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80"}
                      alt={entry.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80";
                      }}
                    />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
                      Item #{entry.index}
                    </span>
                    <h4 className="text-zinc-900 dark:text-white font-bold text-xs line-clamp-1 leading-tight mt-0.5" title={entry.title}>
                      {entry.title}
                    </h4>
                  </div>
                </div>

                {/* Entry Right: Available formats for this entry */}
                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
                  {entry.formats.map((format) => {
                    const dlKey = `${format.id}-${entry.index}`;
                    const isThisDownloading = preparingDownload === dlKey;
                    const isAnyDownloading = !!preparingDownload;

                    let btnColor = "hover:bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400";
                    let icon = "download";

                    if (format.type === "audio") {
                      btnColor = "hover:bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400";
                      icon = "music_note";
                    } else if (format.type === "image") {
                      btnColor = "hover:bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400";
                      icon = "image";
                    }

                    return (
                      <button
                        key={format.id}
                        disabled={isAnyDownloading}
                        onClick={() => onDownload(format.id, entry.url, entry.index)}
                        className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold tracking-wider uppercase transition-all duration-300 flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${btnColor}`}
                      >
                        {isThisDownloading ? (
                          <span className="animate-spin h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full"></span>
                        ) : (
                          <span className="material-symbols-outlined text-[13px]">{icon}</span>
                        )}
                        <span>
                          {format.quality} ({format.ext})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
