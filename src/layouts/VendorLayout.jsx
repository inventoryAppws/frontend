import { useEffect, useState, useCallback, useRef } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  TrendingUp,
  Settings,
  AlertTriangle,
  LogOut,
  Bell,
  Search,
  Plus,
  ExternalLink,
  ChevronDown,
  Menu,
  X,
  RotateCcw,
  CreditCard,
  Headphones,
  ShieldCheck
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import UserAvatar from "../components/UserAvatar";
import NotificationSidepanel from "../components/NotificationSidepanel";
import VendorAiDrawer from "../components/vendor/VendorAiDrawer";
import VendorAiFab from "../components/vendor/VendorAiFab";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  dismissNotification,
  clearAllNotifications,
} from "../services/notificationService";
import { toast } from "../components/Toast";

function VendorLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Mobile sidebar toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Store status (Active / Vacation Mode)
  const [storeStatus, setStoreStatus] = useState("active");

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const knownNotifIds = useRef(new Set());

  // Atlas Vendor AI Drawer
  const [isVendorAiOpen, setIsVendorAiOpen] = useState(false);
  const [aiInitialQuery, setAiInitialQuery] = useState("");

  useEffect(() => {
    const handleOpenAi = (e) => {
      setAiInitialQuery(e.detail?.query || "");
      setIsVendorAiOpen(true);
    };
    window.addEventListener("open-vendor-ai", handleOpenAi);
    return () => window.removeEventListener("open-vendor-ai", handleOpenAi);
  }, []);

  // Profile dropdown menu
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);

  const loadNotifications = useCallback(async (isInitial = false) => {
    try {
      const data = await getNotifications(50);
      const list = Array.isArray(data?.items) ? data.items : [];
      const count = Number(data?.unreadCount || 0);

      if (!isInitial && list.length > 0) {
        list.forEach((n) => {
          if (!knownNotifIds.current.has(n._id) && !n.isRead) {
            toast.info(`🔔 ${n.title}: ${n.message}`);
          }
        });
      }

      list.forEach((n) => knownNotifIds.current.add(n._id));
      setNotifications(list);
      setUnreadNotifCount(count);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadNotifications(true);
  }, [loadNotifications]);

  // Real-time polling
  useEffect(() => {
    const interval = setInterval(() => {
      loadNotifications(false);
    }, 12000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleMarkNotifRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadNotifCount((prev) => Math.max(0, prev - 1));
    } catch {
      toast.error("Failed to update notification");
    }
  };

  const handleMarkAllNotifsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadNotifCount(0);
      toast.success("All notifications marked as read.");
    } catch {
      toast.error("Failed to mark notifications read");
    }
  };

  const handleDismissNotif = async (id) => {
    try {
      await dismissNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      loadNotifications(false);
    } catch {
      toast.error("Failed to dismiss notification");
    }
  };

  const handleClearAllNotifs = async () => {
    try {
      await clearAllNotifications();
      setNotifications([]);
      setUnreadNotifCount(0);
      toast.success("All notifications cleared.");
    } catch {
      toast.error("Failed to clear notifications");
    }
  };

  const toggleStoreStatus = () => {
    const next = storeStatus === "active" ? "vacation" : "active";
    setStoreStatus(next);
    toast.info(
      next === "active"
        ? "🟢 Storefront is now Live & accepting customer orders."
        : "🟡 Vacation Mode activated. Storefront is paused for orders."
    );
  };

  // Get current section name for topbar
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/vendor" || path === "/vendor/") return "Vendor Dashboard";
    if (path.includes("/vendor/products")) return "Inventory & Products";
    if (path.includes("/vendor/returns") || location.search.includes("tab=returned")) return "Returns & Refunds Management";
    if (path.includes("/vendor/warranty-claims") || path.includes("/vendor/claims")) return "Warranty Claims & RMA Inspection";
    if (path.includes("/vendor/payments") || path.includes("/vendor/transactions")) return "Payments & Transactions";
    if (path.includes("/vendor/orders")) return "Orders & Fulfillment";
    if (path.includes("/vendor/analytics")) return "Sales Analytics & Reports";
    if (path.includes("/vendor/settings")) return "Vendor Store Settings";
    return "Vendor Portal";
  };

  return (
    <div className="vendor-app">
      {/* SIDEBAR */}
      <aside className={`vendor-sidebar ${mobileMenuOpen ? "mobile-open" : ""}`}>
        {/* BRAND */}
        <div className="vendor-brand">
          <div className="vendor-logo" style={{ overflow: "hidden", padding: 0 }}>
            <img src="/telegram-icon.svg" alt="Vendor App" style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "inherit" }} />
          </div>

          <div className="brand-info">
            <strong>Inventory Pro</strong>
            <span className="brand-role">Vendor Merchant Portal</span>
          </div>

          <button
            type="button"
            className="mobile-close-sidebar-btn"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* STORE STATUS BADGE */}
        <div className="vendor-store-status-card">
          <div className="status-indicator-wrap">
            <span className={`status-dot ${storeStatus}`} />
            <div className="status-text-block">
              <span className="status-title">
                {storeStatus === "active" ? "Store Active" : "Vacation Mode"}
              </span>
              <span className="status-sub">
                {storeStatus === "active" ? "Accepting Orders" : "Orders Paused"}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="toggle-status-btn"
            onClick={toggleStoreStatus}
            title="Toggle store active/vacation status"
          >
            Switch
          </button>
        </div>

        {/* NAVIGATION */}
        <nav className="vendor-navigation">
          <div className="vendor-nav-label">MAIN OPERATIONS</div>

          <NavLink
            to="/vendor"
            end
            className={({ isActive }) =>
              `vendor-nav-link ${isActive ? "active" : ""}`
            }
          >
            <LayoutDashboard className="vendor-nav-icon" size={18} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/vendor/products"
            className={({ isActive }) =>
              `vendor-nav-link ${isActive ? "active" : ""}`
            }
          >
            <Package className="vendor-nav-icon" size={18} />
            <span>Products &amp; Inventory</span>
          </NavLink>

          <NavLink
            to="/vendor/orders"
            className={({ isActive }) =>
              `vendor-nav-link ${isActive && !location.pathname.includes("/vendor/returns") && !location.search.includes("tab=returned") ? "active" : ""}`
            }
          >
            <ShoppingCart className="vendor-nav-icon" size={18} />
            <span>Orders &amp; Invoices</span>
          </NavLink>

          <NavLink
            to="/vendor/returns"
            className={({ isActive }) =>
              `vendor-nav-link ${isActive || location.pathname.includes("/vendor/returns") || location.search.includes("tab=returned") ? "active" : ""}`
            }
          >
            <RotateCcw className="vendor-nav-icon" size={18} />
            <span>Returns &amp; Refunds</span>
          </NavLink>

          <NavLink
            to="/vendor/warranty-claims"
            className={({ isActive }) =>
              `vendor-nav-link ${isActive || location.pathname.includes("/vendor/warranty-claims") || location.pathname.includes("/vendor/claims") ? "active" : ""}`
            }
          >
            <ShieldCheck className="vendor-nav-icon" size={18} />
            <span>Warranty Claims (RMA)</span>
          </NavLink>

          <NavLink
            to="/vendor/payments"
            className={({ isActive }) =>
              `vendor-nav-link ${isActive || location.pathname.includes("/vendor/payments") ? "active" : ""}`
            }
          >
            <CreditCard className="vendor-nav-icon" size={18} />
            <span>Payments &amp; Payouts</span>
          </NavLink>

          <NavLink
            to="/vendor/tickets"
            className={({ isActive }) =>
              `vendor-nav-link ${isActive || location.pathname.includes("/vendor/tickets") ? "active" : ""}`
            }
          >
            <Headphones className="vendor-nav-icon" size={18} />
            <span>Support &amp; Tickets</span>
          </NavLink>

          <div className="vendor-nav-label">BUSINESS INTELLIGENCE</div>

          <NavLink
            to="/vendor/analytics"
            className={({ isActive }) =>
              `vendor-nav-link ${isActive ? "active" : ""}`
            }
          >
            <TrendingUp className="vendor-nav-icon" size={18} />
            <span>Sales Analytics</span>
          </NavLink>

          <NavLink
            to="/vendor/settings"
            className={({ isActive }) =>
              `vendor-nav-link ${isActive ? "active" : ""}`
            }
          >
            <Settings className="vendor-nav-icon" size={18} />
            <span>Store Settings</span>
          </NavLink>
        </nav>

        {/* BOTTOM USER PROFILE */}
        <div className="vendor-sidebar-bottom">
          <div className="vendor-user-card" onClick={() => navigate("/vendor/settings")}>
            <UserAvatar name={user?.name} size="medium" />
            <div className="vendor-user-details">
              <strong title={user?.name}>{user?.name || "Vendor Merchant"}</strong>
              <span title={user?.email}>{user?.email || "vendor@store.com"}</span>
            </div>
          </div>

          <button
            type="button"
            className="vendor-logout-button"
            onClick={logout}
            title="Sign out of vendor account"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MOBILE BACKDROP */}
      {mobileMenuOpen && (
        <div
          className="mobile-sidebar-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* MAIN CONTENT WRAPPER */}
      <main className="vendor-main">
        {/* TOP BAR */}
        <header className="vendor-topbar">
          <div className="vendor-topbar-left">
            <button
              type="button"
              className="mobile-menu-trigger-btn"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open Navigation Menu"
            >
              <Menu size={20} />
            </button>

            <div>
              <span className="vendor-topbar-label">VENDOR ENTERPRISE SUITE</span>
              <h1>{getPageTitle()}</h1>
            </div>
          </div>

          {/* TOPBAR RIGHT ACTIONS */}
          <div className="vendor-topbar-right">
            {/* Quick Action Button */}
            <button
              type="button"
              className="topbar-quick-add-btn"
              onClick={() => navigate("/vendor/products")}
            >
              <Plus size={16} />
              <span>Manage Inventory</span>
            </button>

            {/* Notification Bell */}
            <button
              type="button"
              className="account-notif-btn"
              onClick={() => setIsNotifOpen(true)}
              aria-label="Vendor Notifications"
              title="Notifications"
            >
              <Bell size={19} />
              {unreadNotifCount > 0 && (
                <span className="account-notif-badge">
                  {unreadNotifCount > 99 ? "99+" : unreadNotifCount}
                </span>
              )}
            </button>

            {/* User Dropdown */}
            <div className="vendor-profile-dropdown-wrap" ref={profileDropdownRef}>
              <button
                type="button"
                className="vendor-profile-trigger"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              >
                <div className="vendor-top-avatar">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "V"}
                </div>
                <div className="vendor-top-name-block">
                  <span className="vendor-top-name">{user?.name || "Merchant"}</span>
                  <span className="vendor-top-role">Vendor Admin</span>
                </div>
                <ChevronDown size={14} className="dropdown-caret" />
              </button>

              {profileDropdownOpen && (
                <div className="vendor-profile-menu">
                  <div className="menu-header">
                    <strong>{user?.name || "Vendor Merchant"}</strong>
                    <span>{user?.email}</span>
                  </div>

                  <div className="menu-items">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        navigate("/vendor/settings");
                      }}
                    >
                      <Settings size={15} />
                      <span>Store Settings</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        navigate("/vendor/analytics");
                      }}
                    >
                      <TrendingUp size={15} />
                      <span>Sales Analytics</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        navigate("/vendor/products");
                      }}
                    >
                      <Package size={15} />
                      <span>Inventory Catalog</span>
                    </button>

                    <hr className="menu-divider" />

                    <button
                      type="button"
                      className="logout-action"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        logout();
                      }}
                    >
                      <LogOut size={15} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="vendor-content">
          <Outlet />
        </div>
      </main>

      {/* Notification Sidepanel Drawer */}
      <NotificationSidepanel
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        notifications={notifications}
        unreadCount={unreadNotifCount}
        onMarkAsRead={handleMarkNotifRead}
        onMarkAllAsRead={handleMarkAllNotifsRead}
        onDismiss={handleDismissNotif}
        onClearAll={handleClearAllNotifs}
        isLoading={notifLoading}
      />

      {/* Atlas Vendor AI Wide Modal */}
      <VendorAiDrawer
        isOpen={isVendorAiOpen}
        onClose={() => {
          setIsVendorAiOpen(false);
          setAiInitialQuery("");
        }}
        initialQuery={aiInitialQuery}
      />

      {/* Atlas Floating Action Pill */}
      <VendorAiFab
        onClick={() => setIsVendorAiOpen(true)}
        isOpen={isVendorAiOpen}
      />
    </div>
  );
}

export default VendorLayout;