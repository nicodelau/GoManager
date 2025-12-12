<script>
  import { authApi } from '../../api/authApi.js';
  import { setUser, setError, setLoading, auth } from '../stores/auth.js';

  /** @type {string} */
  let username = '';
  /** @type {string} */
  let email = '';
  /** @type {string} */
  let password = '';
  /** @type {string} */
  let confirmPassword = '';
  /** @type {string} */
  let localError = '';

  /** @type {() => void} */
  export let onLoginClick = () => {};

  async function handleRegister() {
    if (!username || !email || !password || !confirmPassword) {
      localError = 'Please fill in all fields';
      return;
    }

    if (password !== confirmPassword) {
      localError = 'Passwords do not match';
      return;
    }

    if (password.length < 6) {
      localError = 'Password must be at least 6 characters';
      return;
    }

    localError = '';
    setLoading(true);

    const result = await authApi.register(username, email, password);
    
    if (result.success) {
      // Auto-login after registration
      const loginResult = await authApi.login(email, password);
      if (loginResult.success) {
        setUser(loginResult.data.user);
      } else {
        // Registration succeeded but login failed - show login page
        localError = 'Account created! Please sign in.';
        setLoading(false);
        setTimeout(() => onLoginClick(), 1500);
      }
    } else {
      localError = result.message || 'Registration failed';
      setError(localError);
    }
  }

  /**
   * Handle keydown event
   * @param {KeyboardEvent} e
   */
  function handleKeydown(e) {
    if (e.key === 'Enter') {
      handleRegister();
    }
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
  <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-800">GoManager</h1>
      <p class="text-gray-500 mt-2">Create your account</p>
    </div>

    {#if localError}
      <div class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
        {localError}
      </div>
    {/if}

    <form on:submit|preventDefault={handleRegister} class="space-y-4">
      <div>
        <label for="username" class="block text-sm font-medium text-gray-700 mb-1">
          Username
        </label>
        <input
          id="username"
          type="text"
          bind:value={username}
          on:keydown={handleKeydown}
          placeholder="johndoe"
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
        />
      </div>

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

      <div>
        <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          bind:value={confirmPassword}
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
          Creating account...
        {:else}
          Create Account
        {/if}
      </button>
    </form>

    <div class="mt-6 text-center">
      <p class="text-gray-600">
        Already have an account?
        <button
          on:click={onLoginClick}
          class="text-blue-600 hover:underline font-medium"
        >
          Sign in
        </button>
      </p>
    </div>
  </div>
</div>
