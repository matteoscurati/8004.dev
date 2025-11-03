import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		extensions: ['.js', '.ts', '.json']
	},
	optimizeDeps: {
		include: ['agent0-sdk']
	},
	ssr: {
		noExternal: ['agent0-sdk']
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		globals: true,
		environment: 'happy-dom',
		setupFiles: ['./src/tests/setup.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html', 'lcov'],
			include: ['src/**/*.{js,ts,svelte}'],
			exclude: [
				'src/**/*.{test,spec}.{js,ts}',
				'src/tests/**',
				'src/app.d.ts',
				'src/lib/index.ts'
			],
			all: true,
			lines: 100,
			functions: 100,
			branches: 100,
			statements: 100
		}
	}
});
