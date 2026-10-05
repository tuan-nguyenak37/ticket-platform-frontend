import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProviders } from "./providers";
import { SiteShell } from "@/components/layout/SiteShell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TicketVerse - Nền tảng Vé Sự kiện & Lễ hội Âm nhạc",
  description: "Khám phá và đặt vé cho các concert, lễ hội âm nhạc, sự kiện thể thao và giải trí hàng đầu.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-screen flex flex-col bg-slate-950 text-white font-sans relative selection:bg-violet-500/40 selection:text-white">
        <AppProviders>
          <SiteShell>{children}</SiteShell>
        </AppProviders>
      </body>
    </html>
  );
}
