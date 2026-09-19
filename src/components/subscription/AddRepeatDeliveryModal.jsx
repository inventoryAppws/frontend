import React, { useState } from 'react';
import { Calendar, Repeat, ShieldCheck, Check, Clock, Bell, X } from 'lucide-react';
import { API_BASE_URL } from '../../services/api';
import './AddRepeatDeliveryModal.css';

export default function AddRepeatDeliveryModal({ isOpen, onClose, product, onSuccess }) {
  const [frequencyDays, setFrequencyDays] = useState(30);
  const [customDays, setCustomDays] = useState(45);
  const [isCustom, setIsCustom] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [remindDaysBefore, setRemindDaysBefore] = useState(3);
  const [enableReminder, setEnableReminder] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !product) return null;

  const actualDays = isCustom ? (Number(customDays) || 30) : frequencyDays;
  const productId = product._id || product.id;

  // Calculate next delivery date
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + actualDays);
  const formattedNextDate = nextDate.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const discountedPrice = Math.round((product.price || 500) * 0.9); // 10% subscription discount

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('customerToken') || '';
      let customerId = localStorage.getItem('customerId');
      if (!customerId) {
        try {
          const storedUser = JSON.parse(localStorage.getItem('user') || localStorage.getItem('customer') || '{}');
          customerId = storedUser._id || storedUser.id || storedUser.customerId;
        } catch {}
      }

      const res = await fetch(`${API_BASE_URL}/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          productId,
          customerId: customerId || undefined,
          quantity,
          frequencyDays: actualDays,
          remindDaysBefore: enableReminder ? remindDaysBefore : 0
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.msg || 'Failed to create repeat delivery subscription.');
      }

      const createdSub = await res.json().catch(() => null);
      if (onSuccess) onSuccess(createdSub);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rep-modal-overlay" onClick={onClose}>
      <div className="rep-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="rep-modal-header">
          <div className="rep-header-title-wrap">
            <span className="rep-badge">🔄 Smart Reorder &amp; Subscription</span>
            <h3 className="rep-modal-title">Schedule Repeat Delivery</h3>
            <p className="rep-modal-subtitle">Never run out of your everyday essentials</p>
          </div>
          <button className="rep-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Product Snippet */}
        <div className="rep-product-card">
          <img
            src={product.image || (product.images && product.images[0]) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120'}
            alt={product.name}
            className="rep-thumb"
          />
          <div className="rep-product-info">
            <h4 className="rep-prod-name">{product.name}</h4>
            <div className="rep-pricing-line">
              <span className="rep-sub-price">₹{discountedPrice.toLocaleString('en-IN')}</span>
              <span className="rep-original-price">₹{Number(product.price).toLocaleString('en-IN')}</span>
              <span className="rep-discount-pill">10% OFF Every Cycle</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="rep-form">
          {/* Frequency selector */}
          <div className="rep-form-group">
            <label className="rep-field-label">
              <Repeat size={16} /> Choose Delivery Frequency
            </label>
            <div className="rep-freq-grid">
              {[
                { label: 'Every 7 Days', sub: 'Weekly', days: 7 },
                { label: 'Every 15 Days', sub: 'Bi-weekly', days: 15 },
                { label: 'Every 30 Days', sub: 'Monthly (Popular)', days: 30 },
                { label: 'Every 60 Days', sub: 'Bi-monthly', days: 60 }
              ].map((f) => (
                <button
                  type="button"
                  key={f.days}
                  className={`rep-freq-card ${!isCustom && frequencyDays === f.days ? 'selected' : ''}`}
                  onClick={() => {
                    setIsCustom(false);
                    setFrequencyDays(f.days);
                  }}
                >
                  <span className="rep-freq-main">{f.label}</span>
                  <span className="rep-freq-sub">{f.sub}</span>
                </button>
              ))}

              <button
                type="button"
                className={`rep-freq-card ${isCustom ? 'selected' : ''}`}
                onClick={() => setIsCustom(true)}
              >
                <span className="rep-freq-main">Custom Days</span>
                <span className="rep-freq-sub">Set your cycle</span>
              </button>
            </div>

            {isCustom && (
              <div className="rep-custom-input-row">
                <span>Deliver every</span>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  className="rep-custom-number-input"
                />
                <span>days</span>
              </div>
            )}
          </div>

          {/* Quantity & Next Delivery Date Preview */}
          <div className="rep-meta-row">
            <div className="rep-qty-block">
              <label className="rep-field-label">Quantity per delivery</label>
              <div className="rep-qty-controls">
                <button
                  type="button"
                  className="rep-qty-btn"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </button>
                <span className="rep-qty-val">{quantity}</span>
                <button
                  type="button"
                  className="rep-qty-btn"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </button>
              </div>
            </div>

            <div className="rep-next-preview">
              <div className="rep-next-label">First automated delivery:</div>
              <div className="rep-next-val">
                <Calendar size={15} />
                <strong>{formattedNextDate}</strong>
              </div>
            </div>
          </div>

          {/* Restock Reminders */}
          <div className="rep-reminder-box">
            <label className="rep-checkbox-wrap">
              <input
                type="checkbox"
                checked={enableReminder}
                onChange={(e) => setEnableReminder(e.target.checked)}
              />
              <div className="rep-remind-text">
                <div className="rep-remind-title">
                  <Bell size={14} /> Send restock reminder before dispatch
                </div>
                <div className="rep-remind-sub">
                  We'll alert you 3 days prior so you can skip or modify your items anytime.
                </div>
              </div>
            </label>
          </div>

          {/* Perks */}
          <div className="rep-perks-list">
            <div className="rep-perk"><Check size={14} className="text-emerald" /> Free standard delivery on all cycles</div>
            <div className="rep-perk"><Check size={14} className="text-emerald" /> Pause, skip, or cancel anytime with 1 click</div>
            <div className="rep-perk"><Check size={14} className="text-emerald" /> Locked-in subscription savings</div>
          </div>

          {error && <div className="rep-error-msg">{error}</div>}

          {/* Submit Action */}
          <div className="rep-actions">
            <button type="button" className="rep-cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="rep-submit-btn" disabled={submitting}>
              {submitting ? 'Setting up...' : `Start Repeat Delivery (₹${(discountedPrice * quantity).toLocaleString('en-IN')})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

