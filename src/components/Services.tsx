import { Scissors } from 'lucide-react';

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
    <section className="py-10 px-4 bg-[#0D121E]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Nossos Serviços</h2>
          <p className="text-gray-300">Escolha entre nossa variedade de serviços profissionais</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-sm sm:max-w-none mx-auto">
          {services.map((service) => (
            <div 
              key={service.name} 
              className="bg-[#1A1F2E] rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 parallax"
            >
              <div className="h-48 sm:h-40 lg:h-48 overflow-hidden">
                <img 
                  src={service.image} 
                  alt={service.name}
                  className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="p-4 sm:p-5 lg:p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg sm:text-xl font-semibold">{service.name}</h3>
                  <Scissors className="text-[#F0B35B]" size={20} />
                </div>
                <p className="text-gray-300 text-sm mb-4">{service.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-[#F0B35B] font-bold text-lg sm:text-xl">{service.price}</span>
                  <button className="relative overflow-hidden group bg-[#F0B35B] text-black px-4 py-2 rounded-md transition-all duration-300 hover:scale-110 border-2 border-[#F0B35B]/70 hover:shadow-[0_0_15px_rgba(240,179,91,0.5)]">
                    <span className="relative z-10">Agendar</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#F0B35B]/0 via-white/40 to-[#F0B35B]/0 -skew-x-45 opacity-0 group-hover:opacity-100 group-hover:animate-shine"></div>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;