import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link, useOutletContext } from 'react-router-dom';
import {
  Heart,
  ShoppingCart,
  Zap,
  Star,
  Store,
  RotateCcw,
  ShieldCheck,
  Truck,
  CreditCard,
  ArrowLeft,
  Check,
  ChevronRight,
  Package,
  MessageSquarePlus,
  X,
  MapPin,
  Share2,
  Headphones,
  Image,
  Camera,
  Scale,
  Bell,
  Pencil,
  Trash2,
  Loader2,
  Sparkles,
  TrendingDown,
  SlidersHorizontal,
  Users
} from 'lucide-react';
import {
  getProductById,
  getProductReviews,
  addProductReview,
  updateProductReview,
  deleteProductReview,
  getPublicProducts
} from '../../services/productService';
import { getNearestHub, getLocationSettings } from '../../services/locationService';
import { addToCart } from '../../services/cartService';
import { getWishlist, addToWishlist, removeFromWishlist } from '../../services/wishlistService';
import { addToCompare, removeFromCompare, isInCompare } from '../../services/compareService';
import Loader from '../../components/Loader';
import ErrorMessage from '../../components/ErrorMessage';
import Modal from '../../components/Modal';
import { toast } from '../../components/Toast';
import { getErrorMessage } from '../../utils/errorHandler';
import { formatDate } from '../../utils/dateFormatter';
import WishlistCollectionPicker from '../../components/WishlistCollectionPicker';
import AiWriteButton from '../../components/AiWriteButton';
import ProductSpecificationsAccordion from '../../components/product/ProductSpecificationsAccordion';
import ProductSpecificationsSidepanel from '../../components/product/ProductSpecificationsSidepanel';
import PriceHistoryModal from '../../components/price/PriceHistoryModal';
import AddRepeatDeliveryModal from '../../components/subscription/AddRepeatDeliveryModal';
import TryOnModal from '../../components/avatar/TryOnModal';
import AddToSharedCartModal from '../../components/cart/AddToSharedCartModal';
import ProductQASection from '../../components/product/ProductQASection';
import FrequentlyBoughtTogether from '../../components/product/FrequentlyBoughtTogether';
import BecauseYouViewedRail from '../../components/product/BecauseYouViewedRail';
import CompleteTheLookRail from '../../components/product/CompleteTheLookRail';
import ProductPriceHistoryTab from '../../components/product/ProductPriceHistoryTab';
import ProductDecisionAssistant from '../../components/product/ProductDecisionAssistant';
import { injectProductJsonLd, removeProductJsonLd, openAnywearTryOn, isAnywearAvailable } from '../../utils/anywear';

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setCartCount, reloadCart, setCustomBreadcrumb, profile } = useOutletContext() || {};

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Feature Modal States
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [isRepeatModalOpen, setIsRepeatModalOpen] = useState(false);
  const [isTryOnModalOpen, setIsTryOnModalOpen] = useState(false);
  const [tryOnInitialMode, setTryOnInitialMode] = useState('camera');
  const [isSpecsSidepanelOpen, setIsSpecsSidepanelOpen] = useState(false);
  const [isSharedCartModalOpen, setIsSharedCartModalOpen] = useState(false);

  useEffect(() => {
    const handleTryOnEvent = (e) => {
      const mode = e.detail?.mode || 'camera';
      setTryOnInitialMode(mode);
      setIsTryOnModalOpen(true);
    };
    const handleDecartMessage = (e) => {
      if (e.data?.type === 'DECART_ADD_TO_BAG' || e.data?.type === 'DECART_ADD_TO_CART') {
        handleAddToCart();
      }
    };
    window.addEventListener('open-virtual-tryon', handleTryOnEvent);
    window.addEventListener('message', handleDecartMessage);
    return () => {
      window.removeEventListener('open-virtual-tryon', handleTryOnEvent);
      window.removeEventListener('message', handleDecartMessage);
    };
  }, []);

  // Dynamically inject Schema.org Product JSON-LD for Decart Anywear detection
  useEffect(() => {
    if (product) {
      injectProductJsonLd(product);
    }
    return () => {
      removeProductJsonLd();
    };
  }, [product]);

  const [activeDetailsTab, setActiveDetailsTab] = useState('overview');

  const handleDetailsTabClick = (tabKey) => {
    setActiveDetailsTab(tabKey);
  };

  useEffect(() => {
    if (product?.name && setCustomBreadcrumb) {
      setCustomBreadcrumb(product.name);
    }
  }, [product?.name, setCustomBreadcrumb]);

  // Selected variant options
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');

  // Reviews & ratings
  const [reviewsData, setReviewsData] = useState({
    reviews: [],
    summary: { total: 0, average: 0, breakdown: {}, counts: {} }
  });
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [deletingReviewId, setDeletingReviewId] = useState(null);
  const [isCartAddedSuccess, setIsCartAddedSuccess] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '', images: [] });
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [activeReviewPhoto, setActiveReviewPhoto] = useState(null);

  // Authenticated customer identification for matching own reviews
  const currentCustomerId = profile?._id || profile?.id || (() => {
    try {
      const p = JSON.parse(localStorage.getItem('customer_profile') || '{}');
      if (p._id || p.id) return p._id || p.id;
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return u._id || u.id;
    } catch {
      return null;
    }
  })();

  const currentCustomerName = profile?.name || (() => {
    try {
      const p = JSON.parse(localStorage.getItem('customer_profile') || '{}');
      if (p.name) return p.name;
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return u.name;
    } catch {
      return '';
    }
  })();

  const isMyReview = useCallback((rev) => {
    if (!rev) return false;
    if (currentCustomerId && rev.customerId && String(rev.customerId) === String(currentCustomerId)) {
      return true;
    }
    if (currentCustomerName && rev.customerName && rev.customerName.trim().toLowerCase() === currentCustomerName.trim().toLowerCase()) {
      return true;
    }
    return false;
  }, [currentCustomerId, currentCustomerName]);

  // Active gallery image
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Recommendations / Similar
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [wishlistEntryId, setWishlistEntryId] = useState(null);
  const [showWishlistPicker, setShowWishlistPicker] = useState(false);
  const [isCompared, setIsCompared] = useState(false);

  useEffect(() => {
    if (id) {
      setIsCompared(isInCompare(id));
    }
    const onCompareUpdate = () => {
      if (id) {
        setIsCompared(isInCompare(id));
      }
    };
    window.addEventListener('product-compare-updated', onCompareUpdate);
    return () => window.removeEventListener('product-compare-updated', onCompareUpdate);
  }, [id]);

  // Pincode Delivery Estimator State
  const [pincodeInput, setPincodeInput] = useState('');
  const [checkingPincode, setCheckingPincode] = useState(false);
  const [pincodeError, setPincodeError] = useState('');
  const [deliveryEstimate, setDeliveryEstimate] = useState(null);
  const [isPincodeChecked, setIsPincodeChecked] = useState(false);

  const checkDeliveryForPincode = useCallback(async (pin, cityHint = '', coords = null) => {
    const cleanPin = String(pin || '').trim();
    if (!cleanPin || cleanPin.length !== 6 || !/^\d{6}$/.test(cleanPin)) {
      setPincodeError('Please enter a valid 6-digit Indian pincode.');
      return;
    }
    setCheckingPincode(true);
    setPincodeError('');
    try {
      const lat = coords?.lat || null;
      const lng = coords?.lng || null;
      const settings = getLocationSettings();
      const radius = settings.expressRadiusKm || 100;
      const res = await getNearestHub(lat, lng, '', cityHint, radius, cleanPin);
      setDeliveryEstimate({
        isExpress: Boolean(res.eligible || res.isExpress),
        deliveryDays: Math.min(Number(res.deliveryDays) || 2, 2), // Strict 2 days max
        deliveryDate: res.deliveryDate,
        deliveryWindow: res.deliveryWindow,
        hubName: res.hubName,
        city: res.hubCity || cityHint,
        distanceKm: res.distanceKm,
        freeDelivery: res.freeDelivery !== false,
        codAvailable: res.codAvailable !== false
      });
      setIsPincodeChecked(true);
    } catch {
      const now = new Date();
      const twoDays = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
      const formatted = twoDays.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
      setDeliveryEstimate({
        isExpress: false,
        deliveryDays: 2,
        deliveryDate: formatted,
        deliveryWindow: `📦 Standard Delivery • Within 2 Days (${formatted})`,
        hubName: 'Regional Fulfillment Hub',
        city: cityHint || 'Your Location',
        freeDelivery: true,
        codAvailable: true
      });
      setIsPincodeChecked(true);
    } finally {
      setCheckingPincode(false);
    }
  }, []);

  // Initialize delivery estimate from active selected delivery address
  useEffect(() => {
    let pin = '';
    let city = '';
    let coords = null;

    try {
      const stored = localStorage.getItem('selected_delivery_address');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.pincode && /^\d{6}$/.test(String(parsed.pincode).trim())) {
          pin = String(parsed.pincode).trim();
          city = parsed.city || '';
          coords = parsed.coordinates || null;
        }
      }
    } catch {}

    if (!pin) {
      pin = '522002'; // Default regional hub pincode
      city = 'Guntur';
    }

    setPincodeInput(pin);
    checkDeliveryForPincode(pin, city, coords);

    const onAddressChange = (e) => {
      const addr = e.detail;
      if (addr && addr.pincode && /^\d{6}$/.test(String(addr.pincode).trim())) {
        const newPin = String(addr.pincode).trim();
        setPincodeInput(newPin);
        checkDeliveryForPincode(newPin, addr.city || '', addr.coordinates || null);
      }
    };

    window.addEventListener('delivery-address-changed', onAddressChange);
    return () => window.removeEventListener('delivery-address-changed', onAddressChange);
  }, [checkDeliveryForPincode]);

  const handlePincodeSubmit = (e) => {
    e.preventDefault();
    if (isPincodeChecked && !pincodeError) {
      setIsPincodeChecked(false);
      return;
    }
    checkDeliveryForPincode(pincodeInput);
  };

  const loadProduct = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getProductById(id);
      setProduct(data);
      if (data?.colors && data.colors.length > 0) {
        setSelectedColor(data.colors[0]);
      }
      if (data?.sizes && data.sizes.length > 0) {
        setSelectedSize(data.sizes[0]);
      }
      // Check wishlist status for current user
      try {
        const wishData = await getWishlist();
        const items = Array.isArray(wishData) ? wishData : wishData?.items || [];
        const match = items.find((it) => {
          const pId = it.productId?._id || it.productId || it.product?._id || it.product;
          return String(pId) === String(id);
        });
        setWishlistEntryId(match ? match._id || match.id || true : null);
      } catch {
        // Guest or error
      }
      // Load reviews for this product
      try {
        const revData = await getProductReviews(id);
        if (revData) {
          setReviewsData(revData);
        }
      } catch (revErr) {
        console.error('Failed to load reviews:', revErr);
      }
      // Load similar products in the same category
      if (data?.category) {
        setLoadingSimilar(true);
        getPublicProducts({ category: data.category, limit: 6 })
          .then((res) => {
            const list = res.items || res.products || [];
            setSimilarProducts(list.filter((p) => p._id !== id));
          })
          .catch(() => {})
          .finally(() => setLoadingSimilar(false));
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const handleAddToCart = async () => {
    if (!product || isAddingToCart) return;
    setIsAddingToCart(true);
    try {
      await addToCart(product._id, 1);
      if (typeof setCartCount === 'function') {
        setCartCount((prev) => (Number(prev) || 0) + 1);
      }
      if (typeof reloadCart === 'function') {
        reloadCart();
      }
      setIsCartAddedSuccess(true);
      toast.success('Added to cart successfully!');
      setTimeout(() => {
        setIsCartAddedSuccess(false);
      }, 1800);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleWishlist = async () => {
    if (!product) return;
    try {
      if (wishlistEntryId && wishlistEntryId !== true) {
        await removeFromWishlist(wishlistEntryId);
        setWishlistEntryId(null);
        toast.success('Removed from wishlist!');
      } else {
        setShowWishlistPicker(true);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleWishlistCollectionSelect = async (collectionId) => {
    if (!product) return;
    try {
      const res = await addToWishlist(product._id, collectionId);
      setWishlistEntryId(res?._id || res?.data?._id || true);
      setShowWishlistPicker(false);
      toast.success('Added to wishlist!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleBuyNow = () => {
    if (!product) return;
    const discount = product?.discountPercentage !== undefined && product?.discountPercentage !== null ? Number(product.discountPercentage) : 10;
    const originalPrice = Number(product?.price || 0);
    const discountedPrice = Math.round(originalPrice * (1 - discount / 100));

    // Ensure active navbar delivery address is selected for checkout
    const activeNav = localStorage.getItem('selected_delivery_address');
    if (activeNav) {
      sessionStorage.setItem('checkoutAddress', activeNav);
    }

    sessionStorage.setItem(
      'buyNowItem',
      JSON.stringify({
        productId: product._id,
        qty: 1,
        price: discountedPrice,
        originalPrice: originalPrice,
        discountPercentage: discount,
        name: product.name,
        vendorName: product.vendorName || 'Unknown',
        selectedColor: selectedColor !== 'N/A' ? selectedColor : undefined,
        selectedSize: selectedSize !== 'N/A' ? selectedSize : undefined
      })
    );
    navigate('/customer/checkout/address');
  };

  const handleShareProduct = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name || 'Product',
          text: `Check out ${product?.name} on our store!`,
          url: shareUrl
        });
        return;
      } catch (e) {
        if (e.name !== 'AbortError') {
          // ignore error and fallback to clipboard
        }
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Product link copied to clipboard!');
    } catch {
      toast.info(`Share link: ${shareUrl}`);
    }
  };

  const handleToggleCompare = () => {
    if (!product) return;
    if (isCompared) {
      removeFromCompare(product._id);
      setIsCompared(false);
      toast.info(`Removed ${product.name} from comparison`);
    } else {
      try {
        addToCompare(product);
        setIsCompared(true);
        toast.success(`Added ${product.name} to comparison!`);
      } catch (err) {
        toast.warning(err.message || 'Cannot add to comparison');
      }
    }
  };

  const handleNotifyWhenAvailable = async () => {
    if (!product) return;
    try {
      if (!wishlistEntryId) {
        const res = await addToWishlist(product._id);
        setWishlistEntryId(res?._id || res?.data?._id || true);
      }
      toast.success("Alert active! We'll notify you via in-app alert as soon as this item is back in stock.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if ((reviewForm.images?.length || 0) + files.length > 5) {
      toast.error('You can attach a maximum of 5 photos per review.');
      return;
    }
    files.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error('Only images (JPG, PNG, WebP) are supported.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setReviewForm((prev) => ({
          ...prev,
          images: [...(prev.images || []), uploadEvent.target.result]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveReviewPhoto = (index) => {
    setReviewForm((prev) => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index)
    }));
  };

  const handleOpenNewReview = () => {
    setEditingReviewId(null);
    setReviewForm({ rating: 5, title: '', comment: '', images: [] });
    setReviewError('');
    setShowReviewModal(true);
  };

  const handleOpenEditReview = (rev) => {
    setEditingReviewId(rev._id);
    setReviewForm({
      rating: Number(rev.rating) || 5,
      title: rev.title || '',
      comment: rev.comment || '',
      images: Array.isArray(rev.images) ? [...rev.images] : []
    });
    setReviewError('');
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewForm.comment.trim()) {
      setReviewError('Please provide a review comment.');
      return;
    }
    setSubmittingReview(true);
    setReviewError('');
    try {
      let res;
      if (editingReviewId) {
        res = await updateProductReview(id, editingReviewId, reviewForm);
        toast.success('Your review has been updated successfully!');
      } else {
        res = await addProductReview(id, reviewForm);
        toast.success('Thank you! Your review has been submitted.');
      }
      setShowReviewModal(false);
      setEditingReviewId(null);
      setReviewForm({ rating: 5, title: '', comment: '', images: [] });
      // Refresh reviews & product rating
      const revData = await getProductReviews(id);
      setReviewsData(revData || { reviews: [], summary: { total: 0, average: 0, breakdown: {}, counts: {} } });
      if (res?.productRating) {
        setProduct((prev) => ({
          ...prev,
          rating: res.productRating,
          ratingCount: res.productRatingCount
        }));
      }
    } catch (err) {
      setReviewError(getErrorMessage(err));
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!reviewId) return;
    const confirmed = window.confirm("Are you sure you want to delete your review? This action cannot be undone.");
    if (!confirmed) return;

    setDeletingReviewId(reviewId);
    try {
      const res = await deleteProductReview(id, reviewId);
      toast.success("Your review has been deleted successfully.");
      setShowReviewModal(false);
      setEditingReviewId(null);
      setReviewForm({ rating: 5, title: '', comment: '', images: [] });

      const revData = await getProductReviews(id);
      setReviewsData(revData || { reviews: [], summary: { total: 0, average: 0, breakdown: {}, counts: {} } });
      if (res?.productRating !== undefined) {
        setProduct((prev) => ({
          ...prev,
          rating: res.productRating,
          ratingCount: res.productRatingCount
        }));
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeletingReviewId(null);
    }
  };

  if (loading) {
    return (
      <div className='product-details-loading-wrap'>
        <Loader text='Loading product details...' />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className='product-details-error-wrap'>
        <ErrorMessage message={error || 'Product not found'} onRetry={loadProduct} />
        <button
          type='button'
          className='btn btn-secondary'
          onClick={() => navigate('/customer')}
          style={{ marginTop: '16px' }}
        >
          <ArrowLeft size={16} /> Back to Catalog
        </button>
      </div>
    );
  }

  const outOfStock = Number(product.quantity) <= 0;
  const ratingScore = Number(product.rating || 4.3).toFixed(1);
  const totalReviewsCount = reviewsData.summary?.total || product.ratingCount || 28;
  const ratingCounts = reviewsData.summary?.counts || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const ratingBreakdown = reviewsData.summary?.breakdown || { 5: 60, 4: 25, 3: 10, 2: 3, 1: 2 };

  return (
    <div className='product-details-container'>
      {/* Breadcrumb Navigation */}
      <nav className='product-breadcrumbs' aria-label='Breadcrumbs'>
        <Link to='/customer' className='breadcrumb-link'>
          Catalog
        </Link>
        <ChevronRight size={14} className='breadcrumb-sep' />
        <Link
          to={`/customer?category=${encodeURIComponent(product.category || 'Others')}`}
          className='breadcrumb-link'
        >
          {product.category || 'Others'}
        </Link>
        <ChevronRight size={14} className='breadcrumb-sep' />
        <span className='breadcrumb-current'>{product.name}</span>
      </nav>

      {/* ========================================================= */}
      {/* 1. HERO SHOWCASE (Flipkart / Myntra Dual Column Style)    */}
      {/* ========================================================= */}
      <section className='product-details-hero-card' id="product-overview-top">
        {/* Left Column: Visual Showcase & CTAs */}
        <div className='product-visual-column'>
          <div className='product-visual-box'>
            <button
              type='button'
              className="product-detail-compare-btn"
              aria-label="Compare this product"
              onClick={handleToggleCompare}
              title={isCompared ? "Remove from comparison" : "Compare this product side-by-side"}
              style={{
                position: 'absolute',
                top: '12px',
                right: '96px',
                zIndex: 10,
                background: isCompared ? '#2563eb' : '#ffffff',
                border: isCompared ? '1px solid #2563eb' : '1px solid #e2e8f0',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                color: isCompared ? '#ffffff' : '#64748b',
                transition: 'all 0.2s ease'
              }}
            >
              <Scale size={17} />
            </button>
            <button
              type='button'
              className="product-detail-share-btn"
              aria-label="Share this product"
              onClick={handleShareProduct}
              title="Share this product"
              style={{
                position: 'absolute',
                top: '12px',
                right: '54px',
                zIndex: 10,
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                color: '#64748b'
              }}
            >
              <Share2 size={17} />
            </button>
            <button
              type='button'
              className={`product-detail-wishlist-btn ${wishlistEntryId ? 'is-wishlisted active' : ''}`}
              aria-label={wishlistEntryId ? 'Remove from wishlist' : 'Add to wishlist'}
              onClick={handleWishlist}
            >
              <Heart
                size={20}
                fill={wishlistEntryId ? '#ef4444' : 'none'}
                stroke={wishlistEntryId ? '#ef4444' : '#64748b'}
              />
            </button>
            <div className='product-visual-badge-top'>
              <span className='product-detail-category-badge'>{product.category || 'Others'}</span>
              {outOfStock ? (
                <span className='product-detail-stock-badge out'>Out of Stock</span>
              ) : (
                <span className='product-detail-stock-badge in'>In Stock</span>
              )}
            </div>
            
            <div className='product-visual-img-container'>
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className='product-main-showcase-img'
                  onError={(e) => {
                    e.target.style.display = 'none';
                    if (e.target.nextElementSibling) {
                      e.target.nextElementSibling.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <div
                style={{
                  display: product.image ? 'none' : 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  height: '100%',
                  color: '#94a3b8'
                }}
              >
                <Package size={80} strokeWidth={1.2} />
              </div>
            </div>
            
            <span className='product-visual-hint'>Verified Vendor Catalog Item</span>
          </div>

          {/* Action CTAs */}
          <div className='product-visual-actions'>
            {outOfStock ? (
              <button
                type='button'
                className='btn btn-outline product-hero-btn notify-stock-btn'
                onClick={handleNotifyWhenAvailable}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: '#f8fafc',
                  borderColor: '#cbd5e1',
                  color: '#0f172a',
                  fontWeight: 600
                }}
              >
                <Bell size={18} />
                Notify Me When Available
              </button>
            ) : (
              <>
                <button
                  type='button'
                  data-action="add-to-cart"
                  data-testid="add-to-cart"
                  className={`btn btn-primary product-hero-btn add-cart-btn ${isCartAddedSuccess ? "is-added" : ""}`}
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                >
                  {isCartAddedSuccess ? (
                    <>
                      <Check size={18} strokeWidth={3} className="adv-cart-done-check" />
                      Added to Cart!
                    </>
                  ) : isAddingToCart ? (
                    <>
                      <Loader2 size={18} className="spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={18} />
                      Add to Cart
                    </>
                  )}
                </button>
                <button
                  type='button'
                  data-action="buy-now"
                  data-testid="buy-now"
                  className='btn product-hero-btn buy-now-btn'
                  onClick={handleBuyNow}
                >
                  <Zap size={18} />
                  Buy Now
                </button>
              </>
            )}
          </div>

          {/* Advanced Feature Action Buttons */}
          <div className="product-extended-actions" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px', width: '100%' }}>
            {/* 1. View on 3D Avatar & Anywear Live Camera */}
            {(product.clothingType || product.virtualTryOn?.enabled || ['Fashion', 'Clothing', 'Footwear & Shoes', 'Apparel'].includes(product.category) || product.gender) && (
              <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                <button
                  type="button"
                  className="btn btn-outline product-hero-btn"
                  onClick={() => {
                    if (isAnywearAvailable()) {
                      openAnywearTryOn(product);
                    } else {
                      setTryOnInitialMode('camera');
                      setIsTryOnModalOpen(true);
                    }
                  }}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: 'linear-gradient(135deg, #fdf2f8 0%, #eff6ff 100%)',
                    borderColor: '#f472b6',
                    color: '#be185d',
                    fontWeight: 700,
                    padding: '12px 14px',
                    borderRadius: '12px',
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(244, 114, 182, 0.15)'
                  }}
                  title="Try on with live webcam camera via Anywear Decart AI"
                >
                  <Sparkles size={17} />
                  <span>👗 Live Try-On (Anywear AI)</span>
                </button>
                <button
                  type="button"
                  className="btn btn-outline product-hero-btn"
                  onClick={() => {
                    setTryOnInitialMode('avatar');
                    setIsTryOnModalOpen(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    background: '#f8fafc',
                    borderColor: '#cbd5e1',
                    color: '#334155',
                    fontWeight: 600,
                    padding: '12px 14px',
                    borderRadius: '12px',
                    fontSize: '13.5px',
                    cursor: 'pointer'
                  }}
                  title="Open 3D Avatar Customizer & Fitting Room"
                >
                  <span>👤 3D Avatar</span>
                </button>
              </div>
            )}

            {/* 2. Schedule Repeat Delivery (For repeat eligible or groceries) */}
            {(product.isRepeatDeliveryEligible || ['Groceries', 'Dairy', 'Daily Essentials', 'Pantry', 'Personal Care'].includes(product.category) || product.name.toLowerCase().includes('milk') || product.name.toLowerCase().includes('atta')) && (
              <button
                type="button"
                className="btn btn-outline product-hero-btn"
                onClick={() => setIsRepeatModalOpen(true)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'var(--bg-surface, #f0f9ff)',
                  borderColor: '#7dd3fc',
                  color: '#0284c7',
                  fontWeight: 600,
                  padding: '12px 18px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={17} />
                <span>Schedule Repeat Delivery (Save 10%)</span>
              </button>
            )}

            {/* Action Strip: Price History & Shared Cart (Compact 2-Column Grid) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              width: '100%'
            }}>
              {/* 3. Price History Tracker Compact Button */}
              <button
                type="button"
                className="btn btn-outline product-hero-btn"
                onClick={() => setIsPriceModalOpen(true)}
                title="View price trends and set drop alerts"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  background: 'var(--bg-surface, #f8fafc)',
                  borderColor: 'var(--border-color, #cbd5e1)',
                  color: 'var(--text-primary, #0f172a)',
                  fontWeight: 600,
                  padding: '7px 12px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  minHeight: '36px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <TrendingDown size={15} color="#2563eb" />
                <span>Price History</span>
              </button>

              {/* 4. Add to Shared Cart Compact Button */}
              <button
                type="button"
                className="btn btn-outline product-hero-btn"
                onClick={() => setIsSharedCartModalOpen(true)}
                title="Shop together with friends & family"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  background: 'var(--bg-surface, #eff6ff)',
                  borderColor: '#bfdbfe',
                  color: '#2563eb',
                  fontWeight: 600,
                  padding: '7px 12px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  minHeight: '36px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Users size={15} color="#2563eb" />
                <span>Shared Cart</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Specifications, Variants & Policies */}
        <div className='product-info-column'>
          {/* Vendor Tag */}
          <div className='product-detail-vendor-row'>
            <Store size={15} className='product-vendor-icon' />
            <span>Sold by: <strong>{product.vendorName || 'Verified Vendor'}</strong></span>
            <span className='verified-seller-pill'>
              <Check size={11} /> Verified Seller
            </span>
            <button
              type="button"
              className="product-ticket-trigger-link"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('open-customer-tickets', {
                  detail: {
                    productId: product._id,
                    productName: product.name,
                    category: 'product',
                    subject: `Product Inquiry: ${product.name}`
                  }
                }));
              }}
              title="Have a question or issue regarding this product? Raise a support ticket"
              style={{
                marginLeft: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: '#f0fdfa',
                border: '1px solid #99f6e4',
                color: '#0d9488',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Headphones size={13} />
              <span>Ask Support</span>
            </button>
          </div>

          {/* Title */}
          <h1 className='product-detail-title'>{product.name}</h1>

          {/* Ratings Summary Pill */}
          <div className='product-detail-rating-row'>
            <div className='product-rating-pill'>
              <span>{ratingScore}</span>
              <Star size={13} fill='currentColor' />
            </div>
            <span className='product-rating-review-text'>
              {totalReviewsCount} {totalReviewsCount === 1 ? 'Rating' : 'Ratings'} &amp;{' '}
              {reviewsData.reviews?.length || 0} Reviews
            </span>
          </div>

          {/* Price Block (Myntra style) */}
          {(() => {
            const detailDiscount = product?.discountPercentage !== undefined && product?.discountPercentage !== null ? Number(product.discountPercentage) : 10;
            const detailOriginalPrice = Number(product?.price || 0);
            const detailDiscountedPrice = Math.round(detailOriginalPrice * (1 - detailDiscount / 100));

            return (
              <div className='product-detail-price-box'>
                <div className='adv-myntra-price-row detail-pricing'>
                  <span className='adv-selling-price detail-large'>
                    Rs. {detailDiscountedPrice.toLocaleString('en-IN')}
                  </span>
                  <span className='adv-original-price detail-mrp'>
                    Rs. {Math.round(detailOriginalPrice).toLocaleString('en-IN')}
                  </span>
                  <span className='adv-discount-tag detail-tag'>
                    ({detailDiscount}% OFF)
                  </span>
                </div>
                <span className='price-taxes-note'>Inclusive of all taxes</span>
              </div>
            );
          })()}

          {/* Decision Assistant: Why customers choose this */}
          <ProductDecisionAssistant
            product={product}
            customerProfile={profile}
            onAskDarwin={() => {
              window.dispatchEvent(
                new CustomEvent('open-darwin-chat', {
                  detail: {
                    initialMessage: `Can you explain why ${product?.name} is a great choice and compare it against other options?`,
                    productId: product?._id,
                    productName: product?.name
                  }
                })
              );
            }}
          />

          {/* Availability Details */}
          <div className='product-stock-status-row'>
            <span className='stock-status-label'>Availability:</span>
            {outOfStock ? (
              <span className='stock-status-val out'>Currently unavailable</span>
            ) : (
              <span className='stock-status-val in'>
                In Stock ({product.quantity} units remaining)
              </span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div className='product-detail-description-section'>
              <h3>About this item</h3>
              <p>{product.description}</p>
            </div>
          )}

          {/* Variants: Colors (rendered ONLY when applicable) */}
          {product.colors && product.colors.length > 0 && product.colors.some(c => c && c !== 'N/A' && c !== 'Standard') && (
            <div className='product-variant-group'>
              <label className='variant-label'>
                Color / Finish: <strong>{selectedColor || product.colors.find(c => c && c !== 'N/A' && c !== 'Standard')}</strong>
              </label>
              <div className='variant-chips-list'>
                {product.colors.filter(c => c && c !== 'N/A' && c !== 'Standard').map((col) => (
                  <button
                    key={col}
                    type='button'
                    className={`variant-chip ${selectedColor === col ? 'selected' : ''}`}
                    onClick={() => setSelectedColor(col)}
                  >
                    {selectedColor === col && <Check size={13} />} {col}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Variants: Sizes (rendered ONLY when applicable) */}
          {product.sizes && product.sizes.length > 0 && product.sizes.some(s => s && s !== 'N/A' && s !== 'Standard') && (
            <div className='product-variant-group'>
              <label className='variant-label'>
                Size / Configuration: <strong>{selectedSize || product.sizes.find(s => s && s !== 'N/A' && s !== 'Standard')}</strong>
              </label>
              <div className='variant-chips-list'>
                {product.sizes.filter(s => s && s !== 'N/A' && s !== 'Standard').map((sz) => (
                  <button
                    key={sz}
                    type='button'
                    className={`variant-chip ${selectedSize === sz ? 'selected' : ''}`}
                    onClick={() => setSelectedSize(sz)}
                  >
                    {selectedSize === sz && <Check size={13} />} {sz}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* DELIVERY & SERVICES PINCODE ESTIMATOR (Amazon / Flipkart / Myntra style) */}
          <div className="product-pincode-delivery-card">
            <div className="pincode-delivery-header">
              <div className="pincode-delivery-title">
                <Truck size={17} className="pincode-truck-icon" />
                <span>Delivery &amp; Services</span>
              </div>
              {deliveryEstimate?.city && (
                <span className="pincode-city-badge">
                  <MapPin size={11} /> {deliveryEstimate.city}
                </span>
              )}
            </div>

            <form className="pincode-input-wrap" onSubmit={handlePincodeSubmit}>
              <input
                type="text"
                className="pincode-text-input"
                placeholder="Enter 6-digit Pincode"
                maxLength={6}
                value={pincodeInput}
                disabled={isPincodeChecked}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setPincodeInput(val);
                  if (pincodeError) setPincodeError('');
                }}
              />
              <button
                type="submit"
                className="pincode-check-btn"
                disabled={checkingPincode || (!isPincodeChecked && pincodeInput.trim().length !== 6)}
              >
                {checkingPincode ? 'Checking...' : isPincodeChecked ? 'Change' : 'Check'}
              </button>
            </form>

            {pincodeError && (
              <div className="pincode-error-msg">{pincodeError}</div>
            )}

            {/* ESTIMATED DELIVERY RESULTS */}
            {deliveryEstimate && (
              <div className="pincode-delivery-results">
                <div className="pincode-eta-row">
                  <div className={`pincode-eta-icon-wrap ${deliveryEstimate.isExpress ? 'express' : ''}`}>
                    {deliveryEstimate.isExpress ? (
                      <Zap size={15} />
                    ) : (
                      <Package size={15} />
                    )}
                  </div>
                  <div className="pincode-eta-text">
                    <span className={`pincode-eta-headline ${deliveryEstimate.isExpress ? 'express' : ''}`}>
                      {deliveryEstimate.isExpress ? '⚡ Express Delivery' : '📦 Standard Delivery'}:{' '}
                      <strong>{deliveryEstimate.deliveryDate}</strong>
                    </span>
                    <span className="pincode-eta-sub">
                      {deliveryEstimate.deliveryWindow}
                    </span>
                  </div>
                </div>

                <div className="pincode-perks-list">
                  <div className="pincode-perk-item">
                    <Check size={13} className="perk-check-icon" />
                    <span>Free Delivery on this item</span>
                  </div>
                  <div className="pincode-perk-item">
                    <Check size={13} className="perk-check-icon" />
                    <span>Cash on Delivery available</span>
                  </div>
                  {deliveryEstimate.hubName && (
                    <div className="pincode-perk-item">
                      <Store size={13} className="perk-check-icon" />
                      <span>Fulfilled from <strong>{deliveryEstimate.hubName}</strong></span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Highlights & Quick Specs (Flipkart Style) */}
          {product.specifications && (
            <div className="product-highlights-quick-card" style={{
              background: 'var(--bg-surface, #f8fafc)',
              border: '1px solid var(--border-color, #e2e8f0)',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-main, #0f172a)' }}>
                  Product Highlights
                </h3>
                <button
                  type="button"
                  onClick={() => setIsSpecsSidepanelOpen(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>More Specifications</span>
                  <span>&rarr;</span>
                </button>
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-secondary, #475569)', fontSize: '13.5px', lineHeight: '1.7' }}>
                {Object.entries(
                  typeof product.specifications === 'string'
                    ? (JSON.parse(product.specifications || '{}'))
                    : (product.specifications instanceof Map ? Object.fromEntries(product.specifications) : (product.specifications || {}))
                ).slice(0, 5).map(([k, v], i) => (
                  <li key={i}>
                    <strong style={{ color: 'var(--text-main, #0f172a)' }}>{k}:</strong>{' '}
                    {typeof v === 'object' ? Object.entries(v).slice(0, 2).map(([sk, sv]) => `${sk}: ${sv}`).join(', ') : String(v)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Trust & Policy Highlights */}
          <div className='product-assurance-grid'>
            <div className='assurance-card'>
              <RotateCcw size={20} className='assurance-icon' />
              <div>
                <strong>Return Policy</strong>
                <p>{product.returnPolicy || '7 Days Return & Exchange'}</p>
              </div>
            </div>
            <div className='assurance-card'>
              <ShieldCheck size={20} className='assurance-icon' />
              <div>
                <strong>Warranty</strong>
                <p>{product.warranty || '1 Year Manufacturer Warranty'}</p>
              </div>
            </div>
            <div className='assurance-card'>
              <Truck size={20} className='assurance-icon' />
              <div>
                <strong>Fast Delivery</strong>
                <p>Free standard dispatch across India</p>
              </div>
            </div>
            <div className='assurance-card'>
              <CreditCard size={20} className='assurance-icon' />
              <div>
                <strong>Secure Payment</strong>
                <p>Cards, UPI &amp; Cash on Delivery</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION NAVIGATION TABS (Flipkart & Amazon Reference Bar) */}
      {/* ========================================================= */}
      <nav className="product-details-nav-tabs-bar" aria-label="Product Sections Navigation">
        <button
          type="button"
          className={`pd-nav-tab-btn ${activeDetailsTab === 'overview' ? 'active' : ''}`}
          onClick={() => handleDetailsTabClick('overview')}
        >
          Overview
        </button>

        {product?.specifications && (
          <button
            type="button"
            className={`pd-nav-tab-btn ${activeDetailsTab === 'specifications' ? 'active' : ''}`}
            onClick={() => handleDetailsTabClick('specifications')}
          >
            Specifications
          </button>
        )}

        <button
          type="button"
          className={`pd-nav-tab-btn ${activeDetailsTab === 'reviews' ? 'active' : ''}`}
          onClick={() => handleDetailsTabClick('reviews')}
        >
          Reviews ({totalReviewsCount > 1000 ? `${(totalReviewsCount / 1000).toFixed(1)}K` : totalReviewsCount})
        </button>

        <button
          type="button"
          className={`pd-nav-tab-btn ${activeDetailsTab === 'qa' ? 'active' : ''}`}
          onClick={() => handleDetailsTabClick('qa')}
        >
          Questions &amp; Answers
        </button>

        <button
          type="button"
          className={`pd-nav-tab-btn ${activeDetailsTab === 'price' ? 'active' : ''}`}
          onClick={() => handleDetailsTabClick('price')}
        >
          Price History
        </button>

        <button
          type="button"
          className={`pd-nav-tab-btn ${activeDetailsTab === 'similar' ? 'active' : ''}`}
          onClick={() => handleDetailsTabClick('similar')}
        >
          Similar Products
        </button>
      </nav>

      {/* ========================================================= */}
      {/* TAB CONTENT PANES (Content displays directly below tabs)  */}
      {/* ========================================================= */}
      <div className="product-details-tabs-content">
        {/* OVERVIEW PANE */}
        {activeDetailsTab === 'overview' && (
          <div className="pd-tab-pane">
            <FrequentlyBoughtTogether
              productId={product._id}
              onCartUpdated={() => {
                if (reloadCart) reloadCart();
                if (setCartCount) getCart().then((c) => setCartCount(c?.items?.length || 0));
              }}
            />

            <BecauseYouViewedRail
              product={product}
              onCartUpdated={() => {
                if (reloadCart) reloadCart();
                if (setCartCount) getCart().then((c) => setCartCount(c?.items?.length || 0));
              }}
            />

            <CompleteTheLookRail
              product={product}
              onTryOn={() => setIsTryOnModalOpen(true)}
              onCartUpdated={() => {
                if (reloadCart) reloadCart();
                if (setCartCount) getCart().then((c) => setCartCount(c?.items?.length || 0));
              }}
            />
          </div>
        )}

        {/* TECHNICAL SPECIFICATIONS PANE */}
        {activeDetailsTab === 'specifications' && (
          <div className="pd-tab-pane">
            {product?.specifications ? (
              <div id="product-specs-section">
                <ProductSpecificationsAccordion
                  specifications={product.specifications}
                  category={product.category}
                  brand={product.brand}
                  productName={product.name}
                  onOpenSidepanel={() => setIsSpecsSidepanelOpen(true)}
                />
              </div>
            ) : (
              <div className="pd-tab-empty-state">
                <Info size={36} color="#94a3b8" />
                <h3>No Detailed Specifications Available</h3>
                <p>Standard manufacturer specifications and warranty apply to this product.</p>
              </div>
            )}
          </div>
        )}

        {/* RATINGS & REVIEWS PANE */}
        {activeDetailsTab === 'reviews' && (
          <div className="pd-tab-pane">
            <section className='product-reviews-container' id="product-reviews-section">
        <div className='reviews-header-bar'>
          <div>
            <h2>Ratings &amp; Customer Reviews</h2>
            <p>Verified feedback from authenticated buyers</p>
          </div>
          {(() => {
            const myExistingReview = (reviewsData.reviews || []).find(isMyReview);
            if (myExistingReview) {
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type='button'
                    className='btn btn-primary add-review-modal-trigger'
                    onClick={() => handleOpenEditReview(myExistingReview)}
                    title="Edit your submitted review"
                  >
                    <Pencil size={15} /> Edit Your Review
                  </button>
                  <button
                    type='button'
                    className='btn-delete-review-danger'
                    onClick={() => handleDeleteReview(myExistingReview._id)}
                    disabled={deletingReviewId === myExistingReview._id}
                    title="Delete your submitted review"
                  >
                    {deletingReviewId === myExistingReview._id ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
                    <span>Delete Review</span>
                  </button>
                </div>
              );
            }
            return (
              <button
                type='button'
                className='btn btn-primary add-review-modal-trigger'
                onClick={handleOpenNewReview}
              >
                <MessageSquarePlus size={16} /> Rate &amp; Write a Review
              </button>
            );
          })()}
        </div>

        <div className='reviews-layout-grid'>
          {/* Overall Rating Score Card */}
          <div className='overall-rating-card'>
            <div className='overall-rating-big'>
              <span className='score'>{ratingScore}</span>
              <div className='stars-row'>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={20}
                    fill={s <= Math.round(Number(ratingScore)) ? '#f59e0b' : 'none'}
                    color='#f59e0b'
                  />
                ))}
              </div>
              <span className='sub'>
                {totalReviewsCount} Ratings &amp; {reviewsData.reviews?.length || 0} Reviews
              </span>
            </div>

            {/* Star Breakdown Progress Bars */}
            <div className='rating-breakdown-bars'>
              {[5, 4, 3, 2, 1].map((star) => {
                const pct = ratingBreakdown[star] ?? 0;
                return (
                  <div className='breakdown-row' key={star}>
                    <span className='star-num'>{star} ★</span>
                    <div className='bar-track'>
                      <div
                        className={`bar-fill star-${star}`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                    <span className='star-count'>{ratingCounts[star] || 0}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Customer Reviews Feed */}
          <div className='customer-reviews-feed'>
            {reviewsData.reviews && reviewsData.reviews.length > 0 ? (
              reviewsData.reviews.map((rev) => (
                <div className='customer-review-card' key={rev._id}>
                  <div className='review-card-header'>
                    <div className='review-author-info'>
                      <span className='author-name'>{rev.customerName || 'Verified Buyer'}</span>
                      <span className='verified-badge'>
                        <Check size={11} /> Verified Purchase
                      </span>
                      {isMyReview(rev) && (
                        <span className='my-review-badge'>Your Review</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isMyReview(rev) && (
                        <>
                          <button
                            type='button'
                            className='btn-edit-my-review'
                            onClick={() => handleOpenEditReview(rev)}
                            title="Edit this review"
                          >
                            <Pencil size={12} />
                            <span>Edit</span>
                          </button>
                          <button
                            type='button'
                            className='btn-delete-my-review'
                            onClick={() => handleDeleteReview(rev._id)}
                            disabled={deletingReviewId === rev._id}
                            title="Delete this review"
                          >
                            {deletingReviewId === rev._id ? <Loader2 size={12} className="spin" /> : <Trash2 size={12} />}
                            <span>Delete</span>
                          </button>
                        </>
                      )}
                      <span className='review-date'>
                        {rev.createdAt ? formatDate(rev.createdAt) : 'Recent'}
                      </span>
                    </div>
                  </div>

                  <div className='review-rating-row'>
                    <div className='review-stars'>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={14}
                          fill={s <= rev.rating ? '#f59e0b' : 'none'}
                          color='#f59e0b'
                        />
                      ))}
                    </div>
                    {rev.title && <h4 className='review-title'>{rev.title}</h4>}
                  </div>

                  <p className='review-comment-text'>{rev.comment}</p>
                  {rev.images && rev.images.length > 0 && (
                    <div className='review-photos-grid' style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                      {rev.images.map((imgUrl, imgIdx) => (
                        <div
                          key={imgIdx}
                          onClick={() => setActiveReviewPhoto(imgUrl)}
                          style={{ width: '64px', height: '64px', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                          title="Click to zoom photo"
                        >
                          <img src={imgUrl} alt="Review attachment" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className='no-reviews-box'>
                <Star size={32} color='#94a3b8' />
                <h3>No Customer Reviews Yet</h3>
                <p>Be the first customer to share your experience with this product!</p>
                <button
                  type='button'
                  className='btn btn-outline'
                  onClick={handleOpenNewReview}
                  style={{ marginTop: '8px' }}
                >
                  Write the First Review
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
          </div>
        )}

        {/* ========================================================= */}
        {/* QUESTIONS & ANSWERS PANE                                  */}
        {/* ========================================================= */}
        {activeDetailsTab === 'qa' && (
          <div className="pd-tab-pane">
            <ProductQASection
              product={product}
              profile={profile}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* PRICE HISTORY PANE                                        */}
        {/* ========================================================= */}
        {activeDetailsTab === 'price' && (
          <div className="pd-tab-pane">
            <ProductPriceHistoryTab
              product={product}
              onOpenModal={() => setIsPriceModalOpen(true)}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* SIMILAR PRODUCTS PANE                                     */}
        {/* ========================================================= */}
        {activeDetailsTab === 'similar' && (
          <div className="pd-tab-pane">
            {similarProducts.length > 0 ? (
              <section className='similar-products-section' id="product-similar-section">
                <div className='similar-section-header'>
                  <div>
                    <h2>Similar Products in {product.category || 'this category'}</h2>
                    <p>Explore related options without leaving this page</p>
                  </div>
                  <Link
                    to={`/customer?category=${encodeURIComponent(product.category || 'Others')}`}
                    className='view-all-category-link'
                  >
                    View all {product.category} <ChevronRight size={14} />
                  </Link>
                </div>

                <div className='similar-products-scroll-grid'>
                  {similarProducts.map((simProd) => {
                    const isSimOutOfStock = Number(simProd.quantity) <= 0;
                    return (
                      <div
                        key={simProd._id}
                        className='similar-product-card'
                        onClick={() => navigate(`/customer/products/${simProd._id}`)}
                        role='button'
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') navigate(`/customer/products/${simProd._id}`);
                        }}
                      >
                        <div className='similar-card-icon-box'>
                          {(simProd.image || simProd.images?.[0]) ? (
                            <img
                              src={simProd.image || simProd.images[0]}
                              alt={simProd.name}
                              className='similar-card-img'
                              onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextElementSibling) {
                                  e.target.nextElementSibling.style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          <div
                            style={{
                              display: (simProd.image || simProd.images?.[0]) ? 'none' : 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '100%',
                              height: '100%'
                            }}
                          >
                            <Package size={36} color='#64748b' />
                          </div>
                          {isSimOutOfStock && (
                            <span className='similar-out-badge'>Out of stock</span>
                          )}
                        </div>
                        <div className='similar-card-body'>
                          <span className='similar-category-tag'>{simProd.category || 'Others'}</span>
                          <h4 className='similar-prod-title' title={simProd.name}>
                            {simProd.name}
                          </h4>
                          <span className='similar-vendor-name'>{simProd.vendorName || 'Vendor'}</span>
                          {(() => {
                            const simDisc = simProd.discountPercentage !== undefined && simProd.discountPercentage !== null ? Number(simProd.discountPercentage) : 10;
                            const simOrig = Number(simProd.price || 0);
                            const simFinal = Math.round(simOrig * (1 - simDisc / 100));

                            return (
                              <div className='similar-price-rating-row'>
                                <div className='adv-myntra-price-row compact'>
                                  <span className='adv-selling-price'>Rs. {simFinal.toLocaleString('en-IN')}</span>
                                  <span className='adv-original-price'>Rs. {Math.round(simOrig).toLocaleString('en-IN')}</span>
                                  <span className='adv-discount-tag'>({simDisc}% OFF)</span>
                                </div>
                                <div className='similar-rating-pill'>
                                  <span>{Number(simProd.rating || 4.3).toFixed(1)}</span>
                                  <Star size={11} fill='currentColor' />
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : (
              <div className="pd-tab-empty-state">
                <Package size={36} color="#94a3b8" />
                <h3>No Similar Products Found</h3>
                <p>Explore related products and categories from our main catalog.</p>
                <Link to="/customer" className="btn btn-secondary" style={{ marginTop: '12px', display: 'inline-flex' }}>
                  Explore Catalog
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Review Submission & Edit Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setEditingReviewId(null);
        }}
        title={editingReviewId ? "Edit Your Product Review" : "Write a Product Review"}
        size="medium"
      >
        <form onSubmit={handleReviewSubmit} className="modal-form review-submission-form">
          {reviewError && <div className="error-box">{reviewError}</div>}

          {/* Star Rating Picker */}
          <div className="form-group">
            <label>Overall Rating</label>
            <div className="interactive-star-picker">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="star-pick-btn"
                  onMouseEnter={() => setReviewHoverRating(star)}
                  onMouseLeave={() => setReviewHoverRating(0)}
                  onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                >
                  <Star
                    size={28}
                    fill={
                      (reviewHoverRating || reviewForm.rating) >= star
                        ? "#f59e0b"
                        : "none"
                    }
                    color="#f59e0b"
                  />
                </button>
              ))}
              <span className="rating-label-text">
                {reviewHoverRating === 5 || (!reviewHoverRating && reviewForm.rating === 5)
                  ? "5 - Excellent"
                  : reviewHoverRating === 4 || (!reviewHoverRating && reviewForm.rating === 4)
                  ? "4 - Very Good"
                  : reviewHoverRating === 3 || (!reviewHoverRating && reviewForm.rating === 3)
                  ? "3 - Good"
                  : reviewHoverRating === 2 || (!reviewHoverRating && reviewForm.rating === 2)
                  ? "2 - Fair"
                  : "1 - Poor"}
              </span>
            </div>
          </div>

          {/* AI Writing Assistant Banner Toolbar */}
          <div className="ai-write-toolbar">
            <div className="ai-write-toolbar-left">
              <Sparkles size={15} />
              <span>AI Writing Assistant</span>
            </div>
            <div className="ai-write-toolbar-right">
              <AiWriteButton
                task="review_full"
                input={reviewForm.title ? `${reviewForm.title}. ${reviewForm.comment}` : reviewForm.comment}
                context={{ rating: reviewForm.rating, productName: product?.name || 'Product' }}
                onGenerated={(res) => {
                  setReviewForm((prev) => ({
                    ...prev,
                    title: res.headline || prev.title,
                    comment: res.review || prev.comment
                  }));
                }}
                label="✨ Generate Headline & Review"
                size="small"
                title="Automatically generate headline and review from your rating and notes"
              />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ margin: 0 }}>Review Headline (Optional)</label>
              <AiWriteButton
                task="review_headline"
                input={reviewForm.title || reviewForm.comment}
                context={{ rating: reviewForm.rating, productName: product?.name || 'Product' }}
                onGenerated={(res) => {
                  const val = res.headline || res.text || res.result;
                  if (val) setReviewForm((prev) => ({ ...prev, title: val }));
                }}
                label="Polish Headline"
                size="small"
              />
            </div>
            <input
              type="text"
              value={reviewForm.title}
              onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
              placeholder="e.g. Exceptional quality and fast delivery"
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ margin: 0 }}>Detailed Review <span style={{ color: "#ef4444" }}>*</span></label>
              <AiWriteButton
                task="review_body"
                input={reviewForm.comment || reviewForm.title}
                context={{ rating: reviewForm.rating, productName: product?.name || 'Product' }}
                onGenerated={(res) => {
                  const val = res.review || res.text || res.result;
                  if (val) setReviewForm((prev) => ({ ...prev, comment: val }));
                }}
                label="Expand &amp; Polish"
                size="small"
              />
            </div>
            <textarea
              rows={4}
              required
              value={reviewForm.comment}
              onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              placeholder="What did you like or dislike? How does it perform?"
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Attach Photos (Optional, max 5)</span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>{(reviewForm.images || []).length}/5 photos</span>
            </label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginTop: '6px' }}>
              {(reviewForm.images || []).map((img, idx) => (
                <div key={idx} style={{ position: 'relative', width: '56px', height: '56px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                  <img src={img} alt="Upload preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={() => handleRemoveReviewPhoto(idx)}
                    style={{ position: 'absolute', top: 2, right: 2, width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
              {(reviewForm.images || []).length < 5 && (
                <label style={{ width: '56px', height: '56px', borderRadius: '6px', border: '1px dashed #94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', fontSize: '10px', gap: '2px', background: '#f8fafc' }}>
                  <Camera size={18} />
                  <span>Add</span>
                  <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{ display: 'none' }} />
                </label>
              )}
            </div>
          </div>

          <div className="modal-actions" style={{ display: 'flex', justifyContent: editingReviewId ? 'space-between' : 'flex-end', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
            {editingReviewId && (
              <button
                type="button"
                className="btn-delete-review-danger"
                onClick={() => handleDeleteReview(editingReviewId)}
                disabled={submittingReview || deletingReviewId === editingReviewId}
                title="Delete this review permanently"
              >
                {deletingReviewId === editingReviewId ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
                <span>Delete Review</span>
              </button>
            )}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowReviewModal(false);
                  setEditingReviewId(null);
                }}
                disabled={submittingReview || Boolean(deletingReviewId)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submittingReview || Boolean(deletingReviewId)}
              >
                {submittingReview
                  ? editingReviewId
                    ? "Updating..."
                    : "Submitting..."
                  : editingReviewId
                  ? "Update Review"
                  : "Submit Review"}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Review Photo Zoom Modal */}
      {activeReviewPhoto && (
        <Modal
          isOpen={Boolean(activeReviewPhoto)}
          onClose={() => setActiveReviewPhoto(null)}
          title="Customer Review Photo"
          size="medium"
        >
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px', maxHeight: '70vh' }}>
            <img src={activeReviewPhoto} alt="Review zoom" style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: '8px' }} />
          </div>
        </Modal>
      )}

      <WishlistCollectionPicker
        isOpen={showWishlistPicker}
        onClose={() => setShowWishlistPicker(false)}
        onSelect={handleWishlistCollectionSelect}
      />


      {/* Price History Modal */}
      {isPriceModalOpen && (
        <PriceHistoryModal
          isOpen={isPriceModalOpen}
          product={product}
          onClose={() => setIsPriceModalOpen(false)}
        />
      )}

      {/* Repeat Delivery Subscription Modal */}
      {isRepeatModalOpen && (
        <AddRepeatDeliveryModal
          isOpen={isRepeatModalOpen}
          product={product}
          onClose={() => setIsRepeatModalOpen(false)}
          onSuccess={() => {
            toast.success("Scheduled Repeat Delivery created successfully!");
          }}
        />
      )}

      {/* 3D Virtual Try-On Modal */}
      {isTryOnModalOpen && (
        <TryOnModal
          isOpen={isTryOnModalOpen}
          product={product}
          initialMode={tryOnInitialMode}
          onClose={() => setIsTryOnModalOpen(false)}
          onAddToCart={() => {
            handleAddToCart();
          }}
        />
      )}

      {/* Product Specifications Sidepanel */}
      <ProductSpecificationsSidepanel
        isOpen={isSpecsSidepanelOpen}
        onClose={() => setIsSpecsSidepanelOpen(false)}
        product={product}
      />

      {/* Add To Shared Group Cart Modal */}
      {isSharedCartModalOpen && (
        <AddToSharedCartModal
          isOpen={isSharedCartModalOpen}
          onClose={() => setIsSharedCartModalOpen(false)}
          product={product}
        />
      )}
    </div>
  );
}

export default ProductDetails;
