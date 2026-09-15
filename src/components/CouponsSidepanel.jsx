import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  Tag,
  Percent,
  Search,
  Check,
  Copy,
  CheckCheck,
  Clock,
  AlertCircle,
  Sparkles,
  ArrowUpDown,
  Truck,
  RotateCcw,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import CustomSelect from "./CustomSelect";

const SORT_OPTIONS = [
  {
    value: "best",
    label: "Best Savings",
    icon: <Sparkles size={14} style={{ color: "#16a34a" }} />,
    badge: "Top",
  },
  {
    value: "min_spend",
    label: "Lowest Min Spend",
    icon: <TrendingDown size={14} style={{ color: "#2563eb" }} />,
  },
  {
    value: "discount_val",
    label: "Discount (High to Low)",
    icon: <TrendingUp size={14} style={{ color: "#d97706" }} />,
  },
  {
    value: "expiry",
    label: "Expiring Soonest",
    icon: <Clock size={14} style={{ color: "#ef4444" }} />,
  },
];

/**
 * Helper to calculate discount amount for a given coupon and subtotal
 */
function calculateCouponSavings(c, subtotal = 0, deliveryFee = 0) {
  if (!c) return 0;
  const isShip = c.code === "FREESHIP" || c.discountType === "shipping" || c.type === "shipping";
  if (isShip) return deliveryFee || 40;

  const isPct = c.discountType === "percentage" || c.type === "percent";
  const val = Number(c.discountValue ?? c.value ?? 0);
  const maxCap = c.maxDiscountAmount ? Number(c.maxDiscountAmount) : (c.cap || Infinity);

  if (isPct) {
    return Math.min(Math.round((subtotal * val) / 100), maxCap);
  }
  return val;
}

