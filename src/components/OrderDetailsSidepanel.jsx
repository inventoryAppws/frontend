import { useEffect, useMemo } from "react";
import {
  X,
  Download,
  Printer,
  ShoppingBag,
  User,
  MapPin,
  CreditCard,
  Receipt,
  Store,
  Clock,
  Check,
  Package,
  Mail,
  Phone,
  CheckCircle2
} from "lucide-react";
import { downloadInvoicePdf } from "../utils/invoicePdf";
import { formatDate as formatShortDate, formatDateTime as formatDate } from "../utils/dateFormatter";

function formatCurrency(num) {
  return "₹\u00A0" + Number(num || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function generateGstin(name = "Vendor") {
  const clean = name.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  const code = (clean + "ABCDE12345").substring(0, 10);
  return `37${code}1Z5`;
}

const STAGES = [
  { id: "placed", label: "Placed" },
  { id: "packed", label: "Packed" },
  { id: "shipped", label: "Shipped" },
  { id: "out_for_delivery", label: "Out for Delivery" },
  { id: "delivered", label: "Delivered" },
];

function getStageIndex(status) {
  const normalized = String(status || "placed").toLowerCase().replace(/-/g, "_");
  const idx = STAGES.findIndex((s) => s.id === normalized);
  return idx >= 0 ? idx : 0;
}

function OrderDetailsSidepanel({ isOpen, order, onClose }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Clean print portal preparation and title setting
  useEffect(() => {
    if (!isOpen || !order) return;

    let origTitle = document.title;
    const currentOrderId = order.orderId || (order._id ? order._id.slice(-8).toUpperCase() : "—");

    const preparePrintPortal = () => {
      const invoiceEl = document.getElementById("printable-invoice");
      let portal = document.getElementById("invoice-print-portal");
      if (!portal) {
        portal = document.createElement("div");
        portal.id = "invoice-print-portal";
        document.body.appendChild(portal);
      }
      if (invoiceEl && portal) {
        portal.innerHTML = invoiceEl.outerHTML;
        origTitle = document.title;
        document.title = `Tax Invoice - ORD-${currentOrderId}`;
        document.body.classList.add("is-printing-invoice");
      }
    };

    const cleanupPrintPortal = () => {
      document.body.classList.remove("is-printing-invoice");
      const portal = document.getElementById("invoice-print-portal");
      if (portal) portal.innerHTML = "";
      if (origTitle) document.title = origTitle;
    };

    // Clean up any legacy or rogue iframes from previous attempts
    document.querySelectorAll("iframe").forEach((el) => {
      if (el.style.top === "-9999px") el.remove();
    });

    window.addEventListener("beforeprint", preparePrintPortal);
    window.addEventListener("afterprint", cleanupPrintPortal);

    return () => {
      window.removeEventListener("beforeprint", preparePrintPortal);
      window.removeEventListener("afterprint", cleanupPrintPortal);
      cleanupPrintPortal();
    };
  }, [isOpen, order]);

  const items = useMemo(() => {
    if (!order) return [];
    if (Array.isArray(order.items) && order.items.length > 0) {
      return order.items;
    }
    return [
      {
        name: typeof order.productId === "object" ? order.productId?.name : "Product",
        image: typeof order.productId === "object" ? order.productId?.image : null,
        vendorName: typeof order.vendorId === "object" ? order.vendorId?.name : "Vendor",
        qty: order.qty || 1,
        price: order.price || 0,
      },
    ];
  }, [order]);

  const vendors = useMemo(() => {
    if (!order) return [];
    const map = new Map();
    items.forEach((it) => {
      const vName = it.vendorName || (typeof it.vendorId === "object" ? it.vendorId?.name : null) || (typeof order.vendorId === "object" ? order.vendorId?.name : null) || "Vendor";
      if (!map.has(vName)) {
        map.set(vName, {
          name: vName,
          gstin: it.vendorGstin || (typeof it.vendorId === "object" ? it.vendorId?.gstin : null) || generateGstin(vName),
          phone: it.vendorPhone || (typeof it.vendorId === "object" ? it.vendorId?.phone : null) || "+91 98765 43210",
          email: it.vendorEmail || (typeof it.vendorId === "object" ? it.vendorId?.email : null) || `support@${vName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
        });
      }
    });
    return Array.from(map.values());
  }, [order, items]);

  if (!isOpen || !order) return null;

  const orderId = order.orderId || (order._id ? order._id.slice(-8).toUpperCase() : "—");
  const invoiceId = order.invoiceId || (order.orderId ? `INV-${order.orderId.replace(/^ORD/, "")}` : `INV-${orderId}`);
  const placedDateStr = formatDate(order.placedAt || order.createdAt);
  const placedDateObj = new Date(order.placedAt || order.createdAt || Date.now());

  const custName = order.shippingAddress?.fullName || order.customer?.name || "Customer";
  const custEmail = order.customer?.email || "customer@example.com";
  const custPhone = order.shippingAddress?.phone || order.customer?.phone || "+91 9876543210";

  const addr = order.shippingAddress || {};
  const addrLine1 = addr.addressLine1 || "Address Line 1";
  const addrLine2 = addr.addressLine2 ? `, ${addr.addressLine2}` : "";
  const cityState = `${addr.city || "City"}, ${addr.state || "State"} - ${addr.pincode || "000000"}`;
  const phoneStr = addr.phone ? `Phone: ${addr.phone}` : "";

  const subtotal = Number(order.subtotal) > 0
    ? Number(order.subtotal)
    : items.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.qty) || 1), 0);
  const couponDiscount = Number(order.couponDiscount || 0);
  const deliveryFee = Number(order.deliveryFee || 0);
  const totalAmount = Number(order.totalAmount) > 0
    ? Number(order.totalAmount)
    : Math.max(0, subtotal + deliveryFee - couponDiscount);

  const paymentMethod = String(order.paymentMethod || "NETBANKING").toUpperCase();
  const currentStageIdx = getStageIndex(order.status);
  const txnId = order.paymentId || `TXN${(order._id || orderId).replace(/[^A-Za-z0-9]/g, "").slice(-10).toUpperCase()}`;

  const handleDownload = () => {
    downloadInvoicePdf(order);
  };

  const handlePrint = () => {
    const invoiceEl = document.getElementById("printable-invoice");
    if (!invoiceEl) {
      window.print();
      return;
    }

    let portal = document.getElementById("invoice-print-portal");
    if (!portal) {
      portal = document.createElement("div");
      portal.id = "invoice-print-portal";
      document.body.appendChild(portal);
    }

    // Safety: ensure any legacy iframes are removed from DOM
    document.querySelectorAll("iframe").forEach((el) => {
      if (el.style.top === "-9999px") el.remove();
    });

    portal.innerHTML = invoiceEl.outerHTML;
    const origTitle = document.title;
    document.title = `Tax Invoice - ORD-${orderId}`;
    document.body.classList.add("is-printing-invoice");

    let isCleaned = false;
    const cleanup = () => {
      if (isCleaned) return;
      isCleaned = true;
      document.body.classList.remove("is-printing-invoice");
      if (portal) portal.innerHTML = "";
      document.title = origTitle;
      window.removeEventListener("afterprint", cleanup);
    };

    window.addEventListener("afterprint", cleanup);

    // Short tick so browser paints the portal HTML before opening print dialog
    setTimeout(() => {
      window.print();
      setTimeout(cleanup, 1000);
    }, 60);
  };

  return (
    <div className="sidepanel-backdrop" onClick={onClose}>
      <aside
        className="order-details-sidepanel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Order Details"
      >
        {/* STICKY TOPBAR HEADER */}
        <div className="sidepanel-sticky-header">
          <div className="sidepanel-header-left">
            <div className="sidepanel-header-title-wrap">
              <span className="sidepanel-eyebrow">ORDER DETAILS & INVOICE</span>
              <div className="sidepanel-title-row">
                <h2>#{orderId}</h2>
                <span className="invoice-badge-paid">
                  <CheckCircle2 size={12} /> PAID
                </span>
              </div>
            </div>
          </div>

          <div className="sidepanel-header-actions">
            <button
              type="button"
              className="btn-sidepanel-close"
              onClick={onClose}
              aria-label="Close panel"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* SCROLLABLE INVOICE SHEET */}
        <div className="sidepanel-scrollable-body">
          <div className="invoice-design-sheet" id="printable-invoice">
            {/* BRAND HEADER & TAX INVOICE META */}
            <div className="inv-top-header">
              <div className="inv-brand-block">
                <div className="inv-brand-row">
                  <div className="inv-brand-icon">
                    <ShoppingBag size={24} />
                  </div>
                  <div>
                    <h1 className="inv-brand-title">ShopHub</h1>
                    <span className="inv-brand-subtitle">Your trusted shopping partner</span>
                  </div>
                </div>
                <div className="inv-company-details">
                  <strong>ShopHub E-Commerce Pvt. Ltd.</strong>
                  <span>support@shophub.com &nbsp;|&nbsp; +91 98765 43210</span>
                  <span>GSTIN: 37AAAAA0000A1Z5</span>
                  <span>Plot No. 12, Tech Park, Guntur, Andhra Pradesh - 522001</span>
                </div>
              </div>

              <div className="inv-meta-block">
                <div className="inv-slogan">Quality Products &nbsp;|&nbsp; Better Prices &nbsp;|&nbsp; Happier You</div>
                <div className="inv-tax-heading-row">
                  <span className="inv-tax-title">TAX INVOICE</span>
                  <span className="inv-paid-badge">
                    <Check size={12} strokeWidth={3} /> PAID
                  </span>
                </div>
                <div className="inv-meta-table">
                  <div className="inv-meta-row">
                    <span className="inv-meta-label">Invoice No.</span>
                    <span className="inv-meta-colon">:</span>
                    <strong className="inv-meta-val">{invoiceId}</strong>
                  </div>
                  <div className="inv-meta-row">
                    <span className="inv-meta-label">Invoice Date</span>
                    <span className="inv-meta-colon">:</span>
                    <span className="inv-meta-val">{placedDateStr}</span>
                  </div>
                  <div className="inv-meta-row">
                    <span className="inv-meta-label">Order ID</span>
                    <span className="inv-meta-colon">:</span>
                    <strong className="inv-meta-val">ORD-{orderId.replace(/^ORD-?/, "")}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 1: BILL TO (CUSTOMER) & DELIVERY ADDRESS */}
            <div className="inv-cards-grid-2">
              {/* Card 1: Bill To */}
              <div className="inv-card">
                <div className="inv-card-header">
                  <div className="inv-card-icon-bubble">
                    <User size={18} />
                  </div>
                  <h3 className="inv-card-title">Bill To (Customer)</h3>
                </div>
                <div className="inv-card-body">
                  <div className="inv-customer-name">{custName}</div>
                  <div className="inv-contact-line">
                    <Mail size={14} className="inv-contact-icon" />
                    <span>{custEmail}</span>
                  </div>
                  <div className="inv-contact-line">
                    <Phone size={14} className="inv-contact-icon" />
                    <span>{custPhone}</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Delivery Address */}
              <div className="inv-card">
                <div className="inv-card-header">
                  <div className="inv-card-icon-bubble">
                    <MapPin size={18} />
                  </div>
                  <h3 className="inv-card-title">Delivery Address</h3>
                </div>
                <div className="inv-card-body">
                  <div className="inv-customer-name">{custName}</div>
                  <div className="inv-address-text">
                    {addrLine1}{addrLine2}, {cityState}
                  </div>
                  {phoneStr && (
                    <div className="inv-contact-line">
                      <Phone size={14} className="inv-contact-icon" />
                      <span>{phoneStr}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* NOTE: Order Information card removed per instruction */}

            {/* PRODUCTS TABLE */}
            <div className="inv-products-section">
              <div className="inv-table-wrap">
                <table className="inv-table">
                  <thead>
                    <tr>
                      <th style={{ width: "35px" }}>#</th>
                      <th>Product</th>
                      <th>Vendor</th>
                      <th style={{ textAlign: "center", width: "55px" }}>Qty</th>
                      <th style={{ textAlign: "right", width: "95px" }}>Unit Price</th>
                      <th style={{ textAlign: "right", width: "105px" }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const qty = Number(item.qty) || 1;
                      const price = Number(item.price) || 0;
                      const rowTotal = qty * price;
                      const vName = item.vendorName || (typeof item.vendorId === "object" ? item.vendorId?.name : null) || "Vendor";

                      return (
                        <tr key={item.productId || index}>
                          <td className="inv-col-num">{index + 1}</td>
                          <td className="inv-col-product">
                            <div className="inv-product-cell">
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="inv-product-thumb" />
                              ) : (
                                <div className="inv-product-placeholder">
                                  <Package size={18} />
                                </div>
                              )}
                              <div className="inv-product-text">
                                <span className="inv-product-title">{item.name || "Product Item"}</span>
                                <span className="inv-product-subtitle">{item.description || "High quality product"}</span>
                              </div>
                            </div>
                          </td>
                          <td className="inv-col-vendor">{vName}</td>
                          <td className="inv-col-qty">{qty}</td>
                          <td className="inv-col-price">{formatCurrency(price)}</td>
                          <td className="inv-col-total">{formatCurrency(rowTotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* VENDOR DETAILS SECTION (NOW PLACED DIRECTLY AFTER PRODUCTS TABLE) */}
            <div className="inv-vendors-section">
              <div className="inv-card">
                <div className="inv-card-header">
                  <div className="inv-card-icon-bubble">
                    <Store size={18} />
                  </div>
                  <h3 className="inv-card-title">
                    Vendor Details {vendors.length > 1 ? `(${vendors.length} Vendors)` : ""}
                  </h3>
                </div>
                <div className="inv-vendors-list">
                  {vendors.map((vendor, idx) => (
                    <div key={idx} className="inv-vendor-row">
                      <div className="inv-vendor-main">
                        <strong className="inv-vendor-name">{vendor.name}</strong>
                        <span className="inv-vendor-gstin">GSTIN: {vendor.gstin}</span>
                      </div>
                      <div className="inv-vendor-contacts">
                        <span className="inv-vendor-item">
                          <Phone size={13} /> {vendor.phone}
                        </span>
                        <span className="inv-vendor-item">
                          <Mail size={13} /> {vendor.email}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ROW 2: PAYMENT DETAILS & ORDER SUMMARY */}
            <div className="inv-cards-grid-2">
              {/* Payment Details */}
              <div className="inv-card">
                <div className="inv-card-header">
                  <div className="inv-card-icon-bubble">
                    <CreditCard size={18} />
                  </div>
                  <h3 className="inv-card-title">Payment Details</h3>
                </div>
                <div className="inv-card-body">
                  <div className="inv-key-val-row">
                    <span className="inv-kv-label">Payment Method</span>
                    <span className="inv-kv-colon">:</span>
                    <strong className="inv-kv-val">{paymentMethod}</strong>
                  </div>
                  <div className="inv-key-val-row">
                    <span className="inv-kv-label">Payment Status</span>
                    <span className="inv-kv-colon">:</span>
                    <span className="inv-paid-badge-sm">PAID</span>
                  </div>
                  <div className="inv-key-val-row">
                    <span className="inv-kv-label">Transaction Date</span>
                    <span className="inv-kv-colon">:</span>
                    <span className="inv-kv-val">{placedDateStr}</span>
                  </div>
                  <div className="inv-key-val-row">
                    <span className="inv-kv-label">Transaction ID</span>
                    <span className="inv-kv-colon">:</span>
                    <span className="inv-kv-val meta-mono">{txnId}</span>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="inv-card">
                <div className="inv-card-header">
                  <div className="inv-card-icon-bubble">
                    <Receipt size={18} />
                  </div>
                  <h3 className="inv-card-title">Order Summary</h3>
                </div>
                <div className="inv-card-body">
                  <div className="inv-summary-row">
                    <span>Subtotal</span>
                    <strong>{formatCurrency(subtotal)}</strong>
                  </div>
                  <div className="inv-summary-row">
                    <span>Delivery Charge</span>
                    <strong className="inv-free-tag">{deliveryFee === 0 ? "FREE" : formatCurrency(deliveryFee)}</strong>
                  </div>
                  <div className="inv-summary-row">
                    <span>Discount</span>
                    <span>{couponDiscount > 0 ? `- ${formatCurrency(couponDiscount)}` : "₹ 0.00"}</span>
                  </div>
                  <div className="inv-summary-row">
                    <span>Other Charges</span>
                    <span>₹ 0.00</span>
                  </div>

                  {/* Total Amount Highlight Banner */}
                  <div className="inv-total-banner">
                    <span className="inv-total-label">Total Amount</span>
                    <strong className="inv-total-amount">{formatCurrency(totalAmount)}</strong>
                  </div>
                  <span className="inv-tax-inclusive-note">(Inclusive of all taxes)</span>
                </div>
              </div>
            </div>

            {/* ORDER TIMELINE / STATUS */}
            <div className="inv-card inv-timeline-card">
              <div className="inv-card-header">
                <div className="inv-card-icon-bubble">
                  <Clock size={18} />
                </div>
                <h3 className="inv-card-title">Order Timeline / Status</h3>
              </div>
              <div className="inv-timeline-stepper">
                {STAGES.map((stg, index) => {
                  const isComplete = index <= currentStageIdx;
                  const isCurrent = index === currentStageIdx;
                  const dateText = index === 0
                    ? placedDateStr
                    : `Expected ${formatShortDate(new Date(placedDateObj.getTime() + index * 24 * 3600 * 1000))}`;

                  return (
                    <div
                      key={stg.id}
                      className={`inv-step-item ${isComplete ? "step-complete" : ""} ${isCurrent ? "step-active" : ""}`}
                    >
                      <div className="inv-step-marker-row">
                        {index > 0 && <div className={`inv-step-line ${index <= currentStageIdx ? "line-done" : ""}`} />}
                        <div className="inv-step-circle">
                          {isComplete ? <Check size={13} strokeWidth={3} /> : <span className="inv-circle-dot" />}
                        </div>
                        {index < STAGES.length - 1 && <div className={`inv-step-line ${index < currentStageIdx ? "line-done" : ""}`} />}
                      </div>
                      <div className="inv-step-details">
                        <strong className="inv-step-title">{stg.label}</strong>
                        <span className="inv-step-date">{dateText}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* FOOTER NOTICE & QR CODE */}
            <div className="inv-footer-card">
              <div className="inv-footer-left">
                <div className="inv-footer-brand-row">
                  <div className="inv-footer-bag-bubble">
                    <ShoppingBag size={20} />
                  </div>
                  <div>
                    <h4 className="inv-footer-thankyou">Thank you for shopping with ShopHub!</h4>
                    <p className="inv-footer-sub">This is a computer-generated invoice and does not require a signature.</p>
                  </div>
                </div>

                <div className="inv-footer-help-block">
                  <span className="inv-footer-help-label">For returns, warranty claims, or support, please contact us:</span>
                  <div className="inv-footer-help-contacts">
                    <span className="inv-footer-contact-item">
                      <Mail size={14} /> support@shophub.com
                    </span>
                    <span className="inv-footer-contact-item">
                      <Phone size={14} /> +91 98765 43210
                    </span>
                  </div>
                </div>
              </div>

              <div className="inv-footer-right">
                <div className="inv-qr-container">
                  <div className="inv-qr-code-box">
                    {/* SVG QR Code Pattern representation */}
                    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="72" height="72" fill="#ffffff" />
                      {/* Corner top-left marker */}
                      <rect x="6" y="6" width="20" height="20" rx="3" stroke="#0f172a" strokeWidth="3" fill="none" />
                      <rect x="11" y="11" width="10" height="10" rx="1.5" fill="#0f172a" />
                      {/* Corner top-right marker */}
                      <rect x="46" y="6" width="20" height="20" rx="3" stroke="#0f172a" strokeWidth="3" fill="none" />
                      <rect x="51" y="11" width="10" height="10" rx="1.5" fill="#0f172a" />
                      {/* Corner bottom-left marker */}
                      <rect x="6" y="46" width="20" height="20" rx="3" stroke="#0f172a" strokeWidth="3" fill="none" />
                      <rect x="11" y="51" width="10" height="10" rx="1.5" fill="#0f172a" />
                      {/* Data dots */}
                      <rect x="30" y="8" width="4" height="4" fill="#0f172a" />
                      <rect x="38" y="8" width="4" height="4" fill="#0f172a" />
                      <rect x="34" y="14" width="4" height="4" fill="#0f172a" />
                      <rect x="30" y="20" width="4" height="4" fill="#0f172a" />
                      <rect x="38" y="20" width="4" height="4" fill="#0f172a" />
                      <rect x="8" y="32" width="4" height="4" fill="#0f172a" />
                      <rect x="16" y="32" width="4" height="4" fill="#0f172a" />
                      <rect x="24" y="32" width="4" height="4" fill="#0f172a" />
                      <rect x="32" y="32" width="4" height="4" fill="#0f172a" />
                      <rect x="40" y="32" width="4" height="4" fill="#0f172a" />
                      <rect x="48" y="32" width="4" height="4" fill="#0f172a" />
                      <rect x="56" y="32" width="4" height="4" fill="#0f172a" />
                      <rect x="32" y="42" width="4" height="4" fill="#0f172a" />
                      <rect x="42" y="42" width="4" height="4" fill="#0f172a" />
                      <rect x="52" y="42" width="4" height="4" fill="#0f172a" />
                      <rect x="32" y="52" width="4" height="4" fill="#0f172a" />
                      <rect x="42" y="52" width="4" height="4" fill="#0f172a" />
                      <rect x="52" y="52" width="4" height="4" fill="#0f172a" />
                      <rect x="36" y="60" width="4" height="4" fill="#0f172a" />
                      <rect x="46" y="60" width="4" height="4" fill="#0f172a" />
                      <rect x="56" y="60" width="4" height="4" fill="#0f172a" />
                    </svg>
                  </div>
                  <span className="inv-qr-label">Scan QR for Order Details</span>
                  <div className="inv-happy-shopping">Happy Shopping!</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STICKY FOOTER ACTION BUTTONS */}
        <div className="sidepanel-sticky-footer">
          <button
            type="button"
            className="btn-sidepanel-footer-action outline"
            onClick={handlePrint}
            title="Print Invoice"
          >
            <Printer size={15} />
            <span>Print</span>
          </button>
          <button
            type="button"
            className="btn-sidepanel-footer-action primary"
            onClick={handleDownload}
            title="Download Tax Invoice PDF"
          >
            <Download size={15} />
            <span>Download Invoice</span>
          </button>
          <button
            type="button"
            className="btn-sidepanel-footer-close"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </aside>
    </div>
  );
}

export default OrderDetailsSidepanel;

