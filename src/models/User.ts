import type { User as UserType, LoginCredentials, RegisterData } from '@/types';
import { UserSchema, LoginCredentialsSchema, RegisterDataSchema } from '@/validation/schemas';
import { USER_ROLES } from '@/constants';

export class User {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string,
    public readonly phone: string | undefined,
    public readonly role: 'client' | 'barber' | 'admin',
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  /**
   * Creates a User instance from raw data with validation
   */
  static fromData(data: unknown): User {
    const validated = UserSchema.parse(data);
    return new User(
      validated.id,
      validated.name,
      validated.email,
      validated.phone,
      validated.role,
      validated.createdAt,
      validated.updatedAt
    );
  }

  /**
   * Creates a User instance from API response
   */
  static fromApiData(data: UserType): User {
    return User.fromData(data);
  }

  /**
   * Validates login credentials
   */
  static validateLoginCredentials(credentials: unknown): LoginCredentials {
    return LoginCredentialsSchema.parse(credentials);
  }

  /**
   * Validates registration data
   */
  static validateRegisterData(data: unknown): RegisterData {
    return RegisterDataSchema.parse(data);
  }

  /**
   * Checks if user is a client
   */
  isClient(): boolean {
    return this.role === USER_ROLES.CLIENT;
  }

  /**
   * Checks if user is a barber
   */
  isBarber(): boolean {
    return this.role === USER_ROLES.BARBER;
  }

  /**
   * Checks if user is an admin
   */
  isAdmin(): boolean {
    return this.role === USER_ROLES.ADMIN;
  }

  /**
   * Checks if user has admin or barber privileges
   */
  hasElevatedPrivileges(): boolean {
    return this.isAdmin() || this.isBarber();
  }

  /**
   * Gets user's display name
   */
  getDisplayName(): string {
    return this.name;
  }

  /**
   * Gets user's initials for avatar
   */
  getInitials(): string {
    return this.name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }

  /**
   * Checks if user has a phone number
   */
  hasPhone(): boolean {
    return Boolean(this.phone && this.phone.trim().length > 0);
  }

  /**
   * Gets formatted phone number
   */
  getFormattedPhone(): string | null {
    if (!this.hasPhone()) return null;
    
    // Basic Brazilian phone formatting
    const cleaned = this.phone!.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    return this.phone!;
  }

  /**
   * Converts to JSON object
   */
  toJSON(): UserType {
    return this.toApiData();
  }

  /**
   * Converts to plain object for API requests
   */
  toApiData(): UserType {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      phone: this.phone,
      role: this.role,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Creates a copy with updated fields
   */
  update(updates: Partial<Pick<UserType, 'name' | 'email' | 'phone'>>): User {
    return new User(
      this.id,
      updates.name ?? this.name,
      updates.email ?? this.email,
      updates.phone ?? this.phone,
      this.role,
      this.createdAt,
      new Date() // Update timestamp
    );
  }

  /**
   * Checks if two users are the same
   */
  equals(other: User): boolean {
    return this.id === other.id;
  }

  /**
   * String representation for debugging
   */
  toString(): string {
    return `User(${this.id}, ${this.name}, ${this.role})`;
  }
}