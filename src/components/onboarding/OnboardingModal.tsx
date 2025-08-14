import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, CheckCircle, Users, Calendar, Settings, BarChart3 } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  barbershopName: string;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose, barbershopName }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: `Bem-vindo ao ${barbershopName}!`,
      icon: CheckCircle,
      content: (
        <div className="text-center">
          <p className="text-gray-300 mb-4">
            Parabéns! Sua barbearia está online e pronta para receber clientes.
          </p>
          <div className="bg-[#F0B35B]/10 border border-[#F0B35B]/20 rounded-lg p-4">
            <h4 className="text-[#F0B35B] font-semibold mb-2">🎉 Sua barbearia inclui:</h4>
            <ul className="text-sm text-gray-300 space-y-1 text-left">
              <li>✓ Página personalizada: /{barbershopName.toLowerCase().replace(/\s+/g, '-')}</li>
              <li>✓ Sistema de agendamentos online</li>
              <li>✓ Gestão de barbeiros e serviços</li>
              <li>✓ Dashboard com relatórios</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: 'Gerencie seus Barbeiros',
      icon: Users,
      content: (
        <div>
          <p className="text-gray-300 mb-4">
            Adicione barbeiros à sua equipe e configure seus horários de trabalho.
          </p>
          <div className="bg-[#1A1F2E] rounded-lg p-4 border border-gray-700">
            <h4 className="text-white font-semibold mb-2">Como fazer:</h4>
            <ol className="text-sm text-gray-300 space-y-2">
              <li>1. Vá para "Barbeiros" no menu lateral</li>
              <li>2. Clique em "Adicionar Barbeiro"</li>
              <li>3. Preencha os dados e horários</li>
              <li>4. Associe serviços ao barbeiro</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      title: 'Configure seus Serviços',
      icon: Settings,
      content: (
        <div>
          <p className="text-gray-300 mb-4">
            Defina os serviços oferecidos, preços e duração de cada atendimento.
          </p>
          <div className="bg-[#1A1F2E] rounded-lg p-4 border border-gray-700">
            <h4 className="text-white font-semibold mb-2">Dica importante:</h4>
            <p className="text-sm text-gray-300">
              Configure preços realistas e duração adequada para cada serviço. 
              Isso ajuda os clientes a escolherem o melhor horário.
            </p>
          </div>
        </div>
      )
    },
    {
      title: 'Acompanhe seus Agendamentos',
      icon: Calendar,
      content: (
        <div>
          <p className="text-gray-300 mb-4">
            Visualize e gerencie todos os agendamentos em tempo real.
          </p>
          <div className="bg-[#1A1F2E] rounded-lg p-4 border border-gray-700">
            <h4 className="text-white font-semibold mb-2">Funcionalidades:</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Confirmar ou cancelar agendamentos</li>
              <li>• Ver histórico de clientes</li>
              <li>• Receber notificações de novos agendamentos</li>
              <li>• Bloquear horários indisponíveis</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: 'Analise seu Desempenho',
      icon: BarChart3,
      content: (
        <div>
          <p className="text-gray-300 mb-4">
            Use o dashboard de analytics para acompanhar o crescimento da sua barbearia.
          </p>
          <div className="bg-[#1A1F2E] rounded-lg p-4 border border-gray-700">
            <h4 className="text-white font-semibold mb-2">Métricas disponíveis:</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Agendamentos por período</li>
              <li>• Receita estimada</li>
              <li>• Barbeiros mais procurados</li>
              <li>• Horários de maior movimento</li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    // Mark onboarding as completed in localStorage
    localStorage.setItem('onboarding_completed', 'true');
    onClose();
  };

  if (!isOpen) return null;

  const CurrentIcon = steps[currentStep].icon;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1A1F2E] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#F0B35B]/20 rounded-full">
              <CurrentIcon className="w-6 h-6 text-[#F0B35B]" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {steps[currentStep].title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">
              Passo {currentStep + 1} de {steps.length}
            </span>
            <span className="text-sm text-gray-400">
              {Math.round(((currentStep + 1) / steps.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-[#F0B35B] h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {steps[currentStep].content}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center space-x-2 px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Anterior</span>
          </button>

          <div className="flex space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep ? 'bg-[#F0B35B]' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>

          {currentStep === steps.length - 1 ? (
            <button
              onClick={handleFinish}
              className="flex items-center space-x-2 px-6 py-2 bg-[#F0B35B] text-black rounded-lg hover:bg-[#F0B35B]/90 transition-colors font-semibold"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Começar</span>
            </button>
          ) : (
            <button
              onClick={nextStep}
              className="flex items-center space-x-2 px-4 py-2 text-[#F0B35B] hover:text-[#F0B35B]/80 transition-colors"
            >
              <span>Próximo</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;