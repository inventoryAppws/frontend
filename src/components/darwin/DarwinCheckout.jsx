import { useState } from 'react';
import { MapPin, CreditCard, Truck, CheckCircle2, ShieldCheck, ArrowRight, Package, Wallet, Banknote, Smartphone, Zap, Tag, Sparkles } from 'lucide-react';
import { executeDarwinAction } from '../../services/darwinService';
import { toast } from '../Toast';
import { useNavigate } from 'react-router-dom';

const PAYMENT_OPTIONS = [
  { id: 'upi', label: 'UPI', desc: 'GPay, PhonePe, Paytm', icon: Smartphone },
  { id: 'wallet', label: 'Wallet', desc: 'Store Balance', icon: Wallet },
  { id: 'cod', label: 'Cash on Delivery', desc: 'Pay when delivered', icon: Banknote },
  { id: 'card', label: 'Card', desc: 'Credit / Debit', icon: CreditCard }
];

export default function DarwinCheckout({
  checkoutSummary,
  onOrderPlaced,
  onCancel,
  onCloseDrawer
}) {
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);

  const {
    address,
    paymentMethod = 'upi',
    delivery = 'standard',
    deliveryFee = 0,
    items = [],
    subtotal = 0,
    discount = 0,
    couponDiscount = 0,
    couponCode = '',
    couponTitle = '',
    isSmartBuy = false,
    total = 0
  } = checkoutSummary || {};

  const effectiveDiscount = Number(couponDiscount || discount || 0);

  const [selectedPayment, setSelectedPayment] = useState(() => {
    if (typeof paymentMethod === 'string' && ['upi', 'wallet', 'cod', 'card'].includes(paymentMethod)) {
      return paymentMethod;
    }
    return paymentMethod?.type || 'upi';
  });

  if (!checkoutSummary) return null;

  const handleConfirmOrder = async () => {
    setPlacing(true);
    try {
      const res = await executeDarwinAction('confirmOrder', {
        addressId: address?._id,
        delivery,
        paymentMethod: selectedPayment,
        couponCode: couponCode || undefined,
        items: items.map((it) => ({
          productId: it.productId,
          qty: it.qty || 1
        }))
      });

      const orderData = res.order || (Array.isArray(res.orders) ? res.orders[0] : {});
      setPlacedOrder(orderData);
      toast.success('Order placed successfully!');
      if (onOrderPlaced) {
        onOrderPlaced(orderData);
      }
    } catch (err) {
      toast.error(err.message || 'Could not place order.');
    } finally {
      setPlacing(false);
    }
  };

  // SCREEN 8: ORDER PLACED SUCCESSFULLY
  if (placedOrder) {
    const orderDisplayId = placedOrder.orderId || String(placedOrder._id || '').slice(-10).toUpperCase();

    return (
      <div className="darwin-order-success-box">
        <div className="darwin-success-mascot-wrap">
          <img src="/darwin-mascot.png" alt="Order Success" className="darwin-success-mascot" />
          <div className="darwin-success-confetti-badge">🎉</div>
        </div>

        <h3 className="darwin-success-title">Order Placed Successfully!</h3>
        <p className="darwin-success-order-id">Order #{orderDisplayId}</p>

        <div className="darwin-success-delivery-notice">
          <Truck size={16} />
          <span>Your order will be delivered in 3–5 business days.</span>
        </div>

        <div className="darwin-success-note">
          <p>
            I'll keep an eye on your delivery and notify you about any updates. Relax, I've got it! 😊
          </p>
        </div>

        <div className="darwin-success-buttons">
          <button
            type="button"
            className="darwin-success-track-btn"
            onClick={() => {
              if (onCloseDrawer) onCloseDrawer();
              navigate('/customer/orders');
            }}
          >
            Track Order
          </button>
          <button
            type="button"
            className="darwin-success-continue-btn"
            onClick={() => {
              if (onCloseDrawer) onCloseDrawer();
              navigate('/customer');
            }}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  // SCREEN 7: IN-CHAT CHECKOUT CONFIRMATION
  return (
    <div className="darwin-checkout-card">
      <div className="darwin-checkout-head">
        <ShieldCheck size={18} className="darwin-checkout-shield" />
        <div>
          <h4>Review &amp; Confirm Order</h4>
          <p>Instant digital confirmation &amp; official invoice</p>
        </div>
      </div>

      {isSmartBuy && (
        <div className="darwin-smart-buy-banner">
          <div className="darwin-smart-buy-badge">
            <Zap size={14} fill="#f59e0b" color="#d97706" />
            <span>Smart Buy Applied</span>
          </div>
          <span className="darwin-smart-buy-desc">
            Auto-applied best coupon <strong>{couponCode}</strong> (Saved ₹{Number(effectiveDiscount).toLocaleString('en-IN')})
          </span>
        </div>
      )}

      {/* Address Block */}
      <div className="darwin-checkout-block">
        <div className="darwin-block-top">
          <div className="darwin-block-label">
            <MapPin size={15} />
            <span>Shipping Address</span>
          </div>
          <button
            type="button"
            className="darwin-block-change-link"
            onClick={() => navigate('/customer/details')}
          >
            Change
          </button>
        </div>
        {address ? (
          <div className="darwin-block-body">
            <strong>{address.fullName}</strong>
            <p>{address.addressLine1}, {address.city}, {address.state} - {address.pincode}</p>
            <small>Phone: {address.phone}</small>
          </div>
        ) : (
          <div className="darwin-block-empty">
            <span>Using your registered account profile address.</span>
          </div>
        )}
      </div>

      {/* Payment Block */}
      <div className="darwin-checkout-block">
        <div className="darwin-block-top">
          <div className="darwin-block-label">
            <CreditCard size={15} />
            <span>Payment Method</span>
          </div>
          <span className="darwin-secure-badge">100% Secure</span>
        </div>
        <div className="darwin-payment-method-selector">
          {PAYMENT_OPTIONS.map((opt) => {
            const isSelected = selectedPayment === opt.id;
            const OptIcon = opt.icon;
            return (
              <button
                key={opt.id}
                type="button"
                className={`darwin-pay-pill ${isSelected ? 'active' : ''}`}
                onClick={() => setSelectedPayment(opt.id)}
              >
                <OptIcon size={14} />
                <span className="pay-pill-label">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Delivery Speed Block */}
      <div className="darwin-checkout-block">
        <div className="darwin-block-top">
          <div className="darwin-block-label">
            <Truck size={15} />
            <span>Delivery Option</span>
          </div>
          <span className="darwin-delivery-badge">
            {delivery === 'express' ? '⚡ Priority Express (₹99)' : '⭐ Free Delivery'}
          </span>
        </div>
      </div>

      {/* Items Summary */}
      <div className="darwin-checkout-items">
        <span className="darwin-items-title">Items ({items.length}):</span>
        {items.map((it, idx) => (
          <div key={it.productId || idx} className="darwin-item-line">
            <span className="darwin-item-name">{it.name} (×{it.qty || 1})</span>
            <span className="darwin-item-price">₹{Number(it.lineTotal || it.price || 0).toLocaleString('en-IN')}</span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="darwin-checkout-totals">
        <div className="darwin-total-row">
          <span>Subtotal</span>
          <span>₹{Number(subtotal).toLocaleString('en-IN')}</span>
        </div>
        {effectiveDiscount > 0 && (
          <div className="darwin-total-row darwin-discount-row">
            <span className="darwin-coupon-tag-label">
              <Tag size={13} />
              <span>Coupon Discount {couponCode ? `(${couponCode})` : ''}</span>
            </span>
            <span className="darwin-discount-value">
              -₹{Number(effectiveDiscount).toLocaleString('en-IN')}
            </span>
          </div>
        )}
        <div className="darwin-total-row">
          <span>Delivery Fee</span>
          <span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
        </div>
        <div className="darwin-total-row final">
          <strong>Total Amount</strong>
          <strong className="darwin-final-amount">₹{Number(total).toLocaleString('en-IN')}</strong>
        </div>
      </div>

      {/* Final Confirmation Buttons */}
      <div className="darwin-checkout-actions">
        <button
          type="button"
          className="darwin-btn-confirm-order"
          onClick={handleConfirmOrder}
          disabled={placing}
        >
          {placing ? 'Placing Order...' : 'Confirm & Place Order'}
          {!placing && <ArrowRight size={16} />}
        </button>
        {onCancel && (
          <button
            type="button"
            className="darwin-btn-cancel-checkout"
            onClick={onCancel}
            disabled={placing}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
