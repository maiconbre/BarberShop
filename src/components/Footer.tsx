import { Instagram, Facebook, Twitter } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Footer = () => {
  const navigate = useNavigate();
  const socialLinks = [
    { icon: <Instagram size={20} />, label: 'Instagram' },
    { icon: <Facebook size={20} />, label: 'Facebook' },
    { icon: <Twitter size={20} />, label: 'Twitter' }
  ];

  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      viewport={{ once: true }}
      className="bg-gradient-to-b from-[#1A1F2E] to-[#0D121E] py-8 px-4 border-t border-[#252B3B]/50"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Social Links */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-[#F0B35B] text-sm font-semibold mb-4">Siga-nos</h3>
            <div className="flex gap-4">
              {socialLinks.map((link) => (
                <motion.a
                  key={link.label}
                  href="#"
                  className="text-gray-400 hover:text-[#F0B35B] transition-colors p-2 rounded-lg hover:bg-[#252B3B]/50"
                  aria-label={link.label}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  {link.icon}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col items-center">
            <h3 className="text-[#F0B35B] text-sm font-semibold mb-4">Links Rápidos</h3>
            <div className="flex flex-col items-center gap-2">
              <Link
                to="/services"
                className="text-gray-400 hover:text-[#F0B35B] text-sm transition-colors"
              >
                Serviços
              </Link>
              <Link
                to="/about"
                className="text-gray-400 hover:text-[#F0B35B] text-sm transition-colors"
              >
                Sobre Nós
              </Link>
              <Link
                to="/contact"
                className="text-gray-400 hover:text-[#F0B35B] text-sm transition-colors"
              >
                Contato
              </Link>
            </div>
          </div>

          {/* Copyright */}
          <div className="flex flex-col items-center md:items-end gap-2">
            <Link
              to="/login"
              className="text-[#F0B35B] text-sm transition-colors"
            >
              Área do Barbeiro
            </Link>
            <motion.button
              onClick={() => navigate('/vendapage2')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-[#F0B35B] text-sm hover:bg-[#F0B35B]/10 px-3 py-1 rounded-md transition-colors"
            >
              Página de Venda
            </motion.button>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#252B3B]/50 mt-4 pt-4 text-center">
          <p className="text-gray-500 text-sm">
          Target Web®  All rights reserved © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;