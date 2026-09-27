import type { FC } from "react";
import { AbsoluteFill, Sequence } from "remotion";
import {
	BEFORE_AFTER_SPLIT_DEFAULT_DURATION,
	BeforeAfterSplit,
} from "./BeforeAfterSplit";
import {
	CHART_ANIMATION_DEFAULT_DURATION,
	ChartAnimation,
} from "./ChartAnimation";
import { ICON_CALLOUT_DEFAULT_DURATION, IconCallout } from "./IconCallout";
import { TEXT_REVEAL_DEFAULT_DURATION, TextReveal } from "./TextReveal";
import type { MotionGraphicSpec, Scene, TemplateName } from "./types";

const TEMPLATE_DEFAULT_DURATIONS: Record<TemplateName, number> = {
	textReveal: TEXT_REVEAL_DEFAULT_DURATION,
	iconCallout: ICON_CALLOUT_DEFAULT_DURATION,
	chartAnimation: CHART_ANIMATION_DEFAULT_DURATION,
	beforeAfterSplit: BEFORE_AFTER_SPLIT_DEFAULT_DURATION,
};

export function getSceneDuration(scene: Scene): number {
	return scene.props.durationInFrames ?? TEMPLATE_DEFAULT_DURATIONS[scene.template];
}

export function getSpecDuration(scenes: Scene[]): number {
	return scenes.reduce((total, scene) => total + getSceneDuration(scene), 0);
}

function SceneContent({ scene }: { scene: Scene }) {
	switch (scene.template) {
		case "textReveal":
			return <TextReveal {...scene.props} />;
		case "iconCallout":
			return <IconCallout {...scene.props} />;
		case "chartAnimation":
			return <ChartAnimation {...scene.props} />;
		case "beforeAfterSplit":
			return <BeforeAfterSplit {...scene.props} />;
	}
}

/**
 * Renders a full spec as one video: each scene plays back to back, in order,
 * for its own duration (per-template default when the scene doesn't set
 * `durationInFrames`). This is the actual "spec -> video" entry point the
 * render service and, later, the MCP tools target — individual template
 * compositions stay registered separately for standalone preview/testing.
 */
export const MotionGraphic: FC<MotionGraphicSpec> = ({ scenes }) => {
	let from = 0;
	return (
		<AbsoluteFill>
			{scenes.map((scene, index) => {
				const duration = getSceneDuration(scene);
				const start = from;
				from += duration;
				return (
					<Sequence key={index} from={start} durationInFrames={duration}>
						<SceneContent scene={scene} />
					</Sequence>
				);
			})}
		</AbsoluteFill>
	);
};
