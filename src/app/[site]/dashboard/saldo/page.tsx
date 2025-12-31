'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { DollarSign, TrendingUp, TrendingDown, Plus, Minus, Building2, Calendar, User, ArrowUpRight, ArrowDownLeft, Filter, RefreshCw, ArrowRightLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import Sidebar from '@/components/Sidebar'
import { useAuth } from '@/hooks/useAuth'
import FloatingChatButton from '@/components/FloatingChatButton'
import { useOrganization } from '@/contexts/OrganizationContext'
import ChatPopup from '@/components/Chatpopup'

interface Team {
  id: string
  name: string
  logo_url: string | null
  balance: number
}

interface BalanceTransaction {
  id: string
  team_id: string
  amount: number
  type: 'credit' | 'debit' | 'exchange_trade'
  description: string
  created_at: string
  player_name?: string
  transfer_type?: 'buy' | 'sell' | 'exchange'
  related_team?: string
  exchange_value?: number
  is_exchange?: boolean
  exchange_only?: boolean
}

// Função de formatar valor
function formatBalance(value: number): string {
  if (value >= 1_000_000_000) return `R$ ${(value / 1_000_000_000).toFixed(1).replace('.0', '')}B`
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1).replace('.0', '')}M`
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(0)} mil`
  return `R$ ${value.toLocaleString('pt-BR')}`
}

// Função para formatar data
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Função para buscar apenas as trocas sem dinheiro
const fetchPureExchanges = async (teamId: string, orgId: string): Promise<BalanceTransaction[]> => {
  try {
    console.log('🔄 Buscando trocas sem dinheiro para o time:', teamId)

    const { data: exchangeTransfers, error } = await supabase
      .from('player_transfers')
      .select('*')
      .or(`from_team_id.eq.${teamId},to_team_id.eq.${teamId}`)
      .eq('transfer_type', 'exchange')
      .eq('status', 'approved')
      .eq('exchange_value', 0)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Erro ao buscar trocas sem dinheiro:', error)
      return []
    }

    console.log('✅ Trocas sem dinheiro encontradas:', exchangeTransfers?.length)

    const pureExchanges: BalanceTransaction[] = []

    exchangeTransfers?.forEach(transfer => {
      const isBuyer = transfer.to_team_id === teamId
      const isSeller = transfer.from_team_id === teamId

      if (isSeller) {
        pureExchanges.push({
          id: `${transfer.id}_sell`,
          team_id: teamId,
          amount: transfer.value,
          type: 'exchange_trade',
          description: `Troca: ${transfer.player_name} saiu`,
          created_at: transfer.created_at,
          player_name: transfer.player_name,
          transfer_type: 'exchange',
          related_team: transfer.to_team_id || undefined,
          exchange_value: 0,
          is_exchange: true,
          exchange_only: true
        })
      }

      if (isBuyer) {
        pureExchanges.push({
          id: `${transfer.id}_buy`,
          team_id: teamId,
          amount: transfer.value,
          type: 'exchange_trade',
          description: `Troca: ${transfer.player_name} chegou`,
          created_at: transfer.created_at,
          player_name: transfer.player_name,
          transfer_type: 'exchange',
          related_team: transfer.from_team_id || undefined,
          exchange_value: 0,
          is_exchange: true,
          exchange_only: true
        })
      }
    })

    return pureExchanges

  } catch (error) {
    console.error('❌ Erro ao processar trocas sem dinheiro:', error)
    return []
  }
}

