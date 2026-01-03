// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Providers from "@/components/providers";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "LigaOn — Crie sua liga amadora de futebol online",
    template: "%s | LigaOn",
  },
  description:
    "Crie e gerencie sua liga amadora de futebol de forma simples. Tabela automática, jogos, artilharia e link público para compartilhar com os times.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
    other: [
      {
        rel: "icon",
        type: "image/png",
        sizes: "192x192",
        url: "/android-chrome-192x192.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "512x512",
        url: "/android-chrome-512x512.png",
      },
    ],
  },
  manifest: "/manifest.json",
  verification: {
    google: "FNBOxFJAOCp22RMAOpa65_G98QIqORoiVsIFVbwNuZQ",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="LigaOn" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body
        className={`${inter.className} bg-zinc-950 text-white min-h-screen`}
      >
        <Providers>
          <Suspense
            fallback={
              <div className="flex min-h-screen items-center justify-center bg-zinc-950">
                <div className="text-2xl font-semibold text-white animate-pulse">
                  Carregando...
                </div>
              </div>
            }
          >
            {children}
          </Suspense>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
