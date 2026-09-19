import { useState } from 'react';
import {
  Tag,
  Columns,
  Gift,
  Truck,
  Percent,
  Sparkles,
  ShoppingCart,
  RotateCcw,
  Bot,
  FileText,
  CreditCard,
  User,
  MapPin,
  Wallet,
  Settings,
  Bell,
  LifeBuoy
} from 'lucide-react';

const USE_CASES = [
  { id: 'trending', title: 'Trending products', query: 'Show trending products', icon: Sparkles, color: '#2563eb', bg: '#eff6ff' },
  { id: 'orders', title: 'Last orders', query: 'Show last orders', icon: Truck, color: '#059669', bg: '#ecfdf5' },
  { id: 'bills', title: 'This month bills', query: 'Show this month bills', icon: FileText, color: '#4f46e5', bg: '#eef2ff' },
  { id: 'payments', title: 'Txn payments', query: 'Show txn payments', icon: CreditCard, color: '#0284c7', bg: '#f0f9ff' },
  { id: 'details', title: 'My details', query: 'Show my details', icon: User, color: '#7c3aed', bg: '#f5f3ff' },
  { id: 'recomms', title: 'Recommended products', query: 'Show recommended products', icon: Sparkles, color: '#d97706', bg: '#fffbeb' },
  { id: 'deals', title: 'Hot deals', query: 'Show hot deals', icon: Percent, color: '#ea580c', bg: '#fff7ed' },
  { id: 'discounts', title: 'Big discounts', query: 'Show big discounts', icon: Tag, color: '#e11d48', bg: '#ffe4e6' },
  { id: 'address', title: 'Add address', query: 'Add address', icon: MapPin, color: '#0d9488', bg: '#ccfbf1' },
  { id: 'methods', title: 'Payment methods', query: 'Show payment methods', icon: Wallet, color: '#16a34a', bg: '#dcfce7' },
  { id: 'settings', title: 'Change settings', query: 'Change settings', icon: Settings, color: '#475569', bg: '#f1f5f9' },
  { id: 'notifs', title: 'Recent notifications', query: 'Show recent notifications', icon: Bell, color: '#ca8a04', bg: '#fef9c3' },
  { id: 'ticket', title: 'Create a ticket', query: 'Create a ticket', icon: LifeBuoy, color: '#9333ea', bg: '#faf5ff' }
];

const QUICK_PROMPTS = [
  'Trending products',
  'Last orders',
  'Hot deals',
  'This month bills',
  'Change settings'
];

import { getCustomerPageContext } from '../../utils/customerPageContext';

export default function DarwinWelcome({ onSelectPrompt }) {
  const [imgError, setImgError] = useState(false);
  const pageContext = getCustomerPageContext(window.location.pathname);

  return (
    <div className="darwin-welcome-view">
      {/* 3D Mascot Hero Card */}
      <div className="darwin-welcome-hero-card">
        <div className="darwin-hero-avatar-wrap">
          {!imgError ? (
            <img
              src="/darwin-mascot.png"
              alt="Darwin Avatar"
              className="darwin-hero-mascot-img"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="darwin-hero-fallback-icon">
              <Bot size={40} />
            </div>
          )}
        </div>

        <div className="darwin-hero-content">
          <span className="darwin-hero-eyebrow">Meet Darwin</span>
          <h2 className="darwin-hero-title">Hi there! 👋</h2>
          <p className="darwin-hero-subtitle">
            I'm your AI Shopping Companion. Tell me what you need, and I'll find, compare, and help you order.
          </p>
        </div>
      </div>

      {/* Page Contextual Decisions Banner & Cards */}
      {pageContext && Array.isArray(pageContext.decisions) && pageContext.decisions.length > 0 && (
        <div className="darwin-welcome-section darwin-context-section">
          <div className="darwin-context-header">
            <span className="darwin-context-badge">📍 {pageContext.pageTitle}</span>
            <span className="darwin-section-label">Suggested Decisions</span>
          </div>
          <div className="darwin-context-decisions-grid">
            {pageContext.decisions.map((dec) => (
              <button
                key={dec.id}
                type="button"
                className="darwin-decision-card"
                onClick={() => onSelectPrompt && onSelectPrompt(dec.query)}
              >
                <div className="darwin-decision-text">
                  <strong>{dec.title}</strong>
                  <p>{dec.desc}</p>
                </div>
                <Sparkles size={14} className="darwin-decision-sparkle" />
              </button>
            ))}
          </div>
        </div>
      )}
      {/* Quick Suggestion Pills */}
      <div className="darwin-welcome-section">
        <span className="darwin-section-label">Popular Searches</span>
        <div className="darwin-quick-pills-row">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="darwin-quick-prompt-pill"
              onClick={() => onSelectPrompt && onSelectPrompt(prompt)}
            >
              <span>{prompt}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 8-Card Use Cases Grid (Screen 10) */}
      <div className="darwin-welcome-section">
        <span className="darwin-section-label">You can ask me for:</span>
        <div className="darwin-usecases-grid">
          {USE_CASES.map((uc) => {
            const IconComponent = uc.icon;
            return (
              <button
                key={uc.id}
                type="button"
                className="darwin-usecase-card"
                onClick={() => onSelectPrompt && onSelectPrompt(uc.query)}
              >
                <div className="darwin-usecase-icon-box" style={{ background: uc.bg, color: uc.color }}>
                  <IconComponent size={18} />
                </div>
                <span className="darwin-usecase-title">{uc.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

