import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Search,
  MapPin,
  Crosshair,
  Home,
  Briefcase,
  MapPinOff,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Navigation,
  Sparkles
} from 'lucide-react';
import L from 'leaflet';
import { reverseGeocode, searchLocation, getLocationSettings } from '../../services/locationService';
import { getAddresses, createAddress, updateAddress, setDefaultAddress } from '../../services/addressService';
import { getMyProfile } from '../../services/customerService';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../utils/errorHandler';

// Custom SVG Pin Icon with attached tooltip
const createCustomPin = () =>
  L.divIcon({
    className: 'custom-leaflet-pin-container',
    html: `
      <div class="custom-leaflet-pin-wrapper">
        <div class="custom-leaflet-tooltip-badge">Drag the pin to adjust location</div>
        <svg class="custom-leaflet-pin-icon" viewBox="0 0 384 512" fill="#4f46e5" xmlns="http://www.w3.org/2000/svg">
          <path d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0z"/>
          <circle cx="192" cy="192" r="70" fill="#ffffff"/>
        </svg>
      </div>
    `,
    iconSize: [38, 70],
    iconAnchor: [19, 70],
  });

const DEFAULT_COORDS = { lat: 17.7289, lng: 83.3195 }; // Visakhapatnam default

const TILE_URLS = {
  osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  positron: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  hot: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png'
};

