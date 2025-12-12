import { writable, derived } from 'svelte/store';

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} username
 * @property {string} email
 * @property {string} role
 * @property {string} [authProvider]
 * @property {string} [avatarUrl]
 * @property {string} createdAt
 */

/**
 * @typedef {Object} AuthState
 * @property {User|null} user
 * @property {boolean} isAuthenticated
 * @property {boolean} loading
 * @property {string|null} error
 */

/** @type {import('svelte/store').Writable<AuthState>} */
export const auth = writable({
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
});

/** Check if user is admin */
export const isAdmin = derived(auth, ($auth) => $auth.user?.role === 'admin');

/** Check if user can upload (admin or user role) */
export const canUpload = derived(
  auth,
  ($auth) => $auth.user?.role === 'admin' || $auth.user?.role === 'user'
);

/**
 * Set user data
 * @param {User} user
 */
export function setUser(user) {
  auth.update((state) => ({
    ...state,
    user,
    isAuthenticated: true,
    loading: false,
    error: null,
  }));
}

/**
 * Clear user data (logout)
 */
export function clearUser() {
  auth.update((state) => ({
    ...state,
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  }));
}

/**
 * Set loading state
 * @param {boolean} loading
 */
export function setLoading(loading) {
  auth.update((state) => ({ ...state, loading }));
}

/**
 * Set error state
 * @param {string|null} error
 */
export function setError(error) {
  auth.update((state) => ({ ...state, error, loading: false }));
}
