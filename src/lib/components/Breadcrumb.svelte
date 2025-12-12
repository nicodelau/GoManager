<script>
  /** @type {string} */
  export let path = '';
  /** @type {(path: string) => void} */
  export let onNavigate = (path) => {};

  function getBreadcrumbs() {
    if (!path) return [];
    return path.split('/').filter(Boolean);
  }

  function navigateToBreadcrumb(index) {
    const parts = path.split('/').filter(Boolean);
    const newPath = parts.slice(0, index + 1).join('/');
    onNavigate(newPath);
  }
</script>

<div class="bg-white border-b border-gray-100">
  <div class="max-w-7xl mx-auto px-4 py-2">
    <div class="flex items-center gap-1 text-sm">
      <button
        on:click={() => onNavigate('')}
        class="text-blue-600 hover:text-blue-800 hover:underline"
      >
        Home
      </button>
      {#each getBreadcrumbs() as part, i}
        <span class="text-gray-400">/</span>
        <button
          on:click={() => navigateToBreadcrumb(i)}
          class="text-blue-600 hover:text-blue-800 hover:underline"
        >
          {part}
        </button>
      {/each}
    </div>
  </div>
</div>
