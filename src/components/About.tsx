import { Clock, Scissors, Award, MapPin, Star, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useState, useEffect, FormEvent, useRef } from 'react';
import ApiService from '../services/ApiService';

const About = () => {
  // Estados para visibilidade de cada seção
  const [headerVisible, setHeaderVisible] = useState(false);
  const [leftColVisible, setLeftColVisible] = useState(false);
  const [rightColVisible, setRightColVisible] = useState(false);
  const [featuresVisible, setFeaturesVisible] = useState(false);
  const [hoursVisible, setHoursVisible] = useState(false);
  const [locationVisible, setLocationVisible] = useState(false);
  const [reviewsVisible, setReviewsVisible] = useState(false);
  const [commentFormVisible, setCommentFormVisible] = useState(false);
  
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  // Estados para os comentários aprovados
  const [approvedComments, setApprovedComments] = useState<any[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentsError, setCommentsError] = useState('');
  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const commentsPerPage = 5;
  
  // Referências para cada seção
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const hoursRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);
  const commentFormRef = useRef<HTMLDivElement>(null);
  // Efeito para detectar quando cada seção entra na viewport
  useEffect(() => {
    // Função para criar um observer para cada elemento
    const createObserver = (ref: React.RefObject<HTMLDivElement>, setVisible: React.Dispatch<React.SetStateAction<boolean>>) => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        },
        {
          threshold: 0.1, // Quando pelo menos 5% do componente estiver visível
          rootMargin: '0px'
        }
      );

      if (ref.current) {
        observer.observe(ref.current);
      }

      return observer;
    };

    // Criar observers para cada seção
    const observers = [
      createObserver(headerRef, setHeaderVisible),
      createObserver(leftColRef, setLeftColVisible),
      createObserver(rightColRef, setRightColVisible),
      createObserver(featuresRef, setFeaturesVisible),
      createObserver(hoursRef, setHoursVisible),
      createObserver(locationRef, setLocationVisible),
      createObserver(reviewsRef, setReviewsVisible),
      createObserver(commentFormRef, setCommentFormVisible)
    ];

    // Cleanup function
    return () => {
      observers.forEach(observer => observer.disconnect());
    };
  }, []);

  // Efeito para carregar os comentários aprovados
  useEffect(() => {
    const fetchApprovedComments = async () => {
      setIsLoadingComments(true);
      setCommentsError('');

      try {
        // Usar ApiService em vez de fetch diretamente
        const data = await ApiService.getApprovedComments();

        if ((data as { success: boolean }).success) {
          setApprovedComments((data as { data: any[] }).data);
          setTotalPages(Math.ceil((data as { data: any[] }).data.length / commentsPerPage));
        } else {
          throw new Error((data as { message?: string }).message || 'Erro ao carregar comentários');
        }
      } catch (error) {
        console.error('Erro ao buscar comentários:', error);
        setCommentsError('Não foi possível carregar os comentários. Tente novamente mais tarde.');
      } finally {
        setIsLoadingComments(false);
      }
    };

    fetchApprovedComments();
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
    }
  ];

  return (
    <div ref={sectionRef} id="about-section" className="py-20 px-4 bg-[#0D121E] relative overflow-hidden">
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
        <div ref={headerRef} className={`text-center mb-16 transition-all duration-1000 ${headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
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
          <div ref={leftColRef} className={`transition-all duration-1000 delay-300 ${leftColVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
            <p className="text-gray-300 mb-8 text-lg leading-relaxed">
              Oferecemos um ambiente acolhedor onde você pode relaxar enquanto nossos profissionais altamente
              qualificados cuidam do seu visual. Nossa missão é proporcionar uma experiência única de cuidado pessoal,
              combinando técnicas tradicionais com tendências contemporâneas.
            </p>

            <div ref={featuresRef} className={`grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 transition-all duration-700 ${featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
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

            <div ref={hoursRef} className={`bg-[#1A1F2E] p-6 rounded-lg border border-[#F0B35B]/20 shadow-lg mb-6 transition-all duration-700 ${hoursVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
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

            <div ref={locationRef} className={`bg-[#1A1F2E] p-6 rounded-lg border border-[#F0B35B]/10 mb-6 transition-all duration-700 ${locationVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
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

          <div ref={rightColRef} className={`space-y-6 transition-all duration-1000 delay-300 ${rightColVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
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

            <div ref={reviewsRef} className={`bg-[#1A1F2E] p-4 rounded-lg border border-[#F0B35B]/10 transition-all duration-700 ${reviewsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Star className="text-[#F0B35B] w-4 h-4" /> Avaliações
              </h3>
              <div className="space-y-3">
                {isLoadingComments ? (
                  <div className="flex justify-center items-center py-6">
                    <Loader2 className="w-6 h-6 text-[#F0B35B] animate-spin" />
                    <span className="ml-2 text-gray-400">Carregando comentários...</span>
                  </div>
                ) : commentsError ? (
                  <div className="p-3 bg-red-500/10 text-red-400 rounded-lg text-sm">
                    {commentsError}
                  </div>
                ) : approvedComments.length === 0 ? (
                  <div className="p-3 bg-[#0D121E]/50 rounded-lg text-center">
                    <p className="text-gray-400 text-sm">Nenhum comentário aprovado ainda.</p>
                  </div>
                ) : (
                  <>
                    {/* Comentários paginados */}
                    {approvedComments
                      .slice((currentPage - 1) * commentsPerPage, currentPage * commentsPerPage)
                      .map((comment) => (
                        <div key={comment.id} className="p-3 bg-[#0D121E]/50 rounded-lg hover:bg-[#0D121E] transition-colors duration-300">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex text-[#F0B35B] gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-current" />
                              ))}
                            </div>
                            <span className="text-xs text-gray-400">
                              {new Date(comment.createdAt).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="text-gray-300 text-xs italic leading-relaxed">"{comment.comment}"</p>
                          <p className="text-[#F0B35B] text-xs mt-1.5 font-medium">- {comment.name}</p>
                        </div>
                      ))}

                    {/* Controles de paginação */}
                    {totalPages > 1 && (
                      <div className="flex justify-center items-center space-x-4 mt-4">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="p-1 rounded-full bg-[#0D121E] text-[#F0B35B] disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Página anterior"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>

                        <span className="text-sm text-gray-300">
                          {currentPage} de {totalPages}
                        </span>

                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="p-1 rounded-full bg-[#0D121E] text-[#F0B35B] disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Próxima página"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Seção de Comentários */}
            <div ref={commentFormRef} className={`bg-[#1A1F2E] p-6 rounded-lg border border-[#F0B35B]/10 mt-6 transition-all duration-700 ${commentFormVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Star className="text-[#F0B35B] w-4 h-4" /> Deixe seu comentário
              </h3>
              <form className="space-y-4" onSubmit={async (e: FormEvent) => {
                e.preventDefault();
                setIsSubmitting(true);
                setSubmitError('');

                // Prevent multiple submissions within 20 seconds
                const lastSubmitTime = localStorage.getItem('lastCommentSubmit');
                const now = Date.now();
                if (lastSubmitTime && now - parseInt(lastSubmitTime) < 20000) {
                  setSubmitError('Por favor, aguarde 20 segundos entre os comentários.');
                  setIsSubmitting(false);
                  return;
                }

                try {
                  const response = await fetch(`${(import.meta as any).env.VITE_API_URL}/api/comments`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                      // Removido o token de autorização, pois a rota é pública
                    },
                    body: JSON.stringify({
                      name,
                      comment,
                      status: 'pending'
                    })
                  });

                  if (!response.ok) {
                    throw new Error('Erro ao enviar comentário');
                  }

                  // Store submission timestamp
                  localStorage.setItem('lastCommentSubmit', now.toString());

                  setSubmitSuccess(true);
                  setName('');
                  setComment('');
                } catch (error) {
                  console.error(error);
                  setSubmitError('Erro ao enviar comentário. Tente novamente.');
                } finally {
                  setIsSubmitting(false);
                }
              }}>
                <div>
                  <input
                    type="text"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-[#0D121E] border border-[#F0B35B]/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#F0B35B]/50 transition-colors"
                  />
                </div>
                <div>
                  <textarea
                    placeholder="Seu comentário"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                    rows={4}
                    className="w-full bg-[#0D121E] border border-[#F0B35B]/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#F0B35B]/50 transition-colors resize-none"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#F0B35B] text-black px-6 py-2 rounded-lg font-semibold hover:bg-[#F0B35B]/90 transition-colors w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar Comentário'}
                </button>

                {submitSuccess && (
                  <div className="mt-3 p-3 bg-green-500/20 text-green-400 rounded-lg text-sm">
                    Comentário enviado com sucesso! Aguardando aprovação do administrador.
                    <p className="mt-1 text-xs">Seu comentário será exibido após aprovação.</p>
                  </div>
                )}

                {submitError && (
                  <div className="mt-3 p-3 bg-red-500/20 text-red-400 rounded-lg text-sm">
                    {submitError}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



export default About;