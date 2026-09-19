import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  ChevronDown,
  ChevronRight,
  Home,
  Briefcase,
  Plus,
  Building2,
  Settings,
  Search,
  X,
  Map
} from 'lucide-react';
import { getAddresses, setDefaultAddress } from '../../services/addressService';
import AddressMapModal from './AddressMapModal';

export default function NavbarAddressDropdown({ onOpenManageAddresses, onOpenLocationSettings, customerProfile = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [profile, setProfile] = useState(() => {
    if (customerProfile) return customerProfile;
    try {
      return JSON.parse(localStorage.getItem('customer_profile') || 'null');
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (customerProfile) {
      setProfile(customerProfile);
    } else {
      try {
        const stored = JSON.parse(localStorage.getItem('customer_profile') || 'null');
        if (stored) setProfile(stored);
      } catch {}
    }
  }, [customerProfile]);

  const dropdownRef = useRef(null);

  // Load addresses on mount and when changed
  const loadAddresses = async () => {
    try {
      const list = await getAddresses();
      const addrList = Array.isArray(list) ? list : [];
      setAddresses(addrList);

      // Check stored selection
      const stored = localStorage.getItem('selected_delivery_address');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const match = addrList.find((a) => a._id === parsed._id);
          const finalAddr = match || parsed || addrList[0] || null;
          setSelectedAddress(finalAddr);
          if (finalAddr) {
            sessionStorage.setItem('checkoutAddress', JSON.stringify(finalAddr));
          }
        } catch {
          setSelectedAddress(addrList[0] || null);
        }
      } else {
        const defaultAddr = addrList.find((a) => a.isDefault) || addrList[0] || null;
        setSelectedAddress(defaultAddr);
        if (defaultAddr) {
          localStorage.setItem('selected_delivery_address', JSON.stringify(defaultAddr));
          sessionStorage.setItem('checkoutAddress', JSON.stringify(defaultAddr));
        }
      }
    } catch (err) {
      console.error('Failed to load navbar addresses:', err);
    }
  };

  useEffect(() => {
    loadAddresses();

    const handleAddressChange = (e) => {
      if (e.detail) {
        setSelectedAddress(e.detail);
        sessionStorage.setItem('checkoutAddress', JSON.stringify(e.detail));
        loadAddresses();
      }
    };

    window.addEventListener('delivery-address-changed', handleAddressChange);
    return () => window.removeEventListener('delivery-address-changed', handleAddressChange);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Select Address handler
  const handleSelectAddress = async (addr) => {
    setSelectedAddress(addr);
    localStorage.setItem('selected_delivery_address', JSON.stringify(addr));
    sessionStorage.setItem('checkoutAddress', JSON.stringify(addr));
    window.dispatchEvent(new CustomEvent('delivery-address-changed', { detail: addr }));
    setIsOpen(false);

    // Optionally set as default in backend
    if (addr._id && !addr.isDefault) {
      try {
        await setDefaultAddress(addr._id);
        loadAddresses();
      } catch {
        // ignore
      }
    }
  };

  // Get icon for address type
  const getTypeIcon = (type) => {
    const norm = String(type || '').toLowerCase();
    if (norm === 'home') return <Home size={18} />;
    if (norm === 'work' || norm === 'office') return <Briefcase size={18} />;
    return <Building2 size={18} />;
  };

  // Format full address description line
  const formatAddressLine = (item) => {
    const parts = [
      item.house,
      item.addressLine1,
      item.addressLine2,
      item.area,
      item.city,
      item.pincode ? `${item.state ? `${item.state} - ` : ''}${item.pincode}` : item.state
    ].filter(Boolean);
    return parts.join(', ');
  };

  // Display label for navbar trigger button
  const displayLocation = selectedAddress
    ? `${selectedAddress.area || selectedAddress.city || 'Delivery Address'}${
        selectedAddress.pincode ? ` ${selectedAddress.pincode}` : ''
      }`
    : 'Select Location';

  // Derive header display info
  const activeAddr = selectedAddress || addresses[0] || null;
  const headerLocationTitle = activeAddr
    ? `${activeAddr.area || activeAddr.city || 'Denkada'} ${activeAddr.pincode || ''}`.trim()
    : 'Denkada 535006';
  const headerTag = activeAddr?.type || 'Home';
  const headerStateSub = activeAddr?.state || activeAddr?.city || 'Andhra Pradesh';

  // Filter addresses by search query
  const filteredAddresses = addresses.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (a.fullName && a.fullName.toLowerCase().includes(q)) ||
      (a.house && a.house.toLowerCase().includes(q)) ||
      (a.addressLine1 && a.addressLine1.toLowerCase().includes(q)) ||
      (a.addressLine2 && a.addressLine2.toLowerCase().includes(q)) ||
      (a.area && a.area.toLowerCase().includes(q)) ||
      (a.city && a.city.toLowerCase().includes(q)) ||
      (a.state && a.state.toLowerCase().includes(q)) ||
      (a.pincode && a.pincode.toLowerCase().includes(q)) ||
      (a.type && a.type.toLowerCase().includes(q)) ||
      (a.saveAs && a.saveAs.toLowerCase().includes(q))
    );
  });

  return (
    <>
      <div className="navbar-delivery-dropdown-wrap" ref={dropdownRef}>
        {/* TOPBAR TRIGGER BUTTON (PRESERVED - UNTOUCHED) */}
        <button
          type="button"
          className={`navbar-delivery-btn ${isOpen ? 'is-open' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          title={selectedAddress?.formattedAddress || displayLocation}
          aria-label="Select delivery location"
        >
          <div className="navbar-delivery-icon-box">
            <MapPin size={16} />
          </div>
          <div className="navbar-delivery-text-info">
            <span className="navbar-delivery-prefix">Deliver to</span>
            <span className="navbar-delivery-location-name">{displayLocation}</span>
          </div>
          <ChevronDown size={14} className="navbar-delivery-chevron" />
        </button>

        {/* DROPDOWN MENU DRAWER (EXACT SPEC MATCHING REFERENCE IMAGE) */}
        {isOpen && (
          <div className="navbar-delivery-menu">
            {/* Top Pointer Caret */}
            <div className="navbar-delivery-menu-caret" />

            {/* HEADER: Deliver to Location & Manage */}
            <div className="navbar-delivery-menu-header">
              <div className="navbar-menu-header-left">
                <div className="navbar-menu-header-pin-bubble">
                  <MapPin size={22} className="navbar-menu-header-pin" />
                </div>
                <div className="navbar-menu-header-titles">
                  <span className="navbar-menu-deliver-label">Deliver to</span>
                  <div className="navbar-menu-location-row">
                    <strong className="navbar-menu-location-title">{headerLocationTitle}</strong>
                    {headerTag && (
                      <span className={`addr-pill-tag ${headerTag.toLowerCase()}`}>
                        {headerTag}
                      </span>
                    )}
                  </div>
                  <span className="navbar-menu-state-sub">{headerStateSub}</span>
                </div>
              </div>

              <button
                type="button"
                className="navbar-menu-manage-btn"
                title="Manage all delivery addresses"
                onClick={() => {
                  setIsOpen(false);
                  if (onOpenManageAddresses) {
                    onOpenManageAddresses();
                  } else if (onOpenLocationSettings) {
                    onOpenLocationSettings();
                  }
                }}
              >
                <Settings size={15} />
                <span>Manage</span>
              </button>
            </div>

            {/* SEARCH INPUT */}
            <div className="navbar-menu-search-box">
              <Search size={16} className="navbar-menu-search-icon" />
              <input
                type="text"
                className="navbar-menu-search-input"
                placeholder="Search your addresses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="navbar-menu-search-clear"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* SAVED ADDRESSES LIST */}
            <div className="navbar-saved-address-list">
              {filteredAddresses.length === 0 ? (
                <div className="navbar-addresses-empty">
                  {searchQuery ? `No addresses matching "${searchQuery}"` : 'No saved addresses found.'}
                </div>
              ) : (
                filteredAddresses.map((item) => {
                  const isSelected = selectedAddress?._id === item._id;
                  const typeLabel = item.type || 'Home';
                  const addressDesc = formatAddressLine(item);

                  return (
                    <div
                      key={item._id}
                      className={`navbar-address-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectAddress(item)}
                    >
                      <div className={`navbar-address-card-icon ${isSelected ? 'selected' : ''}`}>
                        {getTypeIcon(item.type)}
                      </div>
                      <div className="navbar-address-card-info">
                        <div className="navbar-address-card-top-row">
                          <strong className="navbar-address-card-name">
                            {item.fullName || item.saveAs || 'Receiver'}
                          </strong>
                          <span className={`addr-pill-tag ${typeLabel.toLowerCase()}`}>
                            {typeLabel}
                          </span>
                        </div>
                        <p className="navbar-address-card-desc" title={addressDesc}>
                          {addressDesc}
                        </p>
                      </div>
                      <div className={`navbar-address-radio ${isSelected ? 'selected' : ''}`}>
                        {isSelected && <span className="navbar-address-radio-dot" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* BOTTOM ACTIONS (SEARCH ON MAP & ADD NEW ADDRESS) */}
            <div className="navbar-menu-bottom-actions">
              {/* Option 1: Search location on map */}
              <button
                type="button"
                className="navbar-menu-action-row"
                onClick={() => {
                  setIsOpen(false);
                  setIsMapModalOpen(true);
                }}
              >
                <div className="navbar-menu-action-icon">
                  <Map size={18} />
                </div>
                <div className="navbar-menu-action-text">
                  <strong>Search location on map</strong>
                  <span>Find and select a location</span>
                </div>
                <ChevronRight size={17} className="navbar-menu-action-arrow" />
              </button>

              {/* Option 2: Add New Address */}
              <button
                type="button"
                className="navbar-menu-action-row"
                onClick={() => {
                  setIsOpen(false);
                  setIsMapModalOpen(true);
                }}
              >
                <div className="navbar-menu-action-icon">
                  <Plus size={19} />
                </div>
                <div className="navbar-menu-action-text">
                  <strong>Add New Address</strong>
                  <span>Save a new delivery address</span>
                </div>
                <ChevronRight size={17} className="navbar-menu-action-arrow" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MAP MODAL TRIGGERED FROM NAVBAR */}
      <AddressMapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        customerProfile={profile}
        onSuccess={(newAddr) => {
          setSelectedAddress(newAddr);
          loadAddresses();
        }}
      />
    </>
  );
}

