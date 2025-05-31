import React from 'react';
import { IsometricGrid } from './components/IsometricGrid';
import { BlockSelector } from './components/BlockSelector';
import { ErrorBoundary } from './components/ErrorBoundary';
import { WorldTimer } from './components/WorldTimer';
import { DebugOverlay } from './components/DebugOverlay';
import { useCurrentWorld } from './hooks/useCurrentWorld';
import { useState, useEffect } from 'react';

interface DebugMessage {
  text: string;
  timestamp: number;
}

function App() {
  useCurrentWorld();
  const [debugMessages, setDebugMessages] = useState<DebugMessage[]>([]);

  useEffect(() => {
    const originalConsoleLog = console.log;
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;

    function addMessage(text: string) {
      setDebugMessages(prev => [...prev.slice(-50), { text, timestamp: Date.now() }]);
    }

    console.log = (...args) => {
      originalConsoleLog.apply(console, args);
      addMessage(args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' '));
    };

    console.warn = (...args) => {
      originalConsoleWarn.apply(console, args);
      addMessage(`⚠️ ${args.join(' ')}`);
    };

    console.error = (...args) => {
      originalConsoleError.apply(console, args);
      addMessage(`🔴 ${args.join(' ')}`);
    };

    return () => {
      console.log = originalConsoleLog;
      console.warn = originalConsoleWarn;
      console.error = originalConsoleError;
    };
  }, []);

  return (
    <ErrorBoundary>
      <div className="h-screen w-screen overflow-hidden bg-background text-text-primary">
        <WorldTimer />
        <IsometricGrid />
        <BlockSelector />
        <DebugOverlay messages={debugMessages} />
      </div>
    </ErrorBoundary>
  );
}

export default App;