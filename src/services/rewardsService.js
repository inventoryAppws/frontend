import api from './api';

/**
 * Fetch customer loyalty rewards wallet details
 */
export async function getRewardsWallet(customerId = null) {
  const params = new URLSearchParams();
  if (customerId) params.append('customerId', customerId);
  const res = await api.get(`/rewards?${params.toString()}`);
  return res.data;
}

/**
 * Redeem loyalty points
 */
export async function redeemRewardsPoints(customerId, points, couponId = null) {
  const res = await api.post('/rewards/redeem', { customerId, points, couponId });
  return res.data;
}

