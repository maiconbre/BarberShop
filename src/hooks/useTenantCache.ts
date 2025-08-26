import { useMemo } from 'react';
import { useTenant } from '../contexts/TenantContext';
import { createTenantAwareCache } from '../services/TenantAwareCache';

/**
 * Hook that provides tenant-aware cache instance
 * Automatically isolates cache data by tenant ID
 */
export const useTenantCache = () => {
  const { barbershopId } = useTenant();
  
  const tenantCache = useMemo(() => {
    return createTenantAwareCache(() => barbershopId);
  }, [barbershopId]);
  
  return tenantCache;
};