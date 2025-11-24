// hooks/useSaldoReservado.ts - Crie este arquivo
'use client'

import { useState, useEffect } from 'react'

export const useSaldoReservado = () => {
  const [saldoReservado, setSaldoReservado] = useState<{[key: string]: number}>({})

  // Carregar do localStorage na inicialização
  useEffect(() => {
    const saved = localStorage.getItem('saldoReservadoLeilao')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        
        // CORREÇÃO: Verificar se os dados não estão corrompidos
        if (typeof parsed === 'object' && parsed !== null) {
          setSaldoReservado(parsed)
          console.log('💰 Saldo reservado carregado:', parsed)
        } else {
          console.warn('⚠️ Dados de saldo reservado corrompidos, limpando...')
          localStorage.removeItem('saldoReservadoLeilao')
        }
      } catch (error) {
        console.error('❌ Erro ao carregar saldo reservado:', error)
        localStorage.removeItem('saldoReservadoLeilao')
      }
    }
  }, [])

  // Salvar no localStorage sempre que mudar
  useEffect(() => {
    try {
      localStorage.setItem('saldoReservadoLeilao', JSON.stringify(saldoReservado))
      console.log('💰 Saldo reservado salvo:', saldoReservado)
    } catch (error) {
      console.error('❌ Erro ao salvar saldo reservado:', error)
    }
  }, [saldoReservado])

  const reservarSaldo = (auctionId: string, amount: number) => {
    setSaldoReservado(prev => {
      const novo = { ...prev, [auctionId]: amount }
      console.log(`💰 Saldo reservado para leilão ${auctionId}: R$ ${amount.toLocaleString('pt-BR')}`)
      return novo
    })
  }

  const liberarSaldo = (auctionId: string) => {
    setSaldoReservado(prev => {
      const novo = { ...prev }
      if (novo[auctionId]) {
        console.log(`💰 Saldo liberado do leilão ${auctionId}: R$ ${novo[auctionId].toLocaleString('pt-BR')}`)
        delete novo[auctionId]
      }
      return novo
    })
  }

  const getSaldoReservado = () => {
    return Object.values(saldoReservado).reduce((total, valor) => total + valor, 0)
  }

  return {
    saldoReservado,
    reservarSaldo,
    liberarSaldo,
    getSaldoReservado
  }
}