/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, useCallback, useRef } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShoppingBag,
  Home,
  User,
  Heart,
  ShoppingCart,
  MapPin,
  CreditCard,
  Wallet,
  Settings,
  Headphones,
  ChevronDown,
  ChevronRight,
  Pencil,
  X,
  Plus,
  Trash2,
  Phone,
  Building2,
  Smartphone,
  CheckCircle2,
  Mail,
  ShieldCheck,
  Eye,
  EyeOff,
  Calendar,
  ArrowLeft,
  Bell
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getMyProfile, updateMyProfile, changeMyPassword } from "../services/customerService";
import { getCart } from "../services/cartService";
import { getWishlist } from "../services/wishlistService";
import { getWallet, topUpWallet } from "../services/walletService";
import { getPaymentMethods, createPaymentMethod, updatePaymentMethod, deletePaymentMethod } from "../services/paymentMethodService";
import { getAddresses, createAddress, updateAddress, deleteAddress } from "../services/addressService";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  dismissNotification,
  clearAllNotifications
} from "../services/notificationService";
import NotificationSidepanel from "../components/NotificationSidepanel";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";
import CustomSelect from "../components/CustomSelect";
import { toast } from "../components/Toast";
import { formatDate } from "../utils/dateFormatter";
import { getErrorMessage } from "../utils/errorHandler";

function getBreadcrumbs(pathname) {
  const crumbs = [{ label: "Dashboard", to: "/customer" }];

  if (pathname === "/customer" || pathname === "/customer/") {
    return [{ label: "Dashboard", to: null }];
  }

  if (pathname.startsWith("/customer/orders")) {
    crumbs.push({ label: "My Orders", to: pathname === "/customer/orders" ? null : "/customer/orders" });
    if (pathname.includes("/track")) {
      crumbs.push({ label: "Track Order", to: null });
    }
  } else if (pathname.startsWith("/customer/products/")) {
    crumbs.push({ label: "Catalog", to: "/customer" });
    crumbs.push({ label: "Product Details", to: null });
  } else if (pathname.startsWith("/customer/details")) {
    crumbs.push({ label: "My Details", to: null });
  } else if (pathname.startsWith("/customer/settings")) {
    crumbs.push({ label: "Settings", to: null });
  } else if (pathname.startsWith("/customer/cart")) {
    crumbs.push({ label: "Cart", to: null });
  } else if (pathname.startsWith("/customer/wishlist")) {
    crumbs.push({ label: "Wishlist", to: null });
  } else if (pathname.startsWith("/customer/checkout")) {
    crumbs.push({ label: "Cart", to: "/customer/cart" });
    crumbs.push({ label: "Checkout", to: null });
  } else {
    const clean = pathname.replace("/customer/", "").replace(/-/g, " ");
    const formatted = clean.charAt(0).toUpperCase() + clean.slice(1);
    crumbs.push({ label: formatted, to: null });
  }

  return crumbs;
}

const emptyAddress = { fullName: "", phone: "", addressLine1: "", addressLine2: "", city: "", state: "", pincode: "", type: "Home", isDefault: false };
const emptyPayment = { type: "card", cardholderName: "", cardNumber: "", expiryMonth: "", expiryYear: "", cvv: "", upiId: "", bankName: "", accountName: "", accountNumber: "", ifsc: "", isDefault: false };
const emptyPassword = { currentPassword: "", newPassword: "", confirmPassword: "" };

function CustomerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  // Global Customer State
  const [profile, setProfile] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [wallet, setWallet] = useState({ balance: 0 });
  const [methods, setMethods] = useState([]);
  const [addresses, setAddresses] = useState([]);

  // UI State
  const [userDropdown, setUserDropdown] = useState(false);
  const [modal, setModal] = useState(""); // "profile" | "addresses" | "payment" | "wallet" | "password" | "support" | "logout"
  const [profileMode, setProfileMode] = useState("card"); // "card" | "edit"
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Sub-modal states
  const [addressMode, setAddressMode] = useState("list"); // "list" | "form"
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressToDelete, setAddressToDelete] = useState(null);
  const [addressForm, setAddressForm] = useState(emptyAddress);

  const [paymentMode, setPaymentMode] = useState("list"); // "list" | "form"
  const [paymentTab, setPaymentTab] = useState("card"); // "card" | "upi" | "netbanking"
  const [editingMethod, setEditingMethod] = useState(null);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [paymentForm, setPaymentForm] = useState(emptyPayment);

  const [topup, setTopup] = useState({ amount: "1000", paymentMethodId: "" });
  const [profileForm, setProfileForm] = useState({ name: "", email: "", phone: "", gender: "", dateOfBirth: "" });
  const [passwordForm, setPasswordForm] = useState(emptyPassword);
  const [showPassword, setShowPassword] = useState({ current: false, next: false, confirm: false });

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const knownNotifIds = useRef(new Set());

  const formatDob = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  };

  const loadNotifications = useCallback(async (isInitial = false) => {
    try {
      const data = await getNotifications(50);
      const list = Array.isArray(data?.items) ? data.items : [];
      const count = Number(data?.unreadCount || 0);

      // Detect newly arrived notifications to trigger toaster
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

  const loadGlobalData = useCallback(async () => {
    try {
      const [customer, cartData, wishlistData, walletData, savedMethods, savedAddresses] = await Promise.all([
        getMyProfile().catch(() => null),
        getCart().catch(() => ({ items: [] })),
        getWishlist().catch(() => ({ items: [] })),
        getWallet().catch(() => ({ balance: 0 })),
        getPaymentMethods().catch(() => []),
        getAddresses().catch(() => [])
      ]);

      if (customer) {
        setProfile(customer);
        setProfileForm({
          name: customer.name || "",
          email: customer.email || "",
          phone: customer.phone || "",
          gender: customer.gender || "",
          dateOfBirth: formatDob(customer.dateOfBirth)
        });
      }

      const cartItems = Array.isArray(cartData) ? cartData : cartData?.items || [];
      setCartCount(cartItems.reduce((acc, it) => acc + Number(it.qty || 1), 0));

      const wishItems = Array.isArray(wishlistData) ? wishlistData : wishlistData?.items || [];
      setWishlistCount(wishItems.length);

      setWallet(walletData || { balance: 0 });
      setMethods(Array.isArray(savedMethods) ? savedMethods : []);
      setAddresses(Array.isArray(savedAddresses) ? savedAddresses : []);

      await loadNotifications(true);
    } catch {
      // ignore
    }
  }, [loadNotifications]);

  const syncCartCount = useCallback(async () => {
    try {
      const cartData = await getCart();
      const cartItems = Array.isArray(cartData) ? cartData : cartData?.items || [];
      const total = cartItems.reduce((acc, it) => acc + Number(it.qty || 1), 0);
      setCartCount(total);
      return total;
    } catch {
      // non-blocking
    }
  }, []);

  useEffect(() => {
    loadGlobalData();
  }, [loadGlobalData, location.pathname]);

  // Real-time polling for new notifications (every 10s)
  useEffect(() => {
    const interval = setInterval(() => {
      loadNotifications(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  // Notification action handlers
  const handleMarkNotifRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      setUnreadNotifCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      toast.error("Failed to update notification");
    }
  };

  const handleMarkAllNotifsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadNotifCount(0);
      toast.success("All notifications marked as read.");
    } catch (err) {
      toast.error("Failed to mark notifications read");
    }
  };

  const handleDismissNotif = async (id) => {
    try {
      await dismissNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      loadNotifications(false);
    } catch (err) {
      toast.error("Failed to dismiss notification");
    }
  };

  const handleClearAllNotifs = async () => {
    try {
      await clearAllNotifications();
      setNotifications([]);
      setUnreadNotifCount(0);
      toast.success("All notifications cleared.");
    } catch (err) {
      toast.error("Failed to clear notifications");
    }
  };

  useEffect(() => {
    window.addEventListener("cart-updated", syncCartCount);
    return () => window.removeEventListener("cart-updated", syncCartCount);
  }, [syncCartCount]);

  const closeModal = () => {
    if (saving) return;
    setModal("");
    setProfileMode("card");
    setAddressMode("list");
    setPaymentMode("list");
    setEditingAddress(null);
    setEditingMethod(null);
  };

  // Profile Save
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const updated = await updateMyProfile(profileForm);
      setProfile(updated);
      toast.success("Profile updated successfully.");
      setProfileMode("card");
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // Password Save
  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      const msg = "New password and confirm password do not match.";
      setError(msg);
      toast.error(msg);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await changeMyPassword(passwordForm);
      setPasswordForm(emptyPassword);
      toast.success("Password changed successfully.");
      setModal("");
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // Address Handlers
  const openAddAddress = () => {
    setAddressForm(emptyAddress);
    setEditingAddress(null);
    setAddressMode("form");
  };

  const openEditAddress = (addr) => {
    setAddressForm({
      fullName: addr.fullName || "",
      phone: addr.phone || "",
      addressLine1: addr.addressLine1 || "",
      addressLine2: addr.addressLine2 || "",
      city: addr.city || "",
      state: addr.state || "",
      pincode: addr.pincode || "",
      type: addr.type || "Home",
      isDefault: Boolean(addr.isDefault)
    });
    setEditingAddress(addr);
    setAddressMode("form");
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editingAddress) {
        const updated = await updateAddress(editingAddress._id, addressForm);
        setAddresses((cur) => cur.map((item) => (item._id === updated._id ? updated : item)));
        toast.success("Address updated successfully.");
      } else {
        const created = await createAddress(addressForm);
        setAddresses((cur) => [created, ...cur]);
        toast.success("New address added successfully.");
      }
      setAddressMode("list");
      setEditingAddress(null);
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAddress = async () => {
    if (!addressToDelete) return;
    setSaving(true);
    try {
      await deleteAddress(addressToDelete._id);
      setAddresses((cur) => cur.filter((item) => item._id !== addressToDelete._id));
      setAddressToDelete(null);
      toast.success("Address deleted successfully.");
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // Payment Handlers
  const openAddPayment = () => {
    setPaymentForm(emptyPayment);
    setEditingMethod(null);
    setPaymentTab("card");
    setPaymentMode("form");
  };

  const openEditPayment = (method) => {
    if (!method) return;
    setEditingMethod(method);
    setPaymentTab(method.type || "card");
    setPaymentForm({
      type: method.type || "card",
      cardholderName: method.cardholderName || "",
      cardNumber: method.cardNumber || (method.last4 ? `•••• •••• •••• ${method.last4}` : ""),
      expiryMonth: method.expiryMonth || "",
      expiryYear: method.expiryYear || "",
      cvv: method.cvv || "",
      upiId: method.upiId || "",
      bankName: method.bankName || "",
      accountName: method.accountName || "",
      accountNumber: method.accountNumber || "",
      ifsc: method.ifsc || "",
      isDefault: Boolean(method.isDefault)
    });
    setPaymentMode("form");
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = { ...paymentForm, type: paymentTab };
      if (editingMethod) {
        const saved = await updatePaymentMethod(editingMethod._id, payload);
        setMethods((cur) => cur.map((m) => (m._id === saved._id ? saved : m)));
        toast.success("Payment method updated.");
      } else {
        const saved = await createPaymentMethod(payload);
        setMethods((cur) => [...cur, saved]);
        toast.success("Payment method added.");
      }
      setPaymentMode("list");
      setEditingMethod(null);
      setPaymentForm(emptyPayment);
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePayment = async () => {
    if (!paymentToDelete) return;
    setSaving(true);
    try {
      await deletePaymentMethod(paymentToDelete._id);
      setMethods((cur) => cur.filter((m) => m._id !== paymentToDelete._id));
      setPaymentToDelete(null);
      toast.success("Payment method removed.");
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // Wallet Top-up
  const handleAddMoney = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const result = await topUpWallet({
        amount: Number(topup.amount),
        paymentMethodId: topup.paymentMethodId || undefined
      });
      setWallet({ balance: result.balance });
      toast.success(`Added ₹${Number(topup.amount).toLocaleString("en-IN")} to your wallet.`);
      setModal("");
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // Search Submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/customer?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Active link check
  const isDashboard = location.pathname === "/customer" || location.pathname === "/customer/";
  const isOrders = location.pathname.startsWith("/customer/orders");
  const isDetails = location.pathname.startsWith("/customer/details");
  const isWishlist = location.pathname.startsWith("/customer/wishlist");
  const isCart = location.pathname.startsWith("/customer/cart");
  const isSettings = location.pathname.startsWith("/customer/settings");

  const userInitial = (profile?.name || "Customer").charAt(0).toUpperCase();

  return (
    <div className="account-dashboard-wrapper">
      {/* =========================================================
          GLOBAL UNIFIED SIDEBAR (Used on all Customer Screens)
      ========================================================== */}
      <aside className="account-sidebar">
        <div className="account-sidebar-brand" onClick={() => navigate("/customer")}>
          <div className="account-brand-icon">
            <ShoppingBag size={22} className="account-brand-svg" />
          </div>
          <span className="account-brand-text">Inventory</span>
        </div>

        <nav className="account-sidebar-nav">
          <Link to="/customer" className={`account-nav-item ${isDashboard ? "active" : ""}`}>
            <Home size={18} />
            <span>Dashboard</span>
          </Link>

          <Link to="/customer/orders" className={`account-nav-item ${isOrders ? "active" : ""}`}>
            <ShoppingBag size={18} />
            <span>My Orders</span>
          </Link>

          <button
            type="button"
            className={`account-nav-item ${modal === "profile" ? "active" : ""}`}
            onClick={() => {
              setProfileMode("card");
              setModal("profile");
            }}
          >
            <User size={18} />
            <span>My Details</span>
          </button>

          <Link to="/customer/cart" className={`account-nav-item ${isCart ? "active" : ""}`}>
            <div className="account-cart-icon-wrap">
              <ShoppingCart size={18} />
              <span className="account-cart-counter">{cartCount || 0}</span>
            </div>
            <span>Cart</span>
          </Link>

          <Link to="/customer/wishlist" className={`account-nav-item ${isWishlist ? "active" : ""}`}>
            <Heart size={18} />
            <span>Wishlist</span>
          </Link>

          <button
            type="button"
            className="account-nav-item"
            onClick={() => {
              setModal("addresses");
              setAddressMode("list");
            }}
          >
            <MapPin size={18} />
            <span>Addresses</span>
          </button>

          <button
            type="button"
            className="account-nav-item"
            onClick={() => {
              setModal("payment");
              setPaymentMode("list");
            }}
          >
            <CreditCard size={18} />
            <span>Payment Methods</span>
          </button>

          <button
            type="button"
            className="account-nav-item"
            onClick={() => setModal("wallet")}
          >
            <Wallet size={18} />
            <span>Wallet</span>
          </button>

          <Link
            to="/customer/settings"
            className={`account-nav-item ${isSettings ? "active" : ""}`}
          >
            <Settings size={18} />
            <span>Settings</span>
          </Link>
        </nav>

        {/* Sidebar Bottom Need Help Card */}
        <div className="account-sidebar-help-card">
          <div className="account-help-icon-bubble">
            <Headphones size={20} />
          </div>
          <div className="account-help-text">
            <strong>Need Help?</strong>
            <button
              type="button"
              className="account-help-link"
              onClick={() => setModal("support")}
            >
              Contact Support →
            </button>
          </div>
        </div>
      </aside>

      {/* =========================================================
          MAIN CONTAINER (Header + Content + Footer)
      ========================================================== */}
      <div className="account-main-area">
        {/* TOP HEADER BAR */}
        <header className="account-topbar">
          <nav className="account-topbar-breadcrumbs" aria-label="Breadcrumb">
            {getBreadcrumbs(location.pathname).map((crumb, idx, arr) => {
              const isLast = idx === arr.length - 1;
              return (
                <span key={idx} className="account-topbar-crumb-item">
                  {idx > 0 && <ChevronRight size={13} className="crumb-separator" />}
                  {crumb.to && !isLast ? (
                    <Link to={crumb.to} className="crumb-link">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="crumb-current">{crumb.label}</span>
                  )}
                </span>
              );
            })}
          </nav>

          <div className="account-topbar-right">
            <Link to="/customer/wishlist" className={`account-topbar-link ${isWishlist ? "active" : ""}`}>
              <Heart size={18} />
              <span>Wishlist</span>
            </Link>

            <Link to="/customer/cart" className={`account-topbar-link ${isCart ? "active" : ""}`}>
              <div className="account-cart-icon-wrap">
                <ShoppingCart size={19} />
                <span className="account-cart-counter">{cartCount || 0}</span>
              </div>
              <span>Cart</span>
            </Link>

            {/* Notification Bell Button */}
            <button
              type="button"
              className="account-notif-btn"
              onClick={() => setIsNotifOpen(true)}
              title="View Notifications"
              aria-label="Open notifications"
            >
              <Bell size={20} />
              {unreadNotifCount > 0 && (
                <span className="account-notif-badge">{unreadNotifCount > 99 ? "99+" : unreadNotifCount}</span>
              )}
            </button>

            {/* User Dropdown */}
            <div className="account-user-menu-wrap">
              <button
                type="button"
                className="account-user-menu-btn"
                onClick={() => setUserDropdown((prev) => !prev)}
              >
                <div className="account-user-avatar-sm">{userInitial}</div>
                <span className="account-user-name">{profile?.name || "Customer"}</span>
                <ChevronDown size={14} className="account-chevron-icon" />
              </button>

              {userDropdown && (
                <div className="account-dropdown-menu" onMouseLeave={() => setUserDropdown(false)}>
                  <div className="account-dropdown-header">
                    <strong>{profile?.name}</strong>
                    <span>{profile?.email}</span>
                  </div>
                  <button
                    type="button"
                    className="account-dropdown-item"
                    onClick={() => {
                      setUserDropdown(false);
                      setProfileMode("card");
                      setModal("profile");
                    }}
                  >
                    <User size={15} /> My Details
                  </button>
                  <button
                    type="button"
                    className="account-dropdown-item"
                    onClick={() => {
                      setUserDropdown(false);
                      navigate("/customer/settings");
                    }}
                  >
                    <Settings size={15} /> Settings
                  </button>
                  <button
                    type="button"
                    className="account-dropdown-item"
                    onClick={() => {
                      setUserDropdown(false);
                      navigate("/customer/orders");
                    }}
                  >
                    <ShoppingBag size={15} /> My Orders
                  </button>
                  <button
                    type="button"
                    className="account-dropdown-item danger"
                    onClick={() => {
                      setUserDropdown(false);
                      setModal("logout");
                    }}
                  >
                    <X size={15} /> Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CHILD ROUTE CONTENT */}
        <main className="account-page-content">
          <Outlet
            context={{
              profile,
              wallet,
              methods,
              addresses,
              cartCount,
              wishlistCount,
              openProfileModal: () => {
                setProfileMode("card");
                setModal("profile");
              },
              openAddressesModal: () => {
                setModal("addresses");
                setAddressMode("list");
              },
              openPaymentModal: () => {
                setModal("payment");
                setPaymentMode("list");
              },
              openWalletModal: () => setModal("wallet"),
              openPasswordModal: () => setModal("password"),
              openSupportModal: () => setModal("support"),
              openLogoutModal: () => setModal("logout"),
              openNotificationSidepanel: () => setIsNotifOpen(true),
              unreadNotifCount,
              notifications,
              reloadAccount: loadGlobalData,
              reloadCart: syncCartCount,
              setCartCount
            }}
          />
        </main>

        {/* FOOTER */}
        <footer className="account-page-footer">
          <div className="account-footer-left">
            <div className="account-footer-logo">
              <ShoppingBag size={18} className="footer-bag-icon" />
              <span>Inventory</span>
            </div>
            <span className="account-copyright">
              © 2026 Inventory. All rights reserved.
            </span>
          </div>

          <div className="account-footer-right">
            <div className="account-footer-links">
              <a href="#privacy">Privacy Policy</a>
              <span>|</span>
              <a href="#terms">Terms of Service</a>
              <span>|</span>
              <a href="#contact">Contact Us</a>
            </div>

            <div className="account-social-icons">
              <a href="#fb" aria-label="Facebook" className="social-link">
                <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.7 5H18V0h-3.8C10.5 0 9 1.5 9 4.6V8z"/></svg>
              </a>
              <a href="#twitter" aria-label="Twitter" className="social-link">
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="#insta" aria-label="Instagram" className="social-link">
                <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="#linkedin" aria-label="LinkedIn" className="social-link">
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>
            </div>
          </div>
        </footer>
      </div>

      {/* =========================================================
          GLOBAL MODAL: MY DETAILS (USER CARD & EDIT)
      ========================================================== */}
      <Modal
        isOpen={modal === "profile"}
        onClose={closeModal}
        title={profileMode === "card" ? "My Details" : "Edit Personal Details"}
        size="medium"
      >
        {profileMode === "card" ? (
          <div className="user-details-card-wrap">
            {/* HERO / AVATAR BANNER */}
            <div className="user-card-hero-banner" />

            <div className="user-card-profile-header">
              <div className="user-card-avatar-wrap">
                <div className="user-card-avatar-inner">{userInitial}</div>
                <span className="user-card-status-dot" title="Active" />
              </div>
              <div className="user-card-title-meta">
                <div className="user-card-name-row">
                  <h3 className="user-card-full-name">{profile?.name || "Customer"}</h3>
                  <span className="user-card-verified-badge" title="Verified Customer">
                    <ShieldCheck size={13} /> Verified
                  </span>
                </div>
                <p className="user-card-email-sub">{profile?.email || "No email"}</p>
                <div className="user-card-tags-row">
                  <span className="user-card-pill role">Customer Member</span>
                  {profile?.createdAt && (
                    <span className="user-card-pill joined">
                      Joined {formatDate(profile.createdAt)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* QUICK STATS STRIP */}
            <div className="user-card-stats-strip">
              <div className="user-card-stat-item">
                <span className="user-card-stat-label">Wallet Balance</span>
                <span className="user-card-stat-val highlight">
                  ₹{Number(wallet.balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="user-card-stat-sep" />
              <div className="user-card-stat-item">
                <span className="user-card-stat-label">Saved Addresses</span>
                <span className="user-card-stat-val">{addresses.length}</span>
              </div>
              <div className="user-card-stat-sep" />
              <div className="user-card-stat-item">
                <span className="user-card-stat-label">Payment Methods</span>
                <span className="user-card-stat-val">{methods.length}</span>
              </div>
            </div>

            {/* INFORMATION FIELDS GRID */}
            <div className="user-card-info-section">
              <h4 className="user-card-section-heading">Personal Information</h4>
              <div className="user-card-fields-grid">
                <div className="user-card-field-box">
                  <div className="user-card-field-icon">
                    <User size={15} />
                  </div>
                  <div className="user-card-field-content">
                    <span className="user-card-field-label">Full Name</span>
                    <strong className="user-card-field-val">{profile?.name || "—"}</strong>
                  </div>
                </div>

                <div className="user-card-field-box">
                  <div className="user-card-field-icon">
                    <Mail size={15} />
                  </div>
                  <div className="user-card-field-content">
                    <span className="user-card-field-label">Email Address</span>
                    <strong className="user-card-field-val">{profile?.email || "—"}</strong>
                  </div>
                </div>

                <div className="user-card-field-box">
                  <div className="user-card-field-icon">
                    <Phone size={15} />
                  </div>
                  <div className="user-card-field-content">
                    <span className="user-card-field-label">Phone Number</span>
                    <strong className="user-card-field-val">{profile?.phone || "—"}</strong>
                  </div>
                </div>

                <div className="user-card-field-box">
                  <div className="user-card-field-icon">
                    <CheckCircle2 size={15} />
                  </div>
                  <div className="user-card-field-content">
                    <span className="user-card-field-label">Gender</span>
                    <strong className="user-card-field-val">{profile?.gender || "Not specified"}</strong>
                  </div>
                </div>

                <div className="user-card-field-box span-full">
                  <div className="user-card-field-icon">
                    <Calendar size={15} />
                  </div>
                  <div className="user-card-field-content">
                    <span className="user-card-field-label">Date of Birth</span>
                    <strong className="user-card-field-val">
                      {profile?.dateOfBirth ? formatDate(profile.dateOfBirth) : "Not provided"}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD FOOTER WITH EDIT BUTTON */}
            <div className="user-card-footer">
              <button
                type="button"
                className="btn-refined-cancel"
                onClick={closeModal}
              >
                Close
              </button>
              <button
                type="button"
                className="btn-user-card-edit"
                onClick={() => {
                  setProfileForm({
                    name: profile?.name || "",
                    email: profile?.email || "",
                    phone: profile?.phone || "",
                    gender: profile?.gender || "Female",
                    dateOfBirth: formatDob(profile?.dateOfBirth)
                  });
                  setProfileMode("edit");
                }}
              >
                <Pencil size={14} />
                <span>Edit Details</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="refined-modal-content">
            <div className="user-edit-header-bar">
              <button
                type="button"
                className="user-edit-back-btn"
                onClick={() => setProfileMode("card")}
              >
                <ArrowLeft size={14} /> Back to Details Card
              </button>
            </div>
            <p className="refined-modal-subtitle">Update your profile information below.</p>
            <form className="refined-form" onSubmit={handleSaveProfile}>
              <div className="refined-form-grid-2">
                <div className="refined-form-group">
                  <label>Full Name <span className="req-star">*</span></label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    placeholder="Your full name"
                  />
                </div>
                <div className="refined-form-group">
                  <label>Email <span className="req-star">*</span></label>
                  <input
                    type="email"
                    required
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    placeholder="name@domain.com"
                  />
                </div>
                <div className="refined-form-group">
                  <label>Phone <span className="req-star">*</span></label>
                  <input
                    type="tel"
                    required
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="10-digit mobile number"
                  />
                </div>
                <div className="refined-form-group">
                  <label>Gender <span className="req-star">*</span></label>
                  <select
                    value={profileForm.gender || "Female"}
                    onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
                <div className="refined-form-group span-2">
                  <label>Date of Birth <span className="req-star">*</span></label>
                  <input
                    type="date"
                    required
                    value={profileForm.dateOfBirth}
                    onChange={(e) => setProfileForm({ ...profileForm, dateOfBirth: e.target.value })}
                  />
                </div>
              </div>
              {error && <div className="checkout-error">{error}</div>}
              <div className="refined-modal-footer">
                <button
                  type="button"
                  className="btn-refined-cancel"
                  onClick={() => setProfileMode("card")}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-refined-submit"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* =========================================================
          GLOBAL MODAL: DELIVERY ADDRESSES POPUP
      ========================================================== */}
      <Modal isOpen={modal === "addresses"} onClose={closeModal} title="Delivery Addresses" size={addressMode === "form" ? "medium" : "large"}>
        <div className="refined-modal-content">
          <p className="refined-modal-subtitle">
            {addressMode === "list"
              ? "Manage your saved delivery addresses or add a new one for quick checkout."
              : editingAddress ? "Update your existing delivery address." : "Add a new delivery address for shipping."}
          </p>

          {addressMode === "list" ? (
            <div className="refined-address-list-wrap">
              <div className="refined-address-top-action">
                <button type="button" className="btn-refined-primary-sm" onClick={openAddAddress}>
                  <Plus size={16} /> Add New Address
                </button>
              </div>

              {addresses.length === 0 ? (
                <div className="refined-empty-modal-box">
                  <MapPin size={40} className="empty-box-icon" />
                  <h4>No saved addresses yet</h4>
                  <p>Add a delivery address to make checkout faster and seamless.</p>
                  <button type="button" className="btn-refined-primary-sm" onClick={openAddAddress}>
                    <Plus size={16} /> Add First Address
                  </button>
                </div>
              ) : (
                <div className="refined-address-cards-grid">
                  {addresses.map((addr, idx) => (
                    <div className="refined-address-card" key={addr._id}>
                      <div className="refined-addr-header">
                        <span className="refined-addr-type-pill">{addr.type === "Work" ? "💼 WORK" : addr.type === "Other" ? "📍 OTHER" : "🏠 HOME"}</span>
                        {idx === 0 && <span className="refined-addr-default-pill">DEFAULT</span>}
                      </div>
                      <h4 className="refined-addr-name">{addr.fullName}</h4>
                      <p className="refined-addr-phone"><Phone size={13} /> {addr.phone}</p>
                      <p className="refined-addr-lines">{addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ""}</p>
                      <p className="refined-addr-city">{addr.city}, {addr.state} - <strong>{addr.pincode}</strong></p>
                      <div className="refined-addr-actions">
                        <button type="button" className="refined-addr-action-btn" onClick={() => openEditAddress(addr)}><Pencil size={14} /> Edit</button>
                        <button type="button" className="refined-addr-action-btn danger" onClick={() => setAddressToDelete(addr)}><Trash2 size={14} /> Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="refined-modal-footer">
                <button type="button" className="btn-refined-cancel" onClick={closeModal}>Close</button>
              </div>
            </div>
          ) : (
            <form className="refined-form" onSubmit={handleSaveAddress}>
              <div className="refined-form-grid-2">
                <div className="refined-form-group">
                  <label>Full Name <span className="req-star">*</span></label>
                  <input type="text" required value={addressForm.fullName} onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })} placeholder="Recipient's Name" />
                </div>
                <div className="refined-form-group">
                  <label>Mobile Number <span className="req-star">*</span></label>
                  <input type="tel" required maxLength={10} value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} placeholder="10-digit mobile" />
                </div>
                <div className="refined-form-group span-2">
                  <label>Address Line 1 <span className="req-star">*</span></label>
                  <input type="text" required value={addressForm.addressLine1} onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })} placeholder="Flat / House no. / Street" />
                </div>
                <div className="refined-form-group span-2">
                  <label>Address Line 2 (Optional)</label>
                  <input type="text" value={addressForm.addressLine2} onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })} placeholder="Area, Landmark" />
                </div>
                <div className="refined-form-group">
                  <label>City <span className="req-star">*</span></label>
                  <input type="text" required value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} placeholder="City" />
                </div>
                <div className="refined-form-group">
                  <label>State <span className="req-star">*</span></label>
                  <input type="text" required value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} placeholder="State" />
                </div>
                <div className="refined-form-group">
                  <label>Pincode <span className="req-star">*</span></label>
                  <input type="text" required maxLength={6} value={addressForm.pincode} onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })} placeholder="6-digit pincode" />
                </div>
                <div className="refined-form-group">
                  <label>Address Type</label>
                  <div className="refined-type-pill-selector">
                    {["Home", "Work", "Other"].map((t) => (
                      <button type="button" key={t} className={`type-selector-pill ${addressForm.type === t ? "active" : ""}`} onClick={() => setAddressForm({ ...addressForm, type: t })}>
                        {t === "Home" ? "🏠 Home" : t === "Work" ? "💼 Work" : "📍 Other"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="refined-modal-footer">
                <button type="button" className="btn-refined-cancel" onClick={() => setAddressMode("list")} disabled={saving}>Cancel</button>
                <button type="submit" className="btn-refined-submit" disabled={saving}>{saving ? "Saving..." : editingAddress ? "Update Address" : "Save Address"}</button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {/* =========================================================
          GLOBAL MODAL: PAYMENT METHODS POPUP
      ========================================================== */}
      <Modal
        isOpen={modal === "payment"}
        onClose={closeModal}
        title={paymentMode === "list" ? "Payment Methods" : editingMethod ? "Edit Payment Method" : "Add Payment Method"}
        size="large"
      >
        <div className="refined-modal-content">
          <p className="refined-modal-subtitle">
            {paymentMode === "list"
              ? "Manage your saved credit/debit cards, UPI IDs, and net banking options."
              : editingMethod
              ? "Update your payment method details."
              : "Add a new secure payment method for instant checkout."}
          </p>

          {paymentMode === "list" ? (
            <div className="refined-payment-list-wrap">
              <div className="refined-address-top-action">
                <button type="button" className="btn-refined-primary-sm" onClick={openAddPayment}>
                  <Plus size={16} /> Add Payment Method
                </button>
              </div>

              {methods.length === 0 ? (
                <div className="refined-empty-modal-box">
                  <CreditCard size={40} className="empty-box-icon" />
                  <h4>No saved payment methods</h4>
                  <p>Save your card or UPI ID for seamless, 1-click checkout transactions.</p>
                  <button type="button" className="btn-refined-primary-sm" onClick={openAddPayment}>
                    <Plus size={16} /> Add First Payment Method
                  </button>
                </div>
              ) : (
                <div className="refined-payment-cards-grid">
                  {methods.map((m) => (
                    <div className="refined-payment-card-item" key={m._id}>
                      {m.type === "card" ? (
                        <div className="visual-card-container">
                          <div className="visual-card-top">
                            <span className="visual-card-chip" />
                            <span className="visual-card-brand">{m.cardBrand || "VISA"}</span>
                          </div>
                          <div className="visual-card-number">•••• •••• •••• {m.last4 || (m.cardNumber ? m.cardNumber.slice(-4) : "4242")}</div>
                          <div className="visual-card-bottom">
                            <div><small>CARDHOLDER</small><strong>{m.cardholderName || profile?.name || "CARD HOLDER"}</strong></div>
                            <div><small>EXPIRES</small><strong>{m.expiryMonth || "12"}/{m.expiryYear || "28"}</strong></div>
                          </div>
                          <div className="visual-card-actions">
                            <button type="button" className="visual-card-edit-btn" onClick={() => openEditPayment(m)} title="Edit card"><Pencil size={13} /> Edit</button>
                            <button type="button" className="visual-card-delete-btn" onClick={() => setPaymentToDelete(m)} title="Remove card"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      ) : m.type === "upi" ? (
                        <div className="visual-upi-container">
                          <div className="visual-upi-header">
                            <div className="visual-upi-badge"><Smartphone size={16} /><span>UPI</span></div>
                            <span className="visual-upi-verified">✓ Verified</span>
                          </div>
                          <div className="visual-upi-id">{m.upiId}</div>
                          <div className="visual-upi-footer">
                            <span>Instant UPI Payment</span>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button type="button" className="refined-addr-action-btn" onClick={() => openEditPayment(m)}><Pencil size={13} /> Edit</button>
                              <button type="button" className="refined-addr-action-btn danger" onClick={() => setPaymentToDelete(m)}><Trash2 size={13} /> Remove</button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="visual-upi-container netbanking-box">
                          <div className="visual-upi-header">
                            <div className="visual-upi-badge netbank-badge"><Building2 size={16} /><span>{m.bankName || "Net Banking"}</span></div>
                          </div>
                          <div className="visual-upi-id">{m.accountName || "Bank Account"}</div>
                          <small className="netbank-ac-num">A/C: •••• {m.accountNumber ? m.accountNumber.slice(-4) : "9988"}</small>
                          <div className="visual-upi-footer">
                            <span>Direct Bank Transfer</span>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button type="button" className="refined-addr-action-btn" onClick={() => openEditPayment(m)}><Pencil size={13} /> Edit</button>
                              <button type="button" className="refined-addr-action-btn danger" onClick={() => setPaymentToDelete(m)}><Trash2 size={13} /> Remove</button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="refined-modal-footer">
                <button type="button" className="btn-refined-cancel" onClick={closeModal}>Close</button>
              </div>
            </div>
          ) : (
            <div className="refined-payment-add-shell">
              <div className="refined-payment-tab-row">
                <button type="button" className={`refined-tab-btn ${paymentTab === "card" ? "active" : ""}`} onClick={() => setPaymentTab("card")}><CreditCard size={16} /><span>Credit / Debit Card</span></button>
                <button type="button" className={`refined-tab-btn ${paymentTab === "upi" ? "active" : ""}`} onClick={() => setPaymentTab("upi")}><Smartphone size={16} /><span>UPI ID</span></button>
                <button type="button" className={`refined-tab-btn ${paymentTab === "netbanking" ? "active" : ""}`} onClick={() => setPaymentTab("netbanking")}><Building2 size={16} /><span>Net Banking</span></button>
              </div>

              <form className="refined-form" onSubmit={handleSavePayment}>
                {paymentTab === "card" && (
                  <div className="refined-form-grid-2">
                    <div className="refined-form-group span-2">
                      <label>Cardholder Name <span className="req-star">*</span></label>
                      <input type="text" required value={paymentForm.cardholderName} onChange={(e) => setPaymentForm({ ...paymentForm, cardholderName: e.target.value })} placeholder="Name on card" />
                    </div>
                    <div className="refined-form-group span-2">
                      <label>Card Number <span className="req-star">*</span></label>
                      <input type="text" required maxLength={19} value={paymentForm.cardNumber} onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 16);
                        setPaymentForm({ ...paymentForm, cardNumber: val.replace(/(.{4})/g, "$1 ").trim() });
                      }} placeholder="1234 5678 9012 3456" />
                    </div>
                    <div className="refined-form-group">
                      <label>Expiry Month (MM) <span className="req-star">*</span></label>
                      <input type="text" required maxLength={2} value={paymentForm.expiryMonth} onChange={(e) => setPaymentForm({ ...paymentForm, expiryMonth: e.target.value })} placeholder="08" />
                    </div>
                    <div className="refined-form-group">
                      <label>Expiry Year (YY) <span className="req-star">*</span></label>
                      <input type="text" required maxLength={2} value={paymentForm.expiryYear} onChange={(e) => setPaymentForm({ ...paymentForm, expiryYear: e.target.value })} placeholder="28" />
                    </div>
                    <div className="refined-form-group">
                      <label>CVV / CVC <span className="req-star">*</span></label>
                      <input type="password" required maxLength={4} value={paymentForm.cvv} onChange={(e) => setPaymentForm({ ...paymentForm, cvv: e.target.value })} placeholder="•••" />
                    </div>
                    <div className="refined-form-group">
                      <label className="checkbox-flex">
                        <input type="checkbox" checked={paymentForm.isDefault} onChange={(e) => setPaymentForm({ ...paymentForm, isDefault: e.target.checked })} />
                        <span>Save as primary default card</span>
                      </label>
                    </div>
                  </div>
                )}

                {paymentTab === "upi" && (
                  <div className="refined-form-grid-2">
                    <div className="refined-form-group span-2">
                      <label>UPI ID <span className="req-star">*</span></label>
                      <input type="text" required value={paymentForm.upiId} onChange={(e) => setPaymentForm({ ...paymentForm, upiId: e.target.value })} placeholder="username@okhdfcbank or 9876543210@upi" />
                    </div>
                    <div className="refined-form-group span-2">
                      <label>Quick Suggestions</label>
                      <div className="quick-upi-chips">
                        {["@okhdfcbank", "@okaxis", "@oksbi", "@paytm", "@ybl"].map((handle) => (
                          <button type="button" key={handle} className="upi-chip-btn" onClick={() => {
                            const base = paymentForm.upiId.split("@")[0] || "user";
                            setPaymentForm({ ...paymentForm, upiId: `${base}${handle}` });
                          }}>{handle}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {paymentTab === "netbanking" && (
                  <div className="refined-form-grid-2">
                    <div className="refined-form-group span-2">
                      <label>Select Bank <span className="req-star">*</span></label>
                      <CustomSelect
                        value={paymentForm.bankName}
                        onChange={(val) => setPaymentForm({ ...paymentForm, bankName: val })}
                        options={[
                          "HDFC Bank",
                          "State Bank of India",
                          "ICICI Bank",
                          "Axis Bank",
                          "Kotak Mahindra Bank",
                          "Punjab National Bank",
                          "Bank of Baroda",
                          "Canara Bank",
                          "Other Bank"
                        ]}
                        placeholder="Choose bank"
                      />
                    </div>
                    <div className="refined-form-group">
                      <label>Account Holder Name <span className="req-star">*</span></label>
                      <input type="text" required value={paymentForm.accountName} onChange={(e) => setPaymentForm({ ...paymentForm, accountName: e.target.value })} placeholder="Account name" />
                    </div>
                    <div className="refined-form-group">
                      <label>Account Number <span className="req-star">*</span></label>
                      <input type="text" required value={paymentForm.accountNumber} onChange={(e) => setPaymentForm({ ...paymentForm, accountNumber: e.target.value })} placeholder="Bank A/C number" />
                    </div>
                    <div className="refined-form-group span-2">
                      <label>IFSC Code <span className="req-star">*</span></label>
                      <input type="text" required maxLength={11} value={paymentForm.ifsc} onChange={(e) => setPaymentForm({ ...paymentForm, ifsc: e.target.value.toUpperCase() })} placeholder="e.g. HDFC0001234" />
                    </div>
                  </div>
                )}

                <div className="refined-modal-footer">
                  <button type="button" className="btn-refined-cancel" onClick={() => { setPaymentMode("list"); setEditingMethod(null); }} disabled={saving}>Cancel</button>
                  <button type="submit" className="btn-refined-submit" disabled={saving}>{saving ? "Saving..." : editingMethod ? "Update Payment Method" : "Save Payment Method"}</button>
                </div>
              </form>
            </div>
          )}
        </div>
      </Modal>

      {/* =========================================================
          GLOBAL MODAL: WALLET TOP-UP
      ========================================================== */}
      <Modal isOpen={modal === "wallet"} onClose={closeModal} title="Add Money to Wallet">
        <div className="refined-modal-content">
          <p className="refined-modal-subtitle">Add instant demo funds for faster 1-click checkout.</p>
          <div className="refined-wallet-highlight-box">
            <span>CURRENT AVAILABLE BALANCE</span>
            <strong>₹ {Number(wallet.balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          </div>
          <form className="refined-form" onSubmit={handleAddMoney}>
            <div className="refined-form-group">
              <label>Enter Amount (₹)</label>
              <div className="amount-input-wrap">
                <span className="amount-currency-symbol">₹</span>
                <input type="number" min="1" max="50000" required value={topup.amount} onChange={(e) => setTopup({ ...topup, amount: e.target.value })} placeholder="1000" />
              </div>
            </div>
            <div className="refined-form-group">
              <label>Quick Preset Amounts</label>
              <div className="quick-amount-chips">
                {[500, 1000, 2000, 5000].map((amt) => (
                  <button type="button" key={amt} className={`amount-chip-btn ${String(topup.amount) === String(amt) ? "active" : ""}`} onClick={() => setTopup({ ...topup, amount: String(amt) })}>
                    + ₹{amt.toLocaleString("en-IN")}
                  </button>
                ))}
              </div>
            </div>
            <div className="refined-form-group">
              <label>Pay Using</label>
              <CustomSelect
                value={topup.paymentMethodId}
                onChange={(val) => setTopup({ ...topup, paymentMethodId: val })}
                options={[
                  { value: "", label: "Demo Instant Net Banking" },
                  ...methods.map((m) => ({
                    value: m._id,
                    label: m.type === "card"
                      ? `Card •••• ${m.last4 || "4242"} (${m.cardBrand || "VISA"})`
                      : m.type === "upi"
                      ? `UPI: ${m.upiId}`
                      : `${m.bankName || "Net Banking"} (${m.accountName || "Account"})`
                  }))
                ]}
                placeholder="Select payment method"
              />
            </div>
            <div className="refined-modal-footer">
              <button type="button" className="btn-refined-cancel" onClick={closeModal} disabled={saving}>Cancel</button>
              <button type="submit" className="btn-refined-submit" disabled={saving}>{saving ? "Adding..." : "Add Money"}</button>
            </div>
          </form>
        </div>
      </Modal>

      {/* =========================================================
          GLOBAL MODAL: CHANGE PASSWORD
      ========================================================== */}
      <Modal isOpen={modal === "password"} onClose={closeModal} title="Security & Password">
        <div className="refined-modal-content">
          <p className="refined-modal-subtitle">Update your password to keep your account safe and secure.</p>
          <form className="refined-form" onSubmit={handleSavePassword}>
            <div className="refined-form-group">
              <label>Current Password <span className="req-star">*</span></label>
              <div className="password-input-wrap">
                <input type={showPassword.current ? "text" : "password"} required value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} placeholder="Current password" />
                <button type="button" className="password-eye-btn" onClick={() => setShowPassword((p) => ({ ...p, current: !p.current }))}>
                  {showPassword.current ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="refined-form-group">
              <label>New Password <span className="req-star">*</span></label>
              <div className="password-input-wrap">
                <input type={showPassword.next ? "text" : "password"} required minLength={6} value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} placeholder="New password" />
                <button type="button" className="password-eye-btn" onClick={() => setShowPassword((p) => ({ ...p, next: !p.next }))}>
                  {showPassword.next ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="refined-form-group">
              <label>Confirm New Password <span className="req-star">*</span></label>
              <div className="password-input-wrap">
                <input type={showPassword.confirm ? "text" : "password"} required value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} placeholder="Confirm password" />
                <button type="button" className="password-eye-btn" onClick={() => setShowPassword((p) => ({ ...p, confirm: !p.confirm }))}>
                  {showPassword.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="security-guidelines-box">
              <ShieldCheck size={16} className="security-icon" />
              <span>Use at least 6 characters with a combination of letters, numbers &amp; symbols.</span>
            </div>
            {error && <div className="checkout-error">{error}</div>}
            <div className="refined-modal-footer">
              <button type="button" className="btn-refined-cancel" onClick={closeModal} disabled={saving}>Cancel</button>
              <button type="submit" className="btn-refined-submit" disabled={saving}>{saving ? "Updating..." : "Update Password"}</button>
            </div>
          </form>
        </div>
      </Modal>

      {/* =========================================================
          GLOBAL MODAL: SUPPORT
      ========================================================== */}
      <Modal isOpen={modal === "support"} onClose={closeModal} title="Customer Support">
        <div className="refined-modal-content">
          <p className="refined-modal-subtitle">We are here to help you 24x7 with your orders and account.</p>
          <div className="support-channels-list">
            <div className="support-channel-item">
              <Mail size={20} className="channel-icon" />
              <div>
                <strong>Email Support</strong>
                <p>support@inventory.com (Response within 2 hours)</p>
              </div>
            </div>
            <div className="support-channel-item">
              <Phone size={20} className="channel-icon" />
              <div>
                <strong>Toll-Free Helpline</strong>
                <p>1800-123-4567 (9:00 AM - 9:00 PM IST)</p>
              </div>
            </div>
          </div>
          <div className="refined-modal-footer">
            <button type="button" className="btn-refined-primary-sm" onClick={closeModal}>Got It</button>
          </div>
        </div>
      </Modal>

      {/* CONFIRMATION MODALS */}
      <ConfirmModal
        isOpen={Boolean(paymentToDelete)}
        title="Remove Payment Method?"
        message="This payment method will be removed from your account. You can re-add it anytime."
        confirmText="Remove Method"
        onConfirm={handleRemovePayment}
        onCancel={() => !saving && setPaymentToDelete(null)}
        loading={saving}
      />

      <ConfirmModal
        isOpen={Boolean(addressToDelete)}
        title="Delete Address?"
        message={`Are you sure you want to delete this address (${addressToDelete?.addressLine1 || ""})?`}
        confirmText="Delete Address"
        onConfirm={handleRemoveAddress}
        onCancel={() => !saving && setAddressToDelete(null)}
        loading={saving}
      />

      <ConfirmModal
        isOpen={modal === "logout"}
        title="Sign Out?"
        message="Are you sure you want to sign out from your account on this device?"
        confirmText="Log Out"
        onConfirm={logout}
        onCancel={closeModal}
      />

      {/* NOTIFICATIONS SIDEPANEL */}
      <NotificationSidepanel
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        notifications={notifications}
        unreadCount={unreadNotifCount}
        onMarkAsRead={handleMarkNotifRead}
        onMarkAllAsRead={handleMarkAllNotifsRead}
        onDismiss={handleDismissNotif}
        onClearAll={handleClearAllNotifs}
        loading={notifLoading}
      />
    </div>
  );
}

export default CustomerLayout;