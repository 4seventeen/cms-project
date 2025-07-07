import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  },
  withCredentials: true // Enable cookies for CORS
});

// Track if we're currently refreshing token to prevent multiple simultaneous refresh requests
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor - no longer needed to add auth token since we use cookies
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors and automatic token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Don't try to refresh tokens for authentication endpoints
    const authEndpoints = ['/signin', '/signup', '/refresh-token'];
    const isAuthEndpoint = authEndpoints.some(endpoint => 
      originalRequest.url?.includes(endpoint)
    );

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        // If we're already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh the token
        await api.post('/refresh-token');
        
        // Token refresh successful, retry the original request
        processQueue(null);
        isRefreshing = false;
        
        return api(originalRequest);
      } catch (refreshError) {
        // Token refresh failed
        processQueue(refreshError);
        isRefreshing = false;
        
        // Don't automatically redirect here - let the router guard handle it
        // This prevents conflicts between API interceptor and router navigation
        console.log('Token refresh failed, authentication may be required');
        
        return Promise.reject(refreshError);
      }
    }

    // For other errors, just reject
    return Promise.reject(error);
  }
);

export default api;
