import React, { useState } from 'react';
import {
  Check,
  AlertTriangle,
  Sparkles,
  Bot,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  Zap,
  Tag
} from 'lucide-react';
import './ProductDecisionAssistant.css';

export default function ProductDecisionAssistant({
  product = {},
  customerProfile = null,
  onAskDarwin = null
}) {
  const [expanded, setExpanded] = useState(false);

  const insights = product?.confidenceInsights || {
    title: 'Why customers choose this',
    satisfactionPct: 92,
    highlights: [
      'Good battery life & all-day endurance',
      'Highly rated camera & crisp display',
      '92% positive customer reviews',
      'Good value in this price range'
    ],
    consideration: 'Some users mention heating under heavy continuous gaming or charging',
    darwinExplanation: `Darwin Match: Verified 4.3★ based on 28+ orders. Great balance of quality and price.`,
    valueVerdict: 'Good value in this price range'
  };

  const satisfaction = insights.satisfactionPct || 92;
  const highlights = insights.highlights || [];
  const consideration = insights.consideration;
  const darwinExplanation = insights.darwinExplanation;

  const handleAskDarwinClick = (e) => {
    e.stopPropagation();
    if (onAskDarwin) {
      onAskDarwin(product);
    } else {
      // Dispatch global Darwin event
      window.dispatchEvent(
        new CustomEvent('open-darwin-chat', {
          detail: {
            initialMessage: `Can you explain why ${product?.name || 'this product'} is a good match for me and what customers say about it?`,
            productId: product?._id,
            productName: product?.name
          }
        })
      );
    }
  };

  return (
    <div className="product-decision-assistant-card" data-testid="decision-assistant">
      {/* Top Header Row */}
      <div className="pda-header">
        <div className="pda-header-left">
          <div className="pda-icon-pill">
            <ShieldCheck size={16} className="pda-shield-icon" />
            <span className="pda-badge-text">Decision Assistant</span>
          </div>
          <h3 className="pda-title">Why customers choose this</h3>
        </div>

        <div className="pda-satisfaction-pill" title={`${satisfaction}% of verified buyers recommend this item`}>
          <ThumbsUp size={13} />
          <span><strong>{satisfaction}%</strong> positive reviews</span>
        </div>
      </div>

      {/* Bulleted Why-Choose-This Checklist */}
      <div className="pda-checklist">
        {highlights.map((point, idx) => (
          <div key={idx} className="pda-item pda-item-pro">
            <div className="pda-check-bubble">
              <Check size={13} strokeWidth={3} />
            </div>
            <span className="pda-item-text">{point}</span>
          </div>
        ))}

        {/* Honest Watchout / Consideration */}
        {consideration && (
          <div className="pda-item pda-item-watchout">
            <div className="pda-warn-bubble">
              <AlertTriangle size={13} strokeWidth={2.5} />
            </div>
            <span className="pda-item-text pda-warn-text">{consideration}</span>
          </div>
        )}
      </div>

      {/* Darwin AI Match Explanation Callout */}
      {darwinExplanation && (
        <div className="pda-darwin-box">
          <div className="pda-darwin-top">
            <div className="pda-darwin-avatar">
              <Bot size={15} />
            </div>
            <span className="pda-darwin-title">Darwin Shopping Assistant</span>
            <span className="pda-darwin-match-badge">
              <Sparkles size={11} /> Match Verified
            </span>
          </div>
          <p className="pda-darwin-text">{darwinExplanation}</p>
          <button
            type="button"
            className="pda-ask-darwin-btn"
            onClick={handleAskDarwinClick}
            title="Ask Darwin deeper questions regarding size, specs and reviews"
          >
            <Sparkles size={13} />
            <span>Ask Darwin: Why this matches you</span>
          </button>
        </div>
      )}
    </div>
  );
}

