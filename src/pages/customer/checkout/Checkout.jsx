import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Check, MapPin, Truck, CreditCard, ShieldCheck, Lock, Shield } from "lucide-react";

function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();

  const steps = [
    {
      path: "address",
      label: "Address",
      sublabel: "Shipping details",
      icon: MapPin,
    },
    {
      path: "delivery",
      label: "Delivery",
      sublabel: "Shipping speed",
      icon: Truck,
    },
    {
      path: "payment",
      label: "Payment",
      sublabel: "Payment method",
      icon: CreditCard,
    },
    {
      path: "review",
      label: "Review",
      sublabel: "Confirm & order",
      icon: ShieldCheck,
    },
  ];

  const currentStepIndex = steps.findIndex((step) =>
    location.pathname.endsWith(`/${step.path}`)
  );

  const currentStep = currentStepIndex === -1 ? 0 : currentStepIndex;
  const isSuccess = location.pathname.endsWith("/success");

  const goBack = () => {
    if (currentStep === 0) {
      navigate(sessionStorage.getItem("buyNowItem") ? "/customer" : "/customer/cart");
      return;
    }
    navigate(`/customer/checkout/${steps[currentStep - 1].path}`);
  };

  const goNext = () => {
    if (currentStep < steps.length - 1) {
      navigate(`/customer/checkout/${steps[currentStep + 1].path}`);
    }
  };

  const handleStepClick = (index) => {
    if (index < currentStep) {
      navigate(`/customer/checkout/${steps[index].path}`);
    }
  };

  return (
    <div className="revamped-checkout-page">
      {/* HEADER WITH TRUST BADGES */}
      <div className="revamped-checkout-header">
        <div className="checkout-title-area">
          <div className="checkout-eyebrow-badge">
            <Lock size={12} />
            <span>SECURE CHECKOUT</span>
          </div>
          <h1>Complete Your Order</h1>
          <p>Instant digital confirmation &amp; official tax invoice sent to your email.</p>
        </div>

        <div className="checkout-trust-pills">
          <div className="trust-pill">
            <Shield size={14} />
            <span>256-Bit SSL Encrypted</span>
          </div>
          <div className="trust-pill">
            <Check size={14} />
            <span>100% Genuine Products</span>
          </div>
        </div>
      </div>

      {/* MODERN ELEVATED STEPPER */}
      {!isSuccess && (
        <div className="revamped-checkout-stepper">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isActive = index === currentStep;
            const isClickable = index < currentStep;
            const StepIcon = step.icon;

            return (
              <div key={step.path} className="revamped-step-wrapper">
                <button
                  type="button"
                  onClick={() => isClickable && handleStepClick(index)}
                  disabled={!isClickable}
                  className={`revamped-step ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""} ${isClickable ? "clickable" : ""}`}
                >
                  <div className="revamped-step-circle">
                    {isCompleted ? (
                      <Check size={16} strokeWidth={3} />
                    ) : (
                      <StepIcon size={16} />
                    )}
                  </div>

                  <div className="revamped-step-labels">
                    <span className="step-main-label">{step.label}</span>
                    <span className="step-sub-label">{step.sublabel}</span>
                  </div>
                </button>

                {index < steps.length - 1 && (
                  <div
                    className={`revamped-step-line ${
                      index < currentStep ? "completed" : ""
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* STEP CONTENT BODY */}
      <div className="revamped-checkout-body">
        <Outlet
          context={{
            goBack,
            goNext,
          }}
        />
      </div>
    </div>
  );
}

export default Checkout;
