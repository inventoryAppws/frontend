import { useState, useMemo, useEffect, useCallback } from "react";
import {
  X,
  RotateCcw,
  Ban,
  Wallet,
  Package,
  Calendar,
  IndianRupee,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Search,
  Filter,
  ShieldCheck,
  RefreshCw,
  Truck,
  Check
} from "lucide-react";
import { formatDate, formatDateTime } from "../utils/dateFormatter";
import { getReturns } from "../services/returnService";

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

// Returns: 6 steps divided within 24 hours (1 day)
const RETURN_TRACKING_STEPS = [
  { key: "requested", label: "Return Requested", desc: "Return request submitted and under verification", hours: 0 },
  { key: "pickup_confirmed", label: "Pickup Confirmed", desc: "Courier partner assigned for doorstep pickup", hours: 4 },
  { key: "item_received", label: "Item Received at Center", desc: "Product received at inspection hub", hours: 8 },
  { key: "quality_passed", label: "Quality Check Passed", desc: "Item inspected and passed quality standards", hours: 14 },
  { key: "refund_initiated", label: "Refund Initiated", desc: "Refund payment dispatched to your account", hours: 19 },
  { key: "refund_credited", label: "Refund Credited", desc: "Refund amount credited successfully to your Wallet", hours: 24 }
];

// Cancellations: 4 steps divided within 24 hours (1 day)
const CANCELLATION_TRACKING_STEPS = [
  { key: "requested", label: "Cancellation Confirmed", desc: "Order cancellation processed successfully", hours: 0 },
  { key: "inventory_restored", label: "Merchant & Stock Restored", desc: "Dispatch halted and warehouse stock updated", hours: 6 },
  { key: "refund_initiated", label: "Refund Initiated", desc: "Refund payment dispatched to your account", hours: 14 },
  { key: "refund_credited", label: "Refund Credited", desc: "Refund credited successfully to your Wallet", hours: 24 }
];

function getTrackingData(item, activeTab) {
  const isCancel = activeTab === "cancelled" || item.type === "cancellation";
  const stepsTemplate = isCancel ? CANCELLATION_TRACKING_STEPS : RETURN_TRACKING_STEPS;
  const baseTime = new Date(item.requestedAt || item.createdAt || item.placedAt || Date.now()).getTime();
  const elapsedMs = Math.max(0, Date.now() - baseTime);
  const elapsedHours = elapsedMs / (3600 * 1000);

  const statusStr = String(item.status || item.returnStatus || "requested").toLowerCase();
  const isFullyComplete = statusStr === "refund_credited" || statusStr === "completed";

  const timelineMap = new Map();
  if (Array.isArray(item.timeline)) {
    item.timeline.forEach((ev) => {
      if (ev.status) timelineMap.set(ev.status, ev);
    });
  }

  let lastCompletedIndex = 0;
  stepsTemplate.forEach((step, idx) => {
    if (isFullyComplete || elapsedHours >= step.hours || timelineMap.has(step.key) || idx === 0) {
      lastCompletedIndex = idx;
    }
  });

  const steps = stepsTemplate.map((step, idx) => {
    const isCompleted = isFullyComplete || idx <= lastCompletedIndex;
    const isCurrent = !isFullyComplete && idx === lastCompletedIndex;
    const isUpcoming = idx > lastCompletedIndex;

    const dbEvent = timelineMap.get(step.key);
    const stepTime = dbEvent
      ? new Date(dbEvent.timestamp)
      : new Date(baseTime + step.hours * 3600 * 1000);

    return {
      ...step,
      isCompleted,
      isCurrent,
      isUpcoming,
      timestamp: stepTime,
      customNote: dbEvent?.note || step.desc
    };
  });

  return {
    isCancel,
    steps,
    isFullyComplete,
    currentStep: steps[lastCompletedIndex]
  };
}

