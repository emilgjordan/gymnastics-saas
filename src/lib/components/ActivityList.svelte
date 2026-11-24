<script lang="ts">
	import StatusBadge from './StatusBadge.svelte';
	import type { SkillStatus } from '$lib/progress';

	let {
		items,
		gymId,
		showAthlete = true
	}: {
		items: {
			id: string;
			athleteId: string;
			athleteName: string;
			skillName: string;
			levelName: string;
			to: SkillStatus;
			by: string | null;
			at: Date | string;
		}[];
		gymId?: string;
		showAthlete?: boolean;
	} = $props();

	function ago(d: Date | string) {
		const s = (Date.now() - new Date(d).getTime()) / 1000;
		if (s < 60) return 'just now';
		if (s < 3600) return `${Math.floor(s / 60)}m ago`;
		if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
		if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
		return new Date(d).toLocaleDateString();
	}
</script>

{#if items.length === 0}
	<p class="px-4 py-6 text-center muted">No activity yet.</p>
{:else}
	<ul class="divide-y divide-slate-100">
		{#each items as a (a.id)}
			<li class="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
				<div class="min-w-0">
					<p class="truncate">
						{#if showAthlete && gymId}
							<a href="/g/{gymId}/athletes/{a.athleteId}" class="font-medium hover:text-indigo-600"
								>{a.athleteName}</a
							> ·
						{/if}
						<span class="text-slate-700">{a.skillName}</span>
						<span class="text-xs text-slate-400">({a.levelName})</span>
					</p>
					<p class="text-xs text-slate-500">{ago(a.at)}{a.by ? ` · by ${a.by}` : ''}</p>
				</div>
				<StatusBadge status={a.to} />
			</li>
		{/each}
	</ul>
{/if}
