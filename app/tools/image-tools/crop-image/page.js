"use client";

import { useState, useEffect, useRef } from "react";
import ImageToolLayout from "../components/ImageToolLayout";

// Helpers to load assets dynamically
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

function loadStylesheet(href) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`link[href="${href}"]`)) {
      resolve();
      return;
    }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.onload = resolve;
    link.onerror = reject;
    document.head.appendChild(link);
  });
}

export default function CropImagePage() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [libLoaded, setLibLoaded] = useState(false);
  const [cropperAspectRatio, setCropperAspectRatio] = useState("free");
  const [processing, setProcessing] = useState(false);

  const imgRef = useRef(null);
  const cropperRef = useRef(null);

  // Load CropperJS assets dynamically
  useEffect(() => {
    Promise.all([
      loadStylesheet("https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.css"),
      loadScript("https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.js")
    ])
      .then(() => setLibLoaded(true))
      .catch((err) => console.error("Failed to load CropperJS:", err));
  }, []);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      destroyCropper();
    };
  }, [previewUrl]);

  const handleFileUploaded = (uploadedFile) => {
    setFile(uploadedFile);
    setPreviewUrl(URL.createObjectURL(uploadedFile));
  };

  const handleReset = () => {
    destroyCropper();
    setFile(null);
    setPreviewUrl(null);
    setCropperAspectRatio("free");
  };

  const destroyCropper = () => {
    if (cropperRef.current) {
      cropperRef.current.destroy();
      cropperRef.current = null;
    }
  };

  // Initialize CropperJS when image mounts and library is ready
  useEffect(() => {
    if (libLoaded && previewUrl && imgRef.current && typeof window.Cropper !== "undefined") {
      destroyCropper();

      cropperRef.current = new window.Cropper(imgRef.current, {
        viewMode: 1,
        dragMode: "move",
        aspectRatio: NaN, // Default to free crop
        autoCropArea: 0.8,
        responsive: true,
        background: false,
      });
    }
  }, [libLoaded, previewUrl]);

  // Adjust aspect ratio on existing cropper instance
  const handleRatioChange = (ratioKey) => {
    setCropperAspectRatio(ratioKey);
    if (!cropperRef.current) return;

    const ratioMap = {
      free: NaN,
      "1:1": 1,
      "4:3": 4 / 3,
      "16:9": 16 / 9
    };
    cropperRef.current.setAspectRatio(ratioMap[ratioKey]);
  };

  const handleDownload = () => {
    if (!cropperRef.current) return;
    setProcessing(true);

    try {
      const croppedCanvas = cropperRef.current.getCroppedCanvas();
      if (!croppedCanvas) {
        setProcessing(false);
        return;
      }

      croppedCanvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          const extension = file.name.substring(file.name.lastIndexOf(".") + 1);
          const baseName = file.name.substring(0, file.name.lastIndexOf("."));
          a.download = `${baseName}_cropped.${extension}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
        setProcessing(false);
      }, file.type);
    } catch (err) {
      console.error("Cropping failed:", err);
      setProcessing(false);
    }
  };

  const sidebarControls = (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
        Aspect Ratio Preset
      </label>
      <div className="grid grid-cols-2 gap-2">
        {[
          { key: "free", label: "Free Crop" },
          { key: "1:1", label: "Square (1:1)" },
          { key: "4:3", label: "Classic (4:3)" },
          { key: "16:9", label: "Widescreen (16:9)" }
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => handleRatioChange(item.key)}
            className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
              cropperAspectRatio === item.key
                ? "bg-purple-500/10 text-purple-500 border-purple-500/30"
                : "bg-white/5 dark:bg-white/[0.01] text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-800 dark:hover:text-white"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <p className="text-[9px] font-semibold text-zinc-400 leading-relaxed mt-1">
        Drag coordinates and handles on the preview area to adjust your crop zone boundary.
      </p>
    </div>
  );

  return (
    <ImageToolLayout
      title="Crop Image"
      description="Selectively crop parts of your image with free-form adjustments or set aspect ratios (1:1, 4:3, 16:9) entirely in-browser."
      sidebarControls={sidebarControls}
      onFileUploaded={handleFileUploaded}
      onReset={handleReset}
      onDownload={handleDownload}
      downloadDisabled={!file || !libLoaded}
      originalFile={file}
      processing={processing}
    >
      {/* Workspace Preview */}
      <div className="bg-white dark:bg-[#262930] rounded-2xl shadow-sm overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between h-[380px] w-full">
        <div className="bg-gray-50 dark:bg-zinc-800/80 px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center select-none">
          <h3 className="font-extrabold text-zinc-700 dark:text-zinc-300 text-xs">Crop Workspace</h3>
          <span className="text-[10px] font-mono text-zinc-500">CropperJS Active</span>
        </div>
        <div className="p-4 flex items-center justify-center flex-grow bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2Y5ZmRmZCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjJmMmYyIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmMmYyZjIiLz48L3N2Zz4=')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMjYyOTMwIi8+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMWQxZjI0Ii8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMxZDFmMjQiLz48L3N2Zz4=')] overflow-hidden relative">
          {!libLoaded ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mb-2"></div>
              <p className="text-[11px] font-semibold text-zinc-400">Loading cropper assets...</p>
            </div>
          ) : (
            <div className="max-h-full max-w-full flex items-center justify-center">
              {/* CropperJS operates on this image tag */}
              <img 
                ref={imgRef} 
                src={previewUrl} 
                className="max-h-[300px] max-w-full block" 
                alt="Workspace" 
                style={{ visibility: "hidden" }} // Hide until cropper takes over
              />
            </div>
          )}
        </div>
      </div>
    </ImageToolLayout>
  );
}
