// Tiny global toast queue (client-only; toasts are never rendered during SSR).
export type Toast = { id: number; message: string; kind: 'success' | 'error' };

let nextId = 1;
export const toasts = $state<Toast[]>([]);

export function dismiss(id: number) {
	const i = toasts.findIndex((t) => t.id === id);
	if (i >= 0) toasts.splice(i, 1);
}

export function toast(message: string, kind: Toast['kind'] = 'success') {
	const id = nextId++;
	toasts.push({ id, message, kind });
	if (toasts.length > 3) toasts.shift();
	setTimeout(() => dismiss(id), kind === 'error' ? 5000 : 2500);
}
