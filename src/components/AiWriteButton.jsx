import React, { useState } from 'react';
import { Sparkles, Loader2, Check } from 'lucide-react';
import { generateAiWrite } from '../services/aiWriteService';
import { toast } from './Toast';

export default function AiWriteButton({
  task = 'refine_text',
  input = '',
  context = {},
  options = {},
  onGenerated,
  label = 'AI Write',
  size = 'small',
  className = '',
  title = 'Generate or refine text using AI'
}) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleGenerate = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (loading) return;

    setLoading(true);
    setSuccess(false);

    try {
      const res = await generateAiWrite({
        task,
        input: typeof input === 'string' ? input : '',
        context,
        options
      });

      if (onGenerated) {
        onGenerated(res);
      }

      setSuccess(true);
      const providerLabel = res.provider === 'ollama' ? '🦙 Ollama Local' : res.provider === 'groq' ? '⚡ Groq AI' : '✨ Gemini';
      toast.success(`Draft generated with ${providerLabel}!`);

      setTimeout(() => {
        setSuccess(false);
      }, 1600);
    } catch (err) {
      console.error('AI Write failed:', err);
      toast.error(err?.response?.data?.msg || err?.message || 'Failed to generate AI text');
    } finally {
      setLoading(false);
    }
  };

  const isSmall = size === 'small';

  return (
    <button
      type="button"
      className={`ai-write-btn ${isSmall ? 'small' : 'medium'} ${success ? 'success' : ''} ${className}`}
      onClick={handleGenerate}
      disabled={loading}
      title={title}
    >
      {loading ? (
        <>
          <Loader2 size={isSmall ? 12 : 14} className="spin" />
          <span>Generating...</span>
        </>
      ) : success ? (
        <>
          <Check size={isSmall ? 12 : 14} strokeWidth={3} />
          <span>Done!</span>
        </>
      ) : (
        <>
          <Sparkles size={isSmall ? 12 : 14} className="sparkle-icon" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

