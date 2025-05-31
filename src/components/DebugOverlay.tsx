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
    <div className="fixed bottom-24 left-4 bg-surface/90 backdrop-blur rounded-lg p-4 max-w-md max-h-48 overflow-y-auto">
      <div className="space-y-1 font-mono text-sm">
        {messages.map((msg, i) => (
          <div key={`${msg.timestamp}-${i}`} className="text-text-primary">
            {msg.text}
          </div>
        ))}
      </div>
    </div>
  );
};