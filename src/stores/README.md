# Multi-Tenant Zustand Stores

This directory contains the updated Zustand stores with multi-tenant support. These stores have been migrated to use the repository pattern and automatically include tenant context (barbershopId) in all operations.

## ⚠️ Deprecation Notice

**These stores are deprecated and kept for backward compatibility only.** 

**Use the new hooks instead:**
- `useAppointments()` from `hooks/useAppointments.ts`
- `useBarbers()` from `hooks/useBarbers.ts`
- `useComments()` from `hooks/useComments.ts`

The hooks provide the same functionality with better TypeScript support and automatic tenant context management.

## Migration Guide

### Before (Old Store Usage)
```typescript
import { useAppointmentStore } from '@/stores/appointmentStore';

function MyComponent() {
  const { appointments, fetchAppointments } = useAppointmentStore();
  
  useEffect(() => {
    fetchAppointments();
  }, []);
  
  return <div>{appointments.length} appointments</div>;
}
```

### After (New Hook Usage)
```typescript
import { useAppointments } from '@/hooks/useAppointments';

function MyComponent() {
  const { appointments, loadAppointments } = useAppointments();
  
  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);
  
  return <div>{appointments?.length || 0} appointments</div>;
}
```

## Multi-Tenant Features

### Automatic Tenant Context
All operations automatically include the current tenant (barbershopId) from the TenantContext:

```typescript
// The hook automatically includes tenant context
const { appointments, loadAppointments } = useAppointments();

// This will only load appointments for the current barbershop
await loadAppointments();
```

### Tenant-Aware Caching
Each tenant has isolated cache storage:

```typescript
// Cache keys are automatically prefixed with tenant ID
// tenant:barbershop-123:appointments:{}
// tenant:barbershop-456:appointments:{}
```

### Data Isolation
All data operations are isolated by tenant:

```typescript
// Only returns appointments for the current barbershop
const appointments = await loadAppointments();

// Only creates appointment for the current barbershop
const newAppointment = await createAppointment(data);
```

## Store Structure

### AppointmentStore
- **State**: appointments, currentAppointment, loading states, tenant info
- **Actions**: CRUD operations, filtering by barber/status/date
- **Multi-tenant**: All operations include barbershopId automatically

### BarberStore  
- **State**: barbers, currentBarber, loading states, tenant info
- **Actions**: CRUD operations, filtering by name/specialty/service
- **Multi-tenant**: Handles formatted IDs ("01", "02") and User coordination

### CommentStore
- **State**: comments by status, loading states, tenant info  
- **Actions**: CRUD operations, status management (pending/approved/rejected)
- **Multi-tenant**: Admin operations isolated by tenant

## Backend Integration

### Real Backend Structure
The stores adapt to the actual backend API structure:

**Appointments**:
- Fields: `clientName`, `serviceName`, `date`, `time`, `status`, `barberId`, `barberName`, `price`, `wppclient`
- Endpoints: GET/POST/PATCH/DELETE `/api/appointments`
- Filtering: Query parameters + frontend filters

**Barbers**:
- Fields: `id` (formatted), `name`, `whatsapp`, `pix`, `username` (from User)
- Endpoints: GET/POST/PATCH/DELETE `/api/barbers`
- Operations: Coordinated User + Barber creation/updates

**Comments**:
- Fields: `name`, `comment`, `status` (enum: pending/approved/rejected)
- Endpoints: GET/POST/PATCH/DELETE `/api/comments`
- Admin: GET `/api/comments/admin` for all comments

### Rate Limiting
The stores respect backend rate limiting:
- Appointments: 200 req/min read, 20 req/min write
- Barbers: 150 req/min read
- Services: 300 req/min read
- Comments: Standard rate limits

## Usage Examples

### Initialize Tenant (Legacy Store Usage)
```typescript
import { useAppointmentStore } from '@/stores/appointmentStore';
import { useTenant } from '@/contexts/TenantContext';

function MyComponent() {
  const { barbershopId } = useTenant();
  const { initializeTenant, fetchAppointments } = useAppointmentStore();
  
  useEffect(() => {
    if (barbershopId) {
      initializeTenant(barbershopId);
      fetchAppointments();
    }
  }, [barbershopId]);
}
```

### Backend-Specific Operations
```typescript
// Create appointment with backend structure
const appointmentData = {
  clientName: 'João Silva',
  serviceName: 'Corte + Barba',
  date: new Date(),
  time: '14:00',
  barberId: '01',
  barberName: 'Carlos',
  price: 35.00,
  wppclient: '11999999999',
  status: 'pending'
};

await createWithBackendData(appointmentData);
```

### Multi-Tenant Filtering
```typescript
// Filter by barber (includes tenant automatically)
await fetchByBarberId('01');

// Filter by status (includes tenant automatically)  
await fetchByStatus('pending');

// Filter by date (includes tenant automatically)
await fetchByDate(new Date());
```

## Testing

Run the store tests:
```bash
npm test src/stores/__tests__/stores.test.ts
```

The tests verify:
- ✅ Default state initialization
- ✅ Tenant initialization
- ✅ Error handling when tenant not initialized
- ✅ State management and selectors
- ✅ Multi-tenant isolation

## Migration Timeline

1. **Phase 1** ✅: Update stores with multi-tenant support (backward compatible)
2. **Phase 2**: Migrate components to use new hooks
3. **Phase 3**: Remove deprecated store usage
4. **Phase 4**: Clean up legacy store code

## Best Practices

1. **Use Hooks**: Prefer the new hooks over direct store usage
2. **Tenant Context**: Always ensure TenantProvider wraps your app
3. **Error Handling**: Handle tenant initialization errors gracefully
4. **Cache Management**: Use `clearTenantCache()` when switching tenants
5. **Testing**: Mock tenant context in tests for proper isolation