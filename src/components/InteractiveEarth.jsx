import { useEffect, useRef, useState } from "react";
import { Globe, Users, Heart, Zap, ShoppingCart, Sparkles } from "lucide-react";
import "./InteractiveEarth.css";

export default function InteractiveEarth({ theme = "light" }) {
  const containerRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [cartAngle, setCartAngle] = useState(0);
  const [activeMetric, setActiveMetric] = useState(null);

  // 1. Mouse Parallax Tilt (Natural 3D tilt without clipping)
  useEffect(() => {
    const handleMouseMove = (e) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const y = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      // Soft gentle tilt (max 12 deg)
      setTilt({ x: -y * 10, y: x * 12 });
    };

    const handleMouseLeave = () => {
      setTilt({ x: 0, y: 0 });
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", handleMouseMove);
      container.addEventListener("mouseleave", handleMouseLeave);
    }
    return () => {
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove);
        container.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, []);

  // 2. Real-time Continuous Cart Orbiting Animation
  useEffect(() => {
    let animId;
    const updateOrbit = () => {
      setCartAngle((prev) => (prev + 0.012) % (Math.PI * 2));
      animId = requestAnimationFrame(updateOrbit);
    };
    animId = requestAnimationFrame(updateOrbit);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Calculate cart 2D position along elliptical tilted orbit
  // Semi-major axis a = 210px, semi-minor axis b = 65px, tilt angle ~ -18 deg
  const a = 210;
  const b = 68;
  const rot = -0.32; // ~-18 degrees
  const cosT = Math.cos(cartAngle);
  const sinT = Math.sin(cartAngle);

  // Unrotated ellipse coords
  const ex = a * cosT;
  const ey = b * sinT;

  // Rotated coords
  const cartX = ex * Math.cos(rot) - ey * Math.sin(rot);
  const cartY = ex * Math.sin(rot) + ey * Math.cos(rot);
  const isFront = sinT > 0; // In front of Earth when sinT > 0

  return (
    <div className="interactive-earth-stage" ref={containerRef}>
      {/* 3D Centered Natural Earth Globe with Orbiting Commerce Ring */}
      <div
        className="earth-center-anchor"
        style={{
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        }}
      >
        {/* Rear section of orbital ring (behind Earth) */}
        <svg className="earth-orbit-svg" viewBox="0 0 520 280">
          <ellipse
            cx="260"
            cy="140"
            rx="210"
            ry="68"
            transform="rotate(-18 260 140)"
            className="orbit-path-back"
          />
        </svg>

        {/* Natural Realistic Full Earth Globe (100% uncropped, authentic NASA photography) */}
        <div className="natural-earth-sphere">
          <img
            src="/natural-earth-hd.png"
            alt="Natural Planet Earth - Fully Uncropped"
            className="natural-earth-photo"
          />
          {/* Subtle natural atmospheric rim halo */}
          <div className="natural-earth-atmosphere" />
        </div>

        {/* Front section of orbital ring & orbiting shopping cart */}
        <svg className="earth-orbit-svg orbit-svg-front" viewBox="0 0 520 280">
          <ellipse
            cx="260"
            cy="140"
            rx="210"
            ry="68"
            transform="rotate(-18 260 140)"
            className="orbit-path-front"
          />
        </svg>

        {/* Orbiting 3D Shopping Cart (Glides seamlessly around Earth) */}
        <div
          className="orbiting-cart-node"
          style={{
            transform: `translate(${260 + cartX}px, ${140 + cartY}px) translate(-50%, -50%) scale(${
              isFront ? 1.05 : 0.88
            })`,
            zIndex: isFront ? 12 : 1,
            opacity: isFront ? 1 : 0.75,
          }}
        >
          <div className="cart-badge-inner">
            <ShoppingCart size={18} className="cart-icon-svg" />
            <span className="cart-pulse-glow" />
          </div>
        </div>
      </div>

      {/* Floating Glassmorphic Metric Cards */}
      {/* Top Left: Products */}
      <div
        className={`interactive-metric-card mc-top-left ${activeMetric === "products" ? "active" : ""}`}
        onMouseEnter={() => setActiveMetric("products")}
        onMouseLeave={() => setActiveMetric(null)}
      >
        <div className="mc-icon-box mc-blue">
          <Globe size={22} />
        </div>
        <div className="mc-text">
          <span className="mc-label">Global Catalog</span>
          <span className="mc-value">10,000+ SKUs</span>
          <span className="mc-sub">Verified &amp; Inspected</span>
        </div>
      </div>

      {/* Top Right: Vendors */}
      <div
        className={`interactive-metric-card mc-top-right ${activeMetric === "vendors" ? "active" : ""}`}
        onMouseEnter={() => setActiveMetric("vendors")}
        onMouseLeave={() => setActiveMetric(null)}
      >
        <div className="mc-icon-box mc-purple">
          <Users size={22} />
        </div>
        <div className="mc-text">
          <span className="mc-label">Merchant Hubs</span>
          <span className="mc-value">500+ Active</span>
          <span className="mc-sub">Multi-Warehouse Routing</span>
        </div>
      </div>

      {/* Bottom Left: Happy Customers */}
      <div
        className={`interactive-metric-card mc-bottom-left ${activeMetric === "customers" ? "active" : ""}`}
        onMouseEnter={() => setActiveMetric("customers")}
        onMouseLeave={() => setActiveMetric(null)}
      >
        <div className="mc-icon-box mc-rose">
          <Heart size={22} />
        </div>
        <div className="mc-text">
          <span className="mc-label">Happy Shoppers</span>
          <span className="mc-value">25,000+ Active</span>
          <span className="mc-sub">4.9 ★ Community Trust</span>
        </div>
      </div>

      {/* Bottom Right: Dispatch Speed */}
      <div
        className={`interactive-metric-card mc-bottom-right ${activeMetric === "accuracy" ? "active" : ""}`}
        onMouseEnter={() => setActiveMetric("accuracy")}
        onMouseLeave={() => setActiveMetric(null)}
      >
        <div className="mc-icon-box mc-amber">
          <Zap size={22} />
        </div>
        <div className="mc-text">
          <span className="mc-label">Dispatch Accuracy</span>
          <span className="mc-value">99.98% SLA</span>
          <span className="mc-sub">Sub-Second Processing</span>
        </div>
      </div>

      {/* Playful Hand-Drawn Doodle Callouts */}
      {/* 1. "Shop the World ➔" Doodle */}
      <div className="doodle-callout doodle-shop-world">
        <span className="doodle-text">Shop the World</span>
        <svg className="doodle-arrow-svg" viewBox="0 0 70 50" fill="none">
          <path
            d="M8,42 C24,45 52,36 56,12"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <path
            d="M45,18 L56,12 L60,24"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* 2. Natural Parallax Hint */}
      <div className="doodle-callout doodle-drag-hint">
        <Sparkles size={14} className="doodle-sparkle-svg" />
        <span className="doodle-hint-text">Natural 3D Interactive Core</span>
      </div>
    </div>
  );
}
