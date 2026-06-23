"use client";

import { useState, useEffect } from "react";
import FileToolLayout from "../components/FileToolLayout";

// Script loader for Spark-MD5 library
const loadSparkMD5 = () => {
  return new Promise((resolve, reject) => {
    if (window.SparkMD5) return resolve();
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/spark-md5/3.0.2/spark-md5.min.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Spark-MD5"));
    document.body.appendChild(script);
  });
};

export default function HashGeneratorPage() {
  const [file, setFile] = useState(null);
  const [selectedAlgorithms, setSelectedAlgorithms] = useState({
    MD5: true,
    "SHA-1": true,
    "SHA-256": true,
    "SHA-512": true
  });
  const [hashes, setHashes] = useState({
    MD5: "",
    "SHA-1": "",
    "SHA-256": "",
    "SHA-512": ""
  });
  const [processing, setProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [copiedKey, setCopiedKey] = useState(null);

  // Trigger calculation when file changes or when algorithms selection changes
  useEffect(() => {
    if (!file) return;

    let active = true;
    const calculateHashes = async () => {
      setProcessing(true);
      setHashes({ MD5: "", "SHA-1": "", "SHA-256": "", "SHA-512": "" });

      try {
        const arrayBuffer = await file.arrayBuffer();

        // 1. Calculate MD5
        if (selectedAlgorithms.MD5 && active) {
          setStatusText("Calculating MD5...");
          await loadSparkMD5();
          if (active) {
            const spark = new window.SparkMD5.ArrayBuffer();
            spark.append(arrayBuffer);
            const md5Hex = spark.end();
            setHashes((prev) => ({ ...prev, MD5: md5Hex }));
          }
        }

        // 2. Calculate SHA-1
        if (selectedAlgorithms["SHA-1"] && active) {
          setStatusText("Calculating SHA-1...");
          const hashBuffer = await crypto.subtle.digest("SHA-1", arrayBuffer);
          if (active) {
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const sha1Hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            setHashes((prev) => ({ ...prev, "SHA-1": sha1Hex }));
          }
        }

        // 3. Calculate SHA-256
        if (selectedAlgorithms["SHA-256"] && active) {
          setStatusText("Calculating SHA-256...");
          const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
          if (active) {
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const sha256Hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            setHashes((prev) => ({ ...prev, "SHA-256": sha256Hex }));
          }
        }

        // 4. Calculate SHA-512
        if (selectedAlgorithms["SHA-512"] && active) {
          setStatusText("Calculating SHA-512...");
          const hashBuffer = await crypto.subtle.digest("SHA-512", arrayBuffer);
          if (active) {
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const sha512Hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            setHashes((prev) => ({ ...prev, "SHA-512": sha512Hex }));
          }
        }

      } catch (error) {
        console.error("Hashing calculation failed:", error);
        alert("Failed to compute file hashes: " + error.message);
      } finally {
        if (active) {
          setProcessing(false);
          setStatusText("");
        }
      }
    };

    calculateHashes();

    return () => {
      active = false;
    };
  }, [file, selectedAlgorithms]);

  const handleFileUploaded = (uploadedFile) => {
    setFile(uploadedFile);
  };

  const handleReset = () => {
    setFile(null);
    setHashes({ MD5: "", "SHA-1": "", "SHA-256": "", "SHA-512": "" });
    setProcessing(false);
    setStatusText("");
    setCopiedKey(null);
  };

  const handleCopy = (key, val) => {
    if (!val) return;
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const handleDownloadReport = () => {
    if (!file) return;

    let report = `FILE HASH REPORT\n`;
    report += `=====================\n`;
    report += `File Name:    ${file.name}\n`;
    report += `File Size:    ${file.size.toLocaleString()} Bytes\n`;
    report += `File Type:    ${file.type || "unknown"}\n`;
    report += `Last Modified: ${new Date(file.lastModified).toISOString()}\n`;
    report += `=====================\n\n`;

    Object.keys(hashes).forEach((alg) => {
      if (selectedAlgorithms[alg]) {
        report += `${alg.padEnd(8)}: ${hashes[alg] || "Calculating..."}\n`;
      }
    });

    report += `\nGenerated locally via MediaDrop client-side Hash Generator.`;

    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${file.name}_hashes.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleAlgorithm = (alg) => {
    setSelectedAlgorithms((prev) => ({
      ...prev,
      [alg]: !prev[alg]
    }));
  };

  const sidebarControls = (
    <>
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Supported Algorithms
        </label>
        
        <div className="space-y-2.5">
          {Object.keys(selectedAlgorithms).map((alg) => (
            <div
              key={alg}
              onClick={() => toggleAlgorithm(alg)}
              className="flex items-center gap-3 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/30 hover:border-purple-500/30 transition-all select-none cursor-pointer"
            >
              <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                selectedAlgorithms[alg] 
                  ? "bg-purple-500 border-purple-500 text-white" 
                  : "border-zinc-300 dark:border-zinc-700"
              }`}>
                {selectedAlgorithms[alg] && (
                  <span className="material-symbols-outlined text-[12px] font-black">check</span>
                )}
              </div>
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{alg}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <FileToolLayout
      title="Hash Generator"
      description="Calculate cryptographic checksum hashes (MD5, SHA-1, SHA-256, SHA-512) for files client-side."
      sidebarControls={sidebarControls}
      onFileUploaded={handleFileUploaded}
      onReset={handleReset}
      onDownload={handleDownloadReport}
      downloadDisabled={!file || processing}
      downloadLabel="Download Report"
      originalFile={file}
      processing={processing}
      allowMultiple={false}
      icon="fingerprint"
    >
      <div className="bg-white dark:bg-[#262930] rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col min-h-[350px]">
        {/* Card Header */}
        <div className="bg-gray-50 dark:bg-zinc-800/80 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center select-none rounded-t-2xl">
          <h3 className="font-extrabold text-zinc-700 dark:text-zinc-300 text-xs">Calculated Hashes</h3>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">Browser Hashing</span>
        </div>

        {/* Hashes List */}
        <div className="p-4 flex-grow overflow-y-auto max-h-[360px] space-y-4">
          {processing && statusText !== "" && !Object.values(hashes).some(Boolean) ? (
            <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-3"></div>
              <p className="text-xs font-semibold text-purple-500">{statusText}</p>
            </div>
          ) : file ? (
            <div className="space-y-4">
              {Object.keys(selectedAlgorithms).map((alg) => {
                if (!selectedAlgorithms[alg]) return null;
                const value = hashes[alg];
                const isCopied = copiedKey === alg;

                return (
                  <div key={alg} className="flex flex-col gap-1 w-full">
                    <div className="flex justify-between text-[10px] font-bold text-zinc-400 dark:text-zinc-550 select-none">
                      <span>{alg} Checksum</span>
                      {value && (
                        <button
                          onClick={() => handleCopy(alg, value)}
                          className="flex items-center gap-1 hover:text-purple-500 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[12px]">{isCopied ? "check" : "content_copy"}</span>
                          <span>{isCopied ? "Copied" : "Copy"}</span>
                        </button>
                      )}
                    </div>
                    
                    <div className="flex items-center bg-gray-50/50 dark:bg-zinc-900/30 border border-zinc-150 dark:border-zinc-800 rounded-xl px-3 py-2.5 font-mono text-[10px] text-zinc-800 dark:text-zinc-200 select-all min-h-[36px] break-all">
                      {processing && !value ? (
                        <span className="text-zinc-450 italic flex items-center gap-1.5 animate-pulse select-none">
                          <div className="animate-spin rounded-full h-2 w-2 border-b-2 border-zinc-400"></div>
                          Calculating...
                        </span>
                      ) : (
                        value
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center">
              <span className="material-symbols-outlined text-zinc-400 dark:text-zinc-600 text-[40px] mb-2 select-none">fingerprint</span>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold">Drop or select a file to compute checksums.</p>
              <p className="text-[10px] text-zinc-400 mt-1">Computes MD5, SHA-1, SHA-256, and SHA-512 hashes in parallel.</p>
            </div>
          )}
        </div>
      </div>
    </FileToolLayout>
  );
}
