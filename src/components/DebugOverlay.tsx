import React from 'react';

interface DebugMessage {
  text: string;
  timestamp: number;
}

interface DebugOverlayProps {
  messages: DebugMessage[];
  visible?: boolean;
}

const MAX_MESSAGES = 100;

export const DebugOverlay: React.FC<DebugOverlayProps> = ({ messages, visible = true }) => {
  if (!visible) return null;

  return (
    <div className="fixed top-20 right-4 bg-surface/95 backdrop-blur rounded-lg p-4 w-96 max-h-[80vh] overflow-y-auto shadow-xl border-2 border-primary/20 pointer-events-auto">
      <div className="flex justify-between items-center mb-2 pb-2 border-b border-border">
        <h3 className="font-semibold text-primary">Debug Log</h3>
        <div className="flex gap-2 text-xs text-text-secondary">
          <span>{messages.length} events</span>
          <button 
            onClick={() => console.clear()} 
            className="px-2 py-1 bg-surface-hover rounded hover:bg-primary/20 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
      <div className="space-y-1.5 font-mono text-sm leading-relaxed">
        {messages.slice(-MAX_MESSAGES).map((msg, i) => (
          <div 
            key={`${msg.timestamp}-${i}`} 
            className={`py-1.5 px-2 rounded bg-surface/50 text-text-primary whitespace-pre-wrap break-all hover:bg-surface-hover transition-colors ${
              msg.text.includes('❌') ? 'text-red-500' :
              msg.text.includes('⚠️') ? 'text-yellow-500' :
              msg.text.includes('✅') ? 'text-emerald-500' :
              msg.text.includes('📍') ? 'text-blue-500' :
              msg.text.includes('🎯') ? 'text-purple-500' :
              msg.text.includes('🖱️') ? 'text-indigo-500' :
              msg.text.includes('🎮') ? 'text-cyan-500' :
              ''
            }`}
          >
            <span className="text-text-secondary text-xs mr-2 opacity-75">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </span>
            {msg.text}
          </div>
        ))}
      </div>
    </div>
  );
};