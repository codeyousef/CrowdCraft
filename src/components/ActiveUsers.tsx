import React from 'react';
import { useGameStore } from '../store/gameStore';

export const ActiveUsers = () => {
  const activeUsers = useGameStore(state => state.activeUsers);
  const uniqueBuilders = useGameStore(state => state.uniqueBuilders);
  
  return (
    <div style={{
      position: 'fixed',
      top: '16px',
      left: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      backgroundColor: 'rgba(30, 41, 59, 0.8)',
      backdropFilter: 'blur(8px)',
      borderRadius: '8px',
      padding: '8px 12px',
      color: '#F8FAFC',
      fontSize: '14px',
      zIndex: 1000
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: '#10B981' }}>🟢</span>
        <span>{activeUsers.size} online</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: '#3B82F6' }}>👥</span>
        <span>{uniqueBuilders} total builders</span>
      </div>
    </div>
  );
};