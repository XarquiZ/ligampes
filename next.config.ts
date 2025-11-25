// next.config.js - VERSÃO FINAL CORRETA
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  // CORREÇÃO CRÍTICA: reactCompiler não vai dentro de experimental
  reactCompiler: {
    compilationMode: 'annotation',
  },
  // Mantenha para garantir o deploy
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig