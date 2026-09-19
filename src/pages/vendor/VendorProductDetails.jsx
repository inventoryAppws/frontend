import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  Star,
  Pencil,
  Trash2,
  Plus,
  Minus,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  IndianRupee,
  Layers,
  Tag,
  Eye,
  Image as ImageIcon,
  Camera,
  Calendar,
  Check,
  X,
  History,
  Boxes,
  SlidersHorizontal,
  Sparkles
} from 'lucide-react';
import {
  getProductById,
  getProductReviews,
  adjustProductStock,
  updateProduct,
  deleteProduct,
  getProductHistory
} from '../../services/productService';
import Loader from '../../components/Loader';
import ErrorMessage from '../../components/ErrorMessage';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';
import { toast } from '../../components/Toast';
import { formatDate } from '../../utils/dateFormatter';
import CustomSelect from '../../components/CustomSelect';
import AiWriteButton from '../../components/AiWriteButton';

const CATEGORY_OPTIONS = [
  { value: 'Electronics', label: 'Electronics' },
  { value: 'Fashion', label: 'Fashion' },
  { value: 'shoes', label: 'Shoes & Footwear' },
  { value: 'Appliances', label: 'Appliances' },
  { value: 'Kitchen', label: 'Kitchen & Dining' },
  { value: 'Home & Furniture', label: 'Home & Furniture' },
  { value: 'Beauty & Care', label: 'Beauty & Care' },
  { value: 'Sports & Fitness', label: 'Sports & Fitness' },
  { value: 'Gaming', label: 'Gaming' },
  { value: 'Food & Beverages', label: 'Food & Beverages' },
  { value: 'General', label: 'General' },
  { value: 'Others', label: 'Others' }
];

