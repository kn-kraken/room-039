import type { Config } from 'tailwindcss';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		extend: {
			colors: {
				graphite: '#3c3c4c',
				sapphire: '#7896cf',
				heather: '#b4a0aa'
			},
			fontFamily: {
				'radikal-wut': ['radikal-wut-bold']
			}
		}
	},

	plugins: []
} satisfies Config;
