import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "48px 24px", maxWidth: "560px", margin: "60px auto", textAlign: "center", background: "#ffffff", borderRadius: "12px", border: "1px solid #fee2e2", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)" }}>
          <div style={{ width: "48px", height: "48px", margin: "0 auto 16px", borderRadius: "50%", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626", fontSize: "24px" }}>
            ⚠
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", marginBottom: "8px" }}>Something went wrong</h2>
          <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "20px" }}>
            {this.state.error?.message || "An unexpected error occurred while loading this view."}
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{
              padding: "10px 24px",
              background: "#2563eb",
              color: "#ffffff",
              fontWeight: "600",
              fontSize: "14px",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer"
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

