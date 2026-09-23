/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  CreditCard,
  Pencil,
  Truck,
  MapPin,
  ShoppingBag,
  Package,
  Wallet,
  Mail,
  Phone,
  CheckCircle2,
  ArrowRight,
  IndianRupee,
  Shield,
  FileText,
  Check,
  ChevronRight,
  RotateCcw,
  X,
  Plus,
  Bell,
  Compass,
  Headphones,
  Sliders,
  Brain
} from "lucide-react";
import { getGestureNavEnabled, setGestureNavEnabled } from "../../hooks/useGestureNavigation";
import { getCustomerOrders } from "../../services/orderService";
import { formatDate, formatDateTime } from "../../utils/dateFormatter";
import Modal from "../../components/Modal";
import WideOrderModal from "../../components/WideOrderModal";
import MultiProductsOrderModal from "../../components/MultiProductsOrderModal";
import OrderDetailsSidepanel from "../../components/OrderDetailsSidepanel";
import ReturnRequestsSidepanel from "../../components/ReturnRequestsSidepanel";
import ShoppingProfileModal from "../../components/profile/ShoppingProfileModal";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";
import { getErrorMessage } from "../../utils/errorHandler";

const STATUS_CONFIG = {
  placed: { label: "Placed", badgeClass: "status-badge-placed" },
  packed: { label: "Packed", badgeClass: "status-badge-packed" },
  shipped: { label: "Shipped", badgeClass: "status-badge-shipped" },
  out_for_delivery: { label: "Out for Delivery", badgeClass: "status-badge-out-for-delivery" },
  delivered: { label: "Delivered", badgeClass: "status-badge-delivered" },
  cancelled: { label: "Cancelled", badgeClass: "status-badge-cancelled" },
  returned: { label: "Returned", badgeClass: "status-badge-cancelled" },
  return_requested: { label: "Return Requested", badgeClass: "status-badge-out-for-delivery" },
  return_approved: { label: "Return Approved", badgeClass: "status-badge-packed" },
};

