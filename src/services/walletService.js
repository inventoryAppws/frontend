import api from "./api";
export const getWallet = async () => (await api.get("/customers/wallet")).data;
export const topUpWallet = async (data) => (await api.post("/customers/wallet/top-up", data)).data;
