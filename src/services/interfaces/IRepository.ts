/**
 * Interface genérica para repositórios seguindo Repository Pattern
 */
export interface IRepository<T, ID = string> {
  findById(id: ID): Promise<T | null>;
  findAll(filters?: Record<string, unknown>): Promise<T[]>;
  create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  update(id: ID, updates: Partial<T>): Promise<T>;
  delete(id: ID): Promise<void>;
  exists(id: ID): Promise<boolean>;
}

/**
 * Interface para repositórios com paginação
 */
export interface IPaginatedRepository<T, ID = string> extends IRepository<T, ID> {
  findPaginated(options: PaginationOptions): Promise<PaginatedResult<T>>;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Interface para repositórios com busca
 */
export interface ISearchableRepository<T, ID = string> extends IRepository<T, ID> {
  search(query: string, options?: SearchOptions): Promise<T[]>;
}

export interface SearchOptions {
  fields?: string[];
  limit?: number;
  fuzzy?: boolean;
}