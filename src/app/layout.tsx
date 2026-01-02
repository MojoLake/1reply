import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "1Reply - Dual Conversation Game",
  description:
    "Two conversations. One reply. Craft messages that work for both sides in this unique word puzzle game.",
  keywords: ["game", "word game", "puzzle", "conversation", "reply"],
  authors: [{ name: "1Reply" }],
  openGraph: {
    title: "1Reply - Dual Conversation Game",
    description: "Two conversations. One reply. How long can you keep them going?",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "1Reply - Dual Conversation Game",
    description: "Two conversations. One reply. How long can you keep them going?",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
