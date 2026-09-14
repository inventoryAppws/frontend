/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Truck,
  CreditCard,
  ShoppingBag,
  Tag,
  ShieldCheck,
  RotateCcw,
  Package,
  Building2,
  Wallet,
  Smartphone,
  X,
  ChevronRight,
  Shield,
  Lock,
  Percent,
  Check
} from "lucide-react";
import { useNavigate, useOutletContext } from "react-router-dom";

import {
  getCart,
  checkoutCart,
} from "../../../services/cartService";
import { getAddresses } from "../../../services/addressService";

import CheckoutSkeleton from "../../../components/skeletons/CheckoutSkeleton";
import ErrorMessage from "../../../components/ErrorMessage";
import Modal from "../../../components/Modal";
import { getErrorMessage } from "../../../utils/errorHandler";

const AVAILABLE_COUPONS = [
  {
    code: "HUB10",
    label: "10% OFF on all products",
    description: "Maximum discount of up to ₹5,000",
    type: "percent",
    value: 10,
    cap: 5000,
  },
  {
    code: "SHOP50",
    label: "Flat ₹50 OFF on orders above ₹999",
    description: "Instant cart discount",
    type: "flat",
    value: 50,
    minimum: 999,
  },
  {
    code: "WELCOME100",
    label: "Flat ₹100 OFF on your first order",
    description: "Special welcome reward",
    type: "flat",
    value: 100,
  },
  {
    code: "FREESHIP",
    label: "Free shipping on orders above ₹499",
    description: "Zero delivery charges",
    type: "shipping",
    value: 0,
    minimum: 499,
  },
];

