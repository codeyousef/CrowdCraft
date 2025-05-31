import React from 'react';
import { IsometricGrid } from './components/SimpleIsometricGrid';
import { BlockSelector } from './components/BlockSelector';
import { ErrorBoundary } from './components/ErrorBoundary';
import { WorldTimer } from './components/WorldTimer';
import { useGameStore } from './store/gameStore';
import { supabase } from './lib/supabase';
import { useEffect } from 'react';


function App() {
  const { worldId, setWorldId } = useGameStore();
  
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