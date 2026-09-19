import { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Save,
  ShieldCheck,
  MapPin,
  CreditCard,
  Wallet,
  Cpu,
  Zap,
  Bot,
  Search,
  Sparkles,
  Layers
} from 'lucide-react';
import { getDarwinSettings, updateDarwinSettings } from '../../services/darwinService';
import { toast } from '../Toast';
import DarwinDropdown from './DarwinDropdown';

export default function DarwinSettings({ onBack, onProviderChange }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [formData, setFormData] = useState({
    aiProviderPreference: localStorage.getItem('darwin_ai_provider') || 'auto',
    defaultAddressId: '',
    defaultPaymentMethodId: '',
    budgetPreference: 0,
    voiceInputEnabled: true,
    suggestedPromptsEnabled: true,
    saveConversationsEnabled: true
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getDarwinSettings();
        if (mounted) {
          const s = res.settings || {};
          const savedPref = s.aiProviderPreference || localStorage.getItem('darwin_ai_provider') || 'auto';
          setFormData({
            aiProviderPreference: savedPref,
            defaultAddressId: s.defaultAddressId || '',
            defaultPaymentMethodId: s.defaultPaymentMethodId || '',
            budgetPreference: s.budgetPreference || 0,
            voiceInputEnabled: s.voiceInputEnabled !== false,
            suggestedPromptsEnabled: s.suggestedPromptsEnabled !== false,
            saveConversationsEnabled: s.saveConversationsEnabled !== false
          });
          setAddresses(res.addresses || []);
          setPaymentMethods(res.paymentMethods || []);
        }
      } catch (err) {
        console.warn('Could not load Darwin settings:', err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        aiProviderPreference: formData.aiProviderPreference || 'auto',
        defaultAddressId: formData.defaultAddressId ? formData.defaultAddressId : null,
        defaultPaymentMethodId: formData.defaultPaymentMethodId ? formData.defaultPaymentMethodId : null,
        budgetPreference: Number(formData.budgetPreference) || 0,
        voiceInputEnabled: Boolean(formData.voiceInputEnabled),
        suggestedPromptsEnabled: Boolean(formData.suggestedPromptsEnabled),
        saveConversationsEnabled: Boolean(formData.saveConversationsEnabled)
      };

      await updateDarwinSettings(payload);
      localStorage.setItem('darwin_ai_provider', formData.aiProviderPreference || 'auto');
      if (typeof onProviderChange === 'function') {
        onProviderChange(formData.aiProviderPreference || 'auto');
      }
      toast.success('Darwin preferences saved successfully!');
      if (onBack) onBack();
    } catch (err) {
      toast.error(err.message || 'Failed to save preferences.');
    } finally {
      setSaving(false);
    }
  };

  const addressOptions = useMemo(() => [
    {
      value: '',
      label: 'Smart System Address (Navbar & Active Location)',
      subLabel: 'Darwin prioritizes your active navbar location, then recent order address, then profile default',
      badge: 'Smart Auto',
      icon: <Sparkles size={16} />
    },
    ...addresses.map((a) => ({
      value: a._id,
      label: `${a.fullName} — ${a.city}`,
      subLabel: `${a.addressLine1 || a.area || ''}${a.addressLine2 ? ', ' + a.addressLine2 : ''}, ${a.pincode || ''}`,
      badge: a.type?.toUpperCase() || (a.isDefault ? 'Default' : ''),
      icon: <MapPin size={16} />
    }))
  ], [addresses]);

  const paymentOptions = useMemo(() => [
    {
      value: '',
      label: 'Store Wallet',
      subLabel: 'Instant 1-click checkout with your store balance',
      badge: 'Default',
      icon: <Wallet size={16} />
    },
    ...paymentMethods.map((pm) => ({
      value: pm._id,
      label: pm.label || (pm.type ? pm.type.toUpperCase() : 'Payment Method'),
      subLabel: pm.isDefault ? 'Default payment method' : 'Saved payment method',
      badge: pm.type?.toUpperCase(),
      icon: <CreditCard size={16} />
    }))
  ], [paymentMethods]);

  const aiModelOptions = useMemo(() => [
    {
      value: 'auto',
      label: 'Auto AI Router (Recommended)',
      subLabel: '5-tier cascade: Gemini → OpenRouter → Groq → Cerebras → Local Search',
      badge: 'Recommended',
      icon: <Sparkles size={16} />
    },
    {
      value: 'gemini',
      label: 'Google Gemini 3.5 Flash',
      subLabel: 'Primary high-speed AI with deep catalog reasoning & live actions',
      badge: 'Primary AI',
      icon: <Zap size={16} />
    },
    {
      value: 'openrouter',
      label: 'OpenRouter AI (Backup Engine)',
      subLabel: 'Secondary backup AI router (Llama 3.3, Mistral, Free models)',
      badge: 'Backup AI',
      icon: <Bot size={16} />
    },
    {
      value: 'groq',
      label: 'Groq LPU Cloud AI',
      subLabel: 'High-speed LPU inference engine (openai/gpt-oss-120b)',
      badge: 'LPU Speed',
      icon: <Cpu size={16} />
    },
    {
      value: 'cerebras',
      label: 'Cerebras Wafer AI',
      subLabel: 'Wafer-scale high-throughput inference (gpt-oss-120b)',
      badge: 'Wafer Scale',
      icon: <Layers size={16} />
    },
    {
      value: 'nlp',
      label: 'Smart Search Mode (Local Engine)',
      subLabel: 'Instant deterministic catalog search & rule engine (Zero external AI latency)',
      badge: 'Fast / Offline',
      icon: <Search size={16} />
    }
  ], []);

  return (
    <div className="darwin-subpanel-view">
      <div className="darwin-subpanel-header">
        <button type="button" className="darwin-subpanel-back-btn" onClick={onBack}>
          <ArrowLeft size={18} />
        </button>
        <h3>Darwin Settings &amp; Defaults</h3>
      </div>

      {loading ? (
        <div className="darwin-subpanel-loading">
          <div className="spinner-small" />
          <span>Loading preferences...</span>
        </div>
      ) : (
        <form onSubmit={handleSave} className="darwin-settings-form">
          {/* Section: AI Intelligence Engine */}
          <div className="darwin-settings-section">
            <span className="darwin-settings-sec-title">
              <Cpu size={16} /> AI Model &amp; Engine
            </span>
            <p className="darwin-settings-sec-desc">
              Choose which AI model powers Darwin's shopping advice and product search.
            </p>

            <div className="darwin-form-group">
              <label>Selected AI Model</label>
              <DarwinDropdown
                value={formData.aiProviderPreference}
                onChange={(val) => setFormData({ ...formData, aiProviderPreference: val })}
                options={aiModelOptions}
                placeholder="Select AI Model"
              />
            </div>
          </div>
          {/* Section: Shopping Defaults */}
          <div className="darwin-settings-section">
            <span className="darwin-settings-sec-title">
              <ShieldCheck size={16} /> Shopping Defaults
            </span>
            <p className="darwin-settings-sec-desc">
              Darwin uses these defaults to speed up conversational checkout and show tailored recommendations.
            </p>

            {/* Default Address */}
            <div className="darwin-form-group">
              <label>Default Delivery Address</label>
              <DarwinDropdown
                value={formData.defaultAddressId}
                onChange={(val) => setFormData({ ...formData, defaultAddressId: val })}
                options={addressOptions}
                placeholder="Select default delivery address"
              />
            </div>

            {/* Default Payment Method */}
            <div className="darwin-form-group">
              <label>Default Payment Method</label>
              <DarwinDropdown
                value={formData.defaultPaymentMethodId}
                onChange={(val) => setFormData({ ...formData, defaultPaymentMethodId: val })}
                options={paymentOptions}
                placeholder="Select default payment method"
              />
            </div>

            {/* Target Budget */}
            <div className="darwin-form-group">
              <label>Preferred Shopping Budget (₹)</label>
              <input
                type="number"
                value={formData.budgetPreference || ''}
                onChange={(e) => setFormData({ ...formData, budgetPreference: parseInt(e.target.value, 10) || 0 })}
                placeholder="e.g. 5000 (0 for no limit)"
                className="darwin-form-input"
              />
            </div>
          </div>

          {/* Section: Assistant Preferences */}
          <div className="darwin-settings-section">
            <span className="darwin-settings-sec-title">
              <Sparkles size={16} /> Assistant Experience
            </span>

            {/* Voice Input Toggle */}
            <label className="darwin-toggle-row">
              <div className="darwin-toggle-info">
                <strong>Microphone Voice Input</strong>
                <span>Allow speech-to-text dictation via microphone</span>
              </div>
              <input
                type="checkbox"
                checked={formData.voiceInputEnabled}
                onChange={(e) => setFormData({ ...formData, voiceInputEnabled: e.target.checked })}
              />
            </label>

            {/* Suggested Prompts Toggle */}
            <label className="darwin-toggle-row">
              <div className="darwin-toggle-info">
                <strong>Quick Suggestion Pills</strong>
                <span>Show smart action pills &amp; follow-up questions</span>
              </div>
              <input
                type="checkbox"
                checked={formData.suggestedPromptsEnabled}
                onChange={(e) => setFormData({ ...formData, suggestedPromptsEnabled: e.target.checked })}
              />
            </label>

            {/* Save Conversations Toggle */}
            <label className="darwin-toggle-row">
              <div className="darwin-toggle-info">
                <strong>Save Shopping Chats</strong>
                <span>Preserve conversation history across visits</span>
              </div>
              <input
                type="checkbox"
                checked={formData.saveConversationsEnabled}
                onChange={(e) => setFormData({ ...formData, saveConversationsEnabled: e.target.checked })}
              />
            </label>
          </div>

          <div className="darwin-settings-footer">
            <button type="submit" className="darwin-save-settings-btn" disabled={saving}>
              <Save size={16} />
              <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

