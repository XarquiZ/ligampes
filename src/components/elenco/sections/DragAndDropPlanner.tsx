// components/elenco/sections/DragAndDropPlanner.tsx
import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Trash2, Save, Users, Target, X, Move, Edit2, GripVertical, Eye, AlertTriangle, Settings2, BarChart2, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PlannerSectionProps, Player, POSITION_MAP, POSITIONS } from '../types'
import { PlayerSelectionModal } from '../modals/PlayerSelectionModal'
import { PositionSelectionModal } from '../modals/PositionSelectionModal'
import { supabase } from '@/lib/supabase'

interface FieldSlot {
  id: string
  position: string
  x: number
  y: number
  player: Player | null
  isOccupied: boolean
}

interface DraggingState {
  isDragging: boolean
  slotId: string | null
  startX: number
  startY: number
  currentX: number
  currentY: number
}

interface HoverState {
  isHovering: boolean
  slotId: string | null
  showOptions: boolean
}

interface SaveFormationDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string) => void
  loading: boolean
}

interface LoadFormationDialogProps {
  isOpen: boolean
  onClose: () => void
  formations: any[]
  onLoadFormation: (formation: any) => void
  onDeleteFormation: (id: string) => void
}

interface RemoveConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  playerName: string
  playerPosition: string
}

