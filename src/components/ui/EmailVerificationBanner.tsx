import { useState } from 'react';
import { AlertCircle, Send, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface EmailVerificationBannerProps {
    variant?: 'default' | 'sidebar';
}

export const EmailVerificationBanner = ({ variant = 'default' }: EmailVerificationBannerProps) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);

    // Se não tem usuário, ou já está confirmado, ou é provedor externo (Google/Github geralmente já valida), não mostra
    const userAny = user as any;
    if (!user || userAny.email_confirmed_at || userAny.app_metadata?.provider !== 'email') return null;

    const handleResend = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setLoading(true);
        try {
            // Simulação de reenvio - Integração com n8n será feita posteriormente pelo usuário
            await new Promise(resolve => setTimeout(resolve, 1500));

            toast.success('Solicitação de reenvio recebida!', {
                icon: '📧',
                style: {
                    borderRadius: '10px',
                    background: '#333',
                    color: '#fff',
                },
            });

            console.log('Webhook de reenvio de email deve ser chamado aqui');
            setShowTooltip(false);
        } catch (e) {
            toast.error('Erro ao solicitar reenvio.');
        } finally {
            setLoading(false);
        }
    };

    if (variant === 'sidebar') {
        return (
            <div
                className="relative group"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
            >
                <div
                    className="p-1.5 bg-yellow-500/10 rounded-full cursor-pointer hover:bg-yellow-500/20 transition-colors"
                    onClick={() => setShowTooltip(!showTooltip)}
                >
                    <AlertTriangle className="w-4 h-4 text-yellow-500 animate-pulse" />
                </div>

                <AnimatePresence>
                    {showTooltip && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-[#1A1F2E] border border-yellow-500/30 rounded-xl shadow-xl z-50 backdrop-blur-md"
                        >
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-yellow-500/10 rounded-full shrink-0">
                                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xs font-medium text-white">Email não verificado</p>
                                    <p className="text-[10px] text-gray-400 leading-relaxed">
                                        Clique abaixo para reenviar o email de confirmação.
                                    </p>
                                    <button
                                        onClick={handleResend}
                                        disabled={loading}
                                        className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 rounded-md text-yellow-500 text-[10px] font-bold transition-all disabled:opacity-50"
                                    >
                                        {loading ? 'Enviando...' : 'Reenviar Email'}
                                    </button>
                                </div>
                            </div>

                            {/* Arrow */}
                            <div className="absolute top-full left-3 -mt-1 border-4 border-transparent border-t-[#1A1F2E] pointer-events-none"></div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-3 mb-6 rounded-lg animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-7xl mx-auto">
                <div className="flex items-center gap-3 text-center sm:text-left">
                    <div className="p-2 bg-yellow-500/20 rounded-full shrink-0">
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-white font-medium text-sm">
                            Verifique seu email
                        </span>
                        <span className="text-gray-400 text-xs text-yellow-500/80">
                            Sua conta precisa de confirmação para acesso completo a longo prazo.
                        </span>
                    </div>
                </div>

                <button
                    onClick={handleResend}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 rounded-md text-yellow-500 text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                    {loading ? (
                        <span className="animate-pulse">Enviando...</span>
                    ) : (
                        <>
                            <Send className="w-3 h-3" />
                            Reenviar Email
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
