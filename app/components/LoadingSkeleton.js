"use client";

export default function LoadingSkeleton() {
  return (
    <div className="w-full max-w-6xl mx-auto px-6 mb-16 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Media Card Skeleton */}
        <div className="lg:col-span-5 premium-card rounded-2xl p-5 flex flex-col justify-between h-[360px]">
          <div>
            {/* Thumbnail Placeholder */}
            <div className="aspect-video w-full rounded-xl relative overflow-hidden border border-white/5 shimmer-bg">
              {/* Duration Indicator placeholder */}
              <div className="absolute bottom-2 right-2 w-10 h-4 rounded bg-white/5 border border-white/5"></div>
              {/* Platform badge placeholder */}
              <div className="absolute top-2 left-2 w-20 h-5 rounded bg-white/5 border border-white/5"></div>
            </div>
            
            <div className="mt-5 px-1">
              {/* Title lines */}
              <div className="h-5 w-5/6 rounded shimmer-bg mb-2"></div>
              <div className="h-5 w-2/3 rounded shimmer-bg mb-4"></div>
              
              {/* Creator details */}
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full shimmer-bg"></div>
                <div className="h-3 w-20 rounded shimmer-bg"></div>
              </div>
            </div>
          </div>
          
          {/* Description line placeholder */}
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="h-3 w-1/4 rounded shimmer-bg mb-2"></div>
            <div className="h-10 w-full rounded shimmer-bg"></div>
          </div>
        </div>

        {/* Right Column: Download formats grid skeleton */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="premium-card p-5 rounded-2xl flex flex-col justify-between h-40 border-white/5"
            >
              <div className="flex justify-between items-start">
                <div className="w-4/5">
                  <div className="h-3 w-1/3 rounded shimmer-bg mb-2.5"></div>
                  <div className="h-5 w-2/3 rounded shimmer-bg"></div>
                </div>
                <div className="w-6 h-6 rounded-full shimmer-bg shrink-0"></div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div className="h-3.5 w-1/3 rounded shimmer-bg"></div>
                <div className="h-5 w-12 rounded shimmer-bg"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Loading message */}
      <div className="mt-8 flex flex-col items-center justify-center gap-2 select-none">
        <div className="flex items-center gap-2 text-sm text-zinc-400 font-semibold tracking-wide">
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping"></span>
          <span>Fetching metadata...</span>
        </div>
      </div>
    </div>
  );
}
