<script>
  import { auth } from '../stores/auth.js';
  import { authApi } from '../../api/authApi.js';
  import { userApi } from '../../api/userApi.js';
  import { clearUser } from '../stores/auth.js';
  import { currentRoute, navigate } from '../stores/router.js';

  let showUserMenu = false;

  async function handleLogout() {
    await authApi.logout();
    clearUser();
    showUserMenu = false;
  }

  /**
   * Close menu when clicking outside
   * @param {MouseEvent} e
   */
  function handleClickOutside(e) {
    const target = /** @type {HTMLElement} */ (e.target);
    if (!target.closest('.user-menu')) {
      showUserMenu = false;
    }
  }

  /**
   * Get avatar URL
   * @param {string | undefined} avatarUrl
   */
  function getAvatarSrc(avatarUrl) {
    if (!avatarUrl) return '';
    return userApi.getAvatarUrl(avatarUrl);
  }

  /**
   * Navigate to a page
   * @param {string} route
   */
  function goTo(route) {
    navigate(/** @type {'dashboard' | 'files' | 'google' | 'account'} */ (route));
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'home' },
    { id: 'files', label: 'Files', icon: 'folder' },
    { id: 'google', label: 'Google', icon: 'calendar' },
  ];
</script>

<svelte:window on:click={handleClickOutside} />

<header class="bg-white border-b border-gray-200 sticky top-0 z-10">
  <div class="max-w-7xl mx-auto px-4 py-3">
    <div class="flex items-center justify-between">
      <!-- Logo & Nav -->
      <div class="flex items-center gap-8">
        <button 
          on:click={() => goTo('dashboard')}
          class="flex items-center gap-2 hover:opacity-80 transition"
        >
          <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <span class="text-xl font-bold text-gray-900 hidden sm:inline">GoManager</span>
        </button>

        <!-- Navigation -->
        <nav class="flex items-center gap-1">
          {#each navItems as item}
            <button
              on:click={() => goTo(item.id)}
              class="px-4 py-2 rounded-lg text-sm font-medium transition {$currentRoute === item.id ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}"
            >
              {#if item.icon === 'home'}
                <span class="flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span class="hidden md:inline">{item.label}</span>
                </span>
              {:else if item.icon === 'folder'}
                <span class="flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <span class="hidden md:inline">{item.label}</span>
                </span>
              {:else if item.icon === 'calendar'}
                <span class="flex items-center gap-2">
                  <svg class="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span class="hidden md:inline">{item.label}</span>
                </span>
              {/if}
            </button>
          {/each}
        </nav>
      </div>
      
      <!-- User menu -->
      <div class="relative user-menu">
        <button
          on:click|stopPropagation={() => showUserMenu = !showUserMenu}
          class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
        >
          {#if $auth.user?.avatarUrl}
            <img
              src={getAvatarSrc($auth.user.avatarUrl)}
              alt="Avatar"
              class="w-8 h-8 rounded-full object-cover"
            />
          {:else}
            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span class="text-blue-600 font-medium">
                {$auth.user?.username?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
          {/if}
          <span class="text-sm text-gray-700 hidden lg:inline">{$auth.user?.username || 'User'}</span>
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {#if showUserMenu}
          <div class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
            <div class="px-4 py-2 border-b border-gray-100">
              <p class="text-sm font-medium text-gray-800">{$auth.user?.username}</p>
              <p class="text-xs text-gray-500">{$auth.user?.email}</p>
              <p class="text-xs text-gray-400 capitalize">{$auth.user?.role}</p>
            </div>
            <button
              on:click={() => { goTo('account'); showUserMenu = false; }}
              class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Account
            </button>
            <button
              on:click={handleLogout}
              class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>
</header>
