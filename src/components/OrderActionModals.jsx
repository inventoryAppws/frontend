import { useState } from "react";
import { X, AlertTriangle, RotateCcw, CheckCircle2 } from "lucide-react";
import { cancelCustomerOrder, requestOrderReturn } from "../services/orderService";
import { toast } from "./Toast";
import { getErrorMessage } from "../utils/errorHandler";

/**
 * CancelOrderModal
 * For cancelling placed / packed orders
 */
export function CancelOrderModal({ order, isOpen, onClose, onSuccess }) {
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !order) return null;

  const orderId = order.orderId || (order._id ? String(order._id).slice(-8).toUpperCase() : "ORD");

  const PRESET_REASONS = [
    "Changed my mind",
    "Ordered by mistake / duplicate item",
    "Found cheaper alternative elsewhere",
    "Delivery estimated time is too long",
    "Need to change shipping address or payment method",
    "Other reasons"
  ];

  const handleCancel = async (e) => {
    e.preventDefault();
    const finalReason = reason === "Other reasons" ? customReason.trim() : reason;
    if (!finalReason) {
      toast.error("Please choose or provide a cancellation reason");
      return;
    }

    setSubmitting(true);
    try {
      await cancelCustomerOrder(order._id, finalReason);
      toast.success(`Order #${orderId} has been successfully cancelled. Refund processed.`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="action-modal-overlay" onClick={onClose}>
      <div className="action-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="action-modal-header cancel-header">
          <div className="action-modal-header-icon cancel-icon">
            <AlertTriangle size={22} />
          </div>
          <div className="action-modal-header-text">
            <h3>Cancel Order #{orderId}</h3>
            <p>Are you sure you want to cancel this order? This action cannot be undone.</p>
          </div>
          <button type="button" className="action-modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleCancel} className="action-modal-body">
          <div className="action-modal-form-group">
            <label className="action-modal-label">Please select a reason for cancellation *</label>
            <div className="action-modal-radio-list">
              {PRESET_REASONS.map((r) => (
                <label key={r} className={`action-modal-radio-item ${reason === r ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="cancelReason"
                    value={r}
                    checked={reason === r}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>

          {reason === "Other reasons" && (
            <div className="action-modal-form-group" style={{ marginTop: "12px" }}>
              <label className="action-modal-label">Specify reason *</label>
              <textarea
                className="action-modal-textarea"
                rows="3"
                placeholder="Tell us more about why you're cancelling..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                required
              />
            </div>
          )}

          <div className="action-modal-info-alert">
            <span>ℹ️ If you paid via Online / Wallet, the full refund of ₹{Number(order.totalAmount || 0).toLocaleString("en-IN")} will be credited back instantly to your wallet.</span>
          </div>

          <div className="action-modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
              Keep Order
            </button>
            <button type="submit" className="btn btn-danger-cancel" disabled={submitting}>
              {submitting ? "Cancelling..." : "Confirm Cancellation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * ReturnOrderModal
 * For requesting returns / refunds on delivered orders
 */
export function ReturnOrderModal({ order, isOpen, onClose, onSuccess }) {
  const [reason, setReason] = useState("");
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !order) return null;

  const orderId = order.orderId || (order._id ? String(order._id).slice(-8).toUpperCase() : "ORD");

  const RETURN_REASONS = [
    "Defective or damaged product received",
    "Item does not match product description",
    "Wrong size or color delivered",
    "Missing accessories or parts in package",
    "Quality not as expected",
    "Other issue"
  ];

  const handleReturn = async (e) => {
    e.preventDefault();
    if (!reason) {
      toast.error("Please select a return reason");
      return;
    }

    setSubmitting(true);
    try {
      const response = await requestOrderReturn(order._id, reason, comments);
      toast.success(`Return request submitted for Order #${orderId}.`);
      if (onSuccess) onSuccess(response?.order || response);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="action-modal-overlay" onClick={onClose}>
      <div className="action-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="action-modal-header return-header">
          <div className="action-modal-header-icon return-icon">
            <RotateCcw size={22} />
          </div>
          <div className="action-modal-header-text">
            <h3>Request Return / Refund</h3>
            <p>Order #{orderId} • Eligible for full return &amp; refund</p>
          </div>
          <button type="button" className="action-modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleReturn} className="action-modal-body">
          <div className="action-modal-form-group">
            <label className="action-modal-label">Why are you returning this order? *</label>
            <div className="action-modal-radio-list">
              {RETURN_REASONS.map((r) => (
                <label key={r} className={`action-modal-radio-item ${reason === r ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="returnReason"
                    value={r}
                    checked={reason === r}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="action-modal-form-group" style={{ marginTop: "12px" }}>
            <label className="action-modal-label">Additional Comments / Details (Optional)</label>
            <textarea
              className="action-modal-textarea"
              rows="3"
              placeholder="Describe any specifics to help us process your return faster..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </div>

          <div className="action-modal-info-alert return-alert">
            <span>✨ Our courier partner will pickup the item within 24-48 hours. Refund will be credited upon pickup verification.</span>
          </div>

          <div className="action-modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Return Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
