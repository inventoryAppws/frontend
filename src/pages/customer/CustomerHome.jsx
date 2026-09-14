import { useCallback, useEffect, useRef, useState } from "react";
import {
  Heart,
  Search,
  X,
  SlidersHorizontal,
  Store,
  Tag,
  Package,
  ArrowUpDown,
  RotateCcw,
  Star,
  Check,
  Filter,
  ShoppingCart,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  LayoutGrid,
  List,
  Sparkles,
  Smartphone,
  Shirt,
  Footprints,
  Tv,
  UtensilsCrossed,
  Armchair,
  Gamepad2,
  Dumbbell,
  Coffee,
  CheckCircle2,
  ChevronDown
} from "lucide-react";
import { useNavigate, useSearchParams, useOutletContext } from "react-router-dom";
import { addToCart } from "../../services/cartService";
import { getWishlist, addToWishlist, removeFromWishlist } from "../../services/wishlistService";
import { getPublicProducts, getProductSearchMeta } from "../../services/productService";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";
import WishlistCollectionPicker from "../../components/WishlistCollectionPicker";
import { toast } from "../../components/Toast";
import { getErrorMessage } from "../../utils/errorHandler";

const PAGE_SIZE = 20;

const SORT_OPTIONS = [
  { id: "newest", label: "Newest First", desc: "Fresh arrivals & latest products", icon: Clock },
  { id: "price_asc", label: "Price: Low to High", desc: "Budget friendly first", icon: ArrowUpRight },
  { id: "price_desc", label: "Price: High to Low", desc: "Premium & luxury first", icon: ArrowDownRight },
  { id: "rating_desc", label: "Highest Rated", desc: "Top customer ratings & reviews", icon: Star },
  { id: "name_asc", label: "Name: A to Z", desc: "Alphabetical product catalog", icon: Tag },
];

const HERO_SLIDES = [
  { id: 1, img: "/banners/banner-slide-1.jpg?v=3", alt: "Great Products Great Prices" },
  { id: 2, img: "/banners/banner-slide-2.jpg?v=3", alt: "Make Everyday Life Easier" },
  { id: 3, img: "/banners/banner-slide-3.jpg?v=3", alt: "Style for Every You" },
  { id: 4, img: "/banners/banner-slide-4.jpg?v=3", alt: "Upgrade to Smarter Living" },
  { id: 5, img: "/banners/banner-slide-5.jpg?v=3", alt: "Fresh Choices Brighter Living" },
  { id: 6, img: "/banners/banner-slide-6.jpg?v=3", alt: "Big Savings Happier Days" },
];

const getCategoryIcon = (categoryName) => {
  const norm = String(categoryName || "").toLowerCase().trim();
  if (norm.includes("electronic") || norm.includes("phone")) return Smartphone;
  if (norm.includes("fashion") || norm.includes("cloth") || norm.includes("apparel")) return Shirt;
  if (norm.includes("shoe") || norm.includes("footwear")) return Footprints;
  if (norm.includes("appliance")) return Tv;
  if (norm.includes("kitchen") || norm.includes("cook")) return UtensilsCrossed;
  if (norm.includes("home") || norm.includes("furnitur") || norm.includes("living")) return Armchair;
  if (norm.includes("beauty") || norm.includes("care") || norm.includes("cosmetic")) return Sparkles;
  if (norm.includes("sport") || norm.includes("fitness") || norm.includes("gym")) return Dumbbell;
  if (norm.includes("game") || norm.includes("gaming")) return Gamepad2;
  if (norm.includes("food") || norm.includes("beverage") || norm.includes("gourmet")) return Coffee;
  return LayoutGrid;
};

