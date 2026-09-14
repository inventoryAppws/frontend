import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  MapPin,
  Home,
  Briefcase,
  ArrowLeft,
  ArrowRight,
  Plus,
  Phone,
  Check,
  AlertCircle
} from "lucide-react";
import { createAddress, getAddresses } from "../../../services/addressService";
import { getErrorMessage } from "../../../utils/errorHandler";
import Bone from "../../../components/skeletons/Skeleton";

function CheckoutAddress() {
  const navigate = useNavigate();
  const { goNext, goBack } = useOutletContext();

  const [address, setAddress] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    type: "Home",
  });

  const [error, setError] = useState("");
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    getAddresses()
      .then((addresses) => {
        const locations = Array.isArray(addresses) ? addresses : [];
        setSavedAddresses(locations);

        const savedSession = sessionStorage.getItem("checkoutAddress");
        if (savedSession) {
          try {
            const parsed = JSON.parse(savedSession);
            setSelectedAddress(parsed);
          } catch {
            if (locations.length > 0) setSelectedAddress(locations[0]);
          }
        } else if (locations.length > 0) {
          setSelectedAddress(locations[0]);
        } else {
          setShowForm(true);
        }
      })
      .catch((loadError) => {
        setError(getErrorMessage(loadError));
        setShowForm(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setAddress((current) => ({
      ...current,
      [name]: value,
    }));
    setError("");
  };

  const validateAddress = () => {
    if (!address.fullName.trim()) return "Full name is required.";
    if (!/^[0-9]{10}$/.test(address.phone.trim())) return "Enter a valid 10-digit mobile number.";
    if (!address.addressLine1.trim()) return "Flat / House no. and street address is required.";
    if (!address.city.trim()) return "City is required.";
    if (!address.state.trim()) return "State is required.";
    if (!/^[0-9]{6}$/.test(address.pincode.trim())) return "Enter a valid 6-digit pincode.";
    return "";
  };

  const handleSaveAndDeliver = async (e) => {
    e?.preventDefault?.();
    const validationError = validateAddress();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");
    try {
      const created = await createAddress(address);
      const newAddress = created?.address || created || address;
      setSavedAddresses((prev) => [newAddress, ...prev]);
      setSelectedAddress(newAddress);
      sessionStorage.setItem("checkoutAddress", JSON.stringify(newAddress));
      setShowForm(false);
      goNext();
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAddress = (addr) => {
    setSelectedAddress(addr);
    sessionStorage.setItem("checkoutAddress", JSON.stringify(addr));
    setError("");
  };

  const handleContinue = () => {
    if (!selectedAddress && !showForm) {
      setError("Please select or add a delivery address to proceed.");
      return;
    }
    if (showForm) {
      handleSaveAndDeliver();
      return;
    }
    sessionStorage.setItem("checkoutAddress", JSON.stringify(selectedAddress));
    goNext();
  };

  return (
    <div className="revamped-checkout-card">
      {/* SECTION HEADING */}
      <div className="revamped-section-header">
        <div className="section-icon-badge">
          <MapPin size={22} />
        </div>
        <div>
          <h2>Delivery Address</h2>
          <p>Choose where you would like your order delivered.</p>
        </div>
      </div>

      {error && (
        <div className="revamped-checkout-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* SKELETON LOADING STATE */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Bone height={16} width="45%" />
                <Bone height={16} width={50} radius={9999} />
              </div>
              <Bone height={12} width="80%" />
              <Bone height={12} width="60%" />
              <Bone height={12} width="35%" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* SAVED ADDRESSES GRID */}
          {!showForm && savedAddresses.length > 0 && (
            <div className="address-cards-grid">
              {savedAddresses.map((item, idx) => {
                const isSelected = selectedAddress?._id === item._id || (selectedAddress?.fullName === item.fullName && selectedAddress?.pincode === item.pincode);
                const typeIcon = item.type === "Work" ? <Briefcase size={12} /> : <Home size={12} />;

                return (
                  <div
                    key={item._id || idx}
                    className={`address-select-card ${isSelected ? "selected" : ""}`}
                    onClick={() => handleSelectAddress(item)}
                  >
                    <div className="address-card-header">
                      <div className="address-radio-indicator">
                        <div className="radio-inner" />
                      </div>
                      <div className="address-name-wrap">
                        <strong>{item.fullName}</strong>
                        <span className={`address-type-pill ${item.type?.toLowerCase() || "home"}`}>
                          {typeIcon}
                          {item.type || "Home"}
                        </span>
                      </div>
                    </div>

                    <p className="address-card-text">
                      {item.addressLine1}
                      {item.addressLine2 ? `, ${item.addressLine2}` : ""}
                      <br />
                      {item.city}, {item.state} - <strong>{item.pincode}</strong>
                    </p>

                    <div className="address-card-phone">
                      <Phone size={13} />
                      <span>{item.phone}</span>
                    </div>

                    {isSelected && (
                      <div className="address-selected-badge">
                        <Check size={13} strokeWidth={3} />
                        <span>Deliver Here</span>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* ADD NEW ADDRESS CARD IN GRID */}
              <div
                className="address-add-new-card"
                onClick={() => {
                  setShowForm(true);
                  setError("");
                }}
              >
                <div className="add-icon-circle">
                  <Plus size={20} />
                </div>
                <strong>Add New Address</strong>
                <span>Add a new delivery location</span>
              </div>
            </div>
          )}

          {/* NEW ADDRESS FORM */}
          {showForm && (
            <div className="new-address-form-wrapper">
              <div className="form-heading-row">
                <h3>Enter Delivery Address Details</h3>
                {savedAddresses.length > 0 && (
                  <button
                    type="button"
                    className="back-to-saved-btn"
                    onClick={() => setShowForm(false)}
                  >
                    ← Select from Saved Addresses
                  </button>
                )}
              </div>

              {/* Address Type Chips */}
              <div className="address-type-chips">
                {["Home", "Work", "Other"].map((t) => (
                  <button
                    type="button"
                    key={t}
                    className={`type-chip ${address.type === t ? "active" : ""}`}
                    onClick={() => setAddress((prev) => ({ ...prev, type: t }))}
                  >
                    {t === "Work" ? <Briefcase size={14} /> : t === "Home" ? <Home size={14} /> : <MapPin size={14} />}
                    <span>{t}</span>
                  </button>
                ))}
              </div>

              <div className="revamped-form-grid">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={address.fullName}
                    onChange={handleChange}
                    placeholder="e.g. Rahul Sharma"
                    className="revamped-input"
                  />
                </div>

                <div className="form-group">
                  <label>Mobile Number (10-digits) *</label>
                  <input
                    type="tel"
                    name="phone"
                    maxLength={10}
                    value={address.phone}
                    onChange={handleChange}
                    placeholder="e.g. 9876543210"
                    className="revamped-input"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Flat, House No., Apartment, Building *</label>
                  <input
                    type="text"
                    name="addressLine1"
                    value={address.addressLine1}
                    onChange={handleChange}
                    placeholder="e.g. Flat 402, Green Valley Apartments"
                    className="revamped-input"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Area, Street, Sector, Landmark (Optional)</label>
                  <input
                    type="text"
                    name="addressLine2"
                    value={address.addressLine2}
                    onChange={handleChange}
                    placeholder="e.g. Near HDFC Bank, MG Road"
                    className="revamped-input"
                  />
                </div>

                <div className="form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    name="city"
                    value={address.city}
                    onChange={handleChange}
                    placeholder="e.g. Bengaluru"
                    className="revamped-input"
                  />
                </div>

                <div className="form-group">
                  <label>State *</label>
                  <input
                    type="text"
                    name="state"
                    value={address.state}
                    onChange={handleChange}
                    placeholder="e.g. Karnataka"
                    className="revamped-input"
                  />
                </div>

                <div className="form-group">
                  <label>Pincode (6-digits) *</label>
                  <input
                    type="text"
                    name="pincode"
                    maxLength={6}
                    value={address.pincode}
                    onChange={handleChange}
                    placeholder="e.g. 560001"
                    className="revamped-input"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="revamped-checkout-actions">
            <button
              type="button"
              className="revamped-btn-secondary"
              onClick={goBack}
            >
              <ArrowLeft size={16} />
              <span>Back to Cart</span>
            </button>

            <button
              type="button"
              className="revamped-btn-primary"
              onClick={handleContinue}
              disabled={saving}
            >
              <span>{showForm ? (saving ? "Saving Address..." : "Save & Proceed") : "Proceed to Delivery"}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default CheckoutAddress;
