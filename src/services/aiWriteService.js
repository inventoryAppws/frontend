import api from './api';

/**
 * Universal AI Write API Service
 */
export async function generateAiWrite({ task, input, context = {}, options = {} }) {
  const response = await api.post('/ai-write/generate', {
    task,
    input,
    context,
    options
  });
  return response.data;
}

export async function getAiWriteStatus() {
  const response = await api.get('/ai-write/status');
  return response.data;
}

