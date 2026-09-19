import { useState } from 'react';
import { Sparkles, Bot } from 'lucide-react';

export default function DarwinFab({ onClick, isOpen = false }) {
  const [imgError, setImgError] = useState(false);

  if (isOpen) return null;

  return (
    <button
      type="button"
      className="darwin-fab-btn"
      onClick={onClick}
      aria-label="Open Darwin AI Shopping Assistant"
      title="Ask Darwin AI"
    >
      <div className="darwin-fab-icon-wrap">
        {!imgError ? (
          <img
            src="/darwin-mascot.png"
            alt=""
            className="darwin-fab-avatar"
            onError={() => setImgError(true)}
          />
        ) : (
          <Bot size={22} className="darwin-fab-fallback-icon" />
        )}
        <span className="darwin-fab-status-dot" />
      </div>

      <div className="darwin-fab-label-area">
        <span className="darwin-fab-sparkle">
          <Sparkles size={15} />
        </span>
        <span className="darwin-fab-text">
          <span className="darwin-fab-ask">Ask</span>{' '}
          <span className="darwin-fab-name">Darwin</span>
        </span>
      </div>
    </button>
  );
}
