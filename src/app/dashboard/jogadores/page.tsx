'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { CadastrarJogadorForm } from '@/components/jogadores/CadastrarJogadorForm'
import { 
  PlusCircle, 
  Loader2, 
  AlertCircle, 
  Search, 
  Filter, 
  X, 
  ChevronDown, 
  Pencil, 
  Grid3X3, 
  List, 
  Star, 
  Ruler,
  Check 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Sidebar from '@/components/Sidebar'
import { useAuth } from '@/hooks/useAuth'
import FloatingChatButton from '@/components/FloatingChatButton'
import ChatPopup from '@/components/Chatpopup'

// Importando componentes modulares
import { PlayerHeader } from '@/components/jogadores/PlayerHeader'
import { PlayerFilters } from '@/components/jogadores/PlayerFilters'
import { PlayerCardGrid } from '@/components/jogadores/PlayerCardGrid'
import { PlayerCardList } from '@/components/jogadores/PlayerCardList'
import { FavoriteToast } from '@/components/jogadores/FavoriteToast'
import { Player, Team } from '@/components/jogadores/types'

// Constantes
const POSITIONS = ['GO', 'ZC', 'LE', 'LD', 'VOL', 'MLG', 'MAT', 'SA', 'MLE', 'MLD', 'PTE', 'PTD', 'CA']
const PLAYSTYLES = ['Artilheiro', 'Armador criativo', 'Atacante surpresa', 'Clássica nº 10', 'Especialista em cruz.', 'Goleiro defensivo', 'Goleiro ofensivo', 'Homem de área', 'Jog. de infiltração', 'Jog. de Lado de Campo', 'Lateral móvel', 'Meia versátil', 'Nenhum', 'Orquestrador', 'Pivô', 'Ponta velocista', 'Primeiro volante', 'Provocador', 'Puxa marcação', 'Volantão', 'Zagueiro defensivo', 'Zagueiro ofensivo']
const FOOT_OPTIONS = ['Todos', 'Direito', 'Esquerdo', 'Ambos']
const OVERALL_OPTIONS = ['Todos', ...Array.from({ length: 35 }, (_, i) => (65 + i).toString())] // 65 até 99

const ATTRIBUTE_GROUPS = [
  { name: 'Ataque & Técnica', attributes: ['offensive_talent', 'ball_control', 'dribbling', 'tight_possession', 'finishing', 'heading', 'place_kicking', 'curl'] },
  { name: 'Passes', attributes: ['low_pass', 'lofted_pass'] },
  { name: 'Físico', attributes: ['speed', 'acceleration', 'kicking_power', 'jump', 'physical_contact', 'balance', 'stamina'] },
  { name: 'Defesa', attributes: ['defensive_awareness', 'ball_winning', 'aggression'] },
  { name: 'Goleiro', attributes: ['gk_awareness', 'gk_catching', 'gk_clearing', 'gk_reflexes', 'gk_reach'] },
]

const ATTR_LABELS: Record<string, string> = {
  offensive_talent: 'Tal. Ofensivo',
  ball_control: 'Controle de bola',
  dribbling: 'Drible',
  tight_possession: 'Condução Firme',
  low_pass: 'Passe rasteiro',
  lofted_pass: 'Passe Alto',
  finishing: 'Finalização',
  heading: 'Cabeceio',
  place_kicking: 'Chute colocado',
  curl: 'Curva',
  speed: 'Velocidade',
  acceleration: 'Aceleração',
  kicking_power: 'Força do chute',
  jump: 'Impulsão',
  physical_contact: 'Contato Físico',
  balance: 'Equilíbrio',
  stamina: 'Resistência',
  defensive_awareness: 'Talento defensivo',
  ball_winning: 'Desarme',
  aggression: 'Agressividade',
  gk_awareness: 'Talento de GO',
  gk_catching: 'Firmeza de GO',
  gk_clearing: 'Afast. de bola de GO',
  gk_reflexes: 'Reflexos de GO',
  gk_reach: 'Alcance de GO',
}

// Função para formatar o valor base
function formatBasePrice(price: number): string {
  if (price >= 1000000) {
    return `R$ ${(price / 1000000).toFixed(0)}M`
  } else if (price >= 1000) {
    return `R$ ${(price / 1000).toFixed(0)}K`
  }
  return `R$ ${price}`
}

export default function ListaJogadores() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [jogadores, setJogadores] = useState<Player[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCadastroOpen, setIsCadastroOpen] = useState(false)
  const [isEdicaoOpen, setIsEdicaoOpen] = useState(false)
  const [jogadorEditando, setJogadorEditando] = useState<Player | null>(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Estados para dados do usuário
  const [team, setTeam] = useState<Team | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [dataLoading, setDataLoading] = useState(true)

  // Estados para o chat
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Estado para filtro de altura
  const [filterMinHeight, setFilterMinHeight] = useState<string>('all')
  
  // Estado para filtro de overall
  const [filterOverall, setFilterOverall] = useState<string>('Todos')

  // ESTADO: Incluir posições secundárias (Padrão: true)
  const [includeSecondaryPositions, setIncludeSecondaryPositions] = useState(true)

  const [openedPlayers, setOpenedPlayers] = useState<string[]>([])
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Estados para favoritos
  const [favoritePlayers, setFavoritePlayers] = useState<string[]>([])
  const [showFavoriteToast, setShowFavoriteToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  // Estados para filtros de posições
  const [selectedPositions, setSelectedPositions] = useState<string[]>([])

  // Estados para filtros de playstyles
  const [selectedPlaystyles, setSelectedPlaystyles] = useState<string[]>([])

  const [searchName, setSearchName] = useState('')
  const [filterFoot, setFilterFoot] = useState('Todos')
  const [filterTeam, setFilterTeam] = useState('Todos')
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])

  const [attrFilters, setAttrFilters] = useState<Record<string, number | null>>({
    offensive_talent: null, ball_control: null, dribbling: null, tight_possession: null,
    low_pass: null, lofted_pass: null, finishing: null, heading: null, place_kicking: null,
    curl: null, speed: null, acceleration: null, kicking_power: null, jump: null,
    physical_contact: null, balance: null, stamina: null, defensive_awareness: null,
    ball_winning: null, aggression: null, gk_awareness: null, gk_catching: null,
    gk_clearing: null, gk_reflexes: null, gk_reach: null,
  })

  // Funções para manipular checkboxes de posições
  const togglePosition = (position: string) => {
    setSelectedPositions(prev =>
      prev.includes(position)
        ? prev.filter(p => p !== position)
        : [...prev, position]
    )
  }

  const clearPositionFilters = () => setSelectedPositions([])

  // Funções para manipular checkboxes de playstyles
  const togglePlaystyle = (playstyle: string) => {
    setSelectedPlaystyles(prev =>
      prev.includes(playstyle)
        ? prev.filter(p => p !== playstyle)
        : [...prev, playstyle]
    )
  }

  const clearPlaystyleFilters = () => setSelectedPlaystyles([])

  // Função para renderizar logo do clube
  const renderClubLogo = useCallback((url: string | null, name: string) =>
    url ? (
      <img
        src={url}
        alt={name}
        className="w-8 h-8 object-contain rounded-full ring-2 ring-zinc-700"
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
      />
    ) : null
  , [])

  // Função para navegação via grid
  const handleGridCardClick = useCallback((playerId: string) => {
    setIsTransitioning(true)
    setViewMode('list')
    
    setTimeout(() => {
      setOpenedPlayers(prev => 
        prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
      )
      
      setTimeout(() => {
        const element = document.getElementById(`player-${playerId}`)
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center'
          })
          
          element.classList.add('ring-2', 'ring-purple-500', 'rounded-xl')
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-purple-500', 'rounded-xl')
          }, 3000)
        }
        setIsTransitioning(false)
      }, 300)
    }, 200)
  }, [])

  const togglePlayer = useCallback((playerId: string) => {
    if (isTransitioning) return;
    setOpenedPlayers(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    )
  }, [isTransitioning])

  // Funções para favoritos
  const loadFavoritePlayers = useCallback(async () => {
    if (!user) return

    try {
      const { data: favoritesData, error } = await supabase
        .from('player_favorites')
        .select('player_id')
        .eq('user_id', user.id)

      if (!error) {
        const favoriteIds = favoritesData.map(fav => fav.player_id)
        setFavoritePlayers(favoriteIds)
      }
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error)
    }
  }, [user])

  const toggleFavorite = async (playerId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) return

    const isCurrentlyFavorite = favoritePlayers.includes(playerId)

    try {
      if (isCurrentlyFavorite) {
        // Remover dos favoritos
        const { error } = await supabase
          .from('player_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('player_id', playerId)

        if (error) throw error
        
        setFavoritePlayers(prev => prev.filter(id => id !== playerId))
        setToastMessage('Jogador removido dos favoritos!')
      } else {
        // Adicionar aos favoritos
        const { error } = await supabase
          .from('player_favorites')
          .insert([
            { user_id: user.id, player_id: playerId }
          ])

        if (error) throw error
        
        setFavoritePlayers(prev => [...prev, playerId])
        setToastMessage('Jogador adicionado aos favoritos!')
      }

      setShowFavoriteToast(true)
      setTimeout(() => setShowFavoriteToast(false), 3000)
    } catch (error) {
      console.error('Erro ao atualizar favorito:', error)
      setToastMessage('Erro ao atualizar favorito!')
      setShowFavoriteToast(true)
      setTimeout(() => setShowFavoriteToast(false), 3000)
    }
  }

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
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error)
      } finally {
        setDataLoading(false)
      }
    }

    loadUserData()
  }, [authLoading, user])

  // Carregar favoritos quando o usuário mudar
  useEffect(() => {
    loadFavoritePlayers()
  }, [loadFavoritePlayers])

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

  // CORREÇÃO: useEffect para detectar hash da URL e fazer scroll automático
  useEffect(() => {
    const handleHashChange = () => {
      if (typeof window === 'undefined') return;
      
      const hash = window.location.hash;
      
      if (hash && hash.startsWith('#player-')) {
        const playerId = hash.replace('#player-', '');
        
        // Garantir que está na view de lista
        setViewMode('list');
        
        // Aguardar um pouco para a view mudar e os elementos renderizarem
        setTimeout(() => {
          // Abrir o card do jogador
          setOpenedPlayers(prev => 
            prev.includes(playerId) ? prev : [...prev, playerId]
          );
          
          // Scroll para o jogador após abrir o card
          setTimeout(() => {
            const element = document.getElementById(`player-${playerId}`);
            
            if (element) {
              // Scroll suave para o elemento
              element.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'nearest'
              });
              
              // Adicionar destaque visual
              element.classList.add('ring-2', 'ring-purple-500', 'rounded-xl', 'transition-all', 'duration-500');
              
              // Remover o destaque após 3 segundos
              setTimeout(() => {
                element.classList.remove('ring-2', 'ring-purple-500', 'rounded-xl');
              }, 3000);
            } else {
              // Tentar novamente após mais tempo
              setTimeout(() => {
                const retryElement = document.getElementById(`player-${playerId}`);
                if (retryElement) {
                  retryElement.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                  });
                  retryElement.classList.add('ring-2', 'ring-purple-500', 'rounded-xl');
                  setTimeout(() => {
                    retryElement.classList.remove('ring-2', 'ring-purple-500', 'rounded-xl');
                  }, 3000);
                }
              }, 1000);
            }
          }, 500); // Tempo para o card abrir
        }, 300); // Tempo para a view mudar
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('load', handleHashChange);
    
    const interval = setInterval(() => {
      if (window.location.hash && window.location.hash.startsWith('#player-')) {
        handleHashChange();
        clearInterval(interval);
      }
    }, 500);
    
    setTimeout(() => clearInterval(interval), 5000);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('load', handleHashChange);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        setUserRole(data?.role || null)
      }
    }
    checkAdmin()
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [{ data: teamsData }, { data: playersData }] = await Promise.all([
        supabase.from('teams').select('id, name, logo_url').order('name'),
        supabase.from('players').select('*').order('overall', { ascending: false }),
      ])

      const teamMap = Object.fromEntries((teamsData || []).map(t => [t.id, t]))
      setTeams(teamsData || [])

      const mapped = (playersData || []).map(p => {
        const skills = p.skills || []
        if (p.is_penalty_specialist && !skills.includes('Especialista em Pênaltis')) {
          skills.push('Especialista em Pênaltis')
        }

        return {
          ...p,
          club: p.team_id ? teamMap[p.team_id]?.name || 'Sem Time' : 'Sem Time',
          logo_url: p.team_id ? teamMap[p.team_id]?.logo_url : null,
          preferred_foot: p.preferred_foot || 'Nenhum',
          skills: skills,
          playstyle: p.playstyle || null,
          alternative_positions: p.alternative_positions || [],
          nationality: p.nationality || 'Desconhecida',
          height: p.height || null,
          is_penalty_specialist: p.is_penalty_specialist || false,
          injury_resistance: p.injury_resistance || null,
        }
      })

      setJogadores(mapped)
    } catch (e: any) {
      setFetchError(e.message || 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSuccess = useCallback(() => {
    setIsCadastroOpen(false)
    setIsEdicaoOpen(false)
    setJogadorEditando(null)
    fetchData()
  }, [fetchData])

  const openEditPlayer = useCallback((player: Player, e: React.MouseEvent) => {
    e.stopPropagation()
    setJogadorEditando(player)
    setIsEdicaoOpen(true)
  }, [])

  // FILTERED PLAYERS - LÓGICA ATUALIZADA
  const filteredPlayers = useMemo(() => {
    return jogadores.filter(j => {
      const name = j.name.toLowerCase().includes(searchName.toLowerCase())
      
      // Filtro de posições (múltipla seleção) - ATUALIZADO PARA RESPEITAR O CHECKBOX
      const hasPrimaryPosition = selectedPositions.includes(j.position)
      const hasSecondaryPosition = includeSecondaryPositions && j.alternative_positions && j.alternative_positions.some(altPos => selectedPositions.includes(altPos))
      
      const pos = selectedPositions.length === 0 || hasPrimaryPosition || hasSecondaryPosition
      
      const playstyle = selectedPlaystyles.length === 0 || (j.playstyle && selectedPlaystyles.includes(j.playstyle))
      const foot = filterFoot === 'Todos' || j.preferred_foot === filterFoot
      const team = filterTeam === 'Todos' || (filterTeam === 'Sem Time' ? !j.team_id : j.team_id === filterTeam)
      const skills = selectedSkills.length === 0 || selectedSkills.every(s => j.skills?.includes(s))
      const attrs = Object.entries(attrFilters).every(([k, min]) => min === null || (j[k as keyof Player] as number ?? 0) >= min)
      
      // Filtro de altura
      const height = filterMinHeight === 'all' || (j.height && j.height >= parseInt(filterMinHeight))
      
      // Filtro de overall
      const overall = filterOverall === 'Todos' || j.overall.toString() === filterOverall
      
      return name && pos && playstyle && foot && team && skills && attrs && height && overall
    })
  }, [jogadores, searchName, selectedPositions, selectedPlaystyles, filterFoot, filterTeam, selectedSkills, attrFilters, filterMinHeight, filterOverall, includeSecondaryPositions]) // Adicionado includeSecondaryPositions

  const activeAdvancedFilters = [
    selectedPositions.length > 0,
    selectedPlaystyles.length > 0,
    filterFoot !== 'Todos',
    filterTeam !== 'Todos',
    selectedSkills.length > 0,
    Object.values(attrFilters).some(v => v !== null),
    filterMinHeight !== 'all',
    filterOverall !== 'Todos',
  ].filter(Boolean).length

  const clearAllFilters = useCallback(() => {
    setSearchName('')
    setSelectedPositions([])
    setSelectedPlaystyles([])
    setFilterFoot('Todos')
    setFilterTeam('Todos')
    setSelectedSkills([])
    setFilterMinHeight('all')
    setFilterOverall('Todos')
    setAttrFilters(Object.fromEntries(Object.keys(attrFilters).map(k => [k, null])))
    setIncludeSecondaryPositions(true) // Reseta também essa opção para o padrão
  }, [attrFilters])

  // Opções de altura (140cm até 230cm)
  const HEIGHT_OPTIONS = useMemo(() => 
    Array.from({ length: 91 }, (_, i) => {
      const height = 140 + i;
      return {
        value: String(height),
        label: `${height}cm`
      };
    }), []
  );

  const SKILLS_OPTIONS = useMemo(() => [
    '360 graus', 'Afastamento acrobático', 'Arremesso lateral longo', 'Arremesso longo do GO', 'Cabeçada', 'Chapéu', 'Chute ascendente', 'Chute com o peito do pé', 'Chute de longe', 'Chute de primeira', 'Controle da cavadinha', 'Controle de domínio', 'Corte de calcanhar', 'Cruzamento preciso', 'Curva para fora', 'De letra', 'Elástico', 'Especialista em Pênaltis', 'Espírito guerreiro', 'Finalização acrobática', 'Finta de letra', 'Folha seca', 'Interceptação', 'Liderança', 'Malícia', 'Marcação individual', 'Passe aéreo baixo', 'Passe de primeira', 'Passe em profundidade', 'Passe na medida', 'Passe sem olhar', 'Pedalada simples', 'Pegador de pênaltis', 'Precisão à distância', 'Puxada de letra', 'Reposição alta do GO', 'Reposição baixa do GO', 'Super substituto', 'Toque de calcanhar', 'Toque duplo', 'Volta para marcar'].sort(), []);

  const chatUser = useMemo(() => ({
    id: user?.id || '',
    name: profile?.coach_name || user?.user_metadata?.full_name || user?.email || 'Técnico',
    email: user?.email || ''
  }), [user, profile])

  const chatTeam = useMemo(() => ({
    id: team?.id || '',
    name: team?.name || 'Sem time'
  }), [team])

  if (authLoading || dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-2xl font-semibold text-white animate-pulse">
          Carregando...
        </div>
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
          <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
            {/* Header */}
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-6 lg:mb-8">
              <div>
                <h1 className="text-3xl lg:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-400">
                  JOGADORES
                </h1>
                <p className="text-zinc-400 mt-2 text-sm lg:text-lg">Base de Jogadores • {jogadores.length} jogadores disponíveis</p>
              </div>

              <div className="flex items-center gap-3 lg:gap-4">
                {/* Toggle de Visualização */}
                <div className="flex bg-zinc-900/70 rounded-xl p-1 border border-zinc-700">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className={cn("rounded-lg", viewMode === 'grid' && "bg-purple-600")}
                  >
                    <Grid3X3 className="w-4 h-4 lg:w-5 lg:h-5" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className={cn("rounded-lg", viewMode === 'list' && "bg-purple-600")}
                  >
                    <List className="w-4 h-4 lg:w-5 lg:h-5" />
                  </Button>
                </div>

                {/* Filtros Avançados */}
                <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="lg" className="bg-zinc-900/50 backdrop-blur border-zinc-700 hover:border-purple-500 hover:bg-zinc-800/70 text-white relative">
                      <Filter className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
                      Filtros
                      {activeAdvancedFilters > 0 && (
                        <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 text-xs">
                          {activeAdvancedFilters}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                </Sheet>

                {/* Botão Novo Jogador */}
                {userRole === 'admin' && (
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-bold text-sm lg:text-lg px-6 lg:px-8"
                    onClick={() => setIsCadastroOpen(true)}
                  >
                    <PlusCircle className="w-5 h-5 lg:w-6 lg:h-6 mr-2 lg:mr-3" />
                    Novo Jogador
                  </Button>
                )}
              </div>
            </header>

            {/* Contador de jogadores encontrados */}
            <div className="text-center mb-8 lg:mb-12">
              <p className="text-lg lg:text-xl text-zinc-400">
                Encontrados <span className="text-3xl lg:text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{filteredPlayers.length}</span> jogadores
              </p>
            </div>

            {/* Busca + Filtros Básicos */}
            <PlayerFilters
              searchName={searchName}
              setSearchName={setSearchName}
              selectedPositions={selectedPositions}
              togglePosition={togglePosition}
              clearPositionFilters={clearPositionFilters}
              selectedPlaystyles={selectedPlaystyles}
              togglePlaystyle={togglePlaystyle}
              clearPlaystyleFilters={clearPlaystyleFilters}
              filterTeam={filterTeam}
              setFilterTeam={setFilterTeam}
              clearAllFilters={clearAllFilters}
              teams={teams}
              POSITIONS={POSITIONS}
              PLAYSTYLES={PLAYSTYLES}
              includeSecondaryPositions={includeSecondaryPositions}
              setIncludeSecondaryPositions={setIncludeSecondaryPositions}
            />

            {/* REMOVIDO CHECKBOX AVULSO DAQUI */}

            {loading && (
              <div className="flex justify-center py-20 lg:py-32">
                <Loader2 className="w-16 h-16 lg:w-20 lg:h-20 animate-spin text-purple-400" />
              </div>
            )}

            {fetchError && (
              <div className="text-center py-16 lg:py-20">
                <AlertCircle className="w-16 h-16 lg:w-20 lg:h-20 text-red-500 mx-auto mb-4 lg:mb-6" />
                <p className="text-xl lg:text-2xl text-red-400">{fetchError}</p>
              </div>
            )}

            {/* GRID VIEW */}
            {viewMode === 'grid' && !loading && filteredPlayers.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 lg:gap-6">
                {filteredPlayers.map(j => (
                  <PlayerCardGrid
                    key={j.id}
                    player={j}
                    isTransitioning={isTransitioning}
                    userRole={userRole}
                    favoritePlayers={favoritePlayers}
                    onGridClick={handleGridCardClick}
                    onEditClick={openEditPlayer}
                    onToggleFavorite={toggleFavorite}
                    formatBasePrice={formatBasePrice}
                  />
                ))}
              </div>
            )}

            {/* LIST VIEW */}
            {viewMode === 'list' && !loading && filteredPlayers.length > 0 && (
              <div className="space-y-4 lg:space-y-6">
                {filteredPlayers.map(j => (
                  <PlayerCardList
                    key={j.id}
                    player={j}
                    isOpen={openedPlayers.includes(j.id)}
                    isTransitioning={isTransitioning}
                    userRole={userRole}
                    favoritePlayers={favoritePlayers}
                    onToggle={togglePlayer}
                    onEditClick={openEditPlayer}
                    onToggleFavorite={toggleFavorite}
                    formatBasePrice={formatBasePrice}
                    renderClubLogo={renderClubLogo}
                  />
                ))}
              </div>
            )}

            {/* Sheet de Cadastro */}
            <Sheet open={isCadastroOpen} onOpenChange={setIsCadastroOpen}>
              <SheetContent side="right" className="w-full sm:max-w-xl lg:max-w-2xl p-0 overflow-y-auto bg-zinc-950 border-l border-zinc-800">
                <SheetHeader className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800 px-6 py-5">
                  <SheetTitle className="text-2xl font-bold text-white">Cadastrar Novo Jogador</SheetTitle>
                  <SheetDescription className="text-zinc-400">
                    Preencha os dados do jogador. Nome e posição são obrigatórios.
                  </SheetDescription>
                </SheetHeader>
                <div className="p-6">
                  <CadastrarJogadorForm onPlayerAdded={handleSuccess} />
                </div>
              </SheetContent>
            </Sheet>

            {/* Sheet de Edição */}
            <Sheet open={isEdicaoOpen} onOpenChange={setIsEdicaoOpen}>
              <SheetContent side="right" className="w-full sm:max-w-xl lg:max-w-2xl p-0 overflow-y-auto bg-zinc-950 border-l border-zinc-800">
                <SheetHeader className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800 px-6 py-5">
                  <SheetTitle className="text-2xl font-bold text-white">Editar Jogador</SheetTitle>
                  <SheetDescription className="text-zinc-400">
                    Atualize os dados do jogador e clique em salvar.
                  </SheetDescription>
                </SheetHeader>
                <div className="p-6">
                  {jogadorEditando && (
                    <CadastrarJogadorForm 
                      playerToEdit={jogadorEditando as any} 
                      onPlayerAdded={handleSuccess} 
                    />
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* Sheet de Filtros Avançados */}
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetContent side="right" className="w-full max-w-md bg-zinc-950/95 backdrop-blur-xl border-l border-zinc-800 flex flex-col">
                <SheetHeader className="p-6 border-b border-zinc-800">
                  <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">
                    Filtros Avançados
                  </SheetTitle>
                  <SheetDescription className="text-zinc-400">
                    Refine sua busca por pé preferido, time, habilidades e atributos.
                  </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                  {/* FILTRO DE OVERALL */}
                  <div>
                    <label className="text-sm font-semibold text-zinc-300 mb-2 block">Overall</label>
                    <Select value={filterOverall} onValueChange={setFilterOverall}>
                      <SelectTrigger className="bg-zinc-900/70 border-zinc-700 text-white">
                        <SelectValue placeholder="Selecione o overall" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {OVERALL_OPTIONS.map(value => (
                          <SelectItem key={value} value={value}>
                            {value === 'Todos' ? 'Todos' : `${value}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro de Pé Preferido */}
                  <div>
                    <label className="text-sm font-semibold text-zinc-300 mb-2 block">Pé Preferido</label>
                    <Select value={filterFoot} onValueChange={setFilterFoot}>
                      <SelectTrigger className="bg-zinc-900/70 border-zinc-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>{FOOT_OPTIONS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>

                  {/* Filtro de Altura */}
                  <div>
                    <label className="text-sm font-semibold text-zinc-300 mb-2 flex items-center gap-2">
                      <Ruler className="w-4 h-4" />
                      Altura mínima
                    </label>
                    <Select value={filterMinHeight} onValueChange={setFilterMinHeight}>
                      <SelectTrigger className="bg-zinc-900/70 border-zinc-700 text-white">
                        <SelectValue placeholder="Selecione a altura mínima" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        <SelectItem value="all">Qualquer altura</SelectItem>
                        {HEIGHT_OPTIONS.map(({ value, label }) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro de Habilidades */}
                  <Collapsible>
                    <CollapsibleTrigger className="flex w-full items-center justify-between py-4 text-lg font-bold text-white hover:text-purple-400">
                      Habilidades ({selectedSkills.length})
                      <ChevronDown className="w-5 h-5 transition-transform data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-2">
                      <div className="flex flex-wrap gap-2">
                        {SKILLS_OPTIONS.map(skill => (
                          <Badge
                            key={skill}
                            variant={selectedSkills.includes(skill) ? "default" : "secondary"}
                            className={cn("cursor-pointer text-xs", selectedSkills.includes(skill) ? "bg-purple-600" : "bg-zinc-800 text-zinc-300")}
                            onClick={() => setSelectedSkills(p => p.includes(skill) ? p.filter(s => s !== skill) : [...p, skill])}
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {ATTRIBUTE_GROUPS.map(group => (
                    <Collapsible key={group.name}>
                      <CollapsibleTrigger className="flex w-full items-center justify-between py-4 text-lg font-bold text-white hover:text-purple-400">
                        {group.name}
                        <ChevronDown className="w-5 h-5 transition-transform data-[state=open]:rotate-180" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-6 pt-4">
                        {group.attributes.map(key => {
                          return (
                            <div key={key} className="space-y-3">
                              <div className="flex justify-between text-sm">
                                <span className="text-zinc-400 font-medium">{ATTR_LABELS[key]}</span>
                                <span className="font-bold text-purple-400">{attrFilters[key] ?? '-'}</span>
                              </div>
                              <Slider
                                min={50} max={99} step={1}
                                value={[attrFilters[key] ?? 50]}
                                onValueChange={([v]) => setAttrFilters(p => ({ ...p, [key]: v === 50 ? null : v }))}
                              />
                            </div>
                          )
                        })}
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </SheetContent>
            </Sheet>

            {!loading && filteredPlayers.length === 0 && (
              <div className="text-center py-20 lg:py-32">
                <div className="max-w-md mx-auto bg-zinc-900/80 rounded-2xl lg:rounded-3xl p-8 lg:p-16 border border-zinc-800">
                  <h3 className="text-2xl lg:text-4xl font-bold text-white mb-4">Nenhum jogador encontrado</h3>
                  <p className="text-zinc-400 text-sm lg:text-lg">Tente ajustar os filtros.</p>
                </div>
              </div>
            )}
          </div>

          {/* Toast de Feedback para Favoritos */}
          <FavoriteToast 
            show={showFavoriteToast} 
            message={toastMessage} 
          />
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