import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import { nanoid } from "nanoid";
import { createJob, getJob, updateJob } from "./jobs";
import { renderTemplate, warmUp } from "./renderer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "out");
mkdirSync(OUT_DIR, { recursive: true });

const TEMPLATE_NAMES = ["textReveal", "iconCallout", "chartAnimation", "beforeAfterSplit"] as const;
type KnownTemplate = (typeof TEMPLATE_NAMES)[number];

function isKnownTemplate(value: unknown): value is KnownTemplate {
	return typeof value === "string" && (TEMPLATE_NAMES as readonly string[]).includes(value);
}

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
	res.json({ ok: true, templates: TEMPLATE_NAMES });
});

app.post("/render", (req, res) => {
	const { template, props } = req.body ?? {};

	if (!isKnownTemplate(template)) {
		res.status(400).json({ error: `Unknown template. Expected one of: ${TEMPLATE_NAMES.join(", ")}` });
		return;
	}
	if (props !== undefined && (typeof props !== "object" || props === null || Array.isArray(props))) {
		res.status(400).json({ error: "props must be an object" });
		return;
	}

	const jobId = nanoid();
	createJob(jobId);
	res.status(202).json({ jobId });

	// Rendering runs after the response is sent — the caller polls status
	// instead of holding a connection open for however long a render takes.
	const outputPath = path.join(OUT_DIR, `${jobId}.mp4`);
	updateJob(jobId, { status: "rendering" });
	renderTemplate(template, props ?? {}, outputPath, (progress) => {
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

warmUp()
	.then(() => {
		console.log("Remotion bundle warmed up");
	})
	.catch((error) => {
		console.error("Failed to warm up Remotion bundle:", error);
	});
