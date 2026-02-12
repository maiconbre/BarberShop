import type { IRepository } from './interfaces/IRepository';

/**
 * Wrapper that adds tenant context to repository operations
 * Automatically includes barbershopId in all requests
 */
export class TenantAwareRepository<T> implements IRepository<T> {
  constructor(
    private baseRepository: IRepository<T>,
    private getTenantId: () => string | null
  ) {}

  /**
   * Add tenant context to filters
   */
  private addTenantContext(filters?: Record<string, unknown>): Record<string, unknown> {
    const tenantId = this.getTenantId();
    
    if (!tenantId) {
      throw new Error('Tenant context is required but not available');
    }

    return {
      ...filters,
      barbershopId: tenantId
    };
  }

  /**
   * Add tenant context to data
   */
  private addTenantToData<D>(data: D): D & { barbershopId: string } {
    const tenantId = this.getTenantId();
    
    if (!tenantId) {
      throw new Error('Tenant context is required but not available');
    }

    return {
      ...data,
      barbershopId: tenantId
    } as D & { barbershopId: string };
  }

  async findAll(filters?: Record<string, unknown>): Promise<T[]> {
    return this.baseRepository.findAll(this.addTenantContext(filters));
  }

  async findById(id: string): Promise<T | null> {
    // Ensure tenant context is available
    const tenantId = this.getTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required but not available');
    }

    // The base repository (e.g., ServiceRepository) now filters by tenant_id directly
    // So we can trust the result is already tenant-isolated
    const result = await this.baseRepository.findById(id);
    
    return result;
  }

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    return this.baseRepository.create(this.addTenantToData(data));
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    // First verify the record belongs to the current tenant
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('Record not found or access denied');
    }

    return this.baseRepository.update(id, this.addTenantToData(data));
  }

  async delete(id: string): Promise<void> {
    // First verify the record belongs to the current tenant
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('Record not found or access denied');
    }

    return this.baseRepository.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    const result = await this.findById(id);
    return result !== null;
  }
}

/**
 * Factory function to create tenant-aware repositories
 */
export function createTenantAwareRepository<T>(
  baseRepository: IRepository<T>,
  getTenantId: () => string | null
): TenantAwareRepository<T> {
  return new TenantAwareRepository(baseRepository, getTenantId);
}