"use client";

import { useState } from "react";
import TextToolLayout from "../components/TextToolLayout";

export default function CharacterCounterPage() {
  const [text, setText] = useState("");

  const handleReset = () => {
    setText("");
  };

  // Computations
  const charCount = text.length;
  const charNoSpaces = text.replace(/\s/g, "").length;
  const lineCount = text === "" ? 0 : text.split("\n").length;
  const whitespaceCount = charCount - charNoSpaces;

  // Let's count letter frequencies (excluding spaces and control chars)
  const frequencies = {};
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (/\s/.test(char)) continue;
    const lowerChar = char.toLowerCase();
    frequencies[lowerChar] = (frequencies[lowerChar] || 0) + 1;
  }

  // Sort frequencies descending
  const topFrequencies = Object.entries(frequencies)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const sidebarControls = (
    <>
      <div className="flex flex-col gap-1.5 select-none">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Character Frequency
        </label>
        {topFrequencies.length > 0 ? (
          <div className="bg-purple-500/[0.02] border border-purple-500/20 rounded-2xl p-4 space-y-3.5 text-xs font-bold">
            {topFrequencies.map(([char, count]) => {
              const percentage = charCount > 0 ? ((count / charCount) * 100).toFixed(1) : 0;
              return (
                <div key={char} className="flex flex-col gap-1">
                  <div className="flex justify-between text-zinc-650 dark:text-zinc-350">
                    <span className="font-mono text-zinc-800 dark:text-zinc-200">"{char}"</span>
                    <span>{count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-500 h-full rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-center text-[10px] font-bold text-zinc-450">
            Letter frequencies will be analyzed as you type.
          </div>
        )}
      </div>
    </>
  );

  return (
    <TextToolLayout
      title="Character Counter"
      description="Perform detailed character, line, and whitespace statistics with real-time character density analytics."
      inputValue={text}
      onInputChange={setText}
      sidebarControls={sidebarControls}
      onReset={handleReset}
      showOutput={false}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        <div className="bg-white dark:bg-[#262930] p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Characters (Total)</span>
          <span className="text-xl font-black mt-1 text-purple-500">{charCount}</span>
        </div>
        <div className="bg-white dark:bg-[#262930] p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Chars (No Spaces)</span>
          <span className="text-xl font-black mt-1 text-zinc-800 dark:text-white">{charNoSpaces}</span>
        </div>
        <div className="bg-white dark:bg-[#262930] p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Lines Count</span>
          <span className="text-xl font-black mt-1 text-zinc-800 dark:text-white">{lineCount}</span>
        </div>
        <div className="bg-white dark:bg-[#262930] p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Whitespaces</span>
          <span className="text-xl font-black mt-1 text-zinc-800 dark:text-white">{whitespaceCount}</span>
        </div>
      </div>
    </TextToolLayout>
  );
}
