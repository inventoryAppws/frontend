/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { ShoppingCart, Trash2, ArrowRight, PackageOpen, Heart } from "lucide-react";

import {
  getCart,
  updateCartItem,
  removeCartItem,
} from "../../services/cartService";
import { addToWishlist } from "../../services/wishlistService";

import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";
import ConfirmModal from "../../components/ConfirmModal";
import { toast } from "../../components/Toast";
import { getErrorMessage } from "../../utils/errorHandler";
import { getStoreSettingsPublic } from "../../services/authService";

function Cart() {
  const navigate = useNavigate();
  const { setCartCount, setWishlistCount, reloadAccount } = useOutletContext() || {};

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storeSettings, setStoreSettings] = useState(null);

  const [error, setError] = useState("");

  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [removingItemId, setRemovingItemId] = useState(null);
  const [movingToWishlist, setMovingToWishlist] = useState(false);
  const [itemToRemove, setItemToRemove] = useState(null);


  // =========================================================
  // LOAD CART
  // =========================================================

  const loadCart = async () => {
    setLoading(true);
    setError("");

    try {
      const [data, settings] = await Promise.all([
        getCart(),
        getStoreSettingsPublic().catch(() => null)
      ]);
      if (settings) setStoreSettings(settings);

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
  // MOVE ITEM TO WISHLIST
  // =========================================================

  const handleMoveToWishlist = async () => {
    if (!itemToRemove) return;
    setMovingToWishlist(true);

    try {
      const prodId = itemToRemove.productId || itemToRemove.id;
      await addToWishlist(prodId);
      await removeCartItem(itemToRemove.id);
      toast.success(`"${itemToRemove.name}" moved to your wishlist!`);
      setItemToRemove(null);
      await loadCart();
      if (typeof reloadAccount === "function") {
        reloadAccount();
      }
      if (typeof setWishlistCount === "function") {
        setWishlistCount((prev) => (Number(prev) || 0) + 1);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setMovingToWishlist(false);
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
    return <Loader type="cart" />;
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
                                productId: item.productId || item.product?._id || item.product || itemId,
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

                {storeSettings?.freeShippingThreshold != null && (
                  <span style={{ fontSize: "11.5px", color: total >= Number(storeSettings.freeShippingThreshold) ? "#10b981" : "#64748b", fontWeight: 500, marginTop: "3px" }}>
                    {total >= Number(storeSettings.freeShippingThreshold)
                      ? "🎉 Qualified for Free Standard Delivery!"
                      : `Add ₹${Math.max(0, Number(storeSettings.freeShippingThreshold) - total).toLocaleString("en-IN")} more for Free Delivery (Threshold: ₹${storeSettings.freeShippingThreshold})`}
                  </span>
                )}

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
        message="You can move this item to your wishlist instead, so you can easily find it and buy it later."
        confirmText="Remove from Cart"
        showCancel={false}
        secondaryAction={{
          text: "Add to Wishlist",
          icon: <Heart size={16} fill="#f43f5e" color="#f43f5e" />,
          onClick: handleMoveToWishlist,
          loading: movingToWishlist,
          loadingText: "Saving to Wishlist...",
          style: {
            background: "#fff1f2",
            border: "1.5px solid #fecdd3",
            color: "#e11d48",
            borderRadius: "8px",
            padding: "9px 18px",
            fontSize: "13.5px",
            fontWeight: 600,
          },
        }}
        onConfirm={async () => {
          if (!itemToRemove) return;
          await handleRemove(itemToRemove.id);
          setItemToRemove(null);
        }}
        onCancel={() => {
          if (!movingToWishlist && removingItemId === null) {
            setItemToRemove(null);
          }
        }}
        loading={removingItemId !== null}
      />

    </div>
  );
}

export default Cart;