export default function ReturnRequestsSidepanel({
  isOpen,
  onClose,
  orders = [],
  onSelectOrder,
  defaultTab = "returns"
}) {
  const [activeTab, setActiveTab] = useState(defaultTab); // "returns" | "cancelled" | "refunds"
  const [searchTerm, setSearchTerm] = useState("");
  const [returnRecords, setReturnRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState(null);

  // Fetch directly from dedicated returns collection
  const loadReturnCollection = useCallback(async () => {
    if (!isOpen) return;
    setLoading(true);
    try {
      const data = await getReturns();
      const list = Array.isArray(data?.items) ? data.items : [];
      setReturnRecords(list);
    } catch {
      // fallback to orders prop
    } finally {
      setLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    loadReturnCollection();
  }, [loadReturnCollection]);

  // Combined categorization: prioritize records from dedicated 'returns' collection
  const returnOrders = useMemo(() => {
    if (returnRecords.length > 0) {
      return returnRecords.filter((r) => r.type === "return");
    }
    return orders.filter((o) => {
      const retSt = String(o.returnStatus || "").toLowerCase();
      const st = String(o.status || "").toLowerCase();
      return (retSt && retSt !== "none") || st === "return_requested" || st === "returned";
    });
  }, [returnRecords, orders]);

  const cancelledOrders = useMemo(() => {
    if (returnRecords.length > 0) {
      return returnRecords.filter((r) => r.type === "cancellation");
    }
    return orders.filter((o) => String(o.status || "").toLowerCase() === "cancelled");
  }, [returnRecords, orders]);

  const refundOrders = useMemo(() => {
    if (returnRecords.length > 0) {
      return returnRecords.filter(
        (r) => r.type === "refund" || Number(r.refundAmount || 0) > 0 || r.refundStatus === "credited"
      );
    }
    return orders.filter((o) => {
      const hasRefund = Number(o.refundAmount || 0) > 0;
      const refSt = String(o.refundStatus || "").toLowerCase();
      const isCancelledOrReturned = ["cancelled", "returned", "return_requested"].includes(
        String(o.status || "").toLowerCase()
      );
      return hasRefund || (refSt && refSt !== "none") || (isCancelledOrReturned && o.paymentMethod !== "cod");
    });
  }, [returnRecords, orders]);

  // Active list based on tab
  const activeList = useMemo(() => {
    let current = [];
    if (activeTab === "returns") current = returnOrders;
    else if (activeTab === "cancelled") current = cancelledOrders;
    else if (activeTab === "refunds") current = refundOrders;

    if (!searchTerm.trim()) return current;

    const query = searchTerm.toLowerCase();
    return current.filter((o) => {
      const oId = String(o.orderId || o.returnId || o._id || "").toLowerCase();
      const reason = String(o.reason || o.returnReason || o.cancellationReason || "").toLowerCase();
      const itemsMatch = Array.isArray(o.items)
        ? o.items.some((it) => String(it.name || "").toLowerCase().includes(query))
        : false;
      return oId.includes(query) || reason.includes(query) || itemsMatch;
    });
  }, [activeTab, returnOrders, cancelledOrders, refundOrders, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="requests-sidepanel-backdrop" onClick={onClose}>
      <div className="requests-sidepanel-drawer" onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="requests-sidepanel-header">
          <div className="requests-header-left">
            <div className="requests-header-icon-box">
              <RotateCcw size={20} />
            </div>
            <div>
              <h3>Returns, Cancellations & Refunds</h3>
              <p>Backed by dedicated Returns & Statuses collection</p>
            </div>
          </div>
          <button
            type="button"
            className="requests-sidepanel-close-btn"
            onClick={onClose}
            aria-label="Close drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* TAB NAVIGATION BAR */}
        <div className="requests-tabs-nav">
          <button
            type="button"
            className={`requests-tab-btn ${activeTab === "returns" ? "active" : ""}`}
            onClick={() => setActiveTab("returns")}
          >
            <RotateCcw size={15} />
            <span>Returns</span>
            <span className="requests-tab-badge">{returnOrders.length}</span>
          </button>

          <button
            type="button"
            className={`requests-tab-btn ${activeTab === "cancelled" ? "active" : ""}`}
            onClick={() => setActiveTab("cancelled")}
          >
            <Ban size={15} />
            <span>Cancelled</span>
            <span className="requests-tab-badge">{cancelledOrders.length}</span>
          </button>

          <button
            type="button"
            className={`requests-tab-btn ${activeTab === "refunds" ? "active" : ""}`}
            onClick={() => setActiveTab("refunds")}
          >
            <Wallet size={15} />
            <span>Refunds</span>
            <span className="requests-tab-badge">{refundOrders.length}</span>
          </button>
        </div>

        {/* SEARCH FILTER */}
        <div className="requests-search-bar">
          <Search size={16} className="requests-search-icon" />
          <input
            type="text"
            placeholder={`Search ${activeTab} by Order/Return ID, product, or reason...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="requests-search-clear-btn"
              onClick={() => setSearchTerm("")}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* LIST CONTENT */}
        <div className="requests-sidepanel-body">
          {activeList.length === 0 ? (
            <div className="requests-empty-state">
              <div className="requests-empty-icon">
                {activeTab === "returns" && <RotateCcw size={36} />}
                {activeTab === "cancelled" && <Ban size={36} />}
                {activeTab === "refunds" && <Wallet size={36} />}
              </div>
              <h4>No {activeTab} found</h4>
              <p>
                {searchTerm
                  ? `No matching records found for "${searchTerm}".`
                  : activeTab === "returns"
                  ? "You have not submitted any product return requests."
                  : activeTab === "cancelled"
                  ? "You have no cancelled orders."
                  : "No wallet refunds or credit transactions."}
              </p>
            </div>
          ) : (
            <div className="requests-cards-list">
              {activeList.map((item) => {
                const orderId = item.orderId || (item._id ? String(item._id).slice(-8).toUpperCase() : "ORD");
                const returnId = item.returnId || null;
                const firstItem = Array.isArray(item.items) && item.items.length > 0 ? item.items[0] : null;
                const totalItemsCount = Array.isArray(item.items) ? item.items.length : 1;
                const totalAmount = Number(item.totalAmount || 0);
                const refundAmount = Number(item.refundAmount || 0);
                const dateVal = item.requestedAt || item.createdAt || item.placedAt;

                const statusStr = String(item.status || item.returnStatus || "requested").toLowerCase();
                const isExpanded = expandedCardId === item._id;
                const trackingData = getTrackingData(item, activeTab);

                return (
                  <div key={item._id} className={`request-card-item ${isExpanded ? "card-expanded" : ""}`}>
                    
                    {/* CARD HEADER */}
                    <div className="request-card-header">
                      <div className="request-order-id-group">
                        <div className="request-order-id-line">
                          <span className="request-order-id-tag">#{orderId}</span>
                          {returnId && (
                            <span className="request-return-id-tag">({returnId})</span>
                          )}
                        </div>
                        <span className="request-order-date">
                          {formatShortDate(dateVal)}
                        </span>
                      </div>

                      {/* Status Badges */}
                      {activeTab === "returns" && (
                        <span className={`request-status-pill return-${statusStr}`}>
                          {statusStr === "requested" ? "RETURN REQUESTED" : statusStr.replace(/_/g, " ").toUpperCase()}
                        </span>
                      )}

                      {activeTab === "cancelled" && (
                        <span className="request-status-pill cancelled">
                          CANCELLED
                        </span>
                      )}

                      {activeTab === "refunds" && (
                        <span className={`request-status-pill refund-${item.refundStatus || "credited"}`}>
                          {item.paymentMethod === "cod" && item.refundStatus === "none"
                            ? "NO REFUND (COD)"
                            : `REFUND ${String(item.refundStatus || "CREDITED").replace(/_/g, " ").toUpperCase()}`}
                        </span>
                      )}
                    </div>

                    {/* PRODUCT ITEM PREVIEW */}
                    <div className="request-card-products">
                      {firstItem ? (
                        <div className="request-product-row">
                          {firstItem.image ? (
                            <img src={firstItem.image} alt={firstItem.name} className="request-prod-thumb" />
                          ) : (
                            <div className="request-prod-thumb-placeholder">
                              <Package size={16} />
                            </div>
                          )}
                          <div className="request-prod-details">
                            <span className="request-prod-name">{firstItem.name || "Product Item"}</span>
                            <span className="request-prod-qty">
                              Qty: {firstItem.qty || item.qty || 1} &bull; ₹{Number(firstItem.price || item.price || 0).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="request-product-row">
                          <div className="request-prod-thumb-placeholder">
                            <Package size={16} />
                          </div>
                          <div className="request-prod-details">
                            <span className="request-prod-name">Order Items</span>
                            <span className="request-prod-qty">Total items: {totalItemsCount}</span>
                          </div>
                        </div>
                      )}

                      {totalItemsCount > 1 && (
                        <div className="request-more-items-tag">
                          +{totalItemsCount - 1} more item{totalItemsCount > 2 ? "s" : ""} in this order
                        </div>
                      )}
                    </div>

                    {/* REASON BOX */}
                    {(item.reason || item.returnReason || item.cancellationReason) && (
                      <div className="request-reason-box">
                        <strong>
                          {activeTab === "returns" ? "Return Reason:" : "Cancellation Reason:"}
                        </strong>
                        <p>{item.reason || item.returnReason || item.cancellationReason}</p>
                        {(item.comments || item.returnComments) && (
                          <p className="request-user-comment">Note: "{item.comments || item.returnComments}"</p>
                        )}
                      </div>
                    )}

                    {/* FINANCIAL & ACTION FOOTER */}
                    <div className="request-card-footer">
                      <div className="request-footer-amount">
                        {activeTab === "refunds" ? (
                          <div>
                            <span className="request-amount-label">Refund Amount</span>
                            <strong className="request-amount-val refund-val">
                              ₹ {Number(refundAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </strong>
                          </div>
                        ) : (
                          <div>
                            <span className="request-amount-label">Order Total</span>
                            <strong className="request-amount-val">
                              ₹ {Number(totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </strong>
                          </div>
                        )}
                      </div>

                      <div className="request-footer-actions">
                        <button
                          type="button"
                          className={`request-track-btn ${isExpanded ? "active" : ""}`}
                          onClick={() => setExpandedCardId(isExpanded ? null : item._id)}
                          title="Track status step-by-step"
                        >
                          <Truck size={14} />
                          <span>{isExpanded ? "Hide Tracking" : "Track Status"}</span>
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>

                        {onSelectOrder && (
                          <button
                            type="button"
                            className="request-view-btn"
                            onClick={() => {
                              onSelectOrder(item.orderRef || item);
                              onClose();
                            }}
                          >
                            <span>View Order</span>
                            <ChevronRight size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* EXPANDED VERTICAL TRACKING SECTION */}
                    {isExpanded && (
                      <div className="request-tracking-expanded-panel">
                        <div className="track-expanded-top-info">
                          <div className="track-live-indicator">
                            <span className="live-ping-dot" />
                            <span className="live-track-title">
                              {trackingData.isCancel ? "Cancellation & Refund Journey" : "Return & Refund Journey"}
                            </span>
                          </div>
                          <span className="track-cycle-badge">
                            {trackingData.isFullyComplete ? "Completed" : "24-Hour Cycle"}
                          </span>
                        </div>

                        <div className="vertical-steps-flow">
                          {trackingData.steps.map((step, sIdx) => {
                            const isDone = step.isCompleted;
                            const isCurrent = step.isCurrent;
                            const isLast = sIdx === trackingData.steps.length - 1;

                            return (
                              <div
                                key={step.key}
                                className={`vertical-step-row ${isDone ? "is-done" : isCurrent ? "is-current" : "is-pending"}`}
                              >
                                <div className="step-node-col">
                                  <div className="step-node-circle">
                                    {isDone ? (
                                      <Check size={11} className="step-check-icon" />
                                    ) : isCurrent ? (
                                      <div className="step-pulsing-node" />
                                    ) : (
                                      <span className="step-empty-dot" />
                                    )}
                                  </div>
                                  {!isLast && <div className={`step-connector-line ${isDone ? "line-done" : ""}`} />}
                                </div>

                                <div className="step-details-col">
                                  <div className="step-heading-line">
                                    <strong className="step-name">{step.label}</strong>
                                    <span className="step-timestamp">
                                      {formatShortDate(step.timestamp)}, {formatTime(step.timestamp)}
                                    </span>
                                  </div>
                                  <p className="step-note-text">{step.customNote}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="track-expanded-notice">
                          <ShieldCheck size={15} className="notice-icon" />
                          <span>
                            {trackingData.isCancel
                              ? `₹${Number(refundAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })} refund processed via automated 24-hour verification cycle.`
                              : `Doorstep pickup & quality inspection scheduled within 24h. Refund amount ₹${Number(refundAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })} will be credited to your Wallet.`}
                          </span>
                        </div>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FOOTER INFO */}
        <div className="requests-sidepanel-footer">
          <div className="requests-footer-tip">
            <CheckCircle2 size={15} className="tip-icon" />
            <span>All returns, cancellations and refunds are securely tracked in the dedicated database collection.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
