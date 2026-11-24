<script lang="ts">
	let { message }: { message?: string | null } = $props();
</script>

{#if message}
	<p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200 ring-inset">
		{message}
	</p>
{/if}
