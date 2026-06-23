"use client";

import { useState, useEffect } from "react";
import JSZip from "jszip";
import FileToolLayout, { formatBytes } from "../components/FileToolLayout";

export default function ZipFileCreatorPage() {
  const [files, setFiles] = useState([]);
  const [archiveName, setArchiveName] = useState("archive");
  const [compression, setCompression] = useState("DEFLATE"); // STORE, DEFLATE
  const [compressionLevel, setCompressionLevel] = useState(6); // 1-9
  const [processing, setProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [processedSize, setProcessedSize] = useState(null);

  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  const handleFilesUploaded = (newFiles) => {
    // Avoid duplicate files based on name + size
    setFiles((prev) => {
      const existingKeys = new Set(prev.map(f => `${f.name}-${f.size}`));
      const uniqueNew = Array.from(newFiles).filter(f => !existingKeys.has(`${f.name}-${f.size}`));
      return [...prev, ...uniqueNew];
    });
    // Reset processed state
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
      setProcessedSize(null);
    }
  };

  const handleRemoveFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
      setProcessedSize(null);
    }
  };

  const handleMoveFile = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= files.length) return;
    setFiles((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
      setProcessedSize(null);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setArchiveName("archive");
    setCompression("DEFLATE");
    setCompressionLevel(6);
    setProcessing(false);
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
    }
    setDownloadUrl(null);
    setProcessedSize(null);
  };

  const handleCreateZip = async () => {
    if (files.length === 0) return;
    setProcessing(true);

    try {
      const zip = new JSZip();
      
      // Add files in the ordered list
      files.forEach((file) => {
        // Use relative webkitRelativePath if folder directory upload was used
        const path = file.webkitRelativePath || file.name;
        zip.file(path, file);
      });

      const options = {
        type: "blob",
        compression: compression,
        compressionOptions: {
          level: compression === "DEFLATE" ? compressionLevel : undefined
        }
      };

      const contentBlob = await zip.generateAsync(options);
      
      const url = URL.createObjectURL(contentBlob);
      setDownloadUrl(url);
      setProcessedSize(contentBlob.size);
    } catch (error) {
      console.error("ZIP creation failed:", error);
      alert("Failed to create ZIP archive: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!downloadUrl) return;
    const a = document.createElement("a");
    a.href = downloadUrl;
    const name = archiveName.trim() || "archive";
    a.download = name.endsWith(".zip") ? name : `${name}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const sidebarControls = (
    <>
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Archive File Name
        </label>
        <div className="flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs">
          <input
            type="text"
            value={archiveName}
            onChange={(e) => setArchiveName(e.target.value)}
            placeholder="archive"
            className="w-full bg-transparent focus:outline-none text-zinc-800 dark:text-zinc-200 font-bold"
          />
          <span className="text-zinc-400 dark:text-zinc-500 font-extrabold ml-1">.zip</span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Compression Mode
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: "DEFLATE", label: "Deflate (Compressed)" },
            { key: "STORE", label: "Store (No Compression)" }
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setCompression(item.key);
                if (downloadUrl) {
                  URL.revokeObjectURL(downloadUrl);
                  setDownloadUrl(null);
                  setProcessedSize(null);
                }
              }}
              className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                compression === item.key
                  ? "bg-purple-500/10 text-purple-500 border-purple-500/30"
                  : "bg-white/5 dark:bg-white/[0.01] text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-800 dark:hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {compression === "DEFLATE" && (
        <div className="flex flex-col gap-1.5 mt-2">
          <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex justify-between select-none">
            <span>Compression Level</span>
            <span className="font-mono text-purple-500">{compressionLevel} (Default: 6)</span>
          </label>
          <input
            type="range"
            min="1"
            max="9"
            step="1"
            value={compressionLevel}
            onChange={(e) => {
              setCompressionLevel(parseInt(e.target.value));
              if (downloadUrl) {
                URL.revokeObjectURL(downloadUrl);
                setDownloadUrl(null);
                setProcessedSize(null);
              }
            }}
            className="w-full accent-purple-500 cursor-pointer"
          />
          <p className="text-[9px] font-semibold text-zinc-400 leading-relaxed">
            1 = Fastest compression speed, 9 = Smallest file size but slower process.
          </p>
        </div>
      )}

      {files.length > 0 && !downloadUrl && (
        <button
          onClick={handleCreateZip}
          disabled={processing}
          className="w-full mt-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-purple-600/15"
        >
          {processing ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              Packaging ZIP...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-sm">build</span>
              Compile Archive
            </>
          )}
        </button>
      )}
    </>
  );

  return (
    <FileToolLayout
      title="ZIP File Creator"
      description="Bundle and compress multiple files into a standard ZIP archive completely client-side."
      sidebarControls={sidebarControls}
      onFilesUploaded={handleFilesUploaded}
      onReset={handleReset}
      onDownload={handleDownload}
      downloadDisabled={!downloadUrl}
      downloadLabel="Download ZIP"
      uploadedFiles={files}
      processedSize={processedSize}
      processing={processing}
      allowMultiple={true}
      icon="folder_zip"
    >
      <div className="bg-white dark:bg-[#262930] rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col min-h-[350px]">
        <div className="bg-gray-50 dark:bg-zinc-800/80 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center select-none rounded-t-2xl">
          <h3 className="font-extrabold text-zinc-700 dark:text-zinc-300 text-xs">Files Queue</h3>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full border border-black/5 dark:border-white/5 select-none">
            {files.length} {files.length === 1 ? "File" : "Files"}
          </span>
        </div>

        <div className="p-4 flex-grow overflow-y-auto max-h-[360px] space-y-2">
          {files.length === 0 ? (
            <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center">
              <span className="material-symbols-outlined text-zinc-400 dark:text-zinc-600 text-[40px] mb-2 select-none">upload_file</span>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold">Your files list is empty.</p>
              <p className="text-[10px] text-zinc-400 mt-1">Drag files here or use the selector in the layout to begin.</p>
            </div>
          ) : (
            files.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/30 hover:border-purple-500/20 hover:bg-purple-500/[0.01] transition-all"
              >
                <div className="flex items-center gap-3 min-w-0 pr-4">
                  <span className="material-symbols-outlined text-zinc-400 dark:text-zinc-500 select-none">description</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">{file.name}</p>
                    <p className="text-[10px] font-semibold text-zinc-400 mt-0.5">{formatBytes(file.size)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Reordering Buttons */}
                  <button
                    onClick={() => handleMoveFile(idx, -1)}
                    disabled={idx === 0}
                    className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    title="Move Up"
                  >
                    <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                  </button>
                  <button
                    onClick={() => handleMoveFile(idx, 1)}
                    disabled={idx === files.length - 1}
                    className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    title="Move Down"
                  >
                    <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                  </button>
                  {/* Delete Button */}
                  <button
                    onClick={() => handleRemoveFile(idx)}
                    className="p-1 rounded hover:bg-red-500/10 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer ml-1"
                    title="Remove File"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </FileToolLayout>
  );
}
