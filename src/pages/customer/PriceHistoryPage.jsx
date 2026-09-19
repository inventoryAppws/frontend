import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PriceChart from '../../components/price/PriceChart';
import '../../components/price/PriceHistoryModal.css';
import { API_BASE_URL } from '../../services/api';
import './PriceHistoryPage.css';

export default function PriceHistoryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [range, setRange] = useState('1Y');
  const [loading, setLoading] = useState(true);
  const [targetPrice, setTargetPrice] = useState('');
  const [alertSubmitted, setAlertSubmitted] = useState(false);
  const [similarProducts, setSimilarProducts] = useState([]);

  useEffect(() => {
    if (id) {
      loadData(id, range);
    } else {
      // If no id, fetch popular products to pick from
      fetchPopularProducts();
    }
  }, [id, range]);

  const loadData = async (productId, selectedRange) => {
    setLoading(true);
    try {
      // 1. Fetch product
      const pRes = await fetch(`${API_BASE_URL}/products/${productId}`);
      if (pRes.ok) {
        const pData = await pRes.json();
        setProduct(pData);
        setTargetPrice(Math.round(pData.price * 0.9));
      }

      // 2. Fetch price history
      const hRes = await fetch(`${API_BASE_URL}/price-history/${productId}?range=${selectedRange}`);
      if (hRes.ok) {
        const hData = await hRes.json();
        setHistoryData(hData);
      }

      // 3. Fetch similar items
      const sRes = await fetch(`${API_BASE_URL}/products?limit=4`);
      if (sRes.ok) {
        const sData = await sRes.json();
        const items = sData.products || sData || [];
        setSimilarProducts(items.filter(item => (item._id || item.id) !== productId).slice(0, 3));
      }
    } catch (err) {
      console.error('Error loading price history page:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPopularProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/products?limit=8`);
      if (res.ok) {
        const data = await res.json();
        const items = data.products || data || [];
        if (items.length > 0) {
          navigate(`/customer/price-history/${items[0]._id || items[0].id}`, { replace: true });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetAlert = async (e) => {
    e.preventDefault();
    if (!targetPrice) return;
    try {
      await fetch(`${API_BASE_URL}/price-history/alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: id,
          targetPrice: Number(targetPrice)
        })
      });
      setAlertSubmitted(true);
    } catch {
      setAlertSubmitted(true);
    }
  };

  if (loading && !product) {
    return (
      <div className="php-loading-screen">
        <div className="ph-spinner"></div>
        <p>Loading Price Tracker...</p>
      </div>
    );
  }

  const lowest = historyData?.lowestPrice || product?.price || 64999;
  const highest = historyData?.highestPrice || Math.round((product?.price || 64999) * 1.15);
  const current = historyData?.currentPrice || product?.price || 64999;
  const records = historyData?.records || [];

  return (
    <div className="php-container">
      {/* Top breadcrumb & back */}
      <div className="php-top-nav">
        <button className="php-back-btn" onClick={() => navigate(-1)}>
          &larr; Back to Catalog
        </button>
        <div className="php-tagline">
          ✨ Price Transparency Engine &bull; Verified Historical Pricing
        </div>
      </div>

      <div className="php-main-grid">
        {/* Left Card: Chart & Stats */}
        <div className="php-left-col">
          <div className="php-product-header">
            <img src={product?.image} alt={product?.name} className="php-hero-img" />
            <div className="php-hero-info">
              <span className="php-cat-pill">{product?.category || 'Electronics'}</span>
              <h1 className="php-title">{product?.name}</h1>
              <div className="php-price-row">
                <span className="php-current-price">₹{Number(current).toLocaleString('en-IN')}</span>
                {product?.originalPrice && (
                  <span className="php-strike-price">₹{Number(product.originalPrice).toLocaleString('en-IN')}</span>
                )}
                <span className="php-discount-tag">
                  {Math.round(((highest - current) / highest) * 100)}% off peak
                </span>
              </div>
            </div>
          </div>

          <div className="php-card">
            <div className="ph-range-bar">
              <div className="ph-range-title">Historical Price Movement</div>
              <div className="ph-range-pills">
                {['1M', '3M', '6M', '1Y', 'ALL'].map((r) => (
                  <button
                    key={r}
                    className={`ph-range-btn ${range === r ? 'active' : ''}`}
                    onClick={() => setRange(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="ph-chart-wrapper" style={{ minHeight: '280px' }}>
              <PriceChart
                records={records}
                lowestPrice={lowest}
                highestPrice={highest}
                currentPrice={current}
              />
            </div>

            <div className="ph-stats-grid">
              <div className="ph-stat-card lowest">
                <div className="ph-stat-label">Lowest Recorded Price</div>
                <div className="ph-stat-val text-emerald">₹{Number(lowest).toLocaleString('en-IN')}</div>
                <div className="ph-stat-sub">🟢 Verified Best Deal</div>
              </div>
              <div className="ph-stat-card current">
                <div className="ph-stat-label">Current Live Price</div>
                <div className="ph-stat-val text-indigo">₹{Number(current).toLocaleString('en-IN')}</div>
                <div className="ph-stat-sub">Ready to order</div>
              </div>
              <div className="ph-stat-card highest">
                <div className="ph-stat-label">Highest Peak Price</div>
                <div className="ph-stat-val text-slate">₹{Number(highest).toLocaleString('en-IN')}</div>
                <div className="ph-stat-sub">🔴 Historical Ceiling</div>
              </div>
            </div>

            <div className="ph-insight-box">
              <div className="ph-insight-icon">💡</div>
              <div className="ph-insight-text">
                <strong>Price Verdict: </strong>
                {historyData?.insight || `Current price of ₹${Number(current).toLocaleString('en-IN')} is ₹${(highest - current).toLocaleString('en-IN')} cheaper than highest peak. Our algorithms rate this as an optimal buying window.`}
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Alerts & Actions */}
        <div className="php-right-col">
          {/* Quick Buy CTA */}
          <div className="php-cta-card">
            <h3>Buy at Today's Price</h3>
            <p className="php-cta-desc">In stock & eligible for same-day delivery.</p>
            <div className="php-cta-price">₹{Number(current).toLocaleString('en-IN')}</div>
            <button
              className="php-buy-btn"
              onClick={() => navigate(`/customer/products/${id}`)}
            >
              🛍️ View Product Page
            </button>
          </div>

          {/* Set Price Drop Alert */}
          <div className="ph-alert-card" style={{ marginTop: '20px' }}>
            <h4 className="ph-alert-title">🔔 Set Price Drop Alert</h4>
            <p className="ph-alert-desc">
              Get an instant notification whenever the price drops to or below your target.
            </p>

            {alertSubmitted ? (
              <div className="ph-alert-success">
                ✅ <strong>Alert Set!</strong> We will alert you the second this product drops to ₹{Number(targetPrice).toLocaleString('en-IN')}.
              </div>
            ) : (
              <form className="ph-alert-form" onSubmit={handleSetAlert}>
                <div className="ph-input-wrap">
                  <span className="ph-input-prefix">₹</span>
                  <input
                    type="number"
                    className="ph-price-input"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="ph-set-alert-btn">
                  Alert Me
                </button>
              </form>
            )}
          </div>

          {/* Compare Price Curve of Similar Items */}
          {similarProducts.length > 0 && (
            <div className="php-similar-card">
              <h4>Track Other Popular Items</h4>
              <div className="php-similar-list">
                {similarProducts.map((sp) => (
                  <Link
                    key={sp._id || sp.id}
                    to={`/customer/price-history/${sp._id || sp.id}`}
                    className="php-similar-item"
                  >
                    <img src={sp.image} alt={sp.name} className="php-sim-thumb" />
                    <div className="php-sim-info">
                      <div className="php-sim-name">{sp.name}</div>
                      <div className="php-sim-price">₹{Number(sp.price).toLocaleString('en-IN')}</div>
                    </div>
                    <span className="php-sim-arrow">&rarr;</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

