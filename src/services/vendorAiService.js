import api from './api';

export async function chatWithAtlas({
  message,
  conversationHistory = [],
  conversationId = null,
  agentMode = 'auto',
  aiProviderPreference = 'auto',
  pageContext = null
}) {
  const response = await api.post('/vendor-ai/chat', {
    message,
    conversationHistory,
    conversationId,
    agentMode,
    aiProviderPreference,
    pageContext
  });
  return response.data;
}

export async function getVendorAiSummary() {
  const response = await api.get('/vendor-ai/summary');
  return response.data;
}

export async function generateProductCopy({ name, category, keywords, tone }) {
  const response = await api.post('/vendor-ai/generate-copy', {
    name,
    category,
    keywords,
    tone
  });
  return response.data;
}

export async function getVendorAiSuggestions() {
  const response = await api.get('/vendor-ai/suggestions');
  return response.data;
}

// Conversations Management
export async function getAtlasConversations() {
  const response = await api.get('/vendor-ai/conversations');
  return response.data;
}

export async function createAtlasConversation(title = 'New Atlas Chat', agentMode = 'business_copilot') {
  const response = await api.post('/vendor-ai/conversations', { title, agentMode });
  return response.data;
}

export async function getAtlasConversation(id) {
  const response = await api.get(`/vendor-ai/conversations/${id}`);
  return response.data;
}

export async function renameAtlasConversation(id, title) {
  const response = await api.patch(`/vendor-ai/conversations/${id}`, { title });
  return response.data;
}

export async function deleteAtlasConversation(id) {
  const response = await api.delete(`/vendor-ai/conversations/${id}`);
  return response.data;
}

// Settings Management
export async function getAtlasSettings() {
  const response = await api.get('/vendor-ai/settings');
  return response.data;
}

export async function updateAtlasSettings(settings) {
  const response = await api.put('/vendor-ai/settings', settings);
  return response.data;
}
