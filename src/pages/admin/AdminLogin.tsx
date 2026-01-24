import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Loader2, Shield } from 'lucide-react';
import { supabase } from '../../config/supabaseConfig';
import { AdminService } from '../../services/AdminService';

const AdminLogin: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // Fazer login no Supabase
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (authError) {
                throw new Error('Email ou senha incorretos');
            }

            if (!authData.user) {
                throw new Error('Erro ao fazer login');
            }

            // Verificar se o usuário é admin
            const isAdmin = await AdminService.isAdmin(authData.user.id);

            if (!isAdmin) {
                // Fazer logout se não for admin
                await supabase.auth.signOut();
                throw new Error('Você não tem permissão para acessar o painel administrativo');
            }

            // Redirecionar para dashboard admin
            navigate('/admin/dashboard');
        } catch (err) {
            console.error('Erro no login admin:', err);
            setError(err instanceof Error ? err.message : 'Erro ao fazer login');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0D121E] relative overflow-hidden">
            {/* Elementos decorativos */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-[#F0B35B]/20 to-transparent rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-[#F0B35B]/10 to-transparent rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

            {/* Card de Login */}
            <div className="max-w-md w-full mx-4 relative z-10">
                <div className="bg-[#1A1F2E] rounded-lg shadow-2xl p-8 border border-gray-700">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center p-4 bg-[#F0B35B]/20 rounded-full mb-4">
                            <Shield className="w-8 h-8 text-[#F0B35B]" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Admin Central
                        </h1>
                        <p className="text-gray-400 text-sm">
                            Painel Administrativo BarberShop SaaS
                        </p>
                    </div>

                    {/* Aviso de Segurança */}
                    <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <p className="text-red-400 text-xs text-center">
                            🔒 Acesso restrito apenas para administradores
                        </p>
                    </div>

                    {/* Formulário */}
                    <form onSubmit={handleLogin} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                                <p className="text-red-400 text-sm text-center">{error}</p>
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Email de Administrador
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-[#0D121E] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F0B35B] focus:border-[#F0B35B]"
                                    placeholder="admin@barbershop.com"
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        {/* Senha */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Senha
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-[#0D121E] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F0B35B] focus:border-[#F0B35B]"
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                />
                            </div>
                        </div>

                        {/* Botão */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center space-x-2 py-3 bg-[#F0B35B] hover:bg-[#F0B35B]/90 text-black font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Verificando...</span>
                                </>
                            ) : (
                                <>
                                    <Shield className="w-5 h-5" />
                                    <span>Acessar Painel Admin</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => navigate('/')}
                            className="text-gray-400 hover:text-white text-sm transition-colors"
                        >
                            ← Voltar para o site
                        </button>
                    </div>
                </div>

                {/* Nota de Segurança */}
                <p className="text-center text-gray-500 text-xs mt-4">
                    Todas as ações administrativas são registradas em logs de auditoria
                </p>
            </div>
        </div>
    );
};

export default AdminLogin;
