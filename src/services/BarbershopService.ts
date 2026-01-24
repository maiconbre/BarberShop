// Interfaces para tipagem
export interface BarbershopRegistrationData {
  name: string;
  slug: string;
  ownerEmail: string;
  ownerName: string;
  ownerUsername: string;
  ownerPassword: string;
  planType?: 'free' | 'pro';
}

export interface BarbershopRegistrationResponse {
  success: boolean;
  message: string;
  data: {
    barbershop: {
      id: string;
      name: string;
      slug: string;
      planType: string;
      settings: Record<string, unknown>;
    };
    user: {
      id: string;
      username: string;
      role: string;
      name: string;
      barbershopId: string;
    };
    token: string;
    refreshToken: string;
  };
}

export interface SlugCheckResponse {
  success: boolean;
  available: boolean;
  slug: string;
  message: string;
}

export interface BarbershopData {
  id: string;
  tenantId?: string;
  name: string;
  slug: string;
  ownerEmail: string;
  planType: string;
  settings: Record<string, unknown>;
  createdAt: string;
  description?: string;
  address?: string;
  phone?: string;
}

export interface BarbershopResponse {
  success: boolean;
  data: BarbershopData;
}

export interface EmailVerificationRequest {
  email: string;
  barbershopName: string;
}

export interface EmailVerificationResponse {
  success: boolean;
  message: string;
  data: {
    email: string;
    expiresIn: number; // seconds
  };
}

// Interfaces removidas - agora usamos magic link diretamente

/**
 * Iniciar processo de verificação de email usando Edge Function
 */
export const initiateEmailVerification = async (data: EmailVerificationRequest): Promise<EmailVerificationResponse> => {
  try {
    console.log('Iniciando verificação de email:', data.email);

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new Error('Formato de email inválido.');
    }

    const { supabase } = await import('../config/supabaseConfig');
    
    try {
      // Usar magic link do Supabase Auth diretamente (sem verificação prévia de usuário)
      const redirectUrl = `${window.location.origin}/register?email=${encodeURIComponent(data.email)}&barbershop=${encodeURIComponent(data.barbershopName)}&verified=true`;
      
      const { error } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            barbershop_name: data.barbershopName,
            verification_type: 'registration'
          }
        }
      });

      if (error) {
        console.error('Erro ao enviar magic link:', error);
        if (error.message.includes('rate limit')) {
          throw new Error('Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.');
        }
        throw new Error('Erro ao enviar link de verificação');
      }

      console.log('Magic link enviado para:', data.email);
      
      return {
        success: true,
        message: 'Link de verificação enviado para seu email. Clique no link para continuar o cadastro.',
        data: {
          email: data.email,
          expiresIn: 3600 // 1 hora
        }
      };

    } catch (error: unknown) {
      console.error('Erro ao iniciar verificação de email:', error);

      if (error instanceof Error) {
        // Re-throw known errors
        throw error;
      }

      // Handle unknown errors
      throw new Error('Erro interno do servidor');
    }

  } catch (error: unknown) {
    console.error('Erro ao iniciar verificação de email:', error);

    if (error instanceof Error) {
      // Re-throw known errors
      throw error;
    }

    throw new Error('Ocorreu um erro no servidor, tente mais tarde');
  }
};

// Função removida - agora usamos magic link diretamente

/**
 * Registrar nova barbearia
 * IMPORTANTE: Esta função garante que usuário e barbearia sejam criados em conjunto
 */
