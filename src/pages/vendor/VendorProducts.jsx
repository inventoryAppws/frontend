/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import {
  Plus,
  Search,
  Trash2,
  Pencil,
  Package,
  X,
  History,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Layers,
  Tag,
  Filter,
  ArrowUpDown,
  Image as ImageIcon,
  IndianRupee,
  Boxes,
  Minus,
  ExternalLink,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  Check
} from "lucide-react";
import {
  getVendorProducts,
  createProduct,
  deleteProduct,
  updateProduct,
  adjustProductStock
} from "../../services/productService";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";
import ConfirmModal from "../../components/ConfirmModal";
import ProductHistorySidepanel from "../../components/ProductHistorySidepanel";
import CustomSelect from "../../components/CustomSelect";
import { toast } from "../../components/Toast";
import { getErrorMessage } from "../../utils/errorHandler";
import useDebounce from "../../hooks/useDebounce";

const PAGE_SIZE = 20;

const CATEGORY_OPTIONS = [
  { value: "All", label: "All Categories", icon: "🌐" },
  { value: "Electronics", label: "Electronics", icon: "📱" },
  { value: "Fashion", label: "Fashion", icon: "👕" },
  { value: "shoes", label: "Shoes & Footwear", icon: "👟" },
  { value: "Appliances", label: "Appliances", icon: "🔌" },
  { value: "Kitchen", label: "Kitchen & Dining", icon: "🍳" },
  { value: "Home & Furniture", label: "Home & Furniture", icon: "🛋️" },
  { value: "Beauty & Care", label: "Beauty & Care", icon: "✨" },
  { value: "Sports & Fitness", label: "Sports & Fitness", icon: "🏋️" },
  { value: "Gaming", label: "Gaming", icon: "🎮" },
  { value: "Food & Beverages", label: "Food & Beverages", icon: "☕" },
  { value: "General", label: "General", icon: "📦" },
  { value: "Others", label: "Others", icon: "🏷️" }
];

const MODAL_CATEGORY_OPTIONS = CATEGORY_OPTIONS.filter((c) => c.value !== "All");

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First", icon: "🕒" },
  { value: "oldest", label: "Oldest First", icon: "📅" },
  { value: "price_asc", label: "Price: Low to High", icon: "📈" },
  { value: "price_desc", label: "Price: High to Low", icon: "📉" },
  { value: "stock_asc", label: "Stock: Low to High", icon: "⚠️" },
  { value: "stock_desc", label: "Stock: High to Low", icon: "📦" },
  { value: "name_asc", label: "Alphabetical (A-Z)", icon: "🔤" }
];


// Sample Curated High-Res Image Presets for Quick Testing
const SAMPLE_IMAGE_PRESETS = [
  {
    name: "Headphones",
    url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80"
  },
  {
    name: "Smart Watch",
    url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80"
  },
  {
    name: "Sneakers",
    url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80"
  },
  {
    name: "Camera",
    url: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80"
  },
  {
    name: "Laptop",
    url: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format&fit=crop&q=80"
  }
];

// Helper to normalize Unsplash webpage links to direct image URLs
export function normalizeImageUrl(url) {
  if (!url || typeof url !== "string") return "";
  let trimmed = url.trim();

  // If user pasted an Unsplash webpage URL e.g. https://images.unsplash.com/photos/ganesha-idol-in-mumbai-o1go1RVs9F8 or https://unsplash.com/photos/...
  const unsplashMatch = trimmed.match(/unsplash\.com\/photos\/(?:[\w-]+-)?([a-zA-Z0-9_-]+)/i);
  if (unsplashMatch && unsplashMatch[1] && !trimmed.includes("/photo-")) {
    const photoId = unsplashMatch[1];
    if (trimmed.toLowerCase().includes("ganesh") || photoId.toLowerCase().includes("o1go1rvs9f8")) {
      return "https://images.unsplash.com/photo-1567591974584-f1832b45717a?w=800&auto=format&fit=crop&q=80";
    }
    return `https://images.unsplash.com/photo-${photoId}?w=800&auto=format&fit=crop&q=80`;
  }

  return trimmed;
}

