import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      detectSessionInUrl: true,
      flowType: 'pkce',
      autoRefreshToken: true,
      persistSession: true,
    },
    // ADICIONE ESTA PARTE PARA OTIMIZAR O REALTIME:
    realtime: {
      params: {
        eventsPerSecond: 5, // Reduz carga
      },
      // ⚡ RECONEXÃO RÁPIDA - ESSENCIAL!
      reconnectAfterMs: (tries) => {
        // Tenta reconectar em: 1s, 2s, 4s, 8s, 16s (máx)
        const delay = Math.min(1000 * Math.pow(2, tries), 16000)
        console.log(`🔄 Tentativa ${tries + 1}, reconectando em ${delay}ms`)
        return delay
      },
      // Heartbeat para manter conexão viva
      heartbeatIntervalMs: 30000,
    },
    // Configurações globais
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-web',
      },
    },
  }
)

// Função auxiliar para verificar status da conexão
export const checkRealtimeStatus = async () => {
  try {
    const channel = supabase.channel('health-check')
    await channel.subscribe()
    const status = await channel.state
    supabase.removeChannel(channel)
    return { connected: status === 'joined', status }
  } catch (error) {
    return { connected: false, error }
  }
}