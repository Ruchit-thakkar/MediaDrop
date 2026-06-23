"use client";

import { useState, useEffect } from "react";
import DevToolLayout from "../components/DevToolLayout";

export default function JwtDecoderPage() {
  const [token, setToken] = useState("");
  const [header, setHeader] = useState(null);
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState("");
  const [tokenInfo, setTokenInfo] = useState(null);

  useEffect(() => {
    if (!token.trim()) {
      setHeader(null);
      setPayload(null);
      setError("");
      setTokenInfo(null);
      return;
    }

    try {
      setError("");
      const parts = token.trim().split(".");
      if (parts.length < 2 || parts.length > 3) {
        throw new Error("Invalid JWT format. A token must consist of 3 dot-separated base64url segments.");
      }

      const decodeSegment = (str) => {
        let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
        while (base64.length % 4) base64 += "=";
        const binary = atob(base64);
        const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
        return new TextDecoder().decode(bytes);
      };

      const decodedHeader = JSON.parse(decodeSegment(parts[0]));
      const decodedPayload = JSON.parse(decodeSegment(parts[1]));

      setHeader(decodedHeader);
      setPayload(decodedPayload);

      // Parse expiration (exp) and issues (iat, nbf)
      const info = {};
      if (decodedPayload.exp) {
        const expDate = new Date(decodedPayload.exp * 1000);
        info.exp = expDate.toLocaleString();
        
        const now = new Date();
        const diffMs = expDate.getTime() - now.getTime();
        info.expired = diffMs < 0;

        // Calculate relative time
        const absDiff = Math.abs(diffMs);
        const diffSecs = Math.floor(absDiff / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) {
          info.relative = `${diffDays} days ${info.expired ? "ago" : "from now"}`;
        } else if (diffHours > 0) {
          info.relative = `${diffHours} hours ${info.expired ? "ago" : "from now"}`;
        } else if (diffMins > 0) {
          info.relative = `${diffMins} minutes ${info.expired ? "ago" : "from now"}`;
        } else {
          info.relative = `${diffSecs} seconds ${info.expired ? "ago" : "from now"}`;
        }
      }

      if (decodedPayload.iat) {
        info.iat = new Date(decodedPayload.iat * 1000).toLocaleString();
      }
      if (decodedPayload.iss) {
        info.iss = decodedPayload.iss;
      }
      if (decodedPayload.sub) {
        info.sub = decodedPayload.sub;
      }

      setTokenInfo(Object.keys(info).length > 0 ? info : null);

    } catch (err) {
      console.error(err);
      setError(err.message);
      setHeader(null);
      setPayload(null);
      setTokenInfo(null);
    }
  }, [token]);

  const handleReset = () => {
    setToken("");
    setHeader(null);
    setPayload(null);
    setError("");
    setTokenInfo(null);
  };

  const handleCopy = (data) => {
    if (!data) return;
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    alert("JSON structure copied to clipboard!");
  };

  const sidebarControls = (
    <>
      <div className="flex flex-col gap-1.5 select-none text-[10px] font-semibold text-zinc-400 leading-relaxed">
        <p>JWT tokens are split and decoded entirely locally inside your browser. No data is sent to external servers.</p>
      </div>

      {tokenInfo && (
        <div className="mt-4 p-4 bg-purple-500/[0.02] border border-purple-500/20 rounded-2xl space-y-3 text-xs font-bold text-zinc-550 select-none">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400">Token Status</span>
          
          {tokenInfo.exp && (
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <span>Expiration:</span>
                <span className={`px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-widest rounded-full border ${
                  tokenInfo.expired 
                    ? "bg-red-500/10 border-red-500/20 text-red-500" 
                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                }`}>
                  {tokenInfo.expired ? "Expired" : "Active"}
                </span>
              </div>
              <p className="font-mono text-[10px] text-zinc-800 dark:text-zinc-200 mt-0.5">{tokenInfo.exp}</p>
              <p className="text-[10px] text-zinc-450 italic mt-0.5">({tokenInfo.relative})</p>
            </div>
          )}

          {tokenInfo.iat && (
            <div className="flex flex-col gap-0.5 border-t border-border-subtle pt-2">
              <span>Issued At:</span>
              <p className="font-mono text-[10px] text-zinc-800 dark:text-zinc-200">{tokenInfo.iat}</p>
            </div>
          )}

          {tokenInfo.iss && (
            <div className="flex justify-between border-t border-border-subtle pt-2">
              <span>Issuer:</span>
              <span className="font-mono text-[10px] text-zinc-800 dark:text-zinc-200 truncate max-w-[120px]" title={tokenInfo.iss}>{tokenInfo.iss}</span>
            </div>
          )}

          {tokenInfo.sub && (
            <div className="flex justify-between">
              <span>Subject:</span>
              <span className="font-mono text-[10px] text-zinc-800 dark:text-zinc-200 truncate max-w-[120px]" title={tokenInfo.sub}>{tokenInfo.sub}</span>
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <DevToolLayout
      title="JWT Decoder"
      description="Inspect and decode JSON Web Token claims, signatures, and headers completely client-side."
      sidebarControls={sidebarControls}
      onReset={handleReset}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        
        {/* Token Input Column */}
        <div className="flex flex-col bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden h-[450px]">
          <div className="bg-gray-50 dark:bg-zinc-800/80 px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center select-none animate-fade-in">
            <h3 className="font-extrabold text-zinc-700 dark:text-zinc-300 text-xs">Encoded JWT String</h3>
            <button
              onClick={() => setToken("")}
              disabled={!token}
              className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-450 hover:text-red-500 disabled:opacity-40 transition-colors flex items-center gap-0.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[12px]">delete</span>
              Clear
            </button>
          </div>
          <textarea
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste your JWT encoded string here (e.g. eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...)"
            className="w-full flex-grow p-4 bg-transparent text-zinc-800 dark:text-zinc-200 text-xs font-mono placeholder-zinc-400 focus:outline-none resize-none leading-relaxed break-all"
          />
          {error && (
            <div className="bg-red-500/10 border-t border-red-500/25 p-3 text-[9px] font-bold text-red-500 uppercase tracking-widest select-none animate-fade-in">
              {error}
            </div>
          )}
        </div>

        {/* Token Output Column */}
        <div className="flex flex-col gap-6">
          {/* Header Block */}
          <div className="flex flex-col bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden h-[210px]">
            <div className="bg-gray-50 dark:bg-zinc-800/80 px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center select-none">
              <h3 className="font-extrabold text-zinc-700 dark:text-zinc-300 text-xs">Decoded Header</h3>
              {header && (
                <button
                  onClick={() => handleCopy(header)}
                  className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-450 hover:text-purple-500 transition-colors flex items-center gap-0.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[12px]">content_copy</span>
                  Copy JSON
                </button>
              )}
            </div>
            <pre className="w-full flex-grow p-4 overflow-y-auto bg-transparent text-xs font-mono text-zinc-750 dark:text-zinc-250 select-all leading-relaxed whitespace-pre-wrap break-all">
              {header ? JSON.stringify(header, null, 2) : <span className="text-zinc-450 italic select-none">Decode a token to inspect the header...</span>}
            </pre>
          </div>

          {/* Payload Block */}
          <div className="flex flex-col bg-white dark:bg-[#262930] rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden h-[216px]">
            <div className="bg-gray-50 dark:bg-zinc-800/80 px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center select-none">
              <h3 className="font-extrabold text-zinc-700 dark:text-zinc-300 text-xs">Decoded Payload</h3>
              {payload && (
                <button
                  onClick={() => handleCopy(payload)}
                  className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-450 hover:text-purple-500 transition-colors flex items-center gap-0.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[12px]">content_copy</span>
                  Copy JSON
                </button>
              )}
            </div>
            <pre className="w-full flex-grow p-4 overflow-y-auto bg-transparent text-xs font-mono text-zinc-750 dark:text-zinc-250 select-all leading-relaxed whitespace-pre-wrap break-all">
              {payload ? JSON.stringify(payload, null, 2) : <span className="text-zinc-450 italic select-none">Decode a token to inspect the payload...</span>}
            </pre>
          </div>
        </div>

      </div>
    </DevToolLayout>
  );
}
