<script>
  import { shareApi } from '../../api/shareApi.js';
  import Modal from './Modal.svelte';

  /** @type {boolean} */
  export let show = false;
  
  /** @type {{name: string, path: string, isDir: boolean} | null} */
  export let file = null;

  /** @type {() => void} */
  export let onClose = () => {};

  // Form state
  let shareType = 'public';
  let password = '';
  let permission = 'download';
  let expiresAt = '';
  let maxDownloads = 0;
  
  // Result state
  let loading = false;
  let error = '';
  let shareUrl = '';
  let copied = false;

  /**
   * Reset form state
   */
  function reset() {
    shareType = 'public';
    password = '';
    permission = 'download';
    expiresAt = '';
    maxDownloads = 0;
    error = '';
    shareUrl = '';
    copied = false;
  }

  /**
   * Handle modal close
   */
  function handleClose() {
    reset();
    onClose();
  }

  /**
   * Create share link
   */
  async function createShare() {
    if (!file) return;
    
    loading = true;
    error = '';

    /** @type {import('../../api/shareApi.js').CreateShareOptions} */
    const options = {
      path: file.path,
      shareType: shareType === 'password' ? 'password' : 'public',
      permission: permission === 'view' ? 'view' : 'download',
    };

    if (shareType === 'password' && password) {
      options.password = password;
    }

    if (expiresAt) {
      options.expiresAt = new Date(expiresAt).toISOString();
    }

    if (maxDownloads > 0) {
      options.maxDownloads = maxDownloads;
    }

    const result = await shareApi.create(options);
    
    if (result.success) {
      shareUrl = result.data.url;
    } else {
      error = result.message || 'Failed to create share';
    }

    loading = false;
  }

  /**
   * Copy share URL to clipboard
   */
  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      copied = true;
      setTimeout(() => copied = false, 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      copied = true;
      setTimeout(() => copied = false, 2000);
    }
  }

  // Reset when file changes
  $: if (file) reset();
</script>

<Modal {show} title="Share {file?.isDir ? 'Folder' : 'File'}" onClose={handleClose}>
  {#if file}
    <div class="space-y-4">
      <!-- File info -->
      <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
        <span class="text-2xl">{file.isDir ? '📁' : '📄'}</span>
        <div>
          <p class="font-medium text-gray-800">{file.name}</p>
          <p class="text-sm text-gray-500">{file.path}</p>
        </div>
      </div>

      {#if shareUrl}
        <!-- Share link created -->
        <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p class="text-sm text-green-700 mb-2">Share link created!</p>
          <div class="flex gap-2">
            <input
              type="text"
              value={shareUrl}
              readonly
              class="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
            />
            <button
              on:click={copyToClipboard}
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div class="flex justify-end">
          <button
            on:click={handleClose}
            class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            Close
          </button>
        </div>
      {:else}
        <!-- Share options form -->
        {#if error}
          <div class="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        {/if}

        <!-- Share type -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Share Type</label>
          <div class="flex gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" bind:group={shareType} value="public" class="text-blue-600" />
              <span class="text-sm">Public Link</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" bind:group={shareType} value="password" class="text-blue-600" />
              <span class="text-sm">Password Protected</span>
            </label>
          </div>
        </div>

        <!-- Password field (conditional) -->
        {#if shareType === 'password'}
          <div>
            <label for="share-password" class="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="share-password"
              type="password"
              bind:value={password}
              placeholder="Enter password"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        {/if}

        <!-- Permission -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Permission</label>
          <div class="flex gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" bind:group={permission} value="download" class="text-blue-600" />
              <span class="text-sm">Download</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" bind:group={permission} value="view" class="text-blue-600" />
              <span class="text-sm">View Only</span>
            </label>
          </div>
        </div>

        <!-- Advanced options -->
        <details class="group">
          <summary class="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
            Advanced options
          </summary>
          <div class="mt-3 space-y-3 pl-4">
            <div>
              <label for="expires" class="block text-sm font-medium text-gray-700 mb-1">
                Expires At (optional)
              </label>
              <input
                id="expires"
                type="datetime-local"
                bind:value={expiresAt}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label for="max-downloads" class="block text-sm font-medium text-gray-700 mb-1">
                Max Downloads (0 = unlimited)
              </label>
              <input
                id="max-downloads"
                type="number"
                min="0"
                bind:value={maxDownloads}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
        </details>

        <!-- Actions -->
        <div class="flex justify-end gap-2 pt-2">
          <button
            on:click={handleClose}
            class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            on:click={createShare}
            disabled={loading || (shareType === 'password' && !password)}
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {#if loading}
              Creating...
            {:else}
              Create Share Link
            {/if}
          </button>
        </div>
      {/if}
    </div>
  {/if}
</Modal>
