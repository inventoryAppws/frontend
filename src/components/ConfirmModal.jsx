import {
  AlertTriangle,
  X,
} from "lucide-react";

function ConfirmModal({
  isOpen,
  title = "Are you sure?",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  showCancel = true,
  onConfirm,
  onCancel,
  danger = true,
  loading = false,
  secondaryAction = null,
  children = null,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading && !secondaryAction?.loading) {
          onCancel();
        }
      }}
    >

      <div
        className="confirm-modal"
        style={secondaryAction ? { maxWidth: "460px" } : undefined}
      >

        <button
          type="button"
          className="modal-close confirm-close"
          onClick={onCancel}
          disabled={loading || secondaryAction?.loading}
        >
          <X size={19} />
        </button>


        <div
          className={`confirm-icon ${
            danger
              ? "confirm-icon-danger"
              : "confirm-icon-primary"
          }`}
        >
          <AlertTriangle size={25} />
        </div>


        <h2>
          {title}
        </h2>


        <p>
          {message}
        </p>

        {children}


        <div className="confirm-actions">

          {showCancel && cancelText && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={loading || secondaryAction?.loading}
              style={{ whiteSpace: "nowrap" }}
            >
              {cancelText}
            </button>
          )}

          {secondaryAction && (
            <button
              type="button"
              className={secondaryAction.className || "btn btn-outline"}
              onClick={secondaryAction.onClick}
              disabled={loading || secondaryAction?.loading}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                fontWeight: 600,
                whiteSpace: "nowrap",
                cursor:
                  loading || secondaryAction?.loading
                    ? "not-allowed"
                    : "pointer",
                ...secondaryAction.style,
              }}
            >
              {secondaryAction.icon}
              {secondaryAction.loading
                ? secondaryAction.loadingText || "Saving..."
                : secondaryAction.text}
            </button>
          )}

          <button
            type="button"
            className={
              danger
                ? "btn btn-danger"
                : "btn btn-primary"
            }
            onClick={onConfirm}
            disabled={loading || secondaryAction?.loading}
            style={{ whiteSpace: "nowrap" }}
          >
            {loading
              ? "Processing..."
              : confirmText}
          </button>

        </div>

      </div>

    </div>
  );
}

export default ConfirmModal;