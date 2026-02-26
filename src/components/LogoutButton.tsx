import React from 'react';
import { LogOut, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabaseConfig';

interface LogoutButtonProps {
    variant?: 'default' | 'icon' | 'text';
    redirectTo?: string;
    className?: string;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({
    variant = 'default',
    redirectTo = '/login',
    className = ''
}) => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = React.useState(false);

    const handleLogout = async () => {
        try {
            setIsLoading(true);

            // Fazer logout no Supabase
            const { error } = await supabase.auth.signOut();

            if (error) {
                console.error('Erro ao fazer logout:', error);
                throw error;
            }

            // Limpar localStorage
            localStorage.removeItem('barbershopId');
            localStorage.removeItem('barbershopSlug');
            localStorage.removeItem('current_barbershop_id');
            localStorage.removeItem('current_barbershop_slug');

            console.log('Logout realizado com sucesso');

            // Redirecionar
            navigate(redirectTo, { replace: true });
        } catch (error) {
            console.error('Erro no logout:', error);
            // Mesmo com erro, redirecionar
            navigate(redirectTo, { replace: true });
        } finally {
            setIsLoading(false);
        }
    };

    // Variante apenas ícone
    if (variant === 'icon') {
        return (
            <button
                onClick={handleLogout}
                disabled={isLoading}
                className={`p-2 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50 ${className}`}
                title="Sair"
            >
                {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <LogOut className="w-5 h-5" />
                )}
            </button>
        );
    }

    // Variante apenas texto
    if (variant === 'text') {
        return (
            <button
                onClick={handleLogout}
                disabled={isLoading}
                className={`flex items-center space-x-2 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50 ${className}`}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saindo...</span>
                    </>
                ) : (
                    <>
                        <LogOut className="w-4 h-4" />
                        <span>Sair</span>
                    </>
                )}
            </button>
        );
    }

    // Variante padrão (botão completo)
    return (
        <button
            onClick={handleLogout}
            disabled={isLoading}
            className={`flex items-center space-x-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors disabled:opacity-50 ${className}`}
        >
            {isLoading ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saindo...</span>
                </>
            ) : (
                <>
                    <LogOut className="w-4 h-4" />
                    <span>Sair</span>
                </>
            )}
        </button>
    );
};

export default LogoutButton;
