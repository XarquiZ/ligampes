'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { DollarSign, TrendingUp, TrendingDown, Plus, Minus, Building2, Calendar, User, ArrowUpRight, ArrowDownLeft, Filter, RefreshCw, ArrowRightLeft, Users } from 'lucide-react'
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
  exchange_only?: boolean // Nova propriedade para trocas sem dinheiro
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

// Função para buscar apenas as trocas sem dinheiro (jogador por jogador)
const fetchPureExchanges = async (teamId: string): Promise<BalanceTransaction[]> => {
  try {
    console.log('🔄 Buscando trocas sem dinheiro para o time:', teamId)
    
    // Buscar transferências de troca onde não há dinheiro envolvido
    const { data: exchangeTransfers, error } = await supabase
      .from('player_transfers')
      .select('*')
      .or(`from_team_id.eq.${teamId},to_team_id.eq.${teamId}`)
      .eq('transfer_type', 'exchange')
      .eq('status', 'approved')
      .eq('exchange_value', 0)
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
      
      // Para o vendedor - perde o jogador
      if (isSeller) {
        pureExchanges.push({
          id: `${transfer.id}_sell`,
          team_id: teamId,
          amount: transfer.value, // Valor do jogador (só para referência)
          type: 'exchange_trade',
          description: `Troca: ${transfer.player_name} saiu`,
          created_at: transfer.created_at,
          player_name: transfer.player_name,
          transfer_type: 'exchange',
          related_team: transfer.to_team_id || undefined,
          exchange_value: 0,
          is_exchange: true,
          exchange_only: true // Marca como troca sem dinheiro
        })
      }
      
      // Para o comprador - ganha o jogador
      if (isBuyer) {
        pureExchanges.push({
          id: `${transfer.id}_buy`,
          team_id: teamId,
          amount: transfer.value, // Valor do jogador (só para referência)
          type: 'exchange_trade',
          description: `Troca: ${transfer.player_name} chegou`,
          created_at: transfer.created_at,
          player_name: transfer.player_name,
          transfer_type: 'exchange',
          related_team: transfer.from_team_id || undefined,
          exchange_value: 0,
          is_exchange: true,
          exchange_only: true // Marca como troca sem dinheiro
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

  // Carrega dados do usuário para o Sidebar
  useEffect(() => {
    if (authLoading || !user) return

    const loadUserData = async () => {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*, teams(*)')
          .eq('id', user.id)
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
  }, [authLoading, user])

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

    // Subscription para atualizar em tempo real
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

  const loadData = async () => {
    console.log('🔄 Carregando dados...')
    setLoading(true)
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setLoading(false)
      return
    }

    try {
      // 1. Verificar se é admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('team_id, role')
        .eq('id', session.user.id)
        .single()

      setIsAdmin(profile?.role === 'admin')

      // 2. Carregar dados do time do usuário
      if (profile?.team_id) {
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select('id, name, logo_url, balance')
          .eq('id', profile.team_id)
          .single()

        if (teamError) throw teamError
        console.log('✅ Time carregado:', teamData)
        setTeam(teamData)

        // 3. Carregar transações do time da tabela balance_transactions
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('balance_transactions')
          .select('*')
          .eq('team_id', profile.team_id)
          .neq('type', 'bid_pending')
          .order('created_at', { ascending: false })

        if (transactionsError) throw transactionsError

        // 4. Carregar apenas trocas sem dinheiro (jogador por jogador)
        const pureExchanges = await fetchPureExchanges(profile.team_id)

        // 5. Combinar todas as transações
        const allTransactions = [
          ...(transactionsData || []),
          ...pureExchanges // Adiciona apenas trocas sem dinheiro
        ].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )

        console.log('📊 Total de transações:', allTransactions.length)
        console.log('🔄 Trocas sem dinheiro:', pureExchanges.length)
        
        setTransactions(allTransactions)
      }

      // 6. Carregar todos os times (para admin)
      if (profile?.role === 'admin') {
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('id, name, logo_url, balance')
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

  // Função para atualizar apenas os dados do time específico
  const refreshTeamData = async (teamId: string) => {
    try {
      console.log('🔄 Atualizando dados do time:', teamId)
      
      // Buscar dados atualizados do time
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('id, name, logo_url, balance')
        .eq('id', teamId)
        .single()

      if (teamError) throw teamError

      console.log('✅ Time atualizado:', teamData)
      setTeam(teamData)

      // Buscar transações atualizadas
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('balance_transactions')
        .select('*')
        .eq('team_id', teamId)
        .neq('type', 'bid_pending')
        .order('created_at', { ascending: false })

      if (transactionsError) throw transactionsError

      // Buscar trocas sem dinheiro atualizadas
      const pureExchanges = await fetchPureExchanges(teamId)

      // Combinar todas as transações
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

  // Função para adicionar/remover saldo (admin) - CORRIGIDA
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

      // 1. Buscar saldo atual do time
      const { data: currentTeam, error: fetchError } = await supabase
        .from('teams')
        .select('balance, name')
        .eq('id', selectedTeam)
        .single()

      if (fetchError) {
        console.error('❌ Erro ao buscar time:', fetchError)
        throw new Error(`Erro ao buscar time: ${fetchError.message}`)
      }

      console.log('💰 Saldo atual:', currentTeam.balance)

      // 2. Calcular novo saldo
      const newBalance = currentTeam.balance + finalAmount

      if (newBalance < 0) {
        alert('Saldo não pode ficar negativo')
        return
      }

      console.log('💰 Novo saldo calculado:', newBalance)

      // 3. Atualizar saldo do time na tabela teams
      const { error: balanceError } = await supabase
        .from('teams')
        .update({ 
          balance: newBalance
        })
        .eq('id', selectedTeam)

      if (balanceError) {
        console.error('❌ Erro ao atualizar saldo:', balanceError)
        throw new Error(`Erro ao atualizar saldo: ${balanceError.message}`)
      }

      console.log('✅ Saldo atualizado na tabela teams')

      // 4. Registrar transação
      const { data: transactionData, error: transactionError } = await supabase
        .from('balance_transactions')
        .insert([{
          team_id: selectedTeam,
          amount: amount, // Sempre valor absoluto
          type: transactionTypeText,
          description: transactionDescription,
          created_at: new Date().toISOString()
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

      // 5. VERIFICAR SE É O TIME DO USUÁRIO ANTES DE ATUALIZAR O ESTADO
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('team_id')
          .eq('id', user.id)
          .single()

        if (userProfile) {
          // ATUALIZAR ESTADO LOCAL APENAS SE FOR O PRÓPRIO TIME DO USUÁRIO
          if (userProfile.team_id === selectedTeam) {
            console.log('🔄 Atualizando estado do próprio time')
            setTeam(prev => prev ? { ...prev, balance: newBalance } : null)
            
            if (transactionData && transactionData[0]) {
              setTransactions(prev => [transactionData[0], ...prev])
            }
          } else {
            console.log('ℹ️ Transação foi para outro time, mantendo estado atual')
            // Se foi para outro time, garante que os dados atuais estão sincronizados
            if (team) {
              await refreshTeamData(team.id)
            }
          }
        }
      }

      // 6. Atualizar a lista de todos os times (para admin) - apenas visual do modal
      if (isAdmin) {
        setAllTeams(prev => 
          prev.map(t => 
            t.id === selectedTeam 
              ? { ...t, balance: newBalance }
              : t
          )
        )
      }

      // Sucesso
      alert(`✅ Saldo ${transactionType === 'add' ? 'adicionado' : 'removido'} com sucesso!`)
      
      // Fechar modal e resetar form
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

  // Formatar valor monetário
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

  // Função para obter cor baseada no tipo de transação
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
    } else { // debit
      return {
        bg: 'bg-red-500/20',
        icon: 'text-red-400',
        text: 'text-red-400',
        badge: 'bg-red-500/20 text-red-400',
        iconComponent: ArrowDownLeft
      }
    }
  }

  // Função para obter texto do badge
  const getBadgeText = (transaction: BalanceTransaction) => {
    if (transaction.type === 'exchange_trade') {
      return 'Troca'
    } else if (transaction.type === 'credit') {
      return 'Entrada'
    } else {
      return 'Saída'
    }
  }

  // Calcular totais
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

  // Criar objetos compatíveis com os componentes de chat
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
        <div className="text-2xl font-semibold text-white animate-pulse">
          Carregando...
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-2xl text-white animate-pulse">Carregando saldo...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-zinc-950">
      {/* Sidebar */}
      <Sidebar user={user!} profile={profile} team={team} />

      {/* Conteúdo Principal */}
      <div className="flex-1 transition-all duration-300 lg:ml-0">
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-purple-950/20 to-zinc-950 text-white p-4 lg:p-6">
          <div className="max-w-6xl mx-auto space-y-6 lg:space-y-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-6 mb-6 lg:mb-8">
              <div>
                <h1 className="text-3xl lg:text-5xl font-black text-white mb-2">SALDO DO CLUBE</h1>
                <p className="text-zinc-400 text-sm lg:text-lg">
                  Acompanhe suas finanças e movimentações
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => team && refreshTeamData(team.id)}
                  variant="outline"
                  className="bg-zinc-800/50 border-zinc-600 hover:bg-zinc-700/50"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar
                </Button>

                {isAdmin && (
                  <Dialog open={adminModalOpen} onOpenChange={setAdminModalOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm lg:text-base">
                        <DollarSign className="w-4 h-4 mr-2" />
                        Gerenciar Saldos
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-md lg:max-w-lg">
                      <DialogHeader>
                        <DialogTitle className="text-xl lg:text-2xl font-bold">
                          Adicionar/Remover Saldo
                        </DialogTitle>
                      </DialogHeader>

                      <div className="space-y-3 lg:space-y-4 py-3 lg:py-4">
                        <div>
                          <label className="text-zinc-400 text-sm font-medium mb-2 block">
                            Selecione o Clube
                          </label>
                          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                            <SelectTrigger className="bg-zinc-800/50 border-zinc-600 text-sm">
                              <SelectValue placeholder="Escolha um clube" />
                            </SelectTrigger>
                            <SelectContent>
                              {allTeams.map(team => (
                                <SelectItem key={team.id} value={team.id}>
                                  <div className="flex items-center gap-2">
                                    {team.logo_url && (
                                      <img 
                                        src={team.logo_url} 
                                        alt={team.name}
                                        className="w-5 h-5 lg:w-6 lg:h-6 rounded-full object-contain"
                                      />
                                    )}
                                    <span className="text-sm">{team.name}</span>
                                    <Badge variant="secondary" className="ml-auto text-xs">
                                      {formatBalance(team.balance)}
                                    </Badge>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-zinc-400 text-sm font-medium mb-2 block">
                            Tipo de Operação
                          </label>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant={transactionType === 'add' ? 'default' : 'outline'}
                              onClick={() => setTransactionType('add')}
                              className={cn(
                                "flex-1 text-xs lg:text-sm",
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
                                "flex-1 text-xs lg:text-sm",
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
                          <label className="text-zinc-400 text-sm font-medium mb-2 block">
                            Valor
                          </label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-3 h-3 lg:w-4 lg:h-4" />
                            <Input
                              placeholder="0,00"
                              value={transactionAmount}
                              onChange={handleAmountChange}
                              className="pl-8 lg:pl-10 bg-zinc-800/50 border-zinc-600 text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-zinc-400 text-sm font-medium mb-2 block">
                            Descrição
                          </label>
                          <Input
                            placeholder="Ex: Premiação do campeonato, Multa, etc."
                            value={transactionDescription}
                            onChange={(e) => setTransactionDescription(e.target.value)}
                            className="bg-zinc-800/50 border-zinc-600 text-sm"
                          />
                        </div>
                      </div>

                      <DialogFooter className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setAdminModalOpen(false)}
                          className="bg-transparent border-zinc-600 text-sm flex-1"
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={handleAdminTransaction}
                          disabled={processing}
                          className={cn(
                            "flex-1 text-sm",
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
              <div className="space-y-6 lg:space-y-8">
                {/* Cards de Resumo */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                  {/* Saldo Atual */}
                  <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/30 p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-zinc-400 text-xs lg:text-sm">Saldo Atual</p>
                        <p className="text-xl lg:text-3xl font-bold text-white mt-1 lg:mt-2">
                          {formatBalance(team.balance)}
                        </p>
                      </div>
                      <div className="p-2 lg:p-3 bg-purple-500/20 rounded-full">
                        <DollarSign className="w-6 h-6 lg:w-8 lg:h-8 text-purple-400" />
                      </div>
                    </div>
                  </Card>

                  {/* Entradas */}
                  <Card className="bg-gradient-to-br from-emerald-600/20 to-green-600/20 border-emerald-500/30 p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-zinc-400 text-xs lg:text-sm">Total de Entradas</p>
                        <p className="text-xl lg:text-3xl font-bold text-white mt-1 lg:mt-2">
                          {formatBalance(totalCredits)}
                        </p>
                      </div>
                      <div className="p-2 lg:p-3 bg-emerald-500/20 rounded-full">
                        <TrendingUp className="w-6 h-6 lg:w-8 lg:h-8 text-emerald-400" />
                      </div>
                    </div>
                  </Card>

                  {/* Saídas */}
                  <Card className="bg-gradient-to-br from-red-600/20 to-orange-600/20 border-red-500/30 p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-zinc-400 text-xs lg:text-sm">Total de Saídas</p>
                        <p className="text-xl lg:text-3xl font-bold text-white mt-1 lg:mt-2">
                          {formatBalance(totalDebits)}
                        </p>
                      </div>
                      <div className="p-2 lg:p-3 bg-red-500/20 rounded-full">
                        <TrendingDown className="w-6 h-6 lg:w-8 lg:h-8 text-red-400" />
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Histórico de Transações */}
                <Card className="bg-white/5 border-white/10 p-4 lg:p-6">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 lg:gap-4 mb-4 lg:mb-6">
                    <div>
                      <h2 className="text-xl lg:text-2xl font-bold text-white">Histórico de Transações</h2>
                      <p className="text-zinc-400 text-sm">Todas as movimentações do seu clube</p>
                    </div>

                    <div className="flex gap-1 lg:gap-2">
                      <Button
                        variant={filter === 'all' ? 'default' : 'outline'}
                        onClick={() => setFilter('all')}
                        className={cn(
                          "text-xs lg:text-sm h-8 lg:h-9",
                          filter === 'all' ? "bg-purple-600" : "bg-zinc-800/50 border-zinc-600"
                        )}
                      >
                        <Filter className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                        Todas
                      </Button>
                      <Button
                        variant={filter === 'credit' ? 'default' : 'outline'}
                        onClick={() => setFilter('credit')}
                        className={cn(
                          "text-xs lg:text-sm h-8 lg:h-9",
                          filter === 'credit' ? "bg-emerald-600" : "bg-zinc-800/50 border-zinc-600"
                        )}
                      >
                        <TrendingUp className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                        Entradas
                      </Button>
                      <Button
                        variant={filter === 'debit' ? 'default' : 'outline'}
                        onClick={() => setFilter('debit')}
                        className={cn(
                          "text-xs lg:text-sm h-8 lg:h-9",
                          filter === 'debit' ? "bg-red-600" : "bg-zinc-800/50 border-zinc-600"
                        )}
                      >
                        <TrendingDown className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                        Saídas
                      </Button>
                      <Button
                        variant={filter === 'exchange' ? 'default' : 'outline'}
                        onClick={() => setFilter('exchange')}
                        className={cn(
                          "text-xs lg:text-sm h-8 lg:h-9",
                          filter === 'exchange' ? "bg-blue-600" : "bg-zinc-800/50 border-zinc-600"
                        )}
                      >
                        <ArrowRightLeft className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                        Trocas
                      </Button>
                    </div>
                  </div>

                  {filteredTransactions.length === 0 ? (
                    <div className="text-center py-8 lg:py-12">
                      <DollarSign className="w-12 h-12 lg:w-16 lg:h-16 text-zinc-600 mx-auto mb-3 lg:mb-4" />
                      <p className="text-zinc-400 text-base lg:text-lg">Nenhuma transação encontrada</p>
                      <p className="text-zinc-500 text-sm">Suas movimentações aparecerão aqui</p>
                    </div>
                  ) : (
                    <div className="space-y-2 lg:space-y-3">
                      {filteredTransactions.map((transaction) => {
                        const colors = getTransactionColor(transaction)
                        const IconComponent = colors.iconComponent
                        
                        return (
                          <div
                            key={transaction.id}
                            className="flex items-center justify-between p-3 lg:p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/50 hover:border-zinc-600 transition-colors"
                          >
                            <div className="flex items-center gap-3 lg:gap-4">
                              <div className={cn("p-2 lg:p-3 rounded-full", colors.bg)}>
                                <IconComponent className="w-4 h-4 lg:w-6 lg:h-6" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-white text-sm lg:text-base truncate">
                                    {transaction.description}
                                  </p>
                                  {transaction.is_exchange && (
                                    <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-300 border-blue-500/50">
                                      {transaction.exchange_only ? 'Troca Jogador' : 'Troca'}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-4 mt-1 text-xs lg:text-sm text-zinc-400">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(transaction.created_at)}
                                  </div>
                                  {transaction.player_name && (
                                    <div className="flex items-center gap-1">
                                      <User className="w-3 h-3" />
                                      <span className="truncate">{transaction.player_name}</span>
                                    </div>
                                  )}
                                  {transaction.related_team && (
                                    <div className="flex items-center gap-1">
                                      <Building2 className="w-3 h-3" />
                                      <span className="truncate">{transaction.related_team}</span>
                                    </div>
                                  )}
                                  {transaction.exchange_value && transaction.exchange_value > 0 && (
                                    <Badge variant="outline" className="text-xs bg-purple-500/20 text-purple-300 border-purple-500/50">
                                      Valor troca: {formatBalance(transaction.exchange_value)}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="text-right flex-shrink-0 ml-2">
                              {transaction.type === 'exchange_trade' ? (
                                <div>
                                  <p className={cn("text-base lg:text-xl font-bold", colors.text)}>
                                    {formatBalance(transaction.amount)}
                                  </p>
                                  <p className="text-xs text-zinc-400">Valor do jogador</p>
                                </div>
                              ) : (
                                <div>
                                  <p className={cn("text-base lg:text-xl font-bold", colors.text)}>
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
              <Card className="p-8 lg:p-16 text-center bg-white/5 border-white/10">
                <Building2 className="w-12 h-12 lg:w-16 lg:h-16 text-zinc-600 mx-auto mb-3 lg:mb-4" />
                <h3 className="text-xl lg:text-2xl font-bold text-white mb-2">Nenhum clube associado</h3>
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