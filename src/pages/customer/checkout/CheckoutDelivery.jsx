/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Truck,
  Clock,
  Zap,
} from "lucide-react";
import { useOutletContext } from "react-router-dom";

function CheckoutDelivery() {
  const { goBack, goNext } = useOutletContext();

  const [selectedDelivery, setSelectedDelivery] =
    useState("standard");

  useEffect(() => {
    const saved =
      sessionStorage.getItem("checkoutDelivery");

    if (saved) {
      setSelectedDelivery(saved);
    }
  }, []);

  const deliveryOptions = [
    {
      id: "standard",
      title: "Standard Delivery",
      description:
        "Reliable delivery at no additional cost.",
      price: 0,
      date: "Delivery within 4–6 days",
      icon: Truck,
    },
    {
      id: "express",
      title: "Express Delivery",
      description:
        "Get your order delivered faster.",
      price: 99,
      date: "Delivery within 2–3 days",
      icon: Zap,
    },
  ];

  const handleContinue = () => {
    sessionStorage.setItem(
      "checkoutDelivery",
      selectedDelivery
    );

    goNext();
  };

  const handleBack = () => {
    goBack();
  };

  return (
    <div className="checkout-layout">

      <div className="checkout-main-card">

        <div className="checkout-section-heading">

          <div className="checkout-section-icon">
            <Truck size={21} />
          </div>

          <div>
            <h2>Delivery Options</h2>
            <p>
              Choose how you want your order delivered.
            </p>
          </div>

        </div>

        <div className="delivery-options">

          {deliveryOptions.map((option) => {

            const Icon = option.icon;

            const selected =
              selectedDelivery === option.id;

            return (
              <button
                type="button"
                key={option.id}
                className={`delivery-option ${
                  selected ? "selected" : ""
                }`}
                onClick={() =>
                  setSelectedDelivery(option.id)
                }
              >

                <div className="delivery-radio">
                  <span />
                </div>

                <div className="delivery-icon">
                  <Icon size={22} />
                </div>

                <div className="delivery-details">

                  <div className="delivery-title-row">

                    <h3>
                      {option.title}
                    </h3>

                    <strong>
                      {option.price === 0
                        ? "FREE"
                        : `₹${option.price}`}
                    </strong>

                  </div>

                  <p>
                    {option.description}
                  </p>

                  <div className="delivery-date">
                    <Clock size={15} />
                    <span>
                      {option.date}
                    </span>
                  </div>

                </div>

              </button>
            );
          })}

        </div>

        <div className="checkout-navigation">

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleBack}
          >
            <ArrowLeft size={17} />
            Back
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleContinue}
          >
            Continue to Payment
            <ArrowRight size={17} />
          </button>

        </div>

      </div>

    </div>
  );
}

export default CheckoutDelivery;