const RemoveConfirmationModal: React.FC<RemoveConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  playerName,
  playerPosition
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-700">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <DialogTitle className="text-white">Remover Jogador</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Tem certeza que deseja remover este jogador do esquema?
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center">
                <span className="text-lg font-bold text-white">{playerPosition}</span>
              </div>
              <div>
                <h4 className="font-bold text-white">{playerName}</h4>
                <p className="text-sm text-zinc-400">Posição: {playerPosition}</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-sm text-yellow-400">
                ⚠️ O jogador será movido para o banco de reservas se houver espaço disponível.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-zinc-600 text-black hover:text-white hover:bg-zinc-800 flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className="bg-red-600 hover:bg-red-700 flex-1"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Sim, Remover
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const SaveFormationDialog: React.FC<SaveFormationDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  loading
}) => {
  const [name, setName] = useState('')

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert('Por favor, digite um nome para a formação')
      return
    }

    await onSave(name.trim())
    setName('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-700">
        <DialogHeader>
          <DialogTitle className="text-white">Salvar Formação</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Digite um nome para salvar sua formação
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Minha Formação 4-3-3"
            className="bg-zinc-800 border-zinc-600 text-white"
            onKeyDown={(e) => e.key === 'Enter' && !loading && handleSubmit()}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-zinc-600 text-zinc-300"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !name.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const LoadFormationDialog: React.FC<LoadFormationDialogProps> = ({
  isOpen,
  onClose,
  formations,
  onLoadFormation,
  onDeleteFormation
}) => {
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta formação?')) {
      setIsDeleting(id)
      try {
        await onDeleteFormation(id)
      } finally {
        setIsDeleting(null)
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-700 max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Minhas Formações</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Selecione uma formação para carregar ou excluir
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {formations.length === 0 ? (
            <div className="text-center py-8">
              <Eye className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400">Nenhuma formação salva ainda</p>
              <p className="text-zinc-500 text-sm mt-2">
                Crie uma formação e salve para vê-la aqui
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {formations.map((formation) => {
                const formationData = formation.formation_data || formation
                const stats = formationData.stats

                return (
                  <div
                    key={formation.id || formation.name}
                    className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 hover:bg-zinc-800 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-bold text-white text-lg mb-1">
                          {formation.name || 'Formação sem nome'}
                        </h3>
                        <p className="text-zinc-400 text-sm mb-2">
                          Criada em: {new Date(formation.created_at || Date.now()).toLocaleDateString('pt-BR')}
                        </p>
                        {stats && (
                          <div className="flex flex-wrap gap-3 mb-3">
                            <div className="flex items-center gap-1">
                              <span className="text-zinc-500 text-xs">Overall:</span>
                              <span className="text-yellow-400 font-bold">{stats.avgOverall || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-zinc-500 text-xs">Titulares:</span>
                              <span className="text-white font-bold">{stats.fieldPlayerCount || 0}/11</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-zinc-500 text-xs">Valor:</span>
                              <span className="text-emerald-400 font-bold">
                                R$ {(stats.totalValue || 0).toLocaleString('pt-BR')}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          onClick={() => {
                            onLoadFormation(formation)
                            onClose()
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-sm"
                        >
                          Carregar
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleDelete(formation.id)}
                          disabled={isDeleting === formation.id}
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10 text-sm"
                        >
                          {isDeleting === formation.id ? 'Excluindo...' : 'Excluir'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex justify-end mt-6">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-zinc-600 hover:bg-zinc-800"
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const MoveButton = ({ onStartDrag }: { onStartDrag: (e: React.TouchEvent | React.MouseEvent) => void }) => (
  <button
    onTouchStart={(e) => {
      e.preventDefault()
      e.stopPropagation()
      onStartDrag(e)
    }}
    onMouseDown={(e) => {
      e.preventDefault()
      e.stopPropagation()
      onStartDrag(e)
    }}
    className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/50 flex items-center justify-center hover:bg-orange-500/30 transition-colors group/btn cursor-grab active:cursor-grabbing"
    title="Arrastar jogador"
  >
    <Move className="w-3 h-3 text-orange-400 group-hover/btn:text-orange-300" />
  </button>
)

export const DragAndDropPlanner: React.FC<PlannerSectionProps> = ({ teamPlayers, allPlayers }) => {
  const [fieldSlots, setFieldSlots] = useState<FieldSlot[]>([])
  const [reserveSlots, setReserveSlots] = useState<FieldSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<FieldSlot | null>(null)
  const [showPlayerModal, setShowPlayerModal] = useState(false)
  const [showPositionModal, setShowPositionModal] = useState(false)
  const [showRemoveConfirmation, setShowRemoveConfirmation] = useState(false)
  const [slotToRemove, setSlotToRemove] = useState<string | null>(null)
  const [savedFormations, setSavedFormations] = useState<any[]>([])
  const [isControlsOpen, setIsControlsOpen] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [selectedPlayers, setSelectedPlayers] = useState<Set<number>>(new Set())
  const [userId, setUserId] = useState<string | null>(null)
  const [userTeamId, setUserTeamId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingFormation, setSavingFormation] = useState(false)
  const [windowWidth, setWindowWidth] = useState(1200) // Default to desktop
  const isMobile = windowWidth < 768
  const isTablet = windowWidth >= 768 && windowWidth < 1024

  const [dragging, setDragging] = useState<DraggingState>({
    isDragging: false,
    slotId: null,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0
  })

  const [hovering, setHovering] = useState<HoverState>({
    isHovering: false,
    slotId: null,
    showOptions: false
  })

  const fieldRef = useRef<HTMLDivElement>(null)
  const optionsContainerRef = useRef<HTMLDivElement>(null)
  const dragTimeoutRef = useRef<NodeJS.Timeout>()
  const hoverTimeoutRef = useRef<NodeJS.Timeout>()
  const hasDraggedRef = useRef(false) // New ref to track if a drag occurred

  // Detect Window Size
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }

    // Set initial size
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Cores das posições conforme especificado
  const getPositionColor = (position: string) => {
    if (position === 'GO') return 'bg-yellow-500 border-yellow-400'
    if (['LE', 'ZC', 'LD'].includes(position)) return 'bg-blue-500 border-blue-400'
    if (['VOL', 'MLG', 'MLE', 'MLD', 'MAT'].includes(position)) return 'bg-green-500 border-green-400'
    if (['PTE', 'PTD', 'SA', 'CA'].includes(position)) return 'bg-red-500 border-red-400'
    return 'bg-gray-500 border-gray-400'
  }

  // Atualizar jogadores selecionados quando os slots mudam
  useEffect(() => {
    const allSlots = [...fieldSlots, ...reserveSlots]
    const newSelectedPlayers = new Set<number>()

    allSlots.forEach(slot => {
      if (slot.player?.id) {
        newSelectedPlayers.add(slot.player.id)
      }
    })

    setSelectedPlayers(newSelectedPlayers)
  }, [fieldSlots, reserveSlots])

  // Obter usuário atual e seu team_id do perfil
  useEffect(() => {
    const loadUserAndTeam = async () => {
      try {
        setLoading(true)

        // Obter usuário atual
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError) {
          console.error('Erro ao obter usuário:', userError)
          setLoading(false)
          return
        }

        if (!user) {
          console.log('Usuário não autenticado')
          setUserId(null)
          setUserTeamId(null)
          setLoading(false)
          return
        }

        console.log('Usuário ID:', user.id)
        setUserId(user.id)

        // Buscar o perfil do usuário para obter o team_id
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('team_id')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Erro ao buscar perfil:', profileError)
          // Tentar buscar de outra maneira
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('team_id')
            .eq('id', user.id)
            .maybeSingle()

          if (!profilesError && profiles) {
            console.log('Team ID encontrado no perfil:', profiles.team_id)
            setUserTeamId(profiles.team_id)
          } else {
            console.warn('Usuário não tem perfil ou team_id não encontrado')
          }
        } else if (profile && profile.team_id) {
          console.log('Team ID encontrado no perfil:', profile.team_id)
          setUserTeamId(profile.team_id)
        } else {
          console.warn('Perfil encontrado mas sem team_id')
        }

        setLoading(false)

      } catch (error) {
        console.error('Erro ao carregar usuário/time:', error)
        setLoading(false)
      }
    }

    loadUserAndTeam()
  }, [])

  // Carregar formações apenas quando o usuário clicar em "Minhas Formações"
  const loadSavedFormations = async () => {
    try {
      console.log('Carregando formações... userId:', userId, 'userTeamId:', userTeamId)

      if (!userTeamId) {
        console.warn('Usuário não tem team_id associado')
        alert('Você precisa ter um time associado ao seu perfil para salvar formações.')
        return
      }

      // Buscar formações APENAS do team_id do usuário
      const { data: formations, error: formationsError } = await supabase
        .from('formations')
        .select('*')
        .eq('team_id', userTeamId)
        .order('created_at', { ascending: false })

      if (formationsError) {
        console.error('Erro ao carregar formações:', formationsError)
        alert('Erro ao carregar formações. Tente novamente.')
        return
      }

      if (formations && formations.length > 0) {
        console.log(`Formações carregadas: ${formations.length}`)
        setSavedFormations(formations)
      } else {
        console.log('Nenhuma formação encontrada para este time')
        setSavedFormations([])
      }

    } catch (error) {
      console.error('Erro ao carregar formações salvas:', error)
      alert('Erro ao carregar formações.')
    }
  }

  // Função para carregar formações quando o usuário clicar no botão
  const handleLoadFormationsClick = async () => {
    setShowLoadDialog(true)
    if (savedFormations.length === 0) {
      // Só carrega as formações quando o usuário clica no botão
      await loadSavedFormations()
    }
  }

  // Verificar se o mouse está sobre as opções
  const isMouseOverOptions = (e: MouseEvent): boolean => {
    if (!optionsContainerRef.current) return false
    const rect = optionsContainerRef.current.getBoundingClientRect()
    return (
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom
    )
  }

  // Inicializar slots vazios com posições ajustadas para campo comprido
  useEffect(() => {
    // Criar slots iniciais no campo - posições ajustadas para campo comprido
    const initialFieldSlots: FieldSlot[] = Array.from({ length: 11 }, (_, i) => {
      let position = ''
      let x = 50
      let y = 50

      // Distribuição inicial das posições para campo comprido (mais longo que largo)
      switch (i) {
        case 0: position = 'GO'; x = 50; y = 88; break; // Goleiro mais atrás
        case 1: position = 'LE'; x = 20; y = 70; break;  // Lateral direito
        case 2: position = 'ZC'; x = 35; y = 70; break;  // Zagueiro central
        case 3: position = 'ZC'; x = 65; y = 70; break;  // Zagueiro central
        case 4: position = 'LD'; x = 80; y = 70; break;  // Lateral esquerdo
        case 5: position = 'VOL'; x = 25; y = 50; break; // Volante
        case 6: position = 'MLG'; x = 50; y = 45; break; // Meia central
        case 7: position = 'MLG'; x = 75; y = 50; break; // Meia central
        case 8: position = 'PTE'; x = 20; y = 20; break; // Ponta direita
        case 9: position = 'CA'; x = 50; y = 15; break;  // Centroavante
        case 10: position = 'PTD'; x = 80; y = 20; break; // Ponta esquerda
      }

      return {
        id: `field-${i + 1}`,
        position,
        x,
        y,
        player: null,
        isOccupied: false
      }
    })

    // Criar 11 slots no banco de reservas (sem posição específica)
    const initialReserveSlots: FieldSlot[] = Array.from({ length: 11 }, (_, i) => ({
      id: `reserve-${i + 1}`,
      position: '',
      x: 0,
      y: 0,
      player: null,
      isOccupied: false
    }))

    setFieldSlots(initialFieldSlots)
    setReserveSlots(initialReserveSlots)

    return () => {
      if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current)
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    }
  }, [])

  // Event listeners para arrastar (Mouse e Touch)
  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (isMouseOverOptions({ clientX, clientY } as any) && dragging.isDragging && !isMobile) {
        // Lógica desktop para cancelar se passar por cima do menu (se necessário)
      }

      if (!dragging.isDragging || !dragging.slotId || !fieldRef.current) return

      const fieldRect = fieldRef.current.getBoundingClientRect()
      const x = ((clientX - fieldRect.left) / fieldRect.width) * 100
      const y = ((clientY - fieldRect.top) / fieldRect.height) * 100

      // Atualizar posição do slot em tempo real
      setFieldSlots(prev => prev.map(slot =>
        slot.id === dragging.slotId
          ? { ...slot, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }
          : slot
      ))

      // Mark as dragged
      hasDraggedRef.current = true
    }

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY)
    }

    const handleTouchMove = (e: TouchEvent) => {
      // Prevent scrolling while dragging
      if (e.cancelable) e.preventDefault();
      const touch = e.touches[0]
      handleMove(touch.clientX, touch.clientY)
    }

    const handleEnd = () => {
      if (dragging.isDragging) {
        setDragging({ isDragging: false, slotId: null, startX: 0, startY: 0, currentX: 0, currentY: 0 })
      }
    }

    if (dragging.isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleEnd)
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleEnd)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleEnd)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleEnd)
    }
  }, [dragging.isDragging, dragging.slotId, isMobile])

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent, slotId: string, isMoveButton: boolean = false) => {
    // Only proceed if it is a move button action OR we are on desktop
    // On mobile, tap on player icon is handled by onClick solely to open menu
    if (isMobile && !isMoveButton) return;

    // Prevent default selectively
    if (e.cancelable && e.type !== 'click') e.preventDefault()
    e.stopPropagation()

    // Get coordinates
    // Reset drag tracking
    hasDraggedRef.current = false

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY

    setDragging({
      isDragging: true,
      slotId,
      startX: clientX,
      startY: clientY,
      currentX: clientX,
      currentY: clientY
    })

    // Esconder opções de hover quando começa a arrastar
    setHovering({ isHovering: false, slotId: null, showOptions: false })
  }

  const handleSlotClick = (e: React.MouseEvent, slotId: string) => {
    e.preventDefault()
    e.stopPropagation()

    // Se estava arrastando, ignorar
    // If drag was active or just finished, do not process as click
    if (dragging.isDragging || hasDraggedRef.current) return;

    const slot = fieldSlots.find(s => s.id === slotId)

    // Se é mobile e tem jogador, toggle menu
    if (isMobile && slot?.player) {
      if (hovering.slotId === slotId && hovering.showOptions) {
        setHovering({ isHovering: false, slotId: null, showOptions: false })
      } else {
        setHovering({ isHovering: true, slotId, showOptions: true })
      }
      return
    }

    // Comportamento normal (Desktop ou Mobile sem jogador)
    if (slot?.player) {
      setSelectedSlot(slot)
      setShowPositionModal(true)
    } else if (slot) {
      // Slot vazio
      setSelectedSlot(slot)
      setShowPlayerModal(true)
    }
  }

  const handleMouseEnter = (slotId: string, e?: React.MouseEvent) => {
    const slot = fieldSlots.find(s => s.id === slotId)
    if (slot?.player) {
      // Verificar se já está mostrando opções para este slot
      if (hovering.slotId === slotId && hovering.showOptions) return

      hoverTimeoutRef.current = setTimeout(() => {
        setHovering({ isHovering: true, slotId, showOptions: true })
      }, 150) // 150ms de delay para mostrar opções
    }
  }

  const handleMouseLeave = (e?: React.MouseEvent) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }

    // Pequeno delay para permitir mover o mouse para as opções
    setTimeout(() => {
      setHovering({ isHovering: false, slotId: null, showOptions: false })
    }, 50)
  }

  const handleSelectPlayer = (player: Player | null) => {
    if (selectedSlot) {
      // Verificar se o jogador já foi selecionado
      if (player && selectedPlayers.has(player.id)) {
        alert('Este jogador já foi selecionado! Escolha outro jogador.')
        return
      }

      if (selectedSlot.id.includes('reserve')) {
        // Atualizar slot de reserva
        const updatedReserveSlots = reserveSlots.map(slot =>
          slot.id === selectedSlot.id
            ? { ...slot, player, isOccupied: !!player }
            : slot
        )
        setReserveSlots(updatedReserveSlots)
      } else {
        // Atualizar slot do campo
        const updatedFieldSlots = fieldSlots.map(slot =>
          slot.id === selectedSlot.id
            ? { ...slot, player, isOccupied: !!player }
            : slot
        )
        setFieldSlots(updatedFieldSlots)
      }
    }
    setShowPlayerModal(false)
    setSelectedSlot(null)
  }

  const handleSelectPosition = (position: string) => {
    if (selectedSlot) {
      const updatedSlots = fieldSlots.map(slot =>
        slot.id === selectedSlot.id
          ? { ...slot, position }
          : slot
      )
      setFieldSlots(updatedSlots)
    }
    setShowPositionModal(false)
    setSelectedSlot(null)
  }

  // Funções de arrasto entre campo e banco
  const handleDragStart = (e: React.DragEvent, slotId: string, isReserve: boolean = false) => {
    e.dataTransfer.setData('slotId', slotId)
    e.dataTransfer.setData('isReserve', isReserve.toString())
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDropOnField = (e: React.DragEvent, targetSlotId: string) => {
    e.preventDefault()

    const sourceSlotId = e.dataTransfer.getData('slotId')
    const isReserve = e.dataTransfer.getData('isReserve') === 'true'

    if (isReserve) {
      // Arrastando do banco de reservas para o campo
      const sourceReserveSlot = reserveSlots.find(s => s.id === sourceSlotId)
      if (sourceReserveSlot?.player) {
        const updatedReserveSlots = reserveSlots.map(slot =>
          slot.id === sourceSlotId ? { ...slot, player: null, isOccupied: false } : slot
        )

        const updatedFieldSlots = fieldSlots.map(slot =>
          slot.id === targetSlotId
            ? { ...slot, player: sourceReserveSlot.player, isOccupied: true }
            : slot
        )

        setReserveSlots(updatedReserveSlots)
        setFieldSlots(updatedFieldSlots)
      }
    } else {
      // Arrastando dentro do campo
      const sourceFieldSlot = fieldSlots.find(s => s.id === sourceSlotId)
      const targetFieldSlot = fieldSlots.find(s => s.id === targetSlotId)

      if (sourceFieldSlot && targetFieldSlot) {
        const updatedFieldSlots = fieldSlots.map(slot => {
          if (slot.id === sourceSlotId) {
            return { ...slot, player: targetFieldSlot.player, isOccupied: !!targetFieldSlot.player }
          }
          if (slot.id === targetSlotId) {
            return { ...slot, player: sourceFieldSlot.player, isOccupied: !!sourceFieldSlot.player }
          }
          return slot
        })

        setFieldSlots(updatedFieldSlots)
      }
    }
  }

  const handleDropOnReserve = (e: React.DragEvent, targetReserveId: string) => {
    e.preventDefault()

    const sourceSlotId = e.dataTransfer.getData('slotId')
    const isReserve = e.dataTransfer.getData('isReserve') === 'true'

    if (!isReserve) {
      // Arrastando do campo para o banco
      const sourceFieldSlot = fieldSlots.find(s => s.id === sourceSlotId)
      if (sourceFieldSlot?.player) {
        const updatedFieldSlots = fieldSlots.map(slot =>
          slot.id === sourceSlotId ? { ...slot, player: null, isOccupied: false } : slot
        )

        const targetReserveSlot = reserveSlots.find(s => s.id === targetReserveId)
        if (targetReserveSlot) {
          const updatedReserveSlots = reserveSlots.map(slot =>
            slot.id === targetReserveId
              ? { ...slot, player: sourceFieldSlot.player, isOccupied: true }
              : slot
          )

          setFieldSlots(updatedFieldSlots)
          setReserveSlots(updatedReserveSlots)
        }
      }
    } else {
      // Arrastando dentro do banco
      const sourceReserveSlot = reserveSlots.find(s => s.id === sourceSlotId)
      const targetReserveSlot = reserveSlots.find(s => s.id === targetReserveId)

      if (sourceReserveSlot && targetReserveSlot) {
        const updatedReserveSlots = reserveSlots.map(slot => {
          if (slot.id === sourceSlotId) {
            return { ...slot, player: targetReserveSlot.player, isOccupied: !!targetReserveSlot.player }
          }
          if (slot.id === targetReserveId) {
            return { ...slot, player: sourceReserveSlot.player, isOccupied: !!sourceReserveSlot.player }
          }
          return slot
        })

        setReserveSlots(updatedReserveSlots)
      }
    }
  }

  // Função para remover jogador com confirmação - ATUALIZADA
  const handleRemovePlayerWithConfirmation = (slotId: string, e?: React.MouseEvent) => {
    // Prevenir comportamento padrão e propagação
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    // Cancelar qualquer timeout de arrasto pendente
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current)
    }

    // Resetar estado de arrasto imediatamente
    setDragging({ isDragging: false, slotId: null, startX: 0, startY: 0, currentX: 0, currentY: 0 })

    const slot = fieldSlots.find(s => s.id === slotId)
    if (slot?.player) {
      setSlotToRemove(slotId)
      setShowRemoveConfirmation(true)
    }

    // Fechar opções de hover
    setHovering({ isHovering: false, slotId: null, showOptions: false })
  }

  // Função para confirmar remoção
  const confirmRemovePlayer = () => {
    if (slotToRemove) {
      const slot = fieldSlots.find(s => s.id === slotToRemove)
      if (slot?.player) {
        // Tentar mover para o banco de reservas se houver espaço
        const emptyReserveSlot = reserveSlots.find(s => !s.player)

        if (emptyReserveSlot) {
          // Move para o banco
          const updatedFieldSlots = fieldSlots.map(s =>
            s.id === slotToRemove ? { ...s, player: null, isOccupied: false } : s
          )

          const updatedReserveSlots = reserveSlots.map(s =>
            s.id === emptyReserveSlot.id ? { ...s, player: slot.player, isOccupied: true } : s
          )

          setFieldSlots(updatedFieldSlots)
          setReserveSlots(updatedReserveSlots)
        } else {
          // Remove completamente
          const updatedFieldSlots = fieldSlots.map(s =>
            s.id === slotToRemove ? { ...s, player: null, isOccupied: false } : s
          )
          setFieldSlots(updatedFieldSlots)
        }
      }

      setSlotToRemove(null)
      setShowRemoveConfirmation(false)
    }
  }

  const handleClearReserveSlot = (slotId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updatedReserveSlots = reserveSlots.map(slot =>
      slot.id === slotId ? { ...slot, player: null, isOccupied: false } : slot
    )
    setReserveSlots(updatedReserveSlots)
  }

  const handleClearAll = () => {
    const clearedFieldSlots = fieldSlots.map(slot => ({ ...slot, player: null, isOccupied: false }))
    const clearedReserveSlots = reserveSlots.map(slot => ({ ...slot, player: null, isOccupied: false }))
    setFieldSlots(clearedFieldSlots)
    setReserveSlots(clearedReserveSlots)
  }

  const calculateFormationStats = () => {
    const players = [...fieldSlots, ...reserveSlots].filter(slot => slot.player)
    if (players.length === 0) return null

    const overalls = players.map(p => p.player!.overall)
    const ages = players.map(p => p.player!.age || 25)
    const values = players.map(p => p.player!.base_price || 0)

    const defensePlayers = fieldSlots.filter(slot =>
      slot.player && ['GO', 'LD', 'LE', 'ZC'].includes(slot.position)
    )
    const midfieldPlayers = fieldSlots.filter(slot =>
      slot.player && ['VOL', 'MLD', 'MLG', 'MLE', 'MAT'].includes(slot.position)
    )
    const attackPlayers = fieldSlots.filter(slot =>
      slot.player && ['SA', 'PTD', 'PTE', 'CA'].includes(slot.position)
    )

    return {
      avgOverall: Math.round(overalls.reduce((a, b) => a + b, 0) / players.length),
      avgAge: Math.round(ages.reduce((a, b) => a + b, 0) / players.length),
      totalValue: values.reduce((a, b) => a + b, 0),
      playerCount: players.length,
      fieldPlayerCount: fieldSlots.filter(s => s.player).length,
      defenseAvg: defensePlayers.length > 0
        ? Math.round(defensePlayers.reduce((sum, slot) => sum + slot.player!.overall, 0) / defensePlayers.length)
        : 0,
      midfieldAvg: midfieldPlayers.length > 0
        ? Math.round(midfieldPlayers.reduce((sum, slot) => sum + slot.player!.overall, 0) / midfieldPlayers.length)
        : 0,
      attackAvg: attackPlayers.length > 0
        ? Math.round(attackPlayers.reduce((sum, slot) => sum + slot.player!.overall, 0) / attackPlayers.length)
        : 0,
    }
  }

  const handleSaveFormationToServer = async (formationName: string) => {
    try {
      const stats = calculateFormationStats()
      if (!stats || stats.fieldPlayerCount < 11) {
        alert('Preencha todas as 11 posições do campo para salvar a formação!')
        return
      }

      if (!userTeamId) {
        alert('Você precisa ter um time associado ao seu perfil para salvar formações.')
        return
      }

      const formationData = {
        name: formationName,
        slots: fieldSlots.map(slot => ({
          id: slot.id,
          position: slot.position,
          x: slot.x,
          y: slot.y,
          player: slot.player ? {
            id: slot.player.id,
            name: slot.player.name,
            overall: slot.player.overall,
            position: slot.player.position,
            photo_url: slot.player.photo_url,
            club: slot.player.club
          } : null
        })),
        reserves: reserveSlots.filter(s => s.player).map(slot => ({
          id: slot.id,
          player: slot.player ? {
            id: slot.player.id,
            name: slot.player.name,
            overall: slot.player.overall,
            position: slot.player.position,
            photo_url: slot.player.photo_url,
            club: slot.player.club
          } : null
        })),
        stats: stats
      }

      setSavingFormation(true)

      // Salvar no Supabase usando o team_id do perfil do usuário
      const { data, error } = await supabase
        .from('formations')
        .insert([{
          team_id: userTeamId, // Usando o team_id do perfil do usuário
          name: formationName,
          formation_data: formationData
        }])
        .select()

      if (error) {
        console.error('Erro ao salvar no Supabase:', error)
        alert(`Erro ao salvar formação: ${error.message}`)
        return
      }

      // Atualizar lista local
      if (data && data[0]) {
        setSavedFormations(prev => [data[0], ...prev])
      }

      alert(`Formação "${formationName}" salva com sucesso!`)
      setShowSaveDialog(false)

    } catch (error) {
      console.error('Erro ao salvar formação:', error)
      alert('Erro ao salvar formação. Tente novamente.')
    } finally {
      setSavingFormation(false)
    }
  }

  const handleLoadFormation = (formationData: any) => {
    const clearedFieldSlots = fieldSlots.map(slot => ({ ...slot, player: null, isOccupied: false }))
    const clearedReserveSlots = reserveSlots.map(slot => ({ ...slot, player: null, isOccupied: false }))

    const savedFormation = formationData.formation_data || formationData
    const savedSlots = savedFormation.slots || []
    const savedReserves = savedFormation.reserves || []

    const updatedFieldSlots = clearedFieldSlots.map(slot => {
      const savedSlot = savedSlots.find((s: any) => s.id === slot.id)
      if (savedSlot) {
        let player = null
        if (savedSlot.player) {
          // Procurar o jogador pelo ID
          player = [...teamPlayers, ...allPlayers].find(p => p.id === savedSlot.player.id)
          // Se não encontrar pelo ID, criar um objeto básico
          if (!player && savedSlot.player.name) {
            player = {
              id: savedSlot.player.id,
              name: savedSlot.player.name,
              overall: savedSlot.player.overall || 70,
              position: savedSlot.player.position || '??',
              photo_url: savedSlot.player.photo_url,
              club: savedSlot.player.club,
              base_price: 0,
              age: 25,
              nationality: 'BR', // Default or placeholder
              logo_url: '/placeholder.png', // Default
              preferred_foot: 'R', // Default
              team_id: userTeamId || '',
              skills: []
            }
          }
        }
        return {
          ...slot,
          position: savedSlot.position || slot.position,
          x: savedSlot.x || slot.x,
          y: savedSlot.y || slot.y,
          player: player || null,
          isOccupied: !!player
        }
      }
      return slot
    })

    const updatedReserveSlots = clearedReserveSlots.map((slot, index) => {
      const savedReserve = savedReserves[index]
      if (savedReserve && savedReserve.player) {
        let player = [...teamPlayers, ...allPlayers].find(p => p.id === savedReserve.player.id)
        // Se não encontrar pelo ID, criar um objeto básico
        if (!player && savedReserve.player.name) {
          player = {
            id: savedReserve.player.id,
            name: savedReserve.player.name,
            overall: savedReserve.player.overall || 70,
            position: savedReserve.player.position || '??',
            photo_url: savedReserve.player.photo_url,
            club: savedReserve.player.club,
            base_price: 0,
            age: 25,
            nationality: 'BR',
            logo_url: '/placeholder.png',
            preferred_foot: 'R',
            team_id: userTeamId || '',
            skills: []
          }
        }
        return { ...slot, player: player || null, isOccupied: !!player }
      }
      return slot
    })

    setFieldSlots(updatedFieldSlots)
    setReserveSlots(updatedReserveSlots)
    setShowLoadDialog(false)
  }

  const handleDeleteFormation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('formations')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erro ao deletar do Supabase:', error)
        alert('Erro ao excluir formação. Tente novamente.')
        return
      }

      // Atualizar lista local
      setSavedFormations(prev => prev.filter(f => f.id !== id))

    } catch (error) {
      console.error('Erro ao deletar formação:', error)
      alert('Erro ao excluir formação.')
    }
  }

  const stats = calculateFormationStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-zinc-400">Carregando planejador...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-zinc-900/50 rounded-xl border border-zinc-700 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Planejador de Formação Personalizada</h3>
            <p className="text-sm text-zinc-400">
              • Segure e arraste para mover • Hover para ver opções • Click no jogador para editar posição
            </p>
          </div>
          <div className="flex-1 w-full sm:w-auto">
            {/* Mobile Controls Dropdown (< 640px) */}
            <div className="sm:hidden relative w-full">
              <Button
                variant="outline"
                onClick={() => setIsControlsOpen(!isControlsOpen)}
                className="w-full justify-between bg-zinc-800/50 border-zinc-700 text-zinc-300"
              >
                <span className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4" />
                  Opções de Formação
                </span>
                <ChevronDown className={cn("w-4 h-4 transition-transform", isControlsOpen && "rotate-180")} />
              </Button>

              {isControlsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsControlsOpen(false)} />
                  <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl overflow-hidden flex flex-col">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        handleLoadFormationsClick()
                        setIsControlsOpen(false)
                      }}
                      disabled={!userTeamId}
                      className="justify-start rounded-none border-b border-zinc-800 p-4 h-auto"
                    >
                      <Eye className="w-4 h-4 mr-3 text-blue-400" />
                      <div className="flex flex-col items-start">
                        <span className="font-bold text-white">Minhas Formações</span>
                        <span className="text-xs text-zinc-400">Carregar formações salvas</span>
                      </div>
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowStats(!showStats)
                        setIsControlsOpen(false)
                      }}
                      className="justify-start rounded-none p-4 h-auto"
                    >
                      <BarChart2 className="w-4 h-4 mr-3 text-purple-400" />
                      <div className="flex flex-col items-start">
                        <span className="font-bold text-white">{showStats ? 'Ocultar' : 'Mostrar'} Estatísticas</span>
                        <span className="text-xs text-zinc-400">Ver análise do time</span>
                      </div>
                    </Button>
                  </div>
                </>
              )}
            </div>

            {/* Desktop Controls (>= 640px) */}
            <div className="hidden sm:flex gap-2">
              <Button
                variant="outline"
                onClick={handleLoadFormationsClick}
                className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                disabled={!userTeamId}
              >
                <Eye className="w-4 h-4 mr-2" />
                Minhas Formações
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowStats(!showStats)}
                className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
              >
                {showStats ? 'Ocultar' : 'Mostrar'} Estatísticas
              </Button>
            </div>
          </div>
        </div>
        {!userTeamId && (
          <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-400 text-sm">
              ⚠️ Você precisa ter um time associado ao seu perfil para salvar formações.
            </p>
          </div>
        )}
      </div>

      {/* Campo de Futebol com resumo ao lado */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Campo de Futebol - CAMPO COMPRIDO */}
        <div className="lg:w-2/3 relative bg-gradient-to-b from-emerald-900/20 to-emerald-950/40 rounded-2xl border-2 border-emerald-800 p-8 sm:p-10">
          <div
            ref={fieldRef}
            className="relative w-full aspect-[2/3] sm:aspect-[4/4] bg-gradient-to-b from-emerald-900/30 to-emerald-950/60 border-2 border-emerald-700 rounded-xl overflow-visible md:overflow-hidden touch-none"
            onDragOver={handleDragOver}
          >
            {/* Gramado com padrão de campo */}
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-700/40 via-emerald-800/30 to-emerald-900/40"></div>

            {/* Linhas do campo - ajustadas para campo comprido */}
            <div className="absolute inset-6 border-2 border-white/20 rounded-lg"></div>

            {/* Linha do meio de campo */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/30 transform -translate-y-1/2"></div>

            {/* Círculo central */}
            <div className="absolute top-1/2 left-1/2 w-16 h-16 border-2 border-white/20 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white/50 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>

            {/* Área grande */}
            <div className="absolute top-4 left-6 right-6 h-32 border-2 border-white/20 rounded-t-lg"></div>
            <div className="absolute bottom-4 left-6 right-6 h-32 border-2 border-white/20 rounded-b-lg"></div>

            {/* Área pequena */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-64 h-24 border-2 border-white/20 rounded-t-lg"></div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-64 h-24 border-2 border-white/20 rounded-b-lg"></div>

            {/* Ponto do pênalti */}
            <div className="absolute top-32 left-1/2 w-3 h-3 bg-white/50 rounded-full transform -translate-x-1/2"></div>
            <div className="absolute bottom-32 left-1/2 w-3 h-3 bg-white/50 rounded-full transform -translate-x-1/2"></div>

            {/* Arco do gol (semicírculos) */}
            <div className="absolute top-4 left-1/2 w-40 h-20 border-2 border-white/20 border-b-0 rounded-t-lg transform -translate-x-1/2"></div>
            <div className="absolute bottom-4 left-1/2 w-40 h-20 border-2 border-white/20 border-t-0 rounded-b-lg transform -translate-x-1/2"></div>

            {/* Bandeirinhas de canto (opcional) */}
            <div className="absolute top-0 left-0 w-2 h-6 bg-yellow-500/70"></div>
            <div className="absolute top-0 right-0 w-2 h-6 bg-yellow-500/70"></div>
            <div className="absolute bottom-0 left-0 w-2 h-6 bg-yellow-500/70"></div>
            <div className="absolute bottom-0 right-0 w-2 h-6 bg-yellow-500/70"></div>

            {/* Posições dos jogadores no campo */}
            {fieldSlots.map(slot => {
              const isHoveringThisSlot = hovering.slotId === slot.id && hovering.showOptions
              const isDraggingThisSlot = dragging.slotId === slot.id

              return (
                <div
                  key={slot.id}
                  draggable={!!slot.player && !dragging.isDragging}
                  onDragStart={(e) => !dragging.isDragging && handleDragStart(e, slot.id, false)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropOnField(e, slot.id)}
                  onTouchStart={(e) => {
                    hasDraggedRef.current = false; // Reset drag state on new touch
                    const touch = e.touches[0];
                    // Store start position to differentiate tap vs drag
                    (e.target as any).dataset.startX = touch.clientX;
                    (e.target as any).dataset.startY = touch.clientY;
                    handleMouseDown(e, slot.id);
                  }}
                  onTouchMove={(e) => {
                    const touch = e.touches[0];
                    const startX = parseFloat((e.target as any).dataset.startX || '0');
                    const startY = parseFloat((e.target as any).dataset.startY || '0');
                    const moveX = Math.abs(touch.clientX - startX);
                    const moveY = Math.abs(touch.clientY - startY);

                    // If moved significantly, it's a drag
                    if ((moveX > 10 || moveY > 10) && !dragging.isDragging && slot.player) {
                      setDragging({
                        isDragging: true,
                        slotId: slot.id,
                        startX: touch.clientX,
                        startY: touch.clientY,
                        currentX: touch.clientX,
                        currentY: touch.clientY
                      });
                      hasDraggedRef.current = true; // Mark as dragged to prevent click
                      setHovering({ isHovering: false, slotId: null, showOptions: false });
                    }
                  }}
                  onMouseDown={(e) => !isMobile && handleMouseDown(e, slot.id)} // Desktop/Tablet drag start
                  onMouseUp={(e) => {
                    // Ensure checks clean up timeout on release
                    if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current)
                  }}
                  onClick={(e) => handleSlotClick(e, slot.id)} // Handle click
                  onMouseEnter={() => !isMobile && slot.player && handleMouseEnter(slot.id)}
                  onMouseLeave={() => !isMobile && handleMouseLeave()}
                  className={cn(
                    "absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-all group",
                    dragging.slotId === slot.id ? "z-50 cursor-grabbing scale-110" : "cursor-pointer",
                    slot.isOccupied ? "" : "border-2 border-dashed border-white/30"
                  )}
                  style={{
                    left: `${slot.x}%`,
                    top: `${slot.y}%`,
                    transition: dragging.slotId === slot.id ? 'none' : 'all 0.2s ease',
                    width: isHoveringThisSlot && !isMobile ? 'calc(7rem + 6rem)' : (isMobile ? '16%' : (isTablet ? '5rem' : '7rem')), // Responsive % width on mobile
                    height: isMobile ? 'auto' : (isTablet ? '5rem' : '7rem'),
                    aspectRatio: isMobile ? '1/1' : 'auto',
                    touchAction: 'none'
                  }}
                >
                  {slot.player ? (
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                      {/* Container principal com área estendida para as opções */}
                      <div className="relative flex flex-col items-center">
                        {/* Opções de Hover - MENU MOBILE & DESKTOP */}
                        {isHoveringThisSlot && !dragging.isDragging && (
                          <div
                            ref={optionsContainerRef}
                            className={cn(
                              "absolute z-40 flex gap-2 bg-zinc-900/95 backdrop-blur-sm rounded-xl p-2 border border-zinc-700 shadow-xl",
                              isMobile ? "-top-16 left-1/2 -translate-x-1/2 flex-row" : "-left-16 flex-col"
                            )}
                            onMouseEnter={() => !isMobile && handleMouseEnter(slot.id)}
                            onMouseLeave={() => !isMobile && handleMouseLeave()}
                            onTouchEnd={(e) => e.stopPropagation()} // Prevent closing when tapping inside menu
                          >
                            {/* Remover jogador */}
                            <button
                              onMouseDown={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleRemovePlayerWithConfirmation(slot.id, e)
                              }}
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                              }}
                              className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center justify-center hover:bg-red-500/30 transition-colors group/btn"
                              title="Remover jogador"
                            >
                              <Trash2 className="w-3 h-3 text-red-400 group-hover/btn:text-red-300" />
                            </button>

                            {/* Mudar posição */}
                            <button
                              onMouseDown={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setSelectedSlot(slot)
                                setShowPositionModal(true)
                                setHovering({ isHovering: false, slotId: null, showOptions: false })
                              }}
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                              }}
                              className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/50 flex items-center justify-center hover:bg-blue-500/30 transition-colors group/btn"
                              title="Mudar posição"
                            >
                              <Edit2 className="w-3 h-3 text-blue-400 group-hover/btn:text-blue-300" />
                            </button>



                          </div>
                        )}

                        {/* Jogador - visual */}
                        <div
                          className={cn(
                            "player-icon-container rounded-full overflow-hidden border-2 shadow-lg flex flex-col items-center justify-center relative transition-transform",
                            getPositionColor(slot.position),
                            isDraggingThisSlot ? "scale-110 shadow-2xl" : "hover:scale-105",
                            isMobile ? "w-10 h-10 min-[375px]:w-12 min-[375px]:h-12 min-[425px]:w-14 min-[425px]:h-14" : (isTablet ? "w-14 h-14" : "w-16 h-16")
                          )}
                        >
                          {slot.player.photo_url ? (
                            <img
                              src={slot.player.photo_url}
                              alt={slot.player.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-1">
                              <span className="text-[10px] md:text-sm font-bold text-white">{slot.player.position}</span>
                              <span className="text-sm md:text-2xl font-black text-white">{slot.player.overall}</span>
                            </div>
                          )}
                        </div>

                        {/* Badge do OVR */}
                        <div className="absolute -top-1 -right-1 bg-black/90 backdrop-blur px-1.5 py-0.5 rounded-lg border border-emerald-500 shadow-lg z-10 pointer-events-none">
                          <span className="text-[10px] md:text-xs font-bold text-yellow-400">{slot.player.overall}</span>
                        </div>

                        {/* Nome da posição + nome do jogador */}
                        <div className="flex flex-col items-center mt-1 gap-0.5 pointer-events-none">
                          <div className={cn(
                            "px-1.5 py-0.5 rounded-lg border text-[10px] whitespace-nowrap",
                            getPositionColor(slot.position)
                          )}>
                            <span className="font-bold text-white">
                              {slot.position}
                            </span>
                          </div>
                          {/* Nome completo do jogador */}
                          <div className={cn("text-center", isMobile ? "max-w-[60px]" : "max-w-[90px]")}>
                            <span className="text-[8px] md:text-[10px] font-medium text-white truncate block px-1 drop-shadow-md">
                              {slot.player.name}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className={cn(
                        "rounded-full flex items-center justify-center border-2 text-xs",
                        getPositionColor(slot.position),
                        isMobile ? "w-10 h-10 min-[375px]:w-12 min-[375px]:h-12 min-[425px]:w-14 min-[425px]:h-14" : "w-14 h-14"
                      )}>
                        <span className="font-bold text-white">{slot.position || '?'}</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Legenda do campo */}
          <div className="flex justify-center mt-4">
            <div className="flex items-center gap-4 text-xs text-zinc-400">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <span>Goleiro</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span>Defesa</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>Meio-Campo</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span>Ataque</span>
              </div>
            </div>
          </div>
        </div>

        {/* Resumo da Formação - agora ao lado direito */}
        <div className="lg:w-1/3 bg-zinc-900/50 rounded-xl border border-zinc-700 p-4">
          <h4 className="font-bold text-white mb-4">Resumo da Formação</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-400">Titulares</span>
              <span className="font-bold text-white">
                {stats?.fieldPlayerCount || 0}/11
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-400">Reservas</span>
              <span className="font-bold text-white">
                {reserveSlots.filter(s => s.player).length}/11
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-400">Overall Médio</span>
              <span className="font-bold text-yellow-400 text-lg">
                {stats?.avgOverall || '-'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-400">Valor Total</span>
              <span className="font-bold text-emerald-400">
                R$ {(stats?.totalValue || 0).toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-400">Idade Média</span>
              <span className="font-bold text-cyan-400">
                {stats?.avgAge || '-'} anos
              </span>
            </div>

            {showStats && stats && (
              <div className="border-t border-zinc-700 pt-4 mt-2">
                <h5 className="font-bold text-white mb-3">Médias por Setor</h5>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-400">Defesa</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-zinc-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${Math.min(100, (stats.defenseAvg / 99) * 100)}%` }}
                        ></div>
                      </div>
                      <span className="font-bold text-blue-400">{stats.defenseAvg}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-400">Meio-Campo</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-zinc-700 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${Math.min(100, (stats.midfieldAvg / 99) * 100)}%` }}
                        ></div>
                      </div>
                      <span className="font-bold text-green-400">{stats.midfieldAvg}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-red-400">Ataque</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-zinc-700 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${Math.min(100, (stats.attackAvg / 99) * 100)}%` }}
                        ></div>
                      </div>
                      <span className="font-bold text-red-400">{stats.attackAvg}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Banco de Reservas */}
      <div className="bg-zinc-900/50 rounded-xl border border-zinc-700 p-4">
        <h4 className="font-bold text-white mb-4">Banco de Reservas (Arraste para o campo ou clique para adicionar)</h4>
        <div className="grid grid-cols-5 min-[400px]:grid-cols-6 sm:grid-cols-8 md:grid-cols-11 gap-3">
          {reserveSlots.map((slot, index) => (
            <div
              key={slot.id}
              draggable={!!slot.player}
              onDragStart={(e) => handleDragStart(e, slot.id, true)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDropOnReserve(e, slot.id)}
              onClick={(e) => {
                if (hasDraggedRef.current) return;
                setSelectedSlot(slot)
                setShowPlayerModal(true)
              }}
              onTouchStart={(e) => {
                hasDraggedRef.current = false; // Reset drag state on new touch
                const touch = e.touches[0];
                (e.target as any).dataset.startX = touch.clientX;
                (e.target as any).dataset.startY = touch.clientY;
                handleMouseDown(e, slot.id, true); // Treat reserve drag as 'move button' action effectively
              }}
              onTouchMove={(e) => {
                const touch = e.touches[0];
                const startX = parseFloat((e.target as any).dataset.startX || '0');
                const startY = parseFloat((e.target as any).dataset.startY || '0');
                const moveX = Math.abs(touch.clientX - startX);
                const moveY = Math.abs(touch.clientY - startY);

                if ((moveX > 10 || moveY > 10) && !dragging.isDragging && slot.player) {
                  setDragging({
                    isDragging: true,
                    slotId: slot.id,
                    startX: touch.clientX,
                    startY: touch.clientY,
                    currentX: touch.clientX,
                    currentY: touch.clientY
                  });
                  hasDraggedRef.current = true; // Mark as dragged
                }
              }}
              className={cn(
                "aspect-square rounded-full flex items-center justify-center transition-all cursor-pointer group relative",
                slot.player
                  ? "border-2 border-emerald-500 shadow-lg hover:scale-105 hover:shadow-emerald-500/20"
                  : "border-2 border-dashed border-zinc-600 hover:border-emerald-500 hover:bg-zinc-800/50",
                isMobile ? "w-10 h-10 min-[375px]:w-12 min-[375px]:h-12 min-[425px]:w-14 min-[425px]:h-14" : (isTablet ? "w-14 h-14" : "w-16 h-16")
              )}
              style={{ touchAction: 'none' }}
            >
              {slot.player ? (
                <>
                  <div className="w-full h-full rounded-full overflow-hidden border-2 border-emerald-500 flex flex-col items-center justify-center">
                    {slot.player.photo_url ? (
                      <img
                        src={slot.player.photo_url}
                        alt={slot.player.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-600 to-cyan-600 flex flex-col items-center justify-center p-1">
                        <span className="text-[8px] font-bold text-white">{slot.player.position}</span>
                        <span className="text-xs font-black text-white">{slot.player.overall}</span>
                      </div>
                    )}

                    {/* Nome completo do jogador abaixo */}
                    <div className="absolute -bottom-5 w-full">
                      <span className="text-[7px] text-white text-center truncate block px-0.5">
                        {slot.player.name}
                      </span>
                    </div>
                  </div>

                  {/* Botão remover */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation()
                      handleClearReserveSlot(slot.id, e)
                    }}
                    className="absolute -top-0.5 -right-0.5 bg-red-600 hover:bg-red-700 w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-lg z-10"
                  >
                    <X className="w-2 h-2 text-white" />
                  </div>

                  {/* Ícone arrastar */}
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="w-2.5 h-2.5 text-zinc-300" />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <span className="text-zinc-500 text-xs font-bold">{index + 1}</span>
                  <span className="text-[7px] text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Clique para adicionar
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Controles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controles */}
        <div className="space-y-4">
          <Button
            variant="outline"
            onClick={handleClearAll}
            className="border-red-500/50 text-red-400 hover:bg-red-500/10 w-full"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Limpar Todos
          </Button>
        </div>

        {/* Botão para salvar formação */}
        <div className="space-y-4">
          <Button
            onClick={() => setShowSaveDialog(true)}
            className="bg-purple-600 hover:bg-purple-700 w-full"
            disabled={!stats || stats.fieldPlayerCount < 11 || !userTeamId}
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar Formação
          </Button>
        </div>
      </div>

      {/* Modal de Seleção de Jogadores */}
      {selectedSlot && (
        <PlayerSelectionModal
          isOpen={showPlayerModal}
          onClose={() => {
            setShowPlayerModal(false)
            setSelectedSlot(null)
          }}
          onSelectPlayer={handleSelectPlayer}
          teamPlayers={teamPlayers}
          allPlayers={allPlayers}
          position={selectedSlot.position || ''}
          isReserveSlot={selectedSlot.id.includes('reserve')}
        // selectedPlayers prop might not be needed or is invalid for this component depending on version
        />
      )}

      {/* Modal de Seleção de Posição */}
      {selectedSlot && selectedSlot.player && (
        <PositionSelectionModal
          isOpen={showPositionModal}
          onClose={() => {
            setShowPositionModal(false)
            setSelectedSlot(null)
          }}
          onSelectPosition={handleSelectPosition}
          currentPosition={selectedSlot.position}
          player={selectedSlot.player}
        />
      )}

      {/* Modal de confirmação para remover jogador */}
      {slotToRemove && (
        <RemoveConfirmationModal
          isOpen={showRemoveConfirmation}
          onClose={() => {
            setShowRemoveConfirmation(false)
            setSlotToRemove(null)
          }}
          onConfirm={confirmRemovePlayer}
          playerName={fieldSlots.find(s => s.id === slotToRemove)?.player?.name || ''}
          playerPosition={fieldSlots.find(s => s.id === slotToRemove)?.position || ''}
        />
      )}

      {/* Modal para carregar formação */}
      <LoadFormationDialog
        isOpen={showLoadDialog}
        onClose={() => setShowLoadDialog(false)}
        formations={savedFormations}
        onLoadFormation={handleLoadFormation}
        onDeleteFormation={handleDeleteFormation}
      />

      {/* Modal para nomear a formação */}
      <SaveFormationDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSaveFormationToServer}
        loading={savingFormation}
      />
    </div>
  )
}