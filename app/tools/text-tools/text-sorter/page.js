"use client";

import { useState, useEffect } from "react";
import TextToolLayout from "../components/TextToolLayout";

export default function TextSorterPage() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [sortOrder, setSortOrder] = useState("asc"); // asc, desc
  const [sortType, setSortType] = useState("alpha"); // alpha, numeric, length
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(true);

  useEffect(() => {
    if (!inputText) {
      setOutputText("");
      return;
    }

    const lines = inputText.split("\n");

    const sorted = [...lines].sort((a, b) => {
      const cleanA = ignoreWhitespace ? a.trim() : a;
      const cleanB = ignoreWhitespace ? b.trim() : b;

      if (sortType === "numeric") {
        // Parse leading numeric value or default to 0
        const numA = parseFloat(cleanA.match(/-?\d+(\.\d+)?/)?.[0]) || 0;
        const numB = parseFloat(cleanB.match(/-?\d+(\.\d+)?/)?.[0]) || 0;
        return numA - numB;
      } else if (sortType === "length") {
        return cleanA.length - cleanB.length;
      } else {
        // Alphabetical sort (natural collation support)
        return cleanA.localeCompare(cleanB, undefined, { numeric: true, sensitivity: 'base' });
      }
    });

    if (sortOrder === "desc") {
      sorted.reverse();
    }

    setOutputText(sorted.join("\n"));
  }, [inputText, sortOrder, sortType, ignoreWhitespace]);

  const handleReset = () => {
    setInputText("");
    setOutputText("");
    setSortOrder("asc");
    setSortType("alpha");
    setIgnoreWhitespace(true);
  };

  const sidebarControls = (
    <>
      {/* Sort Direction */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Sort Order
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: "asc", label: "Ascending" },
            { key: "desc", label: "Descending" }
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setSortOrder(item.key)}
              className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                sortOrder === item.key
                  ? "bg-purple-500/10 text-purple-500 border-purple-500/30"
                  : "bg-white/5 dark:bg-white/[0.01] text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-800 dark:hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sort Algorithm */}
      <div className="flex flex-col gap-1.5 mt-2">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Sort Method
        </label>
        <div className="space-y-2 select-none">
          {[
            { key: "alpha", label: "Alphabetical (A-Z)" },
            { key: "numeric", label: "Numeric (0-9)" },
            { key: "length", label: "Line Length (Short-Long)" }
          ].map((item) => (
            <div
              key={item.key}
              onClick={() => setSortType(item.key)}
              className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                sortType === item.key
                  ? "bg-purple-500/10 border-purple-500/25 text-purple-500"
                  : "border-zinc-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/30 hover:border-purple-500/30 text-zinc-700 dark:text-zinc-300"
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border transition-all ${
                sortType === item.key ? "border-purple-500" : "border-zinc-300 dark:border-zinc-700"
              }`}>
                {sortType === item.key && (
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                )}
              </div>
              <span className="text-xs font-bold">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Leading Whitespace */}
      <div className="pt-2 select-none">
        <div
          onClick={() => setIgnoreWhitespace(prev => !prev)}
          className="flex items-center gap-3 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/30 hover:border-purple-500/30 transition-all cursor-pointer"
        >
          <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
            ignoreWhitespace 
              ? "bg-purple-500 border-purple-500 text-white" 
              : "border-zinc-300 dark:border-zinc-700"
          }`}>
            {ignoreWhitespace && (
              <span className="material-symbols-outlined text-[12px] font-black">check</span>
            )}
          </div>
          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Trim Whitespaces</span>
        </div>
      </div>
    </>
  );

  return (
    <TextToolLayout
      title="Text Sorter"
      description="Sort lists, text blocks, or tabular listings alphabetically, numerically, or by line lengths client-side."
      inputValue={inputText}
      onInputChange={setInputText}
      outputValue={outputText}
      readOnlyOutput={true}
      sidebarControls={sidebarControls}
      onReset={handleReset}
      downloadFileName="sorted_text.txt"
    />
  );
}