export default function CouponsSidepanel({
  isOpen,
  onClose,
  availableCoupons = [],
  loading = false,
  appliedCoupon = null,
  onApplyCoupon,
  onRemoveCoupon,
  subtotal = 0,
  deliveryFee = 0,
}) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all"); // 'all' | 'eligible' | 'percentage' | 'fixed' | 'shipping'
  const [sortBy, setSortBy] = useState("best"); // 'best' | 'min_spend' | 'discount_val' | 'expiry'
  const [manualCode, setManualCode] = useState("");
  const [manualError, setManualError] = useState("");
  const [manualSuccess, setManualSuccess] = useState("");
  const [copiedCode, setCopiedCode] = useState(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Reset messages when opened or closed
  useEffect(() => {
    if (isOpen) {
      setManualError("");
      setManualSuccess("");
    } else {
      setSearch("");
      setManualCode("");
    }
  }, [isOpen]);

  // Copy code handler
  const handleCopy = (code) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  // Manual code apply handler
  const handleManualSubmit = (e) => {
    e?.preventDefault();
    setManualError("");
    setManualSuccess("");

    const code = manualCode.trim().toUpperCase();
    if (!code) {
      setManualError("Please enter a valid coupon code.");
      return;
    }

    const matched = availableCoupons.find((c) => c.code.toUpperCase() === code);
    if (!matched) {
      setManualError(`Coupon code "${code}" is invalid or expired.`);
      return;
    }

    const minAmt = Number(matched.minOrderAmount ?? matched.minimum ?? 0);
    if (minAmt > 0 && subtotal < minAmt) {
      setManualError(
        `"${matched.code}" requires a minimum order value of ₹${minAmt.toLocaleString("en-IN")}. (Current: ₹${subtotal.toLocaleString("en-IN")})`
      );
      return;
    }

    const res = onApplyCoupon(matched);
    if (res?.success === false) {
      setManualError(res.message || "Failed to apply coupon.");
    } else {
      setManualSuccess(`Coupon "${matched.code}" applied successfully!`);
      setManualCode("");
      setTimeout(() => setManualSuccess(""), 3000);
    }
  };

  // Pre-calculate eligibility and savings for all coupons
  const processedCoupons = useMemo(() => {
    return availableCoupons.map((c) => {
      const minReq = Number(c.minOrderAmount ?? c.minimum ?? 0);
      const isEligible = minReq === 0 || subtotal >= minReq;
      const shortfall = isEligible ? 0 : Math.max(0, minReq - subtotal);
      const savings = calculateCouponSavings(c, subtotal, deliveryFee);
      const isShip = c.code === "FREESHIP" || c.discountType === "shipping";
      const isPct = c.discountType === "percentage" || c.type === "percent";
      const isFixed = !isShip && !isPct;
      const isCurrentlyApplied = appliedCoupon?.code?.toUpperCase() === c.code.toUpperCase();

      return {
        ...c,
        minReq,
        isEligible,
        shortfall,
        savings,
        isShip,
        isPct,
        isFixed,
        isCurrentlyApplied,
      };
    });
  }, [availableCoupons, subtotal, deliveryFee, appliedCoupon]);

  // Counts for filter pills
  const counts = useMemo(() => {
    const total = processedCoupons.length;
    const eligible = processedCoupons.filter((c) => c.isEligible).length;
    const percentage = processedCoupons.filter((c) => c.isPct).length;
    const fixed = processedCoupons.filter((c) => c.isFixed).length;
    const shipping = processedCoupons.filter((c) => c.isShip).length;
    return { total, eligible, percentage, fixed, shipping };
  }, [processedCoupons]);

  // Filter and sort
  const filteredAndSortedCoupons = useMemo(() => {
    let result = [...processedCoupons];

    // 1. Search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.code.toLowerCase().includes(q) ||
          (c.title && c.title.toLowerCase().includes(q)) ||
          (c.description && c.description.toLowerCase().includes(q))
      );
    }

    // 2. Type filter
    if (filterType === "eligible") {
      result = result.filter((c) => c.isEligible);
    } else if (filterType === "percentage") {
      result = result.filter((c) => c.isPct);
    } else if (filterType === "fixed") {
      result = result.filter((c) => c.isFixed);
    } else if (filterType === "shipping") {
      result = result.filter((c) => c.isShip);
    }

    // 3. Sorting
    result.sort((a, b) => {
      // Applied coupon always floats to top
      if (a.isCurrentlyApplied && !b.isCurrentlyApplied) return -1;
      if (!a.isCurrentlyApplied && b.isCurrentlyApplied) return 1;

      if (sortBy === "best") {
        // Sort by actual savings desc, eligible first
        if (a.isEligible !== b.isEligible) return a.isEligible ? -1 : 1;
        return b.savings - a.savings;
      }
      if (sortBy === "min_spend") {
        return a.minReq - b.minReq;
      }
      if (sortBy === "discount_val") {
        return Number(b.discountValue || 0) - Number(a.discountValue || 0);
      }
      if (sortBy === "expiry") {
        const dateA = a.expiryDate ? new Date(a.expiryDate).getTime() : Infinity;
        const dateB = b.expiryDate ? new Date(b.expiryDate).getTime() : Infinity;
        return dateA - dateB;
      }
      return 0;
    });

    return result;
  }, [processedCoupons, search, filterType, sortBy]);

  if (!isOpen) return null;

  return (
    <div className="coupons-sidepanel-backdrop" onClick={onClose}>
      <div className="coupons-sidepanel-drawer" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="coupons-sidepanel-header">
          <div className="coupons-header-left">
            <div className="coupons-header-icon-box">
              <Tag size={22} />
            </div>
            <div>
              <div className="coupons-header-badge">
                <Sparkles size={12} />
                <span>Save with Deals</span>
              </div>
              <h2 className="coupons-header-title">Coupons &amp; Offers</h2>
              <p className="coupons-header-subtitle">
                Select from verified platform offers or enter an exclusive code.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="coupons-sidepanel-close-btn"
            onClick={onClose}
            aria-label="Close coupons panel"
          >
            <X size={20} />
          </button>
        </div>

        {/* ACTIVE COUPON BANNER IF APPLIED */}
        {appliedCoupon && (
          <div className="coupons-active-banner">
            <div className="coupons-active-banner-left">
              <div className="coupons-active-check-icon">
                <Check size={18} />
              </div>
              <div>
                <span className="coupons-active-tag">Active on Order</span>
                <strong className="coupons-active-code">{appliedCoupon.code}</strong>
                <p className="coupons-active-saving">
                  You are saving ₹{Number(appliedCoupon.discount || 0).toLocaleString("en-IN")} on this order!
                </p>
              </div>
            </div>
            <button
              type="button"
              className="coupons-active-remove-btn"
              onClick={onRemoveCoupon}
              title="Remove applied coupon"
            >
              Remove
            </button>
          </div>
        )}

        {/* MANUAL CODE INPUT BAR */}
        <div className="coupons-manual-box">
          <form className="coupons-manual-form" onSubmit={handleManualSubmit}>
            <div className="coupons-input-wrapper">
              <Tag size={16} className="coupons-input-icon" />
              <input
                type="text"
                placeholder="Enter coupon code (e.g. MEGA25, SUPER500)"
                value={manualCode}
                onChange={(e) => {
                  setManualCode(e.target.value.toUpperCase());
                  setManualError("");
                }}
                className="coupons-manual-input"
              />
              {manualCode && (
                <button
                  type="button"
                  className="coupons-input-clear"
                  onClick={() => setManualCode("")}
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="coupons-manual-apply-btn"
              disabled={!manualCode.trim()}
            >
              Apply
            </button>
          </form>

          {manualError && (
            <div className="coupons-inline-alert error">
              <AlertCircle size={14} />
              <span>{manualError}</span>
            </div>
          )}

          {manualSuccess && (
            <div className="coupons-inline-alert success">
              <CheckCircle2 size={14} />
              <span>{manualSuccess}</span>
            </div>
          )}
        </div>

        {/* CONTROLS: SEARCH & SORT */}
        <div className="coupons-controls-row">
          <div className="coupons-search-field">
            <Search size={15} className="coupons-search-icon" />
            <input
              type="text"
              placeholder="Search by code or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="coupons-search-input"
            />
            {search && (
              <button
                type="button"
                className="coupons-search-clear"
                onClick={() => setSearch("")}
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="coupons-sort-wrap">
            <CustomSelect
              value={sortBy}
              onChange={(val) => setSortBy(val)}
              options={SORT_OPTIONS}
              prefixIcon={<ArrowUpDown size={14} />}
              size="sm"
              className="coupons-sort-custom-select"
              ariaLabel="Sort coupons by"
            />
          </div>
        </div>

        {/* FILTER CHIPS */}
        <div className="coupons-filters-bar">
          <button
            type="button"
            className={`coupons-filter-chip ${filterType === "all" ? "active" : ""}`}
            onClick={() => setFilterType("all")}
          >
            All Offers <span className="chip-count">{counts.total}</span>
          </button>
          <button
            type="button"
            className={`coupons-filter-chip ${filterType === "eligible" ? "active" : ""}`}
            onClick={() => setFilterType("eligible")}
          >
            Eligible <span className="chip-count green">{counts.eligible}</span>
          </button>
          <button
            type="button"
            className={`coupons-filter-chip ${filterType === "percentage" ? "active" : ""}`}
            onClick={() => setFilterType("percentage")}
          >
            % Discount <span className="chip-count">{counts.percentage}</span>
          </button>
          <button
            type="button"
            className={`coupons-filter-chip ${filterType === "fixed" ? "active" : ""}`}
            onClick={() => setFilterType("fixed")}
          >
            Flat ₹ Off <span className="chip-count">{counts.fixed}</span>
          </button>
          <button
            type="button"
            className={`coupons-filter-chip ${filterType === "shipping" ? "active" : ""}`}
            onClick={() => setFilterType("shipping")}
          >
            Free Delivery <span className="chip-count">{counts.shipping}</span>
          </button>
        </div>

        {/* COUPONS LIST BODY */}
        <div className="coupons-sidepanel-body">
          {loading ? (
            <div className="coupons-loading-state">
              <div className="coupons-spinner" />
              <p>Fetching active platform deals...</p>
            </div>
          ) : filteredAndSortedCoupons.length === 0 ? (
            <div className="coupons-empty-state">
              <Tag size={42} className="empty-icon" />
              <h4>No matching offers found</h4>
              <p>
                {search || filterType !== "all"
                  ? "Try adjusting your search query or reset filter filters to view all available offers."
                  : "No active platform coupons available at this time."}
              </p>
              {(search || filterType !== "all") && (
                <button
                  type="button"
                  className="coupons-reset-filters-btn"
                  onClick={() => {
                    setSearch("");
                    setFilterType("all");
                  }}
                >
                  <RotateCcw size={14} /> Reset Filters
                </button>
              )}
            </div>
          ) : (
            <div className="coupons-cards-stack">
              {filteredAndSortedCoupons.map((c) => {
                const discountBadgeText = c.isShip
                  ? "FREE SHIPPING"
                  : c.isPct
                  ? `${c.discountValue}% OFF`
                  : `₹${c.discountValue} OFF`;

                const formattedExpiry = c.expiryDate
                  ? new Date(c.expiryDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : null;

                return (
                  <div
                    key={c._id || c.code}
                    className={`coupon-ticket-card ${c.isCurrentlyApplied ? "applied" : ""} ${
                      !c.isEligible ? "ineligible" : ""
                    }`}
                  >
                    {/* TICKET TOP/HEADER */}
                    <div className="ticket-header-row">
                      <div className="ticket-badge-wrap">
                        <span
                          className={`ticket-discount-badge ${
                            c.isShip ? "shipping" : c.isPct ? "percentage" : "fixed"
                          }`}
                        >
                          {c.isShip ? <Truck size={12} /> : <Percent size={12} />}
                          {discountBadgeText}
                        </span>

                        {c.isCurrentlyApplied && (
                          <span className="ticket-applied-pill">
                            <Check size={12} /> Applied
                          </span>
                        )}
                      </div>

                      {/* CODE COPY BOX */}
                      <div className="ticket-code-box">
                        <span className="ticket-code-text">{c.code}</span>
                        <button
                          type="button"
                          className="ticket-copy-btn"
                          onClick={() => handleCopy(c.code)}
                          title="Copy coupon code"
                        >
                          {copiedCode === c.code ? (
                            <CheckCheck size={14} className="copied-icon" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* TICKET CONTENT */}
                    <div className="ticket-content">
                      <h4 className="ticket-title">{c.title || `${discountBadgeText} Storewide`}</h4>
                      {c.description && <p className="ticket-desc">{c.description}</p>}

                      {/* CONDITIONS / METADATA ROW */}
                      <div className="ticket-meta-row">
                        {c.minReq > 0 ? (
                          <span className="ticket-meta-chip">
                            Min. order: <strong>₹{c.minReq.toLocaleString("en-IN")}</strong>
                          </span>
                        ) : (
                          <span className="ticket-meta-chip green">No minimum order</span>
                        )}

                        {c.maxDiscountAmount > 0 && c.isPct && (
                          <span className="ticket-meta-chip">
                            Up to ₹{c.maxDiscountAmount.toLocaleString("en-IN")}
                          </span>
                        )}

                        {formattedExpiry && (
                          <span className="ticket-meta-chip">
                            <Clock size={11} /> Valid till {formattedExpiry}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* DASHED DIVIDER WITH TICKETS CUTOUTS */}
                    <div className="ticket-divider">
                      <div className="ticket-notch left" />
                      <div className="ticket-dashed-line" />
                      <div className="ticket-notch right" />
                    </div>

                    {/* TICKET FOOTER: ELIGIBILITY & APPLY ACTION */}
                    <div className="ticket-footer-row">
                      <div className="ticket-status-col">
                        {c.isCurrentlyApplied ? (
                          <span className="ticket-savings-text green">
                            ✓ Currently saving ₹{c.savings?.toLocaleString("en-IN")}
                          </span>
                        ) : c.isEligible ? (
                          <span className="ticket-savings-text green">
                            ✓ Saves ₹{c.savings?.toLocaleString("en-IN")} on this order
                          </span>
                        ) : (
                          <span className="ticket-savings-text warning">
                            Add ₹{c.shortfall?.toLocaleString("en-IN")} more to unlock
                          </span>
                        )}
                      </div>

                      <div className="ticket-action-col">
                        {c.isCurrentlyApplied ? (
                          <button
                            type="button"
                            className="ticket-btn remove"
                            onClick={onRemoveCoupon}
                          >
                            Remove
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={`ticket-btn apply ${!c.isEligible ? "disabled" : ""}`}
                            onClick={() => {
                              if (c.isEligible) {
                                onApplyCoupon(c);
                              }
                            }}
                            disabled={!c.isEligible}
                          >
                            {c.isEligible ? "Apply Offer" : "Locked"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SIDE PANEL FOOTER INFO */}
        <div className="coupons-sidepanel-footer">
          <div className="coupons-footer-stats">
            <span>Cart Subtotal: <strong>₹{subtotal.toLocaleString("en-IN")}</strong></span>
            {appliedCoupon ? (
              <span className="footer-savings">
                Applied Savings: <strong>-₹{Number(appliedCoupon.discount || 0).toLocaleString("en-IN")}</strong>
              </span>
            ) : (
              <span className="footer-tip">Select a coupon to apply discount</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

