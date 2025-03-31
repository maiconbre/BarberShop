import React from 'react';
import BlockAppointment from '../components/BlockAppointment';
import { useAuth } from '../contexts/AuthContext';

const BlockSchedulePage: React.FC = () => {
  const { getCurrentUser } = useAuth();
  const currentUser = getCurrentUser();

  // Pegar barbeiros do cache do usuário atual
  const barbers = currentUser?.role === 'admin' 
    ? (currentUser.barbers || [])
    : [{ id: currentUser?.barberId || '', name: currentUser?.name || '' }];

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0D121E] pt-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto py-8">
        <BlockAppointment
          barbers={barbers}
          userRole={currentUser?.role || 'barber'}
          currentBarberId={currentUser?.barberId}
        />
      </div>
    </div>
  );
};

export default BlockSchedulePage;
