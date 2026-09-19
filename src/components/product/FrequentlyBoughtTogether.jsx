import { useState, useEffect } from 'react';
import { Plus, Check, ShoppingCart, Sparkles, Tag, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getFrequentlyBoughtTogether } from '../../services/recommendationService';
import { addToCart } from '../../services/cartService';
import { toast } from '../Toast';
import './FrequentlyBoughtTogether.css';

export default function FrequentlyBoughtTogether({ productId, onCartUpdated }) {
  const navigate = useNavigate();
  const [bundleData, setBundleData] = useState(null);
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (!productId) return;
    async function loadBundle() {
      try {
        const data = await getFrequentlyBoughtTogether(productId);
        if (data && data.bundleItems && data.bundleItems.length > 1) {
          setBundleData(data);
          // Select all items by default
          setSelectedItemIds(new Set(data.bundleItems.map((item) => String(item._id))));
        }
      } catch (err) {
        console.error('Failed to load bundle recommendations:', err);
      }
    }
    loadBundle();
  }, [productId]);

  if (!bundleData || !bundleData.bundleItems || bundleData.bundleItems.length < 2) {
    return null;
  }

  const toggleItem = (itemId) => {
    // Don't allow deselecting the main product
    if (String(bundleData.mainProduct?._id) === String(itemId)) {
      return;
    }
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(String(itemId))) {
        next.delete(String(itemId));
      } else {
        next.add(String(itemId));
      }
      return next;
    });
  };

  // Calculate dynamic pricing based on checked items
  const selectedItems = bundleData.bundleItems.filter((item) =>
    selectedItemIds.has(String(item._id))
  );

  const individualSum = selectedItems.reduce((acc, it) => acc + (it.sellingPrice || 0), 0);
  const isFullBundle = selectedItems.length === bundleData.bundleItems.length;
  // Apply 10% bundle discount only if at least 2 items selected
  const hasDiscount = selectedItems.length >= 2;
  const bundleSavings = hasDiscount ? Math.round(individualSum * 0.1) : 0;
  const finalPrice = individualSum - bundleSavings;

  const handleAddBundleToCart = async () => {
    setAddingToCart(true);
    try {
      for (const item of selectedItems) {
        await addToCart(item._id, 1);
      }
      toast.success(
        `Added ${selectedItems.length} items to your cart! ${hasDiscount ? `Saved ₹${bundleSavings} with bundle discount.` : ''}`
      );
      if (onCartUpdated) onCartUpdated();
    } catch (err) {
      toast.error('Failed to add bundle to cart: ' + (err.message || 'Error'));
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <section className="fbt-bundle-container" aria-label="Frequently Bought Together">
      <div className="fbt-header">
        <div className="fbt-title-wrap">
          <Sparkles size={18} className="fbt-sparkle" />
          <h3 className="fbt-title">Frequently Bought Together</h3>
        </div>
        <span className="fbt-badge">Curated Combo • Extra 10% Off</span>
      </div>

      <div className="fbt-body-grid">
        {/* Visual Cards Row with + signs */}
        <div className="fbt-cards-row">
          {bundleData.bundleItems.map((item, index) => {
            const isSelected = selectedItemIds.has(String(item._id));
            const isMain = String(bundleData.mainProduct?._id) === String(item._id);
            return (
              <div key={item._id} className="fbt-item-wrapper">
                {index > 0 && (
                  <div className="fbt-plus-symbol">
                    <Plus size={20} />
                  </div>
                )}
                <div
                  className={`fbt-product-card ${isSelected ? 'selected' : 'deselected'}`}
                  onClick={() => toggleItem(item._id)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="fbt-card-top-row">
                    <label
                      className="fbt-checkbox-label"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleItem(item._id)}
                        disabled={isMain}
                      />
                      <span className="fbt-custom-checkbox">
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </span>
                    </label>
                    {isMain ? (
                      <span className="fbt-role-tag main">This item</span>
                    ) : (
                      <span className="fbt-role-tag">{item.role || 'Companion'}</span>
                    )}
                  </div>

                  <div className="fbt-img-box">
                    <img
                      src={item.image || item.images?.[0] || '/placeholder.png'}
                      alt={item.name}
                      className="fbt-img"
                    />
                  </div>

                  <div className="fbt-card-info">
                    <h4 className="fbt-prod-name" title={item.name}>
                      {item.name}
                    </h4>
                    <div className="fbt-price-row">
                      <span className="fbt-selling-price">
                        ₹{(item.sellingPrice || 0).toLocaleString('en-IN')}
                      </span>
                      {item.price && Number(item.price) > Number(item.sellingPrice) && (
                        <span className="fbt-original-price">
                          ₹{Math.round(Number(item.price)).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total Price & Add to Cart Callout */}
        <div className="fbt-summary-box">
          <div className="fbt-summary-headline">
            <span className="fbt-summary-label">Total for {selectedItems.length} items:</span>
            <div className="fbt-total-price-wrap">
              <span className="fbt-final-price">₹{finalPrice.toLocaleString('en-IN')}</span>
              {bundleSavings > 0 && (
                <span className="fbt-strikethrough-price">
                  ₹{individualSum.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>

          {bundleSavings > 0 && (
            <div className="fbt-savings-callout">
              <Tag size={13} />
              <span>You save ₹{bundleSavings.toLocaleString('en-IN')} with Combo Deal!</span>
            </div>
          )}

          <button
            type="button"
            className="fbt-add-cart-btn"
            onClick={handleAddBundleToCart}
            disabled={addingToCart || selectedItems.length === 0}
          >
            <ShoppingCart size={16} />
            <span>
              {addingToCart
                ? 'Adding bundle...'
                : `Add ${selectedItems.length} Item${selectedItems.length === 1 ? '' : 's'} to Cart`}
            </span>
          </button>

          <div className="fbt-perks-list">
            <div className="fbt-perk-line">
              <ShieldCheck size={13} />
              <span>Includes standard manufacturer warranty</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

