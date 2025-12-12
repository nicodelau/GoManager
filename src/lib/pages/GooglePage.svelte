<script>
  import { onMount } from 'svelte';
  import { googleApi } from '../../api/googleApi.js';
  import { authApi } from '../../api/authApi.js';

  // Google status
  let googleStatus = { connected: false, authProvider: 'local', hasCalendar: false, hasTasks: false };
  let googleLoading = true;

  // Active tab
  let activeTab = 'calendar';

  // Calendar
  /** @type {Array<{id: string, summary: string, primary?: boolean}>} */
  let calendars = [];
  let selectedCalendar = 'primary';
  /** @type {Array<{id: string, summary: string, start: {dateTime?: string, date?: string}, end: {dateTime?: string, date?: string}, htmlLink?: string, description?: string, location?: string}>} */
  let events = [];
  let eventsLoading = false;

  // Tasks
  /** @type {Array<{id: string, title: string}>} */
  let taskLists = [];
  let selectedTaskList = '@default';
  /** @type {Array<{id: string, title: string, status: string, due?: string, notes?: string}>} */
  let tasks = [];
  let tasksLoading = false;
  let showCompleted = false;

  // New event form
  let showNewEvent = false;
  let newEvent = { summary: '', description: '', location: '', startDate: '', startTime: '', endDate: '', endTime: '' };
  let eventSaving = false;

  // New task form
  let showNewTask = false;
  let newTask = { title: '', notes: '', due: '' };
  let taskSaving = false;

  onMount(async () => {
    await loadGoogleStatus();
  });

  async function loadGoogleStatus() {
    googleLoading = true;
    const result = await googleApi.getStatus();
    if (result.success && result.data) {
      googleStatus = result.data;
      if (googleStatus.connected) {
        await Promise.all([loadCalendars(), loadTaskLists()]);
      }
    }
    googleLoading = false;
  }

  async function loadCalendars() {
    const result = await googleApi.listCalendars();
    if (result.success && result.data) {
      calendars = result.data;
      const primary = calendars.find(c => c.primary);
      if (primary) selectedCalendar = primary.id;
      await loadEvents();
    }
  }

  async function loadEvents() {
    eventsLoading = true;
    const now = new Date();
    const result = await googleApi.listEvents({
      calendarId: selectedCalendar,
      timeMin: now.toISOString(),
      maxResults: 50
    });
    if (result.success && result.data) {
      events = result.data;
    }
    eventsLoading = false;
  }

  async function loadTaskLists() {
    const result = await googleApi.listTaskLists();
    if (result.success && result.data) {
      taskLists = result.data;
      if (taskLists.length > 0) {
        selectedTaskList = taskLists[0].id;
        await loadTasks();
      }
    }
  }

  async function loadTasks() {
    tasksLoading = true;
    const result = await googleApi.listTasks({
      taskListId: selectedTaskList,
      showCompleted
    });
    if (result.success && result.data) {
      tasks = result.data;
    }
    tasksLoading = false;
  }

  async function createEvent() {
    if (!newEvent.summary || !newEvent.startDate || !newEvent.startTime) {
      alert('Please fill in event title, start date and time');
      return;
    }

    eventSaving = true;
    
    // Get user's timezone
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    const startDateTime = `${newEvent.startDate}T${newEvent.startTime}:00`;
    const endDateTime = newEvent.endDate && newEvent.endTime 
      ? `${newEvent.endDate}T${newEvent.endTime}:00`
      : `${newEvent.startDate}T${newEvent.startTime}:00`;

    const result = await googleApi.createEvent({
      summary: newEvent.summary,
      description: newEvent.description,
      location: newEvent.location,
      start: { dateTime: startDateTime, timeZone },
      end: { dateTime: endDateTime, timeZone }
    }, selectedCalendar);

    if (result.success) {
      showNewEvent = false;
      newEvent = { summary: '', description: '', location: '', startDate: '', startTime: '', endDate: '', endTime: '' };
      await loadEvents();
    } else {
      alert(result.message || 'Failed to create event');
    }
    eventSaving = false;
  }

  async function createTask() {
    if (!newTask.title) {
      alert('Please enter a task title');
      return;
    }

    taskSaving = true;
    const result = await googleApi.createTask({
      title: newTask.title,
      notes: newTask.notes,
      due: newTask.due ? `${newTask.due}T00:00:00.000Z` : undefined
    }, selectedTaskList);

    if (result.success) {
      showNewTask = false;
      newTask = { title: '', notes: '', due: '' };
      await loadTasks();
    } else {
      alert(result.message || 'Failed to create task');
    }
    taskSaving = false;
  }

  /**
   * @param {string} taskId
   */
  async function completeTask(taskId) {
    const result = await googleApi.completeTask(taskId, selectedTaskList);
    if (result.success) {
      tasks = tasks.filter(t => t.id !== taskId);
    }
  }

  function connectGoogle() {
    window.location.href = authApi.getGoogleLoginUrl();
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
      day: 'numeric',
      year: 'numeric'
    });
  }
