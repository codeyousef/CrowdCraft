import { create } from 'zustand';
import { Block, BlockType, Point } from '../types/game';

interface GameState {
  blocks: Map<string, Block>;
  currentTool: BlockType;
  userName: string;
  activeUsers: Set<string>;
  worldTimer: number;
  placeBlock: (x: number, y: number) => void;
  setCurrentTool: (tool: BlockType) => void;
}

const generateAnimalName = () => {
  const adjectives = ['Creative', 'Building', 'Playful', 'Curious', 'Friendly'];
  const animals = ['Fox', 'Penguin', 'Beaver', 'Rabbit', 'Owl'];
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${animals[Math.floor(Math.random() * animals.length)]}`;
};

export const useGameStore = create<GameState>((set, get) => ({
  blocks: new Map(),
  currentTool: 'grass',
  userName: generateAnimalName(),
  activeUsers: new Set(),
  worldTimer: 1800, // 30 minutes

  placeBlock: (x: number, y: number) => {
    const key = `${x},${y}`;
    const { currentTool, userName, blocks } = get();
    
    set({
      blocks: new Map(blocks).set(key, {
        type: currentTool,
        placedBy: userName,
        placedAt: Date.now()
      })
    });
  },

  setCurrentTool: (tool: BlockType) => set({ currentTool: tool })
}));