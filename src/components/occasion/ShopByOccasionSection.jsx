import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Sparkles,
  Plane,
  Dumbbell,
  GraduationCap,
  Wine,
  ArrowRight,
  Bot,
  Package,
  ShoppingCart,
  Zap,
  Check,
  Tag
} from 'lucide-react';
import { getOccasions } from '../../services/productService';
import './ShopByOccasionSection.css';

const OCCASION_ICONS = {
  office: Briefcase,
  wedding: Sparkles,
  travel: Plane,
  gym: Dumbbell,
  college: GraduationCap,
  party: Wine
};

export default function ShopByOccasionSection({
  onSelectOccasion,
  activeOccasion = null,
  onAddToCart = null
}) {
  const [occasions, setOccasions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOccasionData, setSelectedOccasionData] = useState(null);

  useEffect(() => {
    let mounted = true;
    getOccasions()
      .then((data) => {
        if (!mounted) return;
        if (data?.occasions) {
          setOccasions(data.occasions);
          if (data.occasions.length > 0) {
            setSelectedOccasionData(data.occasions[0]);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load occasions:', err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, []);

  const handleCardClick = (occ) => {
    setSelectedOccasionData(occ);
    if (onSelectOccasion) {
      onSelectOccasion(occ.slug || occ.id);
    }
  };

  if (loading && occasions.length === 0) {
    return null;
  }

  return (
    <section className="shop-by-occasion-section" id="customer-shop-by-occasion">
      <div className="sbo-header">
        <div className="sbo-title-group">
          <div className="sbo-badge">
            <Sparkles size={12} />
            <span>CURATED COLLECTIONS</span>
          </div>
          <h2 className="sbo-main-title">Shop by Occasion</h2>
          <p className="sbo-subtitle">
            Complete collections styled for your life — from 9-to-5 boardroom executive to festive celebrations and weekend fitness.
          </p>
        </div>

        {activeOccasion && activeOccasion !== 'all' && (
          <button
            type="button"
            className="sbo-reset-filter-btn"
            onClick={() => onSelectOccasion && onSelectOccasion('all')}
          >
            Clear Occasion Filter
          </button>
        )}
      </div>

      {/* Occasion Cards Grid */}
      <div className="sbo-cards-grid">
        {occasions.map((occ) => {
          const IconComp = OCCASION_ICONS[occ.id] || Sparkles;
          const isSelected = (activeOccasion === occ.slug || activeOccasion === occ.id) ||
            (!activeOccasion && selectedOccasionData?.id === occ.id);

          return (
            <div
              key={occ.id}
              className={`sbo-card ${isSelected ? 'active' : ''}`}
              onClick={() => handleCardClick(occ)}
              role="button"
              tabIndex={0}
            >
              <div className="sbo-card-bg-wrap">
                <img src={occ.image} alt={occ.name} className="sbo-card-bg" loading="lazy" />
                <div className="sbo-card-overlay" />
              </div>

              <div className="sbo-card-content">
                <div className="sbo-card-top">
                  <div className="sbo-card-icon-pill">
                    <IconComp size={14} />
                    <span>{occ.badge}</span>
                  </div>
                  <span className="sbo-card-count">{occ.productCount}+ items</span>
                </div>

                <div className="sbo-card-bottom">
                  <h3 className="sbo-card-name">{occ.name}</h3>
                  <p className="sbo-card-desc">{occ.description}</p>
                  <span className="sbo-card-link">
                    Explore Collection <ArrowRight size={13} />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Occasion "Complete the Look" Bundle & Darwin Stylist Rail */}
      {selectedOccasionData && (
        <div className="sbo-bundle-showcase">
          <div className="sbo-bundle-left">
            <div className="sbo-bundle-badge">
              <Tag size={12} />
              <span>{selectedOccasionData.bundleDiscount || '15% OFF BUNDLE'}</span>
            </div>
            <h4 className="sbo-bundle-title">Complete the Look: {selectedOccasionData.bundleTitle}</h4>
            <div className="sbo-bundle-checklist">
              {(selectedOccasionData.bundleItems || []).map((item, idx) => (
                <div key={idx} className="sbo-bundle-check-item">
                  <Check size={13} className="sbo-bundle-check-icon" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="sbo-bundle-cta-btn"
              onClick={() => handleCardClick(selectedOccasionData)}
            >
              <span>View {selectedOccasionData.shortName} Collection</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="sbo-bundle-right">
            <div className="sbo-stylist-bubble">
              <div className="sbo-stylist-avatar">
                <Bot size={18} />
              </div>
              <div>
                <strong>Darwin Occasion Stylist</strong>
                <p>"{selectedOccasionData.darwinStylistTip}"</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

