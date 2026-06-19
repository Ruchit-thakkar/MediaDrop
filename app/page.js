"use client";

import { useState } from "react";
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

const API_BASE = "/api";

export default function Home() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [metadata, setMetadata] = useState(null);
  
  const [preparingDownload, setPreparingDownload] = useState(null);
  const [downloadError, setDownloadError] = useState("");
  
  // Copy state
  const [copied, setCopied] = useState(false);

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

  // Mock metadata to show when page loads before extraction
  const mockMetadata = {
    is_playlist: false,
    title: "Breathtaking Sunset",
    thumbnail: "https://lh3.googleusercontent.com/aida-public/AB6AXuDi0FTQ_AOm6SOOaGal6MhZizq3f3QVtmnRxr-3M2gDemheYrNjPPfCKDvEZnS7Pm9im6ddlum2fSTbJZW-hLHcTl9bIcyShPy5Q6PZQ6F_FSW1ZMVGrqWhgrrNhc6Q2gwurBp-elAzwt0xbQ82BN1-ZEOO2TM63JPXZo2JynX2ZrqeaO8lZxQgIaPXMG10_dec4CBiVrcmGkl8A0bx4BmWwU7PMVoctO-d8vUx-J-OF20pYmxrRMmK6GzTDM6VSFOPH96FYPgCsDwz",
    duration: "00:42",
    uploader: "visualdiary",
    platform: "instagram",
    description: "Catching a breathtaking sunset over the mountains. The colors were absolutely unbelievable tonight. #sunset #nature #mountains #reels",
    formats: [
      { id: "1080p", name: "MP4 1080p", type: "video", ext: "mp4", quality: "1080p", note: "Full HD" },
      { id: "720p", name: "MP4 720p", type: "video", ext: "mp4", quality: "720p", note: "HD" },
      { id: "480p", name: "MP4 480p", type: "video", ext: "mp4", quality: "480p", note: "SD" },
      { id: "mp3-320", name: "MP3 320kbps", type: "audio", ext: "mp3", quality: "320kbps", note: "Audio" },
      { id: "thumbnail", name: "Thumbnail JPG", type: "image", ext: "jpg", quality: "Original", note: "Image" },
      { id: "album-zip", name: "Album ZIP", type: "image", ext: "zip", quality: "Original", note: "All Images" }
    ]
  };

  const activeMeta = metadata || mockMetadata;
  const isMock = !metadata;

  return (
    <div className="bg-[#09090B] text-white min-h-screen flex flex-col relative selection:bg-purple-500/30">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full ambient-glow-1 blur-[130px] pointer-events-none z-[-1]"></div>
      <div className="absolute top-[40%] right-[-10%] w-[45vw] h-[45vw] rounded-full ambient-glow-2 blur-[130px] pointer-events-none z-[-1]"></div>

      {/* Navigation Bar */}
      <Navbar />

      {/* Main Content */}
      <main className="pt-24 flex-grow">
        
        {/* Hero Section & URL Input */}
        <Hero
          url={url}
          setUrl={setUrl}
          isLoading={isLoading}
          handleExtract={handleExtract}
        />

        {/* Error Alert */}
        {error && (
          <section className="max-w-2xl mx-auto px-6 mb-8 animate-fade-in">
            <div className="p-4 rounded-2xl bg-red-950/30 border border-red-500/20 text-red-400 flex items-start gap-3 shadow-lg">
              <span className="material-symbols-outlined text-xl shrink-0 mt-0.5">error</span>
              <div className="text-xs font-semibold">
                <span className="font-extrabold uppercase">Extraction Failed: </span>
                {error}
              </div>
            </div>
          </section>
        )}

        {/* Download Error Alert */}
        {downloadError && (
          <section className="max-w-2xl mx-auto px-6 mb-8 animate-fade-in">
            <div className="p-4 rounded-2xl bg-red-950/30 border border-red-500/20 text-red-400 flex items-start gap-3 shadow-lg">
              <span className="material-symbols-outlined text-xl shrink-0 mt-0.5">warning</span>
              <div className="text-xs font-semibold">
                <span className="font-extrabold uppercase">Download Failed: </span>
                {downloadError}
              </div>
            </div>
          </section>
        )}

        {/* Metadata extraction result view */}
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
              // Single Media Output Layout
              <div className="w-full max-w-6xl mx-auto px-6 mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Column: Metadata Preview Card */}
                  <div className="lg:col-span-5">
                    <MetadataCard
                      metadata={activeMeta}
                      copied={copied}
                      onCopyText={handleCopyText}
                    />
                  </div>

                  {/* Right Column: Available Formats Card (single vertical stack container) */}
                  <div className="lg:col-span-7 premium-card rounded-3xl p-6 border border-white/5 flex flex-col justify-start">
                    <h3 className="text-white font-extrabold text-sm tracking-wide uppercase mb-4 select-none">
                      Available Formats
                    </h3>
                    <div className="flex flex-col gap-3">
                      {activeMeta.formats.map((format) => (
                        <FormatCard
                          key={format.id}
                          format={format}
                          preparingDownload={preparingDownload}
                          onDownload={handleDownload}
                          isMock={isMock}
                        />
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            ) : (
              // Playlist / Carousel Output Layout
              <PlaylistView
                metadata={activeMeta}
                preparingDownload={preparingDownload}
                onDownload={handleDownload}
                copied={copied}
                onCopyText={handleCopyText}
              />
            )}
          </section>
        )}

        {/* Floating Download Progress Modal */}
        <ProgressModal preparingDownload={preparingDownload} metadata={activeMeta} />

        {/* Seamless Platform Support */}
        <PlatformGrid />

        {/* How It Works Steps timeline */}
        <HowItWorks />

        {/* Performance Features */}
        <FeaturesSection />

        {/* Frequently Asked Questions */}
        <FAQSection />

      </main>

      {/* Footer copyright and built info */}
      <Footer />
    </div>
  );
}
