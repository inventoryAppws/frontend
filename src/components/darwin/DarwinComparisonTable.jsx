import { ShoppingCart, Star, Lightbulb, Check, Package, Trophy, Zap, Award } from 'lucide-react';
import { toast } from '../Toast';

export default function DarwinComparisonTable({
  comparison,
  onAddToCart,
  onViewProduct,
  onBuyNow
}) {
  if (!comparison || !Array.isArray(comparison.products) || comparison.products.length < 2) {
    return null;
  }

  const { products, attributes = [], insight, winnerId, valuePickId, winnerBadge } = comparison;

  const handleAdd = async (p) => {
    try {
      if (onAddToCart) await onAddToCart(p);
      toast.success(`Added ${p.name} to cart`);
    } catch (err) {
      toast.error('Failed to add product.');
    }
  };

  return (
    <div className="darwin-comparison-box">
      <div className="darwin-comparison-header-pill">
        <Award size={15} />
        <span>Side-by-Side Product Comparison</span>
      </div>

      <div className="darwin-comparison-table-wrapper">
        <table className="darwin-comparison-table">
          <thead>
            <tr>
              <th className="darwin-comp-attr-head">Features</th>
              {products.map((p) => {
                const isWinner = String(p._id) === String(winnerId);
                const isValuePick = String(p._id) === String(valuePickId) && !isWinner;

                return (
                  <th
                    key={p._id}
                    className={`darwin-comp-prod-head ${isWinner ? 'winner-col' : ''}`}
                  >
                    {isWinner && (
                      <div className="darwin-comp-winner-badge">
                        <Trophy size={11} />
                        <span>{winnerBadge || "Darwin's Top Pick"}</span>
                      </div>
                    )}
                    {isValuePick && (
                      <div className="darwin-comp-value-badge">
                        <Zap size={11} />
                        <span>Best Value</span>
                      </div>
                    )}

                    <div className="darwin-comp-thumb-box">
                      {p.image || p.images?.[0] ? (
                        <img
                          src={p.image || p.images[0]}
                          alt=""
                          style={{ color: 'transparent' }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.parentElement?.querySelector('.darwin-comp-fallback-icon');
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className="darwin-comp-fallback-icon"
                        style={{ display: p.image || p.images?.[0] ? 'none' : 'flex' }}
                      >
                        <Package size={22} strokeWidth={1.2} />
                      </div>
                    </div>
                    <strong
                      className="darwin-comp-prod-name"
                      title={p.name}
                      onClick={() => onViewProduct && onViewProduct(p)}
                    >
                      {p.name}
                    </strong>
                    <div className="darwin-comp-prod-price">
                      ₹{Number(p.price || 0).toLocaleString('en-IN')}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {attributes.map((attr) => (
              <tr key={attr.key}>
                <td className="darwin-comp-attr-label">{attr.label}</td>
                {products.map((p) => {
                  const isWinner = String(p._id) === String(winnerId);
                  let val = p[attr.key];
                  if (attr.key === 'price' || attr.key === 'originalPrice') {
                    val = `₹${Number(val || 0).toLocaleString('en-IN')}`;
                  } else if (attr.key === 'rating') {
                    val = (
                      <span className="darwin-comp-rating-chip">
                        <Star size={11} fill="#f59e0b" color="#f59e0b" />
                        {Number(val || 4.2).toFixed(1)}
                      </span>
                    );
                  } else if (attr.key === 'discountPercentage') {
                    val = `${val || 0}% OFF`;
                  } else if (attr.key === 'quantity') {
                    val = Number(val || 0) > 0 ? `${val} in stock` : 'Out of stock';
                  }

                  return (
                    <td
                      key={p._id}
                      className={`darwin-comp-val-cell ${isWinner ? 'winner-col' : ''}`}
                    >
                      {val || '—'}
                    </td>
                  );
                })}
              </tr>
            ))}
            {/* Action Row */}
            <tr className="darwin-comp-actions-row">
              <td className="darwin-comp-attr-label">Quick Action</td>
              {products.map((p) => {
                const isWinner = String(p._id) === String(winnerId);

                return (
                  <td
                    key={p._id}
                    className={`darwin-comp-val-cell ${isWinner ? 'winner-col' : ''}`}
                  >
                    <div className="darwin-comp-btn-group">
                      <button
                        type="button"
                        className={`darwin-comp-cart-btn ${isWinner ? 'primary-pick' : ''}`}
                        onClick={() => handleAdd(p)}
                        disabled={p.inStock === false}
                      >
                        <ShoppingCart size={13} />
                        <span>Add to Cart</span>
                      </button>
                    </div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Darwin Recommendation Insight */}
      {insight && (
        <div className="darwin-comparison-insight-card">
          <div className="darwin-insight-icon-box">
            <Trophy size={18} />
          </div>
          <div className="darwin-insight-text">
            <strong>Darwin's Recommendation &amp; Verdict:</strong>
            <p>{insight.replace(/^💡\s*/, '')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
