import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../config/supabaseConfig';
import { AdminService } from '../services/AdminService';
import { Loader2 } from 'lucide-react';

/**
 * Componente de proteção de rotas administrativas
 * Verifica se o usuário está autenticado e é um admin válido
 */
export const ProtectedAdminRoute: React.FC = () => {
    const [isChecking, setIsChecking] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        checkAdminAccess();
    }, []);

    const checkAdminAccess = async () => {
        try {
            // Verificar se está autenticado
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setIsAdmin(false);
                setIsChecking(false);
                return;
            }

            // Verificar se é admin
            const adminStatus = await AdminService.isAdmin(user.id);

            setIsAdmin(adminStatus);
            setUserId(user.id);
        } catch (error) {
            console.error('Erro ao verificar acesso admin:', error);
            setIsAdmin(false);
        } finally {
            setIsChecking(false);
        }
    };

    // Loading state
    if (isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0D121E]">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-[#F0B35B] animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Verificando permissões...</p>
                </div>
            </div>
        );
    }

    // Se não for admin, redirecionar para login admin
    if (!isAdmin) {
        return <Navigate to="/admin/login" replace />;
    }

    // Se for admin, renderizar a rota
    return <Outlet />;
};

/**
 * Hook para verificar se usuário atual é admin
 */
export const useIsAdmin = () => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAdmin = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (user) {
                    const adminStatus = await AdminService.isAdmin(user.id);
                    setIsAdmin(adminStatus);
                }
            } catch (error) {
                console.error('Erro ao verificar admin:', error);
                setIsAdmin(false);
            } finally {
                setLoading(false);
            }
        };

        checkAdmin();
    }, []);

    return { isAdmin, loading };
};
