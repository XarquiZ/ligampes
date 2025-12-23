export interface TeamColor {
    primary: string
    secondary: string
    accent: string
    text?: string // useful if background is light/dark
}

export const TEAM_COLORS: Record<string, TeamColor> = {
    // Cruzeiro EC
    '2fff62e9-3db1-4737-9535-f13944e50502': { primary: '#003399', secondary: '#FFFFFF', accent: '#C0C0C0' },
    // Criciúma EC
    'f7b8245a-6987-49b5-a938-67f28625510a': { primary: '#FDD116', secondary: '#000000', accent: '#FFFFFF' },
    // Santos FC
    '23917fd5-2e60-4eb6-a02b-064e80664a9f': { primary: '#000000', secondary: '#FFFFFF', accent: '#808080' },
    // CR Flamengo
    '195a7fea-468e-4c24-aef0-142f83b773c6': { primary: '#E30613', secondary: '#000000', accent: '#FFFFFF' },
    // Sport Club do Recife
    'f24484b6-b51a-4c4c-b59f-964b8818381e': { primary: '#D32E2E', secondary: '#000000', accent: '#FFD700' },
    // Dispensados
    '9c28fe14-792a-416d-877b-e710a89554d7': { primary: '#757575', secondary: '#FFFFFF', accent: '#CCCCCC' },
    // Ceará SC
    'e4a654f2-787b-4679-9f0d-a525f9de81ca': { primary: '#000000', secondary: '#FFFFFF', accent: '#333333' },
    // Botafogo FR
    '033edd63-d062-40ee-9cbb-b7c5f3dcc5a5': { primary: '#000000', secondary: '#FFFFFF', accent: '#CCCCCC' },
    // SC Internacional
    '6d08aa1f-e374-4cde-b893-8b5391b7af33': { primary: '#E20E0E', secondary: '#FFFFFF', accent: '#F5F5F5' },
    // Club Athletico Paranaense
    '84b83d51-c0cc-434c-bc9a-c3dbba4f87b1': { primary: '#E8111E', secondary: '#000000', accent: '#FFFFFF' },
    // CR Vasco da Gama
    '859f9f1d-0419-4263-acd7-2755869f9e8f': { primary: '#000000', secondary: '#FFFFFF', accent: '#ED1C24' },
    // São Paulo FC
    '30a0458e-73b1-43c1-a78c-28335062dbf3': { primary: '#FF0000', secondary: '#000000', accent: '#FFFFFF' },
    // Cuiabá EC
    '3dfc84e8-79c3-44e9-a130-b3d0269a0335': { primary: '#014225', secondary: '#F9BE00', accent: '#FFFFFF' },
    // Grêmio FBPA
    '128427ed-2f3b-4e2b-a9e2-048065079a98': { primary: '#0D80BF', secondary: '#000000', accent: '#FFFFFF' },
    // América FC
    'aa68e687-add5-4404-8f5e-a29c15f3bab8': { primary: '#008248', secondary: '#000000', accent: '#FFFFFF' },
    // Fortaleza EC
    'f73bd3b2-4cfe-4dc3-9b71-967e3a8ee543': { primary: '#005595', secondary: '#E40521', accent: '#FFFFFF' },
    // Clube do Remo
    'da011f85-1b21-4756-8bb4-62f06ab72e97': { primary: '#001A31', secondary: '#FFFFFF', accent: '#FFFFFF' },
    // A.A. Ponte Preta
    '3325abc7-990f-4832-8aee-5e5d4ca8b8f8': { primary: '#000000', secondary: '#FFFFFF', accent: '#FFFFFF' },
    // Clube Atlético Mineiro
    '0d940299-5604-4d30-9487-044219c2b6e1': { primary: '#000000', secondary: '#FFFFFF', accent: '#FFFFFF' },
    // SC Corinthians Paulista
    '934ceaf3-0b52-4078-b82e-61970392f94a': { primary: '#000000', secondary: '#FFFFFF', accent: '#FFFFFF' },
    // EC Juventude
    '60de6026-ee20-4de1-9677-30b2df858409': { primary: '#006A32', secondary: '#FFFFFF', accent: '#FFFFFF' }, // Usando Verde Bandeira aprox
    // Mirassol FC
    '44811d95-4aab-481c-a625-c9692cc2b2d8': { primary: '#FDD116', secondary: '#00FF00', accent: '#FFFFFF' }, // Amarelo e Verde Lima aprox
    // SE Palmeiras
    '0e13a6b7-1009-4885-a895-ed67dd5ad30b': { primary: '#006437', secondary: '#FFFFFF', accent: '#B3D235' },
    // Fluminense FC
    'e6887a57-03b1-4e00-80c4-dcf0be6afcd9': { primary: '#830B10', secondary: '#006642', accent: '#FFFFFF' },
    // EC Vitória
    '3ee8678a-5933-45e8-807d-ab102d257771': { primary: '#FF0000', secondary: '#000000', accent: '#FFFFFF' },
    // Paysandu SC
    '5a828567-c1ad-4fdb-8c96-b71a7d1f0a5e': { primary: '#00AEEF', secondary: '#FFFFFF', accent: '#FFFFFF' },
    // Goiás EC
    '93b48443-b756-4397-abd5-f5f309341980': { primary: '#006A32', secondary: '#FFFFFF', accent: '#FFFFFF' },
    // Coritiba Foot Ball Club
    'e82927ce-9cff-43ea-bac2-b310708691a2': { primary: '#008041', secondary: '#FFFFFF', accent: '#FFFFFF' },
    // EC Bahia
    '799d178c-5fed-4b7e-987d-3d4bc0d7ae13': { primary: '#005CAB', secondary: '#E20E0E', accent: '#FFFFFF' },
    // Grêmio Novorizontino
    'c3b81302-6b1e-44a3-b175-f3f02b9806ad': { primary: '#FFD700', secondary: '#000000', accent: '#FFFFFF' },
    // Red Bull Bragantino
    'fb9285a8-7bfe-4e01-b725-2193c3e161fa': { primary: '#ED1C24', secondary: '#FFFFFF', accent: '#231F20' },
}

// Fallback color
export const DEFAULT_TEAM_COLOR: TeamColor = {
    primary: '#18181b', // zinc-900
    secondary: '#27272a', // zinc-800
    accent: '#a855f7' // purple-500
} 
