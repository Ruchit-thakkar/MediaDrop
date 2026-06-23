"use client";

import { useState, useEffect } from "react";
import DevToolLayout from "../components/DevToolLayout";

const LOREM_WORDS = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", 
  "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore", 
  "magna", "aliqua", "ut", "enim", "ad", "minim", "veniam", "quis", "nostrud", 
  "exercitation", "ullamco", "laboris", "nisi", "ut", "aliquip", "ex", "ea", 
  "commodo", "consequat", "duis", "aute", "irure", "dolor", "in", "reprehenderit", 
  "in", "voluptate", "velit", "esse", "cillum", "dolore", "eu", "fugiat", "nulla", 
  "pariatur", "excepteur", "sint", "occaecat", "cupidatat", "non", "proident", 
  "sunt", "in", "culpa", "qui", "officia", "deserunt", "mollit", "anim", "id", "est", 
  "laborum", "et", "harum", "quidem", "rerum", "facilis", "est", "et", "expedita", 
  "distinctio", "nam", "libero", "tempore", "cum", "soluta", "nobis", "est", 
  "eligendi", "optio", "cumque", "nihil", "impediet", "quo", "minus", "id", 
  "quod", "maxime", "placeat", "facere", "possimus", "omnis", "voluptas", 
  "assumenda", "est", "omnis", "dolor", "repellendus", "temporibus", "autem", 
  "quibusdam", "et", "aut", "officiis", "debitis", "aut", "rerum", "necessitatibus", 
  "saepe", "eveniet", "ut", "et", "voluptates", "repudiandae", "sint", "et", 
  "molestiae", "non", "recusandae", "itaque", "earum", "rerum", "hic", "tenetur", 
  "a", "sapiente", "delectus", "ut", "aut", "reiciendis", "voluptatibus", "maiores", 
  "alias", "consequatur", "aut", "perferendis", "doloribus", "asperiores", "repellat"
];

