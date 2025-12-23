-- 1. Adicionar coluna de títulos individuais
ALTER TABLE public.players 
ADD COLUMN IF NOT EXISTS individual_titles text[] DEFAULT '{}'::text[];

-- 2. Atualizar Anderson Talisca (Craque e Garçom)
UPDATE public.players
SET individual_titles = array_append(array_append(individual_titles, 'Craque da Liga - Temporada 1'), 'Garçom da Liga - Temporada 1')
WHERE name ILIKE '%Anderson Talisca%';

-- 3. Atualizar Rondón (Artilheiro)
UPDATE public.players
SET individual_titles = array_append(individual_titles, 'Artilheiro - Temporada 1')
WHERE name ILIKE '%Rondón%';

-- 4. Atualizar Joelinton (Artilheiro)
UPDATE public.players
SET individual_titles = array_append(individual_titles, 'Artilheiro - Temporada 1')
WHERE name ILIKE '%Joelinton%';
