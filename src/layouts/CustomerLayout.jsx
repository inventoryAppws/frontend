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
  ChevronLeft,
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
  Bell,
  Search,
  Maximize2,
  Minimize2,
  Tag,
  Store,
  Mic,
  Camera,
  Repeat,
  Users,
  Sparkles,
  Gift
} from "lucide-react";
import VoiceSearchModal from "../components/voice/VoiceSearchModal";
import VisualSearchModal from "../components/visual-search/VisualSearchModal";
import { useAuth } from "../context/AuthContext";
import { getMyProfile, updateMyProfile, changeMyPassword } from "../services/customerService";
import { getCart } from "../services/cartService";
import { getWishlist } from "../services/wishlistService";
import { getWallet, topUpWallet } from "../services/walletService";
import { getPaymentMethods, createPaymentMethod, updatePaymentMethod, deletePaymentMethod } from "../services/paymentMethodService";
import { getAddresses, createAddress, updateAddress, deleteAddress } from "../services/addressService";
import { getProductSearchMeta } from "../services/productService";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  dismissNotification,
  clearAllNotifications
} from "../services/notificationService";
import NotificationSidepanel from "../components/NotificationSidepanel";
import PaymentsSidepanel from "../components/PaymentsSidepanel";
import CustomerTicketsSidepanel from "../components/CustomerTicketsSidepanel";
import CustomerAccountSidepanel from "../components/CustomerAccountSidepanel";
import CompareFloatingBar from "../components/CompareFloatingBar";
import NavbarAddressDropdown from "../components/location/NavbarAddressDropdown";
import AddressMapModal from "../components/location/AddressMapModal";
import LocationSettingsModal from "../components/location/LocationSettingsModal";
import DarwinFab from "../components/darwin/DarwinFab";
import DarwinChatDrawer from "../components/darwin/DarwinChatDrawer";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";
import CustomSelect from "../components/CustomSelect";
import { toast } from "../components/Toast";
import { formatDate } from "../utils/dateFormatter";
import { getErrorMessage } from "../utils/errorHandler";

