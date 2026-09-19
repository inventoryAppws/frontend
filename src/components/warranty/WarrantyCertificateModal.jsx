import React from 'react';
import { ShieldCheck, Award, Printer, Download, X, Calendar, Hash, Store } from 'lucide-react';
import './WarrantyCertificateModal.css';

export default function WarrantyCertificateModal({ isOpen, onClose, warranty }) {
  if (!isOpen || !warranty) return null;

  const handlePrint = () => {
    window.print();
  };

  const deliveryDateFormatted = new Date(warranty.deliveryDate || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const expiryDateRaw = warranty.expiresDate || warranty.expiryDate;
  const expiryDateFormatted = expiryDateRaw && !isNaN(new Date(expiryDateRaw).getTime())
    ? new Date(expiryDateRaw).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : '1 Year Coverage';

  return (
    <div className="wcert-modal-overlay" onClick={onClose}>
      <div className="wcert-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Certificate Close & Actions Topbar */}
        <div className="wcert-topbar no-print">
          <div className="wcert-top-title">Official Digital Warranty Record</div>
          <div className="wcert-top-actions">
            <button className="wcert-action-btn" onClick={handlePrint}>
              <Printer size={15} /> Print / Save PDF
            </button>
            <button className="wcert-close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Certificate Document Canvas */}
        <div className="wcert-paper">
          <div className="wcert-border-decor">
            {/* Header with Seal */}
            <div className="wcert-header">
              <div className="wcert-seal-wrap">
                <Award size={48} className="wcert-seal-icon" />
              </div>
              <h2 className="wcert-cert-title">CERTIFICATE OF WARRANTY</h2>
              <p className="wcert-cert-sub">Verified Manufacturer Coverage Guarantee</p>
              <div className="wcert-policy-id">Policy ID: {warranty._id || 'WARR-99481'}</div>
            </div>

            {/* Product & Serial Info */}
            <div className="wcert-body">
              <p className="wcert-body-intro">
                This document certifies that the product described herein is covered under authorized manufacturer warranty terms against defects in materials and workmanship.
              </p>

              <div className="wcert-grid">
                <div className="wcert-col">
                  <div className="wcert-field">
                    <span className="wcert-label">Product Name</span>
                    <span className="wcert-value highlight">{warranty.productName || 'Apple iPhone 15'}</span>
                  </div>
                  <div className="wcert-field">
                    <span className="wcert-label">Serial Number</span>
                    <span className="wcert-value mono">{warranty.serialNumber || 'SN-APPL-15-99814-IN'}</span>
                  </div>
                  <div className="wcert-field">
                    <span className="wcert-label">Coverage Period</span>
                    <span className="wcert-value">{warranty.warrantyMonths || 12} Months Limited Warranty</span>
                  </div>
                </div>

                <div className="wcert-col">
                  <div className="wcert-field">
                    <span className="wcert-label">Purchase / Delivery Date</span>
                    <span className="wcert-value">{deliveryDateFormatted}</span>
                  </div>
                  <div className="wcert-field">
                    <span className="wcert-label">Warranty Valid Through</span>
                    <span className="wcert-value valid">{expiryDateFormatted}</span>
                  </div>
                  <div className="wcert-field">
                    <span className="wcert-label">Authorized Vendor</span>
                    <span className="wcert-value">Verified Official Store &bull; GST Registered</span>
                  </div>
                </div>
              </div>

              {/* Terms snippet */}
              <div className="wcert-terms">
                <h5>Terms of Warranty:</h5>
                <ul>
                  <li>Covers manufacturing defects, hardware failure, and component repairs under normal usage.</li>
                  <li>Direct doorstep pickup or authorized service center walk-in support with verified serial number.</li>
                  <li>Physical damage, water intrusion, or unauthorized third-party repairs void this warranty.</li>
                </ul>
              </div>
            </div>

            {/* Signatures & Seal Footer */}
            <div className="wcert-footer">
              <div className="wcert-sig-box">
                <div className="wcert-sig-line">Auth. Manufacturer Representative</div>
                <span className="wcert-sig-title">Quality Assurance Division</span>
              </div>
              <div className="wcert-stamp-box">
                <div className="wcert-stamp">VERIFIED &amp; SECURED</div>
              </div>
              <div className="wcert-sig-box">
                <div className="wcert-sig-line">Digital Registrar</div>
                <span className="wcert-sig-title">Inventory Trust &amp; Safety</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

