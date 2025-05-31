# CrowdCraft Development Plan

**Timeline: May 31 - June 30, 2025**

## Development Timeline Overview

### Week 1 (May 31 - June 6): Foundation

- Project setup and infrastructure
- Basic isometric rendering
- Supabase integration

### Week 2 (June 7 - June 13): Core Features

- Real-time multiplayer
- Block placement system
- State management

### Week 3 (June 14 - June 20): Polish & Features

- Time-lapse system
- Mobile optimization
- Performance tuning

### Week 4 (June 21 - June 30): Launch Prep

- Bug fixes and testing
- Demo content
- Submission preparation

## Detailed Development Schedule

### Week 1: Foundation Setup

#### Day 1-2 (May 31 - June 1): Project Infrastructure

```bash
# Initial Setup in bolt.new
npx create-react-app crowdcraft --template typescript
npm install pixi.js @supabase/supabase-js zustand @tanstack/react-query
npm install -D @types/pixi.js tailwindcss postcss autoprefixer
```

**Supabase Configuration:**

```sql
-- Create tables
CREATE TABLE worlds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW(),
  reset_at TIMESTAMP NOT NULL,
  snapshot_url TEXT,
  total_blocks INTEGER DEFAULT 0
);

CREATE TABLE blocks (
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  block_type TEXT NOT NULL CHECK (block_type IN ('grass', 'water', 'stone', 'wood', 'house', 'tree')),
  placed_by TEXT NOT NULL,
  placed_at TIMESTAMP DEFAULT NOW(),
  world_id UUID REFERENCES worlds(id) ON DELETE CASCADE,
  PRIMARY KEY (x, y, world_id)
);

-- Enable RLS
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE worlds ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can read blocks" ON blocks FOR SELECT USING (true);
CREATE POLICY "Anyone can insert blocks" ON blocks FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read worlds" ON worlds FOR SELECT USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE blocks;
```

#### Day 3-4 (June 2-3): Isometric Renderer

```typescript
// src/engine/IsometricRenderer.ts
export class IsometricRenderer {
  private app: PIXI.Application;
  private viewport: PIXI.Container;
  private tileContainer: PIXI.Container;
  private tileSprites: Map<string, PIXI.Sprite>;
  
  constructor(canvas: HTMLCanvasElement) {
    this.app = new PIXI.Application({
      view: canvas,
      resolution: window.devicePixelRatio,
      autoDensity: true,
      backgroundColor: 0x0F172A,
      resizeTo: window
    });
    
    this.setupContainers();
    this.loadAssets();
  }
  
  private setupContainers() {
    this.viewport = new PIXI.Container();
    this.tileContainer = new PIXI.Container();
    this.viewport.addChild(this.tileContainer);
    this.app.stage.addChild(this.viewport);
    
    // Center viewport
    this.viewport.x = this.app.screen.width / 2;
    this.viewport.y = this.app.screen.height / 2;
  }
  
  private cartesianToIsometric(x: number, y: number): PIXI.Point {
    return new PIXI.Point(
      (x - y) * TILE_WIDTH / 2,
      (x + y) * TILE_HEIGHT / 2
    );
  }
}
```

#### Day 5-6 (June 4-5): Basic Interactions

```typescript
// src/hooks/useGridInteraction.ts
export const useGridInteraction = (renderer: IsometricRenderer) => {
  const [hoveredTile, setHoveredTile] = useState<Point | null>(null);
  const { placeBlock } = useGameStore();
  
  useEffect(() => {
    const handleMouseMove = (e: PIXI.FederatedPointerEvent) => {
      const worldPos = renderer.screenToWorld(e.global);
      const tilePos = renderer.worldToTile(worldPos);
      setHoveredTile(tilePos);
    };
    
    const handleClick = (e: PIXI.FederatedPointerEvent) => {
      if (hoveredTile) {
        placeBlock(hoveredTile.x, hoveredTile.y);
      }
    };
    
    renderer.app.stage.on('pointermove', handleMouseMove);
    renderer.app.stage.on('pointerdown', handleClick);
  }, [renderer, hoveredTile]);
};
```

### Week 2: Core Multiplayer Features

