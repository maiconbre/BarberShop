import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Save } from 'lucide-react';
import BarberScheduleManager from '../components/BarberScheduleManager';

// Type definitions
type BarberScheduleManagerHandle = {
  save: () => Promise<void>;
};

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'barber' | 'client';
}

const BarberSchedulePage: React.FC = () => {
  const { getCurrentUser } = useAuth();
  const currentUser = getCurrentUser() as User | null;
  const navigate = useNavigate();

  const [barbers, setBarbers] = useState<User[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const scheduleManagerRef = useRef<BarberScheduleManagerHandle>(null);

  const fetchBarbers = useCallback(async () => {
    // Removida a verificação que causava loop infinito
    if (barbers.length > 0) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/barbers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      if (data.success) {
        setBarbers(data.data);
        handleBarberSelection(data.data);
      } else {
        throw new Error(data.message || 'Error fetching barbers');
      }
    } catch (err) {
      console.error('Error fetching barbers:', err);
      setError('Could not load barber list. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []); // Removida a dependência que causava o loop

  const handleBarberSelection = (barberList: User[]) => {
    if (currentUser?.role === 'barber') {
      setSelectedBarber(currentUser.id);
    } else if (barberList.length > 0) {
      setSelectedBarber(barberList[0].id);
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (isMounted) fetchBarbers();
    return () => { isMounted = false; };
  }, [fetchBarbers]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setError(null);
    try {
      await scheduleManagerRef.current?.save();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving schedule:', err);
      setError('Could not save configurations. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D121E] pt-16 relative overflow-hidden">
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-white hover:text-[#F0B35B] transition-colors"
          >
            <ArrowLeft className="mr-2" size={20} />
            Voltar
          </button>
          
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${isSaving ? 'bg-gray-500 cursor-not-allowed' : 'bg-[#F0B35B] hover:bg-[#E0A34B] text-black'}`}
          >
            {isSaving ? (
              <>
                <span className="animate-pulse">Salvando...</span>
              </>
            ) : (
              <>
                <Save className="mr-2" size={18} />
                Salvar
              </>
            )}
          </button>
        </div>
        
        {saveSuccess && (
          <div className="bg-green-500/20 text-green-300 p-3 rounded-lg mb-4 flex items-center">
            <span>Configurações salvas com sucesso!</span>
          </div>
        )}
        
        {error && (
          <div className="bg-red-500/20 text-red-300 p-3 rounded-lg mb-4 flex items-center">
            <span>{error}</span>
          </div>
        )}
        
        {selectedBarber && !isLoading && (
          <BarberScheduleManager
            key={selectedBarber}
            barberId={selectedBarber}
            barberName={barbers.find(b => b.id === selectedBarber)?.name || ''}
            ref={scheduleManagerRef}
          />
        )}
      </main>
    </div>
  );
};

export default BarberSchedulePage;