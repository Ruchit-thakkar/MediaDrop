"use client";

import { useState, useEffect } from "react";
import DevToolLayout from "../components/DevToolLayout";

const escapeHtml = (text) => {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export default function RegexTesterPage() {
  const [pattern, setPattern] = useState("[a-zA-Z0-9]+@[a-zA-Z0-9]+\\.[a-z]+"); // email regex default
  const [testString, setTestString] = useState("Hello user@domain.com, please contact support@mediadrop.org for help.");
  const [globalFlag, setGlobalFlag] = useState(true);
  const [caseFlag, setCaseFlag] = useState(true);
  const [multilineFlag, setMultilineFlag] = useState(false);
  const [dotAllFlag, setDotAllFlag] = useState(false);
  const [unicodeFlag, setUnicodeFlag] = useState(false);

  const [highlightedHtml, setHighlightedHtml] = useState("");
  const [matches, setMatches] = useState([]);
  const [regexError, setRegexError] = useState("");

  // Recalculate matches on inputs change
  useEffect(() => {
    if (!testString) {
      setHighlightedHtml("");
      setMatches([]);
      setRegexError("");
      return;
    }

    if (!pattern) {
      setHighlightedHtml(escapeHtml(testString));
      setMatches([]);
      setRegexError("");
      return;
    }

    try {
      setRegexError("");
      const flags = 
        (globalFlag ? "g" : "") + 
        (caseFlag ? "i" : "") + 
        (multilineFlag ? "m" : "") + 
        (dotAllFlag ? "s" : "") + 
        (unicodeFlag ? "u" : "");

      const regex = new RegExp(pattern, flags);
      const matchesList = [];
      let html = "";
      let lastIndex = 0;
      let match;

      if (flags.includes("g")) {
        while ((match = regex.exec(testString)) !== null) {
          // Guard against infinite loops for zero-width matches (like ^ or $)
          if (match.index === regex.lastIndex) {
            regex.lastIndex++;
          }
          
          const before = testString.substring(lastIndex, match.index);
          const matchedText = match[0];
          
          html += escapeHtml(before) + `<mark class="bg-purple-500/25 dark:bg-purple-500/35 border border-purple-500/30 text-purple-600 dark:text-purple-300 px-0.5 rounded font-bold">${escapeHtml(matchedText)}</mark>`;
          matchesList.push(matchedText);
          lastIndex = regex.lastIndex;
        }
        html += escapeHtml(testString.substring(lastIndex));
      } else {
        match = regex.exec(testString);
        if (match) {
          const before = testString.substring(0, match.index);
          const matchedText = match[0];
          const after = testString.substring(match.index + matchedText.length);
          
          html = escapeHtml(before) + `<mark class="bg-purple-500/25 dark:bg-purple-500/35 border border-purple-500/30 text-purple-600 dark:text-purple-300 px-0.5 rounded font-bold">${escapeHtml(matchedText)}</mark>` + escapeHtml(after);
          matchesList.push(matchedText);
        } else {
          html = escapeHtml(testString);
        }
      }

      setHighlightedHtml(html);
      setMatches(matchesList);

    } catch (error) {
      console.warn("RegExp compilation warning:", error);
      setRegexError(error.message);
      setHighlightedHtml(escapeHtml(testString));
      setMatches([]);
    }
  }, [pattern, testString, globalFlag, caseFlag, multilineFlag, dotAllFlag, unicodeFlag]);

  const handleReset = () => {
    setPattern("[a-zA-Z0-9]+@[a-zA-Z0-9]+\\.[a-z]+");
    setTestString("Hello user@domain.com, please contact support@mediadrop.org for help.");
    setGlobalFlag(true);
    setCaseFlag(true);
    setMultilineFlag(false);
    setDotAllFlag(false);
    setUnicodeFlag(false);
    setRegexError("");
  };

  const sidebarControls = (
    <>
      {/* Pattern Input */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Regular Expression
        </label>
        <div className="flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold">
          <span className="text-zinc-400 dark:text-zinc-500 font-bold mr-1">/</span>
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="[a-z]+"
            className="w-full bg-transparent focus:outline-none text-zinc-800 dark:text-zinc-200 font-mono font-bold"
          />
          <span className="text-zinc-400 dark:text-zinc-500 font-bold ml-1">/</span>
          <span className="text-purple-500 font-bold ml-1 text-[10px]">
            {(globalFlag ? "g" : "") + 
             (caseFlag ? "i" : "") + 
             (multilineFlag ? "m" : "") + 
             (dotAllFlag ? "s" : "") + 
             (unicodeFlag ? "u" : "")}
          </span>
        </div>
      </div>

      {/* Flag checkboxes */}
      <div className="space-y-2.5 pt-2 select-none">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 block mb-1">
          Regex Flags
        </label>

        {[
          { key: "g", label: "Global Match (g)", val: globalFlag, setter: setGlobalFlag },
          { key: "i", label: "Ignore Case (i)", val: caseFlag, setter: setCaseFlag },
          { key: "m", label: "Multiline Mode (m)", val: multilineFlag, setter: setMultilineFlag },
          { key: "s", label: "Dot All / Single Line (s)", val: dotAllFlag, setter: setDotAllFlag },
          { key: "u", label: "Unicode Collation (u)", val: unicodeFlag, setter: setUnicodeFlag }
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

      {regexError && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/25 rounded-2xl select-none text-[9px] font-bold text-red-500 uppercase tracking-wider leading-relaxed">
          <span className="flex items-center gap-1 mb-1">
            <span className="material-symbols-outlined text-[13px]">error</span>
            Regex Syntax Error:
          </span>
          <p className="font-mono text-[10px] break-all normal-case font-medium">{regexError}</p>
        </div>
      )}

      {pattern && !regexError && (
        <div className="bg-purple-500/[0.02] border border-purple-500/20 rounded-2xl p-4 space-y-2 mt-4 select-none text-xs font-bold text-zinc-550">
          <div className="flex justify-between">
            <span>Matches Found:</span>
            <span className="text-purple-500">{matches.length}</span>
          </div>
        </div>
      )}
    </>
  );

  return (
    <DevToolLayout
      title="Regex Pattern Tester"
      description="Write regular expressions, test strings in real time, and inspect highlighted capture matches client-side."
      sidebarControls={sidebarControls}
      onReset={handleReset}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        
        {/* Test String Input Column */}
        <div className="flex flex-col bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden h-[380px]">
          <div className="bg-gray-50 dark:bg-zinc-800/80 px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center select-none">
            <h3 className="font-extrabold text-zinc-700 dark:text-zinc-300 text-xs">Test Subject String</h3>
            <button
              onClick={() => setTestString("")}
              disabled={!testString}
              className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-450 hover:text-red-500 disabled:opacity-40 transition-colors flex items-center gap-0.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[12px]">delete</span>
              Clear
            </button>
          </div>
          <textarea
            value={testString}
            onChange={(e) => setTestString(e.target.value)}
            placeholder="Type your test string lines here..."
            className="w-full flex-grow p-4 bg-transparent text-zinc-850 dark:text-zinc-150 text-xs font-mono placeholder-zinc-400 focus:outline-none resize-none leading-relaxed"
          />
        </div>

        {/* Matches Display Column */}
        <div className="flex flex-col bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden h-[380px]">
          <div className="bg-gray-50 dark:bg-zinc-800/80 px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center select-none">
            <h3 className="font-extrabold text-zinc-700 dark:text-zinc-300 text-xs">Highlighted Matches</h3>
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-purple-500">Live Highlights</span>
          </div>
          
          {/* Highlight render box (div styled like textarea) */}
          <div
            className="w-full flex-grow p-4 bg-transparent text-zinc-800 dark:text-zinc-200 text-xs font-mono overflow-y-auto leading-relaxed whitespace-pre-wrap break-all select-text"
            dangerouslySetInnerHTML={{ __html: highlightedHtml || "<span class='text-zinc-450 italic select-none'>Awaiting test string input...</span>" }}
          />
        </div>

      </div>
    </DevToolLayout>
  );
}
