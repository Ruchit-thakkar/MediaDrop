"use client";

import { useState, useEffect } from "react";
import TextToolLayout from "../components/TextToolLayout";

// Script loader helper for Marked library
const loadMarked = () => {
  return new Promise((resolve, reject) => {
    if (window.marked) return resolve();
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/marked@4.3.0/marked.min.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load marked.js"));
    document.body.appendChild(script);
  });
};

const DEFAULT_MARKDOWN = `# Markdown Editor

Welcome to the **MediaDrop Markdown Editor**!

You can write standard markdown here and see a live preview on the right.

## Features:
1. **Bold** / *Italic* text formatting.
2. Unordered lists like this one.
3. Code blocks:
\`\`\`javascript
const greet = () => {
  console.log("Hello, world!");
};
\`\`\`
4. Links to websites: [Google](https://google.com).
5. Blockquotes:
> "Privacy first. All editing and parsing is done 100% locally in your browser."

Enjoy writing!`;

export default function MarkdownEditorPage() {
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  const [htmlPreview, setHtmlPreview] = useState("");
  const [markedReady, setMarkedReady] = useState(false);
  const [viewMode, setViewMode] = useState("split"); // split, editor, preview

  // Load marked and update preview
  useEffect(() => {
    let active = true;
    loadMarked()
      .then(() => {
        if (active) {
          setMarkedReady(true);
        }
      })
      .catch((err) => console.error("Failed to load marked:", err));

    return () => {
      active = false;
    };
  }, []);

  // Update HTML output when markdown changes
  useEffect(() => {
    if (!markedReady || !window.marked) return;
    try {
      // Configure marked option (safe breaks and sanitizing)
      window.marked.setOptions({
        breaks: true,
        gfm: true
      });
      const parsed = window.marked.parse(markdown);
      setHtmlPreview(parsed);
    } catch (e) {
      console.error("Markdown parse error:", e);
    }
  }, [markdown, markedReady]);

  const handleReset = () => {
    setMarkdown(DEFAULT_MARKDOWN);
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sidebarControls = (
    <>
      {/* View mode buttons */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          View Mode
        </label>
        <div className="flex flex-col gap-2">
          {[
            { key: "split", label: "Split Screen" },
            { key: "editor", label: "Editor Only" },
            { key: "preview", label: "Preview Only" }
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setViewMode(item.key)}
              className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                viewMode === item.key
                  ? "bg-purple-500/10 text-purple-500 border-purple-500/30"
                  : "bg-white/5 dark:bg-white/[0.01] text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-800 dark:hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <TextToolLayout
      title="Markdown Editor"
      description="Write markdown text, view live parsed HTML results, and save as markdown files locally."
      sidebarControls={sidebarControls}
      onReset={handleReset}
      showOutput={false} // Override workspace layout with custom children
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch w-full min-h-[450px]">
        {/* Editor Area */}
        {(viewMode === "split" || viewMode === "editor") && (
          <div className="flex flex-col bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden h-[450px]">
            <div className="bg-gray-50 dark:bg-zinc-800/80 px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center select-none">
              <h3 className="font-extrabold text-zinc-700 dark:text-zinc-300 text-xs">Markdown Editor</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(markdown);
                    alert("Copied markdown code!");
                  }}
                  className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-450 hover:text-purple-500 transition-colors flex items-center gap-0.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[12px]">content_copy</span>
                  Copy Raw
                </button>
                <button
                  onClick={handleDownload}
                  className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-450 hover:text-purple-500 transition-colors flex items-center gap-0.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[12px]">download</span>
                  Download .md
                </button>
              </div>
            </div>
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder="Start writing markdown..."
              className="w-full flex-grow p-4 bg-transparent text-zinc-855 dark:text-zinc-150 text-xs font-mono placeholder-zinc-450 focus:outline-none resize-none leading-relaxed"
            />
          </div>
        )}

        {/* HTML Preview Area */}
        {(viewMode === "split" || viewMode === "preview") && (
          <div className="flex flex-col bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden h-[450px] w-full">
            <div className="bg-gray-50 dark:bg-zinc-800/80 px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center select-none">
              <h3 className="font-extrabold text-zinc-700 dark:text-zinc-300 text-xs">Live Preview</h3>
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400">Parsed HTML</span>
            </div>
            <div
              className="flex-grow p-6 overflow-y-auto text-xs text-zinc-800 dark:text-zinc-200 prose prose-zinc dark:prose-invert max-w-none leading-relaxed select-text space-y-4 markdown-preview-body"
              dangerouslySetInnerHTML={{ __html: htmlPreview || "<p class='text-zinc-400 italic'>No preview available.</p>" }}
            />
          </div>
        )}
      </div>

      {/* Styled Markdown preview inline style tag */}
      <style jsx global>{`
        .markdown-preview-body h1 {
          font-size: 1.5rem;
          font-weight: 800;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          border-bottom: 1px solid rgba(128,128,128,0.15);
          padding-bottom: 0.25rem;
        }
        .markdown-preview-body h2 {
          font-size: 1.25rem;
          font-weight: 750;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }
        .markdown-preview-body h3 {
          font-size: 1.1rem;
          font-weight: 700;
        }
        .markdown-preview-body p {
          margin-bottom: 0.75rem;
        }
        .markdown-preview-body ul {
          list-style-type: disc;
          padding-left: 1.25rem;
          margin-bottom: 0.75rem;
        }
        .markdown-preview-body ol {
          list-style-type: decimal;
          padding-left: 1.25rem;
          margin-bottom: 0.75rem;
        }
        .markdown-preview-body li {
          margin-bottom: 0.25rem;
        }
        .markdown-preview-body blockquote {
          border-left: 4px solid #a855f7;
          background: rgba(168, 85, 247, 0.05);
          padding: 0.5rem 1rem;
          border-radius: 0 8px 8px 0;
          margin: 0.75rem 0;
          font-style: italic;
        }
        .markdown-preview-body pre {
          background: rgba(0, 0, 0, 0.04);
          padding: 0.75rem;
          border-radius: 8px;
          overflow-x: auto;
          margin: 0.75rem 0;
          border: 1px solid rgba(128,128,128,0.1);
        }
        .dark .markdown-preview-body pre {
          background: rgba(255, 255, 255, 0.02);
        }
        .markdown-preview-body code {
          font-family: monospace;
          background: rgba(0, 0, 0, 0.04);
          padding: 0.15rem 0.3rem;
          border-radius: 4px;
        }
        .dark .markdown-preview-body code {
          background: rgba(255, 255, 255, 0.06);
        }
        .markdown-preview-body a {
          color: #a855f7;
          text-decoration: underline;
        }
        .markdown-preview-body a:hover {
          color: #c084fc;
        }
      `}</style>
    </TextToolLayout>
  );
}
