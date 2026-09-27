import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import type { TemplateName } from "../src/templates/types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENTRY_POINT = path.join(__dirname, "..", "src", "index.ts");

// Bundling walks and webpack/rspack-compiles the whole composition tree; at
// ~1-2s it's cheap once, but doing it per request would make every render
// pay that cost. One bundle is reused for the life of the process, exactly
// how Remotion's own server-rendering examples are structured.
let bundleLocationPromise: Promise<string> | null = null;

function getBundleLocation(): Promise<string> {
	bundleLocationPromise ??= bundle({ entryPoint: ENTRY_POINT });
	return bundleLocationPromise;
}

/** Warms the bundle at server startup so the first real request isn't the slow one. */
export async function warmUp(): Promise<void> {
	await getBundleLocation();
}

export interface RenderJobResult {
	outputPath: string;
	durationInFrames: number;
}

export async function renderTemplate(
	template: TemplateName,
	props: Record<string, unknown>,
	outputPath: string,
	onProgress: (progress: number) => void,
): Promise<RenderJobResult> {
	const serveUrl = await getBundleLocation();

	const composition = await selectComposition({
		serveUrl,
		id: template,
		inputProps: props,
	});

	await renderMedia({
		composition,
		serveUrl,
		codec: "h264",
		outputLocation: outputPath,
		inputProps: props,
		onProgress: ({ progress }) => onProgress(progress),
	});

	return { outputPath, durationInFrames: composition.durationInFrames };
}
