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
        <div className="relative min-h-screen overflow-x-hidden bg-[#0f0f0f] text-white">
            <div
                className="pointer-events-none fixed inset-0 z-0"
                style={{
                    backgroundImage:
                        "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(245,166,35,0.08) 0%, transparent 60%), url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.015'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
                }}
                aria-hidden="true"
            />

            <div className="relative z-10 px-6 py-12">
                <div onClick={() => navigate('/')} className="mx-auto mb-8 flex max-w-6xl justify-center cursor-pointer">
                    <button className="flex items-center gap-3 text-left">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F5A623] text-lg">
                            ✂️
                        </span>
                        <span className="text-sm font-semibold tracking-[0.25em] text-white">BARBERSHOP</span>
                    </button>
                </div>

                <div className="mx-auto max-w-md rounded-2xl border border-[#2a2a2a] bg-[#141414] p-6 shadow-xl">
                    <div className="text-center">
                        <div className="mb-4 inline-flex rounded-full border border-[#a86f12] bg-[#3a2a0f] px-4 py-1 text-[11px] uppercase tracking-[0.25em] text-[#F5A623]">
                            ◈ Configuração
                        </div>
                        <h2 className="text-3xl font-semibold text-white">Sua Barbearia</h2>
                        <p className="mt-2 text-sm text-gray-400">Passo 2 de 2: Detalhes do negócio</p>
                        <div className="mt-4 p-3 bg-[#F0B35B]/10 border border-[#F0B35B]/20 rounded-lg text-xs text-[#F0B35B]">
                            Logado como: <span className="font-semibold text-white">{user.email}</span>
                        </div>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="rounded-xl border border-red-700/40 bg-red-900/20 p-3 text-sm text-red-300">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="rounded-xl border border-green-700/40 bg-green-900/20 p-3 text-sm text-green-300">
                                {success}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-300">Nome da Barbearia</label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <Store className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        name="name"
                                        type="text"
                                        required
                                        className="block w-full rounded-lg border border-[#2a2a2a] bg-[#141414] pl-10 pr-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:border-[#F5A623] sm:text-sm"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="Ex: Barbearia do Silva"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-300">URL Personalizada (Slug)</label>
                                <div className="relative">
                                    <input
                                        name="slug"
                                        type="text"
                                        required
                                        className={`block w-full rounded-lg border bg-[#141414] px-4 py-2 pr-10 text-white placeholder-gray-500 focus:outline-none sm:text-sm transition-colors ${slugStatus === 'available' ? 'border-green-500 focus:border-green-500' :
                                                slugStatus === 'unavailable' ? 'border-red-500 focus:border-red-500' :
                                                    'border-[#2a2a2a] focus:ring-2 focus:ring-[#F5A623] focus:border-[#F5A623]'
                                            }`}
                                        value={formData.slug}
                                        onChange={handleInputChange}
                                        placeholder="nome-da-barbearia"
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
                                <label className="mb-1 block text-sm font-medium text-gray-300">WhatsApp da Barbearia</label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <MessageCircle className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        name="whatsapp"
                                        type="tel"
                                        required
                                        className="block w-full rounded-lg border border-[#2a2a2a] bg-[#141414] pl-10 pr-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:border-[#F5A623] sm:text-sm"
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
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F5A623] px-6 py-3 text-sm font-semibold text-black hover:bg-[#d4891a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin h-5 w-5" />
                            ) : (
                                <>
                                    Finalizar Cadastro <ArrowRight className="h-4 w-4" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default BarbershopRegistrationPage;