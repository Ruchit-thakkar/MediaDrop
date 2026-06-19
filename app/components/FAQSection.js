"use client";

import { useState } from "react";

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      q: "Which platforms are supported?",
      a: "We support video, photo, and audio extraction from YouTube, Instagram (Reels, posts, carousel albums), TikTok (no-watermark video & audio), Facebook (Reels, Watch, videos), X (Twitter posts & GIFs), and Pinterest (Video Pins & Image Pins).",
    },
    {
      q: "Can I download MP3?",
      a: "Yes! For all video posts, we automatically process and extract audio streams. You can select either our 320kbps Studio HQ MP3 or 128kbps standard format to save only the sound layer.",
    },
    {
      q: "Do I need an account?",
      a: "No. MediaDrop is built to be a privacy-first utility. There are no sign-up forms, registration hurdles, cookie tracking, or user database logs.",
    },
    {
      q: "Is MediaDrop free?",
      a: "Yes, MediaDrop is entirely free. We do not charge fees, throttle your bandwidth speeds, or limit the number of extractions you can make.",
    },
    {
      q: "Are downloads private?",
      a: "Yes. Our server uses automated temporary directories to cache media during stream extraction. Once you complete the browser download, the temporary directory is instantly wiped from disk. We do not store URLs or user IP maps.",
    },
  ];

  const handleToggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="w-full max-w-2xl mx-auto px-6 py-20 border-t border-white/5">
      <h2 className="text-3xl font-extrabold tracking-tight text-center text-zinc-900 dark:text-white mb-12">
        Frequently Asked Questions
      </h2>

      <div className="space-y-3.5">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className={`premium-card rounded-2xl overflow-hidden border border-white/5 transition-colors duration-300 ${isOpen ? "border-purple-500/25 bg-white/[0.02]" : "hover:border-white/10"
                }`}
            >
              {/* Question Trigger */}
              <button
                type="button"
                onClick={() => handleToggle(idx)}
                className="w-full p-5 text-left flex justify-between items-center transition-colors text-zinc-900 dark:text-white font-semibold text-sm cursor-pointer select-none"
              >
                <span>{faq.q}</span>
                <span
                  className={`material-symbols-outlined text-zinc-500 transition-transform duration-300 ${isOpen ? "rotate-180 text-purple-400" : "rotate-0"
                    }`}
                >
                  expand_more
                </span>
              </button>

              {/* Answer Box (Smooth CSS Height Transition) */}
              <div
                className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
              >
                <div className="overflow-hidden">
                  <div className="px-5 pb-5 text-xs text-zinc-400 leading-relaxed font-medium pt-1.5 border-t border-white/[0.04]">
                    {faq.a}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
