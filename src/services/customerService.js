import api from "./api";
export const getMyProfile = async () => (await api.get("/customers/me")).data;
export const updateMyProfile = async (data) => (await api.patch("/customers/me", data)).data;
export const changeMyPassword = async (data) => (await api.patch("/customers/me/password", data)).data;
