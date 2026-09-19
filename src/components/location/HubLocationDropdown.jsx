import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Store, ChevronDown, Check, Navigation, Building2, MapPin } from 'lucide-react';
import { REGIONAL_FULFILLMENT_HUBS } from '../../services/locationService';

export default function HubLocationDropdown({
  value = 'auto',
  onChange,
  hubs = REGIONAL_FULFILLMENT_HUBS,
  compact = false,
  fullWidth = false,
  className = '',
  style = {}
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, right: 0, width: 0 });
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);

  // Update floating popover position relative to viewport with boundary safety
  const updatePosition = useCallback(() => {
    if (!dropdownRef.current) return;
    const rect = dropdownRef.current.getBoundingClientRect();
    const menuWidth = fullWidth ? Math.max(rect.width, 320) : 340;

    // Vertical position: flip upwards if overflowing bottom viewport
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const placeAbove = spaceBelow < 280 && spaceAbove > spaceBelow;
    const top = placeAbove ? Math.max(10, rect.top - 310) : rect.bottom + 6;

    // Horizontal position: ensure fully within viewport bounds
    let left = rect.left;
    if (left + menuWidth > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - menuWidth - 12);
    }
    if (left < 12) {
      left = 12;
    }

    setCoords({
      top: Math.round(top),
      left: Math.round(left),
      width: Math.round(rect.width)
    });
  }, [fullWidth]);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const handleScroll = (e) => {
        // If scrolling inside the menu itself, do not reposition or close
        if (menuRef.current && menuRef.current.contains(e.target)) return;
        updatePosition();
      };
      const handleResize = () => updatePosition();

      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isOpen, updatePosition]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const activeHub = (hubs || []).find((h) => h.code === value);
  const displayLabel = !value || value === 'auto'
    ? (fullWidth ? 'All Regional Hubs (Auto-detect nearest)' : 'All Hubs (Auto)')
    : (activeHub
        ? (fullWidth ? `${activeHub.name} (${activeHub.city})` : `${activeHub.city} Hub`)
        : value);

  const handleSelect = (code) => {
    if (onChange) onChange(code);
    setIsOpen(false);
  };

  const menuStyle = {
    position: 'fixed',
    top: `${coords.top}px`,
    left: `${coords.left}px`,
    width: fullWidth ? `${Math.max(coords.width, 320)}px` : '340px',
    maxWidth: 'calc(100vw - 24px)',
    zIndex: 999999
  };

  return (
    <div
      className={`adv-custom-hub-dropdown ${compact ? 'compact' : ''} ${fullWidth ? 'full-width' : ''} ${className}`}
      ref={dropdownRef}
      style={style}
    >
      {/* TRIGGER BUTTON (NO NATIVE SELECT) */}
      <button
        type="button"
        className={`adv-custom-hub-trigger ${isOpen ? 'active' : ''} ${value && value !== 'auto' ? 'has-selection' : ''}`}
        onClick={() => {
          updatePosition();
          setIsOpen((prev) => !prev);
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title={`Fulfillment Warehouse: ${displayLabel}`}
      >
        <div className="adv-custom-hub-icon-wrap">
          <Store size={14} />
        </div>
        <span className="adv-custom-hub-text">{displayLabel}</span>
        <ChevronDown size={14} className={`adv-custom-hub-chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {/* PORTAL MENU: MOUNTED TO BODY TO PREVENT OVERFLOW CLIPPING */}
      {isOpen &&
        ReactDOM.createPortal(
          <div
            className="adv-custom-hub-menu adv-portal-elevated"
            role="listbox"
            ref={menuRef}
            style={menuStyle}
          >
            <div className="adv-custom-hub-menu-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Store size={14} color="#4f46e5" />
                <span>Deliver From Regional Logistics Hub</span>
              </div>
            </div>

            <div className="adv-custom-hub-menu-list">
              {/* Option: Auto-Detect */}
              <div
                className={`adv-hub-row ${!value || value === 'auto' ? 'selected' : ''}`}
                onClick={() => handleSelect('auto')}
                role="option"
                aria-selected={!value || value === 'auto'}
              >
                <div className="adv-hub-row-icon blue">
                  <Navigation size={15} />
                </div>
                <div className="adv-hub-row-info">
                  <span className="adv-hub-row-title">
                    All Regional Hubs
                    <span className="adv-hub-auto-badge">Auto</span>
                  </span>
                  <span className="adv-hub-row-desc">
                    Calculates from closest warehouse (Vinukonda, Guntur, Vijayawada...)
                  </span>
                </div>
                <div className="adv-hub-row-radio">
                  {(!value || value === 'auto') && <Check size={12} strokeWidth={3} />}
                </div>
              </div>

              {/* Hub Options */}
              {(hubs || [])
                .filter((h) => h.code !== 'auto')
                .map((hub) => {
                  const isSelected = value === hub.code;
                  return (
                    <div
                      key={hub.code}
                      className={`adv-hub-row ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelect(hub.code)}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <div className="adv-hub-row-icon purple">
                        <Building2 size={15} />
                      </div>
                      <div className="adv-hub-row-info">
                        <span className="adv-hub-row-title">
                          <strong>{hub.city}</strong> Hub
                        </span>
                        <span className="adv-hub-row-desc">
                          {hub.name} • {hub.address || `${hub.city} Logistics Park`}
                        </span>
                      </div>
                      <div className="adv-hub-row-radio">
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
