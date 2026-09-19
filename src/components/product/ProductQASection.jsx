import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  MessageSquarePlus,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  Info,
  Send,
  Sparkles,
  ShieldCheck,
  Check,
  MoreVertical,
  Edit3,
  Loader2,
  X,
  Copy,
  Share2,
  Flag
} from 'lucide-react';
import {
  getProductQA,
  checkInstantSpecMatch,
  askProductQuestion,
  answerProductQuestion,
  voteQuestion,
  voteAnswer
} from '../../services/productQAService';
import Modal from '../Modal';
import { toast } from '../Toast';
import './ProductQASection.css';

export default function ProductQASection({ product, profile }) {
  const [qaData, setQaData] = useState({
    questions: [],
    counts: { all: 0, unanswered: 0, myQuestions: 0 },
    topQuestions: []
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'unanswered' | 'my_questions'
  const [sortBy, setSortBy] = useState('helpful'); // 'helpful' | 'recent' | 'most_answered'
  const [expandedAnswers, setExpandedAnswers] = useState({});
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [activeOptionsMenuId, setActiveOptionsMenuId] = useState(null);

  // Close 3-dots menu on click outside or Escape
  useEffect(() => {
    const handleGlobalClick = () => {
      setActiveOptionsMenuId(null);
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActiveOptionsMenuId(null);
    };
    window.addEventListener('click', handleGlobalClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleCopyQuestionLink = (q) => {
    const url = `${window.location.origin}${window.location.pathname}#qa-${q._id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success('Question link copied to clipboard!');
    }
    setActiveOptionsMenuId(null);
  };

  const handleShareQuestion = (q) => {
    const url = `${window.location.origin}${window.location.pathname}#qa-${q._id}`;
    if (navigator.share) {
      navigator.share({
        title: q.question,
        text: `Q: ${q.question}`,
        url
      }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success('Question link copied to clipboard!');
    }
    setActiveOptionsMenuId(null);
  };

  const handleReportQuestion = (q) => {
    toast.info('Thank you. This question has been reported for moderation review.');
    setActiveOptionsMenuId(null);
  };

  // Ask Modal State
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [instantSpecMatch, setInstantSpecMatch] = useState(null);
  const [checkingSpec, setCheckingSpec] = useState(false);
  const specDebounceTimer = useRef(null);

  const customerId = profile?._id || profile?.id || (() => {
    try {
      const p = JSON.parse(localStorage.getItem('customer_profile') || '{}');
      return p._id || p.id || null;
    } catch {
      return null;
    }
  })();

  const customerName = profile?.name || (() => {
    try {
      const p = JSON.parse(localStorage.getItem('customer_profile') || '{}');
      return p.name || 'Customer';
    } catch {
      return 'Customer';
    }
  })();

  const loadQA = useCallback(async (q = searchQuery, filter = activeFilter, sort = sortBy) => {
    if (!product?._id) return;
    setLoading(true);
    try {
      const res = await getProductQA(product._id, {
        q,
        filter,
        sort,
        customerId
      });
      if (res) {
        setQaData(res);
      }
    } catch (err) {
      console.error('Failed to load product Q&A:', err);
    } finally {
      setLoading(false);
    }
  }, [product?._id, searchQuery, activeFilter, sortBy, customerId]);

  useEffect(() => {
    loadQA();
  }, [loadQA]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadQA(searchQuery, activeFilter, sortBy);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    loadQA(searchQuery, filter, sortBy);
  };

  const handleSortChange = (e) => {
    const newSort = e.target.value;
    setSortBy(newSort);
    loadQA(searchQuery, activeFilter, newSort);
  };

  const handleTopQuestionClick = (questionText) => {
    setSearchQuery(questionText);
    loadQA(questionText, 'all', 'helpful');
    // Smooth scroll to questions list
    const el = document.getElementById('qa-questions-list');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleVoteQuestion = async (questionId, direction) => {
    try {
      await voteQuestion(product._id, questionId, direction);
      setQaData((prev) => ({
        ...prev,
        questions: prev.questions.map((q) => {
          if (q._id === questionId) {
            return {
              ...q,
              upvotes: direction === 'up' ? (q.upvotes || 0) + 1 : q.upvotes,
              downvotes: direction === 'down' ? (q.downvotes || 0) + 1 : q.downvotes
            };
          }
          return q;
        })
      }));
    } catch (err) {
      toast.error('Failed to record vote.');
    }
  };

  const handleVoteAnswer = async (questionId, answerId, voteType) => {
    try {
      await voteAnswer(product._id, questionId, answerId, voteType);
      setQaData((prev) => ({
        ...prev,
        questions: prev.questions.map((q) => {
          if (q._id === questionId) {
            return {
              ...q,
              answers: q.answers.map((a) => {
                if (a._id === answerId) {
                  return {
                    ...a,
                    helpfulCount: voteType === 'helpful' ? (a.helpfulCount || 0) + 1 : a.helpfulCount,
                    unhelpfulCount: voteType === 'unhelpful' ? (a.unhelpfulCount || 0) + 1 : a.unhelpfulCount
                  };
                }
                return a;
              })
            };
          }
          return q;
        })
      }));
    } catch (err) {
      toast.error('Failed to record answer vote.');
    }
  };

  const handleOpenReply = (questionId) => {
    setReplyingToId(replyingToId === questionId ? null : questionId);
    setReplyText('');
  };

  const handleSubmitReply = async (questionId) => {
    if (!replyText.trim()) {
      toast.error('Please enter an answer before submitting.');
      return;
    }
    setSubmittingReply(true);
    try {
      await answerProductQuestion(product._id, questionId, replyText.trim(), {
        name: customerName,
        role: 'customer',
        _id: customerId,
        isVerifiedBuyer: true
      });
      toast.success('Your answer has been submitted. Thank you for contributing!');
      setReplyingToId(null);
      setReplyText('');
      loadQA();
    } catch (err) {
      toast.error('Failed to submit answer: ' + (err.message || 'Unknown error'));
    } finally {
      setSubmittingReply(false);
    }
  };

  // Instant Spec Match live check in modal as user types
  const handleQuestionInputChange = (text) => {
    setNewQuestionText(text);
    if (specDebounceTimer.current) clearTimeout(specDebounceTimer.current);

    if (text.trim().length < 3) {
      setInstantSpecMatch(null);
      return;
    }

    setCheckingSpec(true);
    specDebounceTimer.current = setTimeout(async () => {
      try {
        const match = await checkInstantSpecMatch(product._id, text);
        if (match && match.matched) {
          setInstantSpecMatch(match);
        } else {
          setInstantSpecMatch(null);
        }
      } catch (err) {
        setInstantSpecMatch(null);
      } finally {
        setCheckingSpec(false);
      }
    }, 300);
  };

  const handleSubmitNewQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestionText.trim()) {
      toast.error('Please enter your question.');
      return;
    }

    setSubmittingQuestion(true);
    try {
      await askProductQuestion(product._id, newQuestionText.trim(), {
        name: customerName,
        _id: customerId,
        hasPurchased: true
      });
      toast.success('Your question has been posted successfully!');
      setIsAskModalOpen(false);
      setNewQuestionText('');
      setInstantSpecMatch(null);
      loadQA();
    } catch (err) {
      toast.error('Failed to post question: ' + (err.message || 'Unknown error'));
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const toggleExpandAnswers = (questionId) => {
    setExpandedAnswers((prev) => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const renderBadge = (badgeText) => {
    if (!badgeText || badgeText === 'Customer') return null;

    if (badgeText.includes('Verified Specification')) {
      return (
        <span className="qa-badge verified-spec">
          <Check size={11} strokeWidth={3} />
          <span>Verified Specification</span>
        </span>
      );
    }

    if (badgeText.includes('Verified Seller') || badgeText.includes('Official Merchant')) {
      return (
        <span className="qa-badge verified-seller">
          <Check size={11} strokeWidth={3} />
          <span>Verified Seller</span>
        </span>
      );
    }

    if (badgeText.includes('Verified Buyer')) {
      return (
        <span className="qa-badge verified-buyer">
          <Check size={11} strokeWidth={3} />
          <span>Verified Buyer</span>
        </span>
      );
    }

    return <span className="qa-badge default-badge">{badgeText}</span>;
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    const diffDays = Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays} days ago`;
    const diffMonths = Math.round(diffDays / 30);
    if (diffMonths === 1) return '1 month ago';
    if (diffMonths < 12) return `${diffMonths} months ago`;
    return `${Math.round(diffMonths / 12)} years ago`;
  };

  return (
    <section className="qa-section-container" id="product-qa-section">
      {/* SECTION HEADER */}
      <div className="qa-section-header">
        <div className="qa-header-left">
          <h2 className="qa-main-title">Questions &amp; Answers</h2>
          <p className="qa-main-subtitle">
            Get answers from customers, verified buyers and the seller.
          </p>
        </div>
        <button
          type="button"
          className="qa-ask-btn-primary"
          onClick={() => setIsAskModalOpen(true)}
        >
          <MessageSquarePlus size={16} />
          <span>Ask a Question</span>
        </button>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="qa-toolbar-card">
        <form onSubmit={handleSearchSubmit} className="qa-search-form">
          <div className="qa-search-input-wrap">
            <Search size={18} className="qa-search-icon" />
            <input
              type="text"
              className="qa-search-input"
              placeholder="Search questions (e.g. charger, 5G, battery, warranty...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="qa-search-clear-btn"
                onClick={() => {
                  setSearchQuery('');
                  loadQA('', activeFilter, sortBy);
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button type="submit" className="qa-search-submit-btn">
            Search
          </button>
        </form>

        <div className="qa-filters-sort-row">
          <div className="qa-filter-chips-list">
            <button
              type="button"
              className={`qa-chip-btn ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => handleFilterChange('all')}
            >
              <span>All ({qaData.counts?.all || 0})</span>
            </button>
            <button
              type="button"
              className={`qa-chip-btn ${activeFilter === 'unanswered' ? 'active' : ''}`}
              onClick={() => handleFilterChange('unanswered')}
            >
              <span>Unanswered ({qaData.counts?.unanswered || 0})</span>
            </button>
            <button
              type="button"
              className={`qa-chip-btn ${activeFilter === 'my_questions' ? 'active' : ''}`}
              onClick={() => handleFilterChange('my_questions')}
            >
              <span>My Questions ({qaData.counts?.myQuestions || 0})</span>
            </button>
          </div>

          <div className="qa-sort-wrap">
            <span className="qa-sort-label">Sort by:</span>
            <select
              className="qa-sort-select"
              value={sortBy}
              onChange={handleSortChange}
            >
              <option value="helpful">Most Helpful</option>
              <option value="recent">Recent</option>
              <option value="most_answered">Most Answered</option>
            </select>
          </div>
        </div>
      </div>

      {/* DUAL COLUMN MAIN LAYOUT (Flipkart / Amazon style from mockup) */}
      <div className="qa-content-grid">
        {/* LEFT COLUMN: QUESTIONS LIST */}
        <div className="qa-questions-column" id="qa-questions-list">
          {loading ? (
            <div className="qa-loading-skeleton">
              <Loader2 size={28} className="spin" />
              <span>Loading questions &amp; verified answers...</span>
            </div>
          ) : qaData.questions.length === 0 ? (
            <div className="qa-empty-state">
              <MessageCircle size={40} color="#94a3b8" />
              <h3>No questions found</h3>
              <p>
                {searchQuery
                  ? `No questions matching "${searchQuery}". Be the first to ask!`
                  : 'Have a question about this product? Ask the seller and community.'}
              </p>
              <button
                type="button"
                className="qa-ask-btn-outline"
                onClick={() => setIsAskModalOpen(true)}
              >
                <MessageSquarePlus size={16} />
                <span>Ask a Question</span>
              </button>
            </div>
          ) : (
            <div className="qa-cards-list">
              {qaData.questions.map((q) => {
                const score = (q.upvotes || 0) - (q.downvotes || 0);
                const firstAnswer = q.answers?.[0];
                const moreAnswers = q.answers?.slice(1) || [];
                const isExpanded = Boolean(expandedAnswers[q._id]);
                const isReplying = replyingToId === q._id;

                return (
                  <div className="qa-item-card" key={q._id}>
                    {/* Question + Answer Details */}
                    <div className="qa-details-col">
                      {/* Question Line */}
                      <div className="qa-question-header-row">
                        <h3 className="qa-question-title">
                          <span className="qa-q-prefix">Q:</span>
                          <span>{q.question}</span>
                        </h3>
                        <div className="qa-options-menu-wrap">
                          <button
                            type="button"
                            className="qa-options-menu-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveOptionsMenuId(activeOptionsMenuId === q._id ? null : q._id);
                            }}
                            title="More options"
                            aria-label="More options"
                          >
                            <MoreVertical size={16} />
                          </button>
                          {activeOptionsMenuId === q._id && (
                            <div className="qa-options-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                className="qa-dropdown-item"
                                onClick={() => handleCopyQuestionLink(q)}
                              >
                                <Copy size={14} />
                                <span>Copy Question Link</span>
                              </button>
                              <button
                                type="button"
                                className="qa-dropdown-item"
                                onClick={() => handleShareQuestion(q)}
                              >
                                <Share2 size={14} />
                                <span>Share Question</span>
                              </button>
                              <button
                                type="button"
                                className="qa-dropdown-item danger"
                                onClick={() => handleReportQuestion(q)}
                              >
                                <Flag size={14} />
                                <span>Report Question</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="qa-author-meta">
                        <span>Asked by {q.askedBy?.name || 'Customer'}</span>
                        <span className="qa-meta-dot">•</span>
                        <span>{formatRelativeTime(q.createdAt)}</span>
                        {q.askedBy?.isVerifiedBuyer && (
                          <>
                            <span className="qa-meta-dot">•</span>
                            <span className="qa-author-verified-tag">
                              <Check size={10} /> Verified Purchase
                            </span>
                          </>
                        )}
                      </div>

                      {/* Primary Answer Box (Tinted Green as in mockup) */}
                      {firstAnswer ? (
                        <div className="qa-answer-box">
                          <div className="qa-answer-text-row">
                            <span className="qa-a-prefix">A:</span>
                            <p className="qa-answer-body">{firstAnswer.answer}</p>
                          </div>

                          <div className="qa-answer-footer-row">
                            <div className="qa-answerer-info">
                              <span className="qa-answerer-name">
                                Answered by {firstAnswer.answeredBy?.name || 'Seller'}
                              </span>
                              <span className="qa-meta-dot">•</span>
                              {renderBadge(firstAnswer.badge)}
                              <span className="qa-meta-dot">•</span>
                              <span className="qa-answer-time">
                                {formatRelativeTime(firstAnswer.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="qa-unanswered-box">
                          <Info size={15} />
                          <span>This question hasn't been answered yet. Have information? Be the first to reply!</span>
                        </div>
                      )}

                      {/* Expanded Additional Answers */}
                      {isExpanded && moreAnswers.length > 0 && (
                        <div className="qa-more-answers-container">
                          {moreAnswers.map((addAns, aIdx) => (
                            <div className="qa-additional-answer-item" key={addAns._id || aIdx}>
                              <div className="qa-answer-text-row">
                                <span className="qa-a-prefix secondary">A:</span>
                                <p className="qa-answer-body">{addAns.answer}</p>
                              </div>
                              <div className="qa-answer-footer-row">
                                <div className="qa-answerer-info">
                                  <span className="qa-answerer-name">
                                    Answered by {addAns.answeredBy?.name || 'Community Member'}
                                  </span>
                                  <span className="qa-meta-dot">•</span>
                                  {renderBadge(addAns.badge)}
                                  <span className="qa-meta-dot">•</span>
                                  <span className="qa-answer-time">
                                    {formatRelativeTime(addAns.createdAt)}
                                  </span>
                                </div>
                                <div className="qa-ans-vote-actions">
                                  <button
                                    type="button"
                                    className="qa-helpful-inline-btn"
                                    onClick={() => handleVoteAnswer(q._id, addAns._id, 'helpful')}
                                  >
                                    <ThumbsUp size={12} /> {addAns.helpfulCount || 0}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Action Bar (Helpful / Not Helpful / Reply / View More) */}
                      <div className="qa-actions-bar">
                        <div className="qa-reaction-buttons">
                          {firstAnswer && (
                            <>
                              <button
                                type="button"
                                className="qa-action-btn"
                                onClick={() => handleVoteAnswer(q._id, firstAnswer._id, 'helpful')}
                              >
                                <ThumbsUp size={14} />
                                <span>Helpful ({firstAnswer.helpfulCount || 0})</span>
                              </button>
                              <button
                                type="button"
                                className="qa-action-btn"
                                onClick={() => handleVoteAnswer(q._id, firstAnswer._id, 'unhelpful')}
                              >
                                <ThumbsDown size={14} />
                                <span>Not Helpful ({firstAnswer.unhelpfulCount || 0})</span>
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            className={`qa-action-btn reply-btn ${isReplying ? 'active' : ''}`}
                            onClick={() => handleOpenReply(q._id)}
                          >
                            <MessageCircle size={14} />
                            <span>Reply</span>
                          </button>
                        </div>

                        {moreAnswers.length > 0 && (
                          <button
                            type="button"
                            className="qa-view-more-answers-link"
                            onClick={() => toggleExpandAnswers(q._id)}
                          >
                            {isExpanded
                              ? 'Hide additional answers'
                              : `View ${moreAnswers.length} more answer${moreAnswers.length === 1 ? '' : 's'}`}
                          </button>
                        )}
                      </div>

                      {/* Inline Reply Form */}
                      {isReplying && (
                        <div className="qa-inline-reply-box">
                          <textarea
                            className="qa-reply-textarea"
                            placeholder="Write your answer to help fellow shoppers..."
                            rows={3}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                          />
                          <div className="qa-reply-actions-row">
                            <button
                              type="button"
                              className="qa-reply-cancel-btn"
                              onClick={() => {
                                setReplyingToId(null);
                                setReplyText('');
                              }}
                              disabled={submittingReply}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="qa-reply-submit-btn"
                              onClick={() => handleSubmitReply(q._id)}
                              disabled={submittingReply || !replyText.trim()}
                            >
                              {submittingReply ? <Loader2 size={13} className="spin" /> : <Send size={13} />}
                              <span>Submit Answer</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Load More Button */}
              <div className="qa-load-more-wrap">
                <button
                  type="button"
                  className="qa-load-more-btn"
                  onClick={() => loadQA()}
                >
                  <RotateCcw size={14} />
                  <span>Load More Questions</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: SIDEBAR */}
        <aside className="qa-sidebar-column">
          {/* Top Questions List */}
          <div className="qa-sidebar-card top-questions-card">
            <h3 className="qa-sidebar-card-title">Top Questions</h3>
            <div className="qa-top-questions-list">
              {qaData.topQuestions && qaData.topQuestions.length > 0 ? (
                qaData.topQuestions.map((tq) => (
                  <button
                    key={tq._id}
                    type="button"
                    className="qa-top-question-item"
                    onClick={() => handleTopQuestionClick(tq.question)}
                  >
                    <span className="qa-top-question-text">{tq.question}</span>
                    <ChevronRight size={16} className="qa-chevron-icon" />
                  </button>
                ))
              ) : (
                <>
                  <button
                    type="button"
                    className="qa-top-question-item"
                    onClick={() => handleTopQuestionClick('Does this support 5G?')}
                  >
                    <span>Does this support 5G?</span>
                    <ChevronRight size={16} />
                  </button>
                  <button
                    type="button"
                    className="qa-top-question-item"
                    onClick={() => handleTopQuestionClick('Does it include the charger?')}
                  >
                    <span>Does it include the charger?</span>
                    <ChevronRight size={16} />
                  </button>
                  <button
                    type="button"
                    className="qa-top-question-item"
                    onClick={() => handleTopQuestionClick('Is it water resistant?')}
                  >
                    <span>Is it water resistant?</span>
                    <ChevronRight size={16} />
                  </button>
                  <button
                    type="button"
                    className="qa-top-question-item"
                    onClick={() => handleTopQuestionClick('What is the battery backup?')}
                  >
                    <span>What is the battery backup?</span>
                    <ChevronRight size={16} />
                  </button>
                  <button
                    type="button"
                    className="qa-top-question-item"
                    onClick={() => handleTopQuestionClick('Is it good for gaming?')}
                  >
                    <span>Is it good for gaming?</span>
                    <ChevronRight size={16} />
                  </button>
                  <button
                    type="button"
                    className="qa-top-question-item"
                    onClick={() => handleTopQuestionClick('Does it support eSIM?')}
                  >
                    <span>Does it support eSIM?</span>
                    <ChevronRight size={16} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Ask a Question Promo Card */}
          <div className="qa-sidebar-card ask-promo-card">
            <div className="qa-promo-icon-box">
              <Edit3 size={24} className="qa-promo-icon" />
            </div>
            <h3 className="qa-promo-title">Ask a Question</h3>
            <p className="qa-promo-desc">
              Get answers from verified customers, specs, and the official seller.
            </p>
            <button
              type="button"
              className="qa-promo-btn"
              onClick={() => setIsAskModalOpen(true)}
            >
              Ask a Question
            </button>
          </div>

          {/* Moderation Notice Card */}
          <div className="qa-sidebar-card moderation-card">
            <div className="qa-mod-icon-wrap">
              <Info size={18} className="qa-mod-icon" />
            </div>
            <p className="qa-mod-text">
              Questions are moderated to ensure quality and relevance. Avoid sharing personal or confidential information.
            </p>
          </div>
        </aside>
      </div>

      {/* ASK A QUESTION MODAL (with live specification match) */}
      <Modal
        isOpen={isAskModalOpen}
        onClose={() => {
          setIsAskModalOpen(false);
          setNewQuestionText('');
          setInstantSpecMatch(null);
        }}
        title="Ask a Question"
        size="medium"
      >
        <form onSubmit={handleSubmitNewQuestion} className="qa-modal-form">
          <p className="qa-modal-subheading">
            Ask about features, dimensions, specifications, compatibility, or box contents for{' '}
            <strong>{product.name}</strong>.
          </p>

          <div className="form-group">
            <label htmlFor="qa-input-question">Your Question</label>
            <textarea
              id="qa-input-question"
              className="qa-modal-textarea"
              rows={4}
              placeholder="e.g. Does this support 5G? Is the charger included in the box? What is the battery capacity?"
              value={newQuestionText}
              onChange={(e) => handleQuestionInputChange(e.target.value)}
              required
            />
          </div>

          {/* Instant Specification Match Card */}
          {checkingSpec && (
            <div className="qa-instant-check-loading">
              <Loader2 size={14} className="spin" />
              <span>Checking verified technical specifications...</span>
            </div>
          )}

          {instantSpecMatch && (
            <div className="qa-instant-match-card">
              <div className="qa-instant-header">
                <Sparkles size={16} className="qa-sparkle-icon" />
                <strong>Instant Verified Answer Found!</strong>
              </div>
              <p className="qa-instant-answer-text">{instantSpecMatch.answer}</p>
              <div className="qa-instant-footer">
                <span className="qa-badge verified-spec">
                  <Check size={11} strokeWidth={3} />
                  <span>Verified Specification</span>
                </span>
                <span className="qa-instant-hint">
                  Derived directly from official saved specifications.
                </span>
              </div>
            </div>
          )}

          <div className="qa-modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setIsAskModalOpen(false);
                setNewQuestionText('');
                setInstantSpecMatch(null);
              }}
              disabled={submittingQuestion}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submittingQuestion || !newQuestionText.trim()}
            >
              {submittingQuestion ? (
                <>
                  <Loader2 size={14} className="spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Submit Question</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}

