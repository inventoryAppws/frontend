import { useState, useEffect, useCallback } from "react";
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
  Smartphone,
  Box,
  RefreshCw,
  Layers,
  TrendingUp,
  Users,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Award,
  Wallet,
  Mic,
  Camera,
  Heart,
  BarChart3,
  Clock,
  MapPin,
  Lock
} from "lucide-react";
import "./Home.css";

// Marketing Banner Slides Data
const BANNER_SLIDES = [
  {
    id: "slide-1",
    tag: "AI COMMERCE ECOSYSTEM",
    pillColor: "rgba(56, 189, 248, 0.2)",
    pillBorder: "rgba(56, 189, 248, 0.4)",
    pillText: "#38bdf8",
    title: "Next-Gen Intelligent Multi-App Commerce",
    desc: "Unifying consumer shopping, multi-warehouse vendor fulfillment, and central administrative governance into a single hyper-fast, real-time ecosystem.",
    image: "/banners/marketing/hero-banner.jpg",
    bullets: ["Darwin AI Assistant", "Sub-100ms Search", "Multi-Tenant Hub"]
  },
  {
    id: "slide-2",
    tag: "CONSUMER SUPERSTORE",
    pillColor: "rgba(236, 72, 153, 0.2)",
    pillBorder: "rgba(236, 72, 153, 0.4)",
    pillText: "#f472b6",
    title: "Shop Smarter with AI Vision & Instant Discounts",
    desc: "Point your camera to find instant product matches, claim dynamic vouchers up to 50% off, and enjoy 1-click checkout with in-app digital wallet.",
    image: "/banners/marketing/customer-banner.jpg",
    bullets: ["AI Camera & Voice Search", "Instant Coupons", "Shared Carts & 3D Fitting"]
  },
  {
    id: "slide-3",
    tag: "VENDOR LOGISTICS & SUPPLY CHAIN",
    pillColor: "rgba(16, 185, 129, 0.2)",
    pillBorder: "rgba(16, 185, 129, 0.4)",
    pillText: "#34d399",
    title: "Multi-Warehouse Automated Inventory Dispatch",
    desc: "Live inventory stock matrix, smart low-stock threshold triggers, automated delivery drone coordination, and real-time vendor profit settlements.",
    image: "/banners/marketing/vendor-banner.jpg",
    bullets: ["Auto Stock Alerts", "Multi-Hub Routing", "Ticket Resolution Center"]
  },
  {
    id: "slide-4",
    tag: "ENTERPRISE ADMIN COMMAND",
    pillColor: "rgba(139, 92, 246, 0.2)",
    pillBorder: "rgba(139, 92, 246, 0.4)",
    pillText: "#c084fc",
    title: "Central Executive Operations & Security Governance",
    desc: "Full administrative oversight of platform GMV, automated vendor KYC validation, dynamic coupon campaigns, and dual-attribution audit logs.",
    image: "/banners/banner-group-3.png",
    bullets: ["Real-Time Analytics", "Coupon Engine", "Audit Health & RBAC"]
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
    code: "SUPER20",
    discount: "20% OFF",
    title: "Electronics & Gadgets",
    desc: "Save 20% on top electronics, audio gear, and smart accessories.",
    minOrder: "₹999"
  },
  {
    code: "FREESHIP",
    discount: "FREE SHIP",
    title: "Zero Delivery Fee",
    desc: "Enjoy zero shipping cost with priority express dispatch to your door.",
    minOrder: "₹499"
  },
  {
    code: "CASHBACK15",
    discount: "15% BACK",
    title: "Wallet Cashback",
    desc: "Get 15% instant cashback credited to your wallet on repeat deliveries.",
    minOrder: "₹599"
  }
];

function Home() {
  const [activeTab, setActiveTab] = useState("customer");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [copiedCoupon, setCopiedCoupon] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Handle scroll for navbar blur
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-advance banner slides
  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % BANNER_SLIDES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isHovered]);

  // Copy coupon handler
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

  return (
    <div className="home-root">
      {/* Aurora Glow Effects */}
      <div className="home-aurora-glow-top"></div>
      <div className="home-aurora-glow-mid"></div>
      <div className="home-grid-pattern"></div>

      {/* Copy Toast Alert */}
      {copiedCoupon && (
        <div className="coupon-toast">
          ✓ Copied coupon code <strong>{copiedCoupon}</strong>!
        </div>
      )}

      {/* =========================================================
          1. FLOATING GLASSMORPHIC NAVBAR
      ========================================================== */}
      <div className="home-nav-wrapper">
        <header className={`home-navbar ${isScrolled ? "scrolled" : ""}`}>
          <Link to="/" className="home-brand">
            <img src="/favicon.svg" alt="Inventory Earth" className="home-brand-earth-icon" />
            <span className="home-brand-text">Inventory</span>
            <span className="home-brand-tag">v2.0</span>
          </Link>

          <nav className="home-nav-links">
            <a href="#overview">Overview</a>
            <a href="#ecosystem">Ecosystem</a>
            <a href="#promotions">Promotions</a>
            <a href="#features">Features</a>
            <a href="#workflow">Workflow</a>
          </nav>

          <div className="home-nav-actions">
            <Link to="/customer/login" className="home-btn-nav-login">
              Customer Sign In
            </Link>
            <Link to="/vendor/login" className="home-btn-nav-vendor">
              <Store size={15} /> Vendor Portal
            </Link>
            <a
              href="http://localhost:5174"
              target="_blank"
              rel="noopener noreferrer"
              className="home-btn-nav-admin"
              title="Open Admin Portal"
            >
              <Shield size={15} /> Admin Portal
            </a>
          </div>
        </header>
      </div>

      {/* =========================================================
          2. HERO SECTION & FLOATING DOODLES
      ========================================================== */}
      <section className="home-hero-section" id="overview">
        {/* Animated Floating Doodles */}
        <div className="home-doodle doodle-1">
          <span className="doodle-icon">🌍</span> Global Earth Network
        </div>
        <div className="home-doodle doodle-2">
          <span className="doodle-icon">⚡</span> Sub-100ms AI Search
        </div>
        <div className="home-doodle doodle-3">
          <span className="doodle-icon">🎁</span> Up to 50% Flash Coupons
        </div>
        <div className="home-doodle doodle-4">
          <span className="doodle-icon">🛡️</span> Enterprise RBAC
        </div>

        {/* Live Announcement Badge */}
        <div className="home-hero-badge">
          <span className="home-pulse-dot"></span>
          Next-Gen Unified Commerce Platform • Supercharged by Darwin AI
        </div>

        {/* Main Title */}
        <h1 className="home-hero-title">
          The Intelligent Commerce &amp;{" "}
          <span className="gradient-text">Inventory Ecosystem.</span>
        </h1>

        <p className="home-hero-subtitle">
          Experience frictionless consumer shopping, multi-warehouse vendor fulfillment,
          and enterprise administrative governance—powered by multimodal AI and real-time logistics.
        </p>

        {/* Primary Action Buttons */}
        <div className="home-hero-actions">
          <Link to="/customer/register" className="home-btn-primary-glow">
            <ShoppingBag size={18} /> Start Shopping as Customer <ArrowRight size={18} />
          </Link>
          <Link to="/vendor/register" className="home-btn-secondary-glass">
            <Store size={18} /> Become a Verified Vendor
          </Link>
          <a
            href="http://localhost:5174"
            target="_blank"
            rel="noopener noreferrer"
            className="home-btn-admin-glass"
          >
            <Shield size={18} /> Launch Admin Portal <ExternalLink size={14} />
          </a>
        </div>

        {/* Trust Stats Ribbon */}
        <div className="home-stats-ribbon">
          <div className="stat-item">
            <span className="stat-number">6,020+</span>
            <span className="stat-label">Verified Products in Catalog</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">99.98%</span>
            <span className="stat-label">Automated Dispatch Accuracy</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">&lt; 85ms</span>
            <span className="stat-label">Darwin AI Inference Latency</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">3-in-1</span>
            <span className="stat-label">Unified Multi-Role Architecture</span>
          </div>
        </div>
      </section>

      {/* =========================================================
          3. MARKETING BANNER SLIDER (Visual Highlights Across 3 Apps)
      ========================================================== */}
      <section className="home-slider-section" id="ecosystem">
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <span className="home-section-tag">FEATURE SHOWCASE</span>
          <h2 className="home-section-title">One Platform. Three Powerful Portals.</h2>
          <p className="home-section-subtitle" style={{ margin: "0 auto" }}>
            Explore how our unified architecture connects shoppers, merchants, and operations in real-time.
          </p>
        </div>

        <div
          className="home-banner-carousel"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {BANNER_SLIDES.map((slide, idx) => (
            <div
              key={slide.id}
              className="banner-slide-wrapper"
              style={{ display: idx === currentSlide ? "block" : "none" }}
            >
              <img src={slide.image} alt={slide.title} className="banner-slide-img" />
              <div className="banner-overlay">
                <span
                  className="banner-pill"
                  style={{
                    background: slide.pillColor,
                    borderColor: slide.pillBorder,
                    color: slide.pillText
                  }}
                >
                  {slide.tag}
                </span>
                <h3 className="banner-title">{slide.title}</h3>
                <p className="banner-desc">{slide.desc}</p>
                <div className="banner-bullets">
                  {slide.bullets.map((b, bIdx) => (
                    <span key={bIdx} className="banner-bullet-item">
                      <CheckCircle2 size={15} color={slide.pillText} /> {b}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Navigation Controls */}
          <button
            type="button"
            className="slider-nav-btn slider-prev"
            onClick={prevSlide}
            aria-label="Previous Slide"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            className="slider-nav-btn slider-next"
            onClick={nextSlide}
            aria-label="Next Slide"
          >
            <ChevronRight size={22} />
          </button>

          {/* Bullet Indicators */}
          <div className="slider-dots">
            {BANNER_SLIDES.map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                className={`slider-dot ${dotIdx === currentSlide ? "active" : ""}`}
                onClick={() => setCurrentSlide(dotIdx)}
                aria-label={`Go to slide ${dotIdx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          4. INTERACTIVE 3-IN-1 PLATFORM SHOWCASE WINDOW
      ========================================================== */}
      <section className="home-showcase-section">
        <div className="showcase-window">
          {/* Top Bar with Mac Dots & App Tabs */}
          <div className="showcase-topbar">
            <div className="window-dots">
              <span className="w-dot w-red"></span>
              <span className="w-dot w-yellow"></span>
              <span className="w-dot w-green"></span>
            </div>

            <div className="showcase-tab-buttons">
              <button
                type="button"
                className={`tab-btn ${activeTab === "customer" ? "active" : ""}`}
                onClick={() => setActiveTab("customer")}
              >
                <ShoppingBag size={15} /> 1. Customer Store
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === "vendor" ? "active" : ""}`}
                onClick={() => setActiveTab("vendor")}
              >
                <Store size={15} /> 2. Vendor Portal
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === "admin" ? "active" : ""}`}
                onClick={() => setActiveTab("admin")}
              >
                <Shield size={15} /> 3. Admin Portal
              </button>
            </div>

            <div className="window-badge-status">
              <span className="home-pulse-dot" style={{ width: "6px", height: "6px" }}></span>
              Live Sync
            </div>
          </div>

          {/* Interactive Window Body */}
          <div className="showcase-body">
            {activeTab === "customer" && (
              <div className="tab-content-grid">
                <div className="tab-info-side">
                  <h3>Shopper Delight: Multimodal AI &amp; Instant Cart</h3>
                  <p>
                    Browse thousands of live items with conversational AI, image visual search,
                    flash discount vouchers, and sub-second one-click checkout.
                  </p>
                  <div className="tab-feature-list">
                    <div className="tab-feature-item">
                      <Camera size={18} />
                      <span><strong>AI Vision Scanner:</strong> Snap an image to find identical products instantly</span>
                    </div>
                    <div className="tab-feature-item">
                      <Wallet size={18} />
                      <span><strong>Digital Wallet:</strong> Instant recharge, 1-click debit, and instant refund credits</span>
                    </div>
                    <div className="tab-feature-item">
                      <MapPin size={18} />
                      <span><strong>Geo-Milestone Tracking:</strong> Live interactive map with real-time courier timeline</span>
                    </div>
                  </div>
                  <Link to="/customer/login" className="home-btn-primary-glow" style={{ padding: "10px 22px", fontSize: "13px" }}>
                    Explore Customer Portal <ArrowRight size={15} />
                  </Link>
                </div>

                <div className="tab-interactive-preview">
                  <div className="mockup-header-bar">
                    <div className="mockup-search-box">
                      <Search size={14} />
                      <span>Wireless Active Noise Cancelling Headphones</span>
                      <Mic size={14} style={{ marginLeft: "auto", color: "#38bdf8" }} />
                    </div>
                    <span style={{ fontSize: "12px", color: "#10b981", fontWeight: "700" }}>In Stock</span>
                  </div>

                  <div className="mockup-metrics-row">
                    <div className="mockup-metric-card">
                      <small>Wallet Balance</small>
                      <strong style={{ color: "#38bdf8" }}>₹2,450.00</strong>
                    </div>
                    <div className="mockup-metric-card">
                      <small>Active Cart</small>
                      <strong style={{ color: "#f59e0b" }}>3 Items</strong>
                    </div>
                    <div className="mockup-metric-card">
                      <small>Saved Rewards</small>
                      <strong style={{ color: "#10b981" }}>₹420 Saved</strong>
                    </div>
                  </div>

                  <div style={{ background: "rgba(30, 41, 59, 0.5)", padding: "14px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "42px", height: "42px", borderRadius: "8px", background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Gift size={22} color="#ffffff" />
                      </div>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: "700", color: "#ffffff" }}>Sony WH-1000XM5</div>
                        <div style={{ fontSize: "11px", color: "#94a3b8" }}>Coupon WELCOME10 applied (-₹1,499)</div>
                      </div>
                    </div>
                    <span style={{ fontSize: "15px", fontWeight: "800", color: "#ffffff" }}>₹24,999</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "vendor" && (
              <div className="tab-content-grid">
                <div className="tab-info-side">
                  <h3>Merchant Command: Inventory Matrix &amp; Multi-Hub Fulfillment</h3>
                  <p>
                    Manage product catalogs, automated stock reorders, multi-tier warehouse routing,
                    and financial settlement reconciliations in one streamlined dashboard.
                  </p>
                  <div className="tab-feature-list">
                    <div className="tab-feature-item">
                      <Layers size={18} />
                      <span><strong>Stock Threshold Alerts:</strong> Automatic amber warnings when items hit reorder point</span>
                    </div>
                    <div className="tab-feature-item">
                      <Truck size={18} />
                      <span><strong>Warehouse Hubs:</strong> Automated routing from the closest regional dispatch center</span>
                    </div>
                    <div className="tab-feature-item">
                      <TrendingUp size={18} />
                      <span><strong>Margin Analytics:</strong> Live profit margins, daily revenue, and payout statements</span>
                    </div>
                  </div>
                  <Link to="/vendor/login" className="home-btn-secondary-glass" style={{ padding: "10px 22px", fontSize: "13px" }}>
                    Launch Vendor Hub <ArrowRight size={15} />
                  </Link>
                </div>

                <div className="tab-interactive-preview">
                  <div className="mockup-header-bar">
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "#ffffff" }}>
                      Bengaluru Regional Warehouse Hub #1
                    </div>
                    <span style={{ fontSize: "11px", color: "#10b981", background: "rgba(16, 185, 129, 0.15)", padding: "3px 8px", borderRadius: "999px" }}>
                      Active
                    </span>
                  </div>

                  <div className="mockup-metrics-row">
                    <div className="mockup-metric-card">
                      <small>Weekly Revenue</small>
                      <strong style={{ color: "#38bdf8" }}>₹4,85,200</strong>
                    </div>
                    <div className="mockup-metric-card">
                      <small>Pending Orders</small>
                      <strong style={{ color: "#f59e0b" }}>14 Orders</strong>
                    </div>
                    <div className="mockup-metric-card">
                      <small>Catalog Stock</small>
                      <strong style={{ color: "#10b981" }}>128 SKUs</strong>
                    </div>
                  </div>

                  <div className="mockup-chart-visual">
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94a3b8" }}>
                      <span>7-Day Sales Volume</span>
                      <span style={{ color: "#38bdf8" }}>+18.4% WoW</span>
                    </div>
                    <div className="mockup-chart-bars">
                      <span style={{ height: "45%" }}></span>
                      <span style={{ height: "65%" }}></span>
                      <span style={{ height: "55%" }}></span>
                      <span style={{ height: "85%" }}></span>
                      <span style={{ height: "70%" }}></span>
                      <span style={{ height: "95%" }}></span>
                      <span style={{ height: "80%" }}></span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "admin" && (
              <div className="tab-content-grid">
                <div className="tab-info-side">
                  <h3>Executive Governance: Platform Health, KYC &amp; Campaigns</h3>
                  <p>
                    Full centralized control across the entire super app network. Monitor total gross
                    merchandise value (GMV), approve vendor applications, and launch global discount codes.
                  </p>
                  <div className="tab-feature-list">
                    <div className="tab-feature-item">
                      <Shield size={18} />
                      <span><strong>Role-Based Access (RBAC):</strong> Granular permissions with tamper-proof security</span>
                    </div>
                    <div className="tab-feature-item">
                      <Gift size={18} />
                      <span><strong>Coupon Engine:</strong> Dynamic campaign builder with minimum order rules &amp; caps</span>
                    </div>
                    <div className="tab-feature-item">
                      <Clock size={18} />
                      <span><strong>Automated Crons:</strong> Background jobs for scheduled payouts, emails, and syncs</span>
                    </div>
                  </div>
                  <a
                    href="http://localhost:5174"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="home-btn-admin-glass"
                    style={{ padding: "10px 22px", fontSize: "13px" }}
                  >
                    Open Admin Portal <ExternalLink size={14} />
                  </a>
                </div>

                <div className="tab-interactive-preview">
                  <div className="mockup-header-bar">
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "#ffffff" }}>
                      Executive Command Console
                    </div>
                    <span style={{ fontSize: "11px", color: "#c084fc", background: "rgba(192, 132, 252, 0.15)", padding: "3px 8px", borderRadius: "999px" }}>
                      Super Admin
                    </span>
                  </div>

                  <div className="mockup-metrics-row">
                    <div className="mockup-metric-card">
                      <small>Platform GMV</small>
                      <strong style={{ color: "#c084fc" }}>₹18.4 Lakhs</strong>
                    </div>
                    <div className="mockup-metric-card">
                      <small>Active Vendors</small>
                      <strong style={{ color: "#38bdf8" }}>24 Verified</strong>
                    </div>
                    <div className="mockup-metric-card">
                      <small>System Health</small>
                      <strong style={{ color: "#10b981" }}>100% Uptime</strong>
                    </div>
                  </div>

                  <div style={{ background: "rgba(30, 41, 59, 0.5)", padding: "14px", borderRadius: "10px" }}>
                    <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "8px" }}>Live Microservice Status:</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "12px" }}>
                      <span style={{ color: "#10b981" }}>● MongoDB Atlas: Healthy</span>
                      <span style={{ color: "#10b981" }}>● Groq/Cerebras: Active</span>
                      <span style={{ color: "#10b981" }}>● SMTP Schedulers: Running</span>
                      <span style={{ color: "#10b981" }}>● Render API: 200 OK</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================
          5. ACTIVE PROMOTIONS & VOUCHERS SECTION
      ========================================================== */}
      <section className="home-coupons-section" id="promotions">
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <span className="home-section-tag">LIMITED TIME OFFERS</span>
          <h2 className="home-section-title">🔥 Active Flash Deals &amp; Platform Coupons</h2>
          <p className="home-section-subtitle" style={{ margin: "0 auto" }}>
            Click to copy any exclusive voucher code below and enter it at checkout for instant savings.
          </p>
        </div>

        <div className="coupon-grid">
          {COUPONS_DATA.map((coupon) => (
            <div key={coupon.code} className="coupon-card">
              <div>
                <div className="coupon-badge-discount">{coupon.discount}</div>
                <h4 className="coupon-title">{coupon.title}</h4>
                <p className="coupon-desc">{coupon.desc}</p>
                <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "14px" }}>
                  Min order: {coupon.minOrder}
                </div>
              </div>

              <div className="coupon-action-row">
                <span className="coupon-code">{coupon.code}</span>
                <button
                  type="button"
                  className="btn-copy-code"
                  onClick={() => handleCopyCoupon(coupon.code)}
                >
                  <Copy size={13} style={{ display: "inline", marginRight: "4px" }} />
                  {copiedCoupon === coupon.code ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================
          6. DEEP-DIVE FEATURE PILLARS (Across All 3 Apps)
      ========================================================== */}
      <section className="home-features-section" id="features">
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <span className="home-section-tag">BUILT FOR SCALE</span>
          <h2 className="home-section-title">Engineered with State-of-the-Art Tech</h2>
          <p className="home-section-subtitle" style={{ margin: "0 auto" }}>
            Every component is crafted for hyper-responsive speed, frictionless checkout, and reliable supply chains.
          </p>
        </div>

        <div className="features-grid">
          {/* Feature 1 */}
          <div className="feature-pillar-card">
            <div className="pillar-icon-box" style={{ background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8" }}>
              <Sparkles size={26} />
            </div>
            <h4>Darwin AI &amp; Vision Scanner</h4>
            <p>
              Multimodal conversational assistant powered by Cerebras &amp; Groq LPU inference.
              Ask natural questions, speak hands-free, or snap camera photos for instant visual matches.
            </p>
            <span className="pillar-tag">Customer Portal</span>
          </div>

          {/* Feature 2 */}
          <div className="feature-pillar-card">
            <div className="pillar-icon-box" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
              <Wallet size={26} />
            </div>
            <h4>Multi-Rail Checkout &amp; Wallet</h4>
            <p>
              Pre-loaded digital wallet, UPI, cards, and net banking with sub-second processing.
              Automated refunds credit back instantly without multi-day bank waiting periods.
            </p>
            <span className="pillar-tag">Fintech Engine</span>
          </div>

          {/* Feature 3 */}
          <div className="feature-pillar-card">
            <div className="pillar-icon-box" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}>
              <Truck size={26} />
            </div>
            <h4>Multi-Warehouse Geo-Logistics</h4>
            <p>
              Intelligent order dispatch from nearest regional distribution hubs.
              Interactive Leaflet maps with real-time driver coordinates and delivery milestone tracking.
            </p>
            <span className="pillar-tag">Supply Chain</span>
          </div>

          {/* Feature 4 */}
          <div className="feature-pillar-card">
            <div className="pillar-icon-box" style={{ background: "rgba(139, 92, 246, 0.15)", color: "#8b5cf6" }}>
              <RefreshCw size={26} />
            </div>
            <h4>Repeat Subscriptions &amp; Price History</h4>
            <p>
              Automated periodic re-order deliveries for household essentials.
              Interactive 30-day price history charts and automated alerts whenever an item drops in price.
            </p>
            <span className="pillar-tag">Automation</span>
          </div>

          {/* Feature 5 */}
          <div className="feature-pillar-card">
            <div className="pillar-icon-box" style={{ background: "rgba(236, 72, 153, 0.15)", color: "#ec4899" }}>
              <Box size={26} />
            </div>
            <h4>3D Avatar Try-On &amp; Warranty Vault</h4>
            <p>
              Interactive 3D avatar sizing fitting room using Three.js.
              Encrypted digital warranty vault storing purchase certificates, invoices, and automated RMA return claims.
            </p>
            <span className="pillar-tag">Customer Care</span>
          </div>

          {/* Feature 6 */}
          <div className="feature-pillar-card">
            <div className="pillar-icon-box" style={{ background: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" }}>
              <Shield size={26} />
            </div>
            <h4>Enterprise Admin &amp; Security Audits</h4>
            <p>
              Platform-wide GMV analytics, vendor verification approvals, coupon marketing campaign rules,
              and dual-attribution Git traceability for rock-solid security.
            </p>
            <span className="pillar-tag">Admin Portal</span>
          </div>
        </div>
      </section>

      {/* =========================================================
          7. ECOSYSTEM WORKFLOW (How It Works Pipeline)
      ========================================================== */}
      <section className="home-workflow-section" id="workflow">
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <span className="home-section-tag">UNIFIED PIPELINE</span>
          <h2 className="home-section-title">How the Ecosystem Operates in Harmony</h2>
          <p className="home-section-subtitle" style={{ margin: "0 auto" }}>
            Watch how a customer purchase synchronizes instantly across vendor fulfillment and admin oversight.
          </p>
        </div>

        <div className="workflow-steps-grid">
          <div className="workflow-step-card">
            <div className="step-num-badge">1</div>
            <h5>Discover &amp; Discount</h5>
            <p>Customer searches via Darwin AI, snaps a camera photo, and applies flash coupon codes.</p>
          </div>

          <div className="workflow-step-card">
            <div className="step-num-badge">2</div>
            <h5>Instant Wallet Payment</h5>
            <p>Order is funded securely via in-app wallet or UPI with instant fraud detection checks.</p>
          </div>

          <div className="workflow-step-card">
            <div className="step-num-badge">3</div>
            <h5>Smart Warehouse Dispatch</h5>
            <p>Nearest regional hub receives the ticket, packs the item, and updates real-time tracking.</p>
          </div>

          <div className="workflow-step-card">
            <div className="step-num-badge">4</div>
            <h5>Automated Settlement</h5>
            <p>Admin engine reconciles transaction fees, credits vendor earnings, and awards loyalty points.</p>
          </div>
        </div>
      </section>

      {/* =========================================================
          8. BENCHMARK CTA CARD & COMPREHENSIVE FOOTER
      ========================================================== */}
      <section className="home-cta-section">
        <div className="home-cta-card">
          <h2>Step Into the Next Era of Unified Commerce.</h2>
          <p>
            Join thousands of shoppers enjoying intelligent AI discovery and verified vendors
            scaling multi-warehouse operations with complete operational transparency.
          </p>

          <div className="home-cta-actions">
            <Link to="/customer/register" className="home-btn-primary-glow">
              <ShoppingBag size={18} /> Create Customer Account
            </Link>
            <Link to="/vendor/register" className="home-btn-secondary-glass">
              <Store size={18} /> Register as Vendor
            </Link>
            <a
              href="http://localhost:5174"
              target="_blank"
              rel="noopener noreferrer"
              className="home-btn-admin-glass"
            >
              <Shield size={18} /> Open Admin Portal
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-inner">
          <div className="footer-brand-col">
            <Link to="/" className="home-brand">
              <img src="/favicon.svg" alt="Inventory Earth" className="home-brand-earth-icon" />
              <span className="home-brand-text">Inventory</span>
              <span className="home-brand-tag">Platform</span>
            </Link>
            <p>
              The unified intelligent commerce and inventory management ecosystem connecting consumers,
              merchants, and operations worldwide.
            </p>
            <div className="footer-status-pill">
              <span className="home-pulse-dot"></span>
              All Systems Operational (MongoDB &amp; AI Cloud)
            </div>
          </div>

          <div className="footer-col">
            <h6>Portals</h6>
            <ul>
              <li><Link to="/customer/login">Customer Superstore</Link></li>
              <li><Link to="/customer/register">Create Shopper Account</Link></li>
              <li><Link to="/vendor/login">Vendor Merchant Hub</Link></li>
              <li><Link to="/vendor/register">Vendor Onboarding</Link></li>
              <li><a href="http://localhost:5174" target="_blank" rel="noopener noreferrer">Admin Portal</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h6>AI &amp; Innovations</h6>
            <ul>
              <li><a href="#overview">Darwin AI Assistant</a></li>
              <li><a href="#features">AI Camera Vision Scanner</a></li>
              <li><a href="#features">Leaflet Live Order Maps</a></li>
              <li><a href="#features">3D Virtual Avatar Fitting</a></li>
              <li><a href="#features">Digital Warranty Vault</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h6>Governance</h6>
            <ul>
              <li><a href="#promotions">Active Coupons &amp; Campaigns</a></li>
              <li><a href="#workflow">Supply Chain Logistics</a></li>
              <li><a href="#ecosystem">Warehouse Geo-Hubs</a></li>
              <li><a href="#features">Multi-Rail Payments &amp; UPI</a></li>
              <li><a href="#workflow">Security &amp; RBAC Policies</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} Inventory Management Platform. All rights reserved.</span>
          <span>Dual Attribution: Jyothisai karumajji &amp; anusha maram</span>
        </div>
      </footer>
    </div>
  );
}

export default Home;