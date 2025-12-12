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
 * Google Services API client
 */
export const googleApi = {
  /**
   * Get Google connection status
   */
  async getStatus() {
    return request('/google/status');
  },

  /**
   * List user's calendars
   */
  async listCalendars() {
    return request('/google/calendars');
  },

  /**
   * List calendar events
   * @param {Object} options
   * @param {string} [options.calendarId='primary'] - Calendar ID
   * @param {string} [options.timeMin] - Start time (RFC3339)
   * @param {string} [options.timeMax] - End time (RFC3339)
   * @param {number} [options.maxResults=50] - Max results
   */
  async listEvents(options = {}) {
    const params = new URLSearchParams();
    if (options.calendarId) params.append('calendarId', options.calendarId);
    if (options.timeMin) params.append('timeMin', options.timeMin);
    if (options.timeMax) params.append('timeMax', options.timeMax);
    if (options.maxResults) params.append('maxResults', String(options.maxResults));

    const query = params.toString();
    return request(`/google/calendar/events${query ? '?' + query : ''}`);
  },

  /**
   * Create a calendar event
   * @param {Object} event - Event data
   * @param {string} event.summary - Event title
   * @param {string} [event.description] - Event description
   * @param {string} [event.location] - Event location
   * @param {{dateTime: string, timeZone?: string}} event.start - Start time
   * @param {{dateTime: string, timeZone?: string}} event.end - End time
   * @param {string} [calendarId='primary'] - Calendar ID
   */
  async createEvent(event, calendarId = 'primary') {
    return request(`/google/calendar/events/create?calendarId=${encodeURIComponent(calendarId)}`, {
      method: 'POST',
      body: JSON.stringify(event),
    });
  },

  /**
   * List task lists
   */
  async listTaskLists() {
    return request('/google/tasks/lists');
  },

  /**
   * List tasks in a task list
   * @param {Object} options
   * @param {string} [options.taskListId='@default'] - Task list ID
   * @param {boolean} [options.showCompleted=false] - Show completed tasks
   */
  async listTasks(options = {}) {
    const params = new URLSearchParams();
    if (options.taskListId) params.append('taskListId', options.taskListId);
    if (options.showCompleted !== undefined) params.append('showCompleted', String(options.showCompleted));

    const query = params.toString();
    return request(`/google/tasks${query ? '?' + query : ''}`);
  },

  /**
   * Create a task
   * @param {Object} task - Task data
   * @param {string} task.title - Task title
   * @param {string} [task.notes] - Task notes
   * @param {string} [task.due] - Due date (RFC3339)
   * @param {string} [taskListId='@default'] - Task list ID
   */
  async createTask(task, taskListId = '@default') {
    return request(`/google/tasks/create?taskListId=${encodeURIComponent(taskListId)}`, {
      method: 'POST',
      body: JSON.stringify(task),
    });
  },

  /**
   * Update a task
   * @param {string} taskId - Task ID
   * @param {Object} task - Task data
   * @param {string} [taskListId='@default'] - Task list ID
   */
  async updateTask(taskId, task, taskListId = '@default') {
    const params = new URLSearchParams();
    params.append('taskListId', taskListId);
    params.append('taskId', taskId);

    return request(`/google/tasks/update?${params.toString()}`, {
      method: 'PUT',
      body: JSON.stringify(task),
    });
  },

  /**
   * Complete a task
   * @param {string} taskId - Task ID
   * @param {string} [taskListId='@default'] - Task list ID
   */
  async completeTask(taskId, taskListId = '@default') {
    const params = new URLSearchParams();
    params.append('taskListId', taskListId);
    params.append('taskId', taskId);

    return request(`/google/tasks/complete?${params.toString()}`, {
      method: 'POST',
    });
  },
};
