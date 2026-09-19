import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, MessageSquare, Trash2, Edit2, Check, Clock } from 'lucide-react';
import {
  getAtlasConversations,
  createAtlasConversation,
  renameAtlasConversation,
  deleteAtlasConversation
} from '../../services/vendorAiService';
import { toast } from '../Toast';

export default function VendorAiHistory({
  onSelectConversation,
  onStartNewChat,
  onBack,
  activeConversationId,
  currentAgentMode
}) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const loadConversations = async () => {
    try {
      const data = await getAtlasConversations();
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Could not load conversations:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const handleStartNew = async () => {
    try {
      const newConv = await createAtlasConversation('New Store Intelligence Chat', currentAgentMode);
      if (onStartNewChat) onStartNewChat(newConv);
      toast.success('Started new Atlas chat');
      if (onBack) onBack();
    } catch {
      if (onStartNewChat) onStartNewChat();
      if (onBack) onBack();
    }
  };

  const handleRename = async (id) => {
    if (!editTitle.trim()) return;
    try {
      await renameAtlasConversation(id, editTitle.trim());
      setConversations((prev) =>
        prev.map((c) => (c._id === id ? { ...c, title: editTitle.trim() } : c))
      );
      setEditingId(null);
      toast.success('Conversation renamed');
    } catch {
      toast.error('Could not rename conversation');
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await deleteAtlasConversation(id);
      setConversations((prev) => prev.filter((c) => c._id !== id));
      toast.success('Conversation deleted');
      if (activeConversationId === id && onStartNewChat) {
        onStartNewChat();
      }
    } catch {
      toast.error('Could not delete conversation');
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
            <h3>Chat History</h3>
            <p>Saved store audits &amp; inventory conversations</p>
          </div>
        </div>
        <button type="button" className="vendor-ai-subpanel-action-btn" onClick={handleStartNew}>
          <Plus size={15} />
          <span>New Chat</span>
        </button>
      </div>

      {loading ? (
        <div className="vendor-ai-subpanel-loading">
          <div className="vendor-ai-spinner" />
          <span>Loading conversations...</span>
        </div>
      ) : conversations.length === 0 ? (
        <div className="vendor-ai-subpanel-empty">
          <MessageSquare size={38} className="vendor-ai-empty-icon" />
          <h4>No previous conversations</h4>
          <p>Your previous chat sessions with Atlas will be saved here.</p>
          <button type="button" className="vendor-ai-btn-primary" onClick={handleStartNew}>
            Start First Conversation
          </button>
        </div>
      ) : (
        <div className="vendor-ai-history-list">
          {conversations.map((c) => {
            const isActive = activeConversationId === c._id;
            const isEditing = editingId === c._id;

            return (
              <div
                key={c._id}
                className={`vendor-ai-history-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  if (!isEditing && onSelectConversation) {
                    onSelectConversation(c._id);
                    if (onBack) onBack();
                  }
                }}
              >
                <div className="vendor-ai-history-icon">
                  <MessageSquare size={16} />
                </div>

                <div className="vendor-ai-history-info">
                  {isEditing ? (
                    <div className="vendor-ai-history-edit-row" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        autoFocus
                        className="vendor-ai-history-input"
                      />
                      <button type="button" onClick={() => handleRename(c._id)}>
                        <Check size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <strong className="vendor-ai-history-title">{c.title}</strong>
                      <div className="vendor-ai-history-meta">
                        <span className="vendor-ai-history-date">
                          <Clock size={11} />
                          {new Date(c.updatedAt).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                        {c.messageCount > 0 && (
                          <span className="vendor-ai-history-count">{c.messageCount} msgs</span>
                        )}
                        {c.agentMode && (
                          <span className="vendor-ai-history-mode-tag">
                            {c.agentMode.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="vendor-ai-history-actions" onClick={(e) => e.stopPropagation()}>
                  {!isEditing && (
                    <button
                      type="button"
                      className="vendor-ai-icon-action"
                      title="Rename"
                      onClick={() => {
                        setEditingId(c._id);
                        setEditTitle(c.title);
                      }}
                    >
                      <Edit2 size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    className="vendor-ai-icon-action delete"
                    title="Delete"
                    onClick={(e) => handleDelete(c._id, e)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

