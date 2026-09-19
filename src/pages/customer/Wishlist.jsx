/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  Plus,
  Grid2X2,
  List,
  Search,
  ShoppingCart,
  Star,
  Package,
  ArrowRight,
  X,
  Store,
  ArrowUpDown,
  Sparkles,
  Home,
  Smartphone,
  ShoppingBag,
  FolderHeart,
  Settings2,
  Edit2,
  Trash2,
  Check,
  TrendingDown,
  Bell,
  Scale
} from "lucide-react";
import {
  getWishlist,
  removeFromWishlist,
  getWishlistCollections,
  createWishlistCollection,
  updateWishlistCollection,
  deleteWishlistCollection,
  updateWishlistAlerts
} from "../../services/wishlistService";
import { addToCart } from "../../services/cartService";
import { addToCompare, removeFromCompare, isInCompare } from "../../services/compareService";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";
import ConfirmModal from "../../components/ConfirmModal";
import Modal from "../../components/Modal";
import CustomSelect from "../../components/CustomSelect";
import { toast } from "../../components/Toast";
import { getErrorMessage } from "../../utils/errorHandler";

const WISHLIST_BANNERS = [
  {
    image: "/banners/wishlist/wishlist-banner-1.jpg",
    alt: "Curated Collections Just for You"
  },
  {
    image: "/banners/wishlist/wishlist-banner-2.jpg",
    alt: "Your Wishlist - Favourite picks, always within reach"
  },
  {
    image: "/banners/wishlist/wishlist-banner-3.jpg",
    alt: "Make Space for Happiness - Home Essentials"
  },
  {
    image: "/banners/wishlist/wishlist-banner-4.jpg",
    alt: "Upgrade Your Everyday - Top Brands, Great Deals"
  },
  {
    image: "/banners/wishlist/wishlist-banner-5.jpg",
    alt: "Style Today Shine Tomorrow - Trendy Picks"
  }
];

const SORT_OPTIONS = [
  { value: "recent", label: "Recently Added" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "rating_high", label: "Customer Rating" },
  { value: "name_asc", label: "Product Name (A-Z)" }
];

function getCollectionIcon(name = "") {
  const n = String(name).toLowerCase();
  if (n.includes("favorite") || n.includes("favourite")) return <Heart size={16} />;
  if (n.includes("home") || n.includes("living") || n.includes("decor") || n.includes("furniture")) return <Home size={16} />;
  if (n.includes("tech") || n.includes("gadget") || n.includes("electronic") || n.includes("mobile") || n.includes("game") || n.includes("gaming")) return <Smartphone size={16} />;
  if (n.includes("fashion") || n.includes("style") || n.includes("cloth") || n.includes("shoe")) return <ShoppingBag size={16} />;
  if (n.includes("essential")) return <Sparkles size={16} />;
  return <FolderHeart size={16} />;
}

