import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Timelapse {
  id: string;
  created_at: string;
  total_blocks: number;
  unique_builders: number;
  snapshot_url: string;
}

export const TimelapseGallery = () => {
  const [timelapses, setTimelapses] = useState<Timelapse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get public URL for snapshot
  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from('timelapses').getPublicUrl(path);
    return data.publicUrl;
  };

  useEffect(() => {
    const loadTimelapses = async () => {
      try {
        setError(null);
        setLoading(true);

        // First check all worlds to debug
        const { data: allWorlds, error: debugError } = await supabase
          .from('worlds')
          .select('id, created_at, total_blocks, unique_builders, snapshot_url, reset_at')
          .order('created_at', { ascending: false })
          .limit(10);

        console.log('🔍 All worlds in database:', allWorlds);
        console.log('🔍 Total worlds found:', allWorlds?.length || 0);
        
        const worldsWithSnapshots = allWorlds?.filter(w => w.snapshot_url) || [];
        console.log('🔍 Worlds with snapshots:', worldsWithSnapshots);

        const { data, error: supabaseError } = await supabase
          .from('worlds')
          .select('id, created_at, total_blocks, unique_builders, snapshot_url')
          .not('snapshot_url', 'is', null)
          .order('created_at', { ascending: false })
          .limit(6);

        console.log('🔍 Filtered query result:', data);

        if (supabaseError) {
          throw supabaseError;
        }
        
        // Transform data to include public URLs
        const timelapseData = (data || []).map(timelapse => ({
          ...timelapse,
          snapshot_url: timelapse.snapshot_url ? getPublicUrl(timelapse.snapshot_url) : null
        }));
        
        console.log('🔍 Final timelapse data:', timelapseData);
        setTimelapses(timelapseData);
      } catch (err) {
        console.error('Failed to load timelapses:', err);
        setError('Unable to load timelapses. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadTimelapses();

    // Set up real-time subscription for updates
    const subscription = supabase
      .channel('worlds_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'worlds'
      }, loadTimelapses)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleShare = async (timelapse: Timelapse) => {
    const shareData = {
      title: 'CrowdCraft Creation',
      text: `${timelapse.unique_builders} builders created this masterpiece with ${timelapse.total_blocks} blocks!`,
      url: window.location.origin
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(
          `Check out this amazing CrowdCraft creation! ${shareData.text} ${shareData.url}`
        );
        alert('Share link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg inline-block">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  const clearMockTimelapses = async () => {
    try {
      console.log('🧹 Clearing mock timelapses...');
      
      // Remove mock snapshot URLs from worlds
      const { data, error } = await supabase
        .from('worlds')
        .update({ snapshot_url: null })
        .like('snapshot_url', 'mock-timelapse%')
        .select();
        
      if (error) {
        console.error('❌ Failed to clear mock timelapses:', error);
      } else {
        console.log('✅ Cleared mock timelapses:', data?.length || 0, 'records updated');
        
        // Reload the component data
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch (error) {
      console.error('Failed to clear mock timelapses:', error);
    }
  };

  const checkTimelapseGeneration = async () => {
    try {
      console.log('🔍 Checking timelapse system status...');
      
      // Check recent worlds and their status
      const { data: recentWorlds } = await supabase
        .from('worlds')
        .select('id, created_at, reset_at, total_blocks, unique_builders, snapshot_url, started_at')
        .order('created_at', { ascending: false })
        .limit(5);
      
      console.log('📊 Recent worlds:', recentWorlds);
      
      if (recentWorlds) {
        recentWorlds.forEach((world, i) => {
          const isExpired = world.reset_at && new Date(world.reset_at) <= new Date();
          const hasSnapshot = !!world.snapshot_url;
          const hasBlocks = (world.total_blocks || 0) > 0;
          
          console.log(`🌍 World ${i + 1}:`, {
            id: world.id,
            created: world.created_at,
            started: world.started_at,
            reset: world.reset_at,
            isExpired,
            hasSnapshot,
            blocks: world.total_blocks || 0,
            builders: world.unique_builders || 0,
            status: isExpired ? (hasSnapshot ? '✅ Complete with timelapse' : '❌ Expired but no timelapse') : '⏳ Active'
          });
        });
      }
      
      // Check storage bucket
      console.log('🗂️ Checking storage bucket...');
      const { data: files, error: storageError } = await supabase
        .storage
        .from('timelapses')
        .list();
        
      if (storageError) {
        console.error('❌ Storage bucket error:', storageError);
        console.log('💡 The "timelapses" storage bucket may not exist or be accessible');
      } else {
        console.log('✅ Storage bucket accessible, files:', files);
      }
      
    } catch (error) {
      console.error('Failed to check timelapse system:', error);
    }
  };

  if (timelapses.length === 0) {
    return (
      <div className="text-center py-12 text-text-secondary">
        <div className="max-w-md mx-auto space-y-4">
          <div className="text-6xl mb-4">🎬</div>
          <h3 className="text-xl font-semibold text-text-primary">No Timelapses Yet</h3>
          <p className="text-text-secondary">
            Timelapses are created when worlds complete their 30-minute cycles. 
            Be the first to build something amazing!
          </p>
          <div className="bg-surface/50 rounded-lg p-4 mt-6">
            <p className="text-sm text-text-secondary">
              💡 <strong>How it works:</strong> Every block placement is recorded during the 30-minute world cycle. 
              When time runs out, we create a beautiful timelapse video showing how the world was built.
            </p>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <div className="space-y-2">
              <button
                onClick={clearMockTimelapses}
                className="block w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
              >
                🧹 Clear Mock Timelapses (Dev)
              </button>
              <button
                onClick={checkTimelapseGeneration}
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
              >
                🔍 Check Timelapse System (Dev)
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-6 p-4 bg-blue-900/20 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-400 mb-2">Development Tools</h3>
          <div className="space-y-2">
            <button
              onClick={clearMockTimelapses}
              className="block w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm"
            >
              🧹 Clear Mock Timelapses
            </button>
            <button
              onClick={checkTimelapseGeneration}
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm"
            >
              🔍 Check Timelapse System
            </button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-12">
        {timelapses.map((timelapse) => (
        <div key={timelapse.id} className="bg-surface rounded-lg overflow-hidden">
          <div className="aspect-video relative bg-gray-800 flex items-center justify-center">
            {/* Always show placeholder for mock timelapses since videos don't exist */}
            <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary">
              <div className="text-4xl mb-2">🎬</div>
              <p className="text-sm">Timelapse Preview</p>
              <p className="text-xs opacity-75">Video processing...</p>
            </div>
          </div>
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-text-primary">
                <span className="font-semibold">{timelapse.unique_builders || 0}</span> builders
              </div>
              <div className="text-text-secondary">
                <span className="font-semibold">{timelapse.total_blocks || 0}</span> blocks
              </div>
            </div>
            <button
              onClick={() => handleShare(timelapse)}
              className="w-full bg-primary/10 hover:bg-primary/20 text-primary font-medium py-2 px-4 rounded transition-colors"
            >
              Share Creation
            </button>
          </div>
        </div>
      ))}
      </div>
    </div>
  );
};