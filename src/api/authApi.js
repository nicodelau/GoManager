const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * Get stored auth token
 * @returns {string|null}
 */
export function getToken() {
  return localStorage.getItem('auth_token');
}

/**
 * Set auth token
 * @param {string|null} token
 */
export function setToken(token) {
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
}

/**
 * Generic API request handler with credentials
 * @param {string} endpoint 
 * @param {RequestInit} options 
 * @returns {Promise<{success: boolean, message?: string, data?: any}>}
 */
async function request(endpoint, options = {}) {
  try {
    const token = getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
    return await response.json();
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Auth API client
 */
export const authApi = {
  /**
   * Register a new user
   * @param {string} username
   * @param {string} email
   * @param {string} password
   */
  async register(username, email, password) {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  },

  /**
   * Login user
   * @param {string} email
   * @param {string} password
   */
  async login(email, password) {
    const result = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    // Store token on successful login
    if (result.success && result.data?.token) {
      setToken(result.data.token);
    }
    
    return result;
  },

  /**
   * Logout current user
   */
  async logout() {
    const result = await request('/auth/logout', {
      method: 'POST',
    });
    
    // Clear token on logout
    setToken(null);
    
    return result;
  },

  /**
   * Get current user info
   */
  async me() {
    // If no token, return immediately
    if (!getToken()) {
      return { success: false, message: 'No token' };
    }
    return request('/auth/me');
  },

  /**
   * Get Google OAuth status
   */
  async googleStatus() {
    return request('/auth/google/status');
  },

  /**
   * Get Google OAuth login URL
   * @returns {string}
   */
  getGoogleLoginUrl() {
    const API_BASE = import.meta.env.VITE_API_URL || '/api';
    return `${API_BASE}/auth/google`;
  },
};
