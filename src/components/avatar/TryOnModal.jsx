import React, { useState } from 'react';
import { Sparkles, ShoppingBag, Check, X, RotateCcw, ArrowRight } from 'lucide-react';
import AvatarCanvas from './AvatarCanvas';
import './TryOnModal.css';

export default function TryOnModal({ isOpen, onClose, product, onAddToCart }) {
  const [gender, setGender] = useState('Male');
  const [skinTone, setSkinTone] = useState('#f7d0b5');
  const [hairColor, setHairColor] = useState('#1f2937');
  const [isAddedToCart, setIsAddedToCart] = useState(false);

  if (!isOpen || !product) return null;

  // Detect clothing category / layer
  const clothingType = product.clothingType || (
    product.name.toLowerCase().includes('shirt') || product.name.toLowerCase().includes('hoodie') || product.name.toLowerCase().includes('top')
      ? 'top'
      : product.name.toLowerCase().includes('pant') || product.name.toLowerCase().includes('jean') || product.name.toLowerCase().includes('trouser')
      ? 'bottom'
      : product.name.toLowerCase().includes('shoe') || product.name.toLowerCase().includes('sneaker')
      ? 'footwear'
      : 'top'
  );

  const outfit = {
    top: clothingType === 'top' ? { name: product.name, color: '#3b82f6' } : { name: 'Basic White Tee', color: '#f8fafc' },
    bottom: clothingType === 'bottom' ? { name: product.name, color: '#1e293b' } : { name: 'Classic Dark Denim', color: '#1e3a8a' },
    footwear: clothingType === 'footwear' ? { name: product.name, color: '#0f172a' } : { name: 'White Retro Sneakers', color: '#ffffff' }
  };

  const handleAddToCart = () => {
    setIsAddedToCart(true);
    if (onAddToCart) onAddToCart(product);
    setTimeout(() => {
      setIsAddedToCart(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="tryon-modal-overlay" onClick={onClose}>
      <div className="tryon-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="tryon-modal-header">
          <div className="tryon-header-info">
            <span className="tryon-badge">✨ 3D Virtual Try-On Studio</span>
            <h3 className="tryon-title">Live Avatar Fitting Room</h3>
            <p className="tryon-sub">See how this item styles on your custom proportions before ordering</p>
          </div>
          <button className="tryon-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="tryon-content-grid">
          {/* Left: Avatar Fitting Canvas */}
          <div className="tryon-canvas-card">
            <div className="tryon-canvas-topbar">
              <div className="tryon-gender-toggle">
                <button
                  className={`tryon-g-btn ${gender === 'Male' ? 'active' : ''}`}
                  onClick={() => setGender('Male')}
                >
                  Male
                </button>
                <button
                  className={`tryon-g-btn ${gender === 'Female' ? 'active' : ''}`}
                  onClick={() => setGender('Female')}
                >
                  Female
                </button>
              </div>

              <div className="tryon-fit-tag">
                <span>Fitting Accuracy: </span><strong>98%</strong>
              </div>
            </div>

            <AvatarCanvas
              gender={gender}
              skinTone={skinTone}
              hairColor={hairColor}
              outfit={outfit}
            />

            {/* Quick skin swatches */}
            <div className="tryon-skin-swatches">
              {['#fbe5d6', '#f7d0b5', '#d49b73', '#8d5524', '#4b2c11'].map((c) => (
                <button
                  key={c}
                  style={{ background: c }}
                  className={`skin-dot ${skinTone === c ? 'active' : ''}`}
                  onClick={() => setSkinTone(c)}
                />
              ))}
            </div>
          </div>

          {/* Right: Equipped Item Details & Actions */}
          <div className="tryon-product-panel">
            <div className="tryon-item-badge">Currently Equipped Item</div>
            <div className="tryon-item-card">
              <img src={product.image} alt={product.name} className="tryon-thumb" />
              <div className="tryon-item-info">
                <h4 className="tryon-prod-name">{product.name}</h4>
                <div className="tryon-prod-price">₹{Number(product.price || 0).toLocaleString('en-IN')}</div>
                <span className="tryon-layer-pill">Layer: {clothingType.toUpperCase()}</span>
              </div>
            </div>

            {/* AI Fit & Style Advice */}
            <div className="tryon-ai-box">
              <div className="tryon-ai-header">
                <Sparkles size={16} className="text-amber" />
                <strong>AI Stylist Recommendation:</strong>
              </div>
              <p className="tryon-ai-text">
                This item pairs effortlessly with neutral tones. Its regular silhouette complements both casual streetwear and layered semi-formal outfits.
              </p>
            </div>

            {/* Actions */}
            <div className="tryon-actions">
              <button
                className={`tryon-add-btn ${isAddedToCart ? 'added' : ''}`}
                onClick={handleAddToCart}
              >
                {isAddedToCart ? (
                  <>
                    <Check size={16} /> Added to Bag!
                  </>
                ) : (
                  <>
                    <ShoppingBag size={16} /> Add This Item to Cart
                  </>
                )}
              </button>

              <button
                className="tryon-full-studio-btn"
                onClick={() => {
                  onClose();
                  window.location.href = '/customer/avatar';
                }}
              >
                Open Full Avatar Studio &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

