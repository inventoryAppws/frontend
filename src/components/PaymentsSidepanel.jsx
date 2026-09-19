import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X, CreditCard, Wallet, Plus, PlusCircle, RotateCcw,
  Search, Filter, ChevronRight, ShoppingBag, ArrowDownCircle, ArrowUpCircle,
  Headphones
} from 'lucide-react';
import { getTransactions } from '../services/transactionService';
import useDebounce from '../hooks/useDebounce';

const TABS = [
  { key: 'all', label: 'All Transactions' },
  { key: 'payment', label: 'Payments' },
  { key: 'wallet', label: 'Wallet' },
  { key: 'refund', label: 'Refunds' },
  { key: 'wallet_topup', label: 'Recharges' },
];

function groupByDate(items) {
  const groups = {};
  items.forEach((txn) => {
    const d = new Date(txn.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const formattedDate = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    let label;
    if (d.toDateString() === today.toDateString()) label = `Today, ${formattedDate}`;
    else if (d.toDateString() === yesterday.toDateString()) label = `Yesterday, ${formattedDate}`;
    else label = formattedDate;
    
    if (!groups[label]) groups[label] = [];
    groups[label].push(txn);
  });
  return Object.entries(groups);
}

function getTxnStyle(txn) {
  switch (txn.type) {
    case 'wallet_topup':
      return { icon: PlusCircle, color: '#16a34a', bg: '#ecfdf5', prefix: '+' };
    case 'payment':
      return { icon: ShoppingBag, color: '#ef4444', bg: '#fef2f2', prefix: '-' };
    case 'refund':
      return { icon: RotateCcw, color: '#d97706', bg: '#fffbeb', prefix: '+' };
    case 'wallet_debit':
      return { icon: ArrowDownCircle, color: '#ef4444', bg: '#fef2f2', prefix: '-' };
    case 'wallet_credit':
      return { icon: ArrowUpCircle, color: '#16a34a', bg: '#ecfdf5', prefix: '+' };
    default:
      return { icon: CreditCard, color: '#2563eb', bg: '#eff6ff', prefix: '' };
  }
}

function getStatusPill(status) {
  const s = String(status || '').toLowerCase();
  switch (s) {
    case 'success': return { label: 'Success', className: 'txn-pill-success' };
    case 'processed': return { label: 'Processed', className: 'txn-pill-processed' };
    case 'pending': return { label: 'Pending', className: 'txn-pill-pending' };
    case 'failed': return { label: 'Failed', className: 'txn-pill-failed' };
    default: return { label: status || 'Success', className: 'txn-pill-success' };
  }
}

export default function PaymentsSidepanel({
  isOpen,
  onClose,
  walletBalance,
  onRechargeWallet,
  onManagePaymentMethods
}) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  // KPI Summary
  const [summary, setSummary] = useState({
    totalPaid: 0,
    paidCount: 0,
    totalRefunded: 0,
    refundedCount: 0,
    totalRecharged: 0,
    rechargedCount: 0,
    totalCount: 0
  });

  // Filter States
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState('all');
  const filterContainerRef = useRef(null);

  const activeFilterCount = (selectedStatus !== 'all' ? 1 : 0) +
    (selectedMethod !== 'all' ? 1 : 0) +
    (selectedDateRange !== 'all' ? 1 : 0);

  const debouncedSearch = useDebounce(search, 350);

  // Close filter popover on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (filterContainerRef.current && !filterContainerRef.current.contains(e.target)) {
        setIsFilterOpen(false);
      }
    }
    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isFilterOpen]);

  const fetchTransactions = useCallback(async (requestedPage = 1, append = false) => {
    if (!isOpen) return;
    append ? setLoadingMore(true) : setLoading(true);
    try {
      const extraFilters = {
        status: selectedStatus,
        paymentMethod: selectedMethod,
        dateRange: selectedDateRange
      };
      const data = await getTransactions(
        requestedPage,
        20,
        activeTab === 'all' ? '' : activeTab,
        debouncedSearch,
        extraFilters
      );
      const items = data?.items || (Array.isArray(data) ? data : []);
      setTransactions(prev => append ? [...prev, ...items] : items);
      setPage(data?.page || requestedPage);
      setHasMore((data?.page || requestedPage) < (data?.totalPages || 1));
      if (data?.summary) {
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      append ? setLoadingMore(false) : setLoading(false);
    }
  }, [isOpen, activeTab, debouncedSearch, selectedStatus, selectedMethod, selectedDateRange]);

  useEffect(() => {
    if (isOpen) fetchTransactions(1, false);
  }, [fetchTransactions, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setTransactions([]);
      setPage(1);
      setSearch('');
      setActiveTab('all');
      setSelectedStatus('all');
      setSelectedMethod('all');
      setSelectedDateRange('all');
      setIsFilterOpen(false);
      setExpandedId(null);
    }
  }, [isOpen]);

  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loading && !loadingMore) {
          fetchTransactions(page + 1, true);
        }
      },
      { rootMargin: '200px' }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, fetchTransactions, page, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="payments-sidepanel-backdrop" onClick={onClose}>
      <div className="payments-sidepanel-drawer" onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="payments-sidepanel-header">
          <div className="payments-header-info">
            <div className="payments-header-icon-box">
              <CreditCard size={22} />
            </div>
            <div>
              <h2 className="payments-header-title">Payments &amp; Transactions</h2>
              <p className="payments-header-subtitle">Manage your payments, view transaction history, recharge wallet, and track refunds.</p>
            </div>
          </div>
          <button type="button" className="payments-sidepanel-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* WALLET BALANCE CARD */}
        <div className="payments-wallet-card">
          <div className="payments-wallet-left">
            <div className="payments-wallet-icon-box">
              <Wallet size={22} />
            </div>
            <div>
              <span className="payments-wallet-label">Wallet Balance</span>
              <h3 className="payments-wallet-amount">₹{Number(walletBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
              <button type="button" className="payments-wallet-details-link" onClick={onRechargeWallet}>
                View Wallet Details &rarr;
              </button>
            </div>
          </div>
          <button type="button" className="payments-add-money-btn" onClick={onRechargeWallet}>
            <Plus size={16} /> Add Money
          </button>
        </div>

        {/* KPI METRIC CARDS WITH AMOUNTS (PAYMENTS, REFUNDS, RECHARGES, ACTIVITY) */}
        <div className="payments-kpi-grid">
          {/* KPI 1: Payments (Total Paid) */}
          <div
            className={`payments-kpi-card ${activeTab === 'payment' ? 'active' : ''}`}
            onClick={() => { setActiveTab('payment'); setPage(1); }}
            role="button"
            tabIndex={0}
            title="Click to view all Payments"
          >
            <div className="kpi-card-top">
              <div className="kpi-icon-bubble red">
                <ShoppingBag size={14} />
              </div>
              <span className="kpi-badge-count">{summary.paidCount || 0} orders</span>
            </div>
            <div className="kpi-amount-val">
              ₹{Number(summary.totalPaid || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <div className="kpi-label-text">Total Paid</div>
          </div>

          {/* KPI 2: Refunds (Total Refunded) */}
          <div
            className={`payments-kpi-card ${activeTab === 'refund' ? 'active' : ''}`}
            onClick={() => { setActiveTab('refund'); setPage(1); }}
            role="button"
            tabIndex={0}
            title="Click to view all Refunds"
          >
            <div className="kpi-card-top">
              <div className="kpi-icon-bubble amber">
                <RotateCcw size={14} />
              </div>
              <span className="kpi-badge-count">{summary.refundedCount || 0} refunds</span>
            </div>
            <div className="kpi-amount-val">
              ₹{Number(summary.totalRefunded || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <div className="kpi-label-text">Total Refunded</div>
          </div>

          {/* KPI 3: Wallet Recharges */}
          <div
            className={`payments-kpi-card ${activeTab === 'wallet_topup' ? 'active' : ''}`}
            onClick={() => { setActiveTab('wallet_topup'); setPage(1); }}
            role="button"
            tabIndex={0}
            title="Click to view Wallet Recharges"
          >
            <div className="kpi-card-top">
              <div className="kpi-icon-bubble green">
                <PlusCircle size={14} />
              </div>
              <span className="kpi-badge-count">{summary.rechargedCount || 0} top-ups</span>
            </div>
            <div className="kpi-amount-val">
              ₹{Number(summary.totalRecharged || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <div className="kpi-label-text">Wallet Recharges</div>
          </div>

          {/* KPI 4: Total Activity */}
          <div
            className={`payments-kpi-card ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => { setActiveTab('all'); setPage(1); }}
            role="button"
            tabIndex={0}
            title="Click to view All Activity"
          >
            <div className="kpi-card-top">
              <div className="kpi-icon-bubble blue">
                <CreditCard size={14} />
              </div>
              <span className="kpi-badge-count">All time</span>
            </div>
            <div className="kpi-amount-val">
              {summary.totalCount || transactions.length || 0} Txns
            </div>
            <div className="kpi-label-text">Total Activity</div>
          </div>
        </div>

        {/* TABS */}
        <div className="payments-tabs-nav">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`payments-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => { setActiveTab(tab.key); setPage(1); }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* SEARCH BAR & INTERACTIVE FILTER BUTTON WITH DROPDOWN POPOVER */}
        <div className="payments-search-bar" ref={filterContainerRef}>
          <div className="payments-search-field">
            <Search size={16} className="payments-search-icon" />
            <input
              type="text"
              placeholder="Search by order ID, transaction ID or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="payments-search-input"
            />
            {search && (
              <button type="button" className="payments-search-clear" onClick={() => setSearch('')}>
                <X size={14} />
              </button>
            )}
          </div>

          <div className="payments-filter-wrap">
            <button
              type="button"
              className={`payments-filter-btn ${isFilterOpen || activeFilterCount > 0 ? 'active' : ''}`}
              onClick={() => setIsFilterOpen(prev => !prev)}
              title="Filter transactions by status, method or date"
            >
              <Filter size={15} />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span className="payments-filter-count-badge">{activeFilterCount}</span>
              )}
            </button>

            {/* FILTER DROPDOWN POPOVER */}
            {isFilterOpen && (
              <div className="payments-filter-popover" onClick={(e) => e.stopPropagation()}>
                <div className="filter-popover-header">
                  <span className="filter-popover-title">Filter Transactions</span>
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      className="filter-reset-link"
                      onClick={() => {
                        setSelectedStatus('all');
                        setSelectedMethod('all');
                        setSelectedDateRange('all');
                        setPage(1);
                      }}
                    >
                      Reset All
                    </button>
                  )}
                </div>

                {/* Filter Section: Status */}
                <div className="filter-popover-section">
                  <span className="filter-section-label">Status</span>
                  <div className="filter-chips-grid">
                    {[
                      { key: 'all', label: 'All' },
                      { key: 'success', label: 'Success' },
                      { key: 'processed', label: 'Processed' },
                      { key: 'pending', label: 'Pending' },
                      { key: 'failed', label: 'Failed' },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        className={`filter-chip-btn ${selectedStatus === opt.key ? 'active' : ''}`}
                        onClick={() => { setSelectedStatus(opt.key); setPage(1); }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter Section: Payment Method */}
                <div className="filter-popover-section">
                  <span className="filter-section-label">Payment Method</span>
                  <div className="filter-chips-grid">
                    {[
                      { key: 'all', label: 'All' },
                      { key: 'wallet', label: 'Wallet' },
                      { key: 'upi', label: 'UPI' },
                      { key: 'card', label: 'Card' },
                      { key: 'netbanking', label: 'Net Banking' },
                      { key: 'cod', label: 'COD' },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        className={`filter-chip-btn ${selectedMethod === opt.key ? 'active' : ''}`}
                        onClick={() => { setSelectedMethod(opt.key); setPage(1); }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter Section: Time Period */}
                <div className="filter-popover-section">
                  <span className="filter-section-label">Time Period</span>
                  <div className="filter-chips-grid">
                    {[
                      { key: 'all', label: 'All Time' },
                      { key: 'today', label: 'Today' },
                      { key: '7days', label: 'Last 7 Days' },
                      { key: '30days', label: 'Last 30 Days' },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        className={`filter-chip-btn ${selectedDateRange === opt.key ? 'active' : ''}`}
                        onClick={() => { setSelectedDateRange(opt.key); setPage(1); }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="filter-popover-footer">
                  <button
                    type="button"
                    className="filter-popover-close-btn"
                    onClick={() => setIsFilterOpen(false)}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TRANSACTION LIST (scrollable body) */}
        <div className="payments-sidepanel-body">
          {loading ? (
            <div className="payments-loading">
              <div className="spinner-small" />
              <span>Loading transactions...</span>
            </div>
          ) : transactions.length === 0 ? (
            <div className="payments-empty">
              <CreditCard size={40} />
              <h4>No transactions found</h4>
              <p>{search ? 'Try adjusting your search query.' : 'Your transaction history will appear here.'}</p>
            </div>
          ) : (
            <>
              {groupByDate(transactions).map(([dateLabel, txns]) => (
                <div key={dateLabel} className="payments-date-group">
                  <div className="payments-date-label">{dateLabel}</div>
                  {txns.map((txn) => {
                    const style = getTxnStyle(txn);
                    const statusPill = getStatusPill(txn.status);
                    const TxnIcon = style.icon;
                    const isExpanded = expandedId === txn._id;
                    const time = new Date(txn.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
                    
                    return (
                      <div key={txn._id} className={`payments-txn-row ${isExpanded ? 'expanded' : ''}`}>
                        <div
                          className="payments-txn-summary"
                          onClick={() => setExpandedId(isExpanded ? null : txn._id)}
                        >
                          <div className="payments-txn-icon-box" style={{ background: style.bg, color: style.color }}>
                            <TxnIcon size={18} />
                          </div>
                          <div className="payments-txn-info">
                            <span className="payments-txn-title">{txn.description || txn.type}</span>
                            <span className="payments-txn-sub">
                              {txn.meta?.source || txn.meta?.productName || txn.paymentMethod || ''}
                            </span>
                            <span className="payments-txn-time">{time}</span>
                          </div>
                          <div className="payments-txn-right">
                            <span className="payments-txn-amount" style={{ color: style.color }}>
                              {style.prefix} ₹{Number(txn.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                            <span className={`payments-txn-status-pill ${statusPill.className}`}>
                              {statusPill.label}
                            </span>
                          </div>
                          <ChevronRight size={16} className={`payments-txn-chevron ${isExpanded ? 'rotated' : ''}`} />
                        </div>
                        
                        {isExpanded && (
                          <div className="payments-txn-details">
                            <div className="txn-detail-row">
                              <span className="txn-detail-label">Transaction ID</span>
                              <span className="txn-detail-value">{txn._id}</span>
                            </div>
                            {txn.orderDisplayId && (
                              <div className="txn-detail-row">
                                <span className="txn-detail-label">Order ID</span>
                                <span className="txn-detail-value">#{txn.orderDisplayId}</span>
                              </div>
                            )}
                            <div className="txn-detail-row">
                              <span className="txn-detail-label">Type</span>
                              <span className="txn-detail-value">{txn.type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                            </div>
                            <div className="txn-detail-row">
                              <span className="txn-detail-label">Payment Method</span>
                              <span className="txn-detail-value">{(txn.paymentMethod || 'N/A').toUpperCase()}</span>
                            </div>
                            <div className="txn-detail-row">
                              <span className="txn-detail-label">Date & Time</span>
                              <span className="txn-detail-value">
                                {new Date(txn.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} at {time}
                              </span>
                            </div>
                            <div className="txn-detail-row">
                              <span className="txn-detail-label">Status</span>
                              <span className={`payments-txn-status-pill ${statusPill.className}`}>{statusPill.label}</span>
                            </div>
                            {txn.meta?.reason && (
                              <div className="txn-detail-row">
                                <span className="txn-detail-label">Reason</span>
                                <span className="txn-detail-value">{txn.meta.reason}</span>
                              </div>
                            )}
                            {txn.meta?.source && (
                              <div className="txn-detail-row">
                                <span className="txn-detail-label">Source</span>
                                <span className="txn-detail-value">{txn.meta.source}</span>
                              </div>
                            )}
                            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', cursor: 'pointer', fontWeight: 600 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.dispatchEvent(new CustomEvent('open-customer-tickets', {
                                    detail: {
                                      transactionId: txn._id,
                                      orderDisplayId: txn.orderDisplayId || '',
                                      category: 'payment',
                                      subject: `Payment Issue with Txn #${txn._id.slice(-8).toUpperCase()}`
                                    }
                                  }));
                                }}
                              >
                                <Headphones size={13} />
                                <span>Report Payment Issue</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}

              <div ref={sentinelRef} className="payments-infinite-sentinel" />

              {loadingMore && (
                <div className="payments-infinite-loading">
                  <div className="spinner-small" />
                  <span>Loading more transactions...</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

