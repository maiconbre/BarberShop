import { Clock, Scissors, Award, MapPin, Star } from 'lucide-react';
import { useState, useEffect } from 'react';

const About = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    const element = document.getElementById('about-section');
    if (element) observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  }, []);

  const features = [
    {
      icon: <Scissors className="w-6 h-6" />,
      title: "Profissionais Experientes",
      description: "Nossa equipe é formada por barbeiros com anos de experiência e constante atualização."
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Qualidade Premium",
      description: "Utilizamos produtos de alta qualidade para garantir o melhor resultado para nossos clientes."
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Localização Privilegiada",
      description: "Estamos localizados em um ponto de fácil acesso, com estacionamento próximo."
    }
  ];

  return (
    <div id="about-section" className="py-20 px-4 bg-[#0D121E] relative overflow-hidden">
      {/* Elementos decorativos */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#F0B35B]/10 to-transparent rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-[#F0B35B]/5 to-transparent rounded-full blur-3xl -translate-x-1/3 translate-y-1/3"></div>
      
      {/* Padrão de linhas decorativas */}
      <div className="absolute inset-0 opacity-5">
        <div className="h-full w-full" style={{ 
          backgroundImage: 'linear-gradient(90deg, #F0B35B 1px, transparent 1px), linear-gradient(180deg, #F0B35B 1px, transparent 1px)', 
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-block mb-3">
            <div className="flex items-center justify-center space-x-2 text-[#F0B35B]">
              <div className="h-px w-8 bg-[#F0B35B]"></div>
              <span className="uppercase text-sm font-semibold tracking-wider">Nossa História</span>
              <div className="h-px w-8 bg-[#F0B35B]"></div>
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-white">
            Sobre Nossa <span className="text-[#F0B35B]">Barbearia</span>
          </h2>
          <p className="text-gray-300 max-w-3xl mx-auto text-lg">
            Com mais de 10 anos de experiência, nossa barbearia é referência em cortes modernos e clássicos.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
            <p className="text-gray-300 mb-8 text-lg leading-relaxed">
              Oferecemos um ambiente acolhedor onde você pode relaxar enquanto nossos profissionais altamente
              qualificados cuidam do seu visual. Nossa missão é proporcionar uma experiência única de cuidado pessoal,
              combinando técnicas tradicionais com tendências contemporâneas.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="bg-[#1A1F2E] p-6 rounded-lg border border-[#F0B35B]/10 hover:border-[#F0B35B]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#F0B35B]/5 hover:-translate-y-1"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-[#F0B35B] bg-[#F0B35B]/10 p-2 rounded-md">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                  </div>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </div>
              ))}
            </div>

            <div className="bg-[#1A1F2E] p-6 rounded-lg border border-[#F0B35B]/20 shadow-lg mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="text-[#F0B35B]" />
                <h3 className="text-xl font-semibold">Horário de Funcionamento</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex justify-between items-center border-b border-gray-700/30 pb-2">
                  <span className="font-medium">Segunda - Sexta</span>
                  <span className="bg-[#F0B35B]/10 text-[#F0B35B] px-3 py-1 rounded-full text-sm font-medium">09:00 - 20:00</span>
                </li>
                <li className="flex justify-between items-center border-b border-gray-700/30 pb-2">
                  <span className="font-medium">Sábado</span>
                  <span className="bg-[#F0B35B]/10 text-[#F0B35B] px-3 py-1 rounded-full text-sm font-medium">09:00 - 18:00</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="font-medium">Domingo</span>
                  <span className="bg-red-500/10 text-red-400 px-3 py-1 rounded-full text-sm font-medium">Fechado</span>
                </li>
              </ul>
            </div>

            <div className="bg-[#1A1F2E] p-6 rounded-lg border border-[#F0B35B]/10 mb-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <MapPin className="text-[#F0B35B]" /> Localização
              </h2>
              <div className="w-full h-[300px] sm:h-[400px] rounded-lg overflow-hidden">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3675.356219553567!2d-43.46652532378739!3d-22.90456623858615!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9be15839e68c4f%3A0x588a284ae162bc38!2sBangu%2C%20Rio%20de%20Janeiro%20-%20RJ!5e0!3m2!1spt-BR!2sbr!4v1699564511297!5m2!1spt-BR!2sbr"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Mapa de localização"
                  className="rounded-lg"
                ></iframe>
              </div>
            </div>
          </div>

          <div className={`space-y-6 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
            <div className="relative group overflow-hidden rounded-lg shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1572663459735-75425e957ab9?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="Barbearia interior"
                className="rounded-lg w-full h-80 object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-80"></div>
              <div className="absolute bottom-0 left-0 p-6">
                <h3 className="text-xl font-bold text-white mb-2">Ambiente</h3>
                <p className="text-gray-300 text-sm">Um espaço pensado para seu conforto e bem-estar</p>
              </div>
            </div>

            <div className="bg-[#1A1F2E] p-4 rounded-lg border border-[#F0B35B]/10">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Star className="text-[#F0B35B] w-4 h-4" /> Avaliações
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-[#0D121E]/50 rounded-lg hover:bg-[#0D121E] transition-colors duration-300">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex text-[#F0B35B] gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-current" />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">2d</span>
                  </div>
                  <p className="text-gray-300 text-xs italic leading-relaxed">"Melhor barbearia da região! Atendimento excelente e resultado impecável."</p>
                  <p className="text-[#F0B35B] text-xs mt-1.5 font-medium">- Carlos S.</p>
                </div>

                <div className="p-3 bg-[#0D121E]/50 rounded-lg hover:bg-[#0D121E] transition-colors duration-300">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex text-[#F0B35B] gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-current" />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">1sem</span>
                  </div>
                  <p className="text-gray-300 text-xs italic leading-relaxed">"Profissionais atenciosos e ambiente agradável. Corte perfeito!"</p>
                  <p className="text-[#F0B35B] text-xs mt-1.5 font-medium">- Rafael M.</p>
                </div>

                <div className="p-3 bg-[#0D121E]/50 rounded-lg hover:bg-[#0D121E] transition-colors duration-300">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex text-[#F0B35B] gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-current" />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">2sem</span>
                  </div>
                  <p className="text-gray-300 text-xs italic leading-relaxed">"Ótimo atendimento, preço justo e ambiente acolhedor. Minha barbearia favorita!"</p>
                  <p className="text-[#F0B35B] text-xs mt-1.5 font-medium">- Pedro H.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;