function CheckoutReview() {
  const navigate = useNavigate();
  const { goBack } = useOutletContext();

  const [items, setItems] = useState([]);
  const [address, setAddress] = useState(null);
  const [delivery, setDelivery] = useState("standard");
  const [payment, setPayment] = useState("upi");

  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");

  const [coupon, setCoupon] = useState(null);
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [couponOpen, setCouponOpen] = useState(false);

  const loadCheckoutData = async () => {
    setLoading(true);
    setError("");

    try {
      const buyNowItem = sessionStorage.getItem("buyNowItem");
      const cartData = buyNowItem ? null : await getCart();
      const cartItems = buyNowItem
        ? [JSON.parse(buyNowItem)]
        : Array.isArray(cartData) ? cartData : cartData?.items || [];

      if (cartItems.length === 0) {
        navigate("/customer/cart", { replace: true });
        return;
      }

      setItems(cartItems);

      const savedAddress = sessionStorage.getItem("checkoutAddress");
      const savedDelivery = sessionStorage.getItem("checkoutDelivery");
      const savedPayment = sessionStorage.getItem("checkoutPayment");

      let currentAddr = null;
      if (savedAddress) {
        try { currentAddr = JSON.parse(savedAddress); } catch { currentAddr = null; }
      }
      if (!currentAddr || !currentAddr._id) {
        try {
          const addrList = await getAddresses();
          if (Array.isArray(addrList) && addrList.length > 0) {
            currentAddr = addrList.find((a) => a.isDefault) || addrList[0];
            sessionStorage.setItem("checkoutAddress", JSON.stringify(currentAddr));
          }
        } catch {
          // non-blocking
        }
      }
      setAddress(currentAddr);

      if (savedDelivery) setDelivery(savedDelivery);
      if (savedPayment) {
        try {
          const parsed = JSON.parse(savedPayment);
          setPayment(parsed);
        } catch {
          setPayment({ paymentMethod: savedPayment });
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCheckoutData();
  }, []);

  const getDeliveryFee = () => (delivery === "express" ? 99 : 0);

  const subtotal = items.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    const qty = Number(item.qty) || 1;
    return sum + price * qty;
  }, 0);

  const deliveryFee = getDeliveryFee();
  const chargeableDeliveryFee = coupon?.type === "shipping" ? 0 : deliveryFee;
  const couponDiscount = coupon?.discount || 0;

  const total = Math.max(0, subtotal + chargeableDeliveryFee - couponDiscount);

  const calculateCouponDiscount = (selected) => {
    if (selected.minimum && subtotal < selected.minimum) return null;
    if (selected.type === "shipping") return deliveryFee;
    if (selected.type === "percent") {
      return Math.min(Math.round((subtotal * selected.value) / 100), selected.cap || Infinity);
    }
    return selected.value;
  };

  const handleApplyCoupon = (c) => {
    const target = c || AVAILABLE_COUPONS.find(x => x.code.toUpperCase() === couponCodeInput.trim().toUpperCase());
    if (!target) {
      setError("Invalid coupon code. Try HUB10 or SHOP50.");
      return;
    }
    const discount = calculateCouponDiscount(target);
    if (discount === null) {
      setError(`${target.code} requires a minimum order value of ₹${target.minimum}.`);
      return;
    }
    setCoupon({ ...target, discount });
    setCouponCodeInput("");
    setCouponOpen(false);
    setError("");
  };

  const handleRemoveCoupon = () => {
    setCoupon(null);
  };

  /* Payment Label Helpers */
  const selectedPaymentType = typeof payment === "string" ? payment : payment?.paymentMethod || "upi";
  const paymentSummary = typeof payment === "object" ? payment?.summary || {} : {};

  const getPaymentDetailsDisplay = () => {
    if (paymentSummary.detail) return paymentSummary.detail;
    if (selectedPaymentType === "upi") return payment?.newPaymentDetails?.upiId || "UPI Instant Payment";
    if (selectedPaymentType === "card") return `Card ending in ${payment?.newPaymentDetails?.cardNumber?.slice(-4) || "••••"}`;
    if (selectedPaymentType === "wallet") return "Store Wallet Payment";
    if (selectedPaymentType === "cod") return "Cash on Delivery";
    return "Online Payment";
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    if (!address?._id) {
      setError("Please select or save a delivery address before placing your order.");
      return;
    }

    setPlacingOrder(true);
    setError("");

    try {
      const checkoutItems = items.map((item) => ({
        productId: item.productId?._id || item.productId,
        qty: Number(item.qty || 1),
      }));

      const payload = {
        items: checkoutItems,
        addressId: address._id,
        deliveryMethod: delivery,
        paymentMethod: selectedPaymentType,
        secondaryPaymentMethod: payment?.secondaryPaymentMethod || "",
        secondaryPaymentMethodId: payment?.secondaryPaymentMethodId || payment?.savedMethodId || "",
        couponCode: coupon?.code || "",
        couponDiscount,
      };

      const response = await checkoutCart(payload);

      sessionStorage.removeItem("checkoutAddress");
      sessionStorage.removeItem("checkoutDelivery");
      sessionStorage.removeItem("checkoutPayment");
      sessionStorage.removeItem("buyNowItem");

      const createdOrders = response?.orders || response?.order || (Array.isArray(response) ? response : [response]);
      sessionStorage.setItem("lastOrder", JSON.stringify({ orders: Array.isArray(createdOrders) ? createdOrders : [createdOrders], total }));

      navigate("/customer/checkout/success", {
        state: { orders: Array.isArray(createdOrders) ? createdOrders : [createdOrders], total },
        replace: true
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return <CheckoutSkeleton />;
  }

  return (
    <div className="revamped-review-layout">
      {/* LEFT COLUMN: ORDER DETAILS */}
      <div className="revamped-review-main">
        {/* SECTION HEADER */}
        <div className="revamped-section-header">
          <div className="section-icon-badge">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <h2>Review Your Order</h2>
            <p>Please double-check your delivery address, shipping method, and items.</p>
          </div>
        </div>

        {error && (
          <div className="revamped-checkout-error">
            <X size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* 3 SUMMARY CARDS ROW */}
        <div className="review-essentials-grid">
          {/* 1. SHIPPING ADDRESS */}
          <div className="review-essential-card">
            <div className="essential-card-top">
              <div className="essential-icon-title">
                <MapPin size={17} className="essential-icon" />
                <strong>Shipping Address</strong>
              </div>
              <button
                type="button"
                className="essential-change-btn"
                onClick={() => navigate("/customer/checkout/address")}
              >
                Change
              </button>
            </div>
            {address ? (
              <div className="essential-card-content">
                <p className="recipient-name">{address.fullName}</p>
                <p className="address-body">
                  {address.addressLine1}
                  {address.addressLine2 ? `, ${address.addressLine2}` : ""}
                  <br />
                  {address.city}, {address.state} - {address.pincode}
                </p>
                <p className="phone-body">Phone: {address.phone}</p>
              </div>
            ) : (
              <p className="missing-notice">No address selected</p>
            )}
          </div>

          {/* 2. DELIVERY METHOD */}
          <div className="review-essential-card">
            <div className="essential-card-top">
              <div className="essential-icon-title">
                <Truck size={17} className="essential-icon" />
                <strong>Delivery Method</strong>
              </div>
              <button
                type="button"
                className="essential-change-btn"
                onClick={() => navigate("/customer/checkout/delivery")}
              >
                Change
              </button>
            </div>
            <div className="essential-card-content">
              <p className="recipient-name">
                {delivery === "express" ? "Priority Express Air" : "Standard Ground Delivery"}
              </p>
              <p className="address-body">
                {delivery === "express" ? "Delivered in 2–3 business days" : "Delivered in 4–6 business days"}
              </p>
              <span className={`speed-pill ${delivery}`}>
                {delivery === "express" ? "⚡ Express (₹99)" : "⭐ Free Delivery"}
              </span>
            </div>
          </div>

          {/* 3. PAYMENT METHOD */}
          <div className="review-essential-card">
            <div className="essential-card-top">
              <div className="essential-icon-title">
                <CreditCard size={17} className="essential-icon" />
                <strong>Payment Method</strong>
              </div>
              <button
                type="button"
                className="essential-change-btn"
                onClick={() => navigate("/customer/checkout/payment")}
              >
                Change
              </button>
            </div>
            <div className="essential-card-content">
              <p className="recipient-name">
                {paymentSummary?.label || (selectedPaymentType === "upi"
                  ? "UPI Instant"
                  : selectedPaymentType === "card"
                  ? "Credit/Debit Card"
                  : selectedPaymentType === "wallet"
                  ? "Store Wallet"
                  : selectedPaymentType === "cod"
                  ? "Cash on Delivery"
                  : "Net Banking")}
              </p>
              <p className="address-body">{getPaymentDetailsDisplay()}</p>
              <span className="payment-security-badge">
                <Lock size={11} /> 100% Secure
              </span>
            </div>
          </div>
        </div>

        {/* ORDERED ITEMS LIST */}
        <div className="review-items-container">
          <div className="items-header-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package size={18} />
              <strong>Items in this order ({items.length})</strong>
            </div>
            <button
              type="button"
              className="edit-cart-link"
              onClick={() => navigate("/customer/cart")}
            >
              Edit Cart
            </button>
          </div>

          <div className="items-table-list">
            {items.map((item, idx) => {
              const prod = item.productId || item;
              const name = prod.name || item.name || "Product";
              const price = Number(item.price || prod.price || 0);
              const qty = Number(item.qty || 1);
              const lineTotal = price * qty;
              const image = prod.image || prod.images?.[0] || item.image || "";

              return (
                <div key={item._id || idx} className="review-item-row">
                  <div className="item-thumb-box">
                    {image ? (
                      <img src={image} alt={name} />
                    ) : (
                      <ShoppingBag size={24} className="thumb-placeholder" />
                    )}
                  </div>

                  <div className="item-info-col">
                    <strong className="item-name">{name}</strong>
                    <div className="item-sub-tags">
                      {prod.category && <span className="cat-tag">{prod.category}</span>}
                      {prod.vendorName && <span className="vendor-tag">Sold by: {prod.vendorName}</span>}
                    </div>
                  </div>

                  <div className="item-qty-col">
                    <span className="qty-chip">Qty: {qty}</span>
                  </div>

                  <div className="item-price-col">
                    <strong>₹{lineTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
                    {qty > 1 && <small>₹{price.toLocaleString("en-IN")} each</small>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: STICKY ORDER SUMMARY */}
      <div className="revamped-review-sidebar">
        {/* COUPON CARD */}
        <div className="sidebar-coupon-card">
          <div className="coupon-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tag size={16} style={{ color: '#2563eb' }} />
              <strong>Promotions &amp; Coupons</strong>
            </div>
            <button
              type="button"
              className="view-coupons-btn"
              onClick={() => setCouponOpen(true)}
            >
              View Offers
            </button>
          </div>

          {coupon ? (
            <div className="coupon-active-badge">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} className="coupon-check-icon" />
                <div>
                  <strong>{coupon.code} APPLIED</strong>
                  <span>Saved ₹{coupon.discount?.toLocaleString("en-IN")} on this order</span>
                </div>
              </div>
              <button
                type="button"
                className="coupon-remove-btn"
                onClick={handleRemoveCoupon}
                title="Remove Coupon"
              >
                <X size={15} />
              </button>
            </div>
          ) : (
            <div className="coupon-input-group">
              <input
                type="text"
                placeholder="Enter coupon code (e.g. HUB10)"
                value={couponCodeInput}
                onChange={(e) => setCouponCodeInput(e.target.value)}
                className="coupon-text-input"
              />
              <button
                type="button"
                className="coupon-apply-btn"
                onClick={() => handleApplyCoupon()}
                disabled={!couponCodeInput.trim()}
              >
                Apply
              </button>
            </div>
          )}
        </div>

        {/* PRICE BREAKDOWN CARD */}
        <div className="sidebar-summary-card">
          <h3 className="summary-title">Order Summary</h3>

          <div className="summary-line-rows">
            <div className="summary-row">
              <span>Items Subtotal</span>
              <strong>₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
            </div>

            <div className="summary-row">
              <span>Delivery Fee</span>
              {chargeableDeliveryFee === 0 ? (
                <strong className="free-tag">FREE</strong>
              ) : (
                <strong>₹{chargeableDeliveryFee.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
              )}
            </div>

            {coupon && (
              <div className="summary-row discount">
                <span>Coupon Discount ({coupon.code})</span>
                <strong className="discount-tag">-₹{coupon.discount?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
              </div>
            )}

            <div className="summary-row">
              <span>Estimated GST &amp; Taxes</span>
              <strong className="tax-included">Included in price</strong>
            </div>

            <div className="summary-total-divider" />

            <div className="summary-total-row">
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="total-label">Total Amount</span>
                <span className="tax-subtext">(Inclusive of all taxes)</span>
              </div>
              <strong className="total-value">
                ₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </strong>
            </div>
          </div>

          {/* PRIMARY PLACE ORDER ACTION BUTTON */}
          <button
            type="button"
            className="place-order-cta-btn"
            onClick={handlePlaceOrder}
            disabled={placingOrder}
          >
            {placingOrder ? (
              <span className="placing-state">
                <div className="spinner-mini" /> Placing Order...
              </span>
            ) : (
              <span className="normal-state">
                <Lock size={17} /> Place Order &amp; Pay ₹{total.toLocaleString("en-IN")}
              </span>
            )}
          </button>

          {/* TRUST BADGES */}
          <div className="sidebar-trust-box">
            <div className="trust-item">
              <Shield size={15} />
              <span>Safe &amp; Secure Payments</span>
            </div>
            <div className="trust-item">
              <RotateCcw size={15} />
              <span>Easy 7-Day Returns</span>
            </div>
            <div className="trust-item">
              <CheckCircle2 size={15} />
              <span>100% Authentic Products</span>
            </div>
          </div>
        </div>
      </div>

      {/* AVAILABLE COUPONS MODAL */}
      <Modal
        isOpen={couponOpen}
        onClose={() => setCouponOpen(false)}
        title="Available Platform Coupons & Offers"
      >
        <div className="coupons-modal-list">
          {AVAILABLE_COUPONS.map((c) => (
            <div key={c.code} className="coupon-modal-item">
              <div className="coupon-modal-left">
                <div className="coupon-tag-code">
                  <Percent size={13} />
                  <span>{c.code}</span>
                </div>
                <strong className="coupon-modal-label">{c.label}</strong>
                <p className="coupon-modal-desc">{c.description}</p>
              </div>
              <button
                type="button"
                className="coupon-modal-apply"
                onClick={() => handleApplyCoupon(c)}
              >
                Apply Offer
              </button>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}

export default CheckoutReview;
