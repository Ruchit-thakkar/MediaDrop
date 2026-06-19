"use client";

import { useRef, useState, useEffect } from "react";
import { getBrandLogo } from "./BrandLogos";

export default function MetadataCard({ metadata, copied, onCopyText }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [showControls, setShowControls] = useState(false);

  // Reset avatar error state when metadata changes
  useEffect(() => {
    setAvatarError(false);
  }, [metadata]);

  const getPlatformName = (platform) => {
    const plat = platform ? platform.toLowerCase() : "";
    if (plat.includes("youtube")) return "YouTube";
    if (plat.includes("instagram")) return "Instagram";
    if (plat.includes("tiktok")) return "TikTok";
    if (plat.includes("facebook")) return "Facebook";
    if (plat.includes("twitter") || plat === "x") return "X / Twitter";
    if (plat.includes("pinterest")) return "Pinterest";
    return "Media";
  };

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch((err) => console.log("Video play failed:", err));
    } else {
      videoRef.current.pause();
    }
  };

  const getContentType = () => {
    if (metadata.is_playlist) return "Carousel";
    const hasVideo = metadata.formats?.some((f) => f.type === "video");
    const hasAudio = metadata.formats?.some((f) => f.type === "audio");
    if (metadata.platform?.toLowerCase().includes("instagram") && !metadata.duration) return "Reel";
    if (hasVideo) return "Video";
    if (hasAudio && !hasVideo) return "Audio";
    return "Photo";
  };

  const contentType = getContentType();

  // For the video player source, use the extracted stream url or fall back to local cached preview video
  const videoSrc = metadata.video_url || "/preview.mp4";

  // Reload the video elements when metadata or source changes to cleanly swap posters and reset state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [metadata, videoSrc]);

  // Construct a public profile avatar URL using unavatar.io service
  const getAvatarUrl = () => {
    const plat = metadata.platform ? metadata.platform.toLowerCase() : "";
    const uploader = metadata.uploader_id || metadata.uploader;
    if (!uploader || uploader.toLowerCase() === "unknown") return null;

    // Clean uploader handle (remove spaces, keep @ if present for youtube)
    const cleanUploader = uploader.replace(/\s+/g, "");

    if (plat.includes("youtube")) {
      return `https://unavatar.io/youtube/${cleanUploader}`;
    }
    if (plat.includes("twitter") || plat === "x") {
      return `https://unavatar.io/twitter/${cleanUploader.replace("@", "")}`;
    }
    if (plat.includes("instagram")) {
      return `https://unavatar.io/instagram/${cleanUploader.replace("@", "")}`;
    }
    if (plat.includes("facebook")) {
      return `https://unavatar.io/facebook/${cleanUploader}`;
    }
    if (plat.includes("tiktok")) {
      return `https://unavatar.io/tiktok/${cleanUploader.replace("@", "")}`;
    }
    return null;
  };

  return (
    <div className="premium-card rounded-3xl p-5 overflow-hidden flex flex-col justify-between w-full hover:border-white/10 transition-colors">
      <div>
        {/* Playable Video Preview Container */}
        <div
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
          className="aspect-video w-full rounded-2xl overflow-hidden relative border border-white/5 group bg-zinc-950 select-none shadow-2xl"
        >
          <video
            ref={videoRef}
            src={videoSrc}
            poster={metadata.thumbnail}
            loop
            muted
            playsInline
            controls={showControls}
            onClick={handlePlayPause}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            className="w-full h-full object-cover cursor-pointer"
          />

          {/* Overlay controls indicator */}
          {!showControls && (
            <div
              onClick={handlePlayPause}
              className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-black/70 border border-white/10 flex items-center justify-center text-white backdrop-blur-sm">
                <span className="material-symbols-outlined text-2xl font-bold">
                  {isPlaying ? "pause" : "play_arrow"}
                </span>
              </div>
            </div>
          )}

          {/* Duration Indicator Badge */}
          {metadata.duration && (
            <div className="absolute bottom-3 right-3 bg-black/80 text-white text-[10px] font-bold font-mono px-2 py-0.5 rounded-lg border border-white/5 backdrop-blur-md">
              {metadata.duration}
            </div>
          )}

          {/* Hover play prompt */}
          {!isPlaying && !showControls && (
            <div className="absolute bottom-3 left-3 bg-black/50 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg backdrop-blur-md flex items-center gap-1 pointer-events-none">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
              Click to preview
            </div>
          )}
        </div>

        {/* Text Details & Title row */}
        <div className="mt-5 px-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-white font-extrabold text-lg leading-tight tracking-tight flex-grow" title={metadata.title}>
              {metadata.title}
            </h3>

            {/* Type badge */}
            <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest bg-purple-500/20 text-purple-300 border border-purple-500/10 rounded-lg shrink-0">
              {contentType}
            </span>
          </div>

          {/* Creator & Platform row */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              {!avatarError && getAvatarUrl() ? (
                <img
                  src={getAvatarUrl()}
                  alt="Creator Avatar"
                  onError={() => setAvatarError(true)}
                  className="w-6 h-6 rounded-full border border-white/10 object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[10px] font-extrabold text-purple-400 uppercase select-none shrink-0 shadow-inner">
                  {metadata.uploader ? metadata.uploader.charAt(0) : "C"}
                </div>
              )}
              <span className="text-xs text-zinc-400 font-bold tracking-tight">
                {metadata.uploader ? (metadata.uploader.startsWith("@") ? metadata.uploader : `@${metadata.uploader.toLowerCase()}`) : "@creator"}
              </span>
            </div>

            {/* Platform logo badge */}
            <div className="flex items-center gap-1.5 text-zinc-400 font-bold text-xs uppercase tracking-wider">
              {getBrandLogo(metadata.platform, "w-4 h-4")}
              <span className="text-[11px]">{getPlatformName(metadata.platform)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-cards Row (Duration, Visibility, Type) */}
      <div className="grid grid-cols-3 gap-3 mt-6">
        {/* Duration Sub-card */}
        <div className="bg-[#09090B] border border-white/5 p-3 rounded-2xl flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-1 text-white font-extrabold text-xs">
            <span className="material-symbols-outlined text-[14px] text-purple-400">schedule</span>
            <span>{metadata.duration || "00:42"}</span>
          </div>
          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-1.5">
            Duration
          </span>
        </div>

        {/* Visibility Sub-card */}
        <div className="bg-[#09090B] border border-white/5 p-3 rounded-2xl flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-1 text-white font-extrabold text-xs">
            <span className="material-symbols-outlined text-[14px] text-purple-400">language</span>
            <span>Public</span>
          </div>
          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-1.5">
            Visibility
          </span>
        </div>

        {/* Type Sub-card */}
        <div className="bg-[#09090B] border border-white/5 p-3 rounded-2xl flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-1 text-white font-extrabold text-xs">
            <span className="material-symbols-outlined text-[14px] text-purple-400">movie</span>
            <span>{contentType}</span>
          </div>
          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-1.5">
            Type
          </span>
        </div>
      </div>

      {/* Caption drawer */}
      {metadata.description && (
        <div className="mt-5 pt-3.5 border-t border-white/5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
              Caption
            </span>
            <button
              onClick={() => onCopyText(metadata.description)}
              className="text-[10px] font-bold text-purple-400 hover:text-white cursor-pointer flex items-center gap-1 transition-colors select-none"
              title="Copy caption text"
            >
              <span className="material-symbols-outlined text-[12px]">{copied ? "check" : "content_copy"}</span>
              <span>{copied ? "Copied!" : "Copy"}</span>
            </button>
          </div>
          <div className="text-[11px] max-h-20 overflow-y-auto whitespace-pre-wrap leading-relaxed text-zinc-400 bg-white/[0.01] p-3 rounded-xl border border-white/5 custom-scrollbar font-medium">
            {metadata.description}
          </div>
        </div>
      )}
    </div>
  );
}
