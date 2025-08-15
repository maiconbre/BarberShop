import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, Store, User, Mail, Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import {
    registerBarbershop,
    checkSlugAvailability,
    generateSlugFromName,
    validateSlugFormat,
    type BarbershopRegistrationData
} from '../services/BarbershopService';
import { setupInitialBarbershopData, markFirstAccess } from '../services/SetupService';
import { useAuth } from '../contexts/AuthContext';

interface LocationState {
  email?: string;
  barbershopName?: string;
  emailVerified?: boolean;
}

const BarbershopRegistrationPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const state = location.state as LocationState;

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Estados para validação de slug
    const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle');
    const [slugMessage, setSlugMessage] = useState('');

    const [formData, setFormData] = useState<BarbershopRegistrationData & { confirmPassword: string }>({
        name: state?.barbershopName || '',
        slug: '',
        ownerEmail: state?.email || '',
        ownerName: '',
        ownerUsername: '',
        ownerPassword: '',
        confirmPassword: '',
        planType: 'free'
    });

    // Check if email was verified
    useEffect(() => {
        if (!state?.emailVerified) {
            // Redirect to email verification if not verified
            navigate('/verify-email', {
                state: {
                    email: formData.ownerEmail,
                    barbershopName: formData.name
                }
            });
        }
    }, [state?.emailVerified, navigate, formData.ownerEmail, formData.name]);

    // Gerar slug automaticamente quando o nome muda
    useEffect(() => {
        if (formData.name.trim()) {
            const generatedSlug = generateSlugFromName(formData.name);
            setFormData(prev => ({ ...prev, slug: generatedSlug }));
        }
    }, [formData.name]);

    // Verificar disponibilidade do slug quando ele muda
    useEffect(() => {
        const checkSlug = async () => {
            if (!formData.slug.trim()) {
                setSlugStatus('idle');
                setSlugMessage('');
                return;
            }

            // Validar formato primeiro
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
            } catch (err) {
                setSlugStatus('unavailable');
                setSlugMessage('Erro ao verificar disponibilidade');
            }
        };

        const timeoutId = setTimeout(checkSlug, 500); // Debounce de 500ms
        return () => clearTimeout(timeoutId);
    }, [formData.slug]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
        setSuccess('');
    };

    const validateForm = (): string | null => {
        // Validar campos obrigatórios
        if (!formData.name.trim()) return 'Nome da barbearia é obrigatório';
        if (!formData.slug.trim()) return 'URL da barbearia é obrigatória';
        if (!formData.ownerName.trim()) return 'Nome do proprietário é obrigatório';
        if (!formData.ownerEmail.trim()) return 'Email é obrigatório';
        if (!formData.ownerUsername.trim()) return 'Nome de usuário é obrigatório';
        if (!formData.ownerPassword) return 'Senha é obrigatória';
        if (!formData.confirmPassword) return 'Confirmação de senha é obrigatória';

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.ownerEmail)) {
            return 'Email inválido';
        }

        // Validar senha
        if (formData.ownerPassword.length < 6) {
            return 'Senha deve ter pelo menos 6 caracteres';
        }

        // Validar confirmação de senha
        if (formData.ownerPassword !== formData.confirmPassword) {
            return 'Senhas não coincidem';
        }

        // Validar slug
        if (slugStatus !== 'available') {
            return 'Nome da barbearia não está disponível ou é inválido';
        }

        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            // Preparar dados para registro
            const registrationData: BarbershopRegistrationData = {
                name: formData.name.trim(),
                slug: formData.slug.trim(),
                ownerEmail: formData.ownerEmail.trim().toLowerCase(),
                ownerName: formData.ownerName.trim(),
                ownerUsername: formData.ownerUsername.trim(),
                ownerPassword: formData.ownerPassword,
                planType: formData.planType as 'free' | 'pro'
            };

            console.log('Registrando barbearia:', registrationData.name);

            // Registrar barbearia
            const response = await registerBarbershop(registrationData);

            // Armazenar tokens de autenticação
            localStorage.setItem('authToken', response.data.token);
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('refreshToken', response.data.refreshToken);

            // Configurar estrutura inicial da barbearia
            setSuccess('🎉 Barbearia registrada! Configurando estrutura inicial...');
            
            try {
                await setupInitialBarbershopData(response.data.barbershop.id, response.data.token);
                console.log('Estrutura inicial configurada com sucesso');
            } catch (setupError) {
                console.warn('Erro ao configurar estrutura inicial (continuando):', setupError);
                // Não bloquear o fluxo se o setup falhar
            }

            // Atualizar contexto de autenticação
            await login(formData.ownerUsername, formData.ownerPassword, true);

            // Marcar como primeiro acesso para mostrar onboarding
            markFirstAccess();

            setSuccess('🎉 Barbearia criada com sucesso! Bem-vindo ao BarberShop! Iniciando tutorial...');

            // Redirecionar para o dashboard da barbearia com onboarding
            setTimeout(() => {
                navigate(`/app/${response.data.barbershop.slug}/dashboard`, { 
                    replace: true,
                    state: { showOnboarding: true }
                });
            }, 2000);

        } catch (err: unknown) {
            console.error('Erro no registro:', err);
            setError(err instanceof Error ? err.message : 'Erro inesperado. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0D121E] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Elementos decorativos */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-[#F0B35B]/20 to-transparent rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse-slow"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-[#F0B35B]/10 to-transparent rounded-full blur-3xl translate-x-1/3 translate-y-1/3 animate-pulse-slow delay-1000"></div>

            {/* Padrão de linhas decorativas */}
            <div className="absolute inset-0 opacity-5">
                <div className="h-full w-full" style={{
                    backgroundImage: 'linear-gradient(90deg, #F0B35B 1px, transparent 1px), linear-gradient(180deg, #F0B35B 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}></div>
            </div>

            {/* Logo clicável */}
            <div onClick={() => navigate('/')} className="absolute top-8 left-1/2 -translate-x-1/2 cursor-pointer z-20">
                <div className="transform hover:scale-110 transition-transform duration-300">
                    <div className="inline-block relative">
                        <div className="text-[#F0B35B] text-xl font-medium tracking-wider border border-[#F0B35B]/70 px-3 py-1.5 rounded">
                            BARBER<span className="text-white/90">SHOP</span>
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-full h-full border border-white/10 rounded"></div>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl w-full space-y-8 bg-[#1A1F2E] p-8 shadow-xl relative z-10 rounded-lg">
                <div className="text-center">
                    <div className="flex items-center justify-center space-x-3 mb-4">
                        <div className="p-3 bg-[#F0B35B]/20 rounded-full">
                            <Store className="w-8 h-8 text-[#F0B35B]" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-white">
                            Registrar Barbearia
                        </h2>
                    </div>
                    <p className="text-gray-400">
                        {state?.emailVerified 
                            ? `✅ Email verificado! Agora complete os dados da sua barbearia`
                            : 'Crie sua conta e comece a gerenciar sua barbearia hoje mesmo'
                        }
                    </p>
                    
                    {state?.emailVerified && (
                        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <p className="text-green-400 text-sm">
                                🎉 Parabéns! Você está a poucos passos de ter sua barbearia online
                            </p>
                        </div>
                    )}
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg flex items-center space-x-2">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-lg flex items-center space-x-2">
                            <CheckCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm">{success}</span>
                        </div>
                    )}

                    {/* Informações da Barbearia */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                            <Store className="w-5 h-5 text-[#F0B35B]" />
                            <span>Informações da Barbearia</span>
                        </h3>

                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                                Nome da Barbearia *
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                className="block w-full px-4 py-3 border border-gray-600 rounded-lg bg-[#0D121E] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F0B35B] focus:border-[#F0B35B] transition-all duration-200"
                                placeholder="Ex: Barbearia do João"
                                value={formData.name}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="slug" className="block text-sm font-medium text-gray-300 mb-2">
                                URL da Barbearia *
                            </label>
                            <div className="relative">
                                <input
                                    id="slug"
                                    name="slug"
                                    type="text"
                                    required
                                    className={`block w-full px-4 py-3 pr-10 border rounded-lg bg-[#0D121E] text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-200 ${slugStatus === 'available'
                                        ? 'border-green-500 focus:ring-green-500 focus:border-green-500'
                                        : slugStatus === 'unavailable'
                                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                            : 'border-gray-600 focus:ring-[#F0B35B] focus:border-[#F0B35B]'
                                        }`}
                                    placeholder="barbearia-do-joao"
                                    value={formData.slug}
                                    onChange={handleInputChange}
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                    {slugStatus === 'checking' && <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />}
                                    {slugStatus === 'available' && <CheckCircle className="w-5 h-5 text-green-500" />}
                                    {slugStatus === 'unavailable' && <AlertCircle className="w-5 h-5 text-red-500" />}
                                </div>
                            </div>
                            {slugMessage && (
                                <p className={`mt-2 text-sm ${slugStatus === 'available' ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                    {slugMessage}
                                </p>
                            )}
                            <p className="mt-1 text-xs text-gray-500">
                                Sua barbearia ficará disponível em: barbershop.com/app/{formData.slug || 'sua-barbearia'}
                            </p>
                        </div>

                        <div>
                            <label htmlFor="planType" className="block text-sm font-medium text-gray-300 mb-2">
                                Plano
                            </label>
                            <select
                                id="planType"
                                name="planType"
                                className="block w-full px-4 py-3 border border-gray-600 rounded-lg bg-[#0D121E] text-white focus:outline-none focus:ring-2 focus:ring-[#F0B35B] focus:border-[#F0B35B] transition-all duration-200"
                                value={formData.planType}
                                onChange={handleInputChange}
                            >
                                <option value="free">Gratuito - Até 1 barbeiro, 20 agendamentos/mês</option>
                                <option value="pro">Pro - Barbeiros ilimitados, agendamentos ilimitados</option>
                            </select>
                        </div>
                    </div>

                    {/* Informações do Proprietário */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                            <User className="w-5 h-5 text-[#F0B35B]" />
                            <span>Informações do Proprietário</span>
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="ownerName" className="block text-sm font-medium text-gray-300 mb-2">
                                    Nome Completo *
                                </label>
                                <input
                                    id="ownerName"
                                    name="ownerName"
                                    type="text"
                                    required
                                    className="block w-full px-4 py-3 border border-gray-600 rounded-lg bg-[#0D121E] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F0B35B] focus:border-[#F0B35B] transition-all duration-200"
                                    placeholder="João Silva"
                                    value={formData.ownerName}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div>
                                <label htmlFor="ownerUsername" className="block text-sm font-medium text-gray-300 mb-2">
                                    Nome de Usuário *
                                </label>
                                <input
                                    id="ownerUsername"
                                    name="ownerUsername"
                                    type="text"
                                    required
                                    className="block w-full px-4 py-3 border border-gray-600 rounded-lg bg-[#0D121E] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F0B35B] focus:border-[#F0B35B] transition-all duration-200"
                                    placeholder="joao.admin"
                                    value={formData.ownerUsername}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="ownerEmail" className="block text-sm font-medium text-gray-300 mb-2">
                                Email *
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    id="ownerEmail"
                                    name="ownerEmail"
                                    type="email"
                                    required
                                    className="block w-full pl-10 pr-4 py-3 border border-gray-600 rounded-lg bg-[#0D121E] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F0B35B] focus:border-[#F0B35B] transition-all duration-200"
                                    placeholder="joao@email.com"
                                    value={formData.ownerEmail}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="ownerPassword" className="block text-sm font-medium text-gray-300 mb-2">
                                    Senha *
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        id="ownerPassword"
                                        name="ownerPassword"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        className="block w-full pl-10 pr-10 py-3 border border-gray-600 rounded-lg bg-[#0D121E] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F0B35B] focus:border-[#F0B35B] transition-all duration-200"
                                        placeholder="Mínimo 6 caracteres"
                                        value={formData.ownerPassword}
                                        onChange={handleInputChange}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                                    Confirmar Senha *
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        required
                                        className="block w-full pl-10 pr-10 py-3 border border-gray-600 rounded-lg bg-[#0D121E] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F0B35B] focus:border-[#F0B35B] transition-all duration-200"
                                        placeholder="Repita a senha"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <button
                            type="submit"
                            disabled={isLoading || slugStatus !== 'available'}
                            className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-black bg-[#F0B35B] hover:bg-[#F0B35B]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F0B35B] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                                    Registrando...
                                </>
                            ) : (
                                <>
                                    <Store className="w-5 h-5 mr-2" />
                                    Registrar Barbearia
                                </>
                            )}
                        </button>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => navigate('/login')}
                                className="text-[#F0B35B] hover:text-[#F0B35B]/80 text-sm font-medium transition-colors"
                            >
                                Já tem uma conta? Faça login
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BarbershopRegistrationPage;