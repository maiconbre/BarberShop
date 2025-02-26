import React, { useState, useEffect } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';

interface CalendarProps {
  onSelectDate: (date: string) => void;
  onSelectTime: (time: string) => void;
  selectedBarber: string;
}

interface BookedSlot {
  date: string;
  time: string;
  barberId: string;
}

const Calendar: React.FC<CalendarProps> = ({ onSelectDate, onSelectTime, selectedBarber }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timeSlots = [
    '09:00', '10:00', '11:00', '14:00', '15:00',
    '16:00', '17:00', '18:00', '19:00', '20:00'
  ];

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dates = Array.from({ length: 15 }, (_, i) => addDays(today, i));
    setAvailableDates(dates);
  }, []);

  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!selectedDate || !selectedBarber) return;

      setIsLoading(true);
      setError(null);
      try {
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        const response = await fetch(
          `http://localhost:5432/api/appointments/booked-slots?date=${formattedDate}&barberId=${selectedBarber}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setBookedSlots(data);
      } catch (error) {
        console.error('Erro ao buscar horários ocupados:', error);
        setError('Não foi possível carregar os horários. Tente novamente.');
        setBookedSlots([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookedSlots();
  }, [selectedDate, selectedBarber]);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onSelectDate(format(date, 'yyyy-MM-dd'));
  };

  const isTimeSlotBooked = (time: string) => {
    if (!selectedDate) return false;
    
    return bookedSlots.some(slot => 
      slot.time === time && 
      slot.date === format(selectedDate, 'yyyy-MM-dd') &&
      slot.barberId === selectedBarber
    );
  };

  const handleTimeClick = (time: string) => {
    if (isTimeSlotBooked(time)) return;
    onSelectTime(time);
  };

  return (
    <div className="space-y-4">
      {/* Calendário */}
      <div className="flex overflow-x-auto pb-2 hide-scrollbar">
        <div className="flex space-x-2">
          {availableDates.map((date) => (
            <button
              key={date.toISOString()}
              onClick={() => handleDateClick(date)}
              className={`
                flex flex-col items-center justify-center p-3 rounded-lg min-w-[80px]
                transition-all duration-200 transform hover:scale-105
                ${selectedDate && isSameDay(date, selectedDate)
                  ? 'bg-[#F0B35B] text-black'
                  : 'bg-[#1A1F2E] text-white hover:bg-[#252B3B]'}
              `}
            >
              <span className="text-xs opacity-75">
                {format(date, 'EEE', { locale: ptBR })}
              </span>
              <span className="text-lg font-bold">
                {format(date, 'd')}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Horários */}
      {selectedDate && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
          {isLoading ? (
            <div className="col-span-full flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-[#F0B35B]" />
            </div>
          ) : error ? (
            <div className="col-span-full text-center text-red-500 py-4">
              {error}
            </div>
          ) : (
            timeSlots.map((time) => (
              <button
                key={time}
                onClick={() => handleTimeClick(time)}
                disabled={isTimeSlotBooked(time)}
                className={`
                  py-2 px-4 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${isTimeSlotBooked(time)
                    ? 'bg-red-500/20 text-red-300 cursor-not-allowed'
                    : 'bg-[#1A1F2E] text-white hover:bg-[#F0B35B] hover:text-black'}
                `}
              >
                {time}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Calendar;