"use client";

import { useState, useEffect } from "react";
import TextToolLayout from "../components/TextToolLayout";

export default function RemoveDuplicateLinesPage() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [preserveOrder, setPreserveOrder] = useState(true);
  const [ignoreEmpty, setIgnoreEmpty] = useState(true);
  const [caseInsensitive, setCaseInsensitive] = useState(false);

  // Automatically recalculate output on option/input change
  useEffect(() => {
    if (!inputText) {
      setOutputText("");
      return;
    }

    const lines = inputText.split("\n");
    const seen = new Set();
    const result = [];

    lines.forEach((line) => {
      // Check if line should be ignored
      if (ignoreEmpty && line.trim() === "") {
        return;
      }

      const comparisonKey = caseInsensitive ? line.toLowerCase().trim() : line.trim();

      if (!seen.has(comparisonKey)) {
        seen.add(comparisonKey);
        result.push(line);
      }
    });

    if (!preserveOrder) {
      result.sort((a, b) => a.localeCompare(b));
    }

    setOutputText(result.join("\n"));
  }, [inputText, preserveOrder, ignoreEmpty, caseInsensitive]);

  const handleReset = () => {
    setInputText("");
    setOutputText("");
    setPreserveOrder(true);
    setIgnoreEmpty(true);
    setCaseInsensitive(false);
  };

  const originalLineCount = inputText === "" ? 0 : inputText.split("\n").length;
  const cleanedLineCount = outputText === "" ? 0 : outputText.split("\n").length;
  const duplicatesRemoved = Math.max(0, originalLineCount - cleanedLineCount);

  const sidebarControls = (
    <>
      <div className="flex flex-col gap-3 select-none">
        <div
          onClick={() => setPreserveOrder(prev => !prev)}
          className="flex items-center gap-3 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/30 hover:border-purple-500/30 transition-all cursor-pointer"
        >
          <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
            preserveOrder 
              ? "bg-purple-500 border-purple-500 text-white" 
              : "border-zinc-300 dark:border-zinc-700"
          }`}>
            {preserveOrder && (
              <span className="material-symbols-outlined text-[12px] font-black">check</span>
            )}
          </div>
          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Preserve Order</span>
        </div>

        <div
          onClick={() => setIgnoreEmpty(prev => !prev)}
          className="flex items-center gap-3 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/30 hover:border-purple-500/30 transition-all cursor-pointer"
        >
          <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
            ignoreEmpty 
              ? "bg-purple-500 border-purple-500 text-white" 
              : "border-zinc-300 dark:border-zinc-700"
          }`}>
            {ignoreEmpty && (
              <span className="material-symbols-outlined text-[12px] font-black">check</span>
            )}
          </div>
          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Ignore Empty Lines</span>
        </div>

        <div
          onClick={() => setCaseInsensitive(prev => !prev)}
          className="flex items-center gap-3 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/30 hover:border-purple-500/30 transition-all cursor-pointer"
        >
          <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
            caseInsensitive 
              ? "bg-purple-500 border-purple-500 text-white" 
              : "border-zinc-300 dark:border-zinc-700"
          }`}>
            {caseInsensitive && (
              <span className="material-symbols-outlined text-[12px] font-black">check</span>
            )}
          </div>
          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Case Insensitive</span>
        </div>
      </div>

      {inputText && (
        <div className="bg-purple-500/[0.02] border border-purple-500/20 rounded-2xl p-4 space-y-2.5 text-xs font-bold text-zinc-550 mt-4 select-none">
          <div className="flex justify-between">
            <span>Original Lines:</span>
            <span className="text-zinc-800 dark:text-zinc-200">{originalLineCount}</span>
          </div>
          <div className="flex justify-between">
            <span>Unique Lines:</span>
            <span className="text-zinc-800 dark:text-zinc-200">{cleanedLineCount}</span>
          </div>
          <div className="flex justify-between text-purple-500 border-t border-border-subtle pt-2">
            <span>Removed:</span>
            <span>{duplicatesRemoved} lines</span>
          </div>
        </div>
      )}
    </>
  );

  return (
    <TextToolLayout
      title="Remove Duplicate Lines"
      description="Clean lists, values, or code lines by discarding duplicate occurrences completely locally."
      inputValue={inputText}
      onInputChange={setInputText}
      outputValue={outputText}
      readOnlyOutput={true}
      sidebarControls={sidebarControls}
      onReset={handleReset}
      downloadFileName="cleaned_text.txt"
    />
  );
}
