import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "1Reply - Dual Conversation Game",
  description:
    "Two conversations. One reply. Craft messages that work for both sides in this unique word puzzle game.",
  keywords: ["game", "word game", "puzzle", "conversation", "reply"],
  authors: [{ name: "1Reply" }],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-touch-icon.svg",
  },
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
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-G3C67EHYCH"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-G3C67EHYCH');
          `}
        </Script>
      </head>
      <body className="min-h-screen bg-black text-white antialiased font-mono crt-glow">
        {/* CRT Scanline overlay */}
        <div className="crt-overlay" />
        {children}
      </body>
    </html>
  );
}
