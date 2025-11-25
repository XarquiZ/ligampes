// src/app/layout.tsx - VERSÃO FINAL CORRIGIDA
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Providers from "@/components/providers";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LIGA MPES",
  description: "A liga mais braba do Brasil",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
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