// src/app/layout.tsx - VERSÃO FINAL CORRIGIDA
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Providers from "@/components/providers";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"] });

// METADADOS COMPLETOS PARA FAVICONS
export const metadata: Metadata = {
  title: "LIGA.ON - Crie sua Liga Profissional",
  description: "A plataforma #1 para gestão de campeonatos de FIFA, PES, NBA 2K e Futebol Society. Leilões, financeiro e estatísticas automáticas.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png" },
    ],
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
  manifest: "/manifest.json", // Se você tiver um manifest
  verification: {
    google: "FNBOxFJAOCp22RMAOpa65_G98QIqORoiVsIFVbwNuZQ",
  },
};

// CONFIGURAÇÃO PARA PWA (opcional mas recomendado)
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
        {/* Meta tags específicas para iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="LIGA.ON" />

        {/* Meta tag para Android */}
        <meta name="theme-color" content="#000000" />


      </head>
      <body className={inter.className + " bg-zinc-950 text-white min-h-screen"}>
        <Providers>
          <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-zinc-950">
              <div className="text-2xl font-semibold text-white animate-pulse">
                Carregando...
              </div>
            </div>
          }>
            {children}
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}