import React, { useState } from 'react';
import { Mail, Phone, MapPin, Instagram, Facebook, Send, Loader2, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulação de envio
        await new Promise(resolve => setTimeout(resolve, 1500));

        setIsSubmitting(false);
        setSubmitSuccess(true);
        setFormData({ name: '', email: '', subject: '', message: '' });

        setTimeout(() => setSubmitSuccess(false), 5000);
    };

    const contactInfo = [
        {
            icon: <Phone className="w-6 h-6 text-[#F0B35B]" />,
            title: 'Telefone',
            details: '(21) 99999-9999',
            subDetails: 'Seg-Sáb, 09:00 - 20:00'
        },
        {
            icon: <Mail className="w-6 h-6 text-[#F0B35B]" />,
            title: 'E-mail',
            details: 'contato@barbershop.com',
            subDetails: 'Resposta em até 24h'
        },
        {
            icon: <MapPin className="w-6 h-6 text-[#F0B35B]" />,
            title: 'Endereço',
            details: 'R. Francisco Real, 1950',
            subDetails: 'Bangu, Rio de Janeiro - RJ'
        }
    ];

    return (
        <div className="py-20 px-4 md:px-8 bg-[#0D121E]">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-4xl md:text-5xl font-bold text-white mb-4"
                    >
                        Fale <span className="text-[#F0B35B]">Conosco</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-gray-400 max-w-2xl mx-auto"
                    >
                        Tem alguma dúvida, sugestão ou reclamação? Estamos prontos para te ouvir e ajudar da melhor forma possível.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Informações de Contato */}
                    <div className="lg:col-span-1 space-y-6">
                        {contactInfo.map((info, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="bg-[#1A1F2E] p-6 rounded-2xl border border-white/5 hover:border-[#F0B35B]/30 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-[#F0B35B]/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        {info.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold">{info.title}</h3>
                                        <p className="text-[#F0B35B] font-medium">{info.details}</p>
                                        <p className="text-gray-500 text-sm">{info.subDetails}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {/* Redes Sociais */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="bg-[#1A1F2E] p-6 rounded-2xl border border-white/5"
                        >
                            <h3 className="text-white font-bold mb-4">Siga-nos</h3>
                            <div className="flex gap-4">
                                <a href="#" className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-gray-400 hover:bg-[#F0B35B] hover:text-black transition-all">
                                    <Instagram size={20} />
                                </a>
                                <a href="#" className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-gray-400 hover:bg-[#F0B35B] hover:text-black transition-all">
                                    <Facebook size={20} />
                                </a>
                            </div>
                        </motion.div>
                    </div>

                    {/* Formulário de Contato */}
                    <div className="lg:col-span-2">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                            className="bg-[#1A1F2E] p-8 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden"
                        >
                            {/* Decorative elements */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#F0B35B]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-400 ml-1">Seu Nome</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Ex: João Silva"
                                            className="w-full px-4 py-3 bg-[#0D121E] border border-white/10 rounded-xl text-white focus:border-[#F0B35B] focus:ring-1 focus:ring-[#F0B35B] outline-none transition-all placeholder:text-gray-600"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-400 ml-1">E-mail</label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="Ex: joao@email.com"
                                            className="w-full px-4 py-3 bg-[#0D121E] border border-white/10 rounded-xl text-white focus:border-[#F0B35B] focus:ring-1 focus:ring-[#F0B35B] outline-none transition-all placeholder:text-gray-600"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400 ml-1">Assunto</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        placeholder="Como podemos ajudar?"
                                        className="w-full px-4 py-3 bg-[#0D121E] border border-white/10 rounded-xl text-white focus:border-[#F0B35B] focus:ring-1 focus:ring-[#F0B35B] outline-none transition-all placeholder:text-gray-600"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400 ml-1">Mensagem</label>
                                    <textarea
                                        required
                                        rows={5}
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        placeholder="Escreva sua mensagem aqui..."
                                        className="w-full px-4 py-3 bg-[#0D121E] border border-white/10 rounded-xl text-white focus:border-[#F0B35B] focus:ring-1 focus:ring-[#F0B35B] outline-none transition-all placeholder:text-gray-600 resize-none"
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting || submitSuccess}
                                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all transform active:scale-95
                    ${submitSuccess
                                            ? 'bg-green-500 text-white cursor-default'
                                            : 'bg-[#F0B35B] text-black hover:bg-[#D4943D] hover:shadow-lg hover:shadow-[#F0B35B]/20'
                                        }
                  `}
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : submitSuccess ? (
                                        <>
                                            <CheckCircle size={20} />
                                            Mensagem Enviada!
                                        </>
                                    ) : (
                                        <>
                                            <Send size={20} />
                                            Enviar Mensagem
                                        </>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                </div>

                {/* Mapa */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mt-20 rounded-3xl overflow-hidden border border-white/5 h-[400px] grayscale hover:grayscale-0 transition-all duration-700"
                >
                    <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3675.356219553567!2d-43.46652532378739!3d-22.90456623858615!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9be15839e68c4f%3A0x588a284ae162bc38!2sBangu%2C%20Rio%20de%20Janeiro%20-%20RJ!5e0!3m2!1spt-BR!2sbr!4v1699564511297!5m2!1spt-BR!2sbr"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        title="Localização da Barbearia"
                    ></iframe>
                </motion.div>
            </div>
        </div>
    );
};

export default Contact;
