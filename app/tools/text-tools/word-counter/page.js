"use client";

import { useState } from "react";
import TextToolLayout from "../components/TextToolLayout";

export default function WordCounterPage() {
  const [text, setText] = useState("");

  const handleReset = () => {
    setText("");
  };

  // Compute text statistics
  const cleanText = text.trim();
  const charCount = text.length;
  const charNoSpaces = text.replace(/\s/g, "").length;
  
  const wordsArray = cleanText === "" ? [] : cleanText.split(/\s+/);
  const wordCount = wordsArray.length;
  
  const sentencesArray = cleanText === "" ? [] : text.split(/[.!?]+/).filter(s => s.trim() !== "");
  const sentenceCount = sentencesArray.length;
  
  const paragraphsArray = cleanText === "" ? [] : text.split(/\n+/).filter(p => p.trim() !== "");
  const paragraphCount = paragraphsArray.length;

  // Average calculations
  const avgWordLen = wordCount === 0 ? 0 : (charNoSpaces / wordCount).toFixed(1);
  const avgSentenceLen = sentenceCount === 0 ? 0 : (wordCount / sentenceCount).toFixed(1);

  // Time estimates
  // Reading speed: 200 words per minute
  const readingTimeSeconds = Math.round((wordCount / 200) * 60);
  const formattedReadingTime = readingTimeSeconds < 60
    ? `${readingTimeSeconds} sec`
    : `${Math.floor(readingTimeSeconds / 60)} min ${readingTimeSeconds % 60} sec`;

  // Speaking speed: 130 words per minute
  const speakingTimeSeconds = Math.round((wordCount / 130) * 60);
  const formattedSpeakingTime = speakingTimeSeconds < 60
    ? `${speakingTimeSeconds} sec`
    : `${Math.floor(speakingTimeSeconds / 60)} min ${speakingTimeSeconds % 60} sec`;

  const sidebarControls = (
    <>
      <div className="flex flex-col gap-1.5 select-none">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Advanced Stats
        </label>
        <div className="bg-purple-500/[0.02] border border-purple-500/20 rounded-2xl p-4 space-y-3.5 text-xs font-bold text-zinc-550">
          <div className="flex justify-between border-b border-border-subtle pb-2">
            <span>Avg. Word Length:</span>
            <span className="text-zinc-800 dark:text-zinc-200">{avgWordLen} chars</span>
          </div>
          <div className="flex justify-between border-b border-border-subtle pb-2">
            <span>Avg. Sentence Length:</span>
            <span className="text-zinc-800 dark:text-zinc-200">{avgSentenceLen} words</span>
          </div>
          <div className="flex justify-between border-b border-border-subtle pb-2">
            <span>Reading Time:</span>
            <span className="text-purple-500">{formattedReadingTime}</span>
          </div>
          <div className="flex justify-between">
            <span>Speaking Time:</span>
            <span className="text-purple-500">{formattedSpeakingTime}</span>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <TextToolLayout
      title="Word Counter"
      description="Analyze text in real time to count words, sentences, paragraphs, and estimate read/speak durations."
      inputValue={text}
      onInputChange={setText}
      sidebarControls={sidebarControls}
      onReset={handleReset}
      showOutput={false} // Only need single text area layout
    >
      {/* Workspace Content Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        <div className="bg-white dark:bg-[#262930] p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Total Words</span>
          <span className="text-xl font-black mt-1 text-purple-500">{wordCount}</span>
        </div>
        <div className="bg-white dark:bg-[#262930] p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Paragraphs</span>
          <span className="text-xl font-black mt-1 text-zinc-800 dark:text-white">{paragraphCount}</span>
        </div>
        <div className="bg-white dark:bg-[#262930] p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Sentences</span>
          <span className="text-xl font-black mt-1 text-zinc-800 dark:text-white">{sentenceCount}</span>
        </div>
        <div className="bg-white dark:bg-[#262930] p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Characters</span>
          <span className="text-xl font-black mt-1 text-zinc-800 dark:text-white">{charCount}</span>
        </div>
      </div>
    </TextToolLayout>
  );
}
