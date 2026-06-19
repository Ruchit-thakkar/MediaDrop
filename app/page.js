"use client";

import { useState } from "react";

const API_BASE = "/api";

export default function Home() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [metadata, setMetadata] = useState(null);
  
  const [preparingDownload, setPreparingDownload] = useState(null);
  const [downloadError, setDownloadError] = useState("");
  
  // Theme state: default is dark mode
  const [theme, setTheme] = useState("dark");
  
  // Copy to clipboard notification state
  const [copied, setCopied] = useState(false);
  
  // Track open state for FAQ accordion items
  const [openFaq, setOpenFaq] = useState({});

  const toggleFaq = (index) => {
    setOpenFaq((prev) => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleCopyText = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExtract = async (e) => {
    if (e) e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setError("");
    setDownloadError("");
    setMetadata(null);

    try {
      const response = await fetch(`${API_BASE}/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to extract metadata from this URL.");
      }

      setMetadata(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (formatId, targetUrl = null, entryIndex = null) => {
    const dlKey = entryIndex !== null ? `${formatId}-${entryIndex}` : formatId;
    setPreparingDownload(dlKey);
    setDownloadError("");

    try {
      const response = await fetch(`${API_BASE}/download/prepare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: targetUrl || url,
          formatId: formatId,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to prepare download.");
      }

      // Trigger actual browser download
      const downloadLink = `${API_BASE}/download/file?token=${data.token}&filename=${encodeURIComponent(data.filename)}`;
      const a = document.createElement("a");
      a.href = downloadLink;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      setDownloadError(err.message);
    } finally {
      setPreparingDownload(null);
    }
  };

  const getPlatformBadge = (platform) => {
    const plat = platform ? platform.toLowerCase() : "";
    let colorClass = "bg-neutral-800/80 dark:bg-white/10 text-neutral-800 dark:text-white";
    let icon = "play_arrow";
    let displayName = "Media";

    if (plat.includes("youtube")) {
      colorClass = "bg-red-600/90 text-white";
      icon = "play_circle";
      displayName = "YouTube";
    } else if (plat.includes("instagram")) {
      colorClass = "bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white";
      icon = "photo_camera";
      displayName = "Instagram";
    } else if (plat.includes("tiktok")) {
      colorClass = "bg-black border border-white/10 text-white";
      icon = "music_video";
      displayName = "TikTok";
    } else if (plat.includes("facebook")) {
      colorClass = "bg-[#1877F2] text-white";
      icon = "face_nod";
      displayName = "Facebook";
    } else if (plat.includes("twitter") || plat === "x") {
      colorClass = "bg-neutral-900 border border-white/10 text-white";
      icon = "close";
      displayName = "X / Twitter";
    } else if (plat.includes("pinterest")) {
      colorClass = "bg-[#E60023] text-white";
      icon = "push_pin";
      displayName = "Pinterest";
    }

    return (
      <div className={`backdrop-blur text-[10px] font-bold px-2.5 py-0.5 rounded flex items-center gap-1 uppercase tracking-tighter ${colorClass}`}>
        <span className="material-symbols-outlined text-[12px]">{icon}</span>
        {displayName}
      </div>
    );
  };

  const getDescriptionLabel = (platform) => {
    const plat = platform ? platform.toLowerCase() : "";
    if (plat.includes("youtube")) return "Video Description";
    if (plat.includes("instagram")) return "Instagram Caption";
    if (plat.includes("tiktok")) return "TikTok Caption";
    if (plat.includes("facebook")) return "Facebook Caption";
    return "Description / Caption";
  };

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col transition-colors duration-300 selection:bg-primary/30">
        
        {/* Navigation Bar */}
        <nav className="fixed top-0 w-full z-50 bg-nav-bg backdrop-blur-md border-b border-neutral-200/50 dark:border-white/5 transition-colors duration-300">
          <div className="max-w-container-max mx-auto px-gutter h-16 flex items-center justify-between">
            <div className="font-display-lg text-2xl font-bold tracking-tighter text-neutral-900 dark:text-white flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-primary-gradient flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-lg">download</span>
              </div>
              MediaDrop
            </div>
            <div className="hidden md:flex items-center gap-lg">
              <a className="relative nav-link text-neutral-800 dark:text-white text-sm font-semibold" href="#">Home</a>
              <a className="relative nav-link text-neutral-500 hover:text-neutral-800 dark:text-on-surface-variant dark:hover:text-white text-sm font-semibold" href="#features">Features</a>
              <a className="relative nav-link text-neutral-500 hover:text-neutral-800 dark:text-on-surface-variant dark:hover:text-white text-sm font-semibold" href="#platforms">Platforms</a>
              <a className="relative nav-link text-neutral-500 hover:text-neutral-800 dark:text-on-surface-variant dark:hover:text-white text-sm font-semibold" href="#faq">FAQ</a>
            </div>
            <div className="flex items-center gap-sm">
              <button 
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 hover:bg-neutral-200/50 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer text-neutral-800 dark:text-white"
                title="Toggle Light/Dark Theme"
              >
                <span className="material-symbols-outlined text-xl">
                  {theme === "dark" ? "light_mode" : "dark_mode"}
                </span>
              </button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="pt-32 flex-grow">
          
          {/* Hero Section */}
          <section className="max-w-container-max mx-auto px-gutter mb-xl">
            <div className="text-center max-w-3xl mx-auto reveal active">
              <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg mb-md tracking-tight leading-[1.1] text-neutral-900 dark:text-white">
                Download media <span className="text-gradient">instantly</span> from any social platform
              </h1>
              <p className="text-neutral-600 dark:text-on-surface-variant text-body-lg font-body-lg mb-lg max-w-2xl mx-auto opacity-90 leading-relaxed">
                A minimal, high-performance toolkit to extract 4K videos, reels, and high-bitrate MP3s in seconds. Free forever.
              </p>
              
              {/* Input Bar Form */}
              <form onSubmit={handleExtract} className="glass-input p-1.5 rounded-xl flex items-center gap-1 max-w-2xl mx-auto group focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/10 transition-all duration-300">
                <div className="pl-4 pr-2 py-2 flex items-center text-neutral-400 dark:text-on-surface-variant/40">
                  <span className="material-symbols-outlined text-xl">link</span>
                </div>
                <input
                  className="bg-transparent border-none focus:ring-0 outline-none w-full px-2 text-body-md font-body-md placeholder:text-neutral-400 dark:placeholder:text-on-surface-variant/30 text-neutral-900 dark:text-on-surface h-10"
                  placeholder="Paste a video or post URL here..."
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !url.trim()}
                  className="primary-gradient h-10 px-6 rounded-lg text-white font-semibold text-sm active:scale-95 hover:brightness-110 disabled:opacity-50 disabled:scale-100 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                      Fetching...
                    </>
                  ) : (
                    "Download"
                  )}
                </button>
              </form>

              <div className="mt-md flex items-center justify-center gap-sm flex-wrap">
                <span className="px-2.5 py-1 rounded-full bg-neutral-200/50 dark:bg-white/5 border border-neutral-300/30 dark:border-white/5 text-[11px] font-label-mono text-neutral-600 dark:text-on-surface-variant/60 uppercase tracking-wider">No registration</span>
                <span className="px-2.5 py-1 rounded-full bg-neutral-200/50 dark:bg-white/5 border border-neutral-300/30 dark:border-white/5 text-[11px] font-label-mono text-neutral-600 dark:text-on-surface-variant/60 uppercase tracking-wider">Zero Tracking</span>
                <span className="px-2.5 py-1 rounded-full bg-neutral-200/50 dark:bg-white/5 border border-neutral-300/30 dark:border-white/5 text-[11px] font-label-mono text-neutral-600 dark:text-on-surface-variant/60 uppercase tracking-wider">4K Support</span>
              </div>
            </div>
          </section>

          {/* Error Alert */}
          {error && (
            <section className="max-w-2xl mx-auto px-gutter mb-lg">
              <div className="p-4 rounded-lg bg-error-container/20 dark:bg-error-container/30 border border-error/20 text-error flex items-start gap-3">
                <span className="material-symbols-outlined text-xl shrink-0 mt-0.5">error</span>
                <div className="text-sm">
                  <span className="font-bold">Extraction Failed: </span>
                  {error}
                </div>
              </div>
            </section>
          )}

          {/* Download Error Alert */}
          {downloadError && (
            <section className="max-w-2xl mx-auto px-gutter mb-lg">
              <div className="p-4 rounded-lg bg-error-container/20 dark:bg-error-container/30 border border-error/20 text-error flex items-start gap-3">
                <span className="material-symbols-outlined text-xl shrink-0 mt-0.5">warning</span>
                <div className="text-sm">
                  <span className="font-bold">Download Failed: </span>
                  {downloadError}
                </div>
              </div>
            </section>
          )}

          {/* Preview & Options Grid */}
          {metadata && (
            <section className="max-w-container-max mx-auto px-gutter mb-xl reveal active">
              {!metadata.is_playlist ? (
                // Single Media Output
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-md">
                  {/* Media Preview Card */}
                  <div className="lg:col-span-5 glass-card rounded-xl p-md overflow-hidden flex flex-col justify-between">
                    <div>
                      <div className="aspect-video rounded-lg overflow-hidden relative border border-neutral-200/30 dark:border-white/5 group">
                        <img
                          alt={metadata.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                          src={metadata.thumbnail || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80"}
                          onError={(e) => {
                            e.target.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80";
                          }}
                        />
                        {metadata.duration && (
                          <div className="absolute bottom-2 right-2 bg-black/90 text-white text-[11px] font-label-mono px-1.5 py-0.5 rounded backdrop-blur">
                            {metadata.duration}
                          </div>
                        )}
                        <div className="absolute top-2 left-2">
                          {getPlatformBadge(metadata.platform)}
                        </div>
                      </div>
                      
                      <div className="mt-md px-1">
                        <h3 className="font-headline-md text-neutral-900 dark:text-white mb-2 line-clamp-2 leading-tight" title={metadata.title}>
                          {metadata.title}
                        </h3>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                            {(metadata.uploader || "U").substring(0, 2).toUpperCase()}
                          </div>
                          <span className="text-sm text-neutral-600 dark:text-on-surface-variant font-medium">{metadata.uploader || "Creator"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Metadata Description Area */}
                    {metadata.description && (
                      <div className="mt-2 pt-4 border-t border-neutral-200/50 dark:border-white/5">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-on-surface-variant/60 font-label-mono">
                            {getDescriptionLabel(metadata.platform)}
                          </span>
                          <button
                            onClick={() => handleCopyText(metadata.description)}
                            className="text-xs font-semibold text-primary hover:text-primary-container dark:hover:text-primary-fixed cursor-pointer flex items-center gap-1 select-none"
                            title="Copy to Clipboard"
                          >
                            <span className="material-symbols-outlined text-[15px]">{copied ? "check" : "content_copy"}</span>
                            <span>{copied ? "Copied!" : "Copy"}</span>
                          </button>
                        </div>
                        <div className="text-[12px] max-h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed text-neutral-600 dark:text-on-surface-variant opacity-85 bg-neutral-200/20 dark:bg-white/[0.01] p-3 rounded-lg border border-neutral-200/50 dark:border-white/5 custom-scrollbar">
                          {metadata.description}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Download Options Grid */}
                  <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {metadata.formats.map((format) => {
                      const isDownloading = preparingDownload === format.id;
                      const formatColor = 
                        format.type === 'video' ? 'text-primary' : 
                        format.type === 'audio' ? 'text-tertiary' : 'text-secondary';
                      const icon = 
                        format.type === 'video' ? 'download' : 
                        format.type === 'audio' ? 'music_note' : 'image';

                      return (
                        <div
                          key={format.id}
                          onClick={() => !preparingDownload && handleDownload(format.id)}
                          className={`glass-card p-4 rounded-xl hover:bg-neutral-200/10 dark:hover:bg-white/[0.04] hover:shadow-lg dark:hover:shadow-primary/5 hover:border-primary/20 dark:hover:border-primary/20 transition-all group flex flex-col justify-between h-36 ${preparingDownload ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <span className={`text-[10px] font-label-mono uppercase tracking-widest block mb-1 ${formatColor}`}>
                                {format.type} {format.ext.toUpperCase()}
                              </span>
                              <h4 className="text-neutral-900 dark:text-white font-bold text-lg leading-tight">{format.name}</h4>
                            </div>
                            <div className={`${formatColor}/60 group-hover:${formatColor} transition-colors mt-1`}>
                              {isDownloading ? (
                                <span className="animate-spin h-5 w-5 block border-2 border-current border-t-transparent rounded-full"></span>
                              ) : (
                                <span className="material-symbols-outlined text-xl">{icon}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[11px] font-label-mono text-neutral-500 dark:text-on-surface-variant/60">
                            <span>{format.note || "Ready"}</span>
                            <span className="px-1.5 py-0.5 rounded bg-neutral-200/50 dark:bg-white/5 border border-neutral-300/30 dark:border-white/5 uppercase">
                              {format.quality}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                // Playlist / Carousel Output
                <div className="glass-card rounded-xl p-md">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-md border-b border-neutral-200/50 dark:border-white/5 pb-6 mb-6">
                    <div className="w-full lg:max-w-2xl">
                      <div className="flex items-center gap-2 mb-2">
                        {getPlatformBadge(metadata.platform)}
                        <span className="text-[11px] font-label-mono text-primary uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded">
                          Carousel Album ({metadata.entries.length} items)
                        </span>
                      </div>
                      <h2 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">{metadata.title}</h2>
                      <p className="text-sm text-neutral-600 dark:text-on-surface-variant mt-1">Uploaded by {metadata.uploader}</p>
                    </div>
                    
                    {/* Copy Playlist Caption button */}
                    {metadata.description && (
                      <button
                        onClick={() => handleCopyText(metadata.description)}
                        className="px-4 py-2 rounded-lg border border-primary/20 text-primary text-xs font-semibold hover:bg-primary/10 transition-colors flex items-center gap-2 cursor-pointer self-start lg:self-auto select-none"
                      >
                        <span className="material-symbols-outlined text-[15px]">{copied ? "check" : "content_copy"}</span>
                        <span>{copied ? "Caption Copied!" : "Copy Post Caption"}</span>
                      </button>
                    )}
                  </div>

                  {/* Optional Playlist Description preview box */}
                  {metadata.description && (
                    <div className="mb-6 p-4 rounded-lg bg-neutral-200/20 dark:bg-white/[0.01] border border-neutral-200/50 dark:border-white/5">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-on-surface-variant/60 font-label-mono mb-2">
                        Post Caption / Description
                      </h4>
                      <p className="text-xs text-neutral-700 dark:text-on-surface-variant max-h-24 overflow-y-auto leading-relaxed whitespace-pre-wrap custom-scrollbar opacity-90">
                        {metadata.description}
                      </p>
                    </div>
                  )}

                  <div className="space-y-4">
                    {metadata.entries.map((entry) => (
                      <div key={entry.index} className="p-4 rounded-lg bg-neutral-200/10 dark:bg-white/[0.01] border border-neutral-200/30 dark:border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-neutral-200/25 dark:hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-neutral-300 dark:bg-white/5 rounded-md overflow-hidden relative shrink-0 border border-neutral-200/30 dark:border-white/5">
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
                            <span className="text-[11px] font-label-mono text-primary/80 uppercase">Item #{entry.index}</span>
                            <h4 className="text-neutral-900 dark:text-white font-medium text-sm line-clamp-1">{entry.title}</h4>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                          {entry.formats.map((format) => {
                            const dlKey = `${format.id}-${entry.index}`;
                            const isDownloading = preparingDownload === dlKey;
                            const btnColor = 
                              format.type === 'video' ? 'hover:bg-primary/10 border-primary/20 text-primary' : 
                              format.type === 'audio' ? 'hover:bg-tertiary/10 border-tertiary/20 text-tertiary' : 'hover:bg-secondary/10 border-secondary/20 text-secondary';
                            
                            return (
                              <button
                                key={format.id}
                                disabled={!!preparingDownload}
                                onClick={() => handleDownload(format.id, entry.url, entry.index)}
                                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${btnColor}`}
                              >
                                {isDownloading ? (
                                  <span className="animate-spin h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full"></span>
                                ) : (
                                  <span className="material-symbols-outlined text-[14px]">
                                    {format.type === 'video' ? 'download' : format.type === 'audio' ? 'music_note' : 'image'}
                                  </span>
                                )}
                                <span>{format.quality} ({format.ext.toUpperCase()})</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Platforms Supported Section */}
          <section className="max-w-container-max mx-auto px-gutter mb-xl reveal active" id="platforms">
            <h2 className="font-display-lg text-3xl md:text-4xl text-center mb-xl text-neutral-900 dark:text-white tracking-tight">Seamless Platform Support</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="glass-card p-8 rounded-xl flex flex-col items-center gap-3 hover:border-primary/20 dark:hover:border-primary/20 transition-all group cursor-default">
                <div className="w-10 h-10 bg-[#FF0000]/10 rounded-lg flex items-center justify-center text-[#FF0000] group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
                </div>
                <span className="text-sm font-bold text-neutral-900 dark:text-white">YouTube</span>
              </div>
              <div className="glass-card p-8 rounded-xl flex flex-col items-center gap-3 hover:border-primary/20 dark:hover:border-primary/20 transition-all group cursor-default">
                <div className="w-10 h-10 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl">photo_camera</span>
                </div>
                <span className="text-sm font-bold text-neutral-900 dark:text-white">Instagram</span>
              </div>
              <div className="glass-card p-8 rounded-xl flex flex-col items-center gap-3 hover:border-primary/20 dark:hover:border-primary/20 transition-all group cursor-default">
                <div className="w-10 h-10 bg-white/10 dark:bg-white/20 rounded-lg flex items-center justify-center text-neutral-900 dark:text-white group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl">music_video</span>
                </div>
                <span className="text-sm font-bold text-neutral-900 dark:text-white">TikTok</span>
              </div>
              <div className="glass-card p-8 rounded-xl flex flex-col items-center gap-3 hover:border-primary/20 dark:hover:border-primary/20 transition-all group cursor-default">
                <div className="w-10 h-10 bg-[#1877F2]/10 rounded-lg flex items-center justify-center text-[#1877F2] group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>face_nod</span>
                </div>
                <span className="text-sm font-bold text-neutral-900 dark:text-white">Facebook</span>
              </div>
              <div className="glass-card p-8 rounded-xl flex flex-col items-center gap-3 hover:border-primary/20 dark:hover:border-primary/20 transition-all group cursor-default">
                <div className="w-10 h-10 bg-neutral-200 dark:bg-white/5 rounded-lg flex items-center justify-center text-neutral-900 dark:text-white group-hover:scale-110 transition-transform">
                  <span className="font-bold text-lg">X</span>
                </div>
                <span className="text-sm font-bold text-neutral-900 dark:text-white">X / Twitter</span>
              </div>
              <div className="glass-card p-8 rounded-xl flex flex-col items-center gap-3 hover:border-primary/20 dark:hover:border-primary/20 transition-all group cursor-default">
                <div className="w-10 h-10 bg-[#E60023]/10 rounded-lg flex items-center justify-center text-[#E60023] group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl">push_pin</span>
                </div>
                <span className="text-sm font-bold text-neutral-900 dark:text-white">Pinterest</span>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="max-w-container-max mx-auto px-gutter mb-xl reveal active" id="features">
            <h2 className="font-display-lg text-3xl md:text-4xl text-center mb-xl text-neutral-900 dark:text-white tracking-tight">Built for Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="glass-card p-8 rounded-xl hover:translate-y-[-4px] transition-all border border-neutral-200/50 dark:border-white/5 hover:border-primary/20 dark:hover:border-primary/20 group">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                </div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3 tracking-tight">Lightning Engines</h3>
                <p className="text-neutral-600 dark:text-on-surface-variant text-sm leading-relaxed opacity-85">Our extraction engine is optimized for speed, delivering link fetching in under 800ms.</p>
              </div>
              <div className="glass-card p-8 rounded-xl hover:translate-y-[-4px] transition-all border border-neutral-200/50 dark:border-white/5 hover:border-primary/20 dark:hover:border-primary/20 group">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <span className="material-symbols-outlined">person_off</span>
                </div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3 tracking-tight">Private by Default</h3>
                <p className="text-neutral-600 dark:text-on-surface-variant text-sm leading-relaxed opacity-85">We don't log your requests, store URLs, or track your profile. Complete anonymity.</p>
              </div>
              <div className="glass-card p-8 rounded-xl hover:translate-y-[-4px] transition-all border border-neutral-200/50 dark:border-white/5 hover:border-primary/20 dark:hover:border-primary/20 group">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <span className="material-symbols-outlined">high_quality</span>
                </div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3 tracking-tight">True 4K Resolution</h3>
                <p className="text-neutral-600 dark:text-on-surface-variant text-sm leading-relaxed opacity-85">Access original source quality without artificial compression or bandwidth throttling.</p>
              </div>
            </div>
          </section>

          {/* How it Works Section */}
          <section className="max-w-container-max mx-auto px-gutter mb-xl reveal active">
            <div className="text-center mb-xl">
              <h2 className="font-display-lg text-3xl md:text-4xl text-neutral-900 dark:text-white tracking-tight">Simple Extraction</h2>
              <p className="text-neutral-500 dark:text-on-surface-variant text-sm mt-3 opacity-60">Ready in three effortless steps</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center group">
                <div className="w-16 h-16 glass-card rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform relative">
                  <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <span className="material-symbols-outlined text-2xl text-primary">link</span>
                  <div className="absolute -top-3 -right-3 w-7 h-7 bg-neutral-900 dark:bg-white text-white dark:text-black font-bold rounded-full text-xs flex items-center justify-center shadow-lg">01</div>
                </div>
                <h3 className="text-neutral-950 dark:text-white font-bold mb-2">Paste Link</h3>
                <p className="text-neutral-600 dark:text-on-surface-variant text-sm leading-relaxed max-w-[200px] mx-auto opacity-70">Copy the source URL from your platform.</p>
              </div>
              <div className="text-center group">
                <div className="w-16 h-16 glass-card rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform relative">
                  <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <span className="material-symbols-outlined text-2xl text-primary">settings_suggest</span>
                  <div className="absolute -top-3 -right-3 w-7 h-7 bg-neutral-900 dark:bg-white text-white dark:text-black font-bold rounded-full text-xs flex items-center justify-center shadow-lg">02</div>
                </div>
                <h3 className="text-neutral-950 dark:text-white font-bold mb-2">Auto Fetch</h3>
                <p className="text-neutral-600 dark:text-on-surface-variant text-sm leading-relaxed max-w-[200px] mx-auto opacity-70">Our server instantly extracts all available formats.</p>
              </div>
              <div className="text-center group">
                <div className="w-16 h-16 glass-card rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform relative">
                  <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <span className="material-symbols-outlined text-2xl text-primary">download_for_offline</span>
                  <div className="absolute -top-3 -right-3 w-7 h-7 bg-neutral-900 dark:bg-white text-white dark:text-black font-bold rounded-full text-xs flex items-center justify-center shadow-lg">03</div>
                </div>
                <h3 className="text-neutral-950 dark:text-white font-bold mb-2">Save Media</h3>
                <p className="text-neutral-600 dark:text-on-surface-variant text-sm leading-relaxed max-w-[200px] mx-auto opacity-70">Click to save directly to your device storage.</p>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="max-w-container-max mx-auto px-gutter mb-xl reveal active" id="faq">
            <h2 className="font-display-lg text-3xl md:text-4xl text-center mb-xl text-neutral-900 dark:text-white tracking-tight">Questions?</h2>
            <div className="max-w-2xl mx-auto space-y-3">
              {[
                {
                  q: "Is MediaDrop free to use?",
                  a: "Absolutely. MediaDrop is a community-driven project that is 100% free with no limits on the number of downloads or quality levels."
                },
                {
                  q: "Do I need to install any software?",
                  a: "No. It's a cloud-based web application. Everything runs in our high-performance servers, so you don't need to install anything on your device."
                },
                {
                  q: "What formats are supported?",
                  a: "We support MP4 for video (up to 4K), MP3 for audio (320kbps), and high-resolution JPEG/PNG for thumbnails and images."
                }
              ].map((item, idx) => (
                <div key={idx} className="glass-card rounded-xl overflow-hidden">
                  <button
                    className="w-full p-5 text-left flex justify-between items-center hover:bg-neutral-200/20 dark:hover:bg-white/5 transition-colors group cursor-pointer text-neutral-900 dark:text-white"
                    onClick={() => toggleFaq(idx)}
                  >
                    <span className="text-sm font-semibold text-neutral-800 dark:text-white/90">{item.q}</span>
                    <span
                      className="material-symbols-outlined text-neutral-500 dark:text-on-surface-variant transition-transform group-hover:text-neutral-800 dark:group-hover:text-white"
                      style={{ transform: openFaq[idx] ? "rotate(180deg)" : "rotate(0deg)" }}
                    >
                      expand_more
                    </span>
                  </button>
                  {openFaq[idx] && (
                    <div className="px-5 pb-5 text-sm text-neutral-600 dark:text-on-surface-variant leading-relaxed border-t border-neutral-200/50 dark:border-white/5 pt-4 opacity-85">
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-neutral-200/50 dark:border-white/5 py-xl bg-footer-bg transition-colors duration-300">
          <div className="max-w-container-max mx-auto px-gutter">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-lg items-start">
              <div className="col-span-1 md:col-span-1">
                <div className="font-display-lg text-2xl font-bold text-neutral-900 dark:text-white mb-4 tracking-tighter">MediaDrop</div>
                <p className="text-neutral-500 dark:text-on-surface-variant text-sm leading-relaxed opacity-70 font-semibold">High-performance media extraction for a modern web. Simple. Fast. Private.</p>
              </div>
              <div>
                <h4 className="text-neutral-900 dark:text-white text-sm font-bold mb-4 uppercase tracking-widest text-[10px]">Product</h4>
                <ul className="space-y-3 text-sm text-neutral-500 dark:text-on-surface-variant/60 font-semibold">
                  <li><a className="hover:text-neutral-900 dark:hover:text-white transition-colors" href="#">Video Downloader</a></li>
                  <li><a className="hover:text-neutral-900 dark:hover:text-white transition-colors" href="#">MP3 Converter</a></li>
                  <li><a className="hover:text-neutral-900 dark:hover:text-white transition-colors" href="#">Story Saver</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-neutral-900 dark:text-white text-sm font-bold mb-4 uppercase tracking-widest text-[10px]">Resources</h4>
                <ul className="space-y-3 text-sm text-neutral-500 dark:text-on-surface-variant/60 font-semibold">
                  <li><a className="hover:text-neutral-900 dark:hover:text-white transition-colors" href="#">Documentation</a></li>
                  <li><a className="hover:text-neutral-900 dark:hover:text-white transition-colors" href="#">Changelog</a></li>
                  <li><a className="hover:text-neutral-900 dark:hover:text-white transition-colors" href="#">Open Source</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-neutral-900 dark:text-white text-sm font-bold mb-4 uppercase tracking-widest text-[10px]">Company</h4>
                <ul className="space-y-3 text-sm text-neutral-500 dark:text-on-surface-variant/60 font-semibold">
                  <li><a className="hover:text-neutral-900 dark:hover:text-white transition-colors" href="#">Privacy</a></li>
                  <li><a className="hover:text-neutral-900 dark:hover:text-white transition-colors" href="#">Terms</a></li>
                  <li><a className="hover:text-neutral-900 dark:hover:text-white transition-colors" href="#">Support</a></li>
                </ul>
              </div>
            </div>
            <div className="mt-16 pt-8 border-t border-neutral-200/50 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[12px] text-neutral-400 dark:text-on-surface-variant/40 font-label-mono uppercase tracking-widest">
              <span>© 2026 MediaDrop. Cloud Native.</span>
              <div className="flex gap-6">
                <a className="hover:text-neutral-900 dark:hover:text-white" href="#">Status</a>
                <a className="hover:text-neutral-900 dark:hover:text-white" href="#">GitHub</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
