import { useState, useEffect } from "react";
import {
  Store,
  Building2,
  Truck,
  ShieldCheck,
  Bell,
  CreditCard,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  FileText,
  Clock,
  Sparkles
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import CustomSelect from "../../components/CustomSelect";
import { toast } from "../../components/Toast";

const VENDOR_SETTINGS_STORAGE_KEY = "vendor_store_settings";

const DISPATCH_OPTIONS = [
  { value: "Same Day Dispatch (Within 12h)", label: "Same Day Dispatch (Within 12h)", icon: "⚡" },
  { value: "24 Hours (Same Day Dispatch)", label: "24 Hours (Standard)", icon: "⏱️" },
  { value: "48 Hours (2 Business Days)", label: "48 Hours (2 Business Days)", icon: "🚚" },
  { value: "3-5 Business Days", label: "3-5 Business Days", icon: "📦" }
];

const RETURN_WINDOW_OPTIONS = [
  { value: "7 Days Hassle-Free", label: "7 Days Hassle-Free", icon: "🔄" },
  { value: "10 Days Replacement Only", label: "10 Days Replacement Only", icon: "🛡️" },
  { value: "15 Days Return & Exchange", label: "15 Days Return & Exchange", icon: "✨" },
  { value: "No Returns (Replacement for Damage Only)", label: "No Returns (Damage Replacement Only)", icon: "⚠️" }
];

const PAYOUT_OPTIONS = [
  { value: "Daily Auto-Settlement (T+1)", label: "Daily Auto-Settlement (T+1)", icon: "⚡" },
  { value: "Weekly (Every Monday)", label: "Weekly (Every Monday)", icon: "📅" },
  { value: "Bi-Weekly (1st & 15th of month)", label: "Bi-Weekly (1st & 15th of month)", icon: "💳" }
];


function VendorSettings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("general"); // 'general' | 'policies' | 'inventory' | 'payouts'
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    storeName: user?.name || "Premium Electronics & Goods",
    tagline: "Authorized Retailer & Wholesale Distributor",
    email: user?.email || "vendor@inventory.com",
    phone: "+91 98765 43210",
    address: "Plot 42, Cyber Hub Tech Park, Madhapur, Hyderabad, TS - 500081",
    gstin: "36AAAAA0000A1Z5",
    pan: "ABCDE1234F",
    businessType: "Private Limited",
    dispatchTime: "24 Hours (Same Day Dispatch)",
    courierPartner: "Delhivery Express & BlueDart",
    freeShippingThreshold: "999",
    returnWindow: "7 Days Hassle-Free",
    warrantyPeriod: "1 Year Standard Manufacturer Warranty",
    lowStockThreshold: "10",
    notifyOnLowStock: true,
    notifyOnNewOrder: true,
    notifyOnReturn: true,
    autoMarkOutOfStock: true,
    bankName: "HDFC Bank Ltd",
    accountHolder: user?.name || "Vendor Enterprises",
    accountNumber: "50100234567890",
    ifscCode: "HDFC0001234",
    payoutSchedule: "Weekly (Every Monday)",
    defaultGstRate: "18% Standard GST",
    invoicePrefix: "INV-2026-",
    authorizedSignatory: user?.name || "Authorized Partner",
    taxInclusivePricing: true,
    playOrderSound: true,
    dailySalesEmail: true,
    twoFactorAuth: false,
    apiAccessEnabled: true
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(VENDOR_SETTINGS_STORAGE_KEY);
      if (saved) {
        setSettings((prev) => ({ ...prev, ...JSON.parse(saved) }));
      }
    } catch {
      // ignore
    }
  }, []);

  const handleChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (e) => {
    e?.preventDefault();
    setSaving(true);
    try {
      localStorage.setItem(VENDOR_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      setTimeout(() => {
        setSaving(false);
        toast.success("Vendor store settings updated successfully!");
      }, 400);
    } catch {
      setSaving(false);
      toast.error("Failed to save settings");
    }
  };

  return (
    <div className="vendor-settings-page">
      {/* Page Header */}
      <div className="vendor-settings-header">
        <div>
          <span className="vendor-page-kicker">STORE PREFERENCES &amp; CONFIGURATION</span>
          <h2>Vendor Store Settings</h2>
          <p className="vendor-page-subtext">
            Configure your storefront details, fulfillment policies, tax compliance, stock thresholds, and payout accounts.
          </p>
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="vendor-save-settings-btn"
        >
          {saving ? (
            <>
              <RefreshCw size={16} className="spin" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Save size={16} />
              <span>Save Settings</span>
            </>
          )}
        </button>
      </div>

      {/* Main Settings Card */}
      <div className="vendor-settings-layout">
        {/* Navigation Tabs */}
        <div className="vendor-settings-tabs">
          <button
            type="button"
            className={`settings-tab-btn ${activeTab === "general" ? "active" : ""}`}
            onClick={() => setActiveTab("general")}
          >
            <Store size={18} />
            <div className="tab-btn-text">
              <strong>Store Profile</strong>
              <span>Brand name, contact &amp; address</span>
            </div>
          </button>

          <button
            type="button"
            className={`settings-tab-btn ${activeTab === "policies" ? "active" : ""}`}
            onClick={() => setActiveTab("policies")}
          >
            <Truck size={18} />
            <div className="tab-btn-text">
              <strong>Shipping &amp; Policies</strong>
              <span>Dispatch SLA, returns &amp; delivery</span>
            </div>
          </button>

          <button
            type="button"
            className={`settings-tab-btn ${activeTab === "inventory" ? "active" : ""}`}
            onClick={() => setActiveTab("inventory")}
          >
            <Bell size={18} />
            <div className="tab-btn-text">
              <strong>Stock &amp; Alerts</strong>
              <span>Low-stock thresholds &amp; alerts</span>
            </div>
          </button>

          <button
            type="button"
            className={`settings-tab-btn ${activeTab === "payouts" ? "active" : ""}`}
            onClick={() => setActiveTab("payouts")}
          >
            <CreditCard size={18} />
            <div className="tab-btn-text">
              <strong>Bank &amp; Payouts</strong>
              <span>Settlement account details</span>
            </div>
          </button>

          <button
            type="button"
            className={`settings-tab-btn ${activeTab === "tax" ? "active" : ""}`}
            onClick={() => setActiveTab("tax")}
          >
            <FileText size={18} />
            <div className="tab-btn-text">
              <strong>GST &amp; Invoicing</strong>
              <span>Tax rates &amp; billing series</span>
            </div>
          </button>

          <button
            type="button"
            className={`settings-tab-btn ${activeTab === "notifications" ? "active" : ""}`}
            onClick={() => setActiveTab("notifications")}
          >
            <Sparkles size={18} />
            <div className="tab-btn-text">
              <strong>Notification Sounds</strong>
              <span>Chimes &amp; live alerts</span>
            </div>
          </button>

          <button
            type="button"
            className={`settings-tab-btn ${activeTab === "security" ? "active" : ""}`}
            onClick={() => setActiveTab("security")}
          >
            <ShieldCheck size={18} />
            <div className="tab-btn-text">
              <strong>Security &amp; Access</strong>
              <span>2FA &amp; session controls</span>
            </div>
          </button>
        </div>

        {/* Tab Content Panels */}
        <div className="vendor-settings-content">
          <form onSubmit={handleSave}>
            {/* 1. GENERAL STORE PROFILE */}
            {activeTab === "general" && (
              <div className="settings-panel animate-fade-in">
                <div className="panel-section-title">
                  <Store size={20} />
                  <div>
                    <h3>Store Profile &amp; Business Info</h3>
                    <p>Visible on product listings, printable tax invoices, and customer receipts.</p>
                  </div>
                </div>

                <div className="settings-form-grid">
                  <div className="settings-field">
                    <label>Store / Business Name *</label>
                    <input
                      type="text"
                      value={settings.storeName}
                      onChange={(e) => handleChange("storeName", e.target.value)}
                      placeholder="e.g. Apex Retailers Hub"
                      required
                    />
                  </div>

                  <div className="settings-field">
                    <label>Store Tagline / Slogan</label>
                    <input
                      type="text"
                      value={settings.tagline}
                      onChange={(e) => handleChange("tagline", e.target.value)}
                      placeholder="e.g. Official Electronics &amp; Lifestyle Store"
                    />
                  </div>

                  <div className="settings-field">
                    <label>Business Email *</label>
                    <div className="input-with-icon">
                      <Mail size={16} />
                      <input
                        type="email"
                        value={settings.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        placeholder="vendor@company.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="settings-field">
                    <label>Support Phone Number *</label>
                    <div className="input-with-icon">
                      <Phone size={16} />
                      <input
                        type="text"
                        value={settings.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        placeholder="+91 98765 43210"
                        required
                      />
                    </div>
                  </div>

                  <div className="settings-field full-width">
                    <label>Warehouse / Pickup Address *</label>
                    <div className="input-with-icon">
                      <MapPin size={16} />
                      <input
                        type="text"
                        value={settings.address}
                        onChange={(e) => handleChange("address", e.target.value)}
                        placeholder="Full street address with PIN code"
                        required
                      />
                    </div>
                  </div>

                  <div className="settings-field">
                    <label>GSTIN / Tax Identification Number</label>
                    <input
                      type="text"
                      value={settings.gstin}
                      onChange={(e) => handleChange("gstin", e.target.value)}
                      placeholder="36AAAAA0000A1Z5"
                    />
                  </div>

                  <div className="settings-field">
                    <label>Business PAN Number</label>
                    <input
                      type="text"
                      value={settings.pan}
                      onChange={(e) => handleChange("pan", e.target.value)}
                      placeholder="ABCDE1234F"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. SHIPPING & POLICIES */}
            {activeTab === "policies" && (
              <div className="settings-panel animate-fade-in">
                <div className="panel-section-title">
                  <Truck size={20} />
                  <div>
                    <h3>Fulfillment &amp; Customer Policies</h3>
                    <p>Set default shipping SLA, courier configurations, and guarantee terms.</p>
                  </div>
                </div>

                <div className="settings-form-grid">
                  <div className="settings-field">
                    <label>Default Dispatch SLA *</label>
                    <CustomSelect
                      value={settings.dispatchTime}
                      onChange={(val) => handleChange("dispatchTime", val)}
                      options={DISPATCH_OPTIONS}
                      placeholder="Select Dispatch SLA"
                      size="md"
                      ariaLabel="Default Dispatch SLA"
                    />
                  </div>

                  <div className="settings-field">
                    <label>Primary Courier Partner</label>
                    <input
                      type="text"
                      value={settings.courierPartner}
                      onChange={(e) => handleChange("courierPartner", e.target.value)}
                      placeholder="e.g. Delhivery, BlueDart, Shadowfax"
                    />
                  </div>

                  <div className="settings-field">
                    <label>Free Shipping Minimum Cart Value (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={settings.freeShippingThreshold}
                      onChange={(e) => handleChange("freeShippingThreshold", e.target.value)}
                      placeholder="e.g. 999"
                    />
                  </div>

                  <div className="settings-field">
                    <label>Return &amp; Replacement Window</label>
                    <CustomSelect
                      value={settings.returnWindow}
                      onChange={(val) => handleChange("returnWindow", val)}
                      options={RETURN_WINDOW_OPTIONS}
                      placeholder="Select Return Window"
                      size="md"
                      ariaLabel="Return and Replacement Window"
                    />
                  </div>


                  <div className="settings-field full-width">
                    <label>Standard Product Warranty Statement</label>
                    <input
                      type="text"
                      value={settings.warrantyPeriod}
                      onChange={(e) => handleChange("warrantyPeriod", e.target.value)}
                      placeholder="e.g. 1 Year Manufacturer Warranty with Pan-India Service"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. INVENTORY & STOCK ALERTS */}
            {activeTab === "inventory" && (
              <div className="settings-panel animate-fade-in">
                <div className="panel-section-title">
                  <Bell size={20} />
                  <div>
                    <h3>Inventory Thresholds &amp; Alerts</h3>
                    <p>Customize triggers for low-stock warnings and notification channels.</p>
                  </div>
                </div>

                <div className="settings-form-grid">
                  <div className="settings-field">
                    <label>Low Stock Warning Limit (Units) *</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={settings.lowStockThreshold}
                      onChange={(e) => handleChange("lowStockThreshold", e.target.value)}
                      required
                    />
                    <small className="field-hint">
                      Products with quantity $\le$ this number will trigger amber warning badges and alerts.
                    </small>
                  </div>

                  <div className="settings-field">
                    <label>Auto Mark "Out of Stock"</label>
                    <div className="toggle-row">
                      <input
                        type="checkbox"
                        id="autoMark"
                        checked={settings.autoMarkOutOfStock}
                        onChange={(e) => handleChange("autoMarkOutOfStock", e.target.checked)}
                      />
                      <label htmlFor="autoMark">
                        Automatically disable checkout when stock hits 0 units
                      </label>
                    </div>
                  </div>

                  <div className="settings-toggles-block full-width">
                    <h4>Notification Channels</h4>
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={settings.notifyOnLowStock}
                        onChange={(e) => handleChange("notifyOnLowStock", e.target.checked)}
                      />
                      <span>Receive immediate in-app &amp; email alert when any product enters Low Stock</span>
                    </label>

                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={settings.notifyOnNewOrder}
                        onChange={(e) => handleChange("notifyOnNewOrder", e.target.checked)}
                      />
                      <span>Receive real-time push notification whenever a customer places an order</span>
                    </label>

                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={settings.notifyOnReturn}
                        onChange={(e) => handleChange("notifyOnReturn", e.target.checked)}
                      />
                      <span>Receive notification when a return or cancellation is initiated</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 4. BANK & PAYOUTS */}
            {activeTab === "payouts" && (
              <div className="settings-panel animate-fade-in">
                <div className="panel-section-title">
                  <CreditCard size={20} />
                  <div>
                    <h3>Bank Account &amp; Settlement Payouts</h3>
                    <p>Earnings from fulfilled customer orders will be deposited into this verified account.</p>
                  </div>
                </div>

                <div className="payouts-verified-banner">
                  <ShieldCheck size={20} />
                  <div>
                    <strong>KYC Verified Merchant Account</strong>
                    <p>Direct bank transfers are automated on your chosen settlement cycle.</p>
                  </div>
                </div>

                <div className="settings-form-grid">
                  <div className="settings-field">
                    <label>Bank Name *</label>
                    <input
                      type="text"
                      value={settings.bankName}
                      onChange={(e) => handleChange("bankName", e.target.value)}
                      placeholder="e.g. HDFC Bank, ICICI Bank, State Bank of India"
                      required
                    />
                  </div>

                  <div className="settings-field">
                    <label>Beneficiary Account Holder Name *</label>
                    <input
                      type="text"
                      value={settings.accountHolder}
                      onChange={(e) => handleChange("accountHolder", e.target.value)}
                      placeholder="Name as printed in bank passbook"
                      required
                    />
                  </div>

                  <div className="settings-field">
                    <label>Bank Account Number *</label>
                    <input
                      type="text"
                      value={settings.accountNumber}
                      onChange={(e) => handleChange("accountNumber", e.target.value)}
                      placeholder="e.g. 50100234567890"
                      required
                    />
                  </div>

                  <div className="settings-field">
                    <label>Bank IFSC Code *</label>
                    <input
                      type="text"
                      value={settings.ifscCode}
                      onChange={(e) => handleChange("ifscCode", e.target.value.toUpperCase())}
                      placeholder="e.g. HDFC0001234"
                      required
                    />
                  </div>

                  <div className="settings-field">
                    <label>Payout Frequency Cycle</label>
                    <CustomSelect
                      value={settings.payoutSchedule}
                      onChange={(val) => handleChange("payoutSchedule", val)}
                      options={PAYOUT_OPTIONS}
                      placeholder="Select Payout Cycle"
                      size="md"
                      ariaLabel="Payout Frequency Cycle"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 5. GST & TAX INVOICING */}
            {activeTab === "tax" && (
              <div className="settings-panel animate-fade-in">
                <div className="panel-section-title">
                  <FileText size={20} />
                  <div>
                    <h3>GST, Tax &amp; Invoicing Defaults</h3>
                    <p>Configure tax calculations, invoice serial numbering, and compliance printouts.</p>
                  </div>
                </div>

                <div className="settings-form-grid">
                  <div className="settings-field">
                    <label>Default GST Bracket</label>
                    <input
                      type="text"
                      value={settings.defaultGstRate || "18% Standard GST"}
                      onChange={(e) => handleChange("defaultGstRate", e.target.value)}
                      placeholder="e.g. 18% Standard GST"
                    />
                  </div>

                  <div className="settings-field">
                    <label>Invoice Number Prefix</label>
                    <input
                      type="text"
                      value={settings.invoicePrefix || "INV-2026-"}
                      onChange={(e) => handleChange("invoicePrefix", e.target.value)}
                      placeholder="e.g. INV-2026-"
                    />
                  </div>

                  <div className="settings-field">
                    <label>Authorized Signatory Designation / Name</label>
                    <input
                      type="text"
                      value={settings.authorizedSignatory || user?.name || "Authorized Partner"}
                      onChange={(e) => handleChange("authorizedSignatory", e.target.value)}
                      placeholder="Name printed on formal tax invoice receipts"
                    />
                  </div>

                  <div className="settings-field">
                    <label>Tax Invoice Display Mode</label>
                    <div className="checkbox-item" style={{ marginTop: "8px" }}>
                      <input
                        type="checkbox"
                        id="taxInc"
                        checked={settings.taxInclusivePricing !== false}
                        onChange={(e) => handleChange("taxInclusivePricing", e.target.checked)}
                      />
                      <label htmlFor="taxInc">Product catalog prices are inclusive of all GST / taxes</label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 6. NOTIFICATION SOUNDS & CHIMES */}
            {activeTab === "notifications" && (
              <div className="settings-panel animate-fade-in">
                <div className="panel-section-title">
                  <Sparkles size={20} />
                  <div>
                    <h3>Live Order Notifications &amp; Sound Chimes</h3>
                    <p>Control audio alerts, order dispatch notifications, and merchant alerts.</p>
                  </div>
                </div>

                <div className="settings-toggles-block full-width">
                  <label className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={settings.playOrderSound !== false}
                      onChange={(e) => handleChange("playOrderSound", e.target.checked)}
                    />
                    <div>
                      <strong>Play Cash Register Chime on New Order</strong>
                      <p className="hint">Audible bell tone rings when a new order arrives on the dashboard.</p>
                    </div>
                  </label>

                  <label className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={settings.dailySalesEmail !== false}
                      onChange={(e) => handleChange("dailySalesEmail", e.target.checked)}
                    />
                    <div>
                      <strong>Daily Evening Sales &amp; Revenue Digest</strong>
                      <p className="hint">Sends an automated summary of day's sales, units dispatched, and pending orders at 9:00 PM.</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* 7. SECURITY & ACCESS CONTROLS */}
            {activeTab === "security" && (
              <div className="settings-panel animate-fade-in">
                <div className="panel-section-title">
                  <ShieldCheck size={20} />
                  <div>
                    <h3>Merchant Account Security &amp; Sessions</h3>
                    <p>Manage authentication controls, login sessions, and API credentials.</p>
                  </div>
                </div>

                <div className="settings-toggles-block full-width">
                  <label className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={settings.twoFactorAuth === true}
                      onChange={(e) => handleChange("twoFactorAuth", e.target.checked)}
                    />
                    <div>
                      <strong>Two-Factor Authentication (2FA) for Payout Changes</strong>
                      <p className="hint">Require OTP verification when modifying bank details or requesting payouts.</p>
                    </div>
                  </label>

                  <label className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={settings.apiAccessEnabled !== false}
                      onChange={(e) => handleChange("apiAccessEnabled", e.target.checked)}
                    />
                    <div>
                      <strong>Enable Third-Party Logistics API Integration</strong>
                      <p className="hint">Permits courier APIs to automatically pull manifest data and shipping labels.</p>
                    </div>
                  </label>
                </div>
              </div>
            )}


            {/* Panel Save Bar */}
            <div className="panel-footer-save">
              <button
                type="submit"
                disabled={saving}
                className="vendor-save-settings-btn"
              >
                {saving ? "Saving Changes..." : "Save Settings"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default VendorSettings;

