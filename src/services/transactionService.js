import api from "./api";

export async function getTransactions(page = 1, limit = 20, type = "", search = "", extraFilters = {}) {
  const params = {};
  if (page) params.page = page;
  if (limit) params.limit = limit;
  if (type && type !== "all") params.type = type;
  if (search) params.q = search;
  if (extraFilters.status && extraFilters.status !== "all") params.status = extraFilters.status;
  if (extraFilters.paymentMethod && extraFilters.paymentMethod !== "all") params.paymentMethod = extraFilters.paymentMethod;
  if (extraFilters.dateRange && extraFilters.dateRange !== "all") params.dateRange = extraFilters.dateRange;
  const response = await api.get("/transactions", { params });
  return response.data;
}

export async function getTransactionById(id) {
  const response = await api.get(`/transactions/${id}`);
  return response.data;
}

