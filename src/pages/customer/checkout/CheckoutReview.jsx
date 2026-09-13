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
} from "lucide-react";
import { useNavigate, useOutletContext } from "react-router-dom";

import {
  getCart,
  checkoutCart,
} from "../../../services/cartService";

import Loader from "../../../components/Loader";
import ErrorMessage from "../../../components/ErrorMessage";
import Modal from "../../../components/Modal";

import { getErrorMessage } from "../../../utils/errorHandler";

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
  const [couponOpen, setCouponOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);

  const coupons = [
    {
      code: "HUB10",
      label: "10% off on all products",
      description: "Save up to ₹5,000",
      type: "percent",
      value: 10,
      cap: 5000,
    },
    {
      code: "SHOP50",
      label: "Flat ₹50 off on orders above ₹999",
      description: "Save ₹50 instantly",
      type: "flat",
      value: 50,
      minimum: 999,
    },
    {
      code: "WELCOME100",
      label: "Flat ₹100 off on your first order",
      description: "New customer offer",
      type: "flat",
      value: 100,
    },
    {
      code: "FREESHIP",
      label: "Free shipping on orders above ₹499",
      description: "Save on delivery",
      type: "shipping",
      value: 0,
      minimum: 499,
    },
  ];

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
        navigate("/customer/cart", {
          replace: true,
        });
        return;
      }

      setItems(cartItems);

      const savedAddress =
        sessionStorage.getItem("checkoutAddress");

      const savedDelivery =
        sessionStorage.getItem("checkoutDelivery");

      const savedPayment =
        sessionStorage.getItem("checkoutPayment");

      if (savedAddress) {
        try {
          setAddress(JSON.parse(savedAddress));
        } catch {
          setAddress(null);
        }
      }

      if (savedDelivery) {
        setDelivery(savedDelivery);
      }

      if (savedPayment) {
        try {
          const parsedPayment = JSON.parse(savedPayment);
          setPayment(parsedPayment);
        } catch {
          setPayment({
            paymentMethod: savedPayment,
            secondaryPaymentMethod: "",
          });
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

  const getDeliveryFee = () => {
    return delivery === "express" ? 99 : 0;
  };

  const subtotal = items.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    const qty = Number(item.qty) || 0;

    return sum + price * qty;
  }, 0);

  const deliveryFee = getDeliveryFee();

  const chargeableDeliveryFee =
    coupon?.type === "shipping" ? 0 : deliveryFee;

  const couponDiscount = coupon?.discount || 0;

  const total = Math.max(
    0,
    subtotal +
      chargeableDeliveryFee -
      couponDiscount
  );

  const deliveryLabel =
    delivery === "express"
      ? "Express Delivery"
      : "Standard Delivery";

  /* =========================
     PAYMENT DETAILS
  ========================= */

  const selectedPayment =
    typeof payment === "string"
      ? payment
      : payment?.paymentMethod || "upi";

  const paymentLabelMap = {
    upi: "UPI",
    card: "Credit / Debit Card",
    netbanking: "Net Banking",
    cod: "Cash on Delivery",
    wallet: "Wallet",
  };

  const paymentLabel =
    paymentLabelMap[selectedPayment] ||
    selectedPayment ||
    "UPI";

  const paymentSummary =
    typeof payment === "object"
      ? payment?.paymentSummary || {}
      : {};

  const getPaymentIcon = () => {
    if (selectedPayment === "upi") {
      return <Smartphone size={23} />;
    }

    if (selectedPayment === "card") {
      return <CreditCard size={23} />;
    }

    if (selectedPayment === "netbanking") {
      return <Building2 size={23} />;
    }

    if (selectedPayment === "wallet") {
      return <Wallet size={23} />;
    }

    return <CreditCard size={23} />;
  };

  const getPaymentProvider = () => {
    return (
      paymentSummary.provider ||
      paymentSummary.bankName ||
      paymentSummary.bank ||
      payment.bankName ||
      payment.bank ||
      payment.cardBank ||
      payment.walletName ||
      ""
    );
  };

  const getPaymentDetail = () => {
    if (paymentSummary.detail) {
      return paymentSummary.detail;
    }

    if (paymentSummary.description) {
      return paymentSummary.description;
    }

    if (selectedPayment === "upi") {
      return (
        payment.upiId ||
        payment.upi ||
        paymentSummary.upiId ||
        paymentSummary.upi ||
        "UPI payment"
      );
    }

    if (selectedPayment === "card") {
      const last4 =
        payment.last4 ||
        payment.cardLast4 ||
        paymentSummary.last4 ||
        paymentSummary.cardLast4;

      return last4
        ? `•••• •••• •••• ${last4}`
        : "Saved card";
    }

    if (selectedPayment === "netbanking") {
      const last4 =
        payment.accountLast4 ||
        payment.last4 ||
        paymentSummary.accountLast4 ||
        paymentSummary.last4;

      return last4
        ? `A/C ending ${last4}`
        : "Bank account";
    }

    if (selectedPayment === "wallet") {
      return (
        payment.walletBalance !== undefined
          ? `Available balance: ₹${Number(
              payment.walletBalance
            ).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}`
          : "Wallet payment"
      );
    }

    if (selectedPayment === "cod") {
      return "Pay when your order is delivered";
    }

    return "Payment details confirmed";
  };

  const getPaymentSecondaryDetail = () => {
    if (selectedPayment === "upi") {
      return (
        payment.upiId ||
        payment.upi ||
        paymentSummary.upiId ||
        paymentSummary.upi ||
        ""
      );
    }

    if (selectedPayment === "card") {
      const last4 =
        payment.last4 ||
        payment.cardLast4 ||
        paymentSummary.last4 ||
        paymentSummary.cardLast4;

      return last4 ? `Card ending ${last4}` : "";
    }

    if (selectedPayment === "netbanking") {
      return (
        payment.accountNumber ||
        payment.accountLast4 ||
        paymentSummary.accountLast4
          ? `A/C ending ${
              payment.accountLast4 ||
              paymentSummary.accountLast4
            }`
          : ""
      );
    }

    return "";
  };

  const paymentProvider = getPaymentProvider();
  const paymentDetail = getPaymentDetail();
  const paymentSecondary = getPaymentSecondaryDetail();

  /* =========================
     COUPON
  ========================= */

  const calculateCouponDiscount = (selected) => {
    if (
      selected.minimum &&
      subtotal < selected.minimum
    ) {
      return null;
    }

    if (selected.type === "percent") {
      return Math.min(
        Math.round(
          (subtotal * selected.value) / 100
        ),
        selected.cap || Infinity
      );
    }

    return selected.value;
  };

  const openCouponModal = () => {
    setSelectedCoupon(coupon);
    setCouponOpen(true);
    setError("");
  };

  const applySelectedCoupon = () => {
    if (!selectedCoupon) {
      setCoupon(null);
      setCouponOpen(false);
      return;
    }

    const discount =
      calculateCouponDiscount(selectedCoupon);

    if (discount === null) {
      setError(
        `${selectedCoupon.code} applies to orders above ₹${selectedCoupon.minimum}.`
      );
      return;
    }

    setCoupon({
      ...selectedCoupon,
      discount,
    });

    setCouponOpen(false);
    setError("");
  };

  const removeCoupon = () => {
    setCoupon(null);
    setSelectedCoupon(null);
  };

  /* =========================
     PLACE ORDER
  ========================= */

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (!address?._id) {
      setError(
        "Select or save a delivery address before placing the order."
      );
      return;
    }

    setPlacingOrder(true);
    setError("");

    try {
      const checkoutItems = items.map(
        (item) => ({
          productId: item.productId,
          qty: Number(item.qty),
        })
      );

      const response = await checkoutCart(
        checkoutItems,
        {
          addressId: address._id,
          deliveryMethod: delivery,
          paymentMethod:
            payment.paymentMethod || payment,
          savedMethodId:
            payment.savedMethodId || undefined,
          secondaryPaymentMethod:
            payment.secondaryPaymentMethod ||
            undefined,
          secondaryPaymentMethodId:
            payment.secondaryPaymentMethodId ||
            undefined,
          newPaymentDetails:
            payment.newPaymentDetails ||
            undefined,
          couponCode:
            coupon?.code || undefined,
          couponDiscount:
            coupon?.discount || 0,
        }
      );

      const orders = response?.orders || [];

      sessionStorage.setItem(
        "lastOrder",
        JSON.stringify({
          orders,
          address,
          delivery,
          payment,
          coupon,
          subtotal,
          deliveryFee,
          total,
        })
      );

      sessionStorage.removeItem(
        "checkoutAddress"
      );

      sessionStorage.removeItem(
        "checkoutDelivery"
      );

      sessionStorage.removeItem(
        "checkoutPayment"
      );
      sessionStorage.removeItem("buyNowItem");

      navigate(
        "/customer/checkout/success",
        {
          replace: true,
          state: {
            orders,
            address,
            delivery,
            payment,
            coupon,
            subtotal,
            deliveryFee,
            total,
          },
        }
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <Loader text="Preparing your order..." />
    );
  }

  return (
    <div className="checkout-layout">
      <div className="checkout-main-card review-main-card">

        {/* =========================
            PAGE HEADER
        ========================= */}

        <div className="checkout-section-heading">
          <div className="checkout-section-icon">
            <CheckCircle2 size={21} />
          </div>

          <div>
            <h2>Review Your Order</h2>
            <p>
              Check your details before placing
              the order.
            </p>
          </div>
        </div>

        <ErrorMessage
          message={error}
          onRetry={loadCheckoutData}
        />

        <div className="review-main-column">

          {/* =========================
              ORDER ITEMS — TOP
          ========================= */}

          <div className="review-section review-items-section">

            <div className="review-section-header">
              <div className="review-title">
                <ShoppingBag size={19} />
                <h3>Order Items</h3>
              </div>

              <span className="review-section-count">
                {items.length}{" "}
                {items.length === 1
                  ? "Item"
                  : "Items"}
              </span>
            </div>

            <div className="review-items">

              {items.map((item) => {
                const price =
                  Number(item.price) || 0;

                const qty =
                  Number(item.qty) || 0;

                const itemTotal =
                  price * qty;

                return (
                  <div
                    className="review-item"
                    key={
                      item.id ||
                      item._id ||
                      item.productId
                    }
                  >
                    <div className="review-item-icon">
                      {item.image ||
                      item.imageUrl ? (
                        <img
                          src={
                            item.image ||
                            item.imageUrl
                          }
                          alt=""
                        />
                      ) : (
                        <Package size={20} />
                      )}
                    </div>

                    <div className="review-item-details">
                      <strong>
                        {item.name || "Product"}
                      </strong>

                      <small>
                        Vendor:{" "}
                        {item.vendorName ||
                          "Unknown"}
                      </small>
                    </div>

                    <div className="review-item-qty">
                      Qty: {qty}
                    </div>

                    <strong className="review-item-price">
                      ₹{" "}
                      {itemTotal.toLocaleString(
                        "en-IN",
                        {
                          minimumFractionDigits: 2,
                        }
                      )}
                    </strong>
                  </div>
                );
              })}

            </div>

            <button
              type="button"
              className="review-edit-cart"
              onClick={() =>
                navigate("/customer/cart")
              }
            >
              Edit Cart
              <ChevronRight size={15} />
            </button>
          </div>

          {/* =========================
              ADDRESS
          ========================= */}

          <div className="review-section review-address-section">

            <div className="review-section-header">
              <div className="review-title">
                <MapPin size={18} />
                <h3>Delivery Address</h3>
              </div>

              <button
                type="button"
                className="review-change"
                onClick={() =>
                  navigate(
                    "/customer/checkout/address"
                  )
                }
              >
                Change
              </button>
            </div>

            {address ? (
              <div className="review-address">

                <strong>
                  {address.fullName}
                </strong>

                <p>
                  {address.addressLine1}
                  {address.addressLine2
                    ? `, ${address.addressLine2}`
                    : ""}
                </p>

                <p>
                  {address.city},{" "}
                  {address.state} -{" "}
                  {address.pincode}
                </p>

                <p>
                  Mobile: {address.phone}
                </p>

                <span className="address-badge">
                  {address.type}
                </span>

              </div>
            ) : (
              <div className="review-missing">
                Address not selected.
              </div>
            )}
          </div>

          {/* =========================
              DELIVERY
          ========================= */}

          <div className="review-section review-delivery-section">

            <div className="review-section-header">
              <div className="review-title">
                <Truck size={18} />
                <h3>Delivery</h3>
              </div>

              <button
                type="button"
                className="review-change"
                onClick={() =>
                  navigate(
                    "/customer/checkout/delivery"
                  )
                }
              >
                Change
              </button>
            </div>

            <div className="review-simple-row">

              <div className="review-delivery-info">

                <div className="review-mini-icon">
                  <Package size={20} />
                </div>

                <div>
                  <strong>
                    {deliveryLabel}
                  </strong>

                  <p>
                    {delivery === "express"
                      ? "Delivery within 2–3 days"
                      : "Delivery within 4–6 days"}
                  </p>
                </div>
              </div>

              <strong
                className={
                  deliveryFee === 0
                    ? "free-label"
                    : ""
                }
              >
                {deliveryFee === 0
                  ? "FREE"
                  : `₹${deliveryFee.toFixed(
                      2
                    )}`}
              </strong>
            </div>
          </div>

          {/* =========================
              PAYMENT
          ========================= */}

          <div className="review-section review-payment-section">

            <div className="review-section-header">
              <div className="review-title">
                <CreditCard size={18} />
                <h3>Payment</h3>
              </div>

              <button
                type="button"
                className="review-change"
                onClick={() =>
                  navigate(
                    "/customer/checkout/payment"
                  )
                }
              >
                Change
              </button>
            </div>

            <div className="review-payment-card">

              <div className="review-payment-icon">
                {getPaymentIcon()}
              </div>

              <div className="review-payment-info">

                <strong>
                  {paymentLabel}
                </strong>

                {paymentProvider && (
                  <span>
                    {paymentProvider}
                  </span>
                )}

                <small>
                  {paymentDetail}
                </small>

                {paymentSecondary &&
                  paymentSecondary !==
                    paymentDetail && (
                    <small>
                      {paymentSecondary}
                    </small>
                  )}

              </div>

            </div>
          </div>

          {/* =========================
              COUPON
          ========================= */}

          <div className="review-section review-coupon-section">

            <div className="review-section-header">

              <div className="review-title">
                <Tag size={18} />
                <h3>Apply Coupon</h3>
              </div>

              <button
                type="button"
                className="review-coupon-button"
                onClick={openCouponModal}
              >
                {coupon
                  ? "Change"
                  : "Apply Coupon"}
              </button>
            </div>

            <p className="review-coupon-description">
              Save more with exciting offers
              and coupons.
            </p>

            {coupon && (
              <div className="review-coupon-applied">

                <div className="coupon-applied-left">

                  <div className="coupon-success-icon">
                    <CheckCircle2 size={17} />
                  </div>

                  <div>
                    <strong>
                      {coupon.code} Applied
                    </strong>

                    <span>
                      You saved ₹{" "}
                      {coupon.discount.toLocaleString(
                        "en-IN"
                      )}
                      {coupon.type ===
                        "percent" &&
                        ` (${coupon.value}% off)`}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="coupon-remove-button"
                  aria-label="Remove coupon"
                  onClick={removeCoupon}
                >
                  <X size={15} />
                </button>
              </div>
            )}
          </div>

          {/* =========================
              BOTTOM NAVIGATION
          ========================= */}

          <div className="checkout-navigation">

            <button
              type="button"
              className="btn btn-secondary"
              onClick={goBack}
              disabled={placingOrder}
            >
              <ArrowLeft size={17} />
              Back
            </button>

            <button
              type="button"
              className="btn btn-primary checkout-place-order"
              onClick={handlePlaceOrder}
              disabled={placingOrder}
            >
              {placingOrder
                ? "Placing Order..."
                : "Place Order"}
            </button>
          </div>
        </div>

        {/* =========================
            SIDEBAR
        ========================= */}

        <aside className="review-sidebar">

          {/* ORDER SUMMARY */}

          <section className="review-summary-card">

            <div className="review-sidebar-title">
              <ShoppingBag size={18} />
              <h3>Order Summary</h3>
            </div>

            <div className="review-summary-line">
              <span>
                Subtotal ({items.length} items)
              </span>

              <strong>
                ₹{" "}
                {subtotal.toLocaleString(
                  "en-IN",
                  {
                    minimumFractionDigits: 2,
                  }
                )}
              </strong>
            </div>

            {coupon && (
              <div className="review-summary-line discount">

                <span>
                  {coupon.code} Discount
                </span>

                <strong>
                  − ₹{" "}
                  {coupon.discount.toLocaleString(
                    "en-IN",
                    {
                      minimumFractionDigits: 2,
                    }
                  )}
                </strong>
              </div>
            )}

            <div className="review-summary-line">
              <span>Delivery</span>

              <strong className="free-label">
                {chargeableDeliveryFee === 0
                  ? "FREE"
                  : `₹${chargeableDeliveryFee.toFixed(
                      2
                    )}`}
              </strong>
            </div>

            <div className="review-summary-total">
              <span>Total Amount</span>

              <strong>
                ₹{" "}
                {total.toLocaleString(
                  "en-IN",
                  {
                    minimumFractionDigits: 2,
                  }
                )}
              </strong>
            </div>

            {coupon && (
              <div className="review-saving-note">
                <Tag size={16} />

                <span>
                  You are saving ₹{" "}
                  {coupon.discount.toLocaleString(
                    "en-IN"
                  )}
                  !
                </span>
              </div>
            )}
          </section>

          {/* TRUST */}

          <section className="review-trust-card">

            <div className="review-sidebar-title">
              <ShieldCheck size={18} />
              <h3>Why shop with us?</h3>
            </div>

            <div className="review-trust-row">

              <div className="trust-icon">
                <ShieldCheck size={19} />
              </div>

              <div>
                <strong>
                  Secure Payments
                </strong>

                <span>
                  Your transactions are safe
                  with us
                </span>
              </div>
            </div>

            <div className="review-trust-row">

              <div className="trust-icon">
                <RotateCcw size={19} />
              </div>

              <div>
                <strong>
                  Easy Returns
                </strong>

                <span>
                  Hassle-free return policy
                </span>
              </div>
            </div>

            <div className="review-trust-row">

              <div className="trust-icon">
                <Truck size={19} />
              </div>

              <div>
                <strong>
                  Reliable Delivery
                </strong>

                <span>
                  On-time delivery across
                  India
                </span>
              </div>
            </div>
          </section>
        </aside>
      </div>

      {/* =========================
          COUPON MODAL
      ========================= */}

      <Modal
        isOpen={couponOpen}
        onClose={() => setCouponOpen(false)}
        title="Available Coupons"
        size="medium"
      >
        <div className="coupon-modal-content">

          <div className="coupon-modal-header">
            <div className="coupon-modal-icon">
              <Tag size={20} />
            </div>

            <div>
              <h4>
                Choose an offer
              </h4>

              <p>
                Select the best coupon for
                your order.
              </p>
            </div>
          </div>

          <div className="coupon-options">

            {coupons.map((option) => {
              const discount =
                calculateCouponDiscount(
                  option
                );

              const unavailable =
                discount === null;

              const isSelected =
                selectedCoupon?.code ===
                option.code;

              return (
                <button
                  type="button"
                  key={option.code}
                  className={`coupon-option ${
                    isSelected
                      ? "selected"
                      : ""
                  } ${
                    unavailable
                      ? "unavailable"
                      : ""
                  }`}
                  onClick={() => {
                    if (!unavailable) {
                      setSelectedCoupon(
                        option
                      );
                      setError("");
                    }
                  }}
                  disabled={unavailable}
                >
                  <span
                    className={`coupon-radio ${
                      isSelected
                        ? "checked"
                        : ""
                    }`}
                  >
                    {isSelected && (
                      <span />
                    )}
                  </span>

                  <span className="coupon-option-content">

                    <strong>
                      {option.code}
                    </strong>

                    <small>
                      {option.label}
                    </small>

                    <em>
                      {unavailable
                        ? `Minimum order ₹${option.minimum}`
                        : option.description}
                    </em>
                  </span>

                  <b
                    className={`coupon-offer-badge ${
                      option.type ===
                      "shipping"
                        ? "shipping"
                        : ""
                    }`}
                  >
                    {option.type ===
                    "percent"
                      ? `${option.value}% OFF`
                      : option.type ===
                        "shipping"
                      ? "FREE DELIVERY"
                      : `₹${option.value} OFF`}
                  </b>
                </button>
              );
            })}
          </div>

          <div className="coupon-modal-actions">

            <button
              type="button"
              className="coupon-cancel-button"
              onClick={() =>
                setCouponOpen(false)
              }
            >
              Cancel
            </button>

            <button
              type="button"
              className="coupon-apply-button"
              disabled={!selectedCoupon}
              onClick={
                applySelectedCoupon
              }
            >
              Apply Coupon
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default CheckoutReview;
