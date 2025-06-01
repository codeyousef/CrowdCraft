import React from 'react';
import { IsometricGrid } from './components/SimpleIsometricGrid';
import { BlockSelector } from './components/BlockSelector';
import { ErrorBoundary } from './components/ErrorBoundary';
import { WorldTimer } from './components/WorldTimer';
import { useGameStore } from './store/gameStore';
import { PlayerStats } from './components/PlayerStats';
import { useSupabaseStatus } from './hooks/useSupabaseStatus';
import { DebugOverlay } from './components/DebugOverlay';
import { supabase } from './lib/supabase';
import { useEffect, useState } from 'react';
import { useCurrentWorld } from './hooks/useCurrentWorld';
import { ConnectionStatus } from './components/ConnectionStatus';
import { usePerformanceMonitor } from './hooks/usePerformanceMonitor';
import { usePresence } from './hooks/usePresence';
import { ActiveUsers } from './components/ActiveUsers';
import { useWorldReset } from './hooks/useWorldReset';
import { useWorldHistory } from './hooks/useWorldHistory';
import { LandingPage } from './components/LandingPage';
import { PlayerName } from './components/PlayerName';

interface DebugMessage {
  text: string;
  timestamp: number;
}

function App() {
  const { worldId, setWorldId } = useGameStore();
  const [debugMessages, setDebugMessages] = useState<DebugMessage[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  
  useCurrentWorld();
  // Monitor Supabase connection status
  useSupabaseStatus();
  usePerformanceMonitor();
  usePresence(worldId);
  useWorldReset(worldId);
  useWorldHistory(worldId);
  
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '`' || (e.ctrlKey && e.key === 'd')) {
        e.preventDefault();
        setShowDebug(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Override console.log to capture debug messages
  useEffect(() => {
    const originalLog = console.log;
    console.log = (...args) => {
      originalLog.apply(console, args);
      setDebugMessages(prev => [
        ...prev,
        { text: args.join(' '), timestamp: Date.now() }
      ].slice(-100)); // Keep last 100 messages
    };
    return () => { console.log = originalLog; };
  }, []);


  return (
    <ErrorBoundary>
      <div style={{
        height: '100vh',
        width: '100vw',
        backgroundColor: '#0F172A',
        color: '#F8FAFC',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {!worldId ? (
          <LandingPage />
        ) : (
          <>
            <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-surface/80 backdrop-blur border-b border-border">
              <div className="flex items-center gap-6">
                <PlayerName />
                <ActiveUsers />
              </div>
              <div className="flex items-center gap-6">
                <PlayerStats />
                <ConnectionStatus />
              </div>
            </div>
            <div className="mt-20">
              <WorldTimer />
            </div>
            <DebugOverlay messages={debugMessages} visible={showDebug} />
            <IsometricGrid />
            <div style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 999,
              backgroundColor: '#1e293b',
              borderTop: '2px solid #6366f1',
              padding: '16px'
            }}>
              <BlockSelector />
            </div>
          </>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;