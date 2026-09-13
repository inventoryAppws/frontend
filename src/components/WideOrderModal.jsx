import {
  ShoppingBag, MapPin, CreditCard, Package, Truck,
  CheckCircle2, Check, Phone, Shield, FileText, X, Tag, Store
} from "lucide-react";
import { formatDate, formatDateTime } from "../utils/dateFormatter";

const STATUS_CONFIG = {
  placed: { label: "Placed", badgeClass: "status-badge-placed" },
  packed: { label: "Packed", badgeClass: "status-badge-packed" },
  shipped: { label: "Shipped", badgeClass: "status-badge-shipped" },
  out_for_delivery: { label: "Out for Delivery", badgeClass: "status-badge-out-for-delivery" },
  delivered: { label: "Delivered", badgeClass: "status-badge-delivered" },
  cancelled: { label: "Cancelled", badgeClass: "status-badge-cancelled" },
  return_requested: { label: "Return Requested", badgeClass: "status-badge-packed" },
  approved: { label: "Return Approved", badgeClass: "status-badge-packed" },
  returned: { label: "Returned", badgeClass: "status-badge-cancelled" },
};

function getStatusMeta(statusKey) {
  const normalized = String(statusKey || "placed").toLowerCase().replace(/-/g, "_");
  return (
    STATUS_CONFIG[normalized] || {
      label: normalized ? normalized.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Placed",
      badgeClass: "status-badge-placed",
    }
  );
}

/**
 * WideOrderModal
 * Props:
 *   order          - the order object to display
 *   onClose        - function to close the modal
 *   onViewInvoice  - function to open invoice/sidepanel
 *   profile        - optional customer profile (for address fallback)
 */
