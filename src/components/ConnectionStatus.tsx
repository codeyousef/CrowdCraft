import React from 'react';
import { useGameStore } from '../store/gameStore';

export const ConnectionStatus = () => {
  const { connectionStatus } = useGameStore();
  
  return (
    <div style={{
      position: 'fixed',
      top: '60px',
      right: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      backgroundColor: 'rgba(30, 41, 59, 0.8)',
      backdropFilter: 'blur(8px)',
      borderRadius: '20px',
      padding: '6px 12px',
      color: '#F8FAFC',
      fontSize: '14px',
      zIndex: 1000
    }}>
      <div 
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: 
            connectionStatus === 'connected' ? '#10B981' :
            connectionStatus === 'connecting' ? '#F59E0B' :
            '#EF4444',
          animation: connectionStatus === 'connecting' ? 'pulse 2s infinite' : 'none'
        }}
      />
      <span>
        {connectionStatus === 'connected' ? 'Connected' :
         connectionStatus === 'connecting' ? 'Connecting...' :
         'Disconnected'}
      </span>
    </div>
  );
};