import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import {
  ShoppingCart,
  Search,
  X,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  RotateCcw,
  Printer,
  FileText,
  MapPin,
  Phone,
  User,
  CreditCard,
  IndianRupee,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Home,
  Copy,
  Check,
  MoreVertical,
  XCircle,
  AlertCircle,
  ArrowUpDown
} from "lucide-react";
import { getVendorOrders, updateVendorOrderStatus } from "../../services/orderService";
import { getReturns, updateReturnStatus } from "../../services/returnService";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";
import CustomSelect from "../../components/CustomSelect";
import { formatDate, formatDateTime } from "../../utils/dateFormatter";
import { getErrorMessage } from "../../utils/errorHandler";
import { toast } from "../../components/Toast";
import useDebounce from "../../hooks/useDebounce";

const PAGE_SIZE = 20;

const RETURN_STEPS = [
  { id: "requested", label: "Return Requested", desc: "Customer claim recorded" },
  { id: "pickup_confirmed", label: "Pickup Scheduled", desc: "Reverse courier dispatched" },
  { id: "item_received", label: "Item Received", desc: "Arrived at warehouse hub" },
  { id: "quality_passed", label: "Quality Passed", desc: "Restocked into catalog" },
  { id: "refund_initiated", label: "Refund Processing", desc: "Gateway refund initiated" },
  { id: "refund_credited", label: "Refund Credited", desc: "Credited to wallet" }
];

const getReturnStepIndex = (status) => {
  const s = String(status || "").toLowerCase();
  if (s === "refund_credited" || s === "completed") return 5;
  if (s === "refund_initiated") return 4;
  if (s === "quality_passed") return 3;
  if (s === "item_received") return 2;
  if (s === "pickup_confirmed" || s === "pickup_scheduled" || s === "picked_up" || s === "approved") return 1;
  return 0; // requested
};

const STATUS_THEMES = {
  packed: {
    label: "Packed",
    icon: Package,
    iconColor: "#ea580c",
    badgeBg: "#ffedd5",
    badgeBorder: "#fed7aa",
    headerBg: "#fff7ed",
    headerBorder: "#ffedd5"
  },
  shipped: {
    label: "Shipped",
    icon: Truck,
    iconColor: "#059669",
    badgeBg: "#d1fae5",
    badgeBorder: "#a7f3d0",
    headerBg: "#f0fdf4",
    headerBorder: "#dcfce7"
  },
  out_for_delivery: {
    label: "Out for Delivery",
    icon: Truck,
    iconColor: "#059669",
    badgeBg: "#d1fae5",
    badgeBorder: "#a7f3d0",
    headerBg: "#f0fdf4",
    headerBorder: "#dcfce7"
  },
  placed: {
    label: "Placed",
    icon: Clock,
    iconColor: "#2563eb",
    badgeBg: "#dbeafe",
    badgeBorder: "#bfdbfe",
    headerBg: "#eff6ff",
    headerBorder: "#dbeafe"
  },
  delivered: {
    label: "Delivered",
    icon: CheckCircle2,
    iconColor: "#16a34a",
    badgeBg: "#dcfce7",
    badgeBorder: "#bbf7d0",
    headerBg: "#f0fdf4",
    headerBorder: "#dcfce7"
  },
  return_requested: {
    label: "Return Requested",
    icon: RotateCcw,
    iconColor: "#d97706",
    badgeBg: "#fef3c7",
    badgeBorder: "#fde68a",
    headerBg: "#fffbeb",
    headerBorder: "#fef3c7"
  },
  returned: {
    label: "Returned",
    icon: RotateCcw,
    iconColor: "#475569",
    badgeBg: "#f1f5f9",
    badgeBorder: "#cbd5e1",
    headerBg: "#f8fafc",
    headerBorder: "#e2e8f0"
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    iconColor: "#e11d48",
    badgeBg: "#ffe4e6",
    badgeBorder: "#fecdd3",
    headerBg: "#fff1f2",
    headerBorder: "#ffe4e6"
  }
};

const ORDER_STATUS_OPTIONS = [
  { value: "placed", label: "Placed", icon: "🔵" },
  { value: "packed", label: "Packed", icon: "📦" },
  { value: "shipped", label: "Shipped", icon: "🚚" },
  { value: "out_for_delivery", label: "Out for Delivery", icon: "🛵" },
  { value: "delivered", label: "Delivered", icon: "✅" },
  { value: "return_requested", label: "Return Requested", icon: "🔄" },
  { value: "returned", label: "Returned", icon: "↩️" },
  { value: "cancelled", label: "Cancelled", icon: "❌" }
];

const ORDER_SORT_OPTIONS = [
  { value: "date_desc", label: "Date: Newest First" },
  { value: "date_asc", label: "Date: Oldest First" },
  { value: "amount_desc", label: "Amount: High to Low" },
  { value: "amount_asc", label: "Amount: Low to High" },
  { value: "items_desc", label: "Items: Most to Fewest" },
  { value: "items_asc", label: "Items: Fewest to Most" },
  { value: "customer_asc", label: "Customer: A to Z" },
  { value: "customer_desc", label: "Customer: Z to A" },
  { value: "id_desc", label: "Order ID: Descending" },
  { value: "id_asc", label: "Order ID: Ascending" }
];

// Fallback image helper ensuring crisp real product imagery
function getItemImage(item) {
  if (item?.image && typeof item.image === "string" && item.image.trim()) {
    return item.image;
  }
  const name = (item?.name || "").toLowerCase();
  if (name.includes("shoe") || name.includes("sneaker") || name.includes("one 8")) {
    return "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop&q=80";
  }
  if (name.includes("ps") || name.includes("game") || name.includes("console")) {
    return "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400&auto=format&fit=crop&q=80";
  }
  if (name.includes("table") || name.includes("chair") || name.includes("furniture") || name.includes("dining")) {
    return "https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=400&auto=format&fit=crop&q=80";
  }
  if (name.includes("tv") || name.includes("headphone") || name.includes("audio") || name.includes("earbud")) {
    return "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&auto=format&fit=crop&q=80";
  }
  if (name.includes("phone") || name.includes("mobile") || name.includes("iphone") || name.includes("samsung")) {
    return "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&auto=format&fit=crop&q=80";
  }
  if (name.includes("laptop") || name.includes("macbook") || name.includes("pc")) {
    return "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&auto=format&fit=crop&q=80";
  }
  if (name.includes("watch")) {
    return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80";
  }
  return "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&auto=format&fit=crop&q=80";
}

