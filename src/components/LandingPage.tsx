import React from 'react';
import { useGameStore } from '../store/gameStore';
import { supabase } from '../lib/supabase';
import { TimelapseGallery } from './TimelapseGallery';

export const LandingPage = () => {
  const { joinWorld } = useGameStore();
  const [isJoining, setIsJoining] = React.useState(false);

  const handleJoinWorld = async () => {
    if (isJoining) return; // Prevent multiple clicks
    
    setIsJoining(true);
    try {
      // Try to rejoin last world first, otherwise join any available world
      const lastWorldId = localStorage.getItem('lastWorldId');
      console.log('🔄 Attempting to join world:', { lastWorldId });
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Join world timeout')), 10000)
      );
      
      await Promise.race([
        joinWorld(lastWorldId || undefined),
        timeoutPromise
      ]);
    } catch (error) {
      console.error('Failed to join world:', error);
      // Clear any stale world data on error
      localStorage.removeItem('lastWorldId');
      localStorage.removeItem('worldId');
      localStorage.removeItem('worldStartTime');
      localStorage.removeItem('worldEndTime');
      // Force reload to reset state
      window.location.reload();
    } finally {
      setIsJoining(false);
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
          disabled={isJoining}
          className="bg-primary hover:bg-primary-hover disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all transform hover:scale-105 active:scale-95 disabled:transform-none"
        >
          {isJoining ? 'Loading...' : (localStorage.getItem('lastWorldId') ? 'Return to Building' : 'Join a World')}
        </button>

        <div className="mt-16">
          <h2 className="text-3xl font-bold text-text-primary mb-8">
            Recent Masterpieces
          </h2>
          <TimelapseGallery />
        </div>

        <p className="text-text-secondary text-sm">
          Built with ❤️ using bolt.new for the World's Biggest Hackathon
        </p>
      </div>
    </div>
  );
};