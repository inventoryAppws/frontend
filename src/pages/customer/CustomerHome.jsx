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
  ChevronDown,
  Flame,
  TrendingUp,
  Trophy,
  Layers,
  ArrowRight,
  Zap,
  Percent,
  Navigation,
  Truck
} from "lucide-react";
import { useNavigate, useSearchParams, useOutletContext } from "react-router-dom";
import { getCart, addToCart } from "../../services/cartService";
import { getWishlist, addToWishlist, removeFromWishlist } from "../../services/wishlistService";
import { getPublicProducts, getProductSearchMeta, getPublicBanners, getPublicPromotions } from "../../services/productService";
import { getRecommendedForYou, getBudgetRecommendations, getPastPurchasesRecommendations } from "../../services/recommendationService";
import {
  getNearestHub,
  getLocationSettings,
  REGIONAL_FULFILLMENT_HUBS,
  isProductExpressEligible
} from "../../services/locationService";
import HubLocationDropdown from "../../components/location/HubLocationDropdown";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";
import WishlistCollectionPicker from "../../components/WishlistCollectionPicker";
import { toast } from "../../components/Toast";
import { getErrorMessage } from "../../utils/errorHandler";
import ProductCard from "../../components/ProductCard";
import ProductCarousel from "../../components/ProductCarousel";
import "../../styles/discovery.css";

const QUICK_SHORTCUTS = [
  { id: "all", label: "All Products", icon: Sparkles },
  { id: "express_delivery", label: "Express Delivery", icon: Zap },
  { id: "deals", label: "Featured Deals", icon: Flame },
  { id: "new_arrivals", label: "New Arrivals", icon: Zap },
  { id: "best_sellers", label: "Best Sellers", icon: Trophy },
  { id: "top_rated", label: "Top Rated (4★+)", icon: Star },
  { id: "under_500", label: "Under ₹500", icon: Percent },
  { id: "under_1000", label: "Under ₹1,000", icon: Tag },
  { id: "trending", label: "Trending Now", icon: TrendingUp },
];

const PAGE_SIZE = 20;

const SORT_OPTIONS = [
  { id: "newest", label: "Newest First", desc: "Fresh arrivals & latest products", icon: Clock },
  { id: "trending", label: "Trending Now", desc: "Top ordered products with high ratings", icon: TrendingUp },
  { id: "best_sellers", label: "Best Sellers", desc: "Highest overall customer purchase volume", icon: Trophy },
  { id: "discount_desc", label: "Biggest Discounts", desc: "Mega savings & limited-time deals", icon: Percent },
  { id: "rating_desc", label: "Highest Rated", desc: "Top customer ratings & reviews", icon: Star },
  { id: "price_asc", label: "Price: Low to High", desc: "Budget friendly first", icon: ArrowUpRight },
  { id: "price_desc", label: "Price: High to Low", desc: "Premium & luxury first", icon: ArrowDownRight },
  { id: "name_asc", label: "Name: A to Z", desc: "Alphabetical product catalog", icon: Tag },
];

const HERO_SLIDES = [
  { id: 1, img: "/banners/banner-slide-1.jpg?v=3", alt: "Great Products Great Prices", title: "Great Products, Great Prices", subtitle: "Shop premium quality selections hand-picked from verified vendors across the country" },
  { id: 2, img: "/banners/banner-slide-2.jpg?v=3", alt: "Make Everyday Life Easier", title: "Make Everyday Life Easier", subtitle: "Discover smart kitchen appliances and home essentials crafted to simplify every moment" },
  { id: 3, img: "/banners/banner-slide-3.jpg?v=3", alt: "Style for Every You", title: "Style for Every You", subtitle: "Express yourself with fresh fashion collections and high quality apparel" },
  { id: 4, img: "/banners/banner-slide-4.jpg?v=3", alt: "Upgrade to Smarter Living", title: "Upgrade to Smarter Living", subtitle: "Experience modern electronics, audio accessories, and next-generation tech" },
  { id: 5, img: "/banners/banner-slide-5.jpg?v=3", alt: "Fresh Choices Brighter Living", title: "Fresh Choices, Brighter Living", subtitle: "Daily essentials, organic goods, and lifestyle accessories designed for your well-being" },
  { id: 6, img: "/banners/banner-slide-6.jpg?v=3", alt: "Big Savings Happier Days", title: "Big Savings, Happier Days", subtitle: "Unbeatable deals and exclusive multi-vendor discounts on trending items" },
];

