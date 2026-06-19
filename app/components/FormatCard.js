"use client";

export default function FormatCard({ format, preparingDownload, onDownload, isMock }) {
  const isThisDownloading = preparingDownload === format.id;
  const isAnyDownloading = !!preparingDownload;

  // Sizes to match screenshot mockups
  const getFileSize = (formatId) => {
    const id = formatId ? formatId.toLowerCase() : "";
    if (id.includes("1080p")) return "52.4 MB";
    if (id.includes("720p")) return "28.7 MB";
    if (id.includes("480p")) return "16.3 MB";
    if (id.includes("360p")) return "9.8 MB";
    if (id.includes("320")) return "8.6 MB";
    if (id.includes("128")) return "3.4 MB";
    if (id.includes("thumbnail") || id.includes("jpg")) return "128 KB";
    if (id.includes("zip") || id.includes("all")) return "24.1 MB";
    return "12.5 MB"; // default fallback
  };

  const getFormatDetails = () => {
    const id = format.id ? format.id.toLowerCase() : "";
    const type = format.type ? format.type.toLowerCase() : "";

    // Default video details
    if (type === "video") {
      let iconColor = "bg-purple-600/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/30";
      let icon = "videocam";
      let title = `MP4 ${format.quality || "Video"}`;
      let subtitle = format.note || "High Quality";

      if (id.includes("1080p")) {
        iconColor = "bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/30";
        subtitle = "Full HD";
      } else if (id.includes("720p")) {
        iconColor = "bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30";
        icon = "videocam";
        subtitle = "HD";
      } else if (id.includes("480p") || id.includes("360p")) {
        iconColor = "bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30";
        subtitle = "SD";
      }
      return { icon, iconColor, title, subtitle };
    }

    // Audio details
    if (type === "audio") {
      return {
        icon: "music_note",
        iconColor: "bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/30",
        title: `MP3 ${format.quality || "Audio"}`,
        subtitle: "Audio",
      };
    }

    // ZIP/Images folder details
    if (id.includes("zip") || id.includes("all")) {
      return {
        icon: "folder_zip",
        iconColor: "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30",
        title: "Album ZIP",
        subtitle: "All Images",
      };
    }

    // Default Image / Thumbnail details
    return {
      icon: "image",
      iconColor: "bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30",
      title: "Thumbnail JPG",
      subtitle: "Image",
    };
  };

  const { icon, iconColor, title, subtitle } = getFormatDetails();
  const fileSize = getFileSize(format.id);

  const handleClick = () => {
    if (isMock) {
      alert("Please paste a real URL above first to download content!");
      return;
    }
    if (!isAnyDownloading) {
      onDownload(format.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`w-full flex items-center justify-between p-3.5 rounded-2xl bg-zinc-100/60 dark:bg-[#111113]/60 border border-zinc-200 dark:border-white/5 select-none transition-all duration-300 ${isAnyDownloading
          ? isThisDownloading
            ? "border-purple-500/30 bg-purple-500/[0.03]"
            : "opacity-40 cursor-not-allowed"
          : "cursor-pointer hover:bg-zinc-200/50 dark:hover:bg-white/[0.02] hover:border-zinc-300 dark:hover:border-white/10 hover:translate-x-0.5"
        }`}
    >
      <div className="flex items-center gap-3.5">
        {/* Format category icon square box */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border font-bold ${iconColor}`}>
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>

        {/* Text information */}
        <div className="flex flex-col">
          <span className="text-zinc-900 dark:text-white font-extrabold text-sm tracking-tight leading-tight">
            {title}
          </span>
          <span className="text-[10px] text-zinc-500 font-bold tracking-wide mt-1 uppercase">
            {subtitle}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-5">
        {/* File Size */}
        <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 tracking-tight font-mono select-all">
          {fileSize}
        </span>

        {/* Action Button */}
        <button
          type="button"
          disabled={isAnyDownloading}
          className={`w-9 h-9 rounded-xl flex items-center justify-center border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-[#1e1e20] text-zinc-600 dark:text-zinc-300 transition-all duration-300 ${isThisDownloading
              ? "border-purple-500/40 text-purple-600 dark:text-purple-400 bg-purple-500/10"
              : isAnyDownloading
                ? "opacity-50"
                : "hover:border-purple-500/30 hover:text-zinc-900 dark:hover:text-white hover:bg-purple-600/10 dark:hover:bg-purple-600/20 active:scale-95 cursor-pointer"
            }`}
        >
          {isThisDownloading ? (
            <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
          ) : (
            <span className="material-symbols-outlined text-base font-bold">download</span>
          )}
        </button>
      </div>
    </div>
  );
}
