import api from "./api";

// Get return, cancellation & refund requests
export async function getReturns(type = "", status = "") {
  const params = {};
  if (type && type !== "all") params.type = type;
  if (status && status !== "all") params.status = status;

  const response = await api.get("/returns", {
    params: Object.keys(params).length ? params : undefined,
  });

  return response.data;
}

// Get single return request details
export async function getReturnById(id) {
  const response = await api.get(`/returns/${id}`);
  return response.data;
}

// Vendor action to update return status & reverse logistics
export async function updateReturnStatus(id, action, note = "", refundAmount = null) {
  const response = await api.patch(`/returns/${id}/status`, {
    action,
    note,
    refundAmount
  });
  return response.data;
}

