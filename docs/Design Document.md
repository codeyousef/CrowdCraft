# CrowdCraft Design Document

**Version 1.0 - May 31, 2025**

## Visual Design System

### Color Palette

```css
/* Primary Colors */
--primary: #6366F1;      /* Indigo - Main CTAs */
--primary-hover: #4F46E5;
--secondary: #8B5CF6;    /* Purple - Highlights */
--secondary-hover: #7C3AED;

/* UI Colors */
--background: #0F172A;   /* Dark slate - Main bg */
--surface: #1E293B;      /* Lighter slate - Cards */
--surface-hover: #334155;
--border: #334155;       /* Borders */
--text-primary: #F8FAFC;
--text-secondary: #CBD5E1;

/* Block Colors */
--grass: #10B981;
--water: #06B6D4;
--stone: #6B7280;
--wood: #92400E;
--house: #DC2626;
--tree: #059669;

/* Status Colors */
--success: #10B981;
--warning: #F59E0B;
--error: #EF4444;
--info: #3B82F6;
```

### Typography

```css
/* Font Stack */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Type Scale */
--text-xs: 0.75rem;     /* 12px */
--text-sm: 0.875rem;    /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg: 1.125rem;    /* 18px */
--text-xl: 1.25rem;     /* 20px */
--text-2xl: 1.5rem;     /* 24px */
--text-3xl: 1.875rem;   /* 30px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

## Layout Architecture

### Desktop Layout (1920x1080)

```
┌─────────────────────────────────────────────────────────┐
│  Header (72px)                                          │
│  ┌─────────────┬──────────────────┬─────────────────┐  │
│  │ Logo + Name │ Timer + Progress  │ Users + Actions │  │
│  └─────────────┴──────────────────┴─────────────────┘  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Main Canvas (100vh - 72px - 80px)                    │
│  ┌─────────────────────────────────────────────────┐  │
│  │                                                 │  │
│  │           Isometric Grid View                   │  │
│  │           (Centered, with pan/zoom)             │  │
│  │                                                 │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  Block Selector (80px)                                  │
│  ┌───┬───┬───┬───┬───┬───┬──────────────────────┐    │
│  │ 🌱│ 🌊│ 🪨│ 🪵│ 🏠│ 🌳│  Stats + Share     │    │
│  └───┴───┴───┴───┴───┴───┴──────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Mobile Layout (390x844 - iPhone 14)

```
┌─────────────────────────┐
│ Header (60px)           │
│ ┌─────┬────────┬──────┐ │
│ │Logo │ Timer  │ 👥 23│ │
│ └─────┴────────┴──────┘ │
├─────────────────────────┤
│                         │
│  Canvas                 │
│  (100vh - 60px - 70px) │
│                         │
├─────────────────────────┤
│ Blocks (70px)           │
│ ┌──┬──┬──┬──┬──┬──┐   │
│ │🌱│🌊│🪨│🪵│🏠│🌳│   │
│ └──┴──┴──┴──┴──┴──┘   │
└─────────────────────────┘
```

## Isometric Grid Specifications

### Tile Dimensions

```javascript
const TILE_CONFIG = {
  width: 64,        // Base tile width
  height: 32,       // Base tile height
  depth: 16,        // Visual depth for 3D effect
  
  // Mobile scaling
  mobile: {
    width: 48,
    height: 24,
    depth: 12
  }
};

// Coordinate conversion
const cartesianToIsometric = (x, y) => ({
  isoX: (x - y) * (TILE_CONFIG.width / 2),
  isoY: (x + y) * (TILE_CONFIG.height / 2)
});
```

### Visual Hierarchy

```
1. Active tile (hover): Bright outline + 10% scale
2. Recent placements: Particle effect + fade
3. Grid lines: 20% opacity white
4. Empty tiles: Subtle checker pattern
```

## Component Design

### Header Component

```jsx
<header className="bg-surface/80 backdrop-blur-lg border-b border-border">
  <div className="flex items-center justify-between px-6 py-4">
    <Logo />
    <Timer />
    <UserCount />
  </div>
</header>
```

### Block Selector

```jsx
<div className="bg-surface/90 backdrop-blur border-t border-border">
  <div className="flex items-center justify-center gap-2 p-4">
    {blocks.map(block => (
      <BlockButton 
        key={block.type}
        emoji={block.emoji}
        active={currentBlock === block.type}
        onClick={() => setCurrentBlock(block.type)}
      />
    ))}
  </div>
</div>
```

### Timer Display

```
┌─────────────────────┐
│ ⏱️ 24:35 remaining  │
│ ▓▓▓▓▓▓▓▓░░░░░░░░░ │
└─────────────────────┘
```

## Animation Specifications

### Block Placement

```css
@keyframes blockPlace {
  0% { transform: scale(0) translateY(-20px); opacity: 0; }
  50% { transform: scale(1.2) translateY(-10px); opacity: 1; }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}
/* Duration: 300ms, Easing: cubic-bezier(0.34, 1.56, 0.64, 1) */
```

### Hover Effects

- Scale: 1.1x
- Brightness: 120%
- Shadow: 0 4px 12px rgba(99, 102, 241, 0.3)
- Transition: 150ms ease-out

### World Reset Warning

- T-60s: Subtle red border pulse
- T-30s: Timer turns orange, shake animation
- T-10s: Full screen countdown overlay

## Responsive Breakpoints

```css
/* Mobile: 0-639px */
/* Tablet: 640px-1023px */
/* Desktop: 1024px+ */
/* Wide: 1920px+ */
```

## Icon System

Using emoji for universal recognition:

- 🌱 Grass - Nature, growth
- 🌊 Water - Flow, life
- 🪨 Stone - Strength, foundation
- 🪵 Wood - Building, craft
- 🏠 House - Community, home
- 🌳 Tree - Environment, height

## Loading States

```
Initial: Animated grid construction
Placing: Ghost block at cursor
Saving: Pulse on placed block
Error: Red shake animation
```

## Accessibility Features

- Focus indicators: 2px solid outline
- Keyboard shortcuts: 1-6 for blocks
- High contrast toggle
- Reduced motion option
- ARIA live regions for updates