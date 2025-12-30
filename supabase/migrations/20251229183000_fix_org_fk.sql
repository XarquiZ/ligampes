-- ============================================================================
-- FIX: CORRIGIR FOREIGN KEY DA TABELA ORGANIZATIONS
-- ============================================================================

-- O erro "Key is not present in table 'users'" sugere que a FK está apontando
-- para uma tabela errada (possivelmente public.users) ou que a tabela foi criada
-- com a referência incorreta. Vamos recriar a constraint explicitamente apontando
-- para auth.users.

DO $$
BEGIN
    -- 1. Tentar remover a constraint antiga (se existir)
    BEGIN
        ALTER TABLE public.organizations
        DROP CONSTRAINT IF EXISTS organizations_owner_id_fkey;
    EXCEPTION
        WHEN OTHERS THEN
            NULL; -- Ignora erro se não existir
    END;

    -- 2. Adicionar a constraint correta apontando para auth.users
    ALTER TABLE public.organizations
    ADD CONSTRAINT organizations_owner_id_fkey
    FOREIGN KEY (owner_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

END $$;
