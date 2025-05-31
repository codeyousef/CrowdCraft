import React from 'react';

interface DebugMessage {
  text: string;
  timestamp: number;
}

interface DebugOverlayProps {
  messages: DebugMessage[];
}

export const DebugOverlay: React.FC<DebugOverlayProps> = ({ messages }) => {
  return (
    <div className="fixed bottom-24 left-4 bg-surface/90 backdrop-blur rounded-lg p-4 w-96 max-h-96 overflow-y-auto shadow-lg border border-border z-50">
      <div className="flex justify-between items-center mb-2 pb-2 border-b border-border">
        <h3 className="font-semibold">Debug Log</h3>
        <div className="text-xs text-text-secondary">
          {messages.length} events
        </div>
      </div>
      <div className="space-y-1 font-mono text-sm">
        {messages.map((msg, i) => (
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