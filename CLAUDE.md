# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CrowdCraft is a real-time collaborative building game built with React + TypeScript + PixiJS. Users place blocks on a shared 50x50 isometric grid with 30-minute world cycles.

## Development Commands

- `npm run dev` - Start development server on port 5173
- TypeScript compilation: Use `npx tsc --noEmit` to check types
- No build/test scripts are configured yet

## Architecture

### State Management
- **Zustand store** (`src/store/gameStore.ts`) - Central game state with optimistic updates
- **Real-time sync** via Supabase subscriptions (`src/hooks/useRealtimeBlocks.ts`)
- **World lifecycle** managed by `useCurrentWorld` hook

### Rendering Stack
- **PixiJS v7** with `@pixi/react` for isometric grid rendering
- **Isometric conversion** logic in `src/lib/isometric.ts`
- **Tile pooling** system (`src/lib/TilePool.ts`) for performance
- **Texture management** (`src/lib/textures.ts`) for block sprites

### Data Flow
1. User clicks → `gameStore.placeBlock()` → optimistic UI update
2. Supabase upsert → server validation → real-time broadcast
3. All clients receive updates via `useRealtimeBlocks` subscription
4. Error handling with rollback for failed placements

### Key Components
- `IsometricGrid` - Main PixiJS canvas with coordinate conversion
- `BlockSelector` - Bottom toolbar for block type selection  
- `WorldTimer` - 30-minute countdown with reset warnings
- `DebugOverlay` - Console capture (toggle with ` key or Ctrl+D)

### Database Schema
- `worlds` table - 30-minute cycles with reset timestamps
- `blocks` table - Composite key (x, y, world_id) with placement metadata
- Rate limiting: 10 blocks/second per user via client-side validation

### Environment Setup
- Requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables
- No authentication - anonymous users with generated animal names

### Grid Specifications
- 50x50 grid (GRID_SIZE constant)
- Tile dimensions: 64x32px (48x24px on mobile)
- 6 block types: grass, water, stone, wood, house, tree
- Coordinates validated as integers within bounds

### Mobile Support
- Touch controls via `useTouchControls` hook
- Responsive tile scaling based on viewport
- Pinch-to-zoom and pan navigation