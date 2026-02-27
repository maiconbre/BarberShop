import React from 'react';
import { Crown, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';

const UpgradeBanner: React.FC = () => {
    const navigate = useNavigate();
    const { barbershopSlug } = useParams();

    const handleUpgrade = () => {
        navigate(`/app/${barbershopSlug}/upgrade`);
    };

    return (
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="bg-gradient-to-r from-[#F0B35B] to-[#E6A555] overflow-hidden"
        >
            <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between text-black">
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex w-8 h-8 bg-black/10 rounded-full items-center justify-center">
                        <Crown className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-sm font-bold leading-tight">Você está no Plano Free</p>
                        <p className="text-[10px] sm:text-xs font-medium opacity-80">Atualize para o plano PRO para adicionar mais barbeiros e ter agendamentos ilimitados.</p>
                    </div>
                </div>

                <button
                    onClick={handleUpgrade}
                    className="flex items-center gap-2 bg-black text-[#F0B35B] px-4 py-1.5 rounded-full text-xs font-bold hover:bg-black/80 transition-all transform hover:scale-105 shrink-0"
                >
                    <span>Fazer Upgrade</span>
                    <ArrowRight className="w-3 h-3" />
                </button>
            </div>
        </motion.div>
    );
};

export default UpgradeBanner;
