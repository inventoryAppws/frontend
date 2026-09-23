import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Brain,
  Check,
  Plus,
  Trash2,
  Sparkles,
  ShoppingBag,
  Tag,
  Shield,
  RotateCcw,
  Loader2
} from 'lucide-react';
import {
  getShoppingProfile,
  updateShoppingProfile,
  getDarwinMemory,
  toggleDarwinMemory,
  deleteDarwinMemory,
  clearDarwinMemory
} from '../../services/customerService';
import { toast } from '../Toast';
import './ShoppingProfileModal.css';

const POPULAR_BRANDS = [
  'Nike', 'Apple', 'Adidas', 'Samsung', 'Puma', 'Zara', 'Sony', "Levi's", 'boAt', 'H&M', 'OnePlus'
];

const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
const FOOTWEAR_SIZES = ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11', 'UK 12'];
const WAIST_SIZES = ['28', '30', '32', '34', '36', '38', '40'];

const STYLE_OPTIONS = [
  'Formal / Office',
  'Athletic / Gym',
  'Casual Everyday',
  'Streetwear',
  'Minimalist',
  'Traditional / Festive'
];

const OCCASION_OPTIONS = [
  'Office',
  'Wedding',
  'Travel',
  'Gym',
  'College',
  'Party'
];

export default function ShoppingProfileModal({ isOpen, onClose, onProfileSaved }) {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'memory'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile State
  const [budgetMax, setBudgetMax] = useState(10000);
  const [budgetTier, setBudgetTier] = useState('any');
  const [selectedBrands, setSelectedBrands] = useState(['Nike', 'Apple', 'Adidas', 'Puma']);
  const [clothingSize, setClothingSize] = useState('M');
  const [footwearSize, setFootwearSize] = useState('UK 8');
  const [waistSize, setWaistSize] = useState('32');
  const [selectedStyles, setSelectedStyles] = useState(['Casual Everyday', 'Athletic / Gym']);
  const [selectedOccasions, setSelectedOccasions] = useState(['Office', 'Gym', 'College']);
  const [newBrandInput, setNewBrandInput] = useState('');

  // Memory State
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [memories, setMemories] = useState([]);
  const [newMemoryKey, setNewMemoryKey] = useState('');
  const [newMemoryValue, setNewMemoryValue] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setLoading(true);

    getShoppingProfile()
      .then((data) => {
        if (!mounted) return;
        const prof = data?.shoppingProfile || {};
        if (prof.budget?.max) setBudgetMax(prof.budget.max);
        if (prof.budget?.tier) setBudgetTier(prof.budget.tier);
        if (Array.isArray(prof.brands) && prof.brands.length > 0) setSelectedBrands(prof.brands);
        if (prof.sizes?.clothing) setClothingSize(prof.sizes.clothing);
        if (prof.sizes?.footwear) setFootwearSize(prof.sizes.footwear);
        if (prof.sizes?.bottoms) setWaistSize(prof.sizes.bottoms);
        if (Array.isArray(prof.styles) && prof.styles.length > 0) setSelectedStyles(prof.styles);
        if (Array.isArray(prof.occasions) && prof.occasions.length > 0) setSelectedOccasions(prof.occasions);

        const mem = data?.darwinMemory || {};
        setMemoryEnabled(mem.enabled !== false);
        setMemories(mem.memories || []);
      })
      .catch((err) => {
        console.error('Failed to load shopping profile:', err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBrandToggle = (brand) => {
    if (selectedBrands.includes(brand)) {
      setSelectedBrands(selectedBrands.filter((b) => b !== brand));
    } else {
      setSelectedBrands([...selectedBrands, brand]);
    }
  };

  const handleAddCustomBrand = (e) => {
    e.preventDefault();
    const clean = newBrandInput.trim();
    if (!clean) return;
    if (!selectedBrands.includes(clean)) {
      setSelectedBrands([...selectedBrands, clean]);
    }
    setNewBrandInput('');
  };

  const handleStyleToggle = (style) => {
    if (selectedStyles.includes(style)) {
      setSelectedStyles(selectedStyles.filter((s) => s !== style));
    } else {
      setSelectedStyles([...selectedStyles, style]);
    }
  };

  const handleOccasionToggle = (occ) => {
    if (selectedOccasions.includes(occ)) {
      setSelectedOccasions(selectedOccasions.filter((o) => o !== occ));
    } else {
      setSelectedOccasions([...selectedOccasions, occ]);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const payload = {
        budget: { min: 0, max: Number(budgetMax), tier: budgetTier },
        brands: selectedBrands,
        sizes: { clothing: clothingSize, footwear: footwearSize, bottoms: waistSize },
        styles: selectedStyles,
        occasions: selectedOccasions
      };

      const res = await updateShoppingProfile(payload);
      toast.success('Shopping preferences updated successfully!');
      if (onProfileSaved) onProfileSaved(res.shoppingProfile);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleMemory = async () => {
    try {
      const res = await toggleDarwinMemory(!memoryEnabled);
      setMemoryEnabled(res.enabled);
      toast.info(res.msg);
    } catch (err) {
      toast.error('Failed to toggle Darwin memory');
    }
  };

  const handleDeleteMemoryItem = async (key) => {
    try {
      const res = await deleteDarwinMemory(key);
      setMemories(res.memories || []);
      toast.success('Preference removed from Darwin memory');
    } catch (err) {
      toast.error('Failed to remove memory');
    }
  };

  const handleClearAllMemory = async () => {
    if (!window.confirm('Are you sure you want to clear all learned preferences from Darwin memory?')) return;
    try {
      await clearDarwinMemory();
      setMemories([]);
      toast.success('All Darwin shopping memories have been cleared');
    } catch (err) {
      toast.error('Failed to clear memories');
    }
  };

  return (
    <div className="sp-modal-overlay" onClick={onClose}>
      <div className="sp-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sp-modal-header">
          <div className="sp-header-left">
            <div className="sp-header-icon-box">
              <Sliders size={20} />
            </div>
            <div>
              <h2 className="sp-modal-title">Shopping Profile & Darwin Memory</h2>
              <p className="sp-modal-subtitle">
                Personalize your shopping recommendations, sizes, budget and Darwin AI memory.
              </p>
            </div>
          </div>
          <button type="button" className="sp-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="sp-tabs-nav">
          <button
            type="button"
            className={`sp-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <Sliders size={16} />
            <span>Shopping Preferences</span>
          </button>

          <button
            type="button"
            className={`sp-tab-btn ${activeTab === 'memory' ? 'active' : ''}`}
            onClick={() => setActiveTab('memory')}
          >
            <Brain size={16} />
            <span>Darwin Memory Vault</span>
            <span className="sp-memory-count-badge">{memories.length}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="sp-modal-body">
          {loading ? (
            <div className="sp-loading-box">
              <Loader2 size={32} className="spin" />
              <span>Loading your preferences...</span>
            </div>
          ) : activeTab === 'profile' ? (
            <div className="sp-profile-view">
              {/* 1. Budget Preference */}
              <div className="sp-field-group">
                <div className="sp-field-header">
                  <label className="sp-field-label">Budget Preference (Max Price per Item)</label>
                  <span className="sp-budget-display">₹{Number(budgetMax).toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="50000"
                  step="500"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(Number(e.target.value))}
                  className="sp-range-slider"
                />
                <div className="sp-quick-pills">
                  {[1000, 2500, 5000, 10000, 25000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      className={`sp-pill-btn ${budgetMax === amt ? 'active' : ''}`}
                      onClick={() => setBudgetMax(amt)}
                    >
                      Under ₹{amt.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Size Preferences */}
              <div className="sp-field-group">
                <label className="sp-field-label">Your Sizes</label>
                <div className="sp-sizes-grid">
                  <div>
                    <span className="sp-sub-label">Top / Clothing</span>
                    <div className="sp-chips-wrap">
                      {CLOTHING_SIZES.map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          className={`sp-chip-btn ${clothingSize === sz ? 'selected' : ''}`}
                          onClick={() => setClothingSize(sz)}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="sp-sub-label">Footwear (UK)</span>
                    <div className="sp-chips-wrap">
                      {FOOTWEAR_SIZES.map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          className={`sp-chip-btn ${footwearSize === sz ? 'selected' : ''}`}
                          onClick={() => setFootwearSize(sz)}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="sp-sub-label">Waist / Bottoms</span>
                    <div className="sp-chips-wrap">
                      {WAIST_SIZES.map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          className={`sp-chip-btn ${waistSize === sz ? 'selected' : ''}`}
                          onClick={() => setWaistSize(sz)}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Preferred Brands */}
              <div className="sp-field-group">
                <label className="sp-field-label">Preferred Brands</label>
                <div className="sp-chips-wrap">
                  {POPULAR_BRANDS.map((brand) => {
                    const isSel = selectedBrands.includes(brand);
                    return (
                      <button
                        key={brand}
                        type="button"
                        className={`sp-chip-btn ${isSel ? 'selected' : ''}`}
                        onClick={() => handleBrandToggle(brand)}
                      >
                        {isSel && <Check size={12} strokeWidth={3} />}
                        <span>{brand}</span>
                      </button>
                    );
                  })}
                </div>
                <form onSubmit={handleAddCustomBrand} className="sp-add-brand-form">
                  <input
                    type="text"
                    placeholder="Add custom brand (e.g. Under Armour)..."
                    value={newBrandInput}
                    onChange={(e) => setNewBrandInput(e.target.value)}
                    className="sp-input"
                  />
                  <button type="submit" className="sp-add-brand-btn">
                    <Plus size={15} /> Add
                  </button>
                </form>
              </div>

              {/* 4. Preferred Styles */}
              <div className="sp-field-group">
                <label className="sp-field-label">Style Aesthetic & Vibes</label>
                <div className="sp-chips-wrap">
                  {STYLE_OPTIONS.map((style) => {
                    const isSel = selectedStyles.includes(style);
                    return (
                      <button
                        key={style}
                        type="button"
                        className={`sp-chip-btn ${isSel ? 'selected' : ''}`}
                        onClick={() => handleStyleToggle(style)}
                      >
                        {isSel && <Check size={12} strokeWidth={3} />}
                        <span>{style}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. Preferred Occasions */}
              <div className="sp-field-group">
                <label className="sp-field-label">Frequently Shopped Occasions</label>
                <div className="sp-chips-wrap">
                  {OCCASION_OPTIONS.map((occ) => {
                    const isSel = selectedOccasions.includes(occ);
                    return (
                      <button
                        key={occ}
                        type="button"
                        className={`sp-chip-btn ${isSel ? 'selected' : ''}`}
                        onClick={() => handleOccasionToggle(occ)}
                      >
                        {isSel && <Check size={12} strokeWidth={3} />}
                        <span>{occ}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="sp-memory-view">
              {/* Toggle Box */}
              <div className="sp-memory-toggle-card">
                <div className="sp-toggle-left">
                  <div className="sp-memory-icon-circle">
                    <Brain size={20} />
                  </div>
                  <div>
                    <h4>Darwin Smart Shopping Memory</h4>
                    <p>
                      Darwin learns your style, sizing and budget preferences from your interactions. You have complete control to edit or clear any memory.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className={`sp-toggle-switch ${memoryEnabled ? 'active' : ''}`}
                  onClick={handleToggleMemory}
                >
                  <span className="sp-toggle-dot" />
                </button>
              </div>

              {/* Memories List */}
              <div className="sp-memories-list">
                <div className="sp-memories-header">
                  <span className="sp-memories-title">Remembered Preferences ({memories.length})</span>
                  {memories.length > 0 && (
                    <button type="button" className="sp-clear-all-btn" onClick={handleClearAllMemory}>
                      <Trash2 size={13} />
                      <span>Clear All Memory</span>
                    </button>
                  )}
                </div>

                {memories.length === 0 ? (
                  <div className="sp-empty-memories">
                    <Brain size={36} />
                    <p>No preferences stored in memory yet. Darwin will learn as you shop and browse!</p>
                  </div>
                ) : (
                  memories.map((mem) => (
                    <div key={mem.key} className="sp-memory-item">
                      <div className="sp-memory-info">
                        <span className="sp-memory-text">{mem.value}</span>
                        <div className="sp-memory-meta">
                          <span className="sp-source-badge">{mem.source || 'learned'}</span>
                          <span className="sp-conf-badge">{Math.round((mem.confidence || 0.9) * 100)}% Confidence</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="sp-delete-mem-btn"
                        onClick={() => handleDeleteMemoryItem(mem.key)}
                        title="Delete this preference"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sp-modal-footer">
          <button type="button" className="sp-cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="sp-save-btn"
            onClick={handleSaveProfile}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 size={15} className="spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check size={16} strokeWidth={2.5} />
                <span>Save Preferences</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

