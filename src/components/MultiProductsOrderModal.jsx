import { Package, X, Store, Tag, ShoppingBag, ArrowRight } from "lucide-react";
import { formatDateTime } from "../utils/dateFormatter";

function MultiProductsOrderModal({ order, isOpen, onClose, onOpenFullDetails }) {
  if (!isOpen || !order) return null;

  const rawItems = Array.isArray(order.items) && order.items.length > 0 ? order.items : [];
  const items = rawItems.map((item) => {
    const prod = (typeof item.productId === "object" && item.productId !== null) ? item.productId : (typeof item.product === "object" && item.product !== null ? item.product : {});
    const vend = (typeof item.vendorId === "object" && item.vendorId !== null) ? item.vendorId : (typeof item.vendor === "object" && item.vendor !== null ? item.vendor : {});
    return {
      name: item.name || prod.name || order.name || "Product Item",
      description: item.description || prod.description || "",
      image: item.image || prod.image || (Array.isArray(prod.images) ? prod.images[0] : "") || order.image || "",
      category: item.category || prod.category || "General",
      vendorName: item.vendorName || vend.name || prod.vendorName || order.vendorName || (typeof order.vendorId === "object" ? order.vendorId?.name : "Verified Vendor"),
      colors: item.colors || prod.colors || "",
      sizes: item.sizes || prod.sizes || "",
      qty: Number(item.qty || 1),
      price: Number(item.price || (order.totalAmount ? Number(order.totalAmount) / Number(item.qty || 1) : 0)),
    };
  });

  const subtotal = Number(order.totalAmount || items.reduce((s, i) => s + Number(i.price || 0) * Number(i.qty || 1), 0));
  const gstAmount = Math.round(subtotal * 0.18);
  const orderId = order.orderId || (order._id ? String(order._id).slice(-8).toUpperCase() : "ORD");

  return (
    <div className="wide-order-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="wide-order-modal-card" style={{ maxWidth: "750px" }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="wide-order-modal-header" style={{ padding: "18px 24px" }}>
          <div className="wide-header-info">
            <div className="wide-header-icon-box" style={{ background: "linear-gradient(135deg, #2563eb, #3b82f6)" }}>
              <Package size={22} />
            </div>
            <div>
              <div className="wide-header-top-row">
                <h2 className="wide-order-title">All Products in Order</h2>
                <span className="wide-order-id-badge">#{orderId}</span>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#2563eb", background: "#eff6ff", padding: "2px 8px", borderRadius: "12px" }}>
                  {items.length} Items Total
                </span>
              </div>
              <p className="wide-order-placed-subtitle">
                Placed on {formatDateTime(order.createdAt)}
              </p>
            </div>
          </div>
          <button type="button" className="wide-order-modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="wide-order-modal-body" style={{ padding: "20px 24px", gap: "16px" }}>
          <div className="multi-order-items-list" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {items.map((item, idx) => {
              const lineTotal = Number(item.price || 0) * Number(item.qty || 1);
              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 16px",
                    background: "#ffffff",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "12px",
                    gap: "14px",
                    transition: "border-color 0.15s, transform 0.15s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1, minWidth: 0 }}>
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{ width: "56px", height: "56px", borderRadius: "10px", objectFit: "cover", border: "1px solid #e2e8f0", flexShrink: 0 }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "56px",
                          height: "56px",
                          borderRadius: "10px",
                          background: "#eff6ff",
                          color: "#2563eb",
                          border: "1px solid #bfdbfe",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0
                        }}
                      >
                        <Package size={26} />
                      </div>
                    )}
                    <div style={{ minWidth: 0 }}>
                      <h4 style={{ margin: "0 0 4px", fontSize: "14.5px", fontWeight: "700", color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.name}
                      </h4>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        {item.category && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "11px", fontWeight: "600", color: "#2563eb", background: "#eff6ff", padding: "1px 6px", borderRadius: "5px" }}>
                            <Tag size={10} /> {item.category}
                          </span>
                        )}
                        {item.vendorName && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "11.5px", color: "#475569", background: "#f8fafc", padding: "1px 6px", borderRadius: "5px", border: "1px solid #e2e8f0" }}>
                            <Store size={10} /> {item.vendorName}
                          </span>
                        )}
                        {item.colors && item.colors !== "N/A" && (
                          <span style={{ fontSize: "11px", color: "#64748b" }}>Color: <strong>{item.colors}</strong></span>
                        )}
                        {item.sizes && item.sizes !== "N/A" && (
                          <span style={{ fontSize: "11px", color: "#64748b" }}>Size: <strong>{item.sizes}</strong></span>
                        )}
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                        Quantity: <strong style={{ color: "#1e293b" }}>{item.qty}</strong> &nbsp;•&nbsp; Unit Price: <strong style={{ color: "#1e293b" }}>₹ {Number(item.price || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: "11.5px", color: "#64748b", textTransform: "uppercase", fontWeight: "600" }}>Total</div>
                    <div style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
                      ₹ {lineTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bill Summary */}
          <div className="wide-bill-summary-card" style={{ marginTop: "4px" }}>
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
              <span>Total Amount:</span>
              <span className="grand-amount">₹ {subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="wide-order-modal-footer" style={{ padding: "16px 24px" }}>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Close
          </button>
          {onOpenFullDetails && (
            <button
              type="button"
              className="btn btn-primary"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              onClick={() => {
                onClose();
                onOpenFullDetails(order);
              }}
            >
              <span>View Full Order Journey</span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default MultiProductsOrderModal;

