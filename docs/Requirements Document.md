# CrowdCraft Requirements Document

**Version 1.0 - May 31, 2025**

## Project Overview

CrowdCraft is a real-time collaborative building game where users work together to create pixel art and structures on a shared isometric grid. Built entirely in bolt.new for the Bold.new World's Biggest Hackathon.

## Functional Requirements

### Core Features

1. **Real-time Collaborative Building**
    
    - 50x50 isometric grid world
    - Support for 50-100 concurrent users
    - Sub-100ms latency for block placement
    - Optimistic UI updates with server reconciliation
2. **Block System**
    
    - 6 block types: Grass (🌱), Water (🌊), Stone (🪨), Wood (🪵), House (🏠), Tree (🌳)
    - Single-click placement
    - No block removal (prevents griefing)
    - Visual feedback on hover
3. **World Cycles**
    
    - 30-minute world cycles
    - Automatic world reset with 60-second warning
    - Time-lapse generation before reset
    - Previous world gallery
4. **User System**
    
    - Anonymous participation (no login required)
    - Random animal names (e.g., "Creative Penguin", "Building Fox")
    - Session persistence via localStorage
    - Live user counter
5. **Mobile Support**
    
    - Touch controls for block placement
    - Pinch-to-zoom (0.5x - 2x range)
    - Pan navigation
    - Responsive UI scaling

## Technical Requirements

### Frontend Stack

- **Framework**: React 18+ with TypeScript
- **Rendering**: PixiJS v7 for isometric graphics
- **State Management**: Zustand
- **Styling**: Tailwind CSS v3
- **Real-time**: Supabase Realtime subscriptions
- **Build Tool**: Vite (bolt.new default)

### Backend Stack (Supabase)

- **Database**: PostgreSQL
- **Real-time**: Supabase Realtime
- **Storage**: Supabase Storage for time-lapses
- **Edge Functions**: World reset logic
- **Authentication**: Anonymous sessions only

### Performance Requirements

- **Initial Load**: < 3 seconds on 4G
- **Frame Rate**: 60 FPS on modern devices, 30 FPS minimum
- **Bundle Size**: < 500KB gzipped
- **Memory Usage**: < 150MB
- **Concurrent Users**: 50 minimum, 100 target

### Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 8+)

## Data Model

### Database Schema

```sql
-- Worlds table
CREATE TABLE worlds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW(),
  reset_at TIMESTAMP NOT NULL,
  snapshot_url TEXT,
  total_blocks INTEGER DEFAULT 0,
  unique_builders INTEGER DEFAULT 0
);

-- Blocks table
CREATE TABLE blocks (
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  block_type TEXT NOT NULL,
  placed_by TEXT NOT NULL,
  placed_at TIMESTAMP DEFAULT NOW(),
  world_id UUID REFERENCES worlds(id) ON DELETE CASCADE,
  PRIMARY KEY (x, y, world_id)
);

-- Activity tracking
CREATE TABLE activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  world_id UUID REFERENCES worlds(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Security Requirements

- Row Level Security (RLS) on all tables
- Rate limiting: 10 blocks per second per user
- Input validation for coordinates
- XSS protection for usernames
- CORS properly configured

## Accessibility Requirements

- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader announcements for actions
- High contrast mode option
- Colorblind-friendly block indicators

## Success Metrics

- 90% of users place at least one block
- Average session duration > 5 minutes
- < 1% error rate for block placement
- Time-lapse shares > 100 per day
- Mobile users > 40% of total