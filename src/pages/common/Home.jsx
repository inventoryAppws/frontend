import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  ShoppingBag,
  Store,
  Shield,
  ArrowRight,
  CheckCircle2,
  Copy,
  Search,
  Truck,
  Zap,
  Gift,
  Layers,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  ExternalLink,
  Wallet,
  Mic,
  Camera,
  Heart,
  Sun,
  Moon,
  Bot,
  Globe,
  Users,
  BarChart3,
  MapPin,
  Check,
  RefreshCw,
  Box,
  Monitor,
  Smartphone,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  QrCode,
  Package,
  CreditCard,
  Bell,
  FileText,
  Tag,
  Star,
  Eye,
  Settings,
  Lock,
  Activity,
  AlertTriangle,
  Image,
  MessageSquare,
  Headphones,
  LayoutDashboard,
  Repeat,
  ShieldCheck,
  Megaphone,
  Warehouse
} from "lucide-react";
import InteractiveEarth from "../../components/InteractiveEarth";
import "./Home.css";

// Clean 3D Isometric Minimalist Banner Slides showcasing our 3 Apps & Signature Platform Features
const BANNER_SLIDES = [
  {
    id: "slide-shared-cart",
    tag: "CUSTOMER APP • COLLABORATIVE SHOPPING",
    isDark: false,
    pillColor: "rgba(56, 189, 248, 0.2)",
    pillBorder: "rgba(56, 189, 248, 0.45)",
    pillText: "#0284c7",
    title: "Shared Collaborative Shopping Cart",
    desc: "Shop together in real time. Invite friends or family to a synchronized cart session with live cursor presence, instant updates, and automated split-bill checkout.",
    image: "/banners/banner_ai_ecosystem_hd.jpg",
    bullets: ["Real-time multi-user cart sync", "Split-bill automated wallet payments", "Private invite links & guest checkout"]
  },
  {
    id: "slide-avatar",
    tag: "CUSTOMER APP • 3D TRY-ON ENGINE",
    isDark: false,
    pillColor: "rgba(236, 72, 153, 0.2)",
    pillBorder: "rgba(236, 72, 153, 0.45)",
    pillText: "#db2777",
    title: "3D Virtual Avatar Try-On & Fit Preview",
    desc: "Eliminate sizing guesswork with precision 3D body measurements. Preview fabric drape, stretch tension, and silhouette fit before placing your order.",
    image: "/banners/banner_fashion_hd.jpg",
    bullets: ["3D avatar sizing & drape preview", "98.4% fit accuracy algorithm", "Zero wrong-fit return guarantee"]
  },
  {
    id: "slide-voice-vision",
    tag: "AI TRINITY • SHOPPING COPILOT",
    isDark: false,
    pillColor: "rgba(245, 158, 11, 0.2)",
    pillBorder: "rgba(245, 158, 11, 0.45)",
    pillText: "#d97706",
    title: "Darwin Natural Voice & 48MP Vision Search",
    desc: "Speak naturally or point your smartphone camera at any real-world product. Darwin indexes 6,000+ catalog SKUs in 0.4s to find exact matches and discounts.",
    image: "/banners/banner_tech_hd.jpg",
    bullets: ["48MP camera scan & 0.4s catalog match", "Hands-free conversational queries", "Auto-applies best promotional vouchers"]
  },
  {
    id: "slide-return-vault",
    tag: "CUSTOMER APP • RETURN VAULT",
    isDark: false,
    pillColor: "rgba(6, 182, 212, 0.2)",
    pillBorder: "rgba(6, 182, 212, 0.45)",
    pillText: "#0891b2",
    title: "Doorstep Return Vault & Instant Wallet Refunds",
    desc: "Hassle-free 1-tap returns with scheduled doorstep pickup and QR verification. Approved refunds credit directly to your Digital Wallet in under 15ms.",
    image: "/banners/orders_hero_banner.jpg",
    bullets: ["Doorstep courier pickup scheduling", "Instant QR return authentication", "< 15ms automated wallet refund credit"]
  },
  {
    id: "slide-atlas-replenish",
    tag: "VENDOR PORTAL • SUPPLY CHAIN AI",
    isDark: false,
    pillColor: "rgba(16, 185, 129, 0.2)",
    pillBorder: "rgba(16, 185, 129, 0.45)",
    pillText: "#059669",
    title: "Atlas Autonomous Restock & Stockout Shield",
    desc: "Atlas forecasts merchant sales velocity and customer reorder rhythms. Automatically dispatches replenishment purchase orders before inventory reaches zero.",
    image: "/banners/banner_home_nordic_hd.jpg",
    bullets: ["Predictive stockout warning radar", "Automated multi-tier replenishment POs", "Merchant profit margin optimization"]
  },
  {
    id: "slide-geo-routing",
    tag: "LOGISTICS • PLANETARY DISPATCH MESH",
    isDark: false,
    pillColor: "rgba(2, 132, 199, 0.2)",
    pillBorder: "rgba(2, 132, 199, 0.45)",
    pillText: "#0284c7",
    title: "Multi-Warehouse Express Geo-Routing",
    desc: "Orders are algorithmically dispatched from the nearest regional fulfillment center, cutting delivery latency to sub-24h with live WebSocket milestones.",
    image: "/banners/banner_sports_hd.jpg",
    bullets: ["Automated regional hub allocation", "Real-time WebSocket telemetry", "24-hour express courier fulfillment"]
  },
  {
    id: "slide-titan-governance",
    tag: "ADMIN CONSOLE • PLATFORM GOVERNANCE",
    isDark: false,
    pillColor: "rgba(139, 92, 246, 0.2)",
    pillBorder: "rgba(139, 92, 246, 0.45)",
    pillText: "#7c3aed",
    title: "Titan Security Radar & Merchant KYC Verification",
    desc: "Enterprise governance monitors platform-wide GMV, automates merchant KYC onboarding checks, and reconciles financial ledgers with 99.98% anomaly detection.",
    image: "/banners/banner_luxury_hd.jpg",
    bullets: ["Automated merchant KYC & GSTIN checks", "Tamper-proof financial ledger auditing", "Live system GMV & transaction stream"]
  },
  {
    id: "slide-digital-wallet",
    tag: "FINTECH CORE • DIGITAL WALLET",
    isDark: false,
    pillColor: "rgba(244, 63, 94, 0.2)",
    pillBorder: "rgba(244, 63, 94, 0.45)",
    pillText: "#e11d48",
    title: "Zero-Latency Wallet & Flash Voucher Stacking",
    desc: "Experience frictionless checkout with sub-second digital wallet debits, direct UPI top-ups, instant promotional voucher stacking, and exportable statements.",
    image: "/banners/banner_beauty_hd.jpg",
    bullets: ["Sub-second checkout with zero drops", "Dynamic multi-coupon stacking engine", "Comprehensive transaction & refund ledger"]
  }
];

// Coupon Vouchers Data
const COUPONS_DATA = [
  {
    code: "WELCOME10",
    discount: "10% OFF",
    title: "First Order Welcome",
    desc: "Instant 10% discount on your first shopping cart across all categories.",
    minOrder: "₹299"
  },
  {
    code: "FASHION25",
    discount: "25% OFF",
    title: "Seasonal Apparel Drop",
    desc: "Flat 25% savings on all designer clothing, jackets, and accessories.",
    minOrder: "₹999"
  },
  {
    code: "TECHBOOST",
    discount: "₹500 OFF",
    title: "Electronics Upgrade",
    desc: "Instant ₹500 cashback applied directly to your Digital Wallet balance.",
    minOrder: "₹2,499"
  },
  {
    code: "FREESHIP",
    discount: "FREE EXPRESS",
    title: "Zero Shipping Fee",
    desc: "Complimentary express courier shipping from any regional warehouse hub.",
    minOrder: "₹499"
  }
];

// AI Trinity Data (Darwin, Atlas, Titan)
const AI_TRINITY = [
  {
    id: "darwin",
    name: "Darwin AI",
    mascotImg: "/darwin-mascot-circle.png",
    appTag: "Customer App",
    tagColor: "rgba(56, 189, 248, 0.15)",
    tagText: "#0284c7",
    btnBg: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
    role: "Personal Shopping Copilot",
    desc: "Darwin assists consumers through 6,000+ catalog items. Snap camera photos for visual matches, speak naturally, unlock instant coupons, and track delivery progress.",
    capabilities: [
      "AI Camera Vision Scanner & Visual Match",
      "Hands-Free Natural Voice Search",
      "Dynamic Flash Coupon Discovery",
      "Predictive Personalized Recommendations"
    ],
    ctaText: "Chat with Darwin in Store",
    ctaLink: "/customer/login"
  },
  {
    id: "atlas",
    name: "Atlas AI",
    mascotImg: "/atlas-mascot-circle.png",
    appTag: "Vendor Portal",
    tagColor: "rgba(16, 185, 129, 0.15)",
    tagText: "#059669",
    btnBg: "linear-gradient(135deg, #059669 0%, #047857 100%)",
    role: "Merchant Supply Chain Copilot",
    desc: "Atlas protects merchant profit margins and prevents out-of-stock crises. It forecasts demand trends, auto-triggers replenishment alerts, and optimizes logistics.",
    capabilities: [
      "Predictive Stock Depletion Forecasting",
      "Automated Low-Stock Threshold Alerts",
      "Multi-Warehouse Dispatch Routing",
      "Profit Margin & Settlement Analytics"
    ],
    ctaText: "Launch Atlas in Vendor Hub",
    ctaLink: "/vendor/login"
  },
  {
    id: "titan",
    name: "Titan AI",
    mascotImg: "/titan-mascot-circle.png",
    appTag: "Admin Portal",
    tagColor: "rgba(139, 92, 246, 0.15)",
    tagText: "#7c3aed",
    btnBg: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
    role: "Platform Governance & Security",
    desc: "Titan monitors system-wide gross merchandise value (GMV), conducts automated KYC risk verification for new vendors, audits background cron jobs, and detects anomalies.",
    capabilities: [
      "Platform-Wide GMV & Sales Intelligence",
      "Automated Vendor KYC & Risk Verification",
      "Tamper-Proof Audit & Security Checks",
      "Dynamic Marketing Campaign Builder"
    ],
    ctaText: "Open Titan Admin Console",
    ctaLink: "https://inventoryadmin24.vercel.app",
    isExternal: true
  }
];

// Platform Highlights Filmstrip Data
const HIGHLIGHTS_DATA = [
  {
    id: "h1",
    tag: "VISUAL SEARCH & DISCOVERY",
    headline: "Darwin Visual Match. Snap, identify, and order in seconds.",
    sub: "Darwin AI analyzes product textures, tags, and catalog SKUs in real time.",
    metric: "0.4s",
    metricLabel: "Catalog Match Speed",
    bgGradient: "linear-gradient(135deg, #091a2e 0%, #030814 100%)",
    accent: "#38bdf8"
  },
  {
    id: "h2",
    tag: "TITAN PLATFORM GOVERNANCE",
    headline: "Automated Ledger Auditing. Sub-second platform settlement.",
    sub: "Titan audits 10,000+ concurrent orders, detecting anomalies with 99.98% precision.",
    metric: "₹48.2M+",
    metricLabel: "Monthly Volume Handled",
    bgGradient: "linear-gradient(135deg, #1b0e2f 0%, #06020c 100%)",
    accent: "#c084fc"
  },
  {
    id: "h3",
    tag: "ATLAS SUPPLY CHAIN",
    headline: "Autonomous Replenishment. Never lose a sale to stockouts.",
    sub: "Predicts customer reorder rhythms and dispatches warehouse restocks proactively.",
    metric: "4x",
    metricLabel: "Faster Restock Velocity",
    bgGradient: "linear-gradient(135deg, #06231a 0%, #010805 100%)",
    accent: "#34d399"
  },
  {
    id: "h4",
    tag: "ZERO-LATENCY WALLET",
    headline: "Instant Digital Wallet. Top up, check out, and receive refunds.",
    sub: "Direct UPI & card integration with 1-tap instant balance updates.",
    metric: "< 15ms",
    metricLabel: "Instant Settlement",
    bgGradient: "linear-gradient(135deg, #271406 0%, #090401 100%)",
    accent: "#fb923c"
  },
  {
    id: "h5",
    tag: "REAL-TIME CLOUD SYNC",
    headline: "Continuous Ecosystem Sync. Shop on mobile, fulfill on desktop.",
    sub: "Customer cart checkouts instantly notify regional vendor packing stations over WebSockets.",
    metric: "100%",
    metricLabel: "Live Multi-Device Sync",
    bgGradient: "linear-gradient(135deg, #1e0915 0%, #070105 100%)",
    accent: "#f472b6"
  }
];

const BENTO_WISHLIST_ITEMS = [
  {
    id: "sony-wh",
    name: "Sony WH-1000XM5 ANC Headphones",
    category: "audio",
    currentPrice: "₹24,990",
    originalPrice: "₹29,990",
    discount: "Save ₹5,000",
    isPriceDropped: true,
    inStock: true,
    badge: "Price Drop Alert"
  },
  {
    id: "apple-watch-9",
    name: "Apple Watch Series 9 GPS 45mm",
    category: "wearable",
    currentPrice: "₹38,499",
    originalPrice: "₹41,900",
    discount: "Save ₹3,401",
    isPriceDropped: true,
    inStock: true,
    badge: "Lowest in 30 Days"
  },
  {
    id: "macbook-air-m3",
    name: "MacBook Air 15\" M3 Chip 16GB",
    category: "laptop",
    currentPrice: "₹1,24,900",
    originalPrice: "₹1,34,900",
    discount: "Save ₹10,000",
    isPriceDropped: false,
    inStock: true,
    badge: "In Stock · Dispatches Today"
  }
];


