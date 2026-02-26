import React, { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { usePlanLimits } from '../hooks/usePlanLimits';
import { UpgradePrompt } from './UpgradePrompt';

interface BarberFormProps {
    onSubmit: (data: { name: string; phone: string }) => Promise<void>;
    onCancel: () => void;
}

/**
 * Componente de formulário para adicionar barbeiro COM validação de limite
 */
export const BarberFormWithLimit: React.FC<BarberFormProps> = ({ onSubmit, onCancel }) => {
    const { checkLimits, lastError, clearError } = usePlanLimits();
    const [formData, setFormData] = useState({ name: '', phone: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [upgradePromptOpen, setUpgradePromptOpen] = useState(false);
    const [limitMessage, setLimitMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Verificar limite antes de submeter
        const canAdd = await checkLimits('barbers');

        if (!canAdd) {
            setLimitMessage(lastError?.message || 'Limite de barbeiros atingido');
            setUpgradePromptOpen(true);
            return;
        }

        try {
            setIsSubmitting(true);
            await onSubmit(formData);
            setFormData({ name: '', phone: '' });
            clearError();
        } catch (error) {
            console.error('Erro ao adicionar barbeiro:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Nome do Barbeiro *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 bg-[#0D121E] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F0B35B] focus:border-[#F0B35B]"
                        placeholder="João Silva"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        WhatsApp
                    </label>
                    <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2 bg-[#0D121E] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F0B35B] focus:border-[#F0B35B]"
                        placeholder="(11) 99999-9999"
                    />
                </div>

                <div className="flex items-center space-x-3 pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-[#F0B35B] hover:bg-[#F0B35B]/90 text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Adicionando...</span>
                            </>
                        ) : (
                            <>
                                <Plus className="w-4 h-4" />
                                <span>Adicionar Barbeiro</span>
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            </form>

            <UpgradePrompt
                isOpen={upgradePromptOpen}
                onClose={() => setUpgradePromptOpen(false)}
                reason={limitMessage}
            />
        </>
    );
};

/**
 * Componente de botão para adicionar barbeiro COM validação de limite
 */
export const AddBarberButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
    const { checkLimits, lastError } = usePlanLimits();
    const [upgradePromptOpen, setUpgradePromptOpen] = useState(false);
    const [limitMessage, setLimitMessage] = useState('');
    const [checking, setChecking] = useState(false);

    const handleClick = async () => {
        setChecking(true);
        const canAdd = await checkLimits('barbers');
        setChecking(false);

        if (!canAdd) {
            setLimitMessage(lastError?.message || 'Limite de barbeiros atingido');
            setUpgradePromptOpen(true);
            return;
        }

        onClick();
    };

    return (
        <>
            <button
                onClick={handleClick}
                disabled={checking}
                className="flex items-center space-x-2 px-4 py-2 bg-[#F0B35B] hover:bg-[#F0B35B]/90 text-black font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
                {checking ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <Plus className="w-4 h-4" />
                )}
                <span>Adicionar Barbeiro</span>
            </button>

            <UpgradePrompt
                isOpen={upgradePromptOpen}
                onClose={() => setUpgradePromptOpen(false)}
                reason={limitMessage}
            />
        </>
    );
};

/**
 * Hook para validar criação de agendamento
 */
export const useAppointmentLimit = () => {
    const { checkLimits, lastError } = usePlanLimits();
    const [upgradePromptOpen, setUpgradePromptOpen] = useState(false);
    const [limitMessage, setLimitMessage] = useState('');

    const checkLimit = async (): Promise<boolean> => {
        const canCreate = await checkLimits('appointments');

        if (!canCreate) {
            setLimitMessage(lastError?.message || 'Limite de agendamentos atingido');
            setUpgradePromptOpen(true);
            return false;
        }

        return true;
    };

    return {
        checkLimit,
        UpgradePromptComponent: (
            <UpgradePrompt
                isOpen={upgradePromptOpen}
                onClose={() => setUpgradePromptOpen(false)}
                reason={limitMessage}
            />
        )
    };
};

/**
 * Badge de plano para exibir em qualquer lugar
 * Usa o PlanService diretamente para obter o tipo de plano
 */
export const PlanBadge: React.FC<{ planType?: 'free' | 'pro' | 'enterprise' }> = ({ planType = 'free' }) => {
    const badges: Record<string, { label: string; color: string }> = {
        'free': { label: 'Gratuito', color: 'bg-gray-500' },
        'pro': { label: 'Pro', color: 'bg-[#F0B35B]' },
        'enterprise': { label: 'Enterprise', color: 'bg-purple-500' }
    };

    const badge = badges[planType] || badges['free'];

    return (
        <span className={`px-3 py-1 ${badge.color} text-black text-xs font-bold rounded-full`}>
            {badge.label}
        </span>
    );
};

/**
 * Aviso de uso de limite (exibe quando está próximo do limite)
 * Versão simplificada que mostra apenas um indicador visual
 */
export const LimitWarning: React.FC<{
    limitType: 'barbers' | 'appointments' | 'services';
    current?: number;
    max?: number;
}> = ({ limitType, current = 0, max = 0 }) => {
    if (max === 0) {
        return null;
    }

    const percentage = (current / max) * 100;

    if (percentage < 70) {
        return null;
    }

    const isAtLimit = percentage >= 90;
    const typeLabels: Record<string, string> = {
        'barbers': 'barbeiros',
        'appointments': 'agendamentos',
        'services': 'serviços'
    };

    return (
        <div className={`p-3 rounded-lg border ${isAtLimit
            ? 'bg-red-500/10 border-red-500/30 text-red-400'
            : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
            }`}>
            <p className="text-sm">
                {isAtLimit ? '⚠️' : '⚡'} Você está usando {current} de {max} {typeLabels[limitType]} ({percentage.toFixed(0)}%)
            </p>
        </div>
    );
};
