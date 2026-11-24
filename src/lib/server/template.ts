/**
 * Starter curriculum seeded into every new gym. Gyms can freely edit,
 * reorder, add or delete any of it afterwards.
 */
export const starterEvents = ['Floor', 'Beam', 'Bars', 'Vault'] as const;

type Event = (typeof starterEvents)[number];

export const starterLevels: { name: string; skills: Partial<Record<Event, string[]>> }[] = [
	{
		name: 'Level 1',
		skills: {
			Floor: ['Forward roll', 'Backward roll', 'Cartwheel', 'Bridge'],
			Beam: ['Forward walk', 'Relevé walk', 'Straight jump dismount'],
			Bars: ['Front support', 'Pullover', 'Cast'],
			Vault: ['Run and hurdle', 'Straight jump onto mats']
		}
	},
	{
		name: 'Level 2',
		skills: {
			Floor: ['Handstand (2s hold)', 'Round-off', 'Backward roll to push-up'],
			Beam: ['Half turn on toes', 'Stretch jump', 'Cartwheel on low beam'],
			Bars: ['Back hip circle', 'Squat-on', 'Cast to horizontal'],
			Vault: ['Handstand flat-back']
		}
	},
	{
		name: 'Level 3',
		skills: {
			Floor: ['Back walkover', 'Front walkover', 'Round-off rebound'],
			Beam: ['Split leap', 'Handstand on beam', 'Cartwheel dismount'],
			Bars: ['Glide swing', 'Underswing dismount', 'Mill circle'],
			Vault: ['Front handspring onto mats']
		}
	},
	{
		name: 'Level 4',
		skills: {
			Floor: ['Back handspring', 'Round-off back handspring', 'Front handspring'],
			Beam: ['Cartwheel on high beam', 'Back walkover on beam', 'Full turn'],
			Bars: ['Kip', 'Clear hip circle', 'Squat-on to long hang kip'],
			Vault: ['Front handspring vault']
		}
	},
	{
		name: 'Level 5',
		skills: {
			Floor: ['Back tuck', 'Round-off back handspring back tuck', 'Front tuck'],
			Beam: ['Back handspring on beam', 'Split jump', 'Round-off dismount'],
			Bars: ['Cast to handstand', 'Flyaway', 'Giant (strapped)'],
			Vault: ['Yurchenko timer']
		}
	}
];
