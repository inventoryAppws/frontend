import api from "./api";

/**
 * Fetch vendor transactions with pagination, filters, and computed summary
 */
export async function getVendorTransactions(params = {}) {
  const query = {};
  if (params.page) query.page = params.page;
  if (params.limit) query.limit = params.limit;
  if (params.type && params.type !== "all") query.type = params.type;
  if (params.status && params.status !== "all") query.status = params.status;
  if (params.q) query.q = params.q;
  if (params.dateRange && params.dateRange !== "all") query.dateRange = params.dateRange;
  if (params.dateFrom) query.dateFrom = params.dateFrom;
  if (params.dateTo) query.dateTo = params.dateTo;
  if (params.sortBy) query.sortBy = params.sortBy;

  const response = await api.get("/vendor/transactions", { params: query });
  return response.data;
}

/**
 * Request payout withdrawal from available balance
 */
export async function requestVendorPayout(data) {
  const response = await api.post("/vendor/transactions/payout", data);
  return response.data;
}

