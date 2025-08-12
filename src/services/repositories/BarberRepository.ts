import type { IRepository } from '../interfaces/IRepository';
import type { IApiService } from '../interfaces/IApiService';
import type { Barber } from '@/types';
import type { BackendBarber } from '@/types/backend';

/**
 * Repository for barbers following Repository Pattern
 * Based on the real backend Barber model structure
 */
export class BarberRepository implements IRepository<Barber> {
  constructor(private apiService: IApiService) {}

  /**
   * Find barber by ID
   * Uses GET /api/barbers/:id (with formatted IDs like "01", "02")
   */
  async findById(id: string): Promise<Barber | null> {
    try {
      const barber = await this.apiService.get<BackendBarber>(`/api/barbers/${id}`);
      return this.adaptFromBackend(barber);
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Find all barbers
   * Uses GET /api/barbers (returns barber + username from related User)
   */
  async findAll(filters?: Record<string, unknown>): Promise<Barber[]> {
    const queryParams = this.buildQueryParams(filters);
    const barbers = await this.apiService.get<BackendBarber[]>(`/api/barbers${queryParams}`);
    const adaptedBarbers = Array.isArray(barbers) ? barbers.map(b => this.adaptFromBackend(b)) : [];
    
    // Apply frontend filters
    return this.applyFrontendFilters(adaptedBarbers, filters);
  }

  /**
   * Find active barbers (frontend filter)
   */
  async findActive(): Promise<Barber[]> {
    const allBarbers = await this.findAll();
    return allBarbers.filter(barber => barber.isActive);
  }

  /**
   * Find barbers by service (frontend filter using service associations)
   */
  async findByService(serviceId: string): Promise<Barber[]> {
    // This would require checking service associations
    // For now, return all barbers and let the frontend handle service filtering
    return this.findAll();
  }

  /**
   * Find barbers by name (frontend filter)
   */
  async findByName(name: string): Promise<Barber[]> {
    const allBarbers = await this.findAll();
    const searchTerm = name.toLowerCase();
    return allBarbers.filter(barber => 
      barber.name.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Find barbers by specialty (frontend filter)
   */
  async findBySpecialty(specialty: string): Promise<Barber[]> {
    const allBarbers = await this.findAll();
    return allBarbers.filter(barber => 
      barber.specialties.some(s => s.toLowerCase().includes(specialty.toLowerCase()))
    );
  }

  /**
   * Create a new barber
   * Uses POST /api/barbers (creates User + Barber with sequential ID)
   * Requires authentication
   */
  async create(barberData: Omit<Barber, 'id' | 'createdAt' | 'updatedAt'>): Promise<Barber> {
    const backendData = this.adaptToBackend(barberData);
    const newBarber = await this.apiService.post<BackendBarber>('/api/barbers', backendData);
    return this.adaptFromBackend(newBarber);
  }

  /**
   * Update an existing barber
   * Uses PATCH /api/barbers/:id (updates User + Barber)
   * Requires authentication
   */
  async update(id: string, updates: Partial<Barber>): Promise<Barber> {
    const backendUpdates = this.adaptPartialToBackend(updates);
    const updatedBarber = await this.apiService.patch<BackendBarber>(`/api/barbers/${id}`, backendUpdates);
    return this.adaptFromBackend(updatedBarber);
  }

  /**
   * Delete a barber
   * Uses DELETE /api/barbers/:id (removes User + Barber + Appointments)
   * Requires authentication
   */
  async delete(id: string): Promise<void> {
    await this.apiService.delete(`/api/barbers/${id}`);
  }

  /**
   * Check if barber exists
   */
  async exists(id: string): Promise<boolean> {
    try {
      const barber = await this.findById(id);
      return barber !== null;
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Update barber contact information
   */
  async updateContact(id: string, whatsapp: string): Promise<Barber> {
    return this.update(id, { phone: whatsapp });
  }

  /**
   * Update barber payment information
   */
  async updatePaymentInfo(id: string, pix: string): Promise<Barber> {
    const backendUpdates = { pix };
    const updatedBarber = await this.apiService.patch<BackendBarber>(`/api/barbers/${id}`, backendUpdates);
    return this.adaptFromBackend(updatedBarber);
  }

  /**
   * Toggle barber active status (frontend-only operation)
   */
  async toggleActive(id: string, isActive: boolean): Promise<Barber> {
    // Since backend doesn't have isActive field, we simulate this in frontend
    const barber = await this.findById(id);
    if (!barber) {
      throw new Error(`Barber with id ${id} not found`);
    }
    
    // Return updated barber with new active status
    return {
      ...barber,
      isActive,
      updatedAt: new Date(),
    };
  }

  /**
   * Get barber statistics
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
  }> {
    const allBarbers = await this.findAll();
    
    return {
      total: allBarbers.length,
      active: allBarbers.filter(b => b.isActive).length,
      inactive: allBarbers.filter(b => !b.isActive).length,
    };
  }

  /**
   * Build query parameters for API requests
   */
  private buildQueryParams(filters?: Record<string, unknown>): string {
    if (!filters) return '';
    
    const params = new URLSearchParams();
    
    // Only include backend-supported filters
    const backendFilters = ['name', 'whatsapp'];
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && backendFilters.includes(key)) {
        params.append(key, String(value));
      }
    });
    
    return params.toString() ? `?${params.toString()}` : '';
  }

  /**
   * Apply frontend-only filters
   */
  private applyFrontendFilters(barbers: Barber[], filters?: Record<string, unknown>): Barber[] {
    if (!filters) return barbers;
    
    let filteredBarbers = [...barbers];
    
    // Apply isActive filter
    if (typeof filters.isActive === 'boolean') {
      filteredBarbers = filteredBarbers.filter(b => b.isActive === filters.isActive);
    }
    
    // Apply specialties filter
    if (filters.specialty && typeof filters.specialty === 'string') {
      const specialty = filters.specialty.toLowerCase();
      filteredBarbers = filteredBarbers.filter(b => 
        b.specialties.some(s => s.toLowerCase().includes(specialty))
      );
    }
    
    // Apply search filter
    if (filters.search && typeof filters.search === 'string') {
      const search = filters.search.toLowerCase();
      filteredBarbers = filteredBarbers.filter(b => 
        b.name.toLowerCase().includes(search) ||
        b.specialties.some(s => s.toLowerCase().includes(search))
      );
    }
    
    return filteredBarbers;
  }

  /**
   * Adapt backend barber to frontend Barber interface
   */
  private adaptFromBackend(backendBarber: BackendBarber): Barber {
    return {
      id: backendBarber.id,
      name: backendBarber.name,
      email: backendBarber.username || '', // Map username to email
      phone: backendBarber.whatsapp,
      specialties: [], // Default empty array (not in backend)
      isActive: true, // Default to active (not in backend)
      workingHours: {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: [],
      }, // Default empty working hours (not in backend)
      createdAt: new Date(), // Default to current date (not in backend)
      updatedAt: new Date(), // Default to current date (not in backend)
      // Store backend-specific data for future use
      _backendData: {
        whatsapp: backendBarber.whatsapp,
        pix: backendBarber.pix,
        username: backendBarber.username,
      },
    };
  }

  /**
   * Adapt frontend barber to backend format for creation
   */
  private adaptToBackend(barber: Omit<Barber, 'id' | 'createdAt' | 'updatedAt'>): Partial<BackendBarber> {
    return {
      name: barber.name,
      whatsapp: barber.phone || '',
      pix: (barber as any)._backendData?.pix || '', // Use existing pix or empty
      // username will be handled by backend when creating User
    };
  }

  /**
   * Adapt partial frontend barber updates to backend format
   */
  private adaptPartialToBackend(updates: Partial<Barber>): Partial<BackendBarber> {
    const backendUpdates: Partial<BackendBarber> = {};
    
    if (updates.name) backendUpdates.name = updates.name;
    if (updates.phone) backendUpdates.whatsapp = updates.phone;
    if ((updates as any)._backendData?.pix) {
      backendUpdates.pix = (updates as any)._backendData.pix;
    }
    
    return backendUpdates;
  }

  /**
   * Check if error is a "not found" error
   */
  private isNotFoundError(error: unknown): boolean {
    return (
      error instanceof Error &&
      'status' in error &&
      (error as any).status === 404
    );
  }
}

// Extend Barber interface to include backend-specific data
declare module '@/types' {
  interface Barber {
    _backendData?: {
      whatsapp: string;
      pix: string;
      username?: string;
    };
  }
}