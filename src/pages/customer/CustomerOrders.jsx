/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Filter,
  Truck,
  RotateCcw,
  ChevronRight,
  Package,
  MapPin,
  ArrowUpDown,
  X,
  Plus,
  CreditCard
} from "lucide-react";
import { useNavigate, useOutletContext } from "react-router-dom";
import CustomSelect from "../../components/CustomSelect";
import WideOrderModal from "../../components/WideOrderModal";
import MultiProductsOrderModal from "../../components/MultiProductsOrderModal";
import OrderDetailsSidepanel from "../../components/OrderDetailsSidepanel";
import ReturnRequestsSidepanel from "../../components/ReturnRequestsSidepanel";
import { CancelOrderModal, ReturnOrderModal } from "../../components/OrderActionModals";
import ConfirmModal from "../../components/ConfirmModal";
import { getCustomerOrders, cancelOrderReturn } from "../../services/orderService";
import { addToCart } from "../../services/cartService";
import { toast } from "../../components/Toast";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";
import { getErrorMessage } from "../../utils/errorHandler";
import { formatDateTime } from "../../utils/dateFormatter";
import useDebounce from "../../hooks/useDebounce";

const PAGE_SIZE = 30;

const STATUS_PILLS = [
  { key: "all", label: "All Orders" },
  { key: "placed", label: "Placed" },
  { key: "packed", label: "Packed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
  { key: "returned", label: "Returned" },
];

const STATUS_CONFIG = {
  placed: { label: "PLACED", badgeClass: "order-pill-placed" },
  packed: { label: "PACKED", badgeClass: "order-pill-packed" },
  shipped: { label: "SHIPPED", badgeClass: "order-pill-shipped" },
  out_for_delivery: { label: "OUT FOR DELIVERY", badgeClass: "order-pill-shipped" },
  delivered: { label: "DELIVERED", badgeClass: "order-pill-delivered" },
  cancelled: { label: "CANCELLED", badgeClass: "order-pill-cancelled" },
  returned: { label: "RETURNED", badgeClass: "order-pill-cancelled" },
  return_requested: { label: "RETURN REQUESTED", badgeClass: "order-pill-return-requested" },
  return_approved: { label: "RETURN APPROVED", badgeClass: "order-pill-return-approved" },
};

function getStatusMeta(statusKey, returnStatusKey) {
  const ret = String(returnStatusKey || "").toLowerCase().replace(/-/g, "_");
  if (ret && ret !== "none") {
    if (ret === "requested") {
      return { label: "RETURN REQUESTED", badgeClass: "order-pill-return-requested" };
    }
    if (ret === "approved" || ret === "pickup_confirmed" || ret === "pickup_scheduled") {
      return { label: "PICKUP SCHEDULED", badgeClass: "order-pill-return-approved" };
    }
    if (ret === "item_received" || ret === "picked_up") {
      return { label: "ITEM RECEIVED AT HUB", badgeClass: "order-pill-return-approved" };
    }
    if (ret === "quality_passed") {
      return { label: "QUALITY PASSED", badgeClass: "order-pill-return-approved" };
    }
    if (ret === "returned" || ret === "completed" || ret === "refund_credited") {
      return { label: "RETURNED & REFUNDED", badgeClass: "order-pill-cancelled" };
    }
    if (ret === "rejected") {
      return { label: "RETURN REJECTED", badgeClass: "order-pill-cancelled" };
    }
    if (ret === "cancelled" || ret === "customer_cancelled") {
      return { label: "RETURN CANCELLED", badgeClass: "order-pill-cancelled" };
    }
  }

  const normalized = String(statusKey || "placed").toLowerCase().replace(/-/g, "_");
  if (STATUS_CONFIG[normalized]) {
    return STATUS_CONFIG[normalized];
  }
  return {
    label: normalized ? normalized.toUpperCase().replace(/_/g, " ") : "PLACED",
    badgeClass: "order-pill-placed",
  };
}

function CustomerOrders() {
  const navigate = useNavigate();
  const { openPaymentsSidepanel } = useOutletContext() || {};
  const sentinelRef = useRef(null);
  const [orders, setOrders] = useState([]);
  const [allOrdersForCount, setAllOrdersForCount] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState("");
  
  // Modals
  const [selectedOrder, setSelectedOrder] = useState(null); // Wide full popup
  const [selectedMultiOrder, setSelectedMultiOrder] = useState(null); // Multi-products popup
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null); // Sidepanel
  const [cancelOrderTarget, setCancelOrderTarget] = useState(null); // Cancel popup
  const [returnOrderTarget, setReturnOrderTarget] = useState(null); // Return popup
  const [isRequestsDrawerOpen, setIsRequestsDrawerOpen] = useState(false); // Returns/Cancellations/Refunds sidepanel
  const [cancelReturnTarget, setCancelReturnTarget] = useState(null); // Cancel return confirmation modal
  const [cancellingReturn, setCancellingReturn] = useState(false);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest"); // newest, oldest, price_high, price_low

  const debouncedSearch = useDebounce(search, 350);

  // Load all orders once for count metrics
  useEffect(() => {
    async function fetchCounts() {
      try {
        const fullData = await getCustomerOrders(1, 200, "", "");
        const list = Array.isArray(fullData) ? fullData : fullData?.items || [];
        setAllOrdersForCount(list);
      } catch (err) {
        console.error("Count fetch error:", err);
      }
    }
    fetchCounts();
  }, []);

  const countsMap = useMemo(() => {
    const counts = { all: allOrdersForCount.length, placed: 0, packed: 0, shipped: 0, delivered: 0, cancelled: 0, returned: 0 };
    allOrdersForCount.forEach((ord) => {
      const st = String(ord.status || "placed").toLowerCase().replace(/-/g, "_");
      if (counts[st] !== undefined) {
        counts[st]++;
      }
    });
    return counts;
  }, [allOrdersForCount]);

  const loadOrders = useCallback(async (requestedPage = 1, append = false) => {
    append ? setLoadingMore(true) : setLoading(true);
    setError("");

    try {
      const data = await getCustomerOrders(requestedPage, PAGE_SIZE, debouncedSearch, status === "all" ? "" : status);
      const nextItems = Array.isArray(data) ? data : data?.items || [];

      setOrders((current) => {
        if (!append) return nextItems;
        const existingIds = new Set(current.map((o) => o._id));
        const filtered = nextItems.filter((o) => !existingIds.has(o._id));
        return [...current, ...filtered];
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
  }, [debouncedSearch, status]);

  // Initial load or reset when search / status filter changes
  useEffect(() => {
    loadOrders(1, false);
  }, [loadOrders]);

  // Infinite scroll intersection observer
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

  // Sorted orders computed list
  const sortedOrders = useMemo(() => {
    const list = [...orders];
    if (sortBy === "newest") {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sortBy === "oldest") {
      list.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    } else if (sortBy === "price_high") {
      list.sort((a, b) => Number(b.totalAmount || 0) - Number(a.totalAmount || 0));
    } else if (sortBy === "price_low") {
      list.sort((a, b) => Number(a.totalAmount || 0) - Number(b.totalAmount || 0));
    }
    return list;
  }, [orders, sortBy]);

  const handleBuyAgain = async (order) => {
    try {
      const items = Array.isArray(order.items) && order.items.length > 0 ? order.items : [];
      if (items.length > 0) {
        const firstProdId = items[0].productId?._id || items[0].productId;
        if (firstProdId) {
          await addToCart(firstProdId, 1);
          toast.success("Item added to cart! Redirecting to cart...");
          setTimeout(() => navigate("/customer/cart"), 600);
          return;
        }
      }
      toast.info("Opening order details...");
      setSelectedOrder(order);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleCancelReturn = (order) => {
    setCancelReturnTarget(order);
  };

  const confirmCancelReturn = async () => {
    const order = cancelReturnTarget;
    if (!order) return;
    const oId = order.orderId || String(order._id).slice(-8).toUpperCase();
    setCancellingReturn(true);
    try {
      await cancelOrderReturn(order._id);
      toast.success(`Return request for Order #${oId} cancelled.`);
      setOrders((prev) =>
        prev.map((o) => (o._id === order._id ? { ...o, returnStatus: "cancelled", refundStatus: "none" } : o))
      );
      setAllOrdersForCount((prev) =>
        prev.map((o) => (o._id === order._id ? { ...o, returnStatus: "cancelled", refundStatus: "none" } : o))
      );
      setCancelReturnTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to cancel return request");
    } finally {
      setCancellingReturn(false);
    }
  };

  return (
    <div className="revamped-orders-page">

      {/* ── HERO BANNER WITH DELIVERED PARCEL GRAPHIC ── */}
      <div className="revamped-orders-hero">
        <div className="orders-hero-content">
          <span className="orders-hero-tag">MY ORDERS</span>
          <h1>All your purchases</h1>
          <p>Track and review every order in one place.</p>
        </div>
        <div className="orders-hero-graphic-wrap">
          <img
            src="/orders_hero_banner.jpg"
            alt="Delivery Packaging"
            className="orders-hero-art-img"
          />
        </div>
      </div>

      {/* ── STATUS PILLS & SORT ROW ── */}
      <div className="orders-pills-sort-row">
        <div className="orders-status-pills-list">
          {STATUS_PILLS.map((pill) => {
            const isActive = status === pill.key;
            const count = countsMap[pill.key] ?? 0;
            return (
              <button
                key={pill.key}
                type="button"
                className={`order-status-pill-btn ${isActive ? "active" : ""}`}
                onClick={() => {
                  setStatus(pill.key);
                  setPage(1);
                }}
              >
                <span>{pill.label}</span>
                <span className="order-pill-count-badge">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="orders-sort-select-wrap">
          <ArrowUpDown size={15} className="sort-icon-left" />
          <CustomSelect
            value={sortBy}
            onChange={(val) => setSortBy(val)}
            options={[
              { value: "newest", label: "Newest First" },
              { value: "oldest", label: "Oldest First" },
              { value: "price_high", label: "Price: High to Low" },
              { value: "price_low", label: "Price: Low to High" },
            ]}
            className="orders-sort-custom-select"
          />
        </div>
      </div>

      {/* ── SEARCH & SECONDARY FILTER BAR ── */}
      <div className="orders-search-filter-bar">
        <div className="orders-search-field-wrap">
          <Search size={17} className="orders-search-icon" />
          <input
            type="text"
            className="orders-search-input"
            placeholder="Search by product name, order ID, or vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="orders-search-clear"
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="orders-filter-dropdown-wrap">
          <Filter size={16} className="filter-icon-left" />
          <CustomSelect
            value={status}
            onChange={(val) => {
              setStatus(val);
              setPage(1);
            }}
            options={[
              { value: "all", label: "All Statuses" },
              { value: "placed", label: "Placed" },
              { value: "packed", label: "Packed" },
              { value: "shipped", label: "Shipped" },
              { value: "out_for_delivery", label: "Out for Delivery" },
              { value: "delivered", label: "Delivered" },
              { value: "cancelled", label: "Cancelled" },
            ]}
            className="orders-status-filter-select"
          />
        </div>

        {/* ── DEDICATED BUTTON FOR RETURN, CANCEL & REFUND REQUESTS ── */}
        <button
          type="button"
          className="orders-requests-drawer-btn"
          onClick={() => setIsRequestsDrawerOpen(true)}
          title="Track Returns, Cancellations & Refund Requests"
        >
          <RotateCcw size={15} />
          <span>Returns & Refunds</span>
          {(countsMap.returned > 0 || countsMap.cancelled > 0) && (
            <span className="btn-badge">
              {Number(countsMap.returned || 0) + Number(countsMap.cancelled || 0)}
            </span>
          )}
        </button>

        {/* ── PAYMENT & TRANSACTIONS HISTORY ICON BUTTON ── */}
        <button
          type="button"
          className="orders-payments-icon-btn"
          onClick={() => openPaymentsSidepanel && openPaymentsSidepanel()}
          title="Payment & Transactions History"
          aria-label="Payment & Transactions History"
        >
          <CreditCard size={17} />
        </button>
      </div>

      <ErrorMessage message={error} onRetry={loadOrders} />

      {/* ── ORDERS CONTENT GRID ── */}
      {loading ? (
        <Loader type="orders" count={4} />
      ) : sortedOrders.length === 0 ? (
        <div className="orders-empty-state-card">
          <div className="empty-state-icon-box">
            <Package size={42} />
          </div>
          <h3>{search || status !== "all" ? "No matching orders found" : "No orders placed yet"}</h3>
          <p>
            {search || status !== "all"
              ? "Try adjusting your search query or status filters to locate orders."
              : "Explore our trending products and place your first order with instant live tracking!"}
          </p>
          {search || status !== "all" ? (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setSearch("");
                setStatus("all");
              }}
            >
              Clear Filters
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate("/customer/home")}
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 22px" }}
            >
              <Package size={17} />
              <span>Explore Marketplace Catalog</span>
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="revamped-orders-grid">
            {sortedOrders.map((order) => {
              const items = Array.isArray(order.items) && order.items.length > 0
                ? order.items
                : [
                    {
                      productId: order.productId?._id || order.productId,
                      name: order.productId?.name || order.name || "Product Item",
                      vendorName: order.vendorId?.name || order.vendorName || "Verified Vendor",
                      qty: order.qty || 1,
                      price: order.price || order.totalAmount || 0,
                      image: order.productId?.image || order.image || "",
                    },
                  ];

              const firstItem = items[0];
              const totalItemsCount = items.length;
              const orderTotal = Number(order.totalAmount || items.reduce((s, i) => s + Number(i.price || 0) * Number(i.qty || 1), 0));
              const statusMeta = getStatusMeta(order.status, order.returnStatus);
              const orderId = order.orderId || (order._id ? String(order._id).slice(-8).toUpperCase() : "ORD");
              const isDelivered = String(order.status || "").toLowerCase() === "delivered";

              const city = order.shippingAddress?.city || "Guntur";
              const state = order.shippingAddress?.state || "Andhra Pradesh";
              const vendorDisplayName = firstItem?.vendorName || order.vendorName || order.vendorId?.name || "oneplus";

              return (
                <div className="revamped-order-card" key={order._id}>
                  {/* CARD HEADER */}
                  <div className="order-card-header">
                    <div className="order-card-header-left">
                      <h3 className="order-card-id-title">Order #{orderId}</h3>
                      <p className="order-card-date-sub">
                        Placed on {formatDateTime(order.createdAt)}
                      </p>
                    </div>

                    <div className="order-card-header-right">
                      <span className={`order-status-badge ${statusMeta.badgeClass}`}>
                        {statusMeta.label}
                      </span>
                      <button
                        type="button"
                        className="order-view-details-link"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <span>View Details</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>

                  {/* CARD BODY: PRODUCT ROW */}
                  <div className="order-card-product-row">
                    <div className="order-product-thumb-wrap">
                      {firstItem?.image ? (
                        <img
                          src={firstItem.image}
                          alt={firstItem.name || "Product"}
                          className="order-product-img"
                        />
                      ) : (
                        <div className="order-product-placeholder">
                          <Package size={26} />
                        </div>
                      )}
                    </div>

                    <div className="order-product-details-col">
                      <div className="order-product-title-line">
                        <h4 className="order-product-name">{firstItem?.name || "Product Item"}</h4>
                        {totalItemsCount > 1 && (
                          <button
                            type="button"
                            className="order-multi-item-pill"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMultiOrder(order);
                            }}
                            title="Click to view all products in this order"
                          >
                            <Plus size={11} />
                            <span>{totalItemsCount - 1} more</span>
                          </button>
                        )}
                      </div>

                      <p className="order-product-vendor-line">
                        Vendor: <strong>{vendorDisplayName}</strong>
                      </p>

                      <div className="order-product-meta-row">
                        <span className="order-product-qty">Qty: {firstItem?.qty || 1}</span>
                        <span className="order-product-loc">
                          <MapPin size={13} className="loc-pin-icon" />
                          <span>{city}, {state}</span>
                        </span>
                      </div>
                    </div>

                    <div className="order-product-price-col">
                      <span className="order-item-price-val">
                        ₹ {Number(firstItem?.price || orderTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* CARD FOOTER */}
                  <div className="order-card-footer">
                    <div className="order-card-total-box">
                      <span className="order-total-label">Total Amount</span>
                      <strong className="order-total-amount">
                        ₹ {orderTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </strong>
                    </div>

                    <div className="order-card-actions-group">
                      {isDelivered ? (
                        <>
                          <button
                            type="button"
                            className="btn-order-secondary"
                            onClick={() => handleBuyAgain(order)}
                          >
                            <RotateCcw size={15} />
                            <span>Buy Again</span>
                          </button>
                          {String(order.returnStatus || "").toLowerCase() === "requested" ? (
                            <button
                              type="button"
                              className="btn-order-outline-cancel"
                              onClick={() => handleCancelReturn(order)}
                              title="Cancel your return request"
                            >
                              <span>Cancel Return</span>
                            </button>
                          ) : String(order.returnStatus || "").toLowerCase() !== "approved" &&
                             String(order.returnStatus || "").toLowerCase() !== "returned" &&
                             String(order.status || "").toLowerCase() !== "returned" ? (
                            <button
                              type="button"
                              className="btn-order-outline-return"
                              onClick={() => setReturnOrderTarget(order)}
                            >
                              <span>Return</span>
                            </button>
                          ) : null}
                        </>
                      ) : (
                        <>
                          {['placed', 'packed'].includes(String(order.status || '').toLowerCase()) && (
                            <button
                              type="button"
                              className="btn-order-outline-cancel"
                              onClick={() => setCancelOrderTarget(order)}
                            >
                              <span>Cancel</span>
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn-order-secondary"
                            onClick={() =>
                              navigate(`/customer/orders/${orderId}/track`, {
                                state: { order, from: "/customer/orders" },
                              })
                            }
                          >
                            <Truck size={15} />
                            <span>Track Status</span>
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        className="btn-order-primary"
                        onClick={() => setSelectedOrder(order)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div ref={sentinelRef} className="infinite-scroll-sentinel" />

          {loadingMore && (
            <div className="infinite-scroll-loading">
              <div className="spinner-small" />
              <span>Loading more purchases...</span>
            </div>
          )}

          {!hasMore && sortedOrders.length > 0 && (
            <div className="infinite-scroll-end">
              <span>All {sortedOrders.length} orders loaded</span>
            </div>
          )}
        </>
      )}

      {/* ── POPUP: MULTI-PRODUCT POPUP (Dedicated on clicking '+N more') ── */}
      <MultiProductsOrderModal
        isOpen={Boolean(selectedMultiOrder)}
        order={selectedMultiOrder}
        onClose={() => setSelectedMultiOrder(null)}
        onOpenFullDetails={(ord) => {
          setSelectedMultiOrder(null);
          setSelectedOrder(ord);
        }}
      />

      {/* ── POPUP: WIDE FULL ORDER DETAILS POPUP ── */}
      <WideOrderModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onViewInvoice={(ord) => setSelectedInvoiceOrder(ord)}
        onCancelOrder={(ord) => setCancelOrderTarget(ord)}
        onReturnOrder={(ord) => setReturnOrderTarget(ord)}
      />

      {/* ── POPUP: INVOICE SIDEPANEL ── */}
      <OrderDetailsSidepanel
        isOpen={Boolean(selectedInvoiceOrder)}
        order={selectedInvoiceOrder}
        onClose={() => setSelectedInvoiceOrder(null)}
      />

      {/* ── POPUP: CANCEL ORDER MODAL ── */}
      <CancelOrderModal
        isOpen={Boolean(cancelOrderTarget)}
        order={cancelOrderTarget}
        onClose={() => setCancelOrderTarget(null)}
        onSuccess={() => {
          loadOrders(1, false);
          // Also refresh count
          getCustomerOrders(1, 200, "", "").then((fullData) => {
            const list = Array.isArray(fullData) ? fullData : fullData?.items || [];
            setAllOrdersForCount(list);
          }).catch(() => {});
        }}
      />

      {/* ── POPUP: RETURN / REFUND MODAL ── */}
      <ReturnOrderModal
        isOpen={Boolean(returnOrderTarget)}
        order={returnOrderTarget}
        onClose={() => setReturnOrderTarget(null)}
        onSuccess={(updatedOrder) => {
          loadOrders(1, false);
          if (updatedOrder?._id) {
            setSelectedOrder((current) => current?._id === updatedOrder._id
              ? { ...current, ...updatedOrder, returnStatus: updatedOrder.returnStatus || "requested" }
              : current);
          } else if (returnOrderTarget?._id) {
            setSelectedOrder((current) => current?._id === returnOrderTarget._id
              ? { ...current, returnStatus: "requested" }
              : current);
          }
        }}
      />

      {/* ── SIDEPANEL: RETURNS, CANCELLATIONS & REFUNDS TRACKING ── */}
      <ReturnRequestsSidepanel
        isOpen={isRequestsDrawerOpen}
        onClose={() => setIsRequestsDrawerOpen(false)}
        orders={allOrdersForCount.length > 0 ? allOrdersForCount : orders}
        onSelectOrder={(ord) => setSelectedOrder(ord)}
      />

      {/* ── MODAL: CANCEL RETURN CONFIRMATION ── */}
      <ConfirmModal
        isOpen={Boolean(cancelReturnTarget)}
        title="Cancel Return Request?"
        message={`Are you sure you want to cancel the return request for Order #${cancelReturnTarget?.orderId || (cancelReturnTarget?._id ? String(cancelReturnTarget._id).slice(-8).toUpperCase() : "")}? Your order will remain Delivered.`}
        confirmText={cancellingReturn ? "Cancelling..." : "Yes, Cancel Return"}
        onConfirm={confirmCancelReturn}
        onCancel={() => setCancelReturnTarget(null)}
      />
    </div>
  );
}

export default CustomerOrders;
