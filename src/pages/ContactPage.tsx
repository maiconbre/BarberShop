import { MapPin } from 'lucide-react';

const ContactPage = () => {
  return (
    <div className="min-h-screen bg-[#0D121E] text-white p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-[#1A1F2E] p-8 rounded-lg shadow-xl border border-[#F0B35B]/10">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <MapPin className="text-[#F0B35B]" /> Localização
          </h2>
          <div className="w-full h-[calc(100vh-200px)] rounded-lg overflow-hidden">
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
  );
};

export default ContactPage;