function WideOrderModal({ order, onClose, onViewInvoice, onCancelOrder, onReturnOrder, profile }) {
  if (!order) return null;

  const STEPS = [
    { key: "placed", title: "Placed", desc: "Order confirmed", icon: Check },
    { key: "packed", title: "Packed", desc: "Items packed securely", icon: Package },
    { key: "shipped", title: "Shipped", desc: "Handed to courier", icon: Truck },
    { key: "out_for_delivery", title: "Out for Delivery", desc: "Arriving today", icon: MapPin },
    { key: "delivered", title: "Delivered", desc: "Package received", icon: CheckCircle2 },
  ];

  const orderStatus = String(order.status || "placed").toLowerCase().replace(/-/g, "_");
  const returnStatus = String(order.returnStatus || "").toLowerCase().replace(/-/g, "_");
  const currentStatus = returnStatus && returnStatus !== "none"
    ? (returnStatus === "requested" ? "return_requested" : returnStatus)
    : orderStatus;
  const stepKeys = ["placed", "packed", "shipped", "out_for_delivery", "delivered"];
  const currentIndex = Math.max(0, stepKeys.indexOf(currentStatus));

  const statusMeta = getStatusMeta(currentStatus);

  const deliveryDateVal = order.deliveryDate
    || (order.createdAt ? new Date(new Date(order.createdAt).getTime() + 3 * 86400000) : new Date(Date.now() + 3 * 86400000));
  const deliveryDateFormatted = formatDate(deliveryDateVal);

  // Items extraction and normalization
  let rawItems = [];
  if (Array.isArray(order.items) && order.items.length > 0) {
    rawItems = order.items;
  } else if (order.productId) {
    rawItems = [{
      productId: order.productId?._id || order.productId,
      name: order.productId?.name || order.name || "Product Item",
      description: order.productId?.description || order.description || "",
      image: order.productId?.image || order.image || (Array.isArray(order.productId?.images) ? order.productId.images[0] : ""),
      category: order.productId?.category || order.category || "General",
      vendorName: order.vendorId?.name || order.vendorName || "Verified Vendor",
      colors: order.productId?.colors || order.colors || "",
      sizes: order.productId?.sizes || order.sizes || "",
      qty: order.qty || 1,
      price: order.price || order.totalAmount || 0,
    }];
  } else {
    rawItems = [{
      name: order.name || order.product?.name || "Product Item",
      description: order.description || order.product?.description || "",
      image: order.image || order.product?.image || "",
      category: order.category || order.product?.category || "General",
      vendorName: order.vendorName || order.vendor?.name || order.vendorId?.name || "Verified Vendor",
      colors: order.colors || "",
      sizes: order.sizes || "",
      qty: order.qty || 1,
      price: order.price || order.totalAmount || 0,
    }];
  }

  const items = rawItems.map((item) => {
    const prod = (typeof item.productId === 'object' && item.productId !== null) ? item.productId : (typeof item.product === 'object' && item.product !== null ? item.product : {});
    const vend = (typeof item.vendorId === 'object' && item.vendorId !== null) ? item.vendorId : (typeof item.vendor === 'object' && item.vendor !== null ? item.vendor : {});
    return {
      name: item.name || prod.name || order.name || "Product Item",
      description: item.description || prod.description || order.description || "",
      image: item.image || prod.image || (Array.isArray(prod.images) ? prod.images[0] : "") || order.image || "",
      category: item.category || prod.category || order.category || "General",
      vendorName: item.vendorName || vend.name || prod.vendorName || order.vendorName || (typeof order.vendorId === 'object' ? order.vendorId?.name : "Verified Vendor"),
      colors: item.colors || prod.colors || "",
      sizes: item.sizes || prod.sizes || "",
      qty: Number(item.qty || order.qty || 1),
      price: Number(item.price || (order.totalAmount ? Number(order.totalAmount) / Number(item.qty || 1) : 0)),
    };
  });

  const calculatedItemsTotal = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1), 0);
  const subtotal = Number(order.totalAmount) > 0 ? Number(order.totalAmount) : calculatedItemsTotal;
  const gstAmount = Math.round(subtotal * 0.18);

  return (
    <div
      className="wide-order-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="wide-order-modal-title"
    >
      <div
        className="wide-order-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── STICKY HEADER ── */}
        <div className="wide-order-modal-header">
          <div className="wide-header-info">
            <div className="wide-header-icon-box">
              <ShoppingBag size={20} />
            </div>
            <div>
              <div className="wide-header-top-row">
                <h2 id="wide-order-modal-title" className="wide-order-title">Order Details</h2>
                <span className="wide-order-id-badge">
                  #{order.orderId || (order._id ? String(order._id).slice(-8).toUpperCase() : "ORD")}
                </span>
                <span className={`account-status-badge ${statusMeta.badgeClass}`}>
                  {statusMeta.label}
                </span>
              </div>
              <p className="wide-order-placed-subtitle">
                Placed on {formatDateTime(order.createdAt)}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="wide-order-modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── SCROLLABLE BODY ── */}
        <div className="wide-order-modal-body">

          {/* 1. ORDERED PRODUCTS CARD (PRIMARY HERO SECTION AT TOP) */}
          <div className="wide-items-card" style={{ marginBottom: "16px", border: "1.5px solid #e2e8f0", borderRadius: "14px", overflow: "hidden", background: "#ffffff" }}>
            <div className="wide-items-card-header" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <Package size={17} style={{ color: "#2563eb" }} />
              <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>
                Products in this Order ({items.length})
              </h4>
            </div>
            <div className="wide-items-table-wrap" style={{ overflowX: "auto" }}>
              <table className="wide-items-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                    <th style={{ padding: "10px 14px", fontSize: "11.5px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "left" }}>Product Details</th>
                    <th style={{ padding: "10px 14px", fontSize: "11.5px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "center", width: "80px" }}>Qty</th>
                    <th style={{ padding: "10px 14px", fontSize: "11.5px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "right", width: "120px" }}>Unit Price</th>
                    <th style={{ padding: "10px 14px", fontSize: "11.5px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "right", width: "120px" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const itemTotal = Number(item.price || 0) * Number(item.qty || 1);
                    return (
                      <tr key={idx} style={{ borderBottom: idx === items.length - 1 ? "none" : "1px solid #f1f5f9" }}>
                        <td style={{ padding: "14px" }}>
                          <div className="wide-item-cell" style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="wide-item-thumb" style={{ width: "52px", height: "52px", borderRadius: "10px", objectFit: "cover", border: "1px solid #e2e8f0", flexShrink: 0 }} />
                            ) : (
                              <div className="wide-item-thumb-placeholder" style={{ width: "52px", height: "52px", borderRadius: "10px", background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <Package size={24} />
                              </div>
                            )}
                            <div className="wide-item-info">
                              <span className="wide-item-title" style={{ fontSize: "14.5px", fontWeight: "700", color: "#0f172a", display: "block" }}>{item.name}</span>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "5px", flexWrap: "wrap" }}>
                                {item.category && (
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "11px", fontWeight: "600", color: "#2563eb", background: "#eff6ff", padding: "2px 8px", borderRadius: "6px" }}>
                                    <Tag size={11} /> {item.category}
                                  </span>
                                )}
                                {item.vendorName && (
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "11.5px", color: "#475569", background: "#f1f5f9", padding: "2px 8px", borderRadius: "6px" }}>
                                    <Store size={11} /> <strong>{item.vendorName}</strong>
                                  </span>
                                )}
                                {item.colors && item.colors !== "N/A" && (
                                  <span style={{ fontSize: "11.5px", color: "#64748b", background: "#f8fafc", padding: "2px 7px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                                    Color: <strong>{item.colors}</strong>
                                  </span>
                                )}
                                {item.sizes && item.sizes !== "N/A" && (
                                  <span style={{ fontSize: "11.5px", color: "#64748b", background: "#f8fafc", padding: "2px 7px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                                    Size: <strong>{item.sizes}</strong>
                                  </span>
                                )}
                              </div>
                              {item.description && (
                                <small className="wide-item-desc" style={{ display: "block", marginTop: "4px", color: "#64748b", fontSize: "12px", lineHeight: "1.4" }}>
                                  {item.description}
                                </small>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="wide-item-qty" style={{ textAlign: "center", fontWeight: "600", color: "#334155", fontSize: "13.5px" }}>{item.qty || 1}</td>
                        <td className="wide-item-price" style={{ textAlign: "right", fontWeight: "600", color: "#334155", fontSize: "13.5px" }}>₹ {Number(item.price || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                        <td className="wide-item-total" style={{ textAlign: "right", fontWeight: "700", color: "#0f172a", fontSize: "14px" }}>₹ {itemTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Delivery Tracking Stepper */}
          <div className="wide-order-stepper-card">
            <div className="wide-stepper-heading">
              <div className="wide-stepper-heading-left">
                <Truck size={17} className="text-blue" />
                <h3>Delivery Status &amp; Journey</h3>
              </div>
              <span className="wide-stepper-delivery-date">
                {currentStatus === "delivered"
                  ? `Delivered on ${deliveryDateFormatted}`
                  : `Estimated Delivery: ${deliveryDateFormatted}`}
              </span>
            </div>
            <div className="refined-tracking-stepper wide-stepper-custom">
              {STEPS.map((step, idx) => {
                const isCompleted = idx <= currentIndex;
                const isCurrent = idx === currentIndex;
                const StepIcon = step.icon;
                return (
                  <div
                    className={`tracking-step-node ${isCompleted ? "completed" : ""} ${isCurrent ? "current" : ""}`}
                    key={step.key}
                  >
                    <div className="step-circle"><StepIcon size={16} /></div>
                    {idx < 4 && <div className={`step-connector ${idx < currentIndex ? "filled" : ""}`} />}
                    <div className="step-info">
                      <strong>{step.title}</strong>
                      <small>{step.desc}</small>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. 2-Col Info Grid (Address & Payment) */}
          <div className="wide-order-info-grid">
            {/* Delivery Address */}
            <div className="wide-info-card">
              <div className="wide-info-card-header">
                <MapPin size={16} />
                <h4>Delivery Address</h4>
              </div>
              <div className="wide-info-card-content">
                <p className="wide-address-name">
                  {order.shippingAddress?.fullName || order.customerName || profile?.name || "Customer"}
                </p>
                <p className="wide-address-line">
                  {order.shippingAddress?.address || order.shippingAddress?.addressLine1 || order.shippingAddress?.street || "Address not provided"}
                </p>
                <p className="wide-address-line">
                  {order.shippingAddress?.city || "City"},{" "}
                  {order.shippingAddress?.state || "State"} -{" "}
                  {order.shippingAddress?.pincode || order.shippingAddress?.zipCode || "000000"}
                </p>
                <p className="wide-address-phone">
                  <Phone size={13} />
                  <span>{order.shippingAddress?.phone || profile?.phone || "N/A"}</span>
                </p>
              </div>
            </div>

            {/* Payment & Order Meta */}
            <div className="wide-info-card">
              <div className="wide-info-card-header">
                <CreditCard size={16} />
                <h4>Payment &amp; Order Meta</h4>
              </div>
              <div className="wide-info-card-content">
                <div className="wide-meta-row">
                  <span className="wide-meta-label">Payment Method:</span>
                  <span className="wide-meta-val bold">{String(order.paymentMethod || "COD").toUpperCase()}</span>
                </div>
                <div className="wide-meta-row">
                  <span className="wide-meta-label">Payment Status:</span>
                  <span className="wide-meta-val success-pill"><Check size={12} /> Paid Successfully</span>
                </div>
                <div className="wide-meta-row">
                  <span className="wide-meta-label">Merchant / Vendor:</span>
                  <span className="wide-meta-val">{order.vendorName || order.vendorId?.name || "Verified Vendor"}</span>
                </div>
                <div className="wide-meta-row">
                  <span className="wide-meta-label">Delivery Speed:</span>
                  <span className="wide-meta-val">Standard Express (Free)</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Bill Summary */}
          <div className="wide-bill-summary-card">
            <div className="wide-bill-row">
              <span>Items Subtotal:</span>
              <span>₹ {subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="wide-bill-row">
              <span>Delivery Charges:</span>
              <span className="text-free">FREE</span>
            </div>
            <div className="wide-bill-row">
              <span>Taxes &amp; GST (Included):</span>
              <span>₹ {gstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="wide-bill-divider" />
            <div className="wide-bill-row grand-total">
              <span>Total Amount Paid:</span>
              <span className="grand-amount">₹ {subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* ── STICKY FOOTER ── */}
        <div className="wide-order-modal-footer">
          <div className="wide-footer-left">
            <Shield size={16} className="text-emerald" />
            <span>100% Genuine Products • 7 Days Return &amp; Exchange Guarantee</span>
          </div>
          <div className="wide-footer-right">
            {['placed', 'packed'].includes(String(order.status || '').toLowerCase()) && onCancelOrder && (
              <button
                type="button"
                className="btn btn-outline wide-footer-btn text-danger-btn"
                onClick={() => {
                  onClose();
                  onCancelOrder(order);
                }}
              >
                Cancel Order
              </button>
            )}

            {String(order.status || '').toLowerCase() === 'delivered' &&
             String(order.returnStatus || '').toLowerCase() !== 'requested' &&
             String(order.returnStatus || '').toLowerCase() !== 'approved' &&
             onReturnOrder && (
              <button
                type="button"
                className="btn btn-outline wide-footer-btn"
                onClick={() => {
                  onClose();
                  onReturnOrder(order);
                }}
              >
                Request Return
              </button>
            )}

            <button type="button" className="btn btn-outline wide-footer-btn" onClick={onClose}>
              Close
            </button>
            {onViewInvoice && (
              <button
                type="button"
                className="btn btn-primary wide-footer-btn wide-footer-invoice-btn"
                onClick={() => {
                  onClose();
                  onViewInvoice(order);
                }}
              >
                <FileText size={16} />
                <span>View Invoice</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WideOrderModal;
