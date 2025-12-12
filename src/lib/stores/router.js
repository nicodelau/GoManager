import { writable, derived } from 'svelte/store';

/**
 * @typedef {'dashboard' | 'files' | 'google' | 'account'} Route
 */

/** @type {import('svelte/store').Writable<Route>} */
export const currentRoute = writable('dashboard');

/**
 * Navigate to a route
 * @param {Route} route
 */
export function navigate(route) {
  currentRoute.set(route);
  // Update URL hash for bookmarking/refresh
  window.location.hash = route;
}

/**
 * Initialize router from URL hash
 */
export function initRouter() {
  const hash = window.location.hash.slice(1) || 'dashboard';
  const validRoutes = ['dashboard', 'files', 'google', 'account'];
  
  if (validRoutes.includes(hash)) {
    currentRoute.set(/** @type {Route} */ (hash));
  } else {
    currentRoute.set('dashboard');
  }
  
  // Listen for hash changes
  window.addEventListener('hashchange', () => {
    const newHash = window.location.hash.slice(1) || 'dashboard';
    if (validRoutes.includes(newHash)) {
      currentRoute.set(/** @type {Route} */ (newHash));
    }
  });
}
