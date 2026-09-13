import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  FileText,
  Headphones,
  MapPin,
  Package,
  RotateCcw,
  Truck,
  Gift,
  ExternalLink,
  Ban,
  ShieldCheck,
  RefreshCw,
  Wallet,
  Store,
  Info
} from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getCustomerOrders, cancelOrderReturn } from "../../services/orderService";
import { getReturns } from "../../services/returnService";
import { toast } from "../../components/Toast";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";
import { getErrorMessage } from "../../utils/errorHandler";
import { formatDate, formatDateTime } from "../../utils/dateFormatter";

function formatShortDate(dateVal) {
  if (!dateVal) return "—";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "—";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}, ${d.getFullYear()}`;
}

function formatTime(dateVal) {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// 1. Delivery Stages (Standard Order)
const DELIVERY_STAGES = [
  ["placed", "Order Placed", Check, 0],
  ["packed", "Packed", Package, 12],
  ["shipped", "Shipped", Truck, 24],
  ["out_for_delivery", "Out for Delivery", MapPin, 36],
  ["delivered", "Delivered", Gift, 48]
];

// 2. Return & Refund Stages (24-Hour Cycle)
const RETURN_STAGES = [
  ["requested", "Return Requested", RotateCcw, 0],
  ["pickup_confirmed", "Pickup Confirmed", Truck, 4],
  ["item_received", "Item Received", Package, 8],
  ["quality_passed", "Quality Check Passed", ShieldCheck, 14],
  ["refund_initiated", "Refund Initiated", RefreshCw, 19],
  ["refund_credited", "Refund Credited", Wallet, 24]
];

// 3. Cancellation & Refund Stages (24-Hour Cycle)
const CANCELLATION_STAGES = [
  ["requested", "Cancellation Confirmed", Ban, 0],
  ["inventory_restored", "Merchant & Stock Restored", Store, 6],
  ["refund_initiated", "Refund Initiated", RefreshCw, 14],
  ["refund_credited", "Refund Credited", Wallet, 24]
];

function TrackOrder() {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId } = useParams();
  const [order, setOrder] = useState(location.state?.order || null);
  const [returnRecord, setReturnRecord] = useState(null);
  const [loading, setLoading] = useState(!order);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const [ordersData, returnsData] = await Promise.allSettled([
          getCustomerOrders(),
          getReturns()
        ]);

        const ordersList = ordersData.status === "fulfilled"
          ? (Array.isArray(ordersData.value) ? ordersData.value : ordersData.value?.items || [])
          : [];

        const returnsList = returnsData.status === "fulfilled"
          ? (Array.isArray(returnsData.value?.items) ? returnsData.value.items : [])
          : [];

        const foundOrder = ordersList.find(
          (item) => String(item.orderId || item._id) === orderId
        );

        if (active && foundOrder) {
          setOrder(foundOrder);
          const foundRet = returnsList.find(
            (r) => String(r.orderId || r.orderRef?._id || r.orderRef) === String(foundOrder.orderId || foundOrder._id)
          );
          if (foundRet) setReturnRecord(foundRet);
        } else if (active) {
          setError("Order could not be found.");
        }
      } catch (err) {
        if (active) setError(getErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => { active = false; };
  }, [orderId]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Determine Tracking Flow Type
  const trackingMode = useMemo(() => {
    const statusLower = String(order?.status || "").toLowerCase();
    const returnStatusLower = String(order?.returnStatus || "").toLowerCase();
    if (returnRecord?.type === "return" || statusLower === "returned" || statusLower === "return_requested" || (returnStatusLower && returnStatusLower !== "none")) {
      return "return";
    }
    if (returnRecord?.type === "cancellation" || statusLower === "cancelled") {
      return "cancellation";
    }
    return "delivery";
  }, [order, returnRecord]);

  // Active Stages & Interval configuration
  const activeStages = useMemo(() => {
    if (trackingMode === "return") return RETURN_STAGES;
    if (trackingMode === "cancellation") return CANCELLATION_STAGES;
    return DELIVERY_STAGES;
  }, [trackingMode]);

  // Compute Current Stage Index & Timestamps
  const tracking = useMemo(() => {
    const clock = now || Date.now();
    const startTime = new Date(returnRecord?.requestedAt || order?.placedAt || order?.createdAt || clock).getTime();
    const elapsedHours = Math.max(0, (clock - startTime) / (3600 * 1000));

    let currentIndex = 0;
    const isCompletedFinal =
      (trackingMode === "return" && (returnRecord?.status === "refund_credited" || order?.status === "returned")) ||
      (trackingMode === "cancellation" && (returnRecord?.status === "refund_credited" || returnRecord?.refundStatus === "credited"));

    if (isCompletedFinal || (trackingMode !== "delivery" && elapsedHours >= 24)) {
      currentIndex = activeStages.length - 1;
    } else {
      for (let i = 0; i < activeStages.length; i++) {
        if (elapsedHours >= activeStages[i][3]) {
          currentIndex = i;
        }
      }
    }

    // Match status directly if server provides exact status string
    const serverStatus = String(returnRecord?.status || order?.status || "").toLowerCase();
    const serverIdx = activeStages.findIndex(([id]) => id === serverStatus);
    if (serverIdx > currentIndex) {
      currentIndex = serverIdx;
    }

    const nextStage = currentIndex < activeStages.length - 1 ? activeStages[currentIndex + 1] : null;
    const nextTransitionTime = nextStage
      ? new Date(startTime + nextStage[3] * 3600 * 1000)
      : null;

    const finalEstimatedTime = new Date(
      startTime + (trackingMode === "delivery" ? 48 : 24) * 3600 * 1000
    );

    return {
      currentIndex,
      startTime: new Date(startTime),
      estimated: finalEstimatedTime,
      nextTransitionTime,
      isCompleted: currentIndex === activeStages.length - 1
    };
  }, [order, returnRecord, activeStages, trackingMode, now]);

  if (loading) return <Loader text="Loading tracking details..." />;
  if (!order) {
    return (
      <div className="track-order-page">
        <ErrorMessage message={error || "Order could not be found."} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  const orderItems = Array.isArray(order.items) && order.items.length > 0
    ? order.items
    : [
        {
          name: typeof order.productId === "object" ? order.productId.name : order.name || "Product Item",
          vendorName: typeof order.vendorId === "object" ? order.vendorId.name : order.vendorName || "Verified Vendor",
          qty: order.qty || 1,
          price: order.price || order.totalAmount || 0,
          image: order.productId?.image || order.image || ""
        }
      ];

  const address = order.shippingAddress || {};
  const payment = order.paymentMethod ? String(order.paymentMethod).toUpperCase() : "UPI / ONLINE";
  const currentStageLabel = activeStages[tracking.currentIndex][1];
  const backPath = location.state?.from || "/customer/orders";

  const totalAmount = Number(order.totalAmount || orderItems.reduce((s, i) => s + Number(i.price || 0) * Number(i.qty || 1), 0));
  const refundAmount = Number(returnRecord?.refundAmount || totalAmount);

  // Time Countdown
  const remainingMs = tracking.nextTransitionTime ? Math.max(0, tracking.nextTransitionTime.getTime() - now) : 0;
  const countdown = remainingMs < 60 * 60 * 1000
    ? `${Math.ceil(remainingMs / 60000)} min`
    : `${Math.ceil(remainingMs / (60 * 60 * 1000))} hrs`;

  // Scene & Hero Config
  const sceneConfig = {
    delivery: {
      bgImage: "/track-order-scene.png",
      fallbackBg: "/track-order-scene.svg",
      eyebrow: "ORDER DELIVERY TRACKING",
      title: "Track Your Order",
      subtitle: "Follow your order journey from our warehouse to your doorstep.",
      statusBadge: currentStageLabel,
      badgeClass: "track-status-badge delivery",
      arrivalTitle: "Estimated Delivery",
      arrivalSub: tracking.isCompleted ? "Delivered" : `Next step in ${countdown}`,
      partnerTitle: "Delivery Partner",
      partnerName: "ShopHub Express Logistics",
      partnerDesc: `Tracking ID: ${order.orderId || order._id}`,
      noteText: "We'll notify you when your order is out for delivery."
    },
    return: {
      bgImage: "/track-return-scene.svg",
      fallbackBg: "/track-return-scene.svg",
      eyebrow: "RETURN & REFUND TRACKING",
      title: "Track Return & Refund",
      subtitle: "Follow your return from doorstep pickup to quality check and wallet refund.",
      statusBadge: tracking.isCompleted ? "REFUND CREDITED" : "RETURN IN PROGRESS",
      badgeClass: "track-status-badge return",
      arrivalTitle: "Estimated Full Refund",
      arrivalSub: tracking.isCompleted ? "Credited to Wallet" : `Next update in ${countdown}`,
      partnerTitle: "Return Pickup Partner",
      partnerName: "ShopHub Reverse Courier",
      partnerDesc: `Return ID: ${returnRecord?.returnId || "RET-" + String(order._id).slice(-8).toUpperCase()}`,
      noteText: "Doorstep quality inspection & instant wallet refund within 24 hours."
    },
    cancellation: {
      bgImage: "/track-cancel-scene.svg",
      fallbackBg: "/track-cancel-scene.svg",
      eyebrow: "CANCELLATION & REFUND TRACKING",
      title: "Track Cancellation & Refund",
      subtitle: "Order cancellation confirmed and automated 24-hour wallet refund processing.",
      statusBadge: tracking.isCompleted ? "REFUND CREDITED" : "CANCELLED",
      badgeClass: "track-status-badge cancelled",
      arrivalTitle: "Refund Timeline",
      arrivalSub: tracking.isCompleted ? "Credited to Wallet" : `Next update in ${countdown}`,
      partnerTitle: "Refund Processing Service",
      partnerName: "ShopHub Automated Gateway",
      partnerDesc: `Order #${order.orderId || order._id}`,
      noteText: "Amount will be automatically credited to your Wallet upon verification."
    }
  }[trackingMode];

  return (
    <div className="track-order-page">
      {/* PAGE HEADING */}
      <div className="track-page-heading">
        <button className="track-back-button" onClick={() => navigate(backPath)} aria-label="Back to orders">
          <ArrowLeft size={20} />
        </button>
        <div>
          <span className="cart-eyebrow">{sceneConfig.eyebrow}</span>
          <h1>{sceneConfig.title}</h1>
          <p>{sceneConfig.subtitle}</p>
        </div>
        <button className="btn btn-outline track-help-button">
          <Headphones size={16} /> Need Help?
        </button>
      </div>

      {/* TOP JOURNEY CARD */}
      <section className="track-journey-card">
        <div className="track-journey-top">
          <div>
            <strong>Order #{order.orderId || order._id}</strong>
            <span className={sceneConfig.badgeClass}>{sceneConfig.statusBadge}</span>
            <small>
              {trackingMode === "return"
                ? `Requested on ${formatShortDate(tracking.startTime)}, ${formatTime(tracking.startTime)}`
                : trackingMode === "cancellation"
                ? `Cancelled on ${formatShortDate(tracking.startTime)}, ${formatTime(tracking.startTime)}`
                : `Placed on ${formatShortDate(tracking.startTime)}, ${formatTime(tracking.startTime)}`}
            </small>
          </div>
          <div className="track-estimate">
            <CalendarDays size={20} />
            <span>
              {sceneConfig.arrivalTitle}
              <strong>{formatShortDate(tracking.estimated)}</strong>
              <small>{sceneConfig.arrivalSub}</small>
            </span>
          </div>
        </div>

        {/* ILLUSTRATED SCENE BANNER */}
        <div
          className={`track-scene ${trackingMode}-scene`}
          style={{ backgroundImage: "url('/track-order-scene.png')" }}
          style={{ backgroundImage: `url('${sceneConfig.bgImage}')` }}
          role="img"
          aria-label={`${sceneConfig.title} journey illustration`}
        >
          {trackingMode === "return" && (
            <div className="track-scene-overlay return-overlay">
              <div className="scene-overlay-badge left-hub">
                <Package size={13} />
                <span>Return & Quality Hub</span>
              </div>
              <div className="scene-overlay-badge center-van">
                <RotateCcw size={13} className="spin-reverse-icon" />
                <span>Reverse Pickup In Transit</span>
              </div>
              <div className="scene-overlay-badge right-home">
                <MapPin size={13} />
                <span>Doorstep Collection</span>
              </div>
              <div className="scene-floating-refund-pill">
                <Wallet size={14} className="gold-coin-icon" />
                <span>₹{Number(refundAmount || 0).toLocaleString("en-IN")} Wallet Refund in Progress</span>
              </div>
            </div>
          )}

          {trackingMode === "cancellation" && (
            <div className="track-scene-overlay cancel-overlay">
              <div className="scene-overlay-badge left-hub cancel-badge">
                <Ban size={13} />
                <span>Dispatch Halted • Stock Restored</span>
              </div>
              <div className="scene-overlay-badge center-van cancel-badge">
                <ShieldCheck size={13} />
                <span>24h Verification Cycle</span>
              </div>
              <div className="scene-overlay-badge right-home cancel-badge">
                <Wallet size={13} />
                <span>100% Wallet Refund</span>
              </div>
              <div className="scene-floating-refund-pill cancel-pill">
                <ShieldCheck size={14} className="green-shield-icon" />
                <span>Cancellation Confirmed • ₹{Number(refundAmount || 0).toLocaleString("en-IN")} Refund</span>
              </div>
            </div>
          )}
        </div>

        {/* HORIZONTAL TRACK TIMELINE */}
        <div
          className="track-timeline"
          style={{ gridTemplateColumns: `repeat(${activeStages.length}, 1fr)` }}
        >
          {activeStages.map(([id, label, Icon, hoursOffset], index) => {
            const stepTimestamp = new Date(tracking.startTime.getTime() + hoursOffset * 3600 * 1000);
            const isComplete = index <= tracking.currentIndex;
            const isCurrent = index === tracking.currentIndex;

            return (
              <div
                className={`track-step ${isComplete ? "complete" : ""} ${isCurrent ? "current" : ""}`}
                key={id}
              >
                <div className="track-step-icon">
                  {index < tracking.currentIndex ? <Check size={16} /> : <Icon size={16} />}
                </div>
                <strong>{label}</strong>
                <small>
                  {isComplete
                    ? `${formatShortDate(stepTimestamp)}`
                    : index === tracking.currentIndex + 1
                    ? `In ${countdown}`
                    : "Expected"}
                </small>
              </div>
            );
          })}
        </div>

        {/* CURRENT STATUS NOTE */}
        <div className="track-current-note">
          {trackingMode === "return" ? (
            <RotateCcw size={15} />
          ) : trackingMode === "cancellation" ? (
            <Ban size={15} />
          ) : (
            <Package size={15} />
          )}
          <span>
            {tracking.isCompleted
              ? `${currentStageLabel}. All processes successfully completed.`
              : `Current Step: ${currentStageLabel}. Auto-progressing via 24-hour sync cycle.`}
          </span>
        </div>

        {trackingMode === "return" && (order?.returnStatus === "requested" || returnRecord?.status === "requested") && (
          <div className="track-return-cancel-banner" style={{ marginTop: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px" }}>
            <span style={{ fontSize: "13px", color: "#991b1b", fontWeight: "500" }}>
              Need to keep your item? You can cancel this return claim before reverse pickup is confirmed.
            </span>
            <button
              type="button"
              className="btn btn-outline"
              style={{ color: "#dc2626", borderColor: "#f87171", background: "#fff", padding: "6px 14px", fontSize: "13px", fontWeight: "600" }}
              onClick={handleCancelReturn}
              disabled={cancellingReturn}
            >
              {cancellingReturn ? "Cancelling..." : "Cancel Return Request"}
            </button>
          </div>
        )}

        {trackingMode === "return" && (order?.returnStatus === "cancelled" || returnRecord?.status === "cancelled") && (
          <div className="track-return-cancel-banner" style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "10px" }}>
            <Info size={16} className="text-slate-600" />
            <span style={{ fontSize: "13px", color: "#334155", fontWeight: "500" }}>
              This return claim was cancelled by you. Your order remains Delivered.
            </span>
          </div>
        )}
      </section>

      {/* CONTENT GRID */}
      <div className="track-content-grid">
        <main>
          {/* ORDER & SHIPPING DETAILS */}
          <section className="track-info-card">
            <div className="track-card-heading">
              <div>
                <FileText size={19} />
                <h2>Order & Billing Details</h2>
              </div>
              {trackingMode === "delivery" && (
                <button className="btn btn-outline" onClick={() => navigate("/customer/checkout/address")}>
                  <MapPin size={15} /> Change Address
                </button>
              )}
            </div>
            <div className="track-details-table">
              <div>
                <span>Order ID</span>
                <strong>#{order.orderId || order._id}</strong>
              </div>
              {returnRecord?.returnId && (
                <div>
                  <span>Return ID</span>
                  <strong>{returnRecord.returnId}</strong>
                </div>
              )}
              <div>
                <span>Order Date</span>
                <strong>{formatShortDate(order.createdAt)}, {formatTime(order.createdAt)}</strong>
              </div>
              <div>
                <span>Payment Method</span>
                <strong>{payment}</strong>
              </div>
              <div>
                <span>{trackingMode === "return" ? "Pickup Address" : "Delivery Address"}</span>
                <strong>
                  {address.fullName || "Customer"}
                  <small>
                    {address.addressLine1 || "Address on file"}<br />
                    {address.city || "-"}, {address.state || "-"} - {address.pincode || "-"}<br />
                    Mobile: {address.phone || "-"}
                  </small>
                </strong>
              </div>
            </div>
          </section>

          {/* ITEMS IN THIS ORDER */}
          <section className="track-info-card">
            <div className="track-card-heading">
              <div>
                <Package size={19} />
                <h2>Items in this Order ({orderItems.length})</h2>
              </div>
            </div>
            {orderItems.map((item, idx) => (
              <div className="track-item-row" key={idx}>
                <div className="track-product-icon">
                  {item.image ? (
                    <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "6px" }} />
                  ) : (
                    <Package size={21} />
                  )}
                </div>
                <div>
                  <strong>{item.name || "Product Item"}</strong>
                  <small>Vendor: {item.vendorName || "Verified Merchant"}</small>
                </div>
                <span>Qty: {item.qty || 1}</span>
                <strong>
                  ₹ {(Number(item.price || 0) * Number(item.qty || 1)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
              </div>
            ))}
          </section>
        </main>

        {/* SIDEBAR ASIDE */}
        <aside>
          {/* REFUND / DELIVERY STATUS CARD */}
          <section className="track-side-card">
            <div className="track-card-heading">
              <div>
                {trackingMode === "delivery" ? <CalendarDays size={18} /> : <Wallet size={18} />}
                <h2>{trackingMode === "delivery" ? "Estimated Delivery" : "Refund Summary"}</h2>
              </div>
            </div>

            {trackingMode === "delivery" ? (
              <>
                <strong className="track-delivery-date">{formatShortDate(tracking.estimated)}</strong>
                <p>{sceneConfig.arrivalSub}</p>
                <div className="track-green-note">
                  <Truck size={16} /> {sceneConfig.noteText}
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "10px" }}>
                  <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: "600" }}>Total Refund Amount</span>
                  <strong style={{ fontSize: "20px", color: "#16a34a", fontWeight: "800" }}>
                    ₹ {Number(refundAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </strong>
                </div>
                <div className="track-green-note" style={{ background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0" }}>
                  <ShieldCheck size={16} /> {sceneConfig.noteText}
                </div>
              </>
            )}
          </section>

          {/* PARTNER CARD */}
          <section className="track-side-card">
            <div className="track-card-heading">
              <div>
                {trackingMode === "return" ? <RotateCcw size={18} /> : <Truck size={18} />}
                <h2>{sceneConfig.partnerTitle}</h2>
              </div>
            </div>
            <div className="track-partner">
              <div>
                {trackingMode === "return" ? <RotateCcw size={21} /> : <Truck size={21} />}
              </div>
              <p>
                <strong>{sceneConfig.partnerName}</strong>
                <span>{sceneConfig.partnerDesc}</span>
              </p>
              <button className="btn btn-outline" style={{ fontSize: "11px", padding: "5px 10px" }}>
                <ExternalLink size={13} /> {trackingMode === "delivery" ? "Track Courier" : "Verify Status"}
              </button>
            </div>
          </section>

          {/* NEED HELP */}
          <section className="track-side-card">
            <div className="track-card-heading">
              <div>
                <Headphones size={18} />
                <h2>Need Assistance?</h2>
              </div>
            </div>
            <p className="track-help-copy">
              {trackingMode === "return"
                ? "Have queries regarding your return pickup or refund? Our support desk is here 24/7."
                : trackingMode === "cancellation"
                ? "Need details on your wallet credit? We are happy to assist."
                : "If you have questions about your delivery, please contact our support team."}
            </p>
            <button className="btn btn-outline track-support-button">Contact Support</button>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default TrackOrder;
