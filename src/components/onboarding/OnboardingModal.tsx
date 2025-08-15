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
      title: `🎉 Bem-vindo ao ${barbershopName}!`,
      icon: CheckCircle,
      content: (
        <div className="text-center">
          <p className="text-gray-300 mb-4">
            Parabéns! Sua barbearia está online e pronta para receber clientes.
          </p>
          <div className="bg-[#F0B35B]/10 border border-[#F0B35B]/20 rounded-lg p-4">
            <h4 className="text-[#F0B35B] font-semibold mb-2">✨ Sua barbearia já inclui:</h4>
            <ul className="text-sm text-gray-300 space-y-2 text-left">
              <li>✓ <strong>Página personalizada</strong> para seus clientes</li>
              <li>✓ <strong>2 serviços básicos</strong>: Militar (R$ 45) e Tesoura (R$ 50)</li>
              <li>✓ <strong>Sistema completo</strong> de agendamentos online</li>
              <li>✓ <strong>Dashboard</strong> com relatórios e estatísticas</li>
              <li>✓ <strong>Plano gratuito</strong>: 1 barbeiro, 20 agendamentos/mês</li>
            </ul>
          </div>
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-green-400 text-sm">
              🚀 Vamos fazer um tour rápido para você começar a usar tudo isso!
            </p>
          </div>
        </div>
      )
    },
    {
      title: '👥 Gerencie seus Barbeiros',
      icon: Users,
      content: (
        <div>
          <p className="text-gray-300 mb-4">
            Você já é o primeiro barbeiro! Agora pode adicionar mais membros à sua equipe.
          </p>
          <div className="bg-[#1A1F2E] rounded-lg p-4 border border-gray-700 mb-4">
            <h4 className="text-white font-semibold mb-2">📋 Como adicionar barbeiros:</h4>
            <ol className="text-sm text-gray-300 space-y-2">
              <li><strong>1.</strong> Vá para <span className="text-[#F0B35B]">"Barbeiros"</span> no menu lateral</li>
              <li><strong>2.</strong> Clique em <span className="text-[#F0B35B]">"Adicionar Barbeiro"</span></li>
              <li><strong>3.</strong> Preencha nome, WhatsApp e dados PIX</li>
              <li><strong>4.</strong> Configure horários de trabalho</li>
              <li><strong>5.</strong> Associe os serviços que ele oferece</li>
            </ol>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <p className="text-blue-400 text-sm">
              💡 <strong>Dica:</strong> No plano gratuito você tem 1 barbeiro. Para adicionar mais, faça upgrade para o plano Pro!
            </p>
          </div>
        </div>
      )
    },
    {
      title: '✂️ Seus Serviços Estão Prontos',
      icon: Settings,
      content: (
        <div>
          <p className="text-gray-300 mb-4">
            Já criamos 2 serviços básicos para você começar imediatamente!
          </p>
          <div className="bg-[#1A1F2E] rounded-lg p-4 border border-gray-700 mb-4">
            <h4 className="text-white font-semibold mb-3">🎯 Serviços já configurados:</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 bg-[#0D121E] rounded">
                <div>
                  <span className="text-[#F0B35B] font-medium">Militar</span>
                  <p className="text-xs text-gray-400">Corte militar clássico</p>
                </div>
                <div className="text-right">
                  <span className="text-white font-semibold">R$ 45</span>
                  <p className="text-xs text-gray-400">30 min</p>
                </div>
              </div>
              <div className="flex justify-between items-center p-2 bg-[#0D121E] rounded">
                <div>
                  <span className="text-[#F0B35B] font-medium">Tesoura</span>
                  <p className="text-xs text-gray-400">Corte tradicional com tesoura</p>
                </div>
                <div className="text-right">
                  <span className="text-white font-semibold">R$ 50</span>
                  <p className="text-xs text-gray-400">45 min</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <p className="text-green-400 text-sm">
              ✨ <strong>Personalize:</strong> Vá em "Serviços" para editar preços, adicionar novos serviços ou criar promoções!
            </p>
          </div>
        </div>
      )
    },
    {
      title: '📅 Sistema de Agendamentos',
      icon: Calendar,
      content: (
        <div>
          <p className="text-gray-300 mb-4">
            Seus clientes já podem agendar online! Veja como gerenciar os agendamentos.
          </p>
          <div className="bg-[#1A1F2E] rounded-lg p-4 border border-gray-700 mb-4">
            <h4 className="text-white font-semibold mb-3">🎛️ Funcionalidades disponíveis:</h4>
            <ul className="text-sm text-gray-300 space-y-2">
              <li>• <strong>Confirmar/Cancelar</strong> agendamentos com um clique</li>
              <li>• <strong>Ver detalhes</strong> completos de cada cliente</li>
              <li>• <strong>Agenda</strong> organizada por dia, semana ou mês</li>
              <li>• <strong>Notificações</strong> automáticas de novos agendamentos</li>
              <li>• <strong>Bloquear horários</strong> quando não estiver disponível</li>
            </ul>
          </div>
          <div className="bg-[#F0B35B]/10 border border-[#F0B35B]/20 rounded-lg p-3">
            <p className="text-[#F0B35B] text-sm">
              📱 <strong>Compartilhe:</strong> Sua página de agendamentos está em: <br/>
              <code className="text-xs bg-black/30 px-2 py-1 rounded mt-1 inline-block">
                barbershop.com/{barbershopName.toLowerCase().replace(/\s+/g, '-')}
              </code>
            </p>
          </div>
        </div>
      )
    },
    {
      title: '📊 Dashboard e Relatórios',
      icon: BarChart3,
      content: (
        <div>
          <p className="text-gray-300 mb-4">
            Acompanhe o crescimento da sua barbearia com relatórios detalhados.
          </p>
          <div className="bg-[#1A1F2E] rounded-lg p-4 border border-gray-700 mb-4">
            <h4 className="text-white font-semibold mb-3">📈 Métricas disponíveis:</h4>
            <ul className="text-sm text-gray-300 space-y-2">
              <li>• <strong>Agendamentos</strong> por dia, semana e mês</li>
              <li>• <strong>Receita estimada</strong> e faturamento</li>
              <li>• <strong>Barbeiros</strong> mais procurados</li>
              <li>• <strong>Serviços</strong> mais vendidos</li>
              <li>• <strong>Horários</strong> de maior movimento</li>
              <li>• <strong>Taxa de cancelamento</strong> e no-show</li>
            </ul>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
            <p className="text-purple-400 text-sm">
              🎯 <strong>Próximos passos:</strong> Vá para "Analytics" para ver relatórios detalhados e tomar decisões baseadas em dados!
            </p>
          </div>
        </div>
      )
    },
    {
      title: '🚀 Pronto para Começar!',
      icon: CheckCircle,
      content: (
        <div className="text-center">
          <p className="text-gray-300 mb-6">
            Sua barbearia está 100% configurada e pronta para receber clientes!
          </p>
          <div className="bg-gradient-to-r from-[#F0B35B]/20 to-purple-500/20 border border-[#F0B35B]/30 rounded-lg p-6 mb-6">
            <h4 className="text-[#F0B35B] font-bold text-lg mb-4">🎉 Resumo do que você tem:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-gray-300">Página personalizada online</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-gray-300">2 serviços configurados</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-gray-300">Sistema de agendamentos</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-gray-300">Dashboard completo</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-gray-300">Relatórios e analytics</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span className="text-gray-300">Plano gratuito ativo</span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <h5 className="text-blue-400 font-semibold mb-2">💡 Dicas para começar:</h5>
            <ul className="text-sm text-gray-300 space-y-1 text-left">
              <li>1. Compartilhe sua página com clientes</li>
              <li>2. Teste fazendo um agendamento</li>
              <li>3. Configure seus horários de trabalho</li>
              <li>4. Personalize preços se necessário</li>
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
              className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-[#F0B35B] to-[#F0B35B]/80 text-black rounded-lg hover:from-[#F0B35B]/90 hover:to-[#F0B35B]/70 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-[#F0B35B]/30"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Começar a Usar!</span>
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