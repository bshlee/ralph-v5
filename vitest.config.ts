import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "jsdom",
		include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
	},
	resolve: {
		alias: {
			"@": resolve(__dirname, "src"),
		},
	},
});
