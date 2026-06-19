import { Geist, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "MediaDrop | Premium Media Extraction",
  description: "A minimal, high-performance toolkit to extract 4K videos, reels, and high-bitrate MP3s in seconds. Free forever.",
  icons: {
    icon: "https://ik.imagekit.io/devnext/MediaDropDark.png",
    shortcut: "https://ik.imagekit.io/devnext/MediaDropDark.png",
    apple: "https://ik.imagekit.io/devnext/MediaDropDark.png",
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geist.variable} ${jetbrainsMono.variable} dark`} suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet" />
        <link rel="icon" href="https://ik.imagekit.io/devnext/MediaDropDark.png" type="image/png" />
      </head>
      <body className="bg-background text-on-background font-body-md selection:bg-primary/30">
        {children}
      </body>
    </html>
  );
}
