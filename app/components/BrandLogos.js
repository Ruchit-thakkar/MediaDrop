"use client";

// High-quality official SVGs for social platforms
export const YouTubeLogo = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path
      d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.107C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.388.511a3.002 3.002 0 0 0-2.11 2.107C0 8.053 0 12 0 12s0 3.947.502 5.837a3.003 3.003 0 0 0 2.11 2.107C4.495 20.455 12 20.455 12 20.455s7.505 0 9.388-.511a3.003 3.003 0 0 0 2.11-2.107C24 15.947 24 12 24 12s0-3.947-.502-5.837z"
      fill="#FF0000"
    />
    <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#FFFFFF" />
  </svg>
);

export const InstagramLogo = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <defs>
      <radialGradient id="ig-grad" cx="30%" cy="107%" r="130%">
        <stop offset="0" stopColor="#fdf497" />
        <stop offset="0.05" stopColor="#fdf497" />
        <stop offset="0.45" stopColor="#fd5949" />
        <stop offset="0.6" stopColor="#d6249f" />
        <stop offset="0.9" stopColor="#285AEB" />
      </radialGradient>
    </defs>
    <rect x="0" y="0" width="24" height="24" rx="6" fill="url(#ig-grad)" />
    <path
      d="M12 6.862c-2.838 0-5.138 2.3-5.138 5.138s2.3 5.138 5.138 5.138 5.138-2.3 5.138-5.138-2.3-5.138-5.138-5.138zm0 8.448c-1.824 0-3.31-1.486-3.31-3.31s1.486-3.31 3.31-3.31 3.31 1.486 3.31 3.31-1.486 3.31-3.31 3.31zM17.345 5.562a1.205 1.205 0 1 0 0 2.41 1.205 1.205 0 0 0 0-2.41z"
      fill="#FFFFFF"
    />
  </svg>
);

export const TikTokLogo = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.59 4.23.94 1.13 2.22 1.94 3.63 2.33V10.2c-1.22-.09-2.42-.51-3.47-1.17-.67-.43-1.25-.97-1.7-1.61v7.69c.07 1.83-.52 3.66-1.68 5.09-1.24 1.54-3.1 2.53-5.08 2.76-2.02.24-4.14-.26-5.74-1.52-1.74-1.34-2.81-3.41-2.91-5.63-.12-2.37.91-4.71 2.77-6.2 1.63-1.32 3.77-1.92 5.86-1.67v3.83c-1.12-.19-2.3.11-3.17.84-.96.79-1.47 2.02-1.37 3.25.07 1.05.6 2.05 1.46 2.68.87.65 1.98.92 3.06.77 1.1-.14 2.11-.84 2.62-1.84.28-.53.4-1.13.38-1.73V.02z" />
  </svg>
);

export const FacebookLogo = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path
      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      fill="#1877F2"
    />
  </svg>
);

export const XLogo = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export const PinterestLogo = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path
      d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.627-5.373-12-12-12z"
      fill="#E60023"
    />
  </svg>
);

export const getBrandLogo = (platform, className = "w-5 h-5") => {
  const plat = platform ? platform.toLowerCase() : "";
  if (plat.includes("youtube")) return <YouTubeLogo className={className} />;
  if (plat.includes("instagram")) return <InstagramLogo className={className} />;
  if (plat.includes("tiktok")) return <TikTokLogo className={className} />;
  if (plat.includes("facebook")) return <FacebookLogo className={className} />;
  if (plat.includes("twitter") || plat === "x") return <XLogo className={className} />;
  if (plat.includes("pinterest")) return <PinterestLogo className={className} />;
  return null;
};
