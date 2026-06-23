"use client";

import { useState, useEffect, useRef } from "react";
import DevToolLayout from "../components/DevToolLayout";

// Script loader helper for qrcode library
const loadQRCode = () => {
  return new Promise((resolve, reject) => {
    if (window.QRCode) return resolve();
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load qrcode.js"));
    document.body.appendChild(script);
  });
};

export default function QrCodeGeneratorPage() {
  const [inputText, setInputText] = useState("https://mediadrop.com");
  const [size, setSize] = useState(256);
  const [ecl, setEcl] = useState("M"); // L, M, Q, H
  const [qrcodeUrl, setQrcodeUrl] = useState("");
  const [svgMarkup, setSvgMarkup] = useState("");
  const [ready, setReady] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    let active = true;
    loadQRCode()
      .then(() => {
        if (active) setReady(true);
      })
      .catch((err) => console.error(err));
    return () => {
      active = false;
    };
  }, []);

  // Recalculate QR Code when inputs change
  useEffect(() => {
    if (!ready || !inputText.trim() || !window.QRCode) return;

    const generateQR = async () => {
      try {
        // Generate PNG data URL via canvas options
        const dataUrl = await window.QRCode.toDataURL(inputText, {
          width: size,
          margin: 2,
          errorCorrectionLevel: ecl,
          color: {
            dark: "#000000",
            light: "#ffffff"
          }
        });
        setQrcodeUrl(dataUrl);

        // Generate SVG string
        const svgStr = await window.QRCode.toString(inputText, {
          type: "svg",
          width: size,
          margin: 2,
          errorCorrectionLevel: ecl,
          color: {
            dark: "#000000",
            light: "#ffffff"
          }
        });
        setSvgMarkup(svgStr);

      } catch (error) {
        console.error("QR Code generation failed:", error);
      }
    };

    const debounce = setTimeout(generateQR, 200);
    return () => clearTimeout(debounce);
  }, [inputText, size, ecl, ready]);

  const handleReset = () => {
    setInputText("https://mediadrop.com");
    setSize(256);
    setEcl("M");
  };

  const handleDownloadPng = () => {
    if (!qrcodeUrl) return;
    const a = document.createElement("a");
    a.href = qrcodeUrl;
    a.download = "qrcode.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadSvg = () => {
    if (!svgMarkup) return;
    const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "qrcode.svg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sidebarControls = (
    <>
      {/* Custom Size */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex justify-between select-none">
          <span>Dimensions</span>
          <span className="font-mono text-purple-500">{size}x{size} px</span>
        </label>
        <input
          type="range"
          min="128"
          max="800"
          step="8"
          value={size}
          onChange={(e) => setSize(parseInt(e.target.value))}
          className="w-full accent-purple-500 cursor-pointer"
        />
      </div>

      {/* Error Correction Level */}
      <div className="flex flex-col gap-1.5 mt-2">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Error Correction Level
        </label>
        <select
          value={ecl}
          onChange={(e) => setEcl(e.target.value)}
          className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-purple-500/50"
        >
          <option value="L">Low (7% recovery)</option>
          <option value="M">Medium (15% recovery)</option>
          <option value="Q">Quartile (25% recovery)</option>
          <option value="H">High (30% recovery)</option>
        </select>
        <p className="text-[9px] font-semibold text-zinc-400 leading-relaxed mt-1">
          Higher recovery levels make QR codes easier to scan even if partially damaged, but increase code density.
        </p>
      </div>

      {/* Downloads */}
      {qrcodeUrl && (
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
      title="QR Code Generator"
      description="Create customizable high-resolution QR codes from links, phone numbers, or arbitrary text client-side."
      sidebarControls={sidebarControls}
      onReset={handleReset}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        
        {/* Input Column */}
        <div className="flex flex-col bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden h-[380px]">
          <div className="bg-gray-50 dark:bg-zinc-800/80 px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center select-none">
            <h3 className="font-extrabold text-zinc-700 dark:text-zinc-300 text-xs">QR Content Payload</h3>
            <button
              onClick={() => setInputText("")}
              disabled={!inputText}
              className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-450 hover:text-red-500 disabled:opacity-40 transition-colors flex items-center gap-0.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[12px]">delete</span>
              Clear
            </button>
          </div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your URL, text, or phone number here..."
            className="w-full flex-grow p-4 bg-transparent text-zinc-850 dark:text-zinc-150 text-xs font-semibold placeholder-zinc-400 focus:outline-none resize-none leading-relaxed"
          />
        </div>

        {/* Output/Preview Column */}
        <div className="flex flex-col bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden h-[380px]">
          <div className="bg-gray-50 dark:bg-zinc-800/80 px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center select-none">
            <h3 className="font-extrabold text-zinc-700 dark:text-zinc-300 text-xs">Visual QR Code</h3>
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-purple-500">Live Preview</span>
          </div>

          <div className="flex-grow p-6 flex flex-col justify-center items-center bg-gray-50/20 dark:bg-zinc-900/10">
            {!ready ? (
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-3"></div>
                <p className="text-xs font-semibold text-purple-500">Loading QR Engine...</p>
              </div>
            ) : inputText.trim() ? (
              <div className="p-3 bg-white rounded-xl shadow-sm border border-zinc-200/50 flex justify-center items-center w-[200px] h-[200px]">
                <img
                  src={qrcodeUrl}
                  alt="QR Code Preview"
                  className="max-h-full max-w-full object-contain select-none"
                />
              </div>
            ) : (
              <div className="text-center select-none">
                <span className="material-symbols-outlined text-zinc-400 dark:text-zinc-600 text-[40px] mb-2">qr_code_2</span>
                <p className="text-xs font-semibold text-zinc-400">Waiting for text content...</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </DevToolLayout>
  );
}
