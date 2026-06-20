"use client";

import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import LoadingSkeleton from "./components/LoadingSkeleton";
import MetadataCard from "./components/MetadataCard";
import FormatCard from "./components/FormatCard";
import PlaylistView from "./components/PlaylistView";
import ProgressModal from "./components/ProgressModal";
import PlatformGrid from "./components/PlatformGrid";
import HowItWorks from "./components/HowItWorks";
import FeaturesSection from "./components/FeaturesSection";
import FAQSection from "./components/FAQSection";
import Footer from "./components/Footer";

// FIX: Establish your fallback production Railway URL clearly
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://media-drop-backend-production.up.railway.app";

export default function Home() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [metadata, setMetadata] = useState(null);
  const [theme, setTheme] = useState("dark");
  const [preparingDownload, setPreparingDownload] = useState(null);
  const [downloadError, setDownloadError] = useState("");
  const [copied, setCopied] = useState(false);

  // 1. Instantly wake up the backend when the web app mounts
  useEffect(() => {
    fetch(`${BACKEND_URL}/wake-up`)
      .then(res => res.json())
      .then(data => console.log("Wake up confirmation:", data))
      .catch(err => console.error("Server wake up failed:", err));
  }, []);

  // 2. Theme & Service Worker Management
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);

    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("Service Worker registered successfully:", reg.scope))
        .catch((err) => console.warn("Service Worker registration failed:", err));
    }
  }, []);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);

    const faviconUrl = theme === "light"
      ? "https://ik.imagekit.io/devnext/MediaDroplight.png"
      : "https://ik.imagekit.io/devnext/MediaDropDark.png";

    const links = document.querySelectorAll("link[rel*='icon']");
    links.forEach(link => { link.href = faviconUrl; });
  }, [theme]);

  const handleToggleTheme = () => setTheme(prev => prev === "dark" ? "light" : "dark");
  const handleCopyText = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // FIX: Main media metadata extraction router targeting Railway directly
  const handleExtract = async (e) => {
    if (e) e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setError("");
    setDownloadError("");
    setMetadata(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/extract`, {
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

  // FIX: Direct pipeline to receive and trigger processed static file downloads
  const handleDownload = async (formatId, targetUrl = null, entryIndex = null) => {
    const dlKey = entryIndex !== null ? `${formatId}-${entryIndex}` : formatId;
    setPreparingDownload(dlKey);
    setDownloadError("");

    try {
      const response = await fetch(`${BACKEND_URL}/api/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: targetUrl || url,
          format: formatId,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to download media file from backend.");
      }

      // Convert the server binary stream directly into an internal browser blob object
      const blob = await response.blob();
      
      // Parse out structural attachment filenames sent from the flask response headers
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `media_file.${formatId.includes('mp3') ? 'mp3' : 'mp4'}`;
      if (contentDisposition && contentDisposition.includes('filename=')) {
        filename = contentDisposition.split('filename=')[1].replace(/['"]/g, '');
      }

      // Run virtual DOM link generation to activate local download mechanics
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Clear memory buffers efficiently
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

    } catch (err) {
      setDownloadError(err.message);
    } finally {
      setPreparingDownload(null);
    }
  };

  // Mock metadata preview defaults
  const mockMetadata = {
    is_playlist: false,
    title: "Breathtaking Sunset",
    thumbnail: "https://lh3.googleusercontent.com/aida-public/AB6AXuDi0FTQ_AOm6SOOaGal6MhZizq3f3QVtmnRxr-3M2gDemheYrNjPPfCKDvEZnS7Pm9im6ddlum2fSTbJZW-hLHcTl9bIcyShPy5Q6PZQ6F_FSW1ZMVGrqWhgrrNhc6Q2gwurBp-elAzwt0xbQ82BN1-ZEOO2TM63JPXZo2JynX2ZrqeaO8lZxQgIaPXMG10_dec4CBiVrcmGkl8A0bx4BmWwU7PMVoctO-d8vUx-J-OF20pYmxrRMmK6GzTDM6VSFOPH96FYPgCsDwz",
    duration: "00:42",
    uploader: "visualdiary",
    platform: "instagram",
    description: "Catching a breathtaking sunset over the mountains. #sunset #nature",
    formats: [
      { id: "1080p", name: "MP4 1080p", type: "video", ext: "mp4", quality: "1080p", note: "Full HD" },
      { id: "720p", name: "MP4 720p", type: "video", ext: "mp4", quality: "720p", note: "HD" },
      { id: "mp3-320", name: "MP3 320kbps", type: "audio", ext: "mp3", quality: "320kbps", note: "Audio" },
      { id: "thumbnail", name: "Thumbnail JPG", type: "image", ext: "jpg", quality: "Original", note: "Image" }
    ]
  };

  const activeMeta = metadata || mockMetadata;
  const isMock = !metadata;

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col relative overflow-x-hidden selection:bg-purple-500/30">
      <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full ambient-glow-1 blur-[130px] pointer-events-none z-[-1]"></div>
      <div className="absolute top-[40%] right-[-10%] w-[45vw] h-[45vw] rounded-full ambient-glow-2 blur-[130px] pointer-events-none z-[-1]"></div>

      <Navbar theme={theme} onToggleTheme={handleToggleTheme} />

      <main className="pt-24 flex-grow">
        <Hero url={url} setUrl={setUrl} isLoading={isLoading} handleExtract={handleExtract} />

        {error && (
          <section className="max-w-2xl mx-auto px-6 mb-8 animate-fade-in">
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 flex items-start gap-3 shadow-lg">
              <span className="material-symbols-outlined text-xl shrink-0 mt-0.5">error</span>
              <div className="text-xs font-semibold"><span className="font-extrabold uppercase">Extraction Failed: </span>{error}</div>
            </div>
          </section>
        )}

        {downloadError && (
          <section className="max-w-2xl mx-auto px-6 mb-8 animate-fade-in">
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 flex items-start gap-3 shadow-lg">
              <span className="material-symbols-outlined text-xl shrink-0 mt-0.5">warning</span>
              <div className="text-xs font-semibold"><span className="font-extrabold uppercase">Download Failed: </span>{downloadError}</div>
            </div>
          </section>
        )}

        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <section className="animate-fade-in">
            {isMock && (
              <div className="mb-6 text-center select-none">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-3.5 py-1.5 rounded-full border border-purple-500/20 shadow-inner">
                  ✨ Interface Preview
                </span>
              </div>
            )}

            {!activeMeta.is_playlist ? (
              <div className="w-full max-w-6xl mx-auto px-6 mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-5">
                    <MetadataCard metadata={activeMeta} copied={copied} onCopyText={handleCopyText} />
                  </div>
                  <div className="lg:col-span-7 premium-card rounded-3xl p-6 border border-white/5 flex flex-col justify-start">
                    <h3 className="text-zinc-900 dark:text-white font-extrabold text-sm tracking-wide uppercase mb-4 select-none">Available Formats</h3>
                    <div className="flex flex-col gap-3">
                      {activeMeta.formats.map((format) => (
                        <FormatCard key={format.id} format={format} preparingDownload={preparingDownload} onDownload={handleDownload} isMock={isMock} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <PlaylistView metadata={activeMeta} preparingDownload={preparingDownload} onDownload={handleDownload} copied={copied} onCopyText={handleCopyText} />
            )}
          </section>
        )}

        <ProgressModal preparingDownload={preparingDownload} metadata={activeMeta} />
        <PlatformGrid />
        <HowItWorks />
        <FeaturesSection />
        <FAQSection />
      </main>

      <Footer theme={theme} />
    </div>
  );
}
