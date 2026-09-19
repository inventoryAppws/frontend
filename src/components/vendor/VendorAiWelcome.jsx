import React from 'react';
import {
  Sparkles,
  TrendingUp,
  Package,
  AlertTriangle,
  Clock,
  CheckCircle2,
  DollarSign,
  FileText,
  Truck,
  RotateCcw,
  Landmark,
  Bot
} from 'lucide-react';
import { getVendorPageContext } from '../../utils/vendorPageContext';

const CORE_CAPABILITIES = [
  {
    id: 'sales-trend',
    title: '30-Day Sales Velocity',
    query: 'Analyze my sales and revenue trends over the last 30 days',
    icon: TrendingUp,
    color: '#4f46e5',
    bg: '#eef2ff'
  },
  {
    id: 'inventory-health',
    title: 'Low Stock & Restock Alert',
    query: 'Check my inventory stock health and flag critical stockout risks',
    icon: Package,
    color: '#059669',
    bg: '#ecfdf5'
  },
  {
    id: 'dead-stock',
    title: 'Dead Stock Liquidation',
    query: 'Identify slow-moving and dead stock items and calculate my locked capital',
    icon: AlertTriangle,
    color: '#d97706',
    bg: '#fffbeb'
  },
  {
    id: 'pricing-insights',
    title: 'Margin & Pricing Audit',
    query: 'Compare my product prices against category benchmarks and suggest margin improvements',
    icon: DollarSign,
    color: '#7c3aed',
    bg: '#f5f3ff'
  },
  {
    id: 'best-sellers',
    title: 'Top Selling Products',
    query: 'What are my top selling and highest revenue generating products this month?',
    icon: Sparkles,
    color: '#0284c7',
    bg: '#f0f9ff'
  },
  {
    id: 'copywriter',
    title: 'AI Product Copywriter',
    query: 'Help me write an SEO-optimized product title, description, and key features',
    icon: FileText,
    color: '#e11d48',
    bg: '#ffe4e6'
  }
];

export default function VendorAiWelcome({ onSelectPrompt }) {
  const pageContext = getVendorPageContext(window.location.pathname);

  return (
    <div className="vendor-ai-welcome-view">
      {/* 1. HERO BANNER */}
      <div className="vendor-ai-welcome-hero">
        <div className="vendor-ai-hero-avatar">
          <img
            src="/atlas-mascot.png"
            alt="Atlas AI Mascot"
            className="vendor-ai-hero-mascot-img"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <span className="vendor-ai-hero-pulse-dot" />
        </div>
        <div className="vendor-ai-hero-text">
          <span className="vendor-ai-hero-tag">Atlas Business Copilot</span>
          <h2>Welcome to Atlas AI</h2>
          <p>
            Your intelligent merchant partner. Query real-time sales data, forecast inventory demand, optimize pricing, and liquidate dead stock.
          </p>
        </div>
      </div>

      {/* 2. CONTEXTUAL DECISIONS BASED ON CURRENT SCREEN */}
      {pageContext && Array.isArray(pageContext.decisions) && pageContext.decisions.length > 0 && (
        <div className="vendor-ai-welcome-section vendor-context-section">
          <div className="vendor-context-header">
            <div className="vendor-context-tag">
              <span className="vendor-context-dot" />
              <span>📍 {pageContext.pageTitle}</span>
            </div>
            <span className="vendor-section-label">Suggested Decisions for this Screen</span>
          </div>

          <div className="vendor-context-decisions-grid">
            {pageContext.decisions.map((dec) => (
              <button
                key={dec.id}
                type="button"
                className="vendor-decision-card"
                onClick={() => onSelectPrompt && onSelectPrompt(dec.query)}
              >
                <div className="vendor-decision-content">
                  <strong>{dec.title}</strong>
                  <p>{dec.desc}</p>
                </div>
                <div className="vendor-decision-arrow">
                  <Sparkles size={14} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. CORE BUSINESS CAPABILITIES */}
      <div className="vendor-ai-welcome-section">
        <span className="vendor-section-label">Core Business Intelligence</span>
        <div className="vendor-capabilities-grid">
          {CORE_CAPABILITIES.map((cap) => {
            const Icon = cap.icon;
            return (
              <button
                key={cap.id}
                type="button"
                className="vendor-capability-card"
                onClick={() => onSelectPrompt && onSelectPrompt(cap.query)}
              >
                <div
                  className="vendor-capability-icon"
                  style={{ background: cap.bg, color: cap.color }}
                >
                  <Icon size={18} />
                </div>
                <div className="vendor-capability-info">
                  <strong>{cap.title}</strong>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
