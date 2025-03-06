import { Scissors } from 'lucide-react';
import { motion } from 'framer-motion';

const services = [
  {
    name: 'Máquina e Tesoura',
    price: 'R$ 45,00',
    image: 'https://images.unsplash.com/photo-1635273051839-003bf06a8751?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    description: 'Corte completo com acabamento perfeito'
  },
  {
    name: 'Barba',
    price: 'R$ 35,00',
    image: 'https://images.unsplash.com/photo-1532710093739-9470acff878f?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    description: 'Barba aparada e alinhada'
  },
  {
    name: 'Reflexo',
    price: 'R$ 80,00',
    image: 'https://i.pinimg.com/736x/91/0f/c9/910fc9828671f2a76e51ac56242f61d8.jpg',
    description: 'Mechas e reflexos personalizados'
  }
];

const Services = () => {
  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-[#0D121E] min-h-screen">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#F0B35B] to-[#F0B35B]/80">
            Nossos Serviços
          </h2>
          <p className="text-gray-300 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto">
            Escolha entre nossa variedade de serviços profissionais para uma experiência única
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 max-w-sm sm:max-w-none mx-auto">
          {services.map((service, index) => (
            <motion.div 
              key={service.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              <div className="relative h-48 sm:h-56 lg:h-64 overflow-hidden group">
                <motion.img 
                  src={service.image} 
                  alt={service.name}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out"
                  whileHover={{ scale: 1.1 }}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>

              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                    {service.name}
                  </h3>
                  <motion.div
                    whileHover={{ rotate: 180 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Scissors className="text-[#F0B35B] w-6 h-6 sm:w-7 sm:h-7" />
                  </motion.div>
                </div>

                <p className="text-gray-300 text-sm sm:text-base mb-6">{service.description}</p>

                <div className="flex justify-between items-center">
                  <span className="text-[#F0B35B] font-bold text-xl sm:text-2xl">{service.price}</span>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative overflow-hidden group bg-[#F0B35B] text-black px-6 py-2.5 rounded-lg transition-all duration-300 font-semibold text-sm sm:text-base hover:shadow-[0_0_20px_rgba(240,179,91,0.4)] focus:outline-none focus:ring-2 focus:ring-[#F0B35B]/50"
                  >
                    <span className="relative z-10">Agendar</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 -skew-x-45 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-700"></div>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;