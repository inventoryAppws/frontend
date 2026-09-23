/**
 * anywear.js
 * 
 * Integration utility for Decart Anywear Live Virtual Try-On SDK (Lucy V-TON).
 * Handles Schema.org JSON-LD injection, widget opening, postMessage communication,
 * and seamless fallback to in-app fitting room.
 */

/**
 * Check if the Decart Anywear SDK is loaded and ready
 */
export function isAnywearAvailable() {
  return typeof window !== 'undefined' && Boolean(window.DecartWidget && typeof window.DecartWidget.open === 'function');
}

/**
 * Extract clean image URL from a product object or string
 */
export function getProductGarmentImage(productOrUrl) {
  if (!productOrUrl) return '';
  if (typeof productOrUrl === 'string') return productOrUrl;

  return (
    productOrUrl.virtualTryOn?.tryOnImage ||
    productOrUrl.tryOnImage ||
    productOrUrl.image ||
    (Array.isArray(productOrUrl.images) && productOrUrl.images[0]) ||
    ''
  );
}

/**
 * Inject or update Schema.org Product JSON-LD in the DOM
 * This is scanned by Decart Anywear's isProductPage() detector.
 */
export function injectProductJsonLd(product) {
  if (typeof document === 'undefined' || !product) return;

  const imageUrl = getProductGarmentImage(product);
  const id = 'decart-product-jsonld';

  let script = document.getElementById(id);
  if (!script) {
    script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }

  const schema = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name || 'Apparel Item',
    image: imageUrl ? [imageUrl] : [],
    description: product.description || product.name || '',
    sku: String(product._id || product.id || 'ITEM-001'),
    offers: {
      '@type': 'Offer',
      price: product.price || 0,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock'
    }
  };

  script.textContent = JSON.stringify(schema);

  // Also update or create og:image for Decart's visual detector fallback
  if (imageUrl) {
    let ogImg = document.querySelector('meta[property="og:image"]');
    if (!ogImg) {
      ogImg = document.createElement('meta');
      ogImg.setAttribute('property', 'og:image');
      document.head.appendChild(ogImg);
    }
    ogImg.setAttribute('content', imageUrl);
  }
}

/**
 * Clean up injected Schema.org JSON-LD
 */
export function removeProductJsonLd() {
  if (typeof document === 'undefined') return;
  const script = document.getElementById('decart-product-jsonld');
  if (script) script.remove();
}

/**
 * Open the Decart Anywear Live Try-On Widget for a given garment/product
 * 
 * @param {Object|string} productOrUrl - Product object or direct garment image URL
 * @returns {boolean} - true if official Anywear widget was opened, false if fallback used
 */
export function openAnywearTryOn(productOrUrl) {
  // Remove any orphan Decart container if injected previously
  if (typeof document !== 'undefined') {
    const lingering = document.getElementById('__decart-tryon-widget');
    if (lingering) lingering.remove();
  }

  // Open the platform's Live Camera Virtual Try-On Modal
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('open-virtual-tryon', {
        detail: {
          product: typeof productOrUrl === 'object' ? productOrUrl : null,
          mode: 'camera'
        }
      })
    );
  }

  return true;
}

