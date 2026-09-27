export type JobStatus = "pending" | "rendering" | "done" | "error";

export interface Job {
	id: string;
	status: JobStatus;
	progress: number;
	outputPath?: string;
	error?: string;
	createdAt: number;
}

// In-memory is deliberate for Phase 1 ("get one hardcoded spec rendering
// successfully before wiring anything else up") — a single Railway instance
// with no restarts between a render's start and its poll is a fine starting
// point. Swapping this for a real store (Redis/DB) is a contained change
// later once multiple instances or restarts during a render are a concern.
const jobs = new Map<string, Job>();

export function createJob(id: string): Job {
	const job: Job = { id, status: "pending", progress: 0, createdAt: Date.now() };
	jobs.set(id, job);
	return job;
}

export function getJob(id: string): Job | undefined {
	return jobs.get(id);
}

export function updateJob(id: string, patch: Partial<Job>): void {
	const job = jobs.get(id);
	if (!job) return;
	Object.assign(job, patch);
}
