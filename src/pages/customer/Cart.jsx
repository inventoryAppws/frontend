/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import {
  ShoppingCart,
  Trash2,
  ArrowRight,
  PackageOpen,
  Heart,
  Bookmark,
  BookmarkCheck,
  RotateCcw,
  Check,
  ExternalLink,
  ShieldCheck,
  Truck,
  Store
} from "lucide-react";

import {
  getCart,
  updateCartItem,
  removeCartItem,
  saveForLater,
  moveToCart
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
  const [savingLaterItemId, setSavingLaterItemId] = useState(null);
  const [movingToCartItemId, setMovingToCartItemId] = useState(null);
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

      const cartItems = Array.isArray(data) ? data : data?.items || [];
      setItems(cartItems);

      const activeItems = cartItems.filter((it) => !it.savedForLater);
      if (typeof setCartCount === "function") {
        setCartCount(activeItems.reduce((acc, it) => acc + Number(it.qty || 1), 0));
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  // Filter active and saved-for-later items
  const activeItems = items.filter((it) => !it.savedForLater);
  const savedItems = items.filter((it) => it.savedForLater);

  // =========================================================
  // UPDATE QUANTITY
  // =========================================================

  const handleQuantityChange = async (itemId, value) => {
    const qty = Number(value);
    if (!Number.isInteger(qty) || qty < 1) return;

    const item = items.find((currentItem) => (currentItem.id || currentItem._id) === itemId);
    if (!item) return;

    const availableQuantity = Number(item.quantity) || 0;
    if (availableQuantity > 0 && qty > availableQuantity) {
      toast.error(`Only ${availableQuantity} item${availableQuantity === 1 ? "" : "s"} available.`);
      return;
    }

    setUpdatingItemId(itemId);
    try {
      await updateCartItem(itemId, qty);
      toast.success("Cart quantity updated.");
      await loadCart();
    } catch (err) {
      toast.error(getErrorMessage(err));
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
      if (typeof reloadAccount === "function") reloadAccount();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRemovingItemId(null);
    }
  };

  // =========================================================
  // SAVE FOR LATER / MOVE TO CART
  // =========================================================

  const handleSaveForLater = async (itemId) => {
    setSavingLaterItemId(itemId);
    try {
      await saveForLater(itemId);
      toast.success("Item moved to Saved for Later.");
      await loadCart();
      if (typeof reloadAccount === "function") reloadAccount();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingLaterItemId(null);
    }
  };

  const handleMoveToCart = async (itemId) => {
    setMovingToCartItemId(itemId);
    try {
      await moveToCart(itemId);
      toast.success("Item moved back to your active cart!");
      await loadCart();
      if (typeof reloadAccount === "function") reloadAccount();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setMovingToCartItemId(null);
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
      if (typeof reloadAccount === "function") reloadAccount();
      if (typeof setWishlistCount === "function") {
        setWishlistCount((prev) => (Number(prev) || 0) + 1);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setMovingToWishlist(false);
    }
  };

  // =========================================================
  // CHECKOUT
  // =========================================================

  const handleCheckout = () => {
    if (activeItems.length === 0) return;

    const activeNav = localStorage.getItem("selected_delivery_address");
    if (activeNav) {
      sessionStorage.setItem("checkoutAddress", activeNav);
    }

    navigate("/customer/checkout/address");
  };

  // Active subtotal
  const total = activeItems.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    const qty = Number(item.qty) || 0;
    return sum + price * qty;
  }, 0);

  if (loading) {
    return <Loader type="cart" />;
  }

  return (
    <div className="cart-page" style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "60px" }}>
      {/* HEADER */}
      <div className="page-header" style={{ marginBottom: "20px" }}>
        <div>
          <span className="cart-eyebrow">SHOPPING CART &amp; SAVED ITEMS</span>
          <h1>Shopping Cart</h1>
          <p>Review items in your active bag or manage items saved for later purchases.</p>
        </div>

        <div className="cart-header-icon">
          <ShoppingCart size={25} />
        </div>
      </div>

      <ErrorMessage message={error} onRetry={loadCart} />

      {/* ACTIVE CART SECTION */}
      {activeItems.length === 0 ? (
        <div className="empty-card cart-empty-card" style={{ padding: "40px 20px", textAlign: "center", marginBottom: "30px" }}>
          <div className="cart-empty-icon" style={{ marginBottom: "14px" }}>
            <PackageOpen size={44} color="#94a3b8" />
          </div>
          <h2>Your active shopping bag is empty</h2>
          <p style={{ color: "#64748b", maxWidth: "400px", margin: "0 auto 16px" }}>
            Explore our vast catalog and add top-rated products to your cart.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate("/customer")}
          >
            Explore Catalog
          </button>
        </div>
      ) : (
        <div className="cart-content" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px", alignItems: "start", marginBottom: "40px" }}>
          {/* ACTIVE ITEMS TABLE CARD */}
          <div className="table-card" style={{ background: "#fff", borderRadius: "14px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                Active Bag Items ({activeItems.length})
              </h3>
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                Prices inclusive of applicable taxes
              </span>
            </div>

            <div className="cart-items-list">
              {activeItems.map((item, idx) => {
                const itemId = item.id || item._id;
                const prodId = item.productId?._id || item.productId || itemId;
                const price = Number(item.price) || 0;
                const qty = Number(item.qty) || 0;
                const available = Number(item.quantity) || 0;
                const subtotal = price * qty;
                const isUpdating = updatingItemId === itemId;
                const isRemoving = removingItemId === itemId;
                const isSaving = savingLaterItemId === itemId;

                return (
                  <div
                    key={itemId}
                    style={{
                      padding: "18px 20px",
                      borderBottom: idx < activeItems.length - 1 ? "1px solid #f1f5f9" : "none",
                      display: "flex",
                      gap: "16px",
                      alignItems: "flex-start",
                      background: "#ffffff",
                      transition: "background 0.15s ease"
                    }}
                  >
                    {/* Left: Product Thumbnail */}
                    <Link to={`/customer/products/${prodId}`} style={{ display: "block", flexShrink: 0 }}>
                      {item.image || item.images?.[0] ? (
                        <img
                          src={item.image || item.images[0]}
                          alt={item.name}
                          style={{
                            width: "74px",
                            height: "74px",
                            borderRadius: "10px",
                            objectFit: "cover",
                            border: "1px solid #e2e8f0",
                            background: "#f8fafc"
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "74px",
                            height: "74px",
                            borderRadius: "10px",
                            background: "#f1f5f9",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#94a3b8",
                            border: "1px solid #e2e8f0"
                          }}
                        >
                          <PackageOpen size={28} />
                        </div>
                      )}
                    </Link>

                    {/* Right: Content with Top Row (Title) & Below Row (Details + Actions) */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* TOP ROW: Product Title across full width + Subtotal on far right */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: "16px",
                          marginBottom: "8px"
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <Link
                            to={`/customer/products/${prodId}`}
                            style={{
                              display: "inline-block",
                              color: "#0f172a",
                              fontWeight: 700,
                              fontSize: "15px",
                              lineHeight: 1.4,
                              textDecoration: "none"
                            }}
                            title={item.name}
                          >
                            {item.name || "Product Item"}
                          </Link>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "3px" }}>
                            <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                              ID: {String(prodId).slice(-6).toUpperCase()}
                            </span>
                            <span style={{ color: "#e2e8f0" }}>•</span>
                            <span style={{ fontSize: "12px", color: "#64748b", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              <Store size={12} color="#64748b" />
                              Sold by: <strong style={{ color: "#334155" }}>{item.vendorName || "Merchant"}</strong>
                            </span>
                          </div>
                        </div>

                        {/* Item Total Subtotal */}
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <span style={{ fontSize: "17px", fontWeight: 800, color: "#0f172a", display: "block" }}>
                            ₹{subtotal.toLocaleString("en-IN")}
                          </span>
                          {qty > 1 && (
                            <span style={{ fontSize: "11.5px", color: "#64748b" }}>
                              ₹{price.toLocaleString("en-IN")} each
                            </span>
                          )}
                        </div>
                      </div>

                      {/* BELOW ROW: Remaining Things (Unit Price, Qty with stock, Save for Later, Remove) */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "12px",
                          flexWrap: "wrap",
                          paddingTop: "8px",
                          borderTop: "1px dashed #f1f5f9"
                        }}
                      >
                        {/* Unit Price & Qty Controls */}
                        <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontSize: "12.5px", color: "#64748b" }}>Unit Price:</span>
                            <strong style={{ fontSize: "14px", color: "#0f172a" }}>
                              ₹{price.toLocaleString("en-IN")}
                            </strong>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "12.5px", color: "#64748b" }}>Qty:</span>
                            <input
                              type="number"
                              min={1}
                              max={available > 0 ? available : 99}
                              value={qty}
                              disabled={isUpdating || isRemoving || isSaving}
                              onChange={(e) => handleQuantityChange(itemId, e.target.value)}
                              style={{
                                width: "56px",
                                height: "32px",
                                padding: "4px 8px",
                                borderRadius: "6px",
                                border: "1px solid #cbd5e1",
                                fontSize: "13px",
                                fontWeight: 600,
                                textAlign: "center"
                              }}
                            />
                            {available > 0 && available < 10 && (
                              <span
                                style={{
                                  fontSize: "11px",
                                  color: "#ea580c",
                                  fontWeight: 600,
                                  background: "#fff7ed",
                                  padding: "2px 7px",
                                  borderRadius: "4px",
                                  border: "1px solid #ffedd5"
                                }}
                              >
                                Only {available} left
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons: Save for Later + Remove */}
                        <div style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}>
                          <button
                            type="button"
                            onClick={() => handleSaveForLater(itemId)}
                            disabled={isUpdating || isRemoving || isSaving}
                            title="Save for Later — move out of active bag without deleting"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              fontSize: "12px",
                              height: "32px",
                              padding: "0 12px",
                              borderRadius: "7px",
                              border: "1px solid #cbd5e1",
                              background: "#ffffff",
                              color: "#334155",
                              cursor: isUpdating || isRemoving || isSaving ? "not-allowed" : "pointer",
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
                              transition: "all 0.15s ease"
                            }}
                            onMouseEnter={(e) => {
                              if (!isUpdating && !isRemoving && !isSaving) {
                                e.currentTarget.style.background = "#f8fafc";
                                e.currentTarget.style.borderColor = "#94a3b8";
                                e.currentTarget.style.color = "#0f172a";
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "#ffffff";
                              e.currentTarget.style.borderColor = "#cbd5e1";
                              e.currentTarget.style.color = "#334155";
                            }}
                          >
                            <Bookmark size={13} color="#64748b" />
                            <span>{isSaving ? "Saving..." : "Save for Later"}</span>
                          </button>

                          <button
                            type="button"
                            className="icon-btn icon-btn-danger"
                            title="Remove item"
                            disabled={isUpdating || isRemoving || isSaving}
                            onClick={() =>
                              setItemToRemove({
                                id: itemId,
                                productId: prodId,
                                name: item.name || "this product"
                              })
                            }
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "7px",
                              border: "1px solid #fecdd3",
                              background: "#fff1f2",
                              color: "#e11d48",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: isUpdating || isRemoving || isSaving ? "not-allowed" : "pointer",
                              transition: "all 0.15s ease",
                              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)"
                            }}
                            onMouseEnter={(e) => {
                              if (!isUpdating && !isRemoving && !isSaving) {
                                e.currentTarget.style.background = "#ffe4e6";
                                e.currentTarget.style.borderColor = "#fda4af";
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "#fff1f2";
                              e.currentTarget.style.borderColor = "#fecdd3";
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ACTIVE ORDER SUMMARY CARD */}
          <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "20px", position: "sticky", top: "80px" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
              Order Summary
            </h3>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "13.5px", color: "#475569" }}>
              <span>Items Total ({activeItems.reduce((acc, it) => acc + Number(it.qty || 1), 0)} units)</span>
              <span>₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "13.5px", color: "#475569" }}>
              <span>Standard Delivery</span>
              <span style={{ color: "#16a34a", fontWeight: 600 }}>FREE</span>
            </div>

            {storeSettings?.freeShippingThreshold != null && (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "8px 12px", fontSize: "12px", color: "#166534", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Check size={14} />
                <span>Qualified for Free Express Delivery!</span>
              </div>
            )}

            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "14px", marginTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "20px" }}>
              <span style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>Total Amount</span>
              <span style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a" }}>
                ₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCheckout}
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "14px",
                fontWeight: 700,
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={16} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "center", marginTop: "14px", fontSize: "11.5px", color: "#64748b" }}>
              <ShieldCheck size={14} color="#16a34a" />
              <span>100% Safe &amp; Secure Checkout</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SAVED FOR LATER SECTION                                   */}
      {/* ========================================================= */}
      <div className="saved-for-later-section" style={{ background: "#fff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <BookmarkCheck size={20} color="#0d9488" />
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>
                Saved for Later ({savedItems.length})
              </h2>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
              Items kept aside from your active cart. Move them back anytime to complete purchase.
            </p>
          </div>
        </div>

        {savedItems.length === 0 ? (
          <div style={{ padding: "30px 16px", textAlign: "center", background: "#f8fafc", borderRadius: "10px", border: "1px dashed #cbd5e1" }}>
            <Bookmark size={28} style={{ color: "#94a3b8", marginBottom: "8px" }} />
            <p style={{ margin: 0, fontSize: "13.5px", color: "#475569", fontWeight: 500 }}>
              No items saved for later
            </p>
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>
              Use the "Save for Later" button on any bag item to set it aside without removing it.
            </span>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
            {savedItems.map((sItem) => {
              const sItemId = sItem.id || sItem._id;
              const prodId = sItem.productId?._id || sItem.productId || sItemId;
              const isMoving = movingToCartItemId === sItemId;
              const isRemoving = removingItemId === sItemId;
              const inStock = Number(sItem.quantity) > 0;

              return (
                <div
                  key={sItemId}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    background: "#fcfdfe",
                    transition: "box-shadow 0.2s ease"
                  }}
                >
                  <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                    <Link to={`/customer/products/${prodId}`} style={{ display: "block", flexShrink: 0 }}>
                      {sItem.image || sItem.images?.[0] ? (
                        <img
                          src={sItem.image || sItem.images[0]}
                          alt={sItem.name}
                          style={{
                            width: "68px",
                            height: "68px",
                            borderRadius: "8px",
                            objectFit: "cover",
                            border: "1px solid #e2e8f0"
                          }}
                        />
                      ) : (
                        <div style={{ width: "68px", height: "68px", borderRadius: "8px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                          <PackageOpen size={24} />
                        </div>
                      )}
                    </Link>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link
                        to={`/customer/products/${prodId}`}
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          color: "#0f172a",
                          fontWeight: 600,
                          fontSize: "13.5px",
                          textDecoration: "none",
                          lineHeight: 1.3
                        }}
                        title={sItem.name}
                      >
                        {sItem.name || "Product Item"}
                      </Link>

                      <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "3px" }}>
                        by {sItem.vendorName || "Merchant"}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                        <strong style={{ fontSize: "14px", color: "#0f172a" }}>
                          ₹{Number(sItem.price || 0).toLocaleString("en-IN")}
                        </strong>
                        <span style={{ fontSize: "11px", color: inStock ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
                          {inStock ? "In Stock" : "Unavailable"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for Saved Item */}
                  <div style={{ marginTop: "auto", paddingTop: "12px", borderTop: "1px solid #f1f5f9", display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleMoveToCart(sItemId)}
                      disabled={isMoving || isRemoving}
                      style={{
                        flex: 1,
                        fontSize: "12px",
                        padding: "7px 10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px"
                      }}
                    >
                      <ShoppingCart size={13} />
                      <span>{isMoving ? "Moving..." : "Move to Bag"}</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => handleRemove(sItemId)}
                      disabled={isMoving || isRemoving}
                      title="Remove saved item"
                      style={{
                        padding: "7px 10px",
                        fontSize: "12px",
                        color: "#64748b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CONFIRM MODAL FOR ACTIVE ITEM REMOVAL */}
      <ConfirmModal
        isOpen={Boolean(itemToRemove)}
        title="Remove from Bag?"
        message="Would you like to move this item to your wishlist or delete it from your bag?"
        confirmText="Remove"
        showCancel={false}
        secondaryAction={{
          text: "Move to Wishlist",
          icon: <Heart size={15} fill="#f43f5e" color="#f43f5e" />,
          onClick: handleMoveToWishlist,
          loading: movingToWishlist,
          loadingText: "Saving...",
          style: {
            background: "#fff1f2",
            border: "1.5px solid #fecdd3",
            color: "#e11d48",
            borderRadius: "8px",
            padding: "8px 16px",
            fontSize: "13px",
            fontWeight: 600
          }
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