function getBreadcrumbs(pathname, customTitle = null) {
  const crumbs = [{ label: "Dashboard", to: "/customer" }];

  if (pathname === "/customer" || pathname === "/customer/") {
    return [{ label: "Dashboard", to: null }];
  }

  if (pathname.startsWith("/customer/orders")) {
    crumbs.push({ label: "My Orders", to: pathname === "/customer/orders" ? null : "/customer/orders" });
    if (pathname.includes("/track")) {
      crumbs.push({ label: "Track Order", to: null });
    }
  } else if (
    pathname.startsWith("/customer/products/") ||
    pathname.startsWith("/customer/product/")
  ) {
    crumbs.push({ label: "Catalog", to: "/customer" });
    crumbs.push({ label: customTitle || "Product Details", to: null });
  } else if (pathname.startsWith("/customer/details")) {
    crumbs.push({ label: "My Details", to: null });
  } else if (pathname.startsWith("/customer/settings")) {
    crumbs.push({ label: "Settings", to: null });
  } else if (pathname.startsWith("/customer/cart")) {
    crumbs.push({ label: "Cart", to: null });
  } else if (pathname.startsWith("/customer/wishlist")) {
    crumbs.push({ label: "Wishlist", to: null });
  } else if (pathname.startsWith("/customer/recommended")) {
    crumbs.push({ label: "Recommended for You", to: null });
  } else if (pathname.startsWith("/customer/checkout")) {
    crumbs.push({ label: "Cart", to: "/customer/cart" });
    crumbs.push({ label: "Checkout", to: null });
  } else {
    // Strip customer prefix and any 24-char hex MongoDB ObjectIds
    const segments = pathname
      .replace(/^\/customer\/?/, "")
      .split("/")
      .filter((s) => s && !/^[0-9a-fA-F]{24}$/.test(s));

    if (segments.length === 0) {
      crumbs.push({ label: customTitle || "Details", to: null });
    } else {
      segments.forEach((seg) => {
        const clean = seg.replace(/-/g, " ");
        const formatted = clean.charAt(0).toUpperCase() + clean.slice(1);
        crumbs.push({ label: formatted, to: null });
      });
    }
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

  // Custom Breadcrumb for dynamic page titles (e.g. Product Name)
  const [customBreadcrumb, setCustomBreadcrumb] = useState(null);

  useEffect(() => {
    setCustomBreadcrumb(null);
  }, [location.pathname]);

  // Global Customer State
  const [profile, setProfile] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [wallet, setWallet] = useState({ balance: 0 });
  const [methods, setMethods] = useState([]);
  const [addresses, setAddresses] = useState([]);

  // UI State
  const [userDropdown, setUserDropdown] = useState(false);
  const [modal, setModal] = useState(""); // "profile" | "password" | "support" | "logout"
  const [accountSidepanel, setAccountSidepanel] = useState({
    isOpen: false,
    initialTab: "wallet" // "wallet" | "addresses" | "payment"
  });

  const openAccountSidepanel = (tab = "wallet") => {
    setUserDropdown(false);
    setAccountSidepanel({ isOpen: true, initialTab: tab });
  };

  const closeAccountSidepanel = () => {
    setAccountSidepanel((prev) => ({ ...prev, isOpen: false }));
  };

  const [profileMode, setProfileMode] = useState("card"); // "card" | "edit"
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Sub-modal states
  const [addressMode, setAddressMode] = useState("list"); // "list" | "form"
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressToDelete, setAddressToDelete] = useState(null);
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [mapEditAddress, setMapEditAddress] = useState(null);
  const [showLocationSettings, setShowLocationSettings] = useState(false);

  const [paymentMode, setPaymentMode] = useState("list"); // "list" | "form"
  const [paymentTab, setPaymentTab] = useState("card"); // "card" | "upi" | "netbanking"
  const [editingMethod, setEditingMethod] = useState(null);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [paymentForm, setPaymentForm] = useState(emptyPayment);

  const [topup, setTopup] = useState({ amount: "1000", paymentMethodId: "" });
  const [profileForm, setProfileForm] = useState({ name: "", email: "", phone: "", gender: "", dateOfBirth: "" });
  const [passwordForm, setPasswordForm] = useState(emptyPassword);
  const [showPassword, setShowPassword] = useState({ current: false, next: false, confirm: false });

  // Full Page Mode State (Persisted in localStorage)
  const [isFullPage, setIsFullPage] = useState(() => {
    try {
      return localStorage.getItem("customer_full_page") === "true";
    } catch {
      return false;
    }
  });

  const toggleFullPage = () => {
    setIsFullPage((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("customer_full_page", String(next));
      } catch {}
      return next;
    });
  };

  // Topbar Search State (Synchronized with URL ?q=...)
  const [topbarSearch, setTopbarSearch] = useState("");
  const [isVoiceSearchOpen, setIsVoiceSearchOpen] = useState(false);
  const [isVisualSearchOpen, setIsVisualSearchOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("q") || "";
    setTopbarSearch(q);
  }, [location.search]);

  const [searchSuggestions, setSearchSuggestions] = useState({ categories: [], vendors: [], products: [] });
  const [allCategoriesList, setAllCategoriesList] = useState([]);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const searchDropdownRef = useRef(null);

  const DEFAULT_POPULAR_CATEGORIES = [
    { name: "Electronics", count: 85 },
    { name: "Fashion", count: 243 },
    { name: "Footwear & Shoes", count: 100 },
    { name: "Appliances", count: 72 },
    { name: "Home & Living", count: 64 },
    { name: "Beauty & Care", count: 58 },
    { name: "Sports & Fitness", count: 52 },
    { name: "Grocery & Gourmet", count: 45 },
    { name: "Gaming", count: 39 },
    { name: "Mobiles & Accessories", count: 96 }
  ];

  const categoriesToShow = allCategoriesList.length > 0 ? allCategoriesList : DEFAULT_POPULAR_CATEGORIES;

  // Load all categories on mount for instant dropdown on focus
  useEffect(() => {
    getProductSearchMeta("")
      .then((meta) => {
        if (meta?.categories && Array.isArray(meta.categories) && meta.categories.length > 0) {
          setAllCategoriesList(meta.categories);
        }
      })
      .catch((err) => console.error("Failed to load initial categories:", err));
  }, []);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target)) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch debounced search metadata suggestions
  useEffect(() => {
    const trimmed = topbarSearch.trim();
    if (!trimmed) {
      setSearchSuggestions({ categories: [], vendors: [], products: [] });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const meta = await getProductSearchMeta(trimmed);
        if (meta?.suggestions) {
          setSearchSuggestions(meta.suggestions);
          const hasResults =
            (meta.suggestions.categories && meta.suggestions.categories.length > 0) ||
            (meta.suggestions.vendors && meta.suggestions.vendors.length > 0) ||
            (meta.suggestions.products && meta.suggestions.products.length > 0);
          setIsSearchDropdownOpen(hasResults);
        }
      } catch (err) {
        console.error("Failed to fetch search suggestions:", err);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [topbarSearch]);

  const handleTopbarSearchSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSearchDropdownOpen(false);
    const trimmed = topbarSearch.trim();
    if (trimmed) {
      navigate(`/customer?q=${encodeURIComponent(trimmed)}`);
      window.dispatchEvent(new CustomEvent('scroll-to-section', { detail: { search: trimmed, resetCategory: true, resetVendor: true, target: 'catalog' } }));
    } else {
      navigate("/customer");
      window.dispatchEvent(new CustomEvent('scroll-to-section', { detail: { search: '', resetCategory: true, resetVendor: true, target: 'catalog' } }));
    }
  };

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isPaymentsOpen, setIsPaymentsOpen] = useState(false);
  const [isTicketsSidepanelOpen, setIsTicketsSidepanelOpen] = useState(false);
  const [ticketsInitialContext, setTicketsInitialContext] = useState(null);

  const openTicketsSidepanel = useCallback((ctx = null) => {
    setTicketsInitialContext(ctx);
    setIsTicketsSidepanelOpen(true);
  }, []);

  useEffect(() => {
    const handleOpenTickets = (e) => {
      openTicketsSidepanel(e.detail || null);
    };
    window.addEventListener("open-customer-tickets", handleOpenTickets);
    return () => window.removeEventListener("open-customer-tickets", handleOpenTickets);
  }, [openTicketsSidepanel]);

  useEffect(() => {
    const handleOpenAccount = (e) => {
      const tab = e.detail?.tab || "wallet";
      openAccountSidepanel(tab);
    };
    window.addEventListener("open-account-sidepanel", handleOpenAccount);
    return () => window.removeEventListener("open-account-sidepanel", handleOpenAccount);
  }, []);

  useEffect(() => {
    const handleProfileUpdated = (e) => {
      if (e.detail) {
        setProfile((prev) => ({ ...prev, ...e.detail }));
      }
    };
    window.addEventListener("customer-profile-updated", handleProfileUpdated);
    return () => window.removeEventListener("customer-profile-updated", handleProfileUpdated);
  }, []);

  const [isDarwinOpen, setIsDarwinOpen] = useState(false);
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
        try {
          localStorage.setItem("customer_profile", JSON.stringify(customer));
          localStorage.setItem("user", JSON.stringify(customer));
        } catch {}
        setProfileForm({
          name: customer.name || "",
          email: customer.email || "",
          phone: customer.phone || "",
          gender: customer.gender || "",
          dateOfBirth: formatDob(customer.dateOfBirth)
        });
      }

      const cartItems = Array.isArray(cartData) ? cartData : cartData?.items || [];
      const activeCart = cartItems.filter((it) => !it.savedForLater);
      setCartCount(activeCart.reduce((acc, it) => acc + Number(it.qty || 1), 0));

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
      const total = cartItems.filter((it) => !it.savedForLater).reduce((acc, it) => acc + Number(it.qty || 1), 0);
      setCartCount(total);
      return total;
    } catch {
      // non-blocking
    }
  }, []);

  const syncWishlistCount = useCallback(async () => {
    try {
      const wishlistData = await getWishlist();
      const wishItems = Array.isArray(wishlistData) ? wishlistData : wishlistData?.items || [];
      setWishlistCount(wishItems.length);
      return wishItems.length;
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

  // Profile Handlers
  const handleOpenProfileModal = () => {
    if (profile) {
      setProfileForm({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        gender: profile.gender || "",
        dateOfBirth: formatDob(profile.dateOfBirth)
      });
    }
    setError("");
    setModal("profile");
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const updated = await updateMyProfile(profileForm);
      setProfile(updated);
      toast.success("Profile updated successfully.");
      setProfileMode("card");
      closeModal();
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
    setMapEditAddress(null);
    setIsMapPickerOpen(true);
  };

  const openEditAddress = (addr) => {
    setMapEditAddress(addr);
    setIsMapPickerOpen(true);
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
    <div className={`account-dashboard-wrapper ${isFullPage ? "full-page-mode" : ""}`}>
      {/* =========================================================
          GLOBAL UNIFIED SIDEBAR (Used on all Customer Screens)
      ========================================================== */}
      <aside className="account-sidebar">
        <button
          type="button"
          className="account-sidebar-brand"
          onClick={toggleFullPage}
          title={isFullPage ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={isFullPage ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!isFullPage}
        >
          <div className="account-brand-icon" style={{ overflow: "hidden", padding: 0 }}>
            <img src="/favicon.svg" alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "inherit" }} />
          </div>
          <span className="account-brand-text">Inventory</span>
          {isFullPage ? (
            <ChevronRight size={18} className="account-brand-toggle-icon" aria-hidden="true" />
          ) : (
            <ChevronLeft size={18} className="account-brand-toggle-icon" aria-hidden="true" />
          )}
        </button>

        <nav className="account-sidebar-nav">
          <Link to="/customer" className={`account-nav-item ${isDashboard ? "active" : ""}`}>
            <Home size={18} />
            <span>Dashboard</span>
          </Link>

          <Link to="/customer/orders" className={`account-nav-item ${isOrders ? "active" : ""}`}>
            <ShoppingBag size={18} />
            <span>My Orders</span>
          </Link>

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

          <Link
            to="/customer/recommended"
            className={`account-nav-item ${location.pathname.startsWith("/customer/recommended") ? "active" : ""}`}
          >
            <Sparkles size={18} />
            <span>Recommended for You</span>
          </Link>

          {/* New Customer Experience Features */}
          <Link
            to="/customer/repeat-delivery"
            className={`account-nav-item ${location.pathname.startsWith("/customer/repeat-delivery") ? "active" : ""}`}
          >
            <Repeat size={18} />
            <span>Repeat Delivery</span>
          </Link>

          <Link
            to="/customer/shared-cart"
            className={`account-nav-item ${location.pathname.startsWith("/customer/shared-cart") ? "active" : ""}`}
          >
            <Users size={18} />
            <span>Shared Cart</span>
          </Link>

          <Link
            to="/customer/avatar"
            className={`account-nav-item ${location.pathname.startsWith("/customer/avatar") ? "active" : ""}`}
          >
            <Sparkles size={18} />
            <span>Virtual Avatar</span>
          </Link>

          <Link
            to="/customer/warranties"
            className={`account-nav-item ${location.pathname.startsWith("/customer/warranties") ? "active" : ""}`}
          >
            <ShieldCheck size={18} />
            <span>Warranty Vault</span>
          </Link>

          <Link
            to="/customer/rewards"
            className={`account-nav-item ${location.pathname.startsWith("/customer/rewards") ? "active" : ""}`}
          >
            <Gift size={18} />
            <span>Rewards Wallet</span>
          </Link>


          <button
            type="button"
            className={`account-nav-item ${isPaymentsOpen ? "active" : ""}`}
            onClick={() => setIsPaymentsOpen(true)}
          >
            <CreditCard size={18} />
            <span>Payments</span>
          </button>

          <button
            type="button"
            className={`account-nav-item ${accountSidepanel.isOpen && accountSidepanel.initialTab === "profile" ? "active" : ""}`}
            onClick={() => openAccountSidepanel("profile")}
          >
            <User size={18} />
            <span>My Details</span>
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
              onClick={() => openTicketsSidepanel()}
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
          <div className="account-topbar-left" style={{ display: "flex", alignItems: "center", minWidth: 0, flexShrink: 1, overflow: "hidden" }}>
            <nav className="account-topbar-breadcrumbs" aria-label="Breadcrumb">
              {getBreadcrumbs(location.pathname, customBreadcrumb).map((crumb, idx, arr) => {
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
          </div>

          {/* GLOBAL NAVBAR SEARCH BAR */}
          <form
            ref={searchDropdownRef}
            className="account-topbar-search-form"
            onSubmit={handleTopbarSearchSubmit}
          >
            <Search size={16} className="account-topbar-search-icon" />
            <input
              type="text"
              className="account-topbar-search-input"
              placeholder="Search products, brands, or categories..."
              value={topbarSearch}
              onChange={(e) => {
                setTopbarSearch(e.target.value);
                if (e.target.value.trim()) setIsSearchDropdownOpen(true);
              }}
              onFocus={() => {
                setIsSearchDropdownOpen(true);
              }}
            />
            <div className="account-topbar-search-actions">
              {topbarSearch ? (
                <button
                  type="button"
                  className="account-topbar-search-clear"
                  onClick={() => {
                    setTopbarSearch("");
                    navigate("/customer");
                  }}
                  title="Clear search"
                >
                  <X size={13} />
                </button>
              ) : null}

              {/* VOICE SEARCH TRIGGER MIC BUTTON */}
              <button
                type="button"
                className="topbar-search-action-btn voice-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsSearchDropdownOpen(false);
                  setIsVoiceSearchOpen(true);
                }}
                title="Voice Search"
              >
                <Mic size={16} />
              </button>

              {/* VISUAL SEARCH TRIGGER CAMERA BUTTON */}
              <button
                type="button"
                className="topbar-search-action-btn camera-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsSearchDropdownOpen(false);
                  setIsVisualSearchOpen(true);
                }}
                title="Visual Search (Search by Photo)"
              >
                <Camera size={16} />
              </button>
            </div>

            {/* LIVE AUTOCOMPLETE DROPDOWN */}
            {isSearchDropdownOpen && (
              <div className="adv-search-dropdown-menu">
                {!topbarSearch.trim() ? (
                  /* ZERO-QUERY: POPULAR CATEGORIES AS HORIZONTAL CHIPS LIKE BEFORE */
                  <div className="adv-dropdown-section">
                    <div className="adv-dropdown-section-title">
                      <Tag size={12} />
                      <span>Popular Categories</span>
                    </div>
                    <div className="adv-dropdown-tag-pills">
                      {categoriesToShow.map((cat) => (
                        <button
                          key={cat.name}
                          type="button"
                          className="adv-quick-pill"
                          onClick={() => {
                            setIsSearchDropdownOpen(false);
                            setTopbarSearch(cat.name);
                            navigate(`/customer?category=${encodeURIComponent(cat.name)}`);
                            window.dispatchEvent(new CustomEvent('scroll-to-section', { detail: { category: cat.name, resetSearch: true, resetVendor: true, target: 'catalog' } }));
                          }}
                        >
                          {cat.name} <span style={{ opacity: 0.65, fontSize: "11px" }}>({cat.count})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Categories */}
                    {searchSuggestions.categories?.length > 0 && (
                      <div className="adv-dropdown-section">
                        <div className="adv-dropdown-section-title">
                          <Tag size={12} />
                          <span>Matching Categories</span>
                        </div>
                    {searchSuggestions.categories.map((cat) => (
                      <button
                        key={cat.name}
                        type="button"
                        className="adv-dropdown-item"
                        onClick={() => {
                          setIsSearchDropdownOpen(false);
                          setTopbarSearch(cat.name);
                          navigate(`/customer?category=${encodeURIComponent(cat.name)}`);
                          window.dispatchEvent(new CustomEvent('scroll-to-section', { detail: { category: cat.name, resetSearch: true, resetVendor: true, target: 'catalog' } }));
                        }}
                      >
                        <span className="adv-dropdown-item-text">{cat.name}</span>
                        <span className="adv-dropdown-count-badge">{cat.count} items</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Vendors */}
                {searchSuggestions.vendors?.length > 0 && (
                  <div className="adv-dropdown-section">
                    <div className="adv-dropdown-section-title">
                      <Store size={12} />
                      <span>Vendors &amp; Brands</span>
                    </div>
                    {searchSuggestions.vendors.map((v) => (
                      <button
                        key={v.name}
                        type="button"
                        className="adv-dropdown-item"
                        onClick={() => {
                          setIsSearchDropdownOpen(false);
                          setTopbarSearch(v.name);
                          navigate(`/customer?vendor=${encodeURIComponent(v.name)}`);
                          window.dispatchEvent(new CustomEvent('scroll-to-section', { detail: { vendor: v.name, resetSearch: true, resetCategory: true, target: 'catalog' } }));
                        }}
                      >
                        <span className="adv-dropdown-item-text">{v.name}</span>
                        <span className="adv-dropdown-count-badge">{v.count} products</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Products */}
                {searchSuggestions.products?.length > 0 && (
                  <div className="adv-dropdown-section">
                    <div className="adv-dropdown-section-title">
                      <ShoppingBag size={12} />
                      <span>Matching Products</span>
                    </div>
                    {searchSuggestions.products.map((p) => (
                      <button
                        key={p._id}
                        type="button"
                        className="adv-dropdown-item adv-dropdown-product-item"
                        onClick={() => {
                          setIsSearchDropdownOpen(false);
                          setTopbarSearch(p.name);
                          navigate(`/customer?q=${encodeURIComponent(p.name)}`);
                          window.dispatchEvent(new CustomEvent('scroll-to-section', { detail: { search: p.name, resetCategory: true, resetVendor: true, target: 'catalog' } }));
                        }}
                      >
                        <div className="adv-dropdown-prod-info">
                          <span className="adv-dropdown-item-text" style={{ fontWeight: 600 }}>
                            {p.name}
                          </span>
                          <span className="adv-dropdown-prod-sub">
                            {p.category} • {p.vendorName || "Store"}
                          </span>
                        </div>
                        <span className="adv-dropdown-prod-price">
                          ₹{Number(p.price || 0).toLocaleString("en-IN")}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Submit query shortcut */}
                <div className="adv-dropdown-section" style={{ borderTop: "1px solid #f1f5f9", background: "#f8fafc" }}>
                  <button
                    type="button"
                    className="adv-dropdown-item"
                    style={{ color: "#2563eb", fontWeight: 600 }}
                    onClick={() => {
                      setIsSearchDropdownOpen(false);
                      handleTopbarSearchSubmit();
                    }}
                  >
                    <span>Search for &ldquo;{topbarSearch}&rdquo; &rarr;</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </form>

          {/* NAVBAR DELIVERY ADDRESS DROPDOWN (PLACED AFTER SEARCH) */}
          <NavbarAddressDropdown
            customerProfile={profile}
            onOpenManageAddresses={() => {
              openAccountSidepanel("addresses");
            }}
            onOpenLocationSettings={() => setShowLocationSettings(true)}
          />

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
                <div className="account-user-avatar-sm">
                  {profile?.avatar ? (
                    <img
                      src={profile.avatar}
                      alt={profile.name || "Customer"}
                      className="account-user-avatar-img"
                    />
                  ) : (
                    userInitial
                  )}
                </div>
                <span className="account-user-name">{profile?.name || "Customer"}</span>
                <ChevronDown size={14} className="account-chevron-icon" />
              </button>

              {userDropdown && (
                <div className="account-dropdown-menu" onMouseLeave={() => setUserDropdown(false)}>
                  <div className="account-dropdown-header">
                    <div className="account-dropdown-user-row">
                      <div className="account-user-avatar-sm">
                        {profile?.avatar ? (
                          <img
                            src={profile.avatar}
                            alt={profile.name || "Customer"}
                            className="account-user-avatar-img"
                          />
                        ) : (
                          userInitial
                        )}
                      </div>
                      <div className="account-dropdown-user-meta">
                        <strong>{profile?.name}</strong>
                        <span>{profile?.email}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="account-dropdown-item"
                    onClick={() => {
                      setUserDropdown(false);
                      openAccountSidepanel("profile");
                    }}
                  >
                    <User size={15} /> My Details
                  </button>

                  <button
                    type="button"
                    className="account-dropdown-item"
                    onClick={() => {
                      toggleFullPage();
                    }}
                  >
                    {isFullPage ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                    <span>Full Page Mode</span>
                    <span className={`account-dropdown-toggle-badge ${isFullPage ? "active" : ""}`}>
                      {isFullPage ? "ON" : "OFF"}
                    </span>
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
                    className="account-dropdown-item"
                    onClick={() => {
                      setUserDropdown(false);
                      openTicketsSidepanel();
                    }}
                  >
                    <Headphones size={15} /> Help &amp; Support Tickets
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
              openProfileModal: () => openAccountSidepanel("profile"),
              openAddressesModal: () => openAccountSidepanel("addresses"),
              openPaymentModal: () => openAccountSidepanel("payment"),
              openWalletModal: () => openAccountSidepanel("wallet"),
              openAccountSidepanel,
              openPasswordModal: () => setModal("password"),
              openSupportModal: () => openTicketsSidepanel(),
              openTicketsSidepanel,
              openLogoutModal: () => setModal("logout"),
              openNotificationSidepanel: () => setIsNotifOpen(true),
              openPaymentsSidepanel: () => setIsPaymentsOpen(true),
              unreadNotifCount,
              notifications,
              reloadAccount: loadGlobalData,
              reloadCart: syncCartCount,
              setCartCount,
              setCustomBreadcrumb
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
          CUSTOMER ACCOUNT SIDEPANEL: MY DETAILS, WALLET, ADDRESSES, PAYMENT
      ========================================================== */}
      <CustomerAccountSidepanel
        isOpen={accountSidepanel.isOpen}
        onClose={closeAccountSidepanel}
        initialTab={accountSidepanel.initialTab}
        profile={profile}
        wallet={wallet}
        addresses={addresses}
        methods={methods}
        onReload={loadGlobalData}
        onOpenPasswordModal={() => setModal("password")}
        onOpenLocationSettings={() => setShowLocationSettings(true)}
      />

      {/* =========================================================
          GLOBAL MODAL: EDIT PROFILE
      ========================================================== */}
      <Modal isOpen={modal === "profile"} onClose={closeModal} title="Edit Profile Details">
        <div className="refined-modal-content">
          <p className="refined-modal-subtitle">Keep your personal details up to date for quick checkout and order delivery updates.</p>
          <form className="refined-form" onSubmit={handleSaveProfile}>
            <div className="refined-form-group">
              <label>Full Name <span className="req-star">*</span></label>
              <input
                type="text"
                required
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                placeholder="Full name"
              />
            </div>
            <div className="refined-form-group">
              <label>Email Address <span className="req-star">*</span></label>
              <input
                type="email"
                required
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                placeholder="Email address"
              />
            </div>
            <div className="refined-form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                maxLength={10}
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                placeholder="10-digit mobile"
              />
            </div>
            <div className="refined-form-group">
              <label>Gender</label>
              <select
                value={profileForm.gender}
                onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                className="account-sort-select"
                style={{ width: "100%" }}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="refined-form-group">
              <label>Date of Birth</label>
              <input
                type="date"
                value={profileForm.dateOfBirth}
                onChange={(e) => setProfileForm({ ...profileForm, dateOfBirth: e.target.value })}
              />
            </div>
            {error && <div className="checkout-error">{error}</div>}
            <div className="refined-modal-footer">
              <button type="button" className="btn-refined-cancel" onClick={closeModal} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="btn-refined-submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
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

      {/* PAYMENTS & TRANSACTIONS SIDEPANEL */}
      <PaymentsSidepanel
        isOpen={isPaymentsOpen}
        onClose={() => setIsPaymentsOpen(false)}
        walletBalance={wallet.balance}
        onRechargeWallet={() => {
          setIsPaymentsOpen(false);
          openAccountSidepanel("wallet");
        }}
        onManagePaymentMethods={() => {
          setIsPaymentsOpen(false);
          openAccountSidepanel("payment");
        }}
      />

      {/* CUSTOMER SUPPORT TICKETS SIDEPANEL */}
      <CustomerTicketsSidepanel
        isOpen={isTicketsSidepanelOpen}
        onClose={() => setIsTicketsSidepanelOpen(false)}
        initialContext={ticketsInitialContext}
      />

      {/* PRODUCT COMPARE FLOATING BAR */}
      <CompareFloatingBar />

      {/* DARWIN AI SHOPPING ASSISTANT */}
      <DarwinFab
        isOpen={isDarwinOpen}
        onClick={() => setIsDarwinOpen(true)}
      />
      <DarwinChatDrawer
        isOpen={isDarwinOpen}
        onClose={() => setIsDarwinOpen(false)}
        onCartUpdate={() => {
          syncCartCount();
          loadGlobalData();
        }}
        onWishlistUpdate={() => {
          syncWishlistCount();
          loadGlobalData();
        }}
        onOpenModal={(modalName) => {
          setIsDarwinOpen(false);
          if (modalName === "support") {
            openTicketsSidepanel();
          } else {
            setModal(modalName);
          }
        }}
        onOpenPayments={() => {
          setIsDarwinOpen(false);
          setIsPaymentsOpen(true);
        }}
        onOpenNotifications={() => {
          setIsDarwinOpen(false);
          setIsNotifOpen(true);
        }}
      />

      {/* INTERACTIVE LEAFLET ADDRESS MAP MODAL */}
      <AddressMapModal
        isOpen={isMapPickerOpen}
        onClose={() => {
          setIsMapPickerOpen(false);
          setMapEditAddress(null);
        }}
        initialAddress={mapEditAddress}
        customerProfile={profile}
        onSuccess={() => {
          loadGlobalData();
          toast.success(mapEditAddress ? "Address updated successfully." : "Address saved with location pin.");
        }}
      />

      {/* ADDRESS & MAP GEOCODING SETTINGS MODAL */}
      <LocationSettingsModal
        isOpen={showLocationSettings}
        onClose={() => setShowLocationSettings(false)}
      />

      {/* GOOGLE AI VOICE SEARCH ASSISTANT MODAL */}
      <VoiceSearchModal
        isOpen={isVoiceSearchOpen}
        onClose={() => setIsVoiceSearchOpen(false)}
        onNavigateToProduct={(productId) => {
          navigate(`/customer/products/${productId}`);
        }}
        onSearchInCatalog={(query) => {
          setTopbarSearch(query);
          setIsSearchDropdownOpen(false);
          window.dispatchEvent(
            new CustomEvent('scroll-to-section', {
              detail: { search: query, resetCategory: true, resetVendor: true, target: 'catalog' }
            })
          );
        }}
        onWishlistToggle={() => {
          syncWishlistCount();
        }}
      />

      {/* AI VISUAL PRODUCT SEARCH MODAL */}
      <VisualSearchModal
        isOpen={isVisualSearchOpen}
        onClose={() => setIsVisualSearchOpen(false)}
        onSelectProduct={(p) => {
          navigate(`/customer/products/${p._id || p.id}`);
        }}
      />
    </div>
  );
}

export default CustomerLayout;
