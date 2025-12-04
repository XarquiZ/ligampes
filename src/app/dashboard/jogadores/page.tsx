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
import { CadastrarJogadorForm } from '@/components/CadastrarJogadorForm'
import { PlusCircle, Loader2, AlertCircle, Search, Filter, X, ChevronDown, Pencil, Grid3X3, List, Star, Ruler, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import Sidebar from '@/components/Sidebar'
import { useAuth } from '@/hooks/useAuth'
import FloatingChatButton from '@/components/FloatingChatButton'
import ChatPopup from '@/components/Chatpopup'

interface Player {
  id: string
  name: string
  position: string
  overall: number
  club: string
  nationality: string
  base_price: number
  logo_url: string | null
  photo_url?: string | null
  preferred_foot: string | null
  team_id: string | null
  skills: string[] | null
  playstyle?: string | null
  alternative_positions?: string[] | null
  age?: number | null
  height?: number | null
  is_penalty_specialist?: boolean | null
  injury_resistance?: number | null
  offensive_talent?: number
  ball_control?: number
  dribbling?: number
  tight_possession?: number
  low_pass?: number
  lofted_pass?: number
  finishing?: number
  heading?: number
  place_kicking?: number
  curl?: number
  speed?: number
  acceleration?: number
  kicking_power?: number
  jump?: number
  physical_contact?: number
  balance?: number
  stamina?: number
  defensive_awareness?: number
  ball_winning?: number
  aggression?: number
  gk_awareness?: number
  gk_catching?: number
  gk_clearing?: number
  gk_reflexes?: number
  gk_reach?: number
  weak_foot_usage?: number | null
  weak_foot_accuracy?: number | null
  form?: number | null
  inspiring_ball_carry?: number | null
  inspiring_low_pass?: number | null
  inspiring_lofted_pass?: number | null
}

interface Team {
  id: string
  name: string
  logo_url: string | null
}

// Componente LevelBars movido para fora
function LevelBars({ value = 0, max = 3, size = 'sm' }: { value?: number | null; max?: number; size?: 'sm' | 'md' }) {
  const v = Math.max(0, Math.min(max, value ?? 0))
  const w = size === 'sm' ? 'w-4 h-2' : 'w-6 h-2.5'
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => {
        const active = i < v
        return (
          <div
            key={i}
            className={cn(
              `${w} rounded-sm transition-all`,
              active ? 'bg-yellow-400 shadow-sm' : 'bg-zinc-700/80'
            )}
          />
        )
      })}
    </div>
  )
}

// Função para formatar o valor base (15.000.000 -> 15M)
function formatBasePrice(price: number): string {
  if (price >= 1000000) {
    return `R$ ${(price / 1000000).toFixed(0)}M`
  } else if (price >= 1000) {
    return `R$ ${(price / 1000).toFixed(0)}K`
  }
  return `R$ ${price}`
}

