import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Sparkles, Zap, Bot, Search, ShieldCheck, Cpu, Layers } from 'lucide-react';
import { getAtlasSettings, updateAtlasSettings } from '../../services/vendorAiService';
import { toast } from '../Toast';

const PROVIDER_OPTIONS = [
  {
    value: 'auto',
    label: 'Auto Router (Recommended)',
    desc: '5-tier cascade: Gemini → OpenRouter → Groq → Cerebras → Local NLP',
    icon: <Sparkles size={16} />,
    color: '#6366f1'
  },
  {
    value: 'gemini',
    label: 'Google Gemini AI',
    desc: 'Deep reasoning, financial analytics, and inventory recommendations',
    icon: <Zap size={16} />,
    color: '#10b981'
  },
  {
    value: 'openrouter',
    label: 'OpenRouter Cloud AI',
    desc: 'Multi-LLM gateway router (Llama 3.3 / Mistral)',
    icon: <Bot size={16} />,
    color: '#f59e0b'
  },
  {
    value: 'groq',
    label: 'Groq LPU Cloud AI',
    desc: 'High-speed LPU inference engine (openai/gpt-oss-120b)',
    icon: <Cpu size={16} />,
    color: '#f97316'
  },
  {
    value: 'cerebras',
    label: 'Cerebras Wafer AI',
    desc: 'Wafer-scale high-throughput inference (gpt-oss-120b)',
    icon: <Layers size={16} />,
    color: '#8b5cf6'
  },
  {
    value: 'nlp',
    label: 'Fast Local Rule Engine',
    desc: 'Deterministic catalog tool executor (zero latency, offline fallback)',
    icon: <Search size={16} />,
    color: '#3b82f6'
  }
];