// Complete Architectural Feature Directory (40 Live Modules with Codebase Descriptions)
const ECOSYSTEM_DIRECTORY = {
  customer: [
    { icon: Search, title: "Product Discovery & Search", desc: "Multi-facet catalog search with category filters, brand tagging, price range sliders & stock sorting." },
    { icon: Mic, title: "Voice & Visual Search", desc: "Snap photos with 48MP camera vision match or speak natural voice queries via Web Speech API." },
    { icon: Bot, title: "AI Shopping Assistant", desc: "Darwin AI copilot provides personalized SKU recommendations, deal discovery, and cart optimization." },
    { icon: Sliders, title: "Product Compare & Specs", desc: "Side-by-side spec comparison matrix with differentiator highlights across multiple models." },
    { icon: TrendingUp, title: "Price History Graph", desc: "30-day historical price fluctuation charts with automated price-drop radar notifications." },
    { icon: Heart, title: "Wishlist & Smart Cart", desc: "Saved items tracker with stock-status monitors and 1-click cart migration." },
    { icon: Users, title: "Family Shared Cart", desc: "Real-time collaborative shopping basket with multi-user presence avatars and shared checkout." },
    { icon: Repeat, title: "Monthly Repeat Delivery", desc: "Scheduled recurring replenishment orders for daily groceries and essential household items." },
    { icon: Camera, title: "3D Avatar Try-On", desc: "Personalized digital twin 3D avatar with sub-millimeter drape simulations for garment fitting." },
    { icon: Truck, title: "Live Order Tracking", desc: "WebSocket-streamed courier GPS coordinates with map markers, active ETA & milestone nodes." },
    { icon: RotateCcw, title: "Returns & Refunds", desc: "1-tap return scheduling with courier doorstep QR validation and sub-15ms automated wallet refund." },
    { icon: ShieldCheck, title: "Warranty Vault", desc: "Digital tamper-proof warranty card storage with automatic claim eligibility tracking." },
    { icon: Star, title: "Reviews & Product Q&A", desc: "Verified customer reviews with image attachments and community question-and-answer threads." },
    { icon: Wallet, title: "Wallet & Payments", desc: "Sub-second wallet debits, instant UPI / card recharge, and exportable financial ledger history." },
    { icon: Bell, title: "Smart Notifications", desc: "Real-time push alerts for order milestones, price reductions, flash sales, and cart drops." },
    { icon: MapPin, title: "Addresses & Delivery Hubs", desc: "Multi-address management with automated geo-lookup and nearest warehouse hub routing." }
  ],
  vendor: [
    { icon: LayoutDashboard, title: "Store Dashboard", desc: "Real-time sales telemetry, net GMV velocity, order dispatch counters, and daily revenue charts." },
    { icon: Package, title: "Product Management", desc: "Complete SKU lifecycle management with multi-tier pricing, product variations, and rich attributes." },
    { icon: Image, title: "Product Images & Media", desc: "Drag-and-drop image uploader with multi-angle previews and automated aspect-ratio optimization." },
    { icon: FileText, title: "Inventory & Stock", desc: "Multi-warehouse stock level sync, critical safety threshold triggers, and bulk inventory adjustments." },
    { icon: Box, title: "Order Fulfillment", desc: "Stepped order processing pipeline from pick-and-pack to shipping label generation and courier handover." },
    { icon: RotateCcw, title: "Returns & Claims", desc: "Merchant return moderation dashboard for item inspections, damage verification, and refunds." },
    { icon: CreditCard, title: "Payouts & Settlements", desc: "Automated payment reconciliation tracking merchant bank transfers, commissions, and payout schedules." },
    { icon: BarChart3, title: "Sales Analytics", desc: "Deep-dive analytics covering top-selling products, regional buyer cohorts, and seasonal demand margins." },
    { icon: AlertTriangle, title: "Low-Stock Alerts", desc: "Stockout Shield automated radar warning vendors before high-velocity inventory hits zero." },
    { icon: Bot, title: "AI Description Writer", desc: "Atlas AI generates SEO-optimized product titles, persuasive descriptions, and category tags in seconds." },
    { icon: Headphones, title: "Support Tickets", desc: "Multi-channel customer service queue for order inquiries, replacements, and resolution tracking." },
    { icon: Settings, title: "Store Settings & Policies", desc: "Merchant business profile, return policies, shipping zones, and brand customization options." }
  ],
  admin: [
    { icon: Activity, title: "Platform Dashboard", desc: "High-level platform cockpit monitoring unified GMV, active users, order volume, and system uptime." },
    { icon: Users, title: "User Management", desc: "Unified customer and vendor registry with KYC status, verification tools, and lifecycle actions." },
    { icon: Lock, title: "Roles & Permissions", desc: "Granular role-based access control (RBAC) managing administrative capabilities and privileges." },
    { icon: Tag, title: "Catalog & Categories", desc: "Universal taxonomy tree manager with category hierarchies, brand approvals, and taxonomy filters." },
    { icon: Megaphone, title: "Banners & Promotions", desc: "Marketing campaign manager for homepage promotional hero slides, flash banners, and scheduling." },
    { icon: Gift, title: "Coupons Management", desc: "Promotional voucher engine configuring discount codes, minimum order rules, and usage caps." },
    { icon: Warehouse, title: "Warehouses & Hubs", desc: "Multi-hub fulfillment logistics center mapping, storage capacity tracking, and geo-distribution." },
    { icon: FileText, title: "Orders & Invoices", desc: "Global transaction oversight with tax invoices, dispute arbitration, and multi-rail settlements." },
    { icon: Eye, title: "Review Moderation", desc: "Platform-wide review moderation protecting community trust with spam and profanity filters." },
    { icon: MessageSquare, title: "Q&A Moderation", desc: "Community question curation approving verified vendor answers and preventing misinformation." },
    { icon: BarChart3, title: "Platform Analytics", desc: "Macro-economic reporting covering platform growth, customer retention, and vendor performance." },
    { icon: ShieldCheck, title: "Audit & Governance", desc: "Tamper-proof immutable audit records and system health telemetry for regulatory compliance." }
  ]
};

