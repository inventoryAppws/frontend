import api from './api';

export async function getRecommendedForYou(customerId = null, limit = 8, extraParams = {}) {
  const params = new URLSearchParams();
  if (customerId) params.append('customerId', customerId);
  if (limit) params.append('limit', limit);
  if (extraParams && typeof extraParams === 'object') {
    Object.entries(extraParams).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.append(k, v);
    });
  }
  const res = await api.get(`/recommendations/for-you?${params.toString()}`);
  return res.data;
}

export async function getBecauseYouViewed(productId, limit = 4) {
  const res = await api.get(`/recommendations/because-you-viewed/${productId}?limit=${limit}`);
  return res.data;
}

export async function getFrequentlyBoughtTogether(productId) {
  const res = await api.get(`/recommendations/frequently-bought-together/${productId}`);
  return res.data;
}

export async function getCompleteTheLook(productId) {
  const res = await api.get(`/recommendations/complete-the-look/${productId}`);
  return res.data;
}

export async function getBudgetRecommendations(maxPrice = 2499, limit = 8) {
  const res = await api.get(`/recommendations/budget?maxPrice=${maxPrice}&limit=${limit}`);
  return res.data;
}

export async function getPastPurchasesRecommendations(customerId, limit = 6) {
  const params = new URLSearchParams();
  if (customerId) params.append('customerId', customerId);
  if (limit) params.append('limit', limit);
  const res = await api.get(`/recommendations/past-purchases?${params.toString()}`);
  return res.data;
}

