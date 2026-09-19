import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import {
  Scale,
  Sparkles,
  ArrowLeft,
  X,
  Plus,
  ShoppingCart,
  Star,
  Store,
  ShieldCheck,
  RotateCcw,
  Check,
  Zap,
  PackageOpen,
  Search,
  CheckCircle2,
  Cpu,
  Monitor,
  BatteryCharging,
  Wifi,
  Layers,
  SlidersHorizontal
} from 'lucide-react';
import {
  getCompareList,
  removeFromCompare,
  addToCompare,
  clearCompare,
  requestCompareAiAnalysis
} from '../../services/compareService';
import { addToCart } from '../../services/cartService';
import { getPublicProducts } from '../../services/productService';
import { toast } from '../../components/Toast';
import Loader from '../../components/Loader';
import Modal from '../../components/Modal';
import { API_BASE_URL } from '../../services/api';

export default function CompareProducts() {
  const navigate = useNavigate();
  const { setCartCount, reloadCart } = useOutletContext() || {};

  const [compareList, setCompareList] = useState(getCompareList());
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Enriched compare list — same products but with full spec data fetched live from backend
  const [enrichedList, setEnrichedList] = useState(getCompareList());
  const [enriching, setEnriching] = useState(false);

  // Search & add more products modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  // Fetch full product details (with specifications) from backend whenever compareList changes
  useEffect(() => {
    const ids = compareList.map((p) => p._id).filter(Boolean);
    if (ids.length === 0) { setEnrichedList([]); return; }
    setEnriching(true);

    Promise.all(
      ids.map((id) =>
        fetch(`${API_BASE_URL}/products/public/${id}`)
          .then((r) => r.ok ? r.json() : null)
          .catch(() => null)
      )
    ).then((results) => {
      const merged = compareList.map((stored, i) => {
        const live = results[i];
        if (!live) return stored;
        return {
          ...stored,
          specifications: live.specifications || stored.specifications || {},
          description: live.description || stored.description || '',
          brand: live.brand || stored.brand || '',
          rating: live.rating ?? stored.rating,
          ratingCount: live.ratingCount ?? stored.ratingCount,
          quantity: live.quantity ?? stored.quantity,
          warranty: live.warranty || stored.warranty || '',
          returnPolicy: live.returnPolicy || stored.returnPolicy || ''
        };
      });
      setEnrichedList(merged);
    }).finally(() => setEnriching(false));
  }, [compareList.map(p => p._id).join(',')]);

  useEffect(() => {
    const handleUpdate = (e) => {
      setCompareList(e.detail || getCompareList());
      setAiAnalysis(null); // Reset analysis if products changed
    };
    window.addEventListener('product-compare-updated', handleUpdate);
    return () => window.removeEventListener('product-compare-updated', handleUpdate);
  }, []);

  const handleRemove = (productId) => {
    removeFromCompare(productId);
  };

  const handleClear = () => {
    clearCompare();
    setAiAnalysis(null);
  };

  const handleAddToCart = async (prod) => {
    try {
      await addToCart(prod._id, 1);
      toast.success(`"${prod.name}" added to bag!`);
      if (reloadCart) reloadCart();
    } catch {
      toast.error('Failed to add to cart');
    }
  };

  const handleAnalyzeWithAi = async () => {
    if (compareList.length < 2) {
      toast.error('Please compare at least 2 products for AI analysis');
      return;
    }
    setIsAnalyzing(true);
    try {
      const res = await requestCompareAiAnalysis(compareList.map((p) => p._id));
      if (res?.recommendation) {
        setAiAnalysis(res.recommendation);
        toast.success('AI recommendation generated successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.msg || 'AI Analysis service unavailable right now');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const openAddModal = async () => {
    setIsAddModalOpen(true);
    if (!catalogProducts.length) {
      setLoadingCatalog(true);
      try {
        const res = await getPublicProducts({ limit: 20 });
        const list = Array.isArray(res) ? res : res?.items || res?.products || [];
        setCatalogProducts(list);
      } catch {
        // ignore
      } finally {
        setLoadingCatalog(false);
      }
    }
  };

  const handleAddProductFromCatalog = (prod) => {
    try {
      addToCompare(prod);
      toast.success(`"${prod.name}" added to comparison!`);
      setIsAddModalOpen(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const filteredCatalog = catalogProducts.filter((p) => {
    const alreadyIn = compareList.some((c) => c._id === p._id);
    if (alreadyIn) return false;
    if (!searchQuery.trim()) return true;
    return p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           p.category?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Extract and group specifications across compared products
  const getGroupedCompareSpecs = () => {
    const normList = enrichedList.map((prod) => {
      let raw = prod.specifications;
      if (typeof raw === 'string') {
        try { raw = JSON.parse(raw); } catch { raw = {}; }
      }
      if (raw instanceof Map) {
        raw = Object.fromEntries(raw);
      }
      if (!raw || typeof raw !== 'object') raw = {};

      const isNested = Object.values(raw).some(v => v && typeof v === 'object' && !Array.isArray(v));
      const normalized = {};

      if (isNested) {
        Object.entries(raw).forEach(([secTitle, secContent]) => {
          if (secContent && typeof secContent === 'object' && !Array.isArray(secContent)) {
            normalized[secTitle] = {};
            Object.entries(secContent).forEach(([k, v]) => {
              if (v !== undefined && v !== null && v !== '') {
                normalized[secTitle][k] = typeof v === 'object' ? JSON.stringify(v) : String(v);
              }
            });
          } else if (secContent !== undefined && secContent !== null && secContent !== '') {
            if (!normalized['General']) normalized['General'] = {};
            normalized['General'][secTitle] = String(secContent);
          }
        });
      } else {
        const generalKeys = ['brand', 'model', 'series', 'color', 'dimensions', 'weight'];
        const procKeys = ['processor', 'cpu', 'gpu', 'ram', 'storage', 'memory', 'chipset', 'clock speed'];
        const dispKeys = ['display', 'screen size', 'resolution', 'refresh rate', 'brightness', 'panel'];
        const battKeys = ['battery', 'battery capacity', 'charging speed', 'charging', 'power'];
        const connKeys = ['connectivity', 'wi-fi', 'bluetooth', 'ports', 'usb ports', 'hdmi', '5g'];

        Object.entries(raw).forEach(([k, v]) => {
          if (v === undefined || v === null || v === '') return;
          const lk = k.toLowerCase();
          let targetSec = 'Technical Specifications';
          if (generalKeys.some(g => lk.includes(g))) targetSec = 'General';
          else if (procKeys.some(p => lk.includes(p))) targetSec = 'Processor & Performance';
          else if (dispKeys.some(d => lk.includes(d))) targetSec = 'Display & Graphics';
          else if (battKeys.some(b => lk.includes(b))) targetSec = 'Battery & Power';
          else if (connKeys.some(c => lk.includes(c))) targetSec = 'Connectivity & Ports';

          if (!normalized[targetSec]) normalized[targetSec] = {};
          normalized[targetSec][k] = String(v);
        });
      }

      return { productId: prod._id, specs: normalized };
    });

    const sectionSet = new Set();
    normList.forEach(item => {
      Object.keys(item.specs).forEach(sec => sectionSet.add(sec));
    });

    const preferredOrder = [
      'General',
      'Processor',
      'Processor & Performance',
      'Display',
      'Display & Graphics',
      'Memory & Storage',
      'Camera',
      'Camera & Optics',
      'Battery & Power',
      'Battery & Charging',
      'Connectivity',
      'Connectivity & Ports',
      'In The Box & Warranty',
      'Technical Specifications'
    ];

    const sortedSections = Array.from(sectionSet).sort((a, b) => {
      const idxA = preferredOrder.indexOf(a);
      const idxB = preferredOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    const result = sortedSections.map(sec => {
      const keySet = new Set();
      normList.forEach(item => {
        if (item.specs[sec]) {
          Object.keys(item.specs[sec]).forEach(k => keySet.add(k));
        }
      });
      return {
        section: sec,
        keys: Array.from(keySet)
      };
    }).filter(s => s.keys.length > 0);

    return { groupedSections: result, normList };
  };

  const { groupedSections, normList } = getGroupedCompareSpecs();

  const getSpecIcon = (secTitle = '') => {
    const t = secTitle.toLowerCase();
    if (t.includes('processor') || t.includes('performance') || t.includes('chip') || t.includes('cpu')) return <Cpu size={14} color="#2563eb" />;
    if (t.includes('display') || t.includes('screen') || t.includes('graphic')) return <Monitor size={14} color="#2563eb" />;
    if (t.includes('battery') || t.includes('power') || t.includes('charg')) return <BatteryCharging size={14} color="#16a34a" />;
    if (t.includes('connect') || t.includes('port') || t.includes('wire')) return <Wifi size={14} color="#7c3aed" />;
    if (t.includes('general') || t.includes('build')) return <Layers size={14} color="#0284c7" />;
    return <SlidersHorizontal size={14} color="#475569" />;
  };

  return (
    <div className="compare-products-page" style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* TOP HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer', fontSize: '13px', fontWeight: 600, padding: 0, marginBottom: '8px' }}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Scale size={20} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>
                Product Comparison
              </h1>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                Compare specs, pricing, seller rating and let AI analyze the best recommendation
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {compareList.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="btn btn-outline"
              style={{ fontSize: '12.5px', padding: '8px 14px' }}
            >
              Clear All
            </button>
          )}

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleAnalyzeWithAi}
            disabled={compareList.length < 2 || isAnalyzing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              fontSize: '13px',
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              border: 'none',
              fontWeight: 700
            }}
          >
            <Sparkles size={16} />
            <span>{isAnalyzing ? 'Analyzing with AI...' : 'Analyze with AI'}</span>
          </button>
        </div>
      </div>

      {/* AI RECOMMENDATION BANNER */}
      {aiAnalysis && (
        <div
          style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)',
            border: '1.5px solid #86efac',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '28px',
            boxShadow: '0 4px 20px rgba(34, 197, 94, 0.12)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#16a34a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Sparkles size={22} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 800, background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '6px' }}>
                    {aiAnalysis.badge || 'AI Recommended'}
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Darwin AI Catalog Assessment</span>
                </div>
                <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                  Winner: {aiAnalysis.winnerName}
                </h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#334155', lineHeight: 1.5, maxWidth: '800px' }}>
                  {aiAnalysis.verdict}
                </p>
              </div>
            </div>

            {/* Quick Add Winner */}
            {(() => {
              const winnerProd = compareList.find((p) => p._id === aiAnalysis.winnerId);
              if (!winnerProd) return null;
              return (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleAddToCart(winnerProd)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#16a34a', borderColor: '#16a34a', fontSize: '13px', padding: '10px 18px', fontWeight: 700 }}
                >
                  <ShoppingCart size={15} />
                  <span>Add Winner to Bag</span>
                </button>
              );
            })()}
          </div>

          {/* AI Pros Highlights */}
          {Array.isArray(aiAnalysis.pros) && aiAnalysis.pros.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              {aiAnalysis.pros.map((pro, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#065f46' }}>
                  <CheckCircle2 size={15} color="#16a34a" />
                  <span>{pro}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* COMPARISON MATRIX OR EMPTY STATE */}
      {compareList.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '60px 20px', textAlign: 'center' }}>
          <Scale size={48} color="#94a3b8" style={{ marginBottom: '14px' }} />
          <h2 style={{ margin: '0 0 8px', fontSize: '18px', color: '#0f172a' }}>No products selected for comparison</h2>
          <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '460px', margin: '0 auto 20px' }}>
            Select 2 to 4 products from the catalog to compare their pricing, verified buyer ratings, vendor guarantees, and AI recommendation.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/customer')}
          >
            Browse Products
          </button>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflowX: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '750px' }}>
            <tbody>
              {/* ROW 1: PRODUCT HERO & CTAs */}
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ width: '180px', padding: '24px 20px', background: '#f8fafc', fontWeight: 700, color: '#475569', fontSize: '13px', verticalAlign: 'top' }}>
                  Products ({compareList.length}/4)
                </td>
                {compareList.map((prod) => {
                  const isWinner = aiAnalysis?.winnerId === prod._id;
                  return (
                    <td
                      key={prod._id}
                      style={{
                        padding: '24px 20px',
                        verticalAlign: 'top',
                        position: 'relative',
                        background: isWinner ? '#f0fdf4' : '#fff',
                        borderLeft: '1px solid #e2e8f0',
                        width: `${Math.floor(80 / compareList.length)}%`
                      }}
                    >
                      {/* Winner Badge */}
                      {isWinner && (
                        <div style={{ position: 'absolute', top: 12, left: 12, background: '#16a34a', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Sparkles size={11} /> AI Top Pick
                        </div>
                      )}

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemove(prod._id)}
                        style={{ position: 'absolute', top: 12, right: 12, border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                        title="Remove from compare"
                      >
                        <X size={16} />
                      </button>

                      {/* Thumbnail (clickable to product page) */}
                      <Link to={`/customer/products/${prod._id}`} style={{ display: 'block', width: '120px', height: '120px', margin: '10px auto 14px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                        {prod.image ? (
                          <img src={prod.image} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                            <PackageOpen size={36} />
                          </div>
                        )}
                      </Link>

                      {/* Title (clickable to product page) */}
                      <Link
                        to={`/customer/products/${prod._id}`}
                        style={{ display: 'block', fontSize: '15px', fontWeight: 700, color: '#0f172a', textDecoration: 'none', lineHeight: 1.3, marginBottom: '6px' }}
                        title="View details"
                      >
                        {prod.name}
                      </Link>

                      {/* Price & Discount */}
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '14px' }}>
                        <span style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                          ₹{Number(prod.price || 0).toLocaleString('en-IN')}
                        </span>
                        {prod.originalPrice > prod.price && (
                          <>
                            <span style={{ fontSize: '12px', color: '#94a3b8', textDecoration: 'line-through' }}>
                              ₹{Number(prod.originalPrice).toLocaleString('en-IN')}
                            </span>
                            <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700 }}>
                              ({prod.discountPercentage}% OFF)
                            </span>
                          </>
                        )}
                      </div>

                      {/* Action Button */}
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => handleAddToCart(prod)}
                        style={{ width: '100%', fontSize: '13px', padding: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <ShoppingCart size={14} />
                        <span>Add to Bag</span>
                      </button>
                    </td>
                  );
                })}

                {/* Optional Empty Slot to Add More Products */}
                {compareList.length < 4 && (
                  <td style={{ padding: '24px 20px', verticalAlign: 'middle', textAlign: 'center', borderLeft: '1px solid #e2e8f0', background: '#fafafa' }}>
                    <button
                      type="button"
                      onClick={openAddModal}
                      style={{
                        border: '2px dashed #cbd5e1',
                        borderRadius: '12px',
                        padding: '24px 16px',
                        width: '100%',
                        cursor: 'pointer',
                        background: 'transparent',
                        color: '#64748b',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <Plus size={24} color="#3b82f6" />
                      <strong style={{ fontSize: '13px', color: '#0f172a' }}>Add Product</strong>
                      <span style={{ fontSize: '11px' }}>Select up to 4 items</span>
                    </button>
                  </td>
                )}
              </tr>

              {/* ========================================================= */}
              {/* SECTION 1: TECHNICAL SPECIFICATIONS                        */}
              {/* ========================================================= */}
              <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0', borderBottom: '2px solid #cbd5e1' }}>
                <td
                  colSpan={compareList.length + (compareList.length < 4 ? 2 : 1)}
                  style={{
                    padding: '14px 20px',
                    fontWeight: 800,
                    fontSize: '14px',
                    color: '#0f172a',
                    letterSpacing: '0.2px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Zap size={17} color="#2563eb" />
                    <span>Technical Specifications</span>
                  </div>
                </td>
              </tr>

              {/* Dynamic Categorized Specifications Rows */}
              {groupedSections.length > 0 ? (
                groupedSections.map((secGroup, secIdx) => (
                  <React.Fragment key={secGroup.section || secIdx}>
                    {/* Section Group Header */}
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <td
                        colSpan={compareList.length + (compareList.length < 4 ? 2 : 1)}
                        style={{
                          padding: '10px 20px',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          color: '#334155',
                          background: '#f1f5f9'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                          {getSpecIcon(secGroup.section)}
                          <span>{secGroup.section}</span>
                        </div>
                      </td>
                    </tr>

                    {/* Specification Key Rows */}
                    {secGroup.keys.map((specKey, kIdx) => {
                      // Collect values across compared products to identify differences
                      const vals = compareList.map((p) => {
                        const pEntry = normList.find((n) => n.productId === p._id);
                        return pEntry?.specs?.[secGroup.section]?.[specKey] || null;
                      });

                      const distinct = new Set(vals.filter(Boolean));
                      const isDiffering = distinct.size > 1;

                      return (
                        <tr key={specKey || kIdx} style={{ borderBottom: '1px solid #f1f5f9', background: isDiffering ? 'rgba(37, 99, 235, 0.02)' : '#fff' }}>
                          <td style={{ padding: '12px 20px', background: '#f8fafc', fontWeight: 600, color: '#475569', fontSize: '12.5px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                              <span>{specKey}</span>
                              {isDiffering && (
                                <span style={{ fontSize: '10px', fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '1px 5px', borderRadius: '4px' }}>
                                  Differs
                                </span>
                              )}
                            </div>
                          </td>
                          {compareList.map((prod) => {
                            const pEntry = normList.find((n) => n.productId === prod._id);
                            const val = pEntry?.specs?.[secGroup.section]?.[specKey];

                            return (
                              <td
                                key={prod._id}
                                style={{
                                  padding: '12px 20px',
                                  borderLeft: '1px solid #f1f5f9',
                                  fontSize: '13px',
                                  color: val ? '#0f172a' : '#94a3b8',
                                  fontWeight: isDiffering && val ? 600 : 400
                                }}
                              >
                                {val || '—'}
                              </td>
                            );
                          })}
                          {compareList.length < 4 && <td style={{ borderLeft: '1px solid #f1f5f9' }}></td>}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))
              ) : (
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 20px', background: '#f8fafc', fontWeight: 600, color: '#475569', fontSize: '13px' }}>
                    Specifications
                  </td>
                  <td
                    colSpan={compareList.length + (compareList.length < 4 ? 1 : 0)}
                    style={{ padding: '14px 20px', fontSize: '13px', color: '#64748b', fontStyle: 'italic' }}
                  >
                    {enriching
                      ? '⏳ Loading specifications...'
                      : 'No technical specifications available for these products.'}
                  </td>
                </tr>
              )}

              {/* ========================================================= */}
              {/* SECTION 2: COMMERCIAL & SELLER DETAILS                    */}
              {/* ========================================================= */}
              <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0', borderBottom: '2px solid #cbd5e1' }}>
                <td
                  colSpan={compareList.length + (compareList.length < 4 ? 2 : 1)}
                  style={{
                    padding: '14px 20px',
                    fontWeight: 800,
                    fontSize: '13.5px',
                    color: '#0f172a'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Store size={16} color="#64748b" />
                    <span>Commercial &amp; Seller Guarantees</span>
                  </div>
                </td>
              </tr>

              {/* Buyer Rating */}
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '14px 20px', background: '#f8fafc', fontWeight: 600, color: '#475569', fontSize: '13px' }}>
                  Buyer Rating
                </td>
                {compareList.map((prod) => (
                  <td key={prod._id} style={{ padding: '14px 20px', borderLeft: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: '6px', fontSize: '12.5px', fontWeight: 700 }}>
                      <span>{Number(prod.rating || 4.3).toFixed(1)}</span>
                      <Star size={13} fill="currentColor" />
                    </div>
                    <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '6px' }}>
                      ({prod.ratingCount || 28} ratings)
                    </span>
                  </td>
                ))}
                {compareList.length < 4 && <td style={{ borderLeft: '1px solid #f1f5f9' }}></td>}
              </tr>

              {/* Availability & Stock */}
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '14px 20px', background: '#f8fafc', fontWeight: 600, color: '#475569', fontSize: '13px' }}>
                  Availability
                </td>
                {compareList.map((prod) => {
                  const inStock = Number(prod.quantity) > 0;
                  return (
                    <td key={prod._id} style={{ padding: '14px 20px', borderLeft: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: inStock ? '#16a34a' : '#dc2626' }}>
                        {inStock ? `In Stock (${prod.quantity} units)` : 'Currently Unavailable'}
                      </span>
                    </td>
                  );
                })}
                {compareList.length < 4 && <td style={{ borderLeft: '1px solid #f1f5f9' }}></td>}
              </tr>

              {/* Merchant / Sold By */}
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '14px 20px', background: '#f8fafc', fontWeight: 600, color: '#475569', fontSize: '13px' }}>
                  Merchant
                </td>
                {compareList.map((prod) => (
                  <td key={prod._id} style={{ padding: '14px 20px', borderLeft: '1px solid #f1f5f9', fontSize: '13px', color: '#334155' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Store size={14} color="#64748b" />
                      <strong>{prod.vendorName || 'Verified Merchant'}</strong>
                    </div>
                  </td>
                ))}
                {compareList.length < 4 && <td style={{ borderLeft: '1px solid #f1f5f9' }}></td>}
              </tr>

              {/* Category */}
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '14px 20px', background: '#f8fafc', fontWeight: 600, color: '#475569', fontSize: '13px' }}>
                  Category
                </td>
                {compareList.map((prod) => (
                  <td key={prod._id} style={{ padding: '14px 20px', borderLeft: '1px solid #f1f5f9', fontSize: '13px', color: '#334155' }}>
                    {prod.category || 'General'}
                  </td>
                ))}
                {compareList.length < 4 && <td style={{ borderLeft: '1px solid #f1f5f9' }}></td>}
              </tr>

              {/* Warranty */}
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '14px 20px', background: '#f8fafc', fontWeight: 600, color: '#475569', fontSize: '13px' }}>
                  Warranty
                </td>
                {compareList.map((prod) => (
                  <td key={prod._id} style={{ padding: '14px 20px', borderLeft: '1px solid #f1f5f9', fontSize: '13px', color: '#334155' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ShieldCheck size={14} color="#16a34a" />
                      <span>{prod.warranty || '1 Year Manufacturer Warranty'}</span>
                    </div>
                  </td>
                ))}
                {compareList.length < 4 && <td style={{ borderLeft: '1px solid #f1f5f9' }}></td>}
              </tr>

              {/* Return Policy */}
              <tr>
                <td style={{ padding: '14px 20px', background: '#f8fafc', fontWeight: 600, color: '#475569', fontSize: '13px' }}>
                  Return Policy
                </td>
                {compareList.map((prod) => (
                  <td key={prod._id} style={{ padding: '14px 20px', borderLeft: '1px solid #f1f5f9', fontSize: '13px', color: '#334155' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <RotateCcw size={14} color="#2563eb" />
                      <span>{prod.returnPolicy || '7 Days Return & Exchange'}</span>
                    </div>
                  </td>
                ))}
                {compareList.length < 4 && <td style={{ borderLeft: '1px solid #f1f5f9' }}></td>}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: ADD PRODUCT FROM CATALOG */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Product to Comparison"
        size="medium"
      >
        <div style={{ padding: '10px 0' }}>
          <div style={{ position: 'relative', marginBottom: '14px' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search catalog products by name or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {loadingCatalog ? (
              <div style={{ padding: '30px', textAlign: 'center' }}>
                <Loader text="Loading catalog items..." />
              </div>
            ) : filteredCatalog.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                No matching products available to add.
              </div>
            ) : (
              filteredCatalog.map((p) => (
                <div
                  key={p._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    background: '#fff'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {p.image ? (
                      <img src={p.image} alt="" style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <PackageOpen size={18} color="#94a3b8" />
                      </div>
                    )}
                    <div>
                      <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>{p.name}</strong>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        ₹{Number(p.price || 0).toLocaleString('en-IN')} • {p.category || 'General'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => handleAddProductFromCatalog(p)}
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    + Add
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
