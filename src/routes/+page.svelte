<script lang="ts">
	import Logo from '$lib/components/Logo.svelte';
	import { APP_NAME } from '$lib';

	const features = [
		{
			t: 'Levels & skills your way',
			d: 'Start from a ready-made curriculum for floor, beam, bars and vault — then rename, reorder and add anything.'
		},
		{
			t: 'Teams & coaches',
			d: 'Organise athletes into teams like Boys Rec, Girls Level 3 or Xcel Gold and assign coaches to each.'
		},
		{
			t: 'One-tap progress',
			d: 'Mark skills as working on or mastered from the gym floor, with optional coach notes.'
		},
		{
			t: 'Ready to level up',
			d: 'See at a glance who has mastered every skill in their level and is ready to move up.'
		},
		{
			t: 'Athlete logins',
			d: 'Gymnasts sign in to see their level, what they are working on and every skill they have mastered.'
		},
		{
			t: 'Progress history',
			d: 'Every change is recorded so you can see recent milestones across the gym.'
		}
	];
</script>

<svelte:head><title>{APP_NAME} — skill tracking for gymnastics clubs</title></svelte:head>

<div class="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white">
	<header class="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
		<Logo />
		<nav class="flex items-center gap-2">
			<a href="/login" class="btn-ghost">Sign in</a>
			<a href="/signup" class="btn-primary">Get started</a>
		</nav>
	</header>

	<main class="mx-auto max-w-6xl px-6">
		<section class="py-20 text-center sm:py-28">
			<p
				class="mb-4 inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700"
			>
				For gymnastics clubs, coaches & athletes
			</p>
			<h1 class="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
				Track every athlete's skills, level by level.
			</h1>
			<p class="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
				{APP_NAME} gives your coaches one place to record what each gymnast is working on and has mastered
				— and lets athletes log in to follow their own progress.
			</p>
			<div class="mt-10 flex justify-center gap-3">
				<a href="/signup" class="btn-primary px-5 py-3 text-base">Create your gym</a>
				<a href="/login" class="btn-secondary px-5 py-3 text-base">I have an account</a>
			</div>
		</section>

		<section class="grid gap-5 pb-24 sm:grid-cols-2 lg:grid-cols-3">
			{#each features as f (f.t)}
				<div class="card p-6">
					<h3 class="font-semibold text-slate-900">{f.t}</h3>
					<p class="mt-2 text-sm text-slate-600">{f.d}</p>
				</div>
			{/each}
		</section>
	</main>

	<footer class="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
		© {new Date().getFullYear()}
		{APP_NAME}
	</footer>
</div>