</script>

<div class="space-y-6">
  <h1 class="text-2xl font-bold text-gray-900">Google Services</h1>

  {#if googleLoading}
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin text-4xl">&#9696;</div>
    </div>
  {:else if !googleStatus.connected}
    <!-- Not Connected -->
    <div class="bg-white rounded-xl shadow-sm p-8 text-center">
      <svg class="w-20 h-20 mx-auto mb-6" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      <h2 class="text-xl font-semibold text-gray-900 mb-2">Connect your Google Account</h2>
      <p class="text-gray-500 mb-6 max-w-md mx-auto">
        Connect your Google account to access your Calendar, Tasks, and other Google services.
      </p>
      <button
        on:click={connectGoogle}
        class="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition inline-flex items-center gap-3"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Sign in with Google
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

    <!-- Tabs -->
    <div class="border-b border-gray-200">
      <nav class="flex gap-4">
        <button
          on:click={() => activeTab = 'calendar'}
          class="py-3 px-1 border-b-2 font-medium text-sm transition {activeTab === 'calendar' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
        >
          Calendar
        </button>
        <button
          on:click={() => activeTab = 'tasks'}
          class="py-3 px-1 border-b-2 font-medium text-sm transition {activeTab === 'tasks' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
        >
          Tasks
        </button>
      </nav>
    </div>

    {#if activeTab === 'calendar'}
      <!-- Calendar Tab -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <select
              bind:value={selectedCalendar}
              on:change={loadEvents}
              class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              {#each calendars as calendar}
                <option value={calendar.id}>{calendar.summary}</option>
              {/each}
            </select>
          </div>
          <button
            on:click={() => showNewEvent = true}
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            New Event
          </button>
        </div>

        <div class="bg-white rounded-xl shadow-sm overflow-hidden">
          {#if eventsLoading}
            <div class="p-8 text-center">
              <div class="animate-spin text-3xl">&#9696;</div>
            </div>
          {:else if events.length === 0}
            <div class="p-8 text-center text-gray-500">
              <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>No upcoming events</p>
            </div>
          {:else}
            <div class="divide-y">
              {#each events as event}
                <div class="p-4 hover:bg-gray-50">
                  <div class="flex items-start justify-between">
                    <div>
                      <h3 class="font-medium text-gray-900">{event.summary || '(No title)'}</h3>
                      <p class="text-sm text-gray-500">{formatEventDate(event.start?.dateTime || event.start?.date)}</p>
                      {#if event.location}
                        <p class="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {event.location}
                        </p>
                      {/if}
                    </div>
                    {#if event.htmlLink}
                      <a href={event.htmlLink} target="_blank" rel="noopener" class="text-blue-600 hover:text-blue-700 text-sm">
                        Open
                      </a>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>

    {:else if activeTab === 'tasks'}
      <!-- Tasks Tab -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <select
              bind:value={selectedTaskList}
              on:change={loadTasks}
              class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              {#each taskLists as list}
                <option value={list.id}>{list.title}</option>
              {/each}
            </select>
            <label class="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" bind:checked={showCompleted} on:change={loadTasks} class="rounded" />
              Show completed
            </label>
          </div>
          <button
            on:click={() => showNewTask = true}
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            New Task
          </button>
        </div>

        <div class="bg-white rounded-xl shadow-sm overflow-hidden">
          {#if tasksLoading}
            <div class="p-8 text-center">
              <div class="animate-spin text-3xl">&#9696;</div>
            </div>
          {:else if tasks.length === 0}
            <div class="p-8 text-center text-gray-500">
              <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p>No tasks</p>
            </div>
          {:else}
            <div class="divide-y">
              {#each tasks as task}
                <div class="p-4 hover:bg-gray-50 flex items-start gap-3">
                  <button
                    on:click={() => completeTask(task.id)}
                    class="mt-0.5 w-5 h-5 border-2 rounded flex-shrink-0 transition {task.status === 'completed' ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-green-500'}"
                    title="Mark as complete"
                  >
                    {#if task.status === 'completed'}
                      <svg class="w-full h-full text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                      </svg>
                    {/if}
                  </button>
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-gray-900 {task.status === 'completed' ? 'line-through text-gray-500' : ''}">{task.title}</p>
                    {#if task.notes}
                      <p class="text-sm text-gray-500 truncate">{task.notes}</p>
                    {/if}
                    {#if task.due}
                      <p class="text-sm text-orange-600">Due: {formatDueDate(task.due)}</p>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    {/if}
  {/if}
</div>

<!-- New Event Modal -->
{#if showNewEvent}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-md">
      <div class="px-6 py-4 border-b">
        <h3 class="text-lg font-semibold">New Event</h3>
      </div>
      <div class="p-6 space-y-4">
        <div>
          <label for="event-summary" class="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input id="event-summary" type="text" bind:value={newEvent.summary} class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="event-start-date" class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input id="event-start-date" type="date" bind:value={newEvent.startDate} class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>
          <div>
            <label for="event-start-time" class="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
            <input id="event-start-time" type="time" bind:value={newEvent.startTime} class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="event-end-date" class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input id="event-end-date" type="date" bind:value={newEvent.endDate} class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>
          <div>
            <label for="event-end-time" class="block text-sm font-medium text-gray-700 mb-1">End Time</label>
            <input id="event-end-time" type="time" bind:value={newEvent.endTime} class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>
        </div>
        <div>
          <label for="event-location" class="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input id="event-location" type="text" bind:value={newEvent.location} class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
        </div>
        <div>
          <label for="event-description" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea id="event-description" bind:value={newEvent.description} rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"></textarea>
        </div>
      </div>
      <div class="px-6 py-4 border-t flex justify-end gap-2">
        <button on:click={() => showNewEvent = false} class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">Cancel</button>
        <button on:click={createEvent} disabled={eventSaving} class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
          {eventSaving ? 'Creating...' : 'Create Event'}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- New Task Modal -->
{#if showNewTask}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-md">
      <div class="px-6 py-4 border-b">
        <h3 class="text-lg font-semibold">New Task</h3>
      </div>
      <div class="p-6 space-y-4">
        <div>
          <label for="task-title" class="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input id="task-title" type="text" bind:value={newTask.title} class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
        </div>
        <div>
          <label for="task-due" class="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
          <input id="task-due" type="date" bind:value={newTask.due} class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
        </div>
        <div>
          <label for="task-notes" class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea id="task-notes" bind:value={newTask.notes} rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"></textarea>
        </div>
      </div>
      <div class="px-6 py-4 border-t flex justify-end gap-2">
        <button on:click={() => showNewTask = false} class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">Cancel</button>
        <button on:click={createTask} disabled={taskSaving} class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
          {taskSaving ? 'Creating...' : 'Create Task'}
        </button>
      </div>
    </div>
  </div>
{/if}
