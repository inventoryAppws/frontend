import api from "./api";

// Customer creates order
export async function createOrder(productId, qty) {
  const response = await api.post("/orders", {
    productId,
    qty,
  });

  return response.data;
}

// Customer orders
export async function getCustomerOrders(page, limit, search = "", status = "") {
  const params = {};
  if (page) params.page = page;
  if (limit) params.limit = limit;
  if (search) params.q = search;
  if (status && status !== "all") params.status = status;

  const response = await api.get("/orders", {
    params: Object.keys(params).length ? params : undefined,
  });

  return response.data;
}

// Vendor orders
export async function getVendorOrders(page, limit) {
  const params = {};
  if (page) params.page = page;
  if (limit) params.limit = limit;

  const response = await api.get("/orders/vendor", {
    params: Object.keys(params).length ? params : undefined,
  });
  return response.data;
}

// Update Vendor Order Status
export async function updateVendorOrderStatus(orderId, status, note = "") {
  const response = await api.patch(`/orders/vendor/${orderId}/status`, { status, note });
  return response.data;
}

// Cancel Order
export async function cancelCustomerOrder(orderId, reason = "") {
  const response = await api.post(`/orders/${orderId}/cancel`, { reason });
  return response.data;
}

// Request Return / Refund
export async function requestOrderReturn(orderId, reason, comments = "") {
  const response = await api.post(`/orders/${orderId}/return`, { reason, comments });
  return response.data;
}
