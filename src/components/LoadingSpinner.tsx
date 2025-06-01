import React, { useEffect, useState } from 'react';

interface LoadingSpinnerProps {
  message?: string;
  timeout?: number;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading...',
  timeout = 10000
}) => {
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTimeout(true);
    }, timeout);

    return () => clearTimeout(timer);
  }, [timeout]);

  <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin"></div>
      </div>
      <div className="text-text-primary text-lg font-medium">{message}</div>
      {showTimeout && (
        <div className="text-text-secondary text-sm mt-2 max-w-md text-center">
          Taking longer than usual? Try refreshing the page.
        </div>
      )}
    </div>
  </div>
);