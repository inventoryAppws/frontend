import api from "./api";

export const getMyProfile = async () => (await api.get("/customers/me")).data;
export const updateMyProfile = async (data) => (await api.patch("/customers/me", data)).data;
export const changeMyPassword = async (data) => (await api.patch("/customers/me/password", data)).data;

// Customer Shopping Profile & Preferences
export const getShoppingProfile = async () => (await api.get("/customers/shopping-profile")).data;
export const updateShoppingProfile = async (data) => (await api.put("/customers/shopping-profile", data)).data;

// Darwin Shopping Memory
export const getDarwinMemory = async () => (await api.get("/customers/darwin-memory")).data;
export const toggleDarwinMemory = async (enabled) => (await api.post("/customers/darwin-memory/toggle", { enabled })).data;
export const deleteDarwinMemory = async (key) => (await api.delete(`/customers/darwin-memory/${encodeURIComponent(key)}`)).data;
export const clearDarwinMemory = async () => (await api.delete("/customers/darwin-memory")).data;
