import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Sparkles,
  Search,
  ArrowUpDown,
  RotateCcw,
  CheckCircle2,
  PackageOpen,
  ShoppingBag,
  Star,
  Loader2
} from "lucide-react";
import { getRecommendedForYou } from "../../services/recommendationService";
import { addToCart } from "../../services/cartService";
import { getWishlist, addToWishlist, removeFromWishlist } from "../../services/wishlistService";
import { getNearestHub } from "../../services/locationService";
import ProductCard from "../../components/ProductCard";
import CustomSelect from "../../components/CustomSelect";
import { toast } from "../../components/Toast";
import "./RecommendedProducts.css";

const PAGE_SIZE = 12; // 12 items per batch (4 full rows of 3)

const SORT_OPTIONS = [
  { value: "match_desc", label: "Best Match (Highest Affinity)" },
  { value: "rating_desc", label: "Highest Customer Rating (5★)" },
  { value: "discount_desc", label: "Biggest Discount %" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" }
];

export default function RecommendedProducts() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL query state
  const initialCategory = searchParams.get("category") || "All";
  const initialSort = searchParams.get("sort") || "match_desc";

  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [categories, setCategories] = useState(["All"]);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState(initialSort);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [userSignals, setUserSignals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [wishlistMap, setWishlistMap] = useState({});
  const [nearestHub, setNearestHub] = useState(null);

  const sentinelRef = useRef(null);
  const fetchingRef = useRef(false);

  // Sync debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load user wishlist & nearest hub once on mount
  useEffect(() => {
    getWishlist()
      .then((data) => {
        const items = Array.isArray(data) ? data : data?.items || [];
        const map = {};
        items.forEach((item) => {
          const id = item.productId?._id || item.product?._id || item._id;
          if (id) map[String(id)] = true;
        });
        setWishlistMap(map);
      })
      .catch(() => {});

    getNearestHub()
      .then((hub) => setNearestHub(hub))
      .catch(() => {});
  }, []);

  // Customer ID lookup helper
  const getCustomerId = () => {
    try {
      const stored = JSON.parse(localStorage.getItem("user") || localStorage.getItem("customer") || "{}");
      return stored._id || stored.id || stored.customerId || null;
    } catch {
      return null;
    }
  };

  // Fetch a specific page
  const fetchPage = useCallback(async (pageNum, isAppend = false) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    if (isAppend) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const customerId = getCustomerId();
      const res = await getRecommendedForYou(customerId, PAGE_SIZE, {
        page: pageNum,
        category: selectedCategory,
        sortBy,
        search: debouncedSearch
      });

      const newItems = res?.items || (Array.isArray(res) ? res : []);
      const totalCount = res?.total ?? newItems.length;
      const totalPages = res?.totalPages || Math.ceil(totalCount / PAGE_SIZE) || 1;

      if (isAppend) {
        setProducts((prev) => {
          // Avoid duplicate keys
          const existingIds = new Set(prev.map((p) => String(p._id)));
          const filteredNew = newItems.filter((p) => !existingIds.has(String(p._id)));
          return [...prev, ...filteredNew];
        });
      } else {
        setProducts(newItems);
      }

      setTotal(totalCount);
      setPage(pageNum);
      setHasMore(pageNum < totalPages && newItems.length > 0);

      if (res?.categories && res.categories.length > 0) {
        setCategories(res.categories);
      }
      if (res?.userSignals) {
        setUserSignals(res.userSignals);
      }
    } catch (err) {
      console.error("Failed to load recommendations:", err);
      toast.error("Unable to load recommendations");
    } finally {
      fetchingRef.current = false;
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedCategory, sortBy, debouncedSearch]);

  // Initial load or when filters change -> reset and load page 1
  useEffect(() => {
    fetchPage(1, false);
  }, [fetchPage]);

  // Infinite scroll observer: trigger next page when sentinel is in view
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loading && !loadingMore && !fetchingRef.current) {
          fetchPage(page + 1, true);
        }
      },
      { rootMargin: "300px 0px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, page, fetchPage]);

  // Category select
  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      if (cat === "All") p.delete("category");
      else p.set("category", cat);
      return p;
    });
  };

  // Sort change
  const handleSortChange = (val) => {
    setSortBy(val);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      if (val === "match_desc") p.delete("sort");
      else p.set("sort", val);
      return p;
    });
  };

  // Reset filters
  const handleResetFilters = () => {
    setSelectedCategory("All");
    setSortBy("match_desc");
    setSearchQuery("");
    setDebouncedSearch("");
    setSearchParams({});
  };

  // Wishlist handler
  const handleWishlist = async (e, productId) => {
    e.stopPropagation();
    const isW = Boolean(wishlistMap[String(productId)]);
    try {
      if (isW) {
        await removeFromWishlist(productId);
        setWishlistMap((prev) => {
          const next = { ...prev };
          delete next[String(productId)];
          return next;
        });
        toast.info("Removed from wishlist");
      } else {
        await addToWishlist(productId);
        setWishlistMap((prev) => ({ ...prev, [String(productId)]: true }));
        toast.success("Added to wishlist");
      }
    } catch (err) {
      toast.error(err.message || "Failed to update wishlist");
    }
  };

  // Add to cart handler
  const handleAddToCart = async (e, productId) => {
    e.stopPropagation();
    try {
      await addToCart(productId, 1);
      toast.success("Added to cart");
      window.dispatchEvent(new CustomEvent("cart-updated"));
    } catch (err) {
      toast.error(err.message || "Failed to add to cart");
    }
  };

  // Buy now handler
  const handleBuyNow = async (e, product) => {
    e.stopPropagation();
    try {
      await addToCart(product._id, 1);
      window.dispatchEvent(new CustomEvent("cart-updated"));
      navigate("/customer/checkout");
    } catch (err) {
      toast.error("Failed to proceed to checkout");
    }
  };

  // Product click handler
  const handleProductClick = (productId) => {
    navigate(`/customer/products/${productId}`);
  };

  const hasActiveFilters = selectedCategory !== "All" || debouncedSearch !== "" || sortBy !== "match_desc";

  return (
    <div className="rec-page-container">
      {/* 1. Hero Header - Styled with App Theme */}
      <div className="rec-hero-banner">
        <div className="rec-hero-content">
          <div className="rec-hero-badge">
            <Sparkles size={13} className="rec-sparkle-icon" />
            <span>Curated For You • Recommendation Engine</span>
          </div>
          <h1 className="rec-hero-title">Personalized Recommendations</h1>
          <p className="rec-hero-subtitle">
            {userSignals?.topCategory
              ? `Tailored based on your orders, wishlist, and top interest in ${userSignals.topCategory}`
              : "Intelligently scored picks matched to your shopping preferences, review confidence, and trending demand"}
          </p>

          <div className="rec-hero-pills">
            <span className="rec-meta-pill active-pill">
              <CheckCircle2 size={13} />
              Multi-Signal Scoring Active
            </span>
            <span className="rec-meta-pill count-pill">
              <ShoppingBag size={13} />
              {total} Curated Products
            </span>
            {userSignals?.topCategory && (
              <span className="rec-meta-pill affinity-pill">
                <Star size={13} />
                Affinity: {userSignals.topCategory}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Control Bar (Search, Category Pills, Sort) */}
      <div className="rec-controls-section">
        <div className="rec-controls-top-row">
          {/* Search inside recommendations */}
          <div className="rec-search-wrapper">
            <Search size={16} className="rec-search-icon" />
            <input
              type="text"
              placeholder="Search in recommendations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rec-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="rec-search-clear"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Custom Sort dropdown (No native dropdown) */}
          <div className="rec-sort-wrapper">
            <CustomSelect
              value={sortBy}
              onChange={handleSortChange}
              options={SORT_OPTIONS}
              prefixIcon={<ArrowUpDown size={14} style={{ color: "#64748b" }} />}
              ariaLabel="Sort recommendations"
              size="md"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="rec-category-pills-row">
          <div className="rec-category-pills-track">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`rec-cat-pill ${selectedCategory === cat ? "active" : ""}`}
                onClick={() => handleSelectCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              className="rec-reset-btn"
              onClick={handleResetFilters}
              title="Reset all filters"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Product Cards Grid - Exactly 3 per row on desktop */}
      <div className="rec-grid-section">
        {loading ? (
          <div className="rec-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rec-skeleton-card">
                <div className="rec-skeleton-img" />
                <div className="rec-skeleton-body">
                  <div className="rec-skeleton-line short" />
                  <div className="rec-skeleton-line title" />
                  <div className="rec-skeleton-line price" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rec-empty-state">
            <PackageOpen size={52} strokeWidth={1.2} className="rec-empty-icon" />
            <h3>No recommendations matched your criteria</h3>
            <p>Try resetting the category filter or clearing your search term to see more items.</p>
            <button
              type="button"
              className="rec-empty-btn"
              onClick={handleResetFilters}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            <div className="rec-grid">
              {products.map((product) => (
                <div key={product._id} className="rec-card-wrap">
                  <ProductCard
                    product={product}
                    isWishlisted={Boolean(wishlistMap[String(product._id)])}
                    onWishlist={handleWishlist}
                    onAddToCart={handleAddToCart}
                    onBuyNow={(e) => handleBuyNow(e, product)}
                    onClick={handleProductClick}
                    compact={false}
                    hubDistanceInfo={nearestHub}
                  />
                </div>
              ))}

              {/* Append skeleton loaders while scrolling */}
              {loadingMore &&
                Array.from({ length: 3 }).map((_, idx) => (
                  <div key={`loading-more-${idx}`} className="rec-skeleton-card">
                    <div className="rec-skeleton-img" />
                    <div className="rec-skeleton-body">
                      <div className="rec-skeleton-line short" />
                      <div className="rec-skeleton-line title" />
                      <div className="rec-skeleton-line price" />
                    </div>
                  </div>
                ))}
            </div>

            {/* Invisible sentinel for IntersectionObserver infinite scrolling */}
            <div ref={sentinelRef} className="rec-scroll-sentinel" style={{ height: "40px", width: "100%" }} />

            {/* Footer status indicator */}
            {!hasMore && products.length > 0 && (
              <div className="rec-end-message">
                <span>✓ You have explored all {total} recommendations</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
