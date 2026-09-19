import api from './api';

export const DEFAULT_LOCATION_SETTINGS = {
  provider: 'photon', // 'photon' | 'nominatim'
  tileLayer: 'osm', // 'osm' | 'positron' | 'hot'
  expressRadiusKm: 100,
  autoDetectGps: true,
  showExpressBadges: true, // Show or hide express delivery badges on products
  badgeStyle: 'express_time', // 'express_time' | 'free_delivery' | 'dispatched_hub'
  expressCategoriesOnly: true, // Only show on Grocery, Essentials, Quick Delivery categories
  defaultDeliveryFilter: 'all', // 'all' | 'express'
  preferredHub: 'auto' // 'auto' | hub code (e.g. 'HUB-GNT-01', 'HUB-VJA-01', etc.)
};

export const REGIONAL_FULFILLMENT_HUBS = [
  { code: 'auto', name: 'Auto-detect Nearest Active Hub', city: 'Automatic' },
  { code: 'HUB-GNT-01', name: 'Guntur - Amaravati Regional Hub', city: 'Guntur' },
  { code: 'HUB-VJA-01', name: 'Vijayawada Central Logistics Park', city: 'Vijayawada' },
  { code: 'HUB-VIZ-01', name: 'Visakhapatnam MVP Express Hub', city: 'Visakhapatnam' },
  { code: 'HUB-HYD-01', name: 'Hyderabad Regional Hub', city: 'Hyderabad' },
  { code: 'HUB-BLR-01', name: 'Bengaluru Central Fulfillment Hub', city: 'Bengaluru' },
  { code: 'HUB-CHE-01', name: 'Chennai Central Hub', city: 'Chennai' },
  { code: 'HUB-MUM-01', name: 'Mumbai Western Logistics Hub', city: 'Mumbai' },
  { code: 'HUB-DEL-01', name: 'Delhi NCR Mega Warehouse', city: 'Delhi NCR' }
];

export const EXPRESS_CATEGORIES = [
  'grocery',
  'groceries',
  'daily essentials',
  'essentials',
  'fruits & vegetables',
  'fruits',
  'vegetables',
  'dairy & bakery',
  'dairy',
  'bakery',
  'beverages',
  'snacks & foods',
  'snacks',
  'food',
  'personal care',
  'beauty & care',
  'health & wellness',
  'medicines',
  'quick delivery',
  'instant',
  'fresh'
];

/**
 * Checks if a product qualifies for express delivery based on its category/name or flags.
 */
export function isProductExpressEligible(product, expressCategoriesOnly = true) {
  if (!product) return false;
  if (!expressCategoriesOnly) return true;

  if (product.isExpress || product.isQuickDelivery || product.expressDelivery) return true;

  const cat = String(product.category || '').toLowerCase().trim();
  if (EXPRESS_CATEGORIES.some((c) => cat.includes(c) || c.includes(cat))) {
    return true;
  }

  const name = String(product.name || '').toLowerCase();
  const keywords = [
    'fresh', 'milk', 'bread', 'apple', 'banana', 'vegetable', 'fruit',
    'snack', 'biscuit', 'chips', 'grocery', 'egg', 'paneer', 'butter'
  ];
  if (keywords.some((k) => name.includes(k))) {
    return true;
  }

  return false;
}

export function getLocationSettings() {
  try {
    const raw = localStorage.getItem('address_map_settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_LOCATION_SETTINGS,
        ...parsed,
        expressCategoriesOnly: parsed.expressCategoriesOnly !== undefined ? parsed.expressCategoriesOnly : true,
        defaultDeliveryFilter: parsed.defaultDeliveryFilter || 'all',
        preferredHub: parsed.preferredHub || 'auto'
      };
    }
  } catch {}
  return DEFAULT_LOCATION_SETTINGS;
}

export function saveLocationSettings(settings) {
  try {
    localStorage.setItem('address_map_settings', JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('address-settings-changed', { detail: settings }));
  } catch {}
}

export async function reverseGeocode(lat, lng, provider = null) {
  const activeProvider = provider || getLocationSettings().provider;
  const response = await api.get('/location/reverse-geocode', {
    params: { lat, lng, provider: activeProvider }
  });
  return response.data;
}

export async function searchLocation(query, provider = null) {
  if (!query || query.trim().length < 2) return [];
  const activeProvider = provider || getLocationSettings().provider;
  const response = await api.get('/location/search', {
    params: { q: query, provider: activeProvider }
  });
  return response.data;
}

export async function getNearestHub(lat, lng, area = '', city = '', maxRadiusKm = null, pincode = '', preferredHub = null) {
  const settings = getLocationSettings();
  const radius = maxRadiusKm || settings.expressRadiusKm || 100;
  const activeHub = preferredHub !== null && preferredHub !== undefined ? preferredHub : (settings.preferredHub || 'auto');
  const response = await api.get('/location/nearest-hub', {
    params: { lat, lng, area, city, maxRadiusKm: radius, pincode, preferredHub: activeHub }
  });
  return response.data;
}

export async function getAllHubs() {
  const response = await api.get('/location/hubs');
  return response.data;
}
