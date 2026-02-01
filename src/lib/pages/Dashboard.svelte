<script>
  import { onMount } from 'svelte';
  import { fileApi } from '../../api/fileApi.js';
  import { googleApi } from '../../api/googleApi.js';
  import { navigate } from '../stores/router.js';

  /** @type {{totalFiles: number, totalFolders: number, totalSize: number, filesByType: Record<string, number>, recentFiles: Array<{name: string, path: string, size: number, modTime: string}>} | null} */
  let stats = null;
  let statsLoading = true;

  /** @type {{connected: boolean, hasCalendar: boolean, hasTasks: boolean}} */
  let googleStatus = { connected: false, hasCalendar: false, hasTasks: false };

  /** @type {Array<{id: string, summary: string, start: {dateTime?: string, date?: string}}>} */
  let upcomingEvents = [];
  let eventsLoading = false;

  /** @type {Array<{id: string, title: string, due?: string}>} */
  let pendingTasks = [];
  let tasksLoading = false;

  onMount(async () => {
    await Promise.all([
      loadStats(),
      loadGoogleData()
    ]);
  });

  async function loadStats() {
    statsLoading = true;
    const result = await fileApi.getStats();
    if (result.success && result.data) {
      stats = result.data;
    }
    statsLoading = false;
  }

  async function loadGoogleData() {
    const statusResult = await googleApi.getStatus();
    if (statusResult.success && statusResult.data) {
      googleStatus = statusResult.data;
      
      if (googleStatus.connected) {
        eventsLoading = true;
        tasksLoading = true;
        
        const [eventsResult, tasksResult] = await Promise.all([
          googleApi.listEvents({ maxResults: 5 }),
          googleApi.listTasks({ showCompleted: false })
        ]);
        
        if (eventsResult.success && eventsResult.data) {
          upcomingEvents = eventsResult.data.slice(0, 5);
        }
        
        if (tasksResult.success && tasksResult.data) {
          pendingTasks = tasksResult.data.slice(0, 5);
        }
        
        eventsLoading = false;
        tasksLoading = false;
      }
    }
  }

  /**
   * Format bytes to human readable
   * @param {number} bytes
   * @returns {string}
   */
  function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Format date for display
   * @param {string} dateStr
   * @returns {string}
   */
  function formatDate(dateStr) {
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
   * Get top file types
   * @param {Record<string, number>} filesByType
   * @returns {Array<{type: string, count: number}>}
   */
  function getTopFileTypes(filesByType) {
    return Object.entries(filesByType)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }

  /**
   * Get color for file type
   * @param {string} ext
   * @returns {string}
   */
  function getTypeColor(ext) {
    const colors = {
      '.pdf': 'bg-red-500',
      '.doc': 'bg-blue-500',
      '.docx': 'bg-blue-500',
      '.xls': 'bg-green-500',
      '.xlsx': 'bg-green-500',
      '.jpg': 'bg-purple-500',
      '.jpeg': 'bg-purple-500',
      '.png': 'bg-purple-500',
      '.gif': 'bg-purple-500',
      '.mp3': 'bg-yellow-500',
      '.mp4': 'bg-pink-500',
      '.zip': 'bg-orange-500',
      '.rar': 'bg-orange-500',
    };
    return colors[ext.toLowerCase()] || 'bg-gray-500';
  }
</script>

<div class="space-y-6">
  <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>

  <!-- Stats Cards -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {#if statsLoading}
      {#each [1, 2, 3, 4] as _}
        <div class="bg-white rounded-xl shadow-sm p-6 animate-pulse">
          <div class="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div class="h-8 bg-gray-200 rounded w-3/4"></div>
        </div>
      {/each}
    {:else if stats}
      <div class="bg-white rounded-xl shadow-sm p-6">
        <div class="flex items-center gap-3">
          <div class="p-3 bg-blue-100 rounded-lg">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p class="text-sm text-gray-500">Total Files</p>
            <p class="text-2xl font-bold text-gray-900">{stats.totalFiles}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-6">
        <div class="flex items-center gap-3">
          <div class="p-3 bg-purple-100 rounded-lg">
            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <div>
            <p class="text-sm text-gray-500">Total Folders</p>
            <p class="text-2xl font-bold text-gray-900">{stats.totalFolders}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-6">
        <div class="flex items-center gap-3">
          <div class="p-3 bg-green-100 rounded-lg">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
          </div>
          <div>
            <p class="text-sm text-gray-500">Storage Used</p>
            <p class="text-2xl font-bold text-gray-900">{formatSize(stats.totalSize)}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-6">
        <div class="flex items-center gap-3">
          <div class="p-3 bg-orange-100 rounded-lg">
            <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p class="text-sm text-gray-500">File Types</p>
            <p class="text-2xl font-bold text-gray-900">{Object.keys(stats.filesByType).length}</p>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Recent Files -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div class="px-6 py-4 border-b flex items-center justify-between">
        <h2 class="font-semibold text-gray-900">Recent Files</h2>
        <button
          on:click={() => navigate('files')}
          class="text-sm text-blue-600 hover:text-blue-700"
        >
          View all
        </button>
      </div>
      <div class="divide-y">
        {#if statsLoading}
          {#each [1, 2, 3, 4, 5] as _}
            <div class="px-6 py-3 animate-pulse">
              <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div class="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          {/each}
        {:else if stats && stats.recentFiles && stats.recentFiles.length > 0}
          {#each stats.recentFiles as file}
            <button 
              type="button" 
              class="w-full text-left px-6 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset transition-colors" 
              on:click={() => navigate('files')}
              on:keydown={(e) => e.key === 'Enter' && navigate('files')}
              aria-label="View file: {file.name}"
            >
              <div class="flex items-center gap-3">
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p class="text-xs text-gray-500">{formatSize(file.size)} - {formatDate(file.modTime)}</p>
                </div>
              </div>
            </button>
          {/each}
        {:else}
          <div class="px-6 py-8 text-center text-gray-500">
            No files yet
          </div>
        {/if}
      </div>
    </div>

    <!-- File Types Distribution -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div class="px-6 py-4 border-b">
        <h2 class="font-semibold text-gray-900">File Types</h2>
      </div>
      <div class="p-6">
        {#if statsLoading}
          <div class="space-y-3">
            {#each [1, 2, 3, 4] as _}
              <div class="animate-pulse">
                <div class="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            {/each}
          </div>
        {:else if stats && stats.filesByType && Object.keys(stats.filesByType).length > 0}
          <div class="space-y-3">
            {#each getTopFileTypes(stats.filesByType) as item}
              <div class="flex items-center gap-3">
                <div class="w-20 text-sm text-gray-600 truncate">{item.type}</div>
                <div class="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div 
                    class="h-full {getTypeColor(item.type)} rounded-full transition-all"
                    style="width: {Math.max(5, (item.count / stats.totalFiles) * 100)}%"
                  ></div>
                </div>
                <div class="w-12 text-sm text-gray-600 text-right">{item.count}</div>
              </div>
            {/each}
          </div>
        {:else}
          <div class="text-center text-gray-500 py-4">
            No files to analyze
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Google Section -->
  {#if googleStatus.connected}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Upcoming Events -->
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b flex items-center justify-between">
          <h2 class="font-semibold text-gray-900 flex items-center gap-2">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Upcoming Events
          </h2>
          <button
            on:click={() => navigate('google')}
            class="text-sm text-blue-600 hover:text-blue-700"
          >
            View all
          </button>
        </div>
        <div class="divide-y">
          {#if eventsLoading}
            {#each [1, 2, 3] as _}
              <div class="px-6 py-3 animate-pulse">
                <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div class="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            {/each}
          {:else if upcomingEvents.length > 0}
            {#each upcomingEvents as event}
              <div class="px-6 py-3 hover:bg-gray-50">
                <p class="text-sm font-medium text-gray-900">{event.summary || '(No title)'}</p>
                <p class="text-xs text-gray-500">{formatDate(event.start?.dateTime || event.start?.date || '')}</p>
              </div>
            {/each}
          {:else}
            <div class="px-6 py-8 text-center text-gray-500">
              No upcoming events
            </div>
          {/if}
        </div>
      </div>

      <!-- Pending Tasks -->
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b flex items-center justify-between">
          <h2 class="font-semibold text-gray-900 flex items-center gap-2">
            <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Pending Tasks
          </h2>
          <button
            on:click={() => navigate('google')}
            class="text-sm text-blue-600 hover:text-blue-700"
          >
            View all
          </button>
        </div>
        <div class="divide-y">
          {#if tasksLoading}
            {#each [1, 2, 3] as _}
              <div class="px-6 py-3 animate-pulse">
                <div class="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            {/each}
          {:else if pendingTasks.length > 0}
            {#each pendingTasks as task}
              <div class="px-6 py-3 hover:bg-gray-50">
                <p class="text-sm font-medium text-gray-900">{task.title}</p>
                {#if task.due}
                  <p class="text-xs text-orange-600">Due: {formatDate(task.due)}</p>
                {/if}
              </div>
            {/each}
          {:else}
            <div class="px-6 py-8 text-center text-gray-500">
              No pending tasks
            </div>
          {/if}
        </div>
      </div>
    </div>
  {:else}
    <!-- Google Not Connected -->
    <div class="bg-white rounded-xl shadow-sm p-6">
      <div class="flex items-center gap-4">
        <div class="p-3 bg-gray-100 rounded-lg">
          <svg class="w-8 h-8 text-gray-400" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        </div>
        <div class="flex-1">
          <h3 class="font-medium text-gray-900">Connect Google Account</h3>
          <p class="text-sm text-gray-500">Connect your Google account to see your calendar events and tasks here.</p>
        </div>
        <button
          on:click={() => navigate('google')}
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Connect
        </button>
      </div>
    </div>
  {/if}
</div>
