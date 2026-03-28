import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import electron from "vite-plugin-electron/simple";

export default defineConfig({
	plugins: [
		react(),
		tailwindcss(),
		electron({
			main: {
				entry: "electron/main.ts",
				vite: {
					build: {
						rollupOptions: {
							external: ["keytar", "better-sqlite3"],
						},
					},
				},
			},
			preload: {
				input: "electron/preload.ts",
			},
		}),
	],
	resolve: {
		alias: {
			"@": resolve(__dirname, "src"),
		},
	},
});
