"use client";

import { useState } from "react";
import TextToolLayout from "../components/TextToolLayout";

// Script loader helper for js-beautify (JS format)
const loadJsBeautify = () => {
  return new Promise((resolve, reject) => {
    if (window.js_beautify) return resolve();
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.14.7/beautify.min.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load js-beautify"));
    document.body.appendChild(script);
  });
};

// Script loader helper for Terser (Minifier)
const loadTerser = () => {
  return new Promise((resolve, reject) => {
    if (window.Terser) return resolve();
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/terser/dist/bundle.min.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Terser"));
    document.body.appendChild(script);
  });
};

export default function JavascriptMinifierPage() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [spacing, setSpacing] = useState("2");
  const [validationError, setValidationError] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleReset = () => {
    setInputText("");
    setOutputText("");
    setValidationError("");
  };

  const handleBeautify = async () => {
    if (!inputText.trim()) return;
    setProcessing(true);
    setValidationError("");
    try {
      // 1. Basic syntax validation first
      try {
        new Function(inputText);
      } catch (err) {
        setValidationError(`Syntax Warning: ${err.message}`);
      }

      await loadJsBeautify();
      if (window.js_beautify) {
        const formatted = window.js_beautify(inputText, {
          indent_size: parseInt(spacing),
          indent_char: " ",
          preserve_newlines: true
        });
        setOutputText(formatted);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to format JavaScript: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleMinify = async () => {
    if (!inputText.trim()) return;
    setProcessing(true);
    setValidationError("");
    try {
      // Validate syntax
      try {
        new Function(inputText);
      } catch (err) {
        setValidationError(`Syntax Warning: ${err.message}`);
      }

      await loadTerser();
      if (window.Terser) {
        const result = await window.Terser.minify(inputText, {
          compress: {
            dead_code: true,
            drop_console: false,
            drop_debugger: true
          },
          mangle: true
        });

        if (result.error) {
          throw new Error(result.error);
        }

        setOutputText(result.code);
      } else {
        throw new Error("Terser library not initialized.");
      }
    } catch (error) {
      console.error(error);
      setValidationError(error.message);
      setOutputText("");
    } finally {
      setProcessing(false);
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

      {validationError && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/25 rounded-2xl select-none text-[9px] font-bold text-red-500 uppercase tracking-wider leading-relaxed">
          <span className="flex items-center gap-1 mb-1">
            <span className="material-symbols-outlined text-[13px]">warning</span>
            JavaScript Warning:
          </span>
          <p className="font-mono text-[10px] break-all normal-case font-medium">{validationError}</p>
        </div>
      )}

      {outputText && !validationError && (
        <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-3 mt-4 select-none text-[9px] font-extrabold text-emerald-500 uppercase tracking-widest flex items-center gap-1.5 justify-center">
          <span className="material-symbols-outlined text-[14px]">verified</span>
          Code Syntactically Sound!
        </div>
      )}
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
            Processing...
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-sm">format_align_left</span>
            Beautify JS
          </>
        )}
      </button>

      <button
        onClick={handleMinify}
        disabled={!inputText.trim() || processing}
        className="py-2.5 bg-zinc-800 hover:bg-zinc-900 dark:bg-zinc-900 dark:hover:bg-zinc-950 border border-zinc-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none text-zinc-350 dark:text-zinc-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
      >
        {processing ? (
          <>
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
            Processing...
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-sm">minify</span>
            Minify JS
          </>
        )}
      </button>
    </div>
  );

  return (
    <TextToolLayout
      title="JavaScript Minifier"
      description="Minify, compress, and mangle JavaScript variable scopes or beautify code structures locally."
      inputValue={inputText}
      onInputChange={setInputText}
      outputValue={outputText}
      onOutputChange={setOutputText}
      readOnlyOutput={true}
      sidebarControls={sidebarControls}
      actionButtons={actionButtons}
      onReset={handleReset}
      downloadFileName="script.min.js"
    />
  );
}
