"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const toolsByCategory = {
  "image-tools": {
    title: "Image Tools",
    icon: "image",
    tools: [
      { name: "Image Compressor", desc: "Reduce image file size without losing quality.", path: "image-compressor" },
      { name: "Background Remover", desc: "Automatically extract subjects from images.", path: "background-remover" },
      { name: "Image Resizer", desc: "Change image dimensions to specific widths or heights.", path: "image-resizer" },
      { name: "Crop Image", desc: "Selectively trim the outer edges of an image.", path: "crop-image" },
      { name: "Rotate Image", desc: "Rotate images clockwise or counter-clockwise.", path: "rotate-image" },
      { name: "Flip Image", desc: "Mirror images horizontally or vertically.", path: "flip-image" },
      { name: "Convert JPG ↔ PNG ↔ WEBP ↔ AVIF", desc: "Convert images to different modern file formats.", path: "image-format-converter" },
      { name: "HEIC to JPG", desc: "Convert Apple HEIC photos to compatible JPGs.", path: "heic-to-jpg-converter" },
      { name: "SVG Converter", desc: "Convert vector SVG graphics to raster image formats.", path: "svg-converter" },
      { name: "GIF Maker", desc: "Combine multiple images to create animated GIFs.", path: "gif-maker" },
      { name: "Remove Image Metadata (EXIF)", desc: "Strip private GPS location and camera details from files.", path: "remove-image-metadata" },
      { name: "Watermark Image", desc: "Overlay text or image watermarks onto your pictures.", path: "watermark-image" },
      { name: "Image Color Picker", desc: "Extract precise hex/rgb color values from any pixel.", path: "image-color-picker" },
      { name: "Image Upscaler", desc: "Increase image resolution using client-side processing.", path: "image-upscaler" },
      { name: "Image to ASCII Art", desc: "Convert pictures into text-based character art.", path: "image-to-ascii-art" }
    ]
  },
  "video-tools": {
    title: "Video Tools",
    icon: "movie",
    tools: [
      { name: "Video Compressor", desc: "Reduce video file sizes while retaining optimal resolution." },
      { name: "Video Converter", desc: "Convert video files into alternative formats." },
      { name: "Video Trimmer", desc: "Cut specific parts of a video to shorten its duration." },
      { name: "Video Cutter", desc: "Split video files into multiple segments." },
      { name: "Video Merger", desc: "Stitch together multiple video files into a single video." },
      { name: "Extract Audio from Video", desc: "Strip the audio track from a video and save as MP3." },
      { name: "Change Video Speed", desc: "Speed up or slow down video playback." },
      { name: "Reverse Video", desc: "Play video clips backward." },
      { name: "Mute Video", desc: "Remove all audio streams from a video file." },
      { name: "Create GIF from Video", desc: "Convert selected video clips into animated GIFs." },
      { name: "Rotate Video", desc: "Rotate video orientation by 90, 180, or 270 degrees." },
      { name: "Resize Video", desc: "Change the aspect ratio or resolution of your video." }
    ]
  },
  "audio-tools": {
    title: "Audio Tools",
    icon: "audiotrack",
    tools: [
      { name: "MP3 Compressor", desc: "Reduce audio file sizes by adjusting bitrate settings." },
      { name: "Audio Converter", desc: "Convert audio formats like WAV, M4A, FLAC, and OGG to MP3." },
      { name: "Audio Trimmer", desc: "Trim audio tracks to create ringtones or shorten clips." },
      { name: "Merge Audio Files", desc: "Combine multiple audio tracks into a continuous mix." },
      { name: "Change Audio Speed", desc: "Adjust the tempo or pitch of an audio file." },
      { name: "Volume Booster", desc: "Safely increase the volume level of quiet audio files." },
      { name: "Voice Recorder", desc: "Record audio from your microphone directly in the browser." }
    ]
  },
  "file-tools": {
    title: "File Tools",
    icon: "folder_open",
    tools: [
      { name: "ZIP File Creator", desc: "Compress files and folders into standard ZIP archives." },
      { name: "ZIP Extractor", desc: "Decompress ZIP archives to extract files." },
      { name: "RAR Extractor", desc: "Extract files from RAR compressed archives locally." },
      { name: "7Z Extractor", desc: "Unpack 7-Zip high-compression archive files." },
      { name: "File Size Analyzer", desc: "Inspect and visualize the contents of your files." },
      { name: "Duplicate File Detector", desc: "Find identical files based on fast hash matching." },
      { name: "Folder Size Calculator", desc: "Compute total size of dropped folders." },
      { name: "Hash Generator", desc: "Calculate MD5, SHA-1, SHA-256, and SHA-512 values for files." }
    ]
  },
  "text-tools": {
    title: "Text Tools",
    icon: "description",
    tools: [
      { name: "Word Counter", desc: "Count words, characters, sentences, and paragraphs in real time." },
      { name: "Character Counter", desc: "Detailed character counting including with/without spaces." },
      { name: "Remove Duplicate Lines", desc: "Clean up lists or code by removing duplicated lines." },
      { name: "Case Converter", desc: "Switch text between UPPERCASE, lowercase, Title Case, etc." },
      { name: "Find & Replace", desc: "Locate and replace matching text snippets or regex patterns." },
      { name: "Text Sorter", desc: "Sort lines alphabetically, numerically, or by length." },
      { name: "Random Text Generator", desc: "Create randomized strings or test data." },
      { name: "Markdown Editor", desc: "Write markdown and preview rendered HTML side by side." },
      { name: "JSON Formatter", desc: "Beautify, validate, and minify JSON data." },
      { name: "XML Formatter", desc: "Format XML elements with clean hierarchy indentation." },
      { name: "HTML Formatter", desc: "Beautify and clean up raw HTML source code." },
      { name: "CSS Minifier", desc: "Compress CSS stylesheets to optimize loading speed." },
      { name: "JS Minifier", desc: "Optimize and compress JavaScript code structures." },
      { name: "Base64 Encoder/Decoder", desc: "Convert text or files to and from Base64 encoding." },
      { name: "URL Encoder/Decoder", desc: "Encode or decode strings for safe URL formatting." }
    ]
  },
  "developer-tools": {
    title: "Developer Tools",
    icon: "terminal",
    tools: [
      { name: "JWT Decoder", desc: "Decode JSON Web Tokens to inspect payloads without verifying secrets." },
      { name: "UUID Generator", desc: "Generate secure UUID v4 strings instantly." },
      { name: "QR Code Generator", desc: "Convert text, links, or contacts into custom QR codes." },
      { name: "QR Code Scanner", desc: "Read QR codes using your webcam or from uploaded images." },
      { name: "Barcode Generator", desc: "Generate standardized barcodes for products or tracking." },
      { name: "Password Generator", desc: "Create strong, customizable, cryptographically secure passwords." },
      { name: "Color Picker", desc: "Create color palettes and convert between HEX, RGB, HSL." },
      { name: "Gradient Generator", desc: "Design beautiful CSS gradients and copy code." },
      { name: "Regex Tester", desc: "Write and validate regular expressions against sample text." },
      { name: "Cron Expression Generator", desc: "Convert cron syntax to readable text description and vice-versa." },
      { name: "Timestamp Converter", desc: "Translate date strings to Unix timestamps." },
      { name: "Unix Time Converter", desc: "Convert Unix epoch timestamps to human-readable dates." },
      { name: "Lorem Ipsum Generator", desc: "Generate dummy text for layouts and placeholder designs." }
    ]
  },
  "utility-tools": {
    title: "Utility Tools",
    icon: "construction",
    tools: [
      { name: "Unit Converter", desc: "Convert length, mass, temperature, area, and volume values." },
      { name: "Currency Converter", desc: "Convert currencies using current exchange rates." },
      { name: "Age Calculator", desc: "Calculate your exact age in years, months, days, and seconds." },
      { name: "BMI Calculator", desc: "Calculate Body Mass Index based on height and weight inputs." },
      { name: "Percentage Calculator", desc: "Perform common percentage math operations quickly." },
      { name: "EMI Calculator", desc: "Calculate Equated Monthly Installments for loans." },
      { name: "Loan Calculator", desc: "Calculate total loan costs, interest fees, and payments." },
      { name: "GST Calculator", desc: "Calculate Goods and Services Tax added or subtracted." },
      { name: "Time Zone Converter", desc: "Convert times between different global zones." },
      { name: "Stopwatch", desc: "Track precise elapsed times with lap recording features." }
    ]
  }
};

