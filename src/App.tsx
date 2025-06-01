import React from 'react';
import { IsometricGrid } from './components/SimpleIsometricGrid';
import { BlockSelector } from './components/BlockSelector';
import { ErrorBoundary } from './components/ErrorBoundary';
import { WorldTimer } from './components/WorldTimer';
import { useGameStore } from './store/gameStore';
import { DebugOverlay } from './components/DebugOverlay';
import { supabase } from './lib/supabase';
import { useEffect, useState } from 'react';

interface DebugMessage {
  text: string;
  timestamp: number;
}

function App() {
  const { worldId, setWorldId } = useGameStore();
  const [debugMessages, setDebugMessages] = useState<DebugMessage[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  
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

  useEffect(() => {
    // Set a test world ID and ensure it exists
    if (!worldId) {
      const createWorld = async () => {
        // Generate a proper UUID for the world
        const testWorldId = crypto.randomUUID();
        
        try {
          // Create world in database
          const { error } = await supabase
            .from('worlds')
            .insert({
              id: testWorldId,
              reset_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
              total_blocks: 0,
              unique_builders: 0
            });
            
          if (error) throw error;
          
          setWorldId(testWorldId);
          console.log('✅ Created world in database:', testWorldId);
        } catch (error: any) {
          console.error('Failed to create world:', error.message);
          // Still set the world ID for local testing
          setWorldId(testWorldId);
          console.log('⚠️ Using local world only:', testWorldId);
        }
      };
      
      createWorld();
    }
  }, [worldId, setWorldId]);

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
        <WorldTimer />
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
      </div>
    </ErrorBoundary>
  );
}

export default App;