function CustomerHome() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { cartCount = 0, setCartCount, reloadCart } = useOutletContext() || {};
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const sentinelRef = useRef(null);
  const searchContainerRef = useRef(null);

  // 3-second slideshow interval for header banner
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Search input and applied query state
  const [searchInput, setSearchInput] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [searchScope, setSearchScope] = useState("all"); // "all" | "name" | "vendor" | "category"
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "All");
  const [selectedVendors, setSelectedVendors] = useState([]); // array of vendor names, e.g. ["vera", "jk"]
  const [sortBy, setSortBy] = useState("newest"); // "newest" | "price_asc" | "price_desc" | "rating_desc" | "name_asc"

  // Advanced Filters (Applied)
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [appliedMinPrice, setAppliedMinPrice] = useState("");
  const [appliedMaxPrice, setAppliedMaxPrice] = useState("");
  const [availability, setAvailability] = useState("all"); // "all" | "in_stock" | "out_of_stock"
  const [minRating, setMinRating] = useState(0); // 0, 4, 3, 2, 1

  // Wide Filter Modal & Draft States (Staged filters before Apply)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [draftCategory, setDraftCategory] = useState(selectedCategory);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [draftMinPrice, setDraftMinPrice] = useState("");
  const [draftMaxPrice, setDraftMaxPrice] = useState("");
  const [draftAvailability, setDraftAvailability] = useState("all");
  const [draftMinRating, setDraftMinRating] = useState(0);
  const [draftVendors, setDraftVendors] = useState([]);
  const [vendorDropdownOpen, setVendorDropdownOpen] = useState(false);
  const [vendorSearchQuery, setVendorSearchQuery] = useState("");

  // Autocomplete and metadata state
  const [meta, setMeta] = useState({
    categories: [],
    vendors: [],
    suggestions: { categories: [], vendors: [], products: [] },
    priceBounds: { min: 0, max: 100000 },
    availabilityCounts: { inStock: 0, outOfStock: 0, total: 0 }
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [scopeDropdownOpen, setScopeDropdownOpen] = useState(false);
  const scopeDropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const [wishlistMap, setWishlistMap] = useState({});
  const [wishlistProductToSave, setWishlistProductToSave] = useState(null);

  // Products and pagination state
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState("");

  // Sync with URL params if category changes externally
  useEffect(() => {
    const urlCat = searchParams.get("category");
    if (urlCat) {
      setSelectedCategory(urlCat);
    }
  }, [searchParams]);

  // Load customer's wishlist items
  const loadWishlist = useCallback(async () => {
    try {
      const data = await getWishlist();
      const items = Array.isArray(data) ? data : data?.items || [];
      const map = {};
      items.forEach((it) => {
        const pId = it.productId?._id || it.productId || it.product?._id || it.product;
        if (pId) {
          map[String(pId)] = it._id || it.id || true;
        }
      });
      setWishlistMap(map);
    } catch {
      // Guest or not logged in, ignore
    }
  }, []);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  // Load metadata (categories, active vendors, price bounds)
  const loadSearchMeta = useCallback(async (queryText = "") => {
    try {
      const data = await getProductSearchMeta(queryText);
      setMeta(
        data || {
          categories: [],
          vendors: [],
          suggestions: { categories: [], vendors: [], products: [] },
          priceBounds: { min: 0, max: 100000 },
          availabilityCounts: { inStock: 0, outOfStock: 0, total: 0 }
        }
      );
    } catch {
      // Non-blocking for metadata
    }
  }, []);

  // Initial metadata fetch
  useEffect(() => {
    loadSearchMeta();
  }, [loadSearchMeta]);

  // Live autocomplete suggestions when search input changes
  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadSearchMeta(searchInput);
    }, 200);
    return () => window.clearTimeout(timer);
  }, [searchInput, loadSearchMeta]);

  // Close autocomplete dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (scopeDropdownRef.current && !scopeDropdownRef.current.contains(event.target)) {
        setScopeDropdownOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
        setScopeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Load products based on current active filters
  const loadProducts = useCallback(
    async (requestedPage = 1, append = false) => {
      append ? setLoadingMore(true) : setLoading(true);
      setError("");
      try {
        const data = await getPublicProducts({
          page: requestedPage,
          limit: PAGE_SIZE,
          search: submittedSearch,
          category: selectedCategory,
          vendors: selectedVendors,
          scope: searchScope,
          sortBy,
          minPrice: appliedMinPrice,
          maxPrice: appliedMaxPrice,
          availability,
          minRating: minRating > 0 ? minRating : undefined
        });
        const nextItems = data?.items || [];
        setProducts((current) => (append ? [...current, ...nextItems] : nextItems));
        const actualPage = data?.page || requestedPage;
        setPage(actualPage);
        setTotalProducts(data?.total ?? 0);
        setHasMore(actualPage < (data?.totalPages || 1));
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      } finally {
        append ? setLoadingMore(false) : setLoading(false);
      }
    },
    [
      submittedSearch,
      selectedCategory,
      selectedVendors,
      searchScope,
      sortBy,
      appliedMinPrice,
      appliedMaxPrice,
      availability,
      minRating
    ]
  );

  // Trigger load whenever applied filters change
  useEffect(() => {
    loadProducts(1, false);
  }, [loadProducts]);

  // Infinite scrolling observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loading && !loadingMore) {
          loadProducts(page + 1, true);
        }
      },
      { rootMargin: "240px" }
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, loadProducts, page]);

  // Search submission
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setSubmittedSearch(searchInput.trim());
    setIsDropdownOpen(false);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSubmittedSearch("");
    setIsDropdownOpen(false);
  };

  const openFilterModal = () => {
    setDraftCategory(selectedCategory);
    setCategoryDropdownOpen(false);
    setCategorySearchQuery("");
    setDraftMinPrice(appliedMinPrice);
    setDraftMaxPrice(appliedMaxPrice);
    setDraftAvailability(availability);
    setDraftMinRating(minRating);
    setDraftVendors([...selectedVendors]);
    setVendorDropdownOpen(false);
    setVendorSearchQuery("");
    setIsFilterModalOpen(true);
  };

  const handleApplyDraftFilters = (e) => {
    if (e) e.preventDefault();
    setSelectedCategory(draftCategory);
    setMinPrice(draftMinPrice);
    setMaxPrice(draftMaxPrice);
    setAppliedMinPrice(draftMinPrice);
    setAppliedMaxPrice(draftMaxPrice);
    setAvailability(draftAvailability);
    setMinRating(draftMinRating);
    setSelectedVendors(draftVendors);
    setIsFilterModalOpen(false);
  };

  const handleResetDraftFilters = () => {
    setDraftCategory("All");
    setDraftMinPrice("");
    setDraftMaxPrice("");
    setDraftAvailability("all");
    setDraftMinRating(0);
    setDraftVendors([]);
  };

  const handleResetAllFilters = () => {
    setSearchInput("");
    setSubmittedSearch("");
    setSearchScope("all");
    setSelectedCategory("All");
    setSelectedVendors([]);
    setSortBy("newest");
    setMinPrice("");
    setMaxPrice("");
    setAppliedMinPrice("");
    setAppliedMaxPrice("");
    setAvailability("all");
    setMinRating(0);
    setIsDropdownOpen(false);
    setIsFilterModalOpen(false);
    setSearchParams({});
  };

  const handleAddToCart = async (e, productId) => {
    e.stopPropagation();
    try {
      await addToCart(productId, 1);
      if (typeof setCartCount === "function") {
        setCartCount((prev) => (Number(prev) || 0) + 1);
      }
      if (typeof reloadCart === "function") {
        reloadCart();
      }
      toast.success("Product added to cart.");
    } catch (actionError) {
      toast.error(getErrorMessage(actionError));
    }
  };

  const handleWishlist = async (e, productId) => {
    e.stopPropagation();
    const strId = String(productId);
    const existingEntryId = wishlistMap[strId];
    try {
      if (existingEntryId && existingEntryId !== true) {
        await removeFromWishlist(existingEntryId);
        setWishlistMap((prev) => {
          const next = { ...prev };
          delete next[strId];
          return next;
        });
        toast.success("Product removed from wishlist.");
      } else {
        setWishlistProductToSave(productId);
      }
    } catch (actionError) {
      toast.error(getErrorMessage(actionError));
    }
  };

  const handleWishlistCollectionSelect = async (collectionId) => {
    if (!wishlistProductToSave) return;
    try {
      const res = await addToWishlist(wishlistProductToSave, collectionId);
      const newId = res?._id || res?.data?._id || true;
      setWishlistMap((prev) => ({ ...prev, [String(wishlistProductToSave)]: newId }));
      setWishlistProductToSave(null);
      toast.success("Product added to wishlist.");
    } catch (actionError) {
      toast.error(getErrorMessage(actionError));
    }
  };

  const handleBuyNow = (e, product) => {
    e.stopPropagation();
    const discount = product.discountPercentage !== undefined && product.discountPercentage !== null ? Number(product.discountPercentage) : 10;
    const origPrice = Number(product.price || 0);
    const finalPrice = Math.round(origPrice * (1 - discount / 100));

    sessionStorage.setItem(
      "buyNowItem",
      JSON.stringify({
        productId: product._id,
        qty: 1,
        price: finalPrice,
        originalPrice: origPrice,
        discountPercentage: discount,
        name: product.name,
        vendorName: product.vendorName || "Unknown"
      })
    );
    navigate("/customer/checkout/address");
  };

  const handleProductCardClick = (productId) => {
    navigate(`/customer/products/${productId}`);
  };

  const isPriceActive = Boolean(appliedMinPrice || appliedMaxPrice);
  const isAvailabilityActive = availability !== "all";
  const isRatingActive = minRating > 0;
  const isVendorActive = selectedVendors.length > 0;
  const isCategoryActive = selectedCategory !== "All";
  const isSearchActive = Boolean(submittedSearch);
  const isSortActive = sortBy !== "newest";

  const activeFiltersCount =
    (isPriceActive ? 1 : 0) +
    (isAvailabilityActive ? 1 : 0) +
    (isRatingActive ? 1 : 0) +
    selectedVendors.length;

  const hasActiveFilters =
    isSearchActive ||
    isCategoryActive ||
    isPriceActive ||
    isAvailabilityActive ||
    isRatingActive ||
    isVendorActive ||
    isSortActive;

  const totalCatalogCount = meta.categories.reduce((acc, cat) => acc + (cat.count || 0), 0);

  return (
    <div className="adv-product-page">
      {/* ========================================================= */}
      {/* 1. HERO & ADVANCED SEARCH BAR                             */}
      {/* ========================================================= */}
      <section className="adv-search-hero-section">
        {/* Background Slideshow Layer (Changes every 3s) */}
        <div className="adv-hero-slideshow-wrap">
          {HERO_SLIDES.map((slide, index) => (
            <div
              key={slide.id}
              className={`adv-hero-slide-bg ${index === activeSlide ? "active" : ""}`}
              style={{ backgroundImage: `url(${slide.img})` }}
              aria-hidden={index !== activeSlide}
            />
          ))}
          <div className="adv-hero-gradient-overlay" />
        </div>

        {/* Hero Left Content */}
        <div className="adv-hero-content-layer">
          <span className="adv-hero-badge">EXPLORE CATALOG</span>
          <h1 className="adv-hero-title">Discover Quality Products</h1>
          <p className="adv-hero-subtitle">
            Shop from verified vendors, top categories and best ratings
          </p>

          {/* Search Bar with Scope Selector & Live Dropdown */}
          <div className="adv-search-box-wrapper" ref={searchContainerRef}>
          <form className="adv-search-input-group" onSubmit={handleSearchSubmit}>
            <div className="adv-scope-dropdown-container" ref={scopeDropdownRef}>
              {/* Custom Scope Dropdown - replaces native <select> */}
              {(() => {
                const SCOPE_OPTIONS = [
                  { value: "all", label: "All Fields" },
                  { value: "name", label: "By Name" },
                  { value: "vendor", label: "By Brand" },
                  { value: "category", label: "By Category" },
                ];
                const activeLabel = SCOPE_OPTIONS.find(o => o.value === searchScope)?.label || "All Fields";
                return (
                  <div className={`adv-scope-custom-select ${scopeDropdownOpen ? "open" : ""}`}>
                    <button
                      type="button"
                      className="adv-scope-trigger"
                      onClick={() => setScopeDropdownOpen(prev => !prev)}
                      aria-haspopup="listbox"
                      aria-expanded={scopeDropdownOpen}
                    >
                      <span>{activeLabel}</span>
                      <svg className="adv-scope-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    {scopeDropdownOpen && (
                      <ul className="adv-scope-options-list" role="listbox" aria-label="Search scope">
                        {SCOPE_OPTIONS.map(opt => (
                          <li
                            key={opt.value}
                            role="option"
                            aria-selected={searchScope === opt.value}
                            className={`adv-scope-option ${searchScope === opt.value ? "selected" : ""}`}
                            onClick={() => {
                              setSearchScope(opt.value);
                              setScopeDropdownOpen(false);
                            }}
                          >
                            {opt.label}
                            {searchScope === opt.value && (
                              <svg className="adv-scope-check" width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="adv-search-input-inner">
              <input
                ref={searchInputRef}
                type="text"
                className="adv-search-input"
                placeholder="Search for products, brands, or categories..."
                value={searchInput}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setIsDropdownOpen(true);
                }}
              />
              {searchInput && (
                <button
                  type="button"
                  className="adv-search-clear-icon-btn"
                  onClick={handleClearSearch}
                  title="Clear search"
                  aria-label="Clear search input"
                >
                  <X size={16} />
                </button>
              )}
              <Search className="adv-search-icon adv-search-icon-right" size={18} />
            </div>

            <button type="submit" className="btn btn-primary adv-search-submit-btn">
              Search
            </button>
          </form>

          {/* Autocomplete Dropdown */}
          {isDropdownOpen && (
            <div className="adv-search-dropdown-menu">
              {searchInput.trim() ? (
                <>
                  {meta.suggestions?.categories?.length > 0 && (
                    <div className="adv-dropdown-section">
                      <div className="adv-dropdown-section-title">
                        <Tag size={13} /> Categories
                      </div>
                      {meta.suggestions.categories.map((cat) => (
                        <button
                          key={cat.name}
                          type="button"
                          className="adv-dropdown-item"
                          onClick={() => {
                            setSelectedCategory(cat.name);
                            setIsDropdownOpen(false);
                          }}
                        >
                          <span className="adv-dropdown-item-text">
                            in <strong>{cat.name}</strong>
                          </span>
                          <span className="adv-dropdown-count-badge">{cat.count} items</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {meta.suggestions?.vendors?.length > 0 && (
                    <div className="adv-dropdown-section">
                      <div className="adv-dropdown-section-title">
                        <Store size={13} /> Brands &amp; Vendors
                      </div>
                      {meta.suggestions.vendors.map((ven) => (
                        <button
                          key={ven.name}
                          type="button"
                          className="adv-dropdown-item"
                          onClick={() => {
                            setSelectedVendors([ven.name]);
                            setIsDropdownOpen(false);
                          }}
                        >
                          <span className="adv-dropdown-item-text">
                            by <strong>{ven.name}</strong>
                          </span>
                          <span className="adv-dropdown-count-badge">{ven.count} items</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {meta.suggestions?.products?.length > 0 && (
                    <div className="adv-dropdown-section">
                      <div className="adv-dropdown-section-title">
                        <Package size={13} /> Matching Products
                      </div>
                      {meta.suggestions.products.map((prod) => (
                        <button
                          key={prod._id}
                          type="button"
                          className="adv-dropdown-item adv-dropdown-product-item"
                          onClick={() => {
                            navigate(`/customer/products/${prod._id}`);
                            setIsDropdownOpen(false);
                          }}
                        >
                          <div className="adv-dropdown-prod-info">
                            <span className="adv-dropdown-item-text font-medium">{prod.name}</span>
                            <span className="adv-dropdown-prod-sub">
                              {prod.vendorName} • {prod.category || "Others"}
                            </span>
                          </div>
                          <span className="adv-dropdown-prod-price">₹{Number(prod.price || 0).toFixed(2)}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {!meta.suggestions?.categories?.length &&
                    !meta.suggestions?.vendors?.length &&
                    !meta.suggestions?.products?.length && (
                      <div className="adv-dropdown-empty">
                        <span>Press <strong>Enter</strong> to search for &quot;{searchInput}&quot; across all fields</span>
                      </div>
                    )}
                </>
              ) : (
                <div className="adv-dropdown-section">
                  <div className="adv-dropdown-section-title">
                    <Tag size={13} /> Popular Categories
                  </div>
                  <div className="adv-dropdown-tag-pills">
                    {meta.categories.map((cat) => (
                      <button
                        key={cat.name}
                        type="button"
                        className="adv-quick-pill"
                        onClick={() => {
                          setSelectedCategory(cat.name);
                          setIsDropdownOpen(false);
                        }}
                      >
                        {cat.name} ({cat.count})
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dynamic Category Pills - compact: All Products + 2 cats + "+N more" */}
        <div className="adv-category-pills-bar" role="tablist" aria-label="Product Categories">
          <button
            type="button"
            className={`adv-cat-pill ${selectedCategory === "All" ? "active" : ""}`}
            onClick={() => setSelectedCategory("All")}
          >
            All Products
            <span className="adv-cat-pill-count">{meta?.availabilityCounts?.total || totalProducts || products.length}</span>
          </button>
          {(meta.categories || []).slice(0, 2).map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();
            return (
              <button
                key={cat.name}
                type="button"
                className={`adv-cat-pill ${isSelected ? "active" : ""}`}
                onClick={() => setSelectedCategory(isSelected ? "All" : cat.name)}
              >
                {cat.name}
                <span className="adv-cat-pill-count">{cat.count}</span>
              </button>
            );
          })}
          {(meta.categories || []).length > 2 && (
            <button
              type="button"
              className="adv-cat-pill adv-cat-pill-more"
              onClick={() => {
                setIsDropdownOpen(true);
                if (searchInputRef.current) {
                  searchInputRef.current.focus();
                }
              }}
              title="View all categories"
            >
              +{(meta.categories || []).length - 2} more
            </button>
          )}
        </div>
        </div>{/* end adv-hero-content-layer */}

        {/* Slide Indicator Dots at Bottom Right */}
        <div className="adv-hero-dots" aria-label="Slideshow Indicators">
          {HERO_SLIDES.map((slide, idx) => (
            <button
              key={slide.id}
              type="button"
              className={`adv-hero-dot ${idx === activeSlide ? "active" : ""}`}
              onClick={() => setActiveSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              title={slide.alt}
            />
          ))}
        </div>
      </section>

      {/* Notifications */}
      <ErrorMessage message={error} onRetry={() => loadProducts(1, false)} />

      {/* ========================================================= */}
      {/* 2. CATALOG TOOLBAR & PRODUCTS (Full Width Layout)         */}
      {/* ========================================================= */}
      <div className="adv-catalog-layout">
        <main className="adv-catalog-main-content">
          {/* Top Sort Bar */}
          <div className="adv-sort-tabs-container">
            <div className="adv-sort-left">
              <button
                type="button"
                className={`adv-toolbar-filter-btn ${activeFiltersCount > 0 ? "active" : ""}`}
                onClick={openFilterModal}
              >
                <SlidersHorizontal size={14} />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="adv-toolbar-filter-badge">{activeFiltersCount}</span>
                )}
              </button>
              <span className="adv-catalog-summary-text">
                Showing <strong>{totalProducts}</strong> {totalProducts === 1 ? "Product" : "Products"}
                {submittedSearch && <span> for &quot;{submittedSearch}&quot;</span>}
              </span>
            </div>

            {/* Popular Sort Tabs */}
            <div className="adv-sort-tabs-list" role="tablist" aria-label="Sort options">
              <span className="adv-sort-label">Sort By:</span>
              <button
                type="button"
                className={`adv-sort-tab-btn ${sortBy === "newest" ? "active" : ""}`}
                onClick={() => setSortBy("newest")}
              >
                Newest First
              </button>
              <button
                type="button"
                className={`adv-sort-tab-btn ${sortBy === "price_asc" ? "active" : ""}`}
                onClick={() => setSortBy("price_asc")}
              >
                Price: Low to High
              </button>
              <button
                type="button"
                className={`adv-sort-tab-btn ${sortBy === "price_desc" ? "active" : ""}`}
                onClick={() => setSortBy("price_desc")}
              >
                Price: High to Low
              </button>
              <button
                type="button"
                className={`adv-sort-tab-btn ${sortBy === "rating_desc" ? "active" : ""}`}
                onClick={() => setSortBy("rating_desc")}
              >
                <Star size={13} fill="currentColor" /> Highest Rated
              </button>
            </div>

            {/* View Mode Toggle: Grid vs List */}
            <div className="adv-view-toggle-group" role="group" aria-label="View Mode">
              <button
                type="button"
                className={`adv-view-btn ${viewMode === "grid" ? "active" : ""}`}
                onClick={() => setViewMode("grid")}
                title="Grid View"
                aria-label="Grid View"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                type="button"
                className={`adv-view-btn ${viewMode === "list" ? "active" : ""}`}
                onClick={() => setViewMode("list")}
                title="List View"
                aria-label="List View"
              >
                <List size={18} />
              </button>
            </div>
          </div>

          {/* Active Filters Bar */}
          {hasActiveFilters && (
            <div className="adv-active-filter-chips">
              <span className="adv-filter-label">
                <SlidersHorizontal size={13} /> Active Filters:
              </span>

              {submittedSearch && (
                <span className="adv-chip">
                  Search: &quot;{submittedSearch}&quot;
                  <button type="button" onClick={handleClearSearch} aria-label="Remove search">
                    <X size={12} />
                  </button>
                </span>
              )}

              {selectedCategory !== "All" && (
                <span className="adv-chip">
                  Category: {selectedCategory}
                  <button type="button" onClick={() => setSelectedCategory("All")} aria-label="Remove category">
                    <X size={12} />
                  </button>
                </span>
              )}

              {selectedVendors.map((ven) => (
                <span key={ven} className="adv-chip">
                  Vendor: {ven}
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedVendors((prev) => prev.filter((v) => v !== ven))
                    }
                    aria-label={`Remove vendor ${ven}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}

              {(appliedMinPrice || appliedMaxPrice) && (
                <span className="adv-chip">
                  Price: ₹{appliedMinPrice || 0} - ₹{appliedMaxPrice || "Any"}
                  <button
                    type="button"
                    onClick={() => {
                      setMinPrice("");
                      setMaxPrice("");
                      setAppliedMinPrice("");
                      setAppliedMaxPrice("");
                    }}
                    aria-label="Remove price filter"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}

              {availability !== "all" && (
                <span className="adv-chip">
                  Availability: {availability === "in_stock" ? "In Stock Only" : "Out of Stock"}
                  <button type="button" onClick={() => setAvailability("all")} aria-label="Remove availability">
                    <X size={12} />
                  </button>
                </span>
              )}

              {minRating > 0 && (
                <span className="adv-chip">
                  Rating: {minRating}★ &amp; above
                  <button type="button" onClick={() => setMinRating(0)} aria-label="Remove rating filter">
                    <X size={12} />
                  </button>
                </span>
              )}

              {sortBy !== "newest" && (
                <span className="adv-chip">
                  Sorted: {sortBy === "rating_desc" ? "Highest Rated" : sortBy === "price_asc" ? "Price Low-High" : "Price High-Low"}
                  <button type="button" onClick={() => setSortBy("newest")} aria-label="Reset sorting">
                    <X size={12} />
                  </button>
                </span>
              )}

              <button type="button" className="adv-clear-all-link" onClick={handleResetAllFilters}>
                <RotateCcw size={12} /> Reset All
              </button>
            </div>
          )}

          {/* Product Grid & Empty State */}
          {loading ? (
            <Loader type="grid" count={8} />
          ) : products.length === 0 ? (
            <div className="adv-search-empty-state">
              <div className="adv-empty-icon-wrap">
                <Search size={36} />
              </div>
              <h2>No matching products found</h2>
              <p>
                We couldn&apos;t find anything matching your selected filters
                {submittedSearch ? ` for "${submittedSearch}"` : ""}.
              </p>
              <ul className="adv-empty-tips">
                <li>Check your price range filters</li>
                <li>Try selecting &quot;All Products&quot; under availability</li>
                <li>Clear rating filter or switch to &quot;All Vendors&quot;</li>
              </ul>
              <button
                type="button"
                className="btn btn-primary adv-empty-reset-btn"
                onClick={handleResetAllFilters}
              >
                <RotateCcw size={16} /> Clear All Filters &amp; View Catalog
              </button>
            </div>
          ) : (
            <>
              {viewMode === "grid" ? (
                <div className="product-grid">
                  {products.map((product) => {
                    const outOfStock = Number(product.quantity) <= 0;
                    const displayCategory = product.category || "Others";
                    const ratingScore = Number(product.rating || 4.3).toFixed(1);
                    const ratingCount = product.ratingCount || 28;
                    const discount = product.discountPercentage !== undefined && product.discountPercentage !== null ? Number(product.discountPercentage) : 10;
                    const originalPrice = Number(product.price || 0);
                    const discountedPrice = Math.round(originalPrice * (1 - discount / 100));

                    const isWishlisted = Boolean(wishlistMap[String(product._id)]);

                    return (
                      <div
                        className="product-card adv-product-card clickable-catalog-card"
                        key={product._id}
                        onClick={() => handleProductCardClick(product._id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleProductCardClick(product._id);
                        }}
                      >
                        <div className="adv-card-visual-top">
                          <button
                            className={`product-wishlist-icon ${isWishlisted ? "is-wishlisted active" : ""}`}
                            type="button"
                            aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
                            onClick={(e) => handleWishlist(e, product._id)}
                          >
                            <Heart
                              size={18}
                              fill={isWishlisted ? "#ef4444" : "none"}
                              stroke={isWishlisted ? "#ef4444" : "#64748b"}
                            />
                          </button>
                          <div className="adv-card-top-badges">
                            <span className="adv-product-category-tag">
                              {displayCategory}
                            </span>
                            {outOfStock ? (
                              <span className="adv-out-of-stock-tag">Out of Stock</span>
                            ) : null}
                          </div>
                          <div className="adv-card-img-wrap">
                            {(product.image || product.images?.[0]) ? (
                              <img
                                src={product.image || product.images[0]}
                                alt={product.name}
                                className="adv-card-img"
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  if (e.target.nextElementSibling) {
                                    e.target.nextElementSibling.style.display = "flex";
                                  }
                                }}
                              />
                            ) : null}
                            <div
                              style={{
                                display: product.image || product.images?.[0] ? "none" : "flex",
                                width: "100%",
                                height: "100%",
                                alignItems: "center",
                                justifyContent: "center"
                              }}
                            >
                              <Package size={54} strokeWidth={1.2} />
                            </div>
                          </div>
                        </div>

                        <div className="product-card-body">
                          {/* Product Title */}
                          <h2 className="adv-product-title" title={product.name}>
                            {product.name}
                          </h2>

                          {/* Product Description (Myntra Subtitle) */}
                          <p
                            className="adv-product-desc"
                            title={product.description || (product.category ? `${product.category} • Verified Quality` : "Quality product from verified vendor")}
                          >
                            {product.description || (product.category ? `${product.category} • Verified Quality` : "Quality product from verified vendor")}
                          </p>

                          {/* Vendor & Rating Row */}
                          <div className="adv-product-vendor-rating-row">
                            <div className="adv-product-vendor-row">
                              <Store size={13} className="adv-vendor-store-icon" />
                              <span className="adv-product-vendor-text">
                                {product.vendorName || "Unknown"}
                              </span>
                            </div>

                            <div className="adv-product-star-pill" title={`${ratingScore} out of 5 (${ratingCount} ratings)`}>
                              <span>{ratingScore}</span>
                              <Star size={11} fill="currentColor" />
                              <span className="adv-star-count">({ratingCount})</span>
                            </div>
                          </div>

                          {/* Price Row (Myntra Style: Discounted Selling Price, Strikethrough MRP, Discount Tag) */}
                          <div className="adv-myntra-price-row">
                            <span className="adv-selling-price">
                              Rs. {discountedPrice.toLocaleString("en-IN")}
                            </span>
                            <span className="adv-original-price">
                              Rs. {Math.round(originalPrice).toLocaleString("en-IN")}
                            </span>
                            <span className="adv-discount-tag">
                              ({discount}% OFF)
                            </span>
                          </div>

                          <div className="adv-card-meta-stock">
                            <span className={`adv-stock-indicator ${outOfStock ? "zero" : ""}`}>
                              {outOfStock ? "Unavailable" : `Stock: ${product.quantity}`}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="product-actions" onClick={(e) => e.stopPropagation()}>
                          {outOfStock ? (
                            <button className="btn btn-disabled adv-card-btn-disabled" disabled>
                              Out of Stock
                            </button>
                          ) : (
                            <div className="product-purchase-actions">
                              <button
                                className="btn btn-primary adv-cart-icon-btn"
                                title="Add to Cart"
                                aria-label="Add to Cart"
                                onClick={(e) => handleAddToCart(e, product._id)}
                              >
                                <ShoppingCart size={17} />
                              </button>
                              <button
                                className="btn btn-primary adv-buy-now-btn"
                                onClick={(e) => handleBuyNow(e, product)}
                              >
                                Buy Now
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="adv-product-list-view">
                  {products.map((product) => {
                    const outOfStock = Number(product.quantity) <= 0;
                    const displayCategory = product.category || "Others";
                    const ratingScore = Number(product.rating || 4.3).toFixed(1);
                    const ratingCount = product.ratingCount || 28;
                    const discount = product.discountPercentage !== undefined && product.discountPercentage !== null ? Number(product.discountPercentage) : 10;
                    const originalPrice = Number(product.price || 0);
                    const discountedPrice = Math.round(originalPrice * (1 - discount / 100));

                    const isWishlisted = Boolean(wishlistMap[String(product._id)]);

                    return (
                      <div
                        className="adv-list-card clickable-catalog-card"
                        key={product._id}
                        onClick={() => handleProductCardClick(product._id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleProductCardClick(product._id);
                        }}
                      >
                        <div className="adv-list-visual-box">
                          <button
                            className={`product-wishlist-icon ${isWishlisted ? "is-wishlisted active" : ""}`}
                            type="button"
                            aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
                            onClick={(e) => handleWishlist(e, product._id)}
                          >
                            <Heart
                              size={16}
                              fill={isWishlisted ? "#ef4444" : "none"}
                              stroke={isWishlisted ? "#ef4444" : "#64748b"}
                            />
                          </button>
                          <span className="adv-product-category-tag">
                            {displayCategory}
                          </span>
                          <div className="adv-list-img-placeholder">
                            {(product.image || product.images?.[0]) ? (
                              <img
                                src={product.image || product.images[0]}
                                alt={product.name}
                                className="adv-list-img"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                }}
                              />
                            ) : (
                              <Package size={44} strokeWidth={1.2} />
                            )}
                          </div>
                        </div>

                        <div className="adv-list-info-col">
                          <h2 className="adv-list-product-title" title={product.name}>
                            {product.name}
                          </h2>

                          <div className="adv-product-vendor-rating-row">
                            <div className="adv-product-vendor-row">
                              <Store size={13} className="adv-vendor-store-icon" />
                              <span className="adv-product-vendor-text">
                                {product.vendorName || "Unknown"}
                              </span>
                            </div>

                            <div className="adv-product-star-pill" title={`${ratingScore} out of 5 (${ratingCount} ratings)`}>
                              <span>{ratingScore}</span>
                              <Star size={11} fill="currentColor" />
                              <span className="adv-star-count">({ratingCount})</span>
                            </div>

                            <span className={`adv-stock-indicator ${outOfStock ? "zero" : ""}`}>
                              {outOfStock ? "Out of Stock" : `Stock: ${product.quantity}`}
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
                            <span className="adv-selling-price">
                              Rs. {discountedPrice.toLocaleString("en-IN")}
                            </span>
                            <span className="adv-original-price">
                              Rs. {Math.round(originalPrice).toLocaleString("en-IN")}
                            </span>
                            <span className="adv-discount-tag">
                              ({discount}% OFF)
                            </span>
                          </div>

                          <div className="adv-list-btns">
                            {outOfStock ? (
                              <button className="btn btn-disabled adv-list-btn" disabled>
                                Out of Stock
                              </button>
                            ) : (
                              <>
                                <button
                                  className="btn btn-outline adv-list-btn adv-list-cart-btn"
                                  title="Add to Cart"
                                  onClick={(e) => handleAddToCart(e, product._id)}
                                >
                                  <ShoppingCart size={15} />
                                  <span>Add to Cart</span>
                                </button>
                                <button
                                  className="btn btn-primary adv-list-btn adv-list-buy-btn"
                                  onClick={(e) => handleBuyNow(e, product)}
                                >
                                  Buy Now
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Infinite Scroll Sentinel */}
              <div className="product-infinite-sentinel" ref={sentinelRef} aria-live="polite">
                {loadingMore
                  ? "Loading more products..."
                  : hasMore
                  ? "Scroll to load more"
                  : "You've reached the end of the catalog."}
              </div>
            </>
          )}
        </main>
      </div>

      {/* ========================================================= */}
      {/* 3. FLOATING ACTION DOCK / SNACKBAR                        */}
      {/* ========================================================= */}
      <div className="adv-floating-dock-wrap">
        <div className="adv-floating-dock" role="toolbar" aria-label="Quick Actions">
          {/* 1. Filters Button */}
          <button
            type="button"
            className="adv-dock-btn filter-btn"
            onClick={openFilterModal}
            aria-label="Open Filters"
          >
            <div className="adv-dock-icon">
              <SlidersHorizontal size={16} />
            </div>
            <span className="adv-dock-text">Filters</span>
            {activeFiltersCount > 0 && (
              <span className="adv-dock-filter-dot" />
            )}
          </button>

          <div className="adv-dock-divider" />

          {/* 2. Sort Button (Opens Sort Popup) */}
          <button
            type="button"
            className="adv-dock-btn"
            onClick={() => setIsSortModalOpen(true)}
            aria-label="Open Sort Options"
          >
            <div className="adv-dock-icon">
              <ArrowUpDown size={16} />
            </div>
            <span className="adv-dock-text">Sort</span>
          </button>

          <div className="adv-dock-divider" />

          {/* 3. Wishlist Button (Navigates to /customer/wishlist) */}
          <button
            type="button"
            className="adv-dock-btn"
            onClick={() => navigate("/customer/wishlist")}
            aria-label="Go to Wishlist"
          >
            <div className="adv-dock-icon heart">
              <Heart size={16} fill="#ef4444" color="#ef4444" />
            </div>
            <span className="adv-dock-text">Wishlist</span>
          </button>

          <div className="adv-dock-divider" />

          {/* 4. Cart Button (Navigates to /customer/cart) */}
          <button
            type="button"
            className="adv-dock-btn"
            onClick={() => navigate("/customer/cart")}
            aria-label="Go to Cart"
          >
            <div className="adv-dock-icon">
              <ShoppingCart size={16} />
            </div>
            <span className="adv-dock-text">Cart</span>
            <span className="adv-dock-badge">{cartCount || 0}</span>
          </button>

          <div className="adv-dock-divider" />

          {/* 5. Orders Button (Navigates to /customer/orders) */}
          <button
            type="button"
            className="adv-dock-btn"
            onClick={() => navigate("/customer/orders")}
            aria-label="Go to Orders"
          >
            <div className="adv-dock-icon">
              <Package size={16} />
            </div>
            <span className="adv-dock-text">Orders</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3.5 SORT POPUP MODAL                                      */}
      {/* ========================================================= */}
      {isSortModalOpen && (
        <div className="adv-sort-modal-backdrop" onClick={() => setIsSortModalOpen(false)}>
          <div
            className="adv-sort-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sort-modal-title"
          >
            <div className="adv-sort-modal-header">
              <div className="adv-sort-modal-title-group">
                <div className="adv-sort-modal-icon-badge">
                  <ArrowUpDown size={18} />
                </div>
                <div>
                  <h3 id="sort-modal-title">Sort Products</h3>
                  <p>Choose your preferred sorting order</p>
                </div>
              </div>
              <button
                type="button"
                className="adv-filter-modal-close"
                onClick={() => setIsSortModalOpen(false)}
                aria-label="Close sort modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="adv-sort-modal-body">
              {SORT_OPTIONS.map((opt) => {
                const IconComp = opt.icon;
                const isSelected = sortBy === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className={`adv-sort-modal-row ${isSelected ? "selected" : ""}`}
                    onClick={() => {
                      setSortBy(opt.id);
                      setIsSortModalOpen(false);
                    }}
                  >
                    <div className="adv-sort-row-left">
                      <div className="adv-sort-row-icon">
                        <IconComp size={16} />
                      </div>
                      <div className="adv-sort-row-text">
                        <span className="adv-sort-row-title">{opt.label}</span>
                        <span className="adv-sort-row-desc">{opt.desc}</span>
                      </div>
                    </div>
                    <div className="adv-sort-row-right">
                      <div className={`adv-sort-radio ${isSelected ? "selected" : ""}`}>
                        {isSelected && <div className="adv-sort-radio-dot" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. WIDE FILTER POPUP MODAL                                */}
      {/* ========================================================= */}
      {isFilterModalOpen && (
        <div className="adv-filter-modal-backdrop" onClick={() => setIsFilterModalOpen(false)}>
          <div
            className="adv-wide-filter-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="filter-modal-title"
          >
            {/* MODAL HEADER */}
            <div className="adv-filter-modal-header">
              <div className="adv-filter-modal-title-wrap">
                <div className="adv-filter-modal-icon-badge">
                  <SlidersHorizontal size={20} />
                </div>
                <div>
                  <h3 id="filter-modal-title">Filter &amp; Refine Products</h3>
                  <p>Narrow down products by price, availability, ratings, and brands</p>
                </div>
              </div>
              <button
                type="button"
                className="adv-filter-modal-close"
                onClick={() => setIsFilterModalOpen(false)}
                aria-label="Close filters modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* MODAL BODY (SPACIOUS 2-COLUMN GRID) */}
            <div className="adv-filter-modal-body">
              <div className="adv-filter-modal-grid">
                {/* COLUMN 1: Price & Availability */}
                <div className="adv-filter-col">
                  {/* Price Range */}
                  <div className="adv-modal-filter-card">
                    <div className="adv-card-header">
                      <span className="adv-card-title">Price Range (₹)</span>
                      {(draftMinPrice || draftMaxPrice) && (
                        <button
                          type="button"
                          className="adv-card-clear"
                          onClick={() => {
                            setDraftMinPrice("");
                            setDraftMaxPrice("");
                          }}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="adv-price-inputs-row">
                      <div className="adv-price-input-wrap">
                        <span className="adv-currency-prefix">₹</span>
                        <input
                          type="number"
                          placeholder={String(meta.priceBounds?.min || 0)}
                          value={draftMinPrice}
                          onChange={(e) => setDraftMinPrice(e.target.value)}
                          min="0"
                        />
                      </div>
                      <span className="adv-price-to">to</span>
                      <div className="adv-price-input-wrap">
                        <span className="adv-currency-prefix">₹</span>
                        <input
                          type="number"
                          placeholder={String(meta.priceBounds?.max || 100000)}
                          value={draftMaxPrice}
                          onChange={(e) => setDraftMaxPrice(e.target.value)}
                          min="0"
                        />
                      </div>
                    </div>

                    {/* Quick Price Presets */}
                    <div className="adv-price-presets-title">Popular Ranges:</div>
                    <div className="adv-price-brackets-grid">
                      <button
                        type="button"
                        className={`adv-price-bracket-btn ${draftMaxPrice === "1000" && !draftMinPrice ? "selected" : ""}`}
                        onClick={() => {
                          setDraftMinPrice("");
                          setDraftMaxPrice("1000");
                        }}
                      >
                        Under ₹1,000
                      </button>
                      <button
                        type="button"
                        className={`adv-price-bracket-btn ${draftMinPrice === "1000" && draftMaxPrice === "5000" ? "selected" : ""}`}
                        onClick={() => {
                          setDraftMinPrice("1000");
                          setDraftMaxPrice("5000");
                        }}
                      >
                        ₹1,000 - ₹5,000
                      </button>
                      <button
                        type="button"
                        className={`adv-price-bracket-btn ${draftMinPrice === "5000" && draftMaxPrice === "20000" ? "selected" : ""}`}
                        onClick={() => {
                          setDraftMinPrice("5000");
                          setDraftMaxPrice("20000");
                        }}
                      >
                        ₹5,000 - ₹20,000
                      </button>
                      <button
                        type="button"
                        className={`adv-price-bracket-btn ${draftMinPrice === "20000" && !draftMaxPrice ? "selected" : ""}`}
                        onClick={() => {
                          setDraftMinPrice("20000");
                          setDraftMaxPrice("");
                        }}
                      >
                        ₹20,000 &amp; Above
                      </button>
                    </div>
                  </div>

                  {/* Category Filter Card */}
                  <div className="adv-modal-filter-card">
                    <div className="adv-card-header">
                      <span className="adv-card-title">
                        <Tag size={15} style={{ verticalAlign: "middle", marginRight: "6px" }} />
                        Category
                      </span>
                      {draftCategory !== "All" && (
                        <button
                          type="button"
                          className="adv-card-clear"
                          onClick={() => setDraftCategory("All")}
                        >
                          Reset
                        </button>
                      )}
                    </div>

                    {/* Category Dropdown Component */}
                    <div className="adv-category-dropdown-container">
                      <button
                        type="button"
                        className={`adv-category-dropdown-trigger ${categoryDropdownOpen ? "open" : ""}`}
                        onClick={() => setCategoryDropdownOpen((prev) => !prev)}
                      >
                        <div className="adv-category-trigger-left">
                          {(() => {
                            const ActiveIcon = getCategoryIcon(draftCategory);
                            return (
                              <div className="adv-category-trigger-icon-box">
                                <ActiveIcon size={15} />
                              </div>
                            );
                          })()}
                          <span className="adv-category-trigger-label">
                            {draftCategory === "All" ? "All Categories" : draftCategory}
                          </span>
                        </div>

                        <div className="adv-category-trigger-right">
                          <span className="adv-category-trigger-count">
                            {draftCategory === "All"
                              ? (meta.availabilityCounts?.total || totalProducts || 0)
                              : (meta.categories?.find(c => c.name.toLowerCase() === draftCategory.toLowerCase())?.count || 0)}
                          </span>
                          <span className="adv-category-trigger-chevron">
                            <ChevronDown size={15} />
                          </span>
                        </div>
                      </button>

                      {categoryDropdownOpen && (
                        <div className="adv-category-dropdown-menu">
                          <div className="adv-category-dropdown-top">
                            <div className="adv-category-search-wrap">
                              <Search size={14} />
                              <input
                                type="text"
                                placeholder="Search categories..."
                                value={categorySearchQuery}
                                onChange={(e) => setCategorySearchQuery(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                              />
                              {categorySearchQuery && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCategorySearchQuery("");
                                  }}
                                  className="adv-category-search-clear"
                                >
                                  <X size={12} />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="adv-category-list-scroll">
                            {/* All Categories Option */}
                            {(!categorySearchQuery || "all categories".includes(categorySearchQuery.toLowerCase())) && (
                              <div
                                className={`adv-category-option-item ${draftCategory === "All" ? "selected" : ""}`}
                                onClick={() => {
                                  setDraftCategory("All");
                                  setCategoryDropdownOpen(false);
                                }}
                              >
                                <div className="adv-category-option-left">
                                  <div className="adv-category-icon-pill all">
                                    <LayoutGrid size={15} />
                                  </div>
                                  <span className="adv-category-option-name">All Categories</span>
                                </div>

                                <div className="adv-category-option-right">
                                  <span className="adv-category-count-badge">
                                    {meta.availabilityCounts?.total || totalProducts || 0}
                                  </span>
                                  <div className="adv-category-check-indicator">
                                    {draftCategory === "All" && <Check size={13} />}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Categorized Options */}
                            {(meta.categories || [])
                              .filter((c) =>
                                c.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
                              )
                              .map((cat) => {
                                const isSelected = draftCategory.toLowerCase() === cat.name.toLowerCase();
                                const CatIcon = getCategoryIcon(cat.name);
                                return (
                                  <div
                                    key={cat.name}
                                    className={`adv-category-option-item ${isSelected ? "selected" : ""}`}
                                    onClick={() => {
                                      setDraftCategory(cat.name);
                                      setCategoryDropdownOpen(false);
                                    }}
                                  >
                                    <div className="adv-category-option-left">
                                      <div className={`adv-category-icon-pill ${cat.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}>
                                        <CatIcon size={15} />
                                      </div>
                                      <span className="adv-category-option-name">{cat.name}</span>
                                    </div>

                                    <div className="adv-category-option-right">
                                      <span className="adv-category-count-badge">{cat.count}</span>
                                      <div className="adv-category-check-indicator">
                                        {isSelected && <Check size={13} />}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}

                            {meta.categories &&
                              meta.categories.filter((c) =>
                                c.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
                              ).length === 0 &&
                              categorySearchQuery &&
                              !"all categories".includes(categorySearchQuery.toLowerCase()) && (
                                <div className="adv-category-empty">
                                  No categories match &quot;{categorySearchQuery}&quot;
                                </div>
                              )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Quick Popular Category Chips */}
                    <div className="adv-price-presets-title" style={{ marginTop: "12px", marginBottom: "6px" }}>
                      Popular Categories:
                    </div>
                    <div className="adv-dropdown-tag-pills" style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {(meta.categories || []).slice(0, 4).map((cat) => {
                        const isSelected = draftCategory.toLowerCase() === cat.name.toLowerCase();
                        return (
                          <button
                            key={cat.name}
                            type="button"
                            className={`adv-quick-pill ${isSelected ? "active" : ""}`}
                            onClick={() => setDraftCategory(isSelected ? "All" : cat.name)}
                          >
                            {cat.name} ({cat.count})
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stock Availability */}
                  <div className="adv-modal-filter-card">
                    <div className="adv-card-header">
                      <span className="adv-card-title">Stock Availability</span>
                    </div>
                    <div className="adv-avail-cards-group">
                      <button
                        type="button"
                        className={`adv-avail-choice-card ${draftAvailability === "all" ? "selected" : ""}`}
                        onClick={() => setDraftAvailability("all")}
                      >
                        <div className="adv-avail-radio-indicator">
                          {draftAvailability === "all" && <div className="adv-avail-radio-dot" />}
                        </div>
                        <span className="adv-avail-label">All Products</span>
                        <span className="adv-avail-badge">
                          {meta.availabilityCounts?.total || totalProducts}
                        </span>
                      </button>

                      <button
                        type="button"
                        className={`adv-avail-choice-card ${draftAvailability === "in_stock" ? "selected" : ""}`}
                        onClick={() => setDraftAvailability("in_stock")}
                      >
                        <div className="adv-avail-radio-indicator">
                          {draftAvailability === "in_stock" && <div className="adv-avail-radio-dot" />}
                        </div>
                        <span className="adv-avail-label">In Stock Only</span>
                        <span className="adv-avail-badge in">
                          {meta.availabilityCounts?.inStock || 0}
                        </span>
                      </button>

                      <button
                        type="button"
                        className={`adv-avail-choice-card ${draftAvailability === "out_of_stock" ? "selected" : ""}`}
                        onClick={() => setDraftAvailability("out_of_stock")}
                      >
                        <div className="adv-avail-radio-indicator">
                          {draftAvailability === "out_of_stock" && <div className="adv-avail-radio-dot" />}
                        </div>
                        <span className="adv-avail-label">Out of Stock</span>
                        <span className="adv-avail-badge out">
                          {meta.availabilityCounts?.outOfStock || 0}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* COLUMN 2: Vendors (Dropdown Multiselect) & Ratings */}
                <div className="adv-filter-col">
                  {/* Brand / Vendor Dropdown Multiselect */}
                  <div className="adv-modal-filter-card">
                    <div className="adv-card-header">
                      <span className="adv-card-title">
                        <Store size={15} style={{ verticalAlign: "middle", marginRight: "6px" }} />
                        Brand / Vendor
                      </span>
                      {draftVendors.length > 0 && (
                        <button
                          type="button"
                          className="adv-card-clear"
                          onClick={() => setDraftVendors([])}
                        >
                          Clear ({draftVendors.length})
                        </button>
                      )}
                    </div>

                    {/* Vendor Dropdown Component */}
                    <div className="adv-vendor-dropdown-container">
                      <button
                        type="button"
                        className={`adv-vendor-dropdown-trigger ${vendorDropdownOpen ? "open" : ""}`}
                        onClick={() => setVendorDropdownOpen((prev) => !prev)}
                      >
                        <span className="adv-vendor-trigger-label">
                          {draftVendors.length === 0
                            ? "All Vendors (Click to choose)"
                            : `${draftVendors.length} ${draftVendors.length === 1 ? "Vendor" : "Vendors"} Selected`}
                        </span>
                        <span className="adv-vendor-trigger-chevron">
                          <ArrowUpDown size={14} />
                        </span>
                      </button>

                      {/* Dropdown Popover */}
                      {vendorDropdownOpen && (
                        <div className="adv-vendor-dropdown-menu">
                          <div className="adv-vendor-dropdown-top">
                            <div className="adv-vendor-search-wrap">
                              <Search size={13} />
                              <input
                                type="text"
                                placeholder="Search vendors..."
                                value={vendorSearchQuery}
                                onChange={(e) => setVendorSearchQuery(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                              />
                              {vendorSearchQuery && (
                                <button
                                  type="button"
                                  onClick={() => setVendorSearchQuery("")}
                                  className="adv-vendor-search-clear"
                                >
                                  <X size={12} />
                                </button>
                              )}
                            </div>
                            <div className="adv-vendor-quick-actions">
                              <button
                                type="button"
                                onClick={() => {
                                  const allNames = meta.vendors.map((v) => v.name);
                                  setDraftVendors(allNames);
                                }}
                              >
                                Select All
                              </button>
                              <span className="divider">•</span>
                              <button type="button" onClick={() => setDraftVendors([])}>
                                Deselect All
                              </button>
                            </div>
                          </div>

                          <div className="adv-vendor-list-scroll">
                            {meta.vendors
                              .filter((v) =>
                                v.name.toLowerCase().includes(vendorSearchQuery.toLowerCase())
                              )
                              .map((ven) => {
                                const isChecked = draftVendors.includes(ven.name);
                                return (
                                  <label
                                    key={ven.name}
                                    className={`adv-vendor-option-row ${isChecked ? "checked" : ""}`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        setDraftVendors((prev) =>
                                          isChecked
                                            ? prev.filter((name) => name !== ven.name)
                                            : [...prev, ven.name]
                                        );
                                      }}
                                    />
                                    <span className="adv-vendor-option-name">{ven.name}</span>
                                    <span className="adv-vendor-option-count">{ven.count}</span>
                                  </label>
                                );
                              })}
                            {meta.vendors.filter((v) =>
                              v.name.toLowerCase().includes(vendorSearchQuery.toLowerCase())
                            ).length === 0 && (
                              <div className="adv-vendor-empty">No vendors match &quot;{vendorSearchQuery}&quot;</div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Selected Vendor Tag Badges */}
                      {draftVendors.length > 0 && (
                        <div className="adv-vendor-selected-tags">
                          {draftVendors.map((name) => (
                            <span key={name} className="adv-vendor-tag-pill">
                              {name}
                              <button
                                type="button"
                                onClick={() =>
                                  setDraftVendors((prev) => prev.filter((n) => n !== name))
                                }
                                aria-label={`Remove vendor ${name}`}
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Customer Ratings */}
                  <div className="adv-modal-filter-card">
                    <div className="adv-card-header">
                      <span className="adv-card-title">Customer Ratings</span>
                      {draftMinRating > 0 && (
                        <button
                          type="button"
                          className="adv-card-clear"
                          onClick={() => setDraftMinRating(0)}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="adv-rating-cards-list">
                      {[4, 3, 2, 1].map((stars) => (
                        <button
                          key={stars}
                          type="button"
                          className={`adv-rating-choice-card ${draftMinRating === stars ? "selected" : ""}`}
                          onClick={() => setDraftMinRating(draftMinRating === stars ? 0 : stars)}
                        >
                          <div className="adv-rating-stars-preview">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                size={15}
                                fill={s <= stars ? "#f59e0b" : "none"}
                                color={s <= stars ? "#f59e0b" : "#cbd5e1"}
                              />
                            ))}
                          </div>
                          <span className="adv-rating-choice-text">&amp; above</span>
                          {draftMinRating === stars && (
                            <Check size={14} className="adv-rating-choice-check" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="adv-filter-modal-footer">
              <button
                type="button"
                className="adv-btn-reset-filters"
                onClick={handleResetDraftFilters}
              >
                <RotateCcw size={13} /> Reset All
              </button>
              <div className="adv-filter-modal-footer-right">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsFilterModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary adv-btn-apply-filters"
                  onClick={handleApplyDraftFilters}
                >
                  <SlidersHorizontal size={15} /> Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <WishlistCollectionPicker
        isOpen={Boolean(wishlistProductToSave)}
        onClose={() => setWishlistProductToSave(null)}
        onSelect={handleWishlistCollectionSelect}
      />
    </div>
  );
}

export default CustomerHome;
