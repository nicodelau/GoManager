<script>
  import { onMount } from 'svelte';
  import { authApi } from '../../api/authApi.js';
  import { setUser, setError, setLoading, auth } from '../stores/auth.js';

  /** @type {string} */
  let email = '';
  /** @type {string} */
  let password = '';
  /** @type {string} */
  let localError = '';
  /** @type {boolean} */
  let googleEnabled = false;

  /** @type {() => void} */
  export let onRegisterClick = () => {};

  onMount(async () => {
    // Check if Google OAuth is enabled
    const status = await authApi.googleStatus();
    if (status.success && status.data?.enabled) {
      googleEnabled = true;
    }
  });

  async function handleLogin() {
    if (!email || !password) {
      localError = 'Please fill in all fields';
      return;
    }

    localError = '';
    setLoading(true);

    const result = await authApi.login(email, password);
    
    if (result.success) {
      setUser(result.data.user);
    } else {
      localError = result.message || 'Login failed';
      setError(localError);
    }
  }

  function handleGoogleLogin() {
    window.location.href = authApi.getGoogleLoginUrl();
  }

  /**
   * Handle keydown event
   * @param {KeyboardEvent} e
   */
  function handleKeydown(e) {
    if (e.key === 'Enter') {
      handleLogin();
    }
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
  <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-800">GoManager</h1>
      <p class="text-gray-500 mt-2">Sign in to your account</p>
    </div>

    {#if localError}
      <div class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
        {localError}
      </div>
    {/if}

    {#if googleEnabled}
      <button
        on:click={handleGoogleLogin}
        class="w-full py-3 mb-4 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-3"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      <div class="relative mb-4">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-white text-gray-500">Or continue with email</span>
        </div>
      </div>
    {/if}

    <form on:submit|preventDefault={handleLogin} class="space-y-4">
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          bind:value={email}
          on:keydown={handleKeydown}
          placeholder="you@example.com"
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
        />
      </div>

      <div>
        <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          bind:value={password}
          on:keydown={handleKeydown}
          placeholder="••••••••"
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
        />
      </div>

      <button
        type="submit"
        disabled={$auth.loading}
        class="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {#if $auth.loading}
          <span class="inline-block animate-spin mr-2">&#9696;</span>
          Signing in...
        {:else}
          Sign In
        {/if}
      </button>
    </form>

    <div class="mt-6 text-center">
      <p class="text-gray-600">
        Don't have an account?
        <button
          on:click={onRegisterClick}
          class="text-blue-600 hover:underline font-medium"
        >
          Create one
        </button>
      </p>
    </div>
  </div>
</div>
