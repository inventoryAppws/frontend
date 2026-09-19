import api from "./api";

export async function getAddresses() {
  const response = await api.get("/addresses");
  return response.data;
}

export async function createAddress(address) {
  const response = await api.post("/addresses", address);
  return response.data;
}

export async function deleteAddress(id) {
  const response = await api.delete(`/addresses/${id}`);
  return response.data;
}

export async function updateAddress(id, address) {
  const response = await api.patch(`/addresses/${id}`, address);
  return response.data;
}

export async function setDefaultAddress(id) {
  const response = await api.patch(`/addresses/${id}/default`);
  return response.data;
}