export default function AddressMapModal({
  isOpen,
  onClose,
  onSuccess,
  initialAddress = null,
  customerProfile = null
}) {
  const { user } = useAuth() || {};

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    type: 'Home',
    saveAs: '',
    house: '',
    area: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false,
    formattedAddress: '',
  });

  const [coords, setCoords] = useState(DEFAULT_COORDS);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [pinnedSuccess, setPinnedSuccess] = useState(false);

  // Map references
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const suggestionsBoxRef = useRef(null);

  // Initialize or reset form when modal opens
  useEffect(() => {
    if (!isOpen) return;

    setError('');
    setPinnedSuccess(false);

    const settings = getLocationSettings();

    if (initialAddress) {
      const initLat = initialAddress.coordinates?.lat || DEFAULT_COORDS.lat;
      const initLng = initialAddress.coordinates?.lng || DEFAULT_COORDS.lng;
      setCoords({ lat: initLat, lng: initLng });

      setFormData({
        fullName: initialAddress.fullName || customerProfile?.name || user?.name || '',
        phone: initialAddress.phone || customerProfile?.phone || user?.phone || '',
        type: initialAddress.type || 'Home',
        saveAs: initialAddress.saveAs || '',
        house: initialAddress.house || initialAddress.addressLine1 || '',
        area: initialAddress.area || initialAddress.addressLine2 || '',
        city: initialAddress.city || '',
        state: initialAddress.state || '',
        pincode: initialAddress.pincode || '',
        isDefault: !!initialAddress.isDefault,
        formattedAddress: initialAddress.formattedAddress || initialAddress.addressLine1 || '',
      });
      setSearchQuery(initialAddress.city || initialAddress.area || '');
    } else {
      // Auto-fill customer details from profile, localStorage or auth context!
      let initialName = customerProfile?.name || user?.name || '';
      let initialPhone = customerProfile?.phone || user?.phone || '';

      if (!initialName || !initialPhone) {
        try {
          const cachedProfile = JSON.parse(localStorage.getItem('customer_profile') || '{}');
          if (!initialName && cachedProfile.name) initialName = cachedProfile.name;
          if (!initialPhone && cachedProfile.phone) initialPhone = cachedProfile.phone;
        } catch {}
      }

      if (!initialName || !initialPhone) {
        try {
          const cachedUser = JSON.parse(localStorage.getItem('user') || '{}');
          if (!initialName && cachedUser.name) initialName = cachedUser.name;
          if (!initialPhone && cachedUser.phone) initialPhone = cachedUser.phone;
        } catch {}
      }

      setFormData({
        fullName: initialName,
        phone: initialPhone,
        type: 'Home',
        saveAs: '',
        house: '',
        area: '',
        city: '',
        state: '',
        pincode: '',
        isDefault: false,
        formattedAddress: '',
      });

      // Asynchronous deep fetch: /customers/me and /addresses to auto-patch if still missing
      let isMounted = true;
      (async () => {
        try {
          let fetchedName = initialName;
          let fetchedPhone = initialPhone;

          // 1. Fetch from /customers/me
          if (!fetchedName || !fetchedPhone) {
            const prof = await getMyProfile().catch(() => null);
            if (prof) {
              if (!fetchedName && prof.name) fetchedName = prof.name;
              if (!fetchedPhone && prof.phone) fetchedPhone = prof.phone;
              try {
                localStorage.setItem('customer_profile', JSON.stringify(prof));
              } catch {}
            }
          }

          // 2. If phone or name still missing, check previously saved addresses
          if (!fetchedName || !fetchedPhone) {
            const addrs = await getAddresses().catch(() => []);
            if (Array.isArray(addrs) && addrs.length > 0) {
              const latestWithPhone = addrs.find((a) => a.phone) || addrs[0];
              if (!fetchedName && latestWithPhone?.fullName) fetchedName = latestWithPhone.fullName;
              if (!fetchedPhone && latestWithPhone?.phone) fetchedPhone = latestWithPhone.phone;
            }
          }

          if (isMounted && (fetchedName || fetchedPhone)) {
            setFormData((prev) => ({
              ...prev,
              fullName: prev.fullName || fetchedName || '',
              phone: prev.phone || fetchedPhone || '',
            }));
          }
        } catch (err) {
          console.error('Error auto-patching customer details:', err);
        }
      })();

      // Browser GPS detection if enabled in settings
      if (settings.autoDetectGps && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const userCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setCoords(userCoords);
            handleReverseGeocode(userCoords.lat, userCoords.lng);
          },
          () => {
            setCoords(DEFAULT_COORDS);
            handleReverseGeocode(DEFAULT_COORDS.lat, DEFAULT_COORDS.lng);
          },
          { enableHighAccuracy: true, timeout: 6000 }
        );
      } else {
        handleReverseGeocode(DEFAULT_COORDS.lat, DEFAULT_COORDS.lng);
      }

      return () => {
        isMounted = false;
      };
    }
  }, [isOpen, initialAddress, customerProfile, user]);

  // Handle Reverse Geocode
  const handleReverseGeocode = useCallback(async (lat, lng) => {
    setGeocoding(true);
    try {
      const res = await reverseGeocode(lat, lng);
      if (res) {
        setFormData((prev) => ({
          ...prev,
          house: res.house || prev.house,
          area: res.area || prev.area,
          city: res.city || prev.city,
          state: res.state || prev.state,
          pincode: res.pincode || prev.pincode,
          formattedAddress: res.formattedAddress || res.displayName || `${res.area || ''}, ${res.city || ''}`.trim(),
        }));
        setPinnedSuccess(true);
      }
    } catch (err) {
      console.error('Failed to reverse geocode:', err);
    } finally {
      setGeocoding(false);
    }
  }, []);

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (err) {
        console.warn('Leaflet remove cleanup:', err);
      }
      mapInstanceRef.current = null;
    }

    // Crucial: remove any stale Leaflet ID on the DOM container to prevent "Map container is already initialized" error
    if (mapContainerRef.current._leaflet_id) {
      delete mapContainerRef.current._leaflet_id;
    }

    const settings = getLocationSettings();
    const tileUrl = TILE_URLS[settings.tileLayer] || TILE_URLS.osm;

    const currentLat = Number(coords?.lat) || DEFAULT_COORDS.lat;
    const currentLng = Number(coords?.lng) || DEFAULT_COORDS.lng;

    const map = L.map(mapContainerRef.current, {
      center: [currentLat, currentLng],
      zoom: 15,
      zoomControl: true,
    });
    mapInstanceRef.current = map;

    L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const marker = L.marker([currentLat, currentLng], {
      draggable: true,
      icon: createCustomPin(),
    }).addTo(map);
    markerRef.current = marker;

    marker.on('dragend', (e) => {
      const position = e.target.getLatLng();
      setCoords({ lat: position.lat, lng: position.lng });
      handleReverseGeocode(position.lat, position.lng);
    });

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      map.panTo([lat, lng]);
      setCoords({ lat, lng });
      handleReverseGeocode(lat, lng);
    });

    // Multi-interval size invalidation to handle modal entry transitions
    const timers = [
      setTimeout(() => map.invalidateSize(), 50),
      setTimeout(() => map.invalidateSize(), 150),
      setTimeout(() => map.invalidateSize(), 300),
      setTimeout(() => map.invalidateSize(), 600),
    ];

    let ro;
    if (window.ResizeObserver && mapContainerRef.current) {
      ro = new ResizeObserver(() => {
        try {
          map.invalidateSize();
        } catch {}
      });
      ro.observe(mapContainerRef.current);
    }

    return () => {
      timers.forEach(clearTimeout);
      if (ro) ro.disconnect();
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
      }
      if (mapContainerRef.current && mapContainerRef.current._leaflet_id) {
        delete mapContainerRef.current._leaflet_id;
      }
    };
  }, [isOpen]);

  // Sync marker and view when coords change externally (GPS or suggestion selection)
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current && coords?.lat && coords?.lng) {
      const lat = Number(coords.lat);
      const lng = Number(coords.lng);
      if (!isNaN(lat) && !isNaN(lng)) {
        mapInstanceRef.current.setView([lat, lng], mapInstanceRef.current.getZoom() || 15);
        markerRef.current.setLatLng([lat, lng]);
      }
    }
  }, [coords.lat, coords.lng]);

  const updateMapPosition = (lat, lng, zoom = 16) => {
    setCoords({ lat, lng });
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([lat, lng], zoom);
      markerRef.current.setLatLng([lat, lng]);
    }
    handleReverseGeocode(lat, lng);
  };

  // Autocomplete Location Search
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!val || val.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSearching(false);
      return;
    }

    setSearching(true);
    setShowSuggestions(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchLocation(val.trim());
        setSuggestions(Array.isArray(results) ? results : []);
        setShowSuggestions(true);
      } catch (err) {
        console.error('Place search failed:', err);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const handleSelectSuggestion = (place) => {
    setShowSuggestions(false);
    const placeName = place.name || place.displayName || place.area;
    setSearchQuery(placeName);
    updateMapPosition(place.lat, place.lng);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsBoxRef.current && !suggestionsBoxRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const { latitude, longitude } = pos.coords;
        updateMapPosition(latitude, longitude, 17);
      },
      () => {
        setLocating(false);
        setError('Unable to detect current GPS location. Please check browser permissions.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo([coords.lat, coords.lng]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError('');
  };

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError('');

    // Validations: Full Name, Phone, Area, City, State, Pincode required. House is OPTIONAL!
    if (!formData.fullName.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!formData.phone.trim() || !/^\d{10}$/.test(formData.phone.trim())) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!formData.area.trim()) {
      setError('Street / Area / Locality is required.');
      return;
    }
    if (!formData.city.trim()) {
      setError('City is required.');
      return;
    }
    if (!formData.state.trim()) {
      setError('State is required.');
      return;
    }
    if (!formData.pincode.trim() || !/^\d{6}$/.test(formData.pincode.trim())) {
      setError('Please enter a valid 6-digit pincode.');
      return;
    }

    setSaving(true);
    try {
      const houseStr = formData.house.trim();
      const areaStr = formData.area.trim();
      const primaryLine = houseStr ? `${houseStr}, ${areaStr}` : areaStr;

      const payload = {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        type: formData.type || 'Home',
        saveAs: formData.saveAs.trim() || formData.type,
        house: houseStr,
        area: areaStr,
        addressLine1: primaryLine,
        addressLine2: houseStr ? areaStr : '',
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        isDefault: !!formData.isDefault,
        coordinates: {
          lat: Number(coords.lat),
          lng: Number(coords.lng),
        },
        formattedAddress:
          formData.formattedAddress.trim() ||
          `${primaryLine}, ${formData.city.trim()}, ${formData.state.trim()} - ${formData.pincode.trim()}`,
      };

      let saved;
      if (initialAddress?._id) {
        saved = await updateAddress(initialAddress._id, payload);
      } else {
        saved = await createAddress(payload);
      }

      const addressResult = saved?.address || saved;

      if (formData.isDefault && addressResult?._id) {
        try {
          await setDefaultAddress(addressResult._id);
        } catch {}
      }

      try {
        localStorage.setItem('selected_delivery_address', JSON.stringify(addressResult));
        window.dispatchEvent(new CustomEvent('delivery-address-changed', { detail: addressResult }));
      } catch {}

      try {
        const cached = JSON.parse(localStorage.getItem('customer_profile') || '{}');
        let updated = false;
        if (!cached.name && formData.fullName) { cached.name = formData.fullName.trim(); updated = true; }
        if (!cached.phone && formData.phone) { cached.phone = formData.phone.trim(); updated = true; }
        if (updated) localStorage.setItem('customer_profile', JSON.stringify(cached));
      } catch {}

      if (onSuccess) onSuccess(addressResult);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="map-modal-backdrop" onClick={onClose}>
      <div className="map-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* MODAL HEADER */}
        <div className="map-modal-header">
          <div className="map-modal-title-wrap">
            <h2>{initialAddress ? 'Edit Delivery Address' : 'Add Delivery Address'}</h2>

            {/* SLEEK MODERN STEPPER */}
            <div className="modern-map-stepper">
              <div className="stepper-step completed">
                <div className="stepper-circle">
                  <Check size={12} strokeWidth={3} />
                </div>
                <span className="stepper-text">1. Pin on Map</span>
              </div>
              <div className="stepper-connector active" />
              <div className="stepper-step active">
                <div className="stepper-circle">2</div>
                <span className="stepper-text">2. Address Details</span>
              </div>
              <div className="stepper-connector" />
              <div className="stepper-step">
                <div className="stepper-circle">3</div>
                <span className="stepper-text">3. Save</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="map-modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="map-modal-body">
          {error && (
            <div className="err-banner" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b91c1c', background: '#fef2f2', padding: '10px 14px', borderRadius: '10px', fontSize: '13px' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* SEARCH & USE LOCATION ROW */}
          <div className="map-search-row" ref={suggestionsBoxRef}>
            <div className="map-search-input-box">
              <Search size={16} className="map-search-icon" />
              <input
                type="text"
                className="map-search-input"
                placeholder="Search area, landmark, village or street..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => searchQuery.trim().length >= 2 && setShowSuggestions(true)}
              />
              {searching && (
                <div style={{ position: 'absolute', right: '36px' }}>
                  <Loader2 size={15} className="spin-animate" color="#4f46e5" />
                </div>
              )}
              {searchQuery && !searching && (
                <button
                  type="button"
                  className="map-search-clear-btn"
                  onClick={() => {
                    setSearchQuery('');
                    setSuggestions([]);
                    setShowSuggestions(false);
                  }}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}

              {/* RICH AUTOCOMPLETE DROPDOWN */}
              {showSuggestions && (
                <div className="map-search-suggestions-box">
                  {searching ? (
                    <div className="map-search-status-row">
                      <Loader2 size={15} className="spin-animate" color="#4f46e5" />
                      <span>Searching places...</span>
                    </div>
                  ) : suggestions.length === 0 ? (
                    <div className="map-search-status-row">
                      <span>No matching places found for &ldquo;{searchQuery}&rdquo;</span>
                    </div>
                  ) : (
                    suggestions.map((item, idx) => {
                      const primaryTitle = item.name || item.area || item.city || item.addressLine1 || 'Location';
                      const subtitle = item.formattedAddress || item.displayName || '';

                      return (
                        <button
                          key={item.placeId || idx}
                          type="button"
                          className="map-suggestion-item"
                          onClick={() => handleSelectSuggestion(item)}
                        >
                          <div className="map-suggestion-icon-wrap">
                            <MapPin size={15} />
                          </div>
                          <div className="map-suggestion-text-wrap">
                            <div className="map-suggestion-title">
                              <span>{primaryTitle}</span>
                              {item.type && (
                                <span className="map-suggestion-type-tag">
                                  {item.type.toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="map-suggestion-sub">
                              {subtitle}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              className="map-use-location-btn"
              onClick={handleUseMyLocation}
              disabled={locating}
              title="Detect current location via browser GPS"
            >
              {locating ? <Loader2 size={16} className="spin-animate" /> : <Crosshair size={16} />}
              <span>{locating ? 'Locating...' : 'Use My Location'}</span>
            </button>
          </div>

          {/* LEAFLET MAP CONTAINER */}
          <div className="map-container-frame" style={{ minHeight: '280px', height: '280px', width: '100%', position: 'relative' }}>
            <div ref={mapContainerRef} className="leaflet-map-canvas" style={{ height: '100%', width: '100%', minHeight: '280px' }} />

            {/* Floating Selected Location Card on Map */}
            <div className="map-selected-location-overlay">
              <MapPin size={18} className="map-selected-location-icon" />
              <div className="map-selected-location-info">
                <span className="map-selected-location-label">
                  {geocoding ? 'Detecting address...' : 'Selected Location'}
                </span>
                <span className="map-selected-location-text">
                  {geocoding
                    ? 'Fetching address from coordinates...'
                    : formData.formattedAddress || `${formData.area || 'Current Location'}, ${formData.city || ''}`}
                </span>
              </div>
            </div>

            {/* Recenter button */}
            <button
              type="button"
              className="map-recenter-btn"
              onClick={handleRecenter}
              title="Recenter pin on map"
            >
              <Navigation size={18} />
            </button>
          </div>

          {/* SUCCESS STATUS BANNER */}
          {pinnedSuccess && (
            <div className="map-pinned-success-banner">
              <CheckCircle2 size={17} />
              <span>Location pinned successfully! Details auto-filled below.</span>
            </div>
          )}

          {/* ADDRESS DETAILS FORM */}
          <form onSubmit={handleSave} className="map-address-form-section">
            <h3 className="map-form-section-title">Address Details</h3>

            {/* ADDRESS TYPE CHIPS */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                Address Type
              </div>
              <div className="map-type-chips-row">
                <button
                  type="button"
                  className={`map-type-chip ${formData.type === 'Home' ? 'active' : ''}`}
                  onClick={() => setFormData((prev) => ({ ...prev, type: 'Home' }))}
                >
                  <Home size={15} />
                  <span>Home</span>
                </button>
                <button
                  type="button"
                  className={`map-type-chip ${formData.type === 'Work' ? 'active' : ''}`}
                  onClick={() => setFormData((prev) => ({ ...prev, type: 'Work' }))}
                >
                  <Briefcase size={15} />
                  <span>Work</span>
                </button>
                <button
                  type="button"
                  className={`map-type-chip ${formData.type === 'Others' ? 'active' : ''}`}
                  onClick={() => setFormData((prev) => ({ ...prev, type: 'Others' }))}
                >
                  <MapPinOff size={15} />
                  <span>Others</span>
                </button>
              </div>
            </div>

            {/* FORM INPUTS GRID */}
            <div className="map-form-grid">
              <div className="map-form-group">
                <label>
                  Save As (optional)
                </label>
                <input
                  type="text"
                  name="saveAs"
                  className="map-form-input"
                  placeholder="e.g. My Apartment, Mom's House"
                  value={formData.saveAs}
                  onChange={handleInputChange}
                />
              </div>

              <div className="map-form-group">
                <label>
                  Full Name <span className="req">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  className="map-form-input"
                  placeholder="Receiver's full name"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="map-form-group">
                <label>
                  10-Digit Mobile Number <span className="req">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  className="map-form-input"
                  placeholder="9876543210"
                  maxLength={10}
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* HOUSE / BUILDING IS NOW OPTIONAL */}
              <div className="map-form-group">
                <label>
                  Flat / House / Building <span style={{ color: '#64748b', fontWeight: 400 }}>(Optional)</span>
                </label>
                <input
                  type="text"
                  name="house"
                  className="map-form-input"
                  placeholder="Flat 402, Lotus Residency (Optional)"
                  value={formData.house}
                  onChange={handleInputChange}
                />
              </div>

              <div className="map-form-group full-width">
                <label>
                  Street / Area / Locality <span className="req">*</span>
                </label>
                <input
                  type="text"
                  name="area"
                  className="map-form-input"
                  placeholder="Beach Road, Near Kali Temple"
                  value={formData.area}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="map-form-group">
                <label>
                  City <span className="req">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  className="map-form-input"
                  placeholder="City / District"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="map-form-group">
                <label>
                  State <span className="req">*</span>
                </label>
                <input
                  type="text"
                  name="state"
                  className="map-form-input"
                  placeholder="State"
                  value={formData.state}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="map-form-group">
                <label>
                  Pincode <span className="req">*</span>
                </label>
                <input
                  type="text"
                  name="pincode"
                  className="map-form-input"
                  placeholder="530003"
                  maxLength={6}
                  value={formData.pincode}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* DEFAULT CHECKBOX */}
              <div className="map-form-group full-width">
                <label className="map-default-checkbox-wrap">
                  <input
                    type="checkbox"
                    name="isDefault"
                    checked={formData.isDefault}
                    onChange={handleInputChange}
                  />
                  <span>Make this my default delivery address</span>
                </label>
              </div>
            </div>

            {/* FOOTER ACTIONS */}
            <div className="map-modal-footer-actions">
              <button
                type="button"
                className="btn-map-cancel"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-map-save"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="spin-animate" />
                    <span>Saving Address...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>{initialAddress ? 'Update Address' : 'Save Address'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
