"use client";

import { useState } from "react";
import TextToolLayout from "../components/TextToolLayout";

export default function CaseConverterPage() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");

  const handleReset = () => {
    setInputText("");
    setOutputText("");
  };

  // Casing functions
  const toUpper = () => {
    setOutputText(inputText.toUpperCase());
  };

  const toLower = () => {
    setOutputText(inputText.toLowerCase());
  };

  const toTitle = () => {
    const res = inputText
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    setOutputText(res);
  };

  const toSentence = () => {
    const res = inputText
      .toLowerCase()
      .replace(/(^\s*|[.!?]\s+)([a-z])/g, (match, separator, letter) => separator + letter.toUpperCase());
    setOutputText(res);
  };

  const toCamel = () => {
    const words = inputText
      .trim()
      .split(/[^a-zA-Z0-9]+/)
      .filter(Boolean);
    const res = words
      .map((word, idx) => {
        if (idx === 0) return word.toLowerCase();
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join("");
    setOutputText(res);
  };

  const toSnake = () => {
    const res = inputText
      .trim()
      .split(/[^a-zA-Z0-9]+/)
      .filter(Boolean)
      .map(w => w.toLowerCase())
      .join("_");
    setOutputText(res);
  };

  const toPascal = () => {
    const res = inputText
      .trim()
      .split(/[^a-zA-Z0-9]+/)
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join("");
    setOutputText(res);
  };

  const toKebab = () => {
    const res = inputText
      .trim()
      .split(/[^a-zA-Z0-9]+/)
      .filter(Boolean)
      .map(w => w.toLowerCase())
      .join("-");
    setOutputText(res);
  };

  const sidebarControls = (
    <div className="flex flex-col gap-1.5 select-none text-[10px] font-semibold text-zinc-400 leading-relaxed">
      <p>Select any conversion case. The output will be compiled instantly from your input.</p>
    </div>
  );

  const actionButtons = (
    <div className="grid grid-cols-2 gap-2 mt-2">
      {[
        { label: "UPPERCASE", handler: toUpper },
        { label: "lowercase", handler: toLower },
        { label: "Title Case", handler: toTitle },
        { label: "Sentence case", handler: toSentence },
        { label: "camelCase", handler: toCamel },
        { label: "snake_case", handler: toSnake },
        { label: "PascalCase", handler: toPascal },
        { label: "kebab-case", handler: toKebab }
      ].map((btn, idx) => (
        <button
          key={idx}
          onClick={btn.handler}
          disabled={!inputText}
          className="py-2 px-3 text-[11px] font-extrabold rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/5 dark:bg-white/[0.01] text-zinc-650 dark:text-zinc-350 hover:bg-purple-500/10 hover:text-purple-500 hover:border-purple-500/30 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-zinc-650 disabled:hover:border-zinc-200 transition-all cursor-pointer truncate"
        >
          {btn.label}
        </button>
      ))}
    </div>
  );

  return (
    <TextToolLayout
      title="Case Converter"
      description="Quickly convert your text case formatting into UPPERCASE, lowercase, Title Case, Sentence case, and programming conventions."
      inputValue={inputText}
      onInputChange={setInputText}
      outputValue={outputText}
      onOutputChange={setOutputText}
      readOnlyOutput={true}
      sidebarControls={sidebarControls}
      actionButtons={actionButtons}
      onReset={handleReset}
      downloadFileName="cased_text.txt"
    />
  );
}
