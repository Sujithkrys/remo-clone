import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GENERATED_DIR = path.join(__dirname, "..", "generated");

const DEFAULT_FPS = 30;
// 720p rather than 1080p: full-HD roughly doubles per-frame memory (pixel
// count, JPEG intermediate size, canvas buffers) over 720p for a container
// capped at 1GB. Callers that explicitly need 1080p can still ask for it via
// width/height -- this only affects requests that don't specify one.
const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 720;

// A broken or maliciously-crafted composition (an infinite loop in a render
// hook, for example) must not be able to hang the server indefinitely --
// this is the hard backstop on top of the static code scan. Genuinely
// sophisticated per-frame canvas drawing (particle systems, procedural
// effects) is real CPU work multiplied across every frame, not something to
// rush -- 10 minutes gives that room without being unbounded.
const RENDER_TIMEOUT_MS = 10 * 60 * 1000;

export interface CustomRenderSpec {
	code: string;
	durationInFrames: number;
	fps?: number;
	width?: number;
	height?: number;
}

function buildEntryFile(): string {
	return `import { registerRoot, Composition } from "remotion";
import GeneratedVideo, { durationInFrames, fps, width, height } from "./Composition";

registerRoot(() => (
	<Composition
		id="generated"
		component={GeneratedVideo}
		durationInFrames={durationInFrames}
		fps={fps}
		width={width}
		height={height}
	/>
));
`;
}

function buildCompositionFile(spec: CustomRenderSpec): string {
	const fps = spec.fps ?? DEFAULT_FPS;
	const width = spec.width ?? DEFAULT_WIDTH;
	const height = spec.height ?? DEFAULT_HEIGHT;
	// Appending these as named exports (rather than having Claude declare them
	// itself) keeps the numbers as data the render service controls, not text
	// generated code could get wrong or omit.
	return `${spec.code}
export const durationInFrames = ${Math.round(spec.durationInFrames)};
export const fps = ${fps};
export const width = ${width};
export const height = ${height};
`;
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
	let timeoutHandle: NodeJS.Timeout;
	const timeout = new Promise<never>((_, reject) => {
		timeoutHandle = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
	});
	try {
		return await Promise.race([promise, timeout]);
	} finally {
		clearTimeout(timeoutHandle!);
	}
}

export async function renderCustomComposition(
	spec: CustomRenderSpec,
	outputPath: string,
	onProgress: (progress: number) => void,
): Promise<void> {
	const jobDir = path.join(GENERATED_DIR, path.basename(outputPath, ".mp4"));
	await mkdir(jobDir, { recursive: true });
	const entryPath = path.join(jobDir, "entry.tsx");
	const compositionPath = path.join(jobDir, "Composition.tsx");

	try {
		await writeFile(compositionPath, buildCompositionFile(spec), "utf-8");
		await writeFile(entryPath, buildEntryFile(), "utf-8");

		// Unlike the fixed template bundle (built once at startup and reused),
		// this content changes every request, so it must be bundled fresh each
		// time -- the cost Claude's own "attach Remotion" experience also pays,
		// which is why a custom render takes noticeably longer than picking a
		// pre-bundled template. Railway's container has a hard 1GB memory
		// limit; sourcemaps, minification, and persistent caching are all
		// memory-heavy webpack steps that buy nothing for a one-off internal
		// bundle nobody debugs from source or rebuilds twice, so they're
		// stripped here to keep bundling from OOM-killing the process.
		const serveUrl = await withTimeout(
			bundle({
				entryPoint: entryPath,
				webpackOverride: (config) => ({
					...config,
					devtool: false,
					cache: false,
					optimization: {
						...config.optimization,
						minimize: false,
					},
				}),
			}),
			60_000,
			"Bundling",
		);

		const composition = await withTimeout(
			selectComposition({ serveUrl, id: "generated" }),
			30_000,
			"Composition selection",
		);

		await withTimeout(
			renderMedia({
				composition,
				serveUrl,
				codec: "h264",
				outputLocation: outputPath,
				onProgress: ({ progress }) => onProgress(progress),
				// Lower than the old fixed-template renderer's concurrency: 2 --
				// bundling a fresh webpack build per request already adds memory
				// pressure the old (bundle-once, reuse-forever) path never had, on
				// the same 1GB-limited container that OOM'd under the old setting.
				concurrency: 1,
				// A long, full-HD, visually dense render (e.g. a 15s canvas-heavy
				// piece) OOM-killed ffmpeg mid-encode in production: Remotion
				// normally renders frames while ffmpeg encodes previous ones in
				// parallel for speed, which stacks their peak memory together.
				// Disallowing that makes it fully sequential -- render everything,
				// then encode -- trading render time for a much lower peak, which
				// matches what genuinely ambitious content actually needs here.
				disallowParallelEncoding: true,
				// Explicit JPEG (smaller intermediate frames than PNG) at a
				// moderate quality, rather than relying on Remotion's own default,
				// to keep the same memory-vs-quality tradeoff visible and tunable
				// in one place if this container's limit is hit again.
				imageFormat: "jpeg",
				jpegQuality: 80,
				ffmpegOverride: ({ type, args }) => {
					if (type !== "stitcher") return args;
					const output = args[args.length - 1];
					return [...args.slice(0, -1), "-threads", "2", output];
				},
			}),
			RENDER_TIMEOUT_MS,
			"Render",
		);
	} finally {
		await rm(jobDir, { recursive: true, force: true }).catch(() => undefined);
	}
}
