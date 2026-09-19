import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ChevronRight, Info, Eye, ArrowUpRight, ShoppingCart } from 'lucide-react';
import { getBecauseYouViewed } from '../../services/recommendationService';
import { addToCart } from '../../services/cartService';
import { toast } from '../Toast';
import './BecauseYouViewedRail.css';

export default function BecauseYouViewedRail({ product, onCartUpdated }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (!product?._id) return;
    async function loadAlternatives() {
      try {
        const data = await getBecauseYouViewed(product._id, 4);
        setItems(data || []);
      } catch (err) {
        console.error('Failed to load competitor alternatives:', err);
      }
    }
    loadAlternatives();
  }, [product?._id]);

  if (!items || items.length === 0) return null;

  const handleQuickAdd = async (e, item) => {
    e.stopPropagation();
    try {
      await addToCart(item._id, 1);
      toast.success(`Added ${item.name} to your cart!`);
      if (onCartUpdated) onCartUpdated();
    } catch (err) {
      toast.error('Failed to add to cart.');
    }
  };

  return (
    <section className="byv-rail-container" aria-label="Because You Viewed Recommendations">
      <div className="byv-rail-header">
        <div className="byv-header-left">
          <div className="byv-title-row">
            <h3 className="byv-title">
              Because you viewed <span>{product.name}</span>
            </h3>
            <div
              className="byv-info-wrap"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <Info size={15} className="byv-info-icon" />
              {showTooltip && (
                <div className="byv-tooltip">
                  <strong>Personalized Alternatives</strong>
                  <p>
                    Darwin analyzes specifications, performance tiers, brand alternatives, and user ratings to recommend relevant upgrades and competitors.
                  </p>
                </div>
              )}
            </div>
          </div>
          <p className="byv-subtitle">Compare similar models, flagships and direct tier alternatives</p>
        </div>
      </div>

      <div className="byv-grid">
        {items.map((item) => {
          const origPrice = Number(item.price || 0);
          const disc = Number(item.discountPercentage ?? 10);
          const sellingPrice = item.sellingPrice || Math.round(origPrice * (1 - disc / 100));

          return (
            <div
              key={item._id}
              className="byv-card"
              onClick={() => navigate(`/customer/products/${item._id}`)}
              role="button"
              tabIndex={0}
            >
              <div className="byv-reason-badge">
                <span>{item.recommendationReason || 'Popular Alternative'}</span>
              </div>

              <div className="byv-image-box">
                <img
                  src={item.image || item.images?.[0] || '/placeholder.png'}
                  alt={item.name}
                  className="byv-img"
                />
              </div>

              <div className="byv-card-body">
                <span className="byv-category-tag">{item.category || 'Electronics'}</span>
                <h4 className="byv-item-title" title={item.name}>
                  {item.name}
                </h4>

                <div className="byv-rating-row">
                  <div className="byv-stars">
                    <Star size={12} fill="#f59e0b" color="#f59e0b" />
                    <span>{Number(item.rating || 4.3).toFixed(1)}</span>
                  </div>
                  <span className="byv-rating-count">({item.ratingCount || 42} reviews)</span>
                </div>

                <div className="byv-price-row">
                  <div className="byv-price-left">
                    <span className="byv-selling">₹{sellingPrice.toLocaleString('en-IN')}</span>
                    {origPrice > sellingPrice && (
                      <span className="byv-mrp">₹{Math.round(origPrice).toLocaleString('en-IN')}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="byv-cart-icon-btn"
                    onClick={(e) => handleQuickAdd(e, item)}
                    title="Add to Cart"
                  >
                    <ShoppingCart size={15} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

