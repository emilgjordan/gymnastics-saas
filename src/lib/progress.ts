// Shared (client + server) helpers for skill progress.
export type SkillStatus = 'not_started' | 'working' | 'mastered';

export const statusLabel: Record<SkillStatus, string> = {
	not_started: 'Not started',
	working: 'Working on',
	mastered: 'Mastered'
};

export const statusOrder: SkillStatus[] = ['not_started', 'working', 'mastered'];

export function nextStatus(s: SkillStatus): SkillStatus {
	return statusOrder[(statusOrder.indexOf(s) + 1) % statusOrder.length];
}

export type LevelProgress = {
	total: number;
	mastered: number;
	working: number;
	percent: number;
	complete: boolean;
};

export function summarize(statuses: SkillStatus[]): LevelProgress {
	const total = statuses.length;
	const mastered = statuses.filter((s) => s === 'mastered').length;
	const working = statuses.filter((s) => s === 'working').length;
	return {
		total,
		mastered,
		working,
		percent: total ? Math.round((mastered / total) * 100) : 0,
		complete: total > 0 && mastered === total
	};
}

export const isStatus = (v: unknown): v is SkillStatus =>
	typeof v === 'string' && (statusOrder as string[]).includes(v);
