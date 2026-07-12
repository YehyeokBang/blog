import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Providers } from "./providers";
import ThemeToggle from "@/components/ThemeToggle";
import NavLinks from "@/components/NavLinks";

export const metadata: Metadata = {
  title: "Yehyeok | Backend Dev Blog",
  description: "배움과 기록을 위한 개인 개발 블로그 및 백엔드 실험실",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-canvas text-body">
        <Providers>
          <header className="sticky top-0 z-50 w-full bg-canvas/80 backdrop-blur-md border-b border-hairline-soft">
            <div className="max-w-[1000px] mx-auto h-[60px] px-6 md:px-lg flex items-center justify-between">
            <Link href="/" className="text-[20px] font-bold text-ink hover:opacity-80 transition-opacity">
              Yehyeok
            </Link>
            <nav className="flex items-center gap-lg">
              <NavLinks />
              <ThemeToggle />
            </nav>
          </div>
        </header>


        <main className="flex-1 w-full max-w-[1000px] mx-auto px-6 md:px-lg py-xl">
          {children}
        </main>


        <footer className="w-full mt-section border-t border-hairline-soft py-xl bg-canvas">
          <div className="max-w-[1000px] mx-auto px-6 md:px-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-sm">
            <div className="text-[14px] text-muted">
              © {new Date().getFullYear()} Yehyeok. All rights reserved.
            </div>
            <div className="flex gap-md text-[14px] text-muted">
              <a href="https://github.com/YehyeokBang" target="_blank" rel="noopener noreferrer" className="hover:text-ink transition-colors">
                GitHub
              </a>
              <Link href="/about" className="hover:text-ink transition-colors">
                소개
              </Link>
            </div>
          </div>
        </footer>
        </Providers>
      </body>
    </html>
  );
}
