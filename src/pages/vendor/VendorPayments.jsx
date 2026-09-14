import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  ShoppingBag,
  Landmark,
  Search,
  Filter,
  Download,
  RefreshCw,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  Info
} from "lucide-react";
import { getVendorTransactions, requestVendorPayout } from "../../services/vendorTransactionService";
import Loader from "../../components/Loader";
import { toast } from "../../components/Toast";
import useDebounce from "../../hooks/useDebounce";
import CustomSelect from "../../components/CustomSelect";

function formatPaymentMethod(method) {
  if (!method) return "Online Payment";
  const s = String(method).toLowerCase().trim();
  if (s === "bank_transfer" || s === "bank") return "Bank Transfer";
  if (s === "upi") return "UPI Settlement";
  if (s === "card" || s === "credit_card" || s === "debit_card") return "Card Payment";
  if (s === "wallet") return "Wallet Balance";
  if (s === "cod") return "Cash on Delivery";
  if (s === "netbanking") return "Net Banking";
  return s
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatTransactionType(type) {
  if (!type) return "Transaction";
  const s = String(type).toLowerCase().trim();
  if (s === "order_earning") return "Sales Earning";
  if (s === "refund_deduction") return "Refund Deduction";
  if (s === "payout") return "Payout Settlement";
  if (s === "platform_fee") return "Platform Fee";
  if (s === "adjustment") return "Balance Adjustment";
  return s
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const TYPE_TABS = [
  { key: "all", label: "All Transactions" },
  { key: "order_earning", label: "Sales Earnings" },
  { key: "refund_deduction", label: "Refund Deductions" },
  { key: "payout", label: "Payout Settlements" }
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "completed", label: "Completed" },
  { value: "processing", label: "Processing" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" }
];

const DATE_RANGE_OPTIONS = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "7days", label: "Last 7 Days" },
  { value: "30days", label: "Last 30 Days" }
];

const LIMIT_OPTIONS = [
  { value: "10", label: "10" },
  { value: "15", label: "15" },
  { value: "30", label: "30" },
  { value: "50", label: "50" }
];

