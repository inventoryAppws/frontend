import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Scale, ArrowRight, X, Sparkles } from 'lucide-react';
import { getCompareList, removeFromCompare, clearCompare } from '../services/compareService';

export default function CompareFloatingBar() {
  const [compareList, setCompareList] = useState(getCompareList());
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleUpdate = (e) => {
      setCompareList(e.detail || getCompareList());
    };
    window.addEventListener('product-compare-updated', handleUpdate);
    return () => window.removeEventListener('product-compare-updated', handleUpdate);
  }, []);

  // Don't show if empty or already on the compare page
  if (!compareList.length || location.pathname.includes('/customer/compare')) {
    return null;
  }

  return (
    <div
      className="product-compare-floating-bar"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        background: '#0f172a',
        color: '#ffffff',
        borderRadius: '50px',
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.35)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '8px 16px 8px 20px',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(10px)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Scale size={16} />
        </div>
        <div>
          <strong style={{ fontSize: '13px', display: 'block', lineHeight: 1.2 }}>
            Product Compare ({compareList.length}/4)
          </strong>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            {compareList.length < 2 ? 'Select at least 1 more product' : 'Ready to compare side by side'}
          </span>
        </div>
      </div>

      {/* Product Thumbnails Preview */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        {compareList.map((prod) => (
          <div
            key={prod._id}
            style={{
              position: 'relative',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              overflow: 'hidden',
              background: '#1e293b',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
            title={prod.name}
          >
            {prod.image ? (
              <img src={prod.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                Item
              </div>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeFromCompare(prod._id);
              }}
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '14px',
                height: '14px',
                background: 'rgba(0,0,0,0.7)',
                color: '#fff',
                border: 'none',
                borderRadius: '0 0 0 4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0
              }}
              title="Remove from comparison"
            >
              <X size={9} />
            </button>
          </div>
        ))}
      </div>

      {/* CTA Compare Button */}
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => navigate('/customer/compare')}
        disabled={compareList.length < 2}
        style={{
          borderRadius: '30px',
          padding: '8px 16px',
          fontSize: '12.5px',
          fontWeight: 700,
          background: compareList.length >= 2 ? '#2563eb' : '#475569',
          borderColor: compareList.length >= 2 ? '#2563eb' : '#475569',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        <span>Compare Now</span>
        <ArrowRight size={14} />
      </button>

      {/* Clear Button */}
      <button
        type="button"
        onClick={clearCompare}
        style={{
          border: 'none',
          background: 'transparent',
          color: '#94a3b8',
          fontSize: '11px',
          cursor: 'pointer',
          padding: '4px',
          textDecoration: 'underline'
        }}
        title="Clear all selected products"
      >
        Clear
      </button>
    </div>
  );
}

