// Shared spec types for the reusable Remotion templates. This is the single
// source of truth both the render-service API and (later) the MCP tools /
// editor use to describe a motion graphic — templates are pure functions of
// these props, never generated one-off code, so a spec can always be
// re-rendered deterministically and edited as structured data.

export type TemplateName =
	| "textReveal"
	| "iconCallout"
	| "chartAnimation"
	| "beforeAfterSplit";

export interface TextRevealProps {
	text: string;
	subtext?: string;
	color?: string;
	backgroundColor?: string;
	/** Total scene length; defaults to a sensible value per template if omitted. */
	durationInFrames?: number;
}

export type IconName =
	| "check"
	| "star"
	| "warning"
	| "arrowRight"
	| "heart"
	| "bolt"
	| "info";

export interface IconCalloutProps {
	icon: IconName;
	text: string;
	subtext?: string;
	color?: string;
	backgroundColor?: string;
	durationInFrames?: number;
}

export interface ChartDataPoint {
	label: string;
	value: number;
}

export interface ChartAnimationProps {
	title?: string;
	data: ChartDataPoint[];
	color?: string;
	backgroundColor?: string;
	/** Appended after each animated value, e.g. "%" or "k". */
	unit?: string;
	durationInFrames?: number;
}

export interface BeforeAfterSplitProps {
	beforeLabel: string;
	afterLabel: string;
	beforeColor?: string;
	afterColor?: string;
	textColor?: string;
	durationInFrames?: number;
}

export interface TemplatePropsMap {
	textReveal: TextRevealProps;
	iconCallout: IconCalloutProps;
	chartAnimation: ChartAnimationProps;
	beforeAfterSplit: BeforeAfterSplitProps;
}

/** One scene in a multi-scene spec (Phase 2). Kept here since templates define the shape. */
export interface Scene<T extends TemplateName = TemplateName> {
	template: T;
	props: TemplatePropsMap[T];
}

export interface MotionGraphicSpec {
	scenes: Scene[];
	fps?: number;
	width?: number;
	height?: number;
}

export const DEFAULT_FPS = 30;
export const DEFAULT_WIDTH = 1920;
export const DEFAULT_HEIGHT = 1080;
