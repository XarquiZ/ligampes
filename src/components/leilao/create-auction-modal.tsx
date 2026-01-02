'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useOrganization } from '@/contexts/OrganizationContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Calendar, DollarSign, Clock, User } from 'lucide-react'
import { toast } from 'sonner'

interface Player {
  id: string
  name: string
  position: string
  overall: number
  photo_url: string | null
}

interface CreateAuctionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateAuctionModal({ open, onOpenChange, onSuccess }: CreateAuctionModalProps) {
  const { organization } = useOrganization()
  const [selectedPlayer, setSelectedPlayer] = useState('')
  const [startPrice, setStartPrice] = useState('')
  const [auctionDuration, setAuctionDuration] = useState('5')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [freePlayers, setFreePlayers] = useState<Player[]>([])
  const [creating, setCreating] = useState(false)

  // Durações disponíveis (em minutos)
  const durationOptions = [
    { value: '5', label: '5 minutos' },
    { value: '10', label: '10 minutos' },
    { value: '15', label: '15 minutos' },
    { value: '30', label: '30 minutos' },
    { value: '60', label: '60 minutos' },
    { value: '120', label: '2 horas' },
    { value: '360', label: '6 horas' },
    { value: '720', label: '12 horas' },
    { value: '1440', label: '24 horas' }
  ]

  useEffect(() => {
    if (open) {
      loadFreePlayers()
      resetForm()
    }
  }, [open])

  const loadFreePlayers = async () => {
    try {
      const { data: playersData } = await supabase
        .from('players')
        .select('*')
        .is('team_id', null)
        .eq('organization_id', organization?.id)
        .order('overall', { ascending: false })

      const { data: activeAuctionsData } = await supabase
        .from('auctions')
        .select('player_id')
        .in('status', ['active', 'pending'])

      const auctionPlayerIds = activeAuctionsData?.map(a => a.player_id) || []
      const availablePlayers = (playersData || []).filter(
        player => !auctionPlayerIds.includes(player.id)
      )

      setFreePlayers(availablePlayers)
    } catch (error) {
      console.error('❌ Erro ao carregar jogadores:', error)
    }
  }

  const resetForm = () => {
    setSelectedPlayer('')
    setStartPrice('')
    setAuctionDuration('5')
    setStartDate('')
    setStartTime('')
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

  const handleStartPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartPrice(formatCurrency(e.target.value))
  }

  const generateTimeOptions = () => {
    const times = []
    for (let hour = 0; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        times.push(timeString)
      }
    }
    return times
  }

  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const handleCreateAuction = async () => {
    if (!selectedPlayer || !startPrice || !startDate || !startTime) {
      toast.error('Preencha todos os campos')
      return
    }

    const price = parseFloat(startPrice.replace(/\./g, '').replace(',', '.'))
    if (isNaN(price) || price <= 0) {
      toast.error('Valor inicial inválido')
      return
    }

    setCreating(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const [year, month, day] = startDate.split('-')
      const [hours, minutes] = startTime.split(':')

      const startDateTime = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes)
      )

      if (startDateTime <= new Date()) {
        toast.error('A data e hora de início devem ser futuras')
        setCreating(false)
        return
      }

      const durationMinutes = parseInt(auctionDuration)
      const endTime = new Date(startDateTime.getTime() + durationMinutes * 60000)

      const { error } = await supabase
        .from('auctions')
        .insert([{
          player_id: selectedPlayer,
          start_price: price,
          current_bid: price,
          status: 'pending',
          start_time: startDateTime.toISOString(),
          end_time: endTime.toISOString(),
          created_by: user.id,
          auction_duration: durationMinutes,
          organization_id: organization?.id
        }])

      if (error) throw error

      toast.success('Leilão agendado com sucesso!')
      onOpenChange(false)
      resetForm()

      if (onSuccess) onSuccess()

    } catch (error: any) {
      console.error('❌ Erro ao criar leilão:', error)
      toast.error(`Erro: ${error.message}`)
    } finally {
      setCreating(false)
    }
  }

  const timeOptions = generateTimeOptions()

  // Função para formatar a duração para exibição amigável
  const formatDurationLabel = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutos`
    } else if (minutes === 60) {
      return '1 hora'
    } else if (minutes < 1440) {
      const hours = minutes / 60
      return `${hours} horas`
    } else {
      const days = minutes / 1440
      return `${days} dia`
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Criar Novo Leilão
          </DialogTitle>
          <p className="text-zinc-400 text-sm">
            Agende um novo leilão para jogadores livres
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-zinc-400 text-sm font-medium mb-2 block">
              Jogador
            </label>
            <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
              <SelectTrigger className="bg-zinc-800/50 border-zinc-600">
                <SelectValue placeholder="Selecione um jogador" />
              </SelectTrigger>
              <SelectContent>
                {freePlayers.map(player => (
                  <SelectItem key={player.id} value={player.id}>
                    <div className="flex items-center gap-3">
                      {player.photo_url ? (
                        <img
                          src={player.photo_url}
                          alt={player.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
                          <User className="w-4 h-4 text-zinc-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{player.name}</p>
                        <p className="text-xs text-zinc-400">
                          {player.position} • OVR {player.overall}
                        </p>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-zinc-400 text-sm font-medium mb-2 block">
              Data de Início
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={getMinDate()}
                className="pl-10 bg-zinc-800/50 border-zinc-600"
              />
            </div>
          </div>

          <div>
            <label className="text-zinc-400 text-sm font-medium mb-2 block">
              Horário de Início
            </label>
            <Select value={startTime} onValueChange={setStartTime}>
              <SelectTrigger className="bg-zinc-800/50 border-zinc-600">
                <SelectValue placeholder="Selecione o horário" />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map(time => (
                  <SelectItem key={time} value={time}>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {time}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-zinc-400 text-sm font-medium mb-2 block">
              Duração do Leilão
            </label>
            <Select value={auctionDuration} onValueChange={setAuctionDuration}>
              <SelectTrigger className="bg-zinc-800/50 border-zinc-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {durationOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {formatDurationLabel(parseInt(option.value))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-zinc-400 text-sm font-medium mb-2 block">
              Preço Inicial (R$)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
              <Input
                placeholder="0,00"
                value={startPrice}
                onChange={handleStartPriceChange}
                className="pl-10 bg-zinc-800/50 border-zinc-600"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-transparent border-zinc-600"
            disabled={creating}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreateAuction}
            disabled={creating}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {creating ? 'Criando...' : 'Criar Leilão'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}