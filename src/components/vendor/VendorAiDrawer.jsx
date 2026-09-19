import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  X,
  Send,
  ExternalLink,
  RotateCcw,
  TrendingUp,
  Package,
  AlertTriangle,
  Clock,
  CheckCircle2,
  DollarSign,
  Mic,
  MicOff,
  History,
  Settings,
  Plus,
  Bot,
  Users,
  ChevronDown,
  Check,
  Zap,
  Search
} from 'lucide-react';
import {
  chatWithAtlas,
  getVendorAiSuggestions,
  getAtlasConversation,
  createAtlasConversation
} from '../../services/vendorAiService';
import VendorAiHistory from './VendorAiHistory';
import VendorAiSettings from './VendorAiSettings';
import VendorAiAgentPicker, { VENDOR_MODELS } from './VendorAiAgentPicker';
import VendorAiWelcome from './VendorAiWelcome';
import { getVendorPageContext } from '../../utils/vendorPageContext';
import { toast } from '../Toast';
import { useAuth } from '../../context/AuthContext';
import '../../styles/vendor-ai.css';

function formatInlineMarkdown(str) {
  if (!str) return '';
  const parts = [];
  let remaining = str;
  let key = 0;

  while (remaining) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    const codeMatch = remaining.match(/`(.+?)`/);
    const italicMatch = remaining.match(/\*([^*]+?)\*/);

    const matches = [
      boldMatch ? { type: 'bold', index: boldMatch.index, length: boldMatch[0].length, text: boldMatch[1] } : null,
      codeMatch ? { type: 'code', index: codeMatch.index, length: codeMatch[0].length, text: codeMatch[1] } : null,
      italicMatch ? { type: 'italic', index: italicMatch.index, length: italicMatch[0].length, text: italicMatch[1] } : null
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
      parts.push(<strong key={key++}>{first.text}</strong>);
    } else if (first.type === 'code') {
      parts.push(
        <code key={key++} className="vendor-ai-inline-code">
          {first.text}
        </code>
      );
    } else if (first.type === 'italic') {
      parts.push(<em key={key++}>{first.text}</em>);
    }

    remaining = remaining.slice(first.index + first.length);
  }

  return parts;
}

