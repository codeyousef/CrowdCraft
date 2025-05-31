import React from 'react';

interface DebugMessage {
  text: string;
  timestamp: number;
}

interface DebugOverlayProps {
  messages: DebugMessage[];
}

const MAX_MESSAGES = 100;

export const DebugOverlay: React.FC<DebugOverlayProps> = ({ messages }) => {
  return (
    <div className="fixed top-20 right-4 bg-surface/90 backdrop-blur rounded-lg p-4 w-96 max-h-[500px] overflow-y-auto shadow-lg border border-border z-50">
      <div className="flex justify-between items-center mb-2 pb-2 border-b border-border">
        <h3 className="font-semibold">Debug Log</h3>
        <div className="flex gap-2 text-xs text-text-secondary">
          <span>{messages.length} events</span>
          <button 
            onClick={() => console.clear()} 
            className="px-2 py-1 bg-surface-hover rounded hover:bg-primary transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
      <div className="space-y-1 font-mono text-xs">
        {messages.slice(-MAX_MESSAGES).map((msg, i) => (
          <div 
            key={`${msg.timestamp}-${i}`} 
            className={`text-text-primary whitespace-pre-wrap break-all ${
              msg.text.includes('❌') ? 'text-red-500' :
              msg.text.includes('⚠️') ? 'text-yellow-500' :
              msg.text.includes('✅') ? 'text-green-500' :
              msg.text.includes('📍') ? 'text-blue-500' :
              msg.text.includes('🎯') ? 'text-purple-500' :
              ''
            }`}
          >
            <span className="text-text-secondary text-xs mr-2">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </span>
            {msg.text}
          </div>
        ))}
      </div>
    </div>
  );
};