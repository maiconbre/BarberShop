import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Phone, Clock, Instagram, Facebook, Mail } from 'lucide-react';
import { useTenant } from '../../contexts/TenantContext';

const BarbershopFooter: React.FC = () => {
  const { barbershopData } = useTenant();
  const navigate = useNavigate();

  const currentYear = new Date().getFullYear();

  // Informações padrão que podem ser personalizadas por barbearia
  const defaultInfo = {
    address: 'Rua das Barbearias, 123 - Centro',
    phone: '(21) 99999-9999',
    email: 'contato@barbearia.com',
    workingHours: {
      weekdays: 'Segunda à Sexta: 9h às 18h',
      saturday: 'Sábado: 9h às 16h',
      sunday: 'Domingo: 10h às 14h'
    },
    social: {
      instagram: '#',
      facebook: '#'
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer id="contact" className="bg-[#0A0F1A] text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Informações da Barbearia */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-[#F0B35B] to-[#E6A555] rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-lg">
                  {barbershopData?.name?.charAt(0) || 'B'}
                </span>
              </div>
              <h3 className="text-2xl font-bold">
                {barbershopData?.name || 'Barbearia'}
              </h3>
            </div>

            <p className="text-gray-400 mb-6 max-w-md">
              {barbershopData?.description ||
                'Transformamos seu visual com estilo e profissionalismo. Venha conhecer nossos serviços exclusivos.'}
            </p>

            {/* Redes Sociais */}
            <div className="flex space-x-4">
              <a
                href={defaultInfo.social.instagram}
                className="w-10 h-10 bg-[#1A1F2E] rounded-lg flex items-center justify-center hover:bg-[#F0B35B] hover:text-black transition-colors duration-200"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href={defaultInfo.social.facebook}
                className="w-10 h-10 bg-[#1A1F2E] rounded-lg flex items-center justify-center hover:bg-[#F0B35B] hover:text-black transition-colors duration-200"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href={`mailto:${defaultInfo.email}`}
                className="w-10 h-10 bg-[#1A1F2E] rounded-lg flex items-center justify-center hover:bg-[#F0B35B] hover:text-black transition-colors duration-200"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links Rápidos */}
          <div>
            <h4 className="text-lg font-semibold mb-6 text-[#F0B35B]">Links Rápidos</h4>
            <ul className="space-y-3">
              <li>
                <button
                  onClick={() => scrollToSection('hero')}
                  className="text-gray-400 hover:text-[#F0B35B] transition-colors duration-200"
                >
                  Início
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('services')}
                  className="text-gray-400 hover:text-[#F0B35B] transition-colors duration-200"
                >
                  Serviços
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('about')}
                  className="text-gray-400 hover:text-[#F0B35B] transition-colors duration-200"
                >
                  Sobre
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('contact')}
                  className="text-gray-400 hover:text-[#F0B35B] transition-colors duration-200"
                >
                  Contato
                </button>
              </li>
            </ul>
          </div>

          {/* Informações de Contato */}
          <div>
            <h4 className="text-lg font-semibold mb-6 text-[#F0B35B]">Contato</h4>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-[#F0B35B] mt-1 flex-shrink-0" />
                <div>
                  <p className="text-gray-400 text-sm">Endereço</p>
                  <p className="text-white">{barbershopData?.address || defaultInfo.address}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-[#F0B35B] mt-1 flex-shrink-0" />
                <div>
                  <p className="text-gray-400 text-sm">Telefone</p>
                  <a
                    href={`tel:${barbershopData?.phone || defaultInfo.phone}`}
                    className="text-white hover:text-[#F0B35B] transition-colors duration-200"
                  >
                    {barbershopData?.phone || defaultInfo.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-[#F0B35B] mt-1 flex-shrink-0" />
                <div>
                  <p className="text-gray-400 text-sm">Horário</p>
                  <div className="text-white text-sm space-y-1">
                    <p>{defaultInfo.workingHours.weekdays}</p>
                    <p>{defaultInfo.workingHours.saturday}</p>
                    <p>{defaultInfo.workingHours.sunday}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Linha divisória */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              © {currentYear} {barbershopData?.name || 'Barbearia'}. Todos os direitos reservados.
            </p>

            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <a href="#" className="hover:text-[#F0B35B] transition-colors duration-200">
                Política de Privacidade
              </a>
              <a href="#" className="hover:text-[#F0B35B] transition-colors duration-200">
                Termos de Uso
              </a>
              <button
                onClick={() => navigate('/login')}
                className="hover:text-[#F0B35B] transition-colors duration-200 text-xs opacity-50 hover:opacity-100"
              >
                Login Barbeiros
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default BarbershopFooter;