/** Only allow same-site relative redirects. */
export function safeNext(next: string | null | undefined, fallback = '/app') {
	if (!next || !next.startsWith('/') || next.startsWith('//')) return fallback;
	return next;
}

export function str(form: FormData, key: string) {
	return (form.get(key)?.toString() ?? '').trim();
}
