"use client";

import { useState, useEffect } from "react";
import TextToolLayout from "../components/TextToolLayout";

const LOREM_WORDS = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", 
  "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore", 
  "magna", "aliqua", "ut", "enim", "ad", "minim", "veniam", "quis", "nostrud", 
  "exercitation", "ullamco", "laboris", "nisi", "ut", "aliquip", "ex", "ea", 
  "commodo", "consequat", "duis", "aute", "irure", "dolor", "in", "reprehenderit", 
  "in", "voluptate", "velit", "esse", "cillum", "dolore", "eu", "fugiat", "nulla", 
  "pariatur", "excepteur", "sint", "occaecat", "cupidatat", "non", "proident", 
  "sunt", "in", "culpa", "qui", "officia", "deserunt", "mollit", "anim", "id", "est", 
  "laborum", "tempus", "auctor", "feugiat", "mollis", "pretium", "bibendum", "congue", 
  "egestas", "facilisis", "eleifend", "habitasse", "hac", "nascetur", "ridiculus", 
  "mus", "phasellus", "potenti", "pulvinar", "purus", "semper", "sollicitudin", "tristique"
];

export default function RandomTextGeneratorPage() {
  const [outputText, setOutputText] = useState("");
  const [generatorType, setGeneratorType] = useState("paragraphs"); // words, sentences, paragraphs
  const [count, setCount] = useState(5); // amount to generate
  const [startWithLorem, setStartWithLorem] = useState(true);

  const getRandomWord = () => {
    return LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)];
  };

  const generateSentence = (startWithLoremIpsum = false) => {
    const len = Math.floor(Math.random() * 8) + 6; // 6 to 13 words
    const words = [];
    
    if (startWithLoremIpsum) {
      words.push("Lorem", "ipsum", "dolor", "sit", "amet");
    }

    while (words.length < len) {
      const word = getRandomWord();
      if (words.length === 0) {
        words.push(word.charAt(0).toUpperCase() + word.slice(1));
      } else {
        words.push(word);
      }
    }

    return words.join(" ") + ".";
  };

  const generateParagraph = (startWithLoremIpsum = false) => {
    const sentenceCount = Math.floor(Math.random() * 4) + 4; // 4 to 7 sentences
    const sentences = [];
    for (let i = 0; i < sentenceCount; i++) {
      sentences.push(generateSentence(i === 0 && startWithLoremIpsum));
    }
    return sentences.join(" ");
  };

  const handleGenerate = () => {
    let result = [];
    
    if (generatorType === "words") {
      let words = [];
      if (startWithLorem && count >= 5) {
        words.push("lorem", "ipsum", "dolor", "sit", "amet");
      }
      while (words.length < count) {
        words.push(getRandomWord());
      }
      result.push(words.join(" "));
    } else if (generatorType === "sentences") {
      for (let i = 0; i < count; i++) {
        result.push(generateSentence(i === 0 && startWithLorem));
      }
      result = [result.join(" ")];
    } else {
      for (let i = 0; i < count; i++) {
        result.push(generateParagraph(i === 0 && startWithLorem));
      }
    }

    setOutputText(result.join("\n\n"));
  };

  // Generate automatically on first load
  useEffect(() => {
    handleGenerate();
  }, []);

  const handleReset = () => {
    setGeneratorType("paragraphs");
    setCount(5);
    setStartWithLorem(true);
    setOutputText("");
  };

  const sidebarControls = (
    <>
      {/* Type */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Generate Type
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { key: "words", label: "Words" },
            { key: "sentences", label: "Sentences" },
            { key: "paragraphs", label: "Paragraphs" }
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setGeneratorType(item.key)}
              className={`py-2 px-1 text-[10px] font-extrabold rounded-xl border transition-all cursor-pointer truncate ${
                generatorType === item.key
                  ? "bg-purple-500/10 text-purple-500 border-purple-500/30"
                  : "bg-white/5 dark:bg-white/[0.01] text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-800 dark:hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Count Slider */}
      <div className="flex flex-col gap-1.5 mt-2">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex justify-between select-none">
          <span>Amount</span>
          <span className="font-mono text-purple-500">{count} {generatorType}</span>
        </label>
        <input
          type="range"
          min="1"
          max={generatorType === "words" ? 200 : generatorType === "sentences" ? 50 : 25}
          step="1"
          value={count}
          onChange={(e) => setCount(parseInt(e.target.value))}
          className="w-full accent-purple-500 cursor-pointer"
        />
      </div>

      {/* Start with Lorem Ipsum */}
      <div className="pt-2 select-none">
        <div
          onClick={() => setStartWithLorem(prev => !prev)}
          className="flex items-center gap-3 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/30 hover:border-purple-500/30 transition-all cursor-pointer"
        >
          <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
            startWithLorem 
              ? "bg-purple-500 border-purple-500 text-white" 
              : "border-zinc-300 dark:border-zinc-700"
          }`}>
            {startWithLorem && (
              <span className="material-symbols-outlined text-[12px] font-black">check</span>
            )}
          </div>
          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Start with "Lorem..."</span>
        </div>
      </div>

      {/* Generate Trigger */}
      <button
        onClick={handleGenerate}
        className="w-full mt-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-purple-600/15"
      >
        <span className="material-symbols-outlined text-sm">cycle</span>
        Generate Text
      </button>
    </>
  );

  return (
    <TextToolLayout
      title="Random Text Generator"
      description="Create custom dummy text or placeholder Lorem Ipsum segments client-side for typesetting or layout previews."
      sidebarControls={sidebarControls}
      onReset={handleReset}
      showOutput={false} // Override to render our custom single-output workspace
    >
      {/* Workspace custom override: Single Output Panel */}
      <div className="flex flex-col bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden h-[420px] w-full">
        <div className="bg-gray-50 dark:bg-zinc-800/80 px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center select-none">
          <h3 className="font-extrabold text-zinc-700 dark:text-zinc-300 text-xs">Generated Text</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(outputText);
                alert("Copied to clipboard!");
              }}
              disabled={!outputText}
              className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-450 hover:text-purple-500 disabled:opacity-40 transition-colors flex items-center gap-0.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[12px]">content_copy</span>
              Copy
            </button>
            <button
              onClick={() => {
                const blob = new Blob([outputText], { type: "text/plain;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "lorem_ipsum.txt";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              disabled={!outputText}
              className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-450 hover:text-purple-500 disabled:opacity-40 transition-colors flex items-center gap-0.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[12px]">download</span>
              Download
            </button>
          </div>
        </div>
        <textarea
          readOnly
          value={outputText}
          className="w-full flex-grow p-4 bg-transparent text-zinc-800 dark:text-zinc-200 text-xs font-semibold placeholder-zinc-400 focus:outline-none resize-none leading-relaxed"
        />
        <div className="bg-gray-50 dark:bg-zinc-800/30 border-t border-zinc-200 dark:border-zinc-800 px-4 py-2 flex justify-between items-center select-none text-[9px] font-bold text-zinc-450 uppercase tracking-widest">
          <span>Words: {outputText ? outputText.trim().split(/\s+/).length : 0}</span>
          <span>Chars: {outputText.length}</span>
        </div>
      </div>
    </TextToolLayout>
  );
}
