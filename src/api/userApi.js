const API_BASE = import.meta.env.VITE_API_URL || '/api';

import { getToken } from './authApi.js';

/**
 * Generic API request handler
 * @param {string} endpoint 
 * @param {RequestInit} options 
 * @returns {Promise<{success: boolean, message?: string, data?: any}>}
 */
async function request(endpoint, options = {}) {
  try {
    const token = getToken();
    const headers = {
      ...options.headers,
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Don't set Content-Type for FormData (browser will set it with boundary)
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
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
 * User API client
 */
export const userApi = {
  /**
   * Get user profile
   */
  async getProfile() {
    return request('/user/profile');
  },

  /**
   * Update user profile
   * @param {{username?: string, email?: string}} data
   */
  async updateProfile(data) {
    return request('/user/profile/update', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update password
   * @param {string} currentPassword
   * @param {string} newPassword
   */
  async updatePassword(currentPassword, newPassword) {
    return request('/user/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  /**
   * Upload avatar
   * @param {File} file
   */
  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);

    return request('/user/avatar', {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * Delete avatar
   */
  async deleteAvatar() {
    return request('/user/avatar/delete', {
      method: 'DELETE',
    });
  },

  /**
   * Get avatar URL
   * @param {string} avatarUrl
   * @returns {string}
   */
  getAvatarUrl(avatarUrl) {
    if (!avatarUrl) return '';
    if (avatarUrl.startsWith('http')) return avatarUrl;
    // avatarUrl is like "/api/user/avatar/xxx.jpg", strip the /api prefix since API_BASE already has it
    if (avatarUrl.startsWith('/api/')) {
      return `${API_BASE}${avatarUrl.slice(4)}`;
    }
    return `${API_BASE}${avatarUrl}`;
  },
};
