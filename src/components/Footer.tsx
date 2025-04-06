import { Instagram, Facebook, Twitter, Mail, Phone, MapPin, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';


const Footer = () => {
  const navigate = useNavigate();
  
  // Valores estáticos para o Footer
  // Redes sociais
  const instagramUrl = '#';
  const facebookUrl = '#';
  const twitterUrl = '#';
  
  // Informações de contato
  const phone = '(11) 99999-9999';
  const email = 'contato@barbershop.com';
  const address = 'Rua Exemplo, 123 - Centro';
  
  // Horários de funcionamento
  const weekdaysHours = '09:00 - 20:00';
  const saturdayHours = '09:00 - 18:00';
  const sundayHours = 'Fechado';
  
  const socialLinks = [
    { icon: <Instagram size={20} />, label: 'Instagram', url: instagramUrl },
    { icon: <Facebook size={20} />, label: 'Facebook', url: facebookUrl },
    { icon: <Twitter size={20} />, label: 'Twitter', url: twitterUrl }
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
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
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

          {/* Contato e Horários */}
          <div className="flex flex-col items-center">
            <h3 className="text-[#F0B35B] text-sm font-semibold mb-4">Contato e Horários</h3>
            <div className="flex flex-col items-center gap-2 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-[#F0B35B]" />
                <span>{phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-[#F0B35B]" />
                <span>{email}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-[#F0B35B]" />
                <span>{address}</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Clock size={16} className="text-[#F0B35B]" />
                <div className="flex flex-col">
                  <span>Seg-Sex: {weekdaysHours}</span>
                  <span>Sábado: {saturdayHours}</span>
                  <span>Domingo: {sundayHours}</span>
                </div>
              </div>
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