import { describe, expect, it } from "vitest";
import {
	DB_FILE_NAME,
	GLOBAL_SHORTCUT,
	INTERVIEW_FOLLOW_UP_COUNT,
	OPENAI_MODEL_GENERATION,
	OPENAI_MODEL_INTERVIEW,
	OPENAI_MODEL_SYNTHESIS,
} from "../../electron/constants";

describe("scaffold", () => {
	it("constants match PRD spec", () => {
		expect(GLOBAL_SHORTCUT).toBe("CommandOrControl+Shift+8");
		expect(INTERVIEW_FOLLOW_UP_COUNT).toBe(5);
		expect(OPENAI_MODEL_INTERVIEW).toBe("gpt-4o-mini");
		expect(OPENAI_MODEL_SYNTHESIS).toBe("gpt-4o");
		expect(OPENAI_MODEL_GENERATION).toBe("gpt-4o-mini");
		expect(DB_FILE_NAME).toBe("your-star.db");
	});
});
