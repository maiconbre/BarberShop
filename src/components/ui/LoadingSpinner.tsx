import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
  showProgressBar?: boolean;
  progressDuration?: number;
  forceComplete?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text = 'Carregando...', 
  fullScreen = false,
  showProgressBar = false,
  progressDuration = 1200,
  forceComplete = false
}) => {
  const [progress, setProgress] = React.useState(0);
  const [isCompleting, setIsCompleting] = React.useState(false);

  React.useEffect(() => {
    if (!showProgressBar) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        // Progresso rápido até 99% durante a duração especificada
        const increment = 99 / (progressDuration / 50);
        const newProgress = prev + increment;
        
        if (newProgress >= 99) {
          clearInterval(interval);
          return 99;
        }
        
        return newProgress;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [showProgressBar, progressDuration]);

  // Completa a barra quando forceComplete é true
  React.useEffect(() => {
    if (forceComplete && showProgressBar) {
      setIsCompleting(true);
      setProgress(100);
    }
  }, [forceComplete, showProgressBar]);

  // Completa a barra quando o componente está prestes a desmontar
  React.useEffect(() => {
    return () => {
      if (showProgressBar && progress >= 99) {
        setIsCompleting(true);
        setProgress(100);
      }
    };
  }, [showProgressBar, progress]);
  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const containerClasses = fullScreen 
    ? 'flex items-center justify-center min-h-screen bg-[#0D121E]'
    : 'flex items-center justify-center p-8';

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center space-y-4">
        {/* Texto de carregamento com animação suave */}
        <motion.p 
          className={`${textSizeClasses[size]} text-white/80 font-medium`}
          animate={{
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          {text}
        </motion.p>

        {/* Barra de progresso */}
        <div className="w-40 h-1 bg-[#1A1F2E] rounded-full overflow-hidden">
          {showProgressBar ? (
            // Barra de progresso real
            <motion.div
               className="h-full bg-gradient-to-r from-[#F0B35B] to-[#FFD700] rounded-full"
               initial={{ width: '0%' }}
               animate={{ width: `${progress}%` }}
               transition={{
                 duration: isCompleting ? 0.3 : 0.1,
                 ease: isCompleting ? 'easeInOut' : 'easeOut'
               }}
             />
          ) : (
            // Barra de progresso animada (fallback)
            <motion.div
              className="h-full bg-gradient-to-r from-transparent via-[#F0B35B] to-transparent rounded-full"
              animate={{
                x: ['-150%', '150%']
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;