export default function VendorProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Reviews state
  const [reviewsData, setReviewsData] = useState({
    reviews: [],
    summary: { total: 0, average: 0, counts: {}, breakdown: {} }
  });
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewFilter, setReviewFilter] = useState('all'); // 'all', '5', '4', '3', '2', '1', 'photos'
  const [activePhotoModal, setActivePhotoModal] = useState(null);

  // Gallery active image
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Stock history state
  const [stockHistory, setStockHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Modals state
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    category: '',
    price: '',
    discountPercentage: '',
    quantity: '',
    description: '',
    image: '',
    colors: '',
    sizes: '',
    returnPolicy: '',
    warranty: ''
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Quick Stock adjustment form
  const [stockAdjustment, setStockAdjustment] = useState({
    type: 'add', // 'add', 'deduct', 'set'
    amount: 10,
    reason: 'Stock replenishment'
  });
  const [adjustingStock, setAdjustingStock] = useState(false);

  // Fetch product and reviews
  const loadProductData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const prod = await getProductById(id);
      if (!prod) throw new Error('Product not found');
      setProduct(prod);
      setEditForm({
        name: prod.name || '',
        category: prod.category || 'General',
        price: prod.price || '',
        discountPercentage: prod.discountPercentage || 0,
        quantity: prod.quantity || 0,
        description: prod.description || '',
        image: prod.image || (Array.isArray(prod.images) ? prod.images[0] : '') || '',
        colors: Array.isArray(prod.colors) ? prod.colors.join(', ') : '',
        sizes: Array.isArray(prod.sizes) ? prod.sizes.join(', ') : '',
        returnPolicy: prod.returnPolicy || '7 Days Return & Exchange',
        warranty: prod.warranty || '1 Year Manufacturer Warranty'
      });
    } catch (err) {
      console.error('Failed to load product details:', err);
      setError(err.message || 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadReviews = useCallback(async () => {
    if (!id) return;
    setReviewsLoading(true);
    try {
      const res = await getProductReviews(id);
      setReviewsData({
        reviews: res?.reviews || [],
        summary: res?.summary || { total: 0, average: 0, counts: {}, breakdown: {} }
      });
    } catch (err) {
      console.warn('Failed to load reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  }, [id]);

  const loadStockLogs = useCallback(async () => {
    if (!id) return;
    setLoadingHistory(true);
    try {
      const logs = await getProductHistory(id);
      setStockHistory(Array.isArray(logs) ? logs : logs?.items || []);
    } catch (err) {
      console.warn('Failed to load stock history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, [id]);

  useEffect(() => {
    loadProductData();
    loadReviews();
    loadStockLogs();
  }, [loadProductData, loadReviews, loadStockLogs]);

  // Handle Save Product Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const payload = {
        name: editForm.name.trim(),
        category: editForm.category,
        price: Number(editForm.price),
        discountPercentage: Number(editForm.discountPercentage || 0),
        quantity: Number(editForm.quantity),
        description: editForm.description.trim(),
        image: editForm.image.trim(),
        colors: editForm.colors.split(',').map((c) => c.trim()).filter(Boolean),
        sizes: editForm.sizes.split(',').map((s) => s.trim()).filter(Boolean),
        returnPolicy: editForm.returnPolicy,
        warranty: editForm.warranty
      };
      const updated = await updateProduct(product._id, payload);
      toast.success('Product updated successfully!');
      setProduct((prev) => ({ ...prev, ...updated }));
      setShowEditModal(false);
    } catch (err) {
      toast.error('Failed to update product: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  // Handle Stock Adjust
  const handleStockAdjust = async (e) => {
    e.preventDefault();
    setAdjustingStock(true);
    try {
      let finalChange = Number(stockAdjustment.amount);
      if (stockAdjustment.type === 'deduct') {
        finalChange = -Math.abs(finalChange);
      } else if (stockAdjustment.type === 'set') {
        finalChange = finalChange - Number(product.quantity);
      }

      const res = await adjustProductStock(product._id, finalChange, stockAdjustment.reason);
      toast.success('Stock adjusted successfully!');
      setProduct((prev) => ({ ...prev, quantity: res.quantity ?? (prev.quantity + finalChange) }));
      setShowStockModal(false);
      loadStockLogs();
    } catch (err) {
      toast.error('Failed to adjust stock: ' + err.message);
    } finally {
      setAdjustingStock(false);
    }
  };

  // Handle Delete
  const handleDeleteProduct = async () => {
    try {
      await deleteProduct(product._id);
      toast.success('Product removed from your catalog');
      navigate('/vendor/products');
    } catch (err) {
      toast.error('Failed to delete product: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="vendor-page-container" style={{ padding: '2rem' }}>
        <Loader type="dashboard" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="vendor-page-container" style={{ padding: '2rem' }}>
        <ErrorMessage message={error || 'Product not found'} onRetry={loadProductData} />
      </div>
    );
  }

  // Derived metrics
  const quantity = Number(product.quantity || 0);
  const isOutOfStock = quantity <= 0;
  const isLowStock = quantity > 0 && quantity <= 10;
  const price = Number(product.price || 0);
  const discount = Number(product.discountPercentage || 0);
  const discountedPrice = Math.round(price * (1 - discount / 100));
  const inventoryValue = Math.round(price * quantity);
  const salesCount = Number(product.salesCount || 0);
  const totalRevenue = Math.round(discountedPrice * salesCount);

  // Media images list
  const allImages = [];
  if (product.image) allImages.push(product.image);
  if (Array.isArray(product.images)) {
    product.images.forEach((img) => {
      if (img && !allImages.includes(img)) allImages.push(img);
    });
  }
  if (allImages.length === 0) {
    allImages.push('https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80');
  }
  const currentHeroImg = allImages[selectedImageIndex] || allImages[0];

  // Collect all photos from all customer reviews
  const allCustomerPhotos = [];
  (reviewsData.reviews || []).forEach((r) => {
    if (Array.isArray(r.images)) {
      r.images.forEach((img) => {
        if (img) allCustomerPhotos.push({ img, reviewId: r._id, customerName: r.customerName, rating: r.rating });
      });
    }
  });

  // Filter reviews
  const filteredReviews = (reviewsData.reviews || []).filter((r) => {
    if (reviewFilter === 'all') return true;
    if (reviewFilter === 'photos') return Array.isArray(r.images) && r.images.length > 0;
    return String(Math.round(r.rating)) === String(reviewFilter);
  });

  return (
    <div className="vendor-product-details-page" style={{ padding: '1.5rem', maxWidth: '1380px', margin: '0 auto' }}>
      {/* 1. TOP NAVIGATION & HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate('/vendor/products')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '13px' }}
          >
            <ArrowLeft size={16} />
            <span>Back to Products</span>
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {product.category || 'General'}
              </span>
              <span style={{ color: '#cbd5e1' }}>•</span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>SKU: {String(product._id).slice(-8).toUpperCase()}</span>
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0f172a', margin: '4px 0 0 0' }}>
              {product.name}
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <a
            href={`/customer/products/${product._id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
            title="Open customer storefront page in new tab"
          >
            <ExternalLink size={14} />
            <span>View in Store</span>
          </a>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setShowStockModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            <Boxes size={14} />
            <span>Adjust Stock</span>
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowEditModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            <Pencil size={14} />
            <span>Edit Product</span>
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => setShowDeleteModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }}
            title="Remove Product"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* 2. STATS & OVERVIEW CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Stock Level Card */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>AVAILABLE INVENTORY</span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '999px',
                background: isOutOfStock ? '#fee2e2' : isLowStock ? '#fef3c7' : '#dcfce7',
                color: isOutOfStock ? '#b91c1c' : isLowStock ? '#b45309' : '#15803d'
              }}
            >
              {isOutOfStock ? 'OUT OF STOCK' : isLowStock ? 'LOW STOCK' : 'IN STOCK'}
            </span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
            {quantity.toLocaleString('en-IN')}{' '}
            <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#64748b' }}>units</span>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Total Asset Value: <strong>₹{inventoryValue.toLocaleString('en-IN')}</strong>
          </div>
        </div>

        {/* Price & Offer Card */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>PRICING &amp; MRP</span>
            {discount > 0 && (
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: '#e0e7ff', color: '#4338ca' }}>
                {discount}% DISCOUNT
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
              ₹{discountedPrice.toLocaleString('en-IN')}
            </span>
            {discount > 0 && (
              <span style={{ fontSize: '1rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                ₹{price.toLocaleString('en-IN')}
              </span>
            )}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Gross Margin Per Unit: <strong>₹{discountedPrice.toLocaleString('en-IN')}</strong>
          </div>
        </div>

        {/* Sales Performance Card */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>SALES VELOCITY</span>
            <TrendingUp size={16} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
            {salesCount.toLocaleString('en-IN')}{' '}
            <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#64748b' }}>sold</span>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Lifetime Gross: <strong>₹{totalRevenue.toLocaleString('en-IN')}</strong>
          </div>
        </div>

        {/* Customer Rating Card */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>REVIEWS &amp; RATING</span>
            <Star size={16} color="#f59e0b" fill="#f59e0b" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
              {reviewsData.summary.average || Number(product.rating || 4.5).toFixed(1)}
            </span>
            <div style={{ display: 'flex', gap: '2px' }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={14}
                  fill={s <= (reviewsData.summary.average || product.rating || 4.5) ? '#f59e0b' : 'none'}
                  color="#f59e0b"
                />
              ))}
            </div>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Based on <strong>{reviewsData.summary.total || 0} customer reviews</strong>
          </div>
        </div>
      </div>

      {/* 3. PRODUCT MEDIA & SPECIFICATIONS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 450px) 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Left: Image Gallery */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div
            style={{
              width: '100%',
              height: '380px',
              borderRadius: '10px',
              overflow: 'hidden',
              background: '#f8fafc',
              border: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              position: 'relative'
            }}
          >
            <img
              src={currentHeroImg}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
              }}
            />
          </div>

          {/* Thumbnails row */}
          {allImages.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: idx === selectedImageIndex ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                    background: '#f8fafc',
                    padding: 0,
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Detailed Info & Specifications */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.4rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
              Description &amp; Highlights
            </h3>
            <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
              {product.description || 'No detailed description provided for this product listing.'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.2rem', borderTop: '1px solid #f1f5f9' }}>
              <div>
                <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>AVAILABLE COLORS</span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {product.colors && product.colors.length > 0 && product.colors[0] !== 'N/A' ? (
                    product.colors.map((c, i) => (
                      <span key={i} style={{ fontSize: '12px', fontWeight: 500, padding: '3px 8px', borderRadius: '6px', background: '#f1f5f9', color: '#334155' }}>
                        {c}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>Standard / All colors</span>
                  )}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>AVAILABLE SIZES</span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {product.sizes && product.sizes.length > 0 && product.sizes[0] !== 'N/A' ? (
                    product.sizes.map((s, i) => (
                      <span key={i} style={{ fontSize: '12px', fontWeight: 500, padding: '3px 8px', borderRadius: '6px', background: '#f1f5f9', color: '#334155' }}>
                        {s}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>Standard size</span>
                  )}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>RETURN POLICY</span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#0f172a', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <RotateCcw size={13} color="#10b981" />
                  {product.returnPolicy || '7 Days Return & Exchange'}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>WARRANTY</span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#0f172a', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={13} color="#3b82f6" />
                  {product.warranty || '1 Year Manufacturer Warranty'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Inventory Controls Card */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.4rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                Inventory Fulfillment Actions
              </h3>
              <button
                type="button"
                className="btn btn-outline"
                style={{ fontSize: '12px', padding: '4px 10px' }}
                onClick={() => setShowStockModal(true)}
              >
                Detailed Adjustments
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 14px' }}
                onClick={() => {
                  setStockAdjustment({ type: 'add', amount: 10, reason: 'Quick Restock (+10 units)' });
                  setShowStockModal(true);
                }}
              >
                <Plus size={14} /> Quick +10 Restock
              </button>
              <button
                type="button"
                className="btn btn-outline"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 14px' }}
                onClick={() => {
                  setStockAdjustment({ type: 'add', amount: 50, reason: 'Bulk Shipment (+50 units)' });
                  setShowStockModal(true);
                }}
              >
                <Plus size={14} /> Bulk +50 Restock
              </button>
              {quantity > 0 && (
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 14px', color: '#b91c1c' }}
                  onClick={() => {
                    setStockAdjustment({ type: 'deduct', amount: 1, reason: 'Damaged or write-off (-1 unit)' });
                    setShowStockModal(true);
                  }}
                >
                  <Minus size={14} /> Write-off -1
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. CUSTOMER REVIEWS & RATINGS SECTION (WITH PHOTOS & ZOOM) */}
      <div
        id="reviews-section"
        style={{
          background: '#fff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '1.8rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          marginBottom: '2rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Customer Reviews &amp; Photos
              </h2>
              <span style={{ background: '#e0e7ff', color: '#4338ca', fontSize: '12px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px' }}>
                {reviewsData.summary.total || 0} Total
              </span>
            </div>
            <p style={{ color: '#64748b', fontSize: '13.5px', marginTop: '4px' }}>
              Verified feedback, satisfaction ratings, and customer uploaded product photos
            </p>
          </div>

          {/* Rating Breakdown & Stats Summary */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                {reviewsData.summary.average || 4.5} ★
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Average Buyer Rating
              </div>
            </div>
          </div>
        </div>

        {/* CUSTOMER UPLOADED PHOTOS SHOWCASE */}
        {allCustomerPhotos.length > 0 && (
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1.2rem',
              marginBottom: '1.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Camera size={16} color="#4f46e5" />
              <strong style={{ fontSize: '13.5px', color: '#1e293b' }}>
                Customer Uploaded Photos ({allCustomerPhotos.length})
              </strong>
              <span style={{ fontSize: '12px', color: '#64748b' }}>— Click to zoom high-resolution view</span>
            </div>

            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '6px' }}>
              {allCustomerPhotos.map((item, pIdx) => (
                <div
                  key={pIdx}
                  onClick={() => setActivePhotoModal(item.img)}
                  style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    cursor: 'pointer',
                    position: 'relative',
                    border: '1.5px solid #cbd5e1',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                    background: '#fff'
                  }}
                  title={`Photo by ${item.customerName} (${item.rating}★)`}
                >
                  <img src={item.img} alt="Customer upload" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'rgba(15, 23, 42, 0.65)',
                      color: '#fff',
                      fontSize: '10px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '2px',
                      padding: '2px 0'
                    }}
                  >
                    <span>{item.rating}★</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Star Rating Breakdown Bars & Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1.2rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
          {[
            { id: 'all', label: `All Reviews (${reviewsData.summary.total || 0})` },
            { id: 'photos', label: `With Photos (${allCustomerPhotos.length})` },
            { id: '5', label: `5 Stars (${reviewsData.summary.counts?.[5] || 0})` },
            { id: '4', label: `4 Stars (${reviewsData.summary.counts?.[4] || 0})` },
            { id: '3', label: `3 Stars (${reviewsData.summary.counts?.[3] || 0})` },
            { id: '2', label: `2 Stars (${reviewsData.summary.counts?.[2] || 0})` },
            { id: '1', label: `1 Star (${reviewsData.summary.counts?.[1] || 0})` }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setReviewFilter(tab.id)}
              style={{
                fontSize: '12.5px',
                fontWeight: 600,
                padding: '6px 14px',
                borderRadius: '8px',
                border: reviewFilter === tab.id ? '1.5px solid #4f46e5' : '1px solid #e2e8f0',
                background: reviewFilter === tab.id ? '#eff6ff' : '#ffffff',
                color: reviewFilter === tab.id ? '#1d4ed8' : '#475569',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Individual Reviews Feed */}
        {reviewsLoading ? (
          <Loader type="table" rows={3} columns={3} />
        ) : filteredReviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: '#f8fafc', borderRadius: '10px' }}>
            <Star size={36} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#334155', margin: '0 0 4px 0' }}>
              No reviews match this filter
            </h4>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              {reviewFilter === 'photos'
                ? 'No customer has uploaded photos for this product yet.'
                : 'Customer feedback matching your criteria will appear here once submitted.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredReviews.map((rev) => (
              <div
                key={rev._id}
                style={{
                  padding: '1.2rem',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: '#e0e7ff',
                        color: '#4338ca',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '13px'
                      }}
                    >
                      {(rev.customerName || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{rev.customerName || 'Verified Buyer'}</strong>
                      <span
                        style={{
                          marginLeft: '8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#15803d',
                          background: '#dcfce7',
                          padding: '1px 6px',
                          borderRadius: '4px'
                        }}
                      >
                        <Check size={10} strokeWidth={3} /> Verified Purchase
                      </span>
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {rev.createdAt ? formatDate(rev.createdAt) : 'Recent'}
                  </span>
                </div>

                {/* Rating & Headline */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={13}
                        fill={s <= rev.rating ? '#f59e0b' : 'none'}
                        color="#f59e0b"
                      />
                    ))}
                  </div>
                  {rev.title && (
                    <h5 style={{ margin: 0, fontSize: '13.5px', fontWeight: 700, color: '#1e293b' }}>
                      {rev.title}
                    </h5>
                  )}
                </div>

                {/* Review Text */}
                <p style={{ margin: '0 0 10px 0', fontSize: '13.5px', color: '#334155', lineHeight: 1.5 }}>
                  {rev.comment}
                </p>

                {/* Attached Customer Photos */}
                {Array.isArray(rev.images) && rev.images.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                    {rev.images.map((imgUrl, iIdx) => (
                      <div
                        key={iIdx}
                        onClick={() => setActivePhotoModal(imgUrl)}
                        style={{
                          width: '70px',
                          height: '70px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          border: '1px solid #cbd5e1',
                          background: '#f8fafc',
                          position: 'relative'
                        }}
                        title="Click to view photo full-size"
                      >
                        <img src={imgUrl} alt="Review attachment" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. STOCK AUDIT HISTORY TABLE */}
      {stockHistory.length > 0 && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
            <History size={18} color="#64748b" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Recent Inventory Audit Logs
            </h3>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                  <th style={{ padding: '8px 12px' }}>Timestamp</th>
                  <th style={{ padding: '8px 12px' }}>Delta / Change</th>
                  <th style={{ padding: '8px 12px' }}>Balance After</th>
                  <th style={{ padding: '8px 12px' }}>Reason / Trigger</th>
                </tr>
              </thead>
              <tbody>
                {stockHistory.slice(0, 10).map((log, lIdx) => {
                  const delta = log.quantityChange !== undefined ? log.quantityChange : (log.changeAmount !== undefined ? log.changeAmount : (log.delta ?? 0));
                  const isPositive = delta > 0;
                  const isZero = delta === 0;
                  const balanceAfter = log.stockAfter !== undefined ? log.stockAfter : (log.currentStock ?? log.finalStock ?? log.balanceAfter);
                  return (
                    <tr key={lIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 12px', color: '#64748b' }}>
                        {formatDate(log.createdAt || log.timestamp)}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: isPositive ? '#16a34a' : isZero ? '#64748b' : '#dc2626' }}>
                        {isPositive ? `+${delta}` : delta} units
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0f172a' }}>
                        {balanceAfter !== undefined && balanceAfter !== null ? `${balanceAfter} units` : '—'}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#475569' }}>
                        {log.reason || 'Manual inventory update'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LIGHTBOX PHOTO MODAL */}
      {activePhotoModal && (
        <Modal
          isOpen={Boolean(activePhotoModal)}
          onClose={() => setActivePhotoModal(null)}
          title="Customer Uploaded Photo"
          size="medium"
        >
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px' }}>
            <img
              src={activePhotoModal}
              alt="Zoomed customer review"
              style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '8px' }}
            />
          </div>
        </Modal>
      )}

      {/* QUICK STOCK ADJUSTMENT MODAL */}
      <Modal
        isOpen={showStockModal}
        onClose={() => setShowStockModal(false)}
        title={`Adjust Stock — ${product.name}`}
        size="small"
      >
        <form onSubmit={handleStockAdjust} className="modal-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
            Current Warehouse Stock: <strong>{quantity} units</strong>
          </div>

          <div className="form-group">
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Adjustment Operation</label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button
                type="button"
                className={`status-pill-btn ${stockAdjustment.type === 'add' ? 'active' : ''}`}
                onClick={() => setStockAdjustment({ ...stockAdjustment, type: 'add' })}
              >
                + Restock Add
              </button>
              <button
                type="button"
                className={`status-pill-btn ${stockAdjustment.type === 'deduct' ? 'active' : ''}`}
                onClick={() => setStockAdjustment({ ...stockAdjustment, type: 'deduct' })}
              >
                - Deduct
              </button>
              <button
                type="button"
                className={`status-pill-btn ${stockAdjustment.type === 'set' ? 'active' : ''}`}
                onClick={() => setStockAdjustment({ ...stockAdjustment, type: 'set' })}
              >
                Set Exact
              </button>
            </div>
          </div>

          <div className="form-group">
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Units Quantity</label>
            <input
              type="number"
              min="1"
              required
              value={stockAdjustment.amount}
              onChange={(e) => setStockAdjustment({ ...stockAdjustment, amount: Math.max(1, parseInt(e.target.value, 10) || 1) })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div className="form-group">
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Reason / Note</label>
            <input
              type="text"
              required
              value={stockAdjustment.reason}
              onChange={(e) => setStockAdjustment({ ...stockAdjustment, reason: e.target.value })}
              placeholder="e.g. New consignment batch arrived"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
            <button type="button" className="btn btn-outline" onClick={() => setShowStockModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={adjustingStock}>
              {adjustingStock ? 'Updating...' : 'Confirm Stock Adjustment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT PRODUCT MODAL */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Edit Product — ${product.name}`}
        size="large"
      >
        <form onSubmit={handleSaveEdit} className="modal-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, margin: 0 }}>Product Title *</label>
                <AiWriteButton
                  task="product_title"
                  input={editForm.name}
                  context={{ category: editForm.category, price: editForm.price }}
                  onGenerated={(res) => {
                    const t = res.title || res.text || res.result;
                    if (t) setEditForm((prev) => ({ ...prev, name: t }));
                  }}
                  label="✨ AI Title"
                  size="small"
                  title="Optimize product title for discovery and conversions"
                />
              </div>
              <input
                type="text"
                required
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div className="form-group">
              <label style={{ fontSize: '13px', fontWeight: 600 }}>Category *</label>
              <CustomSelect
                value={editForm.category}
                onChange={(val) => setEditForm({ ...editForm, category: val })}
                options={CATEGORY_OPTIONS}
                placeholder="Select category"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label style={{ fontSize: '13px', fontWeight: 600 }}>MRP / List Price (₹) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={editForm.price}
                onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div className="form-group">
              <label style={{ fontSize: '13px', fontWeight: 600 }}>Discount (%)</label>
              <input
                type="number"
                min="0"
                max="90"
                value={editForm.discountPercentage}
                onChange={(e) => setEditForm({ ...editForm, discountPercentage: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div className="form-group">
              <label style={{ fontSize: '13px', fontWeight: 600 }}>Quantity in Stock *</label>
              <input
                type="number"
                min="0"
                required
                value={editForm.quantity}
                onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{ fontSize: '13px', fontWeight: 600 }}>Main Image URL</label>
            <input
              type="url"
              value={editForm.image}
              onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, margin: 0 }}>Detailed Description</label>
              <AiWriteButton
                task="product_description"
                input={editForm.description || editForm.name}
                context={{
                  productName: editForm.name,
                  category: editForm.category,
                  price: editForm.price
                }}
                onGenerated={(res) => {
                  const d = res.description || res.text || res.result;
                  if (d) setEditForm((prev) => ({ ...prev, description: d }));
                }}
                label="✨ AI Write Description"
                size="small"
                title="Generate high-converting e-commerce description with highlights and specs"
              />
            </div>
            <textarea
              rows={4}
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label style={{ fontSize: '13px', fontWeight: 600 }}>Colors (comma separated)</label>
              <input
                type="text"
                value={editForm.colors}
                onChange={(e) => setEditForm({ ...editForm, colors: e.target.value })}
                placeholder="Black, Silver, Space Gray"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div className="form-group">
              <label style={{ fontSize: '13px', fontWeight: 600 }}>Sizes (comma separated)</label>
              <input
                type="text"
                value={editForm.sizes}
                onChange={(e) => setEditForm({ ...editForm, sizes: e.target.value })}
                placeholder="S, M, L, XL"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
            <button type="button" className="btn btn-outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={savingEdit}>
              {savingEdit ? 'Saving Changes...' : 'Save Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteProduct}
        title="Remove Product from Catalog"
        message={`Are you sure you want to delete "${product.name}"? Customers will no longer be able to discover or order this item.`}
        confirmText="Delete Product"
        type="danger"
      />
    </div>
  );
}

