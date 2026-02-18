import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { FloatingChatButton } from "@/components/chat/FloatingChatButton";
import "./globals.css";

export const metadata: Metadata = {
  title: "foxtrotdesign",
  description:
    "Hayato Shimadaの活動をまとめたウェブサイト.クリエイティブとエンジニアリングの交差点.",
  icons: {
    icon: "/favicon.svg",
  },
};

// Inline script to prevent flash of wrong theme on load
const themeScript = `
(function() {
  var t = localStorage.getItem('theme');
  var d = t === 'dark' || (!t || t === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (d) document.documentElement.classList.add('dark');
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <ChatPanel />
        <FloatingChatButton />
      </body>
    </html>
  );
}
