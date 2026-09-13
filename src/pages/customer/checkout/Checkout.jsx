import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Check } from "lucide-react";

function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();

  const steps = [
    {
      path: "address",
      label: "Address",
    },
    {
      path: "delivery",
      label: "Delivery",
    },
    {
      path: "payment",
      label: "Payment",
    },
    {
      path: "review",
      label: "Review",
    },
  ];

  const currentStepIndex = steps.findIndex((step) =>
    location.pathname.endsWith(`/${step.path}`)
  );

  const currentStep =
    currentStepIndex === -1 ? 0 : currentStepIndex;
  const isSuccess = location.pathname.endsWith("/success");

  const goBack = () => {
    if (currentStep === 0) {
      navigate(sessionStorage.getItem("buyNowItem") ? "/customer" : "/customer/cart");
      return;
    }

    navigate(
      `/customer/checkout/${steps[currentStep - 1].path}`
    );
  };

  const goNext = () => {
    if (currentStep < steps.length - 1) {
      navigate(
        `/customer/checkout/${steps[currentStep + 1].path}`
      );
    }
  };

  return (
    <div className="checkout-page">

      <div className="checkout-header">
        <div>
          <span className="checkout-eyebrow">
            SECURE CHECKOUT
          </span>

          <h1>Checkout</h1>

          <p>
            Complete your order in a few simple steps.
          </p>
        </div>
      </div>

      {!isSuccess && <div className="checkout-stepper">

        {steps.map((step, index) => {

          const isCompleted =
            index < currentStep;

          const isActive =
            index === currentStep;

          return (
            <div
              key={step.path}
              className="checkout-step-wrapper"
            >

              <div
                className={`checkout-step ${
                  isActive ? "active" : ""
                } ${
                  isCompleted ? "completed" : ""
                }`}
              >

                <div className="checkout-step-circle">

                  {isCompleted ? (
                    <Check size={17} />
                  ) : (
                    index + 1
                  )}

                </div>

                <span>
                  {step.label}
                </span>

              </div>

              {index < steps.length - 1 && (
                <div
                  className={`checkout-step-line ${
                    index < currentStep
                      ? "completed"
                      : ""
                  }`}
                />
              )}

            </div>
          );
        })}

      </div>}

      <div className="checkout-body">
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
