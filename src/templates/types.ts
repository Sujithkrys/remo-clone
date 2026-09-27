// Shared spec types for the reusable Remotion templates. This is the single
// source of truth both the render-service API and (later) the MCP tools /
// editor use to describe a motion graphic — templates are pure functions of
// these props, never generated one-off code, so a spec can always be
// re-rendered deterministically and edited as structured data.
//
// Types here are derived from the Zod schemas in `schema.ts` (via z.infer)
// rather than hand-duplicated, so validation and typing can never drift.

import type { z } from "zod";
import type {
	beforeAfterSplitPropsSchema,
	chartAnimationPropsSchema,
	chartDataPointSchema,
	iconCalloutPropsSchema,
	iconNameSchema,
	motionGraphicSpecSchema,
	sceneSchema,
	textRevealPropsSchema,
} from "./schema";

export const TEMPLATE_NAMES = [
	"textReveal",
	"iconCallout",
	"chartAnimation",
	"beforeAfterSplit",
] as const;

export type TemplateName = (typeof TEMPLATE_NAMES)[number];

export type IconName = z.infer<typeof iconNameSchema>;
export type TextRevealProps = z.infer<typeof textRevealPropsSchema>;
export type IconCalloutProps = z.infer<typeof iconCalloutPropsSchema>;
export type ChartDataPoint = z.infer<typeof chartDataPointSchema>;
export type ChartAnimationProps = z.infer<typeof chartAnimationPropsSchema>;
export type BeforeAfterSplitProps = z.infer<typeof beforeAfterSplitPropsSchema>;

export interface TemplatePropsMap {
	textReveal: TextRevealProps;
	iconCallout: IconCalloutProps;
	chartAnimation: ChartAnimationProps;
	beforeAfterSplit: BeforeAfterSplitProps;
}

/** One scene in a multi-scene spec. */
export type Scene = z.infer<typeof sceneSchema>;

export type MotionGraphicSpec = z.infer<typeof motionGraphicSpecSchema>;

export const DEFAULT_FPS = 30;
export const DEFAULT_WIDTH = 1920;
export const DEFAULT_HEIGHT = 1080;
