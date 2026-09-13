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
  onConfirm,
  onCancel,
  danger = true,
  loading = false,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
    >

      <div className="confirm-modal">

        <button
          type="button"
          className="modal-close confirm-close"
          onClick={onCancel}
          disabled={loading}
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


        <div className="confirm-actions">

          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>


          <button
            type="button"
            className={
              danger
                ? "btn btn-danger"
                : "btn btn-primary"
            }
            onClick={onConfirm}
            disabled={loading}
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