"use client";

import { useState } from "react";
import TextToolLayout from "../components/TextToolLayout";

// Script loader helper for js-beautify
const loadHtmlBeautify = () => {
  return new Promise((resolve, reject) => {
    if (window.html_beautify) return resolve();
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.14.7/beautify-html.min.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load html-beautify"));
    document.body.appendChild(script);
  });
};

const minifyHTML = (html) => {
  return html
    .replace(/<!--[\s\S]*?-->/g, "") // Remove HTML comments
    .replace(/\s+/g, " ") // Collapse whitespace
    .replace(/>\s+</g, "><") // Remove whitespace between tags
    .trim();
};

export default function HtmlFormatterPage() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [spacing, setSpacing] = useState("2");
  const [processing, setProcessing] = useState(false);

  const handleReset = () => {
    setInputText("");
    setOutputText("");
  };

  const handleBeautify = async () => {
    if (!inputText.trim()) return;
    setProcessing(true);
    try {
      await loadHtmlBeautify();
      if (window.html_beautify) {
        const formatted = window.html_beautify(inputText, {
          indent_size: parseInt(spacing),
          indent_char: " ",
          max_preserve_newlines: 1,
          preserve_newlines: true
        });
        setOutputText(formatted);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to beautify HTML: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleMinify = () => {
    if (!inputText.trim()) return;
    try {
      const minified = minifyHTML(inputText);
      setOutputText(minified);
    } catch (error) {
      console.error(error);
      alert("Failed to minify HTML: " + error.message);
    }
  };

  const sidebarControls = (
    <>
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Tab Spacing
        </label>
        <select
          value={spacing}
          onChange={(e) => setSpacing(e.target.value)}
          className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-purple-500/50"
        >
          <option value="2">2 Spaces</option>
          <option value="4">4 Spaces</option>
        </select>
      </div>
    </>
  );

  const actionButtons = (
    <div className="grid grid-cols-2 gap-2 mt-2">
      <button
        onClick={handleBeautify}
        disabled={!inputText.trim() || processing}
        className="py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-lg shadow-purple-600/15"
      >
        {processing ? (
          <>
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
            Beautifying...
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-sm">format_align_left</span>
            Beautify HTML
          </>
        )}
      </button>

      <button
        onClick={handleMinify}
        disabled={!inputText.trim() || processing}
        className="py-2.5 bg-zinc-800 hover:bg-zinc-900 dark:bg-zinc-900 dark:hover:bg-zinc-950 border border-zinc-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none text-zinc-350 dark:text-zinc-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
      >
        <span className="material-symbols-outlined text-sm">minify</span>
        Minify HTML
      </button>
    </div>
  );

  return (
    <TextToolLayout
      title="HTML Formatter & Compressor"
      description="Beautify raw HTML markup tags or collapse spacing to optimize HTML pages completely locally."
      inputValue={inputText}
      onInputChange={setInputText}
      outputValue={outputText}
      onOutputChange={setOutputText}
      readOnlyOutput={true}
      sidebarControls={sidebarControls}
      actionButtons={actionButtons}
      onReset={handleReset}
      downloadFileName="formatted_page.html"
    />
  );
}
