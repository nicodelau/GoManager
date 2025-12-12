/**
 * Format file size to human readable
 * @param {number} bytes
 * @returns {string}
 */
export function formatSize(bytes) {
  if (bytes === 0) return '—';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Format date to locale string
 * @param {string} dateStr
 * @returns {string}
 */
export function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Get file icon based on file type
 * @param {{name: string, isDir: boolean}} file
 * @returns {string}
 */
export function getFileIcon(file) {
  if (file.isDir) return '📁';
  const ext = file.name.split('.').pop()?.toLowerCase();
  const icons = {
    pdf: '📄', doc: '📝', docx: '📝', txt: '📃',
    jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', svg: '🖼️', webp: '🖼️',
    mp3: '🎵', wav: '🎵', flac: '🎵', ogg: '🎵',
    mp4: '🎬', mkv: '🎬', avi: '🎬', mov: '🎬',
    zip: '📦', rar: '📦', tar: '📦', gz: '📦', '7z': '📦',
    js: '💻', ts: '💻', py: '💻', go: '💻', rs: '💻', java: '💻',
    html: '🌐', css: '🎨', json: '📋', xml: '📋',
  };
  return icons[ext] || '📄';
}
