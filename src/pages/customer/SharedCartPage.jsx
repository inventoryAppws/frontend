import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Users,
  Plus,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Share2,
  CheckCircle2,
  Clock,
  Send,
  Trash2,
  Copy,
  Check,
  ShoppingBag,
  ArrowRight,
  Search,
  ChevronDown,
  History,
  Layers,
  Sparkles,
  X,
  Heart,
  Minus,
  Star,
  ExternalLink,
  ShieldCheck,
  Lock,
  Bookmark
} from 'lucide-react';
import api from '../../services/api';
import { getPublicProducts } from '../../services/productService';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../components/Toast';
import CreateSharedCartModal from '../../components/shared-cart/CreateSharedCartModal';
import './SharedCartPage.css';

export default function SharedCartPage() {
  const { cartId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const codeParam = searchParams.get('code');

  const { user } = useAuth() || {};
  const currentUserName = user?.name || localStorage.getItem('customer_name') || 'You';

  const [cartsList, setCartsList] = useState([]);
  const [activeCart, setActiveCart] = useState(null);
  const [activeTab, setActiveTab] = useState('items'); // 'items', 'chat', 'checkout', 'history'
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Cart switcher dropdown open state
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const switcherRef = useRef(null);

  // Join by Code Modal state
  const [isJoinCodeModalOpen, setIsJoinCodeModalOpen] = useState(false);
  const [inputJoinCode, setInputJoinCode] = useState('');
  const [joinName, setJoinName] = useState(currentUserName);
  const [joining, setJoining] = useState(false);

  // Invitation Gateway state (if visiting via link/code as non-member)
  const [invitationCart, setInvitationCart] = useState(null);

  // Screen 3: Item Details with Voting Modal state
  const [selectedVotingItem, setSelectedVotingItem] = useState(null);

  // Search query within cart items
  const [cartItemsSearch, setCartItemsSearch] = useState('');

  // Custom Product Picker popover state
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedProductCategory, setSelectedProductCategory] = useState('All');
  const [addingProductId, setAddingProductId] = useState(null);

  // Chat message input
  const [newMessage, setNewMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  // Item comment input for modal
  const [modalCommentText, setModalCommentText] = useState('');

  // Catalog products cache
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  // Split calculation mode: 'equal' | 'single'
  const [splitMode, setSplitMode] = useState('equal');

  // Favorites map for wishlist toggle inside shared cart
  const [likedItems, setLikedItems] = useState({});

  useEffect(() => {
    loadCarts();
  }, [cartId, codeParam]);

  // Real-time background sync every 3.5 seconds
  useEffect(() => {
    if (!activeCart?._id || invitationCart) return;
    const interval = setInterval(() => {
      refreshActiveCart(true);
    }, 3500);
    return () => clearInterval(interval);
  }, [activeCart?._id, invitationCart]);

  // Load catalog when picker opens or filters change
  useEffect(() => {
    if (isProductPickerOpen) {
      loadCatalog();
    }
  }, [isProductPickerOpen, catalogSearch, selectedProductCategory]);

  // Click outside to close cart switcher
  useEffect(() => {
    function handleClickOutside(e) {
      if (switcherRef.current && !switcherRef.current.contains(e.target)) {
        setIsSwitcherOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadCarts = async () => {
    setLoading(true);
    try {
      // 1. If code in query (?code=CART-XYZ)
      if (codeParam) {
        const cRes = await api.get(`/shared-cart/${codeParam}`);
        const found = cRes.data;
        if (found) {
          if (!found.isMember) {
            setInvitationCart(found);
          } else {
            setInvitationCart(null);
          }
          setActiveCart(found);
        }
      }

      // 2. Fetch my private carts
      const res = await api.get('/shared-cart');
      const list = res.data || [];
      setCartsList(list);

      if (!codeParam) {
        if (cartId) {
          const foundInList = list.find((c) => (c._id || c.id) === cartId);
          if (foundInList) {
            setActiveCart(foundInList);
            setInvitationCart(null);
          } else {
            const sRes = await api.get(`/shared-cart/${cartId}`);
            if (sRes.data) {
              if (!sRes.data.isMember) {
                setInvitationCart(sRes.data);
              } else {
                setInvitationCart(null);
              }
              setActiveCart(sRes.data);
            }
          }
        } else if (list.length > 0) {
          setActiveCart(list[0]);
          setInvitationCart(null);
        } else {
          setActiveCart(null);
          setInvitationCart(null);
        }
      }
    } catch (err) {
      console.error('Failed to load shared carts:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCatalog = async () => {
    setLoadingCatalog(true);
    try {
      const data = await getPublicProducts({
        search: catalogSearch || undefined,
        category: selectedProductCategory !== 'All' ? selectedProductCategory : undefined,
        limit: 30
      });
      setCatalogProducts(data.items || data.products || []);
    } catch (err) {
      console.error('Failed to load catalog:', err);
    } finally {
      setLoadingCatalog(false);
    }
  };

  const refreshActiveCart = async (silent = false) => {
    const id = activeCart?._id || activeCart?.id || cartId || codeParam;
    if (!id) return;
    try {
      const res = await api.get(`/shared-cart/${id}`);
      if (res.data) {
        const updated = res.data;
        if (updated.isMember) {
          setInvitationCart(null);
        }
        setActiveCart(updated);
        setCartsList((prev) =>
          prev.map((c) => ((c._id || c.id) === (updated._id || updated.id) ? updated : c))
        );
        // If modal is open, sync the open item
        if (selectedVotingItem) {
          const refreshedItem = updated.items?.find((it) => it._id === selectedVotingItem._id);
          if (refreshedItem) setSelectedVotingItem(refreshedItem);
        }
      }
    } catch (err) {
      if (!silent) console.error(err);
    }
  };

  // Join shared cart
  const handleJoinCart = async (codeToJoin) => {
    const code = (codeToJoin || inputJoinCode || activeCart?.shareCode || '').trim();
    if (!code) {
      toast.error('Please enter a cart code');
      return;
    }
    setJoining(true);
    try {
      const res = await api.post('/shared-cart/join', {
        shareCode: code.toUpperCase(),
        memberName: (joinName.trim() || currentUserName)
      });
      const joinedCart = res.data;
      toast.success(`Joined "${joinedCart.name}"!`);
      setActiveCart(joinedCart);
      setInvitationCart(null);
      setIsJoinCodeModalOpen(false);
      setInputJoinCode('');
      setCartsList((prev) => {
        const exists = prev.some((c) => (c._id || c.id) === (joinedCart._id || joinedCart.id));
        return exists ? prev : [joinedCart, ...prev];
      });
      navigate(`/customer/shared-cart/${joinedCart._id || joinedCart.id}`);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Invalid code or failed to join cart');
    } finally {
      setJoining(false);
    }
  };

  // Switch Active Cart
  const handleSelectCart = (cart) => {
    setActiveCart(cart);
    setInvitationCart(null);
    setIsSwitcherOpen(false);
    navigate(`/customer/shared-cart/${cart._id || cart.id}`);
  };

  // Add Product from Custom Picker
  const handleQuickAddProduct = async (product) => {
    const id = activeCart?._id || activeCart?.id;
    if (!id || !product) return;
    setAddingProductId(product._id || product.id);
    try {
      const res = await api.post(`/shared-cart/${id}/items`, {
        productId: product._id || product.id,
        quantity: 1,
        memberName: currentUserName
      });
      if (res.data) {
        toast.success(`Added ${product.name} to shared cart!`);
        await refreshActiveCart();
        setIsProductPickerOpen(false);
      }
    } catch (err) {
      console.error('Error adding product:', err);
      toast.error('Failed to add product to shared cart');
    } finally {
      setAddingProductId(null);
    }
  };

  // Update item quantity
  const handleUpdateQuantity = async (itemId, newQty) => {
    const id = activeCart?._id || activeCart?.id;
    if (!id || !itemId) return;

    if (newQty <= 0) {
      handleRemoveItem(itemId);
      return;
    }

    try {
      const res = await api.put(`/shared-cart/${id}/items/${itemId}`, {
        quantity: newQty,
        memberName: currentUserName
      });
      if (res.data) {
        refreshActiveCart();
      }
    } catch (err) {
      console.error('Error updating quantity:', err);
    }
  };

  // Remove Item from Cart
  const handleRemoveItem = async (itemId) => {
    const id = activeCart?._id || activeCart?.id;
    if (!id || !itemId) return;
    if (!window.confirm('Remove this item from the shared cart?')) return;
    try {
      const res = await api.delete(`/shared-cart/${id}/items/${itemId}`);
      if (res.data) {
        if (selectedVotingItem?._id === itemId) {
          setSelectedVotingItem(null);
        }
        refreshActiveCart();
      }
    } catch (err) {
      console.error('Error removing item:', err);
    }
  };

  // Voting handler (up, down, unsure)
  const handleVote = async (itemId, voteType) => {
    const id = activeCart?._id || activeCart?.id;
    if (!id) return;
    try {
      const res = await api.post(`/shared-cart/${id}/items/${itemId}/vote`, {
        vote: voteType,
        memberName: currentUserName
      });
      if (res.data) {
        refreshActiveCart();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add comment in modal
  const handleAddModalComment = async (e) => {
    e.preventDefault();
    if (!modalCommentText.trim() || !selectedVotingItem) return;
    const id = activeCart?._id || activeCart?.id;
    try {
      const res = await api.post(
        `/shared-cart/${id}/items/${selectedVotingItem._id}/comment`,
        {
          text: modalCommentText.trim(),
          memberName: currentUserName
        }
      );
      if (res.data) {
        setModalCommentText('');
        refreshActiveCart();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Send chat message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const id = activeCart?._id || activeCart?.id;
    setSendingMsg(true);
    try {
      const res = await api.post(`/shared-cart/${id}/messages`, {
        text: newMessage.trim(),
        memberName: currentUserName
      });
      if (res.data) {
        setNewMessage('');
        refreshActiveCart();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingMsg(false);
    }
  };

  // Toggle readiness
  const handleToggleReadiness = async () => {
    const id = activeCart?._id || activeCart?.id;
    if (!id) return;
    try {
      const myMember = activeCart.members?.find(
        (m) => (user?._id && m.customerId && String(m.customerId) === String(user._id)) ||
               m.name?.toLowerCase() === currentUserName.toLowerCase()
      ) || activeCart.members?.[0];

      const newStatus = !myMember?.isReady;
      const res = await api.put(`/shared-cart/${id}/ready`, {
        isReady: newStatus,
        memberName: currentUserName
      });
      if (res.data) {
        refreshActiveCart();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Copy share code
  const handleCopyCode = () => {
    const code = activeCart?.shareCode || '';
    if (!code) return;
    navigator.clipboard.writeText(code);
    toast.success(`Group code "${code}" copied to clipboard!`);
  };

  // Share group cart via System Share with clipboard fallback
  const handleShareGroup = async () => {
    const code = activeCart?.shareCode || '';
    const shareUrl = `${window.location.origin}/customer/shared-cart?code=${code}`;
    const shareData = {
      title: `Join my Shared Cart: ${activeCart?.name || 'Group Cart'}`,
      text: `Hey! Join our shopping cart "${activeCart?.name || 'Group Cart'}" using code ${code}. Let's pick items and vote together!`,
      url: shareUrl
    };

    if (navigator.share && typeof navigator.share === 'function') {
      try {
        await navigator.share(shareData);
        toast.success('Shared successfully!');
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('System share error:', err);
        }
      }
    }

    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    toast.success(`Group code ${code} & invite link copied!`);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Copy share URL fallback
  const handleCopyLink = () => {
    handleShareGroup();
  };

  const items = activeCart?.items || [];
  const members = activeCart?.members || [];
  const messages = activeCart?.messages || [];
  const activityLog = activeCart?.activityLog || [];

  // Filter items in cart
  const filteredCartItems = items.filter((it) => {
    if (!cartItemsSearch.trim()) return true;
    const p = it.productId && typeof it.productId === 'object' ? it.productId : {};
    const name = (p.name || it.name || '').toLowerCase();
    return name.includes(cartItemsSearch.toLowerCase());
  });

  const categoriesList = ['All', 'Footwear & Shoes', 'Fashion & Apparel', 'Smartphones', 'Laptops', 'Audio', 'Appliances'];

  // Total cost calculation
  const subtotalCost = items.reduce((sum, it) => {
    const p = it.productId && typeof it.productId === 'object' && it.productId.price != null ? it.productId.price : (it.price ?? 0);
    return sum + p * (it.quantity || 1);
  }, 0);

  const groupDiscount = Math.round(subtotalCost * 0.1); // 10% group discount
  const taxes = Math.round((subtotalCost - groupDiscount) * 0.05); // 5% GST
  const totalCost = subtotalCost - groupDiscount + taxes;

  const costPerPerson = members.length > 0 ? Math.round(totalCost / members.length) : totalCost;
  const readyCount = members.filter((m) => m.isReady).length;

  const currentMember = members.find(
    (m) => (user?._id && m.customerId && String(m.customerId) === String(user._id)) ||
           m.name?.toLowerCase() === currentUserName.toLowerCase()
  ) || members[0];

  // 1. Loading screen
  if (loading) {
    return (
      <div className="sc-page-container">
        <div className="sc-empty-state">
          <div className="sc-spinner"></div>
          <h3>Loading Shared Cart...</h3>
          <p>Connecting to real-time collaboration session</p>
        </div>
      </div>
    );
  }

  // 2. Invitation Screen (Visiting by link / code without being a member)
  if (invitationCart && !invitationCart.isMember) {
    return (
      <div className="sc-page-container">
        <div className="sc-invitation-container">
          <div className="sc-invitation-card">
            <div className="sc-invite-badge">📩 Shared Cart Invitation</div>
            <h2 className="sc-invite-title">You've been invited to join "{invitationCart.name}"!</h2>
            <p className="sc-invite-desc">
              Created by <strong>{invitationCart.creatorName}</strong> • {invitationCart.members?.length || 1} members shopping together
            </p>

            <div className="sc-invite-preview-box">
              <div className="sc-invite-meta">
                <span>Cart Code: <strong>{invitationCart.shareCode}</strong></span>
                <span>Items: <strong>{invitationCart.items?.length || 0}</strong></span>
              </div>
              {invitationCart.items?.length > 0 && (
                <div className="sc-invite-items-preview">
                  {invitationCart.items.slice(0, 4).map((it, idx) => {
                    const img = it.image || it.productId?.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200';
                    return <img key={idx} src={img} alt={it.name} className="sc-invite-thumb" />;
                  })}
                </div>
              )}
            </div>

            <div className="sc-invite-join-form">
              <label className="sc-field-label">Your Name in Group:</label>
              <input
                type="text"
                className="sc-text-input"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                placeholder="Enter your name"
              />
              <button
                type="button"
                className="sc-invite-join-btn"
                disabled={joining}
                onClick={() => handleJoinCart(invitationCart.shareCode)}
              >
                {joining ? 'Joining Group...' : 'Accept Invite & Join Cart'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Empty State (User has no shared carts yet)
  if (!activeCart && cartsList.length === 0) {
    return (
      <div className="sc-page-container">
        <div className="sc-empty-hero-card">
          <div className="sc-empty-hero-icon">
            <Users size={36} />
          </div>
          <h2>Collaborative Group Shopping</h2>
          <p>
            Shop together with friends, family, or colleagues! Add items to a shared cart, cast live votes, discuss choices in real-time, and split checkout easily.
          </p>

          <div className="sc-empty-hero-actions">
            <button
              type="button"
              className="sc-create-hero-btn"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus size={18} />
              <span>Create a New Shared Cart</span>
            </button>

            <button
              type="button"
              className="sc-join-hero-btn"
              onClick={() => setIsJoinCodeModalOpen(true)}
            >
              <Lock size={17} />
              <span>Join with Code</span>
            </button>
          </div>
        </div>

        {/* Create Cart Modal */}
        {isCreateModalOpen && (
          <CreateSharedCartModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onCreated={(newCart) => {
              loadCarts();
              setActiveCart(newCart);
            }}
          />
        )}

        {/* Join with Code Modal */}
        {isJoinCodeModalOpen && (
          <div className="sc-modal-overlay" onClick={() => setIsJoinCodeModalOpen(false)}>
            <div className="sc-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
              <div className="sc-modal-header">
                <div>
                  <span className="sc-badge">🔑 Private Access</span>
                  <h3 className="sc-modal-title">Join Shared Cart</h3>
                  <p className="sc-modal-sub">Enter the code shared by your friend or family member</p>
                </div>
                <button className="sc-close-btn" onClick={() => setIsJoinCodeModalOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
                <div>
                  <label className="sc-field-label">Cart Code</label>
                  <input
                    type="text"
                    placeholder="e.g. CART-E2A4F1"
                    value={inputJoinCode}
                    onChange={(e) => setInputJoinCode(e.target.value.toUpperCase())}
                    className="sc-text-input"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="sc-field-label">Your Name</label>
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={joinName}
                    onChange={(e) => setJoinName(e.target.value)}
                    className="sc-text-input"
                  />
                </div>

                <div className="sc-modal-actions" style={{ marginTop: '10px' }}>
                  <button type="button" className="sc-cancel-btn" onClick={() => setIsJoinCodeModalOpen(false)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="sc-submit-btn"
                    disabled={joining || !inputJoinCode.trim()}
                    onClick={() => handleJoinCart(inputJoinCode)}
                  >
                    {joining ? 'Joining...' : 'Join Cart'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 4. Main Shared Cart Collaborative View
  return (
    <div className="sc-page-container">
      {/* 1. TOP HEADER & GROUP CART SWITCHER (Clean 2-Row Aligned Layout) */}
      <div className="sc-top-bar">
        {/* ROW 1: Global Context & Multi-Cart Management Toolbar */}
        <div className="sc-top-meta-bar">
          <div className="sc-meta-bar-left">
            <span className="sc-top-badge">🧑🤝🧑 Collaborative Shopping</span>
            {/* Custom Group Cart Switcher */}
            <div className="sc-switcher-wrapper" ref={switcherRef}>
              <button
                type="button"
                className="sc-switcher-btn"
                onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
              >
                <Layers size={13} />
                <span>My Group Carts ({cartsList.length})</span>
                <ChevronDown size={13} className={isSwitcherOpen ? 'rotate-180' : ''} />
              </button>

              {isSwitcherOpen && (
                <div className="sc-switcher-menu">
                  <div className="sc-switcher-header">Select Group Cart</div>
                  {cartsList.map((c) => {
                    const isSelected = (c._id || c.id) === (activeCart?._id || activeCart?.id);
                    return (
                      <div
                        key={c._id || c.id}
                        className={`sc-switcher-item ${isSelected ? 'active' : ''}`}
                        onClick={() => handleSelectCart(c)}
                      >
                        <div>
                          <div className="sc-switcher-item-name">{c.name}</div>
                          <div className="sc-switcher-item-sub">
                            {c.items?.length || 0} items • Code: {c.shareCode}
                          </div>
                        </div>
                        {isSelected && <Check size={14} className="text-primary" />}
                      </div>
                    );
                  })}
                  <div className="sc-switcher-footer">
                    <button
                      type="button"
                      className="sc-switcher-new-btn"
                      onClick={() => {
                        setIsSwitcherOpen(false);
                        setIsCreateModalOpen(true);
                      }}
                    >
                      <Plus size={14} /> Create Another Cart
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="sc-meta-bar-right">
            {/* Join with Code Button */}
            <button
              type="button"
              className="sc-header-btn sc-header-btn-secondary"
              onClick={() => setIsJoinCodeModalOpen(true)}
              title="Join a cart using share code"
            >
              <Lock size={13} />
              <span>Join with Code</span>
            </button>

            {/* + New Group Cart Button */}
            <button
              type="button"
              className="sc-header-btn sc-header-btn-primary"
              onClick={() => setIsCreateModalOpen(true)}
              title="Create a new group cart"
            >
              <Plus size={14} />
              <span>New Group Cart</span>
            </button>
          </div>
        </div>

        {/* Subtle Horizontal Divider */}
        <div className="sc-top-bar-divider" />

        {/* ROW 2: Active Cart Info & Social Actions */}
        <div className="sc-active-cart-row">
          <div className="sc-active-cart-info">
            <h1 className="sc-top-title">{activeCart?.name || 'Shared Group Cart'}</h1>

            {/* Members Stack with Avatar Clusters */}
            <div className="sc-members-stack">
              {members.map((m, i) => (
                <div key={i} className="sc-member-avatar-wrap" title={`${m.name} (${m.role})`}>
                  <div className="sc-avatar-circle">{m.name?.charAt(0) || 'U'}</div>
                  <span className={`sc-online-dot ${m.isReady ? 'ready' : ''}`}></span>
                </div>
              ))}
              <button
                type="button"
                className="sc-invite-avatar-btn"
                onClick={handleCopyLink}
                title="Invite more friends"
              >
                <Plus size={12} />
              </button>
              <span className="sc-members-count-text">
                {members.length} members shopping together
              </span>
            </div>
          </div>

          <div className="sc-active-cart-actions">
            {/* Group / Discussion Code Badge */}
            {activeCart?.shareCode && (
              <div className="sc-code-badge-box">
                <div className="sc-code-badge-left">
                  <span className="sc-code-label">GROUP CODE</span>
                  <span className="sc-code-val">{activeCart.shareCode}</span>
                </div>
                <button
                  type="button"
                  className="sc-code-copy-btn"
                  onClick={handleCopyCode}
                  title="Copy Group Code"
                >
                  <Copy size={13} />
                </button>
              </div>
            )}

            <button className="sc-share-link-btn" onClick={handleShareGroup} title="Share group cart via system share or copy link">
              {copiedLink ? <Check size={16} /> : <Share2 size={16} />}
              <span>{copiedLink ? 'Copied!' : 'Share Group'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="sc-summary-strip">
        <div className="sc-sum-block">
          <span className="sc-sum-label">Group Cart Total</span>
          <span className="sc-sum-val">₹{totalCost.toLocaleString('en-IN')}</span>
        </div>
        <div className="sc-sum-divider"></div>
        <div className="sc-sum-block">
          <span className="sc-sum-label">Split Per Person ({members.length} members)</span>
          <span className="sc-sum-val highlight">₹{costPerPerson.toLocaleString('en-IN')} / member</span>
        </div>
        <div className="sc-sum-divider"></div>
        <div className="sc-sum-block">
          <span className="sc-sum-label">Readiness Consensus</span>
          <span className="sc-sum-val status">
            {readyCount === members.length ? '✅ Everyone Ready' : `⏳ ${readyCount}/${members.length} Ready`}
          </span>
        </div>
        <button
          className={`sc-ready-toggle-btn ${currentMember?.isReady ? 'is-ready' : ''}`}
          onClick={handleToggleReadiness}
        >
          {currentMember?.isReady ? '✅ You are Ready' : 'Mark as Ready'}
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="sc-tabs-header">
        <button
          className={`sc-tab-btn ${activeTab === 'items' ? 'active' : ''}`}
          onClick={() => setActiveTab('items')}
        >
          <ShoppingBag size={16} /> Cart Items ({items.length})
        </button>
        <button
          className={`sc-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <MessageSquare size={16} /> Discussion Chat ({messages.length})
        </button>
        <button
          className={`sc-tab-btn ${activeTab === 'checkout' ? 'active' : ''}`}
          onClick={() => setActiveTab('checkout')}
        >
          <CheckCircle2 size={16} /> Checkout &amp; Split ({readyCount}/{members.length})
        </button>
        <button
          className={`sc-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={16} /> Activity Audit ({activityLog.length})
        </button>
      </div>

      {/* ============================================================ */}
      {/* 2. TAB 1: SHARED CART ITEMS LIST (Screen 2)                  */}
      {/* ============================================================ */}
      {activeTab === 'items' && (
        <div className="sc-items-view">
          {/* Quick Add / Search Filter Bar */}
          <div className="sc-items-action-bar">
            <div className="sc-cart-filter-input-wrap">
              <Search size={15} className="sc-filter-icon" />
              <input
                type="text"
                placeholder="Search products in this group cart..."
                value={cartItemsSearch}
                onChange={(e) => setCartItemsSearch(e.target.value)}
                className="sc-cart-filter-input"
              />
            </div>

            <button
              type="button"
              className="sc-add-product-hero-btn"
              onClick={() => setIsProductPickerOpen(true)}
            >
              <Plus size={16} />
              <span>Add Products to Cart</span>
            </button>
          </div>

          {/* Product Cards List */}
          {filteredCartItems.length === 0 ? (
            <div className="sc-empty-state">
              <ShoppingBag size={48} color="#94a3b8" />
              <h3>No items in this shared cart</h3>
              <p>Click "Add Products to Cart" above to browse the catalog and collaborate with your group.</p>
              <button
                type="button"
                className="sc-empty-add-btn"
                onClick={() => setIsProductPickerOpen(true)}
              >
                + Browse Products
              </button>
            </div>
          ) : (
            <div className="sc-items-list-grid">
              {filteredCartItems.map((it) => {
                const p = it.productId && typeof it.productId === 'object' ? it.productId : {};
                const itemName = p.name || it.name || 'Shared Product';
                const itemImg = p.image || (p.images && p.images[0]) || it.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200';
                const itemPrice = p.price != null ? p.price : (it.price ?? 0);
                const itemVendor = p.vendorName || it.vendorName || 'JK Retail';
                const addedByName = it.addedBy?.name || it.addedByName || 'Group Member';
                const quantity = it.quantity || 1;

                const likes = it.votes?.filter((v) => v.vote === 'up' || v.vote === 'agree').length || 0;
                const dislikes = it.votes?.filter((v) => v.vote === 'down' || v.vote === 'disagree').length || 0;
                const commentsCount = it.comments?.length || 0;
                const isLiked = likedItems[it._id];

                return (
                  <div
                    key={it._id}
                    className="sc-item-card-v2"
                    onClick={() => setSelectedVotingItem(it)}
                  >
                    <div className="sc-item-card-left">
                      <img
                        src={itemImg}
                        alt={itemName}
                        className="sc-item-thumb-v2"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200';
                        }}
                      />
                      <button
                        type="button"
                        className={`sc-item-heart-btn ${isLiked ? 'liked' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setLikedItems((prev) => ({ ...prev, [it._id]: !isLiked }));
                        }}
                      >
                        <Heart size={14} fill={isLiked ? '#ef4444' : 'none'} color={isLiked ? '#ef4444' : '#64748b'} />
                      </button>
                    </div>

                    <div className="sc-item-card-center">
                      <div className="sc-item-meta-top">
                        <span className="sc-item-vendor-tag">{itemVendor}</span>
                        <span className="sc-item-added-badge">Added by {addedByName}</span>
                      </div>

                      <h3 className="sc-item-name-v2" title={itemName}>{itemName}</h3>

                      <div className="sc-item-pricing-row">
                        <strong className="sc-item-price-large">₹{(itemPrice * quantity).toLocaleString('en-IN')}</strong>
                        <span className="sc-item-unit-price">₹{itemPrice} each</span>
                        <span className="sc-item-split-pill">₹{Math.round((itemPrice * quantity) / Math.max(members.length, 1))} / person</span>
                      </div>

                      {/* Vote badges row (Screen 2) */}
                      <div className="sc-vote-pills-row">
                        <div className="sc-vote-pill up" title="Upvotes">
                          <ThumbsUp size={12} />
                          <span>{likes}</span>
                        </div>
                        <div className="sc-vote-pill down" title="Downvotes">
                          <ThumbsDown size={12} />
                          <span>{dislikes}</span>
                        </div>
                        <div className="sc-vote-pill comments" title="Comments">
                          <MessageSquare size={12} />
                          <span>{commentsCount}</span>
                        </div>
                        <span className="sc-click-vote-hint">Click card to vote &amp; discuss &rarr;</span>
                      </div>
                    </div>

                    {/* Quantity Stepper [- 1 +] */}
                    <div className="sc-item-card-right" onClick={(e) => e.stopPropagation()}>
                      <div className="sc-qty-stepper">
                        <button
                          type="button"
                          className="sc-stepper-btn"
                          onClick={() => handleUpdateQuantity(it._id, quantity - 1)}
                          title="Decrease Quantity"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="sc-stepper-val">{quantity}</span>
                        <button
                          type="button"
                          className="sc-stepper-btn"
                          onClick={() => handleUpdateQuantity(it._id, quantity + 1)}
                          title="Increase Quantity"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      <button
                        type="button"
                        className="sc-delete-item-btn"
                        onClick={() => handleRemoveItem(it._id)}
                        title="Remove from Cart"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. SCREEN 3: ITEM DETAILS WITH GROUP VOTING MODAL            */}
      {/* ============================================================ */}
      {selectedVotingItem && (
        <div className="sc-modal-overlay" onClick={() => setSelectedVotingItem(null)}>
          <div className="sc-voting-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sc-voting-modal-header">
              <div>
                <span className="sc-badge">🗳️ Group Consensus</span>
                <h3 className="sc-voting-title">Product Voting &amp; Feedback</h3>
              </div>
              <button
                type="button"
                className="sc-close-btn"
                onClick={() => setSelectedVotingItem(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="sc-voting-modal-body">
              {/* Product Hero Info */}
              <div className="sc-vmodal-prod-strip">
                <img
                  src={
                    selectedVotingItem.productId?.image ||
                    (selectedVotingItem.productId?.images && selectedVotingItem.productId?.images[0]) ||
                    selectedVotingItem.image ||
                    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'
                  }
                  alt={selectedVotingItem.name}
                  className="sc-vmodal-thumb"
                />
                <div className="sc-vmodal-info">
                  <h4>{selectedVotingItem.name}</h4>
                  <div className="sc-vmodal-meta">
                    <strong>₹{selectedVotingItem.price}</strong>
                    <span>• Qty: {selectedVotingItem.quantity || 1}</span>
                    <span>• Added by {selectedVotingItem.addedBy?.name || 'Member'}</span>
                  </div>
                </div>
              </div>

              {/* Voting Action Section */}
              <div className="sc-vote-action-section">
                <h4>Cast Your Vote</h4>
                <div className="sc-vote-buttons-grid">
                  <button
                    type="button"
                    className="sc-vote-btn up"
                    onClick={() => handleVote(selectedVotingItem._id, 'up')}
                  >
                    <ThumbsUp size={18} />
                    <span>Agree / Want This</span>
                  </button>
                  <button
                    type="button"
                    className="sc-vote-btn down"
                    onClick={() => handleVote(selectedVotingItem._id, 'down')}
                  >
                    <ThumbsDown size={18} />
                    <span>Disagree / Skip</span>
                  </button>
                  <button
                    type="button"
                    className="sc-vote-btn unsure"
                    onClick={() => handleVote(selectedVotingItem._id, 'unsure')}
                  >
                    <span>🤔 Unsure</span>
                  </button>
                </div>
              </div>

              {/* Live Votes Tally */}
              <div className="sc-votes-tally-box">
                <h4>Votes Recorded ({selectedVotingItem.votes?.length || 0})</h4>
                <div className="sc-votes-list">
                  {selectedVotingItem.votes?.length === 0 ? (
                    <p className="sc-no-votes">No one has voted on this item yet. Be the first!</p>
                  ) : (
                    selectedVotingItem.votes?.map((v, i) => (
                      <div key={i} className="sc-vote-row">
                        <span className="sc-voter-name">{v.customerName || 'Member'}</span>
                        <span className={`sc-vote-chip ${v.vote}`}>
                          {v.vote === 'up' ? '👍 Agreed' : v.vote === 'down' ? '👎 Disagreed' : '🤔 Unsure'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Item Comments Stream */}
              <div className="sc-item-comments-section">
                <h4>Item Discussion ({selectedVotingItem.comments?.length || 0})</h4>
                <div className="sc-item-comments-list">
                  {selectedVotingItem.comments?.length === 0 ? (
                    <p className="sc-no-votes">No comments on this product yet.</p>
                  ) : (
                    selectedVotingItem.comments?.map((c, i) => (
                      <div key={i} className="sc-comment-bubble">
                        <strong>{c.customerName || 'Member'}</strong>
                        <p>{c.text}</p>
                        <span className="sc-comment-time">
                          {new Date(c.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddModalComment} className="sc-item-comment-form">
                  <input
                    type="text"
                    placeholder="Leave feedback on size, color, or price..."
                    value={modalCommentText}
                    onChange={(e) => setModalCommentText(e.target.value)}
                    className="sc-comment-input"
                  />
                  <button type="submit" className="sc-comment-send-btn">
                    <Send size={15} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. TAB 2: DISCUSSION CHAT & LIVE ACTIVITY STREAM (Screen 4)  */}
      {/* ============================================================ */}
      {activeTab === 'chat' && (
        <div className="sc-chat-view-v2">
          <div className="sc-chat-card-v2">
            <div className="sc-chat-header-v2">
              <div className="sc-chat-title-wrap">
                <MessageSquare size={18} className="text-primary" />
                <div>
                  <h3>Group Discussion &amp; Suggestions</h3>
                  <p>Chat with all members of "{activeCart?.name}" in real time</p>
                </div>
              </div>
              <span className="sc-chat-members-count">
                {members.length} members connected
              </span>
            </div>

            {/* Chat Messages Stream */}
            <div className="sc-messages-stream-v2">
              {messages.map((msg, idx) => {
                const isSystem = msg.senderName === 'System';
                const isMe = msg.senderName?.toLowerCase() === currentUserName.toLowerCase();

                if (isSystem) {
                  return (
                    <div key={idx} className="sc-system-msg-v2">
                      <span>{msg.text}</span>
                    </div>
                  );
                }

                return (
                  <div key={idx} className={`sc-msg-bubble-wrap ${isMe ? 'me' : 'them'}`}>
                    <div className="sc-msg-sender-name">{msg.senderName}</div>
                    <div className="sc-msg-bubble">
                      <p>{msg.text}</p>
                      {msg.productPreview && (
                        <div className="sc-msg-product-card">
                          <img src={msg.productPreview.image} alt={msg.productPreview.name} />
                          <div>
                            <h5>{msg.productPreview.name}</h5>
                            <strong>₹{msg.productPreview.price}</strong>
                          </div>
                        </div>
                      )}
                      <span className="sc-msg-timestamp">
                        {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Message Input Bar */}
            <form onSubmit={handleSendMessage} className="sc-chat-input-bar">
              <input
                type="text"
                placeholder="Suggest a product, ask about sizes, or discuss budget..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="sc-chat-input"
              />
              <button
                type="submit"
                disabled={sendingMsg || !newMessage.trim()}
                className="sc-chat-send-btn"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. TAB 3: CHECKOUT & SPLIT CALCULATIONS (Screen 5)           */}
      {/* ============================================================ */}
      {activeTab === 'checkout' && (
        <div className="sc-checkout-view-v2">
          <div className="sc-checkout-grid-v2">
            {/* Left Column: Products Breakdown, Member Readiness & Split Breakdown */}
            <div className="sc-checkout-left">
              {/* Product Breakdown & Consensus Card with Drop Option */}
              <div className="sc-card-v2">
                <div className="sc-card-v2-header">
                  <div>
                    <h3>Cart Items Breakdown &amp; Votes</h3>
                    <p className="sc-card-subtext">Review item consensus, likes/dislikes, or drop products before final payment</p>
                  </div>
                  <span className="sc-readiness-pill">
                    {items.length} {items.length === 1 ? 'Item' : 'Items'}
                  </span>
                </div>

                {items.length === 0 ? (
                  <div className="sc-checkout-no-items">
                    <p>No items in cart to checkout.</p>
                  </div>
                ) : (
                  <div className="sc-checkout-products-list">
                    {items.map((it) => {
                      const p = it.productId && typeof it.productId === 'object' ? it.productId : {};
                      const itemName = p.name || it.name || 'Shared Product';
                      const itemImg = p.image || (p.images && p.images[0]) || it.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200';
                      const itemPrice = p.price != null ? p.price : (it.price ?? 0);
                      const itemVendor = p.vendorName || it.vendorName || 'JK Retail';
                      const quantity = it.quantity || 1;
                      const likes = it.votes?.filter((v) => v.vote === 'up' || v.vote === 'agree').length || 0;
                      const dislikes = it.votes?.filter((v) => v.vote === 'down' || v.vote === 'disagree').length || 0;
                      const commentsCount = it.comments?.length || 0;
                      const perPersonShare = Math.round((itemPrice * quantity) / Math.max(members.length, 1));

                      return (
                        <div key={it._id} className="sc-checkout-item-row">
                          <img
                            src={itemImg}
                            alt={itemName}
                            className="sc-checkout-item-thumb"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200';
                            }}
                          />
                          <div className="sc-checkout-item-info">
                            <div className="sc-checkout-item-top">
                              <span className="sc-checkout-vendor">{itemVendor}</span>
                              <span className="sc-checkout-qty-tag">Qty: {quantity}</span>
                            </div>
                            <h4 className="sc-checkout-item-title" title={itemName}>{itemName}</h4>
                            <div className="sc-checkout-item-pricing">
                              <span className="sc-checkout-price">₹{(itemPrice * quantity).toLocaleString('en-IN')}</span>
                              {splitMode === 'equal' && (
                                <span className="sc-checkout-split-tag">₹{perPersonShare} / person</span>
                              )}
                            </div>
                            <div className="sc-checkout-consensus-row">
                              <button
                                type="button"
                                className="sc-checkout-vote-pill up"
                                onClick={() => setSelectedVotingItem(it)}
                                title="View Upvotes & Feedback"
                              >
                                <ThumbsUp size={12} />
                                <span>{likes}</span>
                              </button>
                              <button
                                type="button"
                                className="sc-checkout-vote-pill down"
                                onClick={() => setSelectedVotingItem(it)}
                                title="View Downvotes & Feedback"
                              >
                                <ThumbsDown size={12} />
                                <span>{dislikes}</span>
                              </button>
                              <button
                                type="button"
                                className="sc-checkout-vote-pill comments"
                                onClick={() => setSelectedVotingItem(it)}
                                title="View Comments & Discussion"
                              >
                                <MessageSquare size={12} />
                                <span>{commentsCount} comments</span>
                              </button>
                            </div>
                          </div>
                          <div className="sc-checkout-item-actions">
                            <button
                              type="button"
                              className="sc-checkout-drop-btn"
                              onClick={() => handleRemoveItem(it._id)}
                              title="Drop this item from shared cart"
                            >
                              <Trash2 size={13} />
                              <span>Drop</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="sc-card-v2">
                <div className="sc-card-v2-header">
                  <h3>Group Members Readiness</h3>
                  <span className="sc-readiness-pill">
                    {readyCount} of {members.length} Ready
                  </span>
                </div>

                <div className="sc-members-readiness-list">
                  {members.map((m, idx) => (
                    <div key={idx} className="sc-readiness-row">
                      <div className="sc-readiness-user">
                        <div className="sc-avatar-circle small">{m.name?.charAt(0) || 'U'}</div>
                        <div className="sc-readiness-user-info">
                          <span className="sc-readiness-name">{m.name}</span>
                          <span className={`sc-user-role ${m.role === 'creator' ? 'creator' : 'member'}`}>
                            {m.role === 'creator' ? '👑 Creator' : 'Member'}
                          </span>
                        </div>
                      </div>
                      <span className={`sc-ready-badge ${m.isReady ? 'ready' : 'waiting'}`}>
                        {m.isReady ? '✅ Ready to Order' : '⏳ Reviewing'}
                      </span>
                    </div>
                  ))}
                </div>

                {readyCount !== members.length && (
                  <div className="sc-readiness-alert">
                    <span>⚠️ Some members are still deciding. You can still proceed or nudge them in chat!</span>
                  </div>
                )}
              </div>

              {/* Split Mode Selector */}
              <div className="sc-card-v2">
                <div className="sc-card-v2-header">
                  <h3>Bill Splitting Preference</h3>
                </div>
                <div className="sc-split-mode-toggle">
                  <button
                    type="button"
                    className={`sc-split-btn ${splitMode === 'equal' ? 'active' : ''}`}
                    onClick={() => setSplitMode('equal')}
                  >
                    🤝 Split Equally (₹{costPerPerson} each)
                  </button>
                  <button
                    type="button"
                    className={`sc-split-btn ${splitMode === 'single' ? 'active' : ''}`}
                    onClick={() => setSplitMode('single')}
                  >
                    👤 One Person Pays All (₹{totalCost})
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Cost Summary */}
            <div className="sc-checkout-right">
              <div className="sc-order-summary-card">
                <h3>Collective Order Summary</h3>
                <div className="sc-cost-row">
                  <span>Cart Items Subtotal ({items.length} items)</span>
                  <span>₹{subtotalCost.toLocaleString('en-IN')}</span>
                </div>
                <div className="sc-cost-row discount">
                  <span>Group Discount (10% Volume Perk)</span>
                  <span>- ₹{groupDiscount.toLocaleString('en-IN')}</span>
                </div>
                <div className="sc-cost-row">
                  <span>Standard Delivery</span>
                  <span className="sc-free-text">FREE</span>
                </div>
                <div className="sc-cost-row">
                  <span>Taxes &amp; GST (5%)</span>
                  <span>₹{taxes.toLocaleString('en-IN')}</span>
                </div>

                <div className="sc-cost-divider"></div>

                <div className="sc-cost-row grand-total">
                  <strong>Total Payable</strong>
                  <strong>₹{totalCost.toLocaleString('en-IN')}</strong>
                </div>

                {splitMode === 'equal' && (
                  <div className="sc-split-reminder-strip">
                    <span>Your Share Today:</span>
                    <strong>₹{costPerPerson.toLocaleString('en-IN')}</strong>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="sc-final-checkout-actions">
                <button
                  type="button"
                  className="sc-proceed-final-btn"
                  onClick={() => {
                    toast.success(`Proceeding to Collective Group Checkout for "${activeCart?.name}"! Split: ₹${costPerPerson.toLocaleString('en-IN')} per member.`);
                    navigate('/customer/checkout');
                  }}
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight size={17} />
                </button>

                <div className="sc-aux-actions-row">
                  <button type="button" className="sc-aux-btn" onClick={handleCopyLink}>
                    <Share2 size={13} />
                    <span>Share Summary</span>
                  </button>
                  <button type="button" className="sc-aux-btn" onClick={() => toast.success('Group Cart saved to account!')}>
                    <Bookmark size={13} />
                    <span>Save For Later</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. TAB 4: ACTIVITY AUDIT LOG                                 */}
      {/* ============================================================ */}
      {activeTab === 'history' && (
        <div className="sc-history-view-v2">
          <div className="sc-history-card-v2">
            <div className="sc-history-header-v2">
              <History size={20} className="text-primary" />
              <div>
                <h3>Collaborative Activity Audit Stream</h3>
                <p>Complete record of item additions, group voting, and consensus changes</p>
              </div>
            </div>

            {activityLog.length === 0 ? (
              <div className="sc-history-empty-v2">
                <Clock size={36} color="#94a3b8" />
                <p>No activity records logged yet.</p>
              </div>
            ) : (
              <div className="sc-activity-timeline-list">
                {activityLog.slice().reverse().map((act, idx) => (
                  <div key={idx} className="sc-activity-entry">
                    <div className="sc-act-icon-wrap">
                      {act.action === 'vote' ? '👍' : act.action === 'item_added' ? '🛍️' : act.action === 'ready_toggle' ? '✅' : '📌'}
                    </div>
                    <div className="sc-act-body">
                      <div className="sc-act-top">
                        <strong>{act.userName || 'Member'}</strong>
                        <span className="sc-act-date">
                          {new Date(act.createdAt || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                          {new Date(act.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="sc-act-details">{act.details}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom Non-Native Product Picker Modal (Real MongoDB Query) */}
      {isProductPickerOpen && (
        <div className="sc-modal-overlay" onClick={() => setIsProductPickerOpen(false)}>
          <div className="sc-picker-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sc-picker-modal-header">
              <div>
                <h3 className="sc-picker-title">Add Products to Shared Cart</h3>
                <p className="sc-picker-sub">Pick items from the catalog for group voting and collective checkout</p>
              </div>
              <button
                type="button"
                className="sc-picker-close-btn"
                onClick={() => setIsProductPickerOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="sc-picker-search-bar">
              <Search size={16} className="sc-search-icon" />
              <input
                type="text"
                placeholder="Search products by title, category, or brand..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="sc-picker-input"
                autoFocus
              />
              {catalogSearch && (
                <button
                  type="button"
                  className="sc-clear-search-btn"
                  onClick={() => setCatalogSearch('')}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="sc-picker-cats-row">
              {categoriesList.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`sc-picker-cat-pill ${selectedProductCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedProductCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="sc-picker-grid">
              {loadingCatalog ? (
                <div className="sc-picker-empty">
                  <div className="sc-spinner"></div>
                  <p>Searching marketplace products...</p>
                </div>
              ) : catalogProducts.length === 0 ? (
                <div className="sc-picker-empty">
                  <ShoppingBag size={32} color="#94a3b8" />
                  <p>No matching products found</p>
                </div>
              ) : (
                catalogProducts.map((p) => {
                  const isAdding = addingProductId === (p._id || p.id);
                  const imgSrc = p.image || (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200';
                  return (
                    <div key={p._id || p.id} className="sc-picker-item-card">
                      <img src={imgSrc} alt={p.name} className="sc-picker-item-img" />
                      <div className="sc-picker-item-info">
                        <span className="sc-picker-item-cat">{p.category || 'General'}</span>
                        <h4 className="sc-picker-item-name" title={p.name}>{p.name}</h4>
                        <div className="sc-picker-item-bottom">
                          <span className="sc-picker-item-price">
                            ₹{Number(p.price || 0).toLocaleString('en-IN')}
                          </span>
                          <button
                            type="button"
                            className="sc-picker-add-btn"
                            disabled={isAdding}
                            onClick={() => handleQuickAddProduct(p)}
                          >
                            {isAdding ? 'Adding...' : '+ Add to Cart'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Screen 1: Create Cart Modal */}
      {isCreateModalOpen && (
        <CreateSharedCartModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={(newCart) => {
            loadCarts();
            setActiveCart(newCart);
          }}
        />
      )}

      {/* Join with Code Modal */}
      {isJoinCodeModalOpen && (
        <div className="sc-modal-overlay" onClick={() => setIsJoinCodeModalOpen(false)}>
          <div className="sc-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="sc-modal-header">
              <div>
                <span className="sc-badge">🔑 Private Access</span>
                <h3 className="sc-modal-title">Join Shared Cart</h3>
                <p className="sc-modal-sub">Enter the code shared by your friend or family member</p>
              </div>
              <button className="sc-close-btn" onClick={() => setIsJoinCodeModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
              <div>
                <label className="sc-field-label">Cart Code</label>
                <input
                  type="text"
                  placeholder="e.g. CART-E2A4F1"
                  value={inputJoinCode}
                  onChange={(e) => setInputJoinCode(e.target.value.toUpperCase())}
                  className="sc-text-input"
                  autoFocus
                />
              </div>

              <div>
                <label className="sc-field-label">Your Name</label>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  className="sc-text-input"
                />
              </div>

              <div className="sc-modal-actions" style={{ marginTop: '10px' }}>
                <button type="button" className="sc-cancel-btn" onClick={() => setIsJoinCodeModalOpen(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="sc-submit-btn"
                  disabled={joining || !inputJoinCode.trim()}
                  onClick={() => handleJoinCart(inputJoinCode)}
                >
                  {joining ? 'Joining...' : 'Join Cart'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