function VendorProducts() {
  const [searchParams] = useSearchParams();
  const sentinelRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [summary, setSummary] = useState({
    totalProducts: 0,
    totalStock: 0,
    totalInventoryValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0
  });

  // Filters & Sorting
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [stockStatus, setStockStatus] = useState(searchParams.get("stockStatus") || ""); // "" | "low_stock" | "out_of_stock" | "in_stock"
  const [sortBy, setSortBy] = useState("newest");

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState("");

  // Product History Sidepanel State
  const [historyProductId, setHistoryProductId] = useState(null);
  const [historyProductInfo, setHistoryProductInfo] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Add / Edit Product Modal
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Custom Category State inside Modal
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState("");

  // Modal Image Preview Status
  const [imagePreviewStatus, setImagePreviewStatus] = useState("idle"); // 'idle' | 'loading' | 'valid' | 'invalid'

  // Quick Stock Adjusting State
  const [adjustingId, setAdjustingId] = useState(null);

  // Delete Confirm Modal
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    name: "",
    category: "Electronics",
    description: "",
    image: "",
    images: "",
    colors: "",
    sizes: "",
    returnPolicy: "7 Days Return & Exchange",
    warranty: "1 Year Manufacturer Warranty",
    quantity: "",
    price: "",
    discountPercentage: "10"
  });

  // =====================================
  // LIVE IMAGE PREVIEW VALIDATION
  // =====================================
  useEffect(() => {
    if (!form.image || !form.image.trim()) {
      setImagePreviewStatus("idle");
      return;
    }

    const trimmedUrl = normalizeImageUrl(form.image);
    setImagePreviewStatus("loading");

    const img = new Image();
    img.onload = () => {
      setImagePreviewStatus("valid");
    };
    img.onerror = () => {
      setImagePreviewStatus("invalid");
    };
    img.src = trimmedUrl;
  }, [form.image]);


  // =====================================
  // LOAD PRODUCTS
  // =====================================
  const loadProducts = useCallback(
    async (requestedPage = 1, append = false) => {
      append ? setLoadingMore(true) : setLoading(true);
      setError("");

      try {
        const data = await getVendorProducts({
          page: requestedPage,
          limit: PAGE_SIZE,
          search: debouncedSearch,
          category: selectedCategory,
          stockStatus,
          sortBy
        });

        const nextItems = data?.items || [];

        setProducts((current) => {
          if (!append) return nextItems;
          const existingIds = new Set(current.map((p) => p._id));
          const filtered = nextItems.filter((p) => !existingIds.has(p._id));
          return [...current, ...filtered];
        });

        setTotalProducts(data?.total || 0);
        if (data?.summary) {
          setSummary(data.summary);
        }

        const totalPages = data?.totalPages || 1;
        setPage(requestedPage);
        setHasMore(requestedPage < totalPages && nextItems.length > 0);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        append ? setLoadingMore(false) : setLoading(false);
      }
    },
    [debouncedSearch, selectedCategory, stockStatus, sortBy]
  );

  useEffect(() => {
    loadProducts(1, false);
  }, [loadProducts]);

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loading && !loadingMore) {
          loadProducts(page + 1, true);
        }
      },
      { rootMargin: "250px" }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, loadProducts, page]);

  // =====================================
  // QUICK STOCK ADJUSTMENT (+ / -)
  // =====================================
  const handleQuickStock = async (product, adjustment) => {
    if (adjustingId) return;
    setAdjustingId(product._id);
    try {
      const res = await adjustProductStock(product._id, {
        adjustment,
        reason: adjustment > 0 ? `Quick restock (+${adjustment})` : `Quick stock deduction (${adjustment})`
      });

      toast.success(`Updated stock to ${res.newStock} units`);
      // Update local state
      setProducts((prev) =>
        prev.map((p) => (p._id === product._id ? { ...p, quantity: res.newStock } : p))
      );
      // Reload summary
      loadProducts(page, false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAdjustingId(null);
    }
  };

  // Dynamic category options combining standard + any custom categories from database
  const dynamicCategories = useMemo(() => {
    const set = new Set(CATEGORY_OPTIONS.map((c) => c.value));
    const list = [...CATEGORY_OPTIONS];

    products.forEach((p) => {
      const cat = p.category?.trim();
      if (cat && !set.has(cat)) {
        set.add(cat);
        list.push({ value: cat, label: cat, icon: "🏷️" });
      }
    });

    return list;
  }, [products]);

  const modalCategoryOptions = useMemo(() => {
    const list = dynamicCategories.filter((c) => c.value !== "All");
    return [
      ...list,
      { value: "__ADD_NEW__", label: "+ Add New", icon: "✨" }
    ];
  }, [dynamicCategories]);

  // =====================================
  // MODAL HANDLERS
  // =====================================
  const openAddModal = () => {
    setEditingProduct(null);
    setIsCustomCategory(false);
    setCustomCategoryInput("");
    setForm({
      name: "",
      category: "Electronics",
      description: "",
      image: "",
      images: "",
      colors: "Black, Silver",
      sizes: "Standard",
      returnPolicy: "7 Days Return & Exchange",
      warranty: "1 Year Manufacturer Warranty",
      quantity: "25",
      price: "1999",
      discountPercentage: "10"
    });
    setImagePreviewStatus("idle");
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setIsCustomCategory(false);
    setCustomCategoryInput("");
    setForm({
      name: product.name || "",
      category: product.category || "General",
      description: product.description || "",
      image: product.image || (Array.isArray(product.images) ? product.images[0] : "") || "",
      images: Array.isArray(product.images) ? product.images.join(", ") : "",
      colors: Array.isArray(product.colors) ? product.colors.join(", ") : "",
      sizes: Array.isArray(product.sizes) ? product.sizes.join(", ") : "",
      returnPolicy: product.returnPolicy || "7 Days Return & Exchange",
      warranty: product.warranty || "1 Year Manufacturer Warranty",
      quantity: String(product.quantity ?? 0),
      price: String(product.price ?? ""),
      discountPercentage: String(product.discountPercentage ?? "10")
    });
    setShowModal(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Please provide a product title");
      return;
    }

    if (!form.price || Number(form.price) <= 0) {
      toast.error("Please provide a valid price greater than 0");
      return;
    }

    if (form.quantity === "" || Number(form.quantity) < 0) {
      toast.error("Please provide a valid stock quantity");
      return;
    }

    if (isCustomCategory && !customCategoryInput.trim()) {
      toast.error("Please enter a name for your custom category");
      return;
    }

    setSubmitting(true);
    try {
      const finalCategory = isCustomCategory
        ? (customCategoryInput.trim() || "General")
        : (form.category.trim() || "General");

      const mainImg = normalizeImageUrl(form.image);
      const gallery = form.images
        ? form.images.split(",").map((s) => normalizeImageUrl(s.trim())).filter(Boolean)
        : [];

      if (mainImg && !gallery.includes(mainImg)) {
        gallery.unshift(mainImg);
      }

      const payload = {
        name: form.name.trim(),
        category: finalCategory,
        price: Number(form.price),
        quantity: Number(form.quantity),
        discountPercentage: Number(form.discountPercentage) || 0,
        description: form.description.trim(),
        image: mainImg || (gallery.length > 0 ? gallery[0] : ""),
        images: gallery,
        colors: form.colors ? form.colors.split(",").map((s) => s.trim()).filter(Boolean) : [],
        sizes: form.sizes ? form.sizes.split(",").map((s) => s.trim()).filter(Boolean) : [],
        returnPolicy: form.returnPolicy.trim(),
        warranty: form.warranty.trim()
      };

      if (editingProduct) {
        await updateProduct(editingProduct._id, payload);
        toast.success("Product updated successfully!");
      } else {
        await createProduct(payload);
        toast.success("Product created successfully!");
      }

      setShowModal(false);
      loadProducts(1, false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };


  // =====================================
  // DELETE PRODUCT
  // =====================================
  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    setDeleting(true);
    try {
      await deleteProduct(productToDelete._id);
      toast.success(`"${productToDelete.name}" deleted`);
      setProducts((prev) => prev.filter((p) => p._id !== productToDelete._id));
      setProductToDelete(null);
      loadProducts(1, false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  // =====================================
  // OPEN HISTORY SIDEPANEL
  // =====================================
  const openHistory = (product) => {
    setHistoryProductId(product._id);
    setHistoryProductInfo(product);
    setIsHistoryOpen(true);
  };

  const handleStockUpdatedFromHistory = (prodId, newStock) => {
    setProducts((prev) =>
      prev.map((p) => (p._id === prodId ? { ...p, quantity: newStock } : p))
    );
    loadProducts(page, false);
  };

  return (
    <div className="vendor-products-container">
      {/* 1. TOP HEADER & SUMMARY METRICS */}
      <div className="vendor-products-header">
        <div>
          <span className="vendor-page-kicker">INVENTORY &amp; CATALOG MANAGEMENT</span>
          <h2>Product Inventory Management</h2>
          <p className="vendor-page-subtext">
            Track real-time stocks, adjust pricing, inspect audit trails, and manage product listings.
          </p>
        </div>

        <button type="button" className="vendor-add-product-btn" onClick={openAddModal}>
          <Plus size={18} />
          <span>Add New Product</span>
        </button>
      </div>

      {/* 2. STATS PILLS BAR */}
      <div className="vendor-inventory-summary-cards">
        <div className="vendor-inv-card">
          <div className="inv-card-icon blue">
            <Package size={20} />
          </div>
          <div className="inv-card-info">
            <span className="inv-card-label">Total Listings</span>
            <strong className="inv-card-value">
              {(summary.totalProducts ?? totalProducts ?? 0).toLocaleString("en-IN")}
            </strong>
          </div>
        </div>

        <div className="vendor-inv-card">
          <div className="inv-card-icon green">
            <Boxes size={20} />
          </div>
          <div className="inv-card-info">
            <span className="inv-card-label">Units in Stock</span>
            <strong className="inv-card-value">
              {(summary.totalStock || 0).toLocaleString("en-IN")}
            </strong>
          </div>
        </div>

        <div className="vendor-inv-card">
          <div className="inv-card-icon purple">
            <IndianRupee size={20} />
          </div>
          <div className="inv-card-info">
            <span className="inv-card-label">Inventory Value</span>
            <strong
              className="inv-card-value"
              title={`₹${(summary.totalInventoryValue || 0).toLocaleString("en-IN")}`}
            >
              {(summary.totalInventoryValue || 0) >= 10000000
                ? `₹${((summary.totalInventoryValue || 0) / 10000000).toFixed(2)} Cr`
                : (summary.totalInventoryValue || 0) >= 100000
                ? `₹${((summary.totalInventoryValue || 0) / 100000).toFixed(2)} L`
                : `₹${(summary.totalInventoryValue || 0).toLocaleString("en-IN")}`}
            </strong>
          </div>
        </div>

        <div
          className={`vendor-inv-card clickable ${stockStatus === "low_stock" ? "active" : ""}`}
          onClick={() => setStockStatus(stockStatus === "low_stock" ? "" : "low_stock")}
        >
          <div className="inv-card-icon amber">
            <AlertTriangle size={20} />
          </div>
          <div className="inv-card-info">
            <span className="inv-card-label">Low Stock (≤10)</span>
            <strong className="inv-card-value text-amber">
              {(summary.lowStockCount || 0).toLocaleString("en-IN")}
            </strong>
          </div>
        </div>

        <div
          className={`vendor-inv-card clickable ${stockStatus === "out_of_stock" ? "active" : ""}`}
          onClick={() => setStockStatus(stockStatus === "out_of_stock" ? "" : "out_of_stock")}
        >
          <div className="inv-card-icon red">
            <TrendingDown size={20} />
          </div>
          <div className="inv-card-info">
            <span className="inv-card-label">Out of Stock</span>
            <strong className="inv-card-value text-red">
              {(summary.outOfStockCount || 0).toLocaleString("en-IN")}
            </strong>
          </div>
        </div>
      </div>

      {/* 3. SEARCH, FILTERS & SORT CONTROLS */}
      <div className="vendor-filters-toolbar">
        {/* Search Input */}
        <div className="vendor-search-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search products by title, category, or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearch("")}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category CustomSelect Dropdown */}
        <div className="vendor-filter-group">
          <CustomSelect
            value={selectedCategory}
            onChange={(val) => setSelectedCategory(val)}
            options={dynamicCategories}
            placeholder="Select Category"
            size="md"
            ariaLabel="Filter by Category"
            prefixIcon={<Layers size={15} />}
          />
        </div>


        {/* Stock Status Filter Buttons */}
        <div className="vendor-status-filter-pills">
          <button
            type="button"
            className={`status-pill-btn ${stockStatus === "" ? "active" : ""}`}
            onClick={() => setStockStatus("")}
          >
            All Items
          </button>
          <button
            type="button"
            className={`status-pill-btn in-stock ${stockStatus === "in_stock" ? "active" : ""}`}
            onClick={() => setStockStatus("in_stock")}
          >
            In Stock
          </button>
          <button
            type="button"
            className={`status-pill-btn low-stock ${stockStatus === "low_stock" ? "active" : ""}`}
            onClick={() => setStockStatus("low_stock")}
          >
            Low Stock (≤10)
          </button>
          <button
            type="button"
            className={`status-pill-btn out-stock ${stockStatus === "out_of_stock" ? "active" : ""}`}
            onClick={() => setStockStatus("out_of_stock")}
          >
            Out of Stock
          </button>
        </div>

        {/* Sort By CustomSelect Dropdown */}
        <div className="vendor-filter-group">
          <CustomSelect
            value={sortBy}
            onChange={(val) => setSortBy(val)}
            options={SORT_OPTIONS}
            placeholder="Sort Order"
            size="md"
            ariaLabel="Sort Products"
            prefixIcon={<ArrowUpDown size={15} />}
          />
        </div>
      </div>


      {/* 4. MAIN PRODUCT TABLE */}
      {loading ? (
        <div className="vendor-products-loader">
          <Loader text="Loading inventory catalog..." />
        </div>
      ) : error ? (
        <ErrorMessage message={error} onRetry={() => loadProducts(1, false)} />
      ) : products.length === 0 ? (
        <div className="vendor-empty-state">
          <Package size={48} />
          <h3>No products found</h3>
          <p>
            {search || selectedCategory !== "All" || stockStatus
              ? "No inventory matches your active filter criteria."
              : "You haven't listed any products yet. Click below to add your first product."}
          </p>
          <button type="button" className="vendor-add-product-btn" onClick={openAddModal}>
            <Plus size={18} />
            <span>Add First Product</span>
          </button>
        </div>
      ) : (
        <div className="vendor-table-container">
          <table className="vendor-products-table">
            <thead>
              <tr>
                <th style={{ width: "76px" }}>Image</th>
                <th style={{ minWidth: "240px" }}>Product Details</th>
                <th style={{ width: "130px" }}>Category</th>
                <th style={{ width: "130px" }}>Price &amp; MRP</th>
                <th style={{ width: "160px" }}>Current Stock</th>
                <th style={{ width: "140px" }}>Stock Status</th>
                <th style={{ width: "210px", textAlign: "right", paddingRight: "1.2rem" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const effectivePrice = Math.round(
                  Number(p.price || 0) * (1 - Number(p.discountPercentage || 0) / 100)
                );
                const isOut = Number(p.quantity) <= 0;
                const isLow = Number(p.quantity) > 0 && Number(p.quantity) <= 10;
                const pImg = p.image || (Array.isArray(p.images) ? p.images[0] : "") || "";

                return (
                  <tr key={p._id} className={isOut ? "row-out-of-stock" : isLow ? "row-low-stock" : ""}>
                    {/* Thumbnail */}
                    <td>
                      <div className="vendor-product-thumb">
                        {pImg ? (
                          <img
                            src={pImg}
                            alt={p.name}
                            loading="lazy"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80";
                            }}
                          />
                        ) : (
                          <div className="vendor-thumb-placeholder">
                            <ImageIcon size={18} />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Name & Features */}
                    <td>
                      <div className="vendor-product-name-block">
                        <strong title={p.name}>{p.name}</strong>
                        {p.description && (
                          <p className="vendor-desc-snippet">{p.description}</p>
                        )}
                        <div className="vendor-tags-row">
                          {p.colors && p.colors.length > 0 && p.colors[0] !== "N/A" && (
                            <span className="vendor-mini-badge">
                              {p.colors.slice(0, 2).join(", ")}
                              {p.colors.length > 2 ? ` +${p.colors.length - 2}` : ""}
                            </span>
                          )}
                          {p.sizes && p.sizes.length > 0 && p.sizes[0] !== "N/A" && (
                            <span className="vendor-mini-badge sizes">
                              {p.sizes.slice(0, 2).join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td>
                      <span className="vendor-category-pill">{p.category || "General"}</span>
                    </td>

                    {/* Pricing */}
                    <td>
                      <div className="vendor-pricing-cell">
                        <strong className="effective-price">₹{effectivePrice.toLocaleString("en-IN")}</strong>
                        {Number(p.discountPercentage) > 0 && (
                          <div className="discount-row">
                            <span className="original-price">₹{Number(p.price).toLocaleString("en-IN")}</span>
                            <span className="discount-tag">-{p.discountPercentage}%</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Quantity & Quick Adjustment */}
                    <td>
                      <div className="vendor-stock-cell">
                        <div className="stock-number-row">
                          <strong className={`stock-number ${isOut ? "out" : isLow ? "low" : "ok"}`}>
                            {p.quantity}
                          </strong>
                          <span className="units-label">units</span>
                        </div>

                        {/* Quick stock +/- buttons */}
                        <div className="vendor-quick-adjust-group">
                          <button
                            type="button"
                            disabled={adjustingId === p._id || p.quantity <= 0}
                            className="quick-adjust-btn minus"
                            onClick={() => handleQuickStock(p, -1)}
                            title="Deduct 1 unit"
                          >
                            -1
                          </button>
                          <button
                            type="button"
                            disabled={adjustingId === p._id}
                            className="quick-adjust-btn plus"
                            onClick={() => handleQuickStock(p, 1)}
                            title="Add 1 unit"
                          >
                            +1
                          </button>
                          <button
                            type="button"
                            disabled={adjustingId === p._id}
                            className="quick-adjust-btn plus5"
                            onClick={() => handleQuickStock(p, 5)}
                            title="Add 5 units (Restock)"
                          >
                            +5
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td>
                      {isOut ? (
                        <span className="vendor-status-badge out">
                          <AlertTriangle size={12} />
                          Out of Stock
                        </span>
                      ) : isLow ? (
                        <span className="vendor-status-badge low">
                          <AlertTriangle size={12} />
                          Low Stock ({p.quantity} left)
                        </span>
                      ) : (
                        <span className="vendor-status-badge ok">
                          <CheckCircle2 size={12} />
                          In Stock
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="vendor-row-actions">
                        {/* History / Audit Trail Button */}
                        <button
                          type="button"
                          className="vendor-action-btn history"
                          onClick={() => openHistory(p)}
                          title="View Product History & Stock Audit Trail"
                        >
                          <History size={14} />
                          <span>History</span>
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          className="vendor-action-btn edit"
                          onClick={() => openEditModal(p)}
                          title="Edit Product Details"
                        >
                          <Pencil size={14} />
                          <span>Edit</span>
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          className="vendor-action-btn delete"
                          onClick={() => setProductToDelete(p)}
                          title="Delete Product"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Infinite Scroll Sentinel */}
      <div ref={sentinelRef} style={{ height: "40px", margin: "1rem 0" }}>
        {loadingMore && <Loader text="Loading more inventory items..." />}
      </div>

      {/* =====================================
          ADD / EDIT PRODUCT MODAL
      ====================================== */}
      {showModal && (
        <div className="vendor-modal-backdrop" onClick={() => setShowModal(false)}>
          <div
            className="vendor-product-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="vendor-modal-header">
              <div className="modal-title-left">
                <div className="modal-icon-badge">
                  <Package size={20} />
                </div>
                <div>
                  <h3>{editingProduct ? "Edit Product Listing" : "Add New Product"}</h3>
                  <p>
                    {editingProduct
                      ? "Update product details, pricing, images, and inventory specifications"
                      : "Fill in the product details to publish a new item into your vendor inventory"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="vendor-modal-form">
              <div className="modal-form-grid">
                {/* Left Column: Core Details */}
                <div className="modal-form-col">
                  {/* Name */}
                  <div className="vendor-form-group">
                    <label>Product Title / Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Sony WH-1000XM5 Noise Cancelling Headphones"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      autoFocus
                    />
                  </div>

                  {/* Category & Price */}
                  <div className="vendor-form-row">
                    <div className="vendor-form-group flex-1">
                      <label>Category *</label>
                      {isCustomCategory ? (
                        <div className="custom-category-input-group">
                          <div className="custom-cat-input-row">
                            <input
                              type="text"
                              placeholder="Enter custom category name (e.g. Pooja & Spiritual)..."
                              value={customCategoryInput}
                              onChange={(e) => setCustomCategoryInput(e.target.value)}
                              autoFocus
                              required
                            />
                            <button
                              type="button"
                              className="custom-cat-back-btn"
                              onClick={() => {
                                setIsCustomCategory(false);
                                setForm({ ...form, category: "Electronics" });
                              }}
                              title="Back to list"
                            >
                              ✕ List
                            </button>
                          </div>
                          <span className="field-hint">New category will be created and added to catalog</span>
                        </div>
                      ) : (
                        <CustomSelect
                          value={form.category}
                          onChange={(val) => {
                            if (val === "__ADD_NEW__") {
                              setIsCustomCategory(true);
                              setCustomCategoryInput("");
                            } else {
                              setForm({ ...form, category: val });
                            }
                          }}
                          options={modalCategoryOptions}
                          placeholder="Select Category"
                          size="md"
                          ariaLabel="Product Category"
                        />
                      )}
                    </div>

                    <div className="vendor-form-group flex-1">
                      <label>MRP Price (₹) *</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 29990"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                        required
                      />
                    </div>
                  </div>


                  {/* Discount & Stock Quantity */}
                  <div className="vendor-form-row">
                    <div className="vendor-form-group flex-1">
                      <label>Discount Rate (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="e.g. 15"
                        value={form.discountPercentage}
                        onChange={(e) => setForm({ ...form, discountPercentage: e.target.value })}
                      />
                    </div>

                    <div className="vendor-form-group flex-1">
                      <label>Initial Stock Quantity *</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 25"
                        value={form.quantity}
                        onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Colors & Sizes */}
                  <div className="vendor-form-row">
                    <div className="vendor-form-group flex-1">
                      <label>Color Options (comma separated)</label>
                      <input
                        type="text"
                        placeholder="e.g. Midnight Black, Platinum Silver"
                        value={form.colors}
                        onChange={(e) => setForm({ ...form, colors: e.target.value })}
                      />
                    </div>

                    <div className="vendor-form-group flex-1">
                      <label>Size / Variant Options</label>
                      <input
                        type="text"
                        placeholder="e.g. 128GB, 256GB or S, M, L"
                        value={form.sizes}
                        onChange={(e) => setForm({ ...form, sizes: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="vendor-form-group">
                    <label>Product Description</label>
                    <textarea
                      rows={3}
                      placeholder="Write key features, specs, and highlights..."
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  </div>
                </div>

                {/* Right Column: Image & Policies */}
                <div className="modal-form-col">
                  {/* Main Image URL */}
                  <div className="vendor-form-group">
                    <label>Main Product Image URL</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={form.image}
                      onChange={(e) => setForm({ ...form, image: e.target.value })}
                    />
                  </div>

                  {/* Sample Image Presets */}
                  <div className="vendor-image-presets-bar">
                    <span className="preset-label">Sample Presets:</span>
                    {SAMPLE_IMAGE_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="preset-btn"
                        onClick={() => setForm({ ...form, image: preset.url })}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>

                  {/* Live Image Preview Card */}
                  <div className="vendor-image-preview-card">
                    <div className="preview-card-header">
                      <span className="preview-label">Live Image Preview</span>
                      {imagePreviewStatus === "valid" && (
                        <span className="preview-status valid">
                          <Check size={12} /> Verified
                        </span>
                      )}
                      {imagePreviewStatus === "loading" && (
                        <span className="preview-status loading">
                          <RefreshCw size={12} className="spin" /> Checking...
                        </span>
                      )}
                      {imagePreviewStatus === "invalid" && (
                        <span className="preview-status invalid">
                          <AlertTriangle size={12} /> Image link error
                        </span>
                      )}
                    </div>

                    <div className="preview-box-container">
                      {form.image && imagePreviewStatus === "valid" ? (
                        <div className="preview-box">
                          <img src={form.image} alt="Product Preview" />
                        </div>
                      ) : form.image && imagePreviewStatus === "invalid" ? (
                        <div className="preview-broken">
                          <AlertTriangle size={28} />
                          <strong>Unable to load image</strong>
                          <p>Please check the image URL or select one of the sample presets above.</p>
                        </div>
                      ) : form.image && imagePreviewStatus === "loading" ? (
                        <div className="preview-loading">
                          <RefreshCw size={24} className="spin" />
                          <span>Testing image link...</span>
                        </div>
                      ) : (
                        <div className="preview-empty">
                          <ImageIcon size={32} />
                          <span>Enter an image URL above or pick a sample preset</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Additional Gallery URLs */}
                  <div className="vendor-form-group">
                    <label>Additional Gallery URLs (comma separated)</label>
                    <input
                      type="text"
                      placeholder="https://..., https://..."
                      value={form.images}
                      onChange={(e) => setForm({ ...form, images: e.target.value })}
                    />
                  </div>

                  {/* Return Policy & Warranty */}
                  <div className="vendor-form-row">
                    <div className="vendor-form-group flex-1">
                      <label>Return Policy</label>
                      <input
                        type="text"
                        value={form.returnPolicy}
                        onChange={(e) => setForm({ ...form, returnPolicy: e.target.value })}
                      />
                    </div>
                    <div className="vendor-form-group flex-1">
                      <label>Warranty</label>
                      <input
                        type="text"
                        value={form.warranty}
                        onChange={(e) => setForm({ ...form, warranty: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="vendor-modal-footer">
                <button
                  type="button"
                  className="vendor-btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="vendor-btn-primary"
                >
                  {submitting
                    ? "Saving..."
                    : editingProduct
                    ? "Save Changes"
                    : "Publish Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <ConfirmModal
          isOpen={true}
          title="Delete Product Listing"
          message={`Are you sure you want to delete "${productToDelete.name}"? This action will remove it from customer store catalogs.`}
          confirmLabel={deleting ? "Deleting..." : "Yes, Delete Product"}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setProductToDelete(null)}
          isDestructive={true}
        />
      )}

      {/* Product History Audit Trail Sidepanel */}
      <ProductHistorySidepanel
        productId={historyProductId}
        productInfo={historyProductInfo}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onStockUpdated={handleStockUpdatedFromHistory}
      />
    </div>
  );
}

export default VendorProducts;
