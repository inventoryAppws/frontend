/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import {
  MapPin,
  Plus,
  Trash2,
  Pencil,
  Home,
  Briefcase,
  Building2,
  Check,
  Phone,
  Settings
} from "lucide-react";
import {
  getAddresses,
  deleteAddress,
  setDefaultAddress
} from "../../services/addressService";
import { getMyProfile } from "../../services/customerService";
import ConfirmModal from "../../components/ConfirmModal";
import ErrorMessage from "../../components/ErrorMessage";
import AddressMapModal from "../../components/location/AddressMapModal";
import LocationSettingsModal from "../../components/location/LocationSettingsModal";
import { getErrorMessage } from "../../utils/errorHandler";

function Addresses({ embedded = false }) {
  const [addresses, setAddresses] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState("");
  const [showMapModal, setShowMapModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressToDelete, setAddressToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showLocationSettings, setShowLocationSettings] = useState(false);
  const [customerProfile, setCustomerProfile] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("customer_profile") || "null");
    } catch {
      return null;
    }
  });

  const loadAddresses = async () => {
    try {
      const data = await getAddresses();
      setAddresses(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    }
  };

  useEffect(() => {
    loadAddresses();
    if (!customerProfile) {
      getMyProfile().then((prof) => {
        if (prof) {
          setCustomerProfile(prof);
          try {
            localStorage.setItem("customer_profile", JSON.stringify(prof));
          } catch {}
        }
      }).catch(() => null);
    }
  }, []);

  useEffect(() => {
    if (currentIndex > addresses.length - 1 && addresses.length > 0) {
      setCurrentIndex(addresses.length - 1);
    }
  }, [addresses, currentIndex]);

  const openAddModal = () => {
    setEditingAddress(null);
    setError("");
    setShowMapModal(true);
  };

  const openEditModal = (address) => {
    setEditingAddress(address);
    setError("");
    setShowMapModal(true);
  };

  const removeAddress = async () => {
    if (!addressToDelete) return;
    setDeleting(true);
    try {
      await deleteAddress(addressToDelete._id);
      setAddresses((current) => {
        const updated = current.filter((address) => address._id !== addressToDelete._id);
        setCurrentIndex((prev) => Math.min(prev, Math.max(updated.length - 1, 0)));
        return updated;
      });
      setAddressToDelete(null);
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setDeleting(false);
    }
  };

  const handleSetDefault = async (addr) => {
    try {
      await setDefaultAddress(addr._id);
      loadAddresses();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const getTypeIcon = (type) => {
    const norm = String(type || "").toLowerCase();
    if (norm === "home") return <Home size={16} />;
    if (norm === "work" || norm === "office") return <Briefcase size={16} />;
    return <Building2 size={16} />;
  };

  const currentAddress = addresses[currentIndex] || null;

  return (
    <div className={`address-page ${embedded ? "address-page-embedded" : ""}`}>
      {!embedded ? (
        <div className="page-header address-page-header">
          <div>
            <span className="cart-eyebrow">DELIVERY LOCATIONS</span>
            <h1>My Addresses</h1>
            <p>Save delivery locations and pin your exact address on the map for fast, hassle-free deliveries.</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button type="button" className="btn btn-primary" onClick={openAddModal}>
              <Plus size={18} /> Add New Address
            </button>
            <button
              type="button"
              className="btn-address-settings-gear"
              onClick={() => setShowLocationSettings(true)}
              title="Address & Map Geocoding Settings"
              aria-label="Address & Map Settings"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      ) : (
        <div className="section-heading compact-heading address-embedded-header">
          <div>
            <span className="cart-eyebrow">SAVED ADDRESSES</span>
            <h2>Delivery locations</h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button type="button" className="btn btn-primary" onClick={openAddModal}>
              <Plus size={18} /> Add New Address
            </button>
            <button
              type="button"
              className="btn-address-settings-gear"
              onClick={() => setShowLocationSettings(true)}
              title="Address & Map Geocoding Settings"
              aria-label="Address & Map Settings"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      )}

      <ErrorMessage message={error} onRetry={loadAddresses} />

      {addresses.length === 0 ? (
        <div className="empty-card empty-address-card">
          <div className="empty-state-icon-box">
            <MapPin size={38} />
          </div>
          <h2>No saved addresses</h2>
          <p>Add a delivery address using our interactive map to make checkout fast and seamless.</p>
          <button type="button" className="btn btn-primary" onClick={openAddModal}>
            <Plus size={17} /> Add New Address
          </button>
        </div>
      ) : embedded ? (
        <div className="address-compact-shell">
          <div className="address-compact-card">
            <div className="address-compact-header">
              <span className="address-type-label">
                {currentAddress?.saveAs || currentAddress?.type?.toUpperCase() || "HOME"}
              </span>
              <span className="address-counter">
                {addresses.length > 0 ? `${currentIndex + 1} of ${addresses.length}` : "0 of 0"}
              </span>
            </div>

            <div className="address-compact-body">
              <p className="address-compact-name">{currentAddress?.fullName || "Customer"}</p>
              <p className="address-compact-phone">{currentAddress?.phone || "+91 XXXXX XXXXX"}</p>
              <p className="address-compact-line">
                {currentAddress?.house ? `${currentAddress.house}, ` : ""}
                {currentAddress?.area || currentAddress?.addressLine1 || "Address Line"}
              </p>
              <p className="address-compact-line">
                {currentAddress?.city || "City"}, {currentAddress?.state || "State"} - {currentAddress?.pincode || "000000"}
              </p>
            </div>

            <div className="address-compact-footer">
              <div className="address-inline-actions">
                <button type="button" className="address-inline-btn" onClick={() => openEditModal(currentAddress)}>
                  Edit
                </button>
                <button type="button" className="address-inline-btn danger" onClick={() => setAddressToDelete(currentAddress)}>
                  Delete
                </button>
                {!currentAddress?.isDefault && (
                  <button type="button" className="address-inline-btn" onClick={() => handleSetDefault(currentAddress)}>
                    Set Default
                  </button>
                )}
              </div>

              <div className="address-carousel-controls">
                <button
                  type="button"
                  className="carousel-nav-btn"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((value) => Math.max(value - 1, 0))}
                  aria-label="Previous address"
                >
                  &lt;
                </button>
                <button
                  type="button"
                  className="carousel-nav-btn"
                  disabled={currentIndex === addresses.length - 1}
                  onClick={() => setCurrentIndex((value) => Math.min(value + 1, addresses.length - 1))}
                  aria-label="Next address"
                >
                  &gt;
                </button>
              </div>
            </div>
          </div>

          <button type="button" className="view-all-addresses-btn" onClick={() => setCurrentIndex(0)}>
            View All Addresses
          </button>
        </div>
      ) : (
        <div className="checkout-address-cards-grid">
          {addresses.map((address) => (
            <article className="checkout-address-card-revamped" key={address._id}>
              <div className="checkout-card-type-icon">
                {getTypeIcon(address.type)}
              </div>

              <div className="checkout-card-main-info">
                <div className="checkout-card-title-row">
                  <span className="checkout-card-title-text">
                    {address.saveAs || address.type || "Address"}
                  </span>
                  {address.isDefault && (
                    <span className="checkout-card-default-badge">DEFAULT</span>
                  )}
                </div>

                <div style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b", marginBottom: "3px" }}>
                  {address.fullName} • <span style={{ color: "#64748b", fontWeight: 500 }}>{address.phone}</span>
                </div>

                <p className="checkout-card-address-lines">
                  {address.house ? `${address.house}, ` : ""}
                  {address.area ? `${address.area}, ` : ""}
                  {address.city}, {address.state} - <strong>{address.pincode}</strong>
                </p>

                <div className="checkout-card-actions-row">
                  <button
                    type="button"
                    className="checkout-card-action-link"
                    onClick={() => openEditModal(address)}
                  >
                    <Pencil size={12} style={{ display: "inline", marginRight: "4px" }} />
                    Edit on Map
                  </button>
                  <button
                    type="button"
                    className="checkout-card-action-link danger"
                    onClick={() => setAddressToDelete(address)}
                  >
                    <Trash2 size={12} style={{ display: "inline", marginRight: "4px" }} />
                    Delete
                  </button>
                  {!address.isDefault && (
                    <button
                      type="button"
                      className="checkout-card-action-link"
                      onClick={() => handleSetDefault(address)}
                    >
                      Set as Default
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* INTERACTIVE LEAFLET MAP MODAL */}
      <AddressMapModal
        isOpen={showMapModal}
        onClose={() => {
          setShowMapModal(false);
          setEditingAddress(null);
        }}
        initialAddress={editingAddress}
        customerProfile={customerProfile}
        onSuccess={() => {
          loadAddresses();
          setShowMapModal(false);
          setEditingAddress(null);
        }}
      />

      <ConfirmModal
        isOpen={Boolean(addressToDelete)}
        title="Delete Address?"
        message={`Remove ${addressToDelete?.saveAs || addressToDelete?.type || "this"} address for ${addressToDelete?.fullName || ""}?`}
        confirmText="Delete Address"
        onConfirm={removeAddress}
        onCancel={() => !deleting && setAddressToDelete(null)}
        loading={deleting}
      />

      {/* ADDRESS & MAP GEOCODING SETTINGS MODAL */}
      <LocationSettingsModal
        isOpen={showLocationSettings}
        onClose={() => setShowLocationSettings(false)}
      />
    </div>
  );
}

export default Addresses;
