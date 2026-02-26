import React from 'react';
import { X, Crown, Check, ArrowRight } from 'lucide-react';
import { PlanType, PLAN_CONFIGS } from '../config/plans';
import { useNavigate } from 'react-router-dom';

interface UpgradePromptProps {
    isOpen: boolean;
    onClose: () => void;
    currentPlan?: PlanType;
    reason?: string;
    suggestedPlan?: PlanType;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
    isOpen,
    onClose,
    currentPlan = PlanType.FREE,
    reason,
    suggestedPlan = PlanType.PRO
}) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    const suggested = PLAN_CONFIGS[suggestedPlan];
    const isPro = suggestedPlan === PlanType.PRO;

    const handleUpgrade = () => {
        // Navegar para página de upgrade (será criada)
        navigate(`/upgrade?plan=${suggestedPlan}`);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-[#1A1F2E] rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="relative p-6 border-b border-gray-700">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center space-x-3">
                        <div className="p-3 bg-[#F0B35B]/20 rounded-full">
                            <Crown className="w-6 h-6 text-[#F0B35B]" />
                        </div>
                        <div>
                            <h2 className="text-2xlfont-bold text-white">
                                Faça Upgrade do Seu Plano
                            </h2>
                            <p className="text-gray-400 text-sm mt-1">
                                Desbloqueie recursos poderosos para sua barbearia
                            </p>
                        </div>
                    </div>
                </div>

                {/* Reason */}
                {reason && (
                    <div className="p-4 mx-6 mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <p className="text-yellow-400 text-sm">
                            ⚠️ {reason}
                        </p>
                    </div>
                )}

                {/* Plan Details */}
                <div className="p-6">
                    <div className="bg-[#0D121E] rounded-lg p-6 border-2 border-[#F0B35B]">
                        {/* Price */}
                        <div className="text-center mb-6">
                            {isPro && (
                                <div className="inline-block px-3 py-1 bg-[#F0B35B] text-black text-xs font-bold rounded-full mb-2">
                                    MAIS POPULAR
                                </div>
                            )}
                            <h3 className="text-2xl font-bold text-white mb-2">
                                {suggested.name}
                            </h3>
                            <div className="flex items-baseline justify-center space-x-2">
                                <span className="text-4xl font-bold text-[#F0B35B]">
                                    R$ {suggested.price.toFixed(2).replace('.', ',')}
                                </span>
                                <span className="text-gray-400">/mês</span>
                            </div>
                            <p className="text-gray-400 text-sm mt-2">
                                {suggested.description}
                            </p>
                        </div>

                        {/* Features */}
                        <div className="space-y-3">
                            {suggested.features.map((feature, index) => (
                                <div key={index} className="flex items-start space-x-3">
                                    <Check className="w-5 h-5 text-[#F0B35B] flex-shrink-0 mt-0.5" />
                                    <span className="text-gray-300 text-sm">{feature}</span>
                                </div>
                            ))}
                        </div>

                        {/* CTA */}
                        <button
                            onClick={handleUpgrade}
                            className="w-full mt-6 flex items-center justify-center space-x-2 px-6 py-3 bg-[#F0B35B] hover:bg-[#F0B35B]/90 text-black font-bold rounded-lg transition-all duration-200 transform hover:scale-105"
                        >
                            <span>Fazer Upgrade Agora</span>
                            <ArrowRight className="w-5 h-5" />
                        </button>

                        {/* Guarantee */}
                        <p className="text-center text-gray-400 text-xs mt-4">
                            ✨ 7 dias de garantia de reembolso
                        </p>
                    </div>

                    {/* Comparison */}
                    {currentPlan === PlanType.FREE && (
                        <div className="mt-6 pt-6 border-t border-gray-700">
                            <h4 className="text-white font-semibold mb-3">
                                O que você está perdendo:
                            </h4>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400">Barbeiros</span>
                                    <div className="flex space-x-4">
                                        <span className="text-red-400">1</span>
                                        <span className="text-[#F0B35B]">→ 10</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400">Agendamentos/mês</span>
                                    <div className="flex space-x-4">
                                        <span className="text-red-400">20</span>
                                        <span className="text-[#F0B35B]">→ 500</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400">Analytics</span>
                                    <div className="flex space-x-4">
                                        <span className="text-red-400">✗</span>
                                        <span className="text-[#F0B35B]">✓</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-[#0D121E] border-t border-gray-700">
                    <button
                        onClick={onClose}
                        className="w-full px-6 py-2 text-gray-400 hover:text-white transition-colors text-sm"
                    >
                        Continuar com plano {PLAN_CONFIGS[currentPlan].name}
                    </button>
                </div>
            </div>
        </div>
    );
};

/**
 * Hook para gerenciar UpgradePrompt globalmente
 */
export const useUpgradePrompt = () => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [config, setConfig] = React.useState<{
        reason?: string;
        suggestedPlan?: PlanType;
    }>({});

    const show = (reason?: string, suggestedPlan: PlanType = PlanType.PRO) => {
        setConfig({ reason, suggestedPlan });
        setIsOpen(true);
    };

    const close = () => {
        setIsOpen(false);
    };

    return {
        isOpen,
        show,
        close,
        ...config
    };
};
