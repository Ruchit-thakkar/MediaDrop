"use client";

import { useState, useEffect } from "react";
import ImageToolLayout from "../components/ImageToolLayout";

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

export default function HeicToJpgPage() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null); // original HEIC placeholder icon or name
  const [jpgUrl, setJpgUrl] = useState(null);
  const [jpgSize, setJpgSize] = useState(null);
  const [libLoaded, setLibLoaded] = useState(false);
  const [quality, setQuality] = useState(0.85); // 0 to 1
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Load heic2any dynamic script from CDN
  useEffect(() => {
    loadScript("https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js")
      .then(() => setLibLoaded(true))
      .catch((err) => console.error("Failed to load heic2any:", err));
  }, []);

  // Clean up previewUrl safely on change or unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Clean up jpgUrl safely on change or unmount
  useEffect(() => {
    return () => {
      if (jpgUrl) URL.revokeObjectURL(jpgUrl);
    };
  }, [jpgUrl]);

  const handleFileUploaded = (uploadedFile) => {
    setErrorMsg("");
    setFile(uploadedFile);
    setPreviewUrl(URL.createObjectURL(uploadedFile));
    setJpgUrl(null);
    setJpgSize(null);
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setJpgUrl(null);
    setJpgSize(null);
    setErrorMsg("");
  };

  const convertHeic = () => {
    if (!file || !libLoaded) return;
    setProcessing(true);
    setErrorMsg("");

    if (typeof window.heic2any === "undefined") {
      setErrorMsg("HEIC converter library failed to load.");
      setProcessing(false);
      return;
    }

    window.heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: quality
    })
      .then((result) => {
        // heic2any can return a single blob or array of blobs
        const resultBlob = Array.isArray(result) ? result[0] : result;
        const img = new Image();
        img.src = URL.createObjectURL(resultBlob);
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          ctx.drawImage(img, 0, 0);

          canvas.toBlob((blob) => {
            if (blob) {
              setJpgUrl(URL.createObjectURL(blob));
              setJpgSize(blob.size);
            }
            setProcessing(false);
            URL.revokeObjectURL(img.src);
          }, "image/jpeg", quality);
        };
      })
      .catch((err) => {
        console.error("HEIC conversion failed:", err);
        setErrorMsg("Failed to convert HEIC file. Make sure it is a valid HEIC image.");
        setProcessing(false);
      });
  };

  // Re-run conversion when file or quality or libLoaded is changed
  useEffect(() => {
    if (file && libLoaded) {
      convertHeic();
    }
  }, [file, quality, libLoaded]);

  const handleDownload = () => {
    if (!jpgUrl) return;
    const a = document.createElement("a");
    a.href = jpgUrl;
    const baseName = file.name.substring(0, file.name.lastIndexOf("."));
    a.download = `${baseName}_converted.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const sidebarControls = (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex justify-between">
        <span>JPEG Output Quality</span>
        <span className="font-mono text-purple-500">{Math.round(quality * 100)}%</span>
      </label>
      <input
        type="range"
        min="0.5"
        max="1"
        step="0.05"
        value={quality}
        onChange={(e) => setQuality(parseFloat(e.target.value))}
        className="w-full accent-purple-500 cursor-pointer"
      />
    </div>
  );

  return (
    <ImageToolLayout
      title="HEIC to JPG Converter"
      description="Convert Apple HEIC photos to compatible standard JPG formats locally in your browser."
      sidebarControls={sidebarControls}
      onFileUploaded={handleFileUploaded}
      onReset={handleReset}
      onDownload={handleDownload}
      downloadDisabled={!jpgUrl}
      originalFile={file}
      processedUrl={jpgUrl}
      processedSize={jpgSize}
      processing={processing}
    >
      {/* Workspace Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full items-stretch">
        {/* Original Image Preview */}
        <div className="bg-white dark:bg-[#262930] rounded-2xl shadow-sm overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between h-[380px]">
          <div className="bg-gray-50 dark:bg-zinc-800/80 px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center select-none">
            <h3 className="font-extrabold text-zinc-700 dark:text-zinc-300 text-xs">Original HEIC Source</h3>
            <span className="text-[10px] font-mono text-zinc-500">HEIC/HEIF</span>
          </div>
          <div className="p-4 flex flex-col items-center justify-center flex-grow bg-gray-50/50 dark:bg-zinc-950/20">
            <span className="material-symbols-outlined text-[64px] text-zinc-400 mb-2 select-none">image_search</span>
            <p className="text-[11px] font-extrabold text-zinc-800 dark:text-zinc-200 uppercase tracking-widest">{file?.name}</p>
            <p className="text-[9px] font-semibold text-zinc-400 mt-1 select-none">HEIC files cannot be displayed directly by standard browsers.</p>
          </div>
        </div>

        {/* Converted Image Preview */}
        <div className="bg-white dark:bg-[#262930] rounded-2xl shadow-md overflow-hidden border border-purple-500/20 flex flex-col justify-between h-[380px]">
          <div className="bg-purple-50 dark:bg-purple-950/20 px-4 py-2.5 border-b border-purple-500/20 flex justify-between items-center select-none">
            <h3 className="font-extrabold text-purple-600 dark:text-purple-400 text-xs">JPEG Output</h3>
            <span className="text-[10px] font-mono text-purple-500">JPG</span>
          </div>
          <div className="p-4 flex items-center justify-center flex-grow bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2Y5ZmRmZCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjJmMmYyIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmMmYyZjIiLz48L3N2Zz4=')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMjYyOTMwIi8+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMWQxZjI0Ii8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMxZDFmMjQiLz48L3N2Zz4=')] overflow-hidden">
            {processing ? (
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-3"></div>
                <p className="text-xs font-semibold text-purple-500">Decoding HEIC image locally...</p>
              </div>
            ) : errorMsg ? (
              <div className="flex flex-col items-center justify-center p-4">
                <span className="material-symbols-outlined text-red-500 text-3xl mb-2">warning</span>
                <p className="text-zinc-500 dark:text-zinc-400 text-[11px] font-semibold text-center">{errorMsg}</p>
              </div>
            ) : jpgUrl ? (
              <img src={jpgUrl} className="max-h-full max-w-full object-contain rounded shadow-sm animate-fade-in" alt="Converted" />
            ) : (
              <p className="text-xs font-semibold text-zinc-400">Processing...</p>
            )}
          </div>
        </div>
      </div>
    </ImageToolLayout>
  );
}
