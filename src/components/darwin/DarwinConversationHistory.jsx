import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, MessageSquare, Trash2, Edit2, Check, Clock } from 'lucide-react';
import {
  getDarwinConversations,
  createDarwinConversation,
  renameDarwinConversation,
  deleteDarwinConversation
} from '../../services/darwinService';
import { toast } from '../Toast';

export default function DarwinConversationHistory({
  onSelectConversation,
  onStartNewChat,
  onBack,
  activeConversationId
}) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const loadConversations = async () => {
    try {
      const data = await getDarwinConversations();
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
      const newConv = await createDarwinConversation('New Shopping Chat');
      if (onStartNewChat) onStartNewChat(newConv);
      toast.success('Started new chat');
      if (onBack) onBack();
    } catch {
      if (onStartNewChat) onStartNewChat();
      if (onBack) onBack();
    }
  };

  const handleRename = async (id) => {
    if (!editTitle.trim()) return;
    try {
      await renameDarwinConversation(id, editTitle.trim());
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
      await deleteDarwinConversation(id);
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
    <div className="darwin-subpanel-view">
      <div className="darwin-subpanel-header">
        <button type="button" className="darwin-subpanel-back-btn" onClick={onBack}>
          <ArrowLeft size={18} />
        </button>
        <h3>Chat History</h3>
        <button type="button" className="darwin-new-chat-top-btn" onClick={handleStartNew}>
          <Plus size={15} />
          <span>New Chat</span>
        </button>
      </div>

      {loading ? (
        <div className="darwin-subpanel-loading">
          <div className="spinner-small" />
          <span>Loading chats...</span>
        </div>
      ) : conversations.length === 0 ? (
        <div className="darwin-history-empty">
          <MessageSquare size={36} />
          <h4>No previous chats</h4>
          <p>Your shopping conversations with Darwin will appear here.</p>
          <button type="button" className="darwin-btn-start-chat" onClick={handleStartNew}>
            Start a Conversation
          </button>
        </div>
      ) : (
        <div className="darwin-history-list">
          {conversations.map((c) => {
            const isActive = activeConversationId === c._id;
            const isEditing = editingId === c._id;

            return (
              <div
                key={c._id}
                className={`darwin-history-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  if (!isEditing && onSelectConversation) {
                    onSelectConversation(c._id);
                    if (onBack) onBack();
                  }
                }}
              >
                <div className="darwin-history-icon">
                  <MessageSquare size={16} />
                </div>

                <div className="darwin-history-info">
                  {isEditing ? (
                    <div className="darwin-history-edit-row" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        autoFocus
                        className="darwin-history-edit-input"
                      />
                      <button type="button" onClick={() => handleRename(c._id)}>
                        <Check size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <strong className="darwin-history-title">{c.title}</strong>
                      <span className="darwin-history-date">
                        <Clock size={11} />
                        {new Date(c.updatedAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </>
                  )}
                </div>

                {!isEditing && (
                  <div className="darwin-history-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      title="Rename"
                      onClick={() => {
                        setEditingId(c._id);
                        setEditTitle(c.title);
                      }}
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      title="Delete"
                      onClick={(e) => handleDelete(c._id, e)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

