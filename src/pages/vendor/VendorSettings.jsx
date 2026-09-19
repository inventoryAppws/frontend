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
  Sparkles,
  Key,
  Lock,
  User,
  X
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import CustomSelect from "../../components/CustomSelect";
import { toast } from "../../components/Toast";
import { getGestureNavEnabled, setGestureNavEnabled } from "../../hooks/useGestureNavigation";
import {
  getVendorProfile,
  updateVendorProfile,
  changeVendorPassword,
  getVendorSettings,
  updateVendorSettings,
  requestVendorSecurityOtp
} from "../../services/authService";

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
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState("profile"); // 'profile' | 'password' | 'general' | 'policies' | 'inventory' | 'payouts' | 'tax' | 'notifications' | 'security'
  const [saving, setSaving] = useState(false);

  // Profile fields synced with backend database
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "+91 98765 43210",
    businessName: user?.businessName || ""
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Password fields
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [gestureNavEnabledState, setGestureNavEnabledState] = useState(getGestureNavEnabled);

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

  // Saved settings ref to detect bank changes
  const [initialBankDetails, setInitialBankDetails] = useState({
    bankName: "HDFC Bank Ltd",
    accountHolder: user?.name || "Vendor Enterprises",
    accountNumber: "50100234567890",
    ifscCode: "HDFC0001234"
  });

  // OTP Modal State for Bank details
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);

  useEffect(() => {
    // Fetch live vendor profile and backend settings
    (async () => {
      try {
        const [p, dbSettings] = await Promise.all([
          getVendorProfile().catch(() => null),
          getVendorSettings().catch(() => null)
        ]);

        if (p) {
          setProfileForm({
            name: p.name || "",
            email: p.email || "",
            phone: p.phone || "",
            businessName: p.businessName || ""
          });
        }

        if (dbSettings && Object.keys(dbSettings).length > 0) {
          setSettings((prev) => ({
            ...prev,
            ...dbSettings,
            storeName: dbSettings.storeName || p?.businessName || p?.name || prev.storeName,
            email: dbSettings.email || p?.email || prev.email,
            phone: dbSettings.phone || p?.phone || prev.phone
          }));
          setInitialBankDetails({
            bankName: dbSettings.bankName || "HDFC Bank Ltd",
            accountHolder: dbSettings.accountHolder || p?.name || "Vendor Enterprises",
            accountNumber: dbSettings.accountNumber || "50100234567890",
            ifscCode: dbSettings.ifscCode || "HDFC0001234"
          });
        } else if (p) {
          setSettings((prev) => ({
            ...prev,
            storeName: p.businessName || p.name || prev.storeName,
            email: p.email || prev.email,
            phone: p.phone || prev.phone
          }));
        }
      } catch (e) {
        console.warn("Could not fetch vendor profile/settings:", e.message);
      }
    })();

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

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) return toast.error("Full Name is required");
    if (!profileForm.email.trim()) return toast.error("Email is required");

    setSavingProfile(true);
    try {
      const updated = await updateVendorProfile({
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone,
        businessName: profileForm.businessName
      });
      if (updateUser) {
        updateUser({
          name: updated.name,
          email: updated.email,
          phone: updated.phone,
          businessName: updated.businessName
        });
      }
      toast.success("Merchant profile and account details updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.msg || err.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword) return toast.error("Enter your current password");
    if (passwordForm.newPassword.length < 6) return toast.error("New password must be at least 6 characters");
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error("New passwords do not match");
    }

    setSavingPassword(true);
    try {
      const res = await changeVendorPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword
      });
      toast.success(res.message || "Password changed successfully!");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.msg || err.message || "Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  // Check if bank details have been changed
  const haveBankDetailsChanged = () => {
    return (
      settings.bankName !== initialBankDetails.bankName ||
      settings.accountHolder !== initialBankDetails.accountHolder ||
      settings.accountNumber !== initialBankDetails.accountNumber ||
      settings.ifscCode !== initialBankDetails.ifscCode
    );
  };

  const handleRequestOtp = async () => {
    setOtpSending(true);
    try {
      await requestVendorSecurityOtp("Bank Details Modification");
      toast.success(`Verification code sent to your registered email (${settings.email || user?.email})`);
    } catch (err) {
      toast.error(err.response?.data?.msg || err.message || "Failed to send verification code");
    } finally {
      setOtpSending(false);
    }
  };

  const handleSave = async (e, providedOtp = null) => {
    e?.preventDefault();

    // If 2FA is enabled and bank details are being changed, verify OTP
    if (settings.twoFactorAuth && haveBankDetailsChanged() && !providedOtp) {
      setOtpCode("");
      setOtpModalOpen(true);
      handleRequestOtp();
      return;
    }

    setSaving(true);
    try {
      localStorage.setItem(VENDOR_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      const res = await updateVendorSettings({ ...settings, ...(providedOtp ? { otp: providedOtp } : {}) });
      if (res && res.otpRequired) {
        setOtpCode("");
        setOtpModalOpen(true);
        handleRequestOtp();
        return;
      }
      setInitialBankDetails({
        bankName: settings.bankName,
        accountHolder: settings.accountHolder,
        accountNumber: settings.accountNumber,
        ifscCode: settings.ifscCode
      });
      setOtpModalOpen(false);
      toast.success("Vendor store settings updated & saved to cloud successfully!");
    } catch (err) {
      console.warn("Backend save notice:", err.message);
      toast.error(err.response?.data?.msg || err.message || "Failed to update vendor store settings");
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyOtpAndSave = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      return toast.error("Please enter a valid 6-digit verification code");
    }
    setOtpVerifying(true);
    try {
      await handleSave(null, otpCode.trim());
    } finally {
      setOtpVerifying(false);
    }
  };

  return (
    <div className="vendor-settings-page">
      {/* Page Header */}
      <div className="vendor-settings-header">
        <div>
          <span className="vendor-page-kicker">MERCHANT ACCOUNT &amp; STORE SETTINGS</span>
          <h2>Vendor Profile &amp; Settings</h2>
          <p className="vendor-page-subtext">
            Manage your account credentials, login email, password, store profile, policies, and notifications.
          </p>
        </div>

        {activeTab !== "profile" && activeTab !== "password" && (
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
        )}
      </div>

      {/* Main Settings Card */}
      <div className="vendor-settings-layout">
        {/* Navigation Tabs */}
        <div className="vendor-settings-tabs">
          <button
            type="button"
            className={`settings-tab-btn ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <User size={18} />
            <div className="tab-btn-text">
              <strong>Account Profile</strong>
              <span>Name, email, phone &amp; business</span>
            </div>
          </button>

          <button
            type="button"
            className={`settings-tab-btn ${activeTab === "password" ? "active" : ""}`}
            onClick={() => setActiveTab("password")}
          >
            <Lock size={18} />
            <div className="tab-btn-text">
              <strong>Change Password</strong>
              <span>Security credentials &amp; login key</span>
            </div>
          </button>

          <button
            type="button"
            className={`settings-tab-btn ${activeTab === "general" ? "active" : ""}`}
            onClick={() => setActiveTab("general")}
          >
            <Store size={18} />
            <div className="tab-btn-text">
              <strong>Store Details</strong>
              <span>Brand taglines, address &amp; GSTIN</span>
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
          {/* 0A. ACCOUNT PROFILE (NAME, EMAIL, DETAILS) */}
          {activeTab === "profile" && (
            <div className="settings-panel animate-fade-in">
              <div className="panel-section-title">
                <User size={20} />
                <div>
                  <h3>Merchant Account Credentials</h3>
                  <p>Update your full name, registered login email, phone, and legal business title.</p>
                </div>
              </div>

              <form onSubmit={handleProfileSubmit}>
                <div className="settings-form-grid">
                  <div className="settings-field">
                    <label>Full Name / Merchant Representative *</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      placeholder="e.g. Rajesh Kumar"
                      required
                    />
                  </div>

                  <div className="settings-field">
                    <label>Registered Login Email *</label>
                    <div className="input-with-icon">
                      <Mail size={16} />
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        placeholder="vendor@store.com"
                        required
                      />
                    </div>
                    <span style={{ fontSize: "11.5px", color: "var(--admin-text-sub, #64748b)", marginTop: "4px", display: "block" }}>
                      This email is used for sign in, OTP verification, and order alerts.
                    </span>
                  </div>

                  <div className="settings-field">
                    <label>Contact Phone Number</label>
                    <div className="input-with-icon">
                      <Phone size={16} />
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>

                  <div className="settings-field">
                    <label>Registered Business / Trade Name</label>
                    <div className="input-with-icon">
                      <Building2 size={16} />
                      <input
                        type="text"
                        value={profileForm.businessName}
                        onChange={(e) => setProfileForm({ ...profileForm, businessName: e.target.value })}
                        placeholder="e.g. Apex Tech Solutions LLP"
                      />
                    </div>
                  </div>
                </div>

                <div className="panel-footer-save" style={{ marginTop: "24px" }}>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="vendor-save-settings-btn"
                  >
                    {savingProfile ? (
                      <>
                        <RefreshCw size={16} className="spin" />
                        <span>Updating Profile...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        <span>Save Account Details</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 0B. CHANGE PASSWORD */}
          {activeTab === "password" && (
            <div className="settings-panel animate-fade-in">
              <div className="panel-section-title">
                <Lock size={20} />
                <div>
                  <h3>Change Account Password</h3>
                  <p>Keep your merchant store secure by using a strong alphanumeric password.</p>
                </div>
              </div>

              <form onSubmit={handlePasswordSubmit}>
                <div className="settings-form-grid" style={{ maxWidth: "560px" }}>
                  <div className="settings-field full-width">
                    <label>Current Password *</label>
                    <div className="input-with-icon">
                      <Key size={16} />
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        placeholder="Enter your existing password"
                        required
                      />
                    </div>
                  </div>

                  <div className="settings-field full-width">
                    <label>New Password (min 6 characters) *</label>
                    <div className="input-with-icon">
                      <Lock size={16} />
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        placeholder="Create strong new password"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div className="settings-field full-width">
                    <label>Confirm New Password *</label>
                    <div className="input-with-icon">
                      <Lock size={16} />
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        placeholder="Re-enter new password"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                </div>

                <div className="panel-footer-save" style={{ marginTop: "24px" }}>
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="vendor-save-settings-btn"
                  >
                    {savingPassword ? (
                      <>
                        <RefreshCw size={16} className="spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={16} />
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab !== "profile" && activeTab !== "password" && (
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

                {/* Gesture Navigation Toggle */}
                <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                      <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>Gesture Navigation</h4>
                      <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                        Drag mouse from left or right screen edges to navigate back &amp; forward like mobile gestures
                      </p>
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", userSelect: "none" }}>
                      <span style={{ fontSize: "12px", color: gestureNavEnabledState ? "#16a34a" : "#64748b", fontWeight: 700 }}>
                        {gestureNavEnabledState ? "Enabled" : "Disabled"}
                      </span>
                      <input
                        type="checkbox"
                        checked={gestureNavEnabledState}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setGestureNavEnabledState(val);
                          setGestureNavEnabled(val);
                        }}
                        style={{ display: "none" }}
                      />
                      <div
                        style={{
                          width: "44px",
                          height: "24px",
                          borderRadius: "999px",
                          background: gestureNavEnabledState ? "#2563eb" : "#cbd5e1",
                          position: "relative",
                          transition: "background 0.2s ease",
                          boxShadow: "inset 0 1px 3px rgba(0,0,0,0.15)"
                        }}
                      >
                        <div
                          style={{
                            width: "18px",
                            height: "18px",
                            borderRadius: "50%",
                            background: "#ffffff",
                            position: "absolute",
                            top: "3px",
                            left: gestureNavEnabledState ? "23px" : "3px",
                            transition: "left 0.2s ease",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.25)"
                          }}
                        />
                      </div>
                    </label>
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
        )}
        </div>
      </div>

      {/* 2FA OTP MODAL FOR BANK DETAIL CHANGES */}
      {otpModalOpen && (
        <div className="vp-sidepanel-backdrop" style={{ zIndex: 100000 }} onClick={() => !otpVerifying && setOtpModalOpen(false)}>
          <div
            className="action-modal-card"
            style={{ maxWidth: "480px", width: "90%", margin: "auto", background: "#ffffff", borderRadius: "16px", padding: "28px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "700", color: "#111827" }}>Two-Factor Security Verification</h3>
                  <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>OTP required to modify bank details</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !otpVerifying && setOtpModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: "0.9rem", color: "#4b5563", lineHeight: 1.5, marginBottom: "20px" }}>
              Because Two-Factor Authentication (2FA) is enabled on your merchant account, a 6-digit verification code was sent to <strong>{settings.email || user?.email}</strong>. Please enter it below to confirm changing your bank account information.
            </p>

            <form onSubmit={handleVerifyOtpAndSave}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
                  Enter 6-Digit OTP Code *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="• • • • • •"
                  style={{
                    width: "100%",
                    fontSize: "1.5rem",
                    letterSpacing: "0.4em",
                    textAlign: "center",
                    fontWeight: "700",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1.5px solid #d1d5db",
                    outline: "none"
                  }}
                  autoFocus
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <span style={{ fontSize: "0.82rem", color: "#6b7280" }}>Didn't receive the email?</span>
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={otpSending}
                  style={{ background: "none", border: "none", color: "#4f46e5", fontWeight: "600", fontSize: "0.85rem", cursor: "pointer" }}
                >
                  {otpSending ? "Sending..." : "Resend Code"}
                </button>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setOtpModalOpen(false)}
                  disabled={otpVerifying}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    background: "#ffffff",
                    color: "#374151",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={otpVerifying || otpCode.length !== 6}
                  style={{
                    padding: "10px 22px",
                    borderRadius: "8px",
                    border: "none",
                    background: otpCode.length === 6 ? "#4f46e5" : "#9ca3af",
                    color: "#ffffff",
                    fontWeight: "600",
                    cursor: otpCode.length === 6 ? "pointer" : "not-allowed"
                  }}
                >
                  {otpVerifying ? "Verifying..." : "Verify & Save Details"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default VendorSettings;

