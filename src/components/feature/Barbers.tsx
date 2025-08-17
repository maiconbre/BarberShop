import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Star, Clock, Award } from 'lucide-react';
import { useTenant } from '../../contexts/TenantContext';
import { BarberRepository } from '../../services/repositories/BarberRepository';
import LoadingSpinner from '../ui/LoadingSpinner';

interface Barber {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  specialties?: string[];
  experience?: string;
  rating?: number;
  totalAppointments?: number;
  profileImage?: string;
}

interface BarbersProps {
  isShowcase?: boolean;
}

const Barbers: React.FC<BarbersProps> = ({ isShowcase = false }) => {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { barbershopData } = useTenant();

  useEffect(() => {
    const loadBarbers = async () => {
      if (!barbershopData?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const barberRepository = new BarberRepository();
        const barbersData = await barberRepository.getAll();
        
        console.log('Barbers loaded:', barbersData);
        setBarbers(barbersData || []);
      } catch (err) {
        console.error('Erro ao carregar barbeiros:', err);
        setError('Erro ao carregar barbeiros');
        setBarbers([]);
      } finally {
        setLoading(false);
      }
    };

    loadBarbers();
  }, [barbershopData?.id]);

  if (loading) {
    return (
      <section className="py-16 bg-[#0D121E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <LoadingSpinner size="md" text="Carregando barbeiros..." />
          </div>
        </div>
      </section>
    );
  }

  if (error || !barbers || barbers.length === 0) {
    return (
      <section className="py-16 bg-[#0D121E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="p-3 bg-[#F0B35B]/20 rounded-full">
                <Users className="w-8 h-8 text-[#F0B35B]" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                Nossa Equipe
              </h2>
            </div>
            <p className="text-gray-400 text-lg">
              {error || 'Nenhum barbeiro disponível no momento.'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-[#0D121E]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="flex items-center justify-center space-x-3 mb-6"
          >
            <div className="p-3 bg-[#F0B35B]/20 rounded-full">
              <Users className="w-8 h-8 text-[#F0B35B]" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Nossa Equipe
            </h2>
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-gray-400 text-lg max-w-2xl mx-auto"
          >
            Conheça nossos profissionais especializados, prontos para cuidar do seu visual com excelência
          </motion.p>
        </div>

        {/* Grid de Barbeiros */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {barbers.map((barber, index) => (
            <motion.div
              key={barber.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-[#1A1F2E] to-[#252A3A] rounded-xl p-6 border border-gray-700 hover:border-[#F0B35B]/50 transition-all duration-300 group hover:shadow-xl hover:shadow-[#F0B35B]/10"
            >
              {/* Avatar */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-[#F0B35B] to-[#E6A555] rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    {barber.profileImage ? (
                      <img
                        src={barber.profileImage}
                        alt={barber.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      barber.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-2 border-[#1A1F2E] flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Informações do Barbeiro */}
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#F0B35B] transition-colors">
                  {barber.name}
                </h3>
                
                {/* Especialidades */}
                {barber.specialties && barber.specialties.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap justify-center gap-2">
                      {barber.specialties.slice(0, 3).map((specialty, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-[#F0B35B]/20 text-[#F0B35B] text-xs rounded-full border border-[#F0B35B]/30"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Estatísticas */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {barber.rating && (
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-white font-semibold">{barber.rating.toFixed(1)}</span>
                      </div>
                      <p className="text-gray-400 text-xs">Avaliação</p>
                    </div>
                  )}
                  
                  {barber.totalAppointments && (
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <Clock className="w-4 h-4 text-[#F0B35B]" />
                        <span className="text-white font-semibold">{barber.totalAppointments}+</span>
                      </div>
                      <p className="text-gray-400 text-xs">Atendimentos</p>
                    </div>
                  )}
                </div>

                {/* Experiência */}
                {barber.experience && (
                  <div className="flex items-center justify-center space-x-2 text-gray-400 text-sm">
                    <Award className="w-4 h-4 text-[#F0B35B]" />
                    <span>{barber.experience}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        {isShowcase && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <div className="bg-gradient-to-r from-[#F0B35B]/20 to-purple-500/20 border border-[#F0B35B]/30 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-white mb-4">
                Pronto para agendar?
              </h3>
              <p className="text-gray-400 mb-6">
                Escolha seu barbeiro favorito e agende seu horário
              </p>
              <button className="bg-gradient-to-r from-[#F0B35B] to-[#E6A555] text-black px-8 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-[#F0B35B]/25 transition-all duration-300 transform hover:scale-105">
                Agendar Agora
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default Barbers;