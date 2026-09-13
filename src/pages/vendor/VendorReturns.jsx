import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RotateCcw,
  Search,
  X,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  IndianRupee,
  Clock,
  ArrowUpDown,
  Home,
  ChevronRight,
  Copy,
  Check,
  MapPin,
  Phone,
  User,
  ExternalLink,
  ShieldCheck,
  Boxes,
  Warehouse,
  AlertCircle,
  FileText,
  HelpCircle,
  ArrowRight
} from "lucide-react";
import { getReturns, updateReturnStatus } from "../../services/returnService";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";
import CustomSelect from "../../components/CustomSelect";
import { formatDate, formatDateTime } from "../../utils/dateFormatter";
import { getErrorMessage } from "../../utils/errorHandler";
import { toast } from "../../components/Toast";
import useDebounce from "../../hooks/useDebounce";

const RETURN_SORT_OPTIONS = [
  { value: "date_desc", label: "Date: Newest First" },
  { value: "date_asc", label: "Date: Oldest First" },
  { value: "amount_desc", label: "Refund: High to Low" },
  { value: "amount_asc", label: "Refund: Low to High" },
  { value: "id_desc", label: "Claim ID: Descending" },
  { value: "id_asc", label: "Claim ID: Ascending" }
];

const REVERSE_LOGISTICS_STAGES = [
  { id: "requested", label: "Return Requested", desc: "Claim submitted by customer" },
  { id: "pickup_confirmed", label: "Pickup Scheduled", desc: "Reverse courier dispatched" },
  { id: "item_received", label: "Item Received at Hub", desc: "Arrived for inspection" },
  { id: "quality_passed", label: "Quality Passed", desc: "Restocked into inventory" },
  { id: "refund_credited", label: "Refund Credited", desc: "Settled to customer wallet" }
];

function getStageIndex(status) {
  const s = String(status || "").toLowerCase();
  if (s === "refund_credited" || s === "completed") return 4;
  if (s === "quality_passed") return 3;
  if (s === "item_received") return 2;
  if (s === "pickup_confirmed" || s === "pickup_scheduled" || s === "picked_up" || s === "approved") return 1;
  return 0; // requested
}

function getItemImage(item) {
  if (item?.image && typeof item.image === "string" && item.image.trim()) {
    return item.image;
  }
  return "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&auto=format&fit=crop&q=80";
}

