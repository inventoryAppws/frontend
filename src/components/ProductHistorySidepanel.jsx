import { useEffect, useState, useCallback } from "react";
import {
  X,
  History,
  Package,
  Plus,
  Minus,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Boxes,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Pencil,
  ArrowRight,
  Clock,
  IndianRupee,
  RefreshCw
} from "lucide-react";
import { getProductHistory, adjustProductStock } from "../services/productService";
import { formatDateTime, formatDate } from "../utils/dateFormatter";
import { toast } from "./Toast";
import Loader from "./Loader";

function ProductHistorySidepanel({
  productId,
  productInfo,
  isOpen,
  onClose,
  onStockUpdated
}) {
  const [loading, setLoading] = useState(false);
  const [historyData, setHistoryData] = useState(null);
  const [error, setError] = useState("");

  // Quick inline stock adjustment inside drawer
  const [adjusting, setAdjusting] = useState(false);
  const [adjustMode, setAdjustMode] = useState(null); // 'add' | 'reduce' | null
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  const loadHistory = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    setError("");
    try {
      const data = await getProductHistory(productId);
      setHistoryData(data);
    } catch (err) {
      setError(err?.response?.data?.msg || "Failed to load product history");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (isOpen && productId) {
      loadHistory();
      setAdjustMode(null);
      setAdjustQty("");
      setAdjustReason("");
    }
  }, [isOpen, productId, loadHistory]);

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    const qtyNum = Number(adjustQty);
    if (!qtyNum || qtyNum <= 0) {
      toast.error("Please enter a valid quantity greater than 0");
      return;
    }

    const adjustment = adjustMode === "add" ? qtyNum : -qtyNum;
    setAdjusting(true);
    try {
      const res = await adjustProductStock(productId, {
        adjustment,
        reason: adjustReason.trim() || (adjustMode === "add" ? `Vendor added +${qtyNum} units` : `Vendor reduced -${qtyNum} units`)
      });

      toast.success(res.msg || `Stock adjusted to ${res.newStock} units`);
      setAdjustMode(null);
      setAdjustQty("");
      setAdjustReason("");
      loadHistory();
      if (onStockUpdated) onStockUpdated(productId, res.newStock);
    } catch (err) {
      toast.error(err?.response?.data?.msg || "Failed to adjust stock");
    } finally {
      setAdjusting(false);
    }
  };

  if (!isOpen) return null;

  const currentProduct = historyData?.product || productInfo || {};
  const currentStock = historyData?.summary?.currentStock ?? currentProduct?.quantity ?? 0;
  const items = historyData?.items || [];
  const summary = historyData?.summary || { totalAdded: 0, totalSold: 0, totalAdjusted: 0 };

  const getEventIcon = (type, qtyChange) => {
    switch (type) {
      case "PRODUCT_CREATED":
        return { icon: Sparkles, color: "slate", label: "Product Created" };
      case "ORDER_PLACED":
        return { icon: ShoppingCart, color: "rose", label: "Customer Purchase" };
      case "STOCK_ADJUSTMENT":
        return qtyChange >= 0
          ? { icon: Plus, color: "emerald", label: "Stock Added" }
          : { icon: Minus, color: "blue", label: "Manual Adjustment" };
      case "ORDER_CANCELLED":
        return { icon: RotateCcw, color: "teal", label: "Order Cancelled" };
      case "ORDER_RETURNED":
        return { icon: RotateCcw, color: "amber", label: "Customer Return" };
      case "PRODUCT_EDITED":
        return { icon: Pencil, color: "purple", label: "Product Edited" };
      case "PRODUCT_DELETED":
        return { icon: X, color: "slate", label: "Product Archived" };
      default:
        return { icon: Boxes, color: "blue", label: "Inventory Event" };
    }
  };

  return (
    <div className="product-history-backdrop" onClick={onClose}>
      <div
        className="product-history-drawer"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* DRAWER HEADER */}
        <div className="product-history-header">
          <div className="product-history-header-left">
            <div className="product-history-thumb">
              {currentProduct.image ? (
                <img
                  src={currentProduct.image}
                  alt={currentProduct.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80";
                  }}
                />
              ) : (
                <Package size={22} />
              )}
            </div>
            <div className="product-history-title-wrap">
              <span className="product-history-kicker">INVENTORY AUDIT TRAIL</span>
              <h3>{currentProduct.name || "Product History"}</h3>
              <div className="product-history-meta-row">
                <span className="product-history-category-badge">
                  {currentProduct.category || "General"}
                </span>
                <span className="product-history-sku">
                  ID: {String(productId || "").slice(-8).toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="product-history-close-btn"
            onClick={onClose}
            aria-label="Close History Panel"
          >
            <X size={18} />
          </button>
        </div>


        {/* SUMMARY STATS STRIP */}
        <div className="product-history-summary-strip">
          <div className="history-metric-box">
            <span className="history-metric-label">Current Stock</span>
            <strong
              className={`history-metric-value ${
                currentStock <= 0
                  ? "out-of-stock"
                  : currentStock <= 10
                  ? "low-stock"
                  : "in-stock"
              }`}
            >
              {currentStock} <span className="unit">units</span>
            </strong>
          </div>

          <div className="history-metric-box">
            <span className="history-metric-label">Total Added</span>
            <strong className="history-metric-value positive">
              +{summary.totalAdded}
            </strong>
          </div>

          <div className="history-metric-box">
            <span className="history-metric-label">Total Sold</span>
            <strong className="history-metric-value negative">
              -{summary.totalSold}
            </strong>
          </div>

          <div className="history-metric-box">
            <span className="history-metric-label">Total Events</span>
            <strong className="history-metric-value neutral">
              {items.length}
            </strong>
          </div>
        </div>

        {/* QUICK STOCK ADJUSTMENT SECTION */}
        <div className="product-history-adjust-section">
          {!adjustMode ? (
            <div className="history-adjust-buttons">
              <button
                type="button"
                className="history-quick-btn add"
                onClick={() => {
                  setAdjustMode("add");
                  setAdjustQty("10");
                }}
              >
                <Plus size={15} />
                <span>Add Stock (+Restock)</span>
              </button>

              <button
                type="button"
                className="history-quick-btn reduce"
                onClick={() => {
                  setAdjustMode("reduce");
                  setAdjustQty("1");
                }}
              >
                <Minus size={15} />
                <span>Reduce Stock (-Deduct)</span>
              </button>
            </div>
          ) : (
            <form className="history-adjust-form" onSubmit={handleAdjustSubmit}>
              <div className="history-form-header">
                <strong>
                  {adjustMode === "add" ? "Add Stock (+Units)" : "Reduce Stock (-Units)"}
                </strong>
                <button
                  type="button"
                  className="history-cancel-btn"
                  onClick={() => setAdjustMode(null)}
                >
                  Cancel
                </button>
              </div>

              <div className="history-form-inputs">
                <div className="history-input-group">
                  <label>Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(e.target.value)}
                    placeholder="e.g. 10"
                    required
                    autoFocus
                  />
                </div>

                <div className="history-input-group flex-2">
                  <label>Reason / Reference (Optional)</label>
                  <input
                    type="text"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    placeholder={
                      adjustMode === "add"
                        ? "e.g. Supplier shipment, restocked batch"
                        : "e.g. Damaged inventory, manual correction"
                    }
                  />
                </div>

                <button
                  type="submit"
                  disabled={adjusting}
                  className={`history-submit-adjust-btn ${adjustMode}`}
                >
                  {adjusting ? "Saving..." : adjustMode === "add" ? "Confirm Add" : "Confirm Reduce"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* TIMELINE LIST */}
        <div className="product-history-content">
          <div className="product-history-timeline-header">
            <h4>
              <History size={16} />
              Stock Movement Timeline
            </h4>
            <button
              type="button"
              className="history-refresh-btn"
              onClick={loadHistory}
              title="Refresh timeline"
            >
              <RefreshCw size={13} className={loading ? "spin" : ""} />
              <span>Refresh</span>
            </button>
          </div>

          {loading ? (
            <div className="history-loader-wrap">
              <Loader text="Loading audit timeline..." />
            </div>
          ) : error ? (
            <div className="history-error-state">
              <AlertTriangle size={24} />
              <p>{error}</p>
              <button type="button" onClick={loadHistory}>
                Try Again
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="history-empty-state">
              <Boxes size={36} />
              <h4>No inventory events recorded yet</h4>
              <p>Events will be tracked automatically whenever orders or stock updates occur.</p>
            </div>
          ) : (
            <div className="product-history-timeline">
              {items.map((entry, idx) => {
                const meta = getEventIcon(entry.type, entry.quantityChange);
                const IconComponent = meta.icon;
                const isPositive = entry.quantityChange > 0;
                const isNegative = entry.quantityChange < 0;

                return (
                  <div key={entry._id || idx} className="history-timeline-item">
                    {/* Timeline Node Icon */}
                    <div className={`history-timeline-node ${meta.color}`}>
                      <IconComponent size={14} />
                    </div>

                    {/* Timeline Card */}
                    <div className={`history-timeline-card ${meta.color}`}>
                      <div className="history-card-top">
                        <div className="history-card-left">
                          <span className={`history-event-tag ${meta.color}`}>
                            {meta.label}
                          </span>
                          {entry.referenceId && (
                            <span className="history-ref-badge">
                              #{entry.referenceId}
                            </span>
                          )}
                        </div>

                        <div className="history-card-right">
                          <span
                            className={`history-qty-pill ${meta.color}`}
                          >
                            {isPositive ? `+${entry.quantityChange}` : entry.quantityChange}
                          </span>
                        </div>
                      </div>

                      <p className="history-reason-text">
                        {entry.reason || "Inventory update"}
                      </p>

                      <div className="history-card-footer">
                        <div className="history-stock-progression">
                          <span className="stock-label">Stock Change:</span>
                          <strong>{entry.stockBefore}</strong>
                          <ArrowRight size={12} className="arrow" />
                          <strong className="after">{entry.stockAfter}</strong>
                        </div>

                        <div className="history-timestamp">
                          <Clock size={12} />
                          <span>{formatDateTime(entry.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* DRAWER FOOTER */}
        <div className="product-history-footer">
          <div className="history-footer-stock-pill">
            <span>Verified Current Inventory:</span>
            <strong>{currentStock} Units Available</strong>
          </div>
          <button type="button" className="history-done-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductHistorySidepanel;

