import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  ShoppingBag,
  Check,
  X,
  RotateCcw,
  ArrowRight,
  Camera,
  User,
  FlipHorizontal,
  Download,
  Share2,
  Sliders,
  Eye,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Heart,
  Wand2,
  Maximize2
} from 'lucide-react';
import AvatarCanvas from './AvatarCanvas';
import { isAnywearAvailable, openAnywearTryOn } from '../../utils/anywear';
import './TryOnModal.css';

export default function TryOnModal({
  isOpen,
  onClose,
  product,
  onAddToCart,
  initialMode = null
}) {
  // Detect clothing category / layer
  const clothingType = (
    product?.virtualTryOn?.garmentType ||
    product?.clothingType ||
    (product?.name?.toLowerCase().includes('shirt') || product?.name?.toLowerCase().includes('hoodie') || product?.name?.toLowerCase().includes('top')
      ? 'top'
      : product?.name?.toLowerCase().includes('pant') || product?.name?.toLowerCase().includes('jean') || product?.name?.toLowerCase().includes('trouser')
      ? 'bottom'
      : product?.name?.toLowerCase().includes('dress')
      ? 'dress'
      : product?.name?.toLowerCase().includes('shoe') || product?.name?.toLowerCase().includes('sneaker') || product?.name?.toLowerCase().includes('boot') || product?.name?.toLowerCase().includes('running')
      ? 'footwear'
      : 'top')
  ).toLowerCase();

  const isFootwear = clothingType === 'footwear' || clothingType === 'shoes';
  const isBottom = clothingType === 'bottom' || clothingType === 'pants' || clothingType === 'jeans';

  // If footwear and no explicit mode given, default to avatar (since webcams struggle with feet)
  const defaultMode = initialMode ? initialMode : (isFootwear ? 'avatar' : 'camera');
  const [activeMode, setActiveMode] = useState(defaultMode);

  const [gender, setGender] = useState('Male');
  const [skinTone, setSkinTone] = useState('#f7d0b5');
  const [hairColor, setHairColor] = useState('#1f2937');
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [isSavedLook, setIsSavedLook] = useState(false);

  // Live Camera (Anywear AR) States
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('user');
  const [isMirrored, setIsMirrored] = useState(true);
  const [showBodyGuide, setShowBodyGuide] = useState(true);

  // Default placement offsets based on clothing type (lowered below chin/neck)
  const defaultOffsetY = isFootwear ? 120 : isBottom ? 75 : 45;
  const [garmentScale, setGarmentScale] = useState(isFootwear ? 0.75 : 0.95);
  const [garmentOffsetY, setGarmentOffsetY] = useState(defaultOffsetY);
  const [garmentOpacity, setGarmentOpacity] = useState(0.96);
  const [blendMultiply, setBlendMultiply] = useState(true);
  const [snapshotUrl, setSnapshotUrl] = useState(null);
  const [showSliders, setShowSliders] = useState(false);
  const [hasDecartSdk, setHasDecartSdk] = useState(false);

  // Dynamic Background-Removed Garment Image URL
  const rawGarmentImage = product?.virtualTryOn?.tryOnImage || product?.image || (Array.isArray(product?.images) && product?.images[0]) || '';
  const [transparentGarmentSrc, setTransparentGarmentSrc] = useState(rawGarmentImage);

  // Check for external Decart Anywear SDK (Lucy V-TON)
  useEffect(() => {
    const checkSdk = () => {
      setHasDecartSdk(isAnywearAvailable());
    };
    checkSdk();
    const timer = setInterval(checkSdk, 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen for Anywear Add to Bag action
  useEffect(() => {
    const handleDecartMsg = (e) => {
      if (e.data?.type === 'DECART_ADD_TO_BAG' || e.data?.type === 'DECART_ADD_TO_CART') {
        handleAddToCart();
      }
    };
    window.addEventListener('message', handleDecartMsg);
    return () => window.removeEventListener('message', handleDecartMsg);
  }, [product]);

  // Update mode when product or initialMode changes
  useEffect(() => {
    if (initialMode) {
      setActiveMode(initialMode);
    } else if (isFootwear) {
      setActiveMode('avatar');
    } else {
      setActiveMode('camera');
    }
  }, [initialMode, product?._id, isFootwear]);

  // Client-side automatic background removal for product image
  useEffect(() => {
    if (!rawGarmentImage) return;

    let isMounted = true;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = rawGarmentImage;

    img.onload = () => {
      if (!isMounted) return;
      try {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth || 600;
        c.height = img.naturalHeight || 600;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, c.width, c.height);
        const data = imgData.data;

        // Sample top-left corner
        const cornerR = data[0];
        const cornerG = data[1];
        const cornerB = data[2];

        // If corner is white or near-white background
        if (cornerR > 210 && cornerG > 210 && cornerB > 210) {
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            if (r > 215 && g > 215 && b > 215) {
              data[i + 3] = 0; // Transparent
            } else if (r > 195 && g > 195 && b > 195) {
              // Smooth edge alpha
              const diff = Math.min(r, g, b) - 195;
              data[i + 3] = Math.max(0, Math.min(255, 255 - (diff / 20) * 255));
            }
          }
          ctx.putImageData(imgData, 0, 0);
          setTransparentGarmentSrc(c.toDataURL('image/png'));
        } else {
          setTransparentGarmentSrc(rawGarmentImage);
        }
      } catch (err) {
        // In case of third-party CORS restriction, fallback to original with blend-multiply
        setTransparentGarmentSrc(rawGarmentImage);
      }
    };

    img.onerror = () => {
      if (isMounted) setTransparentGarmentSrc(rawGarmentImage);
    };

    return () => {
      isMounted = false;
    };
  }, [rawGarmentImage]);

  const outfit = {
    top: clothingType === 'top' || clothingType === 'dress' || clothingType === 'outerwear'
      ? { name: product?.name || 'Garment', color: '#3b82f6' }
      : { name: 'Basic White Tee', color: '#f8fafc' },
    bottom: clothingType === 'bottom'
      ? { name: product?.name || 'Bottoms', color: '#1e293b' }
      : { name: 'Classic Dark Denim', color: '#1e3a8a' },
    footwear: isFootwear
      ? { name: product?.name || 'Shoes', color: '#0f172a' }
      : { name: 'White Retro Sneakers', color: '#ffffff' }
  };

  // Start Camera Stream
  const startCamera = async () => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is not supported by your browser.');
      return;
    }

    try {
      setCameraLoading(true);
      setCameraError(null);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
    } catch (err) {
      console.warn('Camera permission or device error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your browser to try on clothes live.'
          : err.message || 'Unable to access camera.'
      );
      setCameraActive(false);
    } finally {
      setCameraLoading(false);
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Handle Camera lifecycle
  useEffect(() => {
    if (isOpen && activeMode === 'camera' && !snapshotUrl) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeMode, facingMode, snapshotUrl]);

  if (!isOpen || !product) return null;

  const handleAddToCart = () => {
    setIsAddedToCart(true);
    if (onAddToCart) onAddToCart(product);
    setTimeout(() => {
      setIsAddedToCart(false);
      onClose();
    }, 1500);
  };

  const handleSaveLook = () => {
    setIsSavedLook(true);
    const saved = JSON.parse(localStorage.getItem('saved_vto_looks') || '[]');
    saved.unshift({
      id: Date.now(),
      productId: product._id,
      name: product.name,
      image: transparentGarmentSrc,
      price: product.price,
      clothingType,
      date: new Date().toISOString()
    });
    localStorage.setItem('saved_vto_looks', JSON.stringify(saved.slice(0, 20)));
    setTimeout(() => setIsSavedLook(false), 2000);
  };

  // Capture High-Res Snapshot
  const handleTakeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');

    // Draw Video Feed
    ctx.save();
    if (isMirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Composite Garment Overlay
    if (transparentGarmentSrc) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = transparentGarmentSrc;
      img.onload = () => {
        const baseWidth = canvas.width * (isFootwear ? 0.32 : 0.44) * garmentScale;
        const aspectRatio = img.naturalHeight / (img.naturalWidth || 1);
        const baseHeight = baseWidth * aspectRatio;

        const posX = (canvas.width - baseWidth) / 2;
        const posY = (canvas.height - baseHeight) / 2 + garmentOffsetY * (canvas.height / 450);

        ctx.globalAlpha = garmentOpacity;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 18;
        ctx.drawImage(img, posX, posY, baseWidth, baseHeight);

        // Watermark Badge
        ctx.globalAlpha = 0.92;
        ctx.font = 'bold 18px Inter, sans-serif';
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(24, canvas.height - 64, 360, 42);
        ctx.fillStyle = '#ffffff';
        ctx.fillText('✨ Anywear Live VTO • Verified Fit', 40, canvas.height - 36);

        setSnapshotUrl(canvas.toDataURL('image/png'));
        stopCamera();
      };
      img.onerror = () => {
        setSnapshotUrl(canvas.toDataURL('image/png'));
        stopCamera();
      };
    } else {
      setSnapshotUrl(canvas.toDataURL('image/png'));
      stopCamera();
    }
  };

  const handleDownloadSnapshot = () => {
    if (!snapshotUrl) return;
    const a = document.createElement('a');
    a.href = snapshotUrl;
    a.download = `${product.name.replace(/\s+/g, '_')}_TryOn_Look.png`;
    a.click();
  };

  const handleShareLook = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `My Virtual Try-On Look: ${product.name}`,
          text: `Check out how this ${product.name} looks on me in the virtual fitting room!`,
          url: window.location.href
        });
      } catch {}
    } else {
      navigator.clipboard?.writeText(window.location.href);
      alert('Product link copied to clipboard to share your look!');
    }
  };

  return (
    <div className="tryon-modal-overlay" onClick={onClose}>
      <div className="tryon-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header with Mode Switcher */}
        <div className="tryon-modal-header">
          <div className="tryon-header-info">
            <div className="tryon-badge-row">
              <span className="tryon-badge">✨ Anywear Virtual Fitting Room</span>
              {hasDecartSdk && <span className="tryon-partner-badge">Powered by Decart AI</span>}
            </div>
            <h3 className="tryon-title">Live Interactive Try-On Studio</h3>
            <p className="tryon-sub">Experience real-time live camera fit and full 3D avatar customizer</p>
          </div>

          <div className="tryon-header-right">
            {/* Mode Toggle Switch */}
            <div className="tryon-mode-toggle">
              <button
                type="button"
                className={`tryon-mode-btn ${activeMode === 'camera' ? 'active' : ''}`}
                onClick={() => {
                  setSnapshotUrl(null);
                  setActiveMode('camera');
                }}
              >
                <Camera size={14} /> Live Camera (Anywear)
              </button>
              <button
                type="button"
                className={`tryon-mode-btn ${activeMode === 'avatar' ? 'active' : ''}`}
                onClick={() => {
                  stopCamera();
                  setActiveMode('avatar');
                }}
              >
                <User size={14} /> 3D Avatar (Three.js)
              </button>
            </div>

            <button className="tryon-close-btn" onClick={onClose} aria-label="Close fitting room">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="tryon-content-grid">
          {/* Left: Viewport (Live Camera or 3D Avatar) */}
          <div className="tryon-viewport-card">
            {activeMode === 'camera' ? (
              <div className="tryon-camera-viewport">
                {snapshotUrl ? (
                  /* Snapshot Captured Mode */
                  <div className="tryon-snapshot-view">
                    <img src={snapshotUrl} alt="Try On Snapshot" className="tryon-snapshot-img" />
                    <div className="tryon-snapshot-bar">
                      <button
                        type="button"
                        className="tryon-icon-action-btn"
                        onClick={() => {
                          setSnapshotUrl(null);
                          startCamera();
                        }}
                        title="Retake Photo"
                      >
                        <RotateCcw size={15} /> Retake
                      </button>
                      <button
                        type="button"
                        className="tryon-icon-action-btn"
                        onClick={handleDownloadSnapshot}
                        title="Download Snapshot"
                      >
                        <Download size={15} /> Save Photo
                      </button>
                      <button
                        type="button"
                        className="tryon-icon-action-btn"
                        onClick={handleShareLook}
                        title="Share Look"
                      >
                        <Share2 size={15} /> Share
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Live Camera Status Bar */}
                    <div className="tryon-decart-banner">
                      <div className="tryon-decart-info">
                        <Sparkles size={16} className="text-pink" />
                        <div>
                          <strong>Live Camera Virtual Fitting Room</strong>
                          <span>Real-Time AR Garment Fit &amp; Alignment</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="tryon-launch-decart-btn"
                        onClick={() => {
                          stopCamera();
                          setActiveMode('avatar');
                        }}
                        title="Switch to Interactive 3D Avatar Fitting Room"
                      >
                        <User size={13} /> Switch to 3D Avatar &rarr;
                      </button>
                    </div>

                    {/* Live Camera Video Feed */}
                    <div className="tryon-live-feed-wrapper">
                    {cameraLoading && (
                      <div className="tryon-cam-overlay-msg">
                        <RefreshCw size={24} className="spin" />
                        <span>Starting camera feed...</span>
                      </div>
                    )}

                    {cameraError ? (
                      <div className="tryon-cam-overlay-msg error">
                        <AlertCircle size={28} />
                        <p>{cameraError}</p>
                        <button type="button" className="tryon-retry-btn" onClick={startCamera}>
                          <RotateCcw size={14} /> Retry Camera
                        </button>
                        <button
                          type="button"
                          className="tryon-switch-avatar-btn"
                          onClick={() => setActiveMode('avatar')}
                        >
                          Switch to 3D Avatar Fitting Room &rarr;
                        </button>
                      </div>
                    ) : (
                      <>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className={`tryon-video-element ${isMirrored ? 'mirrored' : ''}`}
                        />

                        {/* Silhouette Body Positioning Guide */}
                        {showBodyGuide && (
                          isFootwear ? (
                            /* Footwear Bottom Frame Guide */
                            <div className="tryon-footwear-guide">
                              <div className="footwear-guide-box">
                                <span className="footwear-shoe-icon">👟</span>
                                <span className="footwear-tip">Position feet inside lower frame</span>
                              </div>
                            </div>
                          ) : isBottom ? (
                            /* Pants / Bottom Frame Guide */
                            <div className="tryon-bottom-guide">
                              <div className="silhouette-legs" />
                              <span className="silhouette-tip">Align waist &amp; legs in lower frame</span>
                            </div>
                          ) : (
                            /* Torso / Upper Body Guide */
                            <div className="tryon-body-silhouette-guide">
                              <div className="silhouette-head" />
                              <div className="silhouette-shoulders" />
                              <div className="silhouette-torso" />
                              <span className="silhouette-tip">Align shoulders &amp; torso inside frame</span>
                            </div>
                          )
                        )}

                        {/* AR Garment Overlay */}
                        {transparentGarmentSrc && (
                          <div
                            className={`tryon-garment-overlay ${isFootwear ? 'is-footwear' : ''}`}
                            style={{
                              transform: `translate(-50%, calc(-50% + ${garmentOffsetY}px)) scale(${garmentScale})`,
                              opacity: garmentOpacity
                            }}
                          >
                            <img
                              src={transparentGarmentSrc}
                              alt={product.name}
                              className={`tryon-garment-img ${blendMultiply ? 'blend-clean' : ''}`}
                              draggable={false}
                            />
                            <div className="tryon-live-tracking-pill">
                              <span className="live-dot" /> Live {clothingType.toUpperCase()} Tracking
                            </div>
                          </div>
                        )}

                        {/* Camera Floating Controls */}
                        <div className="tryon-camera-floating-toolbar">
                          <button
                            type="button"
                            className={`cam-tool-btn ${blendMultiply ? 'active' : ''}`}
                            onClick={() => setBlendMultiply(!blendMultiply)}
                            title="Toggle Transparent Blending (Removes background box)"
                          >
                            <Wand2 size={15} />
                          </button>
                          <button
                            type="button"
                            className={`cam-tool-btn ${isMirrored ? 'active' : ''}`}
                            onClick={() => setIsMirrored(!isMirrored)}
                            title="Mirror Camera"
                          >
                            <FlipHorizontal size={15} />
                          </button>
                          <button
                            type="button"
                            className={`cam-tool-btn ${showBodyGuide ? 'active' : ''}`}
                            onClick={() => setShowBodyGuide(!showBodyGuide)}
                            title="Toggle Silhouette Guide"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            className={`cam-tool-btn ${showSliders ? 'active' : ''}`}
                            onClick={() => setShowSliders(!showSliders)}
                            title="Fine-Tune Fit Sliders"
                          >
                            <Sliders size={15} />
                          </button>
                          <button
                            type="button"
                            className="cam-tool-btn"
                            onClick={() =>
                              setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))
                            }
                            title="Flip Front/Rear Camera"
                          >
                            <RefreshCw size={15} />
                          </button>
                        </div>

                        {/* Live Fit Sliders Drawer */}
                        {showSliders && (
                          <div className="tryon-sliders-panel">
                            <div className="slider-row">
                              <span>Scale ({Math.round(garmentScale * 100)}%)</span>
                              <input
                                type="range"
                                min="0.5"
                                max="1.6"
                                step="0.05"
                                value={garmentScale}
                                onChange={(e) => setGarmentScale(parseFloat(e.target.value))}
                              />
                            </div>
                            <div className="slider-row">
                              <span>Vertical Offset ({garmentOffsetY}px)</span>
                              <input
                                type="range"
                                min="-120"
                                max="150"
                                step="2"
                                value={garmentOffsetY}
                                onChange={(e) => setGarmentOffsetY(parseInt(e.target.value))}
                              />
                            </div>
                            <div className="slider-row">
                              <span>Fabric Blend ({Math.round(garmentOpacity * 100)}%)</span>
                              <input
                                type="range"
                                min="0.75"
                                max="1"
                                step="0.02"
                                value={garmentOpacity}
                                onChange={(e) => setGarmentOpacity(parseFloat(e.target.value))}
                              />
                            </div>
                          </div>
                        )}

                        {/* Bottom Shutter Capture Button */}
                        <div className="tryon-shutter-bar">
                          <button
                            type="button"
                            className="tryon-shutter-btn"
                            onClick={handleTakeSnapshot}
                            title="Capture Snapshot Look"
                          >
                            <div className="shutter-inner" />
                          </button>
                          <span className="shutter-label">Snap Look</span>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
              </div>
            ) : (
              /* 3D Avatar Mode */
              <div className="tryon-avatar-viewport">
                <div className="tryon-canvas-topbar">
                  <div className="tryon-gender-toggle">
                    <button
                      className={`tryon-g-btn ${gender === 'Male' ? 'active' : ''}`}
                      onClick={() => setGender('Male')}
                    >
                      Male
                    </button>
                    <button
                      className={`tryon-g-btn ${gender === 'Female' ? 'active' : ''}`}
                      onClick={() => setGender('Female')}
                    >
                      Female
                    </button>
                  </div>

                  <div className="tryon-fit-tag">
                    <ShieldCheck size={14} className="text-emerald" />
                    <span>Fit Accuracy: </span><strong>98%</strong>
                  </div>
                </div>

                <AvatarCanvas
                  gender={gender}
                  skinTone={skinTone}
                  hairColor={hairColor}
                  outfit={outfit}
                />

                {/* Skin Tone Swatches */}
                <div className="tryon-skin-swatches">
                  {['#fbe5d6', '#f7d0b5', '#d49b73', '#8d5524', '#4b2c11'].map((c) => (
                    <button
                      key={c}
                      style={{ background: c }}
                      className={`skin-dot ${skinTone === c ? 'active' : ''}`}
                      onClick={() => setSkinTone(c)}
                      aria-label="Select skin tone"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Equipped Item Details & Actions */}
          <div className="tryon-product-panel">
            <div>
              <div className="tryon-item-badge">Currently Fitted Item</div>
              <div className="tryon-item-card">
                <img src={transparentGarmentSrc} alt={product.name} className="tryon-thumb" />
                <div className="tryon-item-info">
                  <h4 className="tryon-prod-name">{product.name}</h4>
                  <div className="tryon-prod-price">
                    ₹{Number(product.price || 0).toLocaleString('en-IN')}
                  </div>
                  <div className="tryon-tag-row">
                    <span className="tryon-layer-pill">Category: {clothingType.toUpperCase()}</span>
                    <span className="tryon-vto-pill">✓ Anywear VTO Ready</span>
                  </div>
                </div>
              </div>

              {/* AI Fit & Style Advice */}
              <div className="tryon-ai-box">
                <div className="tryon-ai-header">
                  <Sparkles size={16} className="text-amber" />
                  <strong>Darwin AI Fit &amp; Style Advice:</strong>
                </div>
                <p className="tryon-ai-text">
                  {isFootwear
                    ? 'Engineered for high comfort and responsive cushioning. Inspect fit from every angle on your 3D avatar or align with feet in live camera mode.'
                    : 'This silhouette complements regular and relaxed builds. When paired with neutral layers or denim, fabric movement stays naturally structured with zero pull.'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="tryon-actions">
              <button
                type="button"
                className={`tryon-add-btn ${isAddedToCart ? 'added' : ''}`}
                onClick={handleAddToCart}
              >
                {isAddedToCart ? (
                  <>
                    <Check size={16} /> Added to Cart!
                  </>
                ) : (
                  <>
                    <ShoppingBag size={16} /> Add This Item to Cart
                  </>
                )}
              </button>

              <button
                type="button"
                className={`tryon-save-look-btn ${isSavedLook ? 'saved' : ''}`}
                onClick={handleSaveLook}
              >
                <Heart size={16} /> {isSavedLook ? 'Saved to Your Looks!' : 'Save This Look'}
              </button>

              <button
                type="button"
                className="tryon-full-studio-btn"
                onClick={() => {
                  onClose();
                  window.location.href = '/customer/avatar';
                }}
              >
                Open Full 3D Avatar Studio &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
