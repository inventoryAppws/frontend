import api from './api';

/**
 * Fetch questions & answers for a product with filters, search, and sorting
 */
export async function getProductQA(productId, { q = '', filter = 'all', sort = 'helpful', customerId = null } = {}) {
  const params = new URLSearchParams();
  if (q) params.append('q', q);
  if (filter) params.append('filter', filter);
  if (sort) params.append('sort', sort);
  if (customerId) params.append('customerId', customerId);

  const res = await api.get(`/products/${productId}/qa?${params.toString()}`);
  return res.data;
}

/**
 * Live instant check if a question matches product specifications as user types
 */
export async function checkInstantSpecMatch(productId, question) {
  if (!question || !question.trim()) return { matched: false };
  const res = await api.post(`/products/${productId}/qa/instant-spec-check`, { question });
  return res.data;
}

/**
 * Submit a new question
 */
export async function askProductQuestion(productId, question, customer = {}) {
  const res = await api.post(`/products/${productId}/qa/ask`, { question, customer });
  return res.data;
}

/**
 * Answer an existing question
 */
export async function answerProductQuestion(productId, questionId, answer, responder = {}) {
  const res = await api.post(`/products/${productId}/qa/${questionId}/answer`, { answer, responder });
  return res.data;
}

/**
 * Upvote / downvote a question
 */
export async function voteQuestion(productId, questionId, direction = 'up') {
  const res = await api.post(`/products/${productId}/qa/${questionId}/vote`, { direction });
  return res.data;
}

/**
 * Vote an answer as helpful / unhelpful
 */
export async function voteAnswer(productId, questionId, answerId, voteType = 'helpful') {
  const res = await api.post(`/products/${productId}/qa/${questionId}/answers/${answerId}/vote`, { voteType });
  return res.data;
}

