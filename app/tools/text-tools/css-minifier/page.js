"use client";

import { useState } from "react";
import TextToolLayout from "../components/TextToolLayout";

// Script loader helper for js-beautify css
const loadCssBeautify = () => {
  return new Promise((resolve, reject) => {
    if (window.css_beautify) return resolve();
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.14.7/beautify-css.min.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load css-beautify"));
    document.body.appendChild(script);
  });
};

const minifyCSS = (css) => {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "") // Remove CSS comments
    .replace(/\s+/g, " ") // Collapse whitespace
    .replace(/\s*([\{\}:;])\s*/g, "$1") // Strip spacing around punctuation
    .replace(/;}/g, "}") // Remove last semicolon before closing brace
    .trim();
};

export default function CssMinifierPage() {
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
      await loadCssBeautify();
      if (window.css_beautify) {
        const formatted = window.css_beautify(inputText, {
          indent_size: parseInt(spacing),
          indent_char: " ",
          selector_separator_newline: true,
          newline_between_rules: true
        });
        setOutputText(formatted);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to format CSS: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleMinify = () => {
    if (!inputText.trim()) return;
    try {
      const minified = minifyCSS(inputText);
      setOutputText(minified);
    } catch (error) {
      console.error(error);
      alert("Failed to minify CSS: " + error.message);
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
            Beautify CSS
          </>
        )}
      </button>

      <button
        onClick={handleMinify}
        disabled={!inputText.trim() || processing}
        className="py-2.5 bg-zinc-800 hover:bg-zinc-900 dark:bg-zinc-900 dark:hover:bg-zinc-950 border border-zinc-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none text-zinc-350 dark:text-zinc-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
      >
        <span className="material-symbols-outlined text-sm">minify</span>
        Minify CSS
      </button>
    </div>
  );

  return (
    <TextToolLayout
      title="CSS Minifier & Formatter"
      description="Compress CSS rules to shrink stylesheet files or pretty-print them for readabilty completely client-side."
      inputValue={inputText}
      onInputChange={setInputText}
      outputValue={outputText}
      onOutputChange={setOutputText}
      readOnlyOutput={true}
      sidebarControls={sidebarControls}
      actionButtons={actionButtons}
      onReset={handleReset}
      downloadFileName="style.css"
    />
  );
}
