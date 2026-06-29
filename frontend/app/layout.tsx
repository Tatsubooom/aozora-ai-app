import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "青空文庫 AI解説リーダー",
  description: "AIによる純文学の読解サポートアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // ★修正：初期表示で白くチラつくのを防ぐため、<html>に className="dark" を直書きする
  return (
    <html lang="ja" className={cn("dark", "font-sans", geist.variable)}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}