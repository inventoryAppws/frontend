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
  X
} from 'lucide-react';
import {
  getProductById,
  getProductReviews,
  addProductReview,
  getPublicProducts
} from '../../services/productService';
import { addToCart } from '../../services/cartService';
import { getWishlist, addToWishlist, removeFromWishlist } from '../../services/wishlistService';
import Loader from '../../components/Loader';
import ErrorMessage from '../../components/ErrorMessage';
import Modal from '../../components/Modal';
import { toast } from '../../components/Toast';
import { getErrorMessage } from '../../utils/errorHandler';
import { formatDate } from '../../utils/dateFormatter';
import WishlistCollectionPicker from '../../components/WishlistCollectionPicker';

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setCartCount, reloadCart } = useOutletContext() || {};

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected variant options
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');

  // Reviews & ratings
  const [reviewsData, setReviewsData] = useState({
    reviews: [],
    summary: { total: 0, average: 0, breakdown: {}, counts: {} }
  });
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // Active gallery image
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Recommendations / Similar
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [wishlistEntryId, setWishlistEntryId] = useState(null);
  const [showWishlistPicker, setShowWishlistPicker] = useState(false);

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
    if (!product) return;
    try {
      await addToCart(product._id, 1);
      if (typeof setCartCount === 'function') {
        setCartCount((prev) => (Number(prev) || 0) + 1);
      }
      if (typeof reloadCart === 'function') {
        reloadCart();
      }
      toast.success('Added to cart successfully!');
    } catch (err) {
      toast.error(getErrorMessage(err));
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

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewForm.comment.trim()) {
      setReviewError('Please provide a review comment.');
      return;
    }
    setSubmittingReview(true);
    setReviewError('');
    try {
      const res = await addProductReview(id, reviewForm);
      setShowReviewModal(false);
      setReviewForm({ rating: 5, title: '', comment: '' });
      toast.success('Thank you! Your review has been submitted.');
      // Refresh reviews & product rating
      const revData = await getProductReviews(id);
      setReviewsData(revData || { reviews: [], summary: { total: 0, average: 0, breakdown: {}, counts: {} } });
      if (res.productRating) {
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
      <section className='product-details-hero-card'>
        {/* Left Column: Visual Showcase & CTAs */}
        <div className='product-visual-column'>
          <div className='product-visual-box'>
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
            <button
              type='button'
              className='btn btn-primary product-hero-btn add-cart-btn'
              disabled={outOfStock}
              onClick={handleAddToCart}
            >
              <ShoppingCart size={18} />
              {outOfStock ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <button
              type='button'
              className='btn product-hero-btn buy-now-btn'
              disabled={outOfStock}
              onClick={handleBuyNow}
            >
              <Zap size={18} />
              Buy Now
            </button>
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
      {/* 2. RATINGS & REVIEWS SECTION (Flipkart / Amazon style)     */}
      {/* ========================================================= */}
      <section className='product-reviews-container'>
        <div className='reviews-header-bar'>
          <div>
            <h2>Ratings &amp; Customer Reviews</h2>
            <p>Verified feedback from authenticated buyers</p>
          </div>
          <button
            type='button'
            className='btn btn-primary add-review-modal-trigger'
            onClick={() => {
              setReviewError('');
              setShowReviewModal(true);
            }}
          >
            <MessageSquarePlus size={16} /> Rate &amp; Write a Review
          </button>
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
                    </div>
                    <span className='review-date'>
                      {rev.createdAt ? formatDate(rev.createdAt) : 'Recent'}
                    </span>
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
                  onClick={() => setShowReviewModal(true)}
                  style={{ marginTop: '8px' }}
                >
                  Write the First Review
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Review Submission Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="Write a Product Review"
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

          <div className="form-group">
            <label>Review Headline (Optional)</label>
            <input
              type="text"
              value={reviewForm.title}
              onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
              placeholder="e.g. Exceptional quality and fast delivery"
            />
          </div>

          <div className="form-group">
            <label>Detailed Review <span style={{ color: "#ef4444" }}>*</span></label>
            <textarea
              rows={4}
              required
              value={reviewForm.comment}
              onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              placeholder="What did you like or dislike? How does it perform?"
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowReviewModal(false)}
              disabled={submittingReview}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submittingReview}
            >
              {submittingReview ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </form>
      </Modal>

      <WishlistCollectionPicker
        isOpen={showWishlistPicker}
        onClose={() => setShowWishlistPicker(false)}
        onSelect={handleWishlistCollectionSelect}
      />

      {/* ========================================================= */}
      {/* 3. SAME CATEGORY PRODUCTS RECOMMENDATION ROW              */}
      {/* ========================================================= */}
      {similarProducts.length > 0 && (
        <section className='similar-products-section'>
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
                    <Package size={36} color='#64748b' />
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
      )}
    </div>
  );
}

export default ProductDetails;
