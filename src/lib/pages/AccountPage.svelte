<script>
  import { onMount } from 'svelte';
  import { auth, setUser } from '../stores/auth.js';
  import { userApi } from '../../api/userApi.js';
  import { authApi } from '../../api/authApi.js';

  // Profile form
  let username = '';
  let email = '';
  let profileLoading = false;
  let profileMessage = '';
  let profileError = '';

  // Password form
  let currentPassword = '';
  let newPassword = '';
  let confirmPassword = '';
  let passwordLoading = false;
  let passwordMessage = '';
  let passwordError = '';

  // Avatar
  let avatarLoading = false;
  /** @type {HTMLInputElement} */
  let avatarInput;

  onMount(() => {
    if ($auth.user) {
      username = $auth.user.username;
      email = $auth.user.email;
    }
  });

  async function updateProfile() {
    profileLoading = true;
    profileMessage = '';
    profileError = '';

    const result = await userApi.updateProfile({ username, email });
    if (result.success) {
      profileMessage = 'Profile updated successfully';
      if (result.data) {
        setUser(result.data);
      }
    } else {
      profileError = result.message || 'Failed to update profile';
    }
    profileLoading = false;
  }

  async function updatePassword() {
    passwordLoading = true;
    passwordMessage = '';
    passwordError = '';

    if (newPassword !== confirmPassword) {
      passwordError = 'Passwords do not match';
      passwordLoading = false;
      return;
    }

    if (newPassword.length < 6) {
      passwordError = 'Password must be at least 6 characters';
      passwordLoading = false;
      return;
    }

    const result = await userApi.updatePassword(currentPassword, newPassword);
    if (result.success) {
      passwordMessage = 'Password updated successfully';
      currentPassword = '';
      newPassword = '';
      confirmPassword = '';
    } else {
      passwordError = result.message || 'Failed to update password';
    }
    passwordLoading = false;
  }

  /**
   * @param {Event} e
   */
  async function handleAvatarUpload(e) {
    const target = /** @type {HTMLInputElement} */ (e.target);
    const file = target.files?.[0];
    if (!file) return;

    avatarLoading = true;
    const result = await userApi.uploadAvatar(file);
    if (result.success && result.data) {
      const meResult = await authApi.me();
      if (meResult.success && meResult.data) {
        setUser(meResult.data);
      }
    }
    avatarLoading = false;
    target.value = '';
  }

  async function deleteAvatar() {
    if (!confirm('Are you sure you want to delete your avatar?')) return;

    avatarLoading = true;
    const result = await userApi.deleteAvatar();
    if (result.success) {
      const meResult = await authApi.me();
      if (meResult.success && meResult.data) {
        setUser(meResult.data);
      }
    }
    avatarLoading = false;
  }

  /**
   * @param {string} avatarUrl
   */
  function getAvatarSrc(avatarUrl) {
    return userApi.getAvatarUrl(avatarUrl);
  }
</script>

<div class="space-y-6 max-w-2xl">
  <h1 class="text-2xl font-bold text-gray-900">Account Settings</h1>

  <!-- Profile Section -->
  <div class="bg-white rounded-xl shadow-sm overflow-hidden">
    <div class="px-6 py-4 border-b bg-gray-50">
      <h2 class="font-semibold text-gray-900">Profile Information</h2>
    </div>
    <div class="p-6">
      <!-- Avatar -->
      <div class="flex items-center gap-6 mb-6">
        <div class="relative">
          {#if $auth.user?.avatarUrl}
            <img
              src={getAvatarSrc($auth.user.avatarUrl)}
              alt="Avatar"
              class="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
            />
          {:else}
            <div class="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {$auth.user?.username?.charAt(0).toUpperCase() || '?'}
            </div>
          {/if}
          {#if avatarLoading}
            <div class="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
              <div class="animate-spin text-white text-xl">&#9696;</div>
            </div>
          {/if}
        </div>
        <div class="space-y-2">
          <input
            type="file"
            accept="image/*"
            bind:this={avatarInput}
            on:change={handleAvatarUpload}
            class="hidden"
          />
          <button
            on:click={() => avatarInput.click()}
            disabled={avatarLoading}
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            Change Avatar
          </button>
          {#if $auth.user?.avatarUrl}
            <button
              on:click={deleteAvatar}
              disabled={avatarLoading}
              class="block px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
            >
              Remove Avatar
            </button>
          {/if}
        </div>
      </div>

      <!-- Profile Form -->
      <form on:submit|preventDefault={updateProfile} class="space-y-4">
        {#if profileMessage}
          <div class="bg-green-50 text-green-700 px-4 py-2 rounded-lg">{profileMessage}</div>
        {/if}
        {#if profileError}
          <div class="bg-red-50 text-red-700 px-4 py-2 rounded-lg">{profileError}</div>
        {/if}

        <div>
          <label for="username" class="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input
            id="username"
            type="text"
            bind:value={username}
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            id="email"
            type="email"
            bind:value={email}
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div class="text-sm text-gray-500">
          <span class="font-medium">Auth Provider:</span> {$auth.user?.authProvider || 'local'}
        </div>

        <button
          type="submit"
          disabled={profileLoading}
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {profileLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  </div>

  <!-- Security Section -->
  <div class="bg-white rounded-xl shadow-sm overflow-hidden">
    <div class="px-6 py-4 border-b bg-gray-50">
      <h2 class="font-semibold text-gray-900">Security</h2>
    </div>
    <div class="p-6">
      {#if $auth.user?.authProvider === 'google'}
        <div class="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
          Password management is not available for Google accounts.
        </div>
      {:else}
        <form on:submit|preventDefault={updatePassword} class="space-y-4">
          {#if passwordMessage}
            <div class="bg-green-50 text-green-700 px-4 py-2 rounded-lg">{passwordMessage}</div>
          {/if}
          {#if passwordError}
            <div class="bg-red-50 text-red-700 px-4 py-2 rounded-lg">{passwordError}</div>
          {/if}

          <div>
            <label for="currentPassword" class="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input
              id="currentPassword"
              type="password"
              bind:value={currentPassword}
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label for="newPassword" class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              id="newPassword"
              type="password"
              bind:value={newPassword}
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              id="confirmPassword"
              type="password"
              bind:value={confirmPassword}
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {passwordLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      {/if}
    </div>
  </div>

  <!-- Account Info -->
  <div class="bg-white rounded-xl shadow-sm overflow-hidden">
    <div class="px-6 py-4 border-b bg-gray-50">
      <h2 class="font-semibold text-gray-900">Account Information</h2>
    </div>
    <div class="p-6">
      <dl class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt class="text-gray-500">User ID</dt>
          <dd class="font-mono text-gray-900 mt-1">{$auth.user?.id || '-'}</dd>
        </div>
        <div>
          <dt class="text-gray-500">Role</dt>
          <dd class="text-gray-900 mt-1 capitalize">{$auth.user?.role || '-'}</dd>
        </div>
        <div>
          <dt class="text-gray-500">Created</dt>
          <dd class="text-gray-900 mt-1">
            {$auth.user?.createdAt ? new Date($auth.user.createdAt).toLocaleDateString() : '-'}
          </dd>
        </div>
        <div>
          <dt class="text-gray-500">Auth Provider</dt>
          <dd class="text-gray-900 mt-1 capitalize">{$auth.user?.authProvider || 'local'}</dd>
        </div>
      </dl>
    </div>
  </div>
</div>
