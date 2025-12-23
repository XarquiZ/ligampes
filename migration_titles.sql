-- 1. Adicionar coluna de títulos na tabela players
ALTER TABLE public.players 
ADD COLUMN IF NOT EXISTS titles text[] DEFAULT '{}'::text[];

-- 2. Atualizar jogadores do Criciúma (exceto Roger Guedes)
UPDATE public.players
SET titles = array_append(array_append(titles, 'MPES Temporada 1'), 'Copa MPES temporada 1')
WHERE team_id = 'f7b8245a-6987-49b5-a938-67f28625510a'
AND name NOT ILIKE '%Roger Guedes%';
