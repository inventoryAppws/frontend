import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  MapPin,
  Home,
  Briefcase,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { createAddress, getAddresses } from "../../../services/addressService";
import { getErrorMessage } from "../../../utils/errorHandler";

function CheckoutAddress() {
  const navigate = useNavigate();
  const { goNext } = useOutletContext();

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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAddresses()
      .then((addresses) => {
        const locations = Array.isArray(addresses) ? addresses : [];
        setSavedAddresses(locations);
        if (locations.length === 0) setShowForm(true);
      })
      .catch((loadError) => {
        setError(getErrorMessage(loadError));
        setShowForm(true);
      });
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
    if (!address.fullName.trim()) {
      return "Full name is required.";
    }

    if (!/^[0-9]{10}$/.test(address.phone.trim())) {
      return "Enter a valid 10-digit mobile number.";
    }

    if (!address.addressLine1.trim()) {
      return "Address is required.";
    }

    if (!address.city.trim()) {
      return "City is required.";
    }

    if (!address.state.trim()) {
      return "State is required.";
    }

    if (!/^[0-9]{6}$/.test(address.pincode.trim())) {
      return "Enter a valid 6-digit pincode.";
    }

    return "";
  };

  const selectAddress = (savedAddress) => {
    setAddress(savedAddress);
    setSelectedAddress(savedAddress);
    setShowForm(false);
    setError("");
  };

  const startNewAddress = () => {
    setAddress({ fullName: "", phone: "", addressLine1: "", addressLine2: "", city: "", state: "", pincode: "", type: "Home" });
    setSelectedAddress(null);
    setShowForm(true);
    setError("");
  };

  const handleContinue = async (event) => {
    event.preventDefault();

    if (!showForm && selectedAddress) {
      sessionStorage.setItem("checkoutAddress", JSON.stringify(selectedAddress));
      goNext();
      return;
    }

    const validationError = validateAddress();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    try {
      const savedAddress = address._id
        ? address
        : await createAddress(address);
      sessionStorage.setItem("checkoutAddress", JSON.stringify(savedAddress));
      goNext();
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="checkout-layout">

      <div className="checkout-main-card">

        <div className="checkout-section-heading">

          <div className="checkout-section-icon">
            <MapPin size={21} />
          </div>

          <div>
            <h2>Delivery Address</h2>
            <p>
              Where should we deliver your order?
            </p>
          </div>

        </div>

        {error && (
          <div className="checkout-error">
            {error}
          </div>
        )}

        {savedAddresses.length > 0 && (
          <div className="review-section">
            <div className="review-section-header">
              <div className="review-title"><MapPin size={18} /><h3>Saved locations</h3></div>
              <button type="button" className="btn btn-outline checkout-add-address" onClick={startNewAddress}>
                Add New Address
              </button>
            </div>
            {savedAddresses.map((savedAddress) => (
              <button
                type="button"
                key={savedAddress._id}
                className={`delivery-option ${selectedAddress?._id === savedAddress._id ? "selected" : ""}`}
                onClick={() => selectAddress(savedAddress)}
              >
                <div className="delivery-details">
                  <div className="delivery-title-row"><h3>{savedAddress.fullName}</h3><strong>{savedAddress.type}</strong></div>
                  <p>{savedAddress.addressLine1}, {savedAddress.city}, {savedAddress.state} - {savedAddress.pincode}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {showForm && <form onSubmit={handleContinue}>

          <div className="checkout-form-grid">

            <div className="form-group">
              <label htmlFor="fullName">
                Full Name
              </label>

              <input
                id="fullName"
                name="fullName"
                type="text"
                value={address.fullName}
                onChange={handleChange}
                placeholder="Enter full name"
                autoComplete="name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">
                Mobile Number
              </label>

              <input
                id="phone"
                name="phone"
                type="tel"
                value={address.phone}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                maxLength={10}
                autoComplete="tel"
              />
            </div>

            <div className="form-group checkout-full-width">
              <label htmlFor="addressLine1">
                Address
              </label>

              <input
                id="addressLine1"
                name="addressLine1"
                type="text"
                value={address.addressLine1}
                onChange={handleChange}
                placeholder="House number, building, street"
                autoComplete="street-address"
              />
            </div>

            <div className="form-group checkout-full-width">
              <label htmlFor="addressLine2">
                Address Line 2
                <span className="optional-label">
                  Optional
                </span>
              </label>

              <input
                id="addressLine2"
                name="addressLine2"
                type="text"
                value={address.addressLine2}
                onChange={handleChange}
                placeholder="Apartment, landmark, area"
              />
            </div>

            <div className="form-group">
              <label htmlFor="city">
                City
              </label>

              <input
                id="city"
                name="city"
                type="text"
                value={address.city}
                onChange={handleChange}
                placeholder="Enter city"
                autoComplete="address-level2"
              />
            </div>

            <div className="form-group">
              <label htmlFor="state">
                State
              </label>

              <input
                id="state"
                name="state"
                type="text"
                value={address.state}
                onChange={handleChange}
                placeholder="Enter state"
                autoComplete="address-level1"
              />
            </div>

            <div className="form-group">
              <label htmlFor="pincode">
                Pincode
              </label>

              <input
                id="pincode"
                name="pincode"
                type="text"
                value={address.pincode}
                onChange={handleChange}
                placeholder="6-digit pincode"
                maxLength={6}
                autoComplete="postal-code"
              />
            </div>

          </div>

          <div className="address-type-section">

            <label className="checkout-field-label">
              Save address as
            </label>

            <div className="address-type-options">

              <button
                type="button"
                className={`address-type-card ${
                  address.type === "Home"
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  setAddress((current) => ({
                    ...current,
                    type: "Home",
                  }))
                }
              >
                <Home size={20} />

                <span>
                  <strong>Home</strong>
                  <small>
                    Home address
                  </small>
                </span>
              </button>

              <button
                type="button"
                className={`address-type-card ${
                  address.type === "Work"
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  setAddress((current) => ({
                    ...current,
                    type: "Work",
                  }))
                }
              >
                <Briefcase size={20} />

                <span>
                  <strong>Work</strong>
                  <small>
                    Office address
                  </small>
                </span>
              </button>

            </div>

          </div>

          <div className="checkout-navigation">

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() =>
                navigate(sessionStorage.getItem("buyNowItem") ? "/customer" : "/customer/cart")
              }
            >
              <ArrowLeft size={17} />
              Back to Cart
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? "Saving location..." : "Save & Continue to Delivery"}
              <ArrowRight size={17} />
            </button>

          </div>

        </form>}

        {!showForm && savedAddresses.length > 0 && (
          <div className="checkout-navigation saved-address-navigation">
            <button type="button" className="btn btn-secondary" onClick={() => navigate(sessionStorage.getItem("buyNowItem") ? "/customer" : "/customer/cart")}>
              <ArrowLeft size={17} />
              Back to Cart
            </button>
            <button type="button" className="btn btn-primary" onClick={handleContinue} disabled={!selectedAddress}>
              Continue to Delivery
              <ArrowRight size={17} />
            </button>
          </div>
        )}

      </div>

    </div>
  );
}

export default CheckoutAddress;
