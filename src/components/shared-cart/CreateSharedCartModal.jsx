import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Copy, Check, Share2, X, Sparkles, ChevronDown } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../Toast';
import './CreateSharedCartModal.css';

export default function CreateSharedCartModal({ isOpen, onClose, onCreated }) {
  const navigate = useNavigate();
  const { user } = useAuth() || {};
  const currentUserName = user?.name || localStorage.getItem('customer_name') || 'You';

  const [cartName, setCartName] = useState('Trip to Goa 🏖️');
  const [selectedTemplate, setSelectedTemplate] = useState('Trip');
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdCart, setCreatedCart] = useState(null);
  const [memberAccess, setMemberAccess] = useState('full');
  const [isPermDropdownOpen, setIsPermDropdownOpen] = useState(false);
  const [targetBudget, setTargetBudget] = useState('');

  if (!isOpen) return null;

  const permissionOptions = [
    { id: 'full', label: 'Can add items & vote (Open)', desc: 'Everyone can add items, vote, and chat' },
    { id: 'vote_only', label: 'Can only vote & comment', desc: 'Members vote & chat; only creator adds items' },
    { id: 'admin_only', label: 'Admin only (View only for others)', desc: 'View-only for members; admin manages items' }
  ];

  const templates = [
    { id: 'Trip', label: 'Trip / Vacation', emoji: '🏖️', defName: 'Trip to Goa 🏖️' },
    { id: 'Party', label: 'Party & Celebration', emoji: '🎉', defName: 'Birthday Bash 🎉' },
    { id: 'Home', label: 'Home Setup', emoji: '🏡', defName: 'New Apartment Setup 🏡' },
    { id: 'Wedding', label: 'Wedding / Festive', emoji: '💍', defName: 'Wedding Wardrobe 💍' },
    { id: 'Custom', label: 'Custom Group', emoji: '🛍️', defName: 'Family Shopping 🛍️' }
  ];

  const handleTemplateSelect = (t) => {
    setSelectedTemplate(t.id);
    setCartName(t.defName);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!cartName.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post('/shared-cart', {
        name: cartName.trim(),
        template: selectedTemplate.toLowerCase(),
        creatorName: currentUserName,
        targetBudget: targetBudget ? Number(targetBudget) : undefined,
        memberAccess
      });

      const cart = res.data;
      setCreatedCart(cart);
      toast.success(`Group cart "${cart.name}" created!`);
      if (onCreated) onCreated(cart);
    } catch (err) {
      console.error(err);
      toast.error('Failed to create shared cart');
    } finally {
      setSubmitting(false);
    }
  };

  const shareCode = createdCart?.shareCode || '';
  const shareUrl = createdCart
    ? `${window.location.origin}/customer/shared-cart?code=${shareCode}`
    : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Invite link copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="sc-modal-overlay" onClick={onClose}>
      <div className="sc-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sc-modal-header">
          <div>
            <span className="sc-badge">🧑🤝🧑 Collaborative Shopping</span>
            <h3 className="sc-modal-title">Create a Shared Cart</h3>
            <p className="sc-modal-sub">Shop together with friends, family, or flatmates in real-time</p>
          </div>
          <button className="sc-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {!createdCart ? (
          <form onSubmit={handleCreate} className="sc-modal-body">
            {/* Template Selection */}
            <div className="sc-field-group">
              <label className="sc-field-label">Choose Occasion Template</label>
              <div className="sc-templates-grid">
                {templates.map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    className={`sc-tpl-btn ${selectedTemplate === t.id ? 'active' : ''}`}
                    onClick={() => handleTemplateSelect(t)}
                  >
                    <span className="sc-tpl-emoji">{t.emoji}</span>
                    <span className="sc-tpl-text">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Cart Name */}
            <div className="sc-field-group">
              <label className="sc-field-label">Group Cart Name</label>
              <input
                type="text"
                className="sc-text-input"
                placeholder="e.g. Goa Trip 🏖️ or Flat Grocery"
                value={cartName}
                onChange={(e) => setCartName(e.target.value)}
                required
              />
            </div>

            {/* Member Permissions & Budget */}
            <div className="sc-fields-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="sc-field-group" style={{ position: 'relative' }}>
                <label className="sc-field-label">Member Permissions</label>
                <button
                  type="button"
                  className="sc-custom-select-trigger"
                  onClick={() => setIsPermDropdownOpen(!isPermDropdownOpen)}
                >
                  <span>{permissionOptions.find((p) => p.id === memberAccess)?.label || 'Can add items & vote (Open)'}</span>
                  <ChevronDown size={14} className={isPermDropdownOpen ? 'rotate-180' : ''} />
                </button>

                {isPermDropdownOpen && (
                  <div className="sc-custom-select-menu">
                    {permissionOptions.map((opt) => (
                      <div
                        key={opt.id}
                        className={`sc-custom-select-item ${memberAccess === opt.id ? 'active' : ''}`}
                        onClick={() => {
                          setMemberAccess(opt.id);
                          setIsPermDropdownOpen(false);
                        }}
                      >
                        <div className="sc-perm-item-content">
                          <span className="sc-perm-title">{opt.label}</span>
                          <span className="sc-perm-desc">{opt.desc}</span>
                        </div>
                        {memberAccess === opt.id && <Check size={14} style={{ color: '#2563eb' }} />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="sc-field-group">
                <label className="sc-field-label">Target Group Budget (Optional)</label>
                <input
                  type="number"
                  placeholder="e.g. 15000"
                  value={targetBudget}
                  onChange={(e) => setTargetBudget(e.target.value)}
                  className="sc-text-input"
                />
              </div>
            </div>

            {/* Features preview */}
            <div className="sc-perks-box">
              <div className="sc-perk-row">✨ <strong>Live Item Voting:</strong> Friends can vote 👍 / 👎 / 🤔 on any item</div>
              <div className="sc-perk-row">💬 <strong>In-Cart Chat:</strong> Discuss sizes, colors, and quantities</div>
              <div className="sc-perk-row">✅ <strong>Checkout Consensus:</strong> Track who is ready to place the order</div>
            </div>

            <div className="sc-modal-actions">
              <button type="button" className="sc-cancel-btn" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="sc-submit-btn" disabled={submitting}>
                {submitting ? 'Creating Cart...' : 'Create Group Cart & Get Link'}
              </button>
            </div>
          </form>
        ) : (
          /* Cart Created Success & Link Sharing */
          <div className="sc-success-body">
            <div className="sc-success-icon">🎉</div>
            <h4 className="sc-success-title">"{createdCart.name}" is Ready!</h4>
            <p className="sc-success-sub">Share this link or code <strong>{shareCode}</strong> with your group:</p>

            <div className="sc-link-box">
              <input type="text" readOnly value={shareUrl} className="sc-link-input" />
              <button type="button" className="sc-copy-btn" onClick={handleCopy}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>

            <div className="sc-share-buttons">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Hey! Join my shared shopping cart for "${createdCart.name}": ${shareUrl}`)}`}
                target="_blank"
                rel="noreferrer"
                className="sc-share-btn whatsapp"
              >
                Share on WhatsApp
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent(`Join Shared Cart: ${createdCart.name}`)}&body=${encodeURIComponent(`Hey! Join our shopping cart here: ${shareUrl}`)}`}
                className="sc-share-btn email"
              >
                Share via Email
              </a>
            </div>

            <button
              type="button"
              className="sc-go-cart-btn"
              onClick={() => {
                onClose();
                navigate(`/customer/shared-cart/${createdCart._id || createdCart.id}`);
              }}
            >
              Open Shared Cart Now &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
