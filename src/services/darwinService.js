import api from './api';

export async function sendDarwinMessage({
  message,
  conversationId = null,
  conversationHistory = [],
  currentProductContext = null,
  aiProviderPreference = null,
  compareProductIds = null,
  pageContext = null,
  activeDeliveryAddress = null
}) {
  let navAddr = activeDeliveryAddress;
  if (!navAddr) {
    try {
      const stored = localStorage.getItem('selected_delivery_address');
      if (stored) navAddr = JSON.parse(stored);
    } catch {}
  }

  const response = await api.post('/darwin/chat', {
    message,
    conversationId,
    conversationHistory,
    currentProductContext,
    aiProviderPreference,
    compareProductIds,
    pageContext,
    activeDeliveryAddress: navAddr
  });
  return response.data;
}

export async function executeDarwinAction(action, payload = {}) {
  let navAddr = payload.activeDeliveryAddress;
  if (!navAddr) {
    try {
      const stored = localStorage.getItem('selected_delivery_address');
      if (stored) navAddr = JSON.parse(stored);
    } catch {}
  }

  const response = await api.post('/darwin/action', {
    action,
    payload: {
      ...payload,
      activeDeliveryAddress: navAddr
    }
  });
  return response.data;
}

export async function getDarwinSuggestions() {
  const response = await api.get('/darwin/suggestions');
  return response.data;
}

export async function getDarwinConversations() {
  const response = await api.get('/darwin/conversations');
  return response.data;
}

export async function createDarwinConversation(title) {
  const response = await api.post('/darwin/conversations', { title });
  return response.data;
}

export async function getDarwinConversation(id) {
  const response = await api.get(`/darwin/conversations/${id}`);
  return response.data;
}

export async function renameDarwinConversation(id, title) {
  const response = await api.patch(`/darwin/conversations/${id}`, { title });
  return response.data;
}

export async function deleteDarwinConversation(id) {
  const response = await api.delete(`/darwin/conversations/${id}`);
  return response.data;
}

export async function getDarwinSettings() {
  const response = await api.get('/darwin/settings');
  return response.data;
}

export async function updateDarwinSettings(settings) {
  const response = await api.patch('/darwin/settings', settings);
  return response.data;
}

export default {
  sendDarwinMessage,
  executeDarwinAction,
  getDarwinSuggestions,
  getDarwinConversations,
  createDarwinConversation,
  getDarwinConversation,
  renameDarwinConversation,
  deleteDarwinConversation,
  getDarwinSettings,
  updateDarwinSettings
};