export default function Home() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("inventory_home_theme") || "dark";
  });

  // 10 Flagship Features Bento State
  const [wishlistFilter, setWishlistFilter] = useState("all");
  const [tryonGarment, setTryonGarment] = useState("blazer");

  // Device showcase state: 'dual', 'mac', 'iphone'
  const [deviceView, setDeviceView] = useState("dual");
  // Mac screen tab: 'merchant' vs 'governance'
  const [macScreenTab, setMacScreenTab] = useState("merchant");
  // iPhone feature tabs: 'shared-cart' | 'avatar' | 'voice-vision' | 'return-vault'
  const [iphoneFeatureTab, setIphoneFeatureTab] = useState("shared-cart");
  // 3D Avatar selected garment
  const [avatarGarment, setAvatarGarment] = useState("blazer");
  // Interactive prompt simulator for Apple Intelligence
  const [activeAiPrompt, setActiveAiPrompt] = useState(0);

  // Highlights Filmstrip state
  const [activeHighlight, setActiveHighlight] = useState(0);
  const [isPlayingHighlights, setIsPlayingHighlights] = useState(true);


  // Banner carousel state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [copiedCoupon, setCopiedCoupon] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showMoreFeatures, setShowMoreFeatures] = useState(false);

  // 3D Parallax Mouse tilt for Dual Device Showcase
  const [deviceTilt, setDeviceTilt] = useState({ x: 0, y: 0 });
  const deviceStageRef = useRef(null);

  // Sync theme
  useEffect(() => {
    localStorage.setItem("inventory_home_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Sticky navbar listener
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close feature directory on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setShowMoreFeatures(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Parallax tilt on mouse move over device stage
  const handleDeviceMouseMove = (e) => {
    if (!deviceStageRef.current) return;
    const rect = deviceStageRef.current.getBoundingClientRect();
    const x = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const y = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    setDeviceTilt({ x: -y * 6, y: x * 8 });
  };

  const handleDeviceMouseLeave = () => {
    setDeviceTilt({ x: 0, y: 0 });
  };

  // Auto-advance highlights filmstrip
  useEffect(() => {
    if (!isPlayingHighlights) return;
    const interval = setInterval(() => {
      setActiveHighlight((prev) => (prev + 1) % HIGHLIGHTS_DATA.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isPlayingHighlights]);

  // Auto-advance banner carousel
  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % BANNER_SLIDES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isHovered]);

  const handleCopyCoupon = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => {
      setCopiedCoupon(null);
    }, 3000);
  };

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % BANNER_SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + BANNER_SLIDES.length) % BANNER_SLIDES.length);
  }, []);

  // AI Prompts
  const AI_PROMPTS = [
    {
      prompt: "Darwin, find lightweight running shoes with 10% coupon",
      response: "Found 12 running shoes in stock! Applied welcome code WELCOME10 for ₹320 savings. Estimated express delivery in 24 hours.",
      app: "Darwin AI • Customer Copilot"
    },
    {
      prompt: "Atlas, forecast weekend milk and dairy depletion",
      response: "Depletion velocity peaks at +34% by Saturday 2 PM. Automatically queued warehouse replenishment PO #W-882 to avert stockout.",
      app: "Atlas AI • Supply Chain Copilot"
    },
    {
      prompt: "Titan, audit high-risk vendor KYC submissions",
      response: "Audited 4 pending onboarding submissions. Verified GSTIN & bank accounts; flagged 1 duplicate pan address for manual security review.",
      app: "Titan AI • Platform Governance"
    }
  ];

  return (
    <div className="home-root apple-flagship-root" data-theme={theme}>
      {/* Toast Alert */}
      {copiedCoupon && (
        <div className="coupon-toast">
          ✓ Copied coupon code <strong>{copiedCoupon}</strong>!
        </div>
      )}

      {/* =========================================================
          1. APPLE LOCAL NAVIGATION (Sticky Frosted Sub-Nav)
      ========================================================== */}
      <div className="apple-local-nav-wrapper">
        <div className={`apple-local-nav ${isScrolled ? "scrolled" : ""}`}>
          <div className="apple-local-nav-brand">
            <Link to="/" className="apple-nav-title">
              <img src="/favicon.svg" alt="" className="apple-brand-globe-img" /> <span className="apple-title-main">Inventory</span>
            </Link>
          </div>

          <div className="apple-local-nav-links">
            <a href="#overview">Overview</a>
            <a href="#dual-showcase">Dual Experience</a>
            <a href="#three-experiences">Three Experiences</a>
            <a href="#highlights">Highlights</a>
            <a href="#ai-trinity">AI Trinity</a>
            <a href="#architecture">Architecture</a>
            <div className="more-features-dropdown-wrap">
              <button
                type="button"
                className={`apple-nav-features-pill ${showMoreFeatures ? "active" : ""}`}
                onClick={() => setShowMoreFeatures(!showMoreFeatures)}
                aria-label="Toggle Ecosystem Feature Directory"
              >
                <Layers size={13} className="pill-layers-icon" />
                <span>Feature Directory</span>
                <span className="nav-count-badge">40</span>
                <ChevronDown size={12} className={`pill-chevron ${showMoreFeatures ? "rotated" : ""}`} />
              </button>

              {showMoreFeatures && (
                <>
                  <div className="mega-menu-backdrop" onClick={() => setShowMoreFeatures(false)} />
                  <div className="more-features-mega-menu" role="dialog" aria-label="Ecosystem Feature Directory">
                    {/* Top Header Banner */}
                    <div className="mega-menu-topbar">
                      <div className="mega-menu-topbar-left">
                        <div className="mega-topbar-icon-box">
                          <Layers size={16} />
                        </div>
                        <div>
                          <div className="mega-topbar-title-row">
                            <h5 className="mega-topbar-title">Ecosystem Architecture &amp; Feature Directory</h5>
                            <span className="mega-view-only-badge">
                              <Eye size={11} /> Reference Directory · View Only
                            </span>
                          </div>
                          <p className="mega-topbar-desc">
                            Comprehensive architectural catalog of all 40 active full-stack capabilities across Customer, Vendor, and Admin portals.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="mega-menu-close-btn"
                        onClick={() => setShowMoreFeatures(false)}
                        aria-label="Close feature directory"
                      >
                        <X size={15} />
                      </button>
                    </div>

                    {/* Three Columns Container */}
                    <div className="mega-menu-columns-wrap">
                      {/* Customer App Column */}
                      <div className="mega-menu-column customer-col">
                        <div className="mega-col-header">
                          <div className="mega-col-title-wrap">
                            <span className="mega-col-icon-circle customer">
                              <ShoppingBag size={14} />
                            </span>
                            <h6>Customer App</h6>
                          </div>
                          <span className="mega-col-count-pill">16 Capabilities</span>
                        </div>
                        <div className="mega-col-list">
                          {ECOSYSTEM_DIRECTORY.customer.map((item, idx) => {
                            const ItemIcon = item.icon;
                            return (
                              <div key={idx} className="mega-feature-card customer-card-item">
                                <div className="mega-feat-icon-box customer">
                                  <ItemIcon size={14} />
                                </div>
                                <div className="mega-feat-text">
                                  <div className="mega-feat-title">{item.title}</div>
                                  <div className="mega-feat-desc">{item.desc}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Vendor App Column */}
                      <div className="mega-menu-column vendor-col">
                        <div className="mega-col-header">
                          <div className="mega-col-title-wrap">
                            <span className="mega-col-icon-circle vendor">
                              <Store size={14} />
                            </span>
                            <h6>Vendor App</h6>
                          </div>
                          <span className="mega-col-count-pill">12 Capabilities</span>
                        </div>
                        <div className="mega-col-list">
                          {ECOSYSTEM_DIRECTORY.vendor.map((item, idx) => {
                            const ItemIcon = item.icon;
                            return (
                              <div key={idx} className="mega-feature-card vendor-card-item">
                                <div className="mega-feat-icon-box vendor">
                                  <ItemIcon size={14} />
                                </div>
                                <div className="mega-feat-text">
                                  <div className="mega-feat-title">{item.title}</div>
                                  <div className="mega-feat-desc">{item.desc}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Admin App Column */}
                      <div className="mega-menu-column admin-col">
                        <div className="mega-col-header">
                          <div className="mega-col-title-wrap">
                            <span className="mega-col-icon-circle admin">
                              <Shield size={14} />
                            </span>
                            <h6>Admin App</h6>
                          </div>
                          <span className="mega-col-count-pill">12 Capabilities</span>
                        </div>
                        <div className="mega-col-list">
                          {ECOSYSTEM_DIRECTORY.admin.map((item, idx) => {
                            const ItemIcon = item.icon;
                            return (
                              <div key={idx} className="mega-feature-card admin-card-item">
                                <div className="mega-feat-icon-box admin">
                                  <ItemIcon size={14} />
                                </div>
                                <div className="mega-feat-text">
                                  <div className="mega-feat-title">{item.title}</div>
                                  <div className="mega-feat-desc">{item.desc}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Status Bar */}
                    <div className="mega-menu-bottombar">
                      <div className="mega-bottom-status">
                        <span className="mega-status-dot" />
                        <span>Live Unified Architecture: All 40 full-stack capabilities are active across the platform.</span>
                      </div>
                      <span className="mega-bottom-hint">Non-clickable reference catalog · Press Esc to dismiss</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="apple-local-nav-actions">
            <Link to="/customer/login" className="apple-btn-pill-primary">
              <ShoppingBag size={14} /> Shopper
            </Link>
            <Link to="/vendor/login" className="apple-btn-pill-secondary">
              <Store size={14} /> Vendor
            </Link>
            <a
              href="https://inventoryadmin24.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="apple-btn-pill-secondary"
            >
              <Shield size={14} /> Admin
            </a>

            {/* Separate Theme Pill Button */}
            <button
              type="button"
              className="home-theme-separate-pill apple-theme-btn"
              onClick={toggleTheme}
              title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
              aria-label="Toggle theme"
            >
              {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================
          2. CINEMATIC MEDIA HERO (Apple Pro Typography & Dual Device)
      ========================================================== */}
      <section className="apple-hero-section" id="overview">
        <div className="apple-hero-eyebrow-container">
          <span className="apple-hero-eyebrow">UNIFIED COMMERCE &amp; INVENTORY OS</span>
        </div>

        <h1 className="apple-hero-headline">
          Pro further.
        </h1>

        <p className="apple-hero-subhead">
          Unifying high-speed consumer shopping, multi-warehouse vendor fulfillment, and central administrative intelligence in one real-time ecosystem.
        </p>

        <div className="apple-hero-cta-group">
          <Link to="/customer/login" className="apple-hero-cta-btn primary">
            Launch Customer Store <ArrowRight size={16} />
          </Link>
          <Link to="/vendor/login" className="apple-hero-cta-btn secondary">
            Explore Vendor Hub
          </Link>
          <a
            href="https://inventoryadmin24.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="apple-hero-cta-btn link-style"
          >
            Open Titan Admin Console <ExternalLink size={14} />
          </a>
        </div>

        {/* =========================================================
            INTERACTIVE DUAL DEVICE SHOWCASE ("Show opened in Mac in iPhone also")
        ========================================================== */}
        <div className="apple-device-showcase-container" id="dual-showcase">
          {/* View Mode Switcher Pills */}
          <div className="apple-device-controls">
            <span className="apple-controls-label">Interactive Experience:</span>
            <div className="apple-view-pill-group">
              <button
                type="button"
                className={`apple-view-pill ${deviceView === "dual" ? "active" : ""}`}
                onClick={() => setDeviceView("dual")}
              >
                <Layers size={14} /> Unified Ecosystem View
              </button>
              <button
                type="button"
                className={`apple-view-pill ${deviceView === "mac" ? "active" : ""}`}
                onClick={() => setDeviceView("mac")}
              >
                <Monitor size={14} /> Desktop Hub (Vendor &amp; Admin)
              </button>
              <button
                type="button"
                className={`apple-view-pill ${deviceView === "iphone" ? "active" : ""}`}
                onClick={() => setDeviceView("iphone")}
              >
                <Smartphone size={14} /> Mobile App (Customer Store)
              </button>
            </div>
          </div>

          {/* 3D Parallax Tilt Stage */}
          <div
            className={`apple-devices-stage view-${deviceView}`}
            ref={deviceStageRef}
            onMouseMove={handleDeviceMouseMove}
            onMouseLeave={handleDeviceMouseLeave}
            style={{
              transform: `perspective(1400px) rotateX(${deviceTilt.x}deg) rotateY(${deviceTilt.y}deg)`
            }}
          >
            {/* ----------------- MACBOOK PRO 16" HARDWARE MODEL ----------------- */}
            {(deviceView === "dual" || deviceView === "mac") && (
              <div className="macbook-device-shell">
                {/* Screen Lid */}
                <div className="macbook-screen-lid">
                  {/* Camera Notch */}
                  <div className="macbook-camera-notch">
                    <span className="notch-camera-lens" />
                    <span className="notch-indicator-green" />
                  </div>

                  {/* macOS Menu Bar */}
                  <div className="macos-menu-bar">
                    <div className="macos-left-items">
                      <span className="macos-apple-logo"></span>
                      <span className="macos-app-title">Inventory Command Center</span>
                      <span className="macos-menu-link">Orders</span>
                      <span className="macos-menu-link">Dispatch</span>
                      <span className="macos-menu-link">Analytics</span>
                    </div>
                    <div className="macos-right-items">
                      <span className="macos-pill-stat">Sync 100%</span>
                      <span className="macos-battery">100%</span>
                      <span className="macos-clock">11:42 AM</span>
                    </div>
                  </div>

                  {/* Inside Screen Content (Interactive Logistics & Admin Command Center) */}
                  <div className="macbook-screen-display">
                    {/* Sub-Header Tabs */}
                    <div className="mac-screen-subnav">
                      <div className="mac-nav-tabs">
                        <button
                          type="button"
                          className={`mac-tab-btn ${macScreenTab === "merchant" ? "active" : ""}`}
                          onClick={() => setMacScreenTab("merchant")}
                        >
                          <Store size={13} /> Atlas Vendor Logistics Hub
                        </button>
                        <button
                          type="button"
                          className={`mac-tab-btn ${macScreenTab === "governance" ? "active" : ""}`}
                          onClick={() => setMacScreenTab("governance")}
                        >
                          <Shield size={13} /> Titan Platform Governance
                        </button>
                        <button
                          type="button"
                          className={`mac-tab-btn ${macScreenTab === "campaigns" ? "active" : ""}`}
                          onClick={() => setMacScreenTab("campaigns")}
                        >
                          <Zap size={13} /> Dynamic Campaigns &amp; Vouchers
                        </button>
                      </div>
                      <div className="mac-live-badge">
                        <span className="pulse-green-dot" /> LIVE STREAM • REGION US-EAST
                      </div>
                    </div>

                    {/* Dynamic Screen View based on Tab */}
                    {macScreenTab === "merchant" && (
                      <div className="mac-dashboard-grid">
                        <div className="mac-stat-card">
                          <span className="mac-card-label">Active Orders in Flight</span>
                          <h4 className="mac-card-value">1,428 Orders</h4>
                          <span className="mac-card-trend positive">↑ 18.4% vs yesterday</span>
                        </div>
                        <div className="mac-stat-card">
                          <span className="mac-card-label">Autonomous Replenishment</span>
                          <h4 className="mac-card-value">99.98% Accuracy</h4>
                          <span className="mac-card-trend neutral">Atlas Smart Router</span>
                        </div>
                        <div className="mac-stat-card">
                          <span className="mac-card-label">Dispatch SLA</span>
                          <h4 className="mac-card-value">14.2 Mins</h4>
                          <span className="mac-card-trend positive">Express Multi-Hub</span>
                        </div>

                        {/* Order Pipeline Table */}
                        <div className="mac-pipeline-card">
                          <div className="pipeline-header">
                            <h5>Live Fulfillment Pipeline (Real-Time WebSocket)</h5>
                            <span className="pipeline-refresh">⚡ 0.04s Ping</span>
                          </div>
                          <div className="pipeline-rows">
                            <div className="pipeline-row">
                              <span className="row-order-id">#ORD-9942</span>
                              <span className="row-item">Trail Pro Running Shoes × 1</span>
                              <span className="row-status pill-dispatching">Packing</span>
                              <span className="row-hub">Hub 04 (Austin)</span>
                            </div>
                            <div className="pipeline-row">
                              <span className="row-order-id">#ORD-9941</span>
                              <span className="row-item">Wireless ANC Headphones × 1</span>
                              <span className="row-status pill-transit">In Transit</span>
                              <span className="row-hub">Hub 01 (Seattle)</span>
                            </div>
                            <div className="pipeline-row">
                              <span className="row-order-id">#ORD-9940</span>
                              <span className="row-item">Nordic Wool Throw × 2</span>
                              <span className="row-status pill-delivered">Delivered</span>
                              <span className="row-hub">Hub 02 (New York)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {macScreenTab === "governance" && (
                      <div className="mac-dashboard-grid">
                        <div className="mac-stat-card">
                          <span className="mac-card-label">System-Wide GMV (24h)</span>
                          <h4 className="mac-card-value">₹48,29,450</h4>
                          <span className="mac-card-trend positive">↑ ₹6.2L surge</span>
                        </div>
                        <div className="mac-stat-card">
                          <span className="mac-card-label">Settlement Engine</span>
                          <h4 className="mac-card-value">&lt; 15ms Latency</h4>
                          <span className="mac-card-trend positive">Instant Digital Wallet</span>
                        </div>
                        <div className="mac-stat-card">
                          <span className="mac-card-label">Vendor KYC Audits</span>
                          <h4 className="mac-card-value">100% Passed</h4>
                          <span className="mac-card-trend neutral">Titan Guard Active</span>
                        </div>

                        <div className="mac-pipeline-card">
                          <div className="pipeline-header">
                            <h5>Titan Security &amp; Anomaly Detection Radar</h5>
                            <span className="pipeline-refresh">Zero Violations</span>
                          </div>
                          <div className="pipeline-rows">
                            <div className="pipeline-row">
                              <span className="row-order-id">TXN-4901</span>
                              <span className="row-item">Wallet Top-Up (₹5,000) • Customer #4019</span>
                              <span className="row-status pill-delivered">Success</span>
                              <span className="row-hub">Encrypted</span>
                            </div>
                            <div className="pipeline-row">
                              <span className="row-order-id">CRON-082</span>
                              <span className="row-item">Automated Return Refund Reconciliation</span>
                              <span className="row-status pill-transit">Verified</span>
                              <span className="row-hub">Auto-Settled</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {macScreenTab === "campaigns" && (
                      <div className="mac-dashboard-grid">
                        <div className="mac-stat-card">
                          <span className="mac-card-label">Active Flash Vouchers</span>
                          <h4 className="mac-card-value">4 Live Codes</h4>
                          <span className="mac-card-trend positive">↑ 28% redemptions</span>
                        </div>
                        <div className="mac-stat-card">
                          <span className="mac-card-label">Voucher Conversions</span>
                          <h4 className="mac-card-value">14.8% CTR</h4>
                          <span className="mac-card-trend positive">4,120 Claimed</span>
                        </div>
                        <div className="mac-stat-card">
                          <span className="mac-card-label">Live Carousel Banners</span>
                          <h4 className="mac-card-value">8 Featured</h4>
                          <span className="mac-card-trend neutral">Multi-App Sync</span>
                        </div>

                        <div className="mac-pipeline-card">
                          <div className="pipeline-header">
                            <h5>Dynamic Flash Campaigns &amp; Banner Stack</h5>
                            <span className="pipeline-refresh">Live Distribution</span>
                          </div>
                          <div className="pipeline-rows">
                            <div className="pipeline-row">
                              <span className="row-order-id">WELCOME10</span>
                              <span className="row-item">10% Welcome Voucher • All 3 Apps</span>
                              <span className="row-status pill-delivered">Active</span>
                              <span className="row-hub">1,840 Used</span>
                            </div>
                            <div className="pipeline-row">
                              <span className="row-order-id">FASHION25</span>
                              <span className="row-item">25% Drop • 3D Avatar Try-On Category</span>
                              <span className="row-status pill-delivered">Active</span>
                              <span className="row-hub">1,210 Used</span>
                            </div>
                            <div className="pipeline-row">
                              <span className="row-order-id">TECHBOOST</span>
                              <span className="row-item">₹500 Instant Cashback to Digital Wallet</span>
                              <span className="row-status pill-transit">Expiring</span>
                              <span className="row-hub">890 Used</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Glass Screen Glare Overlay */}
                  <div className="screen-glare-overlay" />
                </div>

                {/* MacBook Aluminum Base & Hinge */}
                <div className="macbook-keyboard-base">
                  <div className="macbook-notch-thumb" />
                </div>
              </div>
            )}

            {/* ----------------- IPHONE 18 PRO HARDWARE MODEL ----------------- */}
            {(deviceView === "dual" || deviceView === "iphone") && (
              <div className="iphone-device-shell">
                {/* Side Volume Rocker & Action Button Accents */}
                <div className="iphone-action-btn" />
                <div className="iphone-vol-up" />
                <div className="iphone-vol-down" />
                <div className="iphone-power-btn" />

                {/* Screen Chassis */}
                <div className="iphone-screen-chassis">
                  {/* Dynamic Island */}
                  <div className="iphone-dynamic-island">
                    <div className="di-left">
                      <span className="di-mic-pulse" />
                      <span className="di-label">
                        {iphoneFeatureTab === "shared-cart"
                          ? "Shared Cart"
                          : iphoneFeatureTab === "avatar"
                          ? "3D Avatar"
                          : iphoneFeatureTab === "voice-vision"
                          ? "Darwin AI"
                          : "Return Vault"}
                      </span>
                    </div>
                    <div className="di-right">
                      <span className="di-audio-bars">
                        <span />
                        <span />
                        <span />
                      </span>
                    </div>
                  </div>

                  {/* Interactive Customer Store Screen */}
                  <div className="iphone-screen-content">
                    {/* Status Bar */}
                    <div className="iphone-status-bar">
                      <span className="iphone-time">9:41</span>
                      <div className="iphone-status-icons">
                        <span className="status-signal">••••</span>
                        <span className="status-wifi">📶</span>
                        <span className="status-battery">100%</span>
                      </div>
                    </div>

                    {/* Interactive Real Feature Switcher Tabs */}
                    <div className="iphone-feature-tabs-bar">
                      <button
                        type="button"
                        className={`iphone-tab-pill ${iphoneFeatureTab === "shared-cart" ? "active" : ""}`}
                        onClick={() => setIphoneFeatureTab("shared-cart")}
                        title="Shared Collaborative Cart"
                      >
                        <Users size={11} /> Cart
                      </button>
                      <button
                        type="button"
                        className={`iphone-tab-pill ${iphoneFeatureTab === "avatar" ? "active" : ""}`}
                        onClick={() => setIphoneFeatureTab("avatar")}
                        title="3D Virtual Avatar Try-On"
                      >
                        <Sparkles size={11} /> Avatar
                      </button>
                      <button
                        type="button"
                        className={`iphone-tab-pill ${iphoneFeatureTab === "voice-vision" ? "active" : ""}`}
                        onClick={() => setIphoneFeatureTab("voice-vision")}
                        title="Darwin Voice & Vision Search"
                      >
                        <Camera size={11} /> Vision
                      </button>
                      <button
                        type="button"
                        className={`iphone-tab-pill ${iphoneFeatureTab === "return-vault" ? "active" : ""}`}
                        onClick={() => setIphoneFeatureTab("return-vault")}
                        title="Doorstep Return Vault"
                      >
                        <RotateCcw size={11} /> Returns
                      </button>
                    </div>

                    {/* SCREEN 1: SHARED COLLABORATIVE CART */}
                    {iphoneFeatureTab === "shared-cart" && (
                      <div className="iphone-feature-screen screen-shared-cart">
                        <div className="screen-header-row">
                          <div>
                            <span className="screen-tag-pill">⚡ Live Session #704</span>
                            <h4 className="screen-main-title">Shared Cart (3 Members)</h4>
                          </div>
                          <div className="screen-members-avatars">
                            <span className="member-avatar host" title="Alex (Host)">A</span>
                            <span className="member-avatar active" title="Priya (Active)">P</span>
                            <span className="member-avatar me" title="You">You</span>
                          </div>
                        </div>

                        {/* Real-Time Sync Pulse Notice */}
                        <div className="realtime-sync-notice">
                          <span className="pulse-green-dot" />
                          <span>Priya added <strong>Pro Trail Runners</strong> in real-time</span>
                        </div>

                        {/* Shared Cart Items Stream */}
                        <div className="shared-cart-items-list">
                          <div className="shared-cart-item-row">
                            <img src="/banners/banner_sports_hd.jpg" alt="Sneakers" />
                            <div className="shared-item-details">
                              <span className="shared-item-name">Pro Trail Runners v2</span>
                              <span className="shared-by-badge priya">Added by Priya</span>
                              <span className="shared-item-price">₹2,499</span>
                            </div>
                            <span className="shared-item-qty">×1</span>
                          </div>

                          <div className="shared-cart-item-row">
                            <img src="/banners/banner_tech_hd.jpg" alt="Watch" />
                            <div className="shared-item-details">
                              <span className="shared-item-name">Smart Watch v4 ANC</span>
                              <span className="shared-by-badge me">Added by You</span>
                              <span className="shared-item-price">₹4,999</span>
                            </div>
                            <span className="shared-item-qty">×1</span>
                          </div>
                        </div>

                        {/* Split Bill Card */}
                        <div className="shared-bill-card">
                          <div className="bill-row">
                            <span>Cart Total (2 items)</span>
                            <strong>₹7,498</strong>
                          </div>
                          <div className="bill-row split">
                            <span>Split 3-Ways:</span>
                            <span className="split-amount">₹2,499.33 / person</span>
                          </div>
                        </div>

                        <button type="button" className="iphone-feature-action-btn">
                          <Wallet size={13} /> Pay ₹2,499 via Digital Wallet
                        </button>
                      </div>
                    )}

                    {/* SCREEN 2: 3D VIRTUAL AVATAR TRY-ON */}
                    {iphoneFeatureTab === "avatar" && (
                      <div className="iphone-feature-screen screen-avatar">
                        <div className="screen-header-row">
                          <div>
                            <span className="screen-tag-pill pink">3D Virtual Try-On</span>
                            <h4 className="screen-main-title">Digital Twin Fit</h4>
                          </div>
                          <div className="fit-accuracy-pill">
                            <span>98.4% Match</span>
                          </div>
                        </div>

                        {/* 3D Avatar Body Silhouette Canvas */}
                        <div className="avatar-preview-canvas">
                          <div className="avatar-silhouette-box">
                            <div className="avatar-wireframe-grid" />
                            <div className="avatar-body-figure">
                              <span className="figure-head" />
                              <span className="figure-torso" />
                              <span className="figure-legs" />
                            </div>

                            {/* Measurement Floating Badges */}
                            <span className="avatar-fit-tag tag-height">178 cm</span>
                            <span className="avatar-fit-tag tag-chest">Chest: 38.5"</span>
                            <span className="avatar-fit-tag tag-waist">Waist: 32"</span>
                          </div>

                          <span className="avatar-rotation-hint">
                            <RefreshCw size={10} className="spin-slow" /> 360° Drape Tension Active
                          </span>
                        </div>

                        {/* Garment Selector */}
                        <div className="garment-selector-bar">
                          <button
                            type="button"
                            className={`garment-btn ${avatarGarment === "blazer" ? "active" : ""}`}
                            onClick={() => setAvatarGarment("blazer")}
                          >
                            Tailored Blazer
                          </button>
                          <button
                            type="button"
                            className={`garment-btn ${avatarGarment === "knit" ? "active" : ""}`}
                            onClick={() => setAvatarGarment("knit")}
                          >
                            Nordic Knit
                          </button>
                          <button
                            type="button"
                            className={`garment-btn ${avatarGarment === "runners" ? "active" : ""}`}
                            onClick={() => setAvatarGarment("runners")}
                          >
                            Track Jogger
                          </button>
                        </div>

                        <div className="avatar-fit-recommendation">
                          ✓ Recommended Size: <strong>M (Tailored Fit)</strong> • 0% Return Probability
                        </div>

                        <button type="button" className="iphone-feature-action-btn">
                          <ShoppingBag size={13} /> Add Fitted Size (M) to Cart
                        </button>
                      </div>
                    )}

                    {/* SCREEN 3: DARWIN VOICE & VISION SEARCH */}
                    {iphoneFeatureTab === "voice-vision" && (
                      <div className="iphone-feature-screen screen-voice-vision">
                        <div className="screen-header-row">
                          <div>
                            <span className="screen-tag-pill amber">Darwin Vision &amp; Voice</span>
                            <h4 className="screen-main-title">AI Camera Scanner</h4>
                          </div>
                          <div className="voice-mic-active-badge">
                            <Mic size={11} /> Listening
                          </div>
                        </div>

                        {/* Camera Scanner Viewfinder */}
                        <div className="vision-camera-viewfinder">
                          <img src="/banners/banner_sports_hd.jpg" alt="Camera Scan" />
                          <div className="scanner-target-reticle">
                            <span className="target-bracket top-left" />
                            <span className="target-bracket top-right" />
                            <span className="target-bracket bottom-left" />
                            <span className="target-bracket bottom-right" />
                            <span className="target-scan-line" />
                          </div>
                          <span className="scanner-hud-text">48MP Lens • 0.4s SKU Match</span>
                        </div>

                        {/* Darwin Voice Transcription Pill */}
                        <div className="darwin-query-transcript">
                          <Bot size={13} color="#38bdf8" />
                          <span>“Find lightweight trail shoes with 10% coupon”</span>
                        </div>

                        {/* Identified SKU Card */}
                        <div className="vision-match-card">
                          <div className="vision-match-info">
                            <span className="match-title">Pro Trail Runners v2</span>
                            <span className="match-badge">99.4% Match • WELCOME10 Applied</span>
                          </div>
                          <div className="vision-match-price">
                            <span className="old-price">₹2,749</span>
                            <span className="new-price">₹2,499</span>
                          </div>
                        </div>

                        <button type="button" className="iphone-feature-action-btn">
                          <Zap size={13} /> 1-Tap Instant Purchase
                        </button>
                      </div>
                    )}

                    {/* SCREEN 4: RETURN VAULT & AUTOMATED WALLET REFUND */}
                    {iphoneFeatureTab === "return-vault" && (
                      <div className="iphone-feature-screen screen-return-vault">
                        <div className="screen-header-row">
                          <div>
                            <span className="screen-tag-pill cyan">Return Vault</span>
                            <h4 className="screen-main-title">Order #ORD-8821</h4>
                          </div>
                          <span className="return-status-chip">Approved</span>
                        </div>

                        {/* Milestone Timeline */}
                        <div className="return-milestone-track">
                          <div className="milestone-step done">
                            <span className="step-dot">✓</span>
                            <span className="step-txt">Requested</span>
                          </div>
                          <div className="milestone-step active">
                            <span className="step-dot">🚚</span>
                            <span className="step-txt">Pickup 2:30 PM</span>
                          </div>
                          <div className="milestone-step">
                            <span className="step-dot">📱</span>
                            <span className="step-txt">QR Verify</span>
                          </div>
                          <div className="milestone-step">
                            <span className="step-dot">⚡</span>
                            <span className="step-txt">&lt;15ms Refund</span>
                          </div>
                        </div>

                        {/* Courier Doorstep QR Verification Box */}
                        <div className="courier-qr-box">
                          <div className="qr-visual">
                            <QrCode size={36} color="#0284c7" />
                          </div>
                          <div className="qr-desc">
                            <strong>Doorstep Courier QR Code</strong>
                            <p>Show this code to the pickup executive for instant check-in.</p>
                          </div>
                        </div>

                        {/* Instant Wallet Credit Notification */}
                        <div className="wallet-refund-callout">
                          <Wallet size={14} color="#10b981" />
                          <div>
                            <span>Instant Wallet Refund: <strong>₹1,850.00</strong></span>
                            <small>Direct credit to Digital Wallet in &lt;15ms</small>
                          </div>
                        </div>

                        <button type="button" className="iphone-feature-action-btn">
                          <Truck size={13} /> Track Pickup Executive
                        </button>
                      </div>
                    )}

                    {/* Bottom Nav Bar */}
                    <div className="iphone-bottom-nav">
                      <div
                        className={`iphone-nav-item ${iphoneFeatureTab === "shared-cart" ? "active" : ""}`}
                        onClick={() => setIphoneFeatureTab("shared-cart")}
                      >
                        <Users size={15} />
                        <span>Shared</span>
                      </div>
                      <div
                        className={`iphone-nav-item ${iphoneFeatureTab === "avatar" ? "active" : ""}`}
                        onClick={() => setIphoneFeatureTab("avatar")}
                      >
                        <Sparkles size={15} />
                        <span>Avatar</span>
                      </div>
                      <div
                        className={`iphone-nav-item ${iphoneFeatureTab === "voice-vision" ? "active" : ""}`}
                        onClick={() => setIphoneFeatureTab("voice-vision")}
                      >
                        <Camera size={15} />
                        <span>Vision</span>
                      </div>
                      <div
                        className={`iphone-nav-item ${iphoneFeatureTab === "return-vault" ? "active" : ""}`}
                        onClick={() => setIphoneFeatureTab("return-vault")}
                      >
                        <RotateCcw size={15} />
                        <span>Returns</span>
                      </div>
                    </div>

                    {/* Home Indicator Bar */}
                    <div className="iphone-home-indicator" />
                  </div>

                  {/* Glass Reflection Glare */}
                  <div className="screen-glare-overlay" />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================
          3. "GET THE HIGHLIGHTS" FILMSTRIP (Apple AAP Reel)
      ========================================================== */}
      <section className="apple-highlights-section" id="highlights">
        <div className="apple-section-header">
          <h2 className="apple-section-headline">Built for speed, precision &amp; scale.</h2>
          <div className="apple-highlights-controls">
            <button
              type="button"
              className="apple-play-pause-btn"
              onClick={() => setIsPlayingHighlights(!isPlayingHighlights)}
              title={isPlayingHighlights ? "Pause highlights" : "Play highlights"}
            >
              {isPlayingHighlights ? <Pause size={16} /> : <Play size={16} />}
            </button>

            {/* Timed Progress Dot Navigation */}
            <div className="apple-timed-dotnav">
              {HIGHLIGHTS_DATA.map((h, idx) => (
                <button
                  key={h.id}
                  type="button"
                  className={`dotnav-pill ${activeHighlight === idx ? "active" : ""}`}
                  onClick={() => {
                    setActiveHighlight(idx);
                    setIsPlayingHighlights(false);
                  }}
                  title={h.tag}
                >
                  <span className="dotnav-progress" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filmstrip Card Set */}
        <div className="apple-highlights-card-viewport">
          <div
            className="apple-highlights-card-track"
            style={{ transform: `translateX(-${activeHighlight * 100}%)` }}
          >
            {HIGHLIGHTS_DATA.map((card, idx) => (
              <div
                key={card.id}
                className={`apple-highlight-card ${activeHighlight === idx ? "active" : ""}`}
                style={{ background: card.bgGradient }}
              >
                <div className="card-top-content">
                  <span className="card-tag" style={{ color: card.accent }}>
                    {card.tag}
                  </span>
                  <h3 className="card-headline">{card.headline}</h3>
                  <p className="card-sub">{card.sub}</p>
                </div>

                <div className="card-bottom-metric">
                  <span className="metric-number" style={{ color: card.accent }}>
                    {card.metric}
                  </span>
                  <span className="metric-desc">{card.metricLabel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          3b. THREE CONNECTED EXPERIENCES — Full Platform Showcase
      ========================================================== */}
      <section className="three-experiences-section" id="three-experiences">
        <div className="exp-section-header">
          <span className="exp-section-eyebrow">
            <Layers size={14} /> THREE CONNECTED EXPERIENCES
          </span>
          <h2 className="exp-section-title">
            One platform. <br />Three powerful apps.
          </h2>
          <p className="exp-section-subtitle">
            Every feature built for a specific role — customers, vendors, and admins — 
            working together as a single connected ecosystem.
          </p>
        </div>

        {/* ── Hero App Cards — 3 app showcase with real screen images ── */}
        <div className="exp-hero-cards-row">
          {/* Customer App Hero Card */}
          <div className="exp-hero-card customer-card">
            <div className="exp-hero-card-top">
              <div className="exp-hero-card-icon-row">
                <img src="/favicon.svg" alt="Customer App" className="exp-icon-img" />
                <div>
                  <h3 className="exp-hero-card-title">Customer App</h3>
                  <span className="exp-hero-card-subtitle">Smart Shopping Experience</span>
                </div>
              </div>
              <span className="exp-hero-card-badge customer">Customer</span>
            </div>
            <p className="exp-hero-card-desc">Discover, compare, buy and track everything you love with AI-powered shopping — from personalized discovery to doorstep delivery.</p>
            <div className="exp-hero-card-cta-row">
              <a href="#customer-features" className="exp-hero-card-cta">
                Explore Customer App <ArrowRight size={14} />
              </a>
            </div>
            <div className="exp-hero-card-image">
              <img src="/banners/banner_ai_ecosystem_hd.jpg" alt="Customer App" />
            </div>
          </div>

          {/* Vendor App Hero Card */}
          <div className="exp-hero-card vendor-card">
            <div className="exp-hero-card-top">
              <div className="exp-hero-card-icon-row">
                <img src="/telegram-icon.svg" alt="Vendor App" className="exp-icon-img" />
                <div>
                  <h3 className="exp-hero-card-title">Vendor App</h3>
                  <span className="exp-hero-card-subtitle">Store & Inventory Operations</span>
                </div>
              </div>
              <span className="exp-hero-card-badge vendor">Vendor</span>
            </div>
            <p className="exp-hero-card-desc">Manage products, orders, inventory, payments, and scale your merchant storefront with AI copy generation and real-time stock shields.</p>
            <div className="exp-hero-card-cta-row">
              <a href="#vendor-features" className="exp-hero-card-cta">
                Explore Vendor App <ArrowRight size={14} />
              </a>
            </div>
            <div className="exp-hero-card-image">
              <img src="/banners/orders_hero_banner.jpg" alt="Vendor App" />
            </div>
          </div>

          {/* Admin App Hero Card */}
          <div className="exp-hero-card admin-card">
            <div className="exp-hero-card-top">
              <div className="exp-hero-card-icon-row">
                <img src="/admin-favicon.png" alt="Admin App" className="exp-icon-img" />
                <div>
                  <h3 className="exp-hero-card-title">Admin App</h3>
                  <span className="exp-hero-card-subtitle">Platform Control Center</span>
                </div>
              </div>
              <span className="exp-hero-card-badge admin">Admin</span>
            </div>
            <p className="exp-hero-card-desc">Monitor, manage, and scale the entire platform with complete governance, multi-warehouse geo-routing, and telemetry analytics.</p>
            <div className="exp-hero-card-cta-row">
              <a href="#admin-features" className="exp-hero-card-cta">
                Explore Admin App <ArrowRight size={14} />
              </a>
            </div>
            <div className="exp-hero-card-image">
              <img src="/panda-admin-icon.jpg" alt="Admin App" />
            </div>
          </div>
        </div>

        {/* =========================================================
            BENTO FEATURE SHOWCASE: 10 FLAGSHIP INNOVATIONS ACROSS 3 APPS
            (Inspired by release showcase view, website-styled, zero horizontal scroll)
        ========================================================== */}
        <div className="bento-showcase-wrapper" id="flagship-innovations">
          {/* Showcase Section Header */}
          <div className="bento-showcase-header">
            <div className="bento-header-badge">
              <Sparkles size={13} className="bento-sparkle-icon" />
              <span>UNIFIED COMMERCE INNOVATION</span>
            </div>
            <h3 className="bento-showcase-title">
              15 Flagship Capabilities Across All 3 Apps
            </h3>
            <p className="bento-showcase-subtitle">
              Engineered with sub-second settlements, live telemetry, and frictionless workflows across Customer, Vendor, and Admin.
            </p>
          </div>

          {/* ── ROW 1: TWO WIDE HERO BENTO CARDS (Fintech Wallet & Vendor Dashboard) ── */}
          <div className="bento-grid-row-hero">
            {/* Card 1: Customer Digital Wallet & Multi-Rail Payments */}
            <div className="bento-card bento-card-wallet">
              <div className="bento-card-top-info">
                <div className="bento-app-pill wallet-pill">
                  <Wallet size={12} /> Customer App · Fintech
                </div>
                <h4 className="bento-card-heading">Smart Digital Wallet &amp; Instant Settlements</h4>
                <p className="bento-card-desc">
                  Sub-second wallet debits, instant UPI top-ups, promotional voucher stacking, and tamper-proof ledger reconciliation.
                </p>
              </div>

              {/* Embedded UI Artwork: Mini Wallet Card */}
              <div className="bento-artwork-box wallet-artwork">
                <div className="wallet-mini-header">
                  <div className="wallet-balance-row">
                    <span className="wallet-label">Available Balance</span>
                    <span className="wallet-amount">₹24,500.00</span>
                  </div>
                  <span className="wallet-subsecond-badge">⚡ 14ms Settlement</span>
                </div>

                <div className="wallet-chips-row">
                  <span className="wallet-chip active">• PAID ₹18,500</span>
                  <span className="wallet-chip">• APPLIED ₹4,250</span>
                  <span className="wallet-chip">• ON HOLD ₹750</span>
                  <span className="wallet-chip credit">• CREDIT ₹24,500</span>
                </div>

                <div className="wallet-tx-preview">
                  <div className="wallet-tx-item">
                    <div className="tx-dot-credit" />
                    <div className="tx-meta">
                      <span className="tx-title">UPI Top-Up Auto Credit</span>
                      <span className="tx-date">Today at 10:14 AM</span>
                    </div>
                    <span className="tx-val credit">+₹2,450.00</span>
                    <span className="tx-tag credit">CREDIT</span>
                  </div>
                  <div className="wallet-tx-item">
                    <div className="tx-dot-hold" />
                    <div className="tx-meta">
                      <span className="tx-title">Doorstep Return Refund Hold</span>
                      <span className="tx-date">Awaiting courier verification</span>
                    </div>
                    <span className="tx-val hold">₹750.00</span>
                    <span className="tx-tag hold">ON HOLD</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Vendor Store Operations & Merchant Dashboard */}
            <div className="bento-card bento-card-vendor-dash">
              <div className="bento-card-top-info">
                <div className="bento-app-pill vendor-pill">
                  <Store size={12} /> Vendor App · Operations
                </div>
                <h4 className="bento-card-heading">Merchant Store Operations &amp; Live Telemetry Dashboard</h4>
                <p className="bento-card-desc">
                  Live revenue velocity, dispatch fulfillment monitors, automated invoice settlements, and low-stock replenishment radar.
                </p>
              </div>

              {/* Embedded UI Artwork: Mini Merchant Dashboard */}
              <div className="bento-artwork-box vendor-artwork">
                <div className="vendor-dash-top">
                  <div className="vendor-store-meta">
                    <span className="vendor-store-name">Apex Electronics Hub</span>
                    <span className="vendor-store-id">#VEN-8842</span>
                  </div>
                  <span className="vendor-live-status-pill">
                    <span className="live-pulsing-dot" /> Live Telemetry
                  </span>
                </div>

                <div className="vendor-stats-grid">
                  <div className="v-stat-card">
                    <span className="v-stat-label">Today's Net GMV</span>
                    <span className="v-stat-num">₹1,48,250</span>
                    <span className="v-stat-growth"><TrendingUp size={11} /> +24.6% vs yesterday</span>
                  </div>
                  <div className="v-stat-card">
                    <span className="v-stat-label">Pending Dispatch</span>
                    <span className="v-stat-num">18 Orders</span>
                    <span className="v-stat-sub">SLA Target: 100%</span>
                  </div>
                  <div className="v-stat-card">
                    <span className="v-stat-label">Catalog Health</span>
                    <span className="v-stat-num">99.8%</span>
                    <span className="v-stat-sub">Stockout Shield Active</span>
                  </div>
                </div>

                <div className="vendor-fulfillment-bar-box">
                  <div className="v-bar-header">
                    <span>Daily Dispatch Progress</span>
                    <span className="v-bar-pct">92% Fulfilled</span>
                  </div>
                  <div className="v-progress-track">
                    <div className="v-progress-fill" style={{ width: "92%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── ROW 2: THREE BENTO CARDS (Timeline, Wishlist, 3D Avatar) ── */}
          <div className="bento-grid-row-three">
            {/* Card 3: Live Order Milestone Stepped Timeline */}
            <div className="bento-card bento-card-timeline">
              <div className="bento-card-top-info">
                <div className="bento-app-pill logistics-pill">
                  <Truck size={12} /> Customer App · Logistics
                </div>
                <h4 className="bento-card-heading">Complete Delivery Timeline</h4>
                <p className="bento-card-desc">
                  Track every milestone from order confirmation to doorstep handoff with live courier updates.
                </p>
              </div>

              {/* Embedded UI Artwork: Stepped Vertical Timeline */}
              <div className="bento-artwork-box timeline-artwork">
                <div className="bento-card-banner-media tri">
                  <img src="/banners/feature-live-tracking.jpg" alt="Complete Delivery Timeline" className="bento-card-banner-img" />
                  <div className="bento-banner-overlay compact">
                    <span className="bento-banner-badge sky">
                      <Truck size={11} /> WebSocket 1Hz
                    </span>
                    <span className="bento-stat-inline">Rider: Rajesh K. (1.2 km)</span>
                  </div>
                </div>

                <div className="bento-timeline-list">
                  <div className="bento-tl-step completed">
                    <div className="tl-node"><Check size={11} /></div>
                    <div className="tl-content">
                      <span className="tl-title">Order Confirmed</span>
                      <span className="tl-time">09:12 AM · Item reserved</span>
                    </div>
                  </div>
                  <div className="bento-tl-connector completed" />

                  <div className="bento-tl-step completed">
                    <div className="tl-node"><Check size={11} /></div>
                    <div className="tl-content">
                      <span className="tl-title">Packed at Regional Hub</span>
                      <span className="tl-time">09:45 AM · Hub #4 West</span>
                    </div>
                  </div>
                  <div className="bento-tl-connector active" />

                  <div className="bento-tl-step active">
                    <div className="tl-node pulsing"><div className="tl-pulse-dot" /></div>
                    <div className="tl-content">
                      <div className="tl-title-row">
                        <span className="tl-title">Out for Delivery</span>
                        <span className="tl-active-badge">ACTIVE</span>
                      </div>
                      <span className="tl-time">Rider: Rajesh K. · 4.9★</span>
                    </div>
                  </div>
                  <div className="bento-tl-connector pending" />

                  <div className="bento-tl-step pending">
                    <div className="tl-node hollow" />
                    <div className="tl-content">
                      <span className="tl-title">Doorstep Arrival</span>
                      <span className="tl-time">Estimated 10:30 AM</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Customer Wishlist & Smart Price Drop Radar */}
            <div className="bento-card bento-card-wishlist">
              <div className="bento-card-top-info">
                <div className="bento-app-pill wishlist-pill">
                  <Heart size={12} /> Customer App · Wishlist
                </div>
                <h4 className="bento-card-heading">Wishlist &amp; Price Drop Radar</h4>
                <p className="bento-card-desc">
                  Real-time price trend alerts, 1-click cart migration, and instant notifications when items drop.
                </p>
              </div>

              {/* Embedded UI Artwork: Interactive Wishlist Radar */}
              <div className="bento-artwork-box wishlist-artwork">
                <div className="bento-card-banner-media tri">
                  <img src="/banners/feature-price-tracking.jpg" alt="Wishlist & Price Drop Radar" className="bento-card-banner-img" />
                  <div className="bento-banner-overlay compact">
                    <span className="bento-banner-badge emerald">
                      <TrendingUp size={11} /> Price Drop Radar
                    </span>
                    <span className="bento-stat-inline">Save up to ₹10,000</span>
                  </div>
                </div>

                <div className="bento-wishlist-tabs">
                  <button
                    type="button"
                    className={`bw-tab-btn ${wishlistFilter === "all" ? "active" : ""}`}
                    onClick={() => setWishlistFilter("all")}
                  >
                    All Saved
                  </button>
                  <button
                    type="button"
                    className={`bw-tab-btn ${wishlistFilter === "dropped" ? "active" : ""}`}
                    onClick={() => setWishlistFilter("dropped")}
                  >
                    Price Drops (2)
                  </button>
                  <button
                    type="button"
                    className={`bw-tab-btn ${wishlistFilter === "instock" ? "active" : ""}`}
                    onClick={() => setWishlistFilter("instock")}
                  >
                    In Stock
                  </button>
                </div>

                <div className="bento-wishlist-items">
                  {BENTO_WISHLIST_ITEMS
                    .filter((item) => {
                      if (wishlistFilter === "dropped") return item.isPriceDropped;
                      if (wishlistFilter === "instock") return item.inStock;
                      return true;
                    })
                    .map((item) => (
                      <div key={item.id} className="bento-wl-card">
                        <div className="wl-card-top">
                          <span className="wl-name">{item.name}</span>
                          <span className="wl-badge">{item.badge}</span>
                        </div>
                        <div className="wl-card-bottom">
                          <div className="wl-prices">
                            <span className="wl-curr">{item.currentPrice}</span>
                            <span className="wl-orig">{item.originalPrice}</span>
                            <span className="wl-save">{item.discount}</span>
                          </div>
                          <button type="button" className="wl-cart-action-btn">
                            <ShoppingBag size={11} /> Move
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Card 5: 3D Virtual Try-On & Digital Avatar Studio */}
            <div className="bento-card bento-card-tryon">
              <div className="bento-card-top-info">
                <div className="bento-app-pill tryon-pill">
                  <Camera size={12} /> Customer App · 3D Avatar
                </div>
                <h4 className="bento-card-heading">3D Virtual Avatar Try-On</h4>
                <p className="bento-card-desc">
                  Personalized 3D digital twin body mesh with sub-millimeter drape simulations to guarantee fit.
                </p>
              </div>

              {/* Embedded UI Artwork: 3D Fitting Simulation Controls */}
              <div className="bento-artwork-box tryon-artwork">
                <div className="bento-card-banner-media tri">
                  <img src="/banners/feature-virtual-tryon.jpg" alt="3D Virtual Avatar Try-On" className="bento-card-banner-img" />
                  <div className="bento-banner-overlay compact">
                    <span className="bento-banner-badge purple">
                      <Camera size={11} /> 3D Body Mesh
                    </span>
                    <span className="bento-stat-inline">98.4% Fit Precision</span>
                  </div>
                </div>

                <div className="tryon-options-label">Select Garment Silhouette:</div>
                <div className="tryon-radio-group">
                  <button
                    type="button"
                    className={`tryon-radio-chip ${tryonGarment === "blazer" ? "active" : ""}`}
                    onClick={() => setTryonGarment("blazer")}
                  >
                    <span className="radio-circle" /> Slim Blazer
                  </button>
                  <button
                    type="button"
                    className={`tryon-radio-chip ${tryonGarment === "knit" ? "active" : ""}`}
                    onClick={() => setTryonGarment("knit")}
                  >
                    <span className="radio-circle" /> Casual Knit
                  </button>
                  <button
                    type="button"
                    className={`tryon-radio-chip ${tryonGarment === "hoodie" ? "active" : ""}`}
                    onClick={() => setTryonGarment("hoodie")}
                  >
                    <span className="radio-circle" /> Active Hoodie
                  </button>
                </div>

                <div className="tryon-preview-badge-card">
                  <div className="tryon-fit-score">
                    <span className="fit-score-icon">✨</span>
                    <div className="fit-score-text">
                      <span className="fit-pct">
                        {tryonGarment === "blazer" ? "98.4% Match" : tryonGarment === "knit" ? "99.1% Match" : "97.6% Match"}
                      </span>
                      <span className="fit-desc">Precision Shoulder &amp; Chest Drape</span>
                    </div>
                  </div>
                  <div className="tryon-recommend-size">
                    Recommended: <strong>Size M (38R)</strong>
                  </div>
                </div>

                <div className="tryon-action-row">
                  <Link to="/customer/login" className="tryon-launch-link">
                    <Sparkles size={12} /> Launch 3D Try-On Studio →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* ── ROW 3: TWO WIDE HERO BENTO CARDS (Admin Governance & Shared Cart) ── */}
          <div className="bento-grid-row-hero">
            {/* Card 6: Admin Governance & GMV Cockpit */}
            <div className="bento-card bento-card-admin-gov">
              <div className="bento-card-top-info">
                <div className="bento-app-pill admin-pill">
                  <Shield size={12} /> Admin App · Governance
                </div>
                <h4 className="bento-card-heading">Platform Governance &amp; Global GMV Cockpit</h4>
                <p className="bento-card-desc">
                  Unified multi-tenant cockpit tracking gross merchandise volume velocity, automated vendor KYC onboarding, granular RBAC privilege controls, and platform health telemetry.
                </p>
              </div>

              {/* Creative Banner Artwork Box */}
              <div className="bento-artwork-box admin-gov-artwork">
                <div className="bento-card-banner-media bento-banner-hero gov-media">
                  <img src="/banners/marketing/hero-banner.jpg" alt="Platform Governance & Global GMV Cockpit" className="bento-card-banner-img" />
                  <div className="bento-banner-overlay compact">
                    <span className="bento-banner-badge live">
                      <span className="telemetry-live-dot" /> Live Platform GMV
                    </span>
                    <span className="bento-stat-inline">99.99% Core Uptime</span>
                  </div>
                </div>

                <div className="bento-admin-gmv-strip">
                  <div className="bam-gmv-highlight">
                    <span className="bam-gmv-num">₹12.4M</span>
                    <span className="bam-gmv-lbl">Monthly GMV Velocity (+31.8% vs last month)</span>
                  </div>
                  <span className="bam-uptime-chip"><Shield size={12} /> Enterprise SLA</span>
                </div>

                <div className="bento-admin-metrics-row">
                  <div className="bento-admin-metric-chip">
                    <span className="bam-lbl">Vendor KYC</span>
                    <span className="bam-val">99.2% Verified</span>
                    <span className="bam-sub">Automated GSTIN/PAN</span>
                  </div>
                  <div className="bento-admin-metric-chip">
                    <span className="bam-lbl">RBAC Roles</span>
                    <span className="bam-val">Granular RBAC</span>
                    <span className="bam-sub">Least-Privilege Trees</span>
                  </div>
                  <div className="bento-admin-metric-chip">
                    <span className="bam-lbl">System Health</span>
                    <span className="bam-val">&lt; 5ms Event Loop</span>
                    <span className="bam-sub">Zero Audit Drift</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 7: Collaborative Shared & Family Cart */}
            <div className="bento-card bento-card-shared-cart">
              <div className="bento-card-top-info">
                <div className="bento-app-pill shared-cart-pill">
                  <Users size={12} /> Customer App · Social Commerce
                </div>
                <h4 className="bento-card-heading">Collaborative Shared Cart &amp; Split Checkout</h4>
                <p className="bento-card-desc">
                  Multi-user synchronized shopping basket where family members and teams add items concurrently with live presence avatars, item attribution tags, and split payments.
                </p>
              </div>

              {/* Creative Banner Artwork Box */}
              <div className="bento-artwork-box shared-cart-artwork">
                <div className="bento-card-banner-media bento-banner-hero shared-cart-media">
                  <img src="/banners/shared_cart_banner.jpg" alt="Collaborative Shared Cart" className="bento-card-banner-img" />
                  <div className="bento-banner-overlay compact">
                    <span className="bento-banner-badge teal">
                      <Users size={11} /> Family Cart #FAM-902
                    </span>
                    <span className="bento-stat-inline">3 Shoppers Active</span>
                  </div>
                </div>

                <div className="bento-shared-cart-strip">
                  <div className="bsc-total-highlight">
                    <span className="bsc-total-num">₹33,489.00</span>
                    <span className="bsc-total-lbl">Basket Subtotal · 2 Items Synced</span>
                  </div>
                  <span className="bsc-split-badge"><Zap size={11} /> Auto Bill Split</span>
                </div>

                <div className="bento-shared-cart-stream">
                  <div className="bento-sc-member-row">
                    <div className="bento-sc-avatar sarah">SM</div>
                    <div className="bento-sc-item-info">
                      <span className="bento-sc-item-name">Nike Air Max 90 (Size 10)</span>
                      <span className="bento-sc-item-by">Added by Sarah M. · 2m ago</span>
                    </div>
                    <span className="bento-sc-item-price">₹8,499</span>
                  </div>
                  <div className="bento-sc-member-row">
                    <div className="bento-sc-avatar marcus">MT</div>
                    <div className="bento-sc-item-info">
                      <span className="bento-sc-item-name">Sony WH-1000XM5 ANC</span>
                      <span className="bento-sc-item-by">Added by Marcus T. · Just now</span>
                    </div>
                    <span className="bento-sc-item-price">₹24,990</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── ROW 4: THREE TRI-COLUMN BENTO CARDS (Return Vault, Stockout Shield, Geo-Routing) ── */}
          <div className="bento-grid-row-three">
            {/* Card 8: Instant Doorstep Return Vault */}
            <div className="bento-card bento-card-return-vault">
              <div className="bento-card-top-info">
                <div className="bento-app-pill return-pill">
                  <RotateCcw size={12} /> Customer App · Returns
                </div>
                <h4 className="bento-card-heading">Instant Doorstep Return Vault</h4>
                <p className="bento-card-desc">
                  1-tap self-service return scheduling with courier doorstep QR validation and sub-15ms automated wallet refund crediting.
                </p>
              </div>

              {/* Creative Banner Artwork Box */}
              <div className="bento-artwork-box return-vault-artwork">
                <div className="bento-card-banner-media tri">
                  <img src="/banners/feature-return-vault.jpg" alt="Instant Return Vault" className="bento-card-banner-img" />
                  <div className="bento-banner-overlay compact">
                    <span className="bento-banner-badge rose">
                      <RotateCcw size={11} /> 1-Tap Protocol
                    </span>
                    <span className="bento-stat-inline">₹3,499 Refunded</span>
                  </div>
                </div>

                <div className="bento-return-steps-mini">
                  <div className="bento-ret-mini-step done">
                    <CheckCircle2 size={13} />
                    <span>1-Tap Request Scheduled</span>
                  </div>
                  <div className="bento-ret-mini-step done">
                    <CheckCircle2 size={13} />
                    <span>Doorstep Courier QR Validated</span>
                  </div>
                  <div className="bento-ret-mini-step active">
                    <Zap size={13} />
                    <span>₹3,499 Credited to Wallet (12ms)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 9: Predictive Stockout Shield */}
            <div className="bento-card bento-card-stockout">
              <div className="bento-card-top-info">
                <div className="bento-app-pill stockout-pill">
                  <ShieldCheck size={12} /> Vendor App · Supply Chain
                </div>
                <h4 className="bento-card-heading">Predictive Stockout Shield</h4>
                <p className="bento-card-desc">
                  Atlas AI demand forecasting triggers automatic supplier purchase orders before fast-selling SKUs hit zero.
                </p>
              </div>

              {/* Creative Banner Artwork Box */}
              <div className="bento-artwork-box stockout-artwork">
                <div className="bento-card-banner-media tri">
                  <img src="/banners/feature-stockout-shield.jpg" alt="Predictive Stockout Shield" className="bento-card-banner-img" />
                  <div className="bento-banner-overlay compact">
                    <span className="bento-banner-badge amber">
                      <ShieldCheck size={11} /> Atlas AI Radar
                    </span>
                    <span className="bento-stat-inline">Depletion Velocity +34%</span>
                  </div>
                </div>

                <div className="bento-stockout-radar-mini">
                  <div className="bento-stockout-radar-row">
                    <span className="bsr-lbl">Weekend Peak Velocity:</span>
                    <strong className="bsr-val">+34% Depletion</strong>
                  </div>
                  <div className="bento-stockout-radar-row">
                    <span className="bsr-lbl">Auto Purchase Order:</span>
                    <strong className="bsr-po">PO #W-882 Queued</strong>
                  </div>
                  <div className="bento-stockout-badge">
                    <ShieldCheck size={12} />
                    <span>Buffer Protected · 14 Days Cover</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 10: Multi-Warehouse Geo-Routing */}
            <div className="bento-card bento-card-geo-routing">
              <div className="bento-card-top-info">
                <div className="bento-app-pill geo-pill">
                  <Warehouse size={12} /> Admin App · Logistics
                </div>
                <h4 className="bento-card-heading">Multi-Warehouse Geo-Routing</h4>
                <p className="bento-card-desc">
                  Dynamic planetary routing allocating customer orders to the nearest regional fulfillment center for 24h SLAs.
                </p>
              </div>

              {/* Creative Banner Artwork Box */}
              <div className="bento-artwork-box geo-routing-artwork">
                <div className="bento-card-banner-media tri">
                  <img src="/banners/feature-geo-routing.jpg" alt="Multi-Warehouse Geo-Routing" className="bento-card-banner-img" />
                  <div className="bento-banner-overlay compact">
                    <span className="bento-banner-badge blue">
                      <Warehouse size={11} /> 4 Regional Hubs
                    </span>
                    <span className="bento-stat-inline">24h Express SLA</span>
                  </div>
                </div>

                <div className="bento-geo-routes-mini">
                  <div className="bento-geo-hub-pill active">
                    <span className="bgh-dot active" />
                    <span>West Hub (Mumbai) · Allocated Depot [18h]</span>
                  </div>
                  <div className="bento-geo-hub-pill">
                    <span className="bgh-dot" />
                    <span>North, South &amp; Central Hubs · Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── ROW 5: TWO WIDE HERO BENTO CARDS (Darwin AI Copilot & Atlas SKU Studio) ── */}
          <div className="bento-grid-row-hero">
            {/* Card 11: Darwin AI Multimodal Shopping Copilot */}
            <div className="bento-card bento-card-darwin-ai">
              <div className="bento-card-top-info">
                <div className="bento-app-pill darwin-pill">
                  <Bot size={12} /> Customer App · Darwin AI
                </div>
                <h4 className="bento-card-heading">Darwin AI Multimodal Copilot &amp; Deal Optimizer</h4>
                <p className="bento-card-desc">
                  Context-aware conversational copilot that compares specifications, tracks historical coupon combinations, and suggests personalized cart bundles in real time.
                </p>
              </div>

              {/* Creative Banner Artwork Box */}
              <div className="bento-artwork-box darwin-ai-artwork">
                <div className="bento-card-banner-media bento-banner-hero darwin-media">
                  <img src="/banners/darwin_copilot_banner.jpg" alt="Darwin AI Shopping Assistant" className="bento-card-banner-img" />
                  <div className="bento-banner-overlay compact">
                    <span className="bento-banner-badge sky">
                      <Bot size={11} /> Darwin Copilot Active
                    </span>
                    <span className="bento-stat-inline">98.4% Match Score</span>
                  </div>
                </div>

                <div className="bento-darwin-prompt-strip">
                  <span className="bdp-icon"><Bot size={13} /></span>
                  <span className="bdp-text">"Find wireless ANC headphones under ₹15,000 with 40h battery"</span>
                  <span className="bdp-badge">LIVE QUERY</span>
                </div>

                <div className="bento-darwin-deals-row">
                  <div className="bento-deal-chip active">
                    <span className="bdc-name">Sony WH-CH720N ANC</span>
                    <div className="bdc-meta">
                      <span className="bdc-price">₹9,990</span>
                      <span className="bdc-match">99% Match</span>
                    </div>
                  </div>
                  <div className="bento-deal-chip">
                    <span className="bdc-name">Soundcore Life Q35</span>
                    <div className="bdc-meta">
                      <span className="bdc-price">₹7,999</span>
                      <span className="bdc-match">96% Match</span>
                    </div>
                  </div>
                </div>
                <div className="bento-darwin-savings-callout">
                  <Zap size={12} />
                  <span>Stacked Voucher Applied: Auto-saved ₹1,450 on recommended bundle</span>
                </div>
              </div>
            </div>

            {/* Card 12: Atlas AI Automated SKU Studio & Content Engine */}
            <div className="bento-card bento-card-atlas-studio">
              <div className="bento-card-top-info">
                <div className="bento-app-pill atlas-pill">
                  <Sparkles size={12} /> Vendor App · Atlas AI
                </div>
                <h4 className="bento-card-heading">Atlas AI Automated SKU Studio &amp; Content Engine</h4>
                <p className="bento-card-desc">
                  Autonomous catalog enrichment engine generating SEO-ranked titles, high-conversion bullet descriptions, and automatic attribute mapping in sub-50ms.
                </p>
              </div>

              {/* Creative Banner Artwork Box */}
              <div className="bento-artwork-box atlas-studio-artwork">
                <div className="bento-card-banner-media bento-banner-hero atlas-media">
                  <img src="/banners/marketing/vendor-banner.jpg" alt="Atlas AI SKU Studio" className="bento-card-banner-img" />
                  <div className="bento-banner-overlay compact">
                    <span className="bento-banner-badge amber">
                      <Sparkles size={11} /> Atlas Neural Engine
                    </span>
                    <span className="bento-stat-inline">&lt; 50ms Per SKU</span>
                  </div>
                </div>

                <div className="bento-atlas-pipeline-grid">
                  <div className="bento-atlas-chip">
                    <span className="bac-lbl">SEO Title Score</span>
                    <span className="bac-val">99/100 A+</span>
                    <span className="bac-sub">Keyword Optimized</span>
                  </div>
                  <div className="bento-atlas-chip">
                    <span className="bac-lbl">Bullet Specs</span>
                    <span className="bac-val">5 Attributes</span>
                    <span className="bac-sub">Zero Manual Input</span>
                  </div>
                  <div className="bento-atlas-chip">
                    <span className="bac-lbl">Taxonomy Match</span>
                    <span className="bac-val">100% Precision</span>
                    <span className="bac-sub">Audio &gt; Over-Ear</span>
                  </div>
                </div>

                <div className="bento-atlas-action-bar">
                  <span className="baa-stat">⚡ 120 SKUs Enriched in 4.2 seconds</span>
                  <span className="baa-tag">CATALOG SYNCED</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── ROW 6: THREE TRI-COLUMN BENTO CARDS (Autoship, Campaigns, Warranty Vault) ── */}
          <div className="bento-grid-row-three">
            {/* Card 13: Monthly Repeat Delivery & Autoship Replenishment */}
            <div className="bento-card bento-card-autoship">
              <div className="bento-card-top-info">
                <div className="bento-app-pill autoship-pill">
                  <Repeat size={12} /> Customer App · Autoship
                </div>
                <h4 className="bento-card-heading">Monthly Repeat Delivery &amp; Autoship</h4>
                <p className="bento-card-desc">
                  Scheduled recurring replenishment for household essentials and groceries with automated 10% subscriber savings and 1-tap skip.
                </p>
              </div>

              {/* Creative Banner Artwork Box */}
              <div className="bento-artwork-box autoship-artwork">
                <div className="bento-card-banner-media tri">
                  <img src="/banners/banner_home_nordic_hd.jpg" alt="Repeat Delivery Autoship" className="bento-card-banner-img" />
                  <div className="bento-banner-overlay compact">
                    <span className="bento-banner-badge teal">
                      <Repeat size={11} /> Autoship Active
                    </span>
                    <span className="bento-stat-inline">Next: 3 Days</span>
                  </div>
                </div>

                <div className="bento-autoship-mini">
                  <div className="bento-as-row">
                    <span className="bas-lbl">Replenishment Cadence:</span>
                    <span className="bas-badge">Every 30 Days</span>
                  </div>
                  <div className="bento-as-row">
                    <span className="bas-lbl">Active Bundle:</span>
                    <span className="bas-val">Organic Pantry Pack</span>
                  </div>
                  <div className="bento-as-savings">
                    <CheckCircle2 size={12} />
                    <span>Auto-Applied 10% Subscriber Discount (₹420 Saved)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 14: Dynamic Promotional Campaign & Coupon Engine */}
            <div className="bento-card bento-card-campaigns">
              <div className="bento-card-top-info">
                <div className="bento-app-pill campaigns-pill">
                  <Gift size={12} /> Admin App · Campaigns
                </div>
                <h4 className="bento-card-heading">Enterprise Promotion &amp; Coupon Engine</h4>
                <p className="bento-card-desc">
                  Rule-based marketing orchestrator with tiered voucher codes, dynamic user segmentation, and automated gross margin caps.
                </p>
              </div>

              {/* Creative Banner Artwork Box */}
              <div className="bento-artwork-box campaigns-artwork">
                <div className="bento-card-banner-media tri">
                  <img src="/banners/orders_hero_banner.jpg" alt="Promotion & Coupon Engine" className="bento-card-banner-img" />
                  <div className="bento-banner-overlay compact">
                    <span className="bento-banner-badge rose">
                      <Gift size={11} /> Coupon Matrix
                    </span>
                    <span className="bento-stat-inline">1,420 / hr</span>
                  </div>
                </div>

                <div className="bento-campaigns-mini">
                  <div className="bento-cmp-ticket">
                    <div className="bct-left">
                      <span className="bct-code">FESTIVE25</span>
                      <span className="bct-rule">Min Spend ₹1,999 · Active</span>
                    </div>
                    <span className="bct-pct">25% OFF</span>
                  </div>
                  <div className="bento-cmp-progress">
                    <div className="bcp-header">
                      <span>Redemption Budget</span>
                      <span>68% Consumed</span>
                    </div>
                    <div className="bcp-track">
                      <div className="bcp-fill" style={{ width: "68%" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 15: Tamper-Proof Digital Warranty & Claim Vault */}
            <div className="bento-card bento-card-warranty">
              <div className="bento-card-top-info">
                <div className="bento-app-pill warranty-pill">
                  <ShieldCheck size={12} /> Customer App · Protection
                </div>
                <h4 className="bento-card-heading">Tamper-Proof Digital Warranty Vault</h4>
                <p className="bento-card-desc">
                  Cryptographically signed warranty certificates stored in your customer vault with 1-tap claim filing and doorstep replacement.
                </p>
              </div>

              {/* Creative Banner Artwork Box */}
              <div className="bento-artwork-box warranty-artwork">
                <div className="bento-card-banner-media tri">
                  <img src="/banners/feature-return-vault.jpg" alt="Digital Warranty Vault" className="bento-card-banner-img" />
                  <div className="bento-banner-overlay compact">
                    <span className="bento-banner-badge emerald">
                      <ShieldCheck size={11} /> Verified Token
                    </span>
                    <span className="bento-stat-inline">582 Days Left</span>
                  </div>
                </div>

                <div className="bento-warranty-mini">
                  <div className="bento-wr-header">
                    <span className="bwr-id">#WRN-9902 · Sony WH-1000XM5</span>
                    <span className="bwr-tag">ACTIVE COVER</span>
                  </div>
                  <div className="bento-wr-validity">
                    <span className="bwv-lbl">Coverage Plan:</span>
                    <span className="bwv-val">2-Year Comprehensive Protection</span>
                  </div>
                  <div className="bento-wr-action">
                    <ShieldCheck size={12} />
                    <span>1-Tap Claim &amp; Instant Doorstep Swap Eligible</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Customer App Features Grid ── */}
        <div className="experience-block" id="customer-features">
          <div className="exp-block-header">
            <img src="/favicon.svg" alt="Customer App" className="exp-icon-img" />
            <div>
              <h3 className="exp-block-title">Customer App</h3>
              <p className="exp-block-desc">Smart shopping experience — from discovery to doorstep</p>
            </div>
          </div>
          <div className="exp-features-grid">
            <div className="exp-feature-card">
              <div className="exp-feat-icon blue"><Search size={18} /></div>
              <div className="exp-feat-text"><h4>Product Discovery</h4><p>Search, filters, categories & smart recommendations</p></div>
            </div>
            <div className="exp-feature-card">
              <div className="exp-feat-icon cyan"><Mic size={18} /></div>
              <div className="exp-feat-text"><h4>Voice & Visual Search</h4><p>Speak or snap a photo to find products instantly</p></div>
            </div>
            <div className="exp-feature-card">
              <div className="exp-feat-icon purple"><Bot size={18} /></div>
              <div className="exp-feat-text"><h4>AI Shopping Assistant</h4><p>Darwin AI helps you compare, decide & discover deals</p></div>
            </div>
            <div className="exp-feature-card">
              <div className="exp-feat-icon indigo"><Sliders size={18} /></div>
              <div className="exp-feat-text"><h4>Compare & Specs</h4><p>Side-by-side product comparison with full specifications</p></div>
            </div>
            <div className="exp-feature-card">
              <div className="exp-feat-icon green"><TrendingUp size={18} /></div>
              <div className="exp-feat-text"><h4>Price History Graph</h4><p>Track price trends over time before you buy</p></div>
            </div>
            <div className="exp-feature-card">
              <div className="exp-feat-icon rose"><Heart size={18} /></div>
              <div className="exp-feat-text"><h4>Wishlist</h4><p>Save favorites and get notified when prices drop</p></div>
            </div>
            <div className="exp-feature-card">
              <div className="exp-feat-icon amber"><ShoppingBag size={18} /></div>
              <div className="exp-feat-text"><h4>Cart & Checkout</h4><p>Seamless cart with coupons, wallet & multiple payment modes</p></div>
            </div>
            <div className="exp-feature-card">
              <div className="exp-feat-icon teal"><Users size={18} /></div>
              <div className="exp-feat-text"><h4>Shared & Family Cart</h4><p>Collaborate on a single cart with family members</p></div>
            </div>
            <div className="exp-feature-card">
              <div className="exp-feat-icon sky"><Repeat size={18} /></div>
              <div className="exp-feat-text"><h4>Monthly Repeat Delivery</h4><p>Schedule recurring orders for daily essentials</p></div>
            </div>
            <div className="exp-feature-card">
              <div className="exp-feat-icon purple"><Camera size={18} /></div>
              <div className="exp-feat-text"><h4>3D Avatar Try-On</h4><p>Virtual try-on with your personalised 3D avatar</p></div>
            </div>
            <div className="exp-feature-card">
              <div className="exp-feat-icon blue"><Truck size={18} /></div>
              <div className="exp-feat-text"><h4>Orders & Live Tracking</h4><p>Real-time order status with map-based delivery tracking</p></div>
            </div>
            <div className="exp-feature-card">
              <div className="exp-feat-icon orange"><RotateCcw size={18} /></div>
              <div className="exp-feat-text"><h4>Returns & Refunds</h4><p>Easy return requests with automatic wallet refunds</p></div>
            </div>
            <div className="exp-feature-card">
              <div className="exp-feat-icon green"><Wallet size={18} /></div>
              <div className="exp-feat-text"><h4>Wallet & Payments</h4><p>Recharge wallet, view transaction history & pay seamlessly</p></div>
            </div>
            <div className="exp-feature-card">
              <div className="exp-feat-icon amber"><Tag size={18} /></div>
              <div className="exp-feat-text"><h4>Coupons & Deals</h4><p>Apply coupons at checkout for instant discounts</p></div>
            </div>
            <div className="exp-feature-card">
              <div className="exp-feat-icon indigo"><ShieldCheck size={18} /></div>
              <div className="exp-feat-text"><h4>Warranty Vault</h4><p>Auto-store warranty cards & track claim eligibility</p></div>
            </div>
            <div className="exp-feature-card">
              <div className="exp-feat-icon cyan"><Star size={18} /></div>
              <div className="exp-feat-text"><h4>Reviews & Q&A</h4><p>Rate products and ask questions answered by the community</p></div>
            </div>
            <div className="exp-feature-card">
              <div className="exp-feat-icon rose"><Headphones size={18} /></div>
              <div className="exp-feat-text"><h4>Support Tickets</h4><p>Raise and track support issues with vendors or platform</p></div>
            </div>
            <div className="exp-feature-card">
              <div className="exp-feat-icon teal"><Bell size={18} /></div>
              <div className="exp-feat-text"><h4>Notifications</h4><p>Order updates, deals, price drops & delivery alerts</p></div>
            </div>
            <div className="exp-feature-card">
              <div className="exp-feat-icon sky"><MapPin size={18} /></div>
              <div className="exp-feat-text"><h4>Addresses & Hubs</h4><p>Manage delivery addresses and nearby pickup hubs</p></div>
            </div>
            <div className="exp-feature-card">
              <div className="exp-feat-icon lime"><CreditCard size={18} /></div>
              <div className="exp-feat-text"><h4>Payment Methods</h4><p>Save UPI, cards & bank accounts for faster checkout</p></div>
            </div>
          </div>
        </div>

        {/* ── Vendor App Features Grid ── */}
        <div className="experience-block" id="vendor-features">
          <div className="exp-block-header">
            <img src="/telegram-icon.svg" alt="Vendor App" className="exp-icon-img" />
            <div>
              <h3 className="exp-block-title">Vendor App</h3>
              <p className="exp-block-desc">Store & inventory operations — sell smarter, ship faster</p>
            </div>
          </div>
          <div className="exp-features-grid">
            <div className="exp-feature-card">
              <div className="exp-feat-icon amber"><LayoutDashboard size={18} /></div>
              <div className="exp-feat-text"><h4>Store Dashboard</h4><p>At-a-glance sales, orders & revenue analytics</p></div>
            </div>
            <div className="exp-feature-card">
              <div className="exp-feat-icon orange"><Package size={18} /></div>
              <div className="exp-feat-text"><h4>Product Management</h4><p>Create, edit products with images, prices, specs & stock</p></div>
            </div>
            <div className="exp-feature-card">
              <div className="exp-feat-icon blue"><Box size={18} /></div>
              <div className="exp-feat-text"><h4>Order Fulfillment</h4><p>Process, pack & ship orders with status tracking</p></div>
            </div>
            <div className="exp-feature-card">
              <div className="exp-feat-icon rose"><RotateCcw size={18} /></div>
              <div className="exp-feat-text"><h4>Returns & Warranty Claims</h4><p>Handle return requests, refunds & warranty processing</p></div>
            </div>
            <div className="exp-feature-card">
              <div className="exp-feat-icon green"><CreditCard size={18} /></div>
              <div className="exp-feat-text"><h4>Payouts & Settlements</h4><p>Track earnings, pending payouts & settlement history</p></div>
            </div>
            <div className="exp-feature-card">
              <div className="exp-feat-icon indigo"><BarChart3 size={18} /></div>
              <div className="exp-feat-text"><h4>Sales & Analytics</h4><p>Performance reports, top products & revenue trends</p></div>
            </div>
            <div className="exp-feature-card">
              <div className="exp-feat-icon red"><AlertTriangle size={18} /></div>
              <div className="exp-feat-text"><h4>Low-Stock Alerts</h4><p>Automated notifications when inventory runs low</p></div>
            </div>
            <div className="exp-feature-card">
              <div className="exp-feat-icon purple"><Bot size={18} /></div>
              <div className="exp-feat-text"><h4>AI Description Writer</h4><p>Atlas AI generates SEO-optimised product descriptions</p></div>
            </div>
            <div className="exp-feature-card">
              <div className="exp-feat-icon cyan"><Headphones size={18} /></div>
              <div className="exp-feat-text"><h4>Support Tickets</h4><p>Respond to customer queries and resolve issues</p></div>
            </div>
            <div className="exp-feature-card">
              <div className="exp-feat-icon teal"><Settings size={18} /></div>
              <div className="exp-feat-text"><h4>Store Settings</h4><p>Configure policies, shipping rules & store branding</p></div>
            </div>
          </div>
        </div>

        {/* ── Admin App Features Grid ── */}
        <div className="experience-block" id="admin-features">
          <div className="exp-block-header">
            <img src="/admin-favicon.png" alt="Admin App" className="exp-icon-img" />
            <div>
              <h3 className="exp-block-title">Admin App</h3>
              <p className="exp-block-desc">Platform control centre — govern, moderate & analyse</p>
            </div>
          </div>
          <div className="exp-features-grid">
            <div className="exp-feature-card">
              <div className="exp-feat-icon purple"><LayoutDashboard size={18} /></div>
              <div className="exp-feat-text"><h4>Platform Dashboard</h4><p>Unified metrics across users, orders, revenue & health</p></div>
            </div>
            <div className="exp-feature-card">
              <div className="exp-feat-icon indigo"><Users size={18} /></div>
              <div className="exp-feat-text"><h4>User Management</h4><p>Manage customers, vendors & admin accounts</p></div>
            </div>
            <div className="exp-feature-card">
              <div className="exp-feat-icon blue"><Lock size={18} /></div>
              <div className="exp-feat-text"><h4>Roles & Permissions</h4><p>Granular role-based access control for all users</p></div>
            </div>
            <div className="exp-feature-card">
              <div className="exp-feat-icon amber"><Layers size={18} /></div>
              <div className="exp-feat-text"><h4>Catalog & Categories</h4><p>Manage product catalog, categories & taxonomy</p></div>
            </div>
            <div className="exp-feature-card">
              <div className="exp-feat-icon cyan"><Image size={18} /></div>
              <div className="exp-feat-text"><h4>Banner & Promotions</h4><p>Create banners, coupons & promotional campaigns</p></div>
            </div>
            <div className="exp-feature-card">
              <div className="exp-feat-icon teal"><Warehouse size={18} /></div>
              <div className="exp-feat-text"><h4>Warehouses & Stock</h4><p>Multi-warehouse inventory with real-time stock sync</p></div>
            </div>
            <div className="exp-feature-card">
              <div className="exp-feat-icon green"><FileText size={18} /></div>
              <div className="exp-feat-text"><h4>Orders & Invoices</h4><p>Oversee all orders, invoices & payment settlements</p></div>
            </div>
            <div className="exp-feature-card">
              <div className="exp-feat-icon rose"><Wallet size={18} /></div>
              <div className="exp-feat-text"><h4>Payments & Refunds</h4><p>Monitor wallet transactions, refunds & payouts</p></div>
            </div>
            <div className="exp-feature-card">
              <div className="exp-feat-icon orange"><MessageSquare size={18} /></div>
              <div className="exp-feat-text"><h4>Review Moderation</h4><p>Moderate reviews, Q&A and community content</p></div>
            </div>
            <div className="exp-feature-card">
              <div className="exp-feat-icon sky"><Headphones size={18} /></div>
              <div className="exp-feat-text"><h4>Support Tickets</h4><p>Manage platform-wide support queue & escalations</p></div>
            </div>
            <div className="exp-feature-card">
              <div className="exp-feat-icon red"><Bell size={18} /></div>
              <div className="exp-feat-text"><h4>Notifications</h4><p>Push notifications & email campaigns to all users</p></div>
            </div>
            <div className="exp-feature-card">
              <div className="exp-feat-icon lime"><Activity size={18} /></div>
              <div className="exp-feat-text"><h4>Audit Logs</h4><p>Track all admin actions with full audit trail</p></div>
            </div>
          </div>
        </div>

        {/* ── Shared Platform Concepts ── */}
        <div className="shared-platform-banner">
          <div className="shared-banner-header">
            <div className="shared-icon-circle">
              <Globe size={22} />
            </div>
            <h3 className="shared-banner-title">Shared Platform Foundation</h3>
          </div>
          <div className="shared-features-grid">
            <div className="shared-feat-item"><Users size={15} /> Multi-role ecosystem</div>
            <div className="shared-feat-item"><RefreshCw size={15} /> Real-time inventory sync</div>
            <div className="shared-feat-item"><Lock size={15} /> Role-based authentication</div>
            <div className="shared-feat-item"><Bot size={15} /> AI Assistants (Darwin · Atlas · Titan)</div>
            <div className="shared-feat-item"><Bell size={15} /> Push notifications</div>
            <div className="shared-feat-item"><Warehouse size={15} /> Multi-warehouse network</div>
            <div className="shared-feat-item"><Wallet size={15} /> Payments, wallet & refunds</div>
            <div className="shared-feat-item"><Layers size={15} /> Structured product data</div>
            <div className="shared-feat-item"><BarChart3 size={15} /> Analytics & reporting</div>
            <div className="shared-feat-item"><Activity size={15} /> Audit & governance</div>
          </div>
        </div>
      </section>

      {/* =========================================================
          4. 3D EARTH ORBIT & PLANETARY LOGISTICS MESH
      ========================================================== */}
      <section className="apple-closer-look-section" id="closer-look">
        <div className="apple-section-header centered">
          <span className="apple-hero-eyebrow">GLOBAL COMMERCE NETWORK</span>
          <h2 className="apple-section-headline">Our global network in real-time orbit.</h2>
          <p className="apple-section-sub">
            Drag to rotate planet Earth with true 3D WebGL depth testing. Real-time planetary routing across international fulfillment hubs.
          </p>
        </div>

        {/* 3D Interactive Earth & Orbit Centerpiece */}
        <InteractiveEarth theme={theme} />
      </section>

      {/* =========================================================
          5. "MEET AI TRINITY" (Apple Intelligence Experience)
      ========================================================== */}
      <section className="apple-ai-intelligence-section" id="ai-trinity">
        <div className="apple-section-header centered">
          <span className="apple-hero-eyebrow" style={{ color: "#38bdf8" }}>
            INTELLIGENCE SUITE
          </span>
          <h2 className="apple-section-headline">
            Meet the AI Trinity. <br />
            Autonomous intelligence for every stakeholder.
          </h2>
          <p className="apple-section-sub">
            Three dedicated AI engines purpose-built for shoppers, merchants, and platform administrators.
          </p>
        </div>

        {/* Iridescent Apple Intelligence Prompt Simulator */}
        <div className="apple-intelligence-stage">
          {/* Iridescent Glowing Border */}
          <div className="apple-intelligence-iridescent-glow" />

          <div className="apple-prompt-box-inner">
            <div className="prompt-selector-pills">
              {AI_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`prompt-pill ${activeAiPrompt === idx ? "active" : ""}`}
                  onClick={() => setActiveAiPrompt(idx)}
                >
                  <Sparkles size={14} />
                  <span>“{p.prompt.slice(0, 32)}...”</span>
                </button>
              ))}
            </div>

            <div className="prompt-live-response-card">
              <div className="prompt-header">
                <span className="prompt-app-badge">{AI_PROMPTS[activeAiPrompt].app}</span>
                <span className="prompt-live-dot">● Neural Response Stream</span>
              </div>
              <p className="prompt-question">“{AI_PROMPTS[activeAiPrompt].prompt}”</p>
              <div className="prompt-answer">
                <Bot size={18} className="prompt-bot-icon" />
                <p>{AI_PROMPTS[activeAiPrompt].response}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 3 AI Trinity Cards with Circular Profile Avatars */}
        <div className="ai-trinity-grid apple-trinity-grid">
          {AI_TRINITY.map((ai) => (
            <div key={ai.id} className="ai-trinity-card apple-bento-card">
              <span
                className="ai-card-badge"
                style={{ background: ai.tagColor, color: ai.tagText }}
              >
                {ai.appTag}
              </span>

              {/* Circular Mascot Profile Avatar */}
              <div className="ai-mascot-avatar-wrapper">
                <img src={ai.mascotImg} alt={ai.name} className="ai-mascot-img" />
              </div>

              <h4>{ai.name}</h4>
              <div className="ai-role-title" style={{ color: ai.tagText }}>
                {ai.role}
              </div>
              <p className="ai-desc">{ai.desc}</p>

              <div className="ai-capabilities-list">
                {ai.capabilities.map((cap, capIdx) => (
                  <div key={capIdx} className="ai-cap-item">
                    <Check size={14} color={ai.tagText} />
                    <span>{cap}</span>
                  </div>
                ))}
              </div>

              {ai.isExternal ? (
                <a
                  href={ai.ctaLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ai-card-cta"
                  style={{ background: ai.btnBg || ai.tagText }}
                >
                  {ai.ctaText} <ExternalLink size={14} />
                </a>
              ) : (
                <Link
                  to={ai.ctaLink}
                  className="ai-card-cta"
                  style={{ background: ai.btnBg || ai.tagText }}
                >
                  {ai.ctaText} <ArrowRight size={14} />
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================
          6. AUTONOMOUS COMMERCE ARCHITECTURE (Click to Doorstep)
      ========================================================== */}
      <section className="apple-architecture-section" id="architecture">
        <div className="apple-section-header centered">
          <span className="apple-hero-eyebrow">AUTONOMOUS COMMERCE ARCHITECTURE</span>
          <h2 className="apple-section-headline">
            From Instant Checkout to Doorstep. <br />
            Four interconnected engines powering every order.
          </h2>
          <p className="apple-section-subhead">
            Our real-time platform orchestrates sub-15ms ledger settlements, intelligent multi-warehouse routing, WebSocket courier GPS streaming, and automated doorstep returns.
          </p>
        </div>

        {/* 4 Architectural Engines Bento Grid */}
        <div className="architecture-engines-grid">
          {/* Engine 1: Multi-Rail Payment & Double-Entry Ledger */}
          <div className="arch-engine-card arch-card-ledger">
            <div className="arch-card-header">
              <div className="arch-engine-badge badge-emerald">
                <Wallet size={15} />
                <span>Financial Ledger &amp; Escrow</span>
              </div>
              <span className="arch-telemetry-pill live">
                <span className="telemetry-live-dot" /> 14ms Settlement
              </span>
            </div>
            <h3 className="arch-engine-title">Sub-15ms Double-Entry Settlements</h3>
            <p className="arch-engine-desc">
              Real-time ledger balance reservations, zero-discrepancy escrow holds, and instant multi-rail settlements across Digital Wallet, UPI AutoPay, and Card rails.
            </p>

            {/* Micro-UI Artwork: Live Ledger */}
            <div className="arch-artwork-box arch-ledger-art">
              <div className="arch-ledger-topbar">
                <div className="arch-ledger-balance-box">
                  <span className="arch-ledger-lbl">Customer Wallet Balance</span>
                  <div className="arch-ledger-val">₹24,500.00</div>
                </div>
                <span className="arch-ledger-verified-chip">
                  <ShieldCheck size={13} /> Double-Entry Verified
                </span>
              </div>
              <div className="arch-ledger-stream">
                <div className="arch-ledger-row debit">
                  <div className="arch-row-left">
                    <span className="arch-direction-tag debit">DEBIT</span>
                    <div className="arch-row-info">
                      <span className="arch-row-name">Order #ORD-9821 Payment</span>
                      <span className="arch-row-sub">Instant Escrow Hold · 14ms latency</span>
                    </div>
                  </div>
                  <span className="arch-row-amount debit">-₹1,450.00</span>
                </div>
                <div className="arch-ledger-row credit">
                  <div className="arch-row-left">
                    <span className="arch-direction-tag credit">CREDIT</span>
                    <div className="arch-row-info">
                      <span className="arch-row-name">Auto Cancellation Refund</span>
                      <span className="arch-row-sub">Returned to Digital Wallet · Instant</span>
                    </div>
                  </div>
                  <span className="arch-row-amount credit">+₹899.00</span>
                </div>
              </div>
              <div className="arch-ledger-footer">
                <span>⚡ Sub-15ms Latency</span>
                <span>🔒 Escrow Locked</span>
                <span>✓ RBI &amp; PCI-DSS Compliant</span>
              </div>
            </div>
          </div>

          {/* Engine 2: Planetary Multi-Warehouse Geo-Routing */}
          <div className="arch-engine-card arch-card-logistics">
            <div className="arch-card-header">
              <div className="arch-engine-badge badge-cyan">
                <Warehouse size={15} />
                <span>Geo-Logistics &amp; Fulfillment</span>
              </div>
              <span className="arch-telemetry-pill">
                <Activity size={12} /> 4 Regional Hubs
              </span>
            </div>
            <h3 className="arch-engine-title">Dynamic Regional Hub Geo-Allocation</h3>
            <p className="arch-engine-desc">
              Algorithmic dispatch assigns customer orders to the geographically optimal regional distribution center to guarantee 24-hour SLAs and cut transit times.
            </p>

            {/* Micro-UI Artwork: 4 Regional Hubs Matrix */}
            <div className="arch-artwork-box arch-logistics-art">
              <div className="arch-hubs-grid">
                <div className="arch-hub-node active-route">
                  <div className="arch-hub-top">
                    <span className="arch-hub-pin active" />
                    <strong>West Hub · Mumbai</strong>
                  </div>
                  <span className="arch-hub-status active">Allocated Depot · 18h SLA</span>
                </div>
                <div className="arch-hub-node">
                  <div className="arch-hub-top">
                    <span className="arch-hub-pin" />
                    <strong>North Hub · Delhi NCR</strong>
                  </div>
                  <span className="arch-hub-status">Active · 98.4% Capacity</span>
                </div>
                <div className="arch-hub-node">
                  <div className="arch-hub-top">
                    <span className="arch-hub-pin" />
                    <strong>South Hub · Bengaluru</strong>
                  </div>
                  <span className="arch-hub-status">Active · Instant Dispatch</span>
                </div>
                <div className="arch-hub-node">
                  <div className="arch-hub-top">
                    <span className="arch-hub-pin" />
                    <strong>Central Hub · Hyderabad</strong>
                  </div>
                  <span className="arch-hub-status">Active · Buffer Depot</span>
                </div>
              </div>
              <div className="arch-route-telemetry-bar">
                <div className="arch-route-path">
                  <span>Customer (Pune)</span>
                  <span className="arch-route-arrow">➔</span>
                  <span className="arch-route-target">West Hub [142 km]</span>
                </div>
                <span className="arch-route-sla">24h Express SLA Guaranteed</span>
              </div>
            </div>
          </div>

          {/* Engine 3: WebSocket Live Courier Telemetry */}
          <div className="arch-engine-card arch-card-telemetry">
            <div className="arch-card-header">
              <div className="arch-engine-badge badge-amber">
                <Truck size={15} />
                <span>Live Satellite Radar</span>
              </div>
              <span className="arch-telemetry-pill live">
                <span className="telemetry-live-dot" /> WebSocket 1Hz
              </span>
            </div>
            <h3 className="arch-engine-title">Sub-Second Courier GPS Streaming</h3>
            <p className="arch-engine-desc">
              Persistent WebSocket channels stream rider coordinates, dynamic traffic-adjusted ETAs, milestone state machines, and cryptographically verified OTP doorstep handovers.
            </p>

            {/* Micro-UI Artwork: Stepped Radar & Rider Tracker */}
            <div className="arch-artwork-box arch-radar-art">
              <div className="arch-rider-banner">
                <div className="arch-rider-info">
                  <div className="arch-rider-avatar">
                    <Truck size={16} />
                  </div>
                  <div>
                    <div className="arch-rider-name">Rider: Rajesh K. • 4.9★</div>
                    <div className="arch-rider-sub">Courier ID #RD-4402 · Electric EV</div>
                  </div>
                </div>
                <span className="arch-rider-state-pill">
                  <span className="telemetry-live-dot" /> Out for Delivery
                </span>
              </div>

              {/* Progress Milestones */}
              <div className="arch-milestone-rail">
                <div className="arch-step-dot done">
                  <CheckCircle2 size={12} />
                  <span>09:45 Packed</span>
                </div>
                <div className="arch-step-line done" />
                <div className="arch-step-dot done">
                  <CheckCircle2 size={12} />
                  <span>10:15 Dispatched</span>
                </div>
                <div className="arch-step-line active" />
                <div className="arch-step-dot active">
                  <span className="pulse-dot-inner" />
                  <span>10:30 Near You (1.2 km)</span>
                </div>
              </div>

              <div className="arch-radar-metrics">
                <span>🛰️ GPS: 18.5204° N, 73.8567° E</span>
                <span>⚡ Speed: 26 km/h</span>
                <span>🔒 OTP Doorstep Handover</span>
              </div>
            </div>
          </div>

          {/* Engine 4: Doorstep Return Vault & Warranty Shield */}
          <div className="arch-engine-card arch-card-return">
            <div className="arch-card-header">
              <div className="arch-engine-badge badge-purple">
                <RotateCcw size={15} />
                <span>Post-Purchase Governance</span>
              </div>
              <span className="arch-telemetry-pill">
                <ShieldCheck size={12} /> 1-Tap Protocol
              </span>
            </div>
            <h3 className="arch-engine-title">Doorstep QR Validation &amp; Instant Refund</h3>
            <p className="arch-engine-desc">
              Frictionless 1-tap customer returns with courier doorstep inspection, cryptographic QR scanning, and immediate wallet refund crediting in under 15 milliseconds.
            </p>

            {/* Micro-UI Artwork: Return Vault Stepped Execution */}
            <div className="arch-artwork-box arch-return-art">
              <div className="arch-return-topbar">
                <div>
                  <span className="arch-ret-id">Return Ticket #RET-8841</span>
                  <div className="arch-ret-prod">Apple Watch Ultra 2 · GPS + Cellular</div>
                </div>
                <span className="arch-ret-amount">₹89,900.00</span>
              </div>

              <div className="arch-return-steps">
                <div className="arch-ret-step completed">
                  <CheckCircle2 size={14} className="ret-step-ico done" />
                  <div className="ret-step-txt">
                    <strong>1-Tap Pickup Scheduled</strong>
                    <span>Doorstep pickup confirmed by regional hub</span>
                  </div>
                </div>
                <div className="arch-ret-step completed">
                  <CheckCircle2 size={14} className="ret-step-ico done" />
                  <div className="ret-step-txt">
                    <strong>Courier Doorstep QR Validated</strong>
                    <span>Item inspected &amp; sealed by courier agent</span>
                  </div>
                </div>
                <div className="arch-ret-step active">
                  <Zap size={14} className="ret-step-ico active" />
                  <div className="ret-step-txt">
                    <strong>₹89,900 Credited to Digital Wallet</strong>
                    <span className="ret-instant-stamp">Processed in 12ms · Available for 1-click checkout</span>
                  </div>
                </div>
              </div>

              <div className="arch-warranty-badge">
                <ShieldCheck size={14} />
                <span>Tamper-Proof Warranty Vault Active · 365 Days Guaranteed Protection</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          7. CLEAN 3D ISOMETRIC BANNER CAROUSEL (Text Blended Direct to Image)
      ========================================================== */}
      <section className="home-banner-section" id="banners">
        <div className="home-section-header">
          <div className="home-badge-pill">
            <Gift size={14} /> Curated Collections
          </div>
          <h2 className="home-section-title">
            Simple, Creative, High-Definition Showcase
          </h2>
          <p className="home-section-subtitle">
            Curated category showcases featuring clean 3D isometric designs with seamless typography.
          </p>
        </div>

        <div
          className="home-banner-carousel"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="home-banner-slides-track">
            {BANNER_SLIDES.map((slide, idx) => (
              <div
                key={slide.id}
                className={`banner-slide-item ${idx === currentSlide ? "active-slide" : ""}`}
                style={{ display: idx === currentSlide ? "block" : "none" }}
              >
                <div className="banner-slide-wrapper">
                  <img src={slide.image} alt={slide.title} className="banner-slide-img" />

                  {/* Direct Text on Banner (Zero Extra Card, Seamless Blend) */}
                  <div className="banner-caption-blend">
                    <span
                      className="banner-blend-pill"
                      style={{
                        background: slide.pillColor,
                        border: `1px solid ${slide.pillBorder}`,
                        color: slide.pillText
                      }}
                    >
                      {slide.tag}
                    </span>
                    <h3 className="banner-blend-title">{slide.title}</h3>
                    <p className="banner-blend-desc">{slide.desc}</p>

                    <div className="banner-blend-bullets">
                      {slide.bullets.map((b, bIdx) => (
                        <div key={bIdx} className="banner-blend-bullet-item">
                          <CheckCircle2 size={13} color={slide.pillText} />
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>

                    <div className="banner-blend-actions">
                      <Link to="/customer/login" className="banner-blend-btn-primary">
                        Shop Now <ArrowRight size={15} />
                      </Link>
                      <Link to="/customer/login" className="banner-blend-btn-glass">
                        Browse Catalog
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Carousel Arrows */}
          <button
            type="button"
            className="banner-arrow-btn banner-arrow-left"
            onClick={prevSlide}
            aria-label="Previous Slide"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            className="banner-arrow-btn banner-arrow-right"
            onClick={nextSlide}
            aria-label="Next Slide"
          >
            <ChevronRight size={20} />
          </button>

          {/* Slide Indicator Dots */}
          <div className="banner-dots-wrapper">
            {BANNER_SLIDES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`banner-dot ${idx === currentSlide ? "active" : ""}`}
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          8. FLASH COUPONS & PROMOTIONS
      ========================================================== */}
      <section className="home-promotions-section" id="promotions">
        <div className="home-section-header">
          <div className="home-badge-pill">
            <Zap size={14} /> Flash Deals
          </div>
          <h2 className="home-section-title">
            Exclusive Launch Vouchers
          </h2>
          <p className="home-section-subtitle">
            Copy voucher codes instantly and apply during checkout in your digital wallet.
          </p>
        </div>

        <div className="coupons-grid">
          {COUPONS_DATA.map((coupon) => (
            <div key={coupon.code} className="home-voucher-ticket-card coupon-ticket-card apple-bento-card">
              <div className="coupon-top">
                <span className="coupon-discount">{coupon.discount}</span>
                <span className="coupon-min">Min: {coupon.minOrder}</span>
              </div>
              <h4 className="coupon-title">{coupon.title}</h4>
              <p className="coupon-desc">{coupon.desc}</p>
              <div className="coupon-bottom">
                <div className="coupon-code-pill">
                  <code>{coupon.code}</code>
                </div>
                <button
                  type="button"
                  className={`coupon-copy-btn ${copiedCoupon === coupon.code ? "copied" : ""}`}
                  onClick={() => handleCopyCoupon(coupon.code)}
                  aria-label={`Copy coupon code ${coupon.code}`}
                >
                  {copiedCoupon === coupon.code ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedCoupon === coupon.code ? "Copied!" : "Copy Code"}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================
          9. APPLE-STYLE NUMBERED FOOTNOTES & GLOBAL SITEMAP FOOTER
      ========================================================== */}
      <footer className="apple-global-footer">
        <div className="apple-footnotes-container">
          <ol className="apple-footnotes-list">
            <li>
              Instant 24-Hour Express Fulfillment applies to catalog items stocked in regional warehouse distribution hubs. Milestone tracking updates occur automatically via high-throughput WebSockets.
            </li>
            <li>
              Darwin AI, Atlas AI, and Titan AI are autonomous multi-tenant intelligence systems. Vision match scanner accuracy and prompt responses may vary based on photo clarity and query complexity.
            </li>
            <li>
              Sub-second digital wallet settlements and UPI debit integrations require verified customer KYC and supported domestic card networks.
            </li>
            <li>
              Platform transaction latency, fulfillment milestones, and benchmark calculations are based on comparative test runs against standard monolithic ERP and legacy e-commerce stacks.
            </li>
          </ol>
        </div>

        <div className="apple-footer-directory-grid">
          <div className="footer-col">
            <h5>Explore Ecosystem</h5>
            <Link to="/customer/login">Shopper Portal</Link>
            <Link to="/vendor/login">Vendor Hub</Link>
            <a href="https://inventoryadmin24.vercel.app" target="_blank" rel="noopener noreferrer">
              Admin Governance
            </a>
            <a href="#dual-showcase">Dual Experience</a>
            <a href="#closer-look">3D Earth Centerpiece</a>
          </div>

          <div className="footer-col">
            <h5>AI Trinity</h5>
            <a href="#ai-trinity">Darwin AI Copilot</a>
            <a href="#ai-trinity">Atlas Supply Chain</a>
            <a href="#ai-trinity">Titan Platform Guard</a>
            <a href="#architecture">Commerce Engine</a>
          </div>

          <div className="footer-col">
            <h5>Account &amp; Wallet</h5>
            <Link to="/customer/login">Digital Wallet</Link>
            <Link to="/customer/login">Flash Vouchers</Link>
            <Link to="/customer/login">Order Milestones</Link>
            <Link to="/vendor/login">Merchant Payouts</Link>
          </div>

          <div className="footer-col">
            <h5>Platform Principles</h5>
            <span>Privacy &amp; Security</span>
            <span>Tamper-Proof Audit</span>
            <span>Low-Latency Cloud</span>
            <span>Sustainability</span>
          </div>
        </div>

        <div className="apple-footer-bottom">
          <p>© 2026 Inventory Platform. All rights reserved.</p>
          <div className="apple-footer-legal-links">
            <a href="#overview">Privacy Policy</a>
            <a href="#overview">Terms of Service</a>
            <a href="#overview">Sales Policy</a>
            <a href="#overview">Legal &amp; Patents</a>
          </div>
        </div>
      </footer>
    </div>
  );
}