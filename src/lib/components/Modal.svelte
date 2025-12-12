<script>
  export let show = false;
  export let title = '';
  /** @type {() => void} */
  export let onClose = () => {};

  function handleKeydown(e) {
    if (e.key === 'Escape') {
      onClose();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if show}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
      <h2 class="text-lg font-semibold mb-4">{title}</h2>
      <slot />
    </div>
  </div>
{/if}
