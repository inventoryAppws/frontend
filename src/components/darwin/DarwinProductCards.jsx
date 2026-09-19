import { useState } from 'react';
import { Star, ShoppingCart, Heart, ExternalLink, Columns, ArrowRight, Package, Zap } from 'lucide-react';
import { toast } from '../Toast';

export default function DarwinProductCards({
  products = [],
  onAddToCart,
  onAddToWishlist,
  onCompare,
  onAskQuery,
  onViewProduct
}) {
  const [addingId, setAddingId] = useState(null);
  const [wishlistedIds, setWishlistedIds] = useState({});

  if (!Array.isArray(products) || products.length === 0) {
    return null;
  }

  const handleAddCart = async (p, e) => {
    e.stopPropagation();
    setAddingId(p._id);
    try {
      if (onAddToCart) {
        await onAddToCart(p);
      }
      toast.success(`${p.name} added to cart!`);
    } catch (err) {
      toast.error(err.message || 'Could not add to cart.');
    } finally {
      setAddingId(null);
    }
  };

  const handleToggleWishlist = async (p, e) => {
    e.stopPropagation();
    const isSaved = Boolean(wishlistedIds[p._id]);
    try {
      if (onAddToWishlist) {
        await onAddToWishlist(p);
      }
      setWishlistedIds((prev) => ({ ...prev, [p._id]: !isSaved }));
      toast.success(isSaved ? 'Removed from wishlist' : `${p.name} saved to wishlist!`);
    } catch (err) {
      toast.error(err.message || 'Could not update wishlist.');
    }
  };

  return (
    <div className="darwin-product-cards-container">
      <div className="darwin-cards-scroll-track">
        {products.map((prod, idx) => {
          const isBestMatch = idx === 0;
          const isAdding = addingId === prod._id;
          const isWishlisted = Boolean(wishlistedIds[prod._id]);

          return (
            <div key={prod._id || idx} className="darwin-product-card">
              {isBestMatch && (
                <div className="darwin-badge-best-match">
                  <span>★ BEST MATCH</span>
                </div>
              )}
              {prod.isBestValue && !isBestMatch && (
                <div className="darwin-badge-best-value">
                  <Zap size={11} fill="#fbbf24" color="#d97706" />
                  <span>★ BEST VALUE DEAL</span>
                </div>
              )}

              <div className="darwin-card-top-row">
                <button
                  type="button"
                  className={`darwin-card-wishlist-btn ${isWishlisted ? 'active' : ''}`}
                  onClick={(e) => handleToggleWishlist(prod, e)}
                  title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                >
                  <Heart size={15} fill={isWishlisted ? '#ef4444' : 'none'} color={isWishlisted ? '#ef4444' : '#64748b'} />
                </button>
              </div>

              {/* Product Thumbnail */}
              <div
                className="darwin-card-media"
                onClick={() => onViewProduct && onViewProduct(prod)}
                role="button"
                tabIndex={0}
              >
                {prod.image ? (
                  <img
                    src={prod.image}
                    alt=""
                    loading="lazy"
                    style={{ color: 'transparent' }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.parentElement?.querySelector('.darwin-card-no-img');
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className="darwin-card-no-img"
                  style={{ display: prod.image ? 'none' : 'flex' }}
                >
                  <Package size={28} strokeWidth={1.2} />
                </div>
              </div>

              {/* Product Content */}
              <div className="darwin-card-content">
                <h4
                  className="darwin-card-title"
                  title={prod.name}
                  onClick={() => onViewProduct && onViewProduct(prod)}
                >
                  {prod.name}
                </h4>

                <div className="darwin-card-rating-row">
                  <div className="darwin-card-stars">
                    <Star size={12} fill="#f59e0b" color="#f59e0b" />
                    <span className="darwin-card-rating-val">{prod.rating ? prod.rating.toFixed(1) : '4.5'}</span>
                    <span className="darwin-card-rating-count">({prod.ratingCount || 120})</span>
                  </div>
                  {prod.inStock === false && (
                    <span className="darwin-card-stock-out">Out of Stock</span>
                  )}
                </div>

                <div className="darwin-card-pricing-row">
                  <span className="darwin-card-price">
                    ₹{Number(prod.price || 0).toLocaleString('en-IN')}
                  </span>
                  {prod.originalPrice > prod.price && (
                    <span className="darwin-card-mrp">
                      ₹{Number(prod.originalPrice).toLocaleString('en-IN')}
                    </span>
                  )}
                  {prod.discountPercentage > 0 && (
                    <span className="darwin-card-discount-tag">
                      {prod.discountPercentage}% OFF
                    </span>
                  )}
                </div>

                {/* Candidate-specific Smart Buy Deal Pill */}
                {prod.smartBuy?.couponCode && (
                  <div className="darwin-card-smartbuy-pill" title={prod.smartBuy.guideText}>
                    <Zap size={11} fill="#f59e0b" color="#d97706" />
                    <span>⚡ Smart Buy: <strong>₹{Number(prod.smartBuy.finalPrice).toLocaleString('en-IN')}</strong> ({prod.smartBuy.couponCode})</span>
                  </div>
                )}

                {/* Specs / Tags */}
                <ul className="darwin-card-specs-list">
                  {prod.warranty && <li>• {prod.warranty}</li>}
                  {prod.returnPolicy && <li>• {prod.returnPolicy}</li>}
                  {prod.vendorName && <li>• Sold by {prod.vendorName}</li>}
                </ul>

                {/* Actions */}
                <div className="darwin-card-actions">
                  <button
                    type="button"
                    className="darwin-btn-smart-buy"
                    onClick={() => onAskQuery && onAskQuery(`⚡ Smart Buy ${prod.name}`)}
                    disabled={prod.inStock === false}
                    title="Buy now with maximum coupon discount"
                  >
                    <Zap size={13} fill="#fbbf24" color="#d97706" />
                    <span>Smart Buy</span>
                  </button>
                  <button
                    type="button"
                    className="darwin-btn-add-cart"
                    onClick={(e) => handleAddCart(prod, e)}
                    disabled={isAdding || prod.inStock === false}
                  >
                    <ShoppingCart size={13} />
                    <span>{isAdding ? 'Adding...' : 'Add'}</span>
                  </button>
                  <button
                    type="button"
                    className="darwin-btn-view-details"
                    onClick={() => onViewProduct && onViewProduct(prod)}
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Action Pills Below Products */}
      {products.length >= 2 && (
        <div className="darwin-cards-footer-actions">
          <button
            type="button"
            className="darwin-footer-chip"
            onClick={() => onCompare && onCompare(products.slice(0, 3).map((p) => p._id))}
          >
            <Columns size={13} />
            <span>Compare these products</span>
          </button>
          <button
            type="button"
            className="darwin-footer-chip secondary"
            onClick={() => onAskQuery && onAskQuery(`Show more options similar to ${products[0]?.name?.slice(0, 20)}`)}
          >
            <span>Show more options</span>
            <ArrowRight size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

