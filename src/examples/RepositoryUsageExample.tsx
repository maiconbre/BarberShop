import React, { useEffect, useState } from 'react';
import { 
  useUserRepository, 
  useServiceRepository, 
  useAppointmentRepository, 
  useBarberRepository, 
  useCommentRepository 
} from '@/services/ServiceFactory';
import type { User, Service, Appointment, Barber, PublicComment } from '@/types';

/**
 * Exemplo de como usar os repositórios integrados no ServiceFactory
 * Este componente demonstra o uso de todos os repositórios disponíveis
 */
export const RepositoryUsageExample: React.FC = () => {
  // Hooks dos repositórios
  const userRepository = useUserRepository();
  const serviceRepository = useServiceRepository();
  const appointmentRepository = useAppointmentRepository();
  const barberRepository = useBarberRepository();
  const commentRepository = useCommentRepository();

  // Estados para demonstrar o uso
  const [users, setUsers] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para carregar todos os dados
  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Carrega dados de todos os repositórios
      const [
        usersData,
        servicesData,
        appointmentsData,
        barbersData,
        commentsData
      ] = await Promise.all([
        userRepository.findAll(),
        serviceRepository.findAll(),
        appointmentRepository.findAll(),
        barberRepository.findAll(),
        commentRepository.findApproved() // Apenas comentários aprovados
      ]);

      setUsers(usersData);
      setServices(servicesData);
      setAppointments(appointmentsData);
      setBarbers(barbersData);
      setComments(commentsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  // Exemplos de operações específicas
  const handleSpecificOperations = async () => {
    try {
      // UserRepository - Buscar barbeiros
      const barberUsers = await userRepository.findByRole('barber');
      console.log('Barbeiros encontrados:', barberUsers);

      // ServiceRepository - Buscar serviços por barbeiro
      if (barbers.length > 0) {
        const barberServices = await serviceRepository.findByBarber(barbers[0].id);
        console.log('Serviços do primeiro barbeiro:', barberServices);
      }

      // AppointmentRepository - Buscar agendamentos próximos
      const upcomingAppointments = await appointmentRepository.findUpcoming();
      console.log('Agendamentos próximos:', upcomingAppointments);

      // BarberRepository - Buscar barbeiros ativos
      const activeBarbers = await barberRepository.findActive();
      console.log('Barbeiros ativos:', activeBarbers);

      // CommentRepository - Buscar comentários pendentes (requer admin)
      try {
        const pendingComments = await commentRepository.findPending();
        console.log('Comentários pendentes:', pendingComments);
      } catch (_) {
        console.log('Acesso negado para comentários pendentes (requer admin)');
      }
    } catch (err) {
      console.error('Erro nas operações específicas:', err);
    }
  };

  // Carrega dados na inicialização
  useEffect(() => {
    loadAllData();
  }, []);

  if (loading) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Exemplo de Uso dos Repositórios</h2>
        <p>Carregando dados...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Exemplo de Uso dos Repositórios</h2>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Erro:</strong> {error}
        </div>
        <button 
          onClick={loadAllData}
          className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold mb-4">Exemplo de Uso dos Repositórios</h2>
      
      <div className="flex gap-4 mb-6">
        <button 
          onClick={loadAllData}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Recarregar Dados
        </button>
        <button 
          onClick={handleSpecificOperations}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Executar Operações Específicas
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Usuários */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Usuários ({users.length})</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {users.slice(0, 5).map(user => (
              <div key={user.id} className="text-sm">
                <strong>{user.name}</strong> - {user.role}
              </div>
            ))}
            {users.length > 5 && (
              <div className="text-xs text-gray-500">
                ... e mais {users.length - 5} usuários
              </div>
            )}
          </div>
        </div>

        {/* Serviços */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Serviços ({services.length})</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {services.slice(0, 5).map(service => (
              <div key={service.id} className="text-sm">
                <strong>{service.name}</strong> - R$ {service.price}
              </div>
            ))}
            {services.length > 5 && (
              <div className="text-xs text-gray-500">
                ... e mais {services.length - 5} serviços
              </div>
            )}
          </div>
        </div>

        {/* Agendamentos */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Agendamentos ({appointments.length})</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {appointments.slice(0, 5).map(appointment => (
              <div key={appointment.id} className="text-sm">
                <strong>{appointment.clientId}</strong> - {appointment.status}
              </div>
            ))}
            {appointments.length > 5 && (
              <div className="text-xs text-gray-500">
                ... e mais {appointments.length - 5} agendamentos
              </div>
            )}
          </div>
        </div>

        {/* Barbeiros */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Barbeiros ({barbers.length})</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {barbers.slice(0, 5).map(barber => (
              <div key={barber.id} className="text-sm">
                <strong>{barber.name}</strong> - {barber.isActive ? 'Ativo' : 'Inativo'}
              </div>
            ))}
            {barbers.length > 5 && (
              <div className="text-xs text-gray-500">
                ... e mais {barbers.length - 5} barbeiros
              </div>
            )}
          </div>
        </div>

        {/* Comentários */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Comentários ({comments.length})</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {comments.slice(0, 5).map(comment => (
              <div key={comment.id} className="text-sm">
                <strong>{comment.name}</strong> - {comment.status}
              </div>
            ))}
            {comments.length > 5 && (
              <div className="text-xs text-gray-500">
                ... e mais {comments.length - 5} comentários
              </div>
            )}
          </div>
        </div>

        {/* Estatísticas */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Estatísticas</h3>
          <div className="space-y-1 text-sm">
            <div>Total de Usuários: {users.length}</div>
            <div>Total de Serviços: {services.length}</div>
            <div>Total de Agendamentos: {appointments.length}</div>
            <div>Total de Barbeiros: {barbers.length}</div>
            <div>Total de Comentários: {comments.length}</div>
          </div>
        </div>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Repositórios Integrados</h3>
        <p className="text-sm text-gray-700 mb-2">
          Este exemplo demonstra como todos os repositórios estão integrados no ServiceFactory:
        </p>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>✅ UserRepository - Gerenciamento de usuários</li>
          <li>✅ ServiceRepository - Gerenciamento de serviços</li>
          <li>✅ AppointmentRepository - Gerenciamento de agendamentos</li>
          <li>✅ BarberRepository - Gerenciamento de barbeiros</li>
          <li>✅ CommentRepository - Gerenciamento de comentários</li>
        </ul>
        <p className="text-xs text-gray-500 mt-2">
          Todos os repositórios seguem o padrão Repository Pattern e são injetados via ServiceFactory.
        </p>
      </div>
    </div>
  );
};

export default RepositoryUsageExample;