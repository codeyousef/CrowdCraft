import React from 'react';
import { IsometricGrid } from './components/IsometricGrid';
import { BlockSelector } from './components/BlockSelector';
import { useCurrentWorld } from './hooks/useCurrentWorld';

function App() {
  useCurrentWorld();

  return (
    <div className="h-screen w-screen overflow-hidden bg-background text-text-primary">
      <IsometricGrid />
      <BlockSelector />
    </div>
  );
}

export default App;