export default function VendorAiSettings({ onBack, onProviderChange }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    aiProviderPreference: localStorage.getItem('atlas_ai_provider') || 'auto',
    voiceInputEnabled: true,
    suggestedPromptsEnabled: true,
    saveConversationsEnabled: true,
    reorderThreshold: 10,
    deadStockDays: 30,
    targetMarginPct: 25
  });

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await getAtlasSettings();
        if (isMounted && res?.settings) {
          const s = res.settings;
          const localPref = localStorage.getItem('atlas_ai_provider') || s.aiProviderPreference || 'auto';
          setFormData({
            aiProviderPreference: localPref,
            voiceInputEnabled: s.voiceInputEnabled !== false,
            suggestedPromptsEnabled: s.suggestedPromptsEnabled !== false,
            saveConversationsEnabled: s.saveConversationsEnabled !== false,
            reorderThreshold: s.reorderThreshold || 10,
            deadStockDays: s.deadStockDays || 30,
            targetMarginPct: s.targetMarginPct || 25
          });
        }
      } catch (err) {
        console.warn('Could not load Atlas settings:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateAtlasSettings({
        aiProviderPreference: formData.aiProviderPreference,
        voiceInputEnabled: Boolean(formData.voiceInputEnabled),
        suggestedPromptsEnabled: Boolean(formData.suggestedPromptsEnabled),
        saveConversationsEnabled: Boolean(formData.saveConversationsEnabled),
        reorderThreshold: Number(formData.reorderThreshold) || 10,
        deadStockDays: Number(formData.deadStockDays) || 30,
        targetMarginPct: Number(formData.targetMarginPct) || 25
      });
      localStorage.setItem('atlas_ai_provider', formData.aiProviderPreference);
      if (onProviderChange) onProviderChange(formData.aiProviderPreference);
      toast.success('Atlas AI settings saved successfully!');
      if (onBack) onBack();
    } catch (err) {
      toast.error(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="vendor-ai-subpanel">
      <div className="vendor-ai-subpanel-header">
        <div className="vendor-ai-subpanel-header-left">
          <button type="button" className="vendor-ai-subpanel-back-btn" onClick={onBack} title="Back to Chat">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h3>Atlas Settings</h3>
            <p>Configure intelligence models &amp; inventory thresholds</p>
          </div>
        </div>
        <button
          type="button"
          className="vendor-ai-subpanel-action-btn primary"
          onClick={handleSave}
          disabled={saving || loading}
        >
          <Save size={15} />
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      {loading ? (
        <div className="vendor-ai-subpanel-loading">
          <div className="vendor-ai-spinner" />
          <span>Loading settings...</span>
        </div>
      ) : (
        <form className="vendor-ai-settings-form" onSubmit={handleSave}>
          {/* Section 1: AI Model Engine */}
          <div className="vendor-ai-settings-section">
            <label className="vendor-ai-section-title">AI Intelligence Engine</label>
            <p className="vendor-ai-section-sub">Choose which model powers your store analytics and recommendations</p>

            <div className="vendor-ai-provider-cards">
              {PROVIDER_OPTIONS.map((opt) => {
                const isSelected = formData.aiProviderPreference === opt.value;
                return (
                  <div
                    key={opt.value}
                    className={`vendor-ai-provider-card ${isSelected ? 'active' : ''}`}
                    onClick={() => setFormData((prev) => ({ ...prev, aiProviderPreference: opt.value }))}
                  >
                    <div className="vendor-ai-provider-icon" style={{ color: opt.color }}>
                      {opt.icon}
                    </div>
                    <div className="vendor-ai-provider-text">
                      <strong>{opt.label}</strong>
                      <p>{opt.desc}</p>
                    </div>
                    <div className={`vendor-ai-radio-circle ${isSelected ? 'checked' : ''}`} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Store Automation Thresholds */}
          <div className="vendor-ai-settings-section">
            <label className="vendor-ai-section-title">Inventory &amp; Pricing Thresholds</label>
            <p className="vendor-ai-section-sub">Custom alert triggers used by Atlas when scanning catalog health</p>

            <div className="vendor-ai-settings-grid">
              <div className="vendor-ai-field-group">
                <label>Low Stock Reorder Alert (units)</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={formData.reorderThreshold}
                  onChange={(e) => setFormData((prev) => ({ ...prev, reorderThreshold: e.target.value }))}
                  className="vendor-ai-text-input"
                />
                <span className="vendor-ai-field-hint">Flag product when stock reaches this minimum</span>
              </div>

              <div className="vendor-ai-field-group">
                <label>Dead Stock Liquidation Horizon (days)</label>
                <input
                  type="number"
                  min="7"
                  max="180"
                  value={formData.deadStockDays}
                  onChange={(e) => setFormData((prev) => ({ ...prev, deadStockDays: e.target.value }))}
                  className="vendor-ai-text-input"
                />
                <span className="vendor-ai-field-hint">Identify products with 0 sales over this period</span>
              </div>

              <div className="vendor-ai-field-group">
                <label>Target Profit Margin (%)</label>
                <input
                  type="number"
                  min="5"
                  max="90"
                  value={formData.targetMarginPct}
                  onChange={(e) => setFormData((prev) => ({ ...prev, targetMarginPct: e.target.value }))}
                  className="vendor-ai-text-input"
                />
                <span className="vendor-ai-field-hint">Benchmark for price recommendations</span>
              </div>
            </div>
          </div>

          {/* Section 3: Preferences Toggles */}
          <div className="vendor-ai-settings-section">
            <label className="vendor-ai-section-title">Chat &amp; Input Preferences</label>

            <div className="vendor-ai-toggle-row">
              <div>
                <strong>Voice Speech Dictation</strong>
                <p>Enable microphone dictation in the input bar</p>
              </div>
              <input
                type="checkbox"
                checked={formData.voiceInputEnabled}
                onChange={(e) => setFormData((prev) => ({ ...prev, voiceInputEnabled: e.target.checked }))}
                className="vendor-ai-checkbox"
              />
            </div>

            <div className="vendor-ai-toggle-row">
              <div>
                <strong>Auto Quick-Prompt Chips</strong>
                <p>Display contextual suggested action pills after AI answers</p>
              </div>
              <input
                type="checkbox"
                checked={formData.suggestedPromptsEnabled}
                onChange={(e) => setFormData((prev) => ({ ...prev, suggestedPromptsEnabled: e.target.checked }))}
                className="vendor-ai-checkbox"
              />
            </div>

            <div className="vendor-ai-toggle-row">
              <div>
                <strong>Save Conversation History</strong>
                <p>Retain audit records and chats in MongoDB</p>
              </div>
              <input
                type="checkbox"
                checked={formData.saveConversationsEnabled}
                onChange={(e) => setFormData((prev) => ({ ...prev, saveConversationsEnabled: e.target.checked }))}
                className="vendor-ai-checkbox"
              />
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

