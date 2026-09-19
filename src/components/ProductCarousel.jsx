import React, { useRef } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import ProductCard from "./ProductCard";

export default function ProductCarousel({
  title,
  subtitle,
  badge,
  icon: Icon,
  products = [],
  loading = false,
  onViewAll,
  viewAllLabel = "View All",
  wishlistMap = {},
  onWishlist,
  onAddToCart,
  onBuyNow,
  onProductClick,
  hubDistanceInfo = null,
}) {
  const trackRef = useRef(null);

  const handleScroll = (direction) => {
    if (!trackRef.current) return;
    const scrollAmount = 300 * (direction === "left" ? -1 : 1);
    trackRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  if (!loading && (!products || products.length === 0)) {
    return null;
  }

  return (
    <section className="product-carousel-section" aria-label={title}>
      <div className="carousel-header">
        <div className="carousel-header-left">
          {badge && (
            <div className="carousel-badge">
              {Icon && <Icon size={12} />}
              <span>{badge}</span>
            </div>
          )}
          <h2 className="carousel-title">{title}</h2>
          {subtitle && <p className="carousel-subtitle">{subtitle}</p>}
        </div>

        <div className="carousel-header-right">
          {onViewAll && (
            <button
              type="button"
              className="carousel-view-all-btn"
              onClick={onViewAll}
            >
              <span>{viewAllLabel}</span>
              <ArrowRight size={14} />
            </button>
          )}

          <div className="carousel-nav-arrows">
            <button
              type="button"
              className="carousel-arrow-btn"
              onClick={() => handleScroll("left")}
              aria-label={`Scroll ${title} left`}
              title="Previous"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              className="carousel-arrow-btn"
              onClick={() => handleScroll("right")}
              aria-label={`Scroll ${title} right`}
              title="Next"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="carousel-track-wrapper">
        <div className="carousel-track" ref={trackRef}>
          {loading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="carousel-skeleton-card">
                <div className="skeleton-img-box" />
                <div className="skeleton-content-box">
                  <div className="skeleton-line title" />
                  <div className="skeleton-line sub" />
                  <div className="skeleton-line price" />
                </div>
              </div>
            ))
          ) : (
            products.map((product) => (
              <div key={product._id} className="carousel-item-wrap">
                <ProductCard
                  product={product}
                  isWishlisted={Boolean(wishlistMap[String(product._id)])}
                  onWishlist={onWishlist}
                  onAddToCart={onAddToCart}
                  onBuyNow={onBuyNow}
                  onClick={onProductClick}
                  compact={true}
                  hubDistanceInfo={hubDistanceInfo}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