export default function CategoryPage() {
  const params = useParams();
  const category = params?.category;
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
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
  }, [theme]);

  const handleToggleTheme = () => setTheme(prev => prev === "dark" ? "light" : "dark");

  const categoryData = toolsByCategory[category];

  if (!categoryData) {
    return (
      <div className="bg-background text-on-background min-h-screen flex flex-col relative overflow-x-hidden selection:bg-purple-500/30">
        <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full ambient-glow-1 blur-[130px] pointer-events-none z-[-1]"></div>
        <div className="absolute top-[40%] right-[-10%] w-[45vw] h-[45vw] rounded-full ambient-glow-2 blur-[130px] pointer-events-none z-[-1]"></div>
        
        <Navbar theme={theme} onToggleTheme={handleToggleTheme} />
        
        <main className="pt-28 pb-20 flex-grow flex flex-col items-center justify-center text-center px-6">
          <span className="material-symbols-outlined text-[64px] text-zinc-500 mb-4 select-none">warning</span>
          <h1 className="text-3xl font-black mb-3">Category Not Found</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold max-w-sm mb-6 leading-relaxed">
            The requested tools category does not exist. Please check the URL or browse all tools.
          </p>
          <Link href="/tools" className="px-6 py-2.5 rounded-xl font-bold bg-purple-600 hover:bg-purple-700 text-white text-xs transition-colors cursor-pointer">
            Back to All Tools
          </Link>
        </main>
        
        <Footer theme={theme} />
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col relative overflow-x-hidden selection:bg-purple-500/30">
      {/* Background radial glow graphics */}
      <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full ambient-glow-1 blur-[130px] pointer-events-none z-[-1]"></div>
      <div className="absolute top-[40%] right-[-10%] w-[45vw] h-[45vw] rounded-full ambient-glow-2 blur-[130px] pointer-events-none z-[-1]"></div>

      <Navbar theme={theme} onToggleTheme={handleToggleTheme} />

      <main className="pt-28 pb-20 flex-grow max-w-6xl w-full mx-auto px-6">
        
        {/* Back Link Button */}
        <div className="mb-6 animate-fade-in">
          <Link
            href="/tools"
            className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 hover:text-purple-500 dark:hover:text-purple-400 transition-colors"
          >
            <span className="material-symbols-outlined text-[15px] select-none">arrow_back</span>
            Back to all tools
          </Link>
        </div>

        {/* Category Header */}
        <section className="text-center pt-4 pb-12 relative overflow-hidden animate-fade-in">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-[80px] pointer-events-none z-[-1]"></div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 dark:bg-white/[0.02] border border-white/10 dark:border-white/5 shadow-inner mb-6 hover:border-purple-500/30 transition-colors duration-500">
            <span className="material-symbols-outlined text-[16px] text-purple-500 select-none">{categoryData.icon}</span>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              {categoryData.tools.length} Tools Available
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-none mb-4 bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-200 dark:to-zinc-500">
            {categoryData.title}
          </h1>

          <p className="max-w-xl mx-auto text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-semibold leading-relaxed">
            Collection of browser-based tools.
          </p>
        </section>

        {/* Tools Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {categoryData.tools.map((tool, idx) => {
            const cardContent = (
              <>
                {/* Decorative subtle ambient card glow */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/[0.02] rounded-full blur-[20px] pointer-events-none transition-opacity duration-300 group-hover:opacity-100"></div>

                <div className="flex items-center justify-between">
                  <h3 className="text-zinc-900 dark:text-white font-extrabold text-sm tracking-tight">{tool.name}</h3>
                  {!tool.path && (
                    <span className="text-[8px] font-extrabold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full border border-black/5 dark:border-white/5 shrink-0 select-none">
                      Placeholder
                    </span>
                  )}
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold leading-relaxed">
                  {tool.desc}
                </p>
                {tool.path && (
                  <div className="mt-auto pt-4 border-t border-border-subtle flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors">
                    Open Tool
                    <span className="material-symbols-outlined text-[12px] ml-0.5">arrow_forward</span>
                  </div>
                )}
              </>
            );

            if (tool.path) {
              return (
                <Link
                  key={idx}
                  href={`/tools/${category}/${tool.path}`}
                  className="premium-card premium-glow-hover rounded-3xl p-6 border border-white/5 flex flex-col gap-3 group relative select-none cursor-pointer"
                >
                  {cardContent}
                </Link>
              );
            }

            return (
              <div
                key={idx}
                className="premium-card rounded-3xl p-6 border border-white/5 flex flex-col gap-3 group relative select-none"
              >
                {cardContent}
              </div>
            );
          })}
        </section>

      </main>

      <Footer theme={theme} />
    </div>
  );
}
