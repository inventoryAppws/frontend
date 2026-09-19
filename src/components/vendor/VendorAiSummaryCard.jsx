import { useState, useEffect } from "react";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  PackageX,
  CheckCircle2,
  Clock,
  Package,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { getVendorAiSummary } from "../../services/vendorAiService";
import "../../styles/vendor-ai.css";

function getObservationIcon(iconName) {
  switch (iconName) {
    case "trending-up":
      return <TrendingUp size={18} className="ai-obs-icon" />;
    case "trending-down":
      return <TrendingDown size={18} className="ai-obs-icon" />;
    case "alert-triangle":
      return <AlertTriangle size={18} className="ai-obs-icon" />;
    case "clock":
      return <Clock size={18} className="ai-obs-icon" />;
    case "check-circle":
      return <CheckCircle2 size={18} className="ai-obs-icon" />;
    case "package":
      return <Package size={18} className="ai-obs-icon" />;
    default:
      return <Sparkles size={18} className="ai-obs-icon" />;
  }
}

export default function VendorAiSummaryCard() {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSummary = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const data = await getVendorAiSummary();
      setSummaryData(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const openAiDrawer = (query = "") => {
    window.dispatchEvent(
      new CustomEvent("open-vendor-ai", { detail: { query } })
    );
  };

  if (loading) {
    return (
      <div className="ai-summary-card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#64748b" }}>
          <Sparkles size={18} className="vendor-ai-pulse" />
          <span style={{ fontSize: "14px", fontWeight: 500 }}>
            Atlas AI is analyzing your catalog &amp; sales velocity...
          </span>
        </div>
      </div>
    );
  }

  if (!summaryData) return null;

  return (
    <div className="ai-summary-card">
      {/* HEADER */}
      <div className="ai-summary-header">
        <div className="ai-summary-title-wrap">
          <h2>Atlas AI Business Intelligence</h2>
          <span className="ai-summary-sparkle-badge">
            <Sparkles size={12} /> {summaryData.timeframe || "Live Advisor"}
          </span>
        </div>

        <div className="ai-summary-actions">
          <button
            type="button"
            className="ai-summary-ask-btn"
            onClick={() => openAiDrawer()}
          >
            <Sparkles size={14} />
            <span>Ask Atlas AI</span>
          </button>
          <button
            type="button"
            className="ai-summary-refresh-btn"
            onClick={() => fetchSummary(true)}
            title="Refresh Insights"
          >
            <RefreshCw size={14} className={refreshing ? "spin" : ""} />
          </button>
        </div>
      </div>

      {/* OBSERVATIONS GRID */}
      {Array.isArray(summaryData.observations) && summaryData.observations.length > 0 && (
        <div className="ai-summary-observations">
          {summaryData.observations.map((obs, idx) => (
            <div
              key={idx}
              className={`ai-obs-card ${obs.type || "info"}`}
              style={{ cursor: "pointer" }}
              onClick={() => openAiDrawer(`Tell me more about: ${obs.title}`)}
              title="Click to discuss with Atlas"
            >
              {getObservationIcon(obs.icon)}
              <div className="ai-obs-content">
                <strong>{obs.title}</strong>
                <p>{obs.text.replace(/\*\*/g, "")}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QUICK CHIPS */}
      {Array.isArray(summaryData.quickSuggestions) && summaryData.quickSuggestions.length > 0 && (
        <div className="ai-summary-quick-chips">
          <span>Ask Atlas:</span>
          {summaryData.quickSuggestions.map((sug, sIdx) => (
            <button
              key={sIdx}
              type="button"
              className="ai-quick-chip-btn"
              onClick={() => openAiDrawer(sug)}
            >
              {sug}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

