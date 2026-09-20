import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Globe, Users, Heart, Zap, ShoppingCart } from "lucide-react";
import "./InteractiveEarth.css";

export default function InteractiveEarth({ theme = "light" }) {
  const containerRef = useRef(null);
  const mountRef = useRef(null);
  const cartNodeRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [activeMetric, setActiveMetric] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDraggingState, setIsDraggingState] = useState(false);

  // 1. Mouse Parallax Tilt for the surrounding cards
  useEffect(() => {
    const handleMouseMove = (e) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const y = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      setTilt({ x: -y * 8, y: x * 10 });
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

  // 2. Three.js Interactive 3D Draggable Rotating Earth & True 3D Depth Orbit Ring
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = 520;
    const height = 340;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 0, 4.6);

    // WebGL Renderer with transparency & high pixel ratio
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.className = "three-earth-webgl";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.inset = "0";
    renderer.domElement.style.zIndex = "4";
    renderer.domElement.style.cursor = "grab";
    mount.appendChild(renderer.domElement);

    // Globe Group (Spins on user drag or idle spin)
    const globeGroup = new THREE.Group();
    globeGroup.rotation.y = -1.4;
    globeGroup.rotation.x = 0.22;
    scene.add(globeGroup);

    // Textures
    const textureLoader = new THREE.TextureLoader();
    let loadedCount = 0;
    const onLoadTexture = () => {
      loadedCount++;
      if (loadedCount >= 1) {
        setIsLoaded(true);
      }
    };

    const earthTexture = textureLoader.load("/earth-texture-hd.jpg", onLoadTexture);
    const specularTexture = textureLoader.load("/earth-specular-hd.jpg");
    const cloudsTexture = textureLoader.load("/earth-clouds-hd.jpg");

    // Earth Sphere Mesh (Rich 3D PBR Material with glistening specular oceans)
    const earthGeo = new THREE.SphereGeometry(1.36, 64, 64);
    const earthMat = new THREE.MeshPhongMaterial({
      map: earthTexture,
      specularMap: specularTexture,
      specular: new THREE.Color(0x38bdf8),
      shininess: 32,
      flatShading: false
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    globeGroup.add(earthMesh);

    // Clouds Sphere Mesh (Slightly larger, realistic cloud shadows)
    const cloudsGeo = new THREE.SphereGeometry(1.378, 64, 64);
    const cloudsMat = new THREE.MeshStandardMaterial({
      map: cloudsTexture,
      transparent: true,
      opacity: 0.38,
      blending: THREE.NormalBlending,
      depthWrite: false
    });
    const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
    globeGroup.add(cloudsMesh);

    // Atmospheric Rayleigh Shader Glow (Fades seamlessly into space)
    const atmosGeo = new THREE.SphereGeometry(1.415, 64, 64);
    const atmosMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vec3 viewDir = normalize(-vPosition);
          float rim = 1.0 - max(0.0, dot(vNormal, viewDir));
          float intensity = pow(rim, 3.2) * 1.6;
          vec3 glowColor = mix(vec3(0.12, 0.65, 1.0), vec3(0.45, 0.88, 1.0), rim);
          gl_FragColor = vec4(glowColor, intensity);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    globeGroup.add(atmosMesh);

    // 3D Orbital Ring Mesh (Torus with full WebGL Depth-Testing)
    // The back half is naturally occluded by the Earth; the front half sweeps across the front!
    const orbitRadius = 2.02;
    const ringGeo = new THREE.TorusGeometry(orbitRadius, 0.016, 16, 160);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.88,
      depthTest: true
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);

    // Secondary subtle cyan ambient glow ring
    const glowRingGeo = new THREE.TorusGeometry(orbitRadius, 0.038, 16, 160);
    const glowRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.28,
      depthTest: true
    });
    const glowRingMesh = new THREE.Mesh(glowRingGeo, glowRingMat);

    const ringGroup = new THREE.Group();
    // Tilted gracefully across Earth's equator
    ringGroup.rotation.x = Math.PI * 0.38;
    ringGroup.rotation.y = -Math.PI * 0.08;
    ringGroup.rotation.z = -Math.PI * 0.05;
    ringGroup.add(ringMesh);
    ringGroup.add(glowRingMesh);
    scene.add(ringGroup);

    // Natural Space Lighting (Sun Key Light + Soft Space Ambient)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.68);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.4);
    sunLight.position.set(5.2, 1.8, 3.4);
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x0ea5e9, 0.85);
    fillLight.position.set(-5.0, -1.6, -2.6);
    scene.add(fillLight);

    // Drag to Rotate Interaction with Inertia & Momentum
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let velocityX = 0;
    let velocityY = 0;

    const onPointerDown = (e) => {
      isDragging = true;
      setIsDraggingState(true);
      prevX = e.clientX;
      prevY = e.clientY;
      velocityX = 0;
      velocityY = 0;
      renderer.domElement.style.cursor = "grabbing";
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      
      globeGroup.rotation.y += dx * 0.0055;
      globeGroup.rotation.x += dy * 0.004;
      globeGroup.rotation.x = Math.max(-0.65, Math.min(0.65, globeGroup.rotation.x));
      
      velocityX = dx * 0.0055;
      velocityY = dy * 0.004;
      prevX = e.clientX;
      prevY = e.clientY;
    };

    const onPointerUp = () => {
      if (isDragging) {
        isDragging = false;
        setIsDraggingState(false);
        renderer.domElement.style.cursor = "grab";
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    // Render & Physics Loop
    let animationFrameId;
    let currentCartAngle = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!isDragging) {
        globeGroup.rotation.y += velocityX;
        globeGroup.rotation.x += velocityY;
        globeGroup.rotation.x = Math.max(-0.65, Math.min(0.65, globeGroup.rotation.x));
        velocityX *= 0.94;
        velocityY *= 0.94;

        if (Math.abs(velocityX) < 0.0003) {
          globeGroup.rotation.y += 0.0018;
        }
      }

      cloudsMesh.rotation.y += 0.00035;

      // Update 3D Orbiting Shopping Cart Position
      currentCartAngle = (currentCartAngle + 0.011) % (Math.PI * 2);
      const cartX = Math.cos(currentCartAngle) * orbitRadius;
      const cartY = Math.sin(currentCartAngle) * orbitRadius;
      const cart3D = new THREE.Vector3(cartX, cartY, 0).applyEuler(ringGroup.rotation);

      // Project 3D vector to screen coordinates for the cart badge
      const projected = cart3D.clone().project(camera);
      const px = ((projected.x + 1) / 2) * width;
      const py = ((-projected.y + 1) / 2) * height;

      // Check if occluded behind the Earth globe
      const isBehindGlobe = cart3D.z < -0.15 && Math.hypot(cart3D.x, cart3D.y) < 1.34;

      if (cartNodeRef.current) {
        cartNodeRef.current.style.transform = `translate(${px}px, ${py}px) translate(-50%, -50%) scale(${
          cart3D.z > 0 ? 1.06 : 0.84
        })`;
        cartNodeRef.current.style.opacity = isBehindGlobe ? "0" : "1";
        cartNodeRef.current.style.zIndex = cart3D.z > 0 ? "15" : "2";
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      dom.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);

      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      earthGeo.dispose();
      earthMat.dispose();
      cloudsGeo.dispose();
      cloudsMat.dispose();
      atmosGeo.dispose();
      atmosMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      glowRingGeo.dispose();
      glowRingMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className={`interactive-earth-stage ${isDraggingState ? "is-dragging" : ""} earth-theme-${theme}`} ref={containerRef}>
      {/* 3D Centered Natural Earth Globe with True WebGL Depth-Tested Orbit */}
      <div
        className="earth-center-anchor"
        ref={mountRef}
        style={{
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        }}
      >
        {/* Instant poster image while WebGL initializes */}
        {!isLoaded && (
          <div className="natural-earth-fallback-poster">
            <img
              src="/natural-earth-hd.png"
              alt="Natural Planet Earth - Fully Uncropped"
              className="natural-earth-photo"
            />
          </div>
        )}

        {/* Orbiting 3D Shopping Cart (Synced with 3D Ring) */}
        <div className="orbiting-cart-node" ref={cartNodeRef}>
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

      {/* Top Right: Real-time Shoppers */}
      <div
        className={`interactive-metric-card mc-top-right ${activeMetric === "shoppers" ? "active" : ""}`}
        onMouseEnter={() => setActiveMetric("shoppers")}
        onMouseLeave={() => setActiveMetric(null)}
      >
        <div className="mc-icon-box mc-green">
          <Users size={22} />
        </div>
        <div className="mc-text">
          <span className="mc-label">Active Shoppers</span>
          <span className="mc-value">14,280 Live</span>
          <span className="mc-sub">Browsing Stores</span>
        </div>
      </div>

      {/* Bottom Left: Customer Satisfaction */}
      <div
        className={`interactive-metric-card mc-bottom-left ${activeMetric === "satisfaction" ? "active" : ""}`}
        onMouseEnter={() => setActiveMetric("satisfaction")}
        onMouseLeave={() => setActiveMetric(null)}
      >
        <div className="mc-icon-box mc-rose">
          <Heart size={22} />
        </div>
        <div className="mc-text">
          <span className="mc-label">Satisfaction Rate</span>
          <span className="mc-value">99.4% Rated 5★</span>
          <span className="mc-sub">Verified Reviews</span>
        </div>
      </div>

      {/* Bottom Right: Instant Settlement Speed */}
      <div
        className={`interactive-metric-card mc-bottom-right ${activeMetric === "speed" ? "active" : ""}`}
        onMouseEnter={() => setActiveMetric("speed")}
        onMouseLeave={() => setActiveMetric(null)}
      >
        <div className="mc-icon-box mc-amber">
          <Zap size={22} />
        </div>
        <div className="mc-text">
          <span className="mc-label">Settlement Speed</span>
          <span className="mc-value">&lt; 15ms Latency</span>
          <span className="mc-sub">Instant Digital Wallet</span>
        </div>
      </div>
    </div>
  );
}