export default function PaginaSaldo() {
  const router = useRouter()
  const { organization } = useOrganization()
  // const [currentOrg, setCurrentOrg] = useState<any>(null) // Removido
  const { user, loading: authLoading } = useAuth()
  const [team, setTeam] = useState<Team | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [transactions, setTransactions] = useState<BalanceTransaction[]>([])
  const [allTeams, setAllTeams] = useState<Team[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit' | 'exchange'>('all')

  // Estados para o chat
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Estados para o modal de admin
  const [adminModalOpen, setAdminModalOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState('')
  const [transactionAmount, setTransactionAmount] = useState('')
  const [transactionDescription, setTransactionDescription] = useState('')
  const [transactionType, setTransactionType] = useState<'add' | 'remove'>('add')
  const [processing, setProcessing] = useState(false)


  // Carregar Organização Atual - Removido
  // useEffect removido

  // Carrega dados do usuário para o Sidebar
  useEffect(() => {
    if (authLoading || !user) return

    const loadUserData = async () => {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*, teams(*)')
          .eq('id', user.id)
          .eq('organization_id', organization?.id)
          .single()

        if (!profileError) {
          setProfile(profileData)
          setTeam(profileData?.teams || null)
          setIsAdmin(profileData?.role === 'admin')
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error)
      } finally {
        setDataLoading(false)
      }
    }

    loadUserData()
  }, [authLoading, user, organization?.id])

  // Carregar contagem de mensagens não lidas
  useEffect(() => {
    if (!user?.id) return

    const loadUnreadCount = async () => {
      try {
        const { data: conversations } = await supabase
          .from('conversations')
          .select('id')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)

        if (!conversations?.length) {
          setUnreadCount(0)
          return
        }

        const conversationIds = conversations.map(conv => conv.id)

        const { count } = await supabase
          .from('private_messages')
          .select('*', { count: 'exact', head: true })
          .in('conversation_id', conversationIds)
          .eq('read', false)
          .neq('sender_id', user.id)

        setUnreadCount(count || 0)
      } catch (error) {
        console.error('Erro ao carregar contagem de mensagens:', error)
      }
    }

    loadUnreadCount()

    const subscription = supabase
      .channel('unread_messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'private_messages'
        },
        () => {
          loadUnreadCount()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  useEffect(() => {
    if (user && organization?.id) {
      loadData()
    }
  }, [user, organization?.id])

  const loadData = async () => {
    console.log('🔄 Carregando dados...')
    setLoading(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setLoading(false)
      return
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('team_id, role')
        .eq('id', session.user.id)
        .eq('organization_id', organization?.id)
        .single()

      setIsAdmin(profile?.role === 'admin')

      if (profile?.team_id) {
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select('id, name, logo_url, balance')
          .eq('id', profile.team_id)
          .eq('organization_id', organization?.id)
          .single()

        if (teamError) throw teamError
        console.log('✅ Time carregado:', teamData)
        setTeam(teamData)

        const { data: transactionsData, error: transactionsError } = await supabase
          .from('balance_transactions')
          .select('*')
          .eq('team_id', profile.team_id)
          .eq('organization_id', organization?.id)
          .neq('type', 'bid_pending')
          .order('created_at', { ascending: false })

        if (transactionsError) throw transactionsError

        const pureExchanges = await fetchPureExchanges(profile.team_id, organization?.id)

        const allTransactions = [
          ...(transactionsData || []),
          ...pureExchanges
        ].sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )

        console.log('📊 Total de transações:', allTransactions.length)
        console.log('🔄 Trocas sem dinheiro:', pureExchanges.length)

        setTransactions(allTransactions)
      }

      if (profile?.role === 'admin') {
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('id, name, logo_url, balance')
          .eq('organization_id', organization?.id)
          .order('name')

        if (teamsError) throw teamsError
        setAllTeams(teamsData || [])
      }

    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshTeamData = async (teamId: string) => {
    try {
      console.log('🔄 Atualizando dados do time:', teamId)

      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('id, name, logo_url, balance')
        .eq('id', teamId)
        .eq('organization_id', organization?.id)
        .single()

      if (teamError) throw teamError

      console.log('✅ Time atualizado:', teamData)
      setTeam(teamData)

      const { data: transactionsData, error: transactionsError } = await supabase
        .from('balance_transactions')
        .select('*')
        .eq('team_id', teamId)
        .eq('organization_id', organization?.id)
        .neq('type', 'bid_pending')
        .order('created_at', { ascending: false })

      if (transactionsError) throw transactionsError

      const pureExchanges = await fetchPureExchanges(teamId, organization?.id || '')

      const allTransactions = [
        ...(transactionsData || []),
        ...pureExchanges
      ].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      setTransactions(allTransactions)

    } catch (error) {
      console.error('❌ Erro ao atualizar dados do time:', error)
    }
  }

  const handleAdminTransaction = async () => {
    if (!selectedTeam || !transactionAmount || !transactionDescription) {
      alert('Preencha todos os campos')
      return
    }

    const amount = parseFloat(transactionAmount.replace(/\./g, '').replace(',', '.'))
    if (isNaN(amount) || amount <= 0) {
      alert('Valor inválido')
      return
    }

    setProcessing(true)

    try {
      const finalAmount = transactionType === 'add' ? amount : -amount
      const transactionTypeText = transactionType === 'add' ? 'credit' : 'debit'

      console.log('💰 Iniciando transação...')
      console.log('Time:', selectedTeam)
      console.log('Valor final:', finalAmount)
      console.log('Tipo:', transactionTypeText)

      const { data: currentTeam, error: fetchError } = await supabase
        .from('teams')
        .select('balance, name')
        .eq('id', selectedTeam)
        .eq('organization_id', organization?.id)
        .single()

      if (fetchError) {
        console.error('❌ Erro ao buscar time:', fetchError)
        throw new Error(`Erro ao buscar time: ${fetchError.message}`)
      }

      console.log('💰 Saldo atual:', currentTeam.balance)

      const newBalance = currentTeam.balance + finalAmount

      if (newBalance < 0) {
        alert('Saldo não pode ficar negativo')
        return
      }

      console.log('💰 Novo saldo calculado:', newBalance)

      const { error: balanceError } = await supabase
        .from('teams')
        .update({
          balance: newBalance
        })
        .eq('id', selectedTeam)
        .eq('organization_id', organization?.id)

      if (balanceError) {
        console.error('❌ Erro ao atualizar saldo:', balanceError)
        throw new Error(`Erro ao atualizar saldo: ${balanceError.message}`)
      }

      console.log('✅ Saldo atualizado na tabela teams')

      const { data: transactionData, error: transactionError } = await supabase
        .from('balance_transactions')
        .insert([{
          team_id: selectedTeam,
          amount: amount,
          type: transactionTypeText,
          description: transactionDescription,
          created_at: new Date().toISOString(),
          organization_id: organization?.id
        }])
        .select()

      if (transactionError) {
        console.error('❌ Erro ao registrar transação:', {
          message: transactionError.message,
          details: transactionError.details,
          hint: transactionError.hint,
          code: transactionError.code
        })
        throw new Error(`Erro ao registrar transação: ${transactionError.message}`)
      }

      console.log('✅ Transação registrada:', transactionData)

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('team_id')
          .eq('id', user.id)
          .single()

        if (userProfile) {
          if (userProfile.team_id === selectedTeam) {
            console.log('🔄 Atualizando estado do próprio time')
            setTeam(prev => prev ? { ...prev, balance: newBalance } : null)

            if (transactionData && transactionData[0]) {
              setTransactions(prev => [transactionData[0], ...prev])
            }
          } else {
            console.log('ℹ️ Transação foi para outro time, mantendo estado atual')
            if (team) {
              await refreshTeamData(team.id)
            }
          }
        }
      }

      if (isAdmin) {
        setAllTeams(prev =>
          prev.map(t =>
            t.id === selectedTeam
              ? { ...t, balance: newBalance }
              : t
          )
        )
      }

      alert(`✅ Saldo ${transactionType === 'add' ? 'adicionado' : 'removido'} com sucesso!`)

      setAdminModalOpen(false)
      resetAdminForm()

    } catch (error: any) {
      console.error('💥 Erro completo na transação:', error)
      alert(`❌ Erro ao processar transação: ${error.message || 'Erro desconhecido'}`)
    } finally {
      setProcessing(false)
    }
  }

  const resetAdminForm = () => {
    setSelectedTeam('')
    setTransactionAmount('')
    setTransactionDescription('')
    setTransactionType('add')
  }

  const formatCurrency = (value: string) => {
    const onlyNumbers = value.replace(/\D/g, '')
    if (onlyNumbers === '') return ''

    const number = parseInt(onlyNumbers) / 100
    return number.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCurrency(e.target.value)
    setTransactionAmount(formattedValue)
  }

  const getTransactionColor = (transaction: BalanceTransaction) => {
    if (transaction.type === 'exchange_trade') {
      return {
        bg: 'bg-blue-500/20',
        icon: 'text-blue-400',
        text: 'text-blue-400',
        badge: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
        iconComponent: ArrowRightLeft
      }
    } else if (transaction.type === 'credit') {
      return {
        bg: 'bg-emerald-500/20',
        icon: 'text-emerald-400',
        text: 'text-emerald-400',
        badge: 'bg-emerald-500/20 text-emerald-400',
        iconComponent: ArrowUpRight
      }
    } else {
      return {
        bg: 'bg-red-500/20',
        icon: 'text-red-400',
        text: 'text-red-400',
        badge: 'bg-red-500/20 text-red-400',
        iconComponent: ArrowDownLeft
      }
    }
  }

  const getBadgeText = (transaction: BalanceTransaction) => {
    if (transaction.type === 'exchange_trade') {
      return 'Troca'
    } else if (transaction.type === 'credit') {
      return 'Entrada'
    } else {
      return 'Saída'
    }
  }

  const totalCredits = transactions
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalDebits = transactions
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0)

  const filteredTransactions = filter === 'all'
    ? transactions
    : filter === 'exchange'
      ? transactions.filter(t => t.type === 'exchange_trade')
      : transactions.filter(t => t.type === filter)

  const chatUser = {
    id: user?.id || '',
    name: profile?.coach_name || user?.user_metadata?.full_name || user?.email || 'Técnico',
    email: user?.email || ''
  }

  const chatTeam = {
    id: team?.id || '',
    name: team?.name || 'Sem time'
  }

  if (authLoading || dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-xl lg:text-2xl font-semibold text-white animate-pulse">
          Carregando...
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-xl lg:text-2xl text-white animate-pulse">Carregando saldo...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-zinc-950">
      {/* Sidebar - AGORA O COMPONENTE CONTROLADO PELO PRÓPRIO SIDEBAR */}
      <Sidebar user={user!} profile={profile} team={team as any} />

      {/* Conteúdo Principal */}
      <div className="flex-1 w-full">
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-purple-950/20 to-zinc-950 text-white p-4 lg:p-6 safe-horizontal safe-vertical">
          <div className="max-w-6xl mx-auto space-y-4 lg:space-y-8">
            {/* Header - Removido o padding-top extra para mobile */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 lg:gap-6 mb-4 lg:mb-8">
              <div>
                <h1 className="text-2xl lg:text-5xl font-black text-white mb-2 heading-responsive-xl">SALDO DO CLUBE</h1>
                <p className="text-zinc-400 text-sm lg:text-lg text-responsive-sm">
                  Acompanhe suas finanças e movimentações
                </p>
              </div>

              <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                <Button
                  onClick={() => team && refreshTeamData(team.id)}
                  variant="outline"
                  className="bg-zinc-800/50 border-zinc-600 hover:bg-zinc-700/50 text-xs lg:text-sm h-9 lg:h-10 flex-1 lg:flex-none"
                >
                  <RefreshCw className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                  <span className="hidden sm:inline">Atualizar</span>
                  <span className="sm:hidden">Atual.</span>
                </Button>

                {isAdmin && (
                  <Dialog open={adminModalOpen} onOpenChange={setAdminModalOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs lg:text-sm h-9 lg:h-10 flex-1 lg:flex-none">
                        <DollarSign className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                        <span className="hidden sm:inline">Gerenciar Saldos</span>
                        <span className="sm:hidden">Admin</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-zinc-900 border-zinc-700 text-white w-[95vw] max-w-md lg:max-w-lg max-h-[85vh] overflow-y-auto rounded-lg safe-horizontal">
                      <DialogHeader>
                        <DialogTitle className="text-lg lg:text-2xl font-bold">
                          Adicionar/Remover Saldo
                        </DialogTitle>
                      </DialogHeader>

                      <div className="space-y-3 lg:space-y-4 py-3 lg:py-4">
                        <div>
                          <label className="text-zinc-400 text-xs lg:text-sm font-medium mb-1 lg:mb-2 block">
                            Selecione o Clube
                          </label>
                          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                            <SelectTrigger className="bg-zinc-800/50 border-zinc-600 text-xs lg:text-sm h-9 lg:h-10">
                              <SelectValue placeholder="Escolha um clube" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                              {allTeams.map(team => (
                                <SelectItem key={team.id} value={team.id} className="text-xs lg:text-sm">
                                  <div className="flex items-center gap-2">
                                    {team.logo_url && (
                                      <img
                                        src={team.logo_url}
                                        alt={team.name}
                                        className="w-4 h-4 lg:w-5 lg:h-5 rounded-full object-contain flex-shrink-0"
                                      />
                                    )}
                                    <span className="truncate">{team.name}</span>
                                    <Badge variant="secondary" className="ml-auto text-xs flex-shrink-0">
                                      {formatBalance(team.balance)}
                                    </Badge>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-zinc-400 text-xs lg:text-sm font-medium mb-1 lg:mb-2 block">
                            Tipo de Operação
                          </label>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant={transactionType === 'add' ? 'default' : 'outline'}
                              onClick={() => setTransactionType('add')}
                              className={cn(
                                "flex-1 text-xs lg:text-sm h-8 lg:h-9",
                                transactionType === 'add'
                                  ? "bg-emerald-600 hover:bg-emerald-700"
                                  : "bg-zinc-800/50 border-zinc-600"
                              )}
                            >
                              <Plus className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                              Adicionar
                            </Button>
                            <Button
                              type="button"
                              variant={transactionType === 'remove' ? 'default' : 'outline'}
                              onClick={() => setTransactionType('remove')}
                              className={cn(
                                "flex-1 text-xs lg:text-sm h-8 lg:h-9",
                                transactionType === 'remove'
                                  ? "bg-red-600 hover:bg-red-700"
                                  : "bg-zinc-800/50 border-zinc-600"
                              )}
                            >
                              <Minus className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                              Remover
                            </Button>
                          </div>
                        </div>

                        <div>
                          <label className="text-zinc-400 text-xs lg:text-sm font-medium mb-1 lg:mb-2 block">
                            Valor
                          </label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-3 h-3 lg:w-4 lg:h-4" />
                            <Input
                              placeholder="0,00"
                              value={transactionAmount}
                              onChange={handleAmountChange}
                              className="pl-8 lg:pl-10 bg-zinc-800/50 border-zinc-600 text-xs lg:text-sm h-9 lg:h-10"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-zinc-400 text-xs lg:text-sm font-medium mb-1 lg:mb-2 block">
                            Descrição
                          </label>
                          <Input
                            placeholder="Ex: Premiação do campeonato, Multa, etc."
                            value={transactionDescription}
                            onChange={(e) => setTransactionDescription(e.target.value)}
                            className="bg-zinc-800/50 border-zinc-600 text-xs lg:text-sm h-9 lg:h-10"
                          />
                        </div>
                      </div>

                      <DialogFooter className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setAdminModalOpen(false)}
                          className="bg-transparent border-zinc-600 text-xs lg:text-sm h-9 lg:h-10 flex-1"
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={handleAdminTransaction}
                          disabled={processing}
                          className={cn(
                            "flex-1 text-xs lg:text-sm h-9 lg:h-10",
                            transactionType === 'add'
                              ? "bg-emerald-600 hover:bg-emerald-700"
                              : "bg-red-600 hover:bg-red-700"
                          )}
                        >
                          {processing ? 'Processando...' : transactionType === 'add' ? 'Adicionar' : 'Remover'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>

            {team ? (
              <div className="space-y-4 lg:space-y-8">
                {/* Cards de Resumo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-6">
                  {/* Saldo Atual */}
                  <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/30 p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-zinc-400 text-xs lg:text-sm">Saldo Atual</p>
                        <p className="text-lg lg:text-3xl font-bold text-white mt-1 lg:mt-2 heading-responsive-lg">
                          {formatBalance(team.balance)}
                        </p>
                      </div>
                      <div className="p-2 lg:p-3 bg-purple-500/20 rounded-full">
                        <DollarSign className="w-5 h-5 lg:w-8 lg:h-8 text-purple-400" />
                      </div>
                    </div>
                  </Card>

                  {/* Entradas */}
                  <Card className="bg-gradient-to-br from-emerald-600/20 to-green-600/20 border-emerald-500/30 p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-zinc-400 text-xs lg:text-sm">Total de Entradas</p>
                        <p className="text-lg lg:text-3xl font-bold text-white mt-1 lg:mt-2 heading-responsive-lg">
                          {formatBalance(totalCredits)}
                        </p>
                      </div>
                      <div className="p-2 lg:p-3 bg-emerald-500/20 rounded-full">
                        <TrendingUp className="w-5 h-5 lg:w-8 lg:h-8 text-emerald-400" />
                      </div>
                    </div>
                  </Card>

                  {/* Saídas */}
                  <Card className="bg-gradient-to-br from-red-600/20 to-orange-600/20 border-red-500/30 p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-zinc-400 text-xs lg:text-sm">Total de Saídas</p>
                        <p className="text-lg lg:text-3xl font-bold text-white mt-1 lg:mt-2 heading-responsive-lg">
                          {formatBalance(totalDebits)}
                        </p>
                      </div>
                      <div className="p-2 lg:p-3 bg-red-500/20 rounded-full">
                        <TrendingDown className="w-5 h-5 lg:w-8 lg:h-8 text-red-400" />
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Histórico de Transações */}
                <Card className="bg-white/5 border-white/10 p-3 lg:p-6">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 lg:gap-4 mb-3 lg:mb-6">
                    <div>
                      <h2 className="text-lg lg:text-2xl font-bold text-white heading-responsive-md">Histórico de Transações</h2>
                      <p className="text-zinc-400 text-xs lg:text-sm">Todas as movimentações do seu clube</p>
                    </div>

                    <div className="flex flex-wrap gap-1 lg:gap-2 w-full lg:w-auto">
                      {/* Botão "Todas" - Ícone apenas no mobile */}
                      <Button
                        variant={filter === 'all' ? 'default' : 'outline'}
                        onClick={() => setFilter('all')}
                        className={cn(
                          "text-xs lg:text-sm h-7 lg:h-9 flex-1 lg:flex-none min-w-[44px] lg:min-w-[70px] justify-center lg:justify-start",
                          filter === 'all' ? "bg-purple-600" : "bg-zinc-800/50 border-zinc-600"
                        )}
                        title="Todas as transações"
                        aria-label="Todas as transações"
                      >
                        <Filter className="w-3 h-3 lg:w-4 lg:h-4 lg:mr-2 flex-shrink-0" />
                        <span className="hidden lg:inline">Todas</span>
                      </Button>

                      {/* Botão "Entradas" - Ícone apenas no mobile */}
                      <Button
                        variant={filter === 'credit' ? 'default' : 'outline'}
                        onClick={() => setFilter('credit')}
                        className={cn(
                          "text-xs lg:text-sm h-7 lg:h-9 flex-1 lg:flex-none min-w-[44px] lg:min-w-[70px] justify-center lg:justify-start",
                          filter === 'credit' ? "bg-emerald-600" : "bg-zinc-800/50 border-zinc-600"
                        )}
                        title="Entradas"
                        aria-label="Entradas"
                      >
                        <TrendingUp className="w-3 h-3 lg:w-4 lg:h-4 lg:mr-2 flex-shrink-0" />
                        <span className="hidden lg:inline">Entradas</span>
                      </Button>

                      {/* Botão "Saídas" - Ícone apenas no mobile */}
                      <Button
                        variant={filter === 'debit' ? 'default' : 'outline'}
                        onClick={() => setFilter('debit')}
                        className={cn(
                          "text-xs lg:text-sm h-7 lg:h-9 flex-1 lg:flex-none min-w-[44px] lg:min-w-[70px] justify-center lg:justify-start",
                          filter === 'debit' ? "bg-red-600" : "bg-zinc-800/50 border-zinc-600"
                        )}
                        title="Saídas"
                        aria-label="Saídas"
                      >
                        <TrendingDown className="w-3 h-3 lg:w-4 lg:h-4 lg:mr-2 flex-shrink-0" />
                        <span className="hidden lg:inline">Saídas</span>
                      </Button>

                      {/* Botão "Trocas" - Ícone apenas no mobile */}
                      <Button
                        variant={filter === 'exchange' ? 'default' : 'outline'}
                        onClick={() => setFilter('exchange')}
                        className={cn(
                          "text-xs lg:text-sm h-7 lg:h-9 flex-1 lg:flex-none min-w-[44px] lg:min-w-[70px] justify-center lg:justify-start",
                          filter === 'exchange' ? "bg-blue-600" : "bg-zinc-800/50 border-zinc-600"
                        )}
                        title="Trocas"
                        aria-label="Trocas"
                      >
                        <ArrowRightLeft className="w-3 h-3 lg:w-4 lg:h-4 lg:mr-2 flex-shrink-0" />
                        <span className="hidden lg:inline">Trocas</span>
                      </Button>
                    </div>
                  </div>

                  {filteredTransactions.length === 0 ? (
                    <div className="text-center py-6 lg:py-12">
                      <DollarSign className="w-10 h-10 lg:w-16 lg:h-16 text-zinc-600 mx-auto mb-2 lg:mb-4" />
                      <p className="text-zinc-400 text-sm lg:text-lg">Nenhuma transação encontrada</p>
                      <p className="text-zinc-500 text-xs lg:text-sm">Suas movimentações aparecerão aqui</p>
                    </div>
                  ) : (
                    <div className="space-y-2 lg:space-y-3 max-h-[500px] lg:max-h-none overflow-y-auto pr-1 lg:pr-0">
                      {filteredTransactions.map((transaction) => {
                        const colors = getTransactionColor(transaction)
                        const IconComponent = colors.iconComponent

                        return (
                          <div
                            key={transaction.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 lg:p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/50 hover:border-zinc-600 transition-colors gap-2 lg:gap-3"
                          >
                            <div className="flex items-start sm:items-center gap-3 lg:gap-4 w-full sm:w-auto">
                              <div className={cn("p-2 lg:p-3 rounded-full flex-shrink-0", colors.bg)}>
                                <IconComponent className="w-4 h-4 lg:w-5 lg:h-5" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-1 lg:gap-2">
                                  <p className="font-semibold text-white text-sm lg:text-base truncate">
                                    {transaction.description}
                                  </p>
                                  {transaction.is_exchange && (
                                    <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-300 border-blue-500/50 flex-shrink-0">
                                      {transaction.exchange_only ? 'Troca Jogador' : 'Troca'}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 lg:gap-3 mt-1 text-xs lg:text-sm text-zinc-400">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{formatDate(transaction.created_at)}</span>
                                  </div>
                                  {transaction.player_name && (
                                    <div className="flex items-center gap-1">
                                      <User className="w-3 h-3 flex-shrink-0" />
                                      <span className="truncate">{transaction.player_name}</span>
                                    </div>
                                  )}
                                  {transaction.related_team && (
                                    <div className="flex items-center gap-1">
                                      <Building2 className="w-3 h-3 flex-shrink-0" />
                                      <span className="truncate">{transaction.related_team}</span>
                                    </div>
                                  )}
                                  {transaction.exchange_value && transaction.exchange_value > 0 && (
                                    <Badge variant="outline" className="text-xs bg-purple-500/20 text-purple-300 border-purple-500/50 flex-shrink-0">
                                      Valor troca: {formatBalance(transaction.exchange_value)}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="text-right flex-shrink-0 sm:ml-2 self-end sm:self-auto">
                              {transaction.type === 'exchange_trade' ? (
                                <div>
                                  <p className={cn("text-sm lg:text-xl font-bold", colors.text)}>
                                    {formatBalance(transaction.amount)}
                                  </p>
                                  <p className="text-xs text-zinc-400">Valor do jogador</p>
                                </div>
                              ) : (
                                <div>
                                  <p className={cn("text-sm lg:text-xl font-bold", colors.text)}>
                                    {transaction.type === 'credit' ? '+' : '-'} {formatBalance(transaction.amount)}
                                  </p>
                                </div>
                              )}
                              <Badge
                                variant="secondary"
                                className={cn("mt-1 text-xs", colors.badge)}
                              >
                                {getBadgeText(transaction)}
                              </Badge>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </Card>
              </div>
            ) : (
              <Card className="p-6 lg:p-16 text-center bg-white/5 border-white/10">
                <Building2 className="w-10 h-10 lg:w-16 lg:h-16 text-zinc-600 mx-auto mb-3 lg:mb-4" />
                <h3 className="text-lg lg:text-2xl font-bold text-white mb-2">Nenhum clube associado</h3>
                <p className="text-zinc-400 text-sm lg:text-base">
                  Você precisa estar associado a um clube para visualizar o saldo.
                </p>
              </Card>
            )}
          </div>
        </div>

        {/* Chat Components */}
        {user && team && (
          <>
            <FloatingChatButton
              currentUser={chatUser}
              currentTeam={chatTeam}
              unreadCount={unreadCount}
              onOpenChat={() => setIsChatOpen(true)}
            />

            <ChatPopup
              isOpen={isChatOpen}
              onClose={() => setIsChatOpen(false)}
              currentUser={chatUser}
              currentTeam={chatTeam}
            />
          </>
        )}
      </div>
    </div>
  )
}