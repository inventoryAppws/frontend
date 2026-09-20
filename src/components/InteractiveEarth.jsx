import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Globe, Users, Heart, Zap, Sparkles } from "lucide-react";
import "./InteractiveEarth.css";

export default function InteractiveEarth({ theme = "light" }) {
  const mountRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeMetric, setActiveMetric] = useState(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || 520;
    let height = container.clientHeight || 520;

    // 1. Scene setup
    const scene = new THREE.Scene();

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 0.6, 8.2);

    // 3. WebGL Renderer with 100% transparent background (zero white box)
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // 4. Lighting: Realistic Sun + Atmospheric Ambient
    const ambientLight = new THREE.AmbientLight(0xffffff, theme === "dark" ? 0.95 : 1.35);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, theme === "dark" ? 2.4 : 2.8);
    sunLight.position.set(6, 4, 7);
    scene.add(sunLight);

    const blueAtmosphereLight = new THREE.DirectionalLight(0x38bdf8, theme === "dark" ? 1.6 : 1.2);
    blueAtmosphereLight.position.set(-6, -2, -4);
    scene.add(blueAtmosphereLight);

    // 5. Globe Group (Tilts and spins in 3D)
    const globeGroup = new THREE.Group();
    globeGroup.rotation.z = 0.23; // Natural 13.5 deg axial tilt
    scene.add(globeGroup);

    // 6. Base Earth Sphere (Realistic NASA Blue Marble)
    const earthRadius = 2.25;
    const earthGeo = new THREE.SphereGeometry(earthRadius, 64, 64);
    const textureLoader = new THREE.TextureLoader();

    const earthTexture = textureLoader.load("/earth-texture-hd.jpg", () => {
      renderer.render(scene, camera);
    });

    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.38,
      metalness: 0.08,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    globeGroup.add(earthMesh);

    // 7. Realistic Clouds Layer (Drifts independently above Earth)
    const cloudGeo = new THREE.SphereGeometry(earthRadius * 1.018, 64, 64);
    const cloudTexture = textureLoader.load("/earth-clouds-hd.png");
    const cloudMat = new THREE.MeshStandardMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: theme === "dark" ? 0.38 : 0.45,
      blending: THREE.AdditiveBlending,
      roughness: 0.9,
    });
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    globeGroup.add(cloudMesh);

    // 8. Atmospheric Glow Layer (Luminous Cyan Rim)
    const atmosGeo = new THREE.SphereGeometry(earthRadius * 1.045, 48, 48);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: theme === "dark" ? 0x0ea5e9 : 0x38bdf8,
      transparent: true,
      opacity: theme === "dark" ? 0.28 : 0.20,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    globeGroup.add(atmosMesh);

    // 9. Luminous Tilted Orbital Commerce Ring
    const ringRadius = 3.55;
    const ringGeo = new THREE.TorusGeometry(ringRadius, 0.042, 16, 120);
    const ringMat = new THREE.MeshStandardMaterial({
      color: theme === "dark" ? 0x38bdf8 : 0x0284c7,
      emissive: theme === "dark" ? 0x0284c7 : 0x38bdf8,
      emissiveIntensity: theme === "dark" ? 0.9 : 0.6,
      roughness: 0.15,
      metalness: 0.85,
      transparent: true,
      opacity: 0.9,
    });
    const orbitalRing = new THREE.Mesh(ringGeo, ringMat);
    orbitalRing.rotation.x = Math.PI * 0.42;
    orbitalRing.rotation.y = -0.18;
    scene.add(orbitalRing);

    // 10. 3D Miniature Orbiting Shopping Cart
    const cartGroup = new THREE.Group();

    // Basket body
    const basketGeo = new THREE.BoxGeometry(0.52, 0.38, 0.38);
    const basketMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.25,
      metalness: 0.5,
    });
    const basket = new THREE.Mesh(basketGeo, basketMat);
    cartGroup.add(basket);

    // Colorful packages inside
    const pkg1Geo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const pkg1Mat = new THREE.MeshStandardMaterial({ color: 0x38bdf8 });
    const pkg1 = new THREE.Mesh(pkg1Geo, pkg1Mat);
    pkg1.position.set(-0.09, 0.14, 0.03);
    cartGroup.add(pkg1);

    const pkg2Geo = new THREE.BoxGeometry(0.16, 0.16, 0.16);
    const pkg2Mat = new THREE.MeshStandardMaterial({ color: 0xf43f5e });
    const pkg2 = new THREE.Mesh(pkg2Geo, pkg2Mat);
    pkg2.position.set(0.11, 0.12, -0.05);
    cartGroup.add(pkg2);

    // Handle
    const handleGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.42, 8);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x2563eb });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(0.3, 0.24, 0);
    cartGroup.add(handle);

    // 4 Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.045, 12);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const wheelOffsets = [
      [-0.2, -0.24, 0.17],
      [-0.2, -0.24, -0.17],
      [0.2, -0.24, 0.17],
      [0.2, -0.24, -0.17],
    ];
    wheelOffsets.forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(wx, wy, wz);
      cartGroup.add(wheel);
    });

    scene.add(cartGroup);

    // 11. Mouse Drag & Tracking
    let isUserInteracting = false;
    let previousMouseX = 0;
    let previousMouseY = 0;
    let targetRotationY = 0;
    let targetRotationX = 0;
    let cartOrbitAngle = 0.4;

    const onMouseDown = (e) => {
      isUserInteracting = true;
      setIsDragging(true);
      previousMouseX = e.clientX;
      previousMouseY = e.clientY;
    };

    const onMouseMove = (e) => {
      if (isUserInteracting) {
        const deltaX = e.clientX - previousMouseX;
        const deltaY = e.clientY - previousMouseY;
        targetRotationY += deltaX * 0.008;
        targetRotationX += deltaY * 0.006;
        previousMouseX = e.clientX;
        previousMouseY = e.clientY;
      } else {
        const rect = container.getBoundingClientRect();
        const mouseNormX = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
        const mouseNormY = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
        globeGroup.position.x = mouseNormX * 0.18;
        globeGroup.position.y = -mouseNormY * 0.18;
      }
    };

    const onMouseUp = () => {
      isUserInteracting = false;
      setIsDragging(false);
    };

    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        isUserInteracting = true;
        setIsDragging(true);
        previousMouseX = e.touches[0].clientX;
        previousMouseY = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e) => {
      if (isUserInteracting && e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - previousMouseX;
        const deltaY = e.touches[0].clientY - previousMouseY;
        targetRotationY += deltaX * 0.008;
        targetRotationX += deltaY * 0.006;
        previousMouseX = e.touches[0].clientX;
        previousMouseY = e.touches[0].clientY;
      }
    };

    const onTouchEnd = () => {
      isUserInteracting = false;
      setIsDragging(false);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    container.addEventListener("mousedown", onMouseDown);
    container.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);

    // 12. Animation Loop (Smooth 60fps)
    let animationFrameId;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Auto-spin Earth & Cloud Drift
      if (!isUserInteracting) {
        targetRotationY += 0.0035;
      }
      cloudMesh.rotation.y += 0.0055; // Atmospheric cloud drift

      globeGroup.rotation.y += (targetRotationY - globeGroup.rotation.y) * 0.1;
      globeGroup.rotation.x += (targetRotationX - globeGroup.rotation.x) * 0.1;

      // Orbiting Cart along ring
      cartOrbitAngle += 0.0125;
      const rx = ringRadius;
      const cosA = Math.cos(cartOrbitAngle);
      const sinA = Math.sin(cartOrbitAngle);
      const ringTiltX = Math.PI * 0.42;

      cartGroup.position.x = rx * cosA;
      cartGroup.position.y = -rx * sinA * Math.sin(ringTiltX) * 0.52;
      cartGroup.position.z = rx * sinA * Math.cos(ringTiltX) * 1.28;

      cartGroup.rotation.y = -cartOrbitAngle + Math.PI / 2;
      cartGroup.rotation.x = Math.sin(cartOrbitAngle) * 0.16;

      renderer.render(scene, camera);
    };

    animate();

    // 13. Window Resize
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || 520;
      height = container.clientHeight || 520;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      container.removeEventListener("mousedown", onMouseDown);
      container.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("resize", handleResize);

      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      earthGeo.dispose();
      earthMat.dispose();
      cloudGeo.dispose();
      cloudMat.dispose();
      atmosGeo.dispose();
      atmosMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      basketGeo.dispose();
      basketMat.dispose();
      renderer.dispose();
    };
  }, [theme]);

  return (
    <div className={`interactive-earth-stage ${isDragging ? "dragging" : ""}`}>
      {/* Three.js Canvas Container (100% transparent, center realistic Earth) */}
      <div ref={mountRef} className="earth-canvas-container" title="Click & Drag to rotate 3D Earth" />

      {/* Floating Glassmorphic Metric Cards (Organic fluid motion) */}
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

      {/* 2. Interactive Drag Hint */}
      <div className="doodle-callout doodle-drag-hint">
        <svg className="doodle-sparkle-svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
        </svg>
        <span className="doodle-hint-text">Drag to rotate 3D Earth</span>
      </div>
    </div>
  );
}
