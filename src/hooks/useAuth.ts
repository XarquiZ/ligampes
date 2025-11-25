const signIn = async () => {
  try {
    console.log('[Login] Iniciando OAuth...');
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
        skipBrowserRedirect: false, // Garante que redireciona
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });

    if (error) {
      console.error('[Login] Erro do Supabase:', error);
      throw error;
    }

    console.log('[Login] OAuth iniciado com sucesso:', data);
    
  } catch (error) {
    console.error('[Login] Erro no login:', error);
    throw error;
  }
};