import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ShieldCheck,
  Wrench,
  Truck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  RefreshCw,
  Clock,
  User,
  Phone,
  MapPin,
  Calendar,
  ChevronRight,
  X,
  FileText,
  Sparkles,
  Check
} from 'lucide-react';
import Loader from '../../components/Loader';
import ErrorMessage from '../../components/ErrorMessage';
import Modal from '../../components/Modal';
import { toast } from '../../components/Toast';
import { API_BASE_URL } from '../../services/api';
import './VendorWarrantyClaims.css';

const STATUS_FILTERS = [
  { id: 'all', label: 'All Claims' },
  { id: 'submitted', label: 'Submitted (New)' },
  { id: 'pickup_scheduled', label: 'Pickup Scheduled' },
  { id: 'in_inspection', label: 'In Inspection' },
  { id: 'approved', label: 'Approved' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'rejected', label: 'Rejected' }
];

export default function VendorWarrantyClaims() {
  const [claims, setClaims] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    submitted: 0,
    pickup_scheduled: 0,
    in_inspection: 0,
    approved: 0,
    resolved: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected claim for Inspection Modal
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Form states inside modal
  const [technicianName, setTechnicianName] = useState('');
  const [technicianPhone, setTechnicianPhone] = useState('');
  const [scheduledSlot, setScheduledSlot] = useState('');
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [resolutionType, setResolutionType] = useState('repair');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);

  // Load claims from backend API
  const fetchClaims = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let url = `${API_BASE_URL}/warranties/vendor/claims`;
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery.trim()) params.append('q', searchQuery.trim());

      const token = localStorage.getItem('vendor_token') || localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${url}?${params.toString()}`, { headers });
      if (!res.ok) throw new Error('Failed to load warranty claims');

      const data = await res.json();
      setClaims(Array.isArray(data.claims) ? data.claims : []);
      if (data.summary) setSummary(data.summary);
    } catch (err) {
      console.error('fetchClaims error:', err);
      setError(err.message || 'Failed to fetch claims');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  // Open inspection modal and populate current claim data
  const handleOpenInspect = (claim) => {
    setSelectedClaim(claim);
    setTechnicianName(claim.technicianName || 'Rajesh Kumar (Apple & Samsung Certified)');
    setTechnicianPhone(claim.technicianPhone || '+91 98234 11223');
    setScheduledSlot(claim.pickupSlot || 'Tomorrow, 10:00 AM - 1:00 PM');
    setInspectionNotes(claim.inspectionNotes || '');
    setResolutionType(claim.serviceType || 'repair');
    setResolutionNotes(claim.resolutionNotes || '');
    setRejectionReason('');
    setShowRejectBox(false);
  };

  // Perform claim action (Schedule, In-Inspection, Approve, Resolve, Reject)
  const handleUpdateClaim = async (newStatus, extraPayload = {}) => {
    if (!selectedClaim) return;
    setModalLoading(true);
    try {
      const token = localStorage.getItem('vendor_token') || localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const payload = {
        status: newStatus,
        technicianName,
        technicianPhone,
        inspectionNotes,
        resolutionType,
        resolutionNotes,
        ...extraPayload
      };

      const res = await fetch(`${API_BASE_URL}/warranties/claims/${selectedClaim.claimId || selectedClaim._id}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to update claim status');

      const updated = await res.json();
      setSelectedClaim(updated);
      toast.success(`Claim ${updated.claimId} updated to ${newStatus.replace('_', ' ').toUpperCase()}!`);
      fetchClaims();
    } catch (err) {
      console.error('handleUpdateClaim error:', err);
      toast.error(err.message || 'Failed to update claim');
    } finally {
      setModalLoading(false);
    }
  };

  // Format date helper
  const formatDate = (d) => {
    if (!d) return 'Recent';
    try {
      return new Date(d).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="vwc-page">
      {/* Header */}
      <div className="vwc-header">
        <div className="vwc-header-left">
          <h1>Warranty &amp; RMA Claims Inspection</h1>
          <p>Review customer warranty claims, schedule technician doorstep pickups, log diagnostics, and approve replacements.</p>
        </div>
        <button type="button" className="vwc-refresh-btn" onClick={fetchClaims} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div className="vwc-kpi-grid">
        <div className="vwc-kpi-card">
          <div className="vwc-kpi-icon blue">
            <ShieldCheck size={22} />
          </div>
          <div className="vwc-kpi-info">
            <span className="vwc-kpi-val">{summary.total || claims.length}</span>
            <span className="vwc-kpi-label">Total Claims</span>
          </div>
        </div>

        <div className="vwc-kpi-card">
          <div className="vwc-kpi-icon amber">
            <Clock size={22} />
          </div>
          <div className="vwc-kpi-info">
            <span className="vwc-kpi-val">{summary.submitted || 0}</span>
            <span className="vwc-kpi-label">Awaiting Pickup</span>
          </div>
        </div>

        <div className="vwc-kpi-card">
          <div className="vwc-kpi-icon purple">
            <Wrench size={22} />
          </div>
          <div className="vwc-kpi-info">
            <span className="vwc-kpi-val">{summary.in_inspection || 0}</span>
            <span className="vwc-kpi-label">In Diagnostic</span>
          </div>
        </div>

        <div className="vwc-kpi-card">
          <div className="vwc-kpi-icon emerald">
            <CheckCircle2 size={22} />
          </div>
          <div className="vwc-kpi-info">
            <span className="vwc-kpi-val">{summary.approved || 0}</span>
            <span className="vwc-kpi-label">Approved Replacements</span>
          </div>
        </div>

        <div className="vwc-kpi-card">
          <div className="vwc-kpi-icon slate">
            <Truck size={22} />
          </div>
          <div className="vwc-kpi-info">
            <span className="vwc-kpi-val">{summary.resolved || 0}</span>
            <span className="vwc-kpi-label">Resolved &amp; Delivered</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="vwc-toolbar">
        <div className="vwc-search-box">
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search by Claim ID, Product Name, Serial No, or Customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="vwc-status-tabs">
          {STATUS_FILTERS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`vwc-status-tab ${statusFilter === tab.id ? 'active' : ''}`}
              onClick={() => setStatusFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && <ErrorMessage message={error} onRetry={fetchClaims} />}

      {/* Loading state */}
      {loading ? (
        <Loader message="Loading warranty claims queue..." />
      ) : claims.length === 0 ? (
        <div style={{ background: '#ffffff', border: '1.5px dashed #cbd5e1', borderRadius: '16px', padding: '48px 24px', textAlign: 'center', color: '#64748b' }}>
          <ShieldCheck size={48} style={{ margin: '0 auto 12px', color: '#94a3b8' }} />
          <h3 style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '17px', fontWeight: 700 }}>No Warranty Claims Found</h3>
          <p style={{ margin: 0, fontSize: '13px' }}>
            {statusFilter !== 'all' ? `No claims currently in "${statusFilter}" status.` : 'No warranty claims have been submitted for your products yet.'}
          </p>
        </div>
      ) : (
        /* Claims List */
        <div className="vwc-claims-list">
          {claims.map((c) => {
            const statusClass = c.status || 'submitted';
            return (
              <div key={c._id || c.claimId} className="vwc-claim-card">
                <div className="vwc-claim-row-top">
                  <div className="vwc-product-meta">
                    <img
                      src={c.productImage || (c.productId && c.productId.image) || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200'}
                      alt={c.productName}
                      className="vwc-product-thumb"
                    />
                    <div className="vwc-product-info">
                      <div className="vwc-badge-row">
                        <span className="vwc-claim-id-pill">{c.claimId}</span>
                        <span className="vwc-service-type-pill">{c.serviceType || 'REPAIR'}</span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#6366f1', background: '#eef2ff', padding: '2px 8px', borderRadius: '6px' }}>
                          {c.issueCategory || 'Hardware Defect'}
                        </span>
                      </div>
                      <h3 className="vwc-product-name">{c.productName}</h3>
                      <div className="vwc-serial-code">Serial: <code>{c.serialNumber || 'SN-WRT-IN'}</code></div>
                    </div>
                  </div>

                  <span className={`vwc-claim-status-badge ${statusClass}`}>
                    ● {statusClass.replace('_', ' ')}
                  </span>
                </div>

                {/* Details Grid */}
                <div className="vwc-claim-details-grid">
                  <div className="vwc-detail-item">
                    <strong>Customer</strong>
                    <span>{c.customerName || (c.customerId && c.customerId.name) || 'Customer'}</span>
                  </div>
                  <div className="vwc-detail-item">
                    <strong>Phone Contact</strong>
                    <span>{c.customerPhone || (c.customerId && c.customerId.phone) || '+91 98765 43210'}</span>
                  </div>
                  <div className="vwc-detail-item">
                    <strong>Pickup Window</strong>
                    <span>{c.pickupSlot || 'Tomorrow, 10:00 AM - 1:00 PM'}</span>
                  </div>
                  <div className="vwc-detail-item">
                    <strong>Assigned Technician</strong>
                    <span>{c.technicianName || 'Not Assigned Yet'}</span>
                  </div>
                </div>

                {/* Customer's Reported Defect */}
                <div className="vwc-defect-desc-box">
                  <div className="vwc-defect-label">Reported Defect &amp; Symptoms:</div>
                  <p className="vwc-defect-text">{c.issueDescription || 'No description provided.'}</p>
                </div>

                {/* Footer with action */}
                <div className="vwc-claim-footer">
                  <span className="vwc-claim-date">Raised on {formatDate(c.createdAt)}</span>
                  <button
                    type="button"
                    className="vwc-inspect-btn"
                    onClick={() => handleOpenInspect(c)}
                  >
                    <span>Inspect &amp; Manage Claim</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inspection & Management Modal */}
      {selectedClaim && (
        <Modal
          isOpen={Boolean(selectedClaim)}
          onClose={() => setSelectedClaim(null)}
          title={`Inspect Warranty Claim — ${selectedClaim.claimId}`}
          maxWidth="760px"
        >
          <div className="vwc-modal-body">
            {/* Header info banner */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: '#f8fafc', borderRadius: '12px', marginBottom: '18px', border: '1px solid #e2e8f0' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '15px', color: '#0f172a' }}>{selectedClaim.productName}</strong>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Serial: <code>{selectedClaim.serialNumber || 'N/A'}</code> • Service: <strong>{selectedClaim.serviceType?.toUpperCase()}</strong></span>
              </div>
              <span className={`vwc-claim-status-badge ${selectedClaim.status}`}>
                ● {selectedClaim.status?.replace('_', ' ')}
              </span>
            </div>

            {/* Customer Issue Details */}
            <div className="vwc-modal-section">
              <h4 className="vwc-section-title">
                <FileText size={16} color="#6366f1" />
                <span>Customer Defect Description</span>
              </h4>
              <div style={{ background: '#f1f5f9', padding: '12px 14px', borderRadius: '8px', fontSize: '13px', color: '#334155', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                {selectedClaim.issueDescription}
              </div>
            </div>

            {/* Section 1: Technician Dispatch */}
            <div className="vwc-modal-section">
              <h4 className="vwc-section-title">
                <Truck size={16} color="#d97706" />
                <span>Doorstep Pickup &amp; Technician Assignment</span>
              </h4>
              <div className="vwc-form-grid">
                <div className="vwc-form-group">
                  <label>Technician / Engineer Name</label>
                  <input
                    type="text"
                    value={technicianName}
                    onChange={(e) => setTechnicianName(e.target.value)}
                    placeholder="e.g. Rajesh Kumar"
                  />
                </div>
                <div className="vwc-form-group">
                  <label>Technician Phone Number</label>
                  <input
                    type="text"
                    value={technicianPhone}
                    onChange={(e) => setTechnicianPhone(e.target.value)}
                    placeholder="e.g. +91 98234 11223"
                  />
                </div>
              </div>
              <div className="vwc-form-group">
                <label>Doorstep Pickup Slot</label>
                <input
                  type="text"
                  value={scheduledSlot}
                  onChange={(e) => setScheduledSlot(e.target.value)}
                  placeholder="e.g. Tomorrow, 10:00 AM - 1:00 PM"
                />
              </div>
              <div style={{ marginTop: '10px' }}>
                <button
                  type="button"
                  className="vwc-action-btn schedule"
                  disabled={modalLoading}
                  onClick={() => handleUpdateClaim('pickup_scheduled', { pickupSlot: scheduledSlot })}
                >
                  <Truck size={15} />
                  <span>Confirm Pickup &amp; Dispatch Technician</span>
                </button>
              </div>
            </div>

            {/* Section 2: Diagnostic Inspection */}
            <div className="vwc-modal-section">
              <h4 className="vwc-section-title">
                <Wrench size={16} color="#7c3aed" />
                <span>Hardware Diagnostic Findings</span>
              </h4>
              <div className="vwc-form-group">
                <label>Diagnostic Test Notes &amp; Component Health</label>
                <textarea
                  rows={3}
                  value={inspectionNotes}
                  onChange={(e) => setInspectionNotes(e.target.value)}
                  placeholder="e.g. Inspected display connector and power IC. Hardware component malfunction verified. Chassis in pristine condition with zero liquid ingress."
                />
              </div>
              <div style={{ marginTop: '10px' }}>
                <button
                  type="button"
                  className="vwc-action-btn inspect"
                  disabled={modalLoading || !inspectionNotes.trim()}
                  onClick={() => handleUpdateClaim('in_inspection')}
                >
                  <Wrench size={15} />
                  <span>Record Diagnostics &amp; Mark In-Inspection</span>
                </button>
              </div>
            </div>

            {/* Section 3: Decisions & Resolution */}
            <div className="vwc-modal-section">
              <h4 className="vwc-section-title">
                <CheckCircle2 size={16} color="#059669" />
                <span>Warranty Resolution Decision</span>
              </h4>

              <div className="vwc-modal-actions">
                <button
                  type="button"
                  className="vwc-action-btn approve"
                  disabled={modalLoading}
                  onClick={() => handleUpdateClaim('approved', {
                    resolutionType: selectedClaim.serviceType,
                    resolutionNotes: 'Genuine OEM replacement/repair authorized under manufacturer warranty.'
                  })}
                >
                  <Check size={16} />
                  <span>Approve Free {selectedClaim.serviceType?.toUpperCase()}</span>
                </button>

                <button
                  type="button"
                  className="vwc-action-btn resolve"
                  disabled={modalLoading}
                  onClick={() => handleUpdateClaim('resolved', {
                    resolutionNotes: 'Device repair/replacement complete. Dispatched via courier to customer doorstep.'
                  })}
                >
                  <Truck size={16} />
                  <span>Mark Resolved &amp; Dispatched</span>
                </button>

                <button
                  type="button"
                  className="vwc-action-btn reject"
                  disabled={modalLoading}
                  onClick={() => setShowRejectBox(!showRejectBox)}
                >
                  <XCircle size={16} />
                  <span>Reject Claim</span>
                </button>
              </div>

              {/* Rejection justification prompt */}
              {showRejectBox && (
                <div style={{ marginTop: '12px', padding: '14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#dc2626', marginBottom: '6px' }}>
                    Reason for Warranty Rejection *
                  </label>
                  <textarea
                    rows={2}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Inspection detected internal liquid corrosion and fractured glass, which is excluded from standard manufacturer warranty."
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #fca5a5', fontSize: '12.5px', outline: 'none' }}
                  />
                  <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="vwc-action-btn reject"
                      disabled={modalLoading || !rejectionReason.trim()}
                      onClick={() => handleUpdateClaim('rejected', { resolutionNotes: rejectionReason })}
                    >
                      Confirm Rejection
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRejectBox(false)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#64748b' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Section 4: Full Audit Trail & Timeline */}
            <div className="vwc-modal-section">
              <h4 className="vwc-section-title">
                <Clock size={16} color="#64748b" />
                <span>Claim Timeline &amp; History</span>
              </h4>

              <div className="vwc-timeline-list">
                {(selectedClaim.timeline || []).map((t, idx) => (
                  <div key={idx} className="vwc-timeline-item">
                    <div className="vwc-timeline-node">
                      {idx + 1}
                    </div>
                    <div className="vwc-timeline-content">
                      <div className="vwc-timeline-header">
                        <span className="vwc-timeline-status">{t.status?.replace('_', ' ')}</span>
                        <span className="vwc-timeline-time">{formatDate(t.timestamp)}</span>
                      </div>
                      <p className="vwc-timeline-note">{t.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

