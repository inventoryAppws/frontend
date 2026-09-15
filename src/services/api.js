import axios from "axios";
import { toast } from "../components/Toast";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:3000",

  headers: {
    "Content-Type": "application/json",
  },
});


// Add JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


// Handle unauthorized or blocked account responses
api.interceptors.response.use(
  (response) => response,

  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;
    const isBlocked = data?.accountBlocked || status === 403;
    const isUnauthorized = status === 401;

    if (isBlocked || isUnauthorized) {
      const errorMessage = data?.msg || (isBlocked
        ? "Your account has been blocked/suspended by the administrator. Logging out."
        : "Session expired or invalid. Please login again.");

      // Show immediate toast message to user
      toast.error(errorMessage, isBlocked ? "Account Blocked" : "Authentication Required");

      // Instantly remove all auth credentials from localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("userType");
      localStorage.removeItem("user");

      // Notify React AuthContext to reset state immediately
      window.dispatchEvent(new Event("auth:logout"));

      // If user is blocked or unauthorized, redirect away from protected routes
      const path = window.location.pathname;
      const isAuthPage = path.includes("/login") || path.includes("/register");
      if (!isAuthPage) {
        setTimeout(() => {
          if (path.startsWith("/vendor")) {
            window.location.href = "/vendor/login";
          } else {
            window.location.href = "/customer/login";
          }
        }, 800);
      }
    }

    return Promise.reject(error);
  }
);

export default api;