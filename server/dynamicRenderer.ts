import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GENERATED_DIR = path.join(__dirname, "..", "generated");

const DEFAULT_FPS = 30;
const DEFAULT_WIDTH = 1920;
const DEFAULT_HEIGHT = 1080;

// A broken or maliciously-crafted composition (an infinite loop in a render
// hook, for example) must not be able to hang the server indefinitely --
// this is the hard backstop on top of the static code scan.
const RENDER_TIMEOUT_MS = 3 * 60 * 1000;

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
		// pre-bundled template.
		const serveUrl = await withTimeout(bundle({ entryPoint: entryPath }), 60_000, "Bundling");

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
				concurrency: 2,
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
