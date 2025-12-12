<script>
  import { onMount } from 'svelte';
  import { fileApi } from '../../api/fileApi.js';
  import Breadcrumb from '../components/Breadcrumb.svelte';
  import FileListComponent from '../components/FileList.svelte';
  import Modal from '../components/Modal.svelte';
  import ShareModal from '../components/ShareModal.svelte';
  import FilePreview from '../components/FilePreview.svelte';

  /** @type {import('../types/index.js').FileInfo[]} */
  let files = [];
  let currentPath = '';
  let loading = false;
  let error = '';
  let dragOver = false;
  let showNewFolderModal = false;
  let newFolderName = '';

  // Share modal
  let showShareModal = false;
  /** @type {{name: string, path: string, isDir: boolean} | null} */
  let shareFile = null;

  // Preview modal
  let showPreview = false;
  /** @type {{name: string, path: string, size: number} | null} */
  let previewFile = null;

  onMount(() => {
    fetchFiles();
  });

  /**
   * Fetch files from API
   * @param {string} path
   */
  async function fetchFiles(path = '') {
    loading = true;
    error = '';
    const result = await fileApi.list(path);
    if (result.success) {
      files = result.data || [];
      currentPath = path;
    } else {
      error = result.message || 'Failed to load files';
    }
    loading = false;
  }

  /**
   * Navigate to a folder or preview a file
   * @param {{path: string, isDir: boolean, name: string, size: number}} file
   */
  function navigateTo(file) {
    if (file.isDir) {
      fetchFiles(file.path);
    }
  }

  /**
   * Open preview for a file
   * @param {{path: string, name: string, size: number}} file
   */
  function openPreview(file) {
    console.log('Opening preview for:', file);
    previewFile = file;
    showPreview = true;
  }

  /**
   * Go up one directory level
   */
  function goUp() {
    if (!currentPath) return;
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    fetchFiles(parts.join('/'));
  }

  /**
   * Download a file
   * @param {{path: string, name: string, isDir: boolean}} file
   */
  function downloadFile(file) {
    if (file.isDir) return;
    const link = document.createElement('a');
    link.href = fileApi.getDownloadUrl(file.path);
    link.download = file.name;
    link.click();
  }

  /**
   * Delete a file or folder
   * @param {{path: string, name: string}} file
   */
  async function deleteItem(file) {
    if (!confirm(`Are you sure you want to delete "${file.name}"?`)) return;
    
    const result = await fileApi.delete(file.path);
    if (result.success) {
      fetchFiles(currentPath);
    } else {
      alert(result.message || 'Failed to delete');
    }
  }

  /**
   * Upload files to current directory
   * @param {FileList} fileList
   */
  async function uploadFiles(fileList) {
    if (!fileList || fileList.length === 0) return;
    
    loading = true;
    const result = await fileApi.upload(currentPath, fileList);
    if (result.success) {
      fetchFiles(currentPath);
    } else {
      alert(result.message || 'Upload failed');
    }
    loading = false;
  }

  /**
   * Handle file input change
   * @param {Event} e
   */
  function handleFileSelect(e) {
    const target = /** @type {HTMLInputElement} */ (e.target);
    if (target.files) {
      uploadFiles(target.files);
      target.value = '';
    }
  }

  /**
   * Handle drag and drop
   * @param {DragEvent} e
   */
  function handleDrop(e) {
    e.preventDefault();
    dragOver = false;
    if (e.dataTransfer?.files) {
      uploadFiles(e.dataTransfer.files);
    }
  }

  /**
   * Handle drag over
   * @param {DragEvent} e
   */
  function handleDragOver(e) {
    e.preventDefault();
    dragOver = true;
  }

  function handleDragLeave() {
    dragOver = false;
  }

  /**
   * Create a new folder
   */
  async function createFolder() {
    if (!newFolderName.trim()) return;
    
    const path = currentPath ? `${currentPath}/${newFolderName}` : newFolderName;
    
    const result = await fileApi.createFolder(path);
    if (result.success) {
      showNewFolderModal = false;
      newFolderName = '';
      fetchFiles(currentPath);
    } else {
      alert(result.message || 'Failed to create folder');
    }
  }

  function closeModal() {
    showNewFolderModal = false;
    newFolderName = '';
  }

  /**
   * Open share modal for a file
   * @param {{name: string, path: string, isDir: boolean}} file
   */
  function openShareModal(file) {
    shareFile = file;
    showShareModal = true;
  }

  function closeShareModal() {
    showShareModal = false;
    shareFile = null;
  }

  function closePreview() {
    showPreview = false;
    previewFile = null;
  }

  /** @type {HTMLInputElement} */
  let fileInput;
</script>

<div class="space-y-4">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-bold text-gray-900">Files</h1>
    <div class="flex items-center gap-2">
      <input
        type="file"
        multiple
        bind:this={fileInput}
        on:change={handleFileSelect}
        class="hidden"
      />
      <button
        on:click={() => showNewFolderModal = true}
        class="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        </svg>
        New Folder
      </button>
      <button
        on:click={() => fileInput.click()}
        class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        Upload
      </button>
    </div>
  </div>

  <Breadcrumb 
    path={currentPath}
    onNavigate={fetchFiles}
  />

  <!-- File List -->
  <div
    class="border-2 border-dashed rounded-xl p-4 transition-colors bg-white {dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}"
    on:drop={handleDrop}
    on:dragover={handleDragOver}
    on:dragleave={handleDragLeave}
    role="region"
    aria-label="File drop zone"
  >
    {#if loading}
      <div class="text-center py-8">
        <div class="inline-block animate-spin text-3xl">&#9696;</div>
        <p class="text-gray-500 mt-2">Loading...</p>
      </div>
    {:else if error}
      <div class="text-center py-8">
        <p class="text-red-500">{error}</p>
        <button
          on:click={() => fetchFiles(currentPath)}
          class="mt-2 text-blue-600 hover:underline"
        >
          Retry
        </button>
      </div>
    {:else if files.length === 0}
      <div class="text-center py-12 text-gray-400">
        <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <p class="text-lg">This folder is empty</p>
        <p class="text-sm mt-1">Drop files here or click Upload</p>
      </div>
    {:else}
      <FileListComponent 
        {files}
        {currentPath}
        onNavigate={navigateTo}
        onGoUp={goUp}
        onDownload={downloadFile}
        onDelete={deleteItem}
        onShare={openShareModal}
        onPreview={openPreview}
      />
    {/if}
  </div>
</div>

<Modal 
  show={showNewFolderModal}
  title="Create New Folder"
  onClose={closeModal}
>
  <input
    type="text"
    bind:value={newFolderName}
    placeholder="Folder name"
    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
    on:keydown={(e) => e.key === 'Enter' && createFolder()}
  />
  <div class="flex justify-end gap-2 mt-4">
    <button
      on:click={closeModal}
      class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
    >
      Cancel
    </button>
    <button
      on:click={createFolder}
      class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
    >
      Create
    </button>
  </div>
</Modal>

<ShareModal 
  show={showShareModal}
  file={shareFile}
  onClose={closeShareModal}
/>

{#if showPreview && previewFile}
  <FilePreview 
    file={previewFile}
    onClose={closePreview}
    onDownload={() => downloadFile({...previewFile, isDir: false})}
  />
{/if}
