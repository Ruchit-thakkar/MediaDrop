"use client";

import { useState, useEffect } from "react";
import DevToolLayout from "../components/DevToolLayout";

export default function PasswordGeneratorPage() {
  const [password, setPassword] = useState("");
  const [length, setLength] = useState(16);
  const [useUppercase, setUseUppercase] = useState(true);
  const [useLowercase, setUseLowercase] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  const handleGenerate = () => {
    let charset = "";
    if (useUppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (useLowercase) charset += "abcdefghijklmnopqrstuvwxyz";
    if (useNumbers) charset += "0123456789";
    if (useSymbols) charset += "!@#$%^&*()_+-=[]{}|;:',./<>?";

    if (!charset) {
      setPassword("Please select at least one character type.");
      return;
    }

    let generated = "";
    const randomBuffer = new Uint32Array(length);
    window.crypto.getRandomValues(randomBuffer);

    for (let i = 0; i < length; i++) {
      const randomIndex = randomBuffer[i] % charset.length;
      generated += charset.charAt(randomIndex);
    }

    setPassword(generated);
  };

  // Generate on first mount and setting changes
  useEffect(() => {
    handleGenerate();
  }, [length, useUppercase, useLowercase, useNumbers, useSymbols]);

  const handleReset = () => {
    setLength(16);
    setUseUppercase(true);
    setUseLowercase(true);
    setUseNumbers(true);
    setUseSymbols(true);
  };

  const handleCopy = () => {
    if (!password || password.startsWith("Please")) return;
    navigator.clipboard.writeText(password);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Strength computation based on password entropy (L * log2(R))
  const getPasswordStrength = () => {
    let poolSize = 0;
    if (useUppercase) poolSize += 26;
    if (useLowercase) poolSize += 26;
    if (useNumbers) poolSize += 10;
    if (useSymbols) poolSize += 29;

    if (poolSize === 0 || password.startsWith("Please")) {
      return { score: 0, label: "None", color: "text-zinc-450 bg-zinc-500/10 border-zinc-500/20" };
    }

    const entropy = length * Math.log2(poolSize);

    if (entropy < 36) {
      return { score: 1, label: "Weak / Vulnerable", color: "text-red-500 bg-red-500/10 border-red-500/20" };
    } else if (entropy < 60) {
      return { score: 2, label: "Medium Security", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" };
    } else if (entropy < 90) {
      return { score: 3, label: "Strong & Safe", color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20" };
    } else {
      return { score: 4, label: "Cryptographically Secure", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" };
    }
  };

  const strength = getPasswordStrength();

  const sidebarControls = (
    <>
      {/* Password Length */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex justify-between select-none">
          <span>Password Length</span>
          <span className="font-mono text-purple-500">{length} Chars</span>
        </label>
        <input
          type="range"
          min="6"
          max="64"
          step="1"
          value={length}
          onChange={(e) => setLength(parseInt(e.target.value))}
          className="w-full accent-purple-500 cursor-pointer"
        />
      </div>

      {/* Settings checklist */}
      <div className="space-y-2.5 pt-2 select-none">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 block mb-1">
          Include Characters
        </label>

        {[
          { key: "upper", label: "Uppercase Letters (A-Z)", val: useUppercase, setter: setUseUppercase },
          { key: "lower", label: "Lowercase Letters (a-z)", val: useLowercase, setter: setUseLowercase },
          { key: "num", label: "Numeric Digits (0-9)", val: useNumbers, setter: setUseNumbers },
          { key: "sym", label: "Special Symbols (!@#$)", val: useSymbols, setter: setUseSymbols }
        ].map((item) => (
          <div
            key={item.key}
            onClick={() => item.setter(prev => !prev)}
            className="flex items-center gap-3 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/30 hover:border-purple-500/30 transition-all cursor-pointer"
          >
            <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
              item.val 
                ? "bg-purple-500 border-purple-500 text-white" 
                : "border-zinc-300 dark:border-zinc-700"
            }`}>
              {item.val && (
                <span className="material-symbols-outlined text-[12px] font-black">check</span>
              )}
            </div>
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Regenerate Button */}
      <button
        onClick={handleGenerate}
        className="w-full mt-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-purple-600/15"
      >
        <span className="material-symbols-outlined text-sm">cached</span>
        Regenerate Key
      </button>
    </>
  );

  return (
    <DevToolLayout
      title="Secure Password Generator"
      description="Create strong, cryptographically secure passwords locally inside your browser using hardware-entropy buffers."
      sidebarControls={sidebarControls}
      onReset={handleReset}
    >
      <div className="flex flex-col gap-6">
        
        {/* Output display block */}
        <div className="bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col gap-4">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-450 select-none">Generated Password</span>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-xl bg-gray-50/50 dark:bg-zinc-900/30 border border-zinc-150 dark:border-zinc-800">
            <span className="text-sm font-mono font-bold text-zinc-850 dark:text-zinc-150 break-all select-all flex-grow">
              {password}
            </span>

            <button
              onClick={handleCopy}
              disabled={password.startsWith("Please")}
              className={`py-2 px-4 rounded-xl border font-bold text-xs transition-all uppercase tracking-wider shrink-0 cursor-pointer flex items-center justify-center gap-1 ${
                isCopied
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-purple-500 hover:border-purple-500/30"
              }`}
            >
              <span className="material-symbols-outlined text-sm">{isCopied ? "check" : "content_copy"}</span>
              {isCopied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        {/* Strength Card */}
        <div className="bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 select-none flex flex-col gap-3">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-450">Strength Audit</span>
          
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 transition-all ${strength.color}`}>
            <div className="flex flex-col">
              <span className="text-[8px] font-extrabold uppercase tracking-widest opacity-60">Fidelity Rating</span>
              <span className="text-sm font-black mt-0.5">{strength.label}</span>
            </div>

            {/* Strength Level Bars */}
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4].map((bar) => (
                <div
                  key={bar}
                  className={`w-5 h-2 rounded transition-all ${
                    bar <= strength.score
                      ? strength.score === 1 ? "bg-red-500" :
                        strength.score === 2 ? "bg-amber-500" :
                        strength.score === 3 ? "bg-indigo-500" :
                        "bg-emerald-500"
                      : "bg-zinc-200 dark:bg-zinc-800"
                  }`}
                ></div>
              ))}
            </div>
          </div>

          <p className="text-[10px] font-bold text-zinc-400 leading-relaxed mt-1">
            Strong passwords prevent dictionary hacking, brute-force cracking attempts, and secure your personal and developer access credentials.
          </p>
        </div>

      </div>
    </DevToolLayout>
  );
}
