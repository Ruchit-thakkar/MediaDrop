"use client";

import { useState, useEffect } from "react";
import FileToolLayout, { formatBytes } from "../components/FileToolLayout";

// Build a tree from flat file list
const buildFileTree = (filesList) => {
  const root = { name: "Root", path: "", isDir: true, children: {} };

  filesList.forEach((file) => {
    const parts = file.name.split("/").filter(Boolean);
    let current = root;

    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      const isDir = !isLast;

      if (!current.children[part]) {
        current.children[part] = {
          name: part,
          path: file.name,
          isDir: isDir,
          children: {},
          data: isLast ? file.data : null,
          size: isLast ? file.size : 0
        };
      }
      current = current.children[part];
    });
  });

  return root;
};

export default function RarExtractorPage() {
  const [rarFile, setRarFile] = useState(null);
  const [extractedFiles, setExtractedFiles] = useState([]);
  const [fileTree, setFileTree] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState({ Root: true });
  const [searchQuery, setSearchQuery] = useState("");
  const [processing, setProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [selectedEntry, setSelectedEntry] = useState(null);

  const handleFileUploaded = async (file) => {
    setProcessing(true);
    setStatusText("Loading 7-Zip WebAssembly extraction engine...");
    setRarFile(file);

    try {
      // Dynamic import of 7z-wasm using eval to prevent Next.js bundle compilation errors
      const cdnUrl = "https://cdn.jsdelivr.net/npm/7z-wasm@1.2.0/+esm";
      const module = await eval(`import("${cdnUrl}")`);
      const SevenZipWasm = module.default;

      setStatusText("Initializing WebAssembly engine...");
      const sevenZip = await SevenZipWasm();

      setStatusText("Reading RAR archive...");
      const arrayBuffer = await file.arrayBuffer();
      
      // Write the file to Emscripten memory file system
      sevenZip.FS.writeFile('/archive.rar', new Uint8Array(arrayBuffer));
      
      // Create output directory
      try {
        sevenZip.FS.mkdir('/output');
      } catch (e) {
        // Directory may already exist
      }

      setStatusText("Extracting contents in-memory...");
      // Run extraction command: x (extract with full paths)
      sevenZip.callMain(['x', '/archive.rar', '-o/output', '-y']);

      setStatusText("Parsing file list...");
      const files = [];
      const traverseFS = (dirPath) => {
        const entries = sevenZip.FS.readdir(dirPath);
        for (const entry of entries) {
          if (entry === '.' || entry === '..') continue;
          const fullPath = dirPath === '/' ? `/${entry}` : `${dirPath}/${entry}`;
          const stat = sevenZip.FS.stat(fullPath);
          
          if (sevenZip.FS.isDir(stat.mode)) {
            traverseFS(fullPath);
          } else {
            const data = sevenZip.FS.readFile(fullPath);
            // Get relative name
            const relativeName = fullPath.replace(/^\/output\//, '');
            files.push({
              name: relativeName,
              data: data,
              size: data.length
            });
          }
        }
      };
      
      traverseFS('/output');

      if (files.length === 0) {
        throw new Error("No files extracted. Verify if the file is a valid RAR archive.");
      }

      setExtractedFiles(files);
      const tree = buildFileTree(files);
      setFileTree(tree);
      setSelectedEntry(null);
    } catch (error) {
      console.error("Failed to extract RAR:", error);
      alert("Failed to extract RAR archive: " + error.message);
      handleReset();
    } finally {
      setProcessing(false);
      setStatusText("");
    }
  };

  const handleReset = () => {
    setRarFile(null);
    setExtractedFiles([]);
    setFileTree(null);
    setExpandedNodes({ Root: true });
    setSearchQuery("");
    setProcessing(false);
    setStatusText("");
    setSelectedEntry(null);
  };

  const toggleNode = (nodePath) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodePath]: !prev[nodePath]
    }));
  };

  const handleDownloadFile = (name, data) => {
    if (!data) return;
    const blob = new Blob([data]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const baseName = name.split("/").pop();
    a.download = baseName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Render tree node recursively
  const renderNode = (node, depth = 0) => {
    const isExpanded = !!expandedNodes[node.path || "Root"];
    
    // Search query filtering
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      if (!node.isDir && !node.name.toLowerCase().includes(q)) {
        return null;
      }
      if (node.isDir) {
        const hasMatches = (n) => {
          if (!n.isDir) return n.name.toLowerCase().includes(q);
          return Object.values(n.children).some(child => hasMatches(child));
        };
        const matchingChildren = Object.values(node.children).filter(c => hasMatches(c));
        if (matchingChildren.length === 0) return null;
      }
    }

    const paddingLeft = `${depth * 16}px`;

    return (
      <div key={node.path || "Root"} className="w-full">
        {node.path !== "" && (
          <div
            className={`flex items-center justify-between py-2 px-3 hover:bg-black/5 dark:hover:bg-white/5 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 rounded-xl transition-all select-none cursor-pointer ${
              selectedEntry?.path === node.path ? "bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400" : ""
            }`}
            style={{ paddingLeft }}
            onClick={() => {
              if (node.isDir) {
                toggleNode(node.path);
              } else {
                setSelectedEntry(node);
              }
            }}
          >
            <div className="flex items-center gap-2 min-w-0 pr-4">
              {node.isDir ? (
                <span className="material-symbols-outlined text-yellow-500 dark:text-yellow-600 shrink-0 select-none text-[18px]">
                  {isExpanded ? "folder_open" : "folder"}
                </span>
              ) : (
                <span className="material-symbols-outlined text-zinc-400 dark:text-zinc-500 shrink-0 select-none text-[18px]">
                  description
                </span>
              )}
              <span className="text-xs font-bold truncate text-zinc-800 dark:text-zinc-200">
                {node.name}
              </span>
            </div>

            {!node.isDir && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-mono font-semibold text-zinc-400">
                  {formatBytes(node.size)}
                </span>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadFile(node.path, node.data);
                  }}
                  className="p-1 rounded hover:bg-purple-500/10 text-zinc-400 hover:text-purple-500 transition-all cursor-pointer"
                  title="Extract File"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                </button>
              </div>
            )}
          </div>
        )}

        {node.isDir && (node.path === "" || isExpanded) && (
          <div className="w-full mt-0.5 space-y-0.5">
            {Object.values(node.children)
              .sort((a, b) => {
                if (a.isDir && !b.isDir) return -1;
                if (!a.isDir && b.isDir) return 1;
                return a.name.localeCompare(b.name);
              })
              .map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const sidebarControls = (
    <>
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          File Details
        </label>
        {selectedEntry ? (
          <div className="bg-purple-500/[0.02] border border-purple-500/20 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col gap-1 select-none">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400">Selected Path</span>
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 break-all">{selectedEntry.path}</span>
            </div>

            <div className="flex justify-between border-t border-border-subtle pt-2 text-[11px] font-bold text-zinc-500">
              <span>File Size:</span>
              <span className="font-mono text-zinc-800 dark:text-zinc-200">
                {formatBytes(selectedEntry.size)}
              </span>
            </div>

            <button
              onClick={() => handleDownloadFile(selectedEntry.path, selectedEntry.data)}
              className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-purple-600/15"
            >
              <span className="material-symbols-outlined text-[14px]">download</span>
              Extract Selected
            </button>
          </div>
        ) : (
          <div className="border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-center select-none text-[10px] font-bold text-zinc-400">
            Select a file in the tree to inspect details.
          </div>
        )}
      </div>
    </>
  );

  return (
    <FileToolLayout
      title="RAR Extractor"
      description="Inspect and extract files from RAR compressed archives completely locally using WebAssembly."
      sidebarControls={sidebarControls}
      onFileUploaded={handleFileUploaded}
      onReset={handleReset}
      originalFile={rarFile}
      processing={processing}
      allowMultiple={false}
      accept=".rar"
      icon="unarchive"
    >
      <div className="bg-white dark:bg-[#262930] rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col min-h-[350px]">
        {/* Header with Search */}
        <div className="bg-gray-50 dark:bg-zinc-800/80 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-3 select-none rounded-t-2xl">
          <h3 className="font-extrabold text-zinc-700 dark:text-zinc-300 text-xs self-start sm:self-center">Archive Directory Structure</h3>
          <div className="flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-1 text-xs w-full sm:w-48">
            <span className="material-symbols-outlined text-[16px] text-zinc-400 dark:text-zinc-500 mr-1.5">search</span>
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent focus:outline-none w-full text-[11px] font-bold text-zinc-800 dark:text-zinc-200"
            />
          </div>
        </div>

        {/* Tree Container */}
        <div className="p-4 flex-grow overflow-y-auto max-h-[360px] space-y-2">
          {processing && statusText !== "" ? (
            <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-3"></div>
              <p className="text-xs font-semibold text-purple-500">{statusText}</p>
            </div>
          ) : fileTree ? (
            <div className="w-full">
              {renderNode(fileTree)}
            </div>
          ) : (
            <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center">
              <span className="material-symbols-outlined text-zinc-400 dark:text-zinc-600 text-[40px] mb-2 select-none">unarchive</span>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold">Drop or select a RAR archive to unpack.</p>
              <p className="text-[10px] text-zinc-400 mt-1">Files are unpacked directly inside the browser using 7-Zip WebAssembly.</p>
            </div>
          )}
        </div>
      </div>
    </FileToolLayout>
  );
}
