"use client";

import { useState, useEffect } from "react";
import TextToolLayout from "../components/TextToolLayout";

export default function FindAndReplacePage() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
  const [regexError, setRegexError] = useState("");

  useEffect(() => {
    if (!inputText) {
      setOutputText("");
      setMatchCount(0);
      setRegexError("");
      return;
    }

    if (!findText) {
      setOutputText(inputText);
      setMatchCount(0);
      setRegexError("");
      return;
    }

    try {
      setRegexError("");
      let regex;
      
      if (useRegex) {
        // Create regex object
        regex = new RegExp(findText, caseSensitive ? "g" : "gi");
      } else {
        // Escape special chars for literal matching
        const escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        regex = new RegExp(escaped, caseSensitive ? "g" : "gi");
      }

      // Count matches
      const matches = inputText.match(regex);
      setMatchCount(matches ? matches.length : 0);

      // Perform replace
      const res = inputText.replace(regex, replaceText);
      setOutputText(res);
    } catch (error) {
      setRegexError(error.message);
      setOutputText(inputText);
      setMatchCount(0);
    }
  }, [inputText, findText, replaceText, caseSensitive, useRegex]);

  const handleReset = () => {
    setInputText("");
    setOutputText("");
    setFindText("");
    setReplaceText("");
    setCaseSensitive(false);
    setUseRegex(false);
    setMatchCount(0);
    setRegexError("");
  };

  const sidebarControls = (
    <>
      <div className="flex flex-col gap-3">
        {/* Find Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            Search For
          </label>
          <input
            type="text"
            value={findText}
            onChange={(e) => setFindText(e.target.value)}
            placeholder="Text to find..."
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-purple-500/50"
          />
        </div>

        {/* Replace Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            Replace With
          </label>
          <input
            type="text"
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            placeholder="Replacement text..."
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-purple-500/50"
          />
        </div>

        {/* Settings */}
        <div className="flex flex-col gap-2.5 pt-2 select-none">
          <div
            onClick={() => setCaseSensitive(prev => !prev)}
            className="flex items-center gap-3 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/30 hover:border-purple-500/30 transition-all cursor-pointer"
          >
            <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
              caseSensitive 
                ? "bg-purple-500 border-purple-500 text-white" 
                : "border-zinc-300 dark:border-zinc-700"
            }`}>
              {caseSensitive && (
                <span className="material-symbols-outlined text-[10px] font-black">check</span>
              )}
            </div>
            <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">Case Sensitive</span>
          </div>

          <div
            onClick={() => setUseRegex(prev => !prev)}
            className="flex items-center gap-3 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/30 hover:border-purple-500/30 transition-all cursor-pointer"
          >
            <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
              useRegex 
                ? "bg-purple-500 border-purple-500 text-white" 
                : "border-zinc-300 dark:border-zinc-700"
            }`}>
              {useRegex && (
                <span className="material-symbols-outlined text-[10px] font-black">check</span>
              )}
            </div>
            <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">Use RegEx</span>
          </div>
        </div>
      </div>

      {regexError && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/25 rounded-2xl select-none text-[9px] font-bold text-red-500 uppercase tracking-wider leading-relaxed">
          Regex Error: {regexError}
        </div>
      )}

      {findText && !regexError && (
        <div className="bg-purple-500/[0.02] border border-purple-500/20 rounded-2xl p-4 space-y-2 mt-4 select-none text-xs font-bold text-zinc-550">
          <div className="flex justify-between">
            <span>Matches Found:</span>
            <span className="text-purple-500">{matchCount}</span>
          </div>
        </div>
      )}
    </>
  );

  return (
    <TextToolLayout
      title="Find and Replace"
      description="Locate search terms or regular expression patterns inside text and substitute them client-side."
      inputValue={inputText}
      onInputChange={setInputText}
      outputValue={outputText}
      readOnlyOutput={true}
      sidebarControls={sidebarControls}
      onReset={handleReset}
      downloadFileName="replaced_text.txt"
    />
  );
}
