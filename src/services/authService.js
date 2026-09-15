import api from "./api";

// =============================
// CUSTOMER AUTH
// =============================

export async function customerRegister(data) {
  const response = await api.post("/customers/register", data);
  return response.data;
}

export async function customerLogin(data) {
  const response = await api.post("/customers/login", data);
  return response.data;
}

// =============================
// VENDOR AUTH
// =============================

export async function vendorRegister(data) {
  const response = await api.post("/auth/register", data);
  return response.data;
}

export async function vendorLogin(data) {
  const response = await api.post("/auth/login", data);
  return response.data;
}

// =============================
// SHARED OTP & PASSWORD FLOWS
// =============================

export async function sendOtp({ email, userType = "customer", purpose = "login" }) {
  const response = await api.post("/auth/send-otp", { email, userType, purpose });
  return response.data;
}

export async function verifyOtpLogin({ email, otp, userType = "customer" }) {
  const response = await api.post("/auth/verify-otp-login", { email, otp, userType });
  return response.data;
}

export async function forgotPassword({ email, userType = "customer" }) {
  const response = await api.post("/auth/forgot-password", { email, userType });
  return response.data;
}

export async function resetPasswordWithOtp({ email, otp, newPassword, userType = "customer" }) {
  const response = await api.post("/auth/reset-password", { email, otp, newPassword, userType });
  return response.data;
}

export async function getVendorProfile() {
  const response = await api.get("/auth/me");
  return response.data;
}

export async function updateVendorProfile(data) {
  const response = await api.patch("/auth/profile", data);
  return response.data;
}

export async function changeVendorPassword(data) {
  const response = await api.patch("/auth/change-password", data);
  return response.data;
}

export async function getVendorSettings() {
  const response = await api.get("/auth/settings");
  return response.data;
}

export async function updateVendorSettings(data) {
  const response = await api.put("/auth/settings", data);
  return response.data;
}

export async function requestVendorSecurityOtp(purpose = "Security Verification") {
  const response = await api.post("/auth/security-otp", { purpose });
  return response.data;
}

export async function getStoreSettingsPublic() {
  const response = await api.get("/customers/store-settings");
  return response.data;
}