function VendorReturns() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters & Sorting
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date_desc");

  // Console Modal state
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionNote, setRejectionNote] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  // Copy state
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast.success(`Copied #${text} to clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const loadReturnsData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getReturns();
      const list = Array.isArray(res?.items) ? res.items : [];
      setReturns(list);
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to load returns");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReturnsData();
  }, [loadReturnsData]);

  // Handle Vendor Action on Return Claim
  const handleClaimAction = async (claim, action) => {
    if (!claim) return;
    setActionLoading(true);
    try {
      const refundAmt = Number(claim.refundAmount || claim.totalAmount || 0);
      await updateReturnStatus(
        claim._id,
        action,
        action === "reject" ? rejectionNote : "",
        refundAmt
      );

      toast.success(
        action === "approve_pickup"
          ? "Reverse courier pickup scheduled successfully!"
          : action === "confirm_received"
          ? "Item logged as received at inspection hub!"
          : action === "pass_quality"
          ? "Quality check passed! Inventory stock restored."
          : action === "credit_refund"
          ? "Refund credited directly to customer wallet!"
          : "Return claim declined."
      );

      await loadReturnsData();
      if (selectedClaim && selectedClaim._id === claim._id) {
        setSelectedClaim(null);
      }
      setShowRejectInput(false);
      setRejectionNote("");
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to execute return action");
    } finally {
      setActionLoading(false);
    }
  };

  // Status Metrics
  const metrics = useMemo(() => {
    let requested = 0;
    let inTransit = 0;
    let inHub = 0;
    let passed = 0;
    let credited = 0;
    let cancelled = 0;
    let rejected = 0;
    let totalRefunded = 0;
    let totalRestockedValue = 0;
    let restockedUnits = 0;

    returns.forEach((r) => {
      const st = String(r.status || "requested").toLowerCase();
      const refundAmt = Number(r.refundAmount || r.totalAmount || 0);

      if (st === "requested") requested++;
      else if (st === "pickup_confirmed" || st === "pickup_scheduled" || st === "picked_up" || st === "approved") inTransit++;
      else if (st === "item_received") inHub++;
      else if (st === "quality_passed") {
        passed++;
        if (r.isStockRestored) {
          totalRestockedValue += refundAmt;
          restockedUnits += Array.isArray(r.items) ? r.items.reduce((acc, it) => acc + (it.qty || 1), 0) : 1;
        }
      } else if (st === "refund_credited" || st === "completed") {
        credited++;
        totalRefunded += refundAmt;
        if (r.isStockRestored) {
          totalRestockedValue += refundAmt;
          restockedUnits += Array.isArray(r.items) ? r.items.reduce((acc, it) => acc + (it.qty || 1), 0) : 1;
        }
      } else if (st === "cancelled") cancelled++;
      else if (st === "rejected") rejected++;
    });

    return {
      total: returns.length,
      activeClaims: requested + inTransit + inHub,
      requested,
      inTransit,
      inHub,
      passed,
      credited,
      cancelled,
      rejected,
      totalRefunded,
      totalRestockedValue,
      restockedUnits
    };
  }, [returns]);

  // Filtered & Sorted claims
  const filteredClaims = useMemo(() => {
    return returns.filter((claim) => {
      const rId = String(claim.returnId || claim._id || "").toLowerCase();
      const oId = String(claim.orderId || claim.orderRef?.orderId || "").toLowerCase();
      const cust = String(claim.customerId?.name || claim.customerName || "").toLowerCase();
      const reason = String(claim.reason || claim.returnReason || "").toLowerCase();
      const itemsMatch = Array.isArray(claim.items)
        ? claim.items.some((it) => String(it.name || "").toLowerCase().includes(debouncedSearch.toLowerCase()))
        : false;

      const matchesSearch =
        !debouncedSearch ||
        rId.includes(debouncedSearch.toLowerCase()) ||
        oId.includes(debouncedSearch.toLowerCase()) ||
        cust.includes(debouncedSearch.toLowerCase()) ||
        reason.includes(debouncedSearch.toLowerCase()) ||
        itemsMatch;

      const st = String(claim.status || "requested").toLowerCase();

      let matchesStatus = true;
      if (statusFilter === "requested") matchesStatus = st === "requested";
      else if (statusFilter === "transit") matchesStatus = ["pickup_confirmed", "pickup_scheduled", "picked_up", "approved"].includes(st);
      else if (statusFilter === "hub") matchesStatus = st === "item_received";
      else if (statusFilter === "passed") matchesStatus = st === "quality_passed";
      else if (statusFilter === "credited") matchesStatus = ["refund_credited", "completed"].includes(st);
      else if (statusFilter === "cancelled") matchesStatus = st === "cancelled";
      else if (statusFilter === "rejected") matchesStatus = st === "rejected";

      return matchesSearch && matchesStatus;
    });
  }, [returns, debouncedSearch, statusFilter]);

  const sortedClaims = useMemo(() => {
    return [...filteredClaims].sort((a, b) => {
      const dateA = new Date(a.requestedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.requestedAt || b.createdAt || 0).getTime();
      const amtA = Number(a.refundAmount || a.totalAmount || 0);
      const amtB = Number(b.refundAmount || b.totalAmount || 0);

      switch (sortBy) {
        case "date_asc":
          return dateA - dateB;
        case "date_desc":
          return dateB - dateA;
        case "amount_desc":
          return amtB - amtA;
        case "amount_asc":
          return amtA - amtB;
        case "id_desc":
          return String(b.returnId || b._id).localeCompare(String(a.returnId || a._id));
        case "id_asc":
          return String(a.returnId || a._id).localeCompare(String(b.returnId || b._id));
        default:
          return dateB - dateA;
      }
    });
  }, [filteredClaims, sortBy]);

  return (
    <div className="vendor-returns-container">
      {/* 1. BREADCRUMB & HEADER */}
      <div className="vendor-returns-header">
        <div className="vendor-returns-title-block">
          <div className="vendor-breadcrumb">
            <Home size={13} />
            <span>Returns &amp; Refunds</span>
            <ChevronRight size={13} />
            <span className="current">Logistics &amp; Claims Console</span>
          </div>
          <h2>Returns &amp; Refunds Console</h2>
          <p className="vendor-page-subtext">
            Track customer return claims, reverse courier dispatch, inspection, and automated wallet settlements.
          </p>
        </div>

        <div className="vendor-returns-header-actions">
          <button
            type="button"
            className="vendor-btn-secondary"
            onClick={loadReturnsData}
            title="Refresh returns data"
          >
            <RotateCcw size={14} />
            <span>Sync Claims</span>
          </button>
        </div>
      </div>

      {/* 2. TOP METRICS STRIP WITH HERO ASSETS BANNER (Adapted from app themes / Image 1) */}
      <div className="vendor-returns-top-section">
        {/* 4 Core Returns KPI Cards */}
        <div className="vendor-returns-kpi-grid">
          <div className="returns-kpi-card">
            <div className="kpi-icon-box amber">
              <RotateCcw size={18} />
            </div>
            <div className="kpi-content">
              <span className="kpi-label">Active Claims</span>
              <strong className="kpi-value">{metrics.activeClaims}</strong>
              <span className="kpi-subtext">Awaiting inspection / pickup</span>
            </div>
          </div>

          <div className="returns-kpi-card">
            <div className="kpi-icon-box blue">
              <Warehouse size={18} />
            </div>
            <div className="kpi-content">
              <span className="kpi-label">At Inspection Hub</span>
              <strong className="kpi-value">{metrics.inHub}</strong>
              <span className="kpi-subtext">Arrived for quality verification</span>
            </div>
          </div>

          <div className="returns-kpi-card">
            <div className="kpi-icon-box emerald">
              <Boxes size={18} />
            </div>
            <div className="kpi-content">
              <span className="kpi-label">Restocked into Catalog</span>
              <strong className="kpi-value">{metrics.passed + metrics.credited}</strong>
              <span className="kpi-subtext">Quality passed &amp; inventory replenished</span>
            </div>
          </div>

          <div className="returns-kpi-card">
            <div className="kpi-icon-box rose">
              <XCircle size={18} />
            </div>
            <div className="kpi-content">
              <span className="kpi-label">Cancelled / Declined</span>
              <strong className="kpi-value">{metrics.cancelled + metrics.rejected}</strong>
              <span className="kpi-subtext">
                {metrics.cancelled} by customer • {metrics.rejected} rejected
              </span>
            </div>
          </div>
        </div>

        {/* FEATURED DARK BANNER CARD (Faithfully adapted from user reference image) */}
        <div className="returns-featured-asset-card">
          <div className="asset-card-tag">SETTLEMENT &amp; RECOVERED ASSETS</div>
          <h3 className="asset-card-title">Total Refunds Issued</h3>
          <div className="asset-card-val">
            ₹{metrics.totalRefunded.toLocaleString("en-IN")}
          </div>
          <p className="asset-card-subtext">
            Commercial inventory value of <strong>₹{metrics.totalRestockedValue.toLocaleString("en-IN")}</strong> recovered across <strong>{metrics.restockedUnits}</strong> restocked stock units.
          </p>

          <div className="asset-card-footer-stats">
            <div className="asset-stat-item">
              <span className="stat-name">Pending Actions:</span>
              <strong className="stat-val pending">{metrics.requested} claims</strong>
            </div>
            <div className="asset-stat-item">
              <span className="stat-name">In Transit:</span>
              <strong className="stat-val transit">{metrics.inTransit} courier pick</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 3. TOOLBAR: SEARCH, SORT & RETURNS FILTER TABS */}
      <div className="vendor-returns-toolbar">
        <div className="vendor-returns-toolbar-left">
          {/* Search */}
          <div className="vendor-returns-search">
            <input
              type="text"
              placeholder="Search by Claim ID, Order ID, customer, or product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="search-actions-right">
              {search && (
                <button
                  type="button"
                  className="clear-btn"
                  onClick={() => setSearch("")}
                  title="Clear search"
                >
                  <X size={13} />
                </button>
              )}
              <Search size={15} className="search-icon-right" />
            </div>
          </div>

          {/* Sort */}
          <div className="vendor-returns-sort">
            <CustomSelect
              value={sortBy}
              onChange={(val) => setSortBy(val)}
              options={RETURN_SORT_OPTIONS}
              placeholder="Sort by"
              size="sm"
              ariaLabel="Sort Claims"
              prefixIcon={<ArrowUpDown size={13} />}
              className="vendor-sort-select"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="vendor-returns-tabs">
          <button
            type="button"
            className={`returns-tab-btn ${statusFilter === "all" ? "active" : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            All ({metrics.total})
          </button>
          <button
            type="button"
            className={`returns-tab-btn ${statusFilter === "requested" ? "active" : ""}`}
            onClick={() => setStatusFilter("requested")}
          >
            Pending Approval ({metrics.requested})
          </button>
          <button
            type="button"
            className={`returns-tab-btn ${statusFilter === "transit" ? "active" : ""}`}
            onClick={() => setStatusFilter("transit")}
          >
            Pickup &amp; Transit ({metrics.inTransit})
          </button>
          <button
            type="button"
            className={`returns-tab-btn ${statusFilter === "hub" ? "active" : ""}`}
            onClick={() => setStatusFilter("hub")}
          >
            At Hub ({metrics.inHub})
          </button>
          <button
            type="button"
            className={`returns-tab-btn ${statusFilter === "passed" ? "active" : ""}`}
            onClick={() => setStatusFilter("passed")}
          >
            Quality Passed ({metrics.passed})
          </button>
          <button
            type="button"
            className={`returns-tab-btn ${statusFilter === "credited" ? "active" : ""}`}
            onClick={() => setStatusFilter("credited")}
          >
            Refunded ({metrics.credited})
          </button>
          <button
            type="button"
            className={`returns-tab-btn ${statusFilter === "cancelled" ? "active" : ""}`}
            onClick={() => setStatusFilter("cancelled")}
          >
            Cancelled by Customer ({metrics.cancelled})
          </button>
          <button
            type="button"
            className={`returns-tab-btn ${statusFilter === "rejected" ? "active" : ""}`}
            onClick={() => setStatusFilter("rejected")}
          >
            Declined ({metrics.rejected})
          </button>
        </div>
      </div>

      {/* 4. CLAIMS LIST */}
      {error && <ErrorMessage message={error} />}

      {loading ? (
        <Loader text="Loading return claims and reverse logistics..." />
      ) : sortedClaims.length === 0 ? (
        <div className="vendor-returns-empty">
          <RotateCcw size={44} className="empty-icon" />
          <h3>No return claims found</h3>
          <p>There are no customer returns or refund claims matching the selected filter criteria.</p>
        </div>
      ) : (
        <div className="vendor-returns-list">
          {sortedClaims.map((claim) => {
            const rawClaimId = claim.returnId || String(claim._id);
            const claimId = rawClaimId.startsWith("RET") ? rawClaimId : `RET${rawClaimId.slice(-8).toUpperCase()}`;
            const orderRef = claim.orderRef || {};
            const orderId = claim.orderId || orderRef.orderId || (orderRef._id ? String(orderRef._id).slice(-8).toUpperCase() : "ORD");
            const st = String(claim.status || "requested").toLowerCase();
            const stepIdx = getStageIndex(st);
            const isCancelled = st === "cancelled";
            const isRejected = st === "rejected";

            const items = Array.isArray(claim.items) && claim.items.length > 0
              ? claim.items
              : [{
                  name: "Product Item",
                  image: null,
                  qty: 1,
                  price: claim.refundAmount || claim.totalAmount || 0
                }];
            const firstItem = items[0];
            const refundVal = Number(claim.refundAmount || claim.totalAmount || 0);
            const customerName = claim.customerId?.name || orderRef.shippingAddress?.fullName || "Customer";
            const customerPhone = claim.customerId?.phone || orderRef.shippingAddress?.phone || "—";
            const pickupAddr = orderRef.shippingAddress
              ? `${orderRef.shippingAddress.addressLine1 || orderRef.shippingAddress.street || ""}, ${orderRef.shippingAddress.city || ""}, ${orderRef.shippingAddress.state || ""} - ${orderRef.shippingAddress.pincode || ""}`
              : "Customer registered destination";

            return (
              <div key={claim._id} className={`return-claim-card status-${st}`}>
                {/* Header */}
                <div className="claim-card-header">
                  <div className="claim-header-left">
                    <div className="claim-badge-icon">
                      <RotateCcw size={16} />
                    </div>
                    <div className="claim-id-block">
                      <div className="claim-id-row">
                        <span className="claim-id-text">Claim #{claimId}</span>
                        <span className="claim-parent-order" onClick={() => handleCopy(orderId)} title="Copy Order ID">
                          Order #{orderId}
                          {copiedId === orderId ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        </span>
                        <span className={`claim-status-pill pill-${st}`}>
                          {isCancelled
                            ? "Cancelled by Customer"
                            : isRejected
                            ? "Declined"
                            : REVERSE_LOGISTICS_STAGES[stepIdx]?.label || st.toUpperCase()}
                        </span>
                      </div>
                      <span className="claim-date">
                        Submitted on {formatDateTime(claim.requestedAt || claim.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="claim-header-right">
                    <button
                      type="button"
                      className="claim-details-btn"
                      onClick={() => setSelectedClaim(claim)}
                    >
                      <FileText size={14} />
                      <span>Console Dossier</span>
                    </button>
                  </div>
                </div>

                {/* Body Content Grid */}
                <div className="claim-card-body">
                  {/* Left Column: Product & Return Reason */}
                  <div className="claim-product-col">
                    <div className="claim-thumb-wrap">
                      <img
                        src={getItemImage(firstItem)}
                        alt={firstItem.name || "Product"}
                        className="claim-thumb-img"
                      />
                    </div>

                    <div className="claim-product-info">
                      <h4 className="claim-product-title">{firstItem.name || "Product Item"}</h4>
                      <div className="claim-item-meta">
                        <span>Qty: <strong>{firstItem.qty || 1}</strong></span>
                        <span>•</span>
                        <span>Item Price: <strong>₹{Number(firstItem.price || 0).toLocaleString("en-IN")}</strong></span>
                        {items.length > 1 && (
                          <span className="claim-extra-pill">+{items.length - 1} more items</span>
                        )}
                      </div>

                      <div className="claim-reason-box">
                        <span className="reason-label">Claim Reason:</span>
                        <strong className="reason-text">{claim.reason || "Defective / Quality claim"}</strong>
                      </div>
                      {claim.comments && (
                        <p className="claim-comments-text">"{claim.comments}"</p>
                      )}
                    </div>
                  </div>

                  {/* Middle Column: Customer Logistics Info */}
                  <div className="claim-logistics-col">
                    <div className="logistics-info-item">
                      <User size={14} className="text-slate-400" />
                      <div>
                        <span className="info-title">Customer</span>
                        <strong>{customerName}</strong>
                      </div>
                    </div>

                    <div className="logistics-info-item">
                      <Phone size={14} className="text-slate-400" />
                      <div>
                        <span className="info-title">Contact</span>
                        <strong>{customerPhone}</strong>
                      </div>
                    </div>

                    <div className="logistics-info-item">
                      <MapPin size={14} className="text-slate-400" />
                      <div>
                        <span className="info-title">Reverse Pickup Location</span>
                        <p className="info-addr">{pickupAddr}</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Refund Target & Action Buttons */}
                  <div className="claim-action-col">
                    <div className="claim-amount-box">
                      <span className="claim-amount-label">Net Refundable Value</span>
                      <strong className="claim-amount-val">₹{refundVal.toLocaleString("en-IN")}</strong>
                      <span className="claim-target-badge">Destination: Customer Wallet</span>
                    </div>

                    {/* Contextual Action Buttons */}
                    <div className="claim-buttons-group">
                      {st === "requested" && (
                        <>
                          <button
                            type="button"
                            className="btn-claim-primary"
                            onClick={() => handleClaimAction(claim, "approve_pickup")}
                            disabled={actionLoading}
                          >
                            <Truck size={14} />
                            <span>Schedule Pickup</span>
                          </button>
                          <button
                            type="button"
                            className="btn-claim-outline-danger"
                            onClick={() => {
                              setSelectedClaim(claim);
                              setShowRejectInput(true);
                            }}
                          >
                            <span>Decline</span>
                          </button>
                        </>
                      )}

                      {st === "pickup_confirmed" && (
                        <button
                          type="button"
                          className="btn-claim-primary"
                          onClick={() => handleClaimAction(claim, "confirm_received")}
                          disabled={actionLoading}
                        >
                          <Warehouse size={14} />
                          <span>Mark Received at Hub</span>
                        </button>
                      )}

                      {st === "item_received" && (
                        <button
                          type="button"
                          className="btn-claim-success"
                          onClick={() => handleClaimAction(claim, "pass_quality")}
                          disabled={actionLoading}
                        >
                          <CheckCircle2 size={14} />
                          <span>Pass QA &amp; Restock Stock</span>
                        </button>
                      )}

                      {st === "quality_passed" && (
                        <button
                          type="button"
                          className="btn-claim-success"
                          onClick={() => handleClaimAction(claim, "credit_refund")}
                          disabled={actionLoading}
                        >
                          <IndianRupee size={14} />
                          <span>Credit ₹{refundVal.toLocaleString("en-IN")} to Wallet</span>
                        </button>
                      )}

                      {(st === "refund_credited" || st === "completed") && (
                        <div className="claim-settled-badge">
                          <CheckCircle2 size={15} />
                          <span>Settled to Wallet</span>
                        </div>
                      )}

                      {isCancelled && (
                        <div className="claim-cancelled-badge">
                          <XCircle size={15} />
                          <span>Cancelled by Customer</span>
                        </div>
                      )}

                      {isRejected && (
                        <div className="claim-declined-badge">
                          <XCircle size={15} />
                          <span>Declined by Merchant</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 5-Step Pipeline Progress Strip */}
                {!isCancelled && !isRejected && (
                  <div className="claim-stepper-strip">
                    {REVERSE_LOGISTICS_STAGES.map((step, idx) => {
                      const isComplete = idx <= stepIdx;
                      const isCurrent = idx === stepIdx;
                      return (
                        <div
                          key={step.id}
                          className={`stepper-strip-step ${isComplete ? "complete" : ""} ${isCurrent ? "current" : ""}`}
                        >
                          <div className="step-dot-wrap">
                            <span className="step-dot">
                              {isComplete && <Check size={10} />}
                            </span>
                            {idx < REVERSE_LOGISTICS_STAGES.length - 1 && <span className="step-line" />}
                          </div>
                          <span className="step-strip-label">{step.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 5. CLAIM CONSOLE MODAL DOSSIER */}
      {selectedClaim && (
        <div className="action-modal-overlay" onClick={() => setSelectedClaim(null)}>
          <div className="action-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "620px" }}>
            <div className="action-modal-header" style={{ borderBottom: "1px solid #e2e8f0" }}>
              <div className="action-modal-header-icon" style={{ background: "#fffbeb", color: "#d97706" }}>
                <RotateCcw size={20} />
              </div>
              <div className="action-modal-header-text">
                <h3>Return Claim Console</h3>
                <p>
                  Claim #{selectedClaim.returnId || String(selectedClaim._id).slice(-8).toUpperCase()} • Order #{selectedClaim.orderId || "ORD"}
                </p>
              </div>
              <button type="button" className="action-modal-close-btn" onClick={() => setSelectedClaim(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="action-modal-body" style={{ padding: "20px 24px", maxHeight: "75vh", overflowY: "auto" }}>
              {/* Claim Overview */}
              <div style={{ background: "#f8fafc", padding: "14px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>Stated Reason</span>
                  <strong style={{ fontSize: "13px", color: "#0f172a" }}>{selectedClaim.reason}</strong>
                </div>
                {selectedClaim.comments && (
                  <div style={{ fontSize: "13px", color: "#475569", background: "#fff", padding: "10px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                    "{selectedClaim.comments}"
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", paddingTop: "10px", borderTop: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>Refund Amount Target</span>
                  <strong style={{ fontSize: "15px", color: "#059669" }}>₹{Number(selectedClaim.refundAmount || selectedClaim.totalAmount || 0).toLocaleString("en-IN")}</strong>
                </div>
              </div>

              {/* Decline note input if active */}
              {showRejectInput && (
                <div style={{ background: "#fff1f2", padding: "14px", borderRadius: "8px", border: "1px solid #fecdd3", marginBottom: "16px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#9f1239", display: "block", marginBottom: "6px" }}>
                    Provide reason for declining this claim *
                  </label>
                  <textarea
                    rows="3"
                    value={rejectionNote}
                    onChange={(e) => setRejectionNote(e.target.value)}
                    placeholder="e.g. Return window expired, physical damage not covered, etc."
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #fda4af", fontSize: "13px", resize: "vertical" }}
                  />
                  <div style={{ display: "flex", gap: "8px", marginTop: "8px", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setShowRejectInput(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      style={{ background: "#e11d48", color: "#fff", border: "none", padding: "6px 14px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                      onClick={() => handleClaimAction(selectedClaim, "reject")}
                      disabled={actionLoading}
                    >
                      {actionLoading ? "Declining..." : "Confirm Decline"}
                    </button>
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div>
                <h4 style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a", marginBottom: "12px" }}>Activity &amp; Inspection Audit Log</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {(selectedClaim.timeline || []).map((t, i) => (
                    <div key={i} style={{ display: "flex", gap: "10px", fontSize: "13px", borderLeft: "2px solid #cbd5e1", paddingLeft: "12px" }}>
                      <span style={{ color: "#64748b", minWidth: "120px" }}>{formatDateTime(t.timestamp)}</span>
                      <strong style={{ color: "#0f172a" }}>{t.note || t.status}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="vendor-claim-modal-footer">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setSelectedClaim(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VendorReturns;

