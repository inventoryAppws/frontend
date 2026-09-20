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

    let width = container.clientWidth || 440;
    let height = container.clientHeight || 440;

    // 1. Scene setup
    const scene = new THREE.Scene();

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(0, 0.8, 7.8);

    // 3. Renderer with full transparent alpha
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // 100% transparent background
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, theme === "dark" ? 0.9 : 1.2);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, theme === "dark" ? 2.2 : 2.5);
    sunLight.position.set(5, 4, 6);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, theme === "dark" ? 1.8 : 1.2);
    rimLight.position.set(-6, -2, -4);
    scene.add(rimLight);

    // 5. Globe Group (allows tilt and user rotation)
    const globeGroup = new THREE.Group();
    globeGroup.rotation.z = 0.22; // ~12 degree axial tilt for aesthetic angle
    scene.add(globeGroup);

    // 6. Earth Sphere
    const earthRadius = 2.15;
    const earthGeo = new THREE.SphereGeometry(earthRadius, 64, 64);

    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load(
      "/earth-texture-hd.jpg",
      () => {
        renderer.render(scene, camera);
      },
      undefined,
      (err) => {
        console.warn("Using fallback Earth material due to load error:", err);
      }
    );

    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.55,
      metalness: 0.12,
    });

    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    globeGroup.add(earthMesh);

    // 7. Atmospheric Glow Layer
    const atmosGeo = new THREE.SphereGeometry(earthRadius * 1.035, 48, 48);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: theme === "dark" ? 0x0284c7 : 0x38bdf8,
      transparent: true,
      opacity: theme === "dark" ? 0.22 : 0.16,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    globeGroup.add(atmosMesh);

    // 8. Tilted Orbital Commerce Ring
    const ringRadius = 3.35;
    const ringGeo = new THREE.TorusGeometry(ringRadius, 0.038, 16, 120);
    const ringMat = new THREE.MeshStandardMaterial({
      color: theme === "dark" ? 0x38bdf8 : 0x0284c7,
      emissive: theme === "dark" ? 0x0284c7 : 0x38bdf8,
      emissiveIntensity: theme === "dark" ? 0.8 : 0.5,
      roughness: 0.2,
      metalness: 0.8,
      transparent: true,
      opacity: 0.88,
    });
    const orbitalRing = new THREE.Mesh(ringGeo, ringMat);
    orbitalRing.rotation.x = Math.PI * 0.42; // Tilted equator ring
    orbitalRing.rotation.y = -0.18;
    scene.add(orbitalRing);

    // 9. Orbiting 3D Shopping Cart
    const cartGroup = new THREE.Group();

    // Basket (tapered wireframe/clean modern white cart)
    const basketGeo = new THREE.BoxGeometry(0.48, 0.36, 0.36);
    const basketMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.4,
    });
    const basket = new THREE.Mesh(basketGeo, basketMat);
    cartGroup.add(basket);

    // Inside cart highlight (small colorful packages)
    const pkg1Geo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
    const pkg1Mat = new THREE.MeshStandardMaterial({ color: 0x38bdf8 });
    const pkg1 = new THREE.Mesh(pkg1Geo, pkg1Mat);
    pkg1.position.set(-0.08, 0.12, 0.02);
    cartGroup.add(pkg1);

    const pkg2Geo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
    const pkg2Mat = new THREE.MeshStandardMaterial({ color: 0xf43f5e });
    const pkg2 = new THREE.Mesh(pkg2Geo, pkg2Mat);
    pkg2.position.set(0.1, 0.1, -0.04);
    cartGroup.add(pkg2);

    // Cart Handle
    const handleGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.38, 8);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x2563eb });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(0.28, 0.22, 0);
    cartGroup.add(handle);

    // 4 Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.04, 12);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const wheelOffsets = [
      [-0.18, -0.22, 0.16],
      [-0.18, -0.22, -0.16],
      [0.18, -0.22, 0.16],
      [0.18, -0.22, -0.16],
    ];
    wheelOffsets.forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(wx, wy, wz);
      cartGroup.add(wheel);
    });

    scene.add(cartGroup);

    // 10. Interactive Drag & Mouse Tracking State
    let isUserInteracting = false;
    let previousMouseX = 0;
    let previousMouseY = 0;
    let targetRotationY = 0;
    let targetRotationX = 0;
    let cartOrbitAngle = 0.4; // initial position in front of earth

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
        // Subtle tilt parallax towards mouse
        const rect = container.getBoundingClientRect();
        const mouseNormX = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
        const mouseNormY = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
        globeGroup.position.x = mouseNormX * 0.15;
        globeGroup.position.y = -mouseNormY * 0.15;
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

    // 11. Animation Loop
    let animationFrameId;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Smooth damped rotation
      if (!isUserInteracting) {
        targetRotationY += 0.004; // Auto-spin
      }

      globeGroup.rotation.y += (targetRotationY - globeGroup.rotation.y) * 0.1;
      globeGroup.rotation.x += (targetRotationX - globeGroup.rotation.x) * 0.1;

      // Orbiting Cart along the tilted ring
      cartOrbitAngle += 0.012;
      const rx = ringRadius;
      const cosA = Math.cos(cartOrbitAngle);
      const sinA = Math.sin(cartOrbitAngle);

      // Coordinates transformed by ring rotation (x: PI*0.42, y: -0.18)
      // Standard parametric circle tilted
      const ringTiltX = Math.PI * 0.42;
      cartGroup.position.x = rx * cosA;
      cartGroup.position.y = -rx * sinA * Math.sin(ringTiltX) * 0.5;
      cartGroup.position.z = rx * sinA * Math.cos(ringTiltX) * 1.25;

      // Cart orientation along tangent
      cartGroup.rotation.y = -cartOrbitAngle + Math.PI / 2;
      cartGroup.rotation.x = Math.sin(cartOrbitAngle) * 0.15;

      renderer.render(scene, camera);
    };

    animate();

    // 12. Resize handler
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || 440;
      height = container.clientHeight || 440;
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
      {/* Three.js Canvas Container (100% transparent background) */}
      <div ref={mountRef} className="earth-canvas-container" title="Click & Drag to rotate Earth" />

      {/* Floating Glassmorphic Metric Cards */}
      {/* Top Left: Products */}
      <div
        className={`interactive-metric-card mc-top-left ${activeMetric === "products" ? "active" : ""}`}
        onMouseEnter={() => setActiveMetric("products")}
        onMouseLeave={() => setActiveMetric(null)}
      >
        <div className="mc-icon-box mc-blue">
          <Globe size={20} />
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
          <Users size={20} />
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
          <Heart size={20} />
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
          <Zap size={20} />
        </div>
        <div className="mc-text">
          <span className="mc-label">Dispatch Accuracy</span>
          <span className="mc-value">99.98%</span>
          <span className="mc-sub">Sub-Second Processing</span>
        </div>
      </div>

      {/* Playful Hand-Drawn Doodle Callouts */}
      {/* 1. "Shop the World ➔" Doodle matching user reference */}
      <div className="doodle-callout doodle-shop-world">
        <span className="doodle-text">Shop the World</span>
        <svg className="doodle-arrow-svg" viewBox="0 0 70 50" fill="none">
          {/* Curved hand-drawn arrow curling towards Earth & cart */}
          <path
            d="M8,42 C24,45 52,36 56,12"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <path
            d="M45,18 L56,12 L60,24"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* 2. Interactive Hint Doodle */}
      <div className="doodle-callout doodle-drag-hint">
        <svg className="doodle-sparkle-svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
        </svg>
        <span className="doodle-hint-text">Drag to rotate 3D Earth</span>
      </div>
    </div>
  );
}
