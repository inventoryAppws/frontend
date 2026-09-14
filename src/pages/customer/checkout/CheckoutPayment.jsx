import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Smartphone,
  Building2,
  Banknote,
  Wallet,
  Check,
  AlertCircle,
  Shield,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { getPaymentMethods, createPaymentMethod } from "../../../services/paymentMethodService";
import { getWallet } from "../../../services/walletService";
import { getCart } from "../../../services/cartService";
import Bone from "../../../components/skeletons/Skeleton";

const POPULAR_BANKS = ["HDFC Bank", "State Bank of India", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank"];
const POPULAR_UPI_APPS = ["Google Pay", "PhonePe", "Paytm", "BHIM UPI"];

function CheckoutPayment() {
  const { goBack, goNext } = useOutletContext();
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [selectedSavedMethodId, setSelectedSavedMethodId] = useState("");
  const [secondaryPaymentMethod, setSecondaryPaymentMethod] = useState("");
  const [secondaryPaymentMethodId, setSecondaryPaymentMethodId] = useState("");
  const [saveNewMethod, setSaveNewMethod] = useState(false);

  const [newPaymentDetails, setNewPaymentDetails] = useState({
    upiId: "",
    cardholderName: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
    bankName: "",
    accountName: "",
    accountNumber: "",
    ifsc: "",
  });

  const [savedMethods, setSavedMethods] = useState([]);
  const [wallet, setWallet] = useState({ balance: 0 });
  const [total, setTotal] = useState(0);
  const [paymentError, setPaymentError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const saved = sessionStorage.getItem("checkoutPayment");
    let parsedSession = null;
    if (saved) {
      try {
        parsedSession = JSON.parse(saved);
        setPaymentMethod(parsedSession.paymentMethod || "upi");
        setSelectedSavedMethodId(parsedSession.savedMethodId || "");
        setSecondaryPaymentMethod(parsedSession.secondaryPaymentMethod || "");
        setSecondaryPaymentMethodId(parsedSession.secondaryPaymentMethodId || "");
        if (parsedSession.newPaymentDetails) {
          setNewPaymentDetails(parsedSession.newPaymentDetails);
        }
      } catch {
        setPaymentMethod(saved);
      }
    }

    const buyNowItem = sessionStorage.getItem("buyNowItem");
    Promise.all([
      getPaymentMethods().catch(() => []),
      getWallet().catch(() => ({ balance: 0 })),
      buyNowItem ? Promise.resolve([]) : getCart().catch(() => ({ items: [] }))
    ])
      .then(([methods, walletData, cart]) => {
        const list = Array.isArray(methods) ? methods.filter((m) => !m.isDeleted) : [];
        setSavedMethods(list);
        setWallet(walletData || { balance: 0 });
        const items = buyNowItem ? [JSON.parse(buyNowItem)] : Array.isArray(cart) ? cart : cart?.items || [];
        const calculatedTotal = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1), 0);
        setTotal(calculatedTotal);

        // If no prior session selection and user has saved methods, auto-select the default or first saved method
        if (!parsedSession && list.length > 0) {
          const def = list.find((m) => m.isDefault) || list[0];
          if (def) {
            setSelectedSavedMethodId(def._id);
            setPaymentMethod(def.type || "card");
          }
        }
      })
      .catch((err) => {
        console.error("Payment load error:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const walletBalance = Number(wallet.balance || 0);
  const walletInsufficient = paymentMethod === "wallet" && walletBalance < total;

  const handleSelectSavedMethod = (method) => {
    setSelectedSavedMethodId(method._id);
    setPaymentMethod(method.type || "card");
    setSecondaryPaymentMethod("");
    setSecondaryPaymentMethodId("");
    setPaymentError("");
  };

  const selectMethod = (method) => {
    setSelectedSavedMethodId("");
    setPaymentMethod(method);
    setPaymentError("");
    if (method !== "wallet") {
      setSecondaryPaymentMethod("");
      setSecondaryPaymentMethodId("");
    }
  };

  const updateNewPaymentDetails = (event) => {
    let { name, value } = event.target;
    if (name === "cardNumber") {
      value = value.replace(/\D/g, "").replace(/(\d{4})/g, "$1 ").trim().slice(0, 19);
    }
    if (name === "expiry") {
      value = value.replace(/\D/g, "");
      if (value.length > 2) value = value.slice(0, 2) + "/" + value.slice(2, 4);
      value = value.slice(0, 5);
    }
    if (name === "cvv") {
      value = value.replace(/\D/g, "").slice(0, 4);
    }

    setNewPaymentDetails((current) => ({ ...current, [name]: value }));
    setPaymentError("");
  };

  const validatePayment = () => {
    if (selectedSavedMethodId) return "";
    if (paymentMethod === "cod") return "";
    if (paymentMethod === "wallet") {
      if (walletInsufficient && !secondaryPaymentMethod) {
        return "Wallet balance is insufficient. Please choose a secondary payment method for the remaining amount.";
      }
      return "";
    }
    if (paymentMethod === "upi") {
      if (!newPaymentDetails.upiId.trim()) return "Please enter your UPI ID.";
      if (!/^[\w.-]+@[\w.-]+$/.test(newPaymentDetails.upiId.trim())) return "Enter a valid UPI ID (e.g. mobile@upi, name@okaxis).";
    }
    if (paymentMethod === "card") {
      const rawNum = newPaymentDetails.cardNumber.replace(/\s/g, "");
      if (!rawNum || rawNum.length < 15 || rawNum.length > 19) {
        return "Enter a valid 16-digit card number.";
      }
      if (!newPaymentDetails.cardholderName.trim()) return "Enter cardholder name.";
      if (!/^\d{2}\/\d{2}$/.test(newPaymentDetails.expiry)) return "Enter valid expiry date (MM/YY).";
      const [mm, yy] = newPaymentDetails.expiry.split("/").map(Number);
      if (mm < 1 || mm > 12) return "Expiry month must be between 01 and 12.";
      if (!newPaymentDetails.cvv || newPaymentDetails.cvv.length < 3) return "Enter valid 3 or 4-digit CVV.";
    }
    if (paymentMethod === "netbanking") {
      if (!newPaymentDetails.bankName) return "Please select or enter your bank name.";
    }
    return "";
  };

  const getPaymentSummary = () => {
    if (selectedSavedMethodId) {
      const saved = savedMethods.find((m) => m._id === selectedSavedMethodId);
      if (saved) {
        if (saved.type === "card") {
          const brand = (saved.cardType || "Card").toUpperCase();
          const last4 = saved.last4 || saved.cardNumber?.slice(-4) || "••••";
          return {
            label: `Saved Card (${brand} •••• ${last4})`,
            detail: `${saved.cardHolderName || "Primary Card"} • Exp: ${saved.expiry || "--/--"}`
          };
        }
        if (saved.type === "upi") {
          return {
            label: "Saved UPI",
            detail: saved.upiId || saved.label || "Verified UPI ID"
          };
        }
        if (saved.type === "netbanking") {
          return {
            label: "Saved Net Banking",
            detail: `${saved.bankName || "Bank"} Internet Banking`
          };
        }
      }
    }

    if (paymentMethod === "upi") {
      return {
        label: "UPI Instant Payment",
        detail: newPaymentDetails.upiId ? `VPA: ${newPaymentDetails.upiId}` : "Instant UPI Payment"
      };
    }
    if (paymentMethod === "card") {
      const last4 = newPaymentDetails.cardNumber?.replace(/\s/g, "").slice(-4) || "••••";
      return {
        label: "Credit / Debit Card",
        detail: `Card ending in ${last4} (${newPaymentDetails.cardholderName || "Cardholder"})`
      };
    }
    if (paymentMethod === "netbanking") {
      return {
        label: "Net Banking",
        detail: newPaymentDetails.bankName || "Selected Bank"
      };
    }
    if (paymentMethod === "wallet") {
      return {
        label: "Store Wallet",
        detail: walletInsufficient
          ? `₹${walletBalance.toLocaleString("en-IN")} Wallet + ${(secondaryPaymentMethod || "Other").toUpperCase()}`
          : `Full Wallet Payment (₹${total.toLocaleString("en-IN")})`
      };
    }
    if (paymentMethod === "cod") {
      return {
        label: "Cash on Delivery",
        detail: "Pay cash or scan QR upon doorstep delivery"
      };
    }
    return { label: paymentMethod, detail: "Standard payment" };
  };

  const saveCheckoutPayment = () => {
    const summary = getPaymentSummary();
    sessionStorage.setItem(
      "checkoutPayment",
      JSON.stringify({
        paymentMethod,
        savedMethodId: selectedSavedMethodId,
        secondaryPaymentMethod,
        secondaryPaymentMethodId,
        newPaymentDetails,
        summary,
      })
    );
  };

  const handleContinue = async () => {
    const err = validatePayment();
    if (err) {
      setPaymentError(err);
      return;
    }

    // Save newly entered card or UPI if user checked the box
    if (saveNewMethod && !selectedSavedMethodId) {
      try {
        if (paymentMethod === "upi" && newPaymentDetails.upiId.trim()) {
          await createPaymentMethod({
            type: "upi",
            upiId: newPaymentDetails.upiId.trim(),
            label: `UPI (${newPaymentDetails.upiId.trim().split("@")[0]})`
          });
        } else if (paymentMethod === "card" && newPaymentDetails.cardNumber) {
          const rawCard = newPaymentDetails.cardNumber.replace(/\s/g, "");
          await createPaymentMethod({
            type: "card",
            cardNumber: rawCard,
            last4: rawCard.slice(-4),
            cardHolderName: newPaymentDetails.cardholderName.trim(),
            expiry: newPaymentDetails.expiry,
            cardType: "card",
            label: `Card ending in ${rawCard.slice(-4)}`
          });
        }
      } catch (saveErr) {
        console.warn("Could not save new payment method:", saveErr);
      }
    }

    saveCheckoutPayment();
    goNext();
  };

  return (
    <div className="revamped-checkout-card">
      {/* SECTION HEADER */}
      <div className="revamped-section-header">
        <div className="section-icon-badge">
          <CreditCard size={22} />
        </div>
        <div>
          <h2>Payment Method</h2>
          <p>Choose your preferred payment option. All transactions are securely encrypted.</p>
        </div>
      </div>

      {paymentError && (
        <div className="revamped-checkout-error">
          <AlertCircle size={16} />
          <span>{paymentError}</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <Bone width={22} height={22} radius="50%" />
              <Bone width={36} height={36} radius={8} />
              <div style={{ flex: 1 }}>
                <Bone height={15} width="40%" style={{ marginBottom: '5px' }} />
                <Bone height={11} width="60%" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="payment-content-stack">
          {/* 1. SAVED PAYMENT METHODS */}
          {savedMethods.length > 0 && (
            <div className="saved-payments-section">
              <div className="saved-payments-header">
                <div className="saved-payments-title">
                  <ShieldCheck size={18} className="saved-icon-shield" />
                  <strong>Saved Payment Methods</strong>
                </div>
                <span className="saved-badge">
                  <Sparkles size={12} /> 1-Click Fast Checkout
                </span>
              </div>

              <div className="saved-methods-grid">
                {savedMethods.map((m) => {
                  const isSelected = selectedSavedMethodId === m._id;
                  const isCard = m.type === "card";
                  const isUpi = m.type === "upi";
                  const isNb = m.type === "netbanking";

                  let title = "";
                  let sub = "";
                  if (isCard) {
                    const brand = (m.cardType || "Card").toUpperCase();
                    const last4 = m.last4 || m.cardNumber?.slice(-4) || "••••";
                    title = `${brand} •••• ${last4}`;
                    sub = `Expires ${m.expiry || "--/--"} • ${m.cardHolderName || "Card Member"}`;
                  } else if (isUpi) {
                    title = m.label || "UPI ID";
                    sub = `VPA: ${m.upiId}`;
                  } else if (isNb) {
                    title = `${m.bankName || "Bank"} Net Banking`;
                    sub = m.accountNumber ? `Account: •••• ${m.accountNumber.slice(-4)}` : "Online Banking";
                  } else {
                    title = m.label || m.type;
                    sub = "Saved Method";
                  }

                  return (
                    <div
                      key={m._id}
                      className={`saved-method-card ${isSelected ? "selected" : ""}`}
                      onClick={() => handleSelectSavedMethod(m)}
                    >
                      <div className="saved-radio">
                        <div className="radio-inner" />
                      </div>
                      <div className={`saved-icon-box ${m.type}`}>
                        {isCard ? <CreditCard size={20} /> : isUpi ? <Smartphone size={20} /> : <Building2 size={20} />}
                      </div>
                      <div className="saved-text-col">
                        <div className="saved-title-row">
                          <strong className="saved-title">{title}</strong>
                          {m.isDefault && <span className="saved-default-tag">DEFAULT</span>}
                        </div>
                        <span className="saved-sub">{sub}</span>
                      </div>
                      {isSelected && (
                        <div className="saved-selected-check">
                          <Check size={14} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SEPARATOR IF SAVED METHODS EXIST */}
          {savedMethods.length > 0 && (
            <div className="payment-options-separator">
              <span className="separator-line" />
              <span className="separator-text">Or Pay With Another Method</span>
              <span className="separator-line" />
            </div>
          )}

          {/* ACCORDION OF STANDARD / NEW PAYMENT METHODS */}
          <div className="payment-accordion-container">
            {/* 1. UPI */}
            <div className={`payment-method-box ${!selectedSavedMethodId && paymentMethod === "upi" ? "active" : ""}`}>
              <div className="method-box-header" onClick={() => selectMethod("upi")}>
                <div className="method-radio">
                  <div className="radio-inner" />
                </div>
                <div className="method-icon-box upi">
                  <Smartphone size={20} />
                </div>
                <div className="method-header-text">
                  <strong>UPI (Google Pay, PhonePe, Paytm, BHIM)</strong>
                  <span>Pay directly from your bank account instantly with zero transaction fees</span>
                </div>
                <span className="method-fast-badge">FAST &amp; SECURE</span>
              </div>

              {!selectedSavedMethodId && paymentMethod === "upi" && (
                <div className="method-box-content">
                  <div className="popular-upi-chips">
                    {POPULAR_UPI_APPS.map((app) => (
                      <div key={app} className="upi-app-chip">
                        <span>{app}</span>
                      </div>
                    ))}
                  </div>

                  <div className="form-group" style={{ marginTop: '12px' }}>
                    <label>Enter UPI ID / VPA *</label>
                    <div className="upi-input-wrap">
                      <input
                        type="text"
                        name="upiId"
                        value={newPaymentDetails.upiId}
                        onChange={updateNewPaymentDetails}
                        placeholder="e.g. mobileNumber@upi or name@okhdfcbank"
                        className="revamped-input"
                      />
                      <span className="upi-verified-tag">Instant Verification</span>
                    </div>
                    <small className="field-hint">A payment request will be sent to your UPI app for authorization.</small>
                  </div>

                  <label className="save-method-checkbox">
                    <input
                      type="checkbox"
                      checked={saveNewMethod}
                      onChange={(e) => setSaveNewMethod(e.target.checked)}
                    />
                    <span>Save this UPI ID securely for future 1-click checkouts</span>
                  </label>
                </div>
              )}
            </div>

            {/* 2. CREDIT / DEBIT CARD */}
            <div className={`payment-method-box ${!selectedSavedMethodId && paymentMethod === "card" ? "active" : ""}`}>
              <div className="method-box-header" onClick={() => selectMethod("card")}>
                <div className="method-radio">
                  <div className="radio-inner" />
                </div>
                <div className="method-icon-box card">
                  <CreditCard size={20} />
                </div>
                <div className="method-header-text">
                  <strong>Credit or Debit Card</strong>
                  <span>Visa, Mastercard, RuPay, Maestro &amp; American Express</span>
                </div>
              </div>

              {!selectedSavedMethodId && paymentMethod === "card" && (
                <div className="method-box-content">
                  <div className="revamped-form-grid">
                    <div className="form-group full-width">
                      <label>Card Number *</label>
                      <input
                        type="text"
                        name="cardNumber"
                        value={newPaymentDetails.cardNumber}
                        onChange={updateNewPaymentDetails}
                        placeholder="4532 •••• •••• 8890"
                        className="revamped-input"
                      />
                    </div>

                    <div className="form-group full-width">
                      <label>Cardholder Name *</label>
                      <input
                        type="text"
                        name="cardholderName"
                        value={newPaymentDetails.cardholderName}
                        onChange={updateNewPaymentDetails}
                        placeholder="Full name as printed on card"
                        className="revamped-input"
                      />
                    </div>

                    <div className="form-group">
                      <label>Expiry Date *</label>
                      <input
                        type="text"
                        name="expiry"
                        value={newPaymentDetails.expiry}
                        onChange={updateNewPaymentDetails}
                        placeholder="MM / YY"
                        className="revamped-input"
                      />
                    </div>

                    <div className="form-group">
                      <label>CVV / CVC *</label>
                      <input
                        type="password"
                        name="cvv"
                        maxLength={4}
                        value={newPaymentDetails.cvv}
                        onChange={updateNewPaymentDetails}
                        placeholder="3 or 4 digits"
                        className="revamped-input"
                      />
                    </div>
                  </div>

                  <label className="save-method-checkbox">
                    <input
                      type="checkbox"
                      checked={saveNewMethod}
                      onChange={(e) => setSaveNewMethod(e.target.checked)}
                    />
                    <span>Save this card securely for future 1-click checkouts</span>
                  </label>
                </div>
              )}
            </div>

            {/* 3. STORE WALLET */}
            <div className={`payment-method-box ${!selectedSavedMethodId && paymentMethod === "wallet" ? "active" : ""}`}>
              <div className="method-box-header" onClick={() => selectMethod("wallet")}>
                <div className="method-radio">
                  <div className="radio-inner" />
                </div>
                <div className="method-icon-box wallet">
                  <Wallet size={20} />
                </div>
                <div className="method-header-text">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong>Store Wallet</strong>
                    <span className="wallet-balance-pill">
                      Balance: ₹{walletBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <span>Use your preloaded wallet balance for 1-click instant checkout</span>
                </div>
              </div>

              {!selectedSavedMethodId && paymentMethod === "wallet" && (
                <div className="method-box-content">
                  {walletBalance >= total ? (
                    <div className="wallet-sufficient-notice">
                      <Check size={16} />
                      <span>Your wallet balance covers the entire order of ₹{total.toLocaleString("en-IN")}. No additional payment needed!</span>
                    </div>
                  ) : (
                    <div className="wallet-split-box">
                      <div className="wallet-insufficient-notice">
                        <AlertCircle size={16} />
                        <span>
                          Wallet balance (₹{walletBalance.toLocaleString("en-IN")}) is less than order total (₹{total.toLocaleString("en-IN")}).
                        </span>
                      </div>

                      {/* Pick from saved methods if available */}
                      {savedMethods.length > 0 && (
                        <div style={{ marginTop: '12px' }}>
                          <p style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                            Pay remaining ₹{(total - walletBalance).toLocaleString("en-IN")} via Saved Method:
                          </p>
                          <div className="split-saved-chips">
                            {savedMethods.map((sm) => {
                              const isChosen = secondaryPaymentMethodId === sm._id;
                              const label = sm.type === 'card'
                                ? `${(sm.cardType || 'Card').toUpperCase()} •••• ${sm.last4 || sm.cardNumber?.slice(-4) || '••••'}`
                                : sm.type === 'upi'
                                ? `UPI: ${sm.upiId}`
                                : `${sm.bankName || 'Bank'}`;
                              return (
                                <button
                                  type="button"
                                  key={sm._id}
                                  className={`split-chip ${isChosen ? "active" : ""}`}
                                  onClick={() => {
                                    setSecondaryPaymentMethod(sm.type);
                                    setSecondaryPaymentMethodId(sm._id);
                                  }}
                                >
                                  {isChosen && <Check size={12} strokeWidth={3} />}
                                  <span>{label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <p style={{ fontSize: '13px', fontWeight: 600, margin: '12px 0 6px', color: '#0f172a' }}>
                        {savedMethods.length > 0 ? "Or choose another secondary method:" : `Choose how to pay remaining ₹${(total - walletBalance).toLocaleString("en-IN")}:`}
                      </p>
                      <div className="split-method-chips">
                        {[
                          { key: "upi", label: "UPI" },
                          { key: "card", label: "Credit/Debit Card" },
                          { key: "netbanking", label: "Net Banking" },
                          { key: "cod", label: "Cash on Delivery" }
                        ].map((sm) => (
                          <button
                            type="button"
                            key={sm.key}
                            className={`split-chip ${!secondaryPaymentMethodId && secondaryPaymentMethod === sm.key ? "active" : ""}`}
                            onClick={() => {
                              setSecondaryPaymentMethod(sm.key);
                              setSecondaryPaymentMethodId("");
                            }}
                          >
                            {!secondaryPaymentMethodId && secondaryPaymentMethod === sm.key && <Check size={12} strokeWidth={3} />}
                            <span>{sm.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 4. NET BANKING */}
            <div className={`payment-method-box ${!selectedSavedMethodId && paymentMethod === "netbanking" ? "active" : ""}`}>
              <div className="method-box-header" onClick={() => selectMethod("netbanking")}>
                <div className="method-radio">
                  <div className="radio-inner" />
                </div>
                <div className="method-icon-box netbanking">
                  <Building2 size={20} />
                </div>
                <div className="method-header-text">
                  <strong>Net Banking</strong>
                  <span>All major Indian retail &amp; corporate banks supported</span>
                </div>
              </div>

              {!selectedSavedMethodId && paymentMethod === "netbanking" && (
                <div className="method-box-content">
                  <div className="popular-banks-grid">
                    {POPULAR_BANKS.map((b) => (
                      <button
                        type="button"
                        key={b}
                        className={`bank-chip ${newPaymentDetails.bankName === b ? "active" : ""}`}
                        onClick={() => setNewPaymentDetails((p) => ({ ...p, bankName: b }))}
                      >
                        <Building2 size={13} />
                        <span>{b}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 5. CASH ON DELIVERY */}
            <div className={`payment-method-box ${!selectedSavedMethodId && paymentMethod === "cod" ? "active" : ""}`}>
              <div className="method-box-header" onClick={() => selectMethod("cod")}>
                <div className="method-radio">
                  <div className="radio-inner" />
                </div>
                <div className="method-icon-box cod">
                  <Banknote size={20} />
                </div>
                <div className="method-header-text">
                  <strong>Cash on Delivery (COD)</strong>
                  <span>Pay cash or scan QR via UPI at your doorstep upon arrival</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECURITY EMBLEM */}
      <div className="payment-security-footer">
        <Shield size={16} />
        <span>PCI-DSS Level 1 Compliant • End-to-End Encrypted via Razorpay Secure Gateway</span>
      </div>

      {/* ACTIONS */}
      <div className="revamped-checkout-actions">
        <button
          type="button"
          className="revamped-btn-secondary"
          onClick={goBack}
        >
          <ArrowLeft size={16} />
          <span>Back to Delivery</span>
        </button>

        <button
          type="button"
          className="revamped-btn-primary"
          onClick={handleContinue}
        >
          <span>Review Order Details</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default CheckoutPayment;