export default function VendorPayments() {
  // State: Data & Loading
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    totalEarnings: 0,
    earningsCount: 0,
    totalCommission: 0,
    totalRefundDeductions: 0,
    refundsCount: 0,
    totalPayouts: 0,
    payoutsCount: 0,
    totalCount: 0,
    netRevenue: 0,
    availableBalance: 0
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Pagination (Infinite Scroll)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const sentinelRef = useRef(null);

  // Filters
  const [activeTab, setActiveTab] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  // Modals
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState(null);

  // Copy state
  const [copiedKey, setCopiedKey] = useState(null);

  // Payout Form State
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("bank_transfer");
  const [bankAccount, setBankAccount] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [upiId, setUpiId] = useState("");
  const [payoutNotes, setPayoutNotes] = useState("");
  const [submittingPayout, setSubmittingPayout] = useState(false);

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`Copied to clipboard: ${text}`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const fetchTransactionsData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else if (page === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const data = await getVendorTransactions({
        page,
        limit,
        type: activeTab,
        status: statusFilter,
        dateRange,
        q: debouncedSearch
      });

      const items = data?.items || [];
      setTransactions((prev) => (page === 1 || isRefresh ? items : [...prev, ...items]));
      setTotalPages(data?.totalPages || 1);
      setTotalItems(data?.total || 0);
      if (data?.summary) {
        setSummary(data.summary);
      }
    } catch (err) {
      console.error("Failed to load vendor transactions:", err);
      toast.error(err.response?.data?.msg || "Failed to load transactions");
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [page, limit, activeTab, statusFilter, dateRange, debouncedSearch]);

  useEffect(() => {
    fetchTransactionsData();
  }, [fetchTransactionsData]);

  // Infinite Scroll IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && !loadingMore && page < totalPages) {
          setPage((p) => p + 1);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loading, loadingMore, page, totalPages]);

  // Handle Tab Switch
  const handleTabChange = (key) => {
    setActiveTab(key);
    setPage(1);
    setTransactions([]);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setActiveTab("all");
    setStatusFilter("all");
    setDateRange("all");
    setSearch("");
    setPage(1);
    setTransactions([]);
  };

  const isFiltered = activeTab !== "all" || statusFilter !== "all" || dateRange !== "all" || search !== "";

  // Handle Payout Request Submit
  const handlePayoutSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(payoutAmount);

    if (!amount || amount < 500) {
      toast.error("Minimum payout withdrawal is ₹500");
      return;
    }

    if (amount > summary.availableBalance) {
      toast.error(`Amount exceeds available balance of ₹${summary.availableBalance.toLocaleString("en-IN")}`);
      return;
    }

    let accountStr = "";
    if (payoutMethod === "bank_transfer") {
      if (!bankAccount || !bankIfsc) {
        toast.error("Please enter both bank account number and IFSC code");
        return;
      }
      accountStr = `A/C: ${bankAccount} (IFSC: ${bankIfsc.toUpperCase()})`;
    } else {
      if (!upiId || !upiId.includes("@")) {
        toast.error("Please enter a valid UPI ID (e.g. name@okhdfcbank)");
        return;
      }
      accountStr = `UPI: ${upiId}`;
    }

    setSubmittingPayout(true);
    try {
      await requestVendorPayout({
        amount,
        payoutMethod,
        payoutAccount: accountStr,
        notes: payoutNotes
      });

      toast.success(`🎉 Payout request of ₹${amount.toLocaleString("en-IN")} submitted successfully!`);
      setPayoutModalOpen(false);
      setPayoutAmount("");
      setPayoutNotes("");
      // Refresh transactions and summary
      fetchTransactionsData(true);
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to submit payout request");
    } finally {
      setSubmittingPayout(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!transactions.length) {
      toast.info("No transactions to export");
      return;
    }

    const headers = ["Transaction ID", "Type", "Order ID", "Customer / Beneficiary", "Date", "Gross Amount", "Commission (5%)", "Net Amount", "Status", "Payout Method"];
    const rows = transactions.map((t) => [
      `"${t._id}"`,
      `"${formatTransactionType(t.type)}"`,
      `"${t.orderDisplayId || "-"}"`,
      `"${t.customerName || t.payoutAccount || "-"}"`,
      `"${new Date(t.createdAt).toLocaleString("en-IN")}"`,
      `"${t.amount}"`,
      `"${t.commission || 0}"`,
      `"${t.netAmount || t.amount}"`,
      `"${t.status}"`,
      `"${formatPaymentMethod(t.payoutMethod)}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `vendor_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Transactions exported to CSV!");
  };

  // Helper for Transaction Pill & Styling
  const getTxnDisplay = (txn) => {
    switch (txn.type) {
      case "order_earning":
        return {
          label: "Sales Earning",
          icon: ShoppingBag,
          color: "#059669",
          bg: "#ecfdf5",
          prefix: "+",
          amountColor: "#059669"
        };
      case "refund_deduction":
        return {
          label: "Refund Deduction",
          icon: RotateCcw,
          color: "#dc2626",
          bg: "#fef2f2",
          prefix: "-",
          amountColor: "#dc2626"
        };
      case "payout":
        return {
          label: "Payout Settlement",
          icon: Landmark,
          color: "#7c3aed",
          bg: "#f5f3ff",
          prefix: "-",
          amountColor: "#7c3aed"
        };
      default:
        return {
          label: formatTransactionType(txn.type),
          icon: CreditCard,
          color: "#475569",
          bg: "#f1f5f9",
          prefix: "",
          amountColor: "#0f172a"
        };
    }
  };

  const getStatusBadge = (status) => {
    const s = String(status || "completed").toLowerCase();
    if (s === "completed" || s === "processed") {
      return { label: "Completed", className: "vp-badge-completed", icon: CheckCircle2 };
    }
    if (s === "processing") {
      return { label: "Processing", className: "vp-badge-processing", icon: Clock };
    }
    if (s === "pending") {
      return { label: "Pending", className: "vp-badge-pending", icon: Clock };
    }
    return { label: "Failed", className: "vp-badge-failed", icon: AlertCircle };
  };

  return (
    <div className="vp-container">
      {/* PAGE HEADER */}
      <div className="vp-header">
        <div className="vp-header-left">
          <div className="vp-header-badge">
            <ShieldCheck size={14} />
            <span>Verified Merchant Ledger</span>
          </div>
          <h1 className="vp-title">Payments &amp; Transactions</h1>
          <p className="vp-subtitle">
            Track your gross sales earnings, refund deductions, platform commissions, and withdraw payout settlements.
          </p>
        </div>

        <div className="vp-header-actions">
          <button
            type="button"
            className="vp-btn vp-btn-refresh"
            onClick={() => fetchTransactionsData(true)}
            disabled={refreshing || loading}
            title="Refresh Ledger"
          >
            <RefreshCw size={16} className={refreshing ? "vp-spin" : ""} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="vp-btn vp-btn-secondary"
            onClick={handleExportCSV}
            title="Export CSV"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            className="vp-btn vp-btn-primary"
            onClick={() => setPayoutModalOpen(true)}
          >
            <Landmark size={16} />
            <span>Request Payout</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="vp-kpi-grid">
        {/* Available Payout Balance (Highlighted) */}
        <div className="vp-kpi-card vp-kpi-balance">
          <div className="vp-kpi-top">
            <div className="vp-kpi-icon-box balance">
              <Wallet size={24} />
            </div>
            <span className="vp-kpi-status-pill ready">Payout Ready</span>
          </div>
          <div className="vp-kpi-content">
            <span className="vp-kpi-label">Available Payout Balance</span>
            <div className="vp-kpi-amount balance">
              ₹{Number(summary.availableBalance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="vp-kpi-hint">
              Net sales settled after 5% platform fee &amp; refunds
            </p>
          </div>
          <button
            type="button"
            className="vp-kpi-action-btn"
            onClick={() => setPayoutModalOpen(true)}
            disabled={summary.availableBalance < 500}
          >
            Withdraw to Bank →
          </button>
        </div>

        {/* Gross Sales Earnings */}
        <div className="vp-kpi-card">
          <div className="vp-kpi-top">
            <div className="vp-kpi-icon-box sales">
              <ArrowUpRight size={22} />
            </div>
            <span className="vp-kpi-count">{summary.earningsCount || 0} orders</span>
          </div>
          <div className="vp-kpi-content">
            <span className="vp-kpi-label">Gross Sales Earnings</span>
            <div className="vp-kpi-amount sales">
              ₹{Number(summary.totalEarnings || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="vp-kpi-hint">
              Total sales revenue before 5% commission deduction
            </p>
          </div>
        </div>

        {/* Refund Deductions */}
        <div className="vp-kpi-card">
          <div className="vp-kpi-top">
            <div className="vp-kpi-icon-box refunds">
              <ArrowDownLeft size={22} />
            </div>
            <span className="vp-kpi-count negative">{summary.refundsCount || 0} claims</span>
          </div>
          <div className="vp-kpi-content">
            <span className="vp-kpi-label">Refund Deductions</span>
            <div className="vp-kpi-amount refunds">
              ₹{Number(summary.totalRefundDeductions || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="vp-kpi-hint">
              Customer returns &amp; cancellation refunds debited
            </p>
          </div>
        </div>

        {/* Settled Payouts & Commission */}
        <div className="vp-kpi-card">
          <div className="vp-kpi-top">
            <div className="vp-kpi-icon-box payouts">
              <Landmark size={22} />
            </div>
            <span className="vp-kpi-count">{summary.payoutsCount || 0} payouts</span>
          </div>
          <div className="vp-kpi-content">
            <span className="vp-kpi-label">Total Settled Payouts</span>
            <div className="vp-kpi-amount payouts">
              ₹{Number(summary.totalPayouts || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="vp-kpi-hint">
              Platform fees paid: ₹{Number(summary.totalCommission || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })} (5%)
            </p>
          </div>
        </div>
      </div>

      {/* FILTER TABS & TOOLBAR */}
      <div className="vp-filter-section">
        {/* Type Tabs */}
        <div className="vp-tabs">
          {TYPE_TABS.map((tab) => {
            let count = summary.totalCount || 0;
            if (tab.key === "order_earning") count = summary.earningsCount || 0;
            if (tab.key === "refund_deduction") count = summary.refundsCount || 0;
            if (tab.key === "payout") count = summary.payoutsCount || 0;

            return (
              <button
                key={tab.key}
                type="button"
                className={`vp-tab-btn ${activeTab === tab.key ? "active" : ""}`}
                onClick={() => handleTabChange(tab.key)}
              >
                <span>{tab.label}</span>
                <span className="vp-tab-badge">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Controls: Search, Status, Date, Reset */}
        <div className="vp-toolbar">
          {/* Search Box */}
          <div className="vp-search-wrap">
            <Search size={16} className="vp-search-icon" />
            <input
              type="text"
              placeholder="Search by Order ID, Txn ID, customer name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="vp-search-input"
            />
            {search && (
              <button
                type="button"
                className="vp-search-clear"
                onClick={() => { setSearch(""); setPage(1); }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="vp-filter-custom-select-wrap">
            <CustomSelect
              value={statusFilter}
              onChange={(val) => { setStatusFilter(val); setPage(1); }}
              options={STATUS_OPTIONS}
              className="vp-custom-select"
            />
          </div>

          {/* Date Range Dropdown */}
          <div className="vp-filter-custom-select-wrap">
            <CustomSelect
              value={dateRange}
              onChange={(val) => { setDateRange(val); setPage(1); }}
              options={DATE_RANGE_OPTIONS}
              className="vp-custom-select"
            />
          </div>

          {/* Reset Filters */}
          {isFiltered && (
            <button
              type="button"
              className="vp-reset-btn"
              onClick={handleResetFilters}
              title="Reset all filters"
            >
              <X size={14} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="vp-table-card">
        {loading ? (
          <Loader type="table" rows={6} columns={6} />
        ) : transactions.length === 0 ? (
          <div className="vp-table-empty">
            <div className="vp-empty-icon">
              <CreditCard size={48} />
            </div>
            <h3>No Transactions Found</h3>
            <p>
              {isFiltered
                ? "No transactions match your selected search criteria and filters."
                : "Your transaction history and payout settlements will appear here as orders are placed."}
            </p>
            {isFiltered && (
              <button
                type="button"
                className="vp-btn vp-btn-secondary"
                onClick={handleResetFilters}
                style={{ marginTop: "12px" }}
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="vp-table-responsive">
              <table className="vp-table">
                <thead>
                  <tr>
                    <th>Transaction / Date</th>
                    <th>Type</th>
                    <th>Reference Order</th>
                    <th>Customer / Beneficiary</th>
                    <th className="text-right">Gross Amount</th>
                    <th className="text-right">Platform Fee (5%)</th>
                    <th className="text-right">Net Amount</th>
                    <th className="text-center">Status</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn) => {
                    const style = getTxnDisplay(txn);
                    const TxnIcon = style.icon;
                    const statusBadge = getStatusBadge(txn.status);
                    const StatusIcon = statusBadge.icon;
                    const dateObj = new Date(txn.createdAt);
                    const formattedDate = dateObj.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric"
                    });
                    const formattedTime = dateObj.toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true
                    });

                    const shortTxnId = String(txn._id).slice(-8).toUpperCase();
                    const shortOrderId = txn.orderDisplayId || (txn.orderId ? String(txn.orderId).slice(-8).toUpperCase() : "-");

                    return (
                      <tr key={txn._id} className="vp-row">
                        {/* Transaction ID & Date */}
                        <td>
                          <div className="vp-cell-txn">
                            <div className="vp-txn-id-row">
                              <span className="vp-code" title={txn._id}>
                                TXN-{shortTxnId}
                              </span>
                              <button
                                type="button"
                                className="vp-copy-btn"
                                onClick={() => handleCopy(txn._id, `txn-${txn._id}`)}
                                title="Copy Transaction ID"
                              >
                                {copiedKey === `txn-${txn._id}` ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                              </button>
                            </div>
                            <span className="vp-sub-date">
                              {formattedDate} at {formattedTime}
                            </span>
                          </div>
                        </td>

                        {/* Type */}
                        <td>
                          <div
                            className="vp-type-badge"
                            style={{ background: style.bg, color: style.color }}
                          >
                            <TxnIcon size={14} />
                            <span>{style.label}</span>
                          </div>
                        </td>

                        {/* Reference Order */}
                        <td>
                          {txn.orderDisplayId ? (
                            <div className="vp-cell-order">
                              <div className="vp-order-id-row">
                                <span className="vp-order-link">
                                  #{shortOrderId}
                                </span>
                                <button
                                  type="button"
                                  className="vp-copy-btn"
                                  onClick={() => handleCopy(txn.orderDisplayId, `ord-${txn._id}`)}
                                  title="Copy Order ID"
                                >
                                  {copiedKey === `ord-${txn._id}` ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                                </button>
                              </div>
                              {txn.meta?.productName && (
                                <span className="vp-sub-info" title={txn.meta.productName}>
                                  {txn.meta.productName.length > 22
                                    ? txn.meta.productName.slice(0, 22) + "..."
                                    : txn.meta.productName}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="vp-na">
                              {txn.type === "payout" ? formatPaymentMethod(txn.payoutMethod || "bank_transfer") : "—"}
                            </span>
                          )}
                        </td>

                        {/* Customer / Beneficiary */}
                        <td>
                          <div className="vp-cell-customer">
                            <strong className="vp-customer-name">
                              {txn.customerName || (txn.type === "payout" ? (txn.payoutAccount ? `A/C: ${txn.payoutAccount}` : "Vendor Bank A/C") : "Customer")}
                            </strong>
                            <span className="vp-sub-info">
                              {txn.type === "payout"
                                ? formatPaymentMethod(txn.payoutMethod || "bank_transfer")
                                : formatPaymentMethod(txn.paymentMethod || txn.payoutMethod || "online")}
                            </span>
                          </div>
                        </td>

                        {/* Gross Amount */}
                        <td className="text-right">
                          <span className="vp-gross-amt">
                            ₹{Number(txn.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                        </td>

                        {/* Fee / Commission */}
                        <td className="text-right">
                          {txn.commission > 0 ? (
                            <span className="vp-commission-amt">
                              -₹{Number(txn.commission).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </span>
                          ) : (
                            <span className="vp-commission-zero">₹0.00</span>
                          )}
                        </td>

                        {/* Net Amount */}
                        <td className="text-right">
                          <strong
                            className="vp-net-amt"
                            style={{ color: style.amountColor }}
                          >
                            {style.prefix} ₹{Number(txn.netAmount || txn.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </strong>
                        </td>

                        {/* Status */}
                        <td className="text-center">
                          <span className={`vp-status-pill ${statusBadge.className}`}>
                            <StatusIcon size={12} />
                            <span>{statusBadge.label}</span>
                          </span>
                        </td>

                        {/* Action */}
                        <td className="text-center">
                          <button
                            type="button"
                            className="vp-view-btn"
                            onClick={() => setSelectedTxn(txn)}
                            title="View Transaction Details"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* INFINITE SCROLL SENTINEL & PROGRESS */}
            <div ref={sentinelRef} className="vp-infinite-scroll-sentinel" style={{ padding: "16px 0", textAlign: "center" }}>
              {loadingMore && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  <RefreshCw size={16} className="spinner-small" />
                  <span>Loading more ledger transactions...</span>
                </div>
              )}
              {!loading && !loadingMore && page >= totalPages && transactions.length > 0 && (
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", padding: "8px 0" }}>
                  All <strong>{totalItems}</strong> transactions loaded • End of ledger
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* MODAL 1: TRANSACTION DETAILS */}
      {selectedTxn && (
        <div className="action-modal-overlay" onClick={() => setSelectedTxn(null)}>
          <div className="action-modal-container vp-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="action-modal-header">
              <div className="action-modal-header-icon" style={{ background: getTxnDisplay(selectedTxn).bg, color: getTxnDisplay(selectedTxn).color }}>
                {(() => {
                  const Icon = getTxnDisplay(selectedTxn).icon;
                  return <Icon size={20} />;
                })()}
              </div>
              <div className="action-modal-header-text">
                <h3>Transaction Details</h3>
                <p>Record ID: {selectedTxn._id}</p>
              </div>
              <button
                type="button"
                className="action-modal-close-btn"
                onClick={() => setSelectedTxn(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="action-modal-body" style={{ maxHeight: "75vh", overflowY: "auto", padding: "20px 24px" }}>
              {/* Financial Highlight Banner */}
              <div className="vp-detail-banner">
                <div className="vp-detail-banner-item">
                  <span className="label">Gross Value</span>
                  <strong className="val">₹{Number(selectedTxn.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
                </div>
                <div className="vp-detail-banner-divider" />
                <div className="vp-detail-banner-item">
                  <span className="label">Commission (5%)</span>
                  <strong className="val fee">
                    {selectedTxn.commission > 0
                      ? `-₹${Number(selectedTxn.commission).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                      : "₹0.00"}
                  </strong>
                </div>
                <div className="vp-detail-banner-divider" />
                <div className="vp-detail-banner-item">
                  <span className="label">Net Settled</span>
                  <strong
                    className="val net"
                    style={{ color: getTxnDisplay(selectedTxn).amountColor }}
                  >
                    {getTxnDisplay(selectedTxn).prefix} ₹{Number(selectedTxn.netAmount || selectedTxn.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </strong>
                </div>
              </div>

              {/* Information Rows */}
              <div className="vp-detail-grid">
                <div className="vp-detail-cell">
                  <span className="vp-detail-key">Transaction Type</span>
                  <strong className="vp-detail-val">
                    {getTxnDisplay(selectedTxn).label}
                  </strong>
                </div>

                <div className="vp-detail-cell">
                  <span className="vp-detail-key">Settlement Status</span>
                  <div style={{ display: "inline-flex", width: "fit-content", marginTop: "2px" }}>
                    <span className={`vp-status-pill ${getStatusBadge(selectedTxn.status).className}`}>
                      {getStatusBadge(selectedTxn.status).label}
                    </span>
                  </div>
                </div>

                {selectedTxn.orderDisplayId && (
                  <div className="vp-detail-cell">
                    <span className="vp-detail-key">Associated Order ID</span>
                    <strong className="vp-detail-val">
                      #{selectedTxn.orderDisplayId}
                    </strong>
                  </div>
                )}

                <div className="vp-detail-cell">
                  <span className="vp-detail-key">Customer / Recipient</span>
                  <strong className="vp-detail-val">
                    {selectedTxn.customerName || selectedTxn.payoutAccount || "Vendor Merchant"}
                  </strong>
                </div>

                <div className="vp-detail-cell">
                  <span className="vp-detail-key">Payment / Settlement Method</span>
                  <strong className="vp-detail-val">
                    {formatPaymentMethod(selectedTxn.payoutMethod || selectedTxn.paymentMethod)}
                  </strong>
                </div>

                <div className="vp-detail-cell">
                  <span className="vp-detail-key">Created Timestamp</span>
                  <strong className="vp-detail-val">
                    {new Date(selectedTxn.createdAt).toLocaleString("en-IN", {
                      dateStyle: "long",
                      timeStyle: "short"
                    })}
                  </strong>
                </div>
              </div>

              {/* Description */}
              {selectedTxn.description && (
                <div className="vp-detail-desc-box">
                  <span className="vp-detail-key">Description &amp; Memo</span>
                  <p>{selectedTxn.description}</p>
                </div>
              )}

              {/* Meta details if return or order */}
              {selectedTxn.meta && Object.keys(selectedTxn.meta).length > 0 && (
                <div className="vp-detail-meta-box">
                  <span className="vp-detail-key">Transaction Metadata</span>
                  <div className="vp-meta-items">
                    {selectedTxn.meta.productName && (
                      <div className="vp-meta-row">
                        <span>Product Item:</span>
                        <strong>{selectedTxn.meta.productName}</strong>
                      </div>
                    )}
                    {selectedTxn.meta.itemCount && (
                      <div className="vp-meta-row">
                        <span>Total Items:</span>
                        <strong>{selectedTxn.meta.itemCount} unit(s)</strong>
                      </div>
                    )}
                    {selectedTxn.meta.reason && (
                      <div className="vp-meta-row">
                        <span>Refund / Return Reason:</span>
                        <strong>{selectedTxn.meta.reason}</strong>
                      </div>
                    )}
                    {selectedTxn.meta.returnId && (
                      <div className="vp-meta-row">
                        <span>Return Claim ID:</span>
                        <strong>#{selectedTxn.meta.returnId}</strong>
                      </div>
                    )}
                    {selectedTxn.payoutAccount && (
                      <div className="vp-meta-row">
                        <span>Destination Account:</span>
                        <strong>{selectedTxn.payoutAccount}</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="vp-detail-footer">
              <button
                type="button"
                className="vp-detail-close-btn"
                onClick={() => setSelectedTxn(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEPANEL DRAWER: REQUEST PAYOUT SETTLEMENT */}
      {payoutModalOpen && (
        <div className="vp-sidepanel-backdrop" onClick={() => setPayoutModalOpen(false)}>
          <div className="vp-sidepanel-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="vp-sidepanel-header">
              <div className="vp-sidepanel-header-info">
                <div className="vp-sidepanel-icon-box">
                  <Landmark size={22} />
                </div>
                <div>
                  <h3 className="vp-sidepanel-title">Request Payout Settlement</h3>
                  <p className="vp-sidepanel-subtitle">Withdraw your settled earnings to your verified bank or UPI</p>
                </div>
              </div>
              <button
                type="button"
                className="vp-sidepanel-close-btn"
                onClick={() => setPayoutModalOpen(false)}
                title="Close Drawer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePayoutSubmit} className="vp-sidepanel-form">
              <div className="vp-sidepanel-body">
                {/* Available Balance Reminder */}
                <div className="vp-payout-balance-box">
                  <div className="vp-payout-bal-left">
                    <span className="bal-lbl">Available to Withdraw</span>
                    <strong className="bal-val">
                      ₹{Number(summary.availableBalance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                  <div className="vp-payout-bal-right">
                    <span className="min-lbl">Minimum Withdrawal: ₹500</span>
                  </div>
                </div>

                {/* Amount Input */}
                <div className="action-modal-form-group" style={{ marginTop: "4px" }}>
                  <label className="action-modal-label">
                    Withdrawal Amount (₹) *
                  </label>
                  <div className="vp-input-currency-wrap">
                    <span className="vp-currency-prefix">₹</span>
                    <input
                      type="number"
                      min={500}
                      max={summary.availableBalance}
                      step={100}
                      placeholder="Enter amount (min ₹500)"
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      className="vp-amount-input"
                      required
                    />
                  </div>

                  {/* Quick Amount Chips */}
                  <div className="vp-quick-amount-chips">
                    {[1000, 5000, 10000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        className="vp-amount-chip"
                        onClick={() => setPayoutAmount(Math.min(amt, summary.availableBalance))}
                        disabled={summary.availableBalance < amt}
                      >
                        +₹{amt.toLocaleString("en-IN")}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="vp-amount-chip max-chip"
                      onClick={() => setPayoutAmount(summary.availableBalance)}
                      disabled={summary.availableBalance < 500}
                    >
                      Withdraw All (₹{Math.floor(summary.availableBalance).toLocaleString("en-IN")})
                    </button>
                  </div>
                </div>

                {/* Transfer Method Selector */}
                <div className="action-modal-form-group" style={{ marginTop: "4px" }}>
                  <label className="action-modal-label">Transfer Destination *</label>
                  <div className="vp-payout-methods">
                    <label className={`vp-method-card ${payoutMethod === "bank_transfer" ? "selected" : ""}`}>
                      <input
                        type="radio"
                        name="payoutMethod"
                        value="bank_transfer"
                        checked={payoutMethod === "bank_transfer"}
                        onChange={() => setPayoutMethod("bank_transfer")}
                      />
                      <Building2 size={20} className="method-icon" />
                      <div className="method-info">
                        <strong>Direct Bank Transfer</strong>
                        <span>NEFT / IMPS (1-2 business hours)</span>
                      </div>
                    </label>

                    <label className={`vp-method-card ${payoutMethod === "upi" ? "selected" : ""}`}>
                      <input
                        type="radio"
                        name="payoutMethod"
                        value="upi"
                        checked={payoutMethod === "upi"}
                        onChange={() => setPayoutMethod("upi")}
                      />
                      <Smartphone size={20} className="method-icon" />
                      <div className="method-info">
                        <strong>Instant UPI Settlement</strong>
                        <span>VPA / Google Pay / PhonePe (Instant)</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Method Details */}
                {payoutMethod === "bank_transfer" ? (
                  <div className="vp-method-inputs">
                    <div className="action-modal-form-group">
                      <label className="action-modal-label">Bank Account Number *</label>
                      <input
                        type="text"
                        placeholder="e.g. 50100234567890"
                        value={bankAccount}
                        onChange={(e) => setBankAccount(e.target.value)}
                        className="form-control"
                        required
                      />
                    </div>
                    <div className="action-modal-form-group" style={{ marginTop: "12px" }}>
                      <label className="action-modal-label">Bank IFSC Code *</label>
                      <input
                        type="text"
                        placeholder="e.g. HDFC0001234"
                        value={bankIfsc}
                        onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                        className="form-control"
                        style={{ textTransform: "uppercase" }}
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="vp-method-inputs">
                    <div className="action-modal-form-group">
                      <label className="action-modal-label">UPI ID / Virtual Payment Address *</label>
                      <input
                        type="text"
                        placeholder="e.g. yourname@okhdfcbank or merchant@upi"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="form-control"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Optional Notes */}
                <div className="action-modal-form-group" style={{ marginTop: "4px" }}>
                  <label className="action-modal-label">Payout Note / Memo (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Monthly vendor settlement withdrawal"
                    value={payoutNotes}
                    onChange={(e) => setPayoutNotes(e.target.value)}
                    className="form-control"
                  />
                </div>

                {/* Secure settlement alert */}
                <div className="vp-secure-alert">
                  <Info size={16} />
                  <span>
                    Payouts are processed automatically via automated banking rails. Zero withdrawal fees applied.
                  </span>
                </div>
              </div>

              <div className="vp-sidepanel-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setPayoutModalOpen(false)}
                  disabled={submittingPayout}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingPayout || summary.availableBalance < 500}
                >
                  {submittingPayout ? "Processing Payout..." : "Confirm & Withdraw Funds"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

