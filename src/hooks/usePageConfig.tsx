import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Scissors,
  UserCog,
  Clock,
  MessageSquare,
  Lock,
  Home,
  Calendar
} from 'lucide-react';

interface PageConfig {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
}

const PAGE_CONFIGS: Record<string, PageConfig> = {
  '/dashboard': {
    title: 'Dashboard',
    subtitle: 'Visão geral dos seus agendamentos e estatísticas',
    icon: <LayoutDashboard className="w-6 h-6" />
  },
  '/servicos': {
    title: 'Serviços',
    subtitle: 'Gerencie os serviços oferecidos pela barbearia',
    icon: <Scissors className="w-6 h-6" />
  },
  '/register': {
    title: 'Barbeiros',
    subtitle: 'Cadastre e gerencie os barbeiros da equipe',
    icon: <UserCog className="w-6 h-6" />
  },
  '/gerenciar-horarios': {
    title: 'Horários',
    subtitle: 'Gerencie sua agenda, horários e agendamentos',
    icon: <Clock className="w-6 h-6" />
  },
  '/gerenciar-comentarios': {
    title: 'Comentários',
    subtitle: 'Modere e gerencie os comentários dos clientes',
    icon: <MessageSquare className="w-6 h-6" />
  },
  '/trocar-senha': {
    title: 'Alterar Senha',
    subtitle: 'Mantenha sua conta segura com uma nova senha',
    icon: <Lock className="w-6 h-6" />
  },
  '/': {
    title: 'Site Principal',
    subtitle: 'Voltar para o site da barbearia',
    icon: <Home className="w-6 h-6" />
  }
};

export const usePageConfig = (): PageConfig => {
  const location = useLocation();
  
  return useMemo(() => {
    const config = PAGE_CONFIGS[location.pathname];
    
    if (config) {
      return config;
    }
    
    // Fallback para páginas não mapeadas
    return {
      title: 'Página',
      subtitle: 'Gerencie suas informações',
      icon: <LayoutDashboard className="w-6 h-6" />
    };
  }, [location.pathname]);
};

export default usePageConfig;