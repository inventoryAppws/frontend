import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

let toastCounter = 0;

export const toast = {
  success: (message, title = "Success") => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("app-toast", {
          detail: { id: ++toastCounter, type: "success", title, message }
        })
      );
    }
  },
  error: (message, title = "Error") => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("app-toast", {
          detail: { id: ++toastCounter, type: "error", title, message }
        })
      );
    }
  },
  info: (message, title = "Info") => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("app-toast", {
          detail: { id: ++toastCounter, type: "info", title, message }
        })
      );
    }
  }
};

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToastEvent = (e) => {
      const newToast = e.detail;
      setToasts((prev) => [...prev, newToast]);

      // Auto dismiss after 3.8 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 3800);
    };

    window.addEventListener("app-toast", handleToastEvent);
    return () => window.removeEventListener("app-toast", handleToastEvent);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="global-toast-container" aria-live="polite">
      {toasts.map((t) => {
        const isSuccess = t.type === "success";
        const isError = t.type === "error";

        return (
          <div key={t.id} className={`global-toast-card ${t.type}`} role="alert">
            <div className="global-toast-icon-wrap">
              {isSuccess && <CheckCircle2 size={18} />}
              {isError && <AlertCircle size={18} />}
              {!isSuccess && !isError && <Info size={18} />}
            </div>

            <div className="global-toast-content">
              {t.title && <strong className="global-toast-title">{t.title}</strong>}
              <p className="global-toast-message">{t.message}</p>
            </div>

            <button
              type="button"
              className="global-toast-close"
              onClick={() => removeToast(t.id)}
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default ToastContainer;

