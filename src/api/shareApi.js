import { getToken } from './authApi.js';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

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
 * @typedef {Object} CreateShareOptions
 * @property {string} path - File or folder path
 * @property {'public'|'password'} [shareType] - Type of share
 * @property {string} [password] - Password for password-protected shares
 * @property {'view'|'download'} [permission] - Permission level
 * @property {string} [expiresAt] - Expiration date (ISO string)
 * @property {number} [maxDownloads] - Max download count
 */

/**
 * Share API client
 */
export const shareApi = {
  /**
   * Create a new share link
   * @param {CreateShareOptions} options
   */
  async create(options) {
    return request('/shares', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  },

  /**
   * List all shares for current user
   */
  async list() {
    return request('/shares');
  },

  /**
   * Delete a share
   * @param {string} shareId
   */
  async delete(shareId) {
    return request(`/shares/${shareId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get share info
   * @param {string} shareId
   */
  async getInfo(shareId) {
    return request(`/shares/${shareId}`);
  },

  /**
   * Access a public share by token
   * @param {string} token
   */
  async access(token) {
    return request(`/s/${token}`);
  },

  /**
   * Access a password-protected share
   * @param {string} token
   * @param {string} password
   */
  async accessWithPassword(token, password) {
    return request(`/s/${token}`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  },
};
