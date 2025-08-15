# Backend Data Structure Mapping

## Overview

Este documento mapeia a estrutura de dados real do backend (Sequelize models) com os tipos do frontend, identificando diferenças e necessidades de adaptação para a implementação dos repositórios.

## Backend Models (Sequelize)

### User Model
```javascript
// backend/models/User.js
{
  id: DataTypes.STRING (primaryKey),
  username: DataTypes.STRING (unique, allowNull: false),
  password: DataTypes.STRING (allowNull: false, hashed with bcrypt),
  role: DataTypes.STRING (defaultValue: 'client'),
  name: DataTypes.STRING (allowNull: false)
}
// Timestamps: true (createdAt, updatedAt)
// Methods: comparePassword(candidatePassword)
```

### Barber Model
```javascript
// backend/models/Barber.js
{
  id: DataTypes.STRING (primaryKey),
  name: DataTypes.STRING (allowNull: false),
  whatsapp: DataTypes.STRING (allowNull: false),
  pix: DataTypes.STRING (allowNull: false)
}
// Relationships: belongsToMany Service through BarberServices
```

### Service Model
```javascript
// backend/models/Service.js
{
  id: DataTypes.UUID (primaryKey, defaultValue: UUIDV4),
  name: DataTypes.STRING (unique, allowNull: false),
  price: DataTypes.FLOAT (allowNull: false)
}
// Relationships: belongsToMany Barber through BarberServices
```

### Appointment Model
```javascript
// backend/models/Appointment.js
{
  id: DataTypes.STRING (primaryKey),
  clientName: DataTypes.STRING (allowNull: false),
  serviceName: DataTypes.STRING (allowNull: false),
  date: DataTypes.DATEONLY (allowNull: false),
  time: DataTypes.STRING (allowNull: false),
  status: DataTypes.STRING (defaultValue: 'pending'),
  barberId: DataTypes.STRING (allowNull: false),
  barberName: DataTypes.STRING (allowNull: false),
  price: DataTypes.FLOAT (allowNull: false),
  wppclient: DataTypes.STRING (allowNull: false)
}
```

### Comment Model
```javascript
// backend/models/Comment.js
{
  id: DataTypes.STRING (primaryKey),
  name: DataTypes.STRING (allowNull: false),
  comment: DataTypes.TEXT (allowNull: false),
  status: DataTypes.ENUM('pending', 'approved', 'rejected') (defaultValue: 'pending')
}
// Timestamps: true (createdAt, updatedAt)
```

### BarberServices Model (Junction Table)
```javascript
// backend/models/BarberServices.js
{
  BarberId: DataTypes.STRING (primaryKey, references Barbers.id),
  ServiceId: DataTypes.UUID (primaryKey, references Services.id)
}
// Timestamps: false
```

## Frontend Types (Current)

### User Type
```typescript
// src/types/index.ts
interface User {
  id: string;
  name: string;
  email: string;        // ❌ NOT IN BACKEND
  phone?: string;       // ❌ NOT IN BACKEND
  role: 'client' | 'barber' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}
```

### Barber Type
```typescript
// src/types/index.ts
interface Barber {
  id: string;
  name: string;
  email: string;           // ❌ NOT IN BACKEND
  phone?: string;          // ❌ NOT IN BACKEND (backend has 'whatsapp')
  specialties: string[];   // ❌ NOT IN BACKEND
  isActive: boolean;       // ❌ NOT IN BACKEND
  workingHours: WorkingHours; // ❌ NOT IN BACKEND
  createdAt: Date;         // ❌ NOT IN BACKEND
  updatedAt: Date;         // ❌ NOT IN BACKEND
}
```

