import { useState } from 'react';
import { Package, Truck, ExternalLink, ChevronRight, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DarwinOrdersList({
  orders = [],
  onTrackOrder,
  onCloseDrawer
}) {
  const navigate = useNavigate();
  const [imgErrors, setImgErrors] = useState({});

  if (!Array.isArray(orders) || orders.length === 0) {
    return (
      <div className="darwin-orders-empty">
        <Package size={32} strokeWidth={1.3} />
        <p>No recent orders found in your account.</p>
      </div>
    );
  }

  const getStatusBadge = (status = 'placed') => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return { label: 'Delivered', className: 'status-delivered', icon: CheckCircle2 };
      case 'out_for_delivery':
        return { label: 'Out for Delivery', className: 'status-out', icon: Truck };
      case 'shipped':
        return { label: 'Shipped', className: 'status-shipped', icon: Truck };
      case 'packed':
      case 'processing':
        return { label: 'Processing', className: 'status-packed', icon: Clock };
      case 'cancelled':
        return { label: 'Cancelled', className: 'status-cancelled', icon: AlertCircle };
      case 'placed':
      default:
        return { label: 'Order Placed', className: 'status-placed', icon: CheckCircle2 };
    }
  };

  const handleOpenOrdersPage = () => {
    if (onCloseDrawer) onCloseDrawer();
    navigate('/customer/orders');
  };

  return (
    <div className="darwin-orders-list-container">
      <div className="darwin-orders-list-head">
        <div className="darwin-orders-head-title">
          <Package size={16} />
          <span>Recent Orders ({orders.length})</span>
        </div>
        <button
          type="button"
          className="darwin-orders-view-all-btn"
          onClick={handleOpenOrdersPage}
        >
          <span>All Orders</span>
          <ChevronRight size={13} />
        </button>
      </div>

      <div className="darwin-orders-cards-stack">
        {orders.map((ord, idx) => {
          const badge = getStatusBadge(ord.status);
          const BadgeIcon = badge.icon;
          const items = Array.isArray(ord.items) ? ord.items : [];
          const formattedDate = ord.placedAt
            ? new Date(ord.placedAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })
            : 'Recent';

          return (
            <div key={ord._id || ord.orderId || idx} className="darwin-order-card">
              {/* Order Card Header */}
              <div className="darwin-order-card-header">
                <div className="darwin-order-id-group">
                  <span className="darwin-order-number">#{ord.orderId}</span>
                  <span className="darwin-order-date">{formattedDate}</span>
                </div>
                <div className={`darwin-order-status-pill ${badge.className}`}>
                  <BadgeIcon size={12} />
                  <span>{badge.label}</span>
                </div>
              </div>

              {/* Items in this Order */}
              <div className="darwin-order-items-list">
                {items.map((item, itemIdx) => {
                  const itemKey = `${ord.orderId}-${itemIdx}`;
                  const hasImgError = Boolean(imgErrors[itemKey]);

                  return (
                    <div key={itemIdx} className="darwin-order-item-row">
                      <div className="darwin-order-item-thumb">
                        {item.image && !hasImgError ? (
                          <img
                            src={item.image}
                            alt=""
                            onError={() => setImgErrors((prev) => ({ ...prev, [itemKey]: true }))}
                            style={{ color: 'transparent' }}
                          />
                        ) : null}
                        <div
                          className="darwin-order-thumb-fallback"
                          style={{ display: item.image && !hasImgError ? 'none' : 'flex' }}
                        >
                          <Package size={16} strokeWidth={1.4} />
                        </div>
                      </div>

                      <div className="darwin-order-item-details">
                        <strong className="darwin-order-item-name" title={item.name}>
                          {item.name || 'Purchased Item'}
                        </strong>
                        <div className="darwin-order-item-meta">
                          <span>Qty: {item.qty || 1}</span>
                          <span className="meta-dot">•</span>
                          <span>₹{Number(item.price || 0).toLocaleString('en-IN')}</span>
                          {item.vendorName && (
                            <>
                              <span className="meta-dot">•</span>
                              <span className="vendor-name">{item.vendorName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Order Footer */}
              <div className="darwin-order-card-footer">
                <div className="darwin-order-total-block">
                  <span className="darwin-order-total-label">Total Amount</span>
                  <span className="darwin-order-total-val">
                    ₹{Number(ord.totalAmount || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="darwin-order-pay-method">
                    via {String(ord.paymentMethod || 'Online').toUpperCase()}
                  </span>
                </div>

                <div className="darwin-order-actions-block">
                  <button
                    type="button"
                    className="darwin-order-track-btn"
                    onClick={() => onTrackOrder && onTrackOrder(ord.orderId)}
                  >
                    <Truck size={13} />
                    <span>Track Order</span>
                  </button>
                  <button
                    type="button"
                    className="darwin-order-details-link"
                    onClick={handleOpenOrdersPage}
                  >
                    <ExternalLink size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