export default function LoremIpsumGeneratorPage() {
  const [genType, setGenType] = useState("paragraphs"); // words, sentences, paragraphs, lists
  const [amount, setAmount] = useState(5);
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [includeHtml, setIncludeHtml] = useState(false);
  const [outputHtml, setOutputHtml] = useState("");
  const [outputText, setOutputText] = useState("");
  const [copiedKey, setCopiedKey] = useState(null);

  const generateLorem = () => {
    let resultParagraphs = [];

    // Helper: generate random number in range
    const randRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    // Helper: capitalize word
    const capitalize = (word) => word.charAt(0).toUpperCase() + word.slice(1);

    // Helper: make a random sentence
    const makeSentence = (forceLoremStart = false) => {
      const length = randRange(6, 14);
      let sentenceWords = [];

      if (forceLoremStart) {
        sentenceWords = ["lorem", "ipsum", "dolor", "sit", "amet"];
        while (sentenceWords.length < length) {
          sentenceWords.push(LOREM_WORDS[randRange(0, LOREM_WORDS.length - 1)]);
        }
      } else {
        for (let i = 0; i < length; i++) {
          sentenceWords.push(LOREM_WORDS[randRange(0, LOREM_WORDS.length - 1)]);
        }
      }

      // Add comma in between sometimes
      if (length > 8 && Math.random() > 0.4) {
        const commaIdx = randRange(3, length - 3);
        sentenceWords[commaIdx] += ",";
      }

      return capitalize(sentenceWords.join(" ")) + ".";
    };

    // Helper: make a random paragraph
    const makeParagraph = (forceLoremStart = false) => {
      const sentenceCount = randRange(3, 6);
      let sentences = [];
      for (let i = 0; i < sentenceCount; i++) {
        sentences.push(makeSentence(i === 0 && forceLoremStart));
      }
      return sentences.join(" ");
    };

    if (genType === "words") {
      let words = [];
      if (startWithLorem) {
        words = ["lorem", "ipsum", "dolor", "sit", "amet"];
      }
      while (words.length < amount) {
        words.push(LOREM_WORDS[randRange(0, LOREM_WORDS.length - 1)]);
      }
      // Trim to exact amount
      words = words.slice(0, amount);
      const plainText = capitalize(words.join(" ")) + ".";
      setOutputText(plainText);
      setOutputHtml(includeHtml ? `<p>${plainText}</p>` : plainText);
      return;
    }

    if (genType === "sentences") {
      let sentences = [];
      for (let i = 0; i < amount; i++) {
        sentences.push(makeSentence(i === 0 && startWithLorem));
      }
      const plainText = sentences.join(" ");
      setOutputText(plainText);
      setOutputHtml(includeHtml ? `<p>${plainText}</p>` : plainText);
      return;
    }

    if (genType === "paragraphs") {
      let paragraphs = [];
      for (let i = 0; i < amount; i++) {
        paragraphs.push(makeParagraph(i === 0 && startWithLorem));
      }
      setOutputText(paragraphs.join("\n\n"));
      setOutputHtml(
        includeHtml
          ? paragraphs.map((p) => `<p>${p}</p>`).join("\n")
          : paragraphs.join("\n\n")
      );
      return;
    }

    if (genType === "lists") {
      let items = [];
      for (let i = 0; i < amount; i++) {
        items.push(makeSentence(i === 0 && startWithLorem).slice(0, -1)); // trim period
      }
      setOutputText(items.map(item => `• ${item}`).join("\n"));
      setOutputHtml(
        includeHtml
          ? `<ul>\n${items.map((item) => `  <li>${item}</li>`).join("\n")}\n</ul>`
          : items.map(item => `• ${item}`).join("\n")
      );
    }
  };

  // Re-generate whenever options change
  useEffect(() => {
    generateLorem();
  }, [genType, amount, startWithLorem, includeHtml]);

  const handleReset = () => {
    setGenType("paragraphs");
    setAmount(5);
    setStartWithLorem(true);
    setIncludeHtml(false);
  };

  const handleCopy = (val, key) => {
    if (!val) return;
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleDownload = () => {
    const textToDownload = includeHtml ? outputHtml : outputText;
    const blob = new Blob([textToDownload], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lorem-ipsum-${genType}-${amount}.${includeHtml ? "html" : "txt"}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const sidebarControls = (
    <div className="space-y-4 select-none">
      {/* Type selection */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-555">
          Type
        </label>
        <div className="grid grid-cols-2 gap-1 bg-black/5 dark:bg-black/25 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
          {["paragraphs", "sentences", "words", "lists"].map((type) => (
            <button
              key={type}
              onClick={() => {
                setGenType(type);
                if (type === "words") setAmount(50);
                else if (type === "sentences") setAmount(10);
                else setAmount(5);
              }}
              className={`py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-colors cursor-pointer ${
                genType === type
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-purple-500 hover:bg-black/5"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Amount input/slider */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-555">
          <span>Amount</span>
          <span className="font-mono text-purple-500 font-bold">{amount}</span>
        </div>
        <input
          type="range"
          min="1"
          max={genType === "words" ? 500 : genType === "sentences" ? 50 : 25}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full accent-purple-600 bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Checkboxes */}
      <div className="space-y-2 pt-2 border-t border-border-subtle">
        <label className="flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 cursor-pointer">
          <input
            type="checkbox"
            checked={startWithLorem}
            onChange={(e) => setStartWithLorem(e.target.checked)}
            className="w-4 h-4 rounded border-zinc-300 text-purple-600 focus:ring-purple-500 dark:border-zinc-700 bg-transparent"
          />
          Start with &quot;Lorem ipsum&quot;
        </label>

        <label className="flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 cursor-pointer">
          <input
            type="checkbox"
            checked={includeHtml}
            onChange={(e) => setIncludeHtml(e.target.checked)}
            className="w-4 h-4 rounded border-zinc-300 text-purple-600 focus:ring-purple-500 dark:border-zinc-700 bg-transparent"
          />
          Wrap in HTML tags
        </label>
      </div>

      {/* Main Copy/Download Actions */}
      <div className="space-y-2 pt-4 border-t border-border-subtle">
        <button
          onClick={() => handleCopy(includeHtml ? outputHtml : outputText, "text")}
          className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-purple-600/15"
        >
          <span className="material-symbols-outlined text-[15px]">
            {copiedKey === "text" ? "check" : "content_copy"}
          </span>
          {copiedKey === "text" ? "Copied Plain Text" : "Copy Plain Text"}
        </button>

        {includeHtml && (
          <button
            onClick={() => handleCopy(outputHtml, "html")}
            className="w-full py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-zinc-200 dark:border-zinc-700"
          >
            <span className="material-symbols-outlined text-[15px]">
              {copiedKey === "html" ? "check" : "code"}
            </span>
            {copiedKey === "html" ? "Copied HTML Code" : "Copy HTML Code"}
          </button>
        )}

        <button
          onClick={handleDownload}
          className="w-full py-2 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-zinc-650 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-zinc-200 dark:border-zinc-800"
        >
          <span className="material-symbols-outlined text-[15px]">download</span>
          Download File
        </button>
      </div>
    </div>
  );

  return (
    <DevToolLayout
      title="Lorem Ipsum Generator"
      description="Generate standard dummy text blocks, paragraphs, sentences, words, or lists formatted as plain text or clean HTML tags."
      sidebarControls={sidebarControls}
      onReset={handleReset}
    >
      <div className="flex flex-col bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden h-[420px]">
        {/* Output Header */}
        <div className="bg-gray-50 dark:bg-zinc-800/80 px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center select-none">
          <h3 className="font-extrabold text-zinc-700 dark:text-zinc-300 text-xs">Generated Output Preview</h3>
          <button
            onClick={generateLorem}
            className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-450 hover:text-purple-600 transition-colors flex items-center gap-0.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[12px]">refresh</span>
            Regenerate
          </button>
        </div>

        {/* Text Container */}
        <div className="w-full flex-grow p-5 bg-transparent overflow-y-auto font-sans leading-relaxed text-zinc-800 dark:text-zinc-200 text-xs select-text">
          {includeHtml ? (
            <pre className="font-mono text-purple-600 dark:text-purple-400 whitespace-pre-wrap select-all selection:bg-purple-500/20">
              {outputHtml}
            </pre>
          ) : (
            <div className="whitespace-pre-wrap select-all selection:bg-purple-500/20">
              {outputText}
            </div>
          )}
        </div>
      </div>
    </DevToolLayout>
  );
}
