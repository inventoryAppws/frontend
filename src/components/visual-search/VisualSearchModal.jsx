import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Search, Sparkles, Star, ArrowRight, RotateCcw } from 'lucide-react';
import api from '../../services/api';
import './VisualSearchModal.css';

const SAMPLE_INSPIRATIONS = [
  {
    tag: 'Running Shoes',
    label: 'Shoes',
    img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&auto=format&fit=crop&q=80'
  },
  {
    tag: 'Backpack',
    label: 'Bag',
    img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200&auto=format&fit=crop&q=80'
  },
  {
    tag: 'Headphones',
    label: 'Audio',
    img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&auto=format&fit=crop&q=80'
  },
  {
    tag: 'Chair',
    label: 'Furniture',
    img: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=200&auto=format&fit=crop&q=80'
  }
];

export default function VisualSearchModal({ isOpen, onClose, onNavigateToProduct }) {
  // States: 'idle' -> 'scanning' -> 'results'
  const [state, setState] = useState('idle');
  const [previewImage, setPreviewImage] = useState(null);
  const [detectedTag, setDetectedTag] = useState('Shoes');
  const [results, setResults] = useState([]);
  const [filterTags, setFilterTags] = useState(['All', 'Shoes', 'Men', 'Sports', 'Casual']);
  const [activeFilter, setActiveFilter] = useState('All');
  const [isCameraActive, setIsCameraActive] = useState(false);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  if (!isOpen) return null;

  const handleClose = () => {
    stopCamera();
    setState('idle');
    setPreviewImage(null);
    onClose();
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Start webcam
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      // Fallback to sample image
      handleSelectSample(SAMPLE_INSPIRATIONS[0]);
    }
  };

  // Snap photo from video
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg');
    stopCamera();
    processImageSearch(dataUrl, 'Visual Search Photo');
  };

  // File upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      processImageSearch(reader.result, file.name.replace(/\.[^/.]+$/, ''));
    };
    reader.readAsDataURL(file);
  };

  // Process search with scanning delay
  const processImageSearch = async (imgData, tag) => {
    setPreviewImage(imgData);
    setState('scanning');

    try {
      const res = await api.post('/visual-search/search', {
        image: imgData,
        detectedTag: tag
      });

      setTimeout(() => {
        setDetectedTag(res.data.detectedItem || tag);
        setFilterTags(res.data.tags || ['All', 'Shoes', 'Men', 'Sports', 'Casual']);
        setResults(res.data.products || []);
        setState('results');
      }, 1400); // 1.4s scan animation
    } catch (err) {
      console.error('Visual search failed:', err);
      setState('idle');
    }
  };

  const handleSelectSample = (sample) => {
    stopCamera();
    processImageSearch(sample.img, sample.tag);
  };

  const handleFilterPillClick = async (pill) => {
    setActiveFilter(pill);
    try {
      const res = await api.post('/visual-search/search', {
        detectedTag: detectedTag,
        category: pill === 'All' ? 'all' : pill
      });
      setResults(res.data.products || []);
    } catch (err) {
      console.error('Filter visual results error:', err);
    }
  };

  return (
    <div className="vsm-vis-overlay" onClick={handleClose}>
      <div className="vsm-vis-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="vsm-vis-header">
          <div className="vsm-vis-title-wrap">
            <Camera size={18} color="#4f46e5" />
            <h3 className="vsm-vis-title">Search by Image</h3>
          </div>
          <button type="button" className="vsm-vis-close" onClick={handleClose}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="vsm-vis-body">
          {/* 1. IDLE / CAPTURE VIEW */}
          {state === 'idle' && (
            <>
              {isCameraActive ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                  <div style={{ width: '100%', maxWidth: '400px', height: '260px', borderRadius: '16px', overflow: 'hidden', background: '#000', marginBottom: '16px' }}>
                    <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="button" className="vsm-vis-btn vsm-vis-btn-primary" onClick={capturePhoto}>
                      <Camera size={16} /> Take Photo
                    </button>
                    <button type="button" className="vsm-vis-btn vsm-vis-btn-outline" onClick={stopCamera}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="vsm-vis-pulse-wrap">
                    <div className="vsm-vis-ring-outer" />
                    <div className="vsm-vis-ring-inner" />
                    <div className="vsm-vis-icon-center">
                      <Camera size={30} />
                    </div>
                  </div>

                  <h2 className="vsm-vis-heading">Find products with a photo</h2>
                  <p className="vsm-vis-sub">
                    Take a photo or upload an image to find exact or visually similar items across our catalog.
                  </p>

                  <div className="vsm-vis-actions">
                    <button type="button" className="vsm-vis-btn vsm-vis-btn-primary" onClick={startCamera}>
                      <Camera size={16} />
                      <span>Take Photo</span>
                    </button>
                    <button
                      type="button"
                      className="vsm-vis-btn vsm-vis-btn-outline"
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    >
                      <Upload size={16} />
                      <span>Upload Image</span>
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      accept="image/*"
                      onChange={handleFileUpload}
                    />
                  </div>

                  {/* Sample Inspirations */}
                  <span className="vsm-vis-samples-title">Try these examples</span>
                  <div className="vsm-vis-samples-row">
                    {SAMPLE_INSPIRATIONS.map((s) => (
                      <div
                        key={s.label}
                        className="vsm-vis-sample-card"
                        onClick={() => handleSelectSample(s)}
                      >
                        <img src={s.img} alt={s.label} className="vsm-vis-sample-img" />
                        <span>{s.label}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {/* 2. SCANNING ANIMATION VIEW */}
          {state === 'scanning' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' }}>
              <div className="vsm-vis-scanner-box">
                <img src={previewImage} alt="Scanning target" className="vsm-vis-scanner-img" />
                <div className="vsm-vis-scan-line" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', margin: '0 0 6px' }}>
                Analyzing Visual Features...
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                Scanning contours, textures & matching catalog items
              </p>
            </div>
          )}

          {/* 3. RESULTS VIEW */}
          {state === 'results' && (
            <div className="vsm-vis-results-wrap">
              <div className="vsm-vis-preview-bar">
                <img src={previewImage} alt="Search query" className="vsm-vis-thumb" />
                <div className="vsm-vis-preview-info">
                  <span className="vsm-vis-preview-label">Similar products for</span>
                  <div className="vsm-vis-preview-tag">{detectedTag}</div>
                </div>
                <button
                  type="button"
                  className="vsm-vis-reupload-btn"
                  onClick={() => {
                    setState('idle');
                    setPreviewImage(null);
                  }}
                >
                  <RotateCcw size={12} style={{ display: 'inline', marginRight: 4 }} />
                  New Photo
                </button>
              </div>

              {/* Filter pills */}
              <div className="vsm-vis-filter-row">
                {filterTags.map((pill) => (
                  <button
                    key={pill}
                    type="button"
                    className={`vsm-vis-filter-pill ${activeFilter === pill ? 'active' : ''}`}
                    onClick={() => handleFilterPillClick(pill)}
                  >
                    {pill}
                  </button>
                ))}
              </div>

              {/* Product grid */}
              <div className="vsm-vis-grid">
                {results.map((p) => (
                  <div
                    key={p._id}
                    className="vsm-vis-card"
                    onClick={() => {
                      if (onNavigateToProduct) onNavigateToProduct(p._id);
                      handleClose();
                    }}
                  >
                    <div className="vsm-vis-card-img-wrap">
                      <img src={p.image} alt={p.name} className="vsm-vis-card-img" />
                      <span className="vsm-vis-card-match">{p.similarity || '94% Match'}</span>
                    </div>
                    <h4 className="vsm-vis-card-title">{p.name}</h4>
                    <div className="vsm-vis-card-rating">
                      <Star size={11} fill="#f59e0b" color="#f59e0b" />
                      <span>{Number(p.rating || 4.3).toFixed(1)}</span>
                    </div>
                    <span className="vsm-vis-card-price">
                      ₹{Number(p.price).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

