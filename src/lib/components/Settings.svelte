<script>
  import { onMount } from 'svelte';
  import { auth, setUser } from '../stores/auth.js';
  import { userApi } from '../../api/userApi.js';
  import { googleApi } from '../../api/googleApi.js';
  import { authApi } from '../../api/authApi.js';

  /** @type {() => void} */
  export let onClose = () => {};

  // Tabs
  let activeTab = 'profile';

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

  // Google status
  let googleStatus = { connected: false, hasCalendar: false, hasTasks: false };
  let googleLoading = true;

  // Calendar events
  /** @type {Array<{id: string, summary: string, start: {dateTime?: string, date?: string}, end: {dateTime?: string, date?: string}, htmlLink?: string}>} */
  let calendarEvents = [];
  let eventsLoading = false;

  // Tasks
  /** @type {Array<{id: string, title: string, status: string, due?: string, notes?: string}>} */
  let tasks = [];
  let tasksLoading = false;

  onMount(async () => {
    if ($auth.user) {
      username = $auth.user.username;
      email = $auth.user.email;
    }
    await loadGoogleStatus();
  });

  async function loadGoogleStatus() {
    googleLoading = true;
    const result = await googleApi.getStatus();
    if (result.success && result.data) {
      googleStatus = result.data;
      if (googleStatus.connected) {
        loadCalendarEvents();
        loadTasks();
      }
    }
    googleLoading = false;
  }

  async function loadCalendarEvents() {
    eventsLoading = true;
    const result = await googleApi.listEvents({ maxResults: 10 });
    if (result.success && result.data) {
      calendarEvents = result.data;
    }
    eventsLoading = false;
  }

  async function loadTasks() {
    tasksLoading = true;
    const result = await googleApi.listTasks({ showCompleted: false });
    if (result.success && result.data) {
      tasks = result.data;
    }
    tasksLoading = false;
  }

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
      // Refresh user data
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

  function connectGoogle() {
    window.location.href = authApi.getGoogleLoginUrl();
  }

  /**
   * @param {string} taskId
   */
  async function completeTask(taskId) {
    const result = await googleApi.completeTask(taskId);
    if (result.success) {
      tasks = tasks.filter(t => t.id !== taskId);
    }
  }

  /**
   * @param {string | undefined} dateStr
   */
  function formatEventDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * @param {string | undefined} dateStr
   */
  function formatDueDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * @param {string} avatarUrl
   */
  function getAvatarSrc(avatarUrl) {
    return userApi.getAvatarUrl(avatarUrl);
  }
</script>

