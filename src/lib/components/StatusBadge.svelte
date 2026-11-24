<script lang="ts">
	import { statusLabel, type SkillStatus } from '$lib/progress';
	let { status }: { status: SkillStatus } = $props();
	const cls: Record<SkillStatus, string> = {
		not_started: 'bg-slate-100 text-slate-600 ring-slate-200',
		working: 'bg-amber-50 text-amber-700 ring-amber-200',
		mastered: 'bg-emerald-50 text-emerald-700 ring-emerald-200'
	};
</script>

<span
	class="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset {cls[
		status
	]}"
>
	{statusLabel[status]}
</span>
