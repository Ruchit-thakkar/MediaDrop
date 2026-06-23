"use client";

import { useState } from "react";
import TextToolLayout from "../components/TextToolLayout";

export default function JsonFormatterPage() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [spacing, setSpacing] = useState("2"); // 2, 4, tab
  const [validationError, setValidationError] = useState("");

  const handleReset = () => {
    setInputText("");
    setOutputText("");
    setValidationError("");
  };

  const handleBeautify = () => {
    if (!inputText.trim()) return;
    try {
      setValidationError("");
      const parsed = JSON.parse(inputText);
      
      let spaceVal = 2;
      if (spacing === "4") spaceVal = 4;
      if (spacing === "tab") spaceVal = "\t";

      const formatted = JSON.stringify(parsed, null, spaceVal);
      setOutputText(formatted);
    } catch (error) {
      console.error(error);
      setValidationError(error.message);
      setOutputText("");
    }
  };

  const handleMinify = () => {
    if (!inputText.trim()) return;
    try {
      setValidationError("");
      const parsed = JSON.parse(inputText);
      const minified = JSON.stringify(parsed);
      setOutputText(minified);
    } catch (error) {
      console.error(error);
      setValidationError(error.message);
      setOutputText("");
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
          <option value="tab">1 Tab</option>
        </select>
      </div>

      {validationError && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/25 rounded-2xl select-none text-[9px] font-bold text-red-500 uppercase tracking-wider leading-relaxed">
          <span className="flex items-center gap-1 mb-1">
            <span className="material-symbols-outlined text-[13px]">error</span>
            Invalid JSON Syntax:
          </span>
          <p className="font-mono text-[10px] break-all normal-case font-medium">{validationError}</p>
        </div>
      )}

      {outputText && !validationError && (
        <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-3 mt-4 select-none text-[9px] font-extrabold text-emerald-500 uppercase tracking-widest flex items-center gap-1.5 justify-center">
          <span className="material-symbols-outlined text-[14px]">verified</span>
          JSON is Valid!
        </div>
      )}
    </>
  );

  const actionButtons = (
    <div className="grid grid-cols-2 gap-2 mt-2">
      <button
        onClick={handleBeautify}
        disabled={!inputText.trim()}
        className="py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-lg shadow-purple-600/15"
      >
        <span className="material-symbols-outlined text-sm">format_align_left</span>
        Beautify JSON
      </button>

      <button
        onClick={handleMinify}
        disabled={!inputText.trim()}
        className="py-2.5 bg-zinc-800 hover:bg-zinc-900 dark:bg-zinc-900 dark:hover:bg-zinc-950 border border-zinc-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none text-zinc-350 dark:text-zinc-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
      >
        <span className="material-symbols-outlined text-sm">minify</span>
        Minify JSON
      </button>
    </div>
  );

  return (
    <TextToolLayout
      title="JSON Formatter & Validator"
      description="Validate, beautify, and compress JSON data structures completely inside your browser."
      inputValue={inputText}
      onInputChange={setInputText}
      outputValue={outputText}
      onOutputChange={setOutputText}
      readOnlyOutput={true}
      sidebarControls={sidebarControls}
      actionButtons={actionButtons}
      onReset={handleReset}
      downloadFileName="formatted_data.json"
    />
  );
}
