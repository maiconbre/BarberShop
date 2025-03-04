import React, { useState } from 'react';
import Footer from '../components/Footer';
import { MapPin, Phone, Mail, Clock, Send, Instagram, Facebook } from 'lucide-react';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    // Simulação de envio de formulário
    try {
      // Aqui você implementaria a lógica real de envio do formulário para um backend
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSubmitStatus({
        success: true,
        message: 'Mensagem enviada com sucesso! Entraremos em contato em breve.'
      });
      
      // Limpar o formulário após envio bem-sucedido
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: ''
      });
    } catch (error) {
      setSubmitStatus({
        success: false,
        message: 'Ocorreu um erro ao enviar sua mensagem. Por favor, tente novamente.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D121E] text-white relative overflow-hidden">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-block mb-3">
            <div className="flex items-center justify-center space-x-2 text-[#F0B35B]">
              <div className="h-px w-8 bg-[#F0B35B]"></div>
              <span className="uppercase text-sm font-semibold tracking-wider">Fale Conosco</span>
              <div className="h-px w-8 bg-[#F0B35B]"></div>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-white">
            Entre em <span className="text-[#F0B35B]">Contato</span>
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg">
            Estamos prontos para atender você e responder todas as suas dúvidas. Preencha o formulário abaixo ou utilize um de nossos canais de atendimento.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-[#1A1F2E] p-6 rounded-lg border border-[#F0B35B]/10 hover:border-[#F0B35B]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#F0B35B]/5 hover:-translate-y-1 group">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-[#F0B35B] bg-[#F0B35B]/10 p-3 rounded-md group-hover:bg-[#F0B35B] group-hover:text-black transition-colors duration-300">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold">Localização</h3>
            </div>
            <p className="text-gray-400">Rua Exemplo, 123</p>
            <p className="text-gray-400">Bangu, Rio de Janeiro - RJ</p>
          </div>

          <div className="bg-[#1A1F2E] p-6 rounded-lg border border-[#F0B35B]/10 hover:border-[#F0B35B]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#F0B35B]/5 hover:-translate-y-1 group">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-[#F0B35B] bg-[#F0B35B]/10 p-3 rounded-md group-hover:bg-[#F0B35B] group-hover:text-black transition-colors duration-300">
                <Phone className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold">Telefone</h3>
            </div>
            <p className="text-gray-400">(21) 99776-4645</p>
            <p className="text-gray-400">(21) 99774-6580</p>
          </div>

          <div className="bg-[#1A1F2E] p-6 rounded-lg border border-[#F0B35B]/10 hover:border-[#F0B35B]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#F0B35B]/5 hover:-translate-y-1 group">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-[#F0B35B] bg-[#F0B35B]/10 p-3 rounded-md group-hover:bg-[#F0B35B] group-hover:text-black transition-colors duration-300">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold">Horário</h3>
            </div>
            <p className="text-gray-400">Segunda - Sexta: 09:00 - 20:00</p>
            <p className="text-gray-400">Sábado: 09:00 - 18:00</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div className="bg-[#1A1F2E] p-8 rounded-lg shadow-xl border border-[#F0B35B]/10">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Mail className="text-[#F0B35B]" /> Envie uma Mensagem
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {submitStatus && (
                <div className={`p-4 rounded-md ${submitStatus.success ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  {submitStatus.message}
                </div>
              )}
              
              <div className="group">
                <label className="block text-sm font-medium mb-2 text-gray-300 group-hover:text-[#F0B35B] transition-colors">
                  Nome Completo
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#0D121E] rounded-lg focus:ring-2 focus:ring-[#F0B35B] outline-none transition-all duration-300 border border-transparent hover:border-[#F0B35B]/30 text-sm placeholder-gray-500"
                  placeholder="Digite seu nome"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group">
                  <label className="block text-sm font-medium mb-2 text-gray-300 group-hover:text-[#F0B35B] transition-colors">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#0D121E] rounded-lg focus:ring-2 focus:ring-[#F0B35B] outline-none transition-all duration-300 border border-transparent hover:border-[#F0B35B]/30 text-sm placeholder-gray-500"
                    placeholder="seu@email.com"
                  />
                </div>
                
                <div className="group">
                  <label className="block text-sm font-medium mb-2 text-gray-300 group-hover:text-[#F0B35B] transition-colors">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#0D121E] rounded-lg focus:ring-2 focus:ring-[#F0B35B] outline-none transition-all duration-300 border border-transparent hover:border-[#F0B35B]/30 text-sm placeholder-gray-500"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
              
              <div className="group">
                <label className="block text-sm font-medium mb-2 text-gray-300 group-hover:text-[#F0B35B] transition-colors">
                  Mensagem
                </label>
                <textarea
                  name="message"
                  required
                  value={formData.message}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-4 py-3 bg-[#0D121E] rounded-lg focus:ring-2 focus:ring-[#F0B35B] outline-none transition-all duration-300 border border-transparent hover:border-[#F0B35B]/30 text-sm placeholder-gray-500 resize-none"
                  placeholder="Digite sua mensagem aqui..."
                ></textarea>
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="relative overflow-hidden group w-full bg-[#F0B35B] text-black px-6 py-3 rounded-lg text-base font-semibold transition-all duration-300 ease-out hover:bg-[#F0B35B]/90 hover:shadow-[0_0_20px_rgba(240,179,91,0.3)] active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {isSubmitting ? 'Enviando...' : 'Enviar Mensagem'}
                  <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#F0B35B]/0 via-white/20 to-[#F0B35B]/0 -skew-x-45 group-hover:animate-shine"></div>
              </button>
            </form>
          </div>
          
          <div className="space-y-8">
            <div className="bg-[#1A1F2E] p-8 rounded-lg shadow-xl border border-[#F0B35B]/10">
              <h2 className="text-2xl font-bold mb-6">Redes Sociais</h2>
              <div className="flex flex-wrap gap-4">
                <a 
                  href="https://instagram.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-3 rounded-lg hover:opacity-90 transition-opacity"
                >
                  <Instagram className="w-5 h-5" />
                  <span>Instagram</span>
                </a>
                <a 
                  href="https://facebook.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-blue-600 text-white px-4 py-3 rounded-lg hover:opacity-90 transition-opacity"
                >
                  <Facebook className="w-5 h-5" />
                  <span>Facebook</span>
                </a>
              </div>
            </div>
            
            <div className="bg-[#1A1F2E] p-8 rounded-lg shadow-xl border border-[#F0B35B]/10 mt-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <MapPin className="text-[#F0B35B]" /> Localização
              </h2>
              <div className="w-full h-64 rounded-lg overflow-hidden">
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
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ContactPage;