import { useState } from 'react';
import { Bot, User, CheckCircle2, ShoppingCart, ArrowRight, ExternalLink, Mail, Copy, Check } from 'lucide-react';
import DarwinProductCards from './DarwinProductCards';
import DarwinComparisonTable from './DarwinComparisonTable';
import DarwinOrderTracker from './DarwinOrderTracker';
import DarwinOrdersList from './DarwinOrdersList';
import DarwinCheckout from './DarwinCheckout';
import { useNavigate } from 'react-router-dom';

function renderInlineFormatting(str) {
  const parts = [];
  let remaining = str;
  let keyIdx = 0;

  while (remaining) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    const codeMatch = remaining.match(/`(.+?)`/);
    const italicMatch = remaining.match(/\*([^*]+?)\*/);
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);

    const matches = [
      boldMatch ? { type: 'bold', index: boldMatch.index, length: boldMatch[0].length, text: boldMatch[1] } : null,
      codeMatch ? { type: 'code', index: codeMatch.index, length: codeMatch[0].length, text: codeMatch[1] } : null,
      italicMatch ? { type: 'italic', index: italicMatch.index, length: italicMatch[0].length, text: italicMatch[1] } : null,
      linkMatch ? { type: 'link', index: linkMatch.index, length: linkMatch[0].length, text: linkMatch[1], url: linkMatch[2] } : null
    ].filter(Boolean).sort((a, b) => a.index - b.index);

    if (matches.length === 0) {
      parts.push(remaining);
      break;
    }

    const first = matches[0];
    if (first.index > 0) {
      parts.push(remaining.slice(0, first.index));
    }

    if (first.type === 'bold') {
      parts.push(<strong key={`b-${keyIdx++}`}>{first.text}</strong>);
    } else if (first.type === 'code') {
      parts.push(<code key={`c-${keyIdx++}`} className="darwin-inline-code">{first.text}</code>);
    } else if (first.type === 'italic') {
      parts.push(<em key={`i-${keyIdx++}`}>{first.text}</em>);
    } else if (first.type === 'link') {
      parts.push(
        <a
          key={`a-${keyIdx++}`}
          href={first.url}
          target={first.url.startsWith('http') ? '_blank' : '_self'}
          rel="noopener noreferrer"
          className="darwin-inline-link"
        >
          {first.text}
        </a>
      );
    }

    remaining = remaining.slice(first.index + first.length);
  }

  return parts;
}

function tryExtractEmail(content) {
  if (!content || typeof content !== 'string') return null;

  let text = content.trim();
  const codeBlockMatch = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (codeBlockMatch) {
    text = codeBlockMatch[1].trim();
  }

  const parseObj = (str) => {
    try {
      const obj = JSON.parse(str);
      if (obj && typeof obj === 'object') {
        if (obj.email && typeof obj.email === 'object') {
          return {
            subject: obj.email.subject || 'Shopping Recommendation',
            body: obj.email.body || '',
            to: obj.email.to || obj.email.recipient || ''
          };
        }
        if (obj.subject && obj.body) {
          return {
            subject: obj.subject,
            body: obj.body,
            to: obj.to || obj.recipient || ''
          };
        }
      }
    } catch {
      return null;
    }
    return null;
  };

  const direct = parseObj(text);
  if (direct) return direct;

  const jsonMatch = content.match(/\{[\s\S]*?"(?:subject|email)"[\s\S]*?\}/);
  if (jsonMatch) {
    const embedded = parseObj(jsonMatch[0]);
    if (embedded) {
      const introText = content.slice(0, jsonMatch.index).trim();
      return { ...embedded, introText };
    }
  }

  return null;
}

function tryParseRawJson(content) {
  if (!content || typeof content !== 'string') return null;
  let text = content.trim();
  const codeBlockMatch = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (codeBlockMatch) {
    text = codeBlockMatch[1].trim();
  }
  if ((text.startsWith('{') && text.endsWith('}')) || (text.startsWith('[') && text.endsWith(']'))) {
    try {
      const obj = JSON.parse(text);
      if (typeof obj === 'object' && obj !== null) return obj;
    } catch {
      return null;
    }
  }
  return null;
}

