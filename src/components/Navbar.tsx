import React from 'react';
import { Menu, X } from 'lucide-react';

interface NavbarProps {
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
}

const Navbar: React.FC<NavbarProps> = ({
  isModalOpen,
  setIsModalOpen,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}) => {
  return (
    <nav className="fixed w-full bg-[#0D121E]/95 backdrop-blur-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <span className="text-[#F0B35B] font-bold text-xl">GR Barber</span>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <a href="#" className="text-white hover:text-[#F0B35B] transition-colors">Sobre</a>
              <a href="#" className="text-white hover:text-[#F0B35B] transition-colors">Serviços</a>
              <a href="#" className="text-white hover:text-[#F0B35B] transition-colors">Contatos</a>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-[#F0B35B] text-black px-4 py-2 rounded-md hover:bg-[#F0B35B]/80 transition-colors"
              >
                Agendar horário
              </button>
            </div>
          </div>
          
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white hover:text-[#F0B35B]"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-[#0D121E]/95 backdrop-blur-sm">
            <a href="#" className="block text-white hover:text-[#F0B35B] py-2 px-3">Sobre</a>
            <a href="#" className="block text-white hover:text-[#F0B35B] py-2 px-3">Serviços</a>
            <a href="#" className="block text-white hover:text-[#F0B35B] py-2 px-3">Contatos</a>
            <button
              onClick={() => {
                setIsModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-left bg-[#F0B35B] text-black px-3 py-2 rounded-md hover:bg-[#F0B35B]/80 transition-colors"
            >
              Agendar horário
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;