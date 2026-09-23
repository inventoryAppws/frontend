import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Send,
  Mic,
  MicOff,
  History,
  Settings,
  Plus,
  Bot,
  AlertCircle,
  Sparkles,
  Info,
  ChevronDown,
  Check,
  Zap,
  Search,
  Cpu,
  Layers
} from 'lucide-react';
import DarwinWelcome from './DarwinWelcome';
import DarwinMessage from './DarwinMessage';
import DarwinSettings from './DarwinSettings';
import DarwinConversationHistory from './DarwinConversationHistory';
import {
  sendDarwinMessage,
  executeDarwinAction,
  getDarwinConversation,
  getDarwinSuggestions,
  getDarwinSettings,
  updateDarwinSettings
} from '../../services/darwinService';
import { toast } from '../Toast';
import { getCustomerPageContext } from '../../utils/customerPageContext';

const MODEL_OPTIONS = [
  {
    value: 'auto',
    label: 'Auto Router',
    badge: 'Recommended',
    desc: '5-tier cascade (Gemini → OpenRouter → Groq → Cerebras → Local)',
    icon: <Sparkles size={15} />,
    color: '#3b82f6'
  },
  {
    value: 'gemini',
    label: 'Google Gemini AI',
    badge: 'Primary AI',
    desc: 'Google Gemini 3.5 Flash with deep catalog reasoning',
    icon: <Zap size={15} />,
    color: '#10b981'
  },
  {
    value: 'openrouter',
    label: 'OpenRouter AI',
    badge: 'Backup AI',
    desc: 'Multi-model backup router (Llama 3.3, Mistral)',
    icon: <Bot size={15} />,
    color: '#f59e0b'
  },
  {
    value: 'groq',
    label: 'Groq LPU Cloud',
    badge: 'LPU Speed',
    desc: 'High-speed LPU inference engine (openai/gpt-oss-120b)',
    icon: <Cpu size={15} />,
    color: '#f97316'
  },
  {
    value: 'cerebras',
    label: 'Cerebras Wafer AI',
    badge: 'Wafer Scale',
    desc: 'Wafer-scale high-throughput inference (gpt-oss-120b)',
    icon: <Layers size={15} />,
    color: '#8b5cf6'
  },
  {
    value: 'nlp',
    label: 'Smart Search Mode',
    badge: 'Local NLP',
    desc: 'Instant catalog search & rule engine (Zero AI latency)',
    icon: <Search size={15} />,
    color: '#6366f1'
  }
];

