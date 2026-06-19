"use client";

export default function URLInput({ url, setUrl, isLoading, handleExtract }) {
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
      }
    } catch (err) {
      console.warn("Failed to read clipboard:", err);
    }
  };

  return (
    <form
      onSubmit={handleExtract}
      className="w-full max-w-2xl mx-auto p-1.5 rounded-2xl bg-[#111113] border border-white/10 flex items-center gap-1.5 focus-within:border-purple-500/50 focus-within:shadow-[0_0_20px_rgba(124,58,237,0.15)] transition-all duration-300"
    >
      {/* Search/Link Icon */}
      <div className="pl-3 pr-1 text-zinc-500 flex items-center shrink-0">
        <span className="material-symbols-outlined text-xl">link</span>
      </div>

      {/* Input Field */}
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        disabled={isLoading}
        placeholder="Paste a video or post URL here..."
        className="w-full bg-transparent border-none outline-none focus:ring-0 text-white placeholder-zinc-500 text-sm h-10 px-1"
      />

      {/* Paste Button */}
      <button
        type="button"
        onClick={handlePaste}
        disabled={isLoading}
        title="Paste from clipboard"
        className="h-10 px-3 hover:bg-white/5 rounded-xl text-zinc-400 hover:text-white transition-colors flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-40"
      >
        <span className="material-symbols-outlined text-lg">content_paste</span>
      </button>

      {/* Download Button */}
      <button
        type="submit"
        disabled={isLoading || !url.trim()}
        className="primary-gradient h-10 px-6 rounded-xl text-white font-bold text-xs uppercase tracking-wider active:scale-[0.98] hover:brightness-110 disabled:opacity-50 disabled:scale-100 transition-all flex items-center gap-2 shrink-0 cursor-pointer shadow-lg shadow-purple-900/20"
      >
        {isLoading ? (
          <>
            <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></span>
            <span>Fetching...</span>
          </>
        ) : (
          <>
            <span>Download</span>
            <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
          </>
        )}
      </button>
    </form>
  );
}
