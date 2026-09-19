import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Repeat,
  Calendar,
  Clock,
  Pause,
  Play,
  SkipForward,
  Trash2,
  Bell,
  Package,
  Check,
  Plus,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  X,
  PackageOpen
} from 'lucide-react';
import { toast } from '../../components/Toast';
import AddRepeatDeliveryModal from '../../components/subscription/AddRepeatDeliveryModal';
import { API_BASE_URL } from '../../services/api';
import './RepeatDelivery.css';

export default function RepeatDelivery() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'paused', 'all'
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProductForModal, setSelectedProductForModal] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subToCancel, setSubToCancel] = useState(null);
  const [essentials, setEssentials] = useState([]);
  const [restockAlertDismissed, setRestockAlertDismissed] = useState(false);
  // Track which subscription banners have been snoozed this session
  const [snoozedBannerIds, setSnoozedBannerIds] = useState(() => {
    try {
      const stored = localStorage.getItem('rd_snoozed_banner_ids');
      if (stored) {
        const parsed = JSON.parse(stored);
        const now = Date.now();
        // Keep only snoozes within last 6 hours
        return Object.fromEntries(Object.entries(parsed).filter(([, ts]) => now - ts < 6 * 60 * 60 * 1000));
      }
    } catch (_) {}
    return {};
  });
  // Track order-now loading state per subscription
  const [orderNowLoading, setOrderNowLoading] = useState({});

  // Catalog Product Picker Modal
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerCategory, setPickerCategory] = useState('All');
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  const fetchPickerCatalog = async (searchQuery = '', category = 'All') => {
    setLoadingCatalog(true);
    try {
      const params = new URLSearchParams({ limit: '80' });
      if (searchQuery.trim()) {
        params.append('q', searchQuery.trim());
      }
      if (category && category !== 'All') {
        if (category === 'Groceries & Dairy') params.append('category', 'Food & Beverages');
        else if (category === 'Personal Care') params.append('category', 'Beauty & Personal Care');
        else if (category === 'Daily Essentials') params.append('category', 'Groceries');
        else params.append('category', category);
      }

      let res = await fetch(`${API_BASE_URL}/products/public?${params.toString()}`);
      if (res.ok) {
        let data = await res.json();
        let items = data.items || data.products || (Array.isArray(data) ? data : []);

        // If search returned empty with a category filter, retry globally across catalog
        if (items.length === 0 && searchQuery.trim() && category !== 'All') {
          const fallbackRes = await fetch(`${API_BASE_URL}/products/public?q=${encodeURIComponent(searchQuery.trim())}&limit=50`);
          if (fallbackRes.ok) {
            const fbData = await fallbackRes.json();
            items = fbData.items || fbData.products || [];
          }
        }
        setCatalogProducts(items);
      }
    } catch (err) {
      console.error('Failed to load catalog products', err);
    } finally {
      setLoadingCatalog(false);
    }
  };

  const openProductPicker = () => {
    setIsProductPickerOpen(true);
    fetchPickerCatalog(pickerSearch, pickerCategory);
  };

  // Real-time debounced search when typing or switching categories
  useEffect(() => {
    if (isProductPickerOpen) {
      const timer = setTimeout(() => {
        fetchPickerCatalog(pickerSearch, pickerCategory);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [pickerSearch, pickerCategory, isProductPickerOpen]);

  useEffect(() => {
    fetchSubscriptions();
    fetchEssentials();
  }, []);

  const getAuthToken = () => localStorage.getItem('token') || localStorage.getItem('customerToken') || '';

  const getStoredCustomerId = () => {
    let customerId = localStorage.getItem('customerId');
    if (!customerId) {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user') || localStorage.getItem('customer') || '{}');
        customerId = storedUser._id || storedUser.id || storedUser.customerId;
      } catch {}
    }
    return customerId;
  };

  const getAuthHeaders = () => {
    const token = getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const customerId = getStoredCustomerId();
      const url = customerId
        ? `${API_BASE_URL}/subscriptions?customerId=${customerId}`
        : `${API_BASE_URL}/subscriptions`;
      const res = await fetch(url, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load subscriptions.');
    } finally {
      setLoading(false);
    }
  };

  const fetchEssentials = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/products/public?limit=100`);
      if (res.ok) {
        const data = await res.json();
        const items = data.items || data.products || (Array.isArray(data) ? data : []);
        // filter grocery, dairy, pantry items or items eligible for repeat
        const eligible = items.filter(
          (p) =>
            p.isRepeatDeliveryEligible ||
            /food|beverage|groc|dairy|pantry|care|essential/i.test(p.category || '') ||
            /milk|atta|rice|oil|salt|tea|coffee|soap|bread|paneer/i.test(p.name || '')
        );
        setEssentials(eligible.length > 0 ? eligible.slice(0, 6) : items.slice(0, 4));
      }
    } catch (err) {
      console.error('Failed to load essentials:', err);
    }
  };

  const handleToggleStatus = async (sub) => {
    const newStatus = sub.status === 'active' ? 'paused' : 'active';
    try {
      const res = await fetch(`${API_BASE_URL}/subscriptions/${sub._id}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setSubscriptions((prev) =>
          prev.map((s) => (s._id === sub._id ? { ...s, status: newStatus } : s))
        );
        toast.info(
          newStatus === 'paused'
            ? `Subscription for "${sub.productName || 'product'}" paused.`
            : `Subscription for "${sub.productName || 'product'}" resumed.`
        );
        fetchSubscriptions();
      } else {
        toast.error('Failed to update subscription status');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error. Failed to update status.');
    }
  };

  const handleSkipNext = async (subId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/subscriptions/${subId}/skip`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        toast.info('Next delivery cycle skipped successfully.');
        fetchSubscriptions();
      } else {
        toast.error('Failed to skip next delivery');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error. Failed to skip delivery.');
    }
  };

  const handleConfirmCancelSub = async () => {
    if (!subToCancel) return;
    const subId = subToCancel._id;
    try {
      const res = await fetch(`${API_BASE_URL}/subscriptions/${subId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        setSubscriptions((prev) => prev.filter((s) => s._id !== subId));
        toast.success(`Repeat delivery for "${subToCancel.productName || subToCancel.productId?.name || 'product'}" cancelled`);
      } else {
        toast.error('Failed to cancel subscription');
      }
    } catch (err) {
      toast.error('Network error. Failed to cancel subscription.');
    } finally {
      setSubToCancel(null);
    }
  };

  const filteredSubs = subscriptions.filter((s) => {
    if (activeTab === 'active') return s.status === 'active';
    if (activeTab === 'paused') return s.status === 'paused';
    return true;
  });

  const activeCount = subscriptions.filter((s) => s.status === 'active').length;
  const pausedCount = subscriptions.filter((s) => s.status === 'paused').length;

  // Filter catalog products for the picker modal
  const filteredPickerProducts = catalogProducts.filter((p) => {
    if (pickerCategory !== 'All') {
      const pCat = (p.category || '').toLowerCase();
      const matchCat = pickerCategory.toLowerCase();
      if (pickerCategory === 'Groceries & Dairy') {
        if (!(pCat.includes('groc') || pCat.includes('dairy') || pCat.includes('food') || pCat.includes('beverage') || pCat.includes('pantry'))) {
          return false;
        }
      } else if (pickerCategory === 'Daily Essentials') {
        if (!(pCat.includes('groc') || pCat.includes('essential') || pCat.includes('clean') || pCat.includes('home'))) {
          return false;
        }
      } else if (pickerCategory === 'Personal Care') {
        if (!(pCat.includes('care') || pCat.includes('beauty') || pCat.includes('wash') || pCat.includes('soap'))) {
          return false;
        }
      } else if (pickerCategory === 'Beverages') {
        if (!(pCat.includes('beverage') || pCat.includes('tea') || pCat.includes('coffee') || pCat.includes('drink') || pCat.includes('juice') || pCat.includes('milk'))) {
          return false;
        }
      }
    }
    if (pickerSearch.trim()) {
      const q = pickerSearch.toLowerCase().trim();
      const name = (p.name || '').toLowerCase();
      const cat = (p.category || '').toLowerCase();
      const brand = (p.brand || '').toLowerCase();
      return name.includes(q) || cat.includes(q) || brand.includes(q);
    }
    return true;
  });

  // Compute urgent subscriptions: active AND (delivery ≤2 days OR quantity low ≤10)
  const now = new Date();
  const urgentSubs = subscriptions.filter((s) => {
    if (s.status !== 'active') return false;
    if (snoozedBannerIds[s._id]) return false;
    const deliveryDate = s.nextDeliveryDate ? new Date(s.nextDeliveryDate) : null;
    const daysUntil = deliveryDate ? Math.ceil((deliveryDate - now) / (1000 * 60 * 60 * 24)) : null;
    const isComingSoon = daysUntil !== null && daysUntil <= 2;
    const isLowStock = Number(s.quantity || 0) > 0 && Number(s.quantity) <= 10;
    return isComingSoon || isLowStock;
  });

  const handleSnoozeBanner = (subId) => {
    const updated = { ...snoozedBannerIds, [subId]: Date.now() };
    setSnoozedBannerIds(updated);
    try { localStorage.setItem('rd_snoozed_banner_ids', JSON.stringify(updated)); } catch (_) {}
  };

  const handleBannerOrderNow = async (sub) => {
    setOrderNowLoading((prev) => ({ ...prev, [sub._id]: true }));
    try {
      const res = await fetch(`${API_BASE_URL}/subscriptions/${sub._id}/order-now`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        handleSnoozeBanner(sub._id);
        fetchSubscriptions();
        toast.success(`Order placed immediately for "${sub.productName || sub.productId?.name || sub.name || 'your subscription'}"!`);
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.msg || 'Failed to place order. Try again.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error. Please try again.');
    } finally {
      setOrderNowLoading((prev) => ({ ...prev, [sub._id]: false }));
    }
  };

  return (
    <div className="rd-page-container">
      {/* Page Header */}
      <div className="rd-hero-section">
        <div className="rd-hero-content">
          <span className="rd-badge">🔄 Smart Automation</span>
          <h1 className="rd-page-title">Monthly Repeat Delivery &amp; Reorder</h1>
          <p className="rd-page-desc">
            Never run out of groceries, dairy, or household essentials. Automated delivery schedules with up to 10% extra discount.
          </p>
        </div>
        <div className="rd-stats-banner">
          <div className="rd-stat-box">
            <span className="rd-stat-number">{activeCount}</span>
            <span className="rd-stat-txt">Active Cycles</span>
          </div>
          <div className="rd-stat-box">
            <span className="rd-stat-number">10%</span>
            <span className="rd-stat-txt">Guaranteed Discount</span>
          </div>
          <div className="rd-stat-box">
            <span className="rd-stat-number">₹0</span>
            <span className="rd-stat-txt">Delivery Fee</span>
          </div>
        </div>
      </div>

      {/* Dynamic Urgency Banners — shown when delivery ≤2 days away OR stock is low */}
      {urgentSubs.length > 0 && urgentSubs.map((sub) => {
        const deliveryDate = sub.nextDeliveryDate ? new Date(sub.nextDeliveryDate) : null;
        const daysUntil = deliveryDate ? Math.ceil((deliveryDate - new Date()) / (1000 * 60 * 60 * 24)) : null;
        const isLowStock = Number(sub.quantity || 0) > 0 && Number(sub.quantity) <= 10;
        const isComingSoon = daysUntil !== null && daysUntil <= 2;
        const isLoading = !!orderNowLoading[sub._id];

        return (
          <div key={sub._id} className="rd-restock-alert" style={{ borderLeft: isComingSoon ? '4px solid #ef4444' : '4px solid #f59e0b' }}>
            <div className="rd-alert-icon">{isComingSoon ? '⏰' : '📦'}</div>
            <div className="rd-alert-body">
              <strong>
                {isComingSoon && daysUntil <= 0 ? '🔴 Delivery Due Today!' :
                 isComingSoon && daysUntil === 1 ? '🟠 Delivery Tomorrow!' :
                 isComingSoon ? `🟡 Delivery in ${daysUntil} days` :
                 '⚠️ Low Supply Alert'}
              </strong>
              <p>
                <strong>{sub.productName || sub.name || 'Your subscription'}</strong>
                {isComingSoon && deliveryDate
                  ? ` is scheduled for ${deliveryDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}.`
                  : ''}
                {isLowStock ? ` Only ${sub.quantity} units remaining in stock.` : ''}
                {' '}Your order will be <strong>placed automatically</strong> on the scheduled date.
              </p>
            </div>
            <div className="rd-alert-actions">
              <button
                className="rd-order-now-btn"
                onClick={() => handleBannerOrderNow(sub)}
                disabled={isLoading}
                title="Place order immediately now"
              >
                {isLoading ? '⏳ Ordering...' : 'Order Now'}
              </button>
              <button
                className="rd-dismiss-btn"
                onClick={() => handleSnoozeBanner(sub._id)}
                title="Snooze this reminder for 6 hours"
              >
                Remind Me Later
              </button>
            </div>
          </div>
        );
      })}

      {/* Auto-Order Info Callout */}
      {activeCount > 0 && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '10px',
          background: '#eff6ff', border: '1px solid #bfdbfe',
          borderRadius: '10px', padding: '12px 16px', margin: '0 0 4px 0',
          fontSize: '13px', color: '#1e40af'
        }}>
          <span style={{ fontSize: '18px', flexShrink: 0 }}>ℹ️</span>
          <span>
            <strong>Auto-order is ON</strong> for your {activeCount} active subscription{activeCount > 1 ? 's' : ''}.
            Orders are placed <strong>automatically</strong> when the scheduled date arrives — you'll receive a notification before each delivery.
            You can pause, skip, or order early at any time.
          </span>
        </div>
      )}


      {/* Tab Navigation & Action Button */}
      <div className="rd-tabs-row">
        <div className="rd-tabs">
          <button
            className={`rd-tab ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Active Subscriptions ({activeCount})
          </button>
          <button
            className={`rd-tab ${activeTab === 'paused' ? 'active' : ''}`}
            onClick={() => setActiveTab('paused')}
          >
            Paused ({pausedCount})
          </button>
          <button
            className={`rd-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Subscriptions ({subscriptions.length})
          </button>
        </div>

        {/* Schedule Repeat Delivery Action Button */}
        <button
          type="button"
          className="rd-schedule-new-btn"
          onClick={openProductPicker}
          title="Browse catalog and schedule repeat delivery for any product"
        >
          <Plus size={16} />
          <span>Add Product to Repeat Delivery</span>
        </button>
      </div>

      {/* Subscription Cards Grid */}
      {loading ? (
        <div className="rd-loading-state">
          <RefreshCw className="spin" size={28} />
          <span>Loading delivery schedules...</span>
        </div>
      ) : filteredSubs.length === 0 ? (
        <div className="rd-empty-card">
          <Package size={48} strokeWidth={1.2} color="#94a3b8" />
          <h3>No {activeTab} repeat deliveries</h3>
          <p>Schedule your first automatic delivery from the essentials below or select any product from our catalog.</p>
          <button
            type="button"
            className="rd-empty-schedule-btn"
            onClick={openProductPicker}
          >
            <Plus size={16} />
            <span>Add Product to Repeat Delivery</span>
          </button>
        </div>
      ) : (
        <div className="rd-cards-grid">
          {filteredSubs.map((sub) => {
            const prod = sub.productId || {};
            const nextDate = new Date(sub.nextDeliveryDate);
            const formattedNext = nextDate.toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            });
            const daysLeft = Math.ceil((nextDate - new Date()) / (1000 * 60 * 60 * 24));

            return (
              <div key={sub._id} className={`rd-sub-card ${sub.status}`}>
                <div className="rd-card-top">
                  <img
                    src={prod.image || 'https://via.placeholder.com/80'}
                    alt={prod.name}
                    className="rd-card-thumb"
                  />
                  <div className="rd-card-info">
                    <div className="rd-card-badge-row">
                      <span className="rd-cycle-pill">
                        <Repeat size={12} /> Every {sub.frequencyDays} Days
                      </span>
                      <span className={`rd-status-tag ${sub.status}`}>
                        {sub.status === 'active' ? '● Active' : '⏸ Paused'}
                      </span>
                    </div>
                    <h3 className="rd-card-title">{prod.name || 'Essential Product'}</h3>
                    <div className="rd-card-pricing">
                      <span className="rd-current-cost">
                        ₹{(Math.round((prod.price || 100) * 0.9) * sub.quantity).toLocaleString('en-IN')}
                      </span>
                      <span className="rd-qty-badge">Qty: {sub.quantity}</span>
                    </div>
                  </div>
                </div>

                <div className="rd-card-schedule-box">
                  <div className="rd-schedule-item">
                    <span className="rd-sched-label">Next Automated Dispatch:</span>
                    <span className="rd-sched-val">
                      <Calendar size={13} /> {formattedNext}{' '}
                      <span className="rd-days-countdown">
                        ({daysLeft <= 0 ? 'Due Today' : `in ${daysLeft} days`})
                      </span>
                    </span>
                  </div>
                  {sub.lastPurchasedDate && (
                    <div className="rd-schedule-item sub">
                      <span className="rd-sched-label">Last delivered:</span>
                      <span className="rd-sched-val text-muted">
                        {new Date(sub.lastPurchasedDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="rd-card-actions">
                  <button
                    className="rd-action-btn toggle"
                    onClick={() => handleToggleStatus(sub)}
                    title={sub.status === 'active' ? 'Pause automatic deliveries' : 'Resume subscription'}
                  >
                    {sub.status === 'active' ? (
                      <>
                        <Pause size={14} /> Pause
                      </>
                    ) : (
                      <>
                        <Play size={14} /> Resume
                      </>
                    )}
                  </button>

                  <button
                    className="rd-action-btn skip"
                    onClick={() => handleSkipNext(sub._id)}
                    title="Skip only the next delivery cycle"
                  >
                    <SkipForward size={14} /> Skip Next
                  </button>

                  <button
                    className="rd-action-btn cancel"
                    onClick={() => setSubToCancel(sub)}
                    title="Cancel subscription"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Discover Repeat Delivery Essentials */}
      <div className="rd-essentials-section">
        <div className="rd-essentials-header">
          <div>
            <h2 className="rd-sec-title">Recommended Subscription Essentials</h2>
            <p className="rd-sec-sub">Popular daily household staples eligible for automatic scheduled delivery</p>
          </div>
        </div>

        <div className="rd-essentials-grid">
          {essentials.map((item) => (
            <div key={item._id || item.id} className="rd-essential-card">
              <img src={item.image} alt={item.name} className="rd-ess-thumb" />
              <div className="rd-ess-info">
                <span className="rd-ess-cat">{item.category}</span>
                <h4 className="rd-ess-title">{item.name}</h4>
                <div className="rd-ess-price-row">
                  <span className="rd-ess-price">
                    ₹{Math.round((item.price || 100) * 0.9).toLocaleString('en-IN')}
                  </span>
                  <span className="rd-ess-orig">₹{Number(item.price).toLocaleString('en-IN')}</span>
                  <span className="rd-ess-discount">10% OFF</span>
                </div>
                <button
                  className="rd-subscribe-now-btn"
                  onClick={() => {
                    setSelectedProductForModal(item);
                    setIsModalOpen(true);
                  }}
                >
                  <Plus size={14} /> Schedule Repeat
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subscription Modal */}
      {isModalOpen && selectedProductForModal && (
        <AddRepeatDeliveryModal
          isOpen={isModalOpen}
          product={selectedProductForModal}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedProductForModal(null);
          }}
          onSuccess={(createdSub) => {
            if (createdSub && createdSub._id) {
              setSubscriptions((prev) => [
                createdSub,
                ...prev.filter((s) => s._id !== createdSub._id)
              ]);
            }
            fetchSubscriptions();
            toast.success(`✓ "${selectedProductForModal?.name || 'Product'}" scheduled for Repeat Delivery!`);
          }}
        />
      )}

      {/* Custom Confirmation Modal for Canceling Subscription */}
      {subToCancel && (
        <div className="rep-modal-overlay" onClick={() => setSubToCancel(null)}>
          <div
            className="rep-modal-container rd-cancel-confirm-modal"
            style={{
              maxWidth: '420px',
              textAlign: 'center',
              padding: '28px 24px',
              background: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}
            >
              <AlertTriangle size={28} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
              Cancel Repeat Delivery?
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, margin: '0 0 22px' }}>
              Are you sure you want to cancel your scheduled subscription for <strong style={{ color: '#0f172a' }}>"{subToCancel.productName || subToCancel.productId?.name || 'this item'}"</strong>? Automatic dispatches will be stopped.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
                onClick={() => setSubToCancel(null)}
              >
                Keep Subscription
              </button>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#dc2626',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
                onClick={handleConfirmCancelSub}
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Catalog Product Picker Modal */}
      {isProductPickerOpen && (
        <div className="rep-modal-overlay" onClick={() => setIsProductPickerOpen(false)}>
          <div className="rep-modal-container rd-picker-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rep-modal-header">
              <div className="rep-header-title-wrap">
                <span className="rep-badge">🔄 Choose Item to Schedule</span>
                <h3 className="rep-modal-title">Select Product for Repeat Delivery</h3>
                <p className="rep-modal-subtitle">Pick any staple or household essential to automate regular delivery</p>
              </div>
              <button className="rep-close-btn" onClick={() => setIsProductPickerOpen(false)} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            {/* Search & Category Filter Bar */}
            <div className="rd-picker-filter-bar">
              <div className="rd-picker-search-wrap">
                <Search size={16} className="rd-picker-search-icon" />
                <input
                  type="text"
                  placeholder="Search products by name, brand, or category (e.g. Milk, Rice, Coffee)..."
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  className="rd-picker-search-input"
                  autoFocus
                />
              </div>

              <div className="rd-picker-cat-pills">
                {['All', 'Groceries & Dairy', 'Daily Essentials', 'Personal Care', 'Beverages'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`rd-picker-cat-pill ${pickerCategory === cat ? 'active' : ''}`}
                    onClick={() => setPickerCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Products List */}
            <div className="rd-picker-items-grid">
              {loadingCatalog ? (
                <div className="rd-picker-loading">
                  <RefreshCw size={24} className="spin" />
                  <span>Loading catalog items...</span>
                </div>
              ) : filteredPickerProducts.length === 0 ? (
                <div className="rd-picker-empty">
                  <PackageOpen size={36} color="#94a3b8" />
                  <p>No matching products found. Try a different search term.</p>
                </div>
              ) : (
                filteredPickerProducts.map((p) => {
                  const origPrice = Number(p.price || 0);
                  const subPrice = Math.round(origPrice * 0.9);
                  return (
                    <div key={p._id || p.id} className="rd-picker-item-card">
                      <img
                        src={p.image || (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120'}
                        alt={p.name}
                        className="rd-picker-thumb"
                      />
                      <div className="rd-picker-item-info">
                        <span className="rd-picker-item-cat">{p.category || 'Essential'}</span>
                        <h4 className="rd-picker-item-name">{p.name}</h4>
                        <div className="rd-picker-item-price-row">
                          <span className="rd-picker-sub-price">₹{subPrice.toLocaleString('en-IN')}</span>
                          <span className="rd-picker-orig-price">₹{origPrice.toLocaleString('en-IN')}</span>
                          <span className="rd-picker-discount-tag">10% OFF</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="rd-picker-select-btn"
                        onClick={() => {
                          setSelectedProductForModal(p);
                          setIsProductPickerOpen(false);
                          setIsModalOpen(true);
                        }}
                      >
                        <Plus size={14} /> Schedule
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

