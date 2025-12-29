-- ============================================================================
-- FIX: PERMITIR LEITURA PÚBLICA DE ORGANIZAÇÕES
-- ============================================================================

-- Sem essa policy, o layout.tsx não consegue ler os dados da liga (slug, cores)
-- e retorna 404 (NotFound) porque o RLS bloqueia tudo por padrão.

CREATE POLICY "Public Organizations Access" 
ON public.organizations 
FOR SELECT 
USING (true);

-- Permite verificar membros (necessário para login/auth)
CREATE POLICY "Public Members Access" 
ON public.organization_members 
FOR SELECT 
USING (true);
