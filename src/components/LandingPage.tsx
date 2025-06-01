import React from 'react';
import { useGameStore } from '../store/gameStore';
import { supabase } from '../lib/supabase';

export const LandingPage = () => {
  const setWorldId = useGameStore(state => state.setWorldId);

  const rejoinLastWorld = async () => {
    const lastWorldId = localStorage.getItem('lastWorldId');
    if (lastWorldId) {
      const { data: world } = await supabase
        .from('worlds')
        .select('id')
        .eq('id', lastWorldId)
        .single();

      if (world) {
        setWorldId(world.id);
        return true;
      }
    }
    return false;
  };

  const handleJoinWorld = async () => {
    try {
      // Enable auto-join for future visits
      localStorage.setItem('autoJoin', 'true');
      
      // Try to rejoin last world first
      const rejoined = await rejoinLastWorld();
      if (rejoined) return;

      // Find world with less than 50 players
      const { data: worlds, error } = await supabase
        .from('worlds')
        .select('id, unique_builders')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      if (worlds && worlds[0]) {
        setWorldId(worlds[0].id);
      }
    } catch (error) {
      console.error('Failed to join world:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl text-center space-y-8">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          CrowdCraft
        </h1>
        
        <p className="text-2xl text-text-primary">
          Build Together, Create Forever
        </p>

        <div className="space-y-6 text-text-secondary">
          <p className="text-lg">
            Jump into a shared canvas where every block you place becomes part of something bigger.
            No accounts, no rules, just pure collaborative creation that resets every 30 minutes.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="bg-surface p-4 rounded-lg">
              <div className="text-2xl mb-2">🎮</div>
              <h3 className="font-semibold text-text-primary mb-2">Instant Play</h3>
              <p>No signup required. Join and start building in seconds.</p>
            </div>
            
            <div className="bg-surface p-4 rounded-lg">
              <div className="text-2xl mb-2">👥</div>
              <h3 className="font-semibold text-text-primary mb-2">Build Together</h3>
              <p>Create with up to 50 players in real-time collaboration.</p>
            </div>
            
            <div className="bg-surface p-4 rounded-lg">
              <div className="text-2xl mb-2">🎬</div>
              <h3 className="font-semibold text-text-primary mb-2">Watch It Grow</h3>
              <p>Every 30 minutes, watch your creation come to life in a timelapse.</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleJoinWorld}
          className="bg-primary hover:bg-primary-hover text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all transform hover:scale-105 active:scale-95"
        >
          {localStorage.getItem('lastWorldId') ? 'Return to Building' : 'Join a World'}
        </button>

        <p className="text-text-secondary text-sm">
          Built with ❤️ using bolt.new for the World's Biggest Hackathon
        </p>
      </div>
    </div>
  );
};