function DarwinEmailDraftCard({ email }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const rawBody = (email.body || '').replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n');
    const textToCopy = `Subject: ${email.subject}\n\n${rawBody}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const unescapedBody = String(email.body || '').replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n');
  const paragraphs = unescapedBody.split(/\n+/).map((p) => p.trim()).filter(Boolean);

  return (
    <div className="darwin-email-draft-card">
      {email.introText && (
        <div className="darwin-email-intro-text">
          {renderFormattedText(email.introText, true)}
        </div>
      )}
      <div className="darwin-email-preview-box">
        <div className="darwin-email-header">
          <div className="darwin-email-header-left">
            <div className="darwin-email-icon-box">
              <Mail size={15} />
            </div>
            <span className="darwin-email-header-title">Draft Email</span>
          </div>
          <button
            type="button"
            className={`darwin-email-copy-btn ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
            title="Copy email to clipboard"
          >
            {copied ? (
              <>
                <Check size={13} />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>Copy Email</span>
              </>
            )}
          </button>
        </div>

        <div className="darwin-email-field-row">
          <span className="darwin-email-field-label">Subject:</span>
          <strong className="darwin-email-field-subject">{email.subject}</strong>
        </div>

        {email.to && (
          <div className="darwin-email-field-row">
            <span className="darwin-email-field-label">To:</span>
            <span className="darwin-email-field-val">{email.to}</span>
          </div>
        )}

        <div className="darwin-email-divider" />

        <div className="darwin-email-body">
          {paragraphs.map((para, i) => (
            <p key={i} className="darwin-email-body-para">
              {renderInlineFormatting(para)}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function renderFormattedText(content, skipSpecial = false) {
  if (!content || typeof content !== 'string') return null;

  if (!skipSpecial) {
    const emailData = tryExtractEmail(content);
    if (emailData) {
      return <DarwinEmailDraftCard email={emailData} />;
    }

    const rawJson = tryParseRawJson(content);
    if (rawJson) {
      return (
        <div className="darwin-json-preview-wrapper">
          <pre className="darwin-json-code">
            <code>{JSON.stringify(rawJson, null, 2)}</code>
          </pre>
        </div>
      );
    }
  }

  // Defensively strip any tool-call XML leaks or raw MongoDB ObjectIds
  const sanitized = content
    .replace(/<tool_call>[\s\S]*?<\/tool_call>/gi, '')
    .replace(/<function=[^>]+>[\s\S]*?(?:<\/function>|$)/gi, '')
    .replace(/<\/?(?:tool_call|function|parameter|arg_key|arg_value)[^>]*>/gi, '')
    .replace(/```(?:json)?\s*\{\s*"(?:name|function)"[\s\S]*?\}\s*```/gi, '')
    .replace(/(?:Product\s+)?ID:\s*[0-9a-fA-F]{24}/gi, '')
    .replace(/\([0-9a-fA-F]{24}\)/gi, '')
    .replace(/\b[0-9a-fA-F]{24}\b/g, '')
    .trim();

  if (!sanitized) return null;

  // Unescape literal \r\n and \n into actual newlines
  const unescaped = sanitized.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n');
  const lines = unescaped.split('\n');
  const elements = [];
  let currentList = [];
  let listType = null;
  let currentTable = [];

  const flushList = () => {
    if (currentList.length > 0) {
      if (listType === 'ol') {
        elements.push(<ol key={`ol-${elements.length}`} className="darwin-msg-ol">{currentList}</ol>);
      } else {
        elements.push(<ul key={`ul-${elements.length}`} className="darwin-msg-ul">{currentList}</ul>);
      }
      currentList = [];
      listType = null;
    }
  };

  const flushTable = () => {
    if (currentTable.length >= 2) {
      const headerRow = currentTable[0];
      const bodyRows = currentTable.slice(1).filter((r) => !r.every((cell) => /^[-:\s]+$/.test(cell)));

      elements.push(
        <div key={`tbl-${elements.length}`} className="darwin-markdown-table-wrapper">
          <table className="darwin-markdown-table">
            <thead>
              <tr>
                {headerRow.map((cell, cIdx) => (
                  <th key={cIdx}>{renderInlineFormatting(cell.trim())}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx}>{renderInlineFormatting(cell.trim())}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    currentTable = [];
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      flushTable();
      return;
    }

    // Check markdown table row (| col1 | col2 |)
    if (line.startsWith('|') && line.endsWith('|')) {
      flushList();
      const cells = line
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());
      currentTable.push(cells);
      return;
    }

    flushTable();

    // Check unordered list item (* item, - item, • item)
    const ulMatch = line.match(/^[-*•]\s+(.*)$/);
    if (ulMatch) {
      if (listType && listType !== 'ul') flushList();
      listType = 'ul';
      currentList.push(<li key={`li-${idx}`}>{renderInlineFormatting(ulMatch[1])}</li>);
      return;
    }

    // Check ordered list item (1. item, 2. item)
    const olMatch = line.match(/^\d+[\.\)]\s+(.*)$/);
    if (olMatch) {
      if (listType && listType !== 'ol') flushList();
      listType = 'ol';
      currentList.push(<li key={`li-${idx}`}>{renderInlineFormatting(olMatch[1])}</li>);
      return;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p key={`p-${idx}`} className="darwin-msg-paragraph">
        {renderInlineFormatting(line)}
      </p>
    );
  });

  flushList();
  flushTable();
  return elements;
}

export default function DarwinMessage({
  message,
  onAddToCart,
  onAddToWishlist,
  onCompare,
  onAskQuery,
  onCloseDrawer,
  onOrderPlaced,
  onOpenModal,
  onOpenPayments,
  onOpenNotifications,
  onOpenSettings
}) {
  const navigate = useNavigate();
  const [botImgError, setBotImgError] = useState(false);
  const isUser = message.role === 'user';
  const data = message.structuredData || {};

  const userAvatar = (() => {
    try {
      const stored = localStorage.getItem("customer_profile") || localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed?.avatar || "";
      }
    } catch {}
    return "";
  })();

  return (
    <div className={`darwin-msg-row ${isUser ? 'user-msg-row' : 'darwin-msg-row'}`}>
      {/* Avatar */}
      <div className="darwin-msg-avatar-box">
        {isUser ? (
          <div className="darwin-user-avatar">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt="You"
                className="darwin-user-avatar-img"
              />
            ) : (
              <User size={16} />
            )}
          </div>
        ) : (
          <div className="darwin-bot-avatar">
            {!botImgError ? (
              <img
                src="/darwin-mascot.png"
                alt="Darwin"
                onError={() => setBotImgError(true)}
              />
            ) : (
              <Bot size={17} className="darwin-bot-fallback-icon" />
            )}
          </div>
        )}
      </div>

      {/* Message Content Bubble */}
      <div className="darwin-msg-content-wrapper">
        <div className={`darwin-msg-bubble ${isUser ? 'user-bubble' : 'darwin-bubble'}`}>
          <div className="darwin-msg-text">
            {renderFormattedText(message.content)}
          </div>

          {/* Action Success Card (e.g. Added to Cart) */}
          {data.action?.success && data.action?.product && (
            <div className="darwin-action-success-card">
              <div className="darwin-action-success-top">
                <CheckCircle2 size={18} className="darwin-action-check-icon" />
                <span>{data.action.message || 'Action completed successfully!'}</span>
              </div>
              <div className="darwin-action-prod-mini">
                {data.action.product.image && (
                  <img src={data.action.product.image} alt="" style={{ color: 'transparent' }} />
                )}
                <div>
                  <strong>{data.action.product.name}</strong>
                  <span>₹{Number(data.action.product.price || 0).toLocaleString('en-IN')}</span>
                </div>
                <button
                  type="button"
                  className="darwin-action-view-cart-btn"
                  onClick={() => {
                    if (onCloseDrawer) onCloseDrawer();
                    navigate('/customer/cart');
                  }}
                >
                  <ShoppingCart size={13} />
                  <span>View Cart</span>
                </button>
              </div>
            </div>
          )}

          {/* Action Shortcut Button (e.g. Open Support, Open Payments, etc.) */}
          {data.action?.type && typeof data.action.type === 'string' && data.action.type.startsWith('open_') && (
            <div className="darwin-action-shortcut-box" style={{ marginTop: '10px' }}>
              <button
                type="button"
                className="darwin-action-view-cart-btn"
                style={{ width: '100%', justifyContent: 'center', padding: '8px 14px', fontSize: '12px' }}
                onClick={() => {
                  if (data.action.type === 'open_support' && onOpenModal) onOpenModal('support');
                  else if (data.action.type === 'open_profile' && onOpenModal) onOpenModal('profile');
                  else if (data.action.type === 'open_addresses' && onOpenModal) onOpenModal('addresses');
                  else if (data.action.type === 'open_payment_methods' && onOpenModal) onOpenModal('payment');
                  else if (data.action.type === 'open_payments' && onOpenPayments) onOpenPayments();
                  else if (data.action.type === 'open_notifications' && onOpenNotifications) onOpenNotifications();
                  else if (data.action.type === 'open_settings' && onOpenSettings) onOpenSettings();
                }}
              >
                <ExternalLink size={14} />
                <span>{data.action.label || 'Open Section'}</span>
              </button>
            </div>
          )}

          {/* Timestamp */}
          <span className="darwin-msg-time">
            {new Date(message.timestamp || Date.now()).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>

        {/* Structured Product Cards */}
        {data.products && data.products.length > 0 && !data.comparison && (
          <DarwinProductCards
            products={data.products}
            onAddToCart={onAddToCart}
            onAddToWishlist={onAddToWishlist}
            onCompare={onCompare}
            onAskQuery={onAskQuery}
            onViewProduct={(p) => {
              if (onCloseDrawer) onCloseDrawer();
              navigate(`/customer/products/${p._id}`);
            }}
          />
        )}

        {/* Structured Comparison Table */}
        {data.comparison && (
          <DarwinComparisonTable
            comparison={data.comparison}
            onAddToCart={onAddToCart}
            onViewProduct={(p) => {
              if (onCloseDrawer) onCloseDrawer();
              navigate(`/customer/products/${p._id}`);
            }}
          />
        )}

        {/* Structured Orders List (Multiple Recent Orders) */}
        {data.orders && data.orders.length > 0 && (
          <DarwinOrdersList
            orders={data.orders}
            onTrackOrder={(orderId) => onAskQuery && onAskQuery(`Track #${orderId}`)}
            onCloseDrawer={onCloseDrawer}
          />
        )}

        {/* Structured Order Tracker (Single Order Detailed Tracking) */}
        {data.order && (!data.orders || data.orders.length === 0) && (
          <DarwinOrderTracker
            order={data.order}
            onCloseDrawer={onCloseDrawer}
          />
        )}

        {/* Structured Conversational Checkout */}
        {data.checkout && (
          <DarwinCheckout
            checkoutSummary={data.checkout}
            onOrderPlaced={onOrderPlaced}
            onCloseDrawer={onCloseDrawer}
          />
        )}

        {/* Quick Suggestion Pills attached to message (max 3-4 items) */}
        {Array.isArray(data.suggestions) && data.suggestions.slice(0, 4).length > 0 && (
          <div className="darwin-msg-suggestions-row">
            {data.suggestions.slice(0, 4).map((sug, sIdx) => (
              <button
                key={sIdx}
                type="button"
                className="darwin-msg-sug-pill"
                onClick={() => onAskQuery && onAskQuery(sug)}
              >
                <span>{sug}</span>
                <ArrowRight size={11} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
