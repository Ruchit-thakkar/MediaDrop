"use client";

import { useState, useEffect, useRef } from "react";
import DevToolLayout from "../components/DevToolLayout";

// Script loader helper for jsQR library
const loadJsQR = () => {
  return new Promise((resolve, reject) => {
    if (window.jsQR) return resolve();
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load jsQR.js"));
    document.body.appendChild(script);
  });
};

export default function QrCodeScannerPage() {
  const [scanResult, setScanResult] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [ready, setReady] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameId = useRef(null);

  useEffect(() => {
    let active = true;
    loadJsQR()
      .then(() => {
        if (active) setReady(true);
      })
      .catch((err) => console.error(err));

    return () => {
      active = false;
      stopScanner();
    };
  }, []);

  const handleReset = () => {
    stopScanner();
    setScanResult("");
    setErrorMsg("");
  };

  const handleCopy = () => {
    if (!scanResult) return;
    navigator.clipboard.writeText(scanResult);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Decode uploaded image files
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !ready || !window.jsQR) return;

    setErrorMsg("");
    setScanResult("");
    stopScanner();

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert"
        });

        if (code) {
          setScanResult(code.data);
        } else {
          setErrorMsg("No QR Code detected in this image. Make sure the code is clear and well-lit.");
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Start HTML5 webcam camera scanner
  const startScanner = async () => {
    if (!ready || !window.jsQR) return;
    setErrorMsg("");
    setScanResult("");
    setCameraActive(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.play();
        // Start scanning frames
        animationFrameId.current = requestAnimationFrame(scanFrame);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to access camera: " + err.message);
      setCameraActive(false);
    }
  };

  // Stop camera scanning
  const stopScanner = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Frame processing loop
  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current || !window.jsQR) return;

    if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = window.jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        setScanResult(code.data);
        // Play scan feedback sound if desired, and stop
        stopScanner();
        return;
      }
    }
    animationFrameId.current = requestAnimationFrame(scanFrame);
  };

  const sidebarControls = (
    <>
      <div className="flex flex-col gap-1.5 select-none text-[10px] font-semibold text-zinc-400 leading-relaxed">
        <p>Decodes QR Codes directly on your device. Ensure the code is inside the camera focus window.</p>
      </div>

      <div className="space-y-2 mt-4">
        {!cameraActive ? (
          <button
            onClick={startScanner}
            disabled={!ready}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-purple-600/15"
          >
            <span className="material-symbols-outlined text-[16px]">videocam</span>
            Start Camera Scanner
          </button>
        ) : (
          <button
            onClick={stopScanner}
            className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-red-600/15"
          >
            <span className="material-symbols-outlined text-[16px]">videocam_off</span>
            Stop Camera Scanner
          </button>
        )}

        <div className="relative w-full">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="qr-image-upload"
          />
          <label
            htmlFor="qr-image-upload"
            className="w-full py-2 bg-zinc-800 hover:bg-zinc-900 dark:bg-zinc-900 dark:hover:bg-zinc-950 border border-zinc-700 text-zinc-350 dark:text-zinc-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">upload</span>
            Upload QR Image
          </label>
        </div>
      </div>
    </>
  );

  return (
    <DevToolLayout
      title="QR Code Scanner"
      description="Scan QR codes using your device's camera or parse uploaded image files entirely locally inside your browser."
      sidebarControls={sidebarControls}
      onReset={handleReset}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        
        {/* Scanner Window Column */}
        <div className="flex flex-col bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden h-[380px]">
          <div className="bg-gray-50 dark:bg-zinc-800/80 px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center select-none">
            <h3 className="font-extrabold text-zinc-700 dark:text-zinc-300 text-xs">Scanning Interface</h3>
            {cameraActive && (
              <span className="flex items-center gap-1 text-[9px] font-extrabold text-purple-500 uppercase tracking-widest animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-500"></span>
                Camera Live
              </span>
            )}
          </div>

          <div className="flex-grow p-6 flex flex-col justify-center items-center bg-gray-50/20 dark:bg-zinc-900/10 relative overflow-hidden">
            <canvas ref={canvasRef} className="hidden" />

            {!ready ? (
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-3"></div>
                <p className="text-xs font-semibold text-purple-500">Loading Scanner Engine...</p>
              </div>
            ) : cameraActive ? (
              <div className="relative w-full h-full max-w-[280px] max-h-[280px] rounded-xl overflow-hidden border border-purple-500/25 bg-black">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                />
                {/* Aiming focus border box */}
                <div className="absolute inset-8 border border-dashed border-purple-500/60 rounded-lg pointer-events-none flex items-center justify-center">
                  <div className="w-4 h-4 border-t-2 border-l-2 border-purple-500 absolute top-0 left-0"></div>
                  <div className="w-4 h-4 border-t-2 border-r-2 border-purple-500 absolute top-0 right-0"></div>
                  <div className="w-4 h-4 border-b-2 border-l-2 border-purple-500 absolute bottom-0 left-0"></div>
                  <div className="w-4 h-4 border-b-2 border-r-2 border-purple-500 absolute bottom-0 right-0"></div>
                </div>
              </div>
            ) : (
              <div className="text-center select-none">
                <span className="material-symbols-outlined text-zinc-400 dark:text-zinc-600 text-[48px] mb-3">photo_camera</span>
                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Camera Scanner is Inactive</p>
                <p className="text-[10px] text-zinc-450 mt-1 max-w-xs leading-relaxed">
                  Start the webcam or upload a static QR code image in the sidebar settings.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Output/Result Column */}
        <div className="flex flex-col bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden h-[380px]">
          <div className="bg-gray-50 dark:bg-zinc-800/80 px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center select-none">
            <h3 className="font-extrabold text-zinc-700 dark:text-zinc-300 text-xs">Decoded Payload</h3>
            {scanResult && (
              <button
                onClick={handleCopy}
                className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-450 hover:text-purple-500 transition-colors flex items-center gap-0.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[12px]">{isCopied ? "check" : "content_copy"}</span>
                {isCopied ? "Copied" : "Copy"}
              </button>
            )}
          </div>

          <div className="flex-grow p-4 flex flex-col justify-between">
            <textarea
              readOnly
              value={scanResult}
              placeholder="Scanned data will appear here..."
              className="w-full flex-grow bg-transparent text-zinc-800 dark:text-zinc-200 text-xs font-mono placeholder-zinc-400 focus:outline-none resize-none leading-relaxed"
            />

            {errorMsg && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-[9px] font-bold uppercase tracking-widest select-none leading-relaxed">
                {errorMsg}
              </div>
            )}

            {scanResult && (
              <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-[9px] font-extrabold uppercase tracking-widest select-none flex items-center gap-1.5 justify-center">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                Decoded Successfully!
              </div>
            )}
          </div>
        </div>

      </div>
    </DevToolLayout>
  );
}
