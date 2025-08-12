import { useState, useCallback } from 'react';
import { useAppointmentRepository } from '@/services/ServiceFactory';
import type { Appointment, AppointmentStatus } from '@/types';
import type { AppointmentStatistics } from '@/services/repositories/AppointmentRepository';

/**
 * Hook para gerenciamento de agendamentos baseado na estrutura real do backend
 * 
 * Estrutura real do backend:
 * - Campos: clientName, serviceName, date, time, status, barberId, barberName, price, wppclient
 * - Filtros por barberId, data, status implementados no frontend
 * - Rate limiting otimizado: 200 req/min leitura, 20 req/min escrita
 */
export const useAppointments = () => {
  const appointmentRepository = useAppointmentRepository();
  
  // State for appointments list
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // State for create operations
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<Error | null>(null);

  // State for update operations
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<Error | null>(null);

  // State for delete operations
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<Error | null>(null);

  /**
   * Carrega todos os agendamentos com filtros opcionais
   * Suporta filtro por barberId via query parameter da API
   */
  const loadAppointments = useCallback(
    async (filters?: Record<string, unknown>) => {
      try {
        setLoading(true);
        setError(null);
        const result = await appointmentRepository.findAll(filters);
        setAppointments(result);
        return result;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setError(errorObj);
        throw errorObj;
      } finally {
        setLoading(false);
      }
    },
    [appointmentRepository]
  );

  /**
   * Busca agendamento por ID
   */
  const getAppointmentById = useCallback(
    async (id: string) => {
      return appointmentRepository.findById(id);
    },
    [appointmentRepository]
  );

  /**
   * Busca agendamentos por barbeiro (usando query parameter da API)
   * GET /api/appointments?barberId=X
   */
  const getAppointmentsByBarberId = useCallback(
    async (barberId: string) => {
      return appointmentRepository.findByBarberId(barberId);
    },
    [appointmentRepository]
  );

  /**
   * Busca agendamentos por status (filtro implementado no frontend)
   */
  const getAppointmentsByStatus = useCallback(
    async (status: AppointmentStatus) => {
      return appointmentRepository.findByStatus(status);
    },
    [appointmentRepository]
  );

  /**
   * Busca agendamentos por data (filtro implementado no frontend)
   */
  const getAppointmentsByDate = useCallback(
    async (date: Date) => {
      return appointmentRepository.findByDate(date);
    },
    [appointmentRepository]
  );

  /**
   * Busca agendamentos por faixa de datas (filtro implementado no frontend)
   */
  const getAppointmentsByDateRange = useCallback(
    async (startDate: Date, endDate: Date) => {
      return appointmentRepository.findByDateRange(startDate, endDate);
    },
    [appointmentRepository]
  );

  /**
   * Busca agendamentos por nome do cliente (filtro implementado no frontend)
   */
  const getAppointmentsByClientName = useCallback(
    async (clientName: string) => {
      return appointmentRepository.findByClientName(clientName);
    },
    [appointmentRepository]
  );

  /**
   * Busca agendamentos próximos (hoje e amanhã)
   */
  const getUpcomingAppointments = useCallback(
    async () => {
      return appointmentRepository.findUpcoming();
    },
    [appointmentRepository]
  );

  /**
   * Busca agendamentos pendentes
   */
  const getPendingAppointments = useCallback(
    async () => {
      return appointmentRepository.findPending();
    },
    [appointmentRepository]
  );

  /**
   * Busca agendamentos confirmados para um barbeiro em uma data específica
   */
  const getConfirmedAppointmentsByBarberAndDate = useCallback(
    async (barberId: string, date: Date) => {
      return appointmentRepository.findConfirmedByBarberAndDate(barberId, date);
    },
    [appointmentRepository]
  );

  /**
   * Cria um novo agendamento
   * POST /api/appointments (cria com id = Date.now().toString())
   */
  const createAppointment = useCallback(
    async (appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        setCreating(true);
        setCreateError(null);
        const newAppointment = await appointmentRepository.create(appointmentData);
        
        // Atualiza a lista local se existir
        if (appointments) {
          await loadAppointments();
        }
        
        return newAppointment;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setCreateError(errorObj);
        throw errorObj;
      } finally {
        setCreating(false);
      }
    },
    [appointmentRepository, appointments, loadAppointments]
  );

  /**
   * Cria agendamento com dados específicos do backend
   * Usa a estrutura real: clientName, serviceName, barberName, price, wppclient
   */
  const createWithBackendData = useCallback(
    async (data: {
      clientName: string;
      serviceName: string;
      date: Date;
      time: string;
      barberId: string;
      barberName: string;
      price: number;
      wppclient: string;
      status?: AppointmentStatus;
    }) => {
      try {
        setCreating(true);
        setCreateError(null);
        const newAppointment = await appointmentRepository.createWithBackendData(data);
        
        // Atualiza a lista local se existir
        if (appointments) {
          await loadAppointments();
        }
        
        return newAppointment;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setCreateError(errorObj);
        throw errorObj;
      } finally {
        setCreating(false);
      }
    },
    [appointmentRepository, appointments, loadAppointments]
  );

  /**
   * Atualiza um agendamento existente
   */
  const updateAppointment = useCallback(
    async (id: string, updates: Partial<Appointment>) => {
      try {
        setUpdating(true);
        setUpdateError(null);
        const updatedAppointment = await appointmentRepository.update(id, updates);
        
        // Atualiza a lista local se existir
        if (appointments) {
          await loadAppointments();
        }
        
        return updatedAppointment;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setUpdateError(errorObj);
        throw errorObj;
      } finally {
        setUpdating(false);
      }
    },
    [appointmentRepository, appointments, loadAppointments]
  );

  /**
   * Atualiza apenas o status do agendamento
   * PATCH /api/appointments/:id
   */
  const updateAppointmentStatus = useCallback(
    async (id: string, status: AppointmentStatus) => {
      try {
        setUpdating(true);
        setUpdateError(null);
        const updatedAppointment = await appointmentRepository.updateStatus(id, status);
        
        // Atualiza a lista local se existir
        if (appointments) {
          await loadAppointments();
        }
        
        return updatedAppointment;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setUpdateError(errorObj);
        throw errorObj;
      } finally {
        setUpdating(false);
      }
    },
    [appointmentRepository, appointments, loadAppointments]
  );

  /**
   * Remove um agendamento
   * DELETE /api/appointments/:id
   */
  const deleteAppointment = useCallback(
    async (id: string) => {
      try {
        setDeleting(true);
        setDeleteError(null);
        await appointmentRepository.delete(id);
        
        // Atualiza a lista local se existir
        if (appointments) {
          await loadAppointments();
        }
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setDeleteError(errorObj);
        throw errorObj;
      } finally {
        setDeleting(false);
      }
    },
    [appointmentRepository, appointments, loadAppointments]
  );

  /**
   * Verifica se um agendamento existe
   */
  const checkAppointmentExists = useCallback(
    async (id: string) => {
      return appointmentRepository.exists(id);
    },
    [appointmentRepository]
  );

  /**
   * Obtém estatísticas de agendamentos
   */
  const getStatistics = useCallback(
    async (): Promise<AppointmentStatistics> => {
      return appointmentRepository.getStatistics();
    },
    [appointmentRepository]
  );

  return {
    // Data
    appointments,
    
    // Loading states
    loading,
    creating,
    updating,
    deleting,
    
    // Error states
    error,
    createError,
    updateError,
    deleteError,
    
    // Actions - Basic CRUD
    loadAppointments,
    getAppointmentById,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    checkAppointmentExists,
    
    // Actions - Backend-specific
    createWithBackendData,
    updateAppointmentStatus,
    
    // Actions - Filtering (based on real backend structure)
    getAppointmentsByBarberId, // Uses API query parameter
    getAppointmentsByStatus, // Frontend filter
    getAppointmentsByDate, // Frontend filter
    getAppointmentsByDateRange, // Frontend filter
    getAppointmentsByClientName, // Frontend filter
    getUpcomingAppointments, // Frontend filter
    getPendingAppointments, // Frontend filter
    getConfirmedAppointmentsByBarberAndDate, // Combined filter
    
    // Actions - Statistics
    getStatistics,
  };
};