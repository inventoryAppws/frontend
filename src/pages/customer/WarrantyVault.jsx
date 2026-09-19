import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Award,
  Wrench,
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Printer,
  ChevronRight,
  Plus,
  X,
  Search,
  Sparkles,
  RefreshCw,
  PackageOpen,
  Truck,
  Phone,
  UserCheck,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Copy,
  Check
} from 'lucide-react';
import WarrantyCertificateModal from '../../components/warranty/WarrantyCertificateModal';
import RaiseClaimModal from '../../components/warranty/RaiseClaimModal';
import { API_BASE_URL } from '../../services/api';
import './WarrantyVault.css';

function ClaimTrackerCard({ claim }) {
  const [copied, setCopied] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCopyId = (e) => {
    if (e) e.stopPropagation();
    if (claim.claimId) {
      navigator.clipboard.writeText(claim.claimId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const status = (claim.status || 'submitted').toLowerCase();

  // Progress steps
  const steps = [
    { key: 'submitted', label: 'Claim Lodged', desc: 'Request verified' },
    { key: 'pickup_scheduled', label: 'Doorstep Pickup', desc: claim.pickupSlot || 'Assigned' },
    { key: 'in_inspection', label: 'Lab Diagnostics', desc: 'Hardware test' },
    {
      key: status === 'rejected' ? 'rejected' : 'approved',
      label: status === 'rejected' ? 'Claim Rejected' : 'Approval',
      desc: status === 'rejected' ? 'Defect out of policy' : `${(claim.serviceType || 'Repair').toUpperCase()} Approved`
    },
    { key: 'resolved', label: 'Fulfilled', desc: 'Device restored/delivered' }
  ];

  let activeIndex = 0;
  if (status === 'pickup_scheduled') activeIndex = 1;
  else if (status === 'in_inspection') activeIndex = 2;
  else if (status === 'approved' || status === 'rejected') activeIndex = 3;
  else if (status === 'resolved') activeIndex = 4;

  const getStatusBadge = () => {
    switch (status) {
      case 'submitted':
        return { label: 'Awaiting Vendor Pickup', bg: '#fef3c7', color: '#b45309', border: '#fde68a' };
      case 'pickup_scheduled':
        return { label: 'Doorstep Pickup Scheduled', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
      case 'in_inspection':
        return { label: 'In Lab Diagnostic Testing', bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' };
      case 'approved':
        return { label: 'Claim Approved (Replacement/Repair)', bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' };
      case 'rejected':
        return { label: 'Claim Rejected', bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
      case 'resolved':
        return { label: 'Claim Resolved & Closed', bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' };
      default:
        return { label: claim.status, bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
    }
  };

  const badge = getStatusBadge();
  const timeline = Array.isArray(claim.timeline) ? claim.timeline : [];

  return (
    <div className={`wv-claim-card ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* Clickable Compact Card Header / Bar */}
      <div
        className="wv-claim-summary-bar"
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
        aria-expanded={isExpanded}
      >
        <div className="wv-claim-summary-left">
          <img
            src={claim.productImage || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200'}
            alt={claim.productName || 'Product'}
            className="wv-claim-prod-thumb-compact"
          />

          <div className="wv-claim-summary-details">
            <div className="wv-claim-summary-row1">
              <div className="wv-claim-id-wrap" onClick={(e) => e.stopPropagation()}>
                <span className="wv-claim-id-badge">{claim.claimId || '#CLM-8921'}</span>
                <button
                  type="button"
                  className="wv-copy-id-btn"
                  onClick={handleCopyId}
                  title="Copy Claim Reference ID"
                >
                  {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <span className="wv-claim-type-tag">
                {claim.serviceType ? claim.serviceType.toUpperCase() : 'FREE REPAIR'} CLAIM
              </span>

              <span className="wv-claim-date-inline">
                • Lodged {claim.createdAt ? new Date(claim.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently'}
              </span>
            </div>

            <div className="wv-claim-summary-row2">
              <h4 className="wv-claim-summary-prod-name">{claim.productName || 'Registered Device'}</h4>
              {claim.serialNumber && (
                <span className="wv-claim-serial">SN: {claim.serialNumber}</span>
              )}
              <span className="wv-claim-issue-tag">
                Issue: {claim.issueCategory || 'Hardware Defect'}
              </span>
            </div>

            {!isExpanded && (
              <div className="wv-claim-summary-row3">
                <span className="wv-claim-preview-desc">
                  <strong>Report: </strong>
                  {claim.issueDescription || claim.description || 'Inspection requested under verified warranty terms.'}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="wv-claim-summary-right" onClick={(e) => e.stopPropagation()}>
          <div
            className="wv-claim-status-pill-custom"
            style={{
              background: badge.bg,
              color: badge.color,
              borderColor: badge.border
            }}
          >
            ● {badge.label}
          </div>

          <button
            type="button"
            className="wv-claim-toggle-expand-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? 'Collapse claim details' : 'Expand claim details'}
          >
            <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
            <ChevronDown size={16} className={`wv-claim-chevron ${isExpanded ? 'rotated' : ''}`} />
          </button>
        </div>
      </div>

      {/* Expanded Detailed Content */}
      {isExpanded && (
        <div className="wv-claim-expanded-content">
          {/* Detailed Customer Report & Issue Banner */}
          <div className="wv-claim-report-box">
            <div className="wv-claim-report-header">
              <div className="wv-claim-report-title">
                <strong>Detailed Customer Report</strong>
                <span className="wv-claim-report-cat-badge">{claim.issueCategory || 'Hardware Defect'}</span>
              </div>
              {claim.pickupSlot && (
                <span className="wv-claim-report-slot">
                  <Truck size={13} color="#2563eb" /> {claim.pickupSlot}
                </span>
              )}
            </div>
            <p className="wv-claim-desc-text">
              {claim.issueDescription || claim.description || 'Inspection requested under verified warranty terms.'}
            </p>

            {/* Attached Proof Photos */}
            {claim.photos && claim.photos.length > 0 && (
              <div className="wv-claim-photos-strip">
                <span className="wv-claim-photos-title">Attached Evidence ({claim.photos.length}):</span>
                <div className="wv-claim-photos-list">
                  {claim.photos.map((photo, pIdx) => (
                    <a
                      key={pIdx}
                      href={photo}
                      target="_blank"
                      rel="noreferrer"
                      className="wv-claim-photo-link"
                      title="Click to view full image"
                    >
                      <img src={photo} alt={`Proof ${pIdx + 1}`} className="wv-claim-photo-img" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Progress Stepper */}
          <div className="wv-claim-stepper-wrap">
            <div className="wv-stepper-track">
              {steps.map((step, idx) => {
                const isCompleted = idx < activeIndex;
                const isCurrent = idx === activeIndex;
                return (
                  <div
                    key={step.key}
                    className={`wv-stepper-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                  >
                    <div className="wv-step-dot">
                      {isCompleted ? (
                        <CheckCircle2 size={16} className="wv-step-icon-done" />
                      ) : isCurrent ? (
                        <span className="wv-step-pulse-ring" />
                      ) : (
                        <span className="wv-step-num">{idx + 1}</span>
                      )}
                    </div>
                    <div className="wv-step-content">
                      <div className="wv-step-label">{step.label}</div>
                      <div className="wv-step-sub">{step.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detail Cards Grid */}
          <div className="wv-claim-details-grid">
            {/* Doorstep Technician & Pickup Card */}
            <div className="wv-claim-subcard">
              <div className="wv-subcard-title">
                <Truck size={15} color="#2563eb" />
                <span>Doorstep Logistics</span>
              </div>
              <div className="wv-subcard-content">
                <div className="wv-subcard-item">
                  <span className="wv-subcard-k">Pickup Window:</span>
                  <span className="wv-subcard-v font-bold">{claim.pickupSlot || 'Tomorrow, 10:00 AM - 1:00 PM'}</span>
                </div>
                <div className="wv-subcard-item">
                  <span className="wv-subcard-k">Field Technician:</span>
                  <span className="wv-subcard-v">
                    {claim.technicianName ? (
                      <span className="wv-tech-name-pill">
                        <UserCheck size={13} color="#10b981" /> {claim.technicianName}
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>Awaiting technician dispatch</span>
                    )}
                  </span>
                </div>
                {claim.technicianPhone && (
                  <div className="wv-subcard-item">
                    <span className="wv-subcard-k">Direct Contact:</span>
                    <a href={`tel:${claim.technicianPhone}`} className="wv-tech-phone-link">
                      <Phone size={13} /> {claim.technicianPhone}
                    </a>
                  </div>
                )}
                {claim.pickupAddress && (
                  <div className="wv-subcard-item">
                    <span className="wv-subcard-k">Pickup Address:</span>
                    <span className="wv-subcard-v text-muted">{claim.pickupAddress}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Diagnostic Lab Inspection Card */}
            <div className="wv-claim-subcard">
              <div className="wv-subcard-title">
                <Wrench size={15} color="#7c3aed" />
                <span>Vendor Lab Diagnostics</span>
              </div>
              <div className="wv-subcard-content">
                {claim.inspectionNotes ? (
                  <div className="wv-inspection-report-box">
                    <div className="wv-inspection-header">
                      <ShieldCheck size={14} color="#7c3aed" />
                      <span>Certified Technical Finding:</span>
                    </div>
                    <p className="wv-inspection-notes-text">{claim.inspectionNotes}</p>
                  </div>
                ) : status === 'in_inspection' ? (
                  <div className="wv-inspection-pending">
                    <RefreshCw size={18} className="spin" color="#7c3aed" />
                    <p>Hardware diagnostics in progress by authorized vendor technicians. Comprehensive benchmark test in flight.</p>
                  </div>
                ) : (
                  <p className="wv-inspection-waiting">
                    Diagnostics report will appear here once the device reaches the service lab.
                  </p>
                )}

                {/* Resolution banner if approved or resolved */}
                {(claim.resolutionType || claim.resolutionNotes || status === 'approved' || status === 'resolved') && (
                  <div className="wv-resolution-tag-box">
                    <div className="wv-resolution-header">
                      <CheckCircle2 size={14} color="#059669" />
                      <strong>Adjudication: {claim.resolutionType ? claim.resolutionType.toUpperCase() : 'FREE REPLACEMENT / REPAIR APPROVED'}</strong>
                    </div>
                    {claim.resolutionNotes && (
                      <p className="wv-resolution-notes">{claim.resolutionNotes}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Audit Timeline Accordion */}
          {timeline.length > 0 && (
            <div className="wv-claim-timeline-section">
              <button
                type="button"
                className="wv-timeline-toggle-btn"
                onClick={() => setShowTimeline(!showTimeline)}
              >
                <span>Live Audit Trail ({timeline.length} milestone{timeline.length > 1 ? 's' : ''})</span>
                {showTimeline ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>

              {showTimeline && (
                <div className="wv-claim-timeline-list">
                  {timeline.map((event, tIdx) => (
                    <div key={tIdx} className="wv-timeline-row">
                      <div className="wv-timeline-bullet" />
                      <div className="wv-timeline-body">
                        <div className="wv-timeline-top">
                          <span className="wv-timeline-status-badge">{event.status?.replace('_', ' ').toUpperCase()}</span>
                          <span className="wv-timeline-time">
                            {event.timestamp ? new Date(event.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : 'Logged'}
                          </span>
                        </div>
                        <p className="wv-timeline-note">{event.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Bottom Collapse Button */}
          <div className="wv-claim-collapse-footer">
            <button
              type="button"
              className="wv-claim-collapse-btn"
              onClick={() => setIsExpanded(false)}
            >
              <ChevronUp size={14} />
              <span>Collapse Details</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WarrantyVault() {
  const [warranties, setWarranties] = useState([]);
  const [claims, setClaims] = useState([]);
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'expired', 'claims'
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedWarrantyForCert, setSelectedWarrantyForCert] = useState(null);
  const [selectedWarrantyForClaim, setSelectedWarrantyForClaim] = useState(null);

  // Register Device Modal state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [catalogDevices, setCatalogDevices] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [regSearch, setRegSearch] = useState('');
  const [selectedProductForReg, setSelectedProductForReg] = useState(null);
  const [customDeviceName, setCustomDeviceName] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [customSerial, setCustomSerial] = useState('');
  const [regWarrantyMonths, setRegWarrantyMonths] = useState(12);
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);
  const [regError, setRegError] = useState('');

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  const getCustomerQuery = () => {
    try {
      const cust = JSON.parse(localStorage.getItem('customer_profile') || '{}');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const id = cust?._id || user?._id || user?.id;
      return id ? `?customerId=${id}` : '';
    } catch {
      return '';
    }
  };

  useEffect(() => {
    fetchWarranties();
    fetchClaims();
  }, []);

  const fetchWarranties = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/warranties${getCustomerQuery()}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setWarranties(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('fetchWarranties error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClaims = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/warranties/claims${getCustomerQuery()}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setClaims(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('fetchClaims error:', err);
    }
  };

  const openRegisterModal = async () => {
    setIsRegisterModalOpen(true);
    setRegError('');
    if (catalogDevices.length === 0) {
      setLoadingCatalog(true);
      try {
        const res = await fetch(`${API_BASE_URL}/products/public?limit=60`);
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : data.products || data.items || [];
          const techItems = items.filter((p) => {
            const cat = (p.category || '').toLowerCase();
            const name = (p.name || '').toLowerCase();
            return (
              /electronic|mobile|laptop|appliance|gadget|audio|camera|television|computer/.test(cat) ||
              /phone|tv|laptop|macbook|sony|samsung|headphone|earbud|airpod|dell|lenovo|smartwatch|console|playstation|power bank/.test(name) ||
              (p.warranty && !/food|beverage|grocer|fruit|milk/.test(cat))
            );
          });
          setCatalogDevices(techItems.length > 0 ? techItems : items.slice(0, 15));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCatalog(false);
      }
    }
  };

  const handleSelectCatalogProduct = (prod) => {
    setSelectedProductForReg(prod);
    setCustomDeviceName(prod.name);
    setCustomBrand(prod.brand || prod.name.split(' ')[0] || 'Brand');
    const brandCode = (prod.brand || 'TECH').substring(0, 4).toUpperCase();
    setCustomSerial(`SN-${brandCode}-${Math.floor(10000 + Math.random() * 90000)}-IN`);
    const m = prod.warranty && prod.warranty.includes('2 Year') ? 24 : prod.warranty && prod.warranty.includes('3 Year') ? 36 : 12;
    setRegWarrantyMonths(m);
  };

  const handleGenerateRandomSerial = () => {
    const brandCode = (customBrand || 'TECH').substring(0, 4).toUpperCase();
    setCustomSerial(`SN-${brandCode}-${Math.floor(10000 + Math.random() * 90000)}-IN`);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!customDeviceName.trim()) {
      setRegError('Please provide a product/device name.');
      return;
    }
    setIsSubmittingReg(true);
    setRegError('');

    try {
      const serial = customSerial.trim() || `SN-${(customBrand || 'TECH').substring(0, 4).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}-IN`;
      const res = await fetch(`${API_BASE_URL}/warranties/register`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          productId: selectedProductForReg?._id || null,
          productName: customDeviceName.trim(),
          productImage: selectedProductForReg?.image || (selectedProductForReg?.images && selectedProductForReg?.images[0]) || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700',
          brand: customBrand.trim() || 'Brand',
          serialNumber: serial,
          warrantyMonths: Number(regWarrantyMonths) || 12,
          purchasedDate: new Date(),
          deliveryDate: new Date()
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.msg || 'Failed to register warranty');
      }

      await fetchWarranties();
      setActiveTab('active');
      setIsRegisterModalOpen(false);
      setSelectedProductForReg(null);
      setCustomDeviceName('');
      setCustomBrand('');
      setCustomSerial('');
    } catch (err) {
      console.error(err);
      setRegError(err.message);
    } finally {
      setIsSubmittingReg(false);
    }
  };

  const getExpiryDate = (w) => {
    const raw = w.expiresDate || w.expiryDate;
    if (!raw) return null;
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  };

  const activeWarranties = warranties.filter((w) => {
    const d = getExpiryDate(w);
    if (d && d <= new Date()) return false;
    return w.status !== 'expired';
  });

  const expiredWarranties = warranties.filter((w) => {
    const d = getExpiryDate(w);
    return w.status === 'expired' || (d && d <= new Date());
  });

  const filteredCatalogDevices = catalogDevices.filter((p) => {
    if (!regSearch.trim()) return true;
    const q = regSearch.toLowerCase();
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.brand || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="wv-page-container">
      {/* Hero Section */}
      <div className="wv-hero-card">
        <div className="wv-hero-info">
          <span className="wv-badge">🛡️ Official Protection Vault</span>
          <h1 className="wv-hero-title">Digital Warranty Vault</h1>
          <p className="wv-hero-desc">
            All your electronic and home appliance warranties automatically tracked from your order delivery date. Never lose an invoice or serial card again.
          </p>
        </div>

        <div className="wv-stats-grid">
          <div className="wv-stat-box">
            <span className="wv-stat-val text-emerald">{activeWarranties.length}</span>
            <span className="wv-stat-label">Active Guarantees</span>
          </div>
          <div className="wv-stat-box">
            <span className="wv-stat-val text-amber">{claims.length}</span>
            <span className="wv-stat-label">Claims In-Flight</span>
          </div>
          <div className="wv-stat-box">
            <span className="wv-stat-val text-indigo">100%</span>
            <span className="wv-stat-label">Doorstep Pickup</span>
          </div>
        </div>
      </div>

      {/* Tabs Bar & Register Button */}
      <div className="wv-tabs-bar">
        <div className="wv-tabs-left">
          <button
            className={`wv-tab-btn ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            <ShieldCheck size={16} /> Active Coverage ({activeWarranties.length})
          </button>
          <button
            className={`wv-tab-btn ${activeTab === 'claims' ? 'active' : ''}`}
            onClick={() => setActiveTab('claims')}
          >
            <Wrench size={16} /> My Service Claims ({claims.length})
          </button>
          <button
            className={`wv-tab-btn ${activeTab === 'expired' ? 'active' : ''}`}
            onClick={() => setActiveTab('expired')}
          >
            <Clock size={16} /> Expired Records ({expiredWarranties.length})
          </button>
        </div>

        {/* Register Device Button */}
        <button
          type="button"
          className="wv-register-top-btn"
          onClick={openRegisterModal}
          title="Register a new device or appliance warranty"
        >
          <Plus size={15} />
          <span>Add Device to Vault</span>
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
          <RefreshCw size={32} className="spin" style={{ margin: '0 auto 12px', display: 'block', color: '#2563eb' }} />
          <p style={{ fontSize: '14px', fontWeight: 600 }}>Loading active warranty records...</p>
        </div>
      ) : (activeTab === 'active' || activeTab === 'expired') && (
        (activeTab === 'active' ? activeWarranties : expiredWarranties).length === 0 ? (
          <div className="wv-empty-warranties-card">
            <ShieldCheck size={48} color="#94a3b8" />
            <h3>No {activeTab} device warranties found</h3>
            <p>
              Your digital guarantees will appear here automatically when electronics or appliances are delivered. You can also manually register any device.
            </p>
            <button
              type="button"
              className="wv-add-device-btn"
              onClick={openRegisterModal}
            >
              <Plus size={16} />
              <span>Add Device to Warranty Vault</span>
            </button>
          </div>
        ) : (
          <div className="wv-cards-grid">
            {(activeTab === 'active' ? activeWarranties : expiredWarranties).map((w) => {
              const expDate = getExpiryDate(w);
              const daysLeft = expDate
                ? Math.max(0, Math.ceil((expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                : 365;
              const isExp = expDate ? expDate.getTime() <= Date.now() : false;

              const deliveryDateObj = w.deliveryDate ? new Date(w.deliveryDate) : null;
              const deliveryFormatted = deliveryDateObj && !isNaN(deliveryDateObj.getTime())
                ? deliveryDateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'Recent Order';

              const expiryFormatted = expDate
                ? expDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                : '1 Year Coverage';

              return (
                <div key={w._id || w.id} className="wv-card">
                  <div className="wv-card-top">
                    <img
                      src={w.productImage || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200'}
                      alt={w.productName}
                      className="wv-thumb"
                    />
                    <div className="wv-card-title-block">
                      <div className="wv-card-tags">
                        <span className={`wv-status-tag ${isExp ? 'expired' : 'active'}`}>
                          {isExp ? '● Expired' : '● Active Coverage'}
                        </span>
                        <span className="wv-duration-pill">{w.warrantyMonths || 12} Months Policy</span>
                      </div>
                      <h3 className="wv-product-name">{w.productName}</h3>
                      <div className="wv-serial-row">
                        <span>Serial Number:</span>
                        <code>{w.serialNumber}</code>
                      </div>
                    </div>
                  </div>

                  <div className="wv-card-dates-box">
                    <div className="wv-date-row">
                      <span className="wv-date-label">Delivered on:</span>
                      <span className="wv-date-val">{deliveryFormatted}</span>
                    </div>
                    <div className="wv-date-row">
                      <span className="wv-date-label">Coverage Valid Until:</span>
                      <span className="wv-date-val highlight">
                        {expiryFormatted}
                        {!isExp && (
                          <span className="wv-days-badge">({daysLeft} days remaining)</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="wv-card-actions">
                    <button
                      className="wv-cert-btn"
                      onClick={() => setSelectedWarrantyForCert(w)}
                    >
                      <FileText size={15} /> Digital Certificate
                    </button>

                    {!isExp && (
                      <button
                        className="wv-claim-btn"
                        onClick={() => setSelectedWarrantyForClaim(w)}
                      >
                        <Wrench size={15} /> Raise Claim
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Tab Content: Claims History */}
      {activeTab === 'claims' && (
        <div className="wv-claims-container">
          <div className="wv-claims-header-row">
            <div>
              <h3 className="wv-claims-sec-title">Live Service & RMA Claims</h3>
              <p className="wv-claims-sec-sub">
                Track doorstep pickup, authorized technician assignments, diagnostics lab notes, and replacement authorizations in real time.
              </p>
            </div>
            <button
              type="button"
              className="wv-claims-refresh-btn"
              onClick={fetchClaims}
              title="Refresh claim statuses"
            >
              <RefreshCw size={14} />
              <span>Refresh Status</span>
            </button>
          </div>

          {claims.length === 0 ? (
            <div className="wv-empty-claims">
              <CheckCircle2 size={48} color="#10b981" />
              <h3>No active claims in-flight</h3>
              <p>All your verified devices are working properly. If you ever encounter an issue, raise a claim with 1-click from the Active Coverage tab.</p>
            </div>
          ) : (
            <div className="wv-claims-list">
              {claims.map((c) => (
                <ClaimTrackerCard key={c._id || c.claimId} claim={c} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {selectedWarrantyForCert && (
        <WarrantyCertificateModal
          isOpen={Boolean(selectedWarrantyForCert)}
          onClose={() => setSelectedWarrantyForCert(null)}
          warranty={selectedWarrantyForCert}
        />
      )}

      {selectedWarrantyForClaim && (
        <RaiseClaimModal
          isOpen={Boolean(selectedWarrantyForClaim)}
          onClose={() => setSelectedWarrantyForClaim(null)}
          warranty={selectedWarrantyForClaim}
          onClaimSubmitted={() => {
            fetchClaims();
            setActiveTab('claims');
          }}
        />
      )}

      {/* Register Device to Warranty Vault Modal */}
      {isRegisterModalOpen && (
        <div className="wv-modal-overlay" onClick={() => setIsRegisterModalOpen(false)}>
          <div className="wv-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="wv-modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#2563eb', background: '#eff6ff', padding: '2px 8px', borderRadius: '12px' }}>
                  🛡️ Device Registration
                </span>
                <h3 style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  Add Device to Warranty Vault
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} style={{ padding: '20px 24px' }}>
              {/* Quick Pick from Catalog */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                  Quick Pick from Eligible Tech &amp; Appliances
                </label>
                <div style={{ position: 'relative', marginBottom: '10px' }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Search electronics, TVs, laptops, phones..."
                    value={regSearch}
                    onChange={(e) => setRegSearch(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px 7px 32px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                  />
                </div>

                <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', border: '1px solid #f1f5f9', borderRadius: '8px', padding: '6px' }}>
                  {loadingCatalog ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                      Loading eligible catalog devices...
                    </div>
                  ) : filteredCatalogDevices.slice(0, 8).map((p) => {
                    const isSelected = selectedProductForReg?._id === p._id;
                    return (
                      <div
                        key={p._id}
                        onClick={() => handleSelectCatalogProduct(p)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          background: isSelected ? '#eff6ff' : '#ffffff',
                          border: isSelected ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                          transition: 'all 0.15s'
                        }}
                      >
                        <img
                          src={p.image || (p.images && p.images[0]) || 'https://via.placeholder.com/40'}
                          alt=""
                          style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong style={{ display: 'block', fontSize: '12.5px', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.name}
                          </strong>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            {p.brand || 'Brand'} • {p.warranty || '1 Year Warranty'}
                          </span>
                        </div>
                        {isSelected && <CheckCircle2 size={16} color="#2563eb" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Device Details Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Device / Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customDeviceName}
                    onChange={(e) => setCustomDeviceName(e.target.value)}
                    placeholder="e.g. Sony WH-1000XM5 Headphones"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Manufacturer / Brand
                  </label>
                  <input
                    type="text"
                    value={customBrand}
                    onChange={(e) => setCustomBrand(e.target.value)}
                    placeholder="e.g. Sony, Apple, Samsung"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* Serial Number & Auto Generate */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155' }}>
                    Serial Number / Card Code
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateRandomSerial}
                    style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Auto Generate Serial
                  </button>
                </div>
                <input
                  type="text"
                  value={customSerial}
                  onChange={(e) => setCustomSerial(e.target.value)}
                  placeholder="e.g. SN-SONY-98214-IN"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontFamily: 'monospace' }}
                />
              </div>

              {/* Warranty Duration Pills */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                  Warranty Coverage Duration
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {[
                    { months: 12, label: '1 Year (12 Mo)' },
                    { months: 24, label: '2 Years (24 Mo)' },
                    { months: 36, label: '3 Years (36 Mo)' }
                  ].map((dur) => (
                    <button
                      key={dur.months}
                      type="button"
                      onClick={() => setRegWarrantyMonths(dur.months)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        border: regWarrantyMonths === dur.months ? '2px solid #2563eb' : '1px solid #cbd5e1',
                        background: regWarrantyMonths === dur.months ? '#eff6ff' : '#ffffff',
                        color: regWarrantyMonths === dur.months ? '#2563eb' : '#475569',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              </div>

              {regError && (
                <div style={{ color: '#dc2626', fontSize: '12.5px', marginBottom: '14px', background: '#fef2f2', padding: '8px 12px', borderRadius: '6px' }}>
                  {regError}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReg}
                  style={{ padding: '9px 22px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#ffffff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {isSubmittingReg ? <RefreshCw size={14} className="spin" /> : <ShieldCheck size={16} />}
                  <span>{isSubmittingReg ? 'Registering...' : 'Register to Vault'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
