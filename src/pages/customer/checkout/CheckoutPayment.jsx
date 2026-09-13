/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CreditCard, Smartphone, Building2, Banknote, Wallet } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { getPaymentMethods, createPaymentMethod } from "../../../services/paymentMethodService";
import { getWallet } from "../../../services/walletService";
import { getCart } from "../../../services/cartService";
import Modal from "../../../components/Modal";
import CustomSelect from "../../../components/CustomSelect";

function CheckoutPayment() {
  const { goBack, goNext } = useOutletContext();
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [selectedSavedMethodId, setSelectedSavedMethodId] = useState("");
  const [secondaryPaymentMethod, setSecondaryPaymentMethod] = useState("");
  const [secondaryPaymentMethodId, setSecondaryPaymentMethodId] = useState("");
  const [newPaymentDetails, setNewPaymentDetails] = useState({ upiId: "", cardholderName: "", cardNumber: "", expiry: "", cvv: "", bankName: "", accountName: "", accountNumber: "", ifsc: "" });
  const [savedMethods, setSavedMethods] = useState([]);
  const [wallet, setWallet] = useState({ balance: 0 });
  const [total, setTotal] = useState(0);
  const [paymentError, setPaymentError] = useState("");
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  useEffect(() => {
    const saved = sessionStorage.getItem("checkoutPayment");
    if (saved) { try { const parsed = JSON.parse(saved); setPaymentMethod(parsed.paymentMethod || parsed); setSelectedSavedMethodId(parsed.savedMethodId || ""); setSecondaryPaymentMethod(parsed.secondaryPaymentMethod || ""); setSecondaryPaymentMethodId(parsed.secondaryPaymentMethodId || ""); setNewPaymentDetails(parsed.newPaymentDetails || { upiId: "", cardholderName: "", cardNumber: "", expiry: "", cvv: "", bankName: "", accountName: "", accountNumber: "", ifsc: "" }); } catch { setPaymentMethod(saved); } }
    const buyNowItem = sessionStorage.getItem("buyNowItem");
    Promise.all([getPaymentMethods(), getWallet(), buyNowItem ? Promise.resolve([]) : getCart()]).then(([methods, walletData, cart]) => {
      setSavedMethods(Array.isArray(methods) ? methods : []); setWallet(walletData || { balance: 0 });
      const items = buyNowItem ? [JSON.parse(buyNowItem)] : Array.isArray(cart) ? cart : cart?.items || [];
      setTotal(items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0));
    }).catch(() => {});
  }, []);
  const walletBalance = Number(wallet.balance || 0);
  const walletInsufficient = paymentMethod === "wallet" && walletBalance < total;
  const selectMethod = (method) => { setPaymentMethod(method); setPaymentError(""); setSelectedSavedMethodId(""); if (method !== "wallet") { setSecondaryPaymentMethod(""); setSecondaryPaymentMethodId(""); } };
  const selectSavedMethod = (method) => { setPaymentMethod(method.type); setSelectedSavedMethodId(method._id); setSecondaryPaymentMethod(""); setSecondaryPaymentMethodId(""); setPaymentError(""); };
  const updateNewPaymentDetails = (event) => { setNewPaymentDetails((current) => ({ ...current, [event.target.name]: event.target.value })); setPaymentError(""); };
  const selectSecondaryMethod = (method) => { setSecondaryPaymentMethod(method.type); setSecondaryPaymentMethodId(method._id.startsWith("saved-") ? method._id.slice(6) : ""); };
  const needsNewDetails = !selectedSavedMethodId && ["upi", "card", "netbanking"].includes(paymentMethod);
  const validateNewPayment = () => {
    if (selectedSavedMethodId || paymentMethod === "cod" || paymentMethod === "wallet") return "";
    if (paymentMethod === "upi" && !/^[\w.-]+@[\w.-]+$/.test(newPaymentDetails.upiId.trim())) return "Enter a valid UPI ID.";
    if (paymentMethod === "card" && (!newPaymentDetails.cardholderName.trim() || !/^\d{12,19}$/.test(newPaymentDetails.cardNumber.replace(/\s/g, "")) || !/^\d{2}\/\d{2}$/.test(newPaymentDetails.expiry) || !/^\d{3,4}$/.test(newPaymentDetails.cvv))) return "Enter valid card details.";
    if (paymentMethod === "netbanking" && (!newPaymentDetails.bankName || !newPaymentDetails.accountName.trim() || !/^\d{9,18}$/.test(newPaymentDetails.accountNumber) || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(newPaymentDetails.ifsc.toUpperCase()))) return "Enter valid bank account details and IFSC code.";
    return "";
  };
  const continueNext = () => {
    if (walletInsufficient && !secondaryPaymentMethod) return;
    if (needsNewDetails) { setPaymentError(""); setShowPaymentDetails(true); return; }
    const detailsError = validateNewPayment();
    if (detailsError) { setPaymentError(detailsError); return; }
    saveCheckoutPayment();
    goNext();
  };
  const finishNewPayment = async (persist) => {
    const detailsError = validateNewPayment();
    if (detailsError) { setPaymentError(detailsError); return; }
    if (persist) {
      const payload = paymentMethod === "upi"
        ? { type: "upi", upiId: newPaymentDetails.upiId }
        : paymentMethod === "card"
          ? { type: "card", cardholderName: newPaymentDetails.cardholderName, cardNumber: newPaymentDetails.cardNumber, expiryMonth: newPaymentDetails.expiry.split("/")[0], expiryYear: newPaymentDetails.expiry.split("/")[1] }
          : { type: "netbanking", bankName: newPaymentDetails.bankName, accountName: newPaymentDetails.accountName, accountNumber: newPaymentDetails.accountNumber, ifsc: newPaymentDetails.ifsc.toUpperCase() };
      try {
        await createPaymentMethod(payload);
      } catch (saveError) {
        setPaymentError(saveError.response?.data?.msg || "Could not save this payment method.");
        return;
      }
    }
    setShowPaymentDetails(false);
    saveCheckoutPayment();
    goNext();
  };
  const continueNewPayment = (event) => {
    event.preventDefault();
    finishNewPayment(false);
  };
  const saveNewPaymentAndContinue = (event) => {
    event.preventDefault();
    finishNewPayment(true);
  };
  const isSelectedWalletSplitMethod = (method) => method._id.startsWith("saved-")
    ? secondaryPaymentMethodId === method._id.slice(6)
    : !secondaryPaymentMethodId && secondaryPaymentMethod === method.type;
  const savedMethodLabel = (method) => method.type === "card"
    ? `${method.cardBrand || "Card"} •••• ${method.last4}`
    : method.type === "netbanking"
      ? method.bankName || "Net banking"
      : method.upiId || "Saved UPI method";
  const getPaymentSummary = () => {
    const savedMethod = savedMethods.find((method) => method._id === selectedSavedMethodId);
    const method = savedMethod || newPaymentDetails;
    if (paymentMethod === "upi") return { label: "UPI", detail: method.upiId || "UPI payment" };
    if (paymentMethod === "card") return { label: "Credit / Debit Card", detail: `Card ending in ${method.last4 || method.cardNumber?.slice(-4) || "****"}` };
    if (paymentMethod === "netbanking") return { label: "Net Banking", detail: `${method.bankName || "Bank account"}${method.accountName ? ` • ${method.accountName}` : ""}${method.accountNumber ? ` • A/C ending ${method.accountNumber.slice(-4)}` : ""}${method.ifsc ? ` • ${method.ifsc}` : ""}` };
    if (paymentMethod === "wallet") return { label: "Wallet", detail: walletInsufficient ? `Wallet + ${secondaryPaymentMethod || "another method"}` : `Wallet balance ₹ ${walletBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` };
    return { label: paymentMethod, detail: "Simulated payment" };
  };
  const saveCheckoutPayment = () => {
    sessionStorage.setItem("checkoutPayment", JSON.stringify({ paymentMethod, savedMethodId: selectedSavedMethodId, secondaryPaymentMethod, secondaryPaymentMethodId, newPaymentDetails, paymentSummary: getPaymentSummary() }));
  };
  const options = [
    ["upi", "UPI", "Pay using a UPI app.", Smartphone], ["card", "Credit / Debit Card", "Pay with a saved or simulated card.", CreditCard], ["netbanking", "Net Banking", "Pay using your bank account.", Building2], ["cod", "Cash on Delivery", "Pay when delivered.", Banknote], ["wallet", "Wallet", "Available balance: ₹ " + walletBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), Wallet]
  ];
  return <div className="checkout-layout"><div className="checkout-main-card"><div className="checkout-section-heading"><div className="checkout-section-icon"><CreditCard size={21}/></div><div><h2>Payment Method</h2><p>Select a saved method or another payment option.</p></div></div>
    {savedMethods.length > 0 && <div className="saved-checkout-methods"><h3>Saved Payment Methods</h3><p className="payment-selection-hint">Choose one saved method, or select another payment option below.</p><div className="saved-payment-grid">{savedMethods.map(method => <button type="button" key={method._id} aria-pressed={selectedSavedMethodId === method._id} className={"saved-payment-card " + (selectedSavedMethodId === method._id ? "selected" : "")} onClick={() => selectSavedMethod(method)}><strong>{savedMethodLabel(method)}</strong><span>{method.type === "card" ? "Expires " + method.expiryMonth + "/" + method.expiryYear : method.type === "netbanking" ? "Net banking preference" : "UPI preference"}</span></button>)}</div></div>}
    <div className="payment-options">{options.map(([id, title, description, Icon]) => <button type="button" key={id} disabled={id === "wallet" && walletBalance <= 0} className={"payment-option " + (paymentMethod === id && !selectedSavedMethodId ? "selected" : "")} onClick={() => selectMethod(id)}><div className="payment-radio"><span/></div><div className="payment-icon"><Icon size={22}/></div><div className="payment-details"><h3>{title}</h3><p>{description}</p>{id === "wallet" && walletInsufficient && <small className="payment-warning">Insufficient wallet balance. Select another method for the remaining amount.</small>}</div></button>)}</div>
    {paymentError && <div className="checkout-error">{paymentError}</div>}
    {walletInsufficient && <div className="wallet-split-box"><strong>Pay remaining amount with</strong><div className="saved-payment-grid">{[...savedMethods.map(method => ({ ...method, _id: "saved-" + method._id })), { _id: "upi", type: "upi", upiId: "UPI" }, { _id: "card", type: "card", cardBrand: "Card", last4: "" }].filter(method => method.type !== "wallet").map(method => <button type="button" key={method._id} className={"saved-payment-card " + (isSelectedWalletSplitMethod(method) ? "selected" : "")} onClick={() => selectSecondaryMethod(method)}>{savedMethodLabel(method)}</button>)}</div></div>}
    <div className="checkout-payment-note"><strong>Payment simulation</strong><span>No real payment is processed. Wallet deductions are handled by the backend.</span></div><div className="checkout-navigation"><button type="button" className="btn btn-secondary" onClick={goBack}><ArrowLeft size={17}/> Back</button><button type="button" className="btn btn-primary" disabled={walletInsufficient && !secondaryPaymentMethod} onClick={continueNext}>Continue to Review <ArrowRight size={17}/></button></div>
    <Modal isOpen={showPaymentDetails} onClose={() => { setShowPaymentDetails(false); setPaymentError(""); }} title={`Enter ${paymentMethod === "upi" ? "UPI" : paymentMethod === "card" ? "card" : "net banking"} details`}>
      <form className="checkout-payment-modal-form" onSubmit={continueNewPayment}>
        <p className="payment-modal-intro">Choose Continue to use these details once, or Save &amp; Continue to keep this payment method for future checkouts.</p>
        {paymentMethod === "upi" && <label className="form-group">UPI ID<input name="upiId" value={newPaymentDetails.upiId} onChange={updateNewPaymentDetails} placeholder="name@upi" autoFocus /></label>}
        {paymentMethod === "card" && <div className="checkout-form-grid"><label className="form-group">Cardholder Name<input name="cardholderName" value={newPaymentDetails.cardholderName} onChange={updateNewPaymentDetails} autoFocus /></label><label className="form-group">Card Number<input name="cardNumber" inputMode="numeric" value={newPaymentDetails.cardNumber} onChange={updateNewPaymentDetails} /></label><label className="form-group">Expiry (MM/YY)<input name="expiry" placeholder="MM/YY" value={newPaymentDetails.expiry} onChange={updateNewPaymentDetails} /></label><label className="form-group">CVV<input name="cvv" type="password" inputMode="numeric" value={newPaymentDetails.cvv} onChange={updateNewPaymentDetails} /></label></div>}
        {paymentMethod === "netbanking" && <div className="checkout-form-grid netbanking-details-grid"><label className="form-group checkout-full-width">Select Bank<CustomSelect value={newPaymentDetails.bankName} onChange={(val) => setNewPaymentDetails(prev => ({ ...prev, bankName: val }))} options={["State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank", "Punjab National Bank", "Other Bank"]} placeholder="Choose your bank" /></label><label className="form-group">Account Holder Name<input name="accountName" value={newPaymentDetails.accountName} onChange={updateNewPaymentDetails} placeholder="Name on bank account" /></label><label className="form-group">Account Number<input name="accountNumber" inputMode="numeric" value={newPaymentDetails.accountNumber} onChange={updateNewPaymentDetails} placeholder="9-18 digit account number" /></label><label className="form-group checkout-full-width">IFSC Code<input name="ifsc" value={newPaymentDetails.ifsc} onChange={updateNewPaymentDetails} placeholder="e.g. SBIN0001234" maxLength={11} /></label></div>}
        {paymentError && <div className="checkout-error">{paymentError}</div>}
        <div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={() => { setShowPaymentDetails(false); setPaymentError(""); }}>Cancel</button><button type="submit" className="btn btn-outline">Continue <ArrowRight size={16} /></button><button type="button" className="btn btn-primary" onClick={saveNewPaymentAndContinue}>Save &amp; Continue <ArrowRight size={16} /></button></div>
      </form>
    </Modal>
  </div></div>;
}
export default CheckoutPayment;
