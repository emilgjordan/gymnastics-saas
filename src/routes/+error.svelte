<script lang="ts">
	import { page } from '$app/state';
</script>

<div class="flex min-h-screen items-center justify-center p-6">
	<div class="max-w-md card p-8 text-center">
		<p class="text-5xl font-bold text-indigo-600">{page.status}</p>
		<p class="mt-3 text-slate-700">{page.error?.message ?? 'Something went wrong'}</p>
		<a href="/app" class="mt-6 btn-primary">Go to dashboard</a>
	</div>
</div>
