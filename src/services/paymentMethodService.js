import api from "./api";
export const getPaymentMethods = async () => (await api.get("/customers/payment-methods")).data;
export const createPaymentMethod = async (data) => (await api.post("/customers/payment-methods", data)).data;
export const updatePaymentMethod = async (id, data) => (await api.patch(`/customers/payment-methods/${id}`, data)).data;
export const deletePaymentMethod = async (id) => (await api.delete(`/customers/payment-methods/${id}`)).data;