<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
  <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-4 border-b">
      <h2 class="text-xl font-semibold text-gray-800">Settings</h2>
      <button
        on:click={onClose}
        class="p-2 hover:bg-gray-100 rounded-lg transition"
        aria-label="Close settings"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar -->
      <div class="w-48 border-r bg-gray-50 p-4">
        <nav class="space-y-1">
          <button
            on:click={() => activeTab = 'profile'}
            class="w-full text-left px-3 py-2 rounded-lg transition {activeTab === 'profile' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}"
          >
            Profile
          </button>
          <button
            on:click={() => activeTab = 'security'}
            class="w-full text-left px-3 py-2 rounded-lg transition {activeTab === 'security' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}"
          >
            Security
          </button>
          <button
            on:click={() => activeTab = 'google'}
            class="w-full text-left px-3 py-2 rounded-lg transition {activeTab === 'google' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}"
          >
            Google Services
          </button>
        </nav>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6">
        {#if activeTab === 'profile'}
          <!-- Profile Tab -->
          <div class="space-y-6">
            <h3 class="text-lg font-medium text-gray-900">Profile Information</h3>

            <!-- Avatar Section -->
            <div class="flex items-center gap-6">
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
                    class="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                  >
                    Remove
                  </button>
                {/if}
              </div>
            </div>

            <!-- Profile Form -->
            <form on:submit|preventDefault={updateProfile} class="space-y-4 max-w-md">
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

        {:else if activeTab === 'security'}
          <!-- Security Tab -->
          <div class="space-y-6">
            <h3 class="text-lg font-medium text-gray-900">Change Password</h3>

            {#if $auth.user?.authProvider === 'google'}
              <div class="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
                Password management is not available for Google accounts.
              </div>
            {:else}
              <form on:submit|preventDefault={updatePassword} class="space-y-4 max-w-md">
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

        {:else if activeTab === 'google'}
          <!-- Google Services Tab -->
          <div class="space-y-6">
            <h3 class="text-lg font-medium text-gray-900">Google Services</h3>

            {#if googleLoading}
              <div class="text-center py-8">
                <div class="animate-spin text-3xl">&#9696;</div>
                <p class="text-gray-500 mt-2">Loading...</p>
              </div>
            {:else if !googleStatus.connected}
              <div class="bg-gray-50 rounded-xl p-6 text-center">
                <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <h4 class="text-lg font-medium text-gray-900 mb-2">Connect your Google Account</h4>
                <p class="text-gray-500 mb-4">Connect your Google account to access Calendar and Tasks</p>
                <button
                  on:click={connectGoogle}
                  class="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition inline-flex items-center gap-2"
                >
                  <svg class="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Connect with Google
                </button>
              </div>
            {:else}
              <!-- Connected -->
              <div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Google account connected
              </div>

              <!-- Calendar Section -->
              <div class="bg-white border rounded-xl overflow-hidden">
                <div class="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
                  <h4 class="font-medium text-gray-900 flex items-center gap-2">
                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Upcoming Events
                  </h4>
                  <button
                    on:click={loadCalendarEvents}
                    disabled={eventsLoading}
                    class="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Refresh
                  </button>
                </div>
                <div class="divide-y max-h-64 overflow-y-auto">
                  {#if eventsLoading}
                    <div class="p-4 text-center text-gray-500">Loading events...</div>
                  {:else if calendarEvents.length === 0}
                    <div class="p-4 text-center text-gray-500">No upcoming events</div>
                  {:else}
                    {#each calendarEvents as event}
                      <div class="p-4 hover:bg-gray-50">
                        <div class="font-medium text-gray-900">{event.summary || '(No title)'}</div>
                        <div class="text-sm text-gray-500">
                          {formatEventDate(event.start?.dateTime || event.start?.date)}
                        </div>
                        {#if event.htmlLink}
                          <a href={event.htmlLink} target="_blank" rel="noopener" class="text-sm text-blue-600 hover:underline">
                            View in Google Calendar
                          </a>
                        {/if}
                      </div>
                    {/each}
                  {/if}
                </div>
              </div>

              <!-- Tasks Section -->
              <div class="bg-white border rounded-xl overflow-hidden">
                <div class="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
                  <h4 class="font-medium text-gray-900 flex items-center gap-2">
                    <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Tasks
                  </h4>
                  <button
                    on:click={loadTasks}
                    disabled={tasksLoading}
                    class="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Refresh
                  </button>
                </div>
                <div class="divide-y max-h-64 overflow-y-auto">
                  {#if tasksLoading}
                    <div class="p-4 text-center text-gray-500">Loading tasks...</div>
                  {:else if tasks.length === 0}
                    <div class="p-4 text-center text-gray-500">No pending tasks</div>
                  {:else}
                    {#each tasks as task}
                      <div class="p-4 hover:bg-gray-50 flex items-start gap-3">
                        <button
                          on:click={() => completeTask(task.id)}
                          class="mt-0.5 w-5 h-5 border-2 border-gray-300 rounded hover:border-green-500 hover:bg-green-50 transition flex-shrink-0"
                          title="Mark as complete"
                          aria-label="Mark task as complete"
                        ></button>
                        <div class="flex-1 min-w-0">
                          <div class="font-medium text-gray-900">{task.title}</div>
                          {#if task.notes}
                            <div class="text-sm text-gray-500 truncate">{task.notes}</div>
                          {/if}
                          {#if task.due}
                            <div class="text-sm text-orange-600">Due: {formatDueDate(task.due)}</div>
                          {/if}
                        </div>
                      </div>
                    {/each}
                  {/if}
                </div>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
