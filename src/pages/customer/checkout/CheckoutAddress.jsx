import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  MapPin,
  Home,
  Briefcase,
  Building2,
  ArrowLeft,
  ArrowRight,
  Plus,
  Phone,
  Check,
  AlertCircle,
  Pencil,
  Trash2
} from "lucide-react";
import { getAddresses, deleteAddress, setDefaultAddress } from "../../../services/addressService";
import { getMyProfile } from "../../../services/customerService";
import { getErrorMessage } from "../../../utils/errorHandler";
import Bone from "../../../components/skeletons/Skeleton";
import AddressMapModal from "../../../components/location/AddressMapModal";

function CheckoutAddress() {
  const navigate = useNavigate();
  const { goNext, goBack } = useOutletContext();

  const [error, setError] = useState("");
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customerProfile, setCustomerProfile] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("customer_profile") || "null");
    } catch {
      return null;
    }
  });

  // Address Map Modal State
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [mapEditAddress, setMapEditAddress] = useState(null);

  useEffect(() => {
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

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const addresses = await getAddresses();
      const locations = Array.isArray(addresses) ? addresses : [];
      setSavedAddresses(locations);

      // SMART ADDRESS RESOLUTION PRIORITY:
      // 1. Highest Priority: Active Navbar Selection (localStorage 'selected_delivery_address')
      const storedNav = localStorage.getItem("selected_delivery_address");
      let activeAddr = null;

      if (storedNav && locations.length > 0) {
        try {
          const parsedNav = JSON.parse(storedNav);
          // Match by ID first
          activeAddr = locations.find((l) => l._id === parsedNav._id);
          // If not matched by ID, match by city + pincode or area
          if (!activeAddr) {
            activeAddr = locations.find((l) =>
              (parsedNav.pincode && l.pincode === parsedNav.pincode) ||
              (parsedNav.city && l.city && l.city.toLowerCase() === parsedNav.city.toLowerCase()) ||
              (parsedNav.area && l.area && l.area.toLowerCase() === parsedNav.area.toLowerCase())
            );
          }
          if (!activeAddr && parsedNav._id) {
            activeAddr = parsedNav;
          }
        } catch {
          activeAddr = null;
        }
      }

      // 2. Second Priority: Session checkout address
      if (!activeAddr) {
        const savedSession = sessionStorage.getItem("checkoutAddress");
        if (savedSession) {
          try {
            const parsed = JSON.parse(savedSession);
            activeAddr = locations.find((l) => l._id === parsed._id) || parsed;
          } catch {
            activeAddr = null;
          }
        }
      }

      // 3. Third Priority: Account default address
      if (!activeAddr && locations.length > 0) {
        activeAddr = locations.find((l) => l.isDefault);
      }

      // 4. Fallback: First available address
      if (!activeAddr && locations.length > 0) {
        activeAddr = locations[0];
      }

      setSelectedAddress(activeAddr || null);
      if (activeAddr) {
        sessionStorage.setItem("checkoutAddress", JSON.stringify(activeAddr));
        localStorage.setItem("selected_delivery_address", JSON.stringify(activeAddr));
      }
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  // Real-time synchronization when user switches address in the navbar
  useEffect(() => {
    const handleDeliveryAddressChanged = (e) => {
      if (e.detail && savedAddresses.length > 0) {
        const newAddr = e.detail;
        const match =
          savedAddresses.find((a) => a._id === newAddr._id) ||
          savedAddresses.find((a) =>
            (newAddr.pincode && a.pincode === newAddr.pincode) ||
            (newAddr.city && a.city && a.city.toLowerCase() === newAddr.city.toLowerCase())
          ) ||
          newAddr;

        setSelectedAddress(match);
        sessionStorage.setItem("checkoutAddress", JSON.stringify(match));
      }
    };

    window.addEventListener("delivery-address-changed", handleDeliveryAddressChanged);
    return () => window.removeEventListener("delivery-address-changed", handleDeliveryAddressChanged);
  }, [savedAddresses]);

  const handleSelectAddress = (addr) => {
    setSelectedAddress(addr);
    sessionStorage.setItem("checkoutAddress", JSON.stringify(addr));
    try {
      localStorage.setItem("selected_delivery_address", JSON.stringify(addr));
      window.dispatchEvent(new CustomEvent("delivery-address-changed", { detail: addr }));
    } catch {
      // ignore
    }
    setError("");
  };

  const handleDeleteAddress = async (e, addrId) => {
    e.stopPropagation();
    try {
      await deleteAddress(addrId);
      const remaining = savedAddresses.filter((a) => a._id !== addrId);
      setSavedAddresses(remaining);
      if (selectedAddress?._id === addrId) {
        const next = remaining[0] || null;
        setSelectedAddress(next);
        if (next) sessionStorage.setItem("checkoutAddress", JSON.stringify(next));
        else sessionStorage.removeItem("checkoutAddress");
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleSetDefault = async (e, addr) => {
    e.stopPropagation();
    try {
      await setDefaultAddress(addr._id);
      loadAddresses();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleContinue = () => {
    if (!selectedAddress) {
      setError("Please select or add a delivery address to proceed.");
      return;
    }
    sessionStorage.setItem("checkoutAddress", JSON.stringify(selectedAddress));
    goNext();
  };

  const getTypeIcon = (type) => {
    const norm = String(type || "").toLowerCase();
    if (norm === "home") return <Home size={17} />;
    if (norm === "work" || norm === "office") return <Briefcase size={17} />;
    return <Building2 size={17} />;
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
          <p>Choose where you would like your order delivered or pin your exact location on the map.</p>
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "14px" }}>
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "14px",
                padding: "18px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Bone height={16} width="35%" />
                <Bone height={16} width={50} radius={9999} />
              </div>
              <Bone height={12} width="80%" />
              <Bone height={12} width="60%" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* SAVED ADDRESSES CARDS (SCREEN 3) */}
          {savedAddresses.length === 0 ? (
            <div className="empty-address-box" style={{ textAlign: "center", padding: "32px 16px", border: "1.5px dashed #cbd5e1", borderRadius: "14px", background: "#f8fafc" }}>
              <MapPin size={40} style={{ color: "#94a3b8", margin: "0 auto 10px" }} />
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>No Saved Addresses</h3>
              <p style={{ fontSize: "13px", color: "#64748b", maxWidth: "380px", margin: "0 auto 18px" }}>
                Pin your location on the map to get fast delivery from nearest fulfillment hubs.
              </p>
              <button
                type="button"
                className="checkout-add-address-trigger-btn"
                style={{ maxWidth: "260px", margin: "0 auto" }}
                onClick={() => {
                  setMapEditAddress(null);
                  setIsMapModalOpen(true);
                }}
              >
                <Plus size={16} />
                <span>Add Delivery Address</span>
              </button>
            </div>
          ) : (
            <>
              <div className="checkout-address-cards-grid">
                {savedAddresses.map((item) => {
                  const isSelected = selectedAddress?._id === item._id;

                  return (
                    <div
                      key={item._id}
                      className={`checkout-address-card-revamped ${isSelected ? "selected" : ""}`}
                      onClick={() => handleSelectAddress(item)}
                    >
                      <div className="checkout-card-type-icon">
                        {getTypeIcon(item.type)}
                      </div>

                      <div className="checkout-card-main-info">
                        <div className="checkout-card-title-row">
                          <span className="checkout-card-title-text">
                            {item.saveAs || item.type || "Address"}
                          </span>
                          {item.isDefault && (
                            <span className="checkout-card-default-badge">DEFAULT</span>
                          )}
                        </div>

                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b", marginBottom: "3px" }}>
                          {item.fullName} • <span style={{ color: "#64748b", fontWeight: 500 }}>{item.phone}</span>
                        </div>

                        <p className="checkout-card-address-lines">
                          {item.house ? `${item.house}, ` : ""}
                          {item.area ? `${item.area}, ` : ""}
                          {item.city}, {item.state} - <strong>{item.pincode}</strong>
                        </p>

                        <div className="checkout-card-actions-row">
                          <button
                            type="button"
                            className="checkout-card-action-link"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMapEditAddress(item);
                              setIsMapModalOpen(true);
                            }}
                          >
                            <Pencil size={12} style={{ display: "inline", marginRight: "4px" }} />
                            Edit
                          </button>
                          <button
                            type="button"
                            className="checkout-card-action-link danger"
                            onClick={(e) => handleDeleteAddress(e, item._id)}
                          >
                            <Trash2 size={12} style={{ display: "inline", marginRight: "4px" }} />
                            Delete
                          </button>
                          {!item.isDefault && (
                            <button
                              type="button"
                              className="checkout-card-action-link"
                              onClick={(e) => handleSetDefault(e, item)}
                            >
                              Set as Default
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="checkout-card-radio-circle">
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* + ADD NEW ADDRESS TRIGGER BUTTON */}
              <button
                type="button"
                className="checkout-add-address-trigger-btn"
                onClick={() => {
                  setMapEditAddress(null);
                  setIsMapModalOpen(true);
                }}
              >
                <Plus size={16} />
                <span>Add New Delivery Address</span>
              </button>
            </>
          )}

          {/* ACTION BUTTONS */}
          <div className="revamped-checkout-actions" style={{ marginTop: "24px" }}>
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
              disabled={!selectedAddress}
            >
              <span>Proceed to Delivery</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </>
      )}

      {/* INTERACTIVE LEAFLET ADDRESS MAP MODAL */}
      <AddressMapModal
        isOpen={isMapModalOpen}
        onClose={() => {
          setIsMapModalOpen(false);
          setMapEditAddress(null);
        }}
        initialAddress={mapEditAddress}
        customerProfile={customerProfile}
        onSuccess={(saved) => {
          loadAddresses();
          if (saved) handleSelectAddress(saved);
        }}
      />
    </div>
  );
}

export default CheckoutAddress;
