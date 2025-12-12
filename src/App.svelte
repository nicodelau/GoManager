<script>
  import { onMount } from 'svelte';
  import { authApi, setToken } from './api/authApi.js';
  import { auth, setUser, setLoading, clearUser } from './lib/stores/auth.js';
  import { currentRoute, initRouter } from './lib/stores/router.js';
  import Header from './lib/components/Header.svelte';
  import Login from './lib/components/Login.svelte';
  import Register from './lib/components/Register.svelte';
  
  // Pages
  import Dashboard from './lib/pages/Dashboard.svelte';
  import FilesPage from './lib/pages/FilesPage.svelte';
  import GooglePage from './lib/pages/GooglePage.svelte';
  import AccountPage from './lib/pages/AccountPage.svelte';
  
  // Auth views
  let showRegister = false;

  /**
   * Handle OAuth callback - check for token in URL params
   * @returns {boolean} true if OAuth callback was handled
   */
  function handleOAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const oauthError = urlParams.get('error');
    
    // Check if this is an OAuth callback
    if (window.location.pathname === '/auth/callback' || token || oauthError) {
      if (oauthError) {
        // Handle OAuth error
        console.error('OAuth error:', oauthError);
        // Clear URL params and redirect to login
        window.history.replaceState({}, document.title, '/');
        return true;
      }
      
      if (token) {
        // Store the token
        setToken(token);
        // Clear URL params and redirect to root
        window.history.replaceState({}, document.title, '/');
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if user is authenticated on mount
   */
  async function checkAuth() {
    // First handle any OAuth callback
    handleOAuthCallback();
    
    setLoading(true);
    const result = await authApi.me();
    if (result.success && result.data) {
      setUser(result.data);
    } else {
      clearUser();
    }
  }

  // Reset when user logs out
  $: if (!$auth.isAuthenticated) {
    showRegister = false;
  }

  onMount(() => {
    initRouter();
    checkAuth();
  });
</script>

<!-- Loading screen -->
{#if $auth.loading}
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="text-center">
      <div class="inline-block animate-spin text-4xl mb-4">
        <svg class="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </div>
      <p class="text-gray-500">Loading...</p>
    </div>
  </div>

<!-- Auth screens -->
{:else if !$auth.isAuthenticated}
  {#if showRegister}
    <Register onLoginClick={() => showRegister = false} />
  {:else}
    <Login onRegisterClick={() => showRegister = true} />
  {/if}

<!-- Main app -->
{:else}
  <div class="min-h-screen bg-gray-50">
    <Header />

    <main class="max-w-7xl mx-auto px-4 py-6">
      {#if $currentRoute === 'dashboard'}
        <Dashboard />
      {:else if $currentRoute === 'files'}
        <FilesPage />
      {:else if $currentRoute === 'google'}
        <GooglePage />
      {:else if $currentRoute === 'account'}
        <AccountPage />
      {:else}
        <Dashboard />
      {/if}
    </main>
  </div>
{/if}