export default function DarwinChatDrawer({
  isOpen = false,
  onClose,
  currentProductContext = null,
  onCartUpdate,
  onWishlistUpdate,
  onOpenModal,
  onOpenPayments,
  onOpenNotifications
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeMode, setActiveMode] = useState('gemini'); // 'gemini' | 'openrouter' | 'nlp'
  const [selectedProvider, setSelectedProvider] = useState(
    () => localStorage.getItem('darwin_ai_provider') || 'auto'
  );
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [subView, setSubView] = useState('chat'); // 'chat' | 'history' | 'settings'
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [headerImgError, setHeaderImgError] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Sync initial provider readiness & user saved preference
  useEffect(() => {
    let isMounted = true;
    getDarwinSuggestions()
      .then((data) => {
        if (isMounted && data?.providerStatus?.activeMode) {
          const localPref = localStorage.getItem('darwin_ai_provider');
          if (!localPref || localPref === 'auto') {
            setActiveMode(data.providerStatus.activeMode);
          } else {
            setActiveMode(localPref);
          }
        }
      })
      .catch(() => {});

    getDarwinSettings()
      .then((res) => {
        if (isMounted && res?.settings?.aiProviderPreference) {
          const pref = res.settings.aiProviderPreference;
          setSelectedProvider(pref);
          localStorage.setItem('darwin_ai_provider', pref);
          if (pref !== 'auto') {
            setActiveMode(pref);
          }
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  // Close model popover on click outside
  useEffect(() => {
    if (!showModelPicker) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest('.darwin-model-picker-container')) {
        setShowModelPicker(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [showModelPicker]);

  const handleSelectProvider = async (mode) => {
    setSelectedProvider(mode);
    setShowModelPicker(false);
    localStorage.setItem('darwin_ai_provider', mode);

    if (mode === 'nlp') setActiveMode('nlp');
    else if (mode === 'openrouter') setActiveMode('openrouter');
    else if (mode === 'groq') setActiveMode('groq');
    else if (mode === 'cerebras') setActiveMode('cerebras');
    else if (mode === 'gemini') setActiveMode('gemini');

    try {
      await updateDarwinSettings({ aiProviderPreference: mode });
    } catch {
      // Non-blocking
    }

    const labelMap = {
      auto: 'Auto AI Router (5-Tier Cascade)',
      gemini: 'Google Gemini AI',
      openrouter: 'OpenRouter Backup AI',
      groq: 'Groq LPU Cloud AI',
      cerebras: 'Cerebras Wafer AI',
      nlp: 'Smart Search Mode (Local NLP)'
    };
    toast.success(`Switched AI to ${labelMap[mode] || mode}`);
  };

  // Initialize SpeechRecognition if available
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
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error !== 'no-speech') {
          toast.info('Could not capture voice input. Please type your message.');
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
      toast.info("Voice input isn't supported in this browser. Please use text input.");
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
        toast.info('Listening... Speak your shopping request.');
      } catch (err) {
        console.warn('Could not start microphone:', err);
      }
    }
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isOpen, messages, scrollToBottom]);

  const handleSendMessage = async (textToSend, extraPayload = {}) => {
    const query = String(textToSend || input || '').trim();
    if (!query || loading) return;

    setInput('');
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    const userMessage = {
      role: 'user',
      content: query,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const historyForApi = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
        structuredData: m.structuredData
      }));

      const pageCtx = getCustomerPageContext(window.location.pathname);
      const res = await sendDarwinMessage({
        message: query,
        conversationId: activeConversationId,
        conversationHistory: historyForApi,
        currentProductContext,
        aiProviderPreference: selectedProvider,
        compareProductIds: extraPayload.compareProductIds || null,
        pageContext: {
          path: window.location.pathname,
          title: pageCtx?.pageTitle,
          key: pageCtx?.pageKey
        }
      });

      if (res.conversationId && !activeConversationId) {
        setActiveConversationId(res.conversationId);
      }

      if (res.mode) {
        setActiveMode(res.mode);
      }

      // Handle direct actions returned by AI or NLP
      if (res.action?.type === 'settings_updated') {
        if (res.action.settings?.aiProviderPreference) {
          const newPref = res.action.settings.aiProviderPreference;
          setSelectedProvider(newPref);
          localStorage.setItem('darwin_ai_provider', newPref);
          if (newPref !== 'auto') {
            setActiveMode(newPref);
          }
        }
        toast.success(res.action.message || 'Darwin settings updated!');
      } else if (res.action?.type === 'profile_updated') {
        if (onCartUpdate) onCartUpdate();
        toast.success(res.action.message || 'Profile updated successfully!');
      } else if (res.action?.type === 'address_added' || res.action?.type === 'address_updated' || res.action?.type === 'default_address_set' || res.action?.type === 'delivery_address_selected') {
        if (res.action.address) {
          try {
            localStorage.setItem('selected_delivery_address', JSON.stringify(res.action.address));
            sessionStorage.setItem('checkoutAddress', JSON.stringify(res.action.address));
            window.dispatchEvent(new CustomEvent('delivery-address-changed', { detail: res.action.address }));
          } catch {}
        }
        window.dispatchEvent(new CustomEvent('address_updated', { detail: res.action.address }));
        toast.success(res.action.message || 'Delivery address updated successfully!');
      } else if (res.action?.type === 'address_deleted') {
        window.dispatchEvent(new CustomEvent('address_updated'));
        toast.success('Address removed from your address book.');
      } else if (res.action?.type === 'open_settings') {
        setSubView('settings');
      } else if (res.action?.type === 'open_virtual_tryon') {
        window.dispatchEvent(
          new CustomEvent('open-virtual-tryon', {
            detail: {
              mode: res.action.mode || 'camera',
              product: res.action.product || res.product
            }
          })
        );
      } else if (res.action?.type === 'added_to_cart' || res.action?.success) {
        if (onCartUpdate) onCartUpdate();
      }

      const botMessage = {
        role: 'model',
        content: res.message || "Here is what I found for you:",
        structuredData: {
          products: res.products,
          comparison: res.comparison,
          order: res.order,
          orders: res.orders,
          checkout: res.checkout,
          action: res.action,
          suggestions: res.suggestions
        },
        mode: res.mode,
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error('Darwin chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          content: "I couldn't complete that request. You can search the catalog or try asking me another way.",
          structuredData: { suggestions: ['Show trending products', 'Best deals', 'Browse categories'] },
          mode: 'system',
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(input);
    }
  };

  const handleStartNewChat = () => {
    setMessages([]);
    setActiveConversationId(null);
    setSubView('chat');
    setActiveMode('gemini');
  };

  const handleSelectConversation = async (convId) => {
    setLoading(true);
    try {
      const conv = await getDarwinConversation(convId);
      if (conv) {
        setActiveConversationId(conv._id);
        const mapped = (conv.messages || []).map((m) => ({
          role: m.role,
          content: m.content,
          structuredData: m.structuredData,
          mode: m.mode,
          timestamp: m.timestamp
        }));
        setMessages(mapped);
      }
    } catch (err) {
      toast.error('Could not load conversation history.');
    } finally {
      setLoading(false);
      setSubView('chat');
    }
  };

  const handleAddToCart = async (product) => {
    const res = await executeDarwinAction('addToCart', { productId: product._id, qty: 1 });
    if (onCartUpdate) onCartUpdate();
    return res;
  };

  const handleAddToWishlist = async (product) => {
    const res = await executeDarwinAction('addToWishlist', { productId: product._id });
    if (onWishlistUpdate) onWishlistUpdate();
    return res;
  };

  const handleCompare = (productIds) => {
    handleSendMessage('Compare these products side by side and recommend the best one', {
      compareProductIds: productIds
    });
  };

  const handleOrderPlaced = (orderData) => {
    if (onCartUpdate) onCartUpdate();
  };

  if (!isOpen) return null;

  return (
    <div className="darwin-drawer-backdrop" onClick={onClose}>
      <div className="darwin-drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* TOP HEADER */}
        <div className="darwin-drawer-header">
          <div className="darwin-header-brand">
            <div className="darwin-header-avatar-wrap">
              {!headerImgError ? (
                <img
                  src="/darwin-mascot.png"
                  alt="Darwin"
                  onError={() => setHeaderImgError(true)}
                />
              ) : (
                <Bot size={20} className="darwin-header-fallback-icon" />
              )}
              <span className={`darwin-online-indicator mode-${activeMode}`} />
            </div>
            <div className="darwin-header-titles">
              <div className="darwin-title-row">
                <h3>Darwin</h3>
                <div className="darwin-model-picker-container">
                  <button
                    type="button"
                    className={`darwin-mode-badge ${activeMode} clickable`}
                    onClick={() => setShowModelPicker((prev) => !prev)}
                    title="Click to switch AI Model / Engine"
                  >
                    <span className={`mode-dot ${
                      activeMode === 'gemini' ? 'green' :
                      activeMode === 'openrouter' ? 'amber' :
                      activeMode === 'groq' ? 'orange' :
                      activeMode === 'cerebras' ? 'purple' : 'blue'
                    }`} />
                    <span className="mode-label-text">
                      {activeMode === 'gemini' && 'Darwin AI'}
                      {activeMode === 'openrouter' && 'Backup AI'}
                      {activeMode === 'groq' && 'Groq LPU'}
                      {activeMode === 'cerebras' && 'Cerebras'}
                      {activeMode === 'nlp' && 'Smart Search'}
                    </span>
                    <ChevronDown size={11} className={`mode-chevron ${showModelPicker ? 'rotated' : ''}`} />
                  </button>

                  {showModelPicker && (
                    <div className="darwin-model-popover">
                      <div className="model-popover-header">
                        <span className="model-popover-title">Switch AI Model</span>
                        <span className="model-popover-sub">Select intelligence engine</span>
                      </div>
                      <div className="model-popover-list">
                        {MODEL_OPTIONS.map((opt) => {
                          const isSelected = selectedProvider === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              className={`model-popover-item ${isSelected ? 'active' : ''}`}
                              onClick={() => handleSelectProvider(opt.value)}
                            >
                              <div className="model-popover-icon" style={{ color: opt.color }}>
                                {opt.icon}
                              </div>
                              <div className="model-popover-info">
                                <div className="model-popover-name-row">
                                  <strong>{opt.label}</strong>
                                  {opt.badge && <span className="model-badge">{opt.badge}</span>}
                                </div>
                                <p>{opt.desc}</p>
                              </div>
                              {isSelected && <Check size={14} className="model-check-icon" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <p className="darwin-header-subtitle">
                {activeMode === 'gemini' && 'AI Shopping Companion (Google Gemini)'}
                {activeMode === 'openrouter' && 'Darwin Backup AI (OpenRouter)'}
                {activeMode === 'groq' && 'Darwin Accelerated AI (Groq LPU)'}
                {activeMode === 'cerebras' && 'Darwin High-Speed AI (Cerebras Wafer)'}
                {activeMode === 'nlp' && 'Smart Catalog Assistant (Fast Local Search)'}
              </p>
            </div>
          </div>

          <div className="darwin-header-controls">
            <button
              type="button"
              className={`darwin-head-btn ${subView === 'history' ? 'active' : ''}`}
              title="Chat History"
              onClick={() => setSubView(subView === 'history' ? 'chat' : 'history')}
            >
              <History size={17} />
            </button>
            <button
              type="button"
              className={`darwin-head-btn ${subView === 'settings' ? 'active' : ''}`}
              title="Darwin Settings"
              onClick={() => setSubView(subView === 'settings' ? 'chat' : 'settings')}
            >
              <Settings size={17} />
            </button>
            <button
              type="button"
              className="darwin-head-btn"
              title="Start New Chat"
              onClick={handleStartNewChat}
            >
              <Plus size={18} />
            </button>
            <button
              type="button"
              className="darwin-head-btn close"
              title="Close Darwin"
              onClick={onClose}
            >
              <X size={19} />
            </button>
          </div>
        </div>

        {/* PROVIDER STATUS NOTICE BANNERS */}
        {subView === 'chat' && selectedProvider !== 'openrouter' && activeMode === 'openrouter' && (
          <div className="darwin-mode-notice-banner openrouter">
            <Sparkles size={15} />
            <span>Gemini is unavailable — Darwin is using Backup AI with live tool capabilities.</span>
          </div>
        )}

        {subView === 'chat' && selectedProvider !== 'nlp' && activeMode === 'nlp' && (
          <div className="darwin-mode-notice-banner nlp">
            <Info size={15} />
            <span>AI providers are offline — Darwin is using Smart Search Mode right now.</span>
          </div>
        )}

        {/* SUBVIEWS (HISTORY OR SETTINGS) */}
        {subView === 'history' && (
          <DarwinConversationHistory
            onSelectConversation={handleSelectConversation}
            onStartNewChat={handleStartNewChat}
            onBack={() => setSubView('chat')}
            activeConversationId={activeConversationId}
          />
        )}

        {subView === 'settings' && (
          <DarwinSettings
            onBack={() => setSubView('chat')}
            onProviderChange={(newProv) => {
              setSelectedProvider(newProv);
              if (newProv === 'nlp') setActiveMode('nlp');
              else if (newProv === 'openrouter') setActiveMode('openrouter');
              else if (newProv === 'gemini') setActiveMode('gemini');
            }}
          />
        )}

        {/* MAIN CHAT VIEW */}
        {subView === 'chat' && (
          <>
            <div className="darwin-drawer-body">
              {messages.length === 0 ? (
                <DarwinWelcome onSelectPrompt={(prompt) => handleSendMessage(prompt)} />
              ) : (
                <div className="darwin-messages-stream">
                  {messages.map((msg, idx) => (
                    <DarwinMessage
                      key={idx}
                      message={msg}
                      onAddToCart={handleAddToCart}
                      onAddToWishlist={handleAddToWishlist}
                      onCompare={handleCompare}
                      onAskQuery={(q) => handleSendMessage(q)}
                      onCloseDrawer={onClose}
                      onOrderPlaced={handleOrderPlaced}
                      onOpenModal={onOpenModal}
                      onOpenPayments={onOpenPayments}
                      onOpenNotifications={onOpenNotifications}
                      onOpenSettings={() => setSubView('settings')}
                    />
                  ))}

                  {/* Typing / Loading Indicator */}
                  {loading && (
                    <div className="darwin-msg-row darwin-msg-row-loading">
                      <div className="darwin-msg-avatar-box">
                        <div className="darwin-bot-avatar">
                          <Bot size={16} />
                        </div>
                      </div>
                      <div className="darwin-typing-bubble">
                        <span className="darwin-typing-dot" />
                        <span className="darwin-typing-dot" />
                        <span className="darwin-typing-dot" />
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* INPUT FOOTER BAR */}
            <div className="darwin-drawer-footer">
              <div className="darwin-input-container">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isListening
                      ? 'Listening to voice input...'
                      : 'Ask Darwin anything (e.g. Shoes under ₹2,000)...'
                  }
                  rows={1}
                  className="darwin-chat-textarea"
                />

                <div className="darwin-input-actions">
                  {/* Voice Button */}
                  <button
                    type="button"
                    className={`darwin-mic-btn ${isListening ? 'listening' : ''}`}
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
                    type="button"
                    className="darwin-send-btn"
                    onClick={() => handleSendMessage(input)}
                    disabled={!input.trim() || loading}
                    title="Send message"
                  >
                    <Send size={15} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

