// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // ← libera TODOS os domínios externos
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  // Para Turbopack funcionar direitinho
  experimental: {
    appDocumentPreloading: true,
  },
}

module.exports = nextConfig