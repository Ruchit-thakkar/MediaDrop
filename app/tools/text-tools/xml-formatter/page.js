"use client";

import { useState } from "react";
import TextToolLayout from "../components/TextToolLayout";

// Helper to format XML recursively
const formatXML = (xmlString, spacingVal) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "application/xml");

  const parseError = xmlDoc.getElementsByTagName("parsererror");
  if (parseError.length > 0) {
    throw new Error(parseError[0].textContent);
  }

  const indentStr = spacingVal === "tab" ? "\t" : " ".repeat(parseInt(spacingVal));

  const serializeNode = (node, depth = 0) => {
    const indent = indentStr.repeat(depth);

    // Element node
    if (node.nodeType === 1) { // Node.ELEMENT_NODE
      let attrs = "";
      for (let i = 0; i < node.attributes.length; i++) {
        const attr = node.attributes[i];
        attrs += ` ${attr.name}="${attr.value}"`;
      }

      if (node.childNodes.length === 0) {
        return `${indent}<${node.nodeName}${attrs}/>`;
      }

      // Check if node only has text children
      const onlyText = Array.from(node.childNodes).every(c => c.nodeType === 3 || c.nodeType === 4); // Text or CDATA
      if (onlyText) {
        const textVal = node.textContent.trim();
        return `${indent}<${node.nodeName}${attrs}>${textVal}</${node.nodeName}>`;
      }

      let childrenHTML = "";
      for (let i = 0; i < node.childNodes.length; i++) {
        const child = node.childNodes[i];
        if (child.nodeType === 1 || child.nodeType === 8) { // Element or Comment
          childrenHTML += "\n" + serializeNode(child, depth + 1);
        }
      }
      return `${indent}<${node.nodeName}${attrs}>${childrenHTML}\n${indent}</${node.nodeName}>`;
    }

    // Comment node
    if (node.nodeType === 8) { // Node.COMMENT_NODE
      return `${indent}<!--${node.nodeValue}-->`;
    }

    return "";
  };

  return `<?xml version="1.0" encoding="UTF-8"?>\n` + serializeNode(xmlDoc.documentElement, 0);
};

// Helper to minify XML
const minifyXML = (xmlString) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "application/xml");

  const parseError = xmlDoc.getElementsByTagName("parsererror");
  if (parseError.length > 0) {
    throw new Error(parseError[0].textContent);
  }

  const serializer = new XMLSerializer();
  const rawXml = serializer.serializeToString(xmlDoc);
  // Collapse whitespace between tags
  return rawXml.replace(/>\s+</g, '><').trim();
};

export default function XmlFormatterPage() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [spacing, setSpacing] = useState("2");
  const [validationError, setValidationError] = useState("");

  const handleReset = () => {
    setInputText("");
    setOutputText("");
    setValidationError("");
  };

  const handleBeautify = () => {
    if (!inputText.trim()) return;
    try {
      setValidationError("");
      const formatted = formatXML(inputText, spacing);
      setOutputText(formatted);
    } catch (error) {
      console.error(error);
      setValidationError(error.message);
      setOutputText("");
    }
  };

  const handleMinify = () => {
    if (!inputText.trim()) return;
    try {
      setValidationError("");
      const minified = minifyXML(inputText);
      setOutputText(minified);
    } catch (error) {
      console.error(error);
      setValidationError(error.message);
      setOutputText("");
    }
  };

  const sidebarControls = (
    <>
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Tab Spacing
        </label>
        <select
          value={spacing}
          onChange={(e) => setSpacing(e.target.value)}
          className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-purple-500/50"
        >
          <option value="2">2 Spaces</option>
          <option value="4">4 Spaces</option>
          <option value="tab">1 Tab</option>
        </select>
      </div>

      {validationError && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/25 rounded-2xl select-none text-[9px] font-bold text-red-500 uppercase tracking-wider leading-relaxed">
          <span className="flex items-center gap-1 mb-1">
            <span className="material-symbols-outlined text-[13px]">error</span>
            XML Parsing Error:
          </span>
          <p className="font-mono text-[10px] break-all normal-case font-medium">{validationError}</p>
        </div>
      )}

      {outputText && !validationError && (
        <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-3 mt-4 select-none text-[9px] font-extrabold text-emerald-500 uppercase tracking-widest flex items-center gap-1.5 justify-center">
          <span className="material-symbols-outlined text-[14px]">verified</span>
          XML is Valid!
        </div>
      )}
    </>
  );

  const actionButtons = (
    <div className="grid grid-cols-2 gap-2 mt-2">
      <button
        onClick={handleBeautify}
        disabled={!inputText.trim()}
        className="py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-lg shadow-purple-600/15"
      >
        <span className="material-symbols-outlined text-sm">format_align_left</span>
        Beautify XML
      </button>

      <button
        onClick={handleMinify}
        disabled={!inputText.trim()}
        className="py-2.5 bg-zinc-800 hover:bg-zinc-900 dark:bg-zinc-900 dark:hover:bg-zinc-950 border border-zinc-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none text-zinc-350 dark:text-zinc-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
      >
        <span className="material-symbols-outlined text-sm">minify</span>
        Minify XML
      </button>
    </div>
  );

  return (
    <TextToolLayout
      title="XML Formatter & Validator"
      description="Verify, pretty-print, and compress XML markup trees fully locally inside the browser."
      inputValue={inputText}
      onInputChange={setInputText}
      outputValue={outputText}
      onOutputChange={setOutputText}
      readOnlyOutput={true}
      sidebarControls={sidebarControls}
      actionButtons={actionButtons}
      onReset={handleReset}
      downloadFileName="formatted_data.xml"
    />
  );
}
