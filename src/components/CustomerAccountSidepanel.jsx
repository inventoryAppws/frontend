import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  X,
  User,
  Camera,
  Wallet,
  MapPin,
  CreditCard,
  Plus,
  Search,
  Check,
  CheckCircle2,
  ShieldCheck,
  Pencil,
  Trash2,
  Building2,
  Phone,
  Mail,
  Calendar,
  Lock,
  ArrowRight,
  ChevronRight,
  ArrowLeft,
  AlertCircle,
  Crosshair,
  Loader2,
  Bookmark,
  ShoppingBag,
  RotateCcw,
  Sparkles,
  DollarSign,
  Settings,
  ChevronDown,
  Upload,
  Users
} from "lucide-react";
import CameraCaptureModal from "./CameraCaptureModal";
import { toast } from "./Toast";
import L from "leaflet";
import { topUpWallet } from "../services/walletService";
import { getTransactions } from "../services/transactionService";
import {
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
} from "../services/addressService";
import {
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod
} from "../services/paymentMethodService";
import {
  reverseGeocode,
  searchLocation,
  getLocationSettings
} from "../services/locationService";
import { updateMyProfile } from "../services/customerService";
import { getErrorMessage } from "../utils/errorHandler";
import "../styles/account-sidepanel.css";

// In-browser canvas image compressor (320x320 max, 88% JPEG, accepts File/Blob or base64 dataURL)
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const processImageSrc = (src) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        const elem = document.createElement("canvas");
        const maxSize = 320;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        elem.width = width;
        elem.height = height;
        const ctx = elem.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(elem.toDataURL("image/jpeg", 0.88));
      };
      img.onerror = (err) => reject(err);
    };

    if (typeof file === "string") {
      processImageSrc(file);
    } else {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => processImageSrc(event.target.result);
      reader.onerror = (err) => reject(err);
    }
  });
};

const DEFAULT_COORDS = { lat: 17.7289, lng: 83.3195 }; // Visakhapatnam default

const TILE_URLS = {
  osm: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  positron: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  hot: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
};

// Custom SVG Pin Icon
const createCustomPin = () =>
  L.divIcon({
    className: "custom-leaflet-pin-container",
    html: `
      <div class="custom-leaflet-pin-wrapper">
        <div class="custom-leaflet-tooltip-badge">Drag to pin exact location</div>
        <svg class="custom-leaflet-pin-icon" viewBox="0 0 384 512" fill="#2563eb" xmlns="http://www.w3.org/2000/svg" style="width:36px;height:36px;filter:drop-shadow(0 4px 8px rgba(37,99,235,0.4));">
          <path d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0z"/>
          <circle cx="192" cy="192" r="70" fill="#ffffff"/>
        </svg>
      </div>
    `,
    iconSize: [36, 68],
    iconAnchor: [18, 68]
  });

