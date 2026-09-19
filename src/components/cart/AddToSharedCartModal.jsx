import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Check, ShoppingBag, X, Sparkles, ArrowRight, Lock } from 'lucide-react';
import api from '../../services/api';
import { toast } from '../Toast';
import { useAuth } from '../../context/AuthContext';
import './AddToSharedCartModal.css';

export default function AddToSharedCartModal({ isOpen, onClose, product }) {
  const navigate = useNavigate();
  const { user } = useAuth() || {};
  const currentUserName = user?.name || localStorage.getItem('customer_name') || 'You';

  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCartId, setSelectedCartId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Quick create inline state
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newCartName, setNewCartName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadMyCarts();
    }
  }, [isOpen]);

  const loadMyCarts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/shared-cart');
      const list = res.data || [];
      setCarts(list);
      if (list.length > 0) {
        setSelectedCartId(list[0]._id || list[0].id);
      } else {
        setIsCreatingNew(true);
      }
    } catch (err) {
      console.error('Failed to load shared carts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndSelect = async (e) => {
    e.preventDefault();
    if (!newCartName.trim()) return;
    setCreating(true);
    try {
      const res = await api.post('/shared-cart', {
        name: newCartName.trim(),
        template: 'general',
        creatorName: currentUserName
      });
      const newCart = res.data;
      setCarts((prev) => [newCart, ...prev]);
      setSelectedCartId(newCart._id || newCart.id);
      setIsCreatingNew(false);
      setNewCartName('');
      toast.success(`Created shared cart "${newCart.name}"!`);
    } catch (err) {
      toast.error('Failed to create shared cart');
    } finally {
      setCreating(false);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedCartId || !product?._id) return;
    setSubmitting(true);
    try {
      await api.post(`/shared-cart/${selectedCartId}/items`, {
        productId: product._id,
        quantity,
        memberName: currentUserName
      });

      // If user provided a recommendation note, send it to group chat as well
      if (comment.trim()) {
        await api.post(`/shared-cart/${selectedCartId}/messages`, {
          text: `Note on ${product.name}: "${comment.trim()}"`,
          memberName: currentUserName,
          productId: product._id
        });
      }

      const targetCart = carts.find((c) => (c._id || c.id) === selectedCartId);
      toast.success(`Added to "${targetCart?.name || 'Shared Cart'}"! Group notified.`);
      onClose();
      navigate(`/customer/shared-cart/${selectedCartId}`);
    } catch (err) {
      toast.error('Failed to add product to shared cart');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="atsc-overlay" onClick={onClose}>
      <div className="atsc-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="atsc-header">
          <div className="atsc-title-wrap">
            <div className="atsc-icon-badge">
              <Users size={18} />
            </div>
            <div>
              <h3 className="atsc-title">Add to Shared Group Cart</h3>
              <p className="atsc-sub">Collaborate, vote, and split checkout with friends &amp; family</p>
            </div>
          </div>
          <button type="button" className="atsc-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Product preview strip */}
        <div className="atsc-product-strip">
          <img
            src={product.image || (product.images && product.images[0]) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
            alt={product.name}
            className="atsc-prod-img"
          />
          <div className="atsc-prod-info">
            <span className="atsc-prod-cat">{product.category || 'General'}</span>
            <h4 className="atsc-prod-name">{product.name}</h4>
            <strong className="atsc-prod-price">₹{Number(product.price || 0).toLocaleString('en-IN')}</strong>
          </div>
        </div>

        {/* Main Body */}
        <div className="atsc-body">
          {loading ? (
            <div className="atsc-loading">
              <div className="atsc-spinner"></div>
              <span>Loading your shared carts...</span>
            </div>
          ) : (
            <>
              {/* Cart Selection */}
              <div className="atsc-section">
                <div className="atsc-section-header">
                  <label className="atsc-label">Select Destination Shared Cart</label>
                  {!isCreatingNew && (
                    <button
                      type="button"
                      className="atsc-new-btn"
                      onClick={() => setIsCreatingNew(true)}
                    >
                      <Plus size={13} /> New Cart
                    </button>
                  )}
                </div>

                {isCreatingNew ? (
                  <form onSubmit={handleCreateAndSelect} className="atsc-create-form">
                    <input
                      type="text"
                      placeholder="e.g. Goa Trip 2026, Wedding Wardrobe, Roommates"
                      value={newCartName}
                      onChange={(e) => setNewCartName(e.target.value)}
                      className="atsc-input"
                      autoFocus
                    />
                    <div className="atsc-create-actions">
                      <button
                        type="button"
                        className="atsc-btn-ghost"
                        onClick={() => {
                          if (carts.length > 0) setIsCreatingNew(false);
                          else onClose();
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="atsc-btn-primary"
                        disabled={creating || !newCartName.trim()}
                      >
                        {creating ? 'Creating...' : 'Create & Select'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="atsc-carts-grid">
                    {carts.map((c) => {
                      const id = c._id || c.id;
                      const isSelected = selectedCartId === id;
                      return (
                        <div
                          key={id}
                          className={`atsc-cart-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => setSelectedCartId(id)}
                        >
                          <div className="atsc-cart-card-main">
                            <div className="atsc-cart-name">{c.name}</div>
                            <div className="atsc-cart-meta">
                              <span>{c.items?.length || 0} items</span>
                              <span>•</span>
                              <span>{c.members?.length || 1} members</span>
                            </div>
                          </div>
                          <div className={`atsc-radio-indicator ${isSelected ? 'checked' : ''}`}>
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quantity & Note */}
              {!isCreatingNew && (
                <>
                  <div className="atsc-row-fields">
                    <div className="atsc-qty-field">
                      <label className="atsc-label">Quantity</label>
                      <div className="atsc-qty-stepper">
                        <button
                          type="button"
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                          className="atsc-stepper-btn"
                        >
                          -
                        </button>
                        <span className="atsc-qty-val">{quantity}</span>
                        <button
                          type="button"
                          onClick={() => setQuantity((q) => q + 1)}
                          className="atsc-stepper-btn"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="atsc-split-calc-hint">
                      <span>Group volume perk applies automatically!</span>
                    </div>
                  </div>

                  <div className="atsc-section">
                    <label className="atsc-label">Recommendation Note (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Let's get these for the trip! Upvote if you like the color"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="atsc-input"
                    />
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer CTAs */}
        {!isCreatingNew && (
          <div className="atsc-footer">
            <button type="button" className="atsc-cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="atsc-submit-btn"
              disabled={submitting || !selectedCartId}
              onClick={handleAddToCart}
            >
              {submitting ? (
                'Adding to Group...'
              ) : (
                <>
                  <span>Add to Shared Cart</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

