import React, { useState, useEffect } from "react";
import { Heart, ShoppingCart, Star, Store, Package, MapPin, Zap, Sparkles, Scale, Check, Loader2 } from "lucide-react";
import { getLocationSettings, isProductExpressEligible } from "../services/locationService";
import { addToCompare, removeFromCompare, isInCompare } from "../services/compareService";
import { toast } from "./Toast";

export default function ProductCard({
  product,
  isWishlisted = false,
  onWishlist,
  onAddToCart,
  onBuyNow,
  onClick,
  viewMode = "grid",
  compact = false,
  hubDistanceInfo = null,
}) {
  const [imgError, setImgError] = useState(false);
  const [locSettings, setLocSettings] = useState(getLocationSettings);
  const [isCompared, setIsCompared] = useState(() => product?._id ? isInCompare(product._id) : false);
  const [isAddedSuccess, setIsAddedSuccess] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCartClick = async (e) => {
    e.stopPropagation();
    if (!product?._id || isAdding) return;
    setIsAdding(true);
    try {
      if (onAddToCart) {
        await onAddToCart(e, product._id);
      }
      setIsAddedSuccess(true);
      setTimeout(() => {
        setIsAddedSuccess(false);
      }, 1800);
    } catch (err) {
      console.error("Add to cart error:", err);
    } finally {
      setIsAdding(false);
    }
  };

  useEffect(() => {
    if (product?._id) {
      setIsCompared(isInCompare(product._id));
    }
    const onCompareUpdate = () => {
      if (product?._id) {
        setIsCompared(isInCompare(product._id));
      }
    };
    window.addEventListener("product-compare-updated", onCompareUpdate);
    return () => window.removeEventListener("product-compare-updated", onCompareUpdate);
  }, [product?._id]);

  const handleToggleCompare = (e) => {
    e.stopPropagation();
    if (!product) return;
    if (isCompared) {
      removeFromCompare(product._id);
      setIsCompared(false);
      toast.info(`Removed ${product.name} from comparison`);
    } else {
      try {
        addToCompare(product);
        setIsCompared(true);
        toast.success(`Added ${product.name} to comparison`);
      } catch (err) {
        toast.warning(err.message || 'Cannot add to comparison');
      }
    }
  };

  useEffect(() => {
    const onSettingsChange = (e) => {
      setLocSettings(e.detail || getLocationSettings());
    };
    window.addEventListener("address-settings-changed", onSettingsChange);
    return () => window.removeEventListener("address-settings-changed", onSettingsChange);
  }, []);

  if (!product) return null;

  const outOfStock = Number(product.quantity) <= 0;
  const displayCategory = product.category || "Others";
  const ratingScore = Number(product.rating || 4.3).toFixed(1);
  const ratingCount = product.ratingCount || 28;
  const discount =
    product.discountPercentage !== undefined && product.discountPercentage !== null
      ? Number(product.discountPercentage)
      : 10;
  const originalPrice = Number(product.price || 0);
  const discountedPrice = Math.round(originalPrice * (1 - discount / 100));

  const handleCardClick = () => {
    if (onClick) onClick(product._id);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && onClick) onClick(product._id);
  };

  // Evaluate real-time delivery eligibility:
  // 1. Settings check: Is express badge enabled in settings?
  // 2. Location check: Is the active delivery address within express range of an active hub (up to 100km)?
  // 3. Product check: Does the product qualify (Grocery/Essentials only, or All Products if toggled)?
  const isEligibleForExpress = Boolean(
    locSettings.showExpressBadges !== false &&
    hubDistanceInfo &&
    hubDistanceInfo.eligible === true &&
    (hubDistanceInfo.distanceKm === null || Number(hubDistanceInfo.distanceKm) <= (locSettings.expressRadiusKm || 100)) &&
    isProductExpressEligible(product, locSettings.expressCategoriesOnly !== false)
  );

  const renderExpressBadge = () => {
    if (!isEligibleForExpress) return null;

    const style = locSettings.badgeStyle || "express_time";

    if (style === "free_delivery") {
      return (
        <div className="product-card-express-row">
          <span className="product-hub-distance-badge fast">
            <Sparkles size={11} />
            Free Delivery Available
          </span>
        </div>
      );
    }

    if (style === "dispatched_hub") {
      const city = hubDistanceInfo.hubCity || product.city || "Local";
      return (
        <div className="product-card-express-row">
          <span className="product-hub-distance-badge">
            <Store size={11} />
            Dispatched from {city} Hub
          </span>
        </div>
      );
    }

    // Default 'express_time' - dynamic speed without raw distance numbers:
    let speedText = "Express Delivery";
    if (hubDistanceInfo.speedLabel === "30 mins") {
      speedText = "Express • 30 mins";
    } else if (hubDistanceInfo.speedLabel === "Under 2h") {
      speedText = "Express • Under 2h";
    } else if (hubDistanceInfo.speedLabel === "Same-Day") {
      speedText = "Express • Same-Day";
    } else if (hubDistanceInfo.speedLabel === "Next-Day" || hubDistanceInfo.speedLabel === "Tomorrow") {
      speedText = "Express • Next-Day";
    }

    return (
      <div className="product-card-express-row">
        <span className="product-hub-distance-badge fast">
          <Zap size={11} />
          {speedText}
        </span>
      </div>
    );
  };

  if (viewMode === "list") {
    return (
      <div
        className="adv-list-card clickable-catalog-card"
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <div className="adv-list-visual-box">
          <button
            className={`product-wishlist-icon ${isWishlisted ? "is-wishlisted active" : ""}`}
            type="button"
            aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
            onClick={(e) => onWishlist && onWishlist(e, product._id)}
          >
            <Heart
              size={16}
              fill={isWishlisted ? "#ef4444" : "none"}
              stroke={isWishlisted ? "#ef4444" : "#64748b"}
            />
          </button>
          <button
            className={`product-compare-icon ${isCompared ? "is-compared active" : ""}`}
            type="button"
            aria-label={isCompared ? `Remove ${product.name} from comparison` : `Compare ${product.name}`}
            onClick={handleToggleCompare}
            title={isCompared ? "Remove from comparison" : "Compare product"}
          >
            <Scale size={14} />
          </button>
          <div className="adv-list-img-frame">
            {!imgError && (product.image || product.images?.[0]) ? (
              <img
                src={product.image || product.images[0]}
                alt=""
                className="adv-list-img"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={() => setImgError(true)}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  width: "100%",
                  height: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#94a3b8"
                }}
              >
                <Package size={36} strokeWidth={1.2} />
              </div>
            )}
          </div>
        </div>

        <div className="adv-list-body">
          <div className="adv-list-header-row">
            <span className="adv-product-category-tag">{displayCategory}</span>
            <div className="adv-product-star-pill" title={`${ratingScore} out of 5 (${ratingCount} ratings)`}>
              <span>{ratingScore}</span>
              <Star size={11} fill="currentColor" />
              <span className="adv-star-count">({ratingCount})</span>
            </div>
          </div>

          {renderExpressBadge()}

          <h3 className="adv-list-title" title={product.name}>
            {product.name}
          </h3>

          <div className="adv-list-vendor-row">
            <Store size={13} className="adv-vendor-store-icon" />
            <span className="adv-product-vendor-text">{product.vendorName || "Unknown"}</span>
            <span className="adv-bullet-separator">•</span>
            <span className={`adv-stock-indicator ${outOfStock ? "zero" : ""}`}>
              {outOfStock ? "Unavailable" : `Stock: ${product.quantity}`}
            </span>
          </div>

          <p
            className="adv-list-desc"
            title={product.description || (product.category ? `${product.category} • Verified Quality` : "Quality product from verified vendor")}
          >
            {product.description || (product.category ? `${product.category} • Verified Quality` : "Quality product from verified vendor")}
          </p>
        </div>

        <div className="adv-list-action-col" onClick={(e) => e.stopPropagation()}>
          <div className="adv-myntra-price-row list-align">
            <span className="adv-selling-price">Rs. {discountedPrice.toLocaleString("en-IN")}</span>
            <span className="adv-original-price">Rs. {Math.round(originalPrice).toLocaleString("en-IN")}</span>
            <span className="adv-discount-tag">({discount}% OFF)</span>
          </div>

          <div className="adv-list-btns">
            {outOfStock ? (
              <button className="btn btn-disabled adv-list-btn" disabled>
                Out of Stock
              </button>
            ) : (
              <>
                <button
                  className={`btn btn-outline adv-list-btn adv-list-cart-btn ${isAddedSuccess ? "is-added" : ""}`}
                  title={isAddedSuccess ? "Added to Cart!" : "Add to Cart"}
                  onClick={handleAddToCartClick}
                  disabled={isAdding}
                >
                  {isAddedSuccess ? (
                    <>
                      <Check size={15} strokeWidth={3} className="adv-cart-done-check" />
                      <span>Added!</span>
                    </>
                  ) : isAdding ? (
                    <>
                      <Loader2 size={15} className="spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={15} />
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>
                <button
                  className="btn btn-primary adv-list-btn adv-list-buy-btn"
                  onClick={(e) => onBuyNow && onBuyNow(e, product)}
                >
                  Buy Now
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`product-card adv-product-card clickable-catalog-card ${compact ? "carousel-card" : ""}`}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="adv-card-visual-top">
        <button
          className={`product-wishlist-icon ${isWishlisted ? "is-wishlisted active" : ""}`}
          type="button"
          aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          onClick={(e) => onWishlist && onWishlist(e, product._id)}
        >
          <Heart
            size={18}
            fill={isWishlisted ? "#ef4444" : "none"}
            stroke={isWishlisted ? "#ef4444" : "#64748b"}
          />
        </button>
        <button
          className={`product-compare-icon ${isCompared ? "is-compared active" : ""}`}
          type="button"
          aria-label={isCompared ? `Remove ${product.name} from comparison` : `Compare ${product.name}`}
          onClick={handleToggleCompare}
          title={isCompared ? "Remove from comparison" : "Compare product"}
        >
          <Scale size={16} />
        </button>

        <div className="adv-card-top-badges">
          <span className="adv-product-category-tag">{displayCategory}</span>
          {product.matchScore && (
            <span
              className="adv-match-score-tag"
              style={{
                background: '#2563eb',
                color: '#ffffff',
                padding: '2px 7px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                boxShadow: '0 1px 3px rgba(37, 99, 235, 0.25)'
              }}
              title={`Recommendation Engine Match Score: ${product.matchScore}%`}
            >
              <Sparkles size={10} /> {product.matchScore}% Match
            </span>
          )}
          {outOfStock && <span className="adv-out-of-stock-tag">Out of Stock</span>}
        </div>

        <div className="adv-card-img-wrap">
          {!imgError && (product.image || product.images?.[0]) ? (
            <img
              src={product.image || product.images[0]}
              alt=""
              className="adv-card-img"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={() => setImgError(true)}
            />
          ) : (
            <div
              style={{
                display: "flex",
                width: "100%",
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
                color: "#94a3b8"
              }}
            >
              <Package size={54} strokeWidth={1.2} />
            </div>
          )}
        </div>
      </div>

      <div className="product-card-body">
        {renderExpressBadge()}

        {product.recommendationReason && (
          <div
            className="adv-rec-reason-pill"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              color: '#1d4ed8',
              background: '#eff6ff',
              border: '1px solid #dbeafe',
              padding: '2px 7px',
              borderRadius: '6px',
              margin: '2px 0 6px 0',
              fontWeight: 600,
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
            title={product.recommendationReason}
          >
            <Sparkles size={11} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {product.recommendationReason}
            </span>
          </div>
        )}

        <h2 className="adv-product-title" title={product.name}>
          {product.name}
        </h2>

        <p
          className="adv-product-desc"
          title={product.description || (product.category ? `${product.category} • Verified Quality` : "Quality product from verified vendor")}
        >
          {product.description || (product.category ? `${product.category} • Verified Quality` : "Quality product from verified vendor")}
        </p>

        <div className="adv-product-vendor-rating-row">
          <div className="adv-product-vendor-row">
            <Store size={13} className="adv-vendor-store-icon" />
            <span className="adv-product-vendor-text">{product.vendorName || "Unknown"}</span>
          </div>

          <div className="adv-product-star-pill" title={`${ratingScore} out of 5 (${ratingCount} ratings)`}>
            <span>{ratingScore}</span>
            <Star size={11} fill="currentColor" />
            <span className="adv-star-count">({ratingCount})</span>
          </div>
        </div>

        <div className="adv-myntra-price-row">
          <span className="adv-selling-price">Rs. {discountedPrice.toLocaleString("en-IN")}</span>
          <span className="adv-original-price">Rs. {Math.round(originalPrice).toLocaleString("en-IN")}</span>
          <span className="adv-discount-tag">({discount}% OFF)</span>
        </div>

        <div className="adv-card-meta-stock">
          <span className={`adv-stock-indicator ${outOfStock ? "zero" : ""}`}>
            {outOfStock ? "Unavailable" : `Stock: ${product.quantity}`}
          </span>
        </div>
      </div>

      <div className="product-actions" onClick={(e) => e.stopPropagation()}>
        {outOfStock ? (
          <button className="btn btn-disabled adv-card-btn-disabled" disabled>
            Out of Stock
          </button>
        ) : (
          <div className="product-purchase-actions">
            <button
              className={`btn btn-primary adv-cart-icon-btn ${isAddedSuccess ? "is-added" : ""}`}
              title={isAddedSuccess ? "Added to Cart!" : "Add to Cart"}
              aria-label={isAddedSuccess ? "Added to Cart" : "Add to Cart"}
              onClick={handleAddToCartClick}
              disabled={isAdding}
            >
              {isAddedSuccess ? (
                <Check size={18} strokeWidth={3} className="adv-cart-done-check" />
              ) : isAdding ? (
                <Loader2 size={16} className="spin" />
              ) : (
                <ShoppingCart size={17} />
              )}
            </button>
            <button
              className="btn btn-primary adv-buy-now-btn"
              onClick={(e) => onBuyNow && onBuyNow(e, product)}
            >
              Buy Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