#### Day 7-8 (June 6-7): Supabase Integration

```typescript
// src/services/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// src/hooks/useRealtimeBlocks.ts
export const useRealtimeBlocks = (worldId: string) => {
  const updateBlock = useGameStore(state => state.updateBlock);
  
  useEffect(() => {
    const channel = supabase
      .channel(`world:${worldId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'blocks',
        filter: `world_id=eq.${worldId}`
      }, payload => {
        const { x, y, block_type, placed_by } = payload.new;
        updateBlock(x, y, { type: block_type, placedBy: placed_by });
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [worldId]);
};
```

#### Day 9-10 (June 8-9): State Management

```typescript
// src/store/gameStore.ts
interface GameState {
  worldId: string | null;
  blocks: Map<string, Block>;
  currentTool: BlockType;
  userName: string;
  activeUsers: Set<string>;
  worldTimer: number;
}

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  // State
  worldId: null,
  blocks: new Map(),
  currentTool: 'grass',
  userName: generateAnimalName(),
  activeUsers: new Set(),
  worldTimer: 1800, // 30 minutes
  
  // Actions
  placeBlock: async (x: number, y: number) => {
    const { worldId, currentTool, userName } = get();
    if (!worldId) return;
    
    // Optimistic update
    const key = `${x},${y}`;
    set(state => {
      state.blocks.set(key, {
        type: currentTool,
        placedBy: userName,
        placedAt: Date.now()
      });
      return { blocks: new Map(state.blocks) };
    });
    
    // Server update
    const { error } = await supabase
      .from('blocks')
      .upsert({
        x, y,
        block_type: currentTool,
        placed_by: userName,
        world_id: worldId
      });
      
    if (error) {
      // Rollback on error
      set(state => {
        state.blocks.delete(key);
        return { blocks: new Map(state.blocks) };
      });
    }
  }
}));
```

#### Day 11-12 (June 10-11): Optimizations

```typescript
// src/engine/TilePool.ts
export class TilePool {
  private pool: PIXI.Sprite[] = [];
  private active: Map<string, PIXI.Sprite> = new Map();
  
  getSprite(x: number, y: number, type: BlockType): PIXI.Sprite {
    const key = `${x},${y}`;
    
    if (this.active.has(key)) {
      return this.active.get(key)!;
    }
    
    const sprite = this.pool.pop() || new PIXI.Sprite();
    sprite.texture = PIXI.Texture.from(BLOCK_TEXTURES[type]);
    this.active.set(key, sprite);
    
    return sprite;
  }
  
  releaseSprite(x: number, y: number) {
    const key = `${x},${y}`;
    const sprite = this.active.get(key);
    
    if (sprite) {
      sprite.visible = false;
      this.active.delete(key);
      this.pool.push(sprite);
    }
  }
}
```

### Week 3: Polish & Advanced Features

#### Day 13-14 (June 12-13): Time-lapse System

```typescript
// src/services/timelapse.ts
export class TimelapseRecorder {
  private frames: ImageData[] = [];
  private renderer: IsometricRenderer;
  
  captureFrame() {
    const renderTexture = PIXI.RenderTexture.create({
      width: 1920,
      height: 1080
    });
    
    this.renderer.app.renderer.render(
      this.renderer.viewport,
      { renderTexture }
    );
    
    const canvas = this.renderer.app.renderer.extract.canvas(renderTexture);
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    this.frames.push(imageData);
  }
  
