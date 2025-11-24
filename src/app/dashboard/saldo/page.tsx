// src/app/dashboard/saldo/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { DollarSign, TrendingUp, TrendingDown, Plus, Minus, Building2, Calendar, User, ArrowUpRight, ArrowDownLeft, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

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
  type: 'credit' | 'debit'
  description: string
  created_at: string
  player_name?: string
  transfer_type?: 'buy' | 'sell' | 'exchange'
  related_team?: string
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

export default function PaginaSaldo() {
  const supabase = createClientComponentClient()
  const [team, setTeam] = useState<Team | null>(null)
  const [transactions, setTransactions] = useState<BalanceTransaction[]>([])
  const [allTeams, setAllTeams] = useState<Team[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all')

  // Estados para o modal de admin
  const [adminModalOpen, setAdminModalOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState('')
  const [transactionAmount, setTransactionAmount] = useState('')
  const [transactionDescription, setTransactionDescription] = useState('')
  const [transactionType, setTransactionType] = useState<'add' | 'remove'>('add')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  // useEffect para debug
  useEffect(() => {
    console.log('🔄 Estado do time atualizado:', team)
  }, [team])

  useEffect(() => {
    console.log('📊 Transações atualizadas:', transactions)
  }, [transactions])

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

        // 3. Carregar transações do time
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('balance_transactions')
          .select('*')
          .eq('team_id', profile.team_id)
          .order('created_at', { ascending: false })

        if (transactionsError) throw transactionsError
        setTransactions(transactionsData || [])
      }

      // 4. Carregar todos os times (para admin)
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
        .order('created_at', { ascending: false })

      if (transactionsError) throw transactionsError
      setTransactions(transactionsData || [])

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

  // Calcular totais
  const totalCredits = transactions
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalDebits = transactions
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0)

  const filteredTransactions = filter === 'all' 
    ? transactions 
    : transactions.filter(t => t.type === filter)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-2xl text-white animate-pulse">Carregando saldo...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-purple-950/20 to-zinc-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div>
            <h1 className="text-5xl font-black text-white mb-2">SALDO DO CLUBE</h1>
            <p className="text-zinc-400 text-lg">
              Acompanhe suas finanças e movimentações
            </p>
          </div>

          {isAdmin && (
            <Dialog open={adminModalOpen} onOpenChange={setAdminModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Gerenciar Saldos
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-900 border-zinc-700 text-white">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">
                    Adicionar/Remover Saldo
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div>
                    <label className="text-zinc-400 text-sm font-medium mb-2 block">
                      Selecione o Clube
                    </label>
                    <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                      <SelectTrigger className="bg-zinc-800/50 border-zinc-600">
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
                                  className="w-6 h-6 rounded-full object-contain"
                                />
                              )}
                              <span>{team.name}</span>
                              <Badge variant="secondary" className="ml-auto">
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
                          "flex-1",
                          transactionType === 'add' 
                            ? "bg-emerald-600 hover:bg-emerald-700" 
                            : "bg-zinc-800/50 border-zinc-600"
                        )}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar
                      </Button>
                      <Button
                        type="button"
                        variant={transactionType === 'remove' ? 'default' : 'outline'}
                        onClick={() => setTransactionType('remove')}
                        className={cn(
                          "flex-1",
                          transactionType === 'remove' 
                            ? "bg-red-600 hover:bg-red-700" 
                            : "bg-zinc-800/50 border-zinc-600"
                        )}
                      >
                        <Minus className="w-4 h-4 mr-2" />
                        Remover
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-zinc-400 text-sm font-medium mb-2 block">
                      Valor
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                      <Input
                        placeholder="0,00"
                        value={transactionAmount}
                        onChange={handleAmountChange}
                        className="pl-10 bg-zinc-800/50 border-zinc-600"
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
                      className="bg-zinc-800/50 border-zinc-600"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setAdminModalOpen(false)}
                    className="bg-transparent border-zinc-600"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleAdminTransaction}
                    disabled={processing}
                    className={cn(
                      transactionType === 'add' 
                        ? "bg-emerald-600 hover:bg-emerald-700" 
                        : "bg-red-600 hover:bg-red-700"
                    )}
                  >
                    {processing ? 'Processando...' : transactionType === 'add' ? 'Adicionar Saldo' : 'Remover Saldo'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {team ? (
          <div className="space-y-8">
            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Saldo Atual */}
              <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/30 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-400 text-sm">Saldo Atual</p>
                    <p className="text-3xl font-bold text-white mt-2">
                      {formatBalance(team.balance)}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-500/20 rounded-full">
                    <DollarSign className="w-8 h-8 text-purple-400" />
                  </div>
                </div>
              </Card>

              {/* Entradas */}
              <Card className="bg-gradient-to-br from-emerald-600/20 to-green-600/20 border-emerald-500/30 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-400 text-sm">Total de Entradas</p>
                    <p className="text-3xl font-bold text-white mt-2">
                      {formatBalance(totalCredits)}
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-500/20 rounded-full">
                    <TrendingUp className="w-8 h-8 text-emerald-400" />
                  </div>
                </div>
              </Card>

              {/* Saídas */}
              <Card className="bg-gradient-to-br from-red-600/20 to-orange-600/20 border-red-500/30 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-400 text-sm">Total de Saídas</p>
                    <p className="text-3xl font-bold text-white mt-2">
                      {formatBalance(totalDebits)}
                    </p>
                  </div>
                  <div className="p-3 bg-red-500/20 rounded-full">
                    <TrendingDown className="w-8 h-8 text-red-400" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Histórico de Transações */}
            <Card className="bg-white/5 border-white/10 p-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Histórico de Transações</h2>
                  <p className="text-zinc-400">Todas as movimentações do seu clube</p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    onClick={() => setFilter('all')}
                    className={cn(
                      "text-sm",
                      filter === 'all' ? "bg-purple-600" : "bg-zinc-800/50 border-zinc-600"
                    )}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Todas
                  </Button>
                  <Button
                    variant={filter === 'credit' ? 'default' : 'outline'}
                    onClick={() => setFilter('credit')}
                    className={cn(
                      "text-sm",
                      filter === 'credit' ? "bg-emerald-600" : "bg-zinc-800/50 border-zinc-600"
                    )}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Entradas
                  </Button>
                  <Button
                    variant={filter === 'debit' ? 'default' : 'outline'}
                    onClick={() => setFilter('debit')}
                    className={cn(
                      "text-sm",
                      filter === 'debit' ? "bg-red-600" : "bg-zinc-800/50 border-zinc-600"
                    )}
                  >
                    <TrendingDown className="w-4 h-4 mr-2" />
                    Saídas
                  </Button>
                </div>
              </div>

              {filteredTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                  <p className="text-zinc-400 text-lg">Nenhuma transação encontrada</p>
                  <p className="text-zinc-500">Suas movimentações aparecerão aqui</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/50 hover:border-zinc-600 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-3 rounded-full",
                          transaction.type === 'credit' 
                            ? "bg-emerald-500/20" 
                            : "bg-red-500/20"
                        )}>
                          {transaction.type === 'credit' ? (
                            <ArrowUpRight className="w-6 h-6 text-emerald-400" />
                          ) : (
                            <ArrowDownLeft className="w-6 h-6 text-red-400" />
                          )}
                        </div>

                        <div>
                          <p className="font-semibold text-white">
                            {transaction.description}
                          </p>
                          <div className="flex items-center gap-4 mt-1 text-sm text-zinc-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(transaction.created_at)}
                            </div>
                            {transaction.player_name && (
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {transaction.player_name}
                              </div>
                            )}
                            {transaction.related_team && (
                              <div className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {transaction.related_team}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className={cn(
                          "text-xl font-bold",
                          transaction.type === 'credit' ? "text-emerald-400" : "text-red-400"
                        )}>
                          {transaction.type === 'credit' ? '+' : '-'} {formatBalance(transaction.amount)}
                        </p>
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "mt-1",
                            transaction.type === 'credit' ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                          )}
                        >
                          {transaction.type === 'credit' ? 'Entrada' : 'Saída'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        ) : (
          <Card className="p-16 text-center bg-white/5 border-white/10">
            <Building2 className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Nenhum clube associado</h3>
            <p className="text-zinc-400">
              Você precisa estar associado a um clube para visualizar o saldo.
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}