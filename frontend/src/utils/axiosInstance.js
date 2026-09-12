import axios from "axios";
import { BASE_URL, API_PATHS } from "./apiPaths";
import { clearCookie, USER_INFO_COOKIE } from "./cookies";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 80000,
  // Sends the httpOnly auth cookie on every request. This replaces the old
  // localStorage token + Authorization header scheme — the token is no
  // longer readable by JS, which removes it as an XSS exfiltration target.
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || "";

    // A 401 means the cookie is missing/expired/invalid. Drop the cached
    // user copy and bounce to login — but never on the auth endpoints
    // themselves, or a simple "wrong password" would trigger a redirect
    // loop instead of showing an inline error.
    const isAuthEndpoint =
      requestUrl.includes(API_PATHS.AUTH.LOGIN) ||
      requestUrl.includes(API_PATHS.AUTH.REGISTER);

    if (status === 401 && !isAuthEndpoint) {
      clearCookie(USER_INFO_COOKIE);
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    if (status === 500) {
      console.error("Server error. Please try again later.");
    } else if (error.code === "ECONNABORTED") {
      console.error("Request timeout. Please try again.");
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
