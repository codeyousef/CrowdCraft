export interface Database {
  public: {
    Tables: {
      worlds: {
        Row: {
          id: string;
          created_at: string;
          reset_at: string;
          snapshot_url: string | null;
          total_blocks: number;
          unique_builders: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          reset_at: string;
          snapshot_url?: string | null;
          total_blocks?: number;
          unique_builders?: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          reset_at?: string;
          snapshot_url?: string | null;
          total_blocks?: number;
          unique_builders?: number;
        };
      };
      blocks: {
        Row: {
          x: number;
          y: number;
          block_type: 'grass' | 'water' | 'stone' | 'wood' | 'house' | 'tree';
          placed_by: string;
          placed_at: string;
          world_id: string;
        };
        Insert: {
          x: number;
          y: number;
          block_type: 'grass' | 'water' | 'stone' | 'wood' | 'house' | 'tree';
          placed_by: string;
          placed_at?: string;
          world_id: string;
        };
        Update: {
          x?: number;
          y?: number;
          block_type?: 'grass' | 'water' | 'stone' | 'wood' | 'house' | 'tree';
          placed_by?: string;
          placed_at?: string;
          world_id?: string;
        };
      };
    };
  };
}