import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Check,
  CheckCircle2,
  Pencil,
  Search,
  ArrowRight,
  Heart,
  Star,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  Mic,
  Volume2
} from 'lucide-react';
import api from '../../services/api';
import './VoiceSearchModal.css';

/**
 * Google AI Multi-Color Star SVG
 */
export function GoogleAiStar({ size = 20, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="gAiStarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4285F4" />
          <stop offset="35%" stopColor="#EA4335" />
          <stop offset="70%" stopColor="#FBBC05" />
          <stop offset="100%" stopColor="#34A853" />
        </linearGradient>
      </defs>
      <path
        d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z"
        fill="url(#gAiStarGrad)"
      />
    </svg>
  );
}

export default function VoiceSearchModal({
  isOpen,
  onClose,
  onNavigateToProduct,
  onSearchInCatalog,
  onWishlistToggle
}) {
  // Screen states: 'listening' (2) -> 'analyzing' (3) -> 'confirm' (4) -> 'results' (5) or 'no_results' (6)
  const [screen, setScreen] = useState('listening');
  const [transcript, setTranscript] = useState('');
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);
  const [editableTranscript, setEditableTranscript] = useState('');
  const [checklistProgress, setChecklistProgress] = useState(0);

  // Search results state
  const [parsedIntent, setParsedIntent] = useState(null);
  const [products, setProducts] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [sortBy, setSortBy] = useState('best_match');
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [wishlistedMap, setWishlistedMap] = useState({});
  const [audioVolume, setAudioVolume] = useState(0);
  const [micError, setMicError] = useState('');
  const [isRecognizing, setIsRecognizing] = useState(false);

  // Web Speech Recognition & Audio stream refs
  const recognitionRef = useRef(null);
  const fullTranscriptRef = useRef('');
  const silenceTimeoutRef = useRef(null);
  const audioStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const animFrameRef = useRef(null);

  const isSpeechSupported = typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  // Cleanup helper
  const cleanupAudioAndRecognition = () => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioStreamRef.current) {
      try {
        audioStreamRef.current.getTracks().forEach((t) => t.stop());
      } catch {}
      audioStreamRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch {}
      audioContextRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setIsRecognizing(false);
    setAudioVolume(0);
  };

  // Start voice recognition when modal opens
  useEffect(() => {
    if (!isOpen) {
      cleanupAudioAndRecognition();
      return;
    }

    // Reset states on open
    setScreen('listening');
    setTranscript('');
    setEditableTranscript('');
    setIsEditingTranscript(false);
    setChecklistProgress(0);
    setActiveFilter('All');
    setSortBy('best_match');
    setMicError('');
    fullTranscriptRef.current = '';

    // 1. Request microphone permission & start real-time volume analyzer
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          audioStreamRef.current = stream;
          setMicError('');
          try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
              const audioCtx = new AudioCtx();
              audioContextRef.current = audioCtx;
              const source = audioCtx.createMediaStreamSource(stream);
              const analyser = audioCtx.createAnalyser();
              analyser.fftSize = 64;
              analyser.smoothingTimeConstant = 0.4;
              source.connect(analyser);

              const dataArray = new Uint8Array(analyser.frequencyBinCount);
              const measure = () => {
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                  sum += dataArray[i];
                }
                const avg = sum / dataArray.length;
                setAudioVolume(Math.min(1, avg / 40));
                animFrameRef.current = requestAnimationFrame(measure);
              };
              measure();
            }
          } catch (e) {
            console.warn('AudioContext volume visualization error:', e);
          }
        })
        .catch((err) => {
          console.warn('Microphone permission or access error:', err);
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setMicError('Microphone access was blocked. Please click the camera/mic icon in your address bar to allow access.');
          }
        });
    }

    // 2. Initialize Web Speech Recognition
    if (isSpeechSupported) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = navigator.language || 'en-IN';
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsRecognizing(true);
        };

        recognition.onresult = (event) => {
          let interim = '';
          let finalBlock = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const part = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalBlock += (finalBlock ? ' ' : '') + part;
            } else {
              interim += part;
            }
          }

          if (finalBlock) {
            fullTranscriptRef.current = (fullTranscriptRef.current ? fullTranscriptRef.current + ' ' : '') + finalBlock.trim();
          }

          const liveCombined = (fullTranscriptRef.current + ' ' + interim).trim();
          if (liveCombined) {
            setTranscript(liveCombined);
            setEditableTranscript(liveCombined);

            // Auto-advance after 2 seconds of silence once user finished talking
            if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = setTimeout(() => {
              if (liveCombined.trim().length > 1) {
                cleanupAudioAndRecognition();
                handleAnalyzeQuery(liveCombined.trim());
              }
            }, 2200);
          }
        };

        recognition.onerror = (event) => {
          console.warn('Speech recognition error event:', event.error);
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setMicError('Microphone permission blocked. Please allow microphone in browser URL settings.');
          }
        };

        recognition.onend = () => {
          setIsRecognizing(false);
          // If the recognition ended while still on listening screen:
          // If we captured speech, analyze it; otherwise, stay listening
          const captured = (fullTranscriptRef.current || transcript).trim();
          if (captured && screen === 'listening') {
            handleAnalyzeQuery(captured);
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('Speech recognition init error:', err);
      }
    } else {
      setMicError('Speech recognition is not supported in this browser. You can click a suggestion below or search manually.');
    }

    return () => {
      cleanupAudioAndRecognition();
    };
  }, [isOpen]);

  // Handle manual stop / search now button (Screen 2 -> Screen 3)
  const handleStopListening = () => {
    cleanupAudioAndRecognition();
    const finalVal = (fullTranscriptRef.current || transcript || editableTranscript).trim();
    if (finalVal) {
      setTranscript(finalVal);
      setEditableTranscript(finalVal);
      handleAnalyzeQuery(finalVal);
    } else {
      // Prompt user or fallback to suggestion
      const fallback = 'running shoes for morning jogging under 3000';
      setTranscript(fallback);
      setEditableTranscript(fallback);
      handleAnalyzeQuery(fallback);
    }
  };

  // Screen 3: Analyzing progression and backend query
  const handleAnalyzeQuery = async (queryText) => {
    setScreen('analyzing');
    setChecklistProgress(1); // Converting speech to text

    setTimeout(() => setChecklistProgress(2), 350); // Understanding what you need
    setTimeout(() => setChecklistProgress(3), 750); // Searching across products

    try {
      setIsLoadingSearch(true);
      const res = await api.post('/ai-write/voice-search', {
        transcript: queryText,
        activeFilter: 'All',
        sortBy: 'best_match'
      });

      setTimeout(() => {
        setChecklistProgress(4); // Finding the best results
        setTimeout(() => {
          setParsedIntent(res.data.parsedIntent || null);
          setProducts(res.data.products || []);
          setIsLoadingSearch(false);
          setScreen('confirm'); // Screen 4: Transcribed query confirmation
        }, 400);
      }, 1100);
    } catch (err) {
      console.error('Voice search failed:', err);
      setIsLoadingSearch(false);
      setScreen('confirm');
    }
  };

  // Screen 4: Search button clicked -> leads to Screen 5 or 6
  const handleExecuteSearch = async (overrideFilter = activeFilter) => {
    const query = editableTranscript.trim() || transcript;
    setIsLoadingSearch(true);

    try {
      const res = await api.post('/ai-write/voice-search', {
        transcript: query,
        activeFilter: overrideFilter,
        sortBy
      });

      setParsedIntent(res.data.parsedIntent || null);
      const prods = res.data.products || [];
      setProducts(prods);

      if (prods.length > 0) {
        setScreen('results'); // Screen 5: Smart search results
      } else {
        setScreen('no_results'); // Screen 6: No direct results
      }
    } catch (err) {
      console.error('Failed to execute search:', err);
      if (products.length > 0) {
        setScreen('results');
      } else {
        setScreen('no_results');
      }
    } finally {
      setIsLoadingSearch(false);
    }
  };

  // Change filter pill in Screen 5
  const handleFilterClick = async (pill) => {
    setActiveFilter(pill);
    await handleExecuteSearch(pill);
  };

  // Change sort in Screen 5
  const handleSortChange = async (e) => {
    const newSort = e.target.value;
    setSortBy(newSort);
    try {
      const res = await api.post('/ai-write/voice-search', {
        transcript: editableTranscript || transcript,
        activeFilter,
        sortBy: newSort
      });
      setProducts(res.data.products || []);
    } catch (err) {
      console.error('Sort change error:', err);
    }
  };

  // Click a suggestion chip in Screen 6
  const handleSuggestionClick = (suggestedText) => {
    setTranscript(suggestedText);
    setEditableTranscript(suggestedText);
    handleAnalyzeQuery(suggestedText);
  };

  // Wishlist heart toggle
  const toggleWishlist = (e, productId) => {
    e.stopPropagation();
    setWishlistedMap((prev) => ({
      ...prev,
      [productId]: !prev[productId]
    }));
    if (onWishlistToggle) onWishlistToggle(productId);
  };

  // Click product card -> navigate to detail & close modal
  const handleProductClick = (productId) => {
    if (onNavigateToProduct) {
      onNavigateToProduct(productId);
    }
    onClose();
  };

  // View all in catalog
  const handleViewAllInCatalog = () => {
    if (onSearchInCatalog) {
      onSearchInCatalog(parsedIntent?.cleanQuery || editableTranscript || transcript);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="vsm-overlay" onClick={onClose}>
      <div
        className={`vsm-container ${screen === 'results' ? 'vsm-wide' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Soft Google Pastel Ambient Bottom Glow */}
        <div className="vsm-bottom-glow" />

        {/* HEADER */}
        <div className="vsm-header">
          <div className="vsm-header-left">
            <GoogleAiStar size={20} />
            <span className="vsm-header-title">
              {screen === 'results' ? 'Voice Search Results' : 'Voice Search'}
            </span>
          </div>
          <button
            type="button"
            className="vsm-close-btn"
            onClick={onClose}
            title="Close voice search"
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="vsm-body">
          {/* =================================================================
              SCREEN 2: LISTENING SCREEN
             ================================================================= */}
          {screen === 'listening' && (
            <div className="vsm-listening-wrap">
              <div className="vsm-waveform-circles">
                <div className="vsm-circle-outer" />
                <div className="vsm-circle-middle" />
                <div className="vsm-circle-inner" />

                {/* 4 Dynamic Audio-Responsive Waveform Bars in Google AI Colors */}
                <div className="vsm-waveform-bars">
                  <div
                    className="vsm-wave-bar vsm-bar-blue"
                    style={{ height: `${Math.max(16, audioVolume * 65)}px` }}
                  />
                  <div
                    className="vsm-wave-bar vsm-bar-red"
                    style={{ height: `${Math.max(22, audioVolume * 75)}px` }}
                  />
                  <div
                    className="vsm-wave-bar vsm-bar-yellow"
                    style={{ height: `${Math.max(18, audioVolume * 60)}px` }}
                  />
                  <div
                    className="vsm-wave-bar vsm-bar-green"
                    style={{ height: `${Math.max(26, audioVolume * 80)}px` }}
                  />
                </div>
              </div>

              <h2 className="vsm-title">
                {transcript ? 'Listening to your voice...' : 'Listening...'}
              </h2>
              <p className="vsm-subtitle">
                {transcript
                  ? 'Keep speaking or tap "Search Now" when finished'
                  : 'Say product name, category, brand, or budget (e.g. "Shoes under 2000")'}
              </p>

              {/* Mic Error Banner if permission blocked */}
              {micError && (
                <div className="vsm-mic-error-alert">
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{micError}</span>
                </div>
              )}

              {/* Real-time Spoken Text Preview Bubble */}
              {transcript && (
                <div className="vsm-live-transcription-card">
                  <div className="vsm-live-badge">
                    <span className="vsm-live-dot" /> Live Voice Input
                  </div>
                  <p className="vsm-live-transcription-text">"{transcript}"</p>
                </div>
              )}

              {/* Action Buttons: Stop / Cancel / Search Now */}
              <div className="vsm-listening-actions">
                {transcript ? (
                  <button
                    type="button"
                    className="vsm-search-now-btn"
                    onClick={handleStopListening}
                  >
                    <Search size={15} />
                    <span>Search Now</span>
                  </button>
                ) : null}
                <button
                  type="button"
                  className="vsm-stop-btn"
                  onClick={handleStopListening}
                >
                  <span className="vsm-stop-icon" />
                  <span>{transcript ? 'Stop' : 'Tap to cancel'}</span>
                </button>
              </div>

              {/* Sample voice prompt suggestions */}
              <div className="vsm-prompt-suggestions">
                <button
                  type="button"
                  className="vsm-prompt-chip"
                  onClick={() => {
                    const q = 'running shoes for morning jogging under 3000';
                    setTranscript(q);
                    setEditableTranscript(q);
                    handleAnalyzeQuery(q);
                  }}
                >
                  Try: "Running shoes for morning jogging under 3000"
                </button>
                <button
                  type="button"
                  className="vsm-prompt-chip"
                  onClick={() => {
                    const q = 'wireless noise cancelling headphones';
                    setTranscript(q);
                    setEditableTranscript(q);
                    handleAnalyzeQuery(q);
                  }}
                >
                  Try: "Wireless noise cancelling headphones"
                </button>
                <button
                  type="button"
                  className="vsm-prompt-chip"
                  onClick={() => {
                    const q = 'Apple iPhone 15 Pro Max with 256GB';
                    setTranscript(q);
                    setEditableTranscript(q);
                    handleAnalyzeQuery(q);
                  }}
                >
                  Try: "Apple iPhone 15 Pro Max with 256GB"
                </button>
              </div>
            </div>
          )}

          {/* =================================================================
              SCREEN 3: ANALYZING WITH AI
             ================================================================= */}
          {screen === 'analyzing' && (
            <div className="vsm-analyzing-wrap">
              <div className="vsm-radiant-star-wrap">
                <div className="vsm-radiant-glow" />
                <GoogleAiStar size={54} />
              </div>

              <h2 className="vsm-title">Understanding your request...</h2>

              {/* Checklist progression */}
              <div className="vsm-checklist">
                <div className="vsm-checklist-item">
                  {checklistProgress >= 1 ? (
                    <CheckCircle2 size={16} className="vsm-checklist-icon-done" />
                  ) : (
                    <div className="vsm-checklist-icon-pending" />
                  )}
                  <span>Converting speech to text</span>
                </div>

                <div className="vsm-checklist-item">
                  {checklistProgress >= 2 ? (
                    <CheckCircle2 size={16} className="vsm-checklist-icon-done" />
                  ) : checklistProgress === 1 ? (
                    <div className="vsm-checklist-icon-spinner" />
                  ) : (
                    <div className="vsm-checklist-icon-pending" />
                  )}
                  <span>Understanding what you need</span>
                </div>

                <div className="vsm-checklist-item">
                  {checklistProgress >= 3 ? (
                    <CheckCircle2 size={16} className="vsm-checklist-icon-done" />
                  ) : checklistProgress === 2 ? (
                    <div className="vsm-checklist-icon-spinner" />
                  ) : (
                    <div className="vsm-checklist-icon-pending" />
                  )}
                  <span>Searching across products</span>
                </div>

                <div className="vsm-checklist-item">
                  {checklistProgress >= 4 ? (
                    <CheckCircle2 size={16} className="vsm-checklist-icon-done" />
                  ) : checklistProgress === 3 ? (
                    <div className="vsm-checklist-icon-spinner" />
                  ) : (
                    <div className="vsm-checklist-icon-pending" />
                  )}
                  <span>Finding the best results</span>
                </div>
              </div>

              {/* Speech bubble */}
              <div className="vsm-transcript-bubble">
                "{transcript || 'Running shoes for morning jogging...'}"
              </div>
            </div>
          )}

          {/* =================================================================
              SCREEN 4: TRANSCRIBED QUERY WITH EDIT OPTION
             ================================================================= */}
          {screen === 'confirm' && (
            <div className="vsm-confirm-wrap">
              <div className="vsm-success-circle">
                <Check size={26} strokeWidth={2.8} />
              </div>

              <h2 className="vsm-title">Here's what I heard</h2>

              {/* Editable transcript card */}
              <div className="vsm-query-box">
                {isEditingTranscript ? (
                  <input
                    type="text"
                    className="vsm-query-input"
                    value={editableTranscript}
                    onChange={(e) => setEditableTranscript(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setIsEditingTranscript(false);
                        handleExecuteSearch();
                      }
                    }}
                  />
                ) : (
                  <p className="vsm-query-text">
                    "{editableTranscript || transcript || 'running shoes for morning jogging under 3000'}"
                  </p>
                )}

                <button
                  type="button"
                  className="vsm-edit-btn"
                  onClick={() => setIsEditingTranscript(!isEditingTranscript)}
                  title={isEditingTranscript ? 'Done editing' : 'Edit query'}
                >
                  {isEditingTranscript ? <Check size={14} /> : <Pencil size={14} />}
                </button>
              </div>

              <p className="vsm-subtitle" style={{ marginBottom: '16px' }}>
                Did I get it right?
              </p>

              <div className="vsm-confirm-actions">
                <button
                  type="button"
                  className="vsm-btn-secondary"
                  onClick={() => handleExecuteSearch('All')}
                >
                  Search Anyway
                </button>
                <button
                  type="button"
                  className="vsm-btn-primary"
                  onClick={() => handleExecuteSearch()}
                >
                  {isLoadingSearch ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>
          )}

          {/* =================================================================
              SCREEN 5: SMART SEARCH RESULTS
             ================================================================= */}
          {screen === 'results' && (
            <div className="vsm-results-wrap">
              {/* Topbar with prompt pill + Edit button */}
              <div className="vsm-results-topbar">
                <span className="vsm-results-prompt-tag">
                  "{editableTranscript || transcript}"
                </span>
                <button
                  type="button"
                  className="vsm-results-edit-pill"
                  onClick={() => {
                    setIsEditingTranscript(true);
                    setScreen('confirm');
                  }}
                >
                  <Pencil size={11} />
                  <span>Edit</span>
                </button>
              </div>

              {/* AI Filter Tags */}
              <div className="vsm-filter-row">
                {(parsedIntent?.filterPills || ['All', 'Running Shoes', 'Men', 'Under ₹3000', 'Brands']).map((pill) => (
                  <button
                    key={pill}
                    type="button"
                    className={`vsm-filter-pill ${activeFilter === pill ? 'active' : ''}`}
                    onClick={() => handleFilterClick(pill)}
                  >
                    <span>{pill}</span>
                    {pill === 'Brands' && <ChevronDown size={12} />}
                  </button>
                ))}
              </div>

              {/* Results count & Sort */}
              <div className="vsm-meta-row">
                <span className="vsm-count-text">
                  Showing {products.length} {products.length === 1 ? 'result' : 'results'}
                </span>
                <select
                  className="vsm-sort-select"
                  value={sortBy}
                  onChange={handleSortChange}
                >
                  <option value="best_match">Sort By: Best Match</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating_desc">Highest Rated</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>

              {/* 4-Column Responsive Product Cards Grid */}
              <div className="vsm-products-grid">
                {products.map((p) => {
                  const isWish = wishlistedMap[p._id];
                  return (
                    <div
                      key={p._id}
                      className="vsm-product-card"
                      onClick={() => handleProductClick(p._id)}
                    >
                      <div className="vsm-card-img-wrap">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="vsm-card-img"
                          loading="lazy"
                        />
                        <button
                          type="button"
                          className={`vsm-card-heart ${isWish ? 'active' : ''}`}
                          onClick={(e) => toggleWishlist(e, p._id)}
                          title={isWish ? 'In Wishlist' : 'Add to Wishlist'}
                        >
                          <Heart size={13} fill={isWish ? '#ef4444' : 'none'} />
                        </button>
                      </div>

                      <h4 className="vsm-card-title" title={p.name}>
                        {p.name}
                      </h4>

                      <div className="vsm-card-rating">
                        <Star size={11} fill="#f59e0b" className="vsm-star-icon" />
                        <span>{Number(p.rating || 4.3).toFixed(1)}</span>
                        <span className="vsm-rating-count">
                          ({p.ratingCount > 1000 ? `${(p.ratingCount / 1000).toFixed(1)}K` : p.ratingCount || '120'})
                        </span>
                      </div>

                      <div className="vsm-card-price-row">
                        <span className="vsm-price-current">
                          ₹{Number(p.price).toLocaleString('en-IN')}
                        </span>
                        {p.originalPrice && p.originalPrice > p.price && (
                          <span className="vsm-price-original">
                            ₹{Number(p.originalPrice).toLocaleString('en-IN')}
                          </span>
                        )}
                        {p.discountPercentage > 0 && (
                          <span className="vsm-price-discount">
                            {p.discountPercentage}% OFF
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer link to view full catalog */}
              <div className="vsm-results-footer">
                <button
                  type="button"
                  className="vsm-view-catalog-link"
                  onClick={handleViewAllInCatalog}
                >
                  <span>View all results in catalog</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}

          {/* =================================================================
              SCREEN 6: ALTERNATIVE SCENE - NO DIRECT RESULTS
             ================================================================= */}
          {screen === 'no_results' && (
            <div className="vsm-noresults-wrap">
              <div className="vsm-noresults-icon-wrap">
                <Search size={28} />
              </div>

              <h2 className="vsm-title">No exact matches found</h2>
              <p className="vsm-subtitle">Here are some similar results</p>

              {/* 2 Rows of Clickable Suggested Search Pills */}
              <div className="vsm-suggestions-grid">
                {(parsedIntent?.suggestedQueries || [
                  'Running shoes',
                  'Jogging shoes',
                  'Sports shoes',
                  'Under ₹3000',
                  "Men's shoes",
                  'Morning workout shoes'
                ]).map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="vsm-suggestion-pill"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    '{suggestion}'
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="vsm-show-all-link"
                onClick={handleViewAllInCatalog}
              >
                <span>Show all results</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