// Componente de Checkbox personalizado com caixa branca
const CustomCheckbox = ({ 
  checked, 
  onChange, 
  id, 
  label 
}: { 
  checked: boolean; 
  onChange: () => void; 
  id: string; 
  label: string;
}) => (
  <div className="flex items-center space-x-3 cursor-pointer" onClick={onChange}>
    <div className={cn(
      "w-5 h-5 border-2 rounded-md flex items-center justify-center transition-all duration-200",
      checked 
        ? "bg-white border-white" 
        : "bg-transparent border-white"
    )}>
      {checked && (
        <Check className="w-3 h-3 text-black font-bold" />
      )}
    </div>
    <label
      htmlFor={id}
      className="text-sm font-medium leading-none cursor-pointer flex-1"
    >
      {label}
    </label>
  </div>
)

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

  const [openedPlayers, setOpenedPlayers] = useState<string[]>([])
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Estados para favoritos
  const [favoritePlayers, setFavoritePlayers] = useState<string[]>([])
  const [showFavoriteToast, setShowFavoriteToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  // Estados para filtros de posições (MULTIPLA SELEÇÃO)
  const [selectedPositions, setSelectedPositions] = useState<string[]>([])
  const [positionFilterOpen, setPositionFilterOpen] = useState(false)

  // Estados para filtros de playstyles (MULTIPLA SELEÇÃO)
  const [selectedPlaystyles, setSelectedPlaystyles] = useState<string[]>([])
  const [playstyleFilterOpen, setPlaystyleFilterOpen] = useState(false)

  // Constantes movidas para dentro do componente para evitar hoisting
  const POSITIONS = ['GO', 'ZC', 'LE', 'LD', 'VOL', 'MLG', 'MAT', 'SA', 'MLE', 'MLD', 'PTE', 'PTD', 'CA']
  
  // Playstyles da página de elenco
  const PLAYSTYLES = ['Artilheiro', 'Armador criativo', 'Atacante surpresa', 'Clássica nº 10', 'Especialista em cruz.', 'Goleiro defensivo', 'Goleiro ofensivo', 'Homem de área', 'Jog. de infiltração', 'Jog. de Lado de Campo', 'Lateral móvel', 'Meia versátil', 'Nenhum', 'Orquestrador', 'Pivô', 'Ponta velocista', 'Primeiro volante', 'Provocador', 'Puxa marcação', 'Volantão', 'Zagueiro defensivo', 'Zagueiro ofensivo']

  const FOOT_OPTIONS = ['Todos', 'Direito', 'Esquerdo', 'Ambos']

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

  // HABILIDADES ORGANIZADAS EM ORDEM ALFABÉTICA E COM "Especialista em Pênaltis" incluída
  const SKILLS_OPTIONS = useMemo(() => [
    '360 graus',
    'Afastamento acrobático',
    'Cabeçada',
    'Chapéu',
    'Chute ascendente',
    'Chute com o peito do pé',
    'Chute de primeira',
    'Chute de longe',
    'Controle da cavadinha',
    'Controle de domínio',
    'Corte de calcanhar',
    'Cruzamento preciso',
    'Curva para fora',
    'De letra',
    'Elástico',
    'Especialista em Pênaltis',
    'Espírito guerreiro',
    'Finalização acrobática',
    'Finta de letra',
    'Folha seca',
    'Interceptação',
    'Liderança',
    'Malícia',
    'Marcação individual',
    'Passe aéreo baixo',
    'Passe em profundidade',
    'Passe na medida',
    'Passe de primeira',
    'Passe sem olhar',
    'Pedalada simples',
    'Pegador de pênaltis',
    'Precisão à distância',
    'Puxada de letra',
    'Reposição alta do GO',
    'Reposição baixa do GO',
    'Super substituto',
    'Toque de calcanhar',
    'Toque duplo',
    'Volta para marcar'
  ].sort(), []);

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

  // Funções auxiliares simplificadas
  const formatHeight = (height: number | null | undefined) => {
    if (height === null || height === undefined) return '-'
    return `${height}cm`
  }

  const getAttrColorHex = (value: number) => {
    if (value >= 95) return '#4FC3F7'
    if (value >= 85) return '#00FF00'
    if (value >= 75) return '#FFFF00'
    return '#E53935'
  }

  // FUNÇÃO SIMPLIFICADA: Para navegação via chat
  const handleGridCardClick = useCallback((playerId: string) => {
    setIsTransitioning(true)
    setViewMode('list')
    
    setTimeout(() => {
      setOpenedPlayers(prev => 
        prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
      )
      
      // Scroll para o jogador
      setTimeout(() => {
        const element = document.getElementById(`player-${playerId}`)
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center'
          })
          
          // Adicionar destaque visual
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

  const toggleFavorite = async (playerId: string) => {
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
      console.log('🔍 Hash detectado:', hash);
      
      if (hash && hash.startsWith('#player-')) {
        const playerId = hash.replace('#player-', '');
        console.log('🎯 ID do jogador do hash:', playerId);
        
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
            console.log('🔎 Elemento encontrado:', element);
            
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
              
              console.log('✅ Scroll realizado para o jogador:', playerId);
            } else {
              console.log('❌ Elemento não encontrado, tentando novamente...');
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

    // Executar na montagem inicial se já tiver hash
    handleHashChange();
    
    // Ouvir mudanças no hash (quando navega via chat)
    window.addEventListener('hashchange', handleHashChange);
    
    // Também verificar quando a página termina de carregar
    window.addEventListener('load', handleHashChange);
    
    // Verificar periodicamente por alguns segundos após carregar (fallback)
    const interval = setInterval(() => {
      if (window.location.hash && window.location.hash.startsWith('#player-')) {
        handleHashChange();
        clearInterval(interval);
      }
    }, 500);
    
    setTimeout(() => clearInterval(interval), 5000); // Parar após 5 segundos

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
        // Adicionar "Especialista em Pênaltis" às skills se o jogador for especialista
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

  const openEditPlayer = useCallback((player: Player) => {
    setJogadorEditando(player)
    setIsEdicaoOpen(true)
  }, [])

  const filteredPlayers = useMemo(() => {
    return jogadores.filter(j => {
      const name = j.name.toLowerCase().includes(searchName.toLowerCase())
      // Filtro de posições (múltipla seleção)
      const pos = selectedPositions.length === 0 || selectedPositions.includes(j.position)
      // Filtro de playstyles (múltipla seleção)
      const playstyle = selectedPlaystyles.length === 0 || (j.playstyle && selectedPlaystyles.includes(j.playstyle))
      const foot = filterFoot === 'Todos' || j.preferred_foot === filterFoot
      const team = filterTeam === 'Todos' || (filterTeam === 'Sem Time' ? !j.team_id : j.team_id === filterTeam)
      const skills = selectedSkills.length === 0 || selectedSkills.every(s => j.skills?.includes(s))
      const attrs = Object.entries(attrFilters).every(([k, min]) => min === null || (j[k as keyof Player] as number ?? 0) >= min)
      
      // Filtro de altura
      const height = filterMinHeight === 'all' || (j.height && j.height >= parseInt(filterMinHeight))
      
      return name && pos && playstyle && foot && team && skills && attrs && height
    })
  }, [jogadores, searchName, selectedPositions, selectedPlaystyles, filterFoot, filterTeam, selectedSkills, attrFilters, filterMinHeight])

  const activeAdvancedFilters = [
    selectedPositions.length > 0,
    selectedPlaystyles.length > 0,
    filterFoot !== 'Todos',
    filterTeam !== 'Todos',
    selectedSkills.length > 0,
    Object.values(attrFilters).some(v => v !== null),
    filterMinHeight !== 'all',
  ].filter(Boolean).length

  const clearAllFilters = useCallback(() => {
    setSearchName('')
    setSelectedPositions([])
    setSelectedPlaystyles([])
    setFilterFoot('Todos')
    setFilterTeam('Todos')
    setSelectedSkills([])
    setFilterMinHeight('all')
    setAttrFilters(Object.fromEntries(Object.keys(attrFilters).map(k => [k, null])))
  }, [attrFilters])

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

  // Criar objetos compatíveis com os componentes de chat
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
                      <div>
                        <label className="text-sm font-semibold text-zinc-300 mb-2 block">Pé Preferido</label>
                        <Select value={filterFoot} onValueChange={setFilterFoot}>
                          <SelectTrigger className="bg-zinc-900/70 border-zinc-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>{FOOT_OPTIONS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-zinc-300 mb-2 block">Time</label>
                        <Select value={filterTeam} onValueChange={setFilterTeam}>
                          <SelectTrigger className="bg-zinc-900/70 border-zinc-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Todos">Todos os times</SelectItem>
                            <SelectItem value="Sem Time">Sem time</SelectItem>
                            {teams.map(t => (
                              <SelectItem key={t.id} value={t.id}>
                                <div className="flex items-center gap-3">
                                  {t.logo_url && <img src={t.logo_url} alt="" className="w-6 h-6 rounded" />}
                                  <span>{t.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
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

                {userRole === 'admin' && (
                  <Sheet open={isCadastroOpen} onOpenChange={setIsCadastroOpen}>
                    <SheetTrigger asChild>
                      <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-bold text-sm lg:text-lg px-6 lg:px-8">
                        <PlusCircle className="w-5 h-5 lg:w-6 lg:h-6 mr-2 lg:mr-3" />
                        Novo Jogador
                      </Button>
                    </SheetTrigger>
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
                )}
              </div>
            </header>

            {/* Busca + Filtros Básicos */}
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 mb-6 lg:mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 lg:w-5 lg:h-5" />
                <Input
                  placeholder="Procurar jogador..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="pl-12 h-12 lg:h-14 bg-zinc-900/70 border-zinc-700 text-white placeholder:text-zinc-500 text-base lg:text-lg rounded-xl"
                />
              </div>

              {/* FILTRO DE POSIÇÕES COM CHECKBOXES - ATUALIZADO E MENOR */}
              <div className="relative">
                <Button 
                  variant="outline" 
                  className={cn(
                    "h-12 lg:h-14 bg-zinc-900/70 border-zinc-700 flex items-center gap-1 lg:gap-2 text-sm w-full lg:w-40",
                    selectedPositions.length > 0 && "border-purple-500 text-purple-400"
                  )}
                  onClick={() => setPositionFilterOpen(!positionFilterOpen)}
                >
                  <Filter className="w-3 h-3 lg:w-4 lg:h-4" />
                  Posições
                  {selectedPositions.length > 0 && (
                    <Badge className="bg-purple-600 text-xs h-5 px-2 min-w-5">{selectedPositions.length}</Badge>
                  )}
                </Button>
                
                {positionFilterOpen && (
                  <div className="absolute top-full left-0 mt-2 w-full lg:w-64 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg z-40 p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-base">Filtrar por Posição</h3>
                      {selectedPositions.length > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={clearPositionFilters}
                          className="text-xs text-red-400 hover:text-red-300 h-6"
                        >
                          Limpar
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {POSITIONS.map(position => (
                        <CustomCheckbox
                          key={position}
                          id={`position-${position}`}
                          checked={selectedPositions.includes(position)}
                          onChange={() => togglePosition(position)}
                          label={position}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* FILTRO DE ESTILOS DE JOGO COM CHECKBOXES */}
              <div className="relative">
                <Button 
                  variant="outline" 
                  className={cn(
                    "h-12 lg:h-14 bg-zinc-900/70 border-zinc-700 flex items-center gap-1 lg:gap-2 text-sm w-full lg:w-40",
                    selectedPlaystyles.length > 0 && "border-purple-500 text-purple-400"
                  )}
                  onClick={() => setPlaystyleFilterOpen(!playstyleFilterOpen)}
                >
                  <Filter className="w-3 h-3 lg:w-4 lg:h-4" />
                  Estilos
                  {selectedPlaystyles.length > 0 && (
                    <Badge className="bg-purple-600 text-xs h-5 px-2 min-w-5">{selectedPlaystyles.length}</Badge>
                  )}
                </Button>
                
                {playstyleFilterOpen && (
                  <div className="absolute top-full left-0 mt-2 w-full lg:w-64 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg z-40 p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-base">Filtrar por Estilo</h3>
                      {selectedPlaystyles.length > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={clearPlaystyleFilters}
                          className="text-xs text-red-400 hover:text-red-300 h-6"
                        >
                          Limpar
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {PLAYSTYLES.map(playstyle => (
                        <CustomCheckbox
                          key={playstyle}
                          id={`playstyle-${playstyle}`}
                          checked={selectedPlaystyles.includes(playstyle)}
                          onChange={() => togglePlaystyle(playstyle)}
                          label={playstyle}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Button variant="outline" size="lg" onClick={clearAllFilters} className="h-12 lg:h-14 px-4 lg:px-6 bg-zinc-900/70 border-zinc-700 hover:bg-zinc-800 hover:border-purple-500 text-white">
                <X className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
                Resetar Filtros
              </Button>
            </div>

            {/* Fechar filtros quando clicar fora */}
            {(positionFilterOpen || playstyleFilterOpen) && (
              <div 
                className="fixed inset-0 z-0 bg-transparent cursor-default"
                onClick={() => {
                  setPositionFilterOpen(false)
                  setPlaystyleFilterOpen(false)
                }}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              />
            )}

            <div className="text-center mb-8 lg:mb-12">
              <p className="text-lg lg:text-xl text-zinc-400">
                Encontrados <span className="text-3xl lg:text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{filteredPlayers.length}</span> jogadores
              </p>
            </div>

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
                  <div
                    key={j.id}
                    onClick={() => !isTransitioning && handleGridCardClick(j.id)}
                    className="group relative bg-zinc-900/90 rounded-xl lg:rounded-2xl overflow-hidden border border-zinc-800 hover:border-purple-500/70 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl lg:hover:shadow-2xl hover:shadow-purple-600/20 cursor-pointer"
                  >
                    {/* BOTÃO DE FAVORITO - AGORA NO TOPO DIREITO */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(j.id)
                      }}
                      className="absolute top-2 lg:top-3 right-2 lg:right-3 z-20 bg-black/70 backdrop-blur p-1 rounded-full border border-zinc-700 hover:bg-pink-600/20 transition-all"
                    >
                      <Star 
                        className={cn(
                          "w-3 h-3 lg:w-3 lg:h-3 transition-all",
                          favoritePlayers.includes(j.id) 
                            ? "fill-yellow-400 text-yellow-400" 
                            : "text-zinc-400 hover:text-yellow-400"
                        )} 
                      />
                    </button>

                    {userRole === 'admin' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditPlayer(j)
                        }}
                        className="absolute top-2 lg:top-3 left-2 lg:left-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800/90 hover:bg-purple-600 p-1.5 rounded-full backdrop-blur"
                      >
                        <Pencil className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                      </button>
                    )}

                    <div className="relative h-40 lg:h-52 bg-zinc-800">
                      {j.photo_url ? (
                        <img
                          src={j.photo_url}
                          alt={j.name}
                          className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-zinc-700">
                          <span className="text-4xl lg:text-6xl font-black text-zinc-500 opacity-70">{j.position}</span>
                        </div>
                      )}

                      <div className="absolute top-2 lg:top-3 left-2 lg:left-3 bg-black/70 backdrop-blur px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg border border-zinc-700 flex flex-col items-center">
                        <span className="text-2xl lg:text-3xl font-black text-yellow-400">{j.overall}</span>
                        <span className="text-[8px] lg:text-[10px] text-zinc-300 -mt-1">OVR</span>
                      </div>
                    </div>

                    <div className="p-3 lg:p-4 space-y-2 lg:space-y-3">
                      <h3 className="font-bold text-base lg:text-lg text-center leading-tight line-clamp-2">{j.name}</h3>

                      <div className="flex justify-center">
                        <Badge className="bg-purple-600 text-white text-xs font-bold px-3 lg:px-4 py-1 lg:py-1.5">{j.position}</Badge>
                      </div>

                      <p className="text-xs text-zinc-400 text-center">{j.playstyle || 'Nenhum'}</p>

                      <div className="flex items-center justify-center gap-2 lg:gap-2.5 mt-1">
                        {j.logo_url ? (
                          <img
                            src={j.logo_url}
                            alt={j.club}
                            className="w-6 h-6 lg:w-7 lg:h-7 object-contain rounded-full ring-2 ring-zinc-700"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                          />
                        ) : (
                          <div className="w-6 h-6 lg:w-7 lg:h-7 bg-zinc-700 rounded-full" />
                        )}

                        <p className="text-xs lg:text-sm text-zinc-300 truncate max-w-[120px] lg:max-w-[150px] text-center">{j.club}</p>
                      </div>

                      <p className="text-center text-lg lg:text-xl font-black text-emerald-400 mt-1 lg:mt-2">
                        {formatBasePrice(j.base_price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* LIST VIEW */}
            {viewMode === 'list' && !loading && filteredPlayers.length > 0 && (
              <div className="space-y-4 lg:space-y-6">
                {filteredPlayers.map(j => {
                  const isOpen = openedPlayers.includes(j.id)

                  return (
                    <div
                      key={j.id}
                      id={`player-${j.id}`}
                      className="bg-zinc-900/70 backdrop-blur border border-zinc-800 rounded-xl lg:rounded-2xl overflow-hidden transition-all hover:border-purple-500/70 hover:shadow-lg lg:hover:shadow-xl hover:shadow-purple-600/20"
                    >
                      {/* Linha principal - CORREÇÃO: Estrutura flex para manter tudo na mesma linha */}
                      <div
                        className="p-4 lg:p-6 flex items-center gap-4 lg:gap-6 cursor-pointer select-none"
                        onClick={() => !isTransitioning && togglePlayer(j.id)}
                      >
                        {/* Foto do jogador */}
                        <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full overflow-hidden ring-3 lg:ring-4 ring-purple-500/50 flex-shrink-0">
                          {j.photo_url ? (
                            <img src={j.photo_url} alt={j.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-700 to-pink-700 flex items-center justify-center">
                              <span className="text-xl lg:text-2xl font-black text-white">{j.position}</span>
                            </div>
                          )}
                        </div>

                        {/* Informações principais - CORREÇÃO: Grid responsivo para manter tudo na mesma linha */}
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-8 gap-3 lg:gap-4 text-xs lg:text-sm items-center">
                          {/* Nome e Playstyle */}
                          <div className="md:col-span-2">
                            <p className="font-bold text-base lg:text-lg leading-tight">{j.name}</p>
                            <p className="text-zinc-400 text-xs lg:text-sm mt-1 line-clamp-1">{j.playstyle || 'Nenhum estilo de jogo'}</p>
                          </div>
                          
                          {/* Posição */}
                          <div className="flex flex-col">
                            <p className="text-zinc-500 text-xs">Posição</p>
                            <Badge className="bg-purple-600 text-xs mt-1 w-fit">{j.position}</Badge>
                          </div>
                          
                          {/* Clube - CORREÇÃO: Agora mostra o nome completo */}
                          <div className="flex flex-col">
                            <p className="text-zinc-500 text-xs">Clube</p>
                            <div className="flex items-center gap-2 mt-1">
                              {renderClubLogo(j.logo_url, j.club)}
                              <span className="text-xs lg:text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px] lg:max-w-[120px]">
                                {j.club}
                              </span>
                            </div>
                          </div>
                          
                          {/* Overall */}
                          <div className="flex flex-col items-center">
                            <p className="text-zinc-500 text-xs">Overall</p>
                            <p className="text-2xl lg:text-3xl font-black bg-gradient-to-r from-yellow-400 to-red-600 bg-clip-text text-transparent leading-none mt-1">
                              {j.overall}
                            </p>
                          </div>
                          
                          {/* Botão de Favorito - CORREÇÃO: Diminuído e alinhado */}
                          <div className="flex flex-col items-center justify-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleFavorite(j.id)
                              }}
                              className="bg-black/70 backdrop-blur p-1.5 rounded-full border border-zinc-700 hover:bg-pink-600/20 transition-all mb-1"
                            >
                              <Star 
                                className={cn(
                                  "w-3 h-3 lg:w-3.5 lg:h-3.5 transition-all",
                                  favoritePlayers.includes(j.id) 
                                    ? "fill-yellow-400 text-yellow-400" 
                                    : "text-zinc-400 hover:text-yellow-400"
                                )} 
                              />
                            </button>
                            <span className="text-xs text-zinc-500 text-center hidden md:block">
                              {favoritePlayers.includes(j.id) ? 'Favorito' : 'Favoritar'}
                            </span>
                          </div>

                          {/* Valor Base - CORREÇÃO: Formatado com a nova função */}
                          <div className="flex flex-col items-end">
                            <p className="text-zinc-500 text-right text-xs">Valor Base</p>
                            <p className="text-emerald-400 font-bold text-sm lg:text-base whitespace-nowrap leading-tight">
                              {formatBasePrice(j.base_price)}
                            </p>
                          </div>
                          
                          {/* Botão de Edição e Seta - CORREÇÃO: Agora em linha e alinhados */}
                          <div className="flex items-center justify-end gap-2 lg:gap-2">
                            {userRole === 'admin' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openEditPlayer(j)
                                }}
                                className="hover:bg-purple-600/20 p-1.5 h-7 w-7 min-w-0"
                              >
                                <Pencil className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                              </Button>
                            )}

                            <ChevronDown
                              className={cn(
                                "w-4 h-4 lg:w-4 lg:h-4 text-zinc-400 transition-transform duration-300 flex-shrink-0",
                                isOpen && "rotate-180 text-purple-400"
                              )}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Detalhes expandidos */}
                      {isOpen && (
                        <div className="border-t border-zinc-800 bg-zinc-900/50 px-4 lg:px-6 py-4 lg:py-6">
                          <div className="space-y-4 lg:space-y-6">
                            {/* Linha 1: básicos - Altura na mesma linha da idade */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6 text-xs lg:text-sm">
                              <div>
                                <span className="text-zinc-500">Idade:</span> <strong>{j.age ?? '-'}</strong>
                              </div>
                              <div>
                                <span className="text-zinc-500 flex items-center gap-2">
                                  <Ruler className="w-3 h-3 lg:w-4 lg:h-4" />
                                  Altura: <strong className="ml-1 lg:ml-2">{formatHeight(j.height)}</strong>
                                </span> 
                              </div>
                              <div>
                                <span className="text-zinc-500">Nacionalidade:</span> <strong>{j.nationality}</strong>
                              </div>
                              <div>
                                <span className="text-zinc-500">Pé:</span> <strong>{j.preferred_foot}</strong>
                              </div>
                            </div>

                            {/* Posições alternativas (APENAS QUANDO EXPANDIDO) */}
                            {j.alternative_positions && j.alternative_positions.length > 0 && (
                              <div>
                                <p className="text-zinc-500 font-medium mb-2">Posições Alternativas:</p>
                                <div className="flex gap-2 flex-wrap">
                                  {j.alternative_positions.map(p => (
                                    <Badge key={p} className="bg-red-600/20 text-red-300 border-red-600/40 text-xs">{p}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Atributos */}
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-x-4 lg:gap-x-6 gap-y-3 lg:gap-y-4 text-xs">
                              {[
                                { k: 'offensive_talent', l: 'Tal. Ofensivo' },
                                { k: 'ball_control', l: 'Controle de bola' },
                                { k: 'dribbling', l: 'Drible' },
                                { k: 'tight_possession', l: 'Condução Firme' },
                                { k: 'low_pass', l: 'Passe rasteiro' },
                                { k: 'lofted_pass', l: 'Passe Alto' },
                                { k: 'finishing', l: 'Finalização' },
                                { k: 'heading', l: 'Cabeceio' },
                                { k: 'place_kicking', l: 'Chute colocado' },
                                { k: 'curl', l: 'Curva' },
                                { k: 'speed', l: 'Velocidade' },
                                { k: 'acceleration', l: 'Aceleração' },
                                { k: 'kicking_power', l: 'Força do chute' },
                                { k: 'jump', l: 'Impulsão' },
                                { k: 'physical_contact', l: 'Contato Físico' },
                                { k: 'balance', l: 'Equilíbrio' },
                                { k: 'stamina', l: 'Resistência' },
                                { k: 'defensive_awareness', l: 'Talento defensivo' },
                                { k: 'ball_winning', l: 'Desarme' },
                                { k: 'aggression', l: 'Agressividade' },
                                { k: 'gk_awareness', l: 'Talento de GO' },
                                { k: 'gk_catching', l: 'Firmeza de GO' },
                                { k: 'gk_clearing', l: 'Afast. de bola de GO' },
                                { k: 'gk_reflexes', l: 'Reflexos de GO' },
                                { k: 'gk_reach', l: 'Alcance de GO' },
                              ].map(({ k, l }) => {
                                const value = j[k as keyof Player] as number | null
                                const display = (value ?? 40)
                                const color = getAttrColorHex(display)
                                return (
                                  <div key={k} className="text-center">
                                    <p className="text-zinc-500 font-medium text-xs">{l}</p>
                                    <p className="text-lg lg:text-xl font-black" style={{ color }}>{display}</p>
                                  </div>
                                )
                              })}
                            </div>

                            {/* Pé fraco, Frequência, Forma física e Resistência a Lesão */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 lg:gap-6 text-xs lg:text-sm items-center">
                              <div>
                                <p className="text-zinc-500">Pé Fraco (Uso)</p>
                                <div className="flex items-center gap-2 lg:gap-3">
                                  <LevelBars value={j.weak_foot_usage ?? 0} max={4} size="sm" />
                                  <span className="font-bold">{j.weak_foot_usage ?? '-'}</span>
                                </div>
                              </div>

                              <div>
                                <p className="text-zinc-500">Pé Fraco (Precisão)</p>
                                <div className="flex items-center gap-2 lg:gap-3">
                                  <LevelBars value={j.weak_foot_accuracy ?? 0} max={4} size="sm" />
                                  <span className="font-bold">{j.weak_foot_accuracy ?? '-'}</span>
                                </div>
                              </div>

                              <div>
                                <p className="text-zinc-500">Forma Física</p>
                                <div className="flex items-center gap-2 lg:gap-3">
                                  <LevelBars value={j.form ?? 0} max={8} size="md" />
                                  <span className="font-bold">{j.form ?? '-'}</span>
                                </div>
                              </div>

                              <div>
                                <p className="text-zinc-500">Resistência a Lesão</p>
                                <div className="flex items-center gap-2 lg:gap-3">
                                  <LevelBars value={j.injury_resistance ?? 0} max={3} size="sm" />
                                  <span className="font-bold">{j.injury_resistance ?? '-'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Inspirador */}
                            <div>
                              <p className="text-zinc-500 font-medium mb-2">Inspirador</p>
                              <div className="flex items-center gap-4 lg:gap-6">
                                <div className="text-xs lg:text-sm">
                                  <div className="text-zinc-400">Carregando</div>
                                  <div className="flex gap-1 mt-1">
                                    {Array.from({ length: 2 }).map((_, idx) => {
                                      const filled = (j.inspiring_ball_carry ?? 0) > idx
                                      return <Star key={idx} className={cn("w-3 h-3 lg:w-4 lg:h-4", filled ? "fill-yellow-400 text-yellow-400" : "text-zinc-600")} />
                                    })}
                                  </div>
                                </div>

                                <div className="text-xs lg:text-sm">
                                  <div className="text-zinc-400">Passe Rasteiro</div>
                                  <div className="flex gap-1 mt-1">
                                    {Array.from({ length: 2 }).map((_, idx) => {
                                      const filled = (j.inspiring_low_pass ?? 0) > idx
                                      return <Star key={idx} className={cn("w-3 h-3 lg:w-4 lg:h-4", filled ? "fill-yellow-400 text-yellow-400" : "text-zinc-600")} />
                                    })}
                                  </div>
                                </div>

                                <div className="text-xs lg:text-sm">
                                  <div className="text-zinc-400">Passe Alto</div>
                                  <div className="flex gap-1 mt-1">
                                    {Array.from({ length: 2 }).map((_, idx) => {
                                      const filled = (j.inspiring_lofted_pass ?? 0) > idx
                                      return <Star key={idx} className={cn("w-3 h-3 lg:w-4 lg:h-4", filled ? "fill-yellow-400 text-yellow-400" : "text-zinc-600")} />
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Habilidades especiais */}
                            {j.skills && j.skills.length > 0 && (
                              <div>
                                <p className="text-zinc-400 font-medium mb-2">Habilidades Especiais</p>
                                <div className="flex flex-wrap gap-2">
                                  {j.skills.map(s => (
                                    <Badge key={s} className="bg-purple-600/20 text-purple-300 border-purple-600/40 text-xs">{s}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

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
          {showFavoriteToast && (
            <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-xl shadow-2xl border border-white/10 backdrop-blur-xl animate-in slide-in-from-right-8 duration-300">
              <div className="flex items-center gap-3">
                <Star className={cn(
                  "w-5 h-5",
                  toastMessage.includes('adicionado') ? "fill-yellow-400 text-yellow-400" : "text-white"
                )} />
                <div>
                  <p className="font-bold text-sm">{toastMessage}</p>
                  <p className="text-purple-200 text-xs mt-1">
                    {toastMessage.includes('adicionado') 
                      ? 'Agora ele aparece na aba "Favoritos" do seu elenco!' 
                      : 'Ele foi removido da sua lista de favoritos.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
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