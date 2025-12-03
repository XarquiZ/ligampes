'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface UseSaldoReservadoProps {
  teamId?: string | null
  enableRealtime?: boolean
}

export const useSaldoReservado = ({ teamId, enableRealtime = true }: UseSaldoReservadoProps = {}) => {
  // Estado local (LocalStorage)
  const [saldoReservadoLocal, setSaldoReservadoLocal] = useState<{[key: string]: number}>({})
  
  // Estado do banco de dados
  const [saldoReservadoDB, setSaldoReservadoDB] = useState<{[key: string]: number}>({})
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now())
  const [isLoading, setIsLoading] = useState(false)

  // 1. Carregar do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('saldoReservadoLeilao')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (typeof parsed === 'object' && parsed !== null) {
          setSaldoReservadoLocal(parsed)
          console.log('💰 Saldo reservado (local) carregado:', parsed)
        }
      } catch (error) {
        console.error('❌ Erro ao carregar saldo reservado local:', error)
      }
    }
  }, [])

  // 2. Salvar no localStorage
  useEffect(() => {
    try {
      localStorage.setItem('saldoReservadoLeilao', JSON.stringify(saldoReservadoLocal))
    } catch (error) {
      console.error('❌ Erro ao salvar saldo reservado local:', error)
    }
  }, [saldoReservadoLocal])

  // 3. Carregar do banco de dados (transações reais)
  const loadPendingReserves = useCallback(async (teamId: string) => {
    if (!teamId) return
    
    setIsLoading(true)
    try {
      const { data: pendingTransactions, error } = await supabase
        .from('balance_transactions')
        .select(`
          amount,
          auction_id,
          auctions!inner (
            id,
            status
          )
        `)
        .eq('team_id', teamId)
        .eq('type', 'bid_pending')
        .eq('is_processed', false)
        .eq('auctions.status', 'active')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Erro ao carregar transações pendentes:', error)
        return
      }

      const reserves: {[key: string]: number} = {}
      pendingTransactions?.forEach(transaction => {
        if (transaction.auction_id) {
          reserves[transaction.auction_id] = transaction.amount
        }
      })

      setSaldoReservadoDB(reserves)
      setLastUpdate(Date.now())
      console.log('💰 Saldo reservado (DB) atualizado:', reserves)

    } catch (error) {
      console.error('❌ Erro ao carregar saldos reservados:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 4. Configurar realtime para transações
  useEffect(() => {
    if (!teamId || !enableRealtime) return

    const channel = supabase
      .channel(`transactions_${teamId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'balance_transactions',
          filter: `team_id=eq.${teamId}`
        },
        () => {
          console.log('🔄 Transação detectada, atualizando saldo reservado...')
          loadPendingReserves(teamId)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [teamId, enableRealtime, loadPendingReserves])

  // 5. Inicializar carregamento do DB
  useEffect(() => {
    if (teamId) {
      loadPendingReserves(teamId)
    }
  }, [teamId, loadPendingReserves])

  // FUNÇÕES DE MANIPULAÇÃO

  // Reservar saldo (local + DB via RPC)
  const reservarSaldo = async (auctionId: string, amount: number) => {
    // Atualizar localmente imediatamente
    setSaldoReservadoLocal(prev => {
      const novo = { ...prev, [auctionId]: amount }
      console.log(`💰 Saldo reservado localmente: ${auctionId} = R$ ${amount}`)
      return novo
    })

    // O banco será atualizado pela RPC place_bid_atomic
  }

  // Liberar saldo (quando lance é coberto)
  const liberarSaldo = async (auctionId: string, teamId?: string) => {
    // Liberar localmente
    setSaldoReservadoLocal(prev => {
      const novo = { ...prev }
      if (novo[auctionId]) {
        console.log(`💰 Saldo liberado localmente: ${auctionId}`)
        delete novo[auctionId]
      }
      return novo
    })

    // Se tiver teamId, atualizar DB também
    if (teamId) {
      // A função place_bid_atomic já cuida disso automaticamente
      // Mas podemos forçar uma recarga
      await loadPendingReserves(teamId)
    }
  }

  // Debitar saldo do vencedor (quando leilão termina)
  const debitarSaldoVencedor = async (auctionId: string, teamId?: string, valor?: number) => {
    // Remover do local
    setSaldoReservadoLocal(prev => {
      const novo = { ...prev }
      if (novo[auctionId]) {
        console.log(`💰 Débito local do vencedor: ${auctionId}`)
        delete novo[auctionId]
      }
      return novo
    })

    // Atualizar DB
    if (teamId) {
      await loadPendingReserves(teamId)
    }
  }

  // Verificar saldo TOTAL (local + DB)
  const getSaldoReservadoTotal = () => {
    const totalLocal = Object.values(saldoReservadoLocal).reduce((total, valor) => total + valor, 0)
    const totalDB = Object.values(saldoReservadoDB).reduce((total, valor) => total + valor, 0)
    
    // Usar o maior valor (o DB é a fonte da verdade)
    return Math.max(totalDB, totalLocal)
  }

  // Verificar saldo específico para um leilão
  const getSaldoReservadoParaLeilao = (auctionId: string) => {
    // Priorizar DB, mas fallback para local
    return saldoReservadoDB[auctionId] || saldoReservadoLocal[auctionId] || 0
  }

  // Limpar tudo (logout ou reset)
  const limparSaldosReservados = () => {
    setSaldoReservadoLocal({})
    setSaldoReservadoDB({})
    localStorage.removeItem('saldoReservadoLeilao')
    console.log('🧹 Todos os saldos reservados foram limpos')
  }

  // Sincronizar local com DB
  const sincronizarComDB = async () => {
    if (!teamId) return
    
    console.log('🔄 Sincronizando saldos locais com DB...')
    
    // Para cada reserva local, verificar se ainda existe no DB
    const leiloesParaRemover: string[] = []
    
    Object.keys(saldoReservadoLocal).forEach(async (auctionId) => {
      if (!saldoReservadoDB[auctionId]) {
        // Reserva local não existe mais no DB, remover
        leiloesParaRemover.push(auctionId)
      }
    })
    
    if (leiloesParaRemover.length > 0) {
      setSaldoReservadoLocal(prev => {
        const novo = { ...prev }
        leiloesParaRemover.forEach(id => delete novo[id])
        return novo
      })
    }
    
    await loadPendingReserves(teamId)
  }

  return {
    // Estados
    saldoReservado: saldoReservadoDB, // Usar DB como fonte principal
    saldoReservadoLocal,
    lastUpdate,
    isLoading,
    
    // Funções principais
    reservarSaldo,
    liberarSaldo,
    debitarSaldoVencedor,
    getSaldoReservado: getSaldoReservadoTotal,
    getSaldoReservadoParaLeilao,
    
    // Funções de gerenciamento
    loadPendingReserves,
    limparSaldosReservados,
    sincronizarComDB,
    
    // Utilitários
    temSaldoReservado: (auctionId: string) => {
      return !!saldoReservadoDB[auctionId] || !!saldoReservadoLocal[auctionId]
    }
  }
}