### Service Type
```typescript
// src/types/index.ts
interface Service {
  id: string;              // ✅ MATCHES (UUID)
  name: string;            // ✅ MATCHES
  description: string;     // ❌ NOT IN BACKEND
  duration: number;        // ❌ NOT IN BACKEND
  price: number;           // ✅ MATCHES (FLOAT)
  isActive: boolean;       // ❌ NOT IN BACKEND
  createdAt: Date;         // ❌ NOT IN BACKEND
  updatedAt: Date;         // ❌ NOT IN BACKEND
}
```

### Appointment Type
```typescript
// src/types/index.ts
interface Appointment {
  id: string;              // ✅ MATCHES
  clientId: string;        // ❌ BACKEND HAS 'clientName' (string)
  barberId: string;        // ✅ MATCHES
  serviceId: string;       // ❌ BACKEND HAS 'serviceName' (string)
  date: Date;              // ✅ MATCHES (DATEONLY)
  startTime: string;       // ❌ BACKEND HAS 'time' (string)
  endTime: string;         // ❌ NOT IN BACKEND
  status: AppointmentStatus; // ✅ MATCHES (string)
  notes?: string;          // ❌ NOT IN BACKEND
  createdAt: Date;         // ❌ NOT IN BACKEND
  updatedAt: Date;         // ❌ NOT IN BACKEND
}
```

### Comment Type
```typescript
// src/types/index.ts - Has two different interfaces
interface Comment {
  id: string;              // ✅ MATCHES
  appointmentId: string;   // ❌ NOT IN BACKEND
  clientId: string;        // ❌ NOT IN BACKEND
  barberId: string;        // ❌ NOT IN BACKEND
  rating: number;          // ❌ NOT IN BACKEND
  comment: string;         // ✅ MATCHES
  createdAt: Date;         // ✅ MATCHES
}

interface PublicComment {
  id: string;              // ✅ MATCHES
  name: string;            // ✅ MATCHES
  comment: string;         // ✅ MATCHES
  status: 'pending' | 'approved' | 'rejected'; // ✅ MATCHES
  createdAt: string;       // ✅ MATCHES
  updatedAt?: string;      // ✅ MATCHES
}
```

## Critical Differences Analysis

### 🔴 Major Structural Differences

#### User Model
- **Backend**: Uses `username` instead of `email`
- **Backend**: No `email` or `phone` fields
- **Frontend**: Expects `email` and `phone` fields
- **Impact**: UserRepository needs significant adaptation

#### Barber Model
- **Backend**: Has `whatsapp` and `pix` fields (payment info)
- **Backend**: No `email`, `specialties`, `isActive`, `workingHours`, timestamps
- **Frontend**: Complex structure with working hours and specialties
- **Impact**: BarberRepository needs complete redesign

#### Service Model
- **Backend**: Minimal structure (id, name, price only)
- **Backend**: No `description`, `duration`, `isActive`, timestamps
- **Frontend**: Rich structure with duration, description, active status
- **Impact**: ServiceRepository needs adaptation for missing fields

#### Appointment Model
- **Backend**: Uses `clientName` and `serviceName` (denormalized)
- **Backend**: Single `time` field, has `barberName`, `price`, `wppclient`
- **Frontend**: Uses IDs for relationships, has `startTime`/`endTime`, `notes`
- **Impact**: AppointmentRepository needs major restructuring

### 🟡 Minor Differences

#### Comment Model
- **Frontend PublicComment**: ✅ Matches backend structure well
- **Frontend Comment**: ❌ Different structure (appointment-based vs public)
- **Impact**: Use PublicComment interface, ignore appointment-based Comment

## Adaptation Strategy

### 1. User Repository Adaptation
```typescript
// Adapt frontend User interface to match backend
interface BackendUser {
  id: string;
  username: string;    // Instead of email
  password: string;    // Only for creation/update
  role: string;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Repository methods need to:
// - Use username instead of email for authentication
// - Handle password hashing on backend
// - Map role strings to frontend enum
```

### 2. Barber Repository Adaptation
```typescript
// Create new interface matching backend
interface BackendBarber {
  id: string;
  name: string;
  whatsapp: string;
  pix: string;
}

// Repository methods need to:
// - Handle whatsapp as contact method (not phone)
// - Include pix for payment information
// - Implement frontend filters for specialties/working hours in memory
```