function formatShortDate(dateVal) {
  if (!dateVal) return "—";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "—";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}, ${d.getFullYear()}`;
}

function getStatusMeta(statusKey, returnStatusKey) {
  const ret = String(returnStatusKey || "").toLowerCase().replace(/-/g, "_");
  if (ret && ret !== "none") {
    if (ret === "requested") return { label: "Return Requested", badgeClass: "status-badge-out-for-delivery" };
    if (ret === "approved") return { label: "Return Approved", badgeClass: "status-badge-packed" };
    if (ret === "returned" || ret === "completed") return { label: "Returned", badgeClass: "status-badge-cancelled" };
    if (ret === "rejected") return { label: "Return Rejected", badgeClass: "status-badge-cancelled" };
  }
  const normalized = String(statusKey || "placed").toLowerCase().replace(/-/g, "_");
  return (
    STATUS_CONFIG[normalized] || {
      label: normalized ? normalized.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Placed",
      badgeClass: "status-badge-placed",
    }
  );
}

function CustomerDetails() {
  const context = useOutletContext() || {};
  const {
    profile: contextProfile,
    wallet: contextWallet,
    methods: contextMethods,
    addresses: contextAddresses,
    openProfileModal,
    openAddressesModal,
    openPaymentModal,
    openWalletModal,
    openAccountSidepanel,
    openPasswordModal,
    openLogoutModal,
    openNotificationSidepanel,
    openPaymentsSidepanel,
    openTicketsSidepanel,
    unreadNotifCount = 0
  } = context;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [selectedMultiOrder, setSelectedMultiOrder] = useState(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
  const [selectedTrackingOrder, setSelectedTrackingOrder] = useState(null);
  const [isRequestsDrawerOpen, setIsRequestsDrawerOpen] = useState(false);
  const [isGestureNavEnabled, setIsGestureNavEnabled] = useState(getGestureNavEnabled);
  const [isShoppingProfileModalOpen, setIsShoppingProfileModalOpen] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const customerOrders = await getCustomerOrders();
      const orderList = Array.isArray(customerOrders) ? customerOrders : customerOrders?.items || [];
      orderList.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setOrders(orderList);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  if (loading) return <Loader text="Loading your account..." />;

  const profile = contextProfile || {};
  const wallet = contextWallet || { balance: 0 };
  const methods = contextMethods || [];
  const addresses = contextAddresses || [];

  // Computed Metrics
  const totalOrdersCount = orders.length;
  const totalItemsPurchased = orders.reduce((sum, order) => {
    if (Array.isArray(order.items) && order.items.length > 0) {
      return sum + order.items.reduce((itemSum, it) => itemSum + Number(it.qty || 1), 0);
    }
    return sum + Number(order.qty || 1);
  }, 0);

  const totalSpentAmount = orders.reduce((sum, order) => {
    if (order.totalAmount !== undefined && order.totalAmount !== null) {
      return sum + Number(order.totalAmount || 0);
    }
    return sum + Number(order.price || 0) * Number(order.qty || 1);
  }, 0);

  const memberSinceFormatted = profile?.createdAt
    ? formatDate(profile.createdAt)
    : "April 12, 2026";

  const userInitial = (profile?.name || "Customer").charAt(0).toUpperCase();

  return (
    <div className="account-details-page-inner">
      <ErrorMessage message={error} onRetry={loadOrders} />

      {/* PAGE TITLE */}
      <div className="account-title-group">
        <h1>My Details</h1>
        <p>Manage your profile, orders, addresses, payments and account settings.</p>
      </div>

      {/* PROFILE BANNER CARD */}
      <div className="account-profile-banner">
        <div className="account-profile-banner-left">
          <div className="account-banner-avatar-wrap">
            <div className="account-banner-avatar">
              {profile?.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.name || "Customer"}
                  className="account-banner-avatar-img"
                />
              ) : (
                userInitial
              )}
            </div>
            <span className="account-banner-online-dot" title="Account active" />
          </div>

          <div className="account-banner-user-info">
            <div className="account-banner-name-row">
              <h2>{profile?.name || "Customer"}</h2>
              <span className="account-member-since-pill">Member since {memberSinceFormatted}</span>
            </div>

            <div className="account-banner-contact-row">
              <span className="account-banner-contact-item">
                <Mail size={15} />
                {profile?.email || "No email"}
              </span>
              <span className="account-banner-contact-item">
                <Phone size={15} />
                {profile?.phone || "6305229699"}
              </span>
            </div>
          </div>
        </div>

        <div className="account-profile-banner-center">
          <p className="account-banner-quote">&ldquo;Good things happen to good shoppers!&rdquo;</p>
        </div>

        <div className="account-profile-banner-right">
          {/* Shopping Bags Vector Art Illustration */}
          <div className="account-shopping-bags-graphic">
            <svg width="130" height="90" viewBox="0 0 130 90" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Purple/Blue Large Bag */}
              <rect x="25" y="24" width="48" height="62" rx="4" fill="#818CF8" fillOpacity="0.85" />
              <path d="M37 24V14C37 9.58172 40.5817 6 45 6H53C57.4183 6 61 9.58172 61 14V24" stroke="#6366F1" strokeWidth="3" strokeLinecap="round" />
              {/* Light Blue Accent Bag */}
              <rect x="58" y="32" width="42" height="54" rx="4" fill="#60A5FA" fillOpacity="0.9" />
              <path d="M68 32V24C68 20.6863 70.6863 18 74 18H84C87.3137 18 90 20.6863 90 24V32" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
              {/* Small Front Cyan Bag */}
              <rect x="85" y="44" width="36" height="42" rx="4" fill="#93C5FD" fillOpacity="0.95" />
              <path d="M94 44V38C94 35.7909 95.7909 34 98 34H108C110.209 34 112 35.7909 112 38V44" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>

          <button
            type="button"
            className="account-edit-profile-btn"
            onClick={() => {
              if (typeof openAccountSidepanel === "function") {
                openAccountSidepanel("profile");
              } else if (typeof openProfileModal === "function") {
                openProfileModal();
              }
            }}
          >
            <Pencil size={15} />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* 4 STAT METRIC CARDS */}
      <div className="account-stats-grid">
        {/* Card 1: Total Orders */}
        <div className="account-stat-card">
          <div className="account-stat-icon-wrap">
            <ShoppingBag size={20} className="account-stat-icon" />
          </div>
          <strong className="account-stat-value">{totalOrdersCount}</strong>
          <span className="account-stat-label">Total Orders</span>
          <span className="account-stat-trend positive">
            &uarr; +2 from last month
          </span>
        </div>

        {/* Card 2: Items Purchased */}
        <div className="account-stat-card">
          <div className="account-stat-icon-wrap">
            <Package size={20} className="account-stat-icon" />
          </div>
          <strong className="account-stat-value">{totalItemsPurchased}</strong>
          <span className="account-stat-label">Items Purchased</span>
          <span className="account-stat-trend positive">
            &uarr; +5 from last month
          </span>
        </div>

        {/* Card 3: Total Spent */}
        <div className="account-stat-card">
          <div className="account-stat-icon-wrap">
            <IndianRupee size={20} className="account-stat-icon" />
          </div>
          <strong className="account-stat-value">
            ₹ {totalSpentAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </strong>
          <span className="account-stat-label">Total Spent</span>
          <span className="account-stat-trend positive">
            &uarr; +12% from last month
          </span>
        </div>

        {/* Card 4: Wallet Balance */}
        <div className="account-stat-card wallet-card-accent">
          <div className="account-stat-icon-wrap">
            <Wallet size={20} className="account-stat-icon" />
          </div>
          <strong className="account-stat-value">
            ₹ {Number(wallet.balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </strong>
          <span className="account-stat-label">Wallet Balance</span>
          <button
            type="button"
            className="account-stat-action-btn"
            onClick={openWalletModal}
          >
            Add Money
          </button>
        </div>
      </div>

      {/* RECENT ORDERS CARD */}
      <div className="account-section-card">
        <div className="account-section-card-header">
          <div className="account-section-header-left">
            <div className="account-section-icon-box">
              <ShoppingBag size={18} />
            </div>
            <div>
              <h3 className="account-section-title">Recent Orders</h3>
              <span className="account-section-subtitle">Your latest purchases</span>
            </div>
          </div>

          <Link to="/customer/orders" className="account-view-all-link">
            View All Orders &rarr;
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="account-empty-orders">
            <Package size={38} className="account-empty-icon" />
            <p>No orders placed yet.</p>
            <Link to="/customer" className="btn btn-primary btn-sm">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="account-table-responsive">
            <table className="account-orders-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Date</th>
                  <th>Delivery Date</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 3).map((order) => {
                  const statusMeta = getStatusMeta(order.status, order.returnStatus);
                  const orderDate = order.createdAt ? formatShortDate(order.createdAt) : "Sep 12, 2026";
                  const orderDateObj = order.createdAt ? new Date(order.createdAt) : new Date();
                  const deliveryDateObj = order.deliveryDate
                    ? new Date(order.deliveryDate)
                    : new Date(orderDateObj.getTime() + 3 * 24 * 60 * 60 * 1000);
                  const deliveryDateFormatted = formatShortDate(deliveryDateObj);
                  const isDelivered = String(order.status || "").toLowerCase() === "delivered";

                  const rawItems = Array.isArray(order.items) && order.items.length > 0 ? order.items : [];
                  const totalItemsCount = rawItems.length;
                  const firstItem = rawItems.length > 0 ? rawItems[0] : null;
                  const productName = firstItem?.name || order.productId?.name || order.name || "Product Item";
                  const productImage = firstItem?.image || order.productId?.image || order.image || null;
                  const totalOrderQty = rawItems.length > 0
                    ? rawItems.reduce((acc, it) => acc + Number(it.qty || 1), 0)
                    : Number(order.qty || 1);
                  const totalValue = order.totalAmount || (Number(order.price || 0) * Number(order.qty || 1));

                  return (
                    <tr key={order._id}>
                      <td>
                        <div className="account-product-cell">
                          {productImage ? (
                            <img src={productImage} alt={productName} className="account-product-thumb" />
                          ) : (
                            <div className="account-product-thumb-placeholder">
                              <Package size={18} />
                            </div>
                          )}
                          <div className="account-product-info-wrap">
                            <span className="account-product-name" title={productName}>
                              {productName}
                            </span>
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
                        </div>
                      </td>
                      <td className="account-qty-cell">{totalOrderQty}</td>
                      <td className="account-date-cell">{orderDate}</td>
                      <td className="account-date-cell">
                        <span className="account-delivery-tag" title={isDelivered ? "Delivered Date" : "Estimated Delivery"}>
                          {deliveryDateFormatted}
                        </span>
                      </td>
                      <td>
                        <span className={`account-status-badge ${statusMeta.badgeClass}`}>
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="account-total-cell">
                        <strong>₹ {Number(totalValue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                      </td>
                      <td>
                        <div className="account-action-buttons-group">
                          <button
                            type="button"
                            className="account-table-btn"
                            onClick={() => setSelectedTrackingOrder(order)}
                            title="Track this order"
                          >
                            <Truck size={14} />
                            <span>Track Status</span>
                          </button>
                          <button
                            type="button"
                            className="account-table-btn"
                            onClick={() => setSelectedOrderDetails(order)}
                            title="View full order details popup"
                          >
                            <span>View Details</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SETTINGS / PROFILE ROWS */}
      <div className="account-settings-list">
        {/* Row: Return & Refund Requests (Placed after orders and before personal details) */}
        <div
          className="account-setting-row"
          onClick={() => setIsRequestsDrawerOpen(true)}
          role="button"
          tabIndex={0}
        >
          <div className="account-setting-left">
            <div className="account-setting-icon-box orange-theme">
              <RotateCcw size={18} />
            </div>
            <div className="account-setting-info">
              <h4>Return & Refund Requests</h4>
              <p>Track return requests, cancelled orders and wallet refunds</p>
            </div>
          </div>

          <div className="account-setting-right">
            <span className="account-setting-meta-text">
              {orders.filter((o) => {
                const st = String(o.status || "").toLowerCase();
                const retSt = String(o.returnStatus || "").toLowerCase();
                return st === "cancelled" || st === "returned" || st === "return_requested" || (retSt && retSt !== "none");
              }).length > 0 ? (
                `${orders.filter((o) => {
                  const st = String(o.status || "").toLowerCase();
                  const retSt = String(o.returnStatus || "").toLowerCase();
                  return st === "cancelled" || st === "returned" || st === "return_requested" || (retSt && retSt !== "none");
                }).length} active requests`
              ) : (
                "View history"
              )}
            </span>
            <ChevronRight size={18} className="account-setting-chevron" />
          </div>
        </div>

        {/* Row 1: Personal Details */}
        <div
          className="account-setting-row"
          onClick={openProfileModal}
          role="button"
          tabIndex={0}
        >
          <div className="account-setting-left">
            <div className="account-setting-icon-box blue-theme">
              <span className="account-user-mini-icon">
                <span className="account-user-mini-head" />
                <span className="account-user-mini-body" />
              </span>
            </div>
            <div className="account-setting-info">
              <h4>Personal Details</h4>
              <p>Manage your name, email, phone, gender and date of birth</p>
            </div>
          </div>

          <div className="account-setting-right">
            <span className="account-setting-meta-text">
              {profile?.name || "Customer"} &nbsp;|&nbsp; {profile?.email || ""} &nbsp;|&nbsp; {profile?.phone || "6305229699"}
            </span>
            <ChevronRight size={18} className="account-setting-chevron" />
          </div>
        </div>

        {/* Row: Customer Shopping Profile & Preferences */}
        <div
          className="account-setting-row"
          onClick={() => setIsShoppingProfileModalOpen(true)}
          role="button"
          tabIndex={0}
        >
          <div className="account-setting-left">
            <div className="account-setting-icon-box blue-theme">
              <Sliders size={18} />
            </div>
            <div className="account-setting-info">
              <h4>Customer Shopping Profile</h4>
              <p>Preferences such as budget, brands, sizes, categories and styles</p>
            </div>
          </div>

          <div className="account-setting-right">
            <span className="account-setting-meta-text">
              Size {profile?.shoppingProfile?.sizes?.footwear || "UK 8"} &nbsp;|&nbsp; Budget: Up to ₹{(profile?.shoppingProfile?.budget?.max || 10000).toLocaleString("en-IN")}
            </span>
            <ChevronRight size={18} className="account-setting-chevron" />
          </div>
        </div>

        {/* Row: Darwin Shopping Memory */}
        <div
          className="account-setting-row"
          onClick={() => setIsShoppingProfileModalOpen(true)}
          role="button"
          tabIndex={0}
        >
          <div className="account-setting-left">
            <div className="account-setting-icon-box orange-theme">
              <Brain size={18} />
            </div>
            <div className="account-setting-info">
              <h4>Darwin Shopping Memory</h4>
              <p>Darwin remembers useful shopping preferences with customer control</p>
            </div>
          </div>

          <div className="account-setting-right">
            <span className="account-setting-meta-text">
              <strong style={{ color: "#16a34a", fontWeight: 700 }}>Active</strong> &nbsp;|&nbsp; Full Customer Control
            </span>
            <ChevronRight size={18} className="account-setting-chevron" />
          </div>
        </div>

        {/* Row 2: Security */}
        <div
          className="account-setting-row"
          onClick={openPasswordModal}
          role="button"
          tabIndex={0}
        >
          <div className="account-setting-left">
            <div className="account-setting-icon-box blue-theme">
              <Shield size={18} />
            </div>
            <div className="account-setting-info">
              <h4>Security</h4>
              <p>Update your password and security settings</p>
            </div>
          </div>

          <div className="account-setting-right">
            <span className="account-setting-meta-text">
              Password: <strong style={{ color: "#16a34a", fontWeight: 700 }}>Strong</strong> &nbsp;|&nbsp; 2FA Disabled
            </span>
            <ChevronRight size={18} className="account-setting-chevron" />
          </div>
        </div>

        {/* Row: Notifications */}
        <div
          className="account-setting-row"
          onClick={openNotificationSidepanel}
          role="button"
          tabIndex={0}
        >
          <div className="account-setting-left">
            <div className="account-setting-icon-box orange-theme">
              <Bell size={18} />
            </div>
            <div className="account-setting-info">
              <h4>Notifications</h4>
              <p>View your order alerts, payment updates and messages</p>
            </div>
          </div>

          <div className="account-setting-right">
            <span className="account-setting-meta-text">
              {unreadNotifCount > 0 ? (
                <strong style={{ color: "#2563eb", fontWeight: 700 }}>
                  {unreadNotifCount} unread update{unreadNotifCount === 1 ? "" : "s"}
                </strong>
              ) : (
                "All caught up"
              )}
            </span>
            <ChevronRight size={18} className="account-setting-chevron" />
          </div>
        </div>

        {/* Row: Help & Support Tickets */}
        <div
          className="account-setting-row"
          onClick={() => {
            if (openTicketsSidepanel) openTicketsSidepanel();
          }}
          role="button"
          tabIndex={0}
        >
          <div className="account-setting-left">
            <div className="account-setting-icon-box teal-theme">
              <Headphones size={18} />
            </div>
            <div className="account-setting-info">
              <h4>Help &amp; Support Tickets</h4>
              <p>Create support tickets, track issues, live chat with support &amp; get fast resolution</p>
            </div>
          </div>

          <div className="account-setting-right">
            <span className="account-setting-meta-text" style={{ color: "#0d9488", fontWeight: 600 }}>
              Help Center &amp; Tickets
            </span>
            <ChevronRight size={18} className="account-setting-chevron" />
          </div>
        </div>

        {/* Row: Gesture Navigation Toggle */}
        <div
          className="account-setting-row"
          style={{ cursor: "default" }}
        >
          <div className="account-setting-left">
            <div className="account-setting-icon-box purple-theme">
              <Compass size={18} />
            </div>
            <div className="account-setting-info">
              <h4>Gesture Navigation</h4>
              <p>Drag with mouse from screen edges to navigate back &amp; forward like mobile gestures</p>
            </div>
          </div>

          <div className="account-setting-right" onClick={(e) => e.stopPropagation()}>
            <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", userSelect: "none" }}>
              <span style={{ fontSize: "12px", color: isGestureNavEnabled ? "#16a34a" : "#64748b", fontWeight: 700 }}>
                {isGestureNavEnabled ? "Enabled" : "Disabled"}
              </span>
              <input
                type="checkbox"
                checked={isGestureNavEnabled}
                onChange={(e) => {
                  const val = e.target.checked;
                  setIsGestureNavEnabled(val);
                  setGestureNavEnabled(val);
                }}
                style={{ display: "none" }}
              />
              <div
                style={{
                  width: "44px",
                  height: "24px",
                  borderRadius: "999px",
                  background: isGestureNavEnabled ? "#2563eb" : "#cbd5e1",
                  position: "relative",
                  transition: "background 0.2s ease",
                  boxShadow: "inset 0 1px 3px rgba(0,0,0,0.15)"
                }}
              >
                <div
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    background: "#ffffff",
                    position: "absolute",
                    top: "3px",
                    left: isGestureNavEnabled ? "23px" : "3px",
                    transition: "left 0.2s ease",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.25)"
                  }}
                />
              </div>
            </label>
          </div>
        </div>

        {/* Row 3: Delivery Addresses */}
        <div
          className="account-setting-row"
          onClick={openAddressesModal}
          role="button"
          tabIndex={0}
        >
          <div className="account-setting-left">
            <div className="account-setting-icon-box purple-theme">
              <MapPin size={18} />
            </div>
            <div className="account-setting-info">
              <h4>Delivery Addresses</h4>
              <p>Manage your saved addresses</p>
            </div>
          </div>

          <div className="account-setting-right">
            <span className="account-setting-meta-text">
              {addresses.length} saved address{addresses.length === 1 ? "" : "es"}
            </span>
            <ChevronRight size={18} className="account-setting-chevron" />
          </div>
        </div>

        {/* Row 4: Payment Methods */}
        <div
          className="account-setting-row"
          onClick={openPaymentModal}
          role="button"
          tabIndex={0}
        >
          <div className="account-setting-left">
            <div className="account-setting-icon-box purple-theme">
              <CreditCard size={18} />
            </div>
            <div className="account-setting-info">
              <h4>Payment Methods</h4>
              <p>Manage your payment methods</p>
            </div>
          </div>

          <div className="account-setting-right">
            <span className="account-setting-meta-text">
              {methods.length} payment method{methods.length === 1 ? "" : "s"}
            </span>
            <ChevronRight size={18} className="account-setting-chevron" />
          </div>
        </div>

        {/* Row: Payments & Transaction History */}
        <div
          className="account-setting-row"
          onClick={openPaymentsSidepanel}
          role="button"
          tabIndex={0}
        >
          <div className="account-setting-left">
            <div className="account-setting-icon-box blue-theme">
              <CreditCard size={18} />
            </div>
            <div className="account-setting-info">
              <h4>Payments &amp; Transactions</h4>
              <p>View complete transaction logs, order payments, recharges and refunds</p>
            </div>
          </div>

          <div className="account-setting-right">
            <span className="account-setting-meta-text">View history</span>
            <ChevronRight size={18} className="account-setting-chevron" />
          </div>
        </div>

        {/* Row 5: Wallet */}
        <div
          className="account-setting-row"
          onClick={openWalletModal}
          role="button"
          tabIndex={0}
        >
          <div className="account-setting-left">
            <div className="account-setting-icon-box blue-theme">
              <Wallet size={18} />
            </div>
            <div className="account-setting-info">
              <h4>Wallet</h4>
              <p>View your wallet balance and add money</p>
            </div>
          </div>

          <div className="account-setting-right">
            <span className="account-setting-meta-text bold">
              ₹ {Number(wallet.balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <ChevronRight size={18} className="account-setting-chevron" />
          </div>
        </div>

        {/* Row 6: Account (Log Out) */}
        <div className="account-setting-row logout-row">
          <div className="account-setting-left">
            <div className="account-setting-icon-box red-theme">
              <span className="account-logout-mini-icon">
                <ArrowRight size={16} />
              </span>
            </div>
            <div className="account-setting-info">
              <h4>Account</h4>
              <p>Sign out from this account on this device</p>
            </div>
          </div>

          <div className="account-setting-right">
            <button
              type="button"
              className="account-logout-btn"
              onClick={openLogoutModal}
            >
              Log Out
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================
          MODAL: TRACK ORDER STATUS POPUP
      ========================================================== */}
      <Modal
        isOpen={Boolean(selectedTrackingOrder)}
        onClose={() => setSelectedTrackingOrder(null)}
        title={`Track Order #${selectedTrackingOrder?.orderId || (selectedTrackingOrder?._id ? selectedTrackingOrder._id.slice(-8).toUpperCase() : "ORDER")}`}
        size="large"
      >
        {selectedTrackingOrder && (
          <div className="refined-modal-content">
            <p className="refined-modal-subtitle">Live tracking status and shipping journey.</p>

            <div className="refined-tracking-stepper">
              {[
                { key: "placed", title: "Order Placed", desc: "Order details received", icon: Check },
                { key: "packed", title: "Packed", desc: "Items packed securely", icon: Package },
                { key: "shipped", title: "Shipped", desc: "Handed to courier partner", icon: Truck },
                { key: "out_for_delivery", title: "Out for Delivery", desc: "Courier out for delivery", icon: MapPin },
                { key: "delivered", title: "Delivered", desc: "Package delivered safely", icon: CheckCircle2 }
              ].map((step, idx) => {
                const currentStatus = String(selectedTrackingOrder.status || "placed").toLowerCase().replace(/-/g, "_");
                const stepKeys = ["placed", "packed", "shipped", "out_for_delivery", "delivered"];
                const currentIndex = Math.max(0, stepKeys.indexOf(currentStatus));
                const isCompleted = idx <= currentIndex;
                const isCurrent = idx === currentIndex;
                const StepIcon = step.icon;

                return (
                  <div className={`tracking-step-node ${isCompleted ? "completed" : ""} ${isCurrent ? "current" : ""}`} key={step.key}>
                    <div className="step-circle">
                      <StepIcon size={16} />
                    </div>
                    {idx < 4 && <div className={`step-connector ${idx < currentIndex ? "filled" : ""}`} />}
                    <div className="step-info">
                      <strong>{step.title}</strong>
                      <small>{step.desc}</small>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="tracking-summary-box">
              <div className="summary-col">
                <span>ORDER PLACED ON</span>
                <strong>{selectedTrackingOrder.createdAt ? formatDate(selectedTrackingOrder.createdAt) : "—"}</strong>
              </div>
              <div className="summary-col">
                <span>ESTIMATED DELIVERY</span>
                <strong>{selectedTrackingOrder.createdAt ? formatDate(new Date(new Date(selectedTrackingOrder.createdAt).getTime() + 3 * 86400000)) : "—"}</strong>
              </div>
              <div className="summary-col">
                <span>TOTAL AMOUNT</span>
                <strong>₹ {Number(selectedTrackingOrder.totalAmount || (selectedTrackingOrder.price * selectedTrackingOrder.qty) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
              </div>
            </div>

            <div className="refined-modal-footer">
              <button
                type="button"
                className="btn-refined-primary-sm"
                onClick={() => {
                  const ord = selectedTrackingOrder;
                  setSelectedTrackingOrder(null);
                  setSelectedInvoiceOrder(ord);
                }}
              >
                <FileText size={15} /> View Tax Invoice
              </button>
              <button
                type="button"
                className="btn-refined-cancel"
                onClick={() => setSelectedTrackingOrder(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Dedicated Multi-Products Order Popup */}
      <MultiProductsOrderModal
        isOpen={Boolean(selectedMultiOrder)}
        order={selectedMultiOrder}
        onClose={() => setSelectedMultiOrder(null)}
        onOpenFullDetails={(ord) => {
          setSelectedMultiOrder(null);
          setSelectedOrderDetails(ord);
        }}
      />

      {/* Wide Order Details Popup - uses shared WideOrderModal component */}
      <WideOrderModal
        order={selectedOrderDetails}
        onClose={() => setSelectedOrderDetails(null)}
        onViewInvoice={(ord) => setSelectedInvoiceOrder(ord)}
        profile={contextProfile}
      />

      {/* Invoice Sidepanel (Rendered when clicking 'View Invoice') */}
      <OrderDetailsSidepanel
        isOpen={Boolean(selectedInvoiceOrder)}
        order={selectedInvoiceOrder}
        onClose={() => setSelectedInvoiceOrder(null)}
      />

      {/* Return, Cancellation & Refund Requests Sidepanel Drawer */}
      <ReturnRequestsSidepanel
        isOpen={isRequestsDrawerOpen}
        onClose={() => setIsRequestsDrawerOpen(false)}
        orders={orders}
        onSelectOrder={(ord) => setSelectedOrderDetails(ord)}
      />

      {/* Customer Shopping Profile & Darwin Shopping Memory Modal */}
      <ShoppingProfileModal
        isOpen={isShoppingProfileModalOpen}
        onClose={() => setIsShoppingProfileModalOpen(false)}
        onProfileSaved={(updated) => {
          if (context?.profile) {
            window.dispatchEvent(new CustomEvent('customer-profile-updated', { detail: { shoppingProfile: updated } }));
          }
        }}
      />
    </div>
  );
}

export default CustomerDetails;
