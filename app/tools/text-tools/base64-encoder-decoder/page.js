"use client";

import { useState, useEffect } from "react";
import TextToolLayout from "../components/TextToolLayout";

export default function Base64EncoderDecoderPage() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [mode, setMode] = useState("encode"); // encode, decode
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
        // Safe Unicode Encode (Text -> Base64)
        const bytes = new TextEncoder().encode(inputText);
        const binString = String.fromCodePoint(...bytes);
        const base64 = btoa(binString);
        setOutputText(base64);
      } else {
        // Safe Unicode Decode (Base64 -> Text)
        // Clean up whitespaces or newlines from base64 string
        const cleanBase64 = inputText.replace(/\s+/g, "");
        const binString = atob(cleanBase64);
        const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0));
        const decoded = new TextDecoder().decode(bytes);
        setOutputText(decoded);
      }
    } catch (error) {
      console.error(error);
      setValidationError(error.message);
      setOutputText("");
    }
  }, [inputText, mode]);

  const handleReset = () => {
    setInputText("");
    setOutputText("");
    setMode("encode");
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
            { key: "encode", label: "Encode (Text ➔ Base64)" },
            { key: "decode", label: "Decode (Base64 ➔ Text)" }
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
      title="Base64 Encoder / Decoder"
      description="Translate Unicode text strings into Base64 formats or decrypt Base64 hashes instantly client-side."
      inputValue={inputText}
      onInputChange={setInputText}
      outputValue={outputText}
      readOnlyOutput={true}
      sidebarControls={sidebarControls}
      onReset={handleReset}
      downloadFileName={mode === "encode" ? "encoded_base64.txt" : "decoded_text.txt"}
      inputPlaceholder={mode === "encode" ? "Enter plain text here (supports full Unicode & emojis)..." : "Enter Base64 string here..."}
    />
  );
}
