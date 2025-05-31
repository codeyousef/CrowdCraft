import React from 'react';
import { IsometricGrid } from './components/IsometricGrid';
import { BlockSelector } from './components/BlockSelector';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useCurrentWorld } from './hooks/useCurrentWorld';

function App() {
  useCurrentWorld();

  return (
    <ErrorBoundary>
      <div className="h-screen w-screen overflow-hidden bg-background text-text-primary">
        <IsometricGrid />
        <BlockSelector />
      </div>
    </ErrorBoundary>
  );
}

export default App;