function Wishlist() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [itemToRemove, setItemToRemove] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [collections, setCollections] = useState([]);
  const [activeCollection, setActiveCollection] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [viewMode, setViewMode] = useState("grid");
  
  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [editingCollectionId, setEditingCollectionId] = useState(null);
  const [editCollectionName, setEditCollectionName] = useState("");
  const [collectionToDelete, setCollectionToDelete] = useState(null);
  const [deletingCollection, setDeletingCollection] = useState(false);

  // Slideshow
  const [heroSlide, setHeroSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [cartAddingId, setCartAddingId] = useState(null);
  const timerRef = useRef(null);

  const loadWishlist = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getWishlist();
      setItems(Array.isArray(data) ? data : data?.items || []);
      const collectionData = await getWishlistCollections();
      setCollections(Array.isArray(collectionData) ? collectionData : []);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  // Slideshow auto-rotation with hover pause
  useEffect(() => {
    if (isHovered) return;
    timerRef.current = window.setInterval(() => {
      setHeroSlide((curr) => (curr + 1) % WISHLIST_BANNERS.length);
    }, 4500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isHovered]);

  // Filter and sort visible items
  const visibleItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return items
      .filter((item) => activeCollection === "all" || String(item.collectionId) === String(activeCollection))
      .filter((item) => {
        if (!query) return true;
        const name = String(item.name || "").toLowerCase();
        const vendor = String(item.vendorName || "").toLowerCase();
        const category = String(item.category || "").toLowerCase();
        return name.includes(query) || vendor.includes(query) || category.includes(query);
      })
      .sort((a, b) => {
        if (sortBy === "price_low") return Number(a.price || 0) - Number(b.price || 0);
        if (sortBy === "price_high") return Number(b.price || 0) - Number(a.price || 0);
        if (sortBy === "rating_high") return Number(b.rating || 0) - Number(a.rating || 0);
        if (sortBy === "name_asc") return String(a.name || "").localeCompare(String(b.name || ""));
        return 0; // Default recent
      });
  }, [activeCollection, items, searchTerm, sortBy]);

  const handleCreateCollection = async (event) => {
    event.preventDefault();
    const name = newCollectionName.trim();
    if (!name) return;
    try {
      const collection = await createWishlistCollection(name);
      setCollections((current) => [...current, collection]);
      setActiveCollection(collection._id);
      setNewCollectionName("");
      setCreateModalOpen(false);
      toast.success(`Collection "${name}" created!`);
    } catch (createError) {
      toast.error(getErrorMessage(createError));
    }
  };

  const handleStartRename = (col) => {
    setEditingCollectionId(col._id);
    setEditCollectionName(col.name);
  };

  const handleSaveRename = async (colId) => {
    const name = editCollectionName.trim();
    if (!name) return;
    try {
      const updated = await updateWishlistCollection(colId, name);
      setCollections((current) =>
        current.map((c) => (c._id === colId ? { ...c, name: updated.name || name } : c))
      );
      setEditingCollectionId(null);
      toast.success(`Collection renamed to "${name}"`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDeleteCollection = async (colId) => {
    setDeletingCollection(true);
    try {
      await deleteWishlistCollection(colId);
      setCollections((current) => current.filter((c) => c._id !== colId));
      if (String(activeCollection) === String(colId)) {
        setActiveCollection("all");
      }
      setCollectionToDelete(null);
      toast.success("Collection deleted. Saved items were moved to your default collection.");
      // Reload wishlist to update counts
      const freshCollections = await getWishlistCollections();
      setCollections(Array.isArray(freshCollections) ? freshCollections : []);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeletingCollection(false);
    }
  };

  const handleRemoveItem = async (itemId) => {
    setRemoving(true);
    try {
      await removeFromWishlist(itemId);
      setItems((current) => current.filter((item) => (item._id || item.id) !== itemId));
      toast.success("Product removed from wishlist.");
      const freshCollections = await getWishlistCollections();
      setCollections(Array.isArray(freshCollections) ? freshCollections : []);
    } catch (removeError) {
      toast.error(getErrorMessage(removeError));
    } finally {
      setRemoving(false);
    }
  };

  const handleAddToCart = async (item) => {
    const pId = item.productId?._id || item.productId;
    if (!pId) return;
    setCartAddingId(pId);
    try {
      await addToCart(pId, 1);
      toast.success(`${item.name || "Product"} added to cart.`);
    } catch (cartError) {
      toast.error(getErrorMessage(cartError));
    } finally {
      setCartAddingId(null);
    }
  };

  if (loading) return <Loader text="Loading wishlist & collections..." />;

  const activeCollectionObj = collections.find((c) => String(c._id) === String(activeCollection));
  const activeCollectionTitle = activeCollection === "all" ? "All Saved Items" : activeCollectionObj?.name || "Collection Items";

  return (
    <div className="wishlist-page">
      {/* ── HERO BANNER SLIDESHOW WITH LEFT COPY (LIKE BEFORE) ── */}
      <section
        className="wishlist-hero"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ backgroundImage: `url(${WISHLIST_BANNERS[heroSlide].image})` }}
      >
        <div className="wishlist-hero-copy">
          <span className="wishlist-eyebrow">MY WISHLIST</span>
          <h1>
            Your Favourites, <span className="wishlist-hero-title-end">Always Here <Heart size={22} className="wishlist-header-heart" /></span>
          </h1>
          <p>Save what you love. Shop when you&apos;re ready.</p>
        </div>

        {/* Carousel Indicator Dots */}
        <div className="wishlist-hero-dots" aria-label="Wishlist banner slides">
          {WISHLIST_BANNERS.map((banner, index) => (
            <button
              type="button"
              key={banner.image}
              className={heroSlide === index ? "active" : ""}
              onClick={() => setHeroSlide(index)}
              aria-label={`Show slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      <ErrorMessage message={error} onRetry={loadWishlist} />

      {/* ── COLLECTIONS SECTION WITH CREATE & MANAGE BUTTONS ── */}
      <div className="wishlist-collections-section">
        <div className="wishlist-section-header">
          <div className="wishlist-title-with-badge">
            <h2>My Wishlist Collections</h2>
            <span className="wishlist-count-badge">{collections.length} Collections</span>
          </div>

          <div className="wishlist-collection-header-actions">
            <button
              type="button"
              className="btn btn-primary wishlist-create-collection-btn"
              onClick={() => setCreateModalOpen(true)}
            >
              <Plus size={15} /> New Collection
            </button>
            <button
              type="button"
              className="btn btn-outline wishlist-manage-collection-btn"
              onClick={() => setManageModalOpen(true)}
            >
              <Settings2 size={15} /> Manage
            </button>
          </div>
        </div>

        <div className="wishlist-collections-carousel">
          {/* ALL ITEMS PILL */}
          <button
            type="button"
            className={`wishlist-collection-pill ${activeCollection === "all" ? "active" : ""}`}
            onClick={() => setActiveCollection("all")}
          >
            <div className="pill-icon-circle">
              <Package size={17} />
            </div>
            <div className="pill-text-col">
              <strong>All Items</strong>
              <small>{items.length} saved</small>
            </div>
          </button>

          {/* DYNAMIC COLLECTIONS */}
          {collections.map((col) => {
            const isActive = String(activeCollection) === String(col._id);
            return (
              <button
                type="button"
                key={col._id}
                className={`wishlist-collection-pill ${isActive ? "active" : ""}`}
                onClick={() => setActiveCollection(col._id)}
              >
                <div className="pill-icon-circle">
                  {getCollectionIcon(col.name)}
                </div>
                <div className="pill-text-col">
                  <strong>{col.name}</strong>
                  <small>{col.count || 0} items</small>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── MAIN CONTENT AREA ── */}
      {items.length === 0 ? (
        <div className="wishlist-empty-state">
          <div className="wishlist-empty-icon-wrap">
            <Heart size={44} className="wishlist-heart-empty-icon" />
          </div>
          <h2>Your Wishlist is Empty</h2>
          <p>Explore our catalog and click the heart icon on any item to save your favorite products here.</p>
          <button
            type="button"
            className="btn btn-primary wishlist-explore-btn"
            onClick={() => navigate("/customer/home")}
          >
            Explore Catalog <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <>
          {/* ── TOOLBAR (SEARCH + SORT + VIEW TOGGLE) ── */}
          <div className="wishlist-controls-toolbar">
            <div className="wishlist-toolbar-title-wrap">
              <h2>{activeCollectionTitle}</h2>
              <span className="wishlist-items-count-tag">{visibleItems.length} products</span>
            </div>

            <div className="wishlist-toolbar-actions">
              {/* SEARCH BOX */}
              <div className="wishlist-search-box">
                <Search size={16} className="wishlist-search-icon" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search in wishlist..."
                  aria-label="Search saved products"
                />
                {searchTerm && (
                  <button
                    type="button"
                    className="wishlist-search-clear"
                    onClick={() => setSearchTerm("")}
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* SORT DROPDOWN */}
              <div className="wishlist-sort-wrap">
                <ArrowUpDown size={15} className="sort-icon-left" />
                <CustomSelect
                  value={sortBy}
                  onChange={(val) => setSortBy(val)}
                  options={SORT_OPTIONS}
                  size="md"
                  className="wishlist-custom-sort-select"
                />
              </div>

              {/* VIEW MODE TOGGLE */}
              <div className="wishlist-view-mode-toggle">
                <button
                  type="button"
                  className={`view-mode-btn ${viewMode === "grid" ? "active" : ""}`}
                  onClick={() => setViewMode("grid")}
                  title="Grid View"
                  aria-label="Grid View"
                >
                  <Grid2X2 size={16} />
                </button>
                <button
                  type="button"
                  className={`view-mode-btn ${viewMode === "list" ? "active" : ""}`}
                  onClick={() => setViewMode("list")}
                  title="List View"
                  aria-label="List View"
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* ── PRODUCT CARDS ── */}
          {visibleItems.length === 0 ? (
            <div className="wishlist-no-match-state">
              <Search size={32} className="no-match-icon" />
              <h3>No matching products found</h3>
              <p>We couldn&apos;t find any items matching &quot;{searchTerm}&quot; in this collection.</p>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setSearchTerm("");
                  setActiveCollection("all");
                }}
              >
                Clear Filters
              </button>
            </div>
          ) : viewMode === "grid" ? (
            /* ── GRID VIEW ── */
            <div className="wishlist-products-grid-layout">
              {visibleItems.map((item) => {
                const itemId = item.id || item._id;
                const pId = item.productId?._id || item.productId;
                const quantity = Number(item.quantity) || 0;
                const outOfStock = quantity <= 0;
                const rating = Number(item.rating || 4.5).toFixed(1);
                const ratingCount = item.ratingCount || 18;
                const price = Number(item.price || 0);
                const originalPrice = Math.round(price * 1.15);
                const addedPrice = Number(item.addedPrice || 0);
                const hasPriceDropped = addedPrice > 0 && price < addedPrice;
                const priceDropAmount = hasPriceDropped ? addedPrice - price : 0;
                const isCompared = isInCompare(pId || itemId);

                return (
                  <article
                    className="product-card adv-product-card wishlist-adv-grid-card"
                    key={itemId}
                    onClick={() => pId && navigate(`/customer/products/${pId}`)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="adv-card-visual-top">
                      {/* Floating Remove/Heart Button */}
                      <button
                        className="product-wishlist-icon is-wishlisted active wishlist-action-heart"
                        type="button"
                        aria-label={`Remove ${item.name} from wishlist`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setItemToRemove({ id: itemId, name: item.name || "this product" });
                        }}
                        title="Remove from wishlist"
                      >
                        <Heart size={17} fill="#ef4444" stroke="#ef4444" />
                      </button>

                      {/* Compare Toggle */}
                      <button
                        className={`product-compare-icon ${isCompared ? "is-compared active" : ""}`}
                        type="button"
                        aria-label={isCompared ? `Remove ${item.name} from comparison` : `Compare ${item.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isCompared) {
                            removeFromCompare(pId || itemId);
                            toast.info(`Removed ${item.name} from comparison`);
                          } else {
                            try {
                              addToCompare({ ...item, _id: pId || itemId });
                              toast.success(`Added ${item.name} to comparison!`);
                            } catch (err) {
                              toast.warning(err.message || "Cannot add to comparison");
                            }
                          }
                        }}
                        title={isCompared ? "Remove from comparison" : "Compare product side-by-side"}
                      >
                        <Scale size={16} />
                      </button>

                      {/* Category & Stock Badges */}
                      <div className="adv-card-top-badges">
                        <span className="adv-product-category-tag">
                          {item.category || "General"}
                        </span>
                        {outOfStock && (
                          <span className="adv-out-of-stock-tag">Out of Stock</span>
                        )}
                      </div>

                      {/* Image with Robust Fallback */}
                      <div className="adv-card-img-wrap wishlist-card-img-wrap">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt=""
                            className="adv-product-img"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              if (e.currentTarget.nextElementSibling) {
                                e.currentTarget.nextElementSibling.style.display = "flex";
                              }
                            }}
                          />
                        ) : null}
                        <div
                          className="adv-img-fallback-center"
                          style={{ display: item.image ? "none" : "flex" }}
                        >
                          <Package size={48} strokeWidth={1.2} />
                        </div>
                      </div>
                    </div>

                    <div className="product-card-body">
                      {/* Product Title */}
                      <h2 className="adv-product-title" title={item.name}>
                        {item.name || "Product"}
                      </h2>

                      {/* Product Description */}
                      <p className="adv-product-desc" title={item.description || "Saved item"}>
                        {item.description || `${item.category || "Product"} • Saved to wishlist`}
                      </p>

                      {/* Vendor & Rating Row */}
                      <div className="adv-product-vendor-rating-row">
                        <div className="adv-product-vendor-row">
                          <Store size={13} className="adv-vendor-store-icon" />
                          <span className="adv-product-vendor-text">
                            {item.vendorName || "Verified Vendor"}
                          </span>
                        </div>

                        <div className="adv-product-star-pill">
                          <span>{rating}</span>
                          <Star size={11} fill="currentColor" />
                          <span className="adv-star-count">({ratingCount})</span>
                        </div>
                      </div>

                      {/* Price Row */}
                      <div className="adv-myntra-price-row">
                        <span className="adv-selling-price">
                          Rs. {price.toLocaleString("en-IN")}
                        </span>
                        <span className="adv-original-price">
                          Rs. {originalPrice.toLocaleString("en-IN")}
                        </span>
                        <span className="adv-discount-tag">(15% OFF)</span>
                      </div>

                      {/* Price Drop & Stock Alerts */}
                      {hasPriceDropped && (
                        <div style={{ marginTop: "4px", display: "inline-flex", alignItems: "center", gap: "4px", background: "#ecfdf5", color: "#059669", padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 600 }}>
                          <TrendingDown size={12} />
                          <span>Price dropped by ₹{priceDropAmount.toLocaleString("en-IN")}!</span>
                        </div>
                      )}
                      {outOfStock && (
                        <div style={{ marginTop: "4px", display: "inline-flex", alignItems: "center", gap: "4px", background: "#eff6ff", color: "#2563eb", padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 500 }}>
                          <Bell size={12} />
                          <span>Alert active: Notify when back in stock</span>
                        </div>
                      )}

                      {/* Stock Indicator */}
                      <div className="adv-card-meta-stock">
                        <span className={`adv-stock-indicator ${outOfStock ? "zero" : ""}`}>
                          {outOfStock ? "Unavailable" : `Stock: ${quantity}`}
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
                        <div className="wishlist-grid-card-buttons">
                          <button
                            type="button"
                            className="btn btn-primary wishlist-add-cart-btn"
                            onClick={() => handleAddToCart(item)}
                            disabled={cartAddingId === pId}
                          >
                            <ShoppingCart size={15} />
                            {cartAddingId === pId ? "Adding..." : "Add to Cart"}
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline wishlist-view-item-btn"
                            onClick={() => pId && navigate(`/customer/products/${pId}`)}
                          >
                            Details
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            /* ── LIST VIEW ── */
            <div className="wishlist-products-list-layout">
              {visibleItems.map((item) => {
                const itemId = item.id || item._id;
                const pId = item.productId?._id || item.productId;
                const quantity = Number(item.quantity) || 0;
                const outOfStock = quantity <= 0;
                const rating = Number(item.rating || 4.5).toFixed(1);
                const ratingCount = item.ratingCount || 18;
                const price = Number(item.price || 0);
                const originalPrice = Math.round(price * 1.15);
                const addedPrice = Number(item.addedPrice || 0);
                const hasPriceDropped = addedPrice > 0 && price < addedPrice;
                const priceDropAmount = hasPriceDropped ? addedPrice - price : 0;
                const isCompared = isInCompare(pId || itemId);

                return (
                  <article
                    className="adv-list-card wishlist-adv-list-card"
                    key={itemId}
                    onClick={() => pId && navigate(`/customer/products/${pId}`)}
                  >
                    <div className="adv-list-visual-box">
                      <span className="adv-product-category-tag">{item.category || "General"}</span>

                      {/* Compare Toggle */}
                      <button
                        className={`product-compare-icon ${isCompared ? "is-compared active" : ""}`}
                        type="button"
                        aria-label={isCompared ? `Remove ${item.name} from comparison` : `Compare ${item.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isCompared) {
                            removeFromCompare(pId || itemId);
                            toast.info(`Removed ${item.name} from comparison`);
                          } else {
                            try {
                              addToCompare({ ...item, _id: pId || itemId });
                              toast.success(`Added ${item.name} to comparison!`);
                            } catch (err) {
                              toast.warning(err.message || "Cannot add to comparison");
                            }
                          }
                        }}
                        title={isCompared ? "Remove from comparison" : "Compare product side-by-side"}
                      >
                        <Scale size={14} />
                      </button>

                      <div className="adv-list-img-placeholder">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt=""
                            className="adv-list-img"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              if (e.currentTarget.nextElementSibling) {
                                e.currentTarget.nextElementSibling.style.display = "flex";
                              }
                            }}
                          />
                        ) : null}
                        <div
                          className="adv-img-fallback-center"
                          style={{ display: item.image ? "none" : "flex" }}
                        >
                          <Package size={44} strokeWidth={1.2} />
                        </div>
                      </div>
                    </div>

                    <div className="adv-list-info-col">
                      <h2 className="adv-list-product-title">{item.name || "Product"}</h2>
                      <div className="adv-product-vendor-rating-row">
                        <div className="adv-product-vendor-row">
                          <Store size={13} className="adv-vendor-store-icon" />
                          <span className="adv-product-vendor-text">{item.vendorName || "Verified Vendor"}</span>
                        </div>
                        <div className="adv-product-star-pill">
                          <span>{rating}</span>
                          <Star size={11} fill="currentColor" />
                          <span className="adv-star-count">({ratingCount})</span>
                        </div>
                        <span className={`adv-stock-indicator ${outOfStock ? "zero" : ""}`}>
                          {outOfStock ? "Out of Stock" : `Stock: ${quantity}`}
                        </span>
                      </div>
                      <p className="adv-list-desc">
                        {item.description || `${item.category || "Product"} • Saved to wishlist`}
                      </p>

                      {/* Alerts */}
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
                        {hasPriceDropped && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#ecfdf5", color: "#059669", padding: "2px 7px", borderRadius: "4px", fontSize: "11px", fontWeight: 600 }}>
                            <TrendingDown size={11} /> Dropped by ₹{priceDropAmount.toLocaleString("en-IN")}!
                          </span>
                        )}
                        {outOfStock && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#eff6ff", color: "#2563eb", padding: "2px 7px", borderRadius: "4px", fontSize: "11px", fontWeight: 500 }}>
                            <Bell size={11} /> Alert active: Notify when back in stock
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="adv-list-action-col wishlist-list-actions" onClick={(e) => e.stopPropagation()}>
                      <div className="adv-myntra-price-row">
                        <span className="adv-selling-price">Rs. {price.toLocaleString("en-IN")}</span>
                        <span className="adv-original-price">Rs. {originalPrice.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="adv-list-btns">
                        <button
                          type="button"
                          className="btn btn-primary adv-list-btn"
                          onClick={() => handleAddToCart(item)}
                          disabled={outOfStock || cartAddingId === pId}
                        >
                          <ShoppingCart size={15} /> {cartAddingId === pId ? "Adding..." : "Add to Cart"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline adv-list-btn wishlist-remove-btn"
                          onClick={() => setItemToRemove({ id: itemId, name: item.name || "this product" })}
                        >
                          <Heart size={14} fill="#ef4444" stroke="#ef4444" /> Remove
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── CONFIRM REMOVE PRODUCT MODAL ── */}
      <ConfirmModal
        isOpen={Boolean(itemToRemove)}
        title="Remove from Wishlist?"
        message={`Remove "${itemToRemove?.name || ""}" from your wishlist? You can always add it back later.`}
        confirmText="Remove Item"
        onConfirm={async () => {
          await handleRemoveItem(itemToRemove.id);
          setItemToRemove(null);
        }}
        onCancel={() => setItemToRemove(null)}
        loading={removing}
      />

      {/* ── CREATE COLLECTION MODAL ── */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Wishlist Collection"
        size="small"
      >
        <form className="wishlist-create-modal-form" onSubmit={handleCreateCollection}>
          <p>Organize your favorite products into custom collections like &quot;Home Decor&quot;, &quot;Gadgets&quot;, or &quot;Summer Style&quot;.</p>
          <input
            autoFocus
            value={newCollectionName}
            onChange={(event) => setNewCollectionName(event.target.value)}
            placeholder="e.g. Home Makeover"
            maxLength={60}
          />
          <div className="wishlist-create-modal-actions">
            <button type="button" className="btn btn-outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!newCollectionName.trim()}>
              Create Collection
            </button>
          </div>
        </form>
      </Modal>

      {/* ── MANAGE COLLECTIONS MODAL ── */}
      <Modal
        isOpen={manageModalOpen}
        onClose={() => {
          setManageModalOpen(false);
          setEditingCollectionId(null);
        }}
        title="Manage Wishlist Collections"
        size="medium"
      >
        <div className="wishlist-manage-modal-body">
          <p className="manage-modal-desc">
            Rename or remove your collections. Items inside deleted collections are safely moved to your &quot;Favorites&quot; list.
          </p>

          <div className="manage-collections-list">
            {collections.map((col) => {
              const isEditing = editingCollectionId === col._id;

              return (
                <div key={col._id} className="manage-collection-item">
                  <div className="manage-col-left">
                    <div className="manage-col-icon">
                      {getCollectionIcon(col.name)}
                    </div>
                    {isEditing ? (
                      <div className="manage-inline-edit-wrap">
                        <input
                          type="text"
                          value={editCollectionName}
                          onChange={(e) => setEditCollectionName(e.target.value)}
                          maxLength={60}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveRename(col._id);
                            if (e.key === "Escape") setEditingCollectionId(null);
                          }}
                        />
                        <button
                          type="button"
                          className="manage-save-rename-btn"
                          onClick={() => handleSaveRename(col._id)}
                          title="Save Name"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          className="manage-cancel-rename-btn"
                          onClick={() => setEditingCollectionId(null)}
                          title="Cancel"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="manage-col-text">
                        <strong>{col.name}</strong>
                        <small>{col.count || 0} products</small>
                      </div>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="manage-col-actions">
                      <button
                        type="button"
                        className="btn btn-outline manage-action-btn"
                        onClick={() => handleStartRename(col)}
                        title="Rename Collection"
                      >
                        <Edit2 size={13} /> Rename
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline manage-action-btn delete"
                        onClick={() => setCollectionToDelete(col)}
                        disabled={collections.length <= 1}
                        title={collections.length <= 1 ? "At least one collection is required" : "Delete Collection"}
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="manage-modal-footer">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setManageModalOpen(false)}
            >
              Done
            </button>
          </div>
        </div>
      </Modal>

      {/* ── CONFIRM DELETE COLLECTION MODAL ── */}
      <ConfirmModal
        isOpen={Boolean(collectionToDelete)}
        title="Delete Collection?"
        message={`Are you sure you want to delete "${collectionToDelete?.name || ""}"? Any wishlisted products in it will be preserved and moved to your Favorites.`}
        confirmText="Delete Collection"
        onConfirm={async () => {
          await handleDeleteCollection(collectionToDelete._id);
        }}
        onCancel={() => setCollectionToDelete(null)}
        loading={deletingCollection}
      />
    </div>
  );
}

export default Wishlist;
