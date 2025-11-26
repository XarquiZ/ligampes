// src/lib/env.ts
export function getSiteUrl(): string {
  // Se está no servidor (SSR), use variável de ambiente
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  }
  
  // Se está no cliente, detecta automaticamente
  // Produção
  if (window.location.hostname === 'ligampes.vercel.app') {
    return 'https://ligampes.vercel.app'
  }
  
  // Desenvolvimento local
  return 'http://localhost:3000'
}

