import {
  CheckCircle2,
  Package,
  ShoppingBag,
  ArrowRight,
  Truck,
  Copy,
  Check,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Gift
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function OrderSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isConfirming, setIsConfirming] = useState(true);
  const [confirmationStage, setConfirmationStage] = useState("packing");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const stage1 = window.setTimeout(() => setConfirmationStage("shipping"), 600);
    const stage2 = window.setTimeout(() => setConfirmationStage("on-the-way"), 1200);
    const completeTimer = window.setTimeout(() => setIsConfirming(false), 1800);
    return () => {
      window.clearTimeout(stage1);
      window.clearTimeout(stage2);
      window.clearTimeout(completeTimer);
    };
  }, []);

  const savedOrder = sessionStorage.getItem("lastOrder");
  let orderData = location.state || null;

  if (!orderData && savedOrder) {
    try {
      orderData = JSON.parse(savedOrder);
    } catch {
      orderData = null;
    }
  }

  const orders = orderData?.orders || [];
  const total = Number(orderData?.total) || 0;
  const firstOrder = orders[0];
  const orderId = firstOrder?.orderId || (firstOrder?._id ? String(firstOrder._id).slice(-10).toUpperCase() : "ORD-SUCCESS");

  const copyOrderId = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isConfirming) {
    const stageContent = {
      packing: ["Preparing your order...", "Verifying order inventory with warehouse hubs"],
      shipping: ["Securing shipment manifest...", "Generating courier dispatch label"],
      "on-the-way": ["Finalizing order confirmation...", "Almost there!"]
    }[confirmationStage] || ["Processing...", "Please wait"];

    return (
      <div className="order-confirmation-loading" role="status" aria-live="polite">
        <div className="delivery-animation-track">
          <div className={`packing-box ${confirmationStage === "packing" ? "active" : "complete"}`}>
            <Package size={34} />
          </div>
          <div className={`delivery-animation-package ${confirmationStage === "shipping" ? "active" : ""}`}>
            <Package size={24} />
          </div>
          <div className={`delivery-animation-vehicle ${confirmationStage === "on-the-way" ? "active" : ""}`}>
            <Truck size={34} />
          </div>
        </div>
        <strong>{stageContent[0]}</strong>
        <span>{stageContent[1]}</span>
      </div>
    );
  }

  return (
    <div className="revamped-success-container">
      <div className="revamped-success-card">
        {/* CELEBRATION ICON */}
        <div className="success-check-badge">
          <CheckCircle2 size={56} strokeWidth={2.5} />
        </div>

        <span className="success-eyebrow">ORDER CONFIRMED</span>
        <h1>Thank you for your purchase!</h1>
        <p className="success-subtitle">
          Your order has been placed successfully and is being packed for dispatch.
        </p>

        {/* ORDER ID CHIP */}
        <div className="order-id-chip-row">
          <span className="order-id-label">Order Reference:</span>
          <strong className="order-id-code">#{orderId}</strong>
          <button
            type="button"
            className="copy-order-id-btn"
            onClick={copyOrderId}
            title="Copy Order ID"
          >
            {copied ? <Check size={14} className="copied-check" /> : <Copy size={14} />}
            <span>{copied ? "Copied!" : "Copy"}</span>
          </button>
        </div>

        {/* SUMMARY GRID */}
        <div className="success-details-grid">
          <div className="success-detail-box">
            <Calendar size={18} className="box-icon" />
            <div>
              <span className="detail-label">Order Date</span>
              <strong>{new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</strong>
            </div>
          </div>

          <div className="success-detail-box">
            <CreditCard size={18} className="box-icon" />
            <div>
              <span className="detail-label">Total Amount</span>
              <strong className="total-highlight">₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
            </div>
          </div>

          <div className="success-detail-box">
            <Truck size={18} className="box-icon" />
            <div>
              <span className="detail-label">Delivery Timeline</span>
              <strong>Within 3–5 Business Days</strong>
            </div>
          </div>

          <div className="success-detail-box">
            <Package size={18} className="box-icon" />
            <div>
              <span className="detail-label">Items Included</span>
              <strong>{orders.reduce((s, o) => s + (o.items?.length || 1), 0)} Product(s)</strong>
            </div>
          </div>
        </div>

        {/* EMAIL NOTIFICATION BANNER */}
        <div className="success-email-notice">
          <Mail size={18} />
          <div>
            <strong>Invoice &amp; Receipt Dispatched</strong>
            <p>A full digital tax invoice and live BlueDart tracking link have been dispatched to your email.</p>
          </div>
        </div>

        {/* REWARDS POINTS EARNED CELEBRATION BANNER */}
        <div className="success-rewards-earned-banner" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          border: '1px solid #f59e0b',
          borderRadius: '12px',
          padding: '16px 20px',
          margin: '20px 0',
          color: '#78350f',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
              <Gift size={22} />
            </div>
            <div>
              <strong style={{ fontSize: '15px', display: 'block', color: '#92400e' }}>
                🎉 You earned +25 Rewards Points for this order!
              </strong>
              <span style={{ fontSize: '13px', color: '#b45309' }}>
                Your updated wallet balance is 2,475 points (worth ₹247.50).
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/customer/rewards')}
            style={{
              background: '#92400e',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>View Rewards</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* CALL TO ACTIONS */}
        <div className="success-action-buttons">
          <button
            type="button"
            className="btn-track-orders"
            onClick={() => navigate("/customer/orders")}
          >
            <span>View in My Orders</span>
            <ArrowRight size={16} />
          </button>

          <button
            type="button"
            className="btn-continue-shopping"
            onClick={() => navigate("/customer")}
          >
            <ShoppingBag size={16} />
            <span>Continue Shopping</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrderSuccess;