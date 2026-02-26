import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, Store, MessageCircle, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import {
    createBarbershop,
    checkSlugAvailability,
    generateSlugFromName,
    validateSlugFormat
} from '../services/BarbershopService';
import { useAuth } from '../contexts/AuthContext';

interface LocationState {
    barbershopName?: string;
}

const BarbershopRegistrationPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, loading } = useAuth();
    const state = location.state as LocationState;

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Estados para validação de slug
    const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle');
    const [slugMessage, setSlugMessage] = useState('');

    const [formData, setFormData] = useState({
        name: state?.barbershopName || '',
        slug: '',
        whatsapp: ''
    });

    // Redirecionar se não estiver autenticado
    useEffect(() => {
        if (!loading && !user) {
            console.log('Usuário não autenticado no passo 2, redirecionando para passo 1...');
            navigate('/register'); // Ou a rota da EmailVerificationPage que agora é Register
        }
    }, [user, loading, navigate]);

    // Gerar slug automaticamente quando o nome muda
    useEffect(() => {
        if (formData.name.trim()) {
            const generatedSlug = generateSlugFromName(formData.name);
            setFormData(prev => ({ ...prev, slug: generatedSlug }));
        }
    }, [formData.name]);

    // Verificar disponibilidade do slug
    useEffect(() => {
        const checkSlug = async () => {
            if (!formData.slug.trim()) {
                setSlugStatus('idle');
                setSlugMessage('');
                return;
            }

            const formatValidation = validateSlugFormat(formData.slug);
            if (!formatValidation.valid) {
                setSlugStatus('unavailable');
                setSlugMessage(formatValidation.message);
                return;
            }

            setSlugStatus('checking');
            setSlugMessage('Verificando disponibilidade...');

            try {
                const result = await checkSlugAvailability(formData.slug);
                if (result.available) {
                    setSlugStatus('available');
                    setSlugMessage('Nome disponível!');
                } else {
                    setSlugStatus('unavailable');
                    setSlugMessage(result.message || 'Nome não disponível');
                }
            } catch {
                setSlugStatus('unavailable');
                setSlugMessage('Erro ao verificar disponibilidade');
            }
        };

        const timeoutId = setTimeout(checkSlug, 500);
        return () => clearTimeout(timeoutId);
    }, [formData.slug]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            setError('Usuário não autenticado. Volte para o passo anterior.');
            return;
        }

        if (slugStatus !== 'available') {
            setError('URL inválida ou indisponível.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await createBarbershop({
                name: formData.name,
                slug: formData.slug,
                whatsapp: formData.whatsapp,
                ownerId: user.id,
                ownerEmail: user.email || ''
            });

            if (response.success) {
                setSuccess('🎉 Barbearia criada com sucesso! Redirecionando...');

                // Redirecionar para Dashboard
                setTimeout(() => {
                    navigate(`/app/${response.data.barbershop.slug}/dashboard`, {
                        replace: true,
                        state: { showOnboarding: true }
                    });
                }, 1500);
            }

        } catch (err: any) {
            console.error('Erro ao criar barbearia:', err);
            setError(err.message || 'Erro ao criar barbearia.');
        } finally {
            setIsLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0D121E]">
                <Loader2 className="w-8 h-8 text-[#F0B35B] animate-spin" />
            </div>
        );
    }

    if (!user) return null; // Será redirecionado pelo useEffect

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0D121E] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Elementos decorativos (Mantidos) */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-[#F0B35B]/20 to-transparent rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse-slow"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-[#F0B35B]/10 to-transparent rounded-full blur-3xl translate-x-1/3 translate-y-1/3 animate-pulse-slow delay-1000"></div>

            <div className="max-w-md w-full space-y-8 bg-[#1A1F2E] p-8 shadow-xl relative z-10 rounded-lg">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-white">Configurar Barbearia</h2>
                    <p className="mt-2 text-sm text-gray-400">Passo 2 de 2: Detalhes do negócio</p>
                    <div className="mt-4 p-3 bg-[#F0B35B]/10 border border-[#F0B35B]/20 rounded-lg text-sm text-[#F0B35B]">
                        Logado como: <span className="font-semibold text-white">{user.email}</span>
                    </div>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-md text-sm">
                            {success}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Nome da Barbearia</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Store className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    name="name"
                                    type="text"
                                    required
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md leading-5 bg-[#0D121E] text-white placeholder-gray-500 focus:outline-none focus:ring-[#F0B35B] focus:border-[#F0B35B] sm:text-sm"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">URL Personalizada (Slug)</label>
                            <div className="relative">
                                <input
                                    name="slug"
                                    type="text"
                                    required
                                    className={`block w-full px-4 py-2 pr-10 border rounded-md bg-[#0D121E] text-white placeholder-gray-500 focus:outline-none sm:text-sm transition-colors ${slugStatus === 'available' ? 'border-green-500 focus:border-green-500' :
                                            slugStatus === 'unavailable' ? 'border-red-500 focus:border-red-500' :
                                                'border-gray-600 focus:border-[#F0B35B]'
                                        }`}
                                    value={formData.slug}
                                    onChange={handleInputChange}
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    {slugStatus === 'checking' && <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />}
                                    {slugStatus === 'available' && <CheckCircle className="h-4 w-4 text-green-500" />}
                                    {slugStatus === 'unavailable' && <AlertCircle className="h-4 w-4 text-red-500" />}
                                </div>
                            </div>
                            {slugMessage && (
                                <p className={`mt-1 text-xs ${slugStatus === 'available' ? 'text-green-500' : 'text-red-400'}`}>
                                    {slugMessage}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">WhatsApp da Barbearia</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MessageCircle className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    name="whatsapp"
                                    type="tel"
                                    required
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md leading-5 bg-[#0D121E] text-white placeholder-gray-500 focus:outline-none focus:ring-[#F0B35B] focus:border-[#F0B35B] sm:text-sm"
                                    placeholder="(11) 99999-9999"
                                    value={formData.whatsapp}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">Será usado para notificações e contato dos clientes.</p>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || slugStatus !== 'available'}
                        className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-black bg-[#F0B35B] hover:bg-[#F0B35B]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F0B35B] disabled:opacity-50 transition-all"
                    >
                        {isLoading ? (
                            <Loader2 className="animate-spin h-5 w-5" />
                        ) : (
                            <span className="flex items-center">
                                Finalizar Cadastro <ArrowRight className="ml-2 h-4 w-4" />
                            </span>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default BarbershopRegistrationPage;