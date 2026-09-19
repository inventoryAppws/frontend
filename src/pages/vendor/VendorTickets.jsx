import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Headphones,
  Search,
  Filter,
  Plus,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  ChevronRight,
  User,
  ShoppingBag,
  ExternalLink,
  Store,
  RefreshCw,
  ShieldAlert,
  ArrowLeft,
  X
} from 'lucide-react';
import {
  getVendorTickets,
  createVendorTicket,
  replyVendorTicket,
  resolveVendorTicket
} from '../../services/ticketService';
import { toast } from '../../components/Toast';
import Loader from '../../components/Loader';
import Modal from '../../components/Modal';
import CustomSelect from '../../components/CustomSelect';
import AiWriteButton from '../../components/AiWriteButton';
import { formatDate, formatDateTime } from '../../utils/dateFormatter';
import { getErrorMessage } from '../../utils/errorHandler';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' }
];

const CATEGORY_OPTIONS = [
  { value: 'payout', label: 'Payments & Payouts' },
  { value: 'order', label: 'Order Dispute / Shipping' },
  { value: 'product', label: 'Product / Catalog Approval' },
  { value: 'technical', label: 'Platform / Technical Issue' },
  { value: 'general', label: 'General Support' }
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low Priority' },
  { value: 'medium', label: 'Medium Priority' },
  { value: 'high', label: 'High Priority' },
  { value: 'urgent', label: 'Urgent Priority' }
];

