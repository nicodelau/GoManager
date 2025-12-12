import { getToken } from './authApi.js';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * Generic API request handler
 * @param {string} endpoint 
 * @param {RequestInit} options 
 * @returns {Promise<{success: boolean, message?: string, data?: any}>}
 */
async function request(endpoint, options = {}) {
  try {
    const token = getToken();
    const headers = { ...options.headers };
    
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
 * File API client
 */
export const fileApi = {
  /**
   * List files in a directory
   * @param {string} path
   */
  async list(path = '') {
    return request(`/files?path=${encodeURIComponent(path)}`);
  },

  /**
   * Get storage statistics
   */
  async getStats() {
    return request('/stats');
  },

  /**
   * Upload files to a directory
   * @param {string} path
   * @param {FileList} files
   */
  async upload(path, files) {
    const token = getToken();
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }

    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE}/upload?path=${encodeURIComponent(path)}`, {
        method: 'POST',
        headers,
        body: formData,
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Get download URL for a file
   * @param {string} path
   * @returns {string}
   */
  getDownloadUrl(path) {
    const token = getToken();
    // Encode each path segment separately to preserve slashes
    const encodedPath = path.split('/').map(segment => encodeURIComponent(segment)).join('/');
    const url = `${API_BASE}/download/${encodedPath}`;
    return token ? `${url}?token=${token}` : url;
  },

  /**
   * Get preview URL for a file (inline display)
   * @param {string} path
   * @returns {string}
   */
  getPreviewUrl(path) {
    const token = getToken();
    // Encode each path segment separately to preserve slashes
    const encodedPath = path.split('/').map(segment => encodeURIComponent(segment)).join('/');
    const url = `${API_BASE}/download/${encodedPath}`;
    const params = new URLSearchParams();
    params.append('preview', 'true');
    if (token) {
      params.append('token', token);
    }
    return `${url}?${params.toString()}`;
  },

  /**
   * Create a new folder
   * @param {string} path
   */
  async createFolder(path) {
    return request('/mkdir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    });
  },

  /**
   * Delete a file or folder
   * @param {string} path
   */
  async delete(path) {
    return request('/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    });
  },
};
