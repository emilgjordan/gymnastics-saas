<script lang="ts">
	import { APP_NAME } from '$lib';
	let { href = '/' }: { href?: string } = $props();
</script>

<a {href} class="flex items-center gap-2 font-semibold text-slate-900">
	<span class="grid size-8 place-items-center rounded-lg bg-indigo-600 text-white">
		<svg
			viewBox="0 0 24 24"
			class="size-5"
			fill="none"
			stroke="currentColor"
			stroke-width="2.2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<circle cx="12" cy="4.5" r="2" />
			<path d="M4 9l8 2 8-2M12 11v4l-4 6M12 15l4 6" />
		</svg>
	</span>
	{APP_NAME}
</a>
