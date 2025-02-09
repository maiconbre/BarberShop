import { Instagram, Facebook, Twitter, Youtube } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#1A1F2E] py-4 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-6">
            <a 
              href="#" 
              className="text-gray-400 hover:text-[#F0B35B] transition-colors"
              aria-label="Instagram"
            >
              <Instagram size={20} />
            </a>
            <a 
              href="#" 
              className="text-gray-400 hover:text-[#F0B35B] transition-colors"
              aria-label="Facebook"
            >
              <Facebook size={20} />
            </a>
            <a 
              href="#" 
              className="text-gray-400 hover:text-[#F0B35B] transition-colors"
              aria-label="Twitter"
            >
              <Twitter size={20} />
            </a>
            <a 
              href="#" 
              className="text-gray-400 hover:text-[#F0B35B] transition-colors"
              aria-label="Youtube"
            >
              <Youtube size={20} />
            </a>
          </div>
          <p className="text-gray-400 text-[10px] text-sm">
          Maicon B. © 2024 All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;