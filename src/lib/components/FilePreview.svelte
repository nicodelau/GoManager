<script>
  import { fileApi } from '../../api/fileApi.js';

  /** @type {{name: string, path: string, size: number}} */
  export let file;

  /** @type {() => void} */
  export let onClose = () => {};

  /** @type {() => void} */
  export let onDownload = () => {};

  /**
   * Get file extension
   * @param {string} filename
   * @returns {string}
   */
  function getExtension(filename) {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
  }

  /**
   * Check if file is an image
   * @param {string} filename
   * @returns {boolean}
   */
  function isImage(filename) {
    const ext = getExtension(filename);
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext);
  }

  /**
   * Check if file is a video
   * @param {string} filename
   * @returns {boolean}
   */
  function isVideo(filename) {
    const ext = getExtension(filename);
    return ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'].includes(ext);
  }

  /**
   * Check if file is audio
   * @param {string} filename
   * @returns {boolean}
   */
  function isAudio(filename) {
    const ext = getExtension(filename);
    return ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(ext);
  }

  /**
   * Check if file is PDF
   * @param {string} filename
   * @returns {boolean}
   */
  function isPdf(filename) {
    return getExtension(filename) === 'pdf';
  }

  /**
   * Check if file is text-based
   * @param {string} filename
   * @returns {boolean}
   */
  function isText(filename) {
    const ext = getExtension(filename);
    return ['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts', 'py', 'go', 'java', 'c', 'cpp', 'h', 'sh', 'yml', 'yaml', 'toml', 'ini', 'cfg', 'log', 'csv'].includes(ext);
  }

  /**
   * Format file size
   * @param {number} bytes
   * @returns {string}
   */
  function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get icon for file type
   * @param {string} filename
   * @returns {string}
   */
  function getFileIcon(filename) {
    if (isImage(filename)) return 'image';
    if (isVideo(filename)) return 'video';
    if (isAudio(filename)) return 'audio';
    if (isPdf(filename)) return 'pdf';
    if (isText(filename)) return 'text';
    return 'file';
  }

  $: previewUrl = fileApi.getPreviewUrl(file.path);
  $: console.log('Preview URL:', previewUrl);
  $: fileType = getFileIcon(file.name);
  $: canPreview = isImage(file.name) || isVideo(file.name) || isAudio(file.name) || isPdf(file.name);

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') {
      onClose();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div 
  class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
  on:click={handleBackdropClick}
  role="dialog"
  aria-modal="true"
  aria-label="File preview"
>
  <div class="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
      <div class="flex items-center gap-3 min-w-0">
        {#if fileType === 'image'}
          <div class="p-2 bg-purple-100 rounded-lg">
            <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        {:else if fileType === 'video'}
          <div class="p-2 bg-pink-100 rounded-lg">
            <svg class="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        {:else if fileType === 'audio'}
          <div class="p-2 bg-yellow-100 rounded-lg">
            <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
        {:else if fileType === 'pdf'}
          <div class="p-2 bg-red-100 rounded-lg">
            <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        {:else}
          <div class="p-2 bg-gray-100 rounded-lg">
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        {/if}
        <div class="min-w-0">
          <h2 class="text-lg font-semibold text-gray-900 truncate">{file.name}</h2>
          <p class="text-sm text-gray-500">{formatSize(file.size)}</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button
          on:click={onDownload}
          class="p-2 hover:bg-gray-200 rounded-lg transition"
          title="Download"
        >
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>
        <button
          on:click={onClose}
          class="p-2 hover:bg-gray-200 rounded-lg transition"
          title="Close"
        >
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Preview Content -->
    <div class="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4">
      {#if isImage(file.name)}
        <img 
          src={previewUrl} 
          alt={file.name}
          class="max-w-full max-h-full object-contain rounded-lg shadow-lg"
        />
      {:else if isVideo(file.name)}
        <video 
          src={previewUrl} 
          controls
          class="max-w-full max-h-full rounded-lg shadow-lg"
        >
          <track kind="captions" />
          Your browser does not support video playback.
        </video>
      {:else if isAudio(file.name)}
        <div class="bg-white rounded-xl p-8 shadow-lg text-center">
          <div class="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
            <svg class="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <p class="text-lg font-medium text-gray-900 mb-4">{file.name}</p>
          <audio src={previewUrl} controls class="w-full max-w-md">
            Your browser does not support audio playback.
          </audio>
        </div>
      {:else if isPdf(file.name)}
        <iframe 
          src={previewUrl}
          title={file.name}
          class="w-full h-full min-h-[600px] rounded-lg shadow-lg bg-white"
        ></iframe>
      {:else}
        <!-- No preview available -->
        <div class="bg-white rounded-xl p-12 shadow-lg text-center max-w-md">
          <div class="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">No Preview Available</h3>
          <p class="text-gray-500 mb-6">This file type cannot be previewed in the browser.</p>
          <button
            on:click={onDownload}
            class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition inline-flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download File
          </button>
        </div>
      {/if}
    </div>
  </div>
</div>
