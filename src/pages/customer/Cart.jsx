/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { ShoppingCart, Trash2, ArrowRight, PackageOpen } from "lucide-react";

import {
  getCart,
  updateCartItem,
  removeCartItem,
} from "../../services/cartService";

import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";
import ConfirmModal from "../../components/ConfirmModal";
import { toast } from "../../components/Toast";
import { getErrorMessage } from "../../utils/errorHandler";

function Cart() {
  const navigate = useNavigate();
  const { setCartCount } = useOutletContext() || {};

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [removingItemId, setRemovingItemId] = useState(null);
  const [itemToRemove, setItemToRemove] = useState(null);


  // =========================================================
  // LOAD CART
  // =========================================================

  const loadCart = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getCart();

      /*
        Backend returns:

        [
          {
            id,
            productId,
            name,
            price,
            quantity,
            vendorName,
            qty
          }
        ]
      */

      const cartItems = Array.isArray(data)
        ? data
        : data?.items || [];

      setItems(cartItems);
      if (typeof setCartCount === "function") {
        setCartCount(cartItems.reduce((acc, it) => acc + Number(it.qty || 1), 0));
      }
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };


  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadCart();
  }, []);


  // =========================================================
  // UPDATE QUANTITY
  // =========================================================

  const handleQuantityChange = async (itemId, value) => {
    const qty = Number(value);

    if (!Number.isInteger(qty) || qty < 1) {
      return;
    }

    const item = items.find(
      (currentItem) =>
        (currentItem.id || currentItem._id) === itemId
    );

    if (!item) {
      return;
    }

    const availableQuantity = Number(item.quantity) || 0;

    if (availableQuantity > 0 && qty > availableQuantity) {
      toast.error(
        `Only ${availableQuantity} item${
          availableQuantity === 1 ? "" : "s"
        } available.`
      );
      return;
    }

    setUpdatingItemId(itemId);

    try {
      await updateCartItem(itemId, qty);
      toast.success("Cart quantity updated.");
      await loadCart();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUpdatingItemId(null);
    }
  };


  // =========================================================
  // REMOVE ITEM
  // =========================================================

  const handleRemove = async (itemId) => {
    setRemovingItemId(itemId);

    try {
      await removeCartItem(itemId);
      toast.success("Item removed from cart.");
      await loadCart();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setRemovingItemId(null);
    }
  };


  // =========================================================
  // CHECKOUT
  // =========================================================

  const handleCheckout = () => {
    if (items.length === 0) {
      return;
    }

    /*
      Do NOT call checkoutCart() here.

      Checkout flow:

      Cart
        ↓
      Address
        ↓
      Delivery
        ↓
      Payment
        ↓
      Review
        ↓
      Place Order
        ↓
      POST /cart/checkout
    */

    navigate("/customer/checkout/address");
  };


  // =========================================================
  // TOTAL
  // =========================================================

  const total = items.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    const qty = Number(item.qty) || 0;

    return sum + price * qty;
  }, 0);


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return <Loader text="Loading cart..." />;
  }


  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="cart-page">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="page-header">

        <div>
          <span className="cart-eyebrow">
            SHOPPING CART
          </span>

          <h1>
            Shopping Cart
          </h1>

          <p>
            Review your items before checkout.
          </p>
        </div>

        <div className="cart-header-icon">
          <ShoppingCart size={25} />
        </div>

      </div>


      {/* =====================================================
          ERROR MESSAGE
      ====================================================== */}

      <ErrorMessage
        message={error}
        onRetry={loadCart}
      />


      {/* =====================================================
          EMPTY CART
      ====================================================== */}

      {items.length === 0 ? (

        <div className="empty-card cart-empty-card">

          <div className="cart-empty-icon">
            <PackageOpen size={42} />
          </div>

          <h2>
            Your cart is empty
          </h2>

          <p>
            Add some products to your cart
            from the products page.
          </p>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate("/customer")}
          >
            Continue Shopping
            <ArrowRight size={17} />
          </button>

        </div>

      ) : (

        <>

          {/* =================================================
              CART CONTENT
          ================================================== */}

          <div className="cart-content">

            {/* =================================================
                CART TABLE
            ================================================== */}

            <div className="table-container">

              <table>

                <thead>

                  <tr>

                    <th>
                      Product
                    </th>

                    <th>
                      Vendor
                    </th>

                    <th>
                      Price
                    </th>

                    <th>
                      Quantity
                    </th>

                    <th>
                      Subtotal
                    </th>

                    <th>
                      Action
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {items.map((item) => {

                    const itemId =
                      item.id || item._id;

                    const price =
                      Number(item.price) || 0;

                    const qty =
                      Number(item.qty) || 0;

                    const available =
                      Number(item.quantity) || 0;

                    const subtotal =
                      price * qty;

                    const isUpdating =
                      updatingItemId === itemId;

                    const isRemoving =
                      removingItemId === itemId;


                    return (

                      <tr key={itemId}>

                        {/* PRODUCT */}

                        <td>

                          <div className="cart-product-info" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            {(item.image || item.images?.[0]) ? (
                              <img
                                src={item.image || item.images[0]}
                                alt={item.name}
                                style={{
                                  width: "48px",
                                  height: "48px",
                                  borderRadius: "8px",
                                  objectFit: "cover",
                                  border: "1px solid #e2e8f0",
                                  flexShrink: 0
                                }}
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  if (e.target.nextElementSibling) {
                                    e.target.nextElementSibling.style.display = "flex";
                                  }
                                }}
                              />
                            ) : null}
                            <div
                              className="cart-product-icon"
                              style={{ display: item.image || item.images?.[0] ? "none" : "flex" }}
                            >
                              <PackageOpen size={19} />
                            </div>

                            <div>
                              <strong style={{ display: "block", color: "#0f172a" }}>
                                {item.name || "Product"}
                              </strong>

                              <span style={{ fontSize: "12px", color: "#64748b" }}>
                                Product ID: {item.productId}
                              </span>
                            </div>

                          </div>

                        </td>


                        {/* VENDOR */}

                        <td>
                          {item.vendorName || "—"}
                        </td>


                        {/* PRICE (Myntra style) */}
                        <td style={{ whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <strong style={{ color: "#0f172a", fontSize: "14px", whiteSpace: "nowrap" }}>
                              ₹ {price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </strong>
                            {item.originalPrice && Number(item.originalPrice) > price && (
                              <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", whiteSpace: "nowrap" }}>
                                <span style={{ color: "#94a3b8", textDecoration: "line-through" }}>
                                  ₹ {Number(item.originalPrice).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <span style={{ color: "#ea580c", fontWeight: 700 }}>
                                  ({item.discountPercentage ?? 10}% OFF)
                                </span>
                              </div>
                            )}
                          </div>
                        </td>


                        {/* QUANTITY */}

                        <td>

                          <div className="cart-quantity-control">

                            <input
                              className="quantity-input"
                              type="number"
                              min="1"
                              max={
                                available > 0
                                  ? available
                                  : undefined
                              }
                              value={qty}
                              disabled={
                                isUpdating ||
                                isRemoving
                              }
                              onChange={(event) =>
                                handleQuantityChange(
                                  itemId,
                                  event.target.value
                                )
                              }
                            />

                          </div>

                          <small className="cart-available">
                            Available: {available}
                          </small>

                          {isUpdating && (
                            <small className="cart-action-loading">
                              Updating...
                            </small>
                          )}

                        </td>


                        {/* SUBTOTAL */}

                        <td style={{ whiteSpace: "nowrap" }}>

                          <strong style={{ whiteSpace: "nowrap" }}>
                            ₹ {subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </strong>

                        </td>


                        {/* REMOVE */}

                        <td>

                          <button
                            type="button"
                            className="icon-btn icon-btn-danger"
                            title="Remove item"
                            aria-label={`Remove ${
                              item.name || "product"
                            } from cart`}
                            disabled={
                              isUpdating ||
                              isRemoving
                            }
                            onClick={() =>
                              setItemToRemove({
                                id: itemId,
                                name: item.name || "this product",
                              })
                            }
                          >

                            {isRemoving ? (
                              <span className="button-loading-dot">
                                ...
                              </span>
                            ) : (
                              <Trash2 size={18} />
                            )}

                          </button>

                        </td>

                      </tr>

                    );
                  })}

                </tbody>

              </table>

            </div>


            {/* =================================================
                CART SUMMARY
            ================================================== */}

            <div className="cart-summary">

              <div className="cart-summary-info">

                <span>
                  Total
                </span>

                <strong>
                  ₹ {total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>

              </div>


              <button
                type="button"
                className="btn btn-primary cart-checkout-button"
                onClick={handleCheckout}
                disabled={
                  items.length === 0 ||
                  updatingItemId !== null ||
                  removingItemId !== null
                }
              >
                Checkout
                <ArrowRight size={18} />
              </button>

            </div>

          </div>

        </>

      )}

      <ConfirmModal
        isOpen={Boolean(itemToRemove)}
        title="Remove from Cart?"
        message={`Remove "${itemToRemove?.name || ""}" from your cart?`}
        confirmText="Remove Item"
        onConfirm={async () => {
          await handleRemove(itemToRemove.id);
          setItemToRemove(null);
        }}
        onCancel={() => setItemToRemove(null)}
        loading={removingItemId !== null}
      />

    </div>
  );
}

export default Cart;
