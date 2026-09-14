import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Truck,
  Zap,
  Check,
  MapPin,
  Clock,
  Shield
} from "lucide-react";
import { useOutletContext } from "react-router-dom";

function CheckoutDelivery() {
  const { goBack, goNext } = useOutletContext();
  const [selectedDelivery, setSelectedDelivery] = useState("standard");
  const [deliveryAddress, setDeliveryAddress] = useState(null);

  useEffect(() => {
    const savedDelivery = sessionStorage.getItem("checkoutDelivery");
    if (savedDelivery) {
      setSelectedDelivery(savedDelivery);
    }
    const savedAddress = sessionStorage.getItem("checkoutAddress");
    if (savedAddress) {
      try {
        setDeliveryAddress(JSON.parse(savedAddress));
      } catch {
        setDeliveryAddress(null);
      }
    }
  }, []);

  const deliveryOptions = [
    {
      id: "standard",
      title: "Standard Ground Delivery",
      badge: "FREE",
      badgeType: "free",
      description: "Reliable surface logistics via BlueDart / Delhivery network.",
      price: 0,
      timeline: "Delivered in 4–6 business days",
      icon: Truck,
    },
    {
      id: "express",
      title: "Priority Express Air",
      badge: "⚡ FASTEST",
      badgeType: "fast",
      description: "Air courier express dispatch with dedicated priority handling.",
      price: 99,
      timeline: "Delivered in 2–3 business days",
      icon: Zap,
    },
  ];

  const handleContinue = () => {
    sessionStorage.setItem("checkoutDelivery", selectedDelivery);
    goNext();
  };

  return (
    <div className="revamped-checkout-card">
      {/* SECTION HEADER */}
      <div className="revamped-section-header">
        <div className="section-icon-badge">
          <Truck size={22} />
        </div>
        <div>
          <h2>Delivery Options</h2>
          <p>Select your preferred shipping speed and carrier method.</p>
        </div>
      </div>

      {/* ACTIVE DESTINATION SNIPPET */}
      {deliveryAddress && (
        <div className="delivery-destination-bar">
          <div className="dest-icon">
            <MapPin size={16} />
          </div>
          <div className="dest-info">
            <span className="dest-label">SHIPPING TO:</span>
            <strong>{deliveryAddress.fullName}</strong>
            <span>
              {deliveryAddress.addressLine1}, {deliveryAddress.city} - {deliveryAddress.pincode}
            </span>
          </div>
        </div>
      )}

      {/* DELIVERY OPTIONS CARDS */}
      <div className="revamped-delivery-grid">
        {deliveryOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedDelivery === option.id;

          return (
            <div
              key={option.id}
              className={`delivery-choice-card ${isSelected ? "selected" : ""}`}
              onClick={() => setSelectedDelivery(option.id)}
            >
              <div className="choice-card-top">
                <div className="choice-left">
                  <div className="choice-radio">
                    <div className="radio-inner" />
                  </div>
                  <div className="choice-icon-box">
                    <Icon size={20} />
                  </div>
                  <div>
                    <div className="choice-title-row">
                      <h3>{option.title}</h3>
                      <span className={`choice-badge ${option.badgeType}`}>
                        {option.badge}
                      </span>
                    </div>
                    <p className="choice-desc">{option.description}</p>
                  </div>
                </div>

                <div className="choice-price">
                  {option.price === 0 ? (
                    <strong className="free-price">FREE</strong>
                  ) : (
                    <strong>₹{option.price}</strong>
                  )}
                </div>
              </div>

              <div className="choice-card-footer">
                <div className="choice-timeline">
                  <Clock size={13} />
                  <span>{option.timeline}</span>
                </div>
                {isSelected && (
                  <div className="choice-selected-tag">
                    <Check size={13} strokeWidth={3} />
                    <span>Selected</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* TRUST GUARANTEE NOTE */}
      <div className="delivery-guarantee-note">
        <Shield size={16} />
        <span>All packages are tracked in real-time with verified courier insurance against damage or loss.</span>
      </div>

      {/* ACTION BUTTONS */}
      <div className="revamped-checkout-actions">
        <button
          type="button"
          className="revamped-btn-secondary"
          onClick={goBack}
        >
          <ArrowLeft size={16} />
          <span>Back to Address</span>
        </button>

        <button
          type="button"
          className="revamped-btn-primary"
          onClick={handleContinue}
        >
          <span>Proceed to Payment</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default CheckoutDelivery;