function VendorOrders({ defaultFilter = null }) {
  const sentinelRef = useRef(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  // Router Location & Search Params
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const isReturnsRoute = defaultFilter === "returned" || location.pathname.includes("/vendor/returns");

  // Filters & Sorting
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState(() => {
    if (isReturnsRoute) return "returned";
    return searchParams.get("tab") || "all";
  });
  const [sortBy, setSortBy] = useState("date_desc");

  // Sync status filter when route or query changes
  useEffect(() => {
    if (isReturnsRoute) {
      setStatusFilter("returned");
    } else {
      const tabParam = searchParams.get("tab");
      if (tabParam) {
        setStatusFilter(tabParam);
      }
    }
  }, [isReturnsRoute, location.search, searchParams]);

  const handleTabChange = (newFilter) => {
    setStatusFilter(newFilter);
    const nextParams = new URLSearchParams(searchParams);
    if (newFilter === "all") {
      nextParams.delete("tab");
    } else {
      nextParams.set("tab", newFilter);
    }
    setSearchParams(nextParams, { replace: true });
  };

  // Updating status state
  const [updatingId, setUpdatingId] = useState(null);

  // Invoice Modal state
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);

  // More options dropdown state (fixes 3-dots button)
  const [openMenuOrderId, setOpenMenuOrderId] = useState(null);
  const [viewCustomerOrder, setViewCustomerOrder] = useState(null);

  // Close more-options dropdown on outside click
  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (!e.target.closest(".vendor-more-wrap")) {
        setOpenMenuOrderId(null);
      }
    };
    document.addEventListener("mousedown", handleGlobalClick);
    return () => document.removeEventListener("mousedown", handleGlobalClick);
  }, []);

  // Return & Refund Console Modal state
  const [selectedReturnOrder, setSelectedReturnOrder] = useState(null);
  const [activeReturnRecord, setActiveReturnRecord] = useState(null);
  const [returnRecords, setReturnRecords] = useState([]);
  const [returnActionLoading, setReturnActionLoading] = useState(false);
  const [rejectionNote, setRejectionNote] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  // Copied Order ID state
  const [copiedId, setCopiedId] = useState(null);

  // Expand / collapse multiple order items
  const [expandedOrderIds, setExpandedOrderIds] = useState(new Set());

  const handleCopyOrderId = (idToCopy) => {
    if (!idToCopy) return;
    navigator.clipboard.writeText(idToCopy);
    setCopiedId(idToCopy);
    toast.success(`Order ID #${idToCopy} copied to clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleExpandOrder = (orderId) => {
    setExpandedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const loadOrders = useCallback(async (requestedPage = 1, append = false) => {
    append ? setLoadingMore(true) : setLoading(true);
    setError("");

    try {
      const [orderRes, returnRes] = await Promise.all([
        getVendorOrders(requestedPage, PAGE_SIZE),
        getReturns().catch(() => ({ items: [] }))
      ]);

      const data = orderRes;
      setReturnRecords(returnRes?.items || []);
      const nextItems = Array.isArray(data) ? data : data?.items || [];
      nextItems.sort((a, b) => new Date(b.createdAt || b.placedAt || 0) - new Date(a.createdAt || a.placedAt || 0));

      setOrders((current) => {
        if (!append) return nextItems;
        const existingIds = new Set(current.map((o) => o._id));
        const filtered = nextItems.filter((o) => !existingIds.has(o._id));
        const combined = [...current, ...filtered];
        combined.sort((a, b) => new Date(b.createdAt || b.placedAt || 0) - new Date(a.createdAt || a.placedAt || 0));
        return combined;
      });

      const actualPage = data?.page || requestedPage;
      const totalPages = data?.totalPages || 1;
      setPage(actualPage);
      setHasMore(actualPage < totalPages && nextItems.length > 0);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      append ? setLoadingMore(false) : setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders(1, false);
  }, [loadOrders]);

  // Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loading && !loadingMore) {
          loadOrders(page + 1, true);
        }
      },
      { rootMargin: "250px" }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, loadOrders, page]);

  // Open Return & Refund Console
  const handleOpenReturnConsole = async (ord) => {
    setSelectedReturnOrder(ord);
    setShowRejectInput(false);
    setRejectionNote("");
    const ordId = (ord.orderId || String(ord._id)).toUpperCase();
    let matching = returnRecords.find(
      (r) => String(r.orderId).toUpperCase() === ordId || String(r.orderRef?._id || r.orderRef) === String(ord._id)
    );
    if (!matching) {
      try {
        const fetched = await getReturns("", "", ordId);
        if (fetched?.items?.length > 0) {
          matching = fetched.items[0];
        }
      } catch {
        // Ignored
      }
    }
    setActiveReturnRecord(matching || null);
  };

  // Vendor Action on Return Request
  const handleVendorReturnAction = async (action) => {
    if (!selectedReturnOrder) return;
    setReturnActionLoading(true);
    try {
      let recordId = activeReturnRecord?._id;
      if (!recordId) {
        const ordId = selectedReturnOrder.orderId || String(selectedReturnOrder._id);
        const res = await getReturns("", "", ordId);
        if (res?.items?.length > 0) {
          recordId = res.items[0]._id;
        }
      }

      if (recordId) {
        await updateReturnStatus(
          recordId,
          action,
          action === "reject" ? rejectionNote : "",
          selectedReturnOrder.totalAmount
        );
      } else {
        const fallbackStatus = action === "credit_refund" ? "returned" : "packed";
        await updateVendorOrderStatus(selectedReturnOrder._id, fallbackStatus);
      }

      toast.success(
        action === "approve_pickup"
          ? "Reverse courier pickup scheduled successfully!"
          : action === "confirm_received"
          ? "Item marked as received at inspection hub!"
          : action === "pass_quality"
          ? "Quality check passed! Inventory stock restored."
          : action === "credit_refund"
          ? "Refund credited directly to customer wallet!"
          : "Return request declined."
      );

      await loadOrders(page, false);
      setSelectedReturnOrder(null);
      setActiveReturnRecord(null);
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to process return action");
    } finally {
      setReturnActionLoading(false);
    }
  };

  // Handle Status Change
  const handleStatusChange = async (orderId, newStatus) => {
    if (updatingId) return;
    setUpdatingId(orderId);
    try {
      const res = await updateVendorOrderStatus(orderId, newStatus);
      toast.success(res.msg || `Order status changed to ${newStatus}`);

      setOrders((prev) =>
        prev.map((ord) => {
          if (ord._id === orderId || ord.orderId === orderId) {
            return {
              ...ord,
              status: newStatus,
              statusTimestamps: {
                ...(ord.statusTimestamps || {}),
                [newStatus]: new Date()
              }
            };
          }
          return ord;
        })
      );
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter orders by search & status tab
  const filteredOrders = orders.filter((ord) => {
    const rawId = ord.orderId || String(ord._id);
    const oId = (rawId.startsWith("ORD") ? rawId : `ORD${rawId.slice(-8).toUpperCase()}`).toLowerCase();
    const custName = (ord.shippingAddress?.fullName || ord.customerName || "").toLowerCase();
    const matchesSearch =
      !debouncedSearch ||
      oId.includes(debouncedSearch.toLowerCase()) ||
      custName.includes(debouncedSearch.toLowerCase()) ||
      (Array.isArray(ord.items) &&
        ord.items.some((it) => (it.name || "").toLowerCase().includes(debouncedSearch.toLowerCase())));

    const rawStatus = String(ord.status || "placed").toLowerCase();
    const isReturnOrder = (ord.returnStatus && ord.returnStatus !== "none") || rawStatus === "returned" || rawStatus === "return_requested";
    const isReturnReq = ord.returnStatus === "requested" || rawStatus === "return_requested";
    const isReturned = ord.returnStatus === "approved" || rawStatus === "returned";
    const normStatus = isReturnReq ? "return_requested" : (isReturned ? "returned" : rawStatus);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "returned" && isReturnOrder) ||
      (statusFilter === "pending" && ["placed", "packed", "shipped", "out_for_delivery"].includes(rawStatus)) ||
      (statusFilter === "delivered" && (rawStatus === "delivered" && !isReturnReq)) ||
      normStatus === statusFilter ||
      rawStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Sort orders based on chosen criteria
  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.placedAt || 0).getTime();
      const dateB = new Date(b.createdAt || b.placedAt || 0).getTime();
      const amtA = Number(a.totalAmount || a.subtotal || 0);
      const amtB = Number(b.totalAmount || b.subtotal || 0);
      const itemsA = Array.isArray(a.items) ? a.items.length : 1;
      const itemsB = Array.isArray(b.items) ? b.items.length : 1;
      const nameA = (a.shippingAddress?.fullName || a.customerName || "").toLowerCase();
      const nameB = (b.shippingAddress?.fullName || b.customerName || "").toLowerCase();
      const idA = (a.orderId || String(a._id || "")).toLowerCase();
      const idB = (b.orderId || String(b._id || "")).toLowerCase();

      switch (sortBy) {
        case "date_asc":
          return dateA - dateB;
        case "date_desc":
          return dateB - dateA;
        case "amount_desc":
          return amtB - amtA;
        case "amount_asc":
          return amtA - amtB;
        case "items_desc":
          return itemsB - itemsA;
        case "items_asc":
          return itemsA - itemsB;
        case "customer_asc":
          return nameA.localeCompare(nameB);
        case "customer_desc":
          return nameB.localeCompare(nameA);
        case "id_asc":
          return idA.localeCompare(idB);
        case "id_desc":
          return idB.localeCompare(idA);
        default:
          return dateB - dateA;
      }
    });
  }, [filteredOrders, sortBy]);

  // Calculate return counts & refunded amount
  const returnOrdersCount = useMemo(() => {
    return orders.filter(
      (ord) => (ord.returnStatus && ord.returnStatus !== "none") || ord.status === "returned"
    ).length;
  }, [orders]);

  const totalRefundedAmount = useMemo(() => {
    return orders.reduce((sum, ord) => {
      if (ord.status === "returned" || ord.refundStatus === "credited" || ord.returnStatus === "returned") {
        return sum + Number(ord.refundAmount || ord.totalAmount || 0);
      }
      return sum;
    }, 0);
  }, [orders]);

  // Calculate status counts
  const statusCounts = orders.reduce((acc, ord) => {
    const st = String(ord.status || "placed").toLowerCase();
    acc[st] = (acc[st] || 0) + 1;
    if (ord.returnStatus === "requested" || st === "return_requested") {
      acc.return_requested = (acc.return_requested || 0) + 1;
    }
    return acc;
  }, {});

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="vendor-orders-page-container">
      {/* 1. BREADCRUMB & HEADER */}
      <div className="vendor-orders-header">
        <div className="vendor-orders-title-block">
          <div className="vendor-breadcrumb">
            <Home size={13} />
            <span>Orders &amp; Invoices</span>
            <ChevronRight size={13} />
            <span className="current">Orders</span>
          </div>
          <h2>Customer Orders &amp; Invoices</h2>
          <p className="vendor-page-subtext">
            Manage customer orders, track fulfillment status, and generate invoices.
          </p>
        </div>
      </div>

      {/* 2. TOP KPI CARDS GRID (6 Compact Cards) */}
      <div className="vendor-orders-kpi-grid">
        <div className="order-kpi-card">
          <div className="kpi-icon-box blue">
            <ShoppingCart size={18} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Total Orders</span>
            <strong className="kpi-value">{orders.length}</strong>
            <span className="kpi-trend positive">&uarr; 12% vs last month</span>
          </div>
        </div>

        <div className="order-kpi-card">
          <div className="kpi-icon-box purple">
            <Clock size={18} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Placed</span>
            <strong className="kpi-value">{statusCounts.placed || 0}</strong>
            <span className="kpi-subtext">Awaiting processing</span>
          </div>
        </div>

        <div className="order-kpi-card">
          <div className="kpi-icon-box amber">
            <Package size={18} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Packed</span>
            <strong className="kpi-value">{statusCounts.packed || 0}</strong>
            <span className="kpi-subtext">Ready for pickup</span>
          </div>
        </div>

        <div className="order-kpi-card">
          <div className="kpi-icon-box emerald">
            <Truck size={18} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Shipped</span>
            <strong className="kpi-value">
              {(statusCounts.shipped || 0) + (statusCounts.out_for_delivery || 0)}
            </strong>
            <span className="kpi-subtext">In transit to customer</span>
          </div>
        </div>

        <div className="order-kpi-card">
          <div className="kpi-icon-box green">
            <CheckCircle2 size={18} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Delivered</span>
            <strong className="kpi-value">{statusCounts.delivered || 0}</strong>
            <span className="kpi-subtext">Successfully fulfilled</span>
          </div>
        </div>

        <div className="order-kpi-card">
          <div className="kpi-icon-box rose">
            <XCircle size={18} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Cancelled</span>
            <strong className="kpi-value">{statusCounts.cancelled || 0}</strong>
            <span className="kpi-subtext">Cancelled orders</span>
          </div>
        </div>
      </div>

      {/* 3. SEARCH, SORT & STATUS TABS TOOLBAR */}
      <div className="vendor-orders-toolbar">
        <div className="vendor-orders-toolbar-left">
          {/* Search Input with right-aligned search icon and clear button */}
          <div className="vendor-orders-search">
            <input
              type="text"
              placeholder="Search by Order ID, customer, or product..."
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

          {/* Sorting Dropdown */}
          <div className="vendor-orders-sort">
            <CustomSelect
              value={sortBy}
              onChange={(val) => setSortBy(val)}
              options={ORDER_SORT_OPTIONS}
              placeholder="Sort by"
              size="sm"
              ariaLabel="Sort Orders"
              prefixIcon={<ArrowUpDown size={13} />}
              className="vendor-sort-select"
            />
          </div>
        </div>

        {/* Status Tabs */}
        <div className="vendor-orders-tabs">
          <button
            type="button"
            className={`orders-tab-btn ${statusFilter === "all" ? "active" : ""}`}
            onClick={() => handleTabChange("all")}
          >
            All ({orders.length})
          </button>
          <button
            type="button"
            className={`orders-tab-btn ${statusFilter === "placed" ? "active" : ""}`}
            onClick={() => handleTabChange("placed")}
          >
            Placed ({statusCounts.placed || 0})
          </button>
          <button
            type="button"
            className={`orders-tab-btn ${statusFilter === "packed" ? "active" : ""}`}
            onClick={() => handleTabChange("packed")}
          >
            Packed ({statusCounts.packed || 0})
          </button>
          <button
            type="button"
            className={`orders-tab-btn ${statusFilter === "shipped" ? "active" : ""}`}
            onClick={() => handleTabChange("shipped")}
          >
            Shipped ({(statusCounts.shipped || 0) + (statusCounts.out_for_delivery || 0)})
          </button>
          <button
            type="button"
            className={`orders-tab-btn ${statusFilter === "delivered" ? "active" : ""}`}
            onClick={() => handleTabChange("delivered")}
          >
            Delivered ({statusCounts.delivered || 0})
          </button>
          <button
            type="button"
            className={`orders-tab-btn ${statusFilter === "cancelled" ? "active" : ""}`}
            onClick={() => handleTabChange("cancelled")}
          >
            Cancelled ({statusCounts.cancelled || 0})
          </button>
        </div>
      </div>

      {/* 4. ORDERS LIST */}
      {error && <ErrorMessage message={error} />}

      {loading && orders.length === 0 ? (
        <Loader text="Loading customer orders..." />
      ) : sortedOrders.length === 0 ? (
        <div className="vendor-orders-empty">
          <ShoppingCart size={48} />
          <h3>No orders found</h3>
          <p>There are no customer orders matching the selected filter criteria.</p>
        </div>
      ) : (
        <div className="vendor-orders-list">
          {sortedOrders.map((ord) => {
            const rawId = ord.orderId || String(ord._id);
            const oId = rawId.startsWith("ORD") ? rawId : `ORD${rawId.slice(-8).toUpperCase()}`;
            const rawStatus = String(ord.status || "placed").toLowerCase();
            const isReturnReq = ord.returnStatus === "requested" || rawStatus === "return_requested";
            const isReturned = ord.returnStatus === "approved" || rawStatus === "returned";
            const statusNorm = isReturnReq ? "return_requested" : (isReturned ? "returned" : rawStatus);
            const theme = STATUS_THEMES[statusNorm] || STATUS_THEMES.placed;
            const StatusIcon = theme.icon;

            const items = Array.isArray(ord.items) && ord.items.length > 0
              ? ord.items
              : [{
                  name: ord.productId?.name || "Product Item",
                  image: ord.productId?.image || "",
                  qty: ord.qty || 1,
                  price: ord.price || 0
                }];
            const totalAmt = Number(ord.totalAmount || ord.subtotal || 0);

            // Expand state for long item lists (show 1 if collapsed, all if expanded, or show all if <= 3)
            const isExpanded = expandedOrderIds.has(ord._id);
            const displayItems = (items.length > 2 && !isExpanded) ? items.slice(0, 1) : items;

            return (
              <div key={ord._id} className={`vendor-order-card status-${statusNorm}`}>
                {/* 1. Header with Pastel Status Tint */}
                <div
                  className="order-card-header"
                  style={{ background: theme.headerBg, borderBottomColor: theme.headerBorder }}
                >
                  <div className="order-header-left">
                    {/* Status Badge Icon */}
                    <div
                      className="order-status-icon-badge"
                      style={{ background: theme.badgeBg, borderColor: theme.badgeBorder, color: theme.iconColor }}
                    >
                      <StatusIcon size={18} />
                    </div>

                    <div className="order-id-block">
                      <div className="order-id-row">
                        <span className="order-id-text">#{oId}</span>
                        <span className="order-payment-pill">
                          {(ord.paymentMethod || "COD").toUpperCase()}
                        </span>
                        <button
                          type="button"
                          className="order-copy-btn"
                          onClick={() => handleCopyOrderId(oId)}
                          title="Copy Order ID"
                        >
                          {copiedId === oId ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                        </button>
                      </div>
                      <span className="order-timestamp">
                        {formatDateTime(ord.createdAt || ord.placedAt)}
                      </span>
                    </div>
                  </div>

                  <div className="order-header-right">
                    {/* Status Updater CustomSelect */}
                    <div className="order-status-changer-wrap">
                      <span className="changer-label">Update Status:</span>
                      <CustomSelect
                        value={statusNorm}
                        disabled={updatingId === ord._id || statusNorm === "cancelled"}
                        onChange={(newStatus) => handleStatusChange(ord._id, newStatus)}
                        options={ORDER_STATUS_OPTIONS}
                        placeholder="Status"
                        size="sm"
                        ariaLabel="Update Order Status"
                        className="vendor-order-status-dropdown"
                      />
                    </div>

                    {/* View Invoice Action Button */}
                    <button
                      type="button"
                      className="vendor-invoice-btn"
                      onClick={() => setSelectedInvoiceOrder(ord)}
                      title="View &amp; Print Official Invoice"
                    >
                      <FileText size={15} />
                      <span>Invoice</span>
                    </button>

                    {/* Manage Return & Refund Action Button */}
                    {((ord.returnStatus && ord.returnStatus !== "none") || rawStatus === "returned" || rawStatus === "return_requested") && (
                      <button
                        type="button"
                        className="vendor-manage-return-btn"
                        onClick={() => handleOpenReturnConsole(ord)}
                        title="Manage Return & Refund Logistics"
                      >
                        <RotateCcw size={14} />
                        <span>Return &amp; Refund</span>
                      </button>
                    )}

                    {/* More Options Dropdown */}
                    <div className="vendor-more-wrap">
                      <button
                        type="button"
                        className={`vendor-more-btn ${openMenuOrderId === ord._id ? "active" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuOrderId(openMenuOrderId === ord._id ? null : ord._id);
                        }}
                        title="More Options"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {openMenuOrderId === ord._id && (
                        <div className="vendor-more-dropdown" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="more-dropdown-item"
                            onClick={() => {
                              setSelectedInvoiceOrder(ord);
                              setOpenMenuOrderId(null);
                            }}
                          >
                            <FileText size={14} />
                            <span>View Invoice</span>
                          </button>
                          <button
                            type="button"
                            className="more-dropdown-item"
                            onClick={() => {
                              setSelectedInvoiceOrder(ord);
                              setOpenMenuOrderId(null);
                              setTimeout(() => window.print(), 350);
                            }}
                          >
                            <Printer size={14} />
                            <span>Print Packing Slip</span>
                          </button>
                          <button
                            type="button"
                            className="more-dropdown-item"
                            onClick={() => {
                              handleCopyOrderId(oId);
                              setOpenMenuOrderId(null);
                            }}
                          >
                            <Copy size={14} />
                            <span>Copy Order ID</span>
                          </button>
                          <button
                            type="button"
                            className="more-dropdown-item"
                            onClick={() => {
                              setViewCustomerOrder(ord);
                              setOpenMenuOrderId(null);
                            }}
                          >
                            <User size={14} />
                            <span>Customer &amp; Shipping</span>
                          </button>
                          {((ord.returnStatus && ord.returnStatus !== "none") || rawStatus === "returned" || rawStatus === "return_requested") && (
                            <button
                              type="button"
                              className="more-dropdown-item return-link"
                              onClick={() => {
                                handleOpenReturnConsole(ord);
                                setOpenMenuOrderId(null);
                              }}
                            >
                              <RotateCcw size={14} />
                              <span>View Return Claim</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Return Alert Banner */}
                {((ord.returnStatus && ord.returnStatus !== "none") || rawStatus === "returned" || rawStatus === "return_requested") && (
                  <div className="order-return-banner">
                    <div className="return-banner-left">
                      <span className="return-pulse-dot" />
                      <span className="return-banner-title">
                        {ord.returnStatus === "approved" || rawStatus === "returned"
                          ? "Return Processed"
                          : ord.returnStatus === "rejected"
                          ? "Return Declined"
                          : "Return Requested"}
                      </span>
                      <span className="return-banner-reason">
                        Reason: <strong>{ord.returnReason || "Defective / Quality claim"}</strong>
                      </span>
                      {ord.returnComments && (
                        <span className="return-banner-comments">"{ord.returnComments}"</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="return-banner-action-btn"
                      onClick={() => handleOpenReturnConsole(ord)}
                    >
                      <RotateCcw size={13} />
                      <span>Manage Return</span>
                    </button>
                  </div>
                )}

                {/* 2. Order Content Grid: Items & Customer Details */}
                <div className="order-card-body">
                  {/* Left: Product Items */}
                  <div className="order-items-col">
                    <span className="section-label">Order Items ({items.length})</span>
                    <div className="order-items-list">
                      {displayItems.map((it, idx) => (
                        <div key={idx} className="order-item-row">
                          <div className="order-item-thumb">
                            <img
                              src={getItemImage(it)}
                              alt={it.name || "Product"}
                              onError={(e) => {
                                e.currentTarget.src = getItemImage({ name: it.name || "" });
                              }}
                            />
                          </div>
                          <div className="order-item-info">
                            <strong className="order-item-name">{it.name}</strong>
                            <div className="order-item-meta">
                              <span>Qty: {it.qty || 1} &times; &#8377;{Number(it.price || 0).toLocaleString("en-IN")}</span>
                            </div>
                          </div>
                          <div className="order-item-subtotal">
                            &#8377;{(Number(it.price || 0) * Number(it.qty || 1)).toLocaleString("en-IN")}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Toggle Button for More Items */}
                    {items.length > 2 && (
                      <button
                        type="button"
                        className="order-items-toggle-btn"
                        onClick={() => toggleExpandOrder(ord._id)}
                      >
                        {isExpanded ? (
                          <>Show Less <ChevronUp size={14} /></>
                        ) : (
                          <>View Items Details ({items.length}) <ChevronDown size={14} /></>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Right: Shipping & Customer Info */}
                  <div className="order-customer-col">
                    <span className="section-label">Customer &amp; Delivery Destination</span>
                    <div className="customer-info-box">
                      <div className="info-row customer-name-row">
                        <User size={14} className="info-icon" />
                        <strong>{ord.shippingAddress?.fullName || ord.customerName || "Customer"}</strong>
                      </div>
                      {ord.shippingAddress?.phone && (
                        <div className="info-row">
                          <Phone size={14} className="info-icon" />
                          <span>{ord.shippingAddress.phone}</span>
                        </div>
                      )}
                      <div className="info-row">
                        <MapPin size={14} className="info-icon" />
                        <span>
                          {ord.shippingAddress?.addressLine1
                            ? `${ord.shippingAddress.addressLine1}, ${ord.shippingAddress.city || ""}, ${ord.shippingAddress.state || ""} - ${ord.shippingAddress.pincode || ""}`
                            : "Standard Registered Delivery Address"}
                        </span>
                      </div>
                    </div>

                    {/* Order Financial Summary */}
                    <div className="order-total-strip">
                      <span className="total-label">Total Order Value:</span>
                      <strong className="total-val">&#8377;{totalAmt.toLocaleString("en-IN")}</strong>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Infinite Scroll Sentinel */}
      <div ref={sentinelRef} style={{ height: "40px", margin: "1rem 0" }}>
        {loadingMore && <Loader text="Loading more orders..." />}
      </div>

      {/* 4. PRINTABLE VENDOR INVOICE MODAL */}
      {selectedInvoiceOrder && (
        <div className="vendor-modal-backdrop" onClick={() => setSelectedInvoiceOrder(null)}>
          <div
            className="vendor-invoice-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="invoice-modal-header no-print">
              <h3>Vendor Tax Invoice</h3>
              <div className="invoice-header-actions">
                <button type="button" className="invoice-print-btn" onClick={handlePrint}>
                  <Printer size={16} />
                  <span>Print / Download PDF</span>
                </button>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setSelectedInvoiceOrder(null)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Invoice Sheet */}
            <div className="vendor-invoice-sheet printable-area">
              <div className="invoice-sheet-top">
                <div className="invoice-brand-block">
                  <h2>INVENTORY VENDOR INVOICE</h2>
                  <p className="invoice-tagline">Official Commercial Receipt &amp; Packing Slip</p>
                </div>

                <div className="invoice-meta-block">
                  <div className="meta-line">
                    <span>Invoice No:</span>
                    <strong>{selectedInvoiceOrder.invoiceId || `INV-${String(selectedInvoiceOrder._id).slice(-8).toUpperCase()}`}</strong>
                  </div>
                  <div className="meta-line">
                    <span>Order No:</span>
                    <strong>#{selectedInvoiceOrder.orderId || String(selectedInvoiceOrder._id).slice(-8).toUpperCase()}</strong>
                  </div>
                  <div className="meta-line">
                    <span>Date:</span>
                    <span>{formatDate(selectedInvoiceOrder.createdAt || selectedInvoiceOrder.placedAt)}</span>
                  </div>
                </div>
              </div>

              <div className="invoice-sheet-parties">
                <div className="party-box">
                  <span className="party-title">Sold By (Vendor):</span>
                  <strong>{selectedInvoiceOrder.vendorName || "Authorized Merchant"}</strong>
                  <p>Inventory Logistics Partner Hub</p>
                  <p>GSTIN: 27AABCI1234F1Z5</p>
                </div>

                <div className="party-box">
                  <span className="party-title">Billed &amp; Shipped To:</span>
                  <strong>{selectedInvoiceOrder.shippingAddress?.fullName || selectedInvoiceOrder.customerName || "Valued Customer"}</strong>
                  <p>{selectedInvoiceOrder.shippingAddress?.addressLine1 || "Registered Shipping Address"}</p>
                  <p>
                    {selectedInvoiceOrder.shippingAddress?.city} {selectedInvoiceOrder.shippingAddress?.state} {selectedInvoiceOrder.shippingAddress?.pincode}
                  </p>
                  {selectedInvoiceOrder.shippingAddress?.phone && (
                    <p>Phone: {selectedInvoiceOrder.shippingAddress.phone}</p>
                  )}
                </div>
              </div>

              {/* Itemized Table */}
              <table className="invoice-items-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product Description</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(selectedInvoiceOrder.items) && selectedInvoiceOrder.items.length > 0
                    ? selectedInvoiceOrder.items
                    : [{
                        name: selectedInvoiceOrder.productId?.name || "Product",
                        qty: selectedInvoiceOrder.qty || 1,
                        price: selectedInvoiceOrder.price || 0
                      }]
                  ).map((it, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>
                        <strong>{it.name}</strong>
                      </td>
                      <td>{it.qty || 1}</td>
                      <td>₹{Number(it.price || 0).toLocaleString("en-IN")}</td>
                      <td>₹{(Number(it.price || 0) * Number(it.qty || 1)).toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Calculations */}
              <div className="invoice-sheet-bottom">
                <div className="invoice-payment-info">
                  <p>
                    <strong>Payment Mode:</strong> {(selectedInvoiceOrder.paymentMethod || "UPI").toUpperCase()}
                  </p>
                  <p>
                    <strong>Order Status:</strong> {String(selectedInvoiceOrder.status || "placed").toUpperCase()}
                  </p>
                  <p className="invoice-legal-note">
                    This is a computer-generated invoice and requires no physical signature.
                  </p>
                </div>

                <div className="invoice-totals-box">
                  <div className="tot-line">
                    <span>Subtotal:</span>
                    <span>₹{Number(selectedInvoiceOrder.subtotal || selectedInvoiceOrder.totalAmount || 0).toLocaleString("en-IN")}</span>
                  </div>
                  {Number(selectedInvoiceOrder.deliveryFee) > 0 && (
                    <div className="tot-line">
                      <span>Delivery / Shipping:</span>
                      <span>₹{Number(selectedInvoiceOrder.deliveryFee).toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  {Number(selectedInvoiceOrder.couponDiscount) > 0 && (
                    <div className="tot-line discount">
                      <span>Discount / Coupon:</span>
                      <span>-₹{Number(selectedInvoiceOrder.couponDiscount).toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div className="tot-line grand-total">
                    <span>Total Amount:</span>
                    <strong>₹{Number(selectedInvoiceOrder.totalAmount || selectedInvoiceOrder.subtotal || 0).toLocaleString("en-IN")}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. VENDOR RETURN & REFUND CONSOLE MODAL */}
      {selectedReturnOrder && (
        <div className="vendor-modal-backdrop" onClick={() => setSelectedReturnOrder(null)}>
          <div className="vendor-return-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="return-modal-header">
              <div className="return-modal-title-group">
                <h3>Reverse Logistics &amp; Refund Console</h3>
                <div className="return-modal-meta">
                  <span>Order: <strong>#{selectedReturnOrder.orderId || String(selectedReturnOrder._id).slice(-8).toUpperCase()}</strong></span>
                  {activeReturnRecord?.returnId && (
                    <span>Return ID: <strong>#{activeReturnRecord.returnId}</strong></span>
                  )}
                  <span>Placed: <strong>{formatDate(selectedReturnOrder.createdAt || selectedReturnOrder.placedAt)}</strong></span>
                </div>
              </div>
              <button
                type="button"
                className="return-close-btn"
                onClick={() => setSelectedReturnOrder(null)}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Stepper or Rejection Banner */}
            {activeReturnRecord?.status === "rejected" || selectedReturnOrder.returnStatus === "rejected" ? (
              <div style={{ padding: "16px 20px", background: "#fff1f2", borderBottom: "1px solid #ffe4e6", color: "#e11d48", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                <XCircle size={18} />
                <span>Return Request was DECLINED by Merchant. Reason: {activeReturnRecord?.timeline?.find((t) => t.status === "rejected")?.note || selectedReturnOrder.returnReason || "Item not eligible for return"}</span>
              </div>
            ) : (
              <div className="return-stepper-container">
                <div className="return-stepper">
                  {/* Connector line */}
                  <div className="stepper-line">
                    <div
                      className="stepper-line-progress"
                      style={{
                        width: `${(getReturnStepIndex(activeReturnRecord?.status || selectedReturnOrder.returnStatus) / 5) * 100}%`
                      }}
                    />
                  </div>

                  {RETURN_STEPS.map((step, idx) => {
                    const currentIdx = getReturnStepIndex(activeReturnRecord?.status || selectedReturnOrder.returnStatus);
                    const isCompleted = idx < currentIdx;
                    const isActive = idx === currentIdx;

                    return (
                      <div
                        key={step.id}
                        className={`stepper-step ${isCompleted ? "completed" : ""} ${isActive ? "active" : ""}`}
                      >
                        <div className="stepper-icon-circle">
                          {isCompleted ? <Check size={16} /> : idx + 1}
                        </div>
                        <span className="stepper-label">{step.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Modal Body */}
            <div className="return-modal-body">
              {/* Card 1: Return Reason & Customer Info */}
              <div className="return-detail-card">
                <div className="return-card-title">
                  <RotateCcw size={14} />
                  <span>Customer Claim &amp; Reverse Destination</span>
                </div>
                <div className="return-info-rows">
                  <div className="return-info-row">
                    <span className="label">Customer:</span>
                    <span className="val">{selectedReturnOrder.shippingAddress?.fullName || selectedReturnOrder.customerName || "Valued Customer"}</span>
                  </div>
                  <div className="return-info-row">
                    <span className="label">Contact Phone:</span>
                    <span className="val">{selectedReturnOrder.shippingAddress?.phone || "N/A"}</span>
                  </div>
                  <div className="return-info-row">
                    <span className="label">Pickup Address:</span>
                    <span className="val" style={{ textAlign: "right", maxWidth: "240px" }}>
                      {selectedReturnOrder.shippingAddress?.addressLine1 || "Registered Shipping Address"}, {selectedReturnOrder.shippingAddress?.city} {selectedReturnOrder.shippingAddress?.pincode}
                    </span>
                  </div>
                  <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px dashed #cbd5e1" }}>
                    <div className="return-info-row" style={{ marginBottom: "4px" }}>
                      <span className="label">Reason Stated:</span>
                      <span className="val" style={{ color: "#d97706" }}>{activeReturnRecord?.reason || selectedReturnOrder.returnReason || "Defective / Quality Issue"}</span>
                    </div>
                    {(activeReturnRecord?.comments || selectedReturnOrder.returnComments) && (
                      <div className="return-info-row">
                        <span className="label">Comments:</span>
                        <span className="val" style={{ fontStyle: "italic" }}>"{activeReturnRecord?.comments || selectedReturnOrder.returnComments}"</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card 2: Financial & Item Breakdown */}
              <div className="return-detail-card">
                <div className="return-card-title">
                  <IndianRupee size={14} />
                  <span>Item &amp; Refund Settlement</span>
                </div>
                <div className="return-info-rows">
                  {/* Items list */}
                  {(selectedReturnOrder.items || []).slice(0, 2).map((it, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                      <img
                        src={getItemImage(it)}
                        alt={it.name}
                        style={{ width: "36px", height: "36px", borderRadius: "6px", objectFit: "cover", border: "1px solid #e2e8f0" }}
                      />
                      <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                        <div style={{ fontSize: "12px", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.name || "Product"}</div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>Qty: {it.qty || 1} &times; ₹{Number(it.price || 0).toLocaleString("en-IN")}</div>
                      </div>
                      <strong style={{ fontSize: "13px" }}>₹{(Number(it.price || 0) * Number(it.qty || 1)).toLocaleString("en-IN")}</strong>
                    </div>
                  ))}

                  <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px dashed #cbd5e1" }}>
                    <div className="return-info-row">
                      <span className="label">Order Total:</span>
                      <span className="val">₹{Number(selectedReturnOrder.totalAmount || 0).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="return-info-row" style={{ marginTop: "4px" }}>
                      <span className="label">Refund Target:</span>
                      <span className="val" style={{ color: "#059669", fontWeight: 700 }}>Customer In-App Wallet</span>
                    </div>
                    <div className="return-info-row" style={{ marginTop: "4px" }}>
                      <span className="label">Net Refundable:</span>
                      <strong style={{ fontSize: "15px", color: "#059669" }}>₹{Number(selectedReturnOrder.totalAmount || 0).toLocaleString("en-IN")}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="return-modal-actions">
              {showRejectInput ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%" }}>
                  <input
                    type="text"
                    placeholder="Enter reason for declining return..."
                    value={rejectionNote}
                    onChange={(e) => setRejectionNote(e.target.value)}
                    style={{ flex: 1, padding: "8px 12px", border: "1.5px solid #cbd5e1", borderRadius: "8px", fontSize: "13px" }}
                  />
                  <button
                    type="button"
                    className="btn-action-danger"
                    onClick={() => handleVendorReturnAction("reject")}
                    disabled={returnActionLoading}
                  >
                    {returnActionLoading ? "Declining..." : "Confirm Decline"}
                  </button>
                  <button
                    type="button"
                    style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: "12.5px" }}
                    onClick={() => setShowRejectInput(false)}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  {/* Dynamic Action Buttons according to step */}
                  {getReturnStepIndex(activeReturnRecord?.status || selectedReturnOrder.returnStatus) === 0 && (
                    <>
                      <button
                        type="button"
                        className="btn-action-danger"
                        onClick={() => setShowRejectInput(true)}
                        disabled={returnActionLoading}
                      >
                        Decline Return
                      </button>
                      <button
                        type="button"
                        className="btn-action-primary"
                        onClick={() => handleVendorReturnAction("approve_pickup")}
                        disabled={returnActionLoading}
                      >
                        <Truck size={15} />
                        <span>{returnActionLoading ? "Processing..." : "Approve & Schedule Pickup"}</span>
                      </button>
                    </>
                  )}

                  {getReturnStepIndex(activeReturnRecord?.status || selectedReturnOrder.returnStatus) === 1 && (
                    <button
                      type="button"
                      className="btn-action-primary"
                      onClick={() => handleVendorReturnAction("confirm_received")}
                      disabled={returnActionLoading}
                    >
                      <Package size={15} />
                      <span>{returnActionLoading ? "Processing..." : "Confirm Item Received at Hub"}</span>
                    </button>
                  )}

                  {getReturnStepIndex(activeReturnRecord?.status || selectedReturnOrder.returnStatus) === 2 && (
                    <button
                      type="button"
                      className="btn-action-success"
                      onClick={() => handleVendorReturnAction("pass_quality")}
                      disabled={returnActionLoading}
                    >
                      <CheckCircle2 size={15} />
                      <span>{returnActionLoading ? "Restocking..." : "Pass Quality & Restock Items"}</span>
                    </button>
                  )}

                  {(getReturnStepIndex(activeReturnRecord?.status || selectedReturnOrder.returnStatus) === 3 ||
                    getReturnStepIndex(activeReturnRecord?.status || selectedReturnOrder.returnStatus) === 4) && (
                    <button
                      type="button"
                      className="btn-action-success"
                      onClick={() => handleVendorReturnAction("credit_refund")}
                      disabled={returnActionLoading}
                    >
                      <IndianRupee size={15} />
                      <span>{returnActionLoading ? "Crediting..." : `Credit ₹${Number(selectedReturnOrder.totalAmount || 0).toLocaleString("en-IN")} Refund to Wallet`}</span>
                    </button>
                  )}

                  {getReturnStepIndex(activeReturnRecord?.status || selectedReturnOrder.returnStatus) === 5 && (
                    <div className="return-completed-tag">
                      <CheckCircle2 size={16} />
                      <span>Refund Credited &amp; Return Completed</span>
                    </div>
                  )}

                  <button
                    type="button"
                    style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "8px 14px", fontSize: "13px", fontWeight: 600, color: "#475569", cursor: "pointer" }}
                    onClick={() => setSelectedReturnOrder(null)}
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. CUSTOMER & DELIVERY DETAILS MODAL (triggered from More Options) */}
      {viewCustomerOrder && (
        <div className="action-modal-overlay" onClick={() => setViewCustomerOrder(null)}>
          <div className="action-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
            <div className="action-modal-header" style={{ borderBottom: "1px solid #e2e8f0" }}>
              <div className="action-modal-header-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>
                <User size={20} />
              </div>
              <div className="action-modal-header-text">
                <h3>Customer &amp; Delivery Details</h3>
                <p>Order #{viewCustomerOrder.orderId || String(viewCustomerOrder._id).slice(-8).toUpperCase()}</p>
              </div>
              <button type="button" className="action-modal-close-btn" onClick={() => setViewCustomerOrder(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="action-modal-body" style={{ padding: "20px 24px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "14px" }}>
                <div>
                  <span style={{ color: "#64748b", fontSize: "12px", fontWeight: "600", textTransform: "uppercase" }}>Customer Name</span>
                  <div style={{ fontWeight: "600", color: "#0f172a", marginTop: "2px" }}>
                    {viewCustomerOrder.shippingAddress?.fullName || viewCustomerOrder.customerName || "Customer"}
                  </div>
                </div>
                <div>
                  <span style={{ color: "#64748b", fontSize: "12px", fontWeight: "600", textTransform: "uppercase" }}>Contact Number</span>
                  <div style={{ fontWeight: "600", color: "#0f172a", marginTop: "2px" }}>
                    {viewCustomerOrder.shippingAddress?.phone || viewCustomerOrder.customerPhone || "Not provided"}
                  </div>
                </div>
                <div>
                  <span style={{ color: "#64748b", fontSize: "12px", fontWeight: "600", textTransform: "uppercase" }}>Delivery Address</span>
                  <div style={{ color: "#334155", marginTop: "2px", lineHeight: "1.5" }}>
                    {viewCustomerOrder.shippingAddress ? (
                      <>
                        {viewCustomerOrder.shippingAddress.addressLine1 || viewCustomerOrder.shippingAddress.street}<br />
                        {viewCustomerOrder.shippingAddress.city}, {viewCustomerOrder.shippingAddress.state} - {viewCustomerOrder.shippingAddress.pincode || viewCustomerOrder.shippingAddress.zipCode}
                      </>
                    ) : (
                      "Standard delivery address"
                    )}
                  </div>
                </div>
                <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "12px", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Payment Method</span>
                  <strong style={{ textTransform: "uppercase", color: "#0f172a" }}>{viewCustomerOrder.paymentMethod || "COD"}</strong>
                </div>
              </div>
            </div>
            <div className="action-modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setViewCustomerOrder(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VendorOrders;