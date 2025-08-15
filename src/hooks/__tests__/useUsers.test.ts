import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUsers, useBarbers, useClients } from '../useUsers';
import type { User as UserType } from '@/types';

// Mock ServiceFactory



const mockUserRepository = {
  findAll: vi.fn(),
  findById: vi.fn(),
  findByEmail: vi.fn(),
  findByRole: vi.fn(),
  findPaginated: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  exists: vi.fn(),
  updatePassword: vi.fn(),
  toggleActive: vi.fn(),
};

vi.mock('@/services/ServiceFactory', () => ({
  useUserRepository: () => mockUserRepository,
}));

describe('useUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUser: UserType = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'client',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('loadUsers', () => {
    it('should load users successfully', async () => {
      const mockUsers = [mockUser];
      mockUserRepository.findAll.mockResolvedValue(mockUsers);

      const { result } = renderHook(() => useUsers());

      await act(async () => {
        await result.current.loadUsers();
      });

      expect(result.current.users).toEqual(mockUsers);
      expect(result.current.loadingUsers).toBe(false);
      expect(result.current.usersError).toBeNull();
    });

    it('should handle loading error', async () => {
      const error = new Error('Failed to load users');
      mockUserRepository.findAll.mockRejectedValue(error);

      const { result } = renderHook(() => useUsers());

      await act(async () => {
        try {
          await result.current.loadUsers();
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.loadingUsers).toBe(false);
      expect(result.current.usersError).toBeTruthy();
    });

    it('should load users with filters', async () => {
      const mockUsers = [mockUser];
      const filters = { role: 'client' };
      mockUserRepository.findAll.mockResolvedValue(mockUsers);

      const { result } = renderHook(() => useUsers());

      await act(async () => {
        await result.current.loadUsers(filters);
      });

      expect(mockUserRepository.findAll).toHaveBeenCalledWith(filters);
      expect(result.current.users).toEqual(mockUsers);
    });
  });

  describe('loadPaginatedUsers', () => {
    it('should load paginated users', async () => {
      const mockPaginatedResult = {
        data: [mockUser],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      mockUserRepository.findPaginated.mockResolvedValue(mockPaginatedResult);

      const { result } = renderHook(() => useUsers());

      await act(async () => {
        await result.current.loadPaginatedUsers({
          page: 1,
          limit: 10,
        });
      });

      expect(result.current.paginatedUsers).toEqual(mockPaginatedResult);
      expect(result.current.loadingPaginated).toBe(false);
    });
  });

  describe('getUserById', () => {
    it('should get user by id', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useUsers());

      let user: UserType | null = null;
      await act(async () => {
        user = await result.current.getUserById('1');
      });

      expect(user).toEqual(mockUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith('1');
    });
  });

  describe('getUserByEmail', () => {
    it('should get user by email', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useUsers());

      let user: UserType | null = null;
      await act(async () => {
        user = await result.current.getUserByEmail('john@example.com');
      });

      expect(user).toEqual(mockUser);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('john@example.com');
    });
  });

  describe('getUsersByRole', () => {
    it('should get users by role', async () => {
      const mockUsers = [mockUser];
      mockUserRepository.findByRole.mockResolvedValue(mockUsers);

      const { result } = renderHook(() => useUsers());

      let users: UserType[] = [];
      await act(async () => {
        users = await result.current.getUsersByRole('client');
      });

      expect(users).toEqual(mockUsers);
      expect(mockUserRepository.findByRole).toHaveBeenCalledWith('client');
    });
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const userData = {
        name: 'New User',
        email: 'new@example.com',
        role: 'client' as const,
      };
      const createdUser = { ...userData, id: '2', createdAt: new Date(), updatedAt: new Date() };
      
      mockUserRepository.create.mockResolvedValue(createdUser);

      const { result } = renderHook(() => useUsers());

      let user: UserType | undefined;
      await act(async () => {
        user = await result.current.createUser(userData);
      });

      expect(user).toEqual(createdUser);
      expect(mockUserRepository.create).toHaveBeenCalledWith(userData);
      expect(result.current.creating).toBe(false);
    });

    it('should handle create error', async () => {
      const error = new Error('Failed to create user');
      mockUserRepository.create.mockRejectedValue(error);

      const { result } = renderHook(() => useUsers());

      await act(async () => {
        try {
          await result.current.createUser({
            name: 'New User',
            email: 'new@example.com',
            role: 'client',
          });
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.creating).toBe(false);
      expect(result.current.createError).toBeTruthy();
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const updates = { name: 'Updated Name' };
      const updatedUser = { ...mockUser, ...updates };
      
      mockUserRepository.update.mockResolvedValue(updatedUser);

      const { result } = renderHook(() => useUsers());

      let user: UserType | undefined;
      await act(async () => {
        user = await result.current.updateUser('1', updates);
      });

      expect(user).toEqual(updatedUser);
      expect(mockUserRepository.update).toHaveBeenCalledWith('1', updates);
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      mockUserRepository.delete.mockResolvedValue(undefined);

      const { result } = renderHook(() => useUsers());

      await act(async () => {
        await result.current.deleteUser('1');
      });

      expect(mockUserRepository.delete).toHaveBeenCalledWith('1');
      expect(result.current.deleting).toBe(false);
    });
  });

  describe('updatePassword', () => {
    it('should update password successfully', async () => {
      mockUserRepository.updatePassword.mockResolvedValue(undefined);

      const { result } = renderHook(() => useUsers());

      await act(async () => {
        await result.current.updatePassword('1', 'oldPass', 'newPass');
      });

      expect(mockUserRepository.updatePassword).toHaveBeenCalledWith('1', 'oldPass', 'newPass');
    });
  });

  describe('toggleUserActive', () => {
    it('should toggle user active status', async () => {
      const updatedUser = { ...mockUser };
      mockUserRepository.toggleActive.mockResolvedValue(updatedUser);

      const { result } = renderHook(() => useUsers());

      let user: UserType | undefined;
      await act(async () => {
        user = await result.current.toggleUserActive('1', false);
      });

      expect(user).toEqual(updatedUser);
      expect(mockUserRepository.toggleActive).toHaveBeenCalledWith('1', false);
    });
  });

  describe('checkUserExists', () => {
    it('should check if user exists', async () => {
      mockUserRepository.exists.mockResolvedValue(true);

      const { result } = renderHook(() => useUsers());

      let exists: boolean = false;
      await act(async () => {
        exists = await result.current.checkUserExists('1');
      });

      expect(exists).toBe(true);
      expect(mockUserRepository.exists).toHaveBeenCalledWith('1');
    });
  });
});

describe('useBarbers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load barbers', async () => {
    const mockBarbers = [
      {
        id: '1',
        name: 'Barber Joe',
        email: 'joe@example.com',
        role: 'barber' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    mockUserRepository.findByRole.mockResolvedValue(mockBarbers);

    const { result } = renderHook(() => useBarbers());

    let barbers: UserType[] = [];
    await act(async () => {
      barbers = await result.current.loadBarbers();
    });

    expect(barbers).toEqual(mockBarbers);
    expect(mockUserRepository.findByRole).toHaveBeenCalledWith('barber');
  });
});

describe('useClients', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load clients', async () => {
    const mockClients = [
      {
        id: '1',
        name: 'Client John',
        email: 'john@example.com',
        role: 'client' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    mockUserRepository.findByRole.mockResolvedValue(mockClients);

    const { result } = renderHook(() => useClients());

    let clients: UserType[] = [];
    await act(async () => {
      clients = await result.current.loadClients();
    });

    expect(clients).toEqual(mockClients);
    expect(mockUserRepository.findByRole).toHaveBeenCalledWith('client');
  });
});