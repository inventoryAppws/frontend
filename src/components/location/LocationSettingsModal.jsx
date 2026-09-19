import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Check,
  Zap,
  Globe,
  Layers,
  Compass,
  RotateCcw,
  Truck,
  Store,
  Filter
} from 'lucide-react';
import {
  getLocationSettings,
  saveLocationSettings,
  DEFAULT_LOCATION_SETTINGS,
  REGIONAL_FULFILLMENT_HUBS
} from '../../services/locationService';
import HubLocationDropdown from './HubLocationDropdown';
import { toast } from '../Toast';

export default function LocationSettingsModal({ isOpen, onClose }) {
  const [settings, setSettings] = useState(DEFAULT_LOCATION_SETTINGS);

  useEffect(() => {
    if (isOpen) {
      setSettings(getLocationSettings());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveLocationSettings(settings);
    toast.success('Location & Geocoding preferences saved!');
    onClose();
  };

  const handleReset = () => {
    setSettings(DEFAULT_LOCATION_SETTINGS);
    saveLocationSettings(DEFAULT_LOCATION_SETTINGS);
    toast.info('Preferences reset to defaults.');
  };

  return (
    <div className="map-modal-backdrop" onClick={onClose}>
      <div className="location-settings-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="location-settings-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="location-settings-icon-box">
              <Settings size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
                Address & Map Settings
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: '#64748b' }}>
                Choose your geocoding engine, map appearance, and local delivery radius.
              </p>
            </div>
          </div>
          <button type="button" className="map-modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="location-settings-body">
          {/* SECTION 1: GEOCODING API PROVIDER */}
          <div className="settings-section-block">
            <div className="settings-section-title-row">
              <Globe size={16} color="#4f46e5" />
              <label className="settings-section-title">Address & Geocoding API</label>
            </div>
            <p className="settings-section-hint">
              Free geocoding services to convert addresses &harr; coordinates. If one is slow, easily switch providers.
            </p>

            <div className="provider-options-grid">
              {/* Photon Komoot */}
              <div
                className={`provider-card ${settings.provider === 'photon' ? 'selected' : ''}`}
                onClick={() => setSettings({ ...settings, provider: 'photon' })}
              >
                <div className="provider-card-top">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong>Photon (by Komoot)</strong>
                    <span className="provider-badge-rec">Recommended</span>
                  </div>
                  <div className="provider-radio-dot">
                    {settings.provider === 'photon' && <Check size={12} strokeWidth={3} />}
                  </div>
                </div>
                <p className="provider-card-desc">
                  OpenStreetMap-powered geocoder. Instant autocomplete, exceptional for Indian villages (e.g. Denkada), towns, and cities with zero rate-limit blocks.
                </p>
              </div>

              {/* Nominatim OSM */}
              <div
                className={`provider-card ${settings.provider === 'nominatim' ? 'selected' : ''}`}
                onClick={() => setSettings({ ...settings, provider: 'nominatim' })}
              >
                <div className="provider-card-top">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong>Nominatim (Official OSM)</strong>
                    <span className="provider-badge-osm">Standard</span>
                  </div>
                  <div className="provider-radio-dot">
                    {settings.provider === 'nominatim' && <Check size={12} strokeWidth={3} />}
                  </div>
                </div>
                <p className="provider-card-desc">
                  Standard OpenStreetMap geocoding with deep administrative hierarchies and official postal boundaries.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 2: MAP TILE LAYER STYLE */}
          <div className="settings-section-block">
            <div className="settings-section-title-row">
              <Layers size={16} color="#4f46e5" />
              <label className="settings-section-title">Map Tile Layer Style</label>
            </div>
            <div className="tile-options-grid">
              {[
                { id: 'osm', label: 'Standard OSM', desc: 'Default vibrant OpenStreetMap tiles' },
                { id: 'positron', label: 'CartoDB Positron', desc: 'Minimalist, clean, elegant light style' },
                { id: 'hot', label: 'Humanitarian OSM', desc: 'High-contrast detailed building footprints' }
              ].map((tile) => (
                <div
                  key={tile.id}
                  className={`tile-choice-card ${settings.tileLayer === tile.id ? 'active' : ''}`}
                  onClick={() => setSettings({ ...settings, tileLayer: tile.id })}
                >
                  <strong>{tile.label}</strong>
                  <span>{tile.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: PRODUCT DELIVERY BADGES */}
          <div className="settings-section-block">
            <div className="settings-section-title-row">
              <Zap size={16} color="#4f46e5" />
              <label className="settings-section-title">Product Delivery Badges</label>
            </div>
            <p className="settings-section-hint">
              Customize or hide the delivery badge shown on product cards. No raw km distances are displayed.
            </p>

            <label className="settings-toggle-label" style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={settings.showExpressBadges !== false}
                onChange={(e) => setSettings({ ...settings, showExpressBadges: e.target.checked })}
              />
              <span style={{ fontWeight: 600, color: '#1e293b' }}>
                Show Delivery Badges on Product Cards
              </span>
            </label>

            {settings.showExpressBadges !== false && (
              <>
                <div style={{ marginTop: '10px', marginBottom: '14px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '8px' }}>
                    Badge Display Text:
                  </label>
                  <div className="tile-options-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    {[
                      { id: 'express_time', label: '⚡ Express Delivery Speed', desc: 'Highlights real-time speed (30 mins / Under 2h / Same-Day / Next-Day)' },
                      { id: 'free_delivery', label: '✨ Free Delivery Available', desc: 'Promotes free local delivery benefit' },
                      { id: 'dispatched_hub', label: '🏬 Dispatched from [City] Hub', desc: 'Displays regional warehouse fulfillment transparency' }
                    ].map((style) => (
                      <div
                        key={style.id}
                        className={`tile-choice-card ${settings.badgeStyle === style.id ? 'active' : ''}`}
                        onClick={() => setSettings({ ...settings, badgeStyle: style.id })}
                      >
                        <strong>{style.label}</strong>
                        <span>{style.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: '10px', marginBottom: '14px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '8px' }}>
                    Eligible Products:
                  </label>
                  <div className="tile-options-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div
                      className={`tile-choice-card ${settings.expressCategoriesOnly !== false ? 'active' : ''}`}
                      onClick={() => setSettings({ ...settings, expressCategoriesOnly: true })}
                    >
                      <strong>Grocery & Quick Items Only</strong>
                      <span>Only show for Groceries, Food, Essentials, Fruits & Fresh items</span>
                    </div>
                    <div
                      className={`tile-choice-card ${settings.expressCategoriesOnly === false ? 'active' : ''}`}
                      onClick={() => setSettings({ ...settings, expressCategoriesOnly: false })}
                    >
                      <strong>All Products</strong>
                      <span>Show badge on all eligible items fulfilled near the active address</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* SECTION 4: DELIVERY RADIUS */}
          <div className="settings-section-block">
            <div className="settings-section-title-row">
              <Compass size={16} color="#4f46e5" />
              <label className="settings-section-title">Express Delivery Proximity Radius</label>
            </div>
            <p className="settings-section-hint">
              Addresses within up to 100 km from a regional fulfillment warehouse qualify for express delivery in real time.
            </p>
            <div className="radius-chips-row">
              {[15, 30, 50, 75, 100].map((km) => (
                <button
                  key={km}
                  type="button"
                  className={`radius-chip-btn ${settings.expressRadiusKm === km ? 'active' : ''}`}
                  onClick={() => setSettings({ ...settings, expressRadiusKm: km })}
                >
                  {km} km {km === 100 ? '(Recommended)' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 5: DEFAULT CATALOG DELIVERY FILTER */}
          <div className="settings-section-block">
            <div className="settings-section-title-row">
              <Truck size={16} color="#4f46e5" />
              <label className="settings-section-title">Default Delivery Filter Preference</label>
            </div>
            <p className="settings-section-hint">
              Choose whether the product catalog automatically prioritizes express/fastest delivery items upon opening.
            </p>
            <div className="tile-options-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div
                className={`tile-choice-card ${settings.defaultDeliveryFilter !== 'express' ? 'active' : ''}`}
                onClick={() => setSettings({ ...settings, defaultDeliveryFilter: 'all' })}
              >
                <strong>All Speeds (Standard)</strong>
                <span>Display all catalog products across standard and express delivery</span>
              </div>
              <div
                className={`tile-choice-card ${settings.defaultDeliveryFilter === 'express' ? 'active' : ''}`}
                onClick={() => setSettings({ ...settings, defaultDeliveryFilter: 'express' })}
              >
                <strong>⚡ Prioritize Fastest Delivery</strong>
                <span>Filter catalog to only show items deliverable via express delivery</span>
              </div>
            </div>
          </div>

          {/* SECTION 6: PREFERRED REGIONAL LOGISTICS HUB */}
          <div className="settings-section-block">
            <div className="settings-section-title-row">
              <Store size={16} color="#4f46e5" />
              <label className="settings-section-title">Preferred Regional Logistics Hub</label>
            </div>
            <p className="settings-section-hint">
              Select the fulfillment warehouse used to calculate delivery distance and dispatch estimates.
            </p>
            <div style={{ marginTop: '10px' }}>
              <HubLocationDropdown
                value={settings.preferredHub || 'auto'}
                hubs={REGIONAL_FULFILLMENT_HUBS}
                fullWidth
                onChange={(hubCode) => setSettings({ ...settings, preferredHub: hubCode })}
              />
            </div>
          </div>

          {/* SECTION 7: GPS AUTO DETECTION */}
          <div className="settings-section-block">
            <div className="settings-section-title-row">
              <Compass size={16} color="#4f46e5" />
              <label className="settings-section-title">Browser GPS Auto-Detect</label>
            </div>
            <label className="settings-toggle-label">
              <input
                type="checkbox"
                checked={settings.autoDetectGps}
                onChange={(e) => setSettings({ ...settings, autoDetectGps: e.target.checked })}
              />
              <span>Automatically detect device location when adding a new address</span>
            </label>
          </div>
        </div>

        {/* FOOTER */}
        <div className="location-settings-footer">
          <button type="button" className="btn-settings-reset" onClick={handleReset}>
            <RotateCcw size={14} />
            <span>Reset Defaults</span>
          </button>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="btn-map-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn-map-save" onClick={handleSave}>
              <Check size={16} />
              <span>Save Preferences</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

