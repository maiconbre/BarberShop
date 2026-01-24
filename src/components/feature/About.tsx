import { Clock, Scissors, Award, MapPin, Star, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useState, useEffect, FormEvent, useRef } from 'react';
import { ServiceFactory } from '../../services/ServiceFactory';

const About = () => {
  // Estados para animações
  const [isVisible, setIsVisible] = useState(false);

  // Estados para comentários
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentsError, setCommentsError] = useState('');
  const [totalPages, setTotalPages] = useState(1);

  // Estados para formulário
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const commentsPerPage = 3;

  // Dados estáticos
  const aboutData = {
    title: 'Sobre Nossa',
    description: 'Com mais de 10 anos de experiência, nossa barbearia é referência em cortes modernos e clássicos.',
    hours: {
      weekdays: '09:00 - 20:00',
      saturday: '09:00 - 18:00',
      sunday: 'Fechado'
    }
  };

  // Referência para animação
  const sectionRef = useRef<HTMLDivElement>(null);

  // Efeito para detectar quando a seção entra na viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.2, // Quando pelo menos 20% do componente estiver visível
        rootMargin: '0px 0px -10% 0px' // Aciona um pouco antes para melhorar a experiência
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    // Cleanup function
    return () => {
      observer.disconnect();
    };
  }, [setIsVisible]);

  // Use CommentRepository
  const commentRepository = ServiceFactory.getCommentRepository();

  // Efeito para carregar os comentários aprovados
  useEffect(() => {
    // Função para buscar comentários com retry e backoff exponencial
    const fetchApprovedComments = async (retryCount = 0, delay = 1000) => {
      setIsLoadingComments(true);
      setCommentsError('');

      try {
        // Usar repositório para buscar comentários
        const response = await commentRepository.getApprovedComments();

        // Normalizar resposta da API
        let commentsData: Comment[] = [];

        if (Array.isArray(response)) {
          commentsData = response as any[];
        } else if (response && typeof response === 'object' && 'data' in response) {
          commentsData = Array.isArray((response as any).data) ? (response as any).data : [];
        }

        // Mapear para interface local se necessário
        const mappedComments: Comment[] = commentsData.map((c: any) => ({
          id: c.id,
          name: c.name || c.author || 'Anônimo',
          comment: c.comment || c.content || '',
          created_at: c.created_at || new Date().toISOString()
        }));

        setComments(mappedComments);
        setTotalPages(Math.ceil(mappedComments.length / commentsPerPage));

        // Armazenar em cache local
        try {
          localStorage.setItem('approvedComments', JSON.stringify(mappedComments));
          localStorage.setItem('approvedCommentsTimestamp', Date.now().toString());
        } catch (e) {
          console.error('Erro ao armazenar comentários no cache local:', e);
        }
      } catch (error) {
        // ... (existing error handling)
      }

      setIsLoadingComments(false);
    };

    fetchApprovedComments();
  }, [commentsPerPage, setIsLoadingComments, setCommentsError, setComments, setTotalPages]);
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

  // Efeito para animação inicial
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, [setIsVisible]);

  // Função para recarregar comentários
  const reloadComments = () => {
    // Recarregar a página para buscar novos comentários
    window.location.reload();
  };

  const handleSubmitComment = async (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !comment.trim()) {
      setSubmitError('Por favor, preencha todos os campos.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      // await ApiService.submitComment({ name: name.trim(), comment: comment.trim() });
      await commentRepository.create({
        name: name.trim(),
        content: comment.trim(),
        rating: 5, // Default rating
        approved: false // Pending approval
      });
      setSubmitSuccess(true);
      setName('');
      setComment('');

      // Recarregar comentários após envio
      setTimeout(() => {
        reloadComments();
        setSubmitSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Erro ao enviar comentário:', error);
      setSubmitError('Erro ao enviar comentário. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Paginação
  const startIndex = (currentPage - 1) * commentsPerPage;
  const currentComments = comments.slice(startIndex, startIndex + commentsPerPage);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div id="about-section" className="py-20 px-4 bg-[#0D121E] relative overflow-hidden" ref={sectionRef}>
      {/* Elementos decorativos */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#F0B35B]/10 to-transparent rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-[#F0B35B]/5 to-transparent rounded-full blur-3xl -translate-x-1/3 translate-y-1/3"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-block mb-3">
            <div className="flex items-center justify-center space-x-2 text-[#F0B35B]">
              <div className="h-px w-8 bg-[#F0B35B]"></div>
              <span className="uppercase text-sm font-semibold tracking-wider">Nossa História</span>
              <div className="h-px w-8 bg-[#F0B35B]"></div>
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-white">
            {aboutData.title} <span className="text-[#F0B35B]">Barbearia</span>
          </h2>
          <p className="text-gray-300 max-w-3xl mx-auto text-lg">
            {aboutData.description}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Coluna Esquerda */}
          <div className={`space-y-8 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
            <p className="text-gray-300 text-lg leading-relaxed">
              sOferecemos um ambiente acolhedor onde você pode relaxar enquanto nossos profissionais altamente
              qualificados cuidam do seu visual. Nossa missão é proporcionar uma experiência única de cuidado pessoal,
              combinando técnicas tradicionais com tendências contemporâneas.
            </p>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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

            {/* Horário de Funcionamento */}
            <div className="bg-[#1A1F2E] p-6 rounded-lg border border-[#F0B35B]/20 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="text-[#F0B35B]" />
                <h3 className="text-xl font-semibold text-white">Horário de Funcionamento</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex justify-between items-center border-b border-gray-700/30 pb-2">
                  <span className="font-medium text-gray-300">Segunda - Sexta</span>
                  <span className="bg-[#F0B35B]/10 text-[#F0B35B] px-3 py-1 rounded-full text-sm font-medium">
                    {aboutData.hours.weekdays}
                  </span>
                </li>
                <li className="flex justify-between items-center border-b border-gray-700/30 pb-2">
                  <span className="font-medium text-gray-300">Sábado</span>
                  <span className="bg-[#F0B35B]/10 text-[#F0B35B] px-3 py-1 rounded-full text-sm font-medium">
                    {aboutData.hours.saturday}
                  </span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="font-medium text-gray-300">Domingo</span>
                  <span className="bg-red-500/10 text-red-400 px-3 py-1 rounded-full text-sm font-medium">
                    {aboutData.hours.sunday}
                  </span>
                </li>
              </ul>
            </div>

            {/* Localização */}
            <div className="bg-[#1A1F2E] p-6 rounded-lg border border-[#F0B35B]/10">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                <MapPin className="text-[#F0B35B]" /> Localização
              </h3>
              <div className="w-full h-[300px] rounded-lg overflow-hidden">
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

          {/* Coluna Direita */}
          <div className={`space-y-6 transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
            {/* Imagem */}
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

            {/* Seção de Avaliações */}
            <div className="bg-[#1A1F2E] p-6 rounded-lg border border-[#F0B35B]/10">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-white">
                <Star className="text-[#F0B35B] w-5 h-5" /> Avaliações dos Clientes
              </h3>

              {isLoadingComments ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="w-6 h-6 text-[#F0B35B] animate-spin" />
                  <span className="ml-2 text-gray-400">Carregando comentários...</span>
                </div>
              ) : commentsError ? (
                <div className="p-4 rounded-lg bg-yellow-500/10 text-yellow-400 text-sm">
                  {commentsError}
                </div>
              ) : (
                <div className="space-y-4">
                  {currentComments.length > 0 ? (
                    currentComments.map((comment) => (
                      <div key={comment.id} className="bg-[#0D121E] p-4 rounded-lg border border-[#F0B35B]/5">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-[#F0B35B]">{comment.name}</h4>
                          <div className="flex text-[#F0B35B]">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="w-4 h-4 fill-current" />
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-300 text-sm">{comment.comment}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-center py-4">Nenhum comentário disponível.</p>
                  )}

                  {/* Paginação */}
                  {totalPages > 1 && (
                    <div className="flex justify-between items-center mt-4">
                      <button
                        onClick={prevPage}
                        disabled={currentPage === 1}
                        className="flex items-center gap-2 px-3 py-2 bg-[#F0B35B]/10 text-[#F0B35B] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F0B35B]/20 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" /> Anterior
                      </button>
                      <span className="text-gray-400 text-sm">
                        {currentPage} de {totalPages}
                      </span>
                      <button
                        onClick={nextPage}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-2 px-3 py-2 bg-[#F0B35B]/10 text-[#F0B35B] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F0B35B]/20 transition-colors"
                      >
                        Próximo <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Formulário de Comentário */}
            <div className="bg-[#1A1F2E] p-6 rounded-lg border border-[#F0B35B]/10">
              <h3 className="text-lg font-semibold mb-4 text-white">Deixe sua Avaliação</h3>

              {submitSuccess && (
                <div className="mb-4 p-3 rounded-lg bg-green-500/10 text-green-400 text-sm">
                  Comentário enviado com sucesso! Aguarde aprovação.
                </div>
              )}

              {submitError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">
                  {submitError}
                </div>
              )}

              <form onSubmit={handleSubmitComment} className="space-y-4">
                <input
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0D121E] border border-[#F0B35B]/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#F0B35B] transition-colors"
                  disabled={isSubmitting}
                />
                <textarea
                  placeholder="Seu comentário"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-[#0D121E] border border-[#F0B35B]/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#F0B35B] transition-colors resize-none"
                  disabled={isSubmitting}
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim() || !comment.trim()}
                  className="w-full px-6 py-3 bg-[#F0B35B] text-black font-semibold rounded-lg hover:bg-[#F0B35B]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar Comentário'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;