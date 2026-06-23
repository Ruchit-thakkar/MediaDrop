"use client";

import { useState } from "react";
import FileToolLayout, { formatBytes } from "../components/FileToolLayout";

// Build a size-accumulated tree from files list
const buildFolderSizeTree = (files) => {
  const root = { name: "Root", path: "", size: 0, count: 0, isDir: true, children: {} };

  files.forEach((file) => {
    const relativePath = file.webkitRelativePath || file.name;
    const parts = relativePath.split("/").filter(Boolean);
    let current = root;

    root.size += file.size;
    root.count += 1;

    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      const isDir = !isLast;
      const partPath = parts.slice(0, index + 1).join("/");

      if (!current.children[part]) {
        current.children[part] = {
          name: part,
          path: partPath,
          size: 0,
          count: 0,
          isDir: isDir,
          children: {}
        };
      }

      current = current.children[part];
      current.size += file.size;
      current.count += 1;
    });
  });

  return root;
};

export default function FolderSizeCalculatorPage() {
  const [files, setFiles] = useState([]);
  const [folderTree, setFolderTree] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState({ Root: true });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNode, setSelectedNode] = useState(null);

  const handleFilesUploaded = (uploadedFiles) => {
    if (uploadedFiles.length === 0) return;
    setFiles(uploadedFiles);
    const tree = buildFolderSizeTree(uploadedFiles);
    setFolderTree(tree);
    setSelectedNode(tree);
    setExpandedNodes({ Root: true });
  };

  const handleReset = () => {
    setFiles([]);
    setFolderTree(null);
    setExpandedNodes({ Root: true });
    setSearchQuery("");
    setSelectedNode(null);
  };

  const toggleNode = (nodePath) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodePath]: !prev[nodePath]
    }));
  };

  // Render tree node recursively
  const renderNode = (node, depth = 0) => {
    const isExpanded = !!expandedNodes[node.path || "Root"];
    const paddingLeft = `${depth * 16}px`;

    // Filter by name if search is active
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      if (!node.name.toLowerCase().includes(q) && node.path !== "") {
        // If node doesn't match and has no children matching
        const hasMatchingChild = (n) => {
          if (n.name.toLowerCase().includes(q)) return true;
          return Object.values(n.children).some(child => hasMatchingChild(child));
        };
        if (!hasMatchingChild(node)) return null;
      }
    }

    return (
      <div key={node.path || "Root"} className="w-full">
        {node.path !== "" && (
          <div
            className={`flex items-center justify-between py-2 px-3 hover:bg-black/5 dark:hover:bg-white/5 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 rounded-xl transition-all select-none cursor-pointer ${
              selectedNode?.path === node.path ? "bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400" : ""
            }`}
            style={{ paddingLeft }}
            onClick={() => {
              setSelectedNode(node);
              if (node.isDir) {
                toggleNode(node.path);
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

            <div className="flex items-center gap-3 shrink-0">
              {node.isDir && (
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full border border-black/5 dark:border-white/5">
                  {node.count} {node.count === 1 ? "file" : "files"}
                </span>
              )}
              <span className="text-[10px] font-mono font-bold text-zinc-800 dark:text-zinc-200">
                {formatBytes(node.size)}
              </span>
            </div>
          </div>
        )}

        {node.isDir && (node.path === "" || isExpanded) && (
          <div className="w-full mt-0.5 space-y-0.5">
            {Object.values(node.children)
              .sort((a, b) => {
                if (a.isDir && !b.isDir) return -1;
                if (!a.isDir && b.isDir) return 1;
                return b.size - a.size; // Sort by size descending
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
          Folder Statistics
        </label>
        {selectedNode ? (
          <div className="bg-purple-500/[0.02] border border-purple-500/20 rounded-2xl p-4 space-y-3 select-none">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400">Selected Path</span>
              <span className="text-xs font-bold text-zinc-850 dark:text-zinc-200 break-all">{selectedNode.path || "Root Folder"}</span>
            </div>

            <div className="flex justify-between border-t border-border-subtle pt-2.5 text-xs font-bold text-zinc-550">
              <span>Type:</span>
              <span>{selectedNode.isDir ? "Directory" : "File"}</span>
            </div>

            <div className="flex justify-between text-xs font-bold text-zinc-550">
              <span>File Count:</span>
              <span>{selectedNode.count}</span>
            </div>

            <div className="flex justify-between text-xs font-bold text-zinc-550">
              <span>Allocated Space:</span>
              <span className="font-mono text-purple-500">{formatBytes(selectedNode.size)}</span>
            </div>
          </div>
        ) : (
          <div className="border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-center select-none text-[10px] font-bold text-zinc-400">
            Select a folder node to view specific storage allocation.
          </div>
        )}
      </div>
    </>
  );

  return (
    <FileToolLayout
      title="Folder Size Calculator"
      description="Scan directories recursively to inspect folder sizes, file counts, and overall local storage distribution."
      sidebarControls={sidebarControls}
      onFilesUploaded={handleFilesUploaded}
      onReset={handleReset}
      uploadedFiles={files}
      allowMultiple={true}
      directoryMode={true}
      icon="folder"
    >
      <div className="bg-white dark:bg-[#262930] rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col min-h-[350px]">
        {/* Header with Search */}
        <div className="bg-gray-50 dark:bg-zinc-800/80 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-3 select-none rounded-t-2xl">
          <h3 className="font-extrabold text-zinc-700 dark:text-zinc-300 text-xs self-start sm:self-center">Folder Hierarchy Size Breakdown</h3>
          <div className="flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-1 text-xs w-full sm:w-48">
            <span className="material-symbols-outlined text-[16px] text-zinc-400 dark:text-zinc-500 mr-1.5">search</span>
            <input
              type="text"
              placeholder="Filter names..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent focus:outline-none w-full text-[11px] font-bold text-zinc-800 dark:text-zinc-200"
            />
          </div>
        </div>

        {/* Tree List */}
        <div className="p-4 flex-grow overflow-y-auto max-h-[360px] space-y-2">
          {folderTree ? (
            <div className="w-full">
              {renderNode(folderTree)}
            </div>
          ) : (
            <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center">
              <span className="material-symbols-outlined text-zinc-400 dark:text-zinc-600 text-[40px] mb-2 select-none">folder_special</span>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold">Select a folder to calculate sizes recursively.</p>
              <p className="text-[10px] text-zinc-400 mt-1">Processed fully in-browser using Web Directory Traversal.</p>
            </div>
          )}
        </div>
      </div>
    </FileToolLayout>
  );
}
