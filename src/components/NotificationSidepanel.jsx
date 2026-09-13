import { useEffect, useState, useMemo } from "react";
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
  CheckCheck,
  ShoppingBag,
  CreditCard,
  Sparkles
} from "lucide-react";
import { formatDateTime } from "../utils/dateFormatter";
import { useNavigate } from "react-router-dom";

function getNotificationIcon(type) {
  switch (type) {
    case "order_placed":
      return <Package size={18} className="notif-type-icon placed" />;
    case "order_shipped":
    case "order_out_for_delivery":
      return <Truck size={18} className="notif-type-icon shipped" />;
    case "order_delivered":
      return <CheckCircle2 size={18} className="notif-type-icon delivered" />;
    case "order_cancelled":
      return <AlertTriangle size={18} className="notif-type-icon cancelled" />;
    case "order_return_requested":
      return <RotateCcw size={18} className="notif-type-icon return" />;
    case "wallet_topup":
    case "wallet_refund":
      return <Wallet size={18} className="notif-type-icon wallet" />;
    case "promo":
      return <Sparkles size={18} className="notif-type-icon promo" />;
    default:
      return <Bell size={18} className="notif-type-icon default" />;
  }
}

export default function NotificationSidepanel({
  isOpen,
  onClose,
  notifications = [],
  unreadCount = 0,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
  onClearAll,
  loading = false
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all"); // "all" | "unread" | "orders" | "payments" | "promotional"

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

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts = {
      all: notifications.length,
      unread: 0,
      orders: 0,
      payments: 0,
      promotional: 0
    };

    notifications.forEach((n) => {
      if (!n.isRead) counts.unread++;
      const t = String(n.type || "").toLowerCase();
      if (["order_placed", "order_shipped", "order_out_for_delivery", "order_delivered", "order_cancelled", "order_return_requested"].includes(t)) {
        counts.orders++;
      } else if (["wallet_topup", "wallet_refund", "payment", "refund"].includes(t)) {
        counts.payments++;
      } else if (["promo", "general", "stock_alert"].includes(t)) {
        counts.promotional++;
      }
    });

    return counts;
  }, [notifications]);

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (activeTab === "all") return true;
      if (activeTab === "unread") return !n.isRead;
      const t = String(n.type || "").toLowerCase();
      if (activeTab === "orders") {
        return ["order_placed", "order_shipped", "order_out_for_delivery", "order_delivered", "order_cancelled", "order_return_requested"].includes(t);
      }
      if (activeTab === "payments") {
        return ["wallet_topup", "wallet_refund", "payment", "refund"].includes(t);
      }
      if (activeTab === "promotional") {
        return ["promo", "general", "stock_alert"].includes(t);
      }
      return true;
    });
  }, [notifications, activeTab]);

  if (!isOpen) return null;

  const handleNotificationClick = (notif) => {
    if (!notif.isRead && onMarkAsRead) {
      onMarkAsRead(notif._id);
    }
    if (notif.actionUrl) {
      onClose();
      navigate(notif.actionUrl);
    }
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
                {unreadCount > 0 ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}` : "All caught up!"}
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

        {/* TABS NAVIGATION */}
        <div className="notif-category-tabs-nav">
          <button
            type="button"
            className={`notif-tab-item ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            <span>All</span>
            <span className="notif-tab-badge">{tabCounts.all}</span>
          </button>

          <button
            type="button"
            className={`notif-tab-item ${activeTab === "unread" ? "active" : ""}`}
            onClick={() => setActiveTab("unread")}
          >
            <span>Unread</span>
            {tabCounts.unread > 0 && <span className="notif-tab-badge unread-badge">{tabCounts.unread}</span>}
          </button>

          <button
            type="button"
            className={`notif-tab-item ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            <span>Orders</span>
            <span className="notif-tab-badge">{tabCounts.orders}</span>
          </button>

          <button
            type="button"
            className={`notif-tab-item ${activeTab === "payments" ? "active" : ""}`}
            onClick={() => setActiveTab("payments")}
          >
            <span>Payments</span>
            <span className="notif-tab-badge">{tabCounts.payments}</span>
          </button>

          <button
            type="button"
            className={`notif-tab-item ${activeTab === "promotional" ? "active" : ""}`}
            onClick={() => setActiveTab("promotional")}
          >
            <span>Promotional</span>
            <span className="notif-tab-badge">{tabCounts.promotional}</span>
          </button>
        </div>

        {/* CONTROLS BAR */}
        {notifications.length > 0 && (
          <div className="notif-sidepanel-actions-bar">
            {unreadCount > 0 && (
              <button
                type="button"
                className="notif-action-btn"
                onClick={onMarkAllAsRead}
                title="Mark all as read"
              >
                <CheckCheck size={14} />
                <span>Mark all read</span>
              </button>
            )}

            <button
              type="button"
              className="notif-action-btn danger"
              onClick={onClearAll}
              title="Clear all notifications"
            >
              <Trash2 size={14} />
              <span>Clear all</span>
            </button>
          </div>
        )}

        {/* NOTIFICATIONS LIST */}
        <div className="notif-sidepanel-body">
          {loading ? (
            <div className="notif-loading-box">
              <div className="spinner-small" />
              <span>Loading notifications...</span>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="notif-empty-state">
              <div className="notif-empty-icon">
                {activeTab === "orders" && <Package size={34} />}
                {activeTab === "payments" && <Wallet size={34} />}
                {activeTab === "promotional" && <Sparkles size={34} />}
                {activeTab === "unread" && <CheckCircle2 size={34} />}
                {activeTab === "all" && <Bell size={34} />}
              </div>
              <h4>No {activeTab === "all" ? "notifications" : `${activeTab} notifications`}</h4>
              <p>
                {activeTab === "unread"
                  ? "You have read all your notifications."
                  : activeTab === "orders"
                  ? "Order confirmations, status updates, and tracking alerts will appear here."
                  : activeTab === "payments"
                  ? "Wallet top-ups and refund transactions will appear here."
                  : activeTab === "promotional"
                  ? "Special offers, discounts, and news will appear here."
                  : "When you place orders or receive updates, they'll appear right here."}
              </p>
            </div>
          ) : (
            <div className="notif-list">
              {filteredNotifications.map((notif) => {
                const isUnread = !notif.isRead;
                return (
                  <div
                    key={notif._id}
                    className={`notif-card ${isUnread ? "unread" : "read"}`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="notif-icon-col">
                      {getNotificationIcon(notif.type)}
                      {isUnread && <span className="notif-unread-dot" />}
                    </div>

                    <div className="notif-content-col">
                      <strong className="notif-title">{notif.title}</strong>
                      <span className="notif-time">
                        {formatDateTime(notif.createdAt)}
                      </span>

                      <p className="notif-message">{notif.message}</p>

                      {notif.orderId && (
                        <span className="notif-order-pill">Order #{notif.orderId}</span>
                      )}
                    </div>

                    <button
                      type="button"
                      className="notif-dismiss-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onDismiss) onDismiss(notif._id);
                      }}
                      title="Dismiss notification"
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
