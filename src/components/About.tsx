import { Clock } from 'lucide-react';

const About = () => {
  return (
    <div className=" px-4 bg-[#0D121E]">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl py-5 flex text-center font-bold mb-6">Sobre Nossa Barbearia</h2>
            <p className="text-gray-300 mb-6">
              Com mais de 10 anos de experiência, nossa barbearia é referência em cortes modernos e clássicos.
              Oferecemos um ambiente acolhedor onde você pode relaxar enquanto nossos profissionais altamente
              qualificados cuidam do seu visual.
            </p>
            <div className="bg-[#1A1F2E] p-6 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="text-[#F0B35B]" />
                <h3 className="text-xl font-semibold">Horário de Funcionamento</h3>
              </div>
              <ul className="space-y-2">
                <li className="flex justify-between">
                  <span>Segunda - Sexta</span>
                  <span>09:00 - 20:00</span>
                </li>
                <li className="flex justify-between">
                  <span>Sábado</span>
                  <span>09:00 - 18:00</span>
                </li>
                <li className="flex justify-between">
                  <span>Domingo</span>
                  <span>Fechado</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="gap-4">
            <img
              src="https://images.unsplash.com/photo-1572663459735-75425e957ab9?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Barbearia interior"
              className="rounded-lg w-full h-48 object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;