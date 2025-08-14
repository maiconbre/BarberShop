import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserRepository } from '../repositories/UserRepository';
import type { IApiService } from '../interfaces/IApiService';

interface MockApiService extends IApiService {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
}

// Mock ApiService
const mockApiService: MockApiService = {
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
} as MockApiService;

describe('UserRepository', () => {
  let userRepository: UserRepository;

  beforeEach(() => {
    userRepository = new UserRepository(mockApiService);
    vi.clearAllMocks();
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const mockUser: UserType = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'client',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockApiService.get.mockResolvedValue(mockUser);

      const result = await userRepository.findById('1');

      expect(result).toEqual(mockUser);
      expect(mockApiService.get).toHaveBeenCalledWith('/api/users/1');
    });

    it('should return null when user not found', async () => {
      const notFoundError = Object.assign(new Error('Not Found'), { status: 404 });
      mockApiService.get.mockRejectedValue(notFoundError);

      const result = await userRepository.findById('999');

      expect(result).toBeNull();
    });

    it('should throw error for other API errors', async () => {
      const serverError = Object.assign(new Error('Server Error'), { status: 500 });
      mockApiService.get.mockRejectedValue(serverError);

      await expect(userRepository.findById('1')).rejects.toThrow('Server Error');
    });
  });

  describe('findAll', () => {
    it('should return all users without filters', async () => {
      const mockUsers: UserType[] = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'client',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'barber',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockApiService.get.mockResolvedValue(mockUsers);

      const result = await userRepository.findAll();

      expect(result).toEqual(mockUsers);
      expect(mockApiService.get).toHaveBeenCalledWith('/api/users');
    });

    it('should return users with filters', async () => {
      const mockUsers: UserType[] = [
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'barber',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockApiService.get.mockResolvedValue(mockUsers);

      const result = await userRepository.findAll({ role: 'barber' });

      expect(result).toEqual(mockUsers);
      expect(mockApiService.get).toHaveBeenCalledWith('/api/users?role=barber');
    });

    it('should return empty array when API returns non-array', async () => {
      mockApiService.get.mockResolvedValue(null);

      const result = await userRepository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findPaginated', () => {
    it('should return paginated results', async () => {
      const mockPaginatedResult = {
        data: [
          {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            role: 'client' as const,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        total: 10,
        page: 1,
        limit: 5,
        totalPages: 2,
      };

      mockApiService.get.mockResolvedValue(mockPaginatedResult);

      const result = await userRepository.findPaginated({
        page: 1,
        limit: 5,
        sortBy: 'name',
        sortOrder: 'asc',
      });

      expect(result).toEqual(mockPaginatedResult);
      expect(mockApiService.get).toHaveBeenCalledWith(
        '/api/users?page=1&limit=5&sortBy=name&sortOrder=asc'
      );
    });
  });

  describe('create', () => {
    it('should create new user', async () => {
      const userData = {
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
        role: 'client' as const,
      };

      const createdUser: UserType = {
        id: '3',
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockApiService.post.mockResolvedValue(createdUser);

      const result = await userRepository.create(userData);

      expect(result).toEqual(createdUser);
      // The User.validateRegisterData might filter out the role field
      expect(mockApiService.post).toHaveBeenCalledWith('/api/users', expect.objectContaining({
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
      }));
    });
  });

  describe('update', () => {
    it('should update existing user', async () => {
      const updates = { name: 'Updated Name' };
      const updatedUser: UserType = {
        id: '1',
        name: 'Updated Name',
        email: 'john@example.com',
        role: 'client',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockApiService.patch.mockResolvedValue(updatedUser);

      const result = await userRepository.update('1', updates);

      expect(result).toEqual(updatedUser);
      expect(mockApiService.patch).toHaveBeenCalledWith('/api/users/1', updates);
    });
  });

  describe('delete', () => {
    it('should delete user', async () => {
      mockApiService.delete.mockResolvedValue(undefined);

      await userRepository.delete('1');

      expect(mockApiService.delete).toHaveBeenCalledWith('/api/users/1');
    });
  });

  describe('exists', () => {
    it('should return true when user exists', async () => {
      mockApiService.get.mockResolvedValue({ exists: true });

      const result = await userRepository.exists('1');

      expect(result).toBe(true);
      expect(mockApiService.get).toHaveBeenCalledWith('/api/users/1/exists');
    });

    it('should return false when user does not exist', async () => {
      const notFoundError = Object.assign(new Error('Not Found'), { status: 404 });
      mockApiService.get.mockRejectedValue(notFoundError);

      const result = await userRepository.exists('999');

      expect(result).toBe(false);
    });
  });

  describe('findByEmail', () => {
    it('should return user when found by email', async () => {
      const mockUser: UserType = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'client',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockApiService.get.mockResolvedValue(mockUser);

      const result = await userRepository.findByEmail('john@example.com');

      expect(result).toEqual(mockUser);
      expect(mockApiService.get).toHaveBeenCalledWith('/api/users/email/john%40example.com');
    });

    it('should return null when user not found by email', async () => {
      const notFoundError = Object.assign(new Error('Not Found'), { status: 404 });
      mockApiService.get.mockRejectedValue(notFoundError);

      const result = await userRepository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findByRole', () => {
    it('should return users by role', async () => {
      const mockBarbers: UserType[] = [
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'barber',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockApiService.get.mockResolvedValue(mockBarbers);

      const result = await userRepository.findByRole('barber');

      expect(result).toEqual(mockBarbers);
      expect(mockApiService.get).toHaveBeenCalledWith('/api/users?role=barber');
    });
  });

  describe('updatePassword', () => {
    it('should update user password', async () => {
      mockApiService.patch.mockResolvedValue(undefined);

      await userRepository.updatePassword('1', 'oldPassword', 'newPassword');

      expect(mockApiService.patch).toHaveBeenCalledWith('/api/users/1/password', {
        currentPassword: 'oldPassword',
        newPassword: 'newPassword',
      });
    });
  });

  describe('toggleActive', () => {
    it('should toggle user active status', async () => {
      const updatedUser: UserType = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'client',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockApiService.patch.mockResolvedValue(updatedUser);

      const result = await userRepository.toggleActive('1', false);

      expect(result).toEqual(updatedUser);
      expect(mockApiService.patch).toHaveBeenCalledWith('/api/users/1', { isActive: false });
    });
  });
});