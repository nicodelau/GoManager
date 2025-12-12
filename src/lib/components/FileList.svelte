<script>
  import { formatSize, formatDate, getFileIcon } from '../utils/format.js';

  /** @type {Array<{name: string, size: number, isDir: boolean, modTime: string, path: string}>} */
  export let files = [];
  export let currentPath = '';
  /** @type {(file: any) => void} */
  export let onNavigate = () => {};
  /** @type {() => void} */
  export let onGoUp = () => {};
  /** @type {(file: any) => void} */
  export let onDownload = () => {};
  /** @type {(file: any) => void} */
  export let onDelete = () => {};
  /** @type {(file: any) => void} */
  export let onShare = () => {};
  /** @type {(file: any) => void} */
  export let onPreview = () => {};

  /**
   * Check if file can be previewed
   * @param {string} filename
   * @returns {boolean}
   */
  function canPreview(filename) {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const previewable = [
      'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico',
      'mp4', 'webm', 'ogg', 'mov',
      'mp3', 'wav', 'flac', 'aac', 'm4a',
      'pdf'
    ];
    return previewable.includes(ext);
  }
</script>

<div class="overflow-x-auto">
  <table class="w-full">
    <thead>
      <tr class="text-left text-xs text-gray-500 uppercase tracking-wider">
        <th class="pb-3 font-medium">Name</th>
        <th class="pb-3 font-medium w-24">Size</th>
        <th class="pb-3 font-medium w-40">Modified</th>
        <th class="pb-3 font-medium w-32 text-right">Actions</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-gray-100">
      {#if currentPath}
        <tr
          class="hover:bg-gray-50 cursor-pointer"
          on:click={onGoUp}
          on:keydown={(e) => e.key === 'Enter' && onGoUp()}
          tabindex="0"
          role="button"
        >
          <td class="py-3 flex items-center gap-3">
            <span class="text-xl">⬆️</span>
            <span class="text-gray-600">..</span>
          </td>
          <td></td>
          <td></td>
          <td></td>
        </tr>
      {/if}
      {#each files as file}
        <tr class="hover:bg-gray-50 group">
          <td class="py-3">
            <button
              class="flex items-center gap-3 w-full text-left"
              on:click={() => file.isDir ? onNavigate(file) : (canPreview(file.name) ? onPreview(file) : onDownload(file))}
            >
              <span class="text-xl">{getFileIcon(file)}</span>
              <span class="{file.isDir ? 'text-blue-600 hover:underline' : 'text-gray-800'}">{file.name}</span>
            </button>
          </td>
          <td class="py-3 text-sm text-gray-500">{formatSize(file.size)}</td>
          <td class="py-3 text-sm text-gray-500">{formatDate(file.modTime)}</td>
          <td class="py-3 text-right">
            <div class="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-1">
              {#if !file.isDir && canPreview(file.name)}
                <button
                  on:click|stopPropagation={() => onPreview(file)}
                  class="p-1.5 hover:bg-purple-100 rounded text-gray-600 hover:text-purple-600"
                  title="Preview"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              {/if}
              <button
                on:click|stopPropagation={() => onShare(file)}
                class="p-1.5 hover:bg-blue-100 rounded text-gray-600 hover:text-blue-600"
                title="Share"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
              {#if !file.isDir}
                <button
                  on:click|stopPropagation={() => onDownload(file)}
                  class="p-1.5 hover:bg-green-100 rounded text-gray-600 hover:text-green-600"
                  title="Download"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              {/if}
              <button
                on:click|stopPropagation={() => onDelete(file)}
                class="p-1.5 hover:bg-red-100 rounded text-gray-600 hover:text-red-600"
                title="Delete"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
