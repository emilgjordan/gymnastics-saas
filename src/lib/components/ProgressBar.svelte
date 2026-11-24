<script lang="ts">
	let {
		mastered,
		working = 0,
		total,
		size = 'md'
	}: { mastered: number; working?: number; total: number; size?: 'sm' | 'md' } = $props();
	const pm = $derived(total ? (mastered / total) * 100 : 0);
	const pw = $derived(total ? (working / total) * 100 : 0);
</script>

<div
	class="flex w-full overflow-hidden rounded-full bg-slate-100 {size === 'sm' ? 'h-1.5' : 'h-2.5'}"
	role="progressbar"
	aria-valuenow={Math.round(pm)}
	aria-valuemin={0}
	aria-valuemax={100}
>
	<div class="bg-emerald-500 transition-all" style="width: {pm}%"></div>
	<div class="bg-amber-400 transition-all" style="width: {pw}%"></div>
</div>
