"use client";

import { useState, useEffect, useRef } from "react";
import DevToolLayout from "../components/DevToolLayout";

// Script loader helper for JsBarcode
const loadJsBarcode = () => {
  return new Promise((resolve, reject) => {
    if (window.JsBarcode) return resolve();
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load JsBarcode.js"));
    document.body.appendChild(script);
  });
};

export default function BarcodeGeneratorPage() {
  const [text, setText] = useState("123456789012");
  const [format, setFormat] = useState("CODE128"); // CODE128, EAN13, EAN8, UPC
  const [barWidth, setBarWidth] = useState(2); // 1 to 4
  const [barHeight, setBarHeight] = useState(100); // 40 to 150
  const [showText, setShowText] = useState(true);
  const [ready, setReady] = useState(false);
  const [validationError, setValidationError] = useState("");

  const svgRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    let active = true;
    loadJsBarcode()
      .then(() => {
        if (active) setReady(true);
      })
      .catch((err) => console.error(err));
    return () => {
      active = false;
    };
  }, []);

  // Update barcode drawing on change
  useEffect(() => {
    if (!ready || !window.JsBarcode || !svgRef.current || !text.trim()) return;

    try {
      setValidationError("");
      
      // Determine format value
      let barcodeFormat = format;
      if (format === "UPC") {
        barcodeFormat = "UPC";
      }

      window.JsBarcode(svgRef.current, text, {
        format: barcodeFormat,
        width: barWidth,
        height: barHeight,
        displayValue: showText,
        fontSize: 14,
        background: "#ffffff",
        lineColor: "#000000",
        margin: 10,
        valid: (valid) => {
          if (!valid) {
            throw new Error(`The input data "${text}" is not valid for ${format} format.`);
          }
        }
      });

    } catch (error) {
      console.warn("Barcode rendering failed:", error);
      setValidationError(error.message || "Invalid characters for selected format.");
      
      // Clear SVG contents
      if (svgRef.current) {
        svgRef.current.innerHTML = "";
      }
    }
  }, [text, format, barWidth, barHeight, showText, ready]);

  const handleReset = () => {
    setFormat("CODE128");
    setText("123456789012");
    setBarWidth(2);
    setBarHeight(100);
    setShowText(true);
    setValidationError("");
  };

  const handleDownloadSvg = () => {
    if (!svgRef.current || validationError || !text.trim()) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `barcode_${format}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPng = () => {
    if (!ready || !window.JsBarcode || validationError || !text.trim() || !canvasRef.current) return;
    
    try {
      let barcodeFormat = format;
      
      window.JsBarcode(canvasRef.current, text, {
        format: barcodeFormat,
        width: barWidth,
        height: barHeight,
        displayValue: showText,
        fontSize: 14,
        background: "#ffffff",
        lineColor: "#000000",
        margin: 10
      });

      const url = canvasRef.current.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `barcode_${format}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error(e);
      alert("Failed to render PNG barcode.");
    }
  };

  const sidebarControls = (
    <>
      {/* Barcode Type */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Barcode Symbology
        </label>
        <select
          value={format}
          onChange={(e) => {
            setFormat(e.target.value);
            // Set reasonable default text based on format
            if (e.target.value === "EAN13") setText("1234567890128");
            else if (e.target.value === "EAN8") setText("12345670");
            else if (e.target.value === "UPC") setText("123456789012");
            else setText("CODE128-TEST");
          }}
          className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-purple-500/50"
        >
          <option value="CODE128">CODE 128 (Alphanumeric)</option>
          <option value="EAN13">EAN-13 (13 digits)</option>
          <option value="EAN8">EAN-8 (8 digits)</option>
          <option value="UPC">UPC-A (12 digits)</option>
        </select>
      </div>

      {/* Bar Width */}
      <div className="flex flex-col gap-1.5 mt-2">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex justify-between select-none">
          <span>Bar Width</span>
          <span className="font-mono text-purple-500">{barWidth} px</span>
        </label>
        <input
          type="range"
          min="1"
          max="4"
          step="1"
          value={barWidth}
          onChange={(e) => setBarWidth(parseInt(e.target.value))}
          className="w-full accent-purple-500 cursor-pointer"
        />
      </div>

      {/* Bar Height */}
      <div className="flex flex-col gap-1.5 mt-2">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex justify-between select-none">
          <span>Bar Height</span>
          <span className="font-mono text-purple-500">{barHeight} px</span>
        </label>
        <input
          type="range"
          min="40"
          max="150"
          step="5"
          value={barHeight}
          onChange={(e) => setBarHeight(parseInt(e.target.value))}
          className="w-full accent-purple-500 cursor-pointer"
        />
      </div>

      {/* Show text checkbox */}
      <div className="pt-2 select-none">
        <div
          onClick={() => setShowText(prev => !prev)}
          className="flex items-center gap-3 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/30 hover:border-purple-500/30 transition-all cursor-pointer"
        >
          <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
            showText 
              ? "bg-purple-500 border-purple-500 text-white" 
              : "border-zinc-300 dark:border-zinc-700"
          }`}>
            {showText && (
              <span className="material-symbols-outlined text-[12px] font-black">check</span>
            )}
          </div>
          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Display Label Value</span>
        </div>
      </div>

      {/* Action Buttons */}
      {!validationError && text.trim() && (
        <div className="space-y-2 mt-4">
          <button
            onClick={handleDownloadPng}
            className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-purple-600/15"
          >
            <span className="material-symbols-outlined text-[15px]">image</span>
            Download PNG
          </button>

          <button
            onClick={handleDownloadSvg}
            className="w-full py-2 bg-zinc-800 hover:bg-zinc-900 dark:bg-zinc-900 dark:hover:bg-zinc-950 border border-zinc-700 text-zinc-350 dark:text-zinc-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">code</span>
            Download SVG
          </button>
        </div>
      )}
    </>
  );

  return (
    <DevToolLayout
      title="Barcode Generator"
      description="Create standardized product or serial tracking barcodes client-side with adjustable layouts and vectors."
      sidebarControls={sidebarControls}
      onReset={handleReset}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        
        {/* Input Column */}
        <div className="flex flex-col bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden h-[380px]">
          <div className="bg-gray-50 dark:bg-zinc-800/80 px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center select-none">
            <h3 className="font-extrabold text-zinc-700 dark:text-zinc-300 text-xs">Barcode Data String</h3>
            <button
              onClick={() => setText("")}
              disabled={!text}
              className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-450 hover:text-red-500 disabled:opacity-40 transition-colors flex items-center gap-0.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[12px]">delete</span>
              Clear
            </button>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type code digits or characters here..."
            className="w-full flex-grow p-4 bg-transparent text-zinc-800 dark:text-zinc-200 text-xs font-mono placeholder-zinc-400 focus:outline-none resize-none leading-relaxed"
          />
          {validationError && (
            <div className="bg-red-500/10 border-t border-red-500/25 p-3 text-[9px] font-bold text-red-500 uppercase tracking-widest select-none">
              {validationError}
            </div>
          )}
        </div>

        {/* Visual Barcode Display */}
        <div className="flex flex-col bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden h-[380px]">
          <div className="bg-gray-50 dark:bg-zinc-800/80 px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center select-none">
            <h3 className="font-extrabold text-zinc-700 dark:text-zinc-300 text-xs">Barcode Output</h3>
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-purple-500">Live Preview</span>
          </div>

          <div className="flex-grow p-6 flex flex-col justify-center items-center bg-gray-50/20 dark:bg-zinc-900/10">
            <canvas ref={canvasRef} className="hidden" />
            
            {!ready ? (
              <div className="flex flex-col items-center justify-center animate-fade-in">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-3"></div>
                <p className="text-xs font-semibold text-purple-500">Loading Barcode Engine...</p>
              </div>
            ) : text.trim() && !validationError ? (
              <div className="bg-white p-6 rounded-xl border border-zinc-200/50 shadow-sm flex items-center justify-center max-w-full overflow-hidden select-none">
                <svg ref={svgRef} className="max-w-full max-h-[160px]" />
              </div>
            ) : (
              <div className="text-center select-none animate-fade-in">
                <span className="material-symbols-outlined text-zinc-400 dark:text-zinc-600 text-[48px] mb-3">barcode_scanner</span>
                <p className="text-xs font-bold text-zinc-400">
                  {validationError ? "Invalid Barcode Data" : "Waiting for barcode data..."}
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </DevToolLayout>
  );
}
