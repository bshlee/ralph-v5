import type BetterSqlite3 from "better-sqlite3";

const SEED_CONTEXTS = [
	{
		number: 1,
		title: "Founder - AI Infrastructure",
		summary:
			"You think in systems, not features. Your default mode is asking 'what's the architecture?' before 'what's the UI?' You've spent years building developer tools and infrastructure, and it shows in how you communicate — precise, opinionated, allergic to hand-waving. You lead with conviction but update fast when evidence says otherwise.",
		what_makes_this_you:
			"You don't just build products — you build the systems that make products possible. Your instinct is always to go one layer deeper than anyone expects, and that depth is what makes your perspective rare.",
		full_context_block:
			"I'm a technical founder building AI infrastructure. I think in systems architecture first — when I see a product, I see the data flows, the failure modes, the scaling constraints. I've spent years in developer tools, so I instinctively write for a technical audience: precise language, concrete examples, no filler. I'm opinionated but not rigid — I'll defend a position strongly until someone shows me data that says I'm wrong, then I'll pivot without ego. I communicate with high information density and expect the same back. I value directness over diplomacy, substance over polish. When I write, I tend toward structured thinking: numbered points, clear tradeoffs, explicit assumptions. I'm allergic to vague corporate language and marketing-speak. My natural tone is confident but curious — I state things clearly while leaving room for what I don't know yet.",
		dimensions_json: JSON.stringify([
			{
				name: "Technical Depth",
				evidence: "Systems architecture thinking, infrastructure focus",
			},
			{
				name: "Communication Style",
				evidence: "High density, precise, structured, anti-hand-waving",
			},
			{
				name: "Decision Making",
				evidence: "Conviction + fast updating on evidence",
			},
		]),
		key_signals_json: JSON.stringify([
			"Thinks in systems and architecture before features",
			"High information density writing style",
			"Opinionated but updates fast on evidence",
			"Allergic to vague language and marketing-speak",
		]),
		status: "complete",
	},
	{
		number: 2,
		title: "Traveler - Authentic Local",
		summary:
			"You travel to inhabit places, not visit them. Your trip planning starts with 'where do locals actually eat?' and ends three hours deep in a food blog from 2019. You'd rather have one perfect meal in a side street than ten Instagram spots. When you write about places, you write about feeling and texture, not itineraries.",
		what_makes_this_you:
			"You don't collect destinations — you collect the feeling of belonging somewhere you've never been. That instinct to seek the real version of a place, not the curated one, shapes everything about how you experience the world.",
		full_context_block:
			"I travel to feel like a local, not a tourist. My planning process is obsessive but specific — I'll spend hours finding the one bakery a neighborhood actually goes to, but I won't book a single museum ticket. I care about texture: the sound of a street at 7am, how the light hits a café at lunch, whether the menu is handwritten. I write about places the way you'd describe them to a close friend — sensory, specific, honest about what disappointed me and what took my breath away. I avoid superlatives and generic praise. I'd rather say 'the bread had a crust that crackled like it meant it' than 'amazing bakery, must visit!' I plan trips around meals and neighborhoods, not landmarks. I value serendipity but create conditions for it — staying in residential areas, walking without maps, eating where there's no English menu. My travel writing is personal and opinionated, grounded in specific moments rather than recommendations.",
		dimensions_json: JSON.stringify([
			{
				name: "Travel Philosophy",
				evidence: "Local immersion over tourism, texture over itinerary",
			},
			{
				name: "Writing Voice",
				evidence: "Sensory, specific, personal, anti-superlative",
			},
			{
				name: "Planning Style",
				evidence:
					"Deep research for authentic spots, no structured itineraries",
			},
		]),
		key_signals_json: JSON.stringify([
			"Prioritizes local authenticity over tourist experiences",
			"Sensory and specific writing about places",
			"Plans around meals and neighborhoods, not landmarks",
			"Values serendipity through intentional positioning",
		]),
		status: "complete",
	},
];

export function seedContexts(database: BetterSqlite3.Database): void {
	const count = database
		.prepare("SELECT COUNT(*) as count FROM contexts")
		.get() as { count: number };

	if (count.count > 0) return;

	// Don't seed if onboarding was completed — real users create their own contexts
	const onboarded = database
		.prepare("SELECT value FROM settings WHERE key = 'onboarding_completed'")
		.get() as { value: string } | undefined;

	if (onboarded?.value === "true") return;

	const insert = database.prepare(`
		INSERT INTO contexts (number, title, summary, what_makes_this_you, full_context_block, dimensions_json, key_signals_json, status)
		VALUES (@number, @title, @summary, @what_makes_this_you, @full_context_block, @dimensions_json, @key_signals_json, @status)
	`);

	const insertMany = database.transaction((contexts: typeof SEED_CONTEXTS) => {
		for (const ctx of contexts) {
			insert.run(ctx);
		}
	});

	insertMany(SEED_CONTEXTS);
}
