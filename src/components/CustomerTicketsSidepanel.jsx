import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Headphones,
  BookOpen,
  Ticket,
  PhoneCall,
  Search,
  Truck,
  RotateCcw,
  CreditCard,
  User,
  ShoppingBag,
  Tag,
  Plus,
  ChevronRight,
  ChevronLeft,
  FileText,
  Mail,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  MessageSquare,
  ShieldAlert,
  HelpCircle,
  Paperclip
} from 'lucide-react';
import {
  getMyTickets,
  createCustomerTicket,
  replyToTicket,
  resolveOrCloseTicket,
  getTicketById
} from '../services/ticketService';
import { toast } from './Toast';
import AiWriteButton from './AiWriteButton';

const POPULAR_TOPICS = [
  {
    id: 'track_order',
    title: 'Track My Order',
    sub: 'Check order status and delivery updates',
    icon: Truck,
    color: '#2563eb',
    bg: '#eff6ff',
    actionType: 'navigate',
    target: '/customer/orders'
  },
  {
    id: 'returns_refunds',
    title: 'Returns & Refunds',
    sub: 'Return products and check refund status',
    icon: RotateCcw,
    color: '#7c3aed',
    bg: '#f5f3ff',
    actionType: 'event',
    eventName: 'open-return-requests'
  },
  {
    id: 'payment_issues',
    title: 'Payment Issues',
    sub: 'Fix failed payments, refunds and charges',
    icon: CreditCard,
    color: '#059669',
    bg: '#ecfdf5',
    actionType: 'event',
    eventName: 'open-payments-sidepanel'
  },
  {
    id: 'account_profile',
    title: 'Account & Profile',
    sub: 'Update your account, addresses and security',
    icon: User,
    color: '#d97706',
    bg: '#fffbeb',
    actionType: 'navigate',
    target: '/customer/settings'
  },
  {
    id: 'product_stock',
    title: 'Product & Stock',
    sub: 'Product details, availability and more',
    icon: ShoppingBag,
    color: '#db2777',
    bg: '#fdf2f8',
    actionType: 'create_ticket_category',
    category: 'product'
  },
  {
    id: 'offers_coupons',
    title: 'Offers & Coupons',
    sub: 'Apply offers, promo codes and discounts',
    icon: Tag,
    color: '#4f46e5',
    bg: '#eef2ff',
    actionType: 'event',
    eventName: 'open-coupons-sidepanel'
  }
];

export default function CustomerTicketsSidepanel({
  isOpen,
  onClose,
  initialContext = null
}) {
  const navigate = useNavigate();

  // Navigation views: 'help_center' | 'my_tickets' | 'contact_us' | 'create_ticket' | 'ticket_thread'
  const [activeTab, setActiveTab] = useState('help_center');
  const [ticketSubStatus, setTicketSubStatus] = useState('all');

  // Tickets Data
  const [tickets, setTickets] = useState([]);
  const [counts, setCounts] = useState({ all: 0, open: 0, in_progress: 0, resolved: 0, closed: 0 });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Active Selected Ticket for Thread
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // New Ticket Form State
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [newPriority, setNewPriority] = useState('medium');
  const [newMessage, setNewMessage] = useState('');
  const [newOrderId, setNewOrderId] = useState('');
  const [newProductId, setNewProductId] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [newTransactionId, setNewTransactionId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Auto-scroll chat to bottom
  const chatBottomRef = useRef(null);

  // Load tickets list
  const loadTickets = useCallback(async () => {
    if (!isOpen) return;
    try {
      setLoading(true);
      const data = await getMyTickets({
        status: ticketSubStatus,
        q: searchQuery
      });
      setTickets(Array.isArray(data?.tickets) ? data.tickets : []);
      if (data?.counts) setCounts(data.counts);
    } catch (err) {
      console.warn('Failed to load tickets:', err.message);
    } finally {
      setLoading(false);
    }
  }, [isOpen, ticketSubStatus, searchQuery]);

  // Load tickets on mount & open
  useEffect(() => {
    if (isOpen) {
      loadTickets();
    }
  }, [isOpen, loadTickets]);

  // Polling when thread is open
  useEffect(() => {
    if (!isOpen || !selectedTicket) return;
    const interval = setInterval(async () => {
      try {
        const updated = await getTicketById(selectedTicket.ticketId || selectedTicket._id);
        if (updated) setSelectedTicket(updated);
      } catch {}
    }, 8000);
    return () => clearInterval(interval);
  }, [isOpen, selectedTicket]);

  // Scroll chat thread to bottom on message updates
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTicket?.messages]);

  // Handle incoming initial context
  useEffect(() => {
    if (isOpen && initialContext) {
      if (initialContext.ticketId) {
        // Open specific ticket thread
        openTicketThread(initialContext.ticketId);
      } else {
        // Pre-fill create ticket form
        setNewSubject(initialContext.subject || '');
        setNewCategory(initialContext.category || 'order');
        setNewOrderId(initialContext.orderId || '');
        setNewProductId(initialContext.productId || '');
        setNewProductName(initialContext.productName || '');
        setNewTransactionId(initialContext.transactionId || '');
        setActiveTab('create_ticket');
      }
    }
  }, [isOpen, initialContext]);

  // Open ticket conversation thread
  const openTicketThread = async (ticketOrId) => {
    const id = typeof ticketOrId === 'string' ? ticketOrId : ticketOrId.ticketId || ticketOrId._id;
    try {
      setThreadLoading(true);
      const data = await getTicketById(id);
      setSelectedTicket(data);
      setActiveTab('ticket_thread');
    } catch (err) {
      toast.error('Failed to load ticket thread: ' + err.message);
    } finally {
      setThreadLoading(false);
    }
  };

  // Submit reply in thread
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    try {
      setSendingReply(true);
      const res = await replyToTicket(selectedTicket.ticketId, replyText.trim());
      setSelectedTicket(res.ticket);
      setReplyText('');
      loadTickets();
      toast.success('Reply sent!');
    } catch (err) {
      toast.error(err.message || 'Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  // Resolve or Close Ticket
  const handleResolveTicket = async (statusVal = 'resolved') => {
    if (!selectedTicket) return;
    try {
      const summary = statusVal === 'resolved' ? 'Resolved by customer' : 'Closed by customer';
      const res = await resolveOrCloseTicket(selectedTicket.ticketId, statusVal, summary);
      setSelectedTicket(res.ticket);
      loadTickets();
      toast.success(`Ticket #${selectedTicket.ticketId} marked as ${statusVal}! Confirmation email sent.`);
    } catch (err) {
      toast.error(err.message || 'Failed to update ticket');
    }
  };

  // Create new ticket
  const handleCreateTicketSubmit = async (e) => {
    e.preventDefault();
    if (!newSubject.trim()) {
      toast.error('Please enter a ticket subject');
      return;
    }
    if (!newMessage.trim()) {
      toast.error('Please describe your issue');
      return;
    }

    try {
      setSubmitting(true);
      const res = await createCustomerTicket({
        subject: newSubject.trim(),
        category: newCategory,
        priority: newPriority,
        message: newMessage.trim(),
        orderId: newOrderId.trim(),
        productId: newProductId || undefined,
        productName: newProductName.trim(),
        transactionId: newTransactionId.trim()
      });

      toast.success(`Ticket #${res.ticket.ticketId} raised successfully!`);
      // Reset form
      setNewSubject('');
      setNewMessage('');
      setNewOrderId('');
      setNewProductId('');
      setNewProductName('');
      setNewTransactionId('');
      loadTickets();
      // Open the new thread immediately
      openTicketThread(res.ticket);
    } catch (err) {
      toast.error(err.message || 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  // Format relative timestamp
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  // Status Badge Class
  const getStatusBadge = (status) => {
    const s = String(status || 'open').toLowerCase();
    if (s === 'resolved') {
      return <span className="adv-tkt-status-badge resolved">Resolved</span>;
    }
    if (s === 'in_progress') {
      return <span className="adv-tkt-status-badge in_progress">In Progress</span>;
    }
    if (s === 'closed') {
      return <span className="adv-tkt-status-badge closed">Closed</span>;
    }
    return <span className="adv-tkt-status-badge open">Open</span>;
  };

  if (!isOpen) return null;

  return (
    <div className="adv-support-drawer-backdrop" onClick={onClose}>
      <div
        className="adv-support-drawer-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* =========================================================
            HEADER (Matches reference image media_1789719796144.png)
        ========================================================== */}
        <div className="adv-support-header">
          <div className="adv-support-header-left">
            <div className="adv-support-icon-box">
              <Headphones size={22} color="#4f46e5" />
            </div>
            <div>
              <h2 className="adv-support-title">Customer Support</h2>
              <p className="adv-support-subtitle">We&apos;re here to help you</p>
            </div>
          </div>
          <button
            type="button"
            className="adv-support-close-btn"
            onClick={onClose}
            aria-label="Close Support Sidepanel"
          >
            <X size={20} />
          </button>
        </div>

        {/* =========================================================
            TOP 3 NAVIGATION TABS (Help Center | My Tickets | Contact Us)
        ========================================================== */}
        {activeTab !== 'ticket_thread' && activeTab !== 'create_ticket' && (
          <div className="adv-support-nav-tabs">
            <button
              type="button"
              className={`adv-support-tab-btn ${activeTab === 'help_center' ? 'active' : ''}`}
              onClick={() => setActiveTab('help_center')}
            >
              <BookOpen size={16} />
              <span>Help Center</span>
            </button>

            <button
              type="button"
              className={`adv-support-tab-btn ${activeTab === 'my_tickets' ? 'active' : ''}`}
              onClick={() => setActiveTab('my_tickets')}
            >
              <Ticket size={16} />
              <span>My Tickets</span>
              {counts.open + counts.in_progress > 0 && (
                <span className="adv-support-tab-badge">
                  {counts.open + counts.in_progress}
                </span>
              )}
            </button>

            <button
              type="button"
              className={`adv-support-tab-btn ${activeTab === 'contact_us' ? 'active' : ''}`}
              onClick={() => setActiveTab('contact_us')}
            >
              <PhoneCall size={16} />
              <span>Contact Us</span>
            </button>
          </div>
        )}

        {/* =========================================================
            VIEW 1: HELP CENTER (Reference Design Replica)
        ========================================================== */}
        {activeTab === 'help_center' && (
          <div className="adv-support-scroll-content">
            {/* SEARCH FOR HELP */}
            <div className="adv-support-search-wrap">
              <Search size={16} className="adv-support-search-icon" />
              <input
                type="text"
                className="adv-support-search-input"
                placeholder="Search for help (e.g. order, refund, payment...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setActiveTab('my_tickets');
                }}
              />
            </div>

            {/* POPULAR TOPICS (2-COLUMN GRID) */}
            <div className="adv-support-section-title-row">
              <span className="adv-support-section-heading">Popular Topics</span>
              <button
                type="button"
                className="adv-support-view-all-link"
                onClick={() => setActiveTab('my_tickets')}
              >
                View All
              </button>
            </div>

            <div className="adv-support-topics-grid">
              {POPULAR_TOPICS.map((topic) => {
                const IconComponent = topic.icon;
                return (
                  <div
                    key={topic.id}
                    className="adv-support-topic-card"
                    onClick={() => {
                      if (topic.actionType === 'navigate') {
                        onClose();
                        navigate(topic.target);
                      } else if (topic.actionType === 'event') {
                        onClose();
                        window.dispatchEvent(new Event(topic.eventName));
                      } else if (topic.actionType === 'create_ticket_category') {
                        setNewCategory(topic.category);
                        setActiveTab('create_ticket');
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div
                      className="adv-support-topic-icon"
                      style={{ background: topic.bg, color: topic.color }}
                    >
                      <IconComponent size={18} />
                    </div>
                    <div className="adv-support-topic-info">
                      <strong className="adv-support-topic-title">{topic.title}</strong>
                      <p className="adv-support-topic-sub">{topic.sub}</p>
                    </div>
                    <ChevronRight size={15} className="adv-support-topic-chevron" />
                  </div>
                );
              })}
            </div>

            {/* STILL NEED HELP? BANNER CARD */}
            <div className="adv-support-banner-card">
              <div className="adv-support-banner-left">
                <strong>Still need help?</strong>
                <p>Raise a support ticket and our team will get back to you.</p>
              </div>
              <button
                type="button"
                className="adv-support-create-btn"
                onClick={() => setActiveTab('create_ticket')}
              >
                <Plus size={16} />
                <span>Create Ticket</span>
              </button>
            </div>

            {/* RECENT TICKETS SECTION */}
            <div className="adv-support-section-title-row">
              <span className="adv-support-section-heading">Recent Tickets</span>
              <button
                type="button"
                className="adv-support-view-all-link"
                onClick={() => setActiveTab('my_tickets')}
              >
                View All
              </button>
            </div>

            <div className="adv-support-recent-list">
              {tickets.length === 0 ? (
                <div className="adv-support-empty-notice">
                  <Ticket size={24} color="#94a3b8" />
                  <p>No tickets raised yet. Need assistance? Click &quot;Create Ticket&quot;.</p>
                </div>
              ) : (
                tickets.slice(0, 3).map((tkt) => (
                  <div
                    key={tkt.ticketId || tkt._id}
                    className="adv-support-recent-item"
                    onClick={() => openTicketThread(tkt)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="adv-support-recent-status">
                      {getStatusBadge(tkt.status)}
                    </div>
                    <div className="adv-support-recent-details">
                      <strong className="adv-support-recent-subject">{tkt.subject}</strong>
                      <span className="adv-support-recent-meta">
                        Ticket #{tkt.ticketId} • {formatTimeAgo(tkt.createdAt)}
                        {tkt.orderId && ` • Order ${tkt.orderId}`}
                      </span>
                    </div>
                    <ChevronRight size={16} className="adv-support-recent-chevron" />
                  </div>
                ))
              )}
            </div>

            {/* BROWSE HELP ARTICLES CARD */}
            <div
              className="adv-support-article-card"
              onClick={() => setActiveTab('contact_us')}
              role="button"
              tabIndex={0}
            >
              <div className="adv-support-article-icon">
                <FileText size={18} color="#4f46e5" />
              </div>
              <div className="adv-support-article-info">
                <strong>Browse Help Articles</strong>
                <p>Find step-by-step guides and answers to common questions</p>
              </div>
              <ChevronRight size={16} className="adv-support-recent-chevron" />
            </div>
          </div>
        )}

        {/* =========================================================
            VIEW 2: MY TICKETS (Status Tabs, List & Search)
        ========================================================== */}
        {activeTab === 'my_tickets' && (
          <div className="adv-support-scroll-content">
            {/* SUB-STATUS TABS */}
            <div className="adv-tkt-sub-tabs">
              {[
                { key: 'all', label: 'All', count: counts.all },
                { key: 'open', label: 'Open', count: counts.open },
                { key: 'in_progress', label: 'In Progress', count: counts.in_progress },
                { key: 'resolved', label: 'Resolved', count: counts.resolved },
                { key: 'closed', label: 'Closed', count: counts.closed }
              ].map((st) => (
                <button
                  key={st.key}
                  type="button"
                  className={`adv-tkt-sub-tab ${ticketSubStatus === st.key ? 'active' : ''}`}
                  onClick={() => setTicketSubStatus(st.key)}
                >
                  <span>{st.label}</span>
                  <span className="adv-tkt-sub-count">{st.count || 0}</span>
                </button>
              ))}
            </div>

            {/* ACTION BAR: SEARCH & CREATE TICKET */}
            <div className="adv-tkt-action-bar">
              <div className="adv-tkt-search-field">
                <Search size={15} />
                <input
                  type="text"
                  placeholder="Search by ticket ID, subject, order..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')}>
                    <X size={13} />
                  </button>
                )}
              </div>
              <button
                type="button"
                className="adv-tkt-new-btn"
                onClick={() => setActiveTab('create_ticket')}
              >
                <Plus size={15} />
                <span>New Ticket</span>
              </button>
            </div>

            {/* TICKET CARDS LIST */}
            <div className="adv-tkt-cards-container">
              {loading ? (
                <div className="adv-tkt-loading">Loading support tickets...</div>
              ) : tickets.length === 0 ? (
                <div className="adv-tkt-empty">
                  <Ticket size={36} color="#94a3b8" />
                  <h4>No {ticketSubStatus !== 'all' ? ticketSubStatus : ''} tickets found</h4>
                  <p>Have an issue with an order, refund, delivery or product? Raise a ticket.</p>
                  <button
                    type="button"
                    className="adv-support-create-btn"
                    style={{ marginTop: '12px' }}
                    onClick={() => setActiveTab('create_ticket')}
                  >
                    <Plus size={16} /> Create Support Ticket
                  </button>
                </div>
              ) : (
                tickets.map((t) => (
                  <div
                    key={t.ticketId || t._id}
                    className="adv-tkt-card"
                    onClick={() => openTicketThread(t)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="adv-tkt-card-top">
                      <div className="adv-tkt-card-id-row">
                        <span className="adv-tkt-id-tag">#{t.ticketId}</span>
                        <span className={`adv-tkt-priority-pill ${t.priority}`}>
                          {t.priority}
                        </span>
                        <span className="adv-tkt-category-pill">{t.category}</span>
                      </div>
                      {getStatusBadge(t.status)}
                    </div>

                    <h4 className="adv-tkt-card-subject">{t.subject}</h4>

                    {/* Linked Entity Badges */}
                    {(t.orderId || t.productName || t.transactionId) && (
                      <div className="adv-tkt-entity-tags">
                        {t.orderId && (
                          <span className="adv-tkt-entity-badge order">
                            <Truck size={12} /> Order #{t.orderId}
                          </span>
                        )}
                        {t.productName && (
                          <span className="adv-tkt-entity-badge product">
                            <ShoppingBag size={12} /> {t.productName}
                          </span>
                        )}
                        {t.transactionId && (
                          <span className="adv-tkt-entity-badge txn">
                            <CreditCard size={12} /> Txn #{t.transactionId}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Latest Message Preview */}
                    {t.messages && t.messages.length > 0 && (
                      <p className="adv-tkt-last-msg">
                        <strong>
                          {t.messages[t.messages.length - 1].senderName ||
                            t.messages[t.messages.length - 1].sender}
                          :
                        </strong>{' '}
                        {t.messages[t.messages.length - 1].text}
                      </p>
                    )}

                    <div className="adv-tkt-card-footer">
                      <span className="adv-tkt-timestamp">
                        <Clock size={12} /> {formatTimeAgo(t.createdAt)}
                      </span>
                      <span className="adv-tkt-view-thread">
                        Chat Thread ({t.messages ? t.messages.length : 0}) &rarr;
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* =========================================================
            VIEW 3: CREATE TICKET FORM
        ========================================================== */}
        {activeTab === 'create_ticket' && (
          <div className="adv-support-scroll-content">
            <div className="adv-tkt-form-header">
              <button
                type="button"
                className="adv-tkt-back-btn"
                onClick={() => setActiveTab('help_center')}
              >
                <ChevronLeft size={16} /> Back
              </button>
              <h3>Raise Support Ticket</h3>
            </div>

            <form onSubmit={handleCreateTicketSubmit} className="adv-tkt-form">
              {/* Category Picker */}
              <div className="adv-tkt-form-group">
                <label>Issue Category</label>
                <div className="adv-tkt-cat-grid">
                  {[
                    { key: 'order', label: 'Order Issue', icon: Truck },
                    { key: 'product', label: 'Product Quality', icon: ShoppingBag },
                    { key: 'refund', label: 'Refund / Return', icon: RotateCcw },
                    { key: 'payment', label: 'Payment / Txn', icon: CreditCard },
                    { key: 'delivery', label: 'Delivery Delay', icon: Clock },
                    { key: 'ai_assistant', label: 'AI Assistant', icon: Sparkles },
                    { key: 'app_issue', label: 'App / Technical', icon: AlertCircle },
                    { key: 'general', label: 'Other Query', icon: HelpCircle }
                  ].map((cat) => {
                    const CatIcon = cat.icon;
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        className={`adv-tkt-cat-btn ${newCategory === cat.key ? 'selected' : ''}`}
                        onClick={() => setNewCategory(cat.key)}
                      >
                        <CatIcon size={15} />
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subject */}
              <div className="adv-tkt-form-group">
                <label>Ticket Subject *</label>
                <input
                  type="text"
                  placeholder="E.g., Delay in order delivery, defective item, etc."
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  required
                />
              </div>

              {/* Priority */}
              <div className="adv-tkt-form-group">
                <label>Priority</label>
                <div className="adv-tkt-prio-row">
                  {['low', 'medium', 'high', 'urgent'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`adv-tkt-prio-btn ${p} ${newPriority === p ? 'selected' : ''}`}
                      onClick={() => setNewPriority(p)}
                    >
                      {p.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Context Linking */}
              <div className="adv-tkt-form-row-grid">
                <div className="adv-tkt-form-group">
                  <label>Order ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="E.g., ORD-2026..."
                    value={newOrderId}
                    onChange={(e) => setNewOrderId(e.target.value)}
                  />
                </div>
                <div className="adv-tkt-form-group">
                  <label>Product Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="E.g., Wireless Headphones"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                  />
                </div>
              </div>

              {/* Detailed Description */}
              <div className="adv-tkt-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ margin: 0 }}>Detailed Message / Complaint *</label>
                  <AiWriteButton
                    task="support_ticket"
                    input={newMessage}
                    context={{
                      productName: newProductName || 'Purchased Product',
                      orderId: newOrderId || '',
                      category: newCategory
                    }}
                    onGenerated={(res) => {
                      const msg = res.message || res.text || res.result;
                      if (msg) setNewMessage(msg);
                    }}
                    label="✨ AI Draft / Polish"
                    size="small"
                    title="Generate a clear, professional support message based on your details"
                  />
                </div>
                <textarea
                  rows={4}
                  placeholder="Describe what happened with as much detail as possible..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  required
                />
              </div>

              <div className="adv-tkt-form-footer">
                <button
                  type="button"
                  className="adv-tkt-btn-cancel"
                  onClick={() => setActiveTab('help_center')}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="adv-tkt-btn-submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Raise Ticket'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* =========================================================
            VIEW 4: TICKET CHAT THREAD (Real-time Timeline & Replies)
        ========================================================== */}
        {activeTab === 'ticket_thread' && selectedTicket && (
          <div className="adv-support-thread-wrap">
            {/* THREAD HEADER */}
            <div className="adv-thread-top">
              <button
                type="button"
                className="adv-tkt-back-btn"
                onClick={() => {
                  setSelectedTicket(null);
                  setActiveTab('my_tickets');
                }}
              >
                <ChevronLeft size={16} /> All Tickets
              </button>

              <div className="adv-thread-actions">
                {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' ? (
                  <button
                    type="button"
                    className="adv-thread-resolve-btn"
                    onClick={() => handleResolveTicket('resolved')}
                    title="Mark ticket resolved and notify support"
                  >
                    <CheckCircle2 size={14} /> Mark as Resolved
                  </button>
                ) : (
                  <span className="adv-thread-resolved-tag">✓ Issue Resolved</span>
                )}
              </div>
            </div>

            {/* THREAD INFO CARD */}
            <div className="adv-thread-info-card">
              <div className="adv-thread-info-row">
                <span className="adv-tkt-id-tag">#{selectedTicket.ticketId}</span>
                {getStatusBadge(selectedTicket.status)}
                <span className={`adv-tkt-priority-pill ${selectedTicket.priority}`}>
                  {selectedTicket.priority}
                </span>
                <span className="adv-tkt-category-pill">{selectedTicket.category}</span>
              </div>
              <h3 className="adv-thread-subject">{selectedTicket.subject}</h3>

              {(selectedTicket.orderId || selectedTicket.productName) && (
                <div className="adv-tkt-entity-tags" style={{ marginTop: '6px' }}>
                  {selectedTicket.orderId && (
                    <span className="adv-tkt-entity-badge order">
                      <Truck size={12} /> Order #{selectedTicket.orderId}
                    </span>
                  )}
                  {selectedTicket.productName && (
                    <span className="adv-tkt-entity-badge product">
                      <ShoppingBag size={12} /> {selectedTicket.productName}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* CHAT MESSAGES STREAM */}
            <div className="adv-thread-messages-list">
              {threadLoading ? (
                <div className="adv-tkt-loading">Loading message thread...</div>
              ) : (
                (selectedTicket.messages || []).map((msg, i) => {
                  const isCustomer = msg.sender === 'customer' || msg.sender === 'user';
                  const isSystem = msg.sender === 'system';
                  const isAi = msg.sender === 'ai';

                  if (isSystem) {
                    return (
                      <div key={i} className="adv-msg-bubble-system">
                        <span>{msg.text}</span>
                        <span className="adv-msg-time">{formatTimeAgo(msg.createdAt)}</span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={i}
                      className={`adv-msg-row ${isCustomer ? 'outgoing' : 'incoming'}`}
                    >
                      <div className="adv-msg-bubble">
                        <div className="adv-msg-sender-name">
                          {isAi && <Sparkles size={12} color="#06b6d4" />}
                          <strong>{msg.senderName || msg.sender}</strong>
                          <span className="adv-msg-role-tag">{msg.sender.toUpperCase()}</span>
                        </div>
                        <p className="adv-msg-text">{msg.text}</p>
                        <span className="adv-msg-time">{formatTimeAgo(msg.createdAt)}</span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* AI WRITER TOOLBAR IN THREAD */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 16px',
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              fontSize: '11.5px',
              color: '#64748b'
            }}>
              <span style={{ fontSize: '11.5px', color: '#64748b' }}>Quickly draft or polish your reply with AI:</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <AiWriteButton
                  task="refine_text"
                  input={replyText || `Follow-up regarding ${selectedTicket.subject}: thank you for the response, could you please confirm the next steps or tracking details?`}
                  context={{
                    tone: 'polite, clear customer inquiry',
                    subject: selectedTicket.subject,
                    history: (selectedTicket.messages || []).slice(-3).map(m => `${m.sender}: ${m.text}`).join(' | ')
                  }}
                  onGenerated={(res) => {
                    const msg = res.message || res.text || res.result;
                    if (msg) setReplyText(msg);
                  }}
                  label={replyText.trim() ? '✨ Polish Reply' : '✨ AI Quick Reply'}
                  size="small"
                  title="Generate or polish reply with Ollama / Groq AI"
                />
              </div>
            </div>

            {/* REPLY INPUT AREA */}
            <form onSubmit={handleSendReply} className="adv-thread-reply-form">
              <input
                type="text"
                placeholder={
                  selectedTicket.status === 'closed'
                    ? 'This ticket is closed. Type here to re-open...'
                    : 'Type your message or response...'
                }
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                disabled={sendingReply}
              />
              <button
                type="submit"
                className="adv-thread-send-btn"
                disabled={sendingReply || !replyText.trim()}
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        )}

        {/* =========================================================
            VIEW 5: CONTACT US
        ========================================================== */}
        {activeTab === 'contact_us' && (
          <div className="adv-support-scroll-content">
            <div className="adv-contact-card">
              <div className="adv-contact-item">
                <div className="adv-contact-icon blue">
                  <Mail size={20} />
                </div>
                <div className="adv-contact-info">
                  <strong>Email Support</strong>
                  <p>support@inventory.com</p>
                  <span className="adv-contact-badge">Avg. response within 2 hours</span>
                </div>
              </div>

              <div className="adv-contact-item">
                <div className="adv-contact-icon green">
                  <PhoneCall size={20} />
                </div>
                <div className="adv-contact-info">
                  <strong>Toll-Free Helpline</strong>
                  <p>1800-123-4567</p>
                  <span className="adv-contact-badge">9:00 AM - 9:00 PM IST (Mon - Sun)</span>
                </div>
              </div>
            </div>

            {/* QUICK RESOLUTION TIPS */}
            <div className="adv-contact-tips-box">
              <h4>Frequently Asked Questions</h4>
              <ul className="adv-contact-faq-list">
                <li>
                  <strong>How long do refund credits take?</strong>
                  <p>Instant to your platform wallet; 2–4 business days for cards/UPI.</p>
                </li>
                <li>
                  <strong>Can I change my delivery address?</strong>
                  <p>Yes, before warehouse dispatch manifest is printed.</p>
                </li>
                <li>
                  <strong>Damaged or missing item?</strong>
                  <p>Raise a ticket with photos within 7 days of delivery for instant exchange.</p>
                </li>
              </ul>
            </div>

            <button
              type="button"
              className="adv-support-create-btn"
              style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}
              onClick={() => setActiveTab('create_ticket')}
            >
              <Plus size={16} /> Raise Support Ticket
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