function FormattedAtlasMessage({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let inTable = false;
  let tableRows = [];
  let inList = false;
  let listItems = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="vendor-ai-rendered-list">
          {listItems.map((li, idx) => (
            <li key={idx}>{formatInlineMarkdown(li)}</li>
          ))}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const flushTable = () => {
    if (tableRows.length > 0) {
      const [headerRow, , ...bodyRows] = tableRows;
      const headers = headerRow ? headerRow.split('|').filter((s) => s.trim().length > 0) : [];
      elements.push(
        <div key={`table-wrap-${elements.length}`} className="vendor-ai-table-responsive">
          <table className="vendor-ai-rendered-table">
            <thead>
              <tr>
                {headers.map((h, i) => (
                  <th key={i}>{formatInlineMarkdown(h.trim())}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map((r, rIdx) => {
                const cells = r.split('|').filter((s) => s.trim().length > 0);
                return (
                  <tr key={rIdx}>
                    {cells.map((c, cIdx) => (
                      <td key={cIdx}>{formatInlineMarkdown(c.trim())}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList();
      inTable = true;
      if (!trimmed.includes('---')) {
        tableRows.push(trimmed);
      }
      return;
    } else if (inTable) {
      flushTable();
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      inList = true;
      listItems.push(trimmed.slice(2));
      return;
    } else if (inList) {
      flushList();
    }

    if (trimmed.startsWith('### ')) {
      elements.push(<h3 key={elements.length}>{formatInlineMarkdown(trimmed.slice(4))}</h3>);
    } else if (trimmed.startsWith('#### ')) {
      elements.push(<h4 key={elements.length}>{formatInlineMarkdown(trimmed.slice(5))}</h4>);
    } else if (trimmed.length > 0) {
      elements.push(<p key={elements.length}>{formatInlineMarkdown(trimmed)}</p>);
    }
  });

  flushList();
  flushTable();

  return <>{elements}</>;
}

export default function VendorAiDrawer({ isOpen, onClose, initialQuery = '' }) {
  const authContext = useAuth();
  const updateUser = authContext?.updateUser;

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeModel, setActiveModel] = useState(
    () => localStorage.getItem('atlas_ai_provider') || 'auto'
  );
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [subView, setSubView] = useState('chat'); // 'chat' | 'history' | 'settings' | 'agents'
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const pageContext = getVendorPageContext(window.location.pathname);
  const [quickPrompts, setQuickPrompts] = useState([
    'Restock Alert',
    'Sales Trend',
    'Demand Forecast',
    'Dead Stock',
    'Best Sellers',
    'Pricing Insights'
  ]);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  const messagesRef = useRef(messages);
  const sentInitialQueryRef = useRef(null);

  messagesRef.current = messages;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && subView === 'chat') {
      scrollToBottom();
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [messages, isOpen, subView]);

  // Load backend suggestions
  useEffect(() => {
    getVendorAiSuggestions()
      .then((data) => {
        if (Array.isArray(data?.suggestions) && data.suggestions.length > 0) {
          setQuickPrompts(data.suggestions);
        }
      })
      .catch(() => {});
  }, []);

  // Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputValue((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error !== 'no-speech') {
          toast.info('Could not capture voice. Please type your query.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      setVoiceSupported(true);
    } else {
      setVoiceSupported(false);
    }
  }, []);

  const toggleVoice = () => {
    if (!voiceSupported) {
      toast.info("Voice dictation is not supported in this browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
        toast.info('Listening... Speak your store question.');
      } catch (err) {
        console.warn('Could not start microphone:', err);
      }
    }
  };

  const inputValueRef = useRef(inputValue);
  inputValueRef.current = inputValue;

  const handleSend = useCallback(
    async (queryText) => {
      const textToSend = String((queryText !== undefined && queryText !== null) ? queryText : (inputValueRef.current || '')).trim();
      if (!textToSend || loading) return;

      setInputValue('');
      inputValueRef.current = '';
      if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
      }

      const userMsg = { sender: 'user', text: textToSend };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      try {
        const history = (messagesRef.current || []).map((m) => ({
          role: m.sender === 'atlas' ? 'assistant' : 'user',
          content: m.text
        }));

        const currentProvider = activeModel || localStorage.getItem('atlas_ai_provider') || 'auto';
        const pageCtx = getVendorPageContext(window.location.pathname);

        const res = await chatWithAtlas({
          message: textToSend,
          conversationHistory: history,
          conversationId: activeConversationId,
          agentMode: currentProvider,
          aiProviderPreference: currentProvider,
          pageContext: {
            path: window.location.pathname,
            title: pageCtx?.pageTitle,
            key: pageCtx?.pageKey
          }
        });

        if (res.conversationId && !activeConversationId) {
          setActiveConversationId(res.conversationId);
        }

        // AUTO FALLBACK MODEL SWITCHING (Darwin Concept)
        // If the backend resolved the query using a fallback engine (e.g. Groq, Cerebras, NLP)
        // or resolved the query under Auto Router, update the activeModel state and pill!
        if (res?.mode) {
          const matchedModel = VENDOR_MODELS.find((m) => m.id === res.mode);
          if (matchedModel && activeModel !== res.mode) {
            setActiveModel(res.mode);
            localStorage.setItem('atlas_ai_provider', res.mode);
            if (activeModel !== 'auto') {
              toast.info(`Fell back to ${matchedModel.name}`);
            }
          }
        }

        if (res?.action) {
          if (res.action.type === 'profile_updated') {
            if (typeof updateUser === 'function') {
              updateUser((prev) => ({
                ...prev,
                name: res.action.name || res.action.vendor?.name || prev?.name,
                businessName: res.action.businessName || res.action.vendor?.businessName || prev?.businessName,
                phone: res.action.vendor?.phone || prev?.phone
              }));
            }
            toast.success(res.action.message || 'Store profile updated successfully!');
          } else if (res.action.type === 'settings_updated') {
            if (res.action.settings?.aiProviderPreference) {
              const newPref = res.action.settings.aiProviderPreference;
              setActiveModel(newPref);
              localStorage.setItem('atlas_ai_provider', newPref);
            }
            toast.success(res.action.message || 'Atlas settings updated successfully!');
          } else if (res.action.type === 'open_settings') {
            setSubView('settings');
          } else if (res.action.type === 'inventory_updated' || res.action.type === 'price_updated') {
            window.dispatchEvent(new Event('product_catalog_updated'));
            toast.success(res.action.message);
          } else if (res.action.type === 'vendor_settings_updated') {
            window.dispatchEvent(new CustomEvent('vendor_settings_updated', { detail: res.action.settings }));
            toast.success(res.action.message || 'Store settings updated successfully!');
          } else if (res.action.type === 'payout_requested') {
            window.dispatchEvent(new CustomEvent('vendor_payout_requested', { detail: res.action }));
            toast.success(res.action.message || 'Payout request processed successfully!');
          }
        }

        const atlasMsg = {
          sender: 'atlas',
          text: res?.message || 'I processed your store intelligence request.',
          actions: res?.actions || [],
          suggestions: res?.suggestions || []
        };

        setMessages((prev) => [...prev, atlasMsg]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'atlas',
            text: 'I encountered an error connecting to store intelligence. Please verify network and try again.',
            suggestions: ['Which items need restocking?', 'Sales Trend']
          }
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, activeConversationId, activeModel, isListening, inputValue]
  );

  // External initial query trigger (executes exactly once per query when opened)
  useEffect(() => {
    if (isOpen && initialQuery && initialQuery.trim() && sentInitialQueryRef.current !== initialQuery) {
      sentInitialQueryRef.current = initialQuery;
      handleSend(initialQuery);
    }
    if (!isOpen) {
      sentInitialQueryRef.current = null;
    }
  }, [isOpen, initialQuery, handleSend]);

  const handleStartNewChat = async () => {
    try {
      const newConv = await createAtlasConversation('New Store Intelligence Chat', activeModel);
      setActiveConversationId(newConv._id);
    } catch {
      setActiveConversationId(null);
    }
    setMessages([]);
    setSubView('chat');
    toast.success('Started a fresh store intelligence session');
  };

  const handleSelectConversation = async (convId) => {
    setLoading(true);
    try {
      const conv = await getAtlasConversation(convId);
      if (conv) {
        setActiveConversationId(conv._id);
        if (conv.agentMode) setActiveModel(conv.agentMode);
        const mapped = (conv.messages || []).map((m) => ({
          sender: m.role === 'user' ? 'user' : 'atlas',
          text: m.content,
          actions: m.structuredData?.actions || [],
          suggestions: m.structuredData?.suggestions || []
        }));
        setMessages(
          mapped.length > 0
            ? mapped
            : [
                {
                  sender: 'atlas',
                  text: 'Loaded conversation session. How can I assist you?',
                  suggestions: quickPrompts
                }
              ]
        );
      }
    } catch (err) {
      toast.error('Could not load conversation history.');
    } finally {
      setLoading(false);
      setSubView('chat');
    }
  };

  const currentModel =
    VENDOR_MODELS.find((a) => a.id === activeModel) || VENDOR_MODELS[0];

  if (!isOpen) return null;

  return (
    <div className="vendor-ai-modal-backdrop" onClick={onClose}>
      <div
        className="vendor-ai-wide-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Atlas AI Vendor Copilot"
      >
        {/* MODAL HEADER */}
        <div className="vendor-ai-modal-header">
          <div className="vendor-ai-header-left">
            <div className="vendor-ai-avatar">
              <img
                src="/atlas-mascot.png"
                alt="Atlas AI"
                className="vendor-ai-avatar-img"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <span className="vendor-ai-status-dot" />
            </div>

            <div className="vendor-ai-title-wrap">
              <div className="vendor-ai-title-row">
                <h3>Atlas AI</h3>
                {/* Active Agent Model Badge with quick Switch click */}
                <button
                  type="button"
                  className="vendor-ai-agent-badge clickable"
                  onClick={() => setSubView(subView === 'agents' ? 'chat' : 'agents')}
                  title="Click to switch AI Engine & Model"
                >
                  <span className="vendor-ai-mode-dot" style={{ background: currentModel.color }} />
                  <span className="vendor-ai-badge-text">{currentModel.name}</span>
                  <ChevronDown size={11} className="vendor-ai-chevron" />
                </button>
              </div>
              <p>Vendor Business Copilot &amp; Inventory Intelligence</p>
            </div>
          </div>

          {/* TOP CONTROLS (History, Settings, New Chat, Switch Agents, Close) */}
          <div className="vendor-ai-header-controls">
            <button
              type="button"
              className={`vendor-ai-control-btn ${subView === 'history' ? 'active' : ''}`}
              title="Chat History"
              onClick={() => setSubView(subView === 'history' ? 'chat' : 'history')}
            >
              <History size={17} />
              <span className="btn-label">History</span>
            </button>

            <button
              type="button"
              className={`vendor-ai-control-btn ${subView === 'settings' ? 'active' : ''}`}
              title="Settings"
              onClick={() => setSubView(subView === 'settings' ? 'chat' : 'settings')}
            >
              <Settings size={17} />
              <span className="btn-label">Settings</span>
            </button>

            <button
              type="button"
              className={`vendor-ai-control-btn ${subView === 'agents' ? 'active' : ''}`}
              title="Switch Agents"
              onClick={() => setSubView(subView === 'agents' ? 'chat' : 'agents')}
            >
              <Users size={17} />
              <span className="btn-label">Agents</span>
            </button>

            <button
              type="button"
              className="vendor-ai-control-btn new-chat"
              title="Start New Chat"
              onClick={handleStartNewChat}
            >
              <Plus size={17} />
              <span className="btn-label">New Chat</span>
            </button>

            <button
              type="button"
              className="vendor-ai-close-btn"
              onClick={onClose}
              aria-label="Close Atlas Modal"
            >
              <X size={19} />
            </button>
          </div>
        </div>

        {/* SUBVIEWS */}
        {subView === 'history' && (
          <VendorAiHistory
            onSelectConversation={handleSelectConversation}
            onStartNewChat={handleStartNewChat}
            onBack={() => setSubView('chat')}
            activeConversationId={activeConversationId}
            currentAgentMode={activeModel}
          />
        )}

        {subView === 'settings' && (
          <VendorAiSettings
            onBack={() => setSubView('chat')}
            onProviderChange={(p) => {
              toast.info(`Switched AI provider to ${p}`);
            }}
          />
        )}

        {subView === 'agents' && (
          <VendorAiAgentPicker
            activeAgentId={activeModel}
            onSelectAgent={(modelId) => {
              setActiveModel(modelId);
              localStorage.setItem('atlas_ai_provider', modelId);
              const model = VENDOR_MODELS.find((m) => m.id === modelId);
              toast.success(`Switched AI Engine to ${model?.name || modelId}`);
              setSubView('chat');
            }}
            onBack={() => setSubView('chat')}
          />
        )}

        {/* MAIN CHAT VIEW (Spacious Wide Layout) */}
        {subView === 'chat' && (
          <>
            {/* MODEL BANNER & QUICK PROMPTS CHIPS BAR */}
            <div className="vendor-ai-agent-banner">
              <div className="vendor-ai-banner-agent-info">
                <span className="banner-agent-title">AI Engine:</span>
                <span className="banner-agent-name">{currentModel.name}</span>
                <span className="banner-agent-desc">— {currentModel.flow}</span>
              </div>

              <div className="vendor-ai-prompts-bar">
                {(pageContext?.quickChips || quickPrompts).map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="vendor-ai-prompt-chip"
                    onClick={() => handleSend(p)}
                    disabled={loading}
                  >
                    <Sparkles size={12} style={{ color: currentModel.color }} />
                    <span>{p}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* MESSAGES LIST */}
            <div className="vendor-ai-messages">
              {messages.length === 0 && (
                <VendorAiWelcome onSelectPrompt={(q) => handleSend(q)} />
              )}
              {messages.map((m, idx) => (
                <div key={idx} className={`vendor-ai-message ${m.sender}`}>
                  <div className="vendor-msg-avatar">
                    {m.sender === 'atlas' ? (
                      <img
                        src="/atlas-mascot.png"
                        alt="Atlas"
                        className="vendor-msg-avatar-img"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      'You'
                    )}
                  </div>
                  <div className="vendor-msg-bubble">
                    <FormattedAtlasMessage text={m.text} />

                    {/* Quick Action Navigation Links */}
                    {Array.isArray(m.actions) && m.actions.length > 0 && (
                      <div className="vendor-ai-actions">
                        {m.actions.map((act, aIdx) => (
                          <a
                            key={aIdx}
                            href={act.url}
                            className="vendor-ai-action-btn"
                            onClick={onClose}
                          >
                            <ExternalLink size={13} />
                            <span>{act.label}</span>
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Contextual Suggestion Pills */}
                    {Array.isArray(m.suggestions) && m.suggestions.length > 0 && (
                      <div className="vendor-ai-msg-suggestions">
                        {m.suggestions.map((sug, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            className="vendor-ai-sub-chip"
                            onClick={() => handleSend(sug)}
                            disabled={loading}
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="vendor-ai-message atlas">
                  <div className="vendor-msg-avatar">
                    <Sparkles size={16} />
                  </div>
                  <div className="vendor-ai-typing">
                    <div className="vendor-ai-typing-dot" />
                    <div className="vendor-ai-typing-dot" />
                    <div className="vendor-ai-typing-dot" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* INPUT BAR WITH VOICE DICTATION */}
            <div className="vendor-ai-input-wrapper">
              <form
                className="vendor-ai-input-bar"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(inputValue);
                }}
              >
                <textarea
                  ref={textareaRef}
                  className="vendor-ai-input"
                  placeholder={
                    isListening
                      ? 'Listening to your voice... Speak now.'
                      : 'Ask Atlas about sales trends, low stock, dead stock, pricing, copywriting...'
                  }
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(inputValue);
                    }
                  }}
                  rows={1}
                  disabled={loading}
                />

                <div className="vendor-ai-input-buttons">
                  {/* Voice Button */}
                  <button
                    type="button"
                    className={`vendor-ai-mic-btn ${isListening ? 'listening' : ''}`}
                    onClick={toggleVoice}
                    title={
                      !voiceSupported
                        ? 'Voice input not supported in this browser'
                        : isListening
                        ? 'Stop listening'
                        : 'Voice dictation'
                    }
                  >
                    {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>

                  {/* Send Button */}
                  <button
                    type="submit"
                    className="vendor-ai-send-btn"
                    disabled={loading || !inputValue.trim()}
                    aria-label="Send message to Atlas"
                    title="Send message"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
