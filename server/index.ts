import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import { nanoid } from "nanoid";
import { validateGeneratedCode } from "./codeValidation";
import { type CustomRenderSpec, renderCustomComposition } from "./dynamicRenderer";
import { createJob, getJob, updateJob } from "./jobs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "out");
mkdirSync(OUT_DIR, { recursive: true });

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
	res.json({ ok: true, mode: "custom-code" });
});

app.post("/render", (req, res) => {
	// The request body is a Claude-authored Remotion component (`code`) plus
	// the timing/dimensions the render service controls -- there's no more
	// fixed-template system. Claude writes real Remotion code the same way it
	// would in a chat session with Remotion "attached"; this server's only job
	// is to validate, bundle, and render it safely.
	const body = req.body as Partial<CustomRenderSpec>;

	if (typeof body.code !== "string") {
		res.status(400).json({ error: "Missing required field: code" });
		return;
	}
	if (typeof body.durationInFrames !== "number" || body.durationInFrames <= 0) {
		res.status(400).json({ error: "Missing or invalid required field: durationInFrames" });
		return;
	}

	const validation = validateGeneratedCode(body.code);
	if (!validation.valid) {
		res.status(400).json({ error: `Rejected code: ${validation.reason}` });
		return;
	}

	const spec: CustomRenderSpec = {
		code: body.code,
		durationInFrames: body.durationInFrames,
		fps: body.fps,
		width: body.width,
		height: body.height,
	};

	const jobId = nanoid();
	createJob(jobId);
	res.status(202).json({ jobId });

	// Rendering runs after the response is sent — the caller polls status
	// instead of holding a connection open for however long a render takes.
	const outputPath = path.join(OUT_DIR, `${jobId}.mp4`);
	updateJob(jobId, { status: "rendering" });
	renderCustomComposition(spec, outputPath, (progress) => {
		updateJob(jobId, { progress });
	})
		.then(() => {
			updateJob(jobId, { status: "done", progress: 1, outputPath });
		})
		.catch((error: unknown) => {
			updateJob(jobId, {
				status: "error",
				error: error instanceof Error ? error.message : String(error),
			});
		});
});

app.get("/render/:id/status", (req, res) => {
	const job = getJob(req.params.id);
	if (!job) {
		res.status(404).json({ error: "Job not found" });
		return;
	}
	res.json({ status: job.status, progress: job.progress, error: job.error });
});

app.get("/render/:id/result", (req, res) => {
	const job = getJob(req.params.id);
	if (!job) {
		res.status(404).json({ error: "Job not found" });
		return;
	}
	if (job.status !== "done" || !job.outputPath) {
		res.status(409).json({ error: `Render is not finished (status: ${job.status})` });
		return;
	}
	res.sendFile(job.outputPath);
});

const PORT = Number(process.env.PORT) || 3001;

console.log("remo-clone render service booting...");

// Listening immediately (rather than waiting on warmUp()) matters because
// platforms like Railway proxy traffic to whatever's on this port right
// away and expect it to open fast — if bundling the Remotion project were
// slow on a constrained instance, every request would 502 with zero logs
// until it finished, indistinguishable from a hung process.
app.listen(PORT, () => {
	console.log(`remo-clone render service listening on port ${PORT}`);
});
