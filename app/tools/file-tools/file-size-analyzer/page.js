"use client";

import { useState } from "react";
import FileToolLayout, { formatBytes } from "../components/FileToolLayout";

export default function FileSizeAnalyzerPage() {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFilesUploaded = (newFiles) => {
    setFiles((prev) => {
      const existingKeys = new Set(prev.map(f => `${f.name}-${f.size}`));
      const uniqueNew = Array.from(newFiles).filter(f => !existingKeys.has(`${f.name}-${f.size}`));
      return [...prev, ...uniqueNew];
    });
    if (!selectedFile && newFiles.length > 0) {
      setSelectedFile(newFiles[0]);
    }
  };

  const handleRemoveFile = (index) => {
    setFiles((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      if (selectedFile === prev[index]) {
        setSelectedFile(filtered[0] || null);
      }
      return filtered;
    });
  };

  const handleReset = () => {
    setFiles([]);
    setSelectedFile(null);
  };

  // Calculations
  const totalSize = files.reduce((acc, f) => acc + (f.size || 0), 0);
  const fileCount = files.length;
  
  const sortedFiles = [...files].sort((a, b) => b.size - a.size);
  const largestFile = sortedFiles[0] || null;
  const smallestFile = sortedFiles[sortedFiles.length - 1] || null;

  // Unit formats
  const getUnitBreakdown = (bytes) => {
    if (bytes === undefined || bytes === null) return null;
    return {
      bytes: bytes.toLocaleString() + " B",
      kb: (bytes / 1024).toFixed(3) + " KB",
      mb: (bytes / (1024 * 1024)).toFixed(3) + " MB",
      gb: (bytes / (1024 * 1024 * 1024)).toFixed(6) + " GB"
    };
  };

  const selectedBreakdown = selectedFile ? getUnitBreakdown(selectedFile.size) : null;

  const sidebarControls = (
    <>
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Selected File Details
        </label>
        {selectedFile ? (
          <div className="bg-purple-500/[0.02] border border-purple-500/20 rounded-2xl p-4 space-y-4">
            <div className="flex flex-col gap-1 select-none">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400">File Name</span>
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 break-all">{selectedFile.name}</span>
            </div>

            <div className="flex flex-col gap-1 select-none">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400">MIME Type</span>
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">{selectedFile.type || "unknown"}</span>
            </div>

            <div className="border-t border-border-subtle pt-3 space-y-2 select-none">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 block mb-1">Size Breakdown</span>
              
              <div className="flex justify-between text-[11px] font-semibold text-zinc-500">
                <span>Bytes:</span>
                <span className="font-mono text-zinc-850 dark:text-zinc-250">{selectedBreakdown?.bytes}</span>
              </div>
              <div className="flex justify-between text-[11px] font-semibold text-zinc-500">
                <span>Kilobytes (KB):</span>
                <span className="font-mono text-zinc-850 dark:text-zinc-250">{selectedBreakdown?.kb}</span>
              </div>
              <div className="flex justify-between text-[11px] font-semibold text-zinc-500">
                <span>Megabytes (MB):</span>
                <span className="font-mono text-zinc-850 dark:text-zinc-250">{selectedBreakdown?.mb}</span>
              </div>
              <div className="flex justify-between text-[11px] font-semibold text-zinc-500">
                <span>Gigabytes (GB):</span>
                <span className="font-mono text-zinc-850 dark:text-zinc-250">{selectedBreakdown?.gb}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-center select-none text-[10px] font-bold text-zinc-400">
            Select a file in the queue to view full sizing metrics.
          </div>
        )}
      </div>
    </>
  );

  return (
    <FileToolLayout
      title="File Size Analyzer"
      description="Inspect file sizes in deep unit details and compare file structures with visual proportions."
      sidebarControls={sidebarControls}
      onFilesUploaded={handleFilesUploaded}
      onReset={handleReset}
      uploadedFiles={files}
      allowMultiple={true}
      icon="analytics"
    >
      {files.length > 0 && (
        /* Sizing Summary Cards */
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#262930] p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between select-none">
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Total Files</span>
            <span className="text-xl font-black mt-1 text-zinc-800 dark:text-white">{fileCount}</span>
          </div>
          <div className="bg-white dark:bg-[#262930] p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between select-none">
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Total Volume</span>
            <span className="text-xl font-black mt-1 text-purple-500">{formatBytes(totalSize)}</span>
          </div>
          <div className="bg-white dark:bg-[#262930] p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between select-none">
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Largest File</span>
            <span className="text-xs font-bold mt-2 truncate text-zinc-800 dark:text-zinc-200" title={largestFile?.name}>
              {largestFile?.name}
            </span>
            <span className="text-[10px] font-mono font-semibold text-zinc-450 mt-0.5">{formatBytes(largestFile?.size)}</span>
          </div>
          <div className="bg-white dark:bg-[#262930] p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between select-none">
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Smallest File</span>
            <span className="text-xs font-bold mt-2 truncate text-zinc-800 dark:text-zinc-200" title={smallestFile?.name}>
              {smallestFile?.name}
            </span>
            <span className="text-[10px] font-mono font-semibold text-zinc-450 mt-0.5">{formatBytes(smallestFile?.size)}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Queue / Files Table */}
        <div className="bg-white dark:bg-[#262930] rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col min-h-[350px]">
          <div className="bg-gray-50 dark:bg-zinc-800/80 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center select-none rounded-t-2xl">
            <h3 className="font-extrabold text-zinc-700 dark:text-zinc-300 text-xs">Uploaded Files</h3>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">Comparison Queue</span>
          </div>

          <div className="p-4 flex-grow overflow-y-auto max-h-[360px] space-y-2">
            {files.length === 0 ? (
              <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-zinc-400 dark:text-zinc-600 text-[40px] mb-2 select-none">analytics</span>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold">Your analyzer queue is empty.</p>
                <p className="text-[10px] text-zinc-400 mt-1">Upload multiple files to view detailed analysis and proportions.</p>
              </div>
            ) : (
              files.map((file, idx) => {
                const pct = totalSize > 0 ? (file.size / totalSize) * 100 : 0;
                return (
                  <div
                    key={`${file.name}-${idx}`}
                    onClick={() => setSelectedFile(file)}
                    className={`flex flex-col p-3 rounded-xl border transition-all cursor-pointer select-none ${
                      selectedFile === file
                        ? "border-purple-500 bg-purple-500/[0.02]"
                        : "border-zinc-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/30 hover:border-purple-500/20"
                    }`}
                  >
                    <div className="flex items-center justify-between min-w-0">
                      <div className="flex items-center gap-3 min-w-0 pr-4">
                        <span className="material-symbols-outlined text-zinc-400 dark:text-zinc-500 select-none">description</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">{file.name}</p>
                          <p className="text-[10px] font-semibold text-zinc-400 mt-0.5">{file.type || "unknown"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono font-bold text-zinc-800 dark:text-zinc-200">{formatBytes(file.size)}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile(idx);
                          }}
                          className="p-1 rounded hover:bg-red-500/10 text-zinc-450 hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar of total weight */}
                    <div className="mt-2.5 w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                      <span>Proportion Weight</span>
                      <span>{pct.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Visual size chart representation */}
        <div className="bg-white dark:bg-[#262930] rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col min-h-[350px]">
          <div className="bg-gray-50 dark:bg-zinc-800/80 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center select-none rounded-t-2xl">
            <h3 className="font-extrabold text-zinc-700 dark:text-zinc-300 text-xs">Visual Weight Distribution</h3>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">SVG Graph</span>
          </div>

          <div className="p-6 flex-grow flex flex-col justify-center items-center">
            {files.length === 0 ? (
              <p className="text-xs font-semibold text-zinc-400 select-none">No data available for plotting.</p>
            ) : (
              <div className="w-full flex flex-col justify-between h-full min-h-[260px]">
                {/* Horizontal bar comparisons */}
                <div className="space-y-4 flex-grow flex flex-col justify-center">
                  {sortedFiles.slice(0, 5).map((file, idx) => {
                    const pct = totalSize > 0 ? (file.size / totalSize) * 100 : 0;
                    return (
                      <div key={idx} className="flex flex-col gap-1 w-full">
                        <div className="flex justify-between text-[10px] font-bold text-zinc-650 dark:text-zinc-350 select-none">
                          <span className="truncate max-w-[180px]">{file.name}</span>
                          <span className="font-mono text-zinc-800 dark:text-zinc-200">{pct.toFixed(1)}% ({formatBytes(file.size)})</span>
                        </div>
                        <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-3.5 rounded-lg overflow-hidden flex">
                          <div
                            className={`h-full rounded-lg transition-all duration-500 bg-gradient-to-r ${
                              idx === 0 ? "from-purple-500 to-indigo-500" :
                              idx === 1 ? "from-indigo-500 to-blue-500" :
                              idx === 2 ? "from-blue-500 to-cyan-500" :
                              idx === 3 ? "from-cyan-500 to-teal-500" :
                              "from-zinc-400 to-zinc-500"
                            }`}
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                  {files.length > 5 && (
                    <div className="text-[10px] font-bold text-zinc-400 text-center select-none pt-2">
                      + {files.length - 5} more files are uploaded in the analyzer queue
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </FileToolLayout>
  );
}