export const registerBarbershop = async (data: BarbershopRegistrationData): Promise<BarbershopRegistrationResponse> => {
  try {
    console.log('Registrando barbearia:', { name: data.name, slug: data.slug });

    const { supabase } = await import('../config/supabaseConfig');
    
    // ========================================
    // PASSO 1: Verificar se já existe barbearia ou usuário
    // ========================================
    
    // Verificar se o slug já existe
    const { data: existingBarbershop } = await supabase
      .from('Barbershops')
      .select('slug')
      .eq('slug', data.slug)
      .maybeSingle();

    if (existingBarbershop) {
      throw new Error('Este nome de barbearia já está em uso. Escolha outro nome.');
    }

    // Verificar se já existe usuário autenticado (para evitar criar duplicado)
    const { data: { user: existingUser } } = await supabase.auth.getUser();
    
    if (existingUser) {
      // Usuário já está autenticado, verificar se já tem barbearia
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('barbershop_id')
        .eq('id', existingUser.id)
        .maybeSingle();
      
      if (existingProfile?.barbershop_id) {
        throw new Error('Você já possui uma barbearia cadastrada. Um usuário pode ter apenas uma barbearia.');
      }
      
      console.log('Usuário já autenticado, pulando criação de conta');
    }

    // ========================================
    // PASSO 2: Criar usuário no Supabase Auth (se não existir)
    // ========================================
    
    let userId: string;
    let userEmail: string;
    let session = null;
    
    if (existingUser) {
      // Usuário já existe
      userId = existingUser.id;
      userEmail = existingUser.email || data.ownerEmail;
    } else {
      // Criar novo usuário
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.ownerEmail,
        password: data.ownerPassword,
        options: {
          data: {
            name: data.ownerName,
            username: data.ownerUsername
          }
        }
      });

      if (authError) {
        console.error('Erro ao criar usuário:', authError);
        if (authError.message.includes('already registered')) {
          throw new Error('Este email já está cadastrado. Use outro email ou faça login.');
        }
        throw new Error('Erro ao criar conta de usuário: ' + authError.message);
      }

      if (!authData.user) {
        throw new Error('Erro ao criar usuário');
      }

      userId = authData.user.id;
      userEmail = authData.user.email || data.ownerEmail;
      session = authData.session;
      
      console.log('Usuário criado com sucesso:', userId);
    }

    // ========================================
    // PASSO 3: Criar barbearia
    // ========================================
    
    const { data: barbershopData, error: barbershopError } = await supabase
      .from('Barbershops')
      .insert({
        name: data.name,
        slug: data.slug,
        owner_email: userEmail,
        plan_type: data.planType || 'free',
        settings: {},
        owner_id: userId
      })
      .select()
      .single();

    if (barbershopError) {
      console.error('Erro ao criar barbearia:', barbershopError);
      
      // Se falhou ao criar barbearia e acabamos de criar o usuário, tentar limpar
      if (!existingUser && userId) {
        console.warn('Tentando remover usuário criado devido a falha ao criar barbearia...');
        try {
          await supabase.auth.admin.deleteUser(userId);
        } catch (cleanupError) {
          console.error('Erro ao limpar usuário:', cleanupError);
        }
      }
      
      throw new Error('Erro ao registrar barbearia: ' + barbershopError.message);
    }

    console.log('Barbearia registrada com sucesso:', barbershopData.slug);

    // ========================================
    // PASSO 4: Criar/atualizar perfil do usuário com barbershop_id
    // ========================================
    
    console.log('Atualizando perfil do usuário com barbershop_id...');
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: userEmail,
        name: data.ownerName,
        username: data.ownerUsername,
        role: 'owner',
        barbershop_id: barbershopData.id,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('Erro ao atualizar perfil:', profileError);
      // Não lançar erro fatal aqui, pois o trigger pode já ter criado o perfil
      // Tentar novamente com UPDATE direto
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: data.ownerName,
          username: data.ownerUsername,
          role: 'owner',
          barbershop_id: barbershopData.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
        
      if (updateError) {
        console.error('Erro ao fazer update do perfil:', updateError);
        // Ainda assim não falhar, o importante é que a barbearia foi criada
      } else {
        console.log('Perfil atualizado com sucesso via UPDATE');
      }
    } else {
      console.log('Perfil criado/atualizado com sucesso');
    }
    
    // ========================================
    // PASSO 5: Retornar dados de sucesso
    // ========================================
    
    return {
      success: true,
      message: 'Barbearia registrada com sucesso',
      data: {
        barbershop: {
          id: barbershopData.id,
          name: barbershopData.name,
          slug: barbershopData.slug,
          planType: barbershopData.plan_type,
          settings: barbershopData.settings
        },
        user: {
          id: userId,
          username: data.ownerUsername,
          role: 'owner',
          name: data.ownerName,
          barbershopId: barbershopData.id
        },
        token: session?.access_token || '',
        refreshToken: session?.refresh_token || ''
      }
    };

  } catch (error: unknown) {
    console.error('Erro ao registrar barbearia:', error);

    if (error instanceof Error) {
      if (error.message.includes('429') || error.message.includes('rate limit')) {
        throw new Error('Limite de tentativas excedido. Aguarde alguns minutos e tente novamente.');
      }
      throw error;
    }

    throw new Error('Ocorreu um erro no servidor, tente mais tarde');
  }
};



