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
 */
export const registerBarbershop = async (data: BarbershopRegistrationData): Promise<BarbershopRegistrationResponse> => {
  try {
    console.log('Registrando barbearia:', { name: data.name, slug: data.slug });

    const { supabase } = await import('../config/supabaseConfig');
    
    // Verificar se o slug já existe
    const { data: existingBarbershop } = await supabase
      .from('Barbershops')
      .select('slug')
      .eq('slug', data.slug)
      .single();

    if (existingBarbershop) {
      throw new Error('Este nome de barbearia já está em uso. Escolha outro nome.');
    }

    // Criar usuário no Supabase Auth
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
        throw new Error('Este email já está cadastrado. Use outro email.');
      }
      throw new Error('Erro ao criar conta de usuário');
    }

    if (!authData.user) {
      throw new Error('Erro ao criar usuário');
    }

    // Criar barbearia na tabela
    const { data: barbershopData, error: barbershopError } = await supabase
      .from('Barbershops')
      .insert({
        name: data.name,
        slug: data.slug,
        owner_email: data.ownerEmail,
        plan_type: data.planType || 'free',
        settings: {},
        owner_id: authData.user.id
      })
      .select()
      .single();

    if (barbershopError) {
      console.error('Erro ao criar barbearia:', barbershopError);
      // Se falhou ao criar barbearia, tentar deletar o usuário criado para manter consistência
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new Error('Erro ao registrar barbearia: ' + barbershopError.message);
    }

    console.log('Barbearia registrada com sucesso:', barbershopData.slug);

    // Criar ou atualizar o perfil do usuário explicitamente
    console.log('Criando perfil do usuário...');
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: data.ownerEmail,
        name: data.ownerName,
        username: data.ownerUsername, // Assumindo que a coluna existe baseada no input
        role: 'owner',
        barbershop_id: barbershopData.id,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('Erro ao criar perfil:', profileError);
      // Não lançar erro fatal aqui para não bloquear o fluxo, mas logar
      // O login pode falhar se o perfil não existir, mas o registro da barbearia foi feito
    } else {
      console.log('Perfil criado/atualizado com sucesso');
    }
    
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
          id: authData.user.id,
          username: data.ownerUsername,
          role: 'owner',
          name: data.ownerName,
          barbershopId: barbershopData.id
        },
        token: authData.session?.access_token || '',
        refreshToken: authData.session?.refresh_token || ''
      }
    };

  } catch (error: unknown) {
    console.error('Erro ao registrar barbearia:', error);

    if (error instanceof Error) {
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
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Erro ao verificar slug no Supabase:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw new Error(`Erro ao verificar disponibilidade do slug: ${error.message || 'Erro desconhecido'}`);
    }

    const isAvailable = !existingBarbershop;
    
    return {
      success: true,
      available: isAvailable,
      slug,
      message: isAvailable ? 'Slug disponível' : 'Este nome já está em uso. Escolha outro nome.'
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
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('barbershop_id')
      .eq('id', user.id)
      .single();

    // Self-healing: Se o perfil não for encontrado, tentar recuperar
    if (profileError) {
      console.warn('Perfil não encontrado, tentando recuperação automática...', profileError);
      
      // Tentar encontrar uma barbearia onde este usuário é o dono
      const { data: ownedBarbershop } = await supabase
        .from('Barbershops')
        .select('id')
        .eq('owner_id', user.id)
        .single();
        
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
            .single();
            
          if (newProfile) {
            profile = newProfile;
            profileError = null;
          }
        } else {
          console.error('Falha ao recriar perfil:', createProfileError);
        }
      }
    }

    if (profileError || !profile?.barbershop_id) {
      console.error('Falha final ao obter perfil:', profileError);
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