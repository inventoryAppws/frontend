import api from './api';

const STORAGE_KEY = 'customer_product_compare_list';

export function getCompareList() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToCompare(product) {
  if (!product) return getCompareList();
  const current = getCompareList();
  const prodId = product._id || product.id;

  if (current.some((p) => (p._id || p.id) === prodId)) {
    return current; // already in compare
  }

  if (current.length >= 4) {
    throw new Error('You can compare up to 4 products at a time. Please remove one first.');
  }

  const discount = Number(product.discountPercentage ?? 10);
  const origPrice = Number(product.price || 0);
  const effPrice = Math.round(origPrice * (1 - discount / 100));

  const item = {
    _id: prodId,
    name: product.name,
    category: product.category || 'General',
    image: product.image || (Array.isArray(product.images) ? product.images[0] : ''),
    price: effPrice,
    originalPrice: origPrice,
    discountPercentage: discount,
    rating: product.rating || 4.3,
    ratingCount: product.ratingCount || 28,
    quantity: product.quantity ?? 10,
    vendorName: product.vendorName || product.userId?.name || 'Verified Merchant',
    warranty: product.warranty || '1 Year Manufacturer Warranty',
    returnPolicy: product.returnPolicy || '7 Days Return & Exchange',
    specifications: product.specifications || null,
    description: product.description || '',
    brand: product.brand || '',
    colors: product.colors || [],
    sizes: product.sizes || []
  };

  const updated = [...current, item];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('product-compare-updated', { detail: updated }));
  }
  return updated;
}

export function removeFromCompare(productId) {
  const current = getCompareList();
  const updated = current.filter((p) => (p._id || p.id) !== productId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('product-compare-updated', { detail: updated }));
  }
  return updated;
}

export function clearCompare() {
  localStorage.removeItem(STORAGE_KEY);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('product-compare-updated', { detail: [] }));
  }
  return [];
}

export function isInCompare(productId) {
  const current = getCompareList();
  return current.some((p) => (p._id || p.id) === productId);
}

export async function requestCompareAiAnalysis(productIds) {
  const res = await api.post('/products/compare-ai', { productIds });
  return res.data;
}