// Modern, accessible custom dropdown replacing OS-native <select>
function NormalDropdown({
  value,
  onChange,
  options = [],
  className = "",
  style = {},
  placeholder = "Select...",
  ariaLabel
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const selectedOption = options.find((opt) => opt.value === value) || {
    value,
    label: value || placeholder
  };

  return (
    <div className={`normal-dropdown-container ${className}`} ref={dropdownRef} style={style}>
      <button
        type="button"
        className={`normal-dropdown-trigger ${open ? "is-open" : ""}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span className="normal-dropdown-label">{selectedOption.label}</span>
        <ChevronDown size={14} className={`normal-dropdown-chevron ${open ? "rotated" : ""}`} />
      </button>
      {open && (
        <div className="normal-dropdown-menu" role="listbox">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`normal-dropdown-item ${isSelected ? "selected" : ""}`}
                onClick={() => {
                  onChange({ target: { value: opt.value } });
                  setOpen(false);
                }}
              >
                <span>{opt.label}</span>
                {isSelected && <Check size={14} className="normal-dropdown-check" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CustomerAccountSidepanel({
  isOpen,
  onClose,
  initialTab = "profile",
  profile = {},
  wallet = { balance: 0 },
  addresses = [],
  methods = [],
  onReload,
  onOpenPasswordModal,
  onOpenLocationSettings
}) {
  const [activeTab, setActiveTab] = useState(initialTab || "profile");

  // Sync activeTab with initialTab when opened
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab || "profile");
      setAddressViewMode("list");
      setPaymentViewMode("list");
    }
  }, [isOpen, initialTab]);

  // Esc key listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // =========================================================================
  // 0. PROFILE & AVATAR STATE & LOGIC
  // =========================================================================
  const [profileEditMode, setProfileEditMode] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [removingAvatar, setRemovingAvatar] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: profile?.name || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
    gender: profile?.gender || "",
    dateOfBirth: profile?.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().slice(0, 10) : ""
  });

  useEffect(() => {
    if (profile) {
      setProfileForm({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        gender: profile.gender || "",
        dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().slice(0, 10) : ""
      });
    }
  }, [profile]);

  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const userInitial = (profile?.name || "C").charAt(0).toUpperCase();

  const saveAvatarBase64 = async (base64) => {
    setUploadingAvatar(true);
    try {
      const updated = await updateMyProfile({ avatar: base64 });
      toast.success("Profile photo updated successfully!");
      if (typeof onReload === "function") onReload();
      try {
        localStorage.setItem("customer_profile", JSON.stringify(updated));
        localStorage.setItem("user", JSON.stringify(updated));
      } catch {}
      window.dispatchEvent(new CustomEvent("customer-profile-updated", { detail: updated }));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (JPG, PNG, WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file is too large (max 5MB).");
      return;
    }
    try {
      const base64 = await compressImage(file);
      await saveAvatarBase64(base64);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      if (e.target) e.target.value = "";
    }
  };

  const handlePhotoCapturedFromCamera = async (dataUrl) => {
    try {
      const base64 = await compressImage(dataUrl);
      await saveAvatarBase64(base64);
    } catch (err) {
      await saveAvatarBase64(dataUrl);
    }
  };

  const handleRemoveAvatar = async () => {
    setRemovingAvatar(true);
    try {
      const updated = await updateMyProfile({ avatar: "" });
      toast.success("Profile photo removed successfully!");
      if (typeof onReload === "function") onReload();
      try {
        localStorage.setItem("customer_profile", JSON.stringify(updated));
        localStorage.setItem("user", JSON.stringify(updated));
      } catch {}
      window.dispatchEvent(new CustomEvent("customer-profile-updated", { detail: updated }));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRemovingAvatar(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await updateMyProfile(profileForm);
      toast.success("Personal details updated successfully!");
      setProfileEditMode(false);
      if (typeof onReload === "function") onReload();
      try {
        localStorage.setItem("customer_profile", JSON.stringify(updated));
        localStorage.setItem("user", JSON.stringify(updated));
      } catch {}
      window.dispatchEvent(new CustomEvent("customer-profile-updated", { detail: updated }));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  };

  // =========================================================================
  // 1. WALLET STATE & LOGIC
  // =========================================================================
  const [topupAmount, setTopupAmount] = useState(1000);
  const [topupMethod, setTopupMethod] = useState("Demo Instant Net Banking");
  const [addingMoney, setAddingMoney] = useState(false);

  // Wallet transactions history
  const [transactions, setTransactions] = useState([]);
  const [loadingTxns, setLoadingTxns] = useState(false);
  const [txnSearch, setTxnSearch] = useState("");
  const [txnFilter, setTxnFilter] = useState("all"); // 'all' | 'credit' | 'debit' | 'refund'
  const [txnSort, setTxnSort] = useState("newest"); // 'newest' | 'oldest' | 'highest'

  const loadTransactions = useCallback(async () => {
    if (!isOpen) return;
    setLoadingTxns(true);
    try {
      const res = await getTransactions({ limit: 50 });
      setTransactions(Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : []);
    } catch (err) {
      console.warn("Failed to load transactions:", err);
    } finally {
      setLoadingTxns(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && activeTab === "wallet") {
      loadTransactions();
    }
  }, [isOpen, activeTab, loadTransactions]);

  const handleAddMoneySubmit = async (e) => {
    e.preventDefault();
    const amount = Number(topupAmount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount to recharge.");
      return;
    }
    setAddingMoney(true);
    try {
      await topUpWallet({ amount, method: topupMethod });
      toast.success(`₹${amount.toLocaleString("en-IN")} added to your wallet!`);
      if (typeof onReload === "function") onReload();
      loadTransactions();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAddingMoney(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    let list = [...transactions];
    if (txnSearch.trim()) {
      const q = txnSearch.toLowerCase();
      list = list.filter(
        (t) =>
          t.description?.toLowerCase().includes(q) ||
          t.orderDisplayId?.toLowerCase().includes(q) ||
          String(t.amount).includes(q)
      );
    }
    if (txnFilter !== "all") {
      if (txnFilter === "credit") {
        list = list.filter((t) => t.direction === "credit" || t.type === "wallet_topup");
      } else if (txnFilter === "debit") {
        list = list.filter((t) => t.direction === "debit" || t.type === "payment");
      } else if (txnFilter === "refund") {
        list = list.filter((t) => t.type === "refund");
      }
    }
    if (txnSort === "newest") {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (txnSort === "oldest") {
      list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (txnSort === "highest") {
      list.sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0));
    }
    return list;
  }, [transactions, txnSearch, txnFilter, txnSort]);

  // =========================================================================
  // 3. DELIVERY ADDRESSES STATE & LOGIC
  // =========================================================================
  const [addressViewMode, setAddressViewMode] = useState("list"); // 'list' | 'form'
  const [addressSearch, setAddressSearch] = useState("");
  const [addressFilter, setAddressFilter] = useState("all"); // 'all' | 'Home' | 'Work' | 'Other'
  const [addressSort, setAddressSort] = useState("default_first"); // 'default_first' | 'newest' | 'name'
  const [editingAddress, setEditingAddress] = useState(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const [deletingAddrId, setDeletingAddrId] = useState(null);

  // Address Map Form state
  const [mapFormData, setMapFormData] = useState({
    fullName: "",
    phone: "",
    type: "Home",
    saveAs: "",
    house: "",
    area: "",
    city: "",
    state: "",
    pincode: "",
    isDefault: false,
    formattedAddress: ""
  });
  const [coords, setCoords] = useState(DEFAULT_COORDS);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchingPlaces, setSearchingPlaces] = useState(false);
  const [locatingGps, setLocatingGps] = useState(false);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const startAddAddress = () => {
    setEditingAddress(null);
    setMapFormData({
      fullName: profile.name || "",
      phone: profile.phone || "",
      type: "Home",
      saveAs: "",
      house: "",
      area: "",
      city: "",
      state: "",
      pincode: "",
      isDefault: addresses.length === 0,
      formattedAddress: ""
    });
    setCoords(DEFAULT_COORDS);
    setSearchQuery("");
    setAddressViewMode("form");
  };

  const startEditAddress = (addr) => {
    setEditingAddress(addr);
    const lat = addr.coordinates?.lat || DEFAULT_COORDS.lat;
    const lng = addr.coordinates?.lng || DEFAULT_COORDS.lng;
    setCoords({ lat, lng });
    setMapFormData({
      fullName: addr.fullName || "",
      phone: addr.phone || "",
      type: addr.type || "Home",
      saveAs: addr.saveAs || "",
      house: addr.house || addr.addressLine1 || "",
      area: addr.area || addr.addressLine2 || "",
      city: addr.city || "",
      state: addr.state || "",
      pincode: addr.pincode || "",
      isDefault: Boolean(addr.isDefault),
      formattedAddress: addr.formattedAddress || addr.addressLine1 || ""
    });
    setSearchQuery(addr.city || addr.area || "");
    setAddressViewMode("form");
  };

  // Reverse geocode helper
  const handleReverseGeocode = useCallback(async (lat, lng) => {
    try {
      const res = await reverseGeocode(lat, lng);
      if (res) {
        setMapFormData((prev) => ({
          ...prev,
          house: res.house || prev.house,
          area: res.area || prev.area,
          city: res.city || prev.city,
          state: res.state || prev.state,
          pincode: res.pincode || prev.pincode,
          formattedAddress: res.formattedAddress || res.displayName || ""
        }));
      }
    } catch (err) {
      console.warn("Reverse geocode failed:", err);
    }
  }, []);

  // Leaflet map initialization for sidepanel address form
  useEffect(() => {
    if (addressViewMode !== "form" || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (err) {
        console.warn("Leaflet remove error:", err);
      }
      mapInstanceRef.current = null;
    }

    if (mapContainerRef.current._leaflet_id) {
      delete mapContainerRef.current._leaflet_id;
    }

    const settings = getLocationSettings();
    const tileUrl = TILE_URLS[settings.tileLayer] || TILE_URLS.osm;

    const initialLat = Number(coords?.lat) || DEFAULT_COORDS.lat;
    const initialLng = Number(coords?.lng) || DEFAULT_COORDS.lng;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 15,
      zoomControl: true
    });
    mapInstanceRef.current = map;

    L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    const marker = L.marker([initialLat, initialLng], {
      draggable: true,
      icon: createCustomPin()
    }).addTo(map);
    markerRef.current = marker;

    marker.on("dragend", (e) => {
      const pos = e.target.getLatLng();
      setCoords({ lat: pos.lat, lng: pos.lng });
      handleReverseGeocode(pos.lat, pos.lng);
    });

    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      map.panTo([lat, lng]);
      setCoords({ lat, lng });
      handleReverseGeocode(lat, lng);
    });

    const timers = [
      setTimeout(() => map.invalidateSize(), 60),
      setTimeout(() => map.invalidateSize(), 200),
      setTimeout(() => map.invalidateSize(), 450)
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
  }, [addressViewMode]);

  // Sync marker and view when coords change (e.g. GPS or suggestion selection)
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

  // Autocomplete place search
  const handleLocationSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!val || val.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSearchingPlaces(false);
      return;
    }

    setSearchingPlaces(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchLocation(val);
        setSuggestions(Array.isArray(results) ? results : []);
        setShowSuggestions(true);
      } catch (err) {
        console.error("Location search failed:", err);
      } finally {
        setSearchingPlaces(false);
      }
    }, 350);
  };

  const handleSelectSuggestion = (item) => {
    const lat = Number(item.lat || item.latitude);
    const lng = Number(item.lng || item.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      setCoords({ lat, lng });
      if (mapInstanceRef.current && markerRef.current) {
        mapInstanceRef.current.setView([lat, lng], 16);
        markerRef.current.setLatLng([lat, lng]);
      }
      handleReverseGeocode(lat, lng);
    }
    setSearchQuery(item.name || item.formattedAddress || "");
    setShowSuggestions(false);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    setLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(newCoords);
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([newCoords.lat, newCoords.lng], 16);
          markerRef.current.setLatLng([newCoords.lat, newCoords.lng]);
        }
        handleReverseGeocode(newCoords.lat, newCoords.lng);
        setLocatingGps(false);
        toast.success("Location pinned via GPS!");
      },
      (err) => {
        console.warn("GPS error:", err);
        toast.error("Could not fetch GPS location. Please pin manually.");
        setLocatingGps(false);
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!mapFormData.fullName.trim() || !mapFormData.phone.trim()) {
      toast.error("Please enter recipient name and phone number.");
      return;
    }
    if (!mapFormData.city.trim() || !mapFormData.pincode.trim()) {
      toast.error("Please enter city and pincode.");
      return;
    }

    setSavingAddress(true);
    try {
      const payload = {
        fullName: mapFormData.fullName,
        phone: mapFormData.phone,
        addressLine1: mapFormData.house || mapFormData.formattedAddress || "Main Street",
        addressLine2: mapFormData.area || "",
        house: mapFormData.house,
        area: mapFormData.area,
        city: mapFormData.city,
        state: mapFormData.state || "Andhra Pradesh",
        pincode: mapFormData.pincode,
        type: mapFormData.type || "Home",
        saveAs: mapFormData.saveAs,
        formattedAddress: mapFormData.formattedAddress,
        coordinates: { lat: coords.lat, lng: coords.lng },
        isDefault: mapFormData.isDefault
      };

      if (editingAddress) {
        await updateAddress(editingAddress._id, payload);
        toast.success("Address updated successfully.");
      } else {
        await createAddress(payload);
        toast.success("New address saved with location pin.");
      }

      setAddressViewMode("list");
      if (typeof onReload === "function") onReload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (addrId) => {
    if (!window.confirm("Are you sure you want to delete this delivery address?")) return;
    setDeletingAddrId(addrId);
    try {
      await deleteAddress(addrId);
      toast.success("Address deleted.");
      if (typeof onReload === "function") onReload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeletingAddrId(null);
    }
  };

  const handleSetDefaultAddress = async (addrId) => {
    try {
      await setDefaultAddress(addrId);
      toast.success("Set as default delivery address.");
      if (typeof onReload === "function") onReload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  // Filtered & Sorted Addresses
  const filteredAddresses = useMemo(() => {
    let list = [...addresses];
    if (addressSearch.trim()) {
      const q = addressSearch.toLowerCase();
      list = list.filter(
        (a) =>
          a.fullName?.toLowerCase().includes(q) ||
          a.phone?.toLowerCase().includes(q) ||
          a.city?.toLowerCase().includes(q) ||
          a.pincode?.includes(q) ||
          a.addressLine1?.toLowerCase().includes(q) ||
          a.addressLine2?.toLowerCase().includes(q)
      );
    }
    if (addressFilter !== "all") {
      list = list.filter((a) => a.type?.toLowerCase() === addressFilter.toLowerCase());
    }
    if (addressSort === "default_first") {
      list.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
    } else if (addressSort === "newest") {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (addressSort === "name") {
      list.sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""));
    }
    return list;
  }, [addresses, addressSearch, addressFilter, addressSort]);

  // =========================================================================
  // 4. PAYMENT METHODS STATE & LOGIC
  // =========================================================================
  const [paymentViewMode, setPaymentViewMode] = useState("list"); // 'list' | 'form'
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all"); // 'all' | 'card' | 'bank' | 'upi'
  const [paymentSort, setPaymentSort] = useState("default_first"); // 'default_first' | 'recent' | 'name'
  const [editingPayment, setEditingPayment] = useState(null);
  const [savingPayment, setSavingPayment] = useState(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState(null);

  const [paymentFormTab, setPaymentFormTab] = useState("card"); // 'card' | 'bank' | 'upi'
  const [paymentFormData, setPaymentFormData] = useState({
    cardholderName: "",
    cardNumber: "",
    expiryMonth: "12",
    expiryYear: "2028",
    cvv: "123",
    bankName: "State Bank of India",
    accountName: "",
    accountNumber: "",
    ifsc: "SBIN0001234",
    upiId: "",
    isDefault: false
  });

  const startAddPayment = () => {
    setEditingPayment(null);
    setPaymentFormData({
      cardholderName: profile.name || "",
      cardNumber: "",
      expiryMonth: "12",
      expiryYear: "2028",
      cvv: "123",
      bankName: "State Bank of India",
      accountName: profile.name || "",
      accountNumber: "",
      ifsc: "SBIN0001234",
      upiId: "",
      isDefault: methods.length === 0
    });
    setPaymentFormTab("card");
    setPaymentViewMode("form");
  };

  const startEditPayment = (item) => {
    setEditingPayment(item);
    setPaymentFormTab(item.type || "card");
    setPaymentFormData({
      cardholderName: item.cardholderName || "",
      cardNumber: item.cardNumber || (item.last4 ? `•••• •••• •••• ${item.last4}` : ""),
      expiryMonth: item.expiryMonth || "12",
      expiryYear: item.expiryYear || "2028",
      cvv: item.cvv || "123",
      bankName: item.bankName || "State Bank of India",
      accountName: item.accountName || "",
      accountNumber: item.accountNumber || (item.last4 ? `•••• ${item.last4}` : ""),
      ifsc: item.ifsc || "SBIN0001234",
      upiId: item.upiId || "",
      isDefault: Boolean(item.isDefault)
    });
    setPaymentViewMode("form");
  };

  const handleSavePaymentMethod = async (e) => {
    e.preventDefault();
    setSavingPayment(true);
    try {
      const payload = { ...paymentFormData, type: paymentFormTab };
      if (editingPayment) {
        await updatePaymentMethod(editingPayment._id, payload);
        toast.success("Payment method updated.");
      } else {
        await createPaymentMethod(payload);
        toast.success("Payment method added.");
      }
      setPaymentViewMode("list");
      if (typeof onReload === "function") onReload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingPayment(false);
    }
  };

  const handleDeletePaymentMethod = async (methodId) => {
    if (!window.confirm("Remove this payment method?")) return;
    setDeletingPaymentId(methodId);
    try {
      await deletePaymentMethod(methodId);
      toast.success("Payment method removed.");
      if (typeof onReload === "function") onReload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeletingPaymentId(null);
    }
  };

  const filteredMethods = useMemo(() => {
    let list = [...methods];
    if (paymentSearch.trim()) {
      const q = paymentSearch.toLowerCase();
      list = list.filter(
        (m) =>
          m.bankName?.toLowerCase().includes(q) ||
          m.upiId?.toLowerCase().includes(q) ||
          m.cardholderName?.toLowerCase().includes(q) ||
          m.last4?.includes(q) ||
          m.type?.toLowerCase().includes(q)
      );
    }
    if (paymentFilter !== "all") {
      if (paymentFilter === "card") list = list.filter((m) => m.type === "card");
      else if (paymentFilter === "bank") list = list.filter((m) => m.type === "bank");
      else if (paymentFilter === "upi") list = list.filter((m) => m.type === "upi");
    }
    if (paymentSort === "default_first") {
      list.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
    } else if (paymentSort === "recent") {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (paymentSort === "name") {
      list.sort((a, b) => (a.bankName || a.cardholderName || "").localeCompare(b.bankName || b.cardholderName || ""));
    }
    return list;
  }, [methods, paymentSearch, paymentFilter, paymentSort]);

  if (!isOpen) return null;

  return (
    <div className="account-sidepanel-backdrop" onClick={onClose}>
      <div className="account-sidepanel-drawer" onClick={(e) => e.stopPropagation()}>
        {/* TOP DRAWER HEADER */}
        <div className="account-drawer-header">
          <div className="account-drawer-title-row">
            <div className="account-drawer-icon-box">
              {activeTab === "profile" && <User size={20} />}
              {activeTab === "wallet" && <Wallet size={20} />}
              {activeTab === "addresses" && <MapPin size={20} />}
              {activeTab === "payment" && <CreditCard size={20} />}
            </div>
            <div>
              <h2 className="account-drawer-title">
                {activeTab === "profile" && "My Account & Details"}
                {activeTab === "wallet" && "Wallet & Balance"}
                {activeTab === "addresses" && "Delivery Addresses"}
                {activeTab === "payment" && "Payment Methods"}
              </h2>
              <p className="account-drawer-subtitle">
                {activeTab === "profile" && "Manage your personal profile, photo, contact information, and security."}
                {activeTab === "wallet" && "Instant 1-click checkout funds and transaction history."}
                {activeTab === "addresses" && "Saved shipping addresses with interactive map pinpointing."}
                {activeTab === "payment" && "Manage saved debit/credit cards, UPI IDs, and bank accounts."}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="account-drawer-close-btn"
            onClick={onClose}
            aria-label="Close Account Panel"
          >
            <X size={18} />
          </button>
        </div>

        {/* TOP NAVIGATION TABS */}
        <div className="account-drawer-tabs">
          <button
            type="button"
            className={`account-drawer-tab-btn ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <User size={15} />
            <span>My Details</span>
          </button>

          <button
            type="button"
            className={`account-drawer-tab-btn ${activeTab === "wallet" ? "active" : ""}`}
            onClick={() => setActiveTab("wallet")}
          >
            <Wallet size={15} />
            <span>Wallet</span>
            <span className="account-drawer-tab-count">
              ₹{Number(wallet.balance || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </span>
          </button>

          <button
            type="button"
            className={`account-drawer-tab-btn ${activeTab === "addresses" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("addresses");
              setAddressViewMode("list");
            }}
          >
            <MapPin size={15} />
            <span>Addresses</span>
            <span className="account-drawer-tab-count">{addresses.length}</span>
          </button>

          <button
            type="button"
            className={`account-drawer-tab-btn ${activeTab === "payment" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("payment");
              setPaymentViewMode("list");
            }}
          >
            <CreditCard size={15} />
            <span>Payment Methods</span>
            <span className="account-drawer-tab-count">{methods.length}</span>
          </button>
        </div>

        {/* DRAWER SCROLLABLE BODY */}
        <div className="account-drawer-body">

          {/* ================================================================= */}
          {/* TAB 0: MY DETAILS & PROFILE                                       */}
          {/* ================================================================= */}
          {activeTab === "profile" && (
            <>
              {/* Profile Card (Clean card UI - matching "like before" with dedicated actions bar) */}
              <div className="asp-profile-card">
                <div className="asp-profile-header">
                  <div className="asp-avatar-wrap">
                    <div className="asp-avatar">
                      {profile?.avatar ? (
                        <img
                          src={profile.avatar}
                          alt={profile?.name || "Customer"}
                          className="asp-avatar-img"
                        />
                      ) : (
                        userInitial
                      )}
                    </div>
                    <span className="asp-status-dot" title="Active Account" />
                    <button
                      type="button"
                      className={`asp-avatar-upload-btn ${uploadingAvatar ? "loading" : ""}`}
                      onClick={() => setIsCameraModalOpen(true)}
                      title="Take photo with camera"
                    >
                      {uploadingAvatar ? <Loader2 size={13} className="spin" /> : <Camera size={13} />}
                    </button>
                  </div>

                  <div className="asp-profile-meta">
                    <div className="asp-profile-name-row">
                      <h3 className="asp-profile-name">{profile?.name || "Customer"}</h3>
                      <span className="asp-verified-badge">
                        <ShieldCheck size={12} />
                        <span>Verified</span>
                      </span>
                    </div>
                    <span className="asp-profile-email">{profile?.email || "customer@example.com"}</span>
                    <div className="asp-profile-pills-row">
                      <span className="asp-pill member">Customer Member</span>
                      {profile?.createdAt && (
                        <span className="asp-pill joined">
                          Joined {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Adjusted Action Buttons Bar: Beautifully aligned at the bottom */}
                <div className="asp-profile-actions-bar">
                  <div className="asp-profile-actions-left">
                    <button
                      type="button"
                      className="asp-btn-action upload"
                      onClick={() => setIsCameraModalOpen(true)}
                      disabled={uploadingAvatar || removingAvatar}
                      title="Take photo using camera or webcam"
                    >
                      <Camera size={13} />
                      <span>Camera</span>
                    </button>

                    <label
                      className="asp-btn-action"
                      title={profile?.avatar ? "Change profile photo from files" : "Upload profile photo from files"}
                    >
                      <Upload size={13} />
                      <span>Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        disabled={uploadingAvatar || removingAvatar}
                        style={{ display: "none" }}
                      />
                    </label>

                    {profile?.avatar && (
                      <button
                        type="button"
                        className="asp-btn-action delete"
                        onClick={handleRemoveAvatar}
                        disabled={uploadingAvatar || removingAvatar}
                        title="Delete profile photo"
                      >
                        {removingAvatar ? <Loader2 size={13} className="spin" /> : <Trash2 size={13} />}
                        <span>Delete Photo</span>
                      </button>
                    )}
                  </div>

                  <div className="asp-profile-actions-right">
                    <button
                      type="button"
                      className="asp-btn-action"
                      onClick={onOpenPasswordModal}
                    >
                      <Lock size={13} />
                      <span>Security &amp; Password</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Personal Details Info / Edit Form Card */}
              <div className={`asp-details-card ${profileEditMode ? "editing" : ""}`}>
                <div className="asp-details-card-header">
                  <div>
                    <h4 className="asp-details-card-title">Personal Information</h4>
                    <p className="asp-details-card-sub">
                      {profileEditMode
                        ? "Update your photo, personal details, and contact information."
                        : "Your personal details for order delivery updates and checkout."}
                    </p>
                  </div>
                  {profileEditMode ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="asp-details-badge-editing">
                        <Pencil size={11} />
                        <span>Editing</span>
                      </span>
                      <button
                        type="button"
                        className="cam-modal-close-btn"
                        onClick={() => setProfileEditMode(false)}
                        title="Cancel editing"
                        style={{ width: "26px", height: "26px" }}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="asp-btn-sm-edit"
                      onClick={() => setProfileEditMode(true)}
                    >
                      <Pencil size={13} />
                      <span>Edit</span>
                    </button>
                  )}
                </div>

                {profileEditMode ? (
                  <form onSubmit={handleSaveProfile} className="asp-profile-form">
                    {/* Dedicated Profile Photo Studio inside Edit Panel */}
                    <div className="asp-edit-avatar-section">
                      <div className="asp-edit-avatar-thumb-wrap">
                        <div className="asp-edit-avatar-thumb">
                          {profile?.avatar ? (
                            <img src={profile.avatar} alt={profile.name || "Customer"} />
                          ) : (
                            userInitial
                          )}
                        </div>
                        <span className="asp-edit-avatar-online" title="Active Account" />
                      </div>

                      <div className="asp-edit-avatar-meta">
                        <h5 className="asp-edit-avatar-title">Profile Photo</h5>
                        <p className="asp-edit-avatar-sub">
                          Take a photo using your camera or choose a picture from your files.
                        </p>
                        <div className="asp-edit-avatar-btns">
                          <button
                            type="button"
                            className="asp-btn-camera-opt"
                            onClick={() => setIsCameraModalOpen(true)}
                            disabled={uploadingAvatar || removingAvatar}
                          >
                            <Camera size={13} />
                            <span>Upload from Camera</span>
                          </button>

                          <label className="asp-btn-file-opt">
                            {uploadingAvatar ? <Loader2 size={13} className="spin" /> : <Upload size={13} />}
                            <span>Choose File</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarUpload}
                              disabled={uploadingAvatar || removingAvatar}
                              style={{ display: "none" }}
                            />
                          </label>

                          {profile?.avatar && (
                            <button
                              type="button"
                              className="asp-btn-remove-opt"
                              onClick={handleRemoveAvatar}
                              disabled={uploadingAvatar || removingAvatar}
                              title="Remove profile photo"
                            >
                              {removingAvatar ? <Loader2 size={12} className="spin" /> : <Trash2 size={12} />}
                              <span>Remove</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Responsive 2-Column Form Fields */}
                    <div className="asp-form-grid">
                      {/* Full Name */}
                      <div className="asp-form-field">
                        <label className="asp-field-label">
                          Full Name <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <div className="asp-input-wrapper">
                          <User size={15} className="asp-input-icon" />
                          <input
                            type="text"
                            required
                            className="asp-input-styled"
                            value={profileForm.name}
                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                            placeholder="Your full name"
                          />
                        </div>
                      </div>

                      {/* Email Address */}
                      <div className="asp-form-field">
                        <label className="asp-field-label">
                          Email Address <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <div className="asp-input-wrapper">
                          <Mail size={15} className="asp-input-icon" />
                          <input
                            type="email"
                            required
                            className="asp-input-styled"
                            value={profileForm.email}
                            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                            placeholder="Your email address"
                          />
                        </div>
                      </div>

                      {/* Mobile Number */}
                      <div className="asp-form-field">
                        <label className="asp-field-label">
                          Mobile Number
                        </label>
                        <div className="asp-input-wrapper">
                          <div className="asp-phone-badge">
                            <Phone size={13} />
                            <span>+91</span>
                          </div>
                          <input
                            type="tel"
                            maxLength={10}
                            className="asp-input-styled asp-input-phone"
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value.replace(/\D/g, "") })}
                            placeholder="10-digit mobile number"
                          />
                        </div>
                      </div>

                      {/* Gender */}
                      <div className="asp-form-field">
                        <label className="asp-field-label">
                          Gender
                        </label>
                        <NormalDropdown
                          value={profileForm.gender}
                          onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                          options={[
                            { value: "", label: "Select Gender" },
                            { value: "male", label: "Male" },
                            { value: "female", label: "Female" },
                            { value: "other", label: "Other" }
                          ]}
                          ariaLabel="Gender"
                        />
                      </div>

                      {/* Date of Birth */}
                      <div className="asp-form-field asp-form-col-full">
                        <label className="asp-field-label">
                          Date of Birth
                        </label>
                        <div className="asp-input-wrapper">
                          <Calendar size={15} className="asp-input-icon" />
                          <input
                            type="date"
                            className="asp-input-styled"
                            value={profileForm.dateOfBirth}
                            onChange={(e) => setProfileForm({ ...profileForm, dateOfBirth: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Elevated Form Footer */}
                    <div className="asp-form-footer">
                      <div className="asp-footer-security-note">
                        <ShieldCheck size={14} />
                        <span>Your personal data is encrypted &amp; secure</span>
                      </div>
                      <div className="asp-footer-buttons">
                        <button
                          type="button"
                          className="asp-btn-cancel"
                          onClick={() => setProfileEditMode(false)}
                          disabled={savingProfile}
                        >
                          <X size={14} />
                          <span>Cancel</span>
                        </button>
                        <button
                          type="submit"
                          className="asp-btn-save"
                          disabled={savingProfile}
                        >
                          {savingProfile ? (
                            <>
                              <Loader2 size={14} className="spin" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <Check size={14} />
                              <span>Save Changes</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="asp-info-grid">
                    <div className="asp-info-item">
                      <span className="asp-info-label">Full Name</span>
                      <strong className="asp-info-val">{profile?.name || "—"}</strong>
                    </div>
                    <div className="asp-info-item">
                      <span className="asp-info-label">Email Address</span>
                      <strong className="asp-info-val">{profile?.email || "—"}</strong>
                    </div>
                    <div className="asp-info-item">
                      <span className="asp-info-label">Mobile Number</span>
                      <strong className="asp-info-val">{profile?.phone || "Not provided"}</strong>
                    </div>
                    <div className="asp-info-item">
                      <span className="asp-info-label">Gender</span>
                      <strong className="asp-info-val" style={{ textTransform: "capitalize" }}>
                        {profile?.gender || "Not specified"}
                      </strong>
                    </div>
                    <div className="asp-info-item">
                      <span className="asp-info-label">Date of Birth</span>
                      <strong className="asp-info-val">
                        {profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Not specified"}
                      </strong>
                    </div>
                    <div className="asp-info-item">
                      <span className="asp-info-label">Account Status</span>
                      <span className="asp-badge-active-green">● Active &amp; Verified</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ================================================================= */}
          {/* TAB 2: WALLET & BALANCE                                           */}
          {/* ================================================================= */}
          {activeTab === "wallet" && (
            <>
              {/* Hero Balance Card */}
              <div className="asp-wallet-hero">
                <div>
                  <span className="asp-wallet-label">Current Available Balance</span>
                  <h3 className="asp-wallet-balance-num">
                    ₹{Number(wallet.balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </h3>
                </div>
                <div className="asp-wallet-shield-badge">
                  <Sparkles size={14} />
                  <span>1-Click Checkout Ready</span>
                </div>
              </div>

              {/* Add Money Form */}
              <div className="asp-add-money-card">
                <h4 className="asp-add-money-title">Add Money to Wallet</h4>
                <p style={{ margin: "-8px 0 0", fontSize: "12.5px", color: "#64748b" }}>
                  Instant demo funds for lightning-fast 1-click purchases.
                </p>

                <form onSubmit={handleAddMoneySubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "5px" }}>
                      Enter Amount (₹)
                    </label>
                    <div className="asp-amount-input-box">
                      <span className="asp-amount-prefix">₹</span>
                      <input
                        type="number"
                        min={10}
                        max={100000}
                        required
                        value={topupAmount}
                        onChange={(e) => setTopupAmount(e.target.value)}
                        className="asp-amount-input"
                        placeholder="Enter amount"
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "6px" }}>
                      Quick Preset Amounts
                    </label>
                    <div className="asp-presets-row">
                      {[500, 1000, 2000, 5000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          className={`asp-preset-btn ${Number(topupAmount) === amt ? "selected" : ""}`}
                          onClick={() => setTopupAmount(amt)}
                        >
                          + ₹{amt.toLocaleString("en-IN")}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "5px" }}>
                      Pay Using
                    </label>
                    <NormalDropdown
                      value={topupMethod}
                      onChange={(e) => setTopupMethod(e.target.value)}
                      options={[
                        { value: "Demo Instant Net Banking", label: "Demo Instant Net Banking" },
                        { value: "UPI / QR Payment", label: "UPI / Instant QR" },
                        { value: "Saved Debit Card", label: "Saved Debit Card" }
                      ]}
                      style={{ width: "100%" }}
                      ariaLabel="Select payment method for wallet"
                    />
                  </div>

                  <button
                    type="submit"
                    className="asp-btn-primary"
                    disabled={addingMoney}
                    style={{ marginTop: "4px", padding: "12px" }}
                  >
                    {addingMoney ? "Processing..." : `Add ₹${Number(topupAmount || 0).toLocaleString("en-IN")} to Wallet`}
                  </button>
                </form>
              </div>

              {/* Recent Wallet Transactions */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h4 className="asp-section-title">Recent Transactions ({filteredTransactions.length})</h4>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>Live statement</span>
                </div>

                {/* Filter & Search for Transactions */}
                <div className="account-search-filter-bar">
                  <div className="account-search-row">
                    <div className="account-search-input-box">
                      <Search size={15} className="account-search-icon" />
                      <input
                        type="text"
                        placeholder="Search by order ID or description..."
                        value={txnSearch}
                        onChange={(e) => setTxnSearch(e.target.value)}
                        className="account-search-input"
                      />
                      {txnSearch && (
                        <button type="button" className="account-search-clear" onClick={() => setTxnSearch("")}>
                          <X size={13} />
                        </button>
                      )}
                    </div>

                    <NormalDropdown
                      value={txnSort}
                      onChange={(e) => setTxnSort(e.target.value)}
                      options={[
                        { value: "newest", label: "Newest First" },
                        { value: "oldest", label: "Oldest First" },
                        { value: "highest", label: "Highest Amount" }
                      ]}
                      ariaLabel="Sort transactions"
                    />
                  </div>

                  <div className="account-filter-chips-row">
                    {[
                      { key: "all", label: "All" },
                      { key: "credit", label: "Recharges (+)" },
                      { key: "debit", label: "Payments (-)" },
                      { key: "refund", label: "Refunds (+)" }
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        className={`account-filter-chip ${txnFilter === tab.key ? "active" : ""}`}
                        onClick={() => setTxnFilter(tab.key)}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {loadingTxns ? (
                  <div style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>
                    <Loader2 size={24} className="spin-animate" style={{ margin: "0 auto 8px" }} />
                    <p style={{ fontSize: "13px", margin: 0 }}>Loading transactions...</p>
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="asp-empty-state">
                    <div className="asp-empty-icon">
                      <Wallet size={24} />
                    </div>
                    <h5 style={{ margin: 0, fontSize: "14px", color: "#0f172a" }}>No transactions found</h5>
                    <p style={{ margin: 0, fontSize: "12.5px" }}>
                      {txnSearch ? "Try clearing search filters." : "Your wallet top-ups and order payments will show here."}
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {filteredTransactions.map((t) => {
                      const isCredit = t.direction === "credit" || t.type === "wallet_topup" || t.type === "refund";
                      return (
                        <div
                          key={t._id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "12px 14px",
                            borderRadius: "10px",
                            border: "1px solid #e2e8f0",
                            background: "#ffffff"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div
                              style={{
                                width: "34px",
                                height: "34px",
                                borderRadius: "8px",
                                background: isCredit ? "#ecfdf5" : "#fef2f2",
                                color: isCredit ? "#16a34a" : "#ef4444",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                              }}
                            >
                              {t.type === "refund" ? (
                                <RotateCcw size={16} />
                              ) : isCredit ? (
                                <Plus size={16} />
                              ) : (
                                <ShoppingBag size={16} />
                              )}
                            </div>
                            <div>
                              <strong style={{ fontSize: "13px", color: "#0f172a", display: "block" }}>
                                {t.description || (isCredit ? "Wallet Recharge" : "Order Payment")}
                              </strong>
                              <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                                {new Date(t.createdAt).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                                {t.orderDisplayId ? ` • #${t.orderDisplayId}` : ""}
                              </span>
                            </div>
                          </div>

                          <div style={{ textAlign: "right" }}>
                            <strong
                              style={{
                                fontSize: "14.5px",
                                fontWeight: 800,
                                color: isCredit ? "#16a34a" : "#0f172a"
                              }}
                            >
                              {isCredit ? "+" : "-"}₹{Number(t.amount || 0).toLocaleString("en-IN")}
                            </strong>
                            <span
                              style={{
                                display: "block",
                                fontSize: "10.5px",
                                fontWeight: 700,
                                color: "#16a34a",
                                textTransform: "capitalize"
                              }}
                            >
                              {t.status || "Success"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ================================================================= */}
          {/* TAB 3: DELIVERY ADDRESSES                                         */}
          {/* ================================================================= */}
          {activeTab === "addresses" && (
            <>
              {addressViewMode === "list" ? (
                <>
                  {/* Top Bar with Add Address Button & Manage Settings */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                    <div>
                      <h4 className="asp-section-title">Saved Addresses ({addresses.length})</h4>
                      <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                        Select default address or add new pin.
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {typeof onOpenLocationSettings === "function" && (
                        <button
                          type="button"
                          className="asp-btn-manage-settings"
                          onClick={onOpenLocationSettings}
                          title="Address & Map Geocoding Settings"
                        >
                          <Settings size={14} />
                          <span>Manage</span>
                        </button>
                      )}
                      <button type="button" className="asp-btn-primary" onClick={startAddAddress}>
                        <Plus size={15} />
                        <span>Add New Address</span>
                      </button>
                    </div>
                  </div>

                  {/* Search, Filter & Sort */}
                  <div className="account-search-filter-bar">
                    <div className="account-search-row">
                      <div className="account-search-input-box">
                        <Search size={15} className="account-search-icon" />
                        <input
                          type="text"
                          placeholder="Search addresses by name, city, or pincode..."
                          value={addressSearch}
                          onChange={(e) => setAddressSearch(e.target.value)}
                          className="account-search-input"
                        />
                        {addressSearch && (
                          <button type="button" className="account-search-clear" onClick={() => setAddressSearch("")}>
                            <X size={13} />
                          </button>
                        )}
                      </div>

                      <NormalDropdown
                        value={addressSort}
                        onChange={(e) => setAddressSort(e.target.value)}
                        options={[
                          { value: "default_first", label: "Default First" },
                          { value: "newest", label: "Newest First" },
                          { value: "name", label: "Name (A-Z)" }
                        ]}
                        ariaLabel="Sort delivery addresses"
                      />
                    </div>

                    <div className="account-filter-chips-row">
                      {[
                        { key: "all", label: "All Addresses" },
                        { key: "Home", label: "🏠 Home" },
                        { key: "Work", label: "💼 Work" },
                        { key: "Other", label: "📍 Other" }
                      ].map((chip) => (
                        <button
                          key={chip.key}
                          type="button"
                          className={`account-filter-chip ${addressFilter === chip.key ? "active" : ""}`}
                          onClick={() => setAddressFilter(chip.key)}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Addresses List */}
                  {filteredAddresses.length === 0 ? (
                    <div className="asp-empty-state">
                      <div className="asp-empty-icon">
                        <MapPin size={24} />
                      </div>
                      <h5 style={{ margin: 0, fontSize: "14px", color: "#0f172a" }}>No addresses found</h5>
                      <p style={{ margin: 0, fontSize: "12.5px" }}>
                        {addressSearch ? "No saved addresses match your search." : "You have not added any delivery addresses yet."}
                      </p>
                      <button type="button" className="asp-btn-primary" onClick={startAddAddress} style={{ marginTop: "6px" }}>
                        <Plus size={15} /> Add First Address
                      </button>
                    </div>
                  ) : (
                    <div className="asp-addresses-list">
                      {filteredAddresses.map((addr) => (
                        <div
                          key={addr._id}
                          className={`asp-address-card ${addr.isDefault ? "is-default" : ""}`}
                        >
                          <div className="asp-address-header">
                            <div className="asp-addr-badges">
                              <span className="asp-type-pill">
                                {addr.type === "Work" ? "💼 WORK" : addr.type === "Other" ? "📍 OTHER" : "🏠 HOME"}
                              </span>
                              {addr.isDefault && <span className="asp-default-pill">DEFAULT</span>}
                            </div>
                            <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                              {addr.coordinates?.lat && addr.coordinates?.lng ? "📍 Map Pinned" : "Standard"}
                            </span>
                          </div>

                          <div>
                            <h4 className="asp-addr-recipient">{addr.fullName}</h4>
                            <p className="asp-addr-phone">
                              <Phone size={12} /> {addr.phone}
                            </p>
                          </div>

                          <p className="asp-addr-lines">
                            {addr.addressLine1}
                            {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
                          </p>

                          <p className="asp-addr-location">
                            {addr.city}, {addr.state} - <strong>{addr.pincode}</strong>
                          </p>

                          <div className="asp-addr-actions">
                            {!addr.isDefault ? (
                              <button
                                type="button"
                                className="asp-action-btn"
                                onClick={() => handleSetDefaultAddress(addr._id)}
                              >
                                Set as Default
                              </button>
                            ) : (
                              <span style={{ fontSize: "11.5px", color: "#16a34a", fontWeight: 700 }}>
                                ✓ Active Default
                              </span>
                            )}

                            <div className="asp-addr-btn-group">
                              <button
                                type="button"
                                className="asp-action-btn"
                                onClick={() => startEditAddress(addr)}
                              >
                                <Pencil size={12} /> Edit
                              </button>
                              <button
                                type="button"
                                className="asp-action-btn danger"
                                onClick={() => handleDeleteAddress(addr._id)}
                                disabled={deletingAddrId === addr._id}
                              >
                                <Trash2 size={12} /> Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                /* Mode B: Add / Edit Address with Interactive Leaflet Map */
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <button
                      type="button"
                      className="asp-btn-outline"
                      onClick={() => setAddressViewMode("list")}
                      style={{ fontSize: "12px", padding: "6px 12px" }}
                    >
                      <ArrowLeft size={14} /> Back to Addresses
                    </button>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                      {editingAddress ? "Edit Delivery Address" : "Add Delivery Address"}
                    </span>
                  </div>

                  {/* Autocomplete Location Search + GPS button */}
                  <div style={{ display: "flex", gap: "8px", position: "relative" }}>
                    <div style={{ flex: 1, position: "relative" }}>
                      <Search size={15} style={{ position: "absolute", left: "12px", top: "12px", color: "#94a3b8" }} />
                      <input
                        type="text"
                        placeholder="Search area, landmark, village or street..."
                        value={searchQuery}
                        onChange={handleLocationSearchChange}
                        onFocus={() => searchQuery.trim().length >= 2 && setShowSuggestions(true)}
                        className="account-search-input"
                        style={{ paddingLeft: "34px" }}
                      />
                      {searchingPlaces && (
                        <Loader2 size={14} className="spin-animate" style={{ position: "absolute", right: "12px", top: "12px", color: "#2563eb" }} />
                      )}

                      {/* Autocomplete Suggestions Box */}
                      {showSuggestions && suggestions.length > 0 && (
                        <div
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            marginTop: "4px",
                            background: "#ffffff",
                            borderRadius: "10px",
                            border: "1px solid #cbd5e1",
                            boxShadow: "0 12px 28px rgba(15,23,42,0.15)",
                            zIndex: 1000,
                            maxHeight: "220px",
                            overflowY: "auto"
                          }}
                        >
                          {suggestions.map((item, idx) => (
                            <button
                              key={item.placeId || idx}
                              type="button"
                              onClick={() => handleSelectSuggestion(item)}
                              style={{
                                width: "100%",
                                padding: "10px 12px",
                                textAlign: "left",
                                background: "none",
                                border: "none",
                                borderBottom: "1px solid #f1f5f9",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                cursor: "pointer"
                              }}
                            >
                              <MapPin size={14} color="#2563eb" style={{ flexShrink: 0 }} />
                              <div style={{ overflow: "hidden" }}>
                                <strong style={{ fontSize: "12.5px", color: "#0f172a", display: "block" }}>
                                  {item.name || item.area || item.city || "Location"}
                                </strong>
                                <span style={{ fontSize: "11px", color: "#64748b", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {item.formattedAddress || item.displayName || ""}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      className="asp-btn-outline"
                      onClick={handleUseMyLocation}
                      disabled={locatingGps}
                      title="Pin current GPS location"
                      style={{ whiteSpace: "nowrap", fontSize: "12px" }}
                    >
                      {locatingGps ? <Loader2 size={14} className="spin-animate" /> : <Crosshair size={14} />}
                      <span>{locatingGps ? "Locating..." : "Use GPS"}</span>
                    </button>
                  </div>

                  {/* Guaranteed Leaflet Map Canvas */}
                  <div
                    style={{
                      minHeight: "280px",
                      height: "280px",
                      width: "100%",
                      borderRadius: "12px",
                      overflow: "hidden",
                      border: "1px solid #cbd5e1",
                      position: "relative",
                      background: "#f8fafc"
                    }}
                  >
                    <div
                      ref={mapContainerRef}
                      style={{ width: "100%", height: "100%", minHeight: "280px" }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        bottom: "10px",
                        left: "10px",
                        right: "10px",
                        background: "rgba(255, 255, 255, 0.95)",
                        backdropFilter: "blur(6px)",
                        borderRadius: "8px",
                        padding: "6px 12px",
                        border: "1px solid #e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "11.5px",
                        color: "#1e293b",
                        zIndex: 500
                      }}
                    >
                      <MapPin size={14} color="#2563eb" style={{ flexShrink: 0 }} />
                      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {mapFormData.formattedAddress || `${mapFormData.city || "Visakhapatnam"}, ${mapFormData.state || "Andhra Pradesh"}`}
                      </span>
                    </div>
                  </div>

                  {/* Address Details Form */}
                  <form onSubmit={handleSaveAddress} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {/* Address Type Chips */}
                    <div>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "6px" }}>
                        Address Type
                      </span>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                        {["Home", "Work", "Other"].map((t) => (
                          <button
                            key={t}
                            type="button"
                            className={`account-filter-chip ${mapFormData.type === t ? "active" : ""}`}
                            onClick={() => setMapFormData({ ...mapFormData, type: t })}
                            style={{ textAlign: "center", borderRadius: "8px", padding: "8px" }}
                          >
                            {t === "Home" ? "🏠 Home" : t === "Work" ? "💼 Work" : "📍 Other"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div>
                        <label style={{ fontSize: "11.5px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
                          Save As (optional)
                        </label>
                        <input
                          type="text"
                          value={mapFormData.saveAs}
                          onChange={(e) => setMapFormData({ ...mapFormData, saveAs: e.target.value })}
                          className="account-search-input"
                          placeholder="e.g. My Apartment, Mom's House"
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: "11.5px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={mapFormData.fullName}
                          onChange={(e) => setMapFormData({ ...mapFormData, fullName: e.target.value })}
                          className="account-search-input"
                          placeholder="Recipient Name"
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: "11.5px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
                          10-Digit Mobile Number *
                        </label>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={mapFormData.phone}
                          onChange={(e) => setMapFormData({ ...mapFormData, phone: e.target.value })}
                          className="account-search-input"
                          placeholder="10-digit phone"
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: "11.5px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
                          Flat / House / Building
                        </label>
                        <input
                          type="text"
                          value={mapFormData.house}
                          onChange={(e) => setMapFormData({ ...mapFormData, house: e.target.value })}
                          className="account-search-input"
                          placeholder="Door / Flat No."
                        />
                      </div>

                      <div style={{ gridColumn: "span 2" }}>
                        <label style={{ fontSize: "11.5px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
                          Area / Street / Colony / Landmark
                        </label>
                        <input
                          type="text"
                          value={mapFormData.area}
                          onChange={(e) => setMapFormData({ ...mapFormData, area: e.target.value })}
                          className="account-search-input"
                          placeholder="Street or Landmark"
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: "11.5px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
                          City *
                        </label>
                        <input
                          type="text"
                          required
                          value={mapFormData.city}
                          onChange={(e) => setMapFormData({ ...mapFormData, city: e.target.value })}
                          className="account-search-input"
                          placeholder="City"
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: "11.5px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
                          State *
                        </label>
                        <input
                          type="text"
                          required
                          value={mapFormData.state}
                          onChange={(e) => setMapFormData({ ...mapFormData, state: e.target.value })}
                          className="account-search-input"
                          placeholder="State"
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: "11.5px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
                          Pincode *
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={mapFormData.pincode}
                          onChange={(e) => setMapFormData({ ...mapFormData, pincode: e.target.value })}
                          className="account-search-input"
                          placeholder="6-digit pincode"
                        />
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "18px" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", color: "#334155", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={mapFormData.isDefault}
                            onChange={(e) => setMapFormData({ ...mapFormData, isDefault: e.target.checked })}
                          />
                          <span>Set as Default Address</span>
                        </label>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "10px" }}>
                      <button
                        type="button"
                        className="asp-btn-outline"
                        onClick={() => setAddressViewMode("list")}
                        disabled={savingAddress}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="asp-btn-primary" disabled={savingAddress}>
                        {savingAddress ? "Saving..." : editingAddress ? "Update Address" : "Save Address"}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}

          {/* ================================================================= */}
          {/* TAB 4: PAYMENT METHODS                                            */}
          {/* ================================================================= */}
          {activeTab === "payment" && (
            <>
              {paymentViewMode === "list" ? (
                <>
                  {/* Top Bar with Add Payment Method Button */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h4 className="asp-section-title">Payment Methods ({methods.length})</h4>
                      <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                        Manage saved bank accounts, cards, and UPI options.
                      </p>
                    </div>
                    <button type="button" className="asp-btn-primary" onClick={startAddPayment}>
                      <Plus size={15} />
                      <span>Add Payment Method</span>
                    </button>
                  </div>

                  {/* Search, Filter & Sort */}
                  <div className="account-search-filter-bar">
                    <div className="account-search-row">
                      <div className="account-search-input-box">
                        <Search size={15} className="account-search-icon" />
                        <input
                          type="text"
                          placeholder="Search methods by bank name, last 4 digits, or UPI..."
                          value={paymentSearch}
                          onChange={(e) => setPaymentSearch(e.target.value)}
                          className="account-search-input"
                        />
                        {paymentSearch && (
                          <button type="button" className="account-search-clear" onClick={() => setPaymentSearch("")}>
                            <X size={13} />
                          </button>
                        )}
                      </div>

                      <NormalDropdown
                        value={paymentSort}
                        onChange={(e) => setPaymentSort(e.target.value)}
                        options={[
                          { value: "default_first", label: "Default First" },
                          { value: "recent", label: "Recently Added" },
                          { value: "name", label: "Name" }
                        ]}
                        ariaLabel="Sort payment methods"
                      />
                    </div>

                    <div className="account-filter-chips-row">
                      {[
                        { key: "all", label: "All Methods" },
                        { key: "bank", label: "🏦 Bank Accounts" },
                        { key: "card", label: "💳 Cards" },
                        { key: "upi", label: "📱 UPI IDs" }
                      ].map((chip) => (
                        <button
                          key={chip.key}
                          type="button"
                          className={`account-filter-chip ${paymentFilter === chip.key ? "active" : ""}`}
                          onClick={() => setPaymentFilter(chip.key)}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment Methods Grid */}
                  {filteredMethods.length === 0 ? (
                    <div className="asp-empty-state">
                      <div className="asp-empty-icon">
                        <CreditCard size={24} />
                      </div>
                      <h5 style={{ margin: 0, fontSize: "14px", color: "#0f172a" }}>No payment methods found</h5>
                      <p style={{ margin: 0, fontSize: "12.5px" }}>
                        {paymentSearch ? "No saved methods match your filter." : "Add a payment method for 1-click checkout."}
                      </p>
                      <button type="button" className="asp-btn-primary" onClick={startAddPayment} style={{ marginTop: "6px" }}>
                        <Plus size={15} /> Add Payment Method
                      </button>
                    </div>
                  ) : (
                    <div className="asp-payment-grid">
                      {filteredMethods.map((m) => (
                        <div key={m._id} className="asp-payment-card">
                          <div>
                            <div className="asp-payment-card-top">
                              <span className="asp-payment-badge">
                                {m.type === "upi" ? <Sparkles size={11} /> : <Building2 size={11} />}
                                <span>{m.type === "upi" ? "UPI Verified" : m.bankName || "Net Banking"}</span>
                              </span>
                              {m.isDefault && (
                                <span className="asp-default-pill">DEFAULT</span>
                              )}
                            </div>

                            <h4 className="asp-payment-title">
                              {m.type === "upi" ? "UPI ID" : m.type === "card" ? "Credit / Debit Card" : "Bank Account"}
                            </h4>

                            <p className="asp-payment-meta">
                              {m.type === "upi"
                                ? m.upiId || "upi@okhdfcbank"
                                : `A/C: •••• ${m.last4 || (m.accountNumber ? m.accountNumber.slice(-4) : "7890")}`}
                            </p>

                            <p className="asp-payment-sub">
                              {m.type === "upi" ? "Instant UPI Payment" : "Direct Bank Transfer"}
                            </p>
                          </div>

                          <div className="asp-payment-actions">
                            <button
                              type="button"
                              className="asp-action-btn"
                              onClick={() => startEditPayment(m)}
                              style={{ flex: 1, justifyContent: "center" }}
                            >
                              <Pencil size={12} /> Edit
                            </button>
                            <button
                              type="button"
                              className="asp-action-btn danger"
                              onClick={() => handleDeletePaymentMethod(m._id)}
                              disabled={deletingPaymentId === m._id}
                              style={{ flex: 1, justifyContent: "center" }}
                            >
                              <Trash2 size={12} /> Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                /* Mode B: Add / Edit Payment Method Form */
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <button
                      type="button"
                      className="asp-btn-outline"
                      onClick={() => setPaymentViewMode("list")}
                      style={{ fontSize: "12px", padding: "6px 12px" }}
                    >
                      <ArrowLeft size={14} /> Back to Methods
                    </button>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                      {editingPayment ? "Edit Payment Method" : "Add Payment Method"}
                    </span>
                  </div>

                  {/* Method Type Selector Pills */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                    {[
                      { key: "card", label: "💳 Card" },
                      { key: "bank", label: "🏦 Bank Account" },
                      { key: "upi", label: "📱 UPI ID" }
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        className={`account-filter-chip ${paymentFormTab === tab.key ? "active" : ""}`}
                        onClick={() => setPaymentFormTab(tab.key)}
                        style={{ textAlign: "center", borderRadius: "8px", padding: "8px" }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleSavePaymentMethod} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {paymentFormTab === "card" && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div style={{ gridColumn: "span 2" }}>
                          <label style={{ fontSize: "11.5px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
                            Cardholder Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={paymentFormData.cardholderName}
                            onChange={(e) => setPaymentFormData({ ...paymentFormData, cardholderName: e.target.value })}
                            className="account-search-input"
                            placeholder="Name on card"
                          />
                        </div>

                        <div style={{ gridColumn: "span 2" }}>
                          <label style={{ fontSize: "11.5px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
                            Card Number *
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={19}
                            value={paymentFormData.cardNumber}
                            onChange={(e) => setPaymentFormData({ ...paymentFormData, cardNumber: e.target.value })}
                            className="account-search-input"
                            placeholder="16-digit card number"
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: "11.5px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
                            Expiry Month
                          </label>
                          <input
                            type="text"
                            maxLength={2}
                            value={paymentFormData.expiryMonth}
                            onChange={(e) => setPaymentFormData({ ...paymentFormData, expiryMonth: e.target.value })}
                            className="account-search-input"
                            placeholder="MM"
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: "11.5px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
                            Expiry Year
                          </label>
                          <input
                            type="text"
                            maxLength={4}
                            value={paymentFormData.expiryYear}
                            onChange={(e) => setPaymentFormData({ ...paymentFormData, expiryYear: e.target.value })}
                            className="account-search-input"
                            placeholder="YYYY"
                          />
                        </div>
                      </div>
                    )}

                    {paymentFormTab === "bank" && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div style={{ gridColumn: "span 2" }}>
                          <label style={{ fontSize: "11.5px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
                            Bank Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={paymentFormData.bankName}
                            onChange={(e) => setPaymentFormData({ ...paymentFormData, bankName: e.target.value })}
                            className="account-search-input"
                            placeholder="e.g. State Bank of India, HDFC"
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: "11.5px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
                            Account Holder Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={paymentFormData.accountName}
                            onChange={(e) => setPaymentFormData({ ...paymentFormData, accountName: e.target.value })}
                            className="account-search-input"
                            placeholder="Beneficiary Name"
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: "11.5px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
                            Account Number *
                          </label>
                          <input
                            type="text"
                            required
                            value={paymentFormData.accountNumber}
                            onChange={(e) => setPaymentFormData({ ...paymentFormData, accountNumber: e.target.value })}
                            className="account-search-input"
                            placeholder="Bank Account Number"
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: "11.5px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
                            IFSC Code *
                          </label>
                          <input
                            type="text"
                            required
                            value={paymentFormData.ifsc}
                            onChange={(e) => setPaymentFormData({ ...paymentFormData, ifsc: e.target.value })}
                            className="account-search-input"
                            placeholder="e.g. SBIN0001234"
                          />
                        </div>
                      </div>
                    )}

                    {paymentFormTab === "upi" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <div>
                          <label style={{ fontSize: "11.5px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
                            Virtual Payment Address (UPI ID) *
                          </label>
                          <input
                            type="text"
                            required
                            value={paymentFormData.upiId}
                            onChange={(e) => setPaymentFormData({ ...paymentFormData, upiId: e.target.value })}
                            className="account-search-input"
                            placeholder="e.g. mobile@upi or name@okaxis"
                          />
                        </div>
                      </div>
                    )}

                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", color: "#334155", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={paymentFormData.isDefault}
                          onChange={(e) => setPaymentFormData({ ...paymentFormData, isDefault: e.target.checked })}
                        />
                        <span>Set as Default Payment Method</span>
                      </label>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
                      <button
                        type="button"
                        className="asp-btn-outline"
                        onClick={() => setPaymentViewMode("list")}
                        disabled={savingPayment}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="asp-btn-primary" disabled={savingPayment}>
                        {savingPayment ? "Saving..." : editingPayment ? "Update Method" : "Save Method"}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onPhotoCaptured={handlePhotoCapturedFromCamera}
        title="Take Profile Photo"
      />
    </div>
  );
}
