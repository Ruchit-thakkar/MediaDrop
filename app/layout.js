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
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geist.variable} ${jetbrainsMono.variable} dark`}>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet" />
      </head>
      <body className="bg-background text-on-background font-body-md selection:bg-primary/30">
        {children}
      </body>
    </html>
  );
}
