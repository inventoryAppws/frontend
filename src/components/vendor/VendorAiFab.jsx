import { useState } from 'react';
import { Sparkles, Bot } from 'lucide-react';

export default function VendorAiFab({ onClick, isOpen = false }) {
  const [imgError, setImgError] = useState(false);

  if (isOpen) return null;

  return (
    <button
      type="button"
      className="vendor-fab-btn"
      onClick={onClick}
      aria-label="Open Atlas AI Vendor Copilot"
      title="Ask Atlas AI"
    >
      <div className="vendor-fab-icon-wrap">
        {!imgError ? (
          <img
            src="/atlas-mascot.png"
            alt="Atlas AI"
            className="vendor-fab-avatar"
            onError={() => setImgError(true)}
          />
        ) : (
          <Bot size={22} className="vendor-fab-avatar-icon" />
        )}
        <span className="vendor-fab-status-dot" />
      </div>

      <div className="vendor-fab-label-area">
        <span className="vendor-fab-sparkle">
          <Sparkles size={15} />
        </span>
        <span className="vendor-fab-text">
          <span className="vendor-fab-ask">Ask</span>{' '}
          <span className="vendor-fab-name">Atlas</span>
        </span>
      </div>
    </button>
  );
}

