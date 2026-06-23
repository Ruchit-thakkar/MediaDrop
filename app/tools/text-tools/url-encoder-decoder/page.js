"use client";

import { useState, useEffect } from "react";
import TextToolLayout from "../components/TextToolLayout";

export default function UrlEncoderDecoderPage() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [mode, setMode] = useState("encode"); // encode, decode
  const [encodeAll, setEncodeAll] = useState(true); // true = encodeURIComponent, false = encodeURI
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (!inputText) {
      setOutputText("");
      setValidationError("");
      return;
    }

    try {
      setValidationError("");
      if (mode === "encode") {
        if (encodeAll) {
          setOutputText(encodeURIComponent(inputText));
        } else {
          setOutputText(encodeURI(inputText));
        }
      } else {
        if (encodeAll) {
          setOutputText(decodeURIComponent(inputText));
        } else {
          setOutputText(decodeURI(inputText));
        }
      }
    } catch (error) {
      console.error(error);
      setValidationError(error.message);
      setOutputText("");
    }
  }, [inputText, mode, encodeAll]);

  const handleReset = () => {
    setInputText("");
    setOutputText("");
    setMode("encode");
    setEncodeAll(true);
    setValidationError("");
  };

  const sidebarControls = (
    <>
      {/* Mode selection */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Conversion Mode
        </label>
        <div className="flex flex-col gap-2">
          {[
            { key: "encode", label: "Encode URL" },
            { key: "decode", label: "Decode URL" }
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setMode(item.key);
                setInputText("");
                setOutputText("");
                setValidationError("");
              }}
              className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                mode === item.key
                  ? "bg-purple-500/10 text-purple-500 border-purple-500/30"
                  : "bg-white/5 dark:bg-white/[0.01] text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-800 dark:hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Level Selection */}
      <div className="pt-2 select-none">
        <div
          onClick={() => setEncodeAll(prev => !prev)}
          className="flex items-center gap-3 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/30 hover:border-purple-500/30 transition-all cursor-pointer"
        >
          <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
            encodeAll 
              ? "bg-purple-500 border-purple-500 text-white" 
              : "border-zinc-300 dark:border-zinc-700"
          }`}>
            {encodeAll && (
              <span className="material-symbols-outlined text-[12px] font-black">check</span>
            )}
          </div>
          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
            {encodeAll ? "Encode All (Component)" : "Encode Special Only"}
          </span>
        </div>
        <p className="text-[9px] font-semibold text-zinc-400 leading-relaxed mt-1.5">
          {encodeAll 
            ? "Escapes all special characters including symbols like '?', '&', '=', '/', and ':'." 
            : "Retains parameter bindings and protocol markers while escaping spaces and invalid characters."}
        </p>
      </div>

      {validationError && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/25 rounded-2xl select-none text-[9px] font-bold text-red-500 uppercase tracking-wider leading-relaxed">
          <span className="flex items-center gap-1 mb-1">
            <span className="material-symbols-outlined text-[13px]">error</span>
            Decoding Error:
          </span>
          <p className="font-mono text-[10px] break-all normal-case font-medium">{validationError}</p>
        </div>
      )}
    </>
  );

  return (
    <TextToolLayout
      title="URL Encoder / Decoder"
      description="Encode plain text strings into URI-compatible percentages or restore encoded URLs client-side."
      inputValue={inputText}
      onInputChange={setInputText}
      outputValue={outputText}
      readOnlyOutput={true}
      sidebarControls={sidebarControls}
      onReset={handleReset}
      downloadFileName={mode === "encode" ? "encoded_url.txt" : "decoded_url.txt"}
      inputPlaceholder={mode === "encode" ? "Enter plain URL link or query string here..." : "Enter encoded URL string here..."}
    />
  );
}
