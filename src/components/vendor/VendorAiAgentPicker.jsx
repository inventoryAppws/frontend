import React from 'react';
import { ArrowLeft, Check, Sparkles, Zap, Bot, Search, ShieldCheck, Cpu, Layers } from 'lucide-react';

export const VENDOR_MODELS = [
  {
    id: 'auto',
    name: 'Auto Router',
    badge: 'Recommended',
    flow: 'Gemini → OpenRouter → Groq → Cerebras → Local NLP',
    desc: 'Intelligent 5-tier failover across all cloud engines and local NLP for 100% zero downtime.',
    icon: Sparkles,
    color: '#6366f1',
    bgColor: '#eef2ff',
    latency: '< 350ms',
    status: '5-Tier Redundant'
  },
  {
    id: 'gemini',
    name: 'Google Gemini 3.5 Flash',
    badge: 'Primary AI',
    flow: 'Direct Google Gemini Multimodal Engine',
    desc: 'High-speed multimodal intelligence with real-time store queries, restock alerts, and catalog analytics.',
    icon: Zap,
    color: '#10b981',
    bgColor: '#ecfdf5',
    latency: '~350ms',
    status: 'Primary Online'
  },
  {
    id: 'openrouter',
    name: 'OpenRouter Cloud AI',
    badge: 'Tier 2 Backup',
    flow: 'OpenRouter Multi-LLM Gateway (Llama 3.3)',
    desc: 'Multi-model cloud gateway directing prompts to top open-weights models with automated fallback.',
    icon: Bot,
    color: '#f59e0b',
    bgColor: '#fffbeb',
    latency: '~700ms',
    status: 'Cloud Gateway'
  },
  {
    id: 'groq',
    name: 'Groq LPU Cloud AI',
    badge: 'Tier 3 LPU Engine',
    flow: 'Groq LPU Cloud (openai/gpt-oss-120b)',
    desc: 'Ultra-low latency LPU inference with native function calling for high-speed catalog intelligence.',
    icon: Cpu,
    color: '#f97316',
    bgColor: '#fff7ed',
    latency: '~180ms',
    status: 'LPU Accelerated'
  },
  {
    id: 'cerebras',
    name: 'Cerebras Wafer AI',
    badge: 'Tier 4 Wafer Scale',
    flow: 'Cerebras Wafer Cloud (gpt-oss-120b)',
    desc: 'Wafer-scale high-throughput inference engine delivering instantaneous stock health analysis.',
    icon: Layers,
    color: '#8b5cf6',
    bgColor: '#f5f3ff',
    latency: '~150ms',
    status: 'Wafer Engine'
  },
  {
    id: 'nlp',
    name: 'Offline Local NLP',
    badge: 'Tier 5 Zero Latency',
    flow: 'Local High-Speed Analytics Dispatcher',
    desc: 'Runs on local server with zero API costs, zero cloud dependencies, and instant execution.',
    icon: Search,
    color: '#0284c7',
    bgColor: '#f0f9ff',
    latency: '< 15ms',
    status: 'Always Available'
  }
];

// Backward compatibility
export const VENDOR_AGENTS = VENDOR_MODELS;

export default function VendorAiAgentPicker({ activeAgentId, onSelectAgent, onBack }) {
  return (
    <div className="vendor-ai-subpanel">
      <div className="vendor-ai-subpanel-header">
        <div className="vendor-ai-subpanel-header-left">
          <button type="button" className="vendor-ai-subpanel-back-btn" onClick={onBack} title="Back to Chat">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h3>Switch AI Engine &amp; Model</h3>
            <p>Select the reasoning engine used by Atlas AI</p>
          </div>
        </div>
      </div>

      <div className="vendor-ai-subpanel-body">
        <div className="model-picker-banner">
          <ShieldCheck size={16} className="model-picker-banner-icon" />
          <span>
            All AI engines can perform all merchant tasks (sales velocity, restock, pricing, dead stock, copywriting). Switch models anytime based on speed and cloud preference.
          </span>
        </div>

        <div className="model-cards-grid">
          {VENDOR_MODELS.map((model) => {
            const IconComponent = model.icon;
            const isSelected = activeAgentId === model.id;

            return (
              <div
                key={model.id}
                className={`model-card ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectAgent(model.id)}
              >
                <div className="model-card-header">
                  <div className="model-card-header-main">
                    <div
                      className="model-card-icon"
                      style={{ background: model.bgColor, color: model.color }}
                    >
                      <IconComponent size={16} />
                    </div>
                    <div className="model-card-title-group">
                      <div className="model-card-title-row">
                        <h4 className="model-card-name">{model.name}</h4>
                      </div>
                      <span className="model-card-flow">{model.flow}</span>
                    </div>
                  </div>
                  <div className="model-card-tags">
                    <span className="model-card-badge" style={{ color: model.color, background: model.bgColor }}>
                      {model.badge}
                    </span>
                    <span className="model-card-latency">
                      {model.latency}
                    </span>
                  </div>
                </div>

                <p className="model-card-desc">{model.desc}</p>

                <div className="model-card-footer">
                  <div className="model-card-status">
                    <span className="model-card-status-dot" style={{ background: model.color }} />
                    <span>{model.status}</span>
                  </div>
                  <button
                    type="button"
                    className={`model-card-action-btn ${isSelected ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectAgent(model.id);
                    }}
                  >
                    {isSelected ? (
                      <>
                        <Check size={12} /> Active
                      </>
                    ) : (
                      'Select'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