const PROMO_FALLBACK_IMAGES = {
  Electronics: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
  Footwear: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80",
  Fashion: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&auto=format&fit=crop&q=80",
  "Home & Living": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80",
  Beauty: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop&q=80",
  Grocery: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80",
  Accessories: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
  All: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&auto=format&fit=crop&q=80",
  default: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&auto=format&fit=crop&q=80",
};

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
  const { profile, cartCount = 0, setCartCount, reloadCart } = useOutletContext() || {};
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [banners, setBanners] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [nearestHub, setNearestHub] = useState(null);
  const sentinelRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Load published banners and promotions configured by Admin
  useEffect(() => {
    getPublicBanners()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setBanners(data);
        }
      })
      .catch((err) => {
        console.warn("Could not load dynamic hero banners:", err?.message);
      });

    getPublicPromotions()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPromotions(data);
        }
      })
      .catch((err) => {
        console.warn("Could not load promotions:", err?.message);
      });
  }, []);

  // Compute slides: Use admin configured published banners if available; fallback to defaults
  const activeSlides = banners.length > 0
    ? banners.map((b) => ({
        id: b._id,
        img: b.imageUrl,
        alt: b.title || "Promotional Banner",
        title: b.title,
        subtitle: b.subtitle,
        linkUrl: b.linkUrl || "/customer"
      }))
    : HERO_SLIDES;

  // 4-second slideshow interval for header banner
  useEffect(() => {
    if (!activeSlides.length) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % activeSlides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [activeSlides.length]);

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
  const [deliverySpeedFilter, setDeliverySpeedFilter] = useState(() => getLocationSettings().defaultDeliveryFilter || "all");
  const [fulfillmentHubFilter, setFulfillmentHubFilter] = useState(() => getLocationSettings().preferredHub || "auto");

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
  const [draftDeliverySpeed, setDraftDeliverySpeed] = useState(() => getLocationSettings().defaultDeliveryFilter || "all");
  const [draftFulfillmentHub, setDraftFulfillmentHub] = useState(() => getLocationSettings().preferredHub || "auto");
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

  // Discovery sections state
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [hotDealsProducts, setHotDealsProducts] = useState([]);
  const [newArrivalsProducts, setNewArrivalsProducts] = useState([]);
  const [techProducts, setTechProducts] = useState([]);
  const [fashionProducts, setFashionProducts] = useState([]);
  const [homeProducts, setHomeProducts] = useState([]);
  const [budgetTier, setBudgetTier] = useState(2499);
  const [budgetProducts, setBudgetProducts] = useState([]);
  const [pastPurchaseProducts, setPastPurchaseProducts] = useState([]);
  const [discoveryLoading, setDiscoveryLoading] = useState(true);
  const [activeShortcut, setActiveShortcut] = useState("all");
  const [recSubtitle, setRecSubtitle] = useState("Hand-picked selections tailored for you");

  const scrollToCatalog = useCallback(() => {
    const el = document.getElementById("catalog-start") || document.querySelector(".adv-catalog-layout");
    if (el) {
      const top = el.getBoundingClientRect().top + window.pageYOffset - 75;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }
  }, []);

  const scrollToCatalogWithCategoryAlign = useCallback((catName) => {
    const el = document.getElementById("catalog-start") || document.querySelector(".adv-catalog-layout");
    if (el) {
      const top = el.getBoundingClientRect().top + window.pageYOffset - 75;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }
    if (catName) {
      setTimeout(() => {
        const activeCard = document.querySelector(".category-card-compact.active") ||
          document.getElementById(`cat-card-${encodeURIComponent(String(catName).toLowerCase())}`);
        if (activeCard) {
          activeCard.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        }
      }, 60);
    }
  }, []);

  const scrollToSection = useCallback((id) => {
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.pageYOffset - 75;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }
  }, []);

  // Load discovery carousels and category collections with real DB metrics
  useEffect(() => {
    let isMounted = true;
    setDiscoveryLoading(true);

    Promise.allSettled([
      getCart().catch(() => null),
      getWishlist().catch(() => null)
    ])
      .then(([cartRes, wishRes]) => {
        const userCategories = [];
        if (cartRes.status === "fulfilled" && cartRes.value?.items) {
          cartRes.value.items.forEach((ci) => {
            const cat = ci.productId?.category || ci.category;
            if (cat) userCategories.push(cat);
          });
        }
        if (wishRes.status === "fulfilled") {
          const wishItems = Array.isArray(wishRes.value) ? wishRes.value : (wishRes.value?.items || []);
          wishItems.forEach((wi) => {
            const cat = wi.product?.category || wi.productId?.category || wi.category;
            if (cat) userCategories.push(cat);
          });
        }

        const preferredCat = userCategories.length > 0 ? userCategories[0] : null;

        let customerId = profile?._id || profile?.id;
        if (!customerId) {
          try {
            const stored = JSON.parse(localStorage.getItem('user') || localStorage.getItem('customer') || '{}');
            customerId = stored._id || stored.id || stored.customerId;
          } catch {}
        }

        const recPromise = getRecommendedForYou(customerId, 8, preferredCat ? { category: preferredCat } : {})
          .catch(() => ({ items: [] }));

        return Promise.allSettled([
          getPublicProducts({ limit: 8, sortBy: "trending" }),
          getPublicProducts({ limit: 8, sortBy: "discount_desc" }),
          recPromise,
          getPublicProducts({ limit: 8, sortBy: "newest" }),
          getPublicProducts({ limit: 4, category: "Electronics" }),
          getPublicProducts({ limit: 4, category: "Fashion" }),
          getPublicProducts({ limit: 4, category: "Home & Kitchen Appliances" }),
        ]);
      })
      .then(([trendingRes, dealsRes, recRes, newRes, techRes, fashionRes, homeRes]) => {
        if (!isMounted) return;
        if (trendingRes.status === "fulfilled" && trendingRes.value?.items) {
          setTrendingProducts(trendingRes.value.items);
        }
        if (dealsRes.status === "fulfilled" && dealsRes.value?.items) {
          setHotDealsProducts(dealsRes.value.items);
        }
        if (recRes.status === "fulfilled" && recRes.value) {
          const recData = recRes.value;
          const recItems = Array.isArray(recData) ? recData : (recData.items || []);
          setRecommendedProducts(recItems.length > 0 ? recItems : (trendingRes.value?.items || []));
          if (recData.userSignals?.topCategory) {
            setRecSubtitle(`Curated based on your recent interest in ${recData.userSignals.topCategory}`);
          } else if (recItems[0]?.category) {
            setRecSubtitle(`Curated based on your recent interest in ${recItems[0].category}`);
          } else {
            setRecSubtitle("Handpicked AI recommendations tailored to your shopping preferences");
          }
        }
        if (newRes.status === "fulfilled" && newRes.value?.items) {
          setNewArrivalsProducts(newRes.value.items);
        }
        if (techRes.status === "fulfilled" && techRes.value?.items) {
          setTechProducts(techRes.value.items);
        }
        if (fashionRes.status === "fulfilled" && fashionRes.value?.items) {
          setFashionProducts(fashionRes.value.items);
        }
        if (homeRes.status === "fulfilled" && homeRes.value?.items) {
          setHomeProducts(homeRes.value.items);
        }
        setDiscoveryLoading(false);
      })
      .catch(() => {
        if (isMounted) setDiscoveryLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Budget Recommendations Loader
  useEffect(() => {
    let isMounted = true;
    async function loadBudgetRecs() {
      try {
        const items = await getBudgetRecommendations(budgetTier, 8);
        if (isMounted) setBudgetProducts(items || []);
      } catch (err) {
        console.error('Failed to load budget recommendations:', err);
      }
    }
    loadBudgetRecs();
    return () => { isMounted = false; };
  }, [budgetTier]);

  // Past Purchases Recommendations Loader
  useEffect(() => {
    let isMounted = true;
    async function loadPastPurchases() {
      try {
        const custId = profile?._id || profile?.id;
        const items = await getPastPurchasesRecommendations(custId, 8);
        if (isMounted) setPastPurchaseProducts(items || []);
      } catch (err) {
        console.error('Failed to load past purchases recommendations:', err);
      }
    }
    loadPastPurchases();
    return () => { isMounted = false; };
  }, [profile?._id, profile?.id]);

  // Sync with URL params if category or search query changes externally & scroll to section
  useEffect(() => {
    const urlCat = searchParams.get("category");
    const urlQ = searchParams.get("q");
    const urlVendor = searchParams.get("vendor");

    if (urlCat) {
      setSelectedCategory(urlCat);
      if (!urlQ) {
        setSearchInput("");
        setSubmittedSearch("");
      }
      if (!urlVendor) {
        setSelectedVendors([]);
      }
      setTimeout(() => scrollToCatalogWithCategoryAlign(urlCat), 100);
      setTimeout(() => scrollToCatalogWithCategoryAlign(urlCat), 350);
    } else if (urlQ !== null || urlVendor) {
      setSelectedCategory("All");
    }

    if (urlQ !== null) {
      setSearchInput(urlQ);
      setSubmittedSearch(urlQ);
      if (!urlCat) {
        setSelectedCategory("All");
      }
      if (!urlVendor) {
        setSelectedVendors([]);
      }
      if (urlQ.trim()) {
        setTimeout(() => scrollToCatalog(), 100);
        setTimeout(() => scrollToCatalog(), 350);
      }
    }

    if (urlVendor) {
      setSelectedVendors([urlVendor]);
      if (!urlCat) {
        setSelectedCategory("All");
      }
      if (!urlQ) {
        setSearchInput("");
        setSubmittedSearch("");
      }
      setTimeout(() => scrollToCatalog(), 100);
      setTimeout(() => scrollToCatalog(), 350);
    }
  }, [searchParams, scrollToCatalog, scrollToCatalogWithCategoryAlign]);

  // Listen for direct topbar navigation and quick category selection events
  useEffect(() => {
    const handleScrollToSection = (e) => {
      const { category, vendor, search, target, resetSearch, resetCategory, resetVendor } = e.detail || {};

      if (category) {
        setSelectedCategory(category);
        if (resetSearch || search === undefined) {
          setSearchInput("");
          setSubmittedSearch("");
        }
        if (resetVendor || !vendor) {
          setSelectedVendors([]);
        }
      }

      if (vendor) {
        setSelectedVendors([vendor]);
        if (resetSearch || search === undefined) {
          setSearchInput("");
          setSubmittedSearch("");
        }
        if (resetCategory || !category) {
          setSelectedCategory("All");
        }
      }

      if (search !== undefined) {
        setSearchInput(search);
        setSubmittedSearch(search);
        if (resetCategory || !category) {
          setSelectedCategory("All");
        }
        if (resetVendor || !vendor) {
          setSelectedVendors([]);
        }
      }

      if (target === "category") {
        const catSectionEl = document.getElementById("discovery-categories-section");
        if (catSectionEl) {
          const top = catSectionEl.getBoundingClientRect().top + window.pageYOffset - 75;
          window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
        }
        if (category) {
          setTimeout(() => {
            const activeCard = document.querySelector(".category-card-compact.active") ||
              document.getElementById(`cat-card-${encodeURIComponent(String(category).toLowerCase())}`);
            if (activeCard) {
              activeCard.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
            }
          }, 60);
        }
        return;
      }

      // Default for catalog searches/category selections: scroll to catalog and center category card
      scrollToCatalogWithCategoryAlign(category);
      setTimeout(() => scrollToCatalogWithCategoryAlign(category), 200);
      setTimeout(() => scrollToCatalogWithCategoryAlign(category), 450);
    };

    window.addEventListener("scroll-to-section", handleScrollToSection);
    return () => window.removeEventListener("scroll-to-section", handleScrollToSection);
  }, [scrollToCatalogWithCategoryAlign]);

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

  const fetchNearestHub = useCallback(async (explicitAddr = null, hubOverride = null) => {
    let lat = null;
    let lng = null;
    let area = '';
    let city = '';
    let pincode = '';
    let activeAddressObj = explicitAddr;

    try {
      if (!activeAddressObj) {
        const stored = localStorage.getItem("selected_delivery_address");
        if (stored) {
          activeAddressObj = JSON.parse(stored);
        }
      }

      if (activeAddressObj) {
        if (activeAddressObj.coordinates?.lat && activeAddressObj.coordinates?.lng && Number(activeAddressObj.coordinates.lat) !== 0) {
          lat = Number(activeAddressObj.coordinates.lat);
          lng = Number(activeAddressObj.coordinates.lng);
        }
        area = activeAddressObj.area || activeAddressObj.house || '';
        city = activeAddressObj.city || '';
        pincode = activeAddressObj.pincode || '';
      }

      const settings = getLocationSettings();
      const radius = settings.expressRadiusKm || 100;
      const targetHub = hubOverride || fulfillmentHubFilter || settings.preferredHub || 'auto';
      const hubData = await getNearestHub(lat, lng, area, city, radius, pincode, targetHub);
      setNearestHub(hubData);
      try {
        sessionStorage.setItem('active_hub_info', JSON.stringify(hubData));
      } catch {}
      return hubData;
    } catch {
      setNearestHub(null);
      return null;
    }
  }, [fulfillmentHubFilter]);

  // Synchronize nearest hub on mount, address changes, and settings updates
  useEffect(() => {
    fetchNearestHub(null, fulfillmentHubFilter);

    const onAddrChange = async (e) => {
      const newAddr = e.detail || null;
      const hubData = await fetchNearestHub(newAddr, fulfillmentHubFilter);
      if (hubData?.eligible) {
        const locLabel = newAddr?.area || newAddr?.city || hubData?.hubCity || "your location";
        toast.success(`⚡ Express Delivery active for ${locLabel}!`);
      } else if (newAddr) {
        const locLabel = newAddr.city || newAddr.area || "your location";
        toast.info(`Standard Delivery active for ${locLabel}`);
      }
      loadProducts(1, false);
    };

    const onSettingsChange = (e) => {
      const currentSettings = e?.detail || getLocationSettings();
      if (currentSettings.preferredHub) {
        setFulfillmentHubFilter(currentSettings.preferredHub);
      }
      if (currentSettings.defaultDeliveryFilter) {
        setDeliverySpeedFilter(currentSettings.defaultDeliveryFilter);
      }
      fetchNearestHub(null, currentSettings.preferredHub);
      loadProducts(1, false);
    };

    window.addEventListener("delivery-address-changed", onAddrChange);
    window.addEventListener("address-settings-changed", onSettingsChange);
    return () => {
      window.removeEventListener("delivery-address-changed", onAddrChange);
      window.removeEventListener("address-settings-changed", onSettingsChange);
    };
  }, [fetchNearestHub, fulfillmentHubFilter, loadProducts]);

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
    setDraftDeliverySpeed(deliverySpeedFilter);
    setDraftFulfillmentHub(fulfillmentHubFilter);
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
    setDeliverySpeedFilter(draftDeliverySpeed);
    setFulfillmentHubFilter(draftFulfillmentHub);
    setIsFilterModalOpen(false);
  };

  const handleResetDraftFilters = () => {
    setDraftCategory("All");
    setDraftMinPrice("");
    setDraftMaxPrice("");
    setDraftAvailability("all");
    setDraftMinRating(0);
    setDraftVendors([]);
    setDraftDeliverySpeed("all");
    setDraftFulfillmentHub("auto");
  };

  const handleShortcutClick = (shortcutId) => {
    setActiveShortcut(shortcutId);

    if (shortcutId === "express_delivery" || shortcutId === "nearest_hub") {
      setDeliverySpeedFilter("express");
      scrollToCatalog();
      if (nearestHub?.eligible) {
        const storeName = nearestHub.nearestHub?.name || nearestHub.hubName || "Regional Hub";
        toast.info(`⚡ Express Delivery Active: Delivering from ${storeName} • ${nearestHub.deliveryWindow}`);
      } else {
        toast.info("⚡ Showing express deliverable products from nearby fulfillment hubs!");
      }
      return;
    }

    if (shortcutId === "deals") {
      setSortBy("discount_desc");
      const dealsEl = document.getElementById("customer-hot-deals") || document.getElementById("customer-featured-deals");
      if (dealsEl) {
        dealsEl.scrollIntoView({ behavior: "smooth" });
      } else {
        scrollToCatalog();
      }
      return;
    }

    if (shortcutId === "all") {
      handleResetAllFilters();
      scrollToCatalog();
      return;
    }

    if (shortcutId === "new_arrivals") {
      setSortBy("newest");
      const newEl = document.getElementById("customer-new-arrivals");
      if (newEl) {
        newEl.scrollIntoView({ behavior: "smooth" });
      } else {
        scrollToCatalog();
      }
      return;
    }

    if (shortcutId === "best_sellers") {
      setSortBy("best_sellers");
      scrollToCatalog();
      return;
    }

    if (shortcutId === "top_rated") {
      setMinRating(4);
      setSortBy("rating_desc");
      scrollToCatalog();
      return;
    }

    if (shortcutId === "under_500") {
      setMinPrice("");
      setAppliedMinPrice("");
      setMaxPrice("500");
      setAppliedMaxPrice("500");
      scrollToCatalog();
      return;
    }

    if (shortcutId === "under_1000") {
      setMinPrice("");
      setAppliedMinPrice("");
      setMaxPrice("1000");
      setAppliedMaxPrice("1000");
      scrollToCatalog();
      return;
    }

    if (shortcutId === "trending") {
      setSortBy("trending");
      const trendEl = document.getElementById("customer-trending");
      if (trendEl) {
        trendEl.scrollIntoView({ behavior: "smooth" });
      } else {
        scrollToCatalog();
      }
      return;
    }
  };

  const handleResetAllFilters = () => {
    setActiveShortcut("all");
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
    setDeliverySpeedFilter("all");
    setFulfillmentHubFilter(getLocationSettings().preferredHub || "auto");
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

    // Ensure active navbar delivery address is selected for checkout
    const activeNav = localStorage.getItem("selected_delivery_address");
    if (activeNav) {
      sessionStorage.setItem("checkoutAddress", activeNav);
    }

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
  const isDeliverySpeedActive = deliverySpeedFilter === "express";
  const isHubActive = Boolean(fulfillmentHubFilter && fulfillmentHubFilter !== "auto" && fulfillmentHubFilter !== "all");

  const activeFiltersCount =
    (isPriceActive ? 1 : 0) +
    (isAvailabilityActive ? 1 : 0) +
    (isRatingActive ? 1 : 0) +
    (isDeliverySpeedActive ? 1 : 0) +
    (isHubActive ? 1 : 0) +
    selectedVendors.length;

  const hasActiveFilters =
    isSearchActive ||
    isCategoryActive ||
    isPriceActive ||
    isAvailabilityActive ||
    isRatingActive ||
    isVendorActive ||
    isDeliverySpeedActive ||
    isHubActive ||
    isSortActive;

  const isNarrowingSearchOrFilter =
    isSearchActive ||
    isCategoryActive ||
    isPriceActive ||
    isAvailabilityActive ||
    isRatingActive ||
    isDeliverySpeedActive ||
    isHubActive ||
    isVendorActive;

  const locSettings = getLocationSettings();
  const displayedProducts = products.filter((product) => {
    if (deliverySpeedFilter === "express") {
      const isEligible =
        nearestHub &&
        nearestHub.eligible === true &&
        isProductExpressEligible(product, locSettings.expressCategoriesOnly !== false);
      if (!isEligible) return false;
    }
    return true;
  });

  return (
    <div className="adv-product-page">
      {/* ========================================================= */}
      {/* 1. HERO & ADVANCED SEARCH BAR                             */}
      {/* ========================================================= */}
      <section className="adv-search-hero-section">
        {/* Background Slideshow Layer (Changes every 4s) */}
        <div className="adv-hero-slideshow-wrap">
          {activeSlides.map((slide, index) => (
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
          <h1 className="adv-hero-title">
            {activeSlides[activeSlide]?.title || "Discover Quality Products"}
          </h1>
          <p className="adv-hero-subtitle">
            {activeSlides[activeSlide]?.subtitle || "Shop from verified vendors, top categories and best ratings"}
          </p>

          {/* Hero Quick Action Buttons */}
          <div className="adv-hero-actions-row">
            <button
              type="button"
              className="adv-hero-action-btn deals"
              onClick={() => scrollToSection("customer-hot-deals")}
            >
              <Percent size={15} />
              <span>🔥 Explore Hot Deals</span>
            </button>

            <button
              type="button"
              className="adv-hero-action-btn primary"
              onClick={() => scrollToSection("customer-trending")}
            >
              <Flame size={15} />
              <span>⚡ Trending Now</span>
            </button>

            <button
              type="button"
              className="adv-hero-action-btn"
              onClick={() => scrollToSection("discovery-categories-section")}
            >
              <Layers size={15} />
              <span>🏷️ Shop by Category</span>
            </button>

            <button
              type="button"
              className="adv-hero-action-btn"
              onClick={() => scrollToCatalog()}
            >
              <Package size={15} />
              <span>📦 Browse All Catalog</span>
            </button>
          </div>
        </div>{/* end adv-hero-content-layer */}

        {/* Slide Indicator Dots at Bottom Right */}
        <div className="adv-hero-dots" aria-label="Slideshow Indicators">
          {activeSlides.map((slide, idx) => (
            <button
              key={slide.id || idx}
              type="button"
              className={`adv-hero-dot ${idx === activeSlide ? "active" : ""}`}
              onClick={() => setActiveSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              title={slide.alt || slide.title}
            />
          ))}
        </div>
      </section>

      {/* Main Catalog / Content Loader (Visible while initial products or discovery loads) */}
      {loading && products.length === 0 && (
        <div style={{ margin: "28px 0" }}>
          <Loader type={viewMode === "grid" ? "grid" : "list"} count={8} />
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. SHOP BY CATEGORY                                       */}
      {/* ========================================================= */}
      {(meta.categories || []).length > 0 && (
        <section
          className="discovery-categories-section"
          id="discovery-categories-section"
          style={{ scrollMarginTop: "80px" }}
          aria-label="Shop by Category"
        >
          <div className="discovery-section-header">
            <span className="discovery-section-badge">
              <Layers size={13} /> CATEGORIES
            </span>
            <h2 className="discovery-section-title">Shop by Category</h2>
            <p className="discovery-section-subtitle">
              Explore our top curated collections and departments
            </p>
          </div>

          <div className="discovery-categories-grid">
            {(meta.categories || []).map((cat) => {
              const IconComp = getCategoryIcon(cat.name);
              const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();
              return (
                <div
                  key={cat.name}
                  id={`cat-card-${encodeURIComponent(cat.name.toLowerCase())}`}
                  className={`category-card-compact ${isSelected ? "active" : ""}`}
                  onClick={() => {
                    setSelectedCategory(isSelected ? "All" : cat.name);
                    setActiveShortcut("all");
                    scrollToCatalog();
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setSelectedCategory(isSelected ? "All" : cat.name);
                      setActiveShortcut("all");
                      scrollToCatalog();
                    }
                  }}
                  title={`Shop ${cat.name} (${cat.count} items)`}
                >
                  <div className="cat-card-icon-wrap">
                    <IconComp size={22} />
                  </div>
                  <span className="cat-card-name">{cat.name}</span>
                  <span className="cat-card-count">{cat.count} items</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* 3. QUICK DISCOVERY SHORTCUTS                              */}
      {/* ========================================================= */}
      <section className="quick-discovery-shortcuts" aria-label="Quick Shopping Shortcuts">
        <span className="shortcuts-bar-label">QUICK DISCOVERY</span>
        <div className="shortcuts-pills-row">
          {QUICK_SHORTCUTS.map((sc) => {
            const IconComp = sc.icon;
            const isActive = activeShortcut === sc.id;
            return (
              <button
                key={sc.id}
                type="button"
                className={`shortcut-pill ${isActive ? "active" : ""}`}
                onClick={() => handleShortcutClick(sc.id)}
              >
                <span className="shortcut-pill-icon">
                  <IconComp size={14} />
                </span>
                <span>{sc.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ========================================================= */}
      {/* DISCOVERY SECTIONS (Visible on discovery homepage)        */}
      {/* ========================================================= */}
      {!isNarrowingSearchOrFilter && (
        <>
          {/* 4. ACTIVE PROMOTIONS & MARKETING CAMPAIGNS */}
          {promotions.length > 0 && (
            <section id="customer-featured-deals" className="customer-promotions-section" aria-label="Active Promotions">
              <div className="promotions-section-header">
                <div className="promotions-header-left">
                  <span className="promotions-header-badge">
                    <Sparkles size={13} /> ACTIVE CAMPAIGNS
                  </span>
                  <h2 className="promotions-title">Featured Deals &amp; Promotional Offers</h2>
                  <p className="promotions-subtitle">
                    Exclusive storewide campaigns and limited-time category discounts from verified vendors.
                  </p>
                </div>
                <div className="promotions-count-badge">
                  <strong>{promotions.length}</strong> Live Events
                </div>
              </div>

              <div className="promotions-cards-grid">
                {promotions.map((promo) => {
                  const targetCat = promo.targetCategory || "All";
                  const promoImage = promo.bannerImage || PROMO_FALLBACK_IMAGES[targetCat] || PROMO_FALLBACK_IMAGES.default;
                  const isCatSelected = selectedCategory.toLowerCase() === targetCat.toLowerCase();

                  return (
                    <div
                      key={promo._id}
                      className={`promo-card ${isCatSelected ? "active-promo-card" : ""}`}
                      style={{ backgroundImage: `url(${promoImage})` }}
                      onClick={() => {
                        setSelectedCategory(targetCat);
                        scrollToCatalog();
                        toast.info(`Viewing ${promo.title} (${targetCat})`);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setSelectedCategory(targetCat);
                          scrollToCatalog();
                        }
                      }}
                    >
                      <div className="promo-card-top">
                        <span className="promo-badge-pill">
                          {promo.badgeText || "SPECIAL OFFER"}
                        </span>
                        {promo.discountPercent > 0 && (
                          <span className="promo-discount-pill">
                            Up to {promo.discountPercent}% OFF
                          </span>
                        )}
                      </div>

                      <div className="promo-card-content">
                        <h3 className="promo-card-title">{promo.title}</h3>
                        {promo.tagline && <p className="promo-card-tagline">{promo.tagline}</p>}
                      </div>

                      <div className="promo-card-footer">
                        <span className="promo-target-cat">
                          Category: <strong>{targetCat}</strong>
                        </span>
                        <button type="button" className="promo-action-link">
                          Shop Deals &rarr;
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 4.5. HOT DEALS & MEGA SAVINGS CAROUSEL */}
          {hotDealsProducts.length > 0 && (
            <div id="customer-hot-deals">
              <ProductCarousel
                title="Hot Deals & Mega Savings"
                subtitle="Biggest discount percentages up to 50% OFF from verified vendors"
                badge="HOT DEALS"
                icon={Percent}
                products={hotDealsProducts}
                loading={discoveryLoading}
                onViewAll={() => {
                  setSortBy("discount_desc");
                  setActiveShortcut("deals");
                  scrollToCatalog();
                }}
                viewAllLabel="View All Deals"
                wishlistMap={wishlistMap}
                onWishlist={handleWishlist}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                onProductClick={handleProductCardClick}
                hubDistanceInfo={nearestHub}
              />
            </div>
          )}

          {/* 5. TRENDING NOW CAROUSEL */}
          <div id="customer-trending">
            <ProductCarousel
              title="Trending Now"
              subtitle="Top ordered products with highest customer ratings this week"
              badge="TRENDING"
              icon={Flame}
              products={trendingProducts}
              loading={discoveryLoading}
              onViewAll={() => {
                setSortBy("trending");
                setActiveShortcut("trending");
                scrollToCatalog();
              }}
              viewAllLabel="View All Trending"
              wishlistMap={wishlistMap}
              onWishlist={handleWishlist}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
              onProductClick={handleProductCardClick}
              hubDistanceInfo={nearestHub}
            />
          </div>

          {/* 6. RECOMMENDED FOR YOU CAROUSEL */}
          <div id="customer-recommended">
            <ProductCarousel
              title="Recommended for You"
              subtitle={recSubtitle}
              badge="CURATED FOR YOU"
              icon={Star}
              products={recommendedProducts}
              loading={discoveryLoading}
              onViewAll={() => {
                navigate("/customer/recommended");
              }}
              viewAllLabel="View All Recommended"
              wishlistMap={wishlistMap}
              onWishlist={handleWishlist}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
              onProductClick={handleProductCardClick}
              hubDistanceInfo={nearestHub}
            />
          </div>

          {/* 7. NEW ARRIVALS CAROUSEL */}
          <div id="customer-new-arrivals">
            <ProductCarousel
              title="New Arrivals"
              subtitle="Latest products added to our multi-vendor inventory"
              badge="FRESH IN"
              icon={Zap}
              products={newArrivalsProducts}
              loading={discoveryLoading}
              onViewAll={() => {
                setSortBy("newest");
                setActiveShortcut("new_arrivals");
                scrollToCatalog();
              }}
              viewAllLabel="View All New Arrivals"
              wishlistMap={wishlistMap}
              onWishlist={handleWishlist}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
              onProductClick={handleProductCardClick}
              hubDistanceInfo={nearestHub}
            />
          </div>

          {/* RECOMMENDED UNDER YOUR BUDGET */}
          {budgetProducts.length > 0 && (
            <div id="customer-budget-recommendations">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Percent size={18} style={{ color: "#2563eb" }} />
                  <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#0f172a" }}>
                    Recommended Under Your Budget
                  </h3>
                </div>
                {/* Interactive Budget Pills */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  {[
                    { label: "Under ₹999", val: 999 },
                    { label: "Under ₹2,499", val: 2499 },
                    { label: "Under ₹9,999", val: 9999 },
                    { label: "Under ₹29,999", val: 29999 },
                  ].map((pill) => (
                    <button
                      key={pill.val}
                      type="button"
                      onClick={() => setBudgetTier(pill.val)}
                      style={{
                        background: budgetTier === pill.val ? "#2563eb" : "#ffffff",
                        color: budgetTier === pill.val ? "#ffffff" : "#475569",
                        border: `1px solid ${budgetTier === pill.val ? "#2563eb" : "#cbd5e1"}`,
                        borderRadius: "20px",
                        padding: "5px 14px",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.15s"
                      }}
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>
              </div>

              <ProductCarousel
                title=""
                subtitle={`Top-rated deals and high-performance items under ₹${budgetTier.toLocaleString('en-IN')}`}
                badge="VALUE DEALS"
                icon={Tag}
                products={budgetProducts}
                loading={discoveryLoading}
                onViewAll={() => {
                  setMaxPrice(String(budgetTier));
                  setAppliedMaxPrice(String(budgetTier));
                  scrollToCatalog();
                }}
                viewAllLabel={`View All Under ₹${budgetTier.toLocaleString('en-IN')}`}
                wishlistMap={wishlistMap}
                onWishlist={handleWishlist}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                onProductClick={handleProductCardClick}
                hubDistanceInfo={nearestHub}
              />
            </div>
          )}

          {/* BASED ON YOUR PREVIOUS PURCHASES */}
          {pastPurchaseProducts.length > 0 && (
            <div id="customer-past-purchases">
              <ProductCarousel
                title="Based on Your Previous Purchases"
                subtitle="Complementary additions and replenishment based on your order history"
                badge="SMART MATCH"
                icon={Sparkles}
                products={pastPurchaseProducts}
                loading={discoveryLoading}
                onViewAll={() => {
                  setSortBy("rating_desc");
                  scrollToCatalog();
                }}
                viewAllLabel="View All Suggestions"
                wishlistMap={wishlistMap}
                onWishlist={handleWishlist}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                onProductClick={handleProductCardClick}
                hubDistanceInfo={nearestHub}
              />
            </div>
          )}

          {/* 8. CATEGORY COLLECTIONS */}
          {(techProducts.length > 0 || fashionProducts.length > 0 || homeProducts.length > 0) && (
            <section className="category-collections-section" aria-label="Category Collections">
              {/* Collection 1: Electronics */}
              {techProducts.length > 0 && (
                <div className="collection-block">
                  <div className="collection-banner-card tech">
                    <div>
                      <span className="collection-banner-badge">TECH &amp; GADGETS</span>
                      <h3 className="collection-banner-title">Next-Gen Electronics &amp; Accessories</h3>
                      <p className="collection-banner-desc">
                        Discover high-performance smartphones, premium audio, and modern smart devices.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="collection-banner-btn"
                      onClick={() => {
                        setSelectedCategory("Electronics");
                        scrollToCatalog();
                      }}
                    >
                      <span>Explore Electronics</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>

                  <div className="collection-products-preview">
                    {techProducts.slice(0, 3).map((prod) => (
                      <ProductCard
                        key={prod._id}
                        product={prod}
                        isWishlisted={Boolean(wishlistMap[String(prod._id)])}
                        onWishlist={handleWishlist}
                        onAddToCart={handleAddToCart}
                        onBuyNow={handleBuyNow}
                        onClick={handleProductCardClick}
                        viewMode="grid"
                        hubDistanceInfo={nearestHub}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Collection 2: Fashion */}
              {fashionProducts.length > 0 && (
                <div className="collection-block">
                  <div className="collection-banner-card fashion">
                    <div>
                      <span className="collection-banner-badge">LIFESTYLE &amp; APPAREL</span>
                      <h3 className="collection-banner-title">Trendy Fashion &amp; Wardrobe Essentials</h3>
                      <p className="collection-banner-desc">
                        Curated clothing, designer wear, and daily apparel from verified vendors.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="collection-banner-btn"
                      onClick={() => {
                        setSelectedCategory("Fashion");
                        scrollToCatalog();
                      }}
                    >
                      <span>Explore Fashion</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>

                  <div className="collection-products-preview">
                    {fashionProducts.slice(0, 3).map((prod) => (
                      <ProductCard
                        key={prod._id}
                        product={prod}
                        isWishlisted={Boolean(wishlistMap[String(prod._id)])}
                        onWishlist={handleWishlist}
                        onAddToCart={handleAddToCart}
                        onBuyNow={handleBuyNow}
                        onClick={handleProductCardClick}
                        viewMode="grid"
                        hubDistanceInfo={nearestHub}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Collection 3: Home & Kitchen */}
              {homeProducts.length > 0 && (
                <div className="collection-block">
                  <div className="collection-banner-card home">
                    <div>
                      <span className="collection-banner-badge">HOME &amp; LIVING</span>
                      <h3 className="collection-banner-title">Smart Home &amp; Kitchen Appliances</h3>
                      <p className="collection-banner-desc">
                        Upgrade your daily routine with modern kitchenware, home decor, and appliances.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="collection-banner-btn"
                      onClick={() => {
                        setSelectedCategory("Home & Kitchen Appliances");
                        scrollToCatalog();
                      }}
                    >
                      <span>Explore Home</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>

                  <div className="collection-products-preview">
                    {homeProducts.slice(0, 3).map((prod) => (
                      <ProductCard
                        key={prod._id}
                        product={prod}
                        isWishlisted={Boolean(wishlistMap[String(prod._id)])}
                        onWishlist={handleWishlist}
                        onAddToCart={handleAddToCart}
                        onBuyNow={handleBuyNow}
                        onClick={handleProductCardClick}
                        viewMode="grid"
                        hubDistanceInfo={nearestHub}
                      />
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* 9. CATALOG DIVIDER HEADER */}
          <div className="catalog-divider-header">
            <span className="catalog-divider-badge">
              <Layers size={13} /> FULL CATALOG
            </span>
            <h2 className="catalog-divider-title">Explore All Products</h2>
            <p className="catalog-divider-subtitle">
              Browse our complete catalog with advanced filters, real-time sorting, and instant search
            </p>
          </div>
        </>
      )}

      {/* Notifications */}
      <ErrorMessage message={error} onRetry={() => loadProducts(1, false)} />

      {/* ========================================================= */}
      {/* 2. CATALOG TOOLBAR & PRODUCTS (Full Width Layout)         */}
      {/* ========================================================= */}
      <div id="catalog-start" className="adv-catalog-layout" style={{ scrollMarginTop: "80px" }}>
        <main className="adv-catalog-main-content">
          {/* Top Sort Bar - Enforced Single Row */}
          <div className="adv-sort-tabs-container single-row-toolbar" style={{ flexWrap: "nowrap", overflowX: "auto" }}>
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
                <strong>{totalProducts}</strong> {totalProducts === 1 ? "Product" : "Products"}
                {submittedSearch && <span> for &quot;{submittedSearch}&quot;</span>}
              </span>
            </div>

            {/* Popular Sort Tabs - In Single Row */}
            <div className="adv-sort-center-wrap">
              <span className="adv-sort-label">Sort:</span>
              <div className="adv-sort-tabs-list" role="tablist" aria-label="Sort options">
                <button
                  type="button"
                  className={`adv-sort-tab-btn ${sortBy === "newest" ? "active" : ""}`}
                  onClick={() => setSortBy("newest")}
                >
                  Newest
                </button>
                <button
                  type="button"
                  className={`adv-sort-tab-btn ${sortBy === "trending" ? "active" : ""}`}
                  onClick={() => setSortBy("trending")}
                >
                  <Flame size={12} fill="currentColor" /> Trending
                </button>
                <button
                  type="button"
                  className={`adv-sort-tab-btn ${sortBy === "discount_desc" ? "active" : ""}`}
                  onClick={() => setSortBy("discount_desc")}
                >
                  <Percent size={12} /> Hot Deals
                </button>
                <button
                  type="button"
                  className={`adv-sort-tab-btn ${sortBy === "best_sellers" ? "active" : ""}`}
                  onClick={() => setSortBy("best_sellers")}
                >
                  <Trophy size={12} /> Best Sellers
                </button>
                <button
                  type="button"
                  className={`adv-sort-tab-btn ${sortBy === "rating_desc" ? "active" : ""}`}
                  onClick={() => setSortBy("rating_desc")}
                >
                  <Star size={12} fill="currentColor" /> Top Rated
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
              </div>
            </div>

            {/* Right Side Controls - Fastest Delivery + Custom Non-Native Hub Dropdown + View Toggle */}
            <div className="adv-sort-right-actions">
              <button
                type="button"
                className={`adv-sort-tab-btn adv-toolbar-fastest-btn ${deliverySpeedFilter === "express" ? "active" : ""}`}
                onClick={() => {
                  const next = deliverySpeedFilter === "express" ? "all" : "express";
                  setDeliverySpeedFilter(next);
                  if (next === "express") {
                    if (nearestHub?.eligible) {
                      toast.info(`⚡ Filtered to Fastest Delivery near ${nearestHub.hubCity || "your location"}`);
                    } else {
                      toast.info("⚡ Fastest Delivery filter applied");
                    }
                  }
                }}
                title="Filter catalog to fastest / express delivery items"
              >
                <Zap size={13} fill={deliverySpeedFilter === "express" ? "#f59e0b" : "none"} color={deliverySpeedFilter === "express" ? "#f59e0b" : "currentColor"} />
                <span>Fastest Delivery</span>
              </button>

              {/* Custom Non-Native Hub Dropdown */}
              <HubLocationDropdown
                value={fulfillmentHubFilter || "auto"}
                hubs={REGIONAL_FULFILLMENT_HUBS}
                onChange={(nextHub) => {
                  setFulfillmentHubFilter(nextHub);
                  fetchNearestHub(null, nextHub);
                }}
              />

              {/* View Mode Toggle: Grid vs List */}
              <div className="adv-view-toggle-group" role="group" aria-label="View Mode">
                <button
                  type="button"
                  className={`adv-view-btn ${viewMode === "grid" ? "active" : ""}`}
                  onClick={() => setViewMode("grid")}
                  title="Grid View"
                  aria-label="Grid View"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  type="button"
                  className={`adv-view-btn ${viewMode === "list" ? "active" : ""}`}
                  onClick={() => setViewMode("list")}
                  title="List View"
                  aria-label="List View"
                >
                  <List size={16} />
                </button>
              </div>
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

              {deliverySpeedFilter === "express" && (
                <span className="adv-chip">
                  <Zap size={11} fill="#f59e0b" color="#f59e0b" />
                  Speed: Fastest (Express)
                  <button type="button" onClick={() => setDeliverySpeedFilter("all")} aria-label="Remove speed filter">
                    <X size={12} />
                  </button>
                </span>
              )}

              {fulfillmentHubFilter && fulfillmentHubFilter !== "auto" && fulfillmentHubFilter !== "all" && (
                <span className="adv-chip">
                  <Store size={11} />
                  Hub: {REGIONAL_FULFILLMENT_HUBS.find((h) => h.code === fulfillmentHubFilter)?.city || fulfillmentHubFilter}
                  <button type="button" onClick={() => setFulfillmentHubFilter("auto")} aria-label="Remove hub filter">
                    <X size={12} />
                  </button>
                </span>
              )}

              {sortBy !== "newest" && (
                <span className="adv-chip">
                  Sorted: {SORT_OPTIONS.find((o) => o.id === sortBy)?.label || sortBy}
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
            <Loader type={viewMode === "grid" ? "grid" : "list"} count={8} />
          ) : displayedProducts.length === 0 ? (
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
                {deliverySpeedFilter === "express" && nearestHub && !nearestHub.eligible && (
                  <li style={{ color: "#d97706", fontWeight: 600 }}>
                    ⚡ Express Delivery is currently outside the regional delivery coverage zone for {nearestHub.hubCity || "your location"}. Switch to &quot;All Speeds&quot; to view products with 2-day standard delivery.
                  </li>
                )}
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
                  {displayedProducts.map((product) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      isWishlisted={Boolean(wishlistMap[String(product._id)])}
                      onWishlist={handleWishlist}
                      onAddToCart={handleAddToCart}
                      onBuyNow={handleBuyNow}
                      onClick={handleProductCardClick}
                      viewMode="grid"
                      hubDistanceInfo={nearestHub}
                    />
                  ))}
                </div>
              ) : (
                <div className="adv-product-list-view">
                  {displayedProducts.map((product) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      isWishlisted={Boolean(wishlistMap[String(product._id)])}
                      onWishlist={handleWishlist}
                      onAddToCart={handleAddToCart}
                      onBuyNow={handleBuyNow}
                      onClick={handleProductCardClick}
                      viewMode="list"
                      hubDistanceInfo={nearestHub}
                    />
                  ))}
                </div>
              )}

              {/* Infinite Scroll Loading Skeleton Row */}
              {loadingMore && (
                <div className="pagination-skeleton-row" style={{ width: "100%", marginTop: "16px", marginBottom: "16px" }}>
                  <Loader type={viewMode === "grid" ? "grid" : "list"} count={viewMode === "grid" ? 4 : 2} />
                </div>
              )}

              {/* Infinite Scroll Sentinel */}
              <div className="product-infinite-sentinel" ref={sentinelRef} aria-live="polite">
                {!loadingMore && (hasMore ? "Scroll to load more" : "You've reached the end of the catalog.")}
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

                  {/* Delivery Speed & Location Hub Filter Card */}
                  <div className="adv-modal-filter-card">
                    <div className="adv-card-header">
                      <span className="adv-card-title">
                        <Truck size={15} style={{ verticalAlign: "middle", marginRight: "6px" }} />
                        Delivery Speed &amp; Fulfillment Hub
                      </span>
                      {(draftDeliverySpeed !== "all" || (draftFulfillmentHub && draftFulfillmentHub !== "auto")) && (
                        <button
                          type="button"
                          className="adv-card-clear"
                          onClick={() => {
                            setDraftDeliverySpeed("all");
                            setDraftFulfillmentHub("auto");
                          }}
                        >
                          Reset
                        </button>
                      )}
                    </div>

                    {/* Delivery Speed Selector */}
                    <div className="adv-price-presets-title" style={{ marginBottom: "8px" }}>
                      Delivery Speed:
                    </div>
                    <div className="adv-avail-cards-group" style={{ marginBottom: "14px" }}>
                      <button
                        type="button"
                        className={`adv-avail-choice-card ${draftDeliverySpeed === "all" ? "selected" : ""}`}
                        onClick={() => setDraftDeliverySpeed("all")}
                      >
                        <div className="adv-avail-radio-indicator">
                          {draftDeliverySpeed === "all" && <div className="adv-avail-radio-dot" />}
                        </div>
                        <span className="adv-avail-label">All Speeds</span>
                        <span className="adv-avail-badge">Standard &amp; Express</span>
                      </button>

                      <button
                        type="button"
                        className={`adv-avail-choice-card ${draftDeliverySpeed === "express" ? "selected" : ""}`}
                        onClick={() => setDraftDeliverySpeed("express")}
                      >
                        <div className="adv-avail-radio-indicator">
                          {draftDeliverySpeed === "express" && <div className="adv-avail-radio-dot" />}
                        </div>
                        <span className="adv-avail-label" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <Zap size={13} fill="#f59e0b" color="#f59e0b" />
                          Fastest Delivery
                        </span>
                        <span className="adv-avail-badge in">Express Only</span>
                      </button>
                    </div>

                    {/* Fulfillment Location Dropdown */}
                    <div className="adv-price-presets-title" style={{ marginBottom: "8px" }}>
                      Fulfillment Hub / Deliver From:
                    </div>
                    <div className="adv-hub-dropdown-container">
                      <HubLocationDropdown
                        value={draftFulfillmentHub || "auto"}
                        hubs={REGIONAL_FULFILLMENT_HUBS}
                        fullWidth
                        onChange={(hubCode) => setDraftFulfillmentHub(hubCode)}
                      />
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
