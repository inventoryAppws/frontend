import { useEffect, useState, useMemo, useRef } from "react";
import {
  Bell,
  X,
  CheckCircle2,
  Package,
  Truck,
  RotateCcw,
  AlertTriangle,
  Wallet,
  Tag,
  Clock,
  Trash2,
  Check,
  ShoppingBag,
  ShoppingCart,
  ShieldCheck,
  Heart,
  Users,
  Gift,
  ArrowRight,
  ChevronRight,
  Search,
  LayoutGrid,
  CircleDot,
  Eye
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Bone from "./skeletons/Skeleton";
import "./NotificationSidepanel.css";

/**
 * Returns category key for styling the light-tinted background:
 * - cat-rewards
 * - cat-warranty
 * - cat-wishlist
 * - cat-shared
 * - cat-orders
 * - cat-shopping
 * - cat-price
 * - cat-general
 */
function getNotificationCategoryKey(type) {
  const t = String(type || "").toLowerCase();
  if (t.includes("reward") || t.includes("loyalty") || t.includes("wallet")) return "cat-rewards";
  if (t.includes("warranty")) return "cat-warranty";
  if (t.includes("wishlist") || t.includes("heart") || t.includes("back_in_stock")) return "cat-wishlist";
  if (t.includes("shared")) return "cat-shared";
  if (t.includes("price") || t.includes("promo") || t.includes("stock")) return "cat-price";
  if (t.startsWith("order_") || t.startsWith("return_") || t.startsWith("cancellation_") || t.includes("shipped") || t.includes("delivered")) return "cat-orders";
  if (t.includes("repeat")) return "cat-shopping";
  return "cat-general";
}

/**
 * Maps notification type to matching icon and pastel color theme
 */
function getNotificationVisual(type) {
  const t = String(type || "").toLowerCase();
  if (t.includes("reward") || t.includes("loyalty")) {
    return { cls: "theme-orange", icon: <Gift size={18} /> };
  }
  if (t.includes("warranty")) {
    return { cls: "theme-blue", icon: <ShieldCheck size={18} /> };
  }
  if (t.includes("wishlist") || t.includes("heart")) {
    return { cls: "theme-pink", icon: <Heart size={18} /> };
  }
  if (t.includes("shared")) {
    return { cls: "theme-green", icon: <Users size={18} /> };
  }
  if (t.includes("price") || t.includes("stock") || t.includes("promo")) {
    return { cls: "theme-amber", icon: <Tag size={18} /> };
  }
  if (t.startsWith("order_") || t.includes("shipped") || t.includes("truck")) {
    if (t.includes("delivered")) {
      return { cls: "theme-green", icon: <CheckCircle2 size={18} /> };
    }
    if (t.includes("cancelled")) {
      return { cls: "theme-red", icon: <AlertTriangle size={18} /> };
    }
    return { cls: "theme-blue", icon: <Truck size={18} /> };
  }
  if (t.includes("wallet")) {
    return { cls: "theme-emerald", icon: <Wallet size={18} /> };
  }
  if (t.includes("repeat") || t.includes("return")) {
    return { cls: "theme-purple", icon: <RotateCcw size={18} /> };
  }
  return { cls: "theme-slate", icon: <Bell size={18} /> };
}

/**
 * Compact timestamp formatting:
 * - Today: "6:04 pm"
 * - Yesterday: "Yesterday, 11:30 am"
 * - Earlier: "Sep 18, 09:15 am"
 */
function formatNotificationTime(dateVal) {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "";

  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayMidnight = todayMidnight - 24 * 60 * 60 * 1000;
  const time = d.getTime();

  const timeStr = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();

  if (time >= todayMidnight) {
    return timeStr;
  } else if (time >= yesterdayMidnight) {
    return `Yesterday, ${timeStr}`;
  } else {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[d.getMonth()]} ${d.getDate()}, ${timeStr}`;
  }
}

/**
 * Detailed timestamp for expanded info panel
 */
function formatDetailedDateTime(dateVal) {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${timeStr}`;
}

/**
 * Returns DYNAMIC product thumbnail ONLY if present in data.
 * No static/hardcoded images allowed.
 */
function getNotificationDynamicThumbnail(notif) {
  if (!notif) return null;
  const img =
    notif.productId?.images?.[0] ||
    notif.productId?.image ||
    notif.thumbnail ||
    notif.image ||
    notif.actionPayload?.thumbnail ||
    notif.actionPayload?.image ||
    notif.actionPayload?.productImage;

  if (img && typeof img === "string" && img.trim().length > 0) {
    return img.trim();
  }
  return null;
}

/**
 * Resolves action label and URL for navigation
 */
function getResolvedNotificationAction(notif) {
  if (!notif) return { actionLabel: "", actionUrl: "" };

  const type = String(notif.type || "").toLowerCase();
  let actionLabel = notif.actionLabel || "";
  let actionUrl = notif.actionUrl || "";

  const isOrderType =
    type.startsWith("order_") ||
    type.startsWith("return_") ||
    type.startsWith("cancellation_") ||
    Boolean(notif.orderId);

  // 1. Order notifications
  if (isOrderType) {
    if (!actionLabel) {
      if (type === "order_delivered" || type === "order_cancelled" || type.startsWith("cancellation_")) {
        actionLabel = "View Order";
      } else if (type === "order_return_requested" || type.startsWith("return_")) {
        actionLabel = "Track Return";
      } else {
        actionLabel = "Track Order";
      }
    }

    if (!actionUrl || actionUrl === "/customer/orders" || actionUrl === "/customer" || actionUrl === "/customer/") {
      if (notif.orderId) {
        actionUrl = `/customer/orders/${encodeURIComponent(notif.orderId)}/track`;
      } else {
        actionUrl = "/customer/orders";
      }
    }
  }

  // 2. Wishlist / Price drop / Stock alert / Back in stock
  else if (type === "wishlist" || type === "price_drop" || type === "stock_alert" || type === "back_in_stock") {
    if (notif.productId) {
      actionUrl = `/customer/products/${notif.productId}`;
      if (!actionLabel) actionLabel = type === "price_drop" ? "View Deal" : "View Product";
    } else {
      actionUrl = "/customer/wishlist";
      if (!actionLabel || actionLabel === "View Product") actionLabel = "View Wishlist";
    }
    if (actionUrl === "/customer/products" || actionUrl === "/customer/products/") {
      actionUrl = notif.productId ? `/customer/products/${notif.productId}` : "/customer/wishlist";
      if (!notif.productId) actionLabel = "View Wishlist";
    }
  }

  // 3. Shared cart
  else if (type === "shared_cart" || type === "shared") {
    if (!actionLabel) actionLabel = "Open Shared Cart";
    if (!actionUrl || actionUrl === "/customer/cart" || actionUrl === "/customer" || actionUrl === "/customer/") {
      actionUrl = notif.cartId ? `/customer/shared-cart/${notif.cartId}` : "/customer/shared-cart";
    }
  }

  // 4. Warranty
  else if (type === "warranty" || type === "warranty_reminder") {
    if (!actionLabel) actionLabel = "View Warranty";
    if (!actionUrl || actionUrl === "/customer/warranty-vault") {
      actionUrl = "/customer/warranties";
    }
  }

  // 5. Repeat Delivery
  else if (type === "repeat_delivery") {
    if (!actionLabel) actionLabel = "Reorder Now";
    if (!actionUrl) actionUrl = "/customer/repeat-delivery";
  }

  // 6. Rewards & Wallet
  else if (type === "rewards" || type === "loyalty") {
    if (!actionLabel) actionLabel = "View Rewards";
    if (!actionUrl) actionUrl = "/customer/rewards";
  } else if (type === "wallet_topup" || type === "wallet_refund" || type === "refund_credited") {
    if (!actionLabel) actionLabel = "View Wallet";
    if (!actionUrl) actionUrl = "/customer/settings";
  }

  return { actionLabel, actionUrl };
}

function getCategoryHumanLabel(type) {
  const t = String(type || "").toLowerCase();
  if (t.startsWith("order_") || t.startsWith("return_") || t.startsWith("cancellation_")) return "Orders";
  if (t.includes("repeat")) return "Repeat Delivery";
  if (t.includes("wishlist") || t.includes("heart") || t.includes("back_in_stock")) return "Wishlist Alert";
  if (t.includes("price") || t.includes("promo") || t.includes("stock")) return "Price History";
  if (t.includes("warranty")) return "Warranty Vault";
  if (t.includes("shared")) return "Shared Cart";
  if (t.includes("reward") || t.includes("loyalty")) return "Rewards Wallet";
  if (t.includes("wallet")) return "Wallet Balance";
  return "Notification";
}

const PAGE_SIZE = 10;

export default function NotificationSidepanel({
  isOpen,
  onClose,
  notifications = [],
  unreadCount = 0,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
  onClearAll,
  loading = false,
  isLoading = false
}) {
  const isDataLoading = loading || isLoading;
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all"); // "all" | "unread" | "orders" | "shopping" | "warranty" | "rewards" | "shared"
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef(null);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Reset pagination on tab or search change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeTab, searchQuery]);

  // Tab counts calculation
  const tabCounts = useMemo(() => {
    const counts = {
      all: notifications.length,
      unread: 0,
      orders: 0,
      shopping: 0,
      warranty: 0,
      rewards: 0,
      shared: 0
    };

    notifications.forEach((n) => {
      if (!n.isRead) counts.unread++;
      const t = String(n.type || "").toLowerCase();
      if (
        t.startsWith("order_") ||
        t.startsWith("return_") ||
        t.startsWith("cancellation_") ||
        n.orderId
      ) {
        counts.orders++;
      } else if (["repeat_delivery", "wishlist", "price_drop", "stock_alert", "back_in_stock", "promo"].includes(t)) {
        counts.shopping++;
      } else if (["warranty_reminder", "warranty"].includes(t)) {
        counts.warranty++;
      } else if (["rewards", "loyalty", "wallet_topup", "wallet_refund", "refund_credited"].includes(t)) {
        counts.rewards++;
      } else if (["shared_cart", "shared"].includes(t)) {
        counts.shared++;
      }
    });

    return counts;
  }, [notifications]);

  // Filtered notifications with category & instant search
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // 1. Tab filter
      if (activeTab === "unread" && n.isRead) return false;
      const t = String(n.type || "").toLowerCase();
      if (activeTab === "orders") {
        const isOrder = t.startsWith("order_") || t.startsWith("return_") || t.startsWith("cancellation_") || Boolean(n.orderId);
        if (!isOrder) return false;
      } else if (activeTab === "shopping") {
        if (!["repeat_delivery", "wishlist", "price_drop", "stock_alert", "back_in_stock", "promo"].includes(t)) return false;
      } else if (activeTab === "warranty") {
        if (!["warranty_reminder", "warranty"].includes(t)) return false;
      } else if (activeTab === "rewards") {
        if (!["rewards", "loyalty", "wallet_topup", "wallet_refund", "refund_credited"].includes(t)) return false;
      } else if (activeTab === "shared") {
        if (!["shared_cart", "shared"].includes(t)) return false;
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const titleMatch = String(n.title || "").toLowerCase().includes(q);
        const msgMatch = String(n.message || "").toLowerCase().includes(q);
        const orderMatch = String(n.orderId || "").toLowerCase().includes(q);
        if (!titleMatch && !msgMatch && !orderMatch) return false;
      }

      return true;
    });
  }, [notifications, activeTab, searchQuery]);

  // Scrolling pagination: slice to visibleCount
  const paginatedNotifications = useMemo(() => {
    return filteredNotifications.slice(0, visibleCount);
  }, [filteredNotifications, visibleCount]);

  // Infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && visibleCount < filteredNotifications.length && !loadingMore) {
          setLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredNotifications.length));
            setLoadingMore(false);
          }, 300);
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [visibleCount, filteredNotifications.length, loadingMore]);

  // Group notifications by time (Today, Yesterday, Earlier)
  const groupedNotifications = useMemo(() => {
    const groups = {
      today: [],
      yesterday: [],
      earlier: []
    };

    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayMidnight = todayMidnight - 24 * 60 * 60 * 1000;

    paginatedNotifications.forEach((n) => {
      const time = n.createdAt ? new Date(n.createdAt).getTime() : Date.now();
      if (time >= todayMidnight) {
        groups.today.push(n);
      } else if (time >= yesterdayMidnight) {
        groups.yesterday.push(n);
      } else {
        groups.earlier.push(n);
      }
    });

    return groups;
  }, [paginatedNotifications]);

  if (!isOpen) return null;

  const navigateToResolvedTarget = (targetUrl) => {
    if (!targetUrl) return;
    onClose();
    if (targetUrl.startsWith("http://") || targetUrl.startsWith("https://")) {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    } else {
      navigate(targetUrl);
    }
  };

  const handleCardClick = (notif) => {
    if (!notif.isRead && onMarkAsRead) {
      onMarkAsRead(notif._id);
    }
    // Toggle card expansion
    setExpandedId((prev) => (prev === notif._id ? null : notif._id));
  };

  const handleActionBtnClick = (e, notif, targetUrl) => {
    e.stopPropagation();
    if (!notif.isRead && onMarkAsRead) {
      onMarkAsRead(notif._id);
    }
    const resolved = targetUrl || getResolvedNotificationAction(notif).actionUrl;
    navigateToResolvedTarget(resolved);
  };

  const renderNotifCard = (notif) => {
    const isUnread = !notif.isRead;
    const isExpanded = expandedId === notif._id;
    const { actionLabel, actionUrl } = getResolvedNotificationAction(notif);
    const { cls: iconTheme, icon } = getNotificationVisual(notif.type);
    const categoryClass = getNotificationCategoryKey(notif.type);
    const dynamicThumbnail = getNotificationDynamicThumbnail(notif);
    const t = String(notif.type || "").toLowerCase();
    const isOrderType = t.startsWith("order_") || t.startsWith("return_") || t.startsWith("cancellation_") || Boolean(notif.orderId);
    const isRepeatDelivery = t.includes("repeat");
    const isWishlistType = t.includes("wishlist") || t.includes("price") || t.includes("stock") || t.includes("back_in_stock");
    const isWarrantyType = t.includes("warranty");
    const isSharedCartType = t.includes("shared");
    const isRewardsType = t.includes("reward") || t.includes("loyalty") || t.includes("wallet");

    // Stepper state checks
    const isDelivered = t.includes("delivered") || t.includes("completed");
    const isShippedOrDelivered = isDelivered || t.includes("shipped") || t.includes("out_for_delivery");

    let statusChipText = "Order Processing";
    let statusChipCls = "status-blue";
    if (t.includes("delivered")) {
      statusChipText = "Delivered";
      statusChipCls = "status-green";
    } else if (t.includes("shipped") || t.includes("out_for_delivery")) {
      statusChipText = "In Transit";
      statusChipCls = "status-amber";
    } else if (t.includes("cancelled")) {
      statusChipText = "Cancelled";
      statusChipCls = "status-red";
    } else if (t.includes("return")) {
      statusChipText = "Return Processing";
      statusChipCls = "status-purple";
    }

    return (
      <div
        key={notif._id}
        className={`notif-card ${categoryClass} ${isUnread ? "unread" : "read"} ${isExpanded ? "expanded" : ""}`}
        onClick={() => handleCardClick(notif)}
      >
        {/* Unread indicator dot */}
        {isUnread && <span className="notif-unread-dot" />}

        {/* Colorful Category Icon */}
        <div className={`notif-icon-col ${iconTheme}`}>
          {icon}
        </div>

        {/* Content Column */}
        <div className="notif-content-col">
          {/* Header Line: Title + Time + Expand Chevron */}
          <div className="notif-header-line">
            <strong className="notif-card-title">{notif.title}</strong>
            <div className="notif-meta-end">
              <span className="notif-card-time">{formatNotificationTime(notif.createdAt)}</span>
              <ChevronRight
                size={16}
                className={`notif-chevron ${isExpanded ? "rotated" : ""}`}
              />
            </div>
          </div>

          {/* Body Content Row: Message on Left, ONLY Dynamic Thumbnail if Available on Right */}
          <div className="notif-body-row">
            <div className="notif-text-wrap">
              <p className="notif-card-message">{notif.message}</p>
            </div>

            {/* Render thumbnail ONLY if dynamic image exists */}
            {dynamicThumbnail && (
              <div className="notif-thumb-wrap">
                <img
                  src={dynamicThumbnail}
                  alt=""
                  className="notif-thumb-img"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            )}
          </div>

          {/* Expandable Detail Panel */}
          {isExpanded && (
            <div
              className="notif-expanded-panel"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Metadata row: Category, Full Timestamp, Read status */}
              <div className="notif-exp-meta-bar">
                <div className="notif-exp-meta-left">
                  <span className="notif-exp-cat-badge">
                    {getCategoryHumanLabel(notif.type)}
                  </span>
                  <span className={`notif-exp-read-pill ${isUnread ? "unread" : "read"}`}>
                    {isUnread ? (
                      <>
                        <span className="unread-dot-mini" />
                        <span>Unread</span>
                      </>
                    ) : (
                      <>
                        <Check size={11} />
                        <span>Read</span>
                      </>
                    )}
                  </span>
                </div>
                <span className="notif-exp-time-full">
                  <Clock size={11} />
                  <span>{formatDetailedDateTime(notif.createdAt)}</span>
                </span>
              </div>

              {/* 1. ORDER DETAILS & FULLY ADJUSTABLE STEPPER */}
              {isOrderType ? (
                <div className="notif-exp-order-content">
                  <div className="notif-exp-order-meta-line">
                    <span className="notif-exp-order-id-tag">
                      Order #{notif.orderId || "ORD-RECENT"}
                    </span>
                    <span className={`notif-exp-status-pill ${statusChipCls}`}>
                      {statusChipText}
                    </span>
                  </div>

                  {/* Fully adjustable edge-to-edge stepper */}
                  <div className="notif-stepper-full-container">
                    <div className="notif-stepper-step active">
                      <div className="stepper-dot" />
                      <span className="stepper-label">Placed</span>
                    </div>

                    <div className={`stepper-line ${isShippedOrDelivered ? "active" : ""}`} />

                    <div className={`notif-stepper-step ${isShippedOrDelivered ? "active" : ""}`}>
                      <div className="stepper-dot" />
                      <span className="stepper-label">Shipped</span>
                    </div>

                    <div className={`stepper-line ${isDelivered ? "active" : ""}`} />

                    <div className={`notif-stepper-step ${isDelivered ? "active" : ""}`}>
                      <div className="stepper-dot" />
                      <span className="stepper-label">Delivered</span>
                    </div>
                  </div>

                  <p className="notif-exp-context-note">
                    {t.includes("delivered")
                      ? "Your package was delivered to your address. You can download the tax invoice or request a return within the return window."
                      : t.includes("shipped")
                      ? "Your package has been dispatched by courier and is on track for delivery."
                      : t.includes("cancelled")
                      ? "This order was cancelled. Any amount paid has been credited to your wallet balance."
                      : "Order confirmed! The vendor is preparing your package for courier pickup."}
                  </p>

                  {/* Action buttons inside expanded panel */}
                  <div className="notif-exp-buttons-row">
                    <button
                      type="button"
                      className="notif-exp-btn primary-action"
                      onClick={(e) => handleActionBtnClick(e, notif, actionUrl)}
                    >
                      <Truck size={14} />
                      <span>Track Order in Full View</span>
                    </button>
                    <button
                      type="button"
                      className="notif-exp-btn outline-action"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                        navigate(notif.orderId ? `/customer/orders?orderId=${encodeURIComponent(notif.orderId)}` : "/customer/orders");
                      }}
                    >
                      <Eye size={14} />
                      <span>View Order Summary</span>
                    </button>
                  </div>
                </div>
              ) : isRepeatDelivery ? (
                /* 2. REPEAT DELIVERY SPECIFIC DETAILS */
                <div className="notif-exp-sub-content">
                  <div className="notif-exp-tiles-grid">
                    <div className="notif-info-tile">
                      <span className="info-tile-caption">Frequency</span>
                      <span className="info-tile-val">Every 15 Days</span>
                    </div>
                    <div className="notif-info-tile">
                      <span className="info-tile-caption">Scheduled Dispatch</span>
                      <span className="info-tile-val alert-blue">Due in 2 Days</span>
                    </div>
                    <div className="notif-info-tile">
                      <span className="info-tile-caption">Subscription Status</span>
                      <span className="info-tile-val alert-green">Active</span>
                    </div>
                  </div>

                  <p className="notif-exp-context-note">
                    Automated repeat delivery ensures your essential items are refilled before you run out.
                  </p>

                  <div className="notif-exp-buttons-row">
                    <button
                      type="button"
                      className="notif-exp-btn primary-action"
                      onClick={(e) => handleActionBtnClick(e, notif, actionUrl || "/customer/repeat-delivery")}
                    >
                      <RotateCcw size={14} />
                      <span>Reorder / Confirm Dispatch</span>
                    </button>
                    <button
                      type="button"
                      className="notif-exp-btn outline-action"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                        navigate("/customer/repeat-delivery");
                      }}
                    >
                      <span>Manage Schedules</span>
                    </button>
                  </div>
                </div>
              ) : isWishlistType ? (
                /* 3. WISHLIST / PRICE DROP DETAILS */
                <div className="notif-exp-sub-content">
                  <div className="notif-exp-tiles-grid">
                    <div className="notif-info-tile">
                      <span className="info-tile-caption">Alert Type</span>
                      <span className="info-tile-val alert-pink">{t.includes("price") ? "Price Drop" : "Back in Stock"}</span>
                    </div>
                    <div className="notif-info-tile">
                      <span className="info-tile-caption">Stock Availability</span>
                      <span className="info-tile-val alert-green">Limited Units</span>
                    </div>
                    <div className="notif-info-tile">
                      <span className="info-tile-caption">Delivery Speed</span>
                      <span className="info-tile-val">Express 24h</span>
                    </div>
                  </div>

                  <p className="notif-exp-context-note">
                    Inventory has been verified. You can purchase now to secure this item at the notified price.
                  </p>

                  <div className="notif-exp-buttons-row">
                    <button
                      type="button"
                      className="notif-exp-btn primary-action"
                      onClick={(e) => handleActionBtnClick(e, notif, actionUrl)}
                    >
                      <Heart size={14} />
                      <span>{actionLabel || "View Product / Deal"}</span>
                    </button>
                    <button
                      type="button"
                      className="notif-exp-btn outline-action"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                        navigate("/customer/wishlist");
                      }}
                    >
                      <span>Go to Wishlist</span>
                    </button>
                  </div>
                </div>
              ) : isWarrantyType ? (
                /* 4. WARRANTY VAULT DETAILS */
                <div className="notif-exp-sub-content">
                  <div className="notif-exp-tiles-grid">
                    <div className="notif-info-tile">
                      <span className="info-tile-caption">Certificate Tier</span>
                      <span className="info-tile-val alert-blue">1-Year Official</span>
                    </div>
                    <div className="notif-info-tile">
                      <span className="info-tile-caption">Coverage Time</span>
                      <span className="info-tile-val alert-amber">30 Days Remaining</span>
                    </div>
                    <div className="notif-info-tile">
                      <span className="info-tile-caption">Service Coverage</span>
                      <span className="info-tile-val alert-green">Parts & Labor</span>
                    </div>
                  </div>

                  <p className="notif-exp-context-note">
                    Inspect your authorized warranty document or request a digital extension before coverage expires.
                  </p>

                  <div className="notif-exp-buttons-row">
                    <button
                      type="button"
                      className="notif-exp-btn primary-action"
                      onClick={(e) => handleActionBtnClick(e, notif, actionUrl || "/customer/warranties")}
                    >
                      <ShieldCheck size={14} />
                      <span>Open Warranty Vault</span>
                    </button>
                  </div>
                </div>
              ) : isSharedCartType ? (
                /* 5. SHARED CART DETAILS */
                <div className="notif-exp-sub-content">
                  <div className="notif-exp-tiles-grid">
                    <div className="notif-info-tile">
                      <span className="info-tile-caption">Activity</span>
                      <span className="info-tile-val alert-green">Member Vote</span>
                    </div>
                    <div className="notif-info-tile">
                      <span className="info-tile-caption">Cart Mode</span>
                      <span className="info-tile-val">Collaborative</span>
                    </div>
                    <div className="notif-info-tile">
                      <span className="info-tile-caption">Live Status</span>
                      <span className="info-tile-val alert-blue">Active</span>
                    </div>
                  </div>

                  <p className="notif-exp-context-note">
                    Group cart members are collaborating on selections. Open the shared cart to cast your vote.
                  </p>

                  <div className="notif-exp-buttons-row">
                    <button
                      type="button"
                      className="notif-exp-btn primary-action"
                      onClick={(e) => handleActionBtnClick(e, notif, actionUrl || "/customer/shared-cart")}
                    >
                      <Users size={14} />
                      <span>Open Shared Cart</span>
                    </button>
                  </div>
                </div>
              ) : isRewardsType ? (
                /* 6. REWARDS & WALLET DETAILS */
                <div className="notif-exp-sub-content">
                  <div className="notif-exp-tiles-grid">
                    <div className="notif-info-tile">
                      <span className="info-tile-caption">Points Balance</span>
                      <span className="info-tile-val alert-amber">2,450 pts</span>
                    </div>
                    <div className="notif-info-tile">
                      <span className="info-tile-caption">Cash Value</span>
                      <span className="info-tile-val alert-green">₹245.00</span>
                    </div>
                    <div className="notif-info-tile">
                      <span className="info-tile-caption">Redemption</span>
                      <span className="info-tile-val">At Checkout</span>
                    </div>
                  </div>

                  <p className="notif-exp-context-note">
                    Use your loyalty coins directly at checkout for instant cash discounts on your next purchase.
                  </p>

                  <div className="notif-exp-buttons-row">
                    <button
                      type="button"
                      className="notif-exp-btn primary-action"
                      onClick={(e) => handleActionBtnClick(e, notif, actionUrl || "/customer/rewards")}
                    >
                      <Gift size={14} />
                      <span>View Rewards Wallet</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* 7. GENERAL NOTIFICATION DETAILS */
                <div className="notif-exp-sub-content">
                  <p className="notif-exp-context-note">{notif.message}</p>
                  {actionUrl && (
                    <div className="notif-exp-buttons-row">
                      <button
                        type="button"
                        className="notif-exp-btn primary-action"
                        onClick={(e) => handleActionBtnClick(e, notif, actionUrl)}
                      >
                        <span>{actionLabel || "View Details"}</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="notif-sidepanel-backdrop" onClick={onClose}>
      <aside
        className="notif-sidepanel-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Notifications Panel"
      >
        {/* HEADER */}
        <div className="notif-sidepanel-header">
          <div className="notif-header-title-row">
            <div className="notif-bell-badge-wrap">
              <Bell size={20} />
              {unreadCount > 0 && <span className="notif-header-badge">{unreadCount}</span>}
            </div>
            <div>
              <h3>Notifications</h3>
              <p className="notif-header-sub">
                {unreadCount > 0 ? `${unreadCount} unread updates` : "All caught up!"}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="notif-close-btn"
            onClick={onClose}
            aria-label="Close Notifications"
          >
            <X size={20} />
          </button>
        </div>

        {/* TABS NAVIGATION BAR: ALL -> UNREAD -> OTHERS */}
        <div className="notif-category-tabs-nav">
          <button
            type="button"
            className={`notif-tab-item ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            <LayoutGrid size={13.5} />
            <span>All</span>
            <span className="notif-tab-badge">{tabCounts.all}</span>
          </button>

          <button
            type="button"
            className={`notif-tab-item ${activeTab === "unread" ? "active" : ""}`}
            onClick={() => setActiveTab("unread")}
          >
            <CircleDot size={13.5} />
            <span>Unread</span>
            <span className="notif-tab-badge unread-badge">{tabCounts.unread}</span>
          </button>

          <button
            type="button"
            className={`notif-tab-item ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            <ShoppingBag size={13.5} />
            <span>Orders</span>
            <span className="notif-tab-badge">{tabCounts.orders}</span>
          </button>

          <button
            type="button"
            className={`notif-tab-item ${activeTab === "shopping" ? "active" : ""}`}
            onClick={() => setActiveTab("shopping")}
          >
            <ShoppingCart size={13.5} />
            <span>Shopping</span>
            <span className="notif-tab-badge">{tabCounts.shopping}</span>
          </button>

          <button
            type="button"
            className={`notif-tab-item ${activeTab === "warranty" ? "active" : ""}`}
            onClick={() => setActiveTab("warranty")}
          >
            <ShieldCheck size={13.5} />
            <span>Warranty</span>
            <span className="notif-tab-badge">{tabCounts.warranty}</span>
          </button>

          <button
            type="button"
            className={`notif-tab-item ${activeTab === "rewards" ? "active" : ""}`}
            onClick={() => setActiveTab("rewards")}
          >
            <Gift size={13.5} />
            <span>Rewards</span>
            <span className="notif-tab-badge">{tabCounts.rewards}</span>
          </button>

          <button
            type="button"
            className={`notif-tab-item ${activeTab === "shared" ? "active" : ""}`}
            onClick={() => setActiveTab("shared")}
          >
            <Users size={13.5} />
            <span>Shared</span>
            <span className="notif-tab-badge">{tabCounts.shared}</span>
          </button>
        </div>

        {/* CONTROLS BAR: SEARCH + ACTIONS */}
        <div className="notif-controls-bar">
          <div className="notif-search-box">
            <Search size={14} className="notif-search-icon" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="notif-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="notif-search-clear"
                onClick={() => setSearchQuery("")}
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="notif-quick-actions">
            {unreadCount > 0 && (
              <button
                type="button"
                className="notif-action-btn mark-all"
                onClick={onMarkAllAsRead}
                title="Mark all as read"
              >
                <Check size={13} />
                <span>Mark all read</span>
              </button>
            )}

            <button
              type="button"
              className="notif-action-btn danger"
              onClick={onClearAll}
              title="Clear all notifications"
            >
              <Trash2 size={13} />
              <span>Clear all</span>
            </button>
          </div>
        </div>

        {/* NOTIFICATIONS LIST (SCROLLING PAGINATION) */}
        <div className="notif-sidepanel-body">
          {isDataLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "12px 4px" }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "14px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #f1f5f9" }}>
                  <Bone width={40} height={40} radius="10px" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <Bone height={14} width="60%" style={{ marginBottom: "6px" }} />
                    <Bone height={12} width="90%" style={{ marginBottom: "4px" }} />
                    <Bone height={10} width="35%" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="notif-empty-state">
              <div className="notif-empty-icon">
                {activeTab === "orders" && <Package size={34} />}
                {activeTab === "shopping" && <ShoppingBag size={34} />}
                {activeTab === "warranty" && <ShieldCheck size={34} />}
                {activeTab === "rewards" && <Gift size={34} />}
                {activeTab === "shared" && <Users size={34} />}
                {activeTab === "unread" && <CheckCircle2 size={34} />}
                {activeTab === "all" && <Bell size={34} />}
              </div>
              <h4>No {activeTab === "all" ? "notifications" : `${activeTab} notifications`}</h4>
              <p>
                {searchQuery
                  ? `No updates matching "${searchQuery}".`
                  : activeTab === "unread"
                  ? "You have read all your notifications."
                  : activeTab === "orders"
                  ? "Order confirmations, status updates, and tracking alerts will appear here."
                  : activeTab === "shopping"
                  ? "Repeat deliveries, stock updates, and price drop alerts will appear here."
                  : activeTab === "warranty"
                  ? "Digital warranty expiry reminders and claim updates will appear here."
                  : activeTab === "rewards"
                  ? "Loyalty points earned and reward coupons will appear here."
                  : activeTab === "shared"
                  ? "Group cart member votes and additions will appear here."
                  : "When you place orders or receive updates, they'll appear right here."}
              </p>
            </div>
          ) : (
            <div className="notif-list">
              {/* Today Section */}
              {groupedNotifications.today.length > 0 && (
                <div className="notif-time-group">
                  <div className="notif-group-header">
                    <span className="notif-group-title">Today</span>
                    <span className="notif-group-count">{groupedNotifications.today.length} new</span>
                  </div>
                  {groupedNotifications.today.map(renderNotifCard)}
                </div>
              )}

              {/* Yesterday Section */}
              {groupedNotifications.yesterday.length > 0 && (
                <div className="notif-time-group">
                  <div className="notif-group-header">
                    <span className="notif-group-title">Yesterday</span>
                    <span className="notif-group-count">{groupedNotifications.yesterday.length} updates</span>
                  </div>
                  {groupedNotifications.yesterday.map(renderNotifCard)}
                </div>
              )}

              {/* Earlier Section */}
              {groupedNotifications.earlier.length > 0 && (
                <div className="notif-time-group">
                  <div className="notif-group-header">
                    <span className="notif-group-title">Earlier</span>
                    <span className="notif-group-count">{groupedNotifications.earlier.length} updates</span>
                  </div>
                  {groupedNotifications.earlier.map(renderNotifCard)}
                </div>
              )}

              {/* Infinite Scroll Sentinel */}
              <div ref={sentinelRef} className="notif-scroll-sentinel" />

              {/* Loading Skeletons when paginating */}
              {loadingMore && (
                <div className="notif-loading-more-skeletons">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="notif-skeleton-row">
                      <Bone width={38} height={38} radius="10px" style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <Bone height={13} width="55%" style={{ marginBottom: "6px" }} />
                        <Bone height={11} width="85%" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
