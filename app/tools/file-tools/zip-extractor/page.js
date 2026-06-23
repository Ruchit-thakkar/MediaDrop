"use client";

import { useState, useEffect } from "react";
import JSZip from "jszip";
import FileToolLayout, { formatBytes } from "../components/FileToolLayout";

// Build a tree from flat ZIP file path keys
const buildFileTree = (zipFiles) => {
  const root = { name: "Root", path: "", isDir: true, children: {} };

  Object.keys(zipFiles).forEach((filePath) => {
    const parts = filePath.split("/").filter(Boolean);
    let current = root;

    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      const isDir = !isLast || filePath.endsWith("/");

      if (!current.children[part]) {
        current.children[part] = {
          name: part,
          path: filePath,
          isDir: isDir,
          children: {},
          zipEntry: isLast && !isDir ? zipFiles[filePath] : null
        };
      }
      current = current.children[part];
    });
  });

  return root;
};

export default function ZipExtractorPage() {
  const [zipFile, setZipFile] = useState(null);
  const [zipEntries, setZipEntries] = useState({});
  const [fileTree, setFileTree] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState({ Root: true });
  const [searchQuery, setSearchQuery] = useState("");
  const [processing, setProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [selectedContentSize, setSelectedContentSize] = useState(null);

  const handleFileUploaded = async (file) => {
    setProcessing(true);
    setStatusText("Reading ZIP directory structure...");
    setZipFile(file);

    try {
      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(file);
      setZipEntries(loadedZip.files);
      const tree = buildFileTree(loadedZip.files);
      setFileTree(tree);
      setSelectedEntry(null);
      setSelectedContentSize(null);
    } catch (error) {
      console.error("Failed to load ZIP:", error);
      alert("Failed to load ZIP archive: " + error.message);
      handleReset();
    } finally {
      setProcessing(false);
      setStatusText("");
    }
  };

  const handleReset = () => {
    setZipFile(null);
    setZipEntries({});
    setFileTree(null);
    setExpandedNodes({ Root: true });
    setSearchQuery("");
    setProcessing(false);
    setStatusText("");
    setSelectedEntry(null);
    setSelectedContentSize(null);
  };

  const toggleNode = (nodePath) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodePath]: !prev[nodePath]
    }));
  };

  const handleDownloadFile = async (name, entry) => {
    if (!entry) return;
    setProcessing(true);
    setStatusText(`Decompressing ${name}...`);

    try {
      const blob = await entry.async("blob");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // Get filename from path
      const baseName = name.split("/").pop();
      a.download = baseName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Extraction failed:", error);
      alert("Failed to extract file: " + error.message);
    } finally {
      setProcessing(false);
      setStatusText("");
    }
  };

  // Render tree node recursively
  const renderNode = (node, depth = 0) => {
    const isExpanded = !!expandedNodes[node.path || "Root"];
    const hasChildren = Object.keys(node.children).length > 0;
    
    // Search query filtering
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      // If node itself is file and does not match
      if (!node.isDir && !node.name.toLowerCase().includes(q)) {
        return null;
      }
      // If it is folder, check if it contains matching children
      if (node.isDir) {
        const matchingChildren = Object.values(node.children).filter(c => {
          if (c.isDir) {
            // check recursively
            const hasMatches = (n) => {
              if (!n.isDir) return n.name.toLowerCase().includes(q);
              return Object.values(n.children).some(child => hasMatches(child));
            };
            return hasMatches(c);
          }
          return c.name.toLowerCase().includes(q);
        });
        if (matchingChildren.length === 0) return null;
      }
    }

    const paddingLeft = `${depth * 16}px`;

    return (
      <div key={node.path || "Root"} className="w-full">
        {/* Node row */}
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
                // JSZip metadata: _data is stored compressed
                // To display decompressed size, we use uncompressed size if available
                const entryData = node.zipEntry;
                // JSZip files objects hold compressed/uncompressed sizes in raw entry metadata
                // We'll estimate or read JSZip internals
                // standard: entryData._data.uncompressedSize or files object metadata
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
                {/* Size label */}
                <span className="text-[10px] font-mono font-semibold text-zinc-400">
                  {node.zipEntry ? formatBytes(node.zipEntry._data?.uncompressedSize || node.zipEntry.uncompressedSize || 0) : ""}
                </span>
                
                {/* Individual Download Trigger */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadFile(node.path, node.zipEntry);
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

        {/* Children container */}
        {node.isDir && (node.path === "" || isExpanded) && (
          <div className="w-full mt-0.5 space-y-0.5">
            {Object.values(node.children)
              .sort((a, b) => {
                // Directories first, then alphabetical
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
          File Inspector
        </label>
        {selectedEntry ? (
          <div className="bg-purple-500/[0.02] border border-purple-500/20 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col gap-1 select-none">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400">Selected Path</span>
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 break-all">{selectedEntry.path}</span>
            </div>

            <div className="flex justify-between border-t border-border-subtle pt-2 text-[11px] font-bold text-zinc-500">
              <span>Uncompressed Size:</span>
              <span className="font-mono text-zinc-800 dark:text-zinc-200">
                {formatBytes(selectedEntry.zipEntry?._data?.uncompressedSize || 0)}
              </span>
            </div>

            <button
              onClick={() => handleDownloadFile(selectedEntry.path, selectedEntry.zipEntry)}
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
      title="ZIP Extractor"
      description="Inspect folder hierarchy and extract specific files from standard ZIP archives completely locally."
      sidebarControls={sidebarControls}
      onFileUploaded={handleFileUploaded}
      onReset={handleReset}
      originalFile={zipFile}
      processing={processing}
      allowMultiple={false}
      accept=".zip"
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
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold">Drop or select a ZIP archive to unpack.</p>
              <p className="text-[10px] text-zinc-400 mt-1">Files are inspected entirely in-memory using JSZip.</p>
            </div>
          )}
        </div>
      </div>
    </FileToolLayout>
  );
}
