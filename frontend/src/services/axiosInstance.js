import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000') + '/api/v1',
  timeout: 60000, // 60s — enough for Cloudinary + cold start
});

// Global error handler
axiosInstance.interceptors.response.use(
  res => res,
  err => {
    if (err.code === 'ECONNABORTED') {
      err.message = 'Request timed out. Please try again.';
    }
    return Promise.reject(err);
  }
);

export default axiosInstance;