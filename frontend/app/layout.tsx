import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import "./globals.css";
import { Providers } from "./providers";
import ThemeToggle from "@/components/ThemeToggle";
import NavLinks from "@/components/NavLinks";
import PullToRefresh from "@/components/PullToRefresh";
import BackToTopButton from "@/components/BackToTopButton";
import { SITE_URL } from "@/lib/constants";
import { GoogleAnalytics } from '@next/third-parties/google';

const pretendard = localFont({
  src: "../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  display: "swap",
  variable: "--font-pretendard",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: "%s | Yehyeok's Blog",
    default: "Yehyeok's Blog",
  },
  description: "배움과 기록을 위한 개인 개발 블로그 및 백엔드 실험실",
  openGraph: {
    title: "Yehyeok's Blog",
    description: "배움과 기록을 위한 개인 개발 블로그 및 백엔드 실험실",
    url: "/",
    siteName: "Yehyeok's Blog",
    locale: "ko_KR",
    type: "website",
    images: ["/images/og-default.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Yehyeok's Blog",
    description: "배움과 기록을 위한 개인 개발 블로그 및 백엔드 실험실",
    images: ["/images/og-default.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${pretendard.variable} min-h-screen bg-canvas text-body`}>
        <Providers>
          <header className="fixed inset-x-0 top-0 z-50 h-[60px] bg-canvas/80 backdrop-blur-md border-b border-hairline-soft">
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
          <BackToTopButton />
          <PullToRefresh>
            <div className="flex min-h-[calc(100vh-60px)] flex-col">
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
            </div>
          </PullToRefresh>
        </Providers>
        {process.env.NEXT_PUBLIC_GA_ID ? <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} /> : null}
      </body>
    </html>
  );
}
