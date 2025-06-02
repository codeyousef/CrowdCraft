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

  // Get public URL for snapshot
  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from('timelapses').getPublicUrl(path);
    return data.publicUrl;
  };

  useEffect(() => {
    const loadTimelapses = async () => {
      try {
        const { data, error } = await supabase
          .from('worlds')
          .select('id, created_at, total_blocks, unique_builders, snapshot_url')
          .not('snapshot_url', 'is', null)
          .order('created_at', { ascending: false })
          .limit(6);

        if (error) throw error;
        
        // Transform data to include public URLs
        const timelapseData = (data || []).map(timelapse => ({
          ...timelapse,
          snapshot_url: timelapse.snapshot_url ? getPublicUrl(timelapse.snapshot_url) : null
        }));
        
        setTimelapses(timelapseData);
      } catch (error) {
        console.error('Failed to load timelapses:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTimelapses();
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-12">
      {timelapses.map((timelapse) => (
        <div key={timelapse.id} className="bg-surface rounded-lg overflow-hidden">
          <div className="aspect-video relative">
            <video
              className="w-full h-full object-cover"
              src={timelapse.snapshot_url || ''}
              loop
              muted
              autoPlay
              playsInline
              controls
            />
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
  );
};