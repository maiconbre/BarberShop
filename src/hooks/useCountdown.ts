import { useState, useEffect, useCallback } from 'react';

export const useCountdown = (targetDate: Date) => {
  const calculateTimeLeft = useCallback(() => {
    const difference = +targetDate - +new Date();
    
    if (difference > 0) {
      return {
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    }

    return {
      hours: 0,
      minutes: 0,
      seconds: 0
    };
  }, [targetDate]);

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  return timeLeft;
};
