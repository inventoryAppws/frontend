import { Truck, CheckCircle2, Clock, Package, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DarwinOrderTracker({ order, onCloseDrawer }) {
  const navigate = useNavigate();

  if (!order) return null;

  const {
    orderId,
    status = 'placed',
    estimatedDelivery,
    totalAmount,
    items = [],
    timeline = []
  } = order;

  const firstItem = items[0] || {};
  const itemCount = items.length;

  const handleOpenFullTracking = () => {
    if (onCloseDrawer) onCloseDrawer();
    navigate(`/customer/orders`);
  };

  return (
    <div className="darwin-order-tracker-card">
      {/* Top Banner: Estimated Delivery */}
      <div className="darwin-tracker-top-banner">
        <div className="darwin-tracker-truck-icon">
          <Truck size={18} />
        </div>
        <div>
          <span className="darwin-tracker-est-label">Estimated Delivery</span>
          <h4 className="darwin-tracker-est-date">{estimatedDelivery || 'In 3-4 Business Days'}</h4>
        </div>
        <div className="darwin-tracker-order-badge">
          <span>#{orderId}</span>
        </div>
      </div>

      {/* Item Summary Row */}
      <div className="darwin-tracker-item-row">
        {firstItem.image ? (
          <img
            src={firstItem.image}
            alt=""
            className="darwin-tracker-thumb"
            style={{ color: 'transparent' }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.parentElement?.querySelector('.darwin-tracker-thumb-fallback');
              if (fallback) fallback.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className="darwin-tracker-thumb-fallback"
          style={{
            display: firstItem.image ? 'none' : 'flex',
            width: '44px',
            height: '44px',
            borderRadius: '8px',
            background: '#f1f5f9',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <Package size={20} />
        </div>
        <div className="darwin-tracker-item-info">
          <strong>{firstItem.name || 'Order Item'}</strong>
          <p>
            Qty: {firstItem.qty || 1}
            {itemCount > 1 && ` (+${itemCount - 1} other item${itemCount > 2 ? 's' : ''})`}
          </p>
          <span className="darwin-tracker-total">₹{Number(totalAmount || 0).toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Timeline Stepper */}
      <div className="darwin-tracker-timeline">
        {timeline.map((step, idx) => {
          const isLast = idx === timeline.length - 1;
          const statusClass = step.completed ? 'completed' : step.current ? 'current' : 'pending';

          return (
            <div key={step.key} className={`darwin-timeline-step ${statusClass}`}>
              <div className="darwin-step-marker">
                {step.completed ? (
                  <CheckCircle2 size={16} className="marker-icon completed" />
                ) : step.current ? (
                  <Clock size={16} className="marker-icon current" />
                ) : (
                  <div className="marker-dot" />
                )}
                {!isLast && <div className="darwin-step-line" />}
              </div>

              <div className="darwin-step-content">
                <span className="darwin-step-title">{step.label}</span>
                {step.time && (
                  <span className="darwin-step-time">
                    {new Date(step.time).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action to open full tracking */}
      <button
        type="button"
        className="darwin-tracker-view-btn"
        onClick={handleOpenFullTracking}
      >
        <span>View Order Details &amp; Live Tracking</span>
        <ChevronRight size={15} />
      </button>
    </div>
  );
}

