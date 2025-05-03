import type { Config } from 'tailwindcss';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		extend: {
			colors: {
				primary: '#ea9f08'
			}
		}
	},

	plugins: []
} satisfies Config;