  async generateVideo(): Promise<Blob> {
    // Use WebCodecs API for video generation
    const encoder = new VideoEncoder({
      output: (chunk) => { /* ... */ },
      error: (e) => console.error(e)
    });
    
    encoder.configure({
      codec: 'vp8',
      width: 1920,
      height: 1080,
      bitrate: 2_000_000,
      framerate: 30
    });
    
    // Encode frames...
  }
}
```

#### Day 15-16 (June 14-15): Mobile Optimization

```typescript
// src/hooks/useTouchControls.ts
export const useTouchControls = (renderer: IsometricRenderer) => {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    let initialDistance = 0;
    let initialScale = 1;
    
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        initialDistance = getDistance(e.touches[0], e.touches[1]);
        initialScale = scale;
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const currentDistance = getDistance(e.touches[0], e.touches[1]);
        const newScale = (currentDistance / initialDistance) * initialScale;
        setScale(Math.max(0.5, Math.min(2, newScale)));
      } else if (e.touches.length === 1) {
        // Pan logic
      }
    };
  }, [scale]);
};
```

#### Day 17-18 (June 16-17): Performance Tuning

```typescript
// Implement viewport culling
const cullTiles = (tiles: Map<string, Tile>, viewport: Rectangle) => {
  const buffer = 100; // pixels
  const visible = new Map<string, Tile>();
  
  tiles.forEach((tile, key) => {
    const [x, y] = key.split(',').map(Number);
    const isoPos = cartesianToIsometric(x, y);
    
    if (
      isoPos.x > viewport.left - buffer &&
      isoPos.x < viewport.right + buffer &&
      isoPos.y > viewport.top - buffer &&
      isoPos.y < viewport.bottom + buffer
    ) {
      visible.set(key, tile);
    }
  });
  
  return visible;
};

// Batch render updates
const batchRenderUpdates = debounce((updates: TileUpdate[]) => {
  requestAnimationFrame(() => {
    updates.forEach(update => renderer.updateTile(update));
  });
}, 16); // 60fps
```

### Week 4: Launch Preparation

#### Day 19-20 (June 18-19): Testing & Bug Fixes

```typescript
// src/__tests__/integration.test.ts
describe('CrowdCraft Integration Tests', () => {
  test('concurrent block placement', async () => {
    const users = Array.from({ length: 50 }, (_, i) => 
      createMockUser(`User${i}`)
    );
    
    // Simulate concurrent placements
    await Promise.all(
      users.map(user => user.placeBlock(
        Math.floor(Math.random() * 50),
        Math.floor(Math.random() * 50),
        'grass'
      ))
    );
    
    // Verify all blocks placed
    const blocks = await getWorldBlocks(testWorldId);
    expect(blocks.length).toBe(50);
  });
});
```

#### Day 21-22 (June 20-21): Demo Content

```typescript
// src/data/demoStructures.ts
export const DEMO_STRUCTURES = {
  castle: [
    { x: 20, y: 20, type: 'stone' },
    { x: 21, y: 20, type: 'stone' },
    // ... full castle structure
  ],
  
  welcomeSign: [
    // "CROWDCRAFT" spelled in blocks
  ],
  
  spiral: generateSpiral(25, 25, 10)
};

// Auto-build animation
export const animateStructure = async (structure: Block[]) => {
  for (const block of structure) {
    await placeBlock(block.x, block.y, block.type);
    await sleep(50); // Dramatic effect
  }
};
```

#### Day 23-24 (June 22-23): Production Optimization

```bash
# Build optimization
npm run build

# Bundle analysis
npm run analyze

# Lazy load heavy dependencies
const PixiApp = lazy(() => import('./engine/PixiApp'));

# Enable Supabase connection pooling
# Configure CDN for static assets
```

#### Day 25-26 (June 24-25): Documentation

Write comprehensive documentation including:

- README with live demo link
- API documentation
- Architecture diagrams
- Performance benchmarks
- Known limitations

#### Day 27-28 (June 26-27): Video & Presentation

- Record demo video showing key features
- Create presentation slides
- Prepare judge-friendly demo script
- Test on multiple devices

#### Day 29-30 (June 28-30): Final Polish

- Last-minute bug fixes
- Stress test with real users
- Submit to hackathon
- Prepare backup deployment

## Risk Mitigation

### Technical Risks

1. **Supabase rate limits**: Implement client-side throttling
2. **Performance on low-end devices**: Progressive enhancement
3. **Network latency**: Optimistic updates with reconciliation

### Schedule Risks

1. **Feature creep**: Strict MVP focus
2. **Integration issues**: Daily integration tests
3. **Last-minute bugs**: Feature freeze 3 days before deadline

## Success Criteria

- [ ] 50+ concurrent users without lag
- [ ] < 100ms block placement latency
- [ ] Mobile-responsive design
- [ ] Viral time-lapse feature
- [ ] Zero-friction onboarding