/**
 * Verificar disponibilidade de slug
 */
export const checkSlugAvailability = async (slug: string): Promise<SlugCheckResponse> => {
  try {
    if (!slug || slug.trim().length === 0) {
      return {
        success: false,
        available: false,
        slug,
        message: 'Nome da barbearia é obrigatório'
      };
    }

    const { supabase } = await import('../config/supabaseConfig');
    
    // Verificar se o slug já existe na tabela Barbershops
    const { data: existingBarbershop, error } = await supabase
      .from('Barbershops')
      .select('slug')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      // Ignorar erro 406 (Not Acceptable) que pode ocorrer se o header Accept não bater com o retorno
      // Isso é um bug conhecido do PostgREST em alguns casos
      if (error.code === 'PGRST116' || error.message.includes('406')) {
         // Se deu erro 406, assumimos que não achou (ou falhou silenciosamente), 
         // mas por segurança vamos considerar INDISPONÍVEL para evitar duplicação se o erro for real
         // OU, se for PGRST116, é "No rows returned", o que significa DISPONÍVEL
         if (error.code === 'PGRST116') {
             return {
                success: true,
                available: true,
                slug,
                message: 'Slug disponível'
             };
         }
         
         console.warn('Erro 406/PGRST ao verificar slug, assumindo indisponível por precaução');
      }

      if (error.code !== 'PGRST116' && !error.message.includes('406')) {
        console.error('Erro ao verificar slug no Supabase:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
        });
        throw new Error(`Erro ao verificar disponibilidade do slug: ${error.message || 'Erro desconhecido'}`);
      }
    }

    const isAvailable = !existingBarbershop;
    
    return {
      success: true,
      available: isAvailable,
      slug,
      message: isAvailable ? 'Nome disponível!' : 'Este nome já está em uso. Escolha outro nome.'
    };

  } catch (error: unknown) {
    console.error('Erro ao verificar disponibilidade do slug:', error);

    let errorMessage = 'Erro ao verificar disponibilidade';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      available: false,
      slug,
      message: errorMessage
    };
  }
};

/**
 * Obter dados da barbearia pelo slug (público, não requer autenticação)
 */
export const getBarbershopBySlug = async (slug: string): Promise<BarbershopData> => {
  try {
    console.log('Buscando barbearia pelo slug:', slug);

    // Validar formato do slug
    const slugValidation = validateSlugFormat(slug);
    if (!slugValidation.valid) {
      throw new Error(`Slug inválido: ${slugValidation.message}`);
    }

    const { supabase } = await import('../config/supabaseConfig');
    
    const { data: barbershop, error } = await supabase
      .from('Barbershops')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !barbershop) {
      console.error('Erro ao buscar barbearia:', error);
      throw new Error('Barbearia não encontrada');
    }

    console.log('Barbearia encontrada:', barbershop.name);
    
    return {
      id: barbershop.id,
      tenantId: barbershop.tenant_id,
      name: barbershop.name,
      slug: barbershop.slug,
      ownerEmail: barbershop.owner_email,
      planType: barbershop.plan_type,
      settings: barbershop.settings || {},
      createdAt: barbershop.created_at,
      description: barbershop.description,
      address: barbershop.address,
      phone: barbershop.phone
    };

  } catch (error: unknown) {
    console.error('Erro ao buscar barbearia pelo slug:', error);

    if (error instanceof Error) {
      // Re-throw validation errors
      if (error.message.includes('Slug inválido')) {
        throw error;
      }
      
      // Handle not found errors
      if (error.message.includes('Barbearia não encontrada')) {
        throw error;
      }
      
      // Handle timeout errors
      if (error.message.includes('timeout')) {
        throw new Error('Tempo limite excedido. Verifique sua conexão e tente novamente.');
      }
      
      // Re-throw the error as-is if it's already user-friendly
      throw error;
    }

    // Para outros erros, usar mensagem amigável
    throw new Error('Ocorreu um erro no servidor, tente mais tarde');
  }
};

/**
 * Obter dados da barbearia atual (requer autenticação e tenant context)
 */
export const getCurrentBarbershop = async (): Promise<BarbershopData> => {
  try {
    const { supabase } = await import('../config/supabaseConfig');
    
    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('Usuário não autenticado');
    }

    // Buscar o perfil do usuário para obter o barbershop_id
    // Usando maybeSingle() em vez de single() para evitar erro 406 quando não há registros
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('barbershop_id')
      .eq('id', user.id)
      .maybeSingle();

    // Self-healing: Se o perfil não for encontrado, tentar recuperar
    if (!profile || profileError) {
      console.warn('Perfil não encontrado, tentando recuperação automática...', profileError);
      
      // Tentar encontrar uma barbearia onde este usuário é o dono
      // Usando maybeSingle() para evitar erro 406
      const { data: ownedBarbershop } = await supabase
        .from('Barbershops')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();
        
      if (ownedBarbershop) {
        console.log('Barbearia encontrada para o usuário, recriando perfil...');
        
        // Recriar o perfil
        const { error: createProfileError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || 'Admin',
            username: user.user_metadata?.username || user.email?.split('@')[0],
            role: 'owner',
            barbershop_id: ownedBarbershop.id,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });
          
        if (!createProfileError) {
          console.log('Perfil recriado com sucesso!');
          // Tentar buscar novamente
          const { data: newProfile } = await supabase
            .from('profiles')
            .select('barbershop_id')
            .eq('id', user.id)
            .maybeSingle();
            
          if (newProfile) {
            profile = newProfile;
            profileError = null;
          }
        } else {
          console.error('Falha ao recriar perfil:', createProfileError);
        }
      }
    }

    if (!profile?.barbershop_id) {
      console.warn('Usuário não possui barbearia associada');
      throw new Error('Usuário não possui barbearia associada');
    }

    // Buscar os dados da barbearia
    const { data: barbershop, error: barbershopError } = await supabase
      .from('Barbershops')
      .select('*')
      .eq('id', profile.barbershop_id)
      .single();

    if (barbershopError || !barbershop) {
      throw new Error('Barbearia não encontrada');
    }

    return {
      id: barbershop.id,
      tenantId: barbershop.tenant_id,
      name: barbershop.name,
      slug: barbershop.slug,
      ownerEmail: barbershop.owner_email,
      planType: barbershop.plan_type,
      settings: barbershop.settings || {},
      createdAt: barbershop.created_at,
      description: barbershop.description,
      address: barbershop.address,
      phone: barbershop.phone
    };

  } catch (error: unknown) {
    console.error('Erro ao obter barbearia atual:', error);

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Erro ao obter dados da barbearia');
  }
};

/**
 * Gerar slug a partir do nome da barbearia
 */
export const generateSlugFromName = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD') // Normalizar caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiais
    .replace(/\s+/g, '-') // Substituir espaços por hífens
    .replace(/-+/g, '-') // Remover hífens duplicados
    .replace(/^-|-$/g, ''); // Remover hífens do início e fim
};

/**
 * Validar formato de slug
 */
export const validateSlugFormat = (slug: string): { valid: boolean; message: string } => {
  if (!slug || slug.trim().length === 0) {
    return { valid: false, message: 'Nome da barbearia é obrigatório' };
  }

  if (slug.length < 3) {
    return { valid: false, message: 'Nome deve ter pelo menos 3 caracteres' };
  }

  if (slug.length > 50) {
    return { valid: false, message: 'Nome deve ter no máximo 50 caracteres' };
  }

  const slugRegex = /^[a-z0-9-]+$/;
  if (!slugRegex.test(slug)) {
    return { valid: false, message: 'Nome deve conter apenas letras minúsculas, números e hífens' };
  }

  if (slug.startsWith('-') || slug.endsWith('-')) {
    return { valid: false, message: 'Nome não pode começar ou terminar com hífen' };
  }

  if (slug.includes('--')) {
    return { valid: false, message: 'Nome não pode conter hífens consecutivos' };
  }

  return { valid: true, message: 'Nome válido' };
};