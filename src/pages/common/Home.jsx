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
  Layers,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
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
  Clock,
  Check,
  RefreshCw,
  Box
} from "lucide-react";
import InteractiveEarth from "../../components/InteractiveEarth";
import "./Home.css";

// Natural Realistic HD Banner Slides (Using in-store natural HD photography + approved hero banner)
const BANNER_SLIDES = [
  {
    id: "slide-1",
    tag: "AI COMMERCE ECOSYSTEM",
    pillColor: "rgba(56, 189, 248, 0.18)",
    pillBorder: "rgba(56, 189, 248, 0.4)",
    pillText: "#0284c7",
    title: "Next-Gen Intelligent Multi-App Commerce",
    desc: "Unifying consumer shopping, multi-warehouse vendor fulfillment, and central administrative governance into a single hyper-fast, real-time ecosystem.",
    image: "/banners/marketing/hero-banner.jpg",
    bullets: ["AI Trinity (Darwin, Atlas, Titan)", "6,000+ Verified SKUs", "Live Warehouse Geo-Routing"]
  },
  {
    id: "slide-2",
    tag: "CONSUMER STOREFRONT",
    pillColor: "rgba(244, 63, 94, 0.18)",
    pillBorder: "rgba(244, 63, 94, 0.4)",
    pillText: "#e11d48",
    title: "Vibrant Shopping Built for Modern Lifestyles",
    desc: "Experience frictionless commerce with Darwin AI visual search, instant wallet payments, and live milestone order tracking directly to your doorstep.",
    image: "/banners/marketing/customer-banner.jpg",
    bullets: ["Darwin Camera Vision Search", "Instant Digital Wallet Checkout", "Guaranteed 7-Day Easy Returns"]
  },
  {
    id: "slide-3",
    tag: "VENDOR SUPPLY CHAIN",
    pillColor: "rgba(16, 185, 129, 0.18)",
    pillBorder: "rgba(16, 185, 129, 0.4)",
    pillText: "#059669",
    title: "Empowering Merchants Across Regional Distribution Hubs",
    desc: "Atlas AI monitors stock depletion, triggers automated reordering alerts, and coordinates multi-warehouse logistics with transparent settlements.",
    image: "/banners/marketing/vendor-banner.jpg",
    bullets: ["Atlas Stock Depletion Forecaster", "Automated Threshold Reorders", "Zero Upfront Merchant Commission"]
  },
  {
    id: "slide-4",
    tag: "SMART TECH & AUDIO",
    pillColor: "rgba(139, 92, 246, 0.18)",
    pillBorder: "rgba(139, 92, 246, 0.4)",
    pillText: "#7c3aed",
    title: "Upgrade to Smarter Living: Premium Electronics",
    desc: "Experience cutting-edge consumer gadgets, wireless audio accessories, and smart home appliances backed by verified vendor warranties.",
    image: "/banners/banner-slide-4.jpg",
    bullets: ["Digital Warranty Vault", "Tested & Certified Hardware", "Sub-Second Wallet Debit"]
  },
  {
    id: "slide-5",
    tag: "HANDPICKED SELECTIONS",
    pillColor: "rgba(6, 182, 212, 0.18)",
    pillBorder: "rgba(6, 182, 212, 0.4)",
    pillText: "#0891b2",
    title: "Great Products, Great Prices from Verified Merchants",
    desc: "Shop curated quality essentials directly from trusted suppliers across regional hubs, offering guaranteed authenticity and instant dispatch.",
    image: "/banners/banner-slide-1.jpg",
    bullets: ["Multi-Vendor Collections", "Free Express Delivery", "No-Hassle 7-Day Returns"]
  },
  {
    id: "slide-6",
    tag: "FAST FULFILLMENT",
    pillColor: "rgba(245, 158, 11, 0.18)",
    pillBorder: "rgba(245, 158, 11, 0.4)",
    pillText: "#d97706",
    title: "Instant Multi-Warehouse Express Delivery",
    desc: "Automated routing connects your shopping cart to the nearest regional distribution hub for ultra-fast milestone-tracked fulfillment.",
    image: "/banners/orders_hero_banner.jpg",
    bullets: ["Live Milestone Maps", "Automated Dispatch", "Real-Time Tracking"]
  },
  {
    id: "slide-7",
    tag: "FASHION & APPAREL",
    pillColor: "rgba(236, 72, 153, 0.18)",
    pillBorder: "rgba(236, 72, 153, 0.4)",
    pillText: "#db2777",
    title: "Style for Every You: Fresh Seasonal Trends",
    desc: "Discover premium apparel and lifestyle essentials with virtual 3D avatar try-on sizing, price history tracking, and automated discount coupons.",
    image: "/banners/banner-slide-3.jpg",
    bullets: ["3D Avatar Virtual Fitting", "30-Day Price Drop Alerts", "Shared Friend Carts"]
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

// AI Trinity Data (Darwin, Atlas, Titan)
const AI_TRINITY = [
  {
    id: "darwin",
    name: "Darwin AI",
    mascotImg: "/darwin-mascot.png",
    appTag: "Customer App",
    tagColor: "rgba(56, 189, 248, 0.15)",
    tagText: "#0284c7",
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
    mascotImg: "/atlas-mascot.png",
    appTag: "Vendor Portal",
    tagColor: "rgba(16, 185, 129, 0.15)",
    tagText: "#059669",
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
    mascotImg: "/titan-mascot.png",
    appTag: "Admin Portal",
    tagColor: "rgba(139, 92, 246, 0.15)",
    tagText: "#7c3aed",
    role: "Platform Governance & Security",
    desc: "Titan monitors system-wide gross merchandise value (GMV), conducts automated KYC risk verification for new vendors, audits background cron jobs, and detects anomalies.",
    capabilities: [
      "Platform-Wide GMV & Sales Intelligence",
      "Automated Vendor KYC & Risk Verification",
      "Tamper-Proof Audit & Security Checks",
      "Dynamic Marketing Campaign Builder"
    ],
    ctaText: "Open Titan Admin Console",
    ctaLink: "http://localhost:5174",
    isExternal: true
  }
];

function Home() {
  // Theme state: default to 'light'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("inventory_home_theme") || "light";
  });

  // Perspective state: 'shopper' vs 'vendor'
  const [perspective, setPerspective] = useState("shopper");

  // Tab state for 3-in-1 showcase
  const [activeTab, setActiveTab] = useState("customer");

  // Banner carousel state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [copiedCoupon, setCopiedCoupon] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Sync theme with localStorage
  useEffect(() => {
    localStorage.setItem("inventory_home_theme", theme);
  }, [theme]);

  // Toggle theme handler
  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Handle scroll for sticky navbar
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
    }, 5500);
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
    <div className="home-root" data-theme={theme}>
      {/* Aurora Mesh Ambient Lighting */}
      <div className="home-aurora-glow-top"></div>
      <div className="home-grid-pattern"></div>

      {/* Copy Toast Alert */}
      {copiedCoupon && (
        <div className="coupon-toast">
          ✓ Copied coupon code <strong>{copiedCoupon}</strong>!
        </div>
      )}

      {/* =========================================================
          1. FLOATING STICKY NAVBAR (With Theme Switcher)
      ========================================================== */}
      <div className="home-nav-wrapper">
        <header className={`home-navbar ${isScrolled ? "scrolled" : ""}`}>
          <Link to="/" className="home-brand">
            <img src="/favicon.svg" alt="Inventory Earth" className="home-brand-earth-icon" />
            <span className="home-brand-text">Inventory</span>
            <span className="home-brand-tag">Ecosystem</span>
          </Link>

          <nav className="home-nav-links">
            <a href="#overview">Overview</a>
            <a href="#ai-trinity">AI Trinity</a>
            <a href="#banners">Showcase</a>
            <a href="#platform-demo">Live Demo</a>
            <a href="#promotions">Deals</a>
            <a href="#features">Features</a>
          </nav>

          <div className="home-nav-actions">
            {/* Theme Toggle Button (Light/Dark) */}
            <button
              type="button"
              className="home-theme-toggle"
              onClick={toggleTheme}
              title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
              aria-label="Toggle theme"
            >
              {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
            </button>

            <Link to="/customer/login" className="home-btn-nav-login">
              Shopper Sign In
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
          2. HERO SECTION & DUAL PERSPECTIVE SWITCHER
      ========================================================== */}
      <section className="home-hero-section" id="overview">
        {/* Dual Perspective Switcher */}
        <div className="home-perspective-container">
          <div className="home-perspective-switch">
            <button
              type="button"
              className={`perspective-btn ${perspective === "shopper" ? "active" : ""}`}
              onClick={() => setPerspective("shopper")}
            >
              <ShoppingBag size={15} /> For Shoppers &amp; Consumers
            </button>
            <button
              type="button"
              className={`perspective-btn ${perspective === "vendor" ? "active" : ""}`}
              onClick={() => setPerspective("vendor")}
            >
              <Store size={15} /> For Vendors &amp; Merchants
            </button>
          </div>
        </div>

        {/* Dynamic Badge & Headlines based on Perspective */}
        {perspective === "shopper" ? (
          <>
            <div className="home-hero-badge">
              <span className="home-pulse-dot"></span>
              Consumer Experience • Powered by Darwin AI &amp; Instant Digital Wallet
            </div>
            <h1 className="home-hero-title">
              Smart Shopping, Visual Discovery &amp;{" "}
              <span className="gradient-text">Instant Savings.</span>
            </h1>
            <p className="home-hero-subtitle">
              Browse 6,000+ handpicked products from verified regional merchants. Use camera visual search,
              unlock instant coupon vouchers, and check out in 1 click with zero bank waiting times.
            </p>
            <div className="home-hero-actions">
              <Link to="/customer/register" className="home-btn-primary-glow">
                <ShoppingBag size={18} /> Start Shopping Now <ArrowRight size={18} />
              </Link>
              <Link to="/customer/login" className="home-btn-secondary-glass">
                Existing Shopper Login
              </Link>
              <a
                href="http://localhost:5174"
                target="_blank"
                rel="noopener noreferrer"
                className="home-btn-admin-glass"
              >
                <Shield size={18} /> Admin Portal <ExternalLink size={14} />
              </a>
            </div>
          </>
        ) : (
          <>
            <div className="home-hero-badge">
              <span className="home-pulse-dot"></span>
              Merchant Intelligence • Powered by Atlas AI &amp; Multi-Hub Logistics
            </div>
            <h1 className="home-hero-title">
              Automate Your Supply Chain &amp;{" "}
              <span className="gradient-text">Multiply Your Revenue.</span>
            </h1>
            <p className="home-hero-subtitle">
              Publish products to thousands of active buyers with zero setup fees. Atlas AI forecasts stock depletion,
              manages multi-warehouse dispatch, and delivers transparent margin settlements.
            </p>
            <div className="home-hero-actions">
              <Link to="/vendor/register" className="home-btn-primary-glow">
                <Store size={18} /> Register as Merchant <ArrowRight size={18} />
              </Link>
              <Link to="/vendor/login" className="home-btn-secondary-glass">
                Vendor Dashboard Login
              </Link>
              <a
                href="http://localhost:5174"
                target="_blank"
                rel="noopener noreferrer"
                className="home-btn-admin-glass"
              >
                <Shield size={18} /> Admin Portal <ExternalLink size={14} />
              </a>
            </div>
          </>
        )}

        {/* =========================================================
            3D INTERACTIVE EARTH CORE SPOTLIGHT
            (Full WebGL 3D Earth, Orbiting Cart, Metric Cards & Doodles)
        ========================================================== */}
        <InteractiveEarth theme={theme} />

        {/* Perspective Feature Highlights */}
        {perspective === "shopper" ? (
          <div className="home-perspective-features">
            <div className="perspective-card">
              <div className="perspective-card-icon" style={{ background: "rgba(56, 189, 248, 0.15)", color: "#0284c7" }}>
                <Camera size={20} />
              </div>
              <h5>Darwin AI Visual Scanner</h5>
              <p>Point your smartphone camera to find exact or similar items in seconds.</p>
            </div>
            <div className="perspective-card">
              <div className="perspective-card-icon" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#059669" }}>
                <Wallet size={20} />
              </div>
              <h5>Instant Digital Wallet</h5>
              <p>Preload balance, get 1-click checkout, and enjoy instant refund returns.</p>
            </div>
            <div className="perspective-card">
              <div className="perspective-card-icon" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#d97706" }}>
                <TrendingUp size={20} />
              </div>
              <h5>Price History &amp; Alerts</h5>
              <p>Track 30-day price trends and receive instant alerts when items drop in price.</p>
            </div>
            <div className="perspective-card">
              <div className="perspective-card-icon" style={{ background: "rgba(139, 92, 246, 0.15)", color: "#7c3aed" }}>
                <MapPin size={20} />
              </div>
              <h5>Live Geo-Milestones</h5>
              <p>Interactive Leaflet map showing real-time courier dispatch progress.</p>
            </div>
          </div>
        ) : (
          <div className="home-perspective-features">
            <div className="perspective-card">
              <div className="perspective-card-icon" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#059669" }}>
                <BarChart3 size={20} />
              </div>
              <h5>Atlas Demand Forecasts</h5>
              <p>Predict stock run-out dates before inventory hits critical zero.</p>
            </div>
            <div className="perspective-card">
              <div className="perspective-card-icon" style={{ background: "rgba(56, 189, 248, 0.15)", color: "#0284c7" }}>
                <Truck size={20} />
              </div>
              <h5>Multi-Warehouse Routing</h5>
              <p>Automatic order dispatch from the nearest regional fulfillment center.</p>
            </div>
            <div className="perspective-card">
              <div className="perspective-card-icon" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#d97706" }}>
                <Zap size={20} />
              </div>
              <h5>Instant Low-Stock Triggers</h5>
              <p>Real-time amber badges alert your team when SKUs drop below safety stock.</p>
            </div>
            <div className="perspective-card">
              <div className="perspective-card-icon" style={{ background: "rgba(139, 92, 246, 0.15)", color: "#7c3aed" }}>
                <CheckCircle2 size={20} />
              </div>
              <h5>Automated Margin Payouts</h5>
              <p>Reconcile platform sales, compute profit margins, and withdraw earnings.</p>
            </div>
          </div>
        )}
      </section>

      {/* =========================================================
          3. THE AI TRINITY SHOWCASE (Darwin, Atlas & Titan)
      ========================================================== */}
      <section className="home-ai-trinity-section" id="ai-trinity">
        <div style={{ textAlign: "center", marginBottom: "35px" }}>
          <span className="home-section-tag">INTELLIGENCE ARCHITECTURE</span>
          <h2 className="home-section-title">Meet the AI Trinity: Darwin, Atlas &amp; Titan</h2>
          <p className="home-section-subtitle" style={{ margin: "0 auto" }}>
            Three specialized artificial intelligence models engineered to empower consumers,
            accelerate merchants, and protect platform operations.
          </p>
        </div>

        <div className="ai-trinity-grid">
          {AI_TRINITY.map((ai) => (
            <div key={ai.id} className="ai-trinity-card">
              <span
                className="ai-card-badge"
                style={{ background: ai.tagColor, color: ai.tagText }}
              >
                {ai.appTag}
              </span>

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
                  className="ai-trinity-link"
                  style={{ background: ai.tagColor, color: ai.tagText }}
                >
                  {ai.ctaText} <ExternalLink size={14} />
                </a>
              ) : (
                <Link
                  to={ai.ctaLink}
                  className="ai-trinity-link"
                  style={{ background: ai.tagColor, color: ai.tagText }}
                >
                  {ai.ctaText} <ArrowRight size={14} />
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================
          4. BANNER SLIDESHOW (Zero Blacklight Dimming)
      ========================================================== */}
      <section className="home-slider-section" id="banners">
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <span className="home-section-tag">CURATED PROMOTIONS</span>
          <h2 className="home-section-title">Explore Store Collections &amp; Seasonal Campaigns</h2>
          <p className="home-section-subtitle" style={{ margin: "0 auto" }}>
            High-definition photographic highlights from our active multi-vendor catalog without dimming.
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
              {/* Crisp natural HD image with NO dimming filter */}
              <img src={slide.image} alt={slide.title} className="banner-slide-img" />

              {/* Floating Frosted Glass Content Card (Theme-Adaptive, Never Dim) */}
              <div className="banner-content-card">
                <span
                  className="banner-pill"
                  style={{
                    background: slide.pillColor,
                    border: `1px solid ${slide.pillBorder}`,
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
                      <CheckCircle2 size={14} color={slide.pillText} /> {b}
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
            aria-label="Previous Banner"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            className="slider-nav-btn slider-next"
            onClick={nextSlide}
            aria-label="Next Banner"
          >
            <ChevronRight size={22} />
          </button>

          {/* Indicator Dots */}
          <div className="slider-dots">
            {BANNER_SLIDES.map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                className={`slider-dot ${dotIdx === currentSlide ? "active" : ""}`}
                onClick={() => setCurrentSlide(dotIdx)}
                aria-label={`Slide ${dotIdx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          5. INTERACTIVE 3-IN-1 PLATFORM SHOWCASE
      ========================================================== */}
      <section className="home-showcase-section" id="platform-demo">
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <span className="home-section-tag">LIVE INTERACTION</span>
          <h2 className="home-section-title">Test Drive the Three Portals</h2>
          <p className="home-section-subtitle" style={{ margin: "0 auto" }}>
            Click each tab below to preview live features across Shopper, Merchant, and Admin environments.
          </p>
        </div>

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
                <ShoppingBag size={15} /> 1. Shopper Store
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === "vendor" ? "active" : ""}`}
                onClick={() => setActiveTab("vendor")}
              >
                <Store size={15} /> 2. Vendor Hub
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === "admin" ? "active" : ""}`}
                onClick={() => setActiveTab("admin")}
              >
                <Shield size={15} /> 3. Admin Command
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
                      <Mic size={14} style={{ marginLeft: "auto", color: "#0284c7" }} />
                    </div>
                    <span style={{ fontSize: "12px", color: "#10b981", fontWeight: "700" }}>In Stock</span>
                  </div>

                  <div className="mockup-metrics-row">
                    <div className="mockup-metric-card">
                      <small>Wallet Balance</small>
                      <strong style={{ color: "#0284c7" }}>₹2,450.00</strong>
                    </div>
                    <div className="mockup-metric-card">
                      <small>Active Cart</small>
                      <strong style={{ color: "#d97706" }}>3 Items</strong>
                    </div>
                    <div className="mockup-metric-card">
                      <small>Saved Rewards</small>
                      <strong style={{ color: "#10b981" }}>₹420 Saved</strong>
                    </div>
                  </div>

                  <div style={{ background: "var(--home-surface)", padding: "14px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid var(--home-border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "42px", height: "42px", borderRadius: "8px", background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Gift size={22} color="#ffffff" />
                      </div>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--home-text-primary)" }}>Sony WH-1000XM5</div>
                        <div style={{ fontSize: "11px", color: "var(--home-text-muted)" }}>Coupon WELCOME10 applied (-₹1,499)</div>
                      </div>
                    </div>
                    <span style={{ fontSize: "15px", fontWeight: "800", color: "var(--home-text-primary)" }}>₹24,999</span>
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
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--home-text-primary)" }}>
                      Bengaluru Regional Warehouse Hub #1
                    </div>
                    <span style={{ fontSize: "11px", color: "#10b981", background: "rgba(16, 185, 129, 0.15)", padding: "3px 8px", borderRadius: "999px" }}>
                      Active
                    </span>
                  </div>

                  <div className="mockup-metrics-row">
                    <div className="mockup-metric-card">
                      <small>Weekly Revenue</small>
                      <strong style={{ color: "#0284c7" }}>₹4,85,200</strong>
                    </div>
                    <div className="mockup-metric-card">
                      <small>Pending Orders</small>
                      <strong style={{ color: "#d97706" }}>14 Orders</strong>
                    </div>
                    <div className="mockup-metric-card">
                      <small>Catalog Stock</small>
                      <strong style={{ color: "#10b981" }}>128 SKUs</strong>
                    </div>
                  </div>

                  <div className="mockup-chart-visual">
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--home-text-muted)" }}>
                      <span>7-Day Sales Volume</span>
                      <span style={{ color: "#0284c7" }}>+18.4% WoW</span>
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
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--home-text-primary)" }}>
                      Executive Command Console
                    </div>
                    <span style={{ fontSize: "11px", color: "#7c3aed", background: "rgba(139, 92, 246, 0.15)", padding: "3px 8px", borderRadius: "999px" }}>
                      Super Admin
                    </span>
                  </div>

                  <div className="mockup-metrics-row">
                    <div className="mockup-metric-card">
                      <small>Platform GMV</small>
                      <strong style={{ color: "#7c3aed" }}>₹18.4 Lakhs</strong>
                    </div>
                    <div className="mockup-metric-card">
                      <small>Active Vendors</small>
                      <strong style={{ color: "#0284c7" }}>24 Verified</strong>
                    </div>
                    <div className="mockup-metric-card">
                      <small>System Health</small>
                      <strong style={{ color: "#10b981" }}>100% Uptime</strong>
                    </div>
                  </div>

                  <div style={{ background: "var(--home-surface)", padding: "14px", borderRadius: "10px", border: "1px solid var(--home-border)" }}>
                    <div style={{ fontSize: "12px", color: "var(--home-text-muted)", marginBottom: "8px" }}>Live Microservice Status:</div>
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
          6. ACTIVE FLASH DEALS & COUPONS SECTION
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
                <div style={{ fontSize: "11px", color: "var(--home-text-muted)", marginBottom: "14px" }}>
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
          7. DEEP-DIVE FEATURE PILLARS
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
            <div className="pillar-icon-box" style={{ background: "rgba(56, 189, 248, 0.15)", color: "#0284c7" }}>
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
            <div className="pillar-icon-box" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#059669" }}>
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
            <div className="pillar-icon-box" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#d97706" }}>
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
            <div className="pillar-icon-box" style={{ background: "rgba(139, 92, 246, 0.15)", color: "#7c3aed" }}>
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
            <div className="pillar-icon-box" style={{ background: "rgba(236, 72, 153, 0.15)", color: "#db2777" }}>
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
            <div className="pillar-icon-box" style={{ background: "rgba(59, 130, 246, 0.15)", color: "#2563eb" }}>
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
          8. ECOSYSTEM WORKFLOW PIPELINE
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
          9. BENCHMARK CTA CARD & FOOTER
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

      {/* Comprehensive Modern Footer */}
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
            <h6>AI Trinity</h6>
            <ul>
              <li><a href="#ai-trinity">Darwin AI (Shopper Concierge)</a></li>
              <li><a href="#ai-trinity">Atlas AI (Vendor Supply Chain)</a></li>
              <li><a href="#ai-trinity">Titan AI (Admin Governance)</a></li>
              <li><a href="#features">AI Camera Vision Scanner</a></li>
              <li><a href="#features">Voice Assistant Search</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h6>Governance</h6>
            <ul>
              <li><a href="#promotions">Active Coupons &amp; Campaigns</a></li>
              <li><a href="#workflow">Supply Chain Logistics</a></li>
              <li><a href="#overview">Warehouse Geo-Hubs</a></li>
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