const STATUS_BADGES = {
  open: { label: 'Open', bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  in_progress: { label: 'In Progress', bg: '#fef3c7', color: '#d97706', border: '#fde68a' },
  waiting_customer: { label: 'Waiting on Customer', bg: '#f3e8ff', color: '#7e22ce', border: '#e9d5ff' },
  resolved: { label: 'Resolved', bg: '#ecfdf5', color: '#16a34a', border: '#a7f3d0' },
  closed: { label: 'Closed', bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1' }
};

const PRIORITY_BADGES = {
  low: { label: 'Low', color: '#64748b', bg: '#f8fafc' },
  medium: { label: 'Medium', color: '#0284c7', bg: '#f0f9ff' },
  high: { label: 'High', color: '#ea580c', bg: '#fff7ed' },
  urgent: { label: 'Urgent', color: '#dc2626', bg: '#fef2f2' }
};

export default function VendorTickets() {
  const [activeTab, setActiveTab] = useState('customer_inquiries'); // 'customer_inquiries' | 'merchant_support'
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // New ticket to Admin modal
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [newTicketForm, setNewTicketForm] = useState({
    subject: '',
    category: 'payout',
    priority: 'medium',
    description: ''
  });
  const [creatingTicket, setCreatingTicket] = useState(false);

  // Resolve Ticket modal
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [resolvingTicket, setResolvingTicket] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getVendorTickets({
        tab: activeTab === 'customer_inquiries' ? 'customer' : 'merchant',
        status: statusFilter,
        q: searchQuery
      });
      const list = Array.isArray(data?.tickets) ? data.tickets : Array.isArray(data?.items) ? data.items : [];
      setTickets(list);

      // Keep selected ticket in sync if still present
      setSelectedTicket((prev) => {
        if (!prev) return null;
        return list.find((t) => t._id === prev._id) || null;
      });
    } catch (err) {
      toast.error(getErrorMessage(err) || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [activeTab, statusFilter, searchQuery]);

  useEffect(() => {
    fetchTickets();
  }, [activeTab, statusFilter]);

  const stats = useMemo(() => {
    const total = tickets.length;
    const openCount = tickets.filter((t) => ['open', 'in_progress'].includes(t.status)).length;
    const resolvedCount = tickets.filter((t) => ['resolved', 'closed'].includes(t.status)).length;
    return { total, openCount, resolvedCount };
  }, [tickets]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;
    setSendingReply(true);
    try {
      const res = await replyVendorTicket(selectedTicket._id, replyText.trim());
      toast.success('Reply sent successfully!');
      setReplyText('');
      if (res.ticket) {
        setSelectedTicket(res.ticket);
        setTickets((prev) => prev.map((t) => (t._id === res.ticket._id ? res.ticket : t)));
      } else {
        fetchTickets();
      }
    } catch (err) {
      toast.error(getErrorMessage(err) || 'Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const handleResolveTicket = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setResolvingTicket(true);
    try {
      const res = await resolveVendorTicket(selectedTicket._id, resolutionSummary.trim());
      toast.success('Ticket marked as resolved! Customer notified via email.');
      setIsResolveModalOpen(false);
      setResolutionSummary('');
      if (res.ticket) {
        setSelectedTicket(res.ticket);
        setTickets((prev) => prev.map((t) => (t._id === res.ticket._id ? res.ticket : t)));
      } else {
        fetchTickets();
      }
    } catch (err) {
      toast.error(getErrorMessage(err) || 'Failed to resolve ticket');
    } finally {
      setResolvingTicket(false);
    }
  };

  const handleCreateAdminTicket = async (e) => {
    e.preventDefault();
    if (!newTicketForm.subject.trim() || !newTicketForm.description.trim()) {
      toast.error('Please enter a subject and description');
      return;
    }
    setCreatingTicket(true);
    try {
      const res = await createVendorTicket(newTicketForm);
      toast.success('Support ticket submitted to Admin Desk!');
      setIsNewTicketOpen(false);
      setNewTicketForm({ subject: '', category: 'payout', priority: 'medium', description: '' });
      setActiveTab('merchant_support');
      fetchTickets();
      if (res.ticket) setSelectedTicket(res.ticket);
    } catch (err) {
      toast.error(getErrorMessage(err) || 'Failed to create ticket');
    } finally {
      setCreatingTicket(false);
    }
  };

  return (
    <div className="vendor-tickets-page" style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* HEADER BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#0d9488', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Headphones size={22} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>Support Desk &amp; Tickets</h1>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>
                Resolve customer order inquiries &amp; coordinate with Admin Support Desk
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={fetchTickets}
            title="Refresh tickets"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 14px' }}
          >
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsNewTicketOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 16px', background: '#0d9488', borderColor: '#0d9488' }}
          >
            <Plus size={16} />
            <span>Contact Admin Desk</span>
          </button>
        </div>
      </div>

      {/* STATS STRIP */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#f0fdfa', color: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquare size={20} />
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>{stats.total}</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Total Tickets</div>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#2563eb' }}>{stats.openCount}</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Action Needed / Open</div>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#ecfdf5', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#16a34a' }}>{stats.resolvedCount}</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Resolved Tickets</div>
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKBENCH */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedTicket ? '400px 1fr' : '1fr', gap: '20px' }}>
        {/* LEFT COLUMN: LIST VIEW */}
        <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* TABS HEADER */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <button
              type="button"
              onClick={() => { setActiveTab('customer_inquiries'); setSelectedTicket(null); }}
              style={{
                flex: 1,
                padding: '12px 14px',
                border: 'none',
                background: activeTab === 'customer_inquiries' ? '#fff' : 'transparent',
                fontWeight: activeTab === 'customer_inquiries' ? 700 : 500,
                color: activeTab === 'customer_inquiries' ? '#0d9488' : '#64748b',
                borderBottom: activeTab === 'customer_inquiries' ? '2px solid #0d9488' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Customer Inquiries
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('merchant_support'); setSelectedTicket(null); }}
              style={{
                flex: 1,
                padding: '12px 14px',
                border: 'none',
                background: activeTab === 'merchant_support' ? '#fff' : 'transparent',
                fontWeight: activeTab === 'merchant_support' ? 700 : 500,
                color: activeTab === 'merchant_support' ? '#0d9488' : '#64748b',
                borderBottom: activeTab === 'merchant_support' ? '2px solid #0d9488' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Merchant Support Desk
            </button>
          </div>

          {/* SEARCH & FILTERS */}
          <div style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '10px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={15} style={{ position: 'absolute', left: 10, top: 10, color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search tickets, subject, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px 7px 32px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                  outline: 'none'
                }}
              />
            </div>
            <div style={{ minWidth: '145px' }}>
              <CustomSelect
                options={STATUS_OPTIONS}
                value={statusFilter}
                onChange={(val) => setStatusFilter(val)}
                size="sm"
                placeholder="All Statuses"
              />
            </div>
          </div>

          {/* TICKETS LIST */}
          <div style={{ maxHeight: 'calc(100vh - 350px)', minHeight: '400px', overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <Loader text="Loading tickets..." />
              </div>
            ) : tickets.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                <Headphones size={32} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                <h4 style={{ margin: 0, color: '#475569', fontSize: '14px' }}>No tickets found</h4>
                <p style={{ fontSize: '12px', marginTop: '4px' }}>
                  {activeTab === 'customer_inquiries'
                    ? 'No customer inquiries for your products at the moment.'
                    : 'You haven’t raised any support tickets to Admin yet.'}
                </p>
              </div>
            ) : (
              tickets.map((t) => {
                const sBadge = STATUS_BADGES[t.status] || STATUS_BADGES.open;
                const pBadge = PRIORITY_BADGES[t.priority] || PRIORITY_BADGES.medium;
                const isSelected = selectedTicket?._id === t._id;

                return (
                  <div
                    key={t._id}
                    onClick={() => setSelectedTicket(t)}
                    style={{
                      padding: '14px 16px',
                      borderBottom: '1px solid #f1f5f9',
                      cursor: 'pointer',
                      background: isSelected ? '#f0fdfa' : '#fff',
                      borderLeft: isSelected ? '4px solid #0d9488' : '4px solid transparent',
                      transition: 'background 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 600, color: '#64748b' }}>
                        {t.ticketNumber || `#TCK-${t._id.slice(-6).toUpperCase()}`}
                      </span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: pBadge.bg, color: pBadge.color }}>
                          {pBadge.label}
                        </span>
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: sBadge.bg, color: sBadge.color, border: `1px solid ${sBadge.border}` }}>
                          {sBadge.label}
                        </span>
                      </div>
                    </div>

                    <h4 style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.subject}
                    </h4>

                    <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#64748b', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {t.description}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#94a3b8' }}>
                      <span>{t.customerName || t.customerEmail || 'Customer'}</span>
                      <span>{formatDate(t.createdAt)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: THREAD & REPLIES DETAIL VIEW */}
        {selectedTicket ? (
          <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 270px)', overflow: 'hidden' }}>
            {/* THREAD HEADER */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '12px', color: '#0d9488' }}>
                    {selectedTicket.ticketNumber || `#TCK-${selectedTicket._id.slice(-6).toUpperCase()}`}
                  </span>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: STATUS_BADGES[selectedTicket.status]?.bg, color: STATUS_BADGES[selectedTicket.status]?.color, fontWeight: 700 }}>
                    {STATUS_BADGES[selectedTicket.status]?.label}
                  </span>
                  <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: PRIORITY_BADGES[selectedTicket.priority]?.bg, color: PRIORITY_BADGES[selectedTicket.priority]?.color, fontWeight: 700 }}>
                    {PRIORITY_BADGES[selectedTicket.priority]?.label} Priority
                  </span>
                </div>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{selectedTicket.subject}</h2>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  Customer: <strong>{selectedTicket.customerName || 'Customer'}</strong> ({selectedTicket.customerEmail || 'No email'})
                  {selectedTicket.orderDisplayId && (
                    <span style={{ marginLeft: '10px' }}>
                      • Order: <strong>#{selectedTicket.orderDisplayId}</strong>
                    </span>
                  )}
                  {selectedTicket.productName && (
                    <span style={{ marginLeft: '10px' }}>
                      • Product: <strong>{selectedTicket.productName}</strong>
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setIsResolveModalOpen(true)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#16a34a', borderColor: '#16a34a' }}
                  >
                    <CheckCircle2 size={14} />
                    <span>Resolve Ticket</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', padding: '6px' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* MESSAGES THREAD */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Initial Customer Request Card */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e2e8f0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User size={18} />
                </div>
                <div style={{ flex: 1, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <strong style={{ fontSize: '13px', color: '#0f172a' }}>{selectedTicket.customerName || 'Customer'}</strong>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{formatDateTime(selectedTicket.createdAt)}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                    {selectedTicket.description}
                  </p>
                </div>
              </div>

              {/* Resolution Summary banner if resolved */}
              {selectedTicket.resolutionSummary && (
                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '12px 16px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <CheckCircle2 size={18} style={{ color: '#16a34a', marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <strong style={{ fontSize: '13px', color: '#065f46' }}>Resolution Note</strong>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#047857' }}>{selectedTicket.resolutionSummary}</p>
                    <span style={{ fontSize: '10px', color: '#059669', display: 'block', marginTop: '4px' }}>
                      Resolved at {formatDateTime(selectedTicket.resolvedAt || selectedTicket.updatedAt)}
                    </span>
                  </div>
                </div>
              )}

              {/* Replies Timeline */}
              {Array.isArray(selectedTicket.messages) &&
                selectedTicket.messages.map((msg, idx) => {
                  const isVendor = msg.senderRole === 'vendor';
                  const isAdmin = msg.senderRole === 'admin';
                  const isAi = msg.senderRole === 'system' || msg.senderRole === 'ai';

                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        gap: '12px',
                        flexDirection: isVendor ? 'row-reverse' : 'row'
                      }}
                    >
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: isVendor ? '#0d9488' : isAdmin ? '#7c3aed' : isAi ? '#3b82f6' : '#e2e8f0',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        {isVendor ? <Store size={18} /> : isAdmin ? <ShieldAlert size={18} /> : <User size={18} />}
                      </div>

                      <div
                        style={{
                          maxWidth: '75%',
                          background: isVendor ? '#f0fdfa' : isAdmin ? '#f5f3ff' : '#fff',
                          border: `1px solid ${isVendor ? '#99f6e4' : isAdmin ? '#ddd6fe' : '#e2e8f0'}`,
                          borderRadius: '12px',
                          padding: '12px 16px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: isVendor ? '#0d9488' : isAdmin ? '#7c3aed' : '#0f172a' }}>
                            {msg.senderName || (isVendor ? 'Store Merchant' : isAdmin ? 'Admin Support Desk' : 'Customer')}
                          </span>
                          <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                            {formatDateTime(msg.createdAt || msg.timestamp)}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '13px', color: '#1e293b', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                          {msg.message || msg.text}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* REPLY COMPOSER */}
            {selectedTicket.status !== 'closed' ? (
              <div style={{ padding: '14px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                    Response to {selectedTicket.userName || 'Customer'}:
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <AiWriteButton
                      task="support_reply"
                      input={replyText}
                      context={{
                        customerName: selectedTicket.userName || 'Customer',
                        subject: selectedTicket.subject,
                        status: selectedTicket.status,
                        history: (selectedTicket.messages || []).slice(-3).map(m => `${m.senderName}: ${m.text || m.message}`).join(' | ')
                      }}
                      onGenerated={(res) => {
                        if (res?.message) setReplyText(res.message);
                        else if (res?.result) setReplyText(res.result);
                        else if (res?.text) setReplyText(res.text);
                      }}
                      label="✨ AI Draft Reply"
                      size="small"
                      title="Draft seller response with Ollama / Groq AI"
                    />
                    {replyText.trim() && (
                      <AiWriteButton
                        task="refine_text"
                        input={replyText}
                        context={{ tone: 'polite, clear vendor merchant support reply' }}
                        onGenerated={(res) => {
                          if (res?.result) setReplyText(res.result);
                          else if (res?.text) setReplyText(res.text);
                        }}
                        label="✨ Polish"
                        size="small"
                      />
                    )}
                  </div>
                </div>

                <form onSubmit={handleSendReply} style={{ display: 'flex', gap: '10px' }}>
                  <textarea
                    rows={2}
                    placeholder="Type your response to the customer or admin..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      resize: 'none',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={sendingReply || !replyText.trim()}
                    className="btn btn-primary"
                    style={{
                      background: '#0d9488',
                      borderColor: '#0d9488',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '0 20px',
                      fontSize: '13px'
                    }}
                  >
                    <Send size={15} />
                    <span>{sendingReply ? 'Sending...' : 'Reply'}</span>
                  </button>
                </form>
              </div>
            ) : (
              <div style={{ padding: '14px', background: '#f1f5f9', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
                This ticket has been closed.
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* MODAL: CREATE TICKET TO ADMIN DESK */}
      <Modal
        isOpen={isNewTicketOpen}
        onClose={() => setIsNewTicketOpen(false)}
        title="Contact Admin Support Desk"
        size="medium"
      >
        <form onSubmit={handleCreateAdminTicket} className="modal-form">
          <div className="form-group">
            <label>Subject / Topic <span style={{ color: '#ef4444' }}>*</span></label>
            <input
              type="text"
              required
              placeholder="e.g. Payout settlement delay for batch #402"
              value={newTicketForm.subject}
              onChange={(e) => setNewTicketForm({ ...newTicketForm, subject: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#334155' }}>Category</label>
              <CustomSelect
                options={CATEGORY_OPTIONS}
                value={newTicketForm.category}
                onChange={(val) => setNewTicketForm({ ...newTicketForm, category: val })}
                size="md"
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#334155' }}>Priority</label>
              <CustomSelect
                options={PRIORITY_OPTIONS}
                value={newTicketForm.priority}
                onChange={(val) => setNewTicketForm({ ...newTicketForm, priority: val })}
                size="md"
              />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                Detailed Message <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <AiWriteButton
                  task="vendor_ticket"
                  input={newTicketForm.description}
                  context={{
                    subject: newTicketForm.subject,
                    category: newTicketForm.category,
                    priority: newTicketForm.priority
                  }}
                  onGenerated={(res) => {
                    if (res?.message) setNewTicketForm(prev => ({ ...prev, description: res.message }));
                    else if (res?.result) setNewTicketForm(prev => ({ ...prev, description: res.result }));
                    else if (res?.text) setNewTicketForm(prev => ({ ...prev, description: res.text }));
                  }}
                  label="✨ AI Draft Message"
                  size="small"
                  title="Generate structured merchant message using Ollama / Groq"
                />
                {newTicketForm.description.trim() && (
                  <AiWriteButton
                    task="refine_text"
                    input={newTicketForm.description}
                    context={{ tone: 'professional, clear business communication' }}
                    onGenerated={(res) => {
                      if (res?.result) setNewTicketForm(prev => ({ ...prev, description: res.result }));
                      else if (res?.text) setNewTicketForm(prev => ({ ...prev, description: res.text }));
                    }}
                    label="✨ Polish"
                    size="small"
                  />
                )}
              </div>
            </div>
            <textarea
              rows={4}
              required
              placeholder="Explain the issue thoroughly so admin support can expedite assistance..."
              value={newTicketForm.description}
              onChange={(e) => setNewTicketForm({ ...newTicketForm, description: e.target.value })}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsNewTicketOpen(false)}
              disabled={creatingTicket}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={creatingTicket}
              style={{ background: '#0d9488', borderColor: '#0d9488' }}
            >
              {creatingTicket ? 'Submitting...' : 'Submit to Admin Desk'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: RESOLVE TICKET */}
      <Modal
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        title="Resolve Customer Ticket"
        size="small"
      >
        <form onSubmit={handleResolveTicket} className="modal-form">
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: 0 }}>
            Closing this ticket will send a formal resolution email and in-app notification to the customer with your notes.
          </p>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                Resolution Summary Note <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <AiWriteButton
                task="resolution_summary"
                input={resolutionSummary}
                context={{
                  subject: selectedTicket?.subject,
                  customerName: selectedTicket?.userName
                }}
                onGenerated={(res) => {
                  if (res?.message) setResolutionSummary(res.message);
                  else if (res?.result) setResolutionSummary(res.result);
                  else if (res?.text) setResolutionSummary(res.text);
                }}
                label="✨ AI Summary Note"
                size="small"
              />
            </div>
            <textarea
              rows={3}
              required
              placeholder="e.g. Replacement dispatched via BlueDart, tracking provided."
              value={resolutionSummary}
              onChange={(e) => setResolutionSummary(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsResolveModalOpen(false)}
              disabled={resolvingTicket}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={resolvingTicket}
              style={{ background: '#16a34a', borderColor: '#16a34a' }}
            >
              {resolvingTicket ? 'Resolving...' : 'Confirm Resolution'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

