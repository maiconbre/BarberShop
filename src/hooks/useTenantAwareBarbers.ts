import { useState, useCallback, useMemo } from 'react';
import { useBarberRepository } from './useBarbers';
import { useTenant } from '../contexts/TenantContext';
import type { Barber } from '../types';

export const useTenantAwareBarbers = () => {
  const { currentTenant } = useTenant();
  const barberRepository = useBarberRepository();
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBarbers = useCallback(async () => {
    if (!currentTenant?.id) return;

    setLoading(true);
    setError(null);

    try {
      const tenantBarbers = await barberRepository.findAll();
      setBarbers(tenantBarbers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load barbers');
    } finally {
      setLoading(false);
    }
  }, [currentTenant?.id, barberRepository]);

  const filteredBarbers = useMemo(() => {
    if (!currentTenant?.id) return [];
    return barbers.filter(barber => barber.barbershopId === currentTenant.id);
  }, [barbers, currentTenant?.id]);

  return {
    barbers: filteredBarbers,
    loading,
    error,
    loadBarbers,
    refetch: loadBarbers
  };
};