"use client";

import { useState } from "react";
import FileToolLayout, { formatBytes } from "../components/FileToolLayout";

export default function DuplicateFileDetectorPage() {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [duplicateGroups, setDuplicateGroups] = useState([]);
  const [hasScanned, setHasScanned] = useState(false);

  const handleFilesUploaded = (newFiles) => {
    setFiles((prev) => {
      const existingKeys = new Set(prev.map(f => `${f.name}-${f.size}`));
      const uniqueNew = Array.from(newFiles).filter(f => !existingKeys.has(`${f.name}-${f.size}`));
      return [...prev, ...uniqueNew];
    });
    setDuplicateGroups([]);
    setHasScanned(false);
  };

  const handleRemoveFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setDuplicateGroups([]);
    setHasScanned(false);
  };

  const handleReset = () => {
    setFiles([]);
    setProcessing(false);
    setStatusText("");
    setDuplicateGroups([]);
    setHasScanned(false);
  };

  // Run native SHA-256 hashing and find duplicate groups
  const handleDetectDuplicates = async () => {
    if (files.length < 2) return;
    setProcessing(true);
    setDuplicateGroups([]);
    
    try {
      const hashMap = {}; // hash -> array of file objects
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setStatusText(`Hashing file ${i + 1}/${files.length}: ${file.name}...`);
        
        const arrayBuffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        if (!hashMap[hashHex]) {
          hashMap[hashHex] = [];
        }
        hashMap[hashHex].push({
          file: file,
          index: i
        });
      }

      setStatusText("Analyzing groups...");
      // Filter out hashes that only have one file (no duplicates)
      const groups = Object.keys(hashMap)
        .filter(hash => hashMap[hash].length > 1)
        .map(hash => ({
          hash: hash,
          items: hashMap[hash],
          size: hashMap[hash][0].file.size
        }));

      setDuplicateGroups(groups);
      setHasScanned(true);
    } catch (error) {
      console.error("Scanning failed:", error);
      alert("Failed to complete duplicate scan: " + error.message);
    } finally {
      setProcessing(false);
      setStatusText("");
    }
  };

  // Reclaimable space calculation
  const totalWastedSpace = duplicateGroups.reduce((acc, group) => {
    const duplicatesCount = group.items.length - 1;
    return acc + (group.size * duplicatesCount);
  }, 0);

  const sidebarControls = (
    <>
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Scan Statistics
        </label>
        {hasScanned ? (
          <div className="bg-purple-500/[0.02] border border-purple-500/20 rounded-2xl p-4 space-y-3 select-none">
            <div className="flex justify-between text-xs font-bold text-zinc-550">
              <span>Duplicate Groups:</span>
              <span className="text-purple-500">{duplicateGroups.length}</span>
            </div>
            
            <div className="flex justify-between text-xs font-bold text-zinc-550">
              <span>Duplicate Files:</span>
              <span className="text-zinc-800 dark:text-zinc-200">
                {duplicateGroups.reduce((acc, g) => acc + g.items.length, 0)}
              </span>
            </div>

            <div className="border-t border-border-subtle pt-3 flex flex-col gap-1">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400">Reclaimable Space</span>
              <span className="text-lg font-black text-emerald-500">{formatBytes(totalWastedSpace)}</span>
              <p className="text-[9px] font-semibold text-zinc-400 leading-relaxed mt-0.5">
                Total size of redundant files that can be safely discarded.
              </p>
            </div>
          </div>
        ) : (
          <div className="border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-center select-none text-[10px] font-bold text-zinc-400">
            Scan files to display duplicate statistics.
          </div>
        )}
      </div>

      {files.length >= 2 && !hasScanned && (
        <button
          onClick={handleDetectDuplicates}
          disabled={processing}
          className="w-full mt-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-purple-600/15"
        >
          {processing ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              Analyzing...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-sm">troubleshoot</span>
              Scan Duplicates
            </>
          )}
        </button>
      )}
    </>
  );

  return (
    <FileToolLayout
      title="Duplicate File Detector"
      description="Scan and identify identical files by generating fast cryptographic SHA-256 hashes completely inside your browser."
      sidebarControls={sidebarControls}
      onFilesUploaded={handleFilesUploaded}
      onReset={handleReset}
      uploadedFiles={files}
      allowMultiple={true}
      icon="difference"
    >
      <div className="grid grid-cols-1 gap-6">
        {processing && statusText !== "" && (
          <div className="bg-white dark:bg-[#262930] rounded-2xl p-8 shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center text-center select-none min-h-[220px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-3"></div>
            <p className="text-xs font-semibold text-purple-500">{statusText}</p>
          </div>
        )}

        {/* Scan Results */}
        {hasScanned && !processing && (
          <div className="bg-white dark:bg-[#262930] rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col min-h-[250px]">
            <div className="bg-gray-50 dark:bg-zinc-800/80 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center select-none rounded-t-2xl">
              <h3 className="font-extrabold text-zinc-700 dark:text-zinc-300 text-xs">Duplicate Results</h3>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
                {duplicateGroups.length} Redundant Groups
              </span>
            </div>

            <div className="p-4 overflow-y-auto max-h-[380px] space-y-4">
              {duplicateGroups.length === 0 ? (
                <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-center">
                  <span className="material-symbols-outlined text-emerald-500 text-[40px] mb-2 select-none">verified</span>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold">No duplicate files found!</p>
                  <p className="text-[10px] text-zinc-400 mt-1">All uploaded files are unique.</p>
                </div>
              ) : (
                duplicateGroups.map((group, gIdx) => (
                  <div key={gIdx} className="border border-purple-500/10 dark:border-purple-500/5 bg-purple-500/[0.01] rounded-2xl p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border-subtle pb-2 select-none gap-1">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-extrabold uppercase tracking-widest text-zinc-400">SHA-256 Hash Group</span>
                        <span className="text-[10px] font-mono text-purple-500 truncate max-w-[280px]" title={group.hash}>{group.hash}</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-zinc-800 dark:text-zinc-200">
                        {formatBytes(group.size)} each
                      </span>
                    </div>

                    <div className="space-y-2">
                      {group.items.map((item, itemIdx) => (
                        <div key={itemIdx} className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800">
                          <div className="flex items-center gap-3 min-w-0 pr-4">
                            <span className="material-symbols-outlined text-zinc-400 dark:text-zinc-500 select-none text-[18px]">description</span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">{item.file.name}</p>
                              <p className="text-[9px] font-semibold text-zinc-400 mt-0.5">Type: {item.file.type || "unknown"}</p>
                            </div>
                          </div>
                          
                          {itemIdx > 0 && (
                            <span className="text-[8px] font-extrabold uppercase tracking-widest bg-red-500/10 text-red-500 px-2 py-0.5 border border-red-500/20 rounded-full select-none shrink-0">
                              Duplicate
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Files Table (Pre-Scan Queue) */}
        {!hasScanned && !processing && (
          <div className="bg-white dark:bg-[#262930] rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col min-h-[350px]">
            <div className="bg-gray-50 dark:bg-zinc-800/80 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center select-none rounded-t-2xl">
              <h3 className="font-extrabold text-zinc-700 dark:text-zinc-300 text-xs">Files Queue</h3>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full border border-black/5 dark:border-white/5 select-none">
                {files.length} {files.length === 1 ? "File" : "Files"}
              </span>
            </div>

            <div className="p-4 flex-grow overflow-y-auto max-h-[360px] space-y-2">
              {files.length === 0 ? (
                <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center">
                  <span className="material-symbols-outlined text-zinc-400 dark:text-zinc-600 text-[40px] mb-2 select-none">difference</span>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold">Your queue is empty.</p>
                  <p className="text-[10px] text-zinc-400 mt-1">Upload multiple files to run duplicate checking.</p>
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

                    <button
                      onClick={() => handleRemoveFile(idx)}
                      className="p-1 rounded hover:bg-red-500/10 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </FileToolLayout>
  );
}