### 3. Service Repository Adaptation
```typescript
// Simplified interface matching backend
interface BackendService {
  id: string;          // UUID
  name: string;
  price: number;       // Float
}

// Repository methods need to:
// - Handle missing description/duration in frontend (default values)
// - Implement isActive filtering in memory
// - Use UUID for service IDs
```

### 4. Appointment Repository Adaptation
```typescript
// Interface matching backend structure
interface BackendAppointment {
  id: string;
  clientName: string;    // Not clientId
  serviceName: string;   // Not serviceId
  date: string;          // DATEONLY
  time: string;          // Single time field
  status: string;
  barberId: string;
  barberName: string;    // Denormalized
  price: number;         // Service price
  wppclient: string;     // WhatsApp client info
}

// Repository methods need to:
// - Convert between clientName/serviceName and IDs
// - Handle single time field (no endTime)
// - Include barberName and price (denormalized data)
// - Handle wppclient field for WhatsApp integration
```

### 5. Comment Repository Adaptation
```typescript
// Use PublicComment interface (matches backend)
interface BackendComment {
  id: string;
  name: string;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

// Repository methods need to:
// - Use PublicComment interface instead of Comment
// - Handle status enum properly
// - Support admin operations for status updates
```

## Implementation Recommendations

### 1. Create Backend-Specific Interfaces
Create new interfaces in `src/types/backend.ts` that match the exact backend structure:

```typescript
// src/types/backend.ts
export interface BackendUser {
  id: string;
  username: string;
  password?: string;
  role: string;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BackendBarber {
  id: string;
  name: string;
  whatsapp: string;
  pix: string;
}

export interface BackendService {
  id: string;
  name: string;
  price: number;
}

export interface BackendAppointment {
  id: string;
  clientName: string;
  serviceName: string;
  date: string;
  time: string;
  status: string;
  barberId: string;
  barberName: string;
  price: number;
  wppclient: string;
}

export interface BackendComment {
  id: string;
  name: string;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. Create Adapter Functions
Create adapter functions to convert between backend and frontend formats:

```typescript
// src/adapters/BackendAdapter.ts
export class BackendAdapter {
  static userFromBackend(backendUser: BackendUser): User {
    return {
      id: backendUser.id,
      name: backendUser.name,
      email: backendUser.username, // Map username to email
      phone: undefined,
      role: backendUser.role as 'client' | 'barber' | 'admin',
      createdAt: backendUser.createdAt || new Date(),
      updatedAt: backendUser.updatedAt || new Date(),
    };
  }

  static userToBackend(user: User): BackendUser {
    return {
      id: user.id,
      username: user.email, // Map email to username
      role: user.role,
      name: user.name,
    };
  }

  // Similar adapters for other models...
}
```

### 3. Repository Implementation Strategy
- Use backend interfaces for API communication
- Use adapter functions to convert to/from frontend types
- Implement missing functionality (like filtering) in the repository layer
- Handle denormalized data appropriately

### 4. Frontend Component Updates
- Update components to handle missing fields gracefully
- Use default values for missing backend fields
- Implement client-side filtering for complex queries

## Next Steps

1. ✅ **Document structure differences** (this document)
2. 🔄 **Create backend-specific interfaces**
3. 🔄 **Implement adapter functions**
4. 🔄 **Update repository implementations**
5. 🔄 **Test integration with real backend**
6. 🔄 **Update frontend components as needed**

## Notes

- The backend uses a more denormalized approach (storing names instead of IDs)
- Frontend expects more normalized, relational data
- Some frontend features (like working hours, specialties) have no backend equivalent
- WhatsApp integration is built into the backend (`wppclient` field)
- Payment information is stored in Barber model (`pix` field)
- Backend uses simple string IDs except for Services (UUID)