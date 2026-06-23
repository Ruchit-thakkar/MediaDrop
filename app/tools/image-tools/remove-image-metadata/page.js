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

export default function RemoveMetadataPage() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [cleanUrl, setCleanUrl] = useState(null);
  const [cleanSize, setCleanSize] = useState(null);
  const [libLoaded, setLibLoaded] = useState(false);
  const [metadataFound, setMetadataFound] = useState(null); // Obj containing parsed EXIF
  const [processing, setProcessing] = useState(false);

  // Load exifr dynamically
  useEffect(() => {
    loadScript("https://cdn.jsdelivr.net/npm/exifr@7.1.3/dist/lite.umd.js")
      .then(() => setLibLoaded(true))
      .catch((err) => console.error("Failed to load exifr:", err));
  }, []);

  // Clean up previewUrl safely on change or unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Clean up cleanUrl safely on change or unmount
  useEffect(() => {
    return () => {
      if (cleanUrl) URL.revokeObjectURL(cleanUrl);
    };
  }, [cleanUrl]);

  const handleFileUploaded = (uploadedFile) => {
    setFile(uploadedFile);
    setPreviewUrl(URL.createObjectURL(uploadedFile));
    setCleanUrl(null);
    setCleanSize(null);
    setMetadataFound(null);
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setCleanUrl(null);
    setCleanSize(null);
    setMetadataFound(null);
  };

  const cleanMetadata = () => {
    if (!file || !previewUrl) return;
    setProcessing(true);

    const img = new Image();
    img.src = previewUrl;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      // Draw image onto canvas - strips all binary header metadata naturally
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          setCleanUrl(URL.createObjectURL(blob));
          setCleanSize(blob.size);
        }
        setProcessing(false);
      }, file.type);
    };
    img.onerror = () => setProcessing(false);
  };

  // Parse EXIF metadata when library loads and file is uploaded
  useEffect(() => {
    if (file && libLoaded && typeof window.exifr !== "undefined" && metadataFound === null) {
      window.exifr.parse(file)
        .then((exif) => {
          setMetadataFound(exif || {});
        })
        .catch(() => {
          setMetadataFound({});
        });
    } else if (file && !libLoaded && metadataFound === null) {
      // fallback in case script loading failed or delayed
      const timeout = setTimeout(() => {
        if (metadataFound === null) setMetadataFound({});
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [file, libLoaded, metadataFound]);

  // Automatically trigger EXIF stripping when file mounts
  useEffect(() => {
    if (file && previewUrl) {
      cleanMetadata();
    }
  }, [file, previewUrl]);

  const handleDownload = () => {
    if (!cleanUrl) return;
    const a = document.createElement("a");
    a.href = cleanUrl;
    const extension = file.name.substring(file.name.lastIndexOf(".") + 1);
    const baseName = file.name.substring(0, file.name.lastIndexOf("."));
    a.download = `${baseName}_cleaned.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Convert metadata key-value into a nice checklist
  const renderMetadataList = () => {
    if (metadataFound === null) {
      return <div className="text-[10px] text-zinc-400 font-bold select-none animate-pulse">Scanning file metadata...</div>;
    }

    if (Object.keys(metadataFound).length === 0) {
      return (
        <div className="flex items-center gap-1.5 text-[10px] text-green-500 font-bold bg-green-500/5 border border-green-500/10 px-3 py-2 rounded-xl select-none">
          <span className="material-symbols-outlined text-[15px]">verified</span>
          No EXIF/GPS Metadata found.
        </div>
      );
    }

    // Pick top key metrics to display
    const keysToDisplay = ["Make", "Model", "Software", "DateTimeOriginal", "latitude", "longitude", "LensModel", "ExifImageWidth"];
    const activeKeys = Object.keys(metadataFound).filter(k => keysToDisplay.includes(k) || typeof metadataFound[k] === "string");

    return (
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-500 select-none">
          Detected EXIF Headers
        </span>
        <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar pr-1">
          {activeKeys.map((key) => {
            let val = metadataFound[key];
            if (typeof val === "object" && val instanceof Date) {
              val = val.toLocaleString();
            } else if (typeof val === "number" && (key === "latitude" || key === "longitude")) {
              val = val.toFixed(5);
            }
            return (
              <div key={key} className="flex justify-between items-center text-[10px] font-bold border-b border-border-subtle pb-1 select-none">
                <span className="text-zinc-500 capitalize">{key.replace("DateTimeOriginal", "Date Taken")}</span>
                <span className="font-mono text-zinc-700 dark:text-zinc-300 truncate max-w-[120px]">{String(val)}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const sidebarControls = (
    <div className="flex flex-col gap-4">
      {renderMetadataList()}

      <div className="p-3 bg-zinc-50 dark:bg-white/[0.01] border border-zinc-200 dark:border-zinc-800 rounded-xl text-[9px] font-semibold text-zinc-400 leading-relaxed select-none">
        <span className="font-extrabold text-purple-500 block mb-1">Privacy Sandbox</span>
        This tool cleanses camera model, coordinates (GPS), lens details, editing software tags, and timestamps. Processing occurs 100% locally.
      </div>
    </div>
  );

  return (
    <ImageToolLayout
      title="Remove Image Metadata"
      description="Protect your privacy by stripping EXIF header data, GPS coordinates, and camera models locally from your images."
      sidebarControls={sidebarControls}
      onFileUploaded={handleFileUploaded}
      onReset={handleReset}
      onDownload={handleDownload}
      downloadDisabled={!cleanUrl}
      originalFile={file}
      processedUrl={cleanUrl}
      processedSize={cleanSize}
      processing={processing}
    >
      {/* Workspace Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full items-stretch">
        {/* Original Image Preview */}
        <div className="bg-white dark:bg-[#262930] rounded-2xl shadow-sm overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between h-[380px]">
          <div className="bg-gray-50 dark:bg-zinc-800/80 px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center select-none">
            <h3 className="font-extrabold text-zinc-700 dark:text-zinc-300 text-xs">Original (Contains Headers)</h3>
            <span className="text-[10px] font-mono text-zinc-500">Source</span>
          </div>
          <div className="p-4 flex items-center justify-center flex-grow bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2Y5ZmRmZCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjJmMmYyIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmMmYyZjIiLz48L3N2Zz4=')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMjYyOTMwIi8+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMWQxZjI0Ii8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMxZDFmMjQiLz48L3N2Zz4=')] overflow-hidden">
            <img src={previewUrl} className="max-h-full max-w-full object-contain rounded shadow-sm" alt="Original" />
          </div>
        </div>

        {/* Cleaned Image Preview */}
        <div className="bg-white dark:bg-[#262930] rounded-2xl shadow-md overflow-hidden border border-purple-500/20 flex flex-col justify-between h-[380px]">
          <div className="bg-purple-50 dark:bg-purple-950/20 px-4 py-2.5 border-b border-purple-500/20 flex justify-between items-center select-none">
            <h3 className="font-extrabold text-purple-600 dark:text-purple-400 text-xs">Cleaned Output</h3>
            <span className="text-[10px] font-mono text-purple-500">EXIF Stripped</span>
          </div>
          <div className="p-4 flex items-center justify-center flex-grow bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2Y5ZmRmZCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjJmMmYyIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmMmYyZjIiLz48L3N2Zz4=')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMjYyOTMwIi8+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMWQxZjI0Ii8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMxZDFmMjQiLz48L3N2Zz4=')] overflow-hidden">
            {processing ? (
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-3"></div>
                <p className="text-xs font-semibold text-purple-500">Stripping metadata...</p>
              </div>
            ) : cleanUrl ? (
              <img src={cleanUrl} className="max-h-full max-w-full object-contain rounded shadow-sm animate-fade-in" alt="Cleaned" />
            ) : (
              <p className="text-xs font-semibold text-zinc-400">Processing...</p>
            )}
          </div>
        </div>
      </div>
    </ImageToolLayout>
  );
}
