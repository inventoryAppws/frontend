import React from 'react';
import { PackageOpen } from 'lucide-react';

export default function EmptyState({
  icon: Icon = PackageOpen,
  title = 'No Records Found',
  message = 'There are no items matching your criteria at this moment.',
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
  compact = false,
  variant = 'card', // 'card' | 'dashed' | 'plain'
  className = ''
}) {
  return (
    <div className={`app-empty-state variant-${variant} ${compact ? 'compact' : ''} ${className}`}>
      <div className="app-empty-icon-wrap">
        <Icon size={compact ? 28 : 38} />
      </div>
      <h3 className="app-empty-title">{title}</h3>
      {message && <p className="app-empty-desc">{message}</p>}
      {(actionText || secondaryActionText) && (
        <div className="app-empty-actions">
          {actionText && onAction && (
            <button
              type="button"
              className="app-empty-btn-primary"
              onClick={onAction}
            >
              {actionText}
            </button>
          )}
          {secondaryActionText && onSecondaryAction && (
            <button
              type="button"
              className="app-empty-btn-secondary"
              onClick={onSecondaryAction}
            >
              {secondaryActionText}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

