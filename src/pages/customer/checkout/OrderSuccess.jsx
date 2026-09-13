import {
  CheckCircle2,
  Package,
  ShoppingBag,
  ArrowRight,
  Truck,
} from "lucide-react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useEffect, useState } from "react";

function OrderSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isConfirming, setIsConfirming] = useState(true);
  const [confirmationStage, setConfirmationStage] = useState("packing");

  useEffect(() => {
    const packageTimer = window.setTimeout(() => setConfirmationStage("shipping"), 3000);
    const vehicleTimer = window.setTimeout(() => setConfirmationStage("on-the-way"), 6000);
    const completeTimer = window.setTimeout(() => setIsConfirming(false), 10000);
    return () => {
      window.clearTimeout(packageTimer);
      window.clearTimeout(vehicleTimer);
      window.clearTimeout(completeTimer);
    };
  }, []);

  const savedOrder =
    sessionStorage.getItem("lastOrder");

  let orderData =
    location.state || null;

  if (!orderData && savedOrder) {
    try {
      orderData = JSON.parse(savedOrder);
    } catch {
      orderData = null;
    }
  }

  const orders =
    orderData?.orders || [];

  const total =
    Number(orderData?.total) || 0;

  const firstOrder =
    orders[0];

  const orderId =
    firstOrder?.orderId || firstOrder?._id || "Order confirmed";

  if (isConfirming) {
    const stageContent = {
      packing: ["Packing your order", "We are carefully preparing your items..."],
      shipping: ["Handing your package to the vehicle", "Your order is packed and ready to leave..."],
      "on-the-way": ["Your order is on the way", "The delivery vehicle has started its journey..."]
    }[confirmationStage];

    return (
      <div className="order-confirmation-loading" role="status" aria-live="polite">
        <div className="delivery-animation-track">
          <div className={`packing-box ${confirmationStage === "packing" ? "active" : "complete"}`}><Package size={34} /></div>
          <div className={`delivery-animation-package ${confirmationStage === "shipping" ? "active" : ""}`}><Package size={24} /></div>
          <div className={`delivery-animation-vehicle ${confirmationStage === "on-the-way" ? "active" : ""}`}><Truck size={34} /></div>
        </div>
        <strong>{stageContent[0]}</strong>
        <span>{stageContent[1]}</span>
      </div>
    );
  }

  return (
    <div className="order-success-page">

      <div className="order-success-card">

        <div className="order-success-icon">
          <CheckCircle2 size={48} />
        </div>

        <span className="order-success-label">
          ORDER CONFIRMED
        </span>

        <h1>
          Your order has been placed!
        </h1>

        <p className="order-success-description">
          Thank you for your purchase.
          Your order has been successfully
          created.
        </p>

        <div className="order-success-details">

          <div>
            <span>
              Order ID
            </span>

            <strong>
              #{orderId}
            </strong>
          </div>

          <div>
            <span>
              Total Amount
            </span>

            <strong>
              ₹ {total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
          </div>

          <div>
            <span>
              Orders Placed
            </span>

            <strong>
              {orders.length > 1 ? `${orders.length} Vendor Orders` : `#${orderId}`}
            </strong>
          </div>

        </div>

        <div className="order-success-status">

          <div className="success-status-icon">
            <Package size={21} />
          </div>

          <div>
            <strong>
              Order Processing
            </strong>

            <p>
              Your order has been received
              and is being processed.
            </p>
          </div>

        </div>

        <div className="order-success-actions">

          <button
            type="button"
            className="btn btn-primary"
            onClick={() =>
              navigate(
                "/customer/orders"
              )
            }
          >
            <ShoppingBag size={17} />
            View My Orders
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() =>
              navigate("/customer")
            }
          >
            Continue Shopping
            <ArrowRight size={17} />
          </button>

        </div>

      </div>

    </div>
  );
}

export default OrderSuccess;