import "./index.css";
import { Composition } from "remotion";
import { BEFORE_AFTER_SPLIT_DEFAULT_DURATION, BeforeAfterSplit } from "./templates/BeforeAfterSplit";
import { CHART_ANIMATION_DEFAULT_DURATION, ChartAnimation } from "./templates/ChartAnimation";
import { ICON_CALLOUT_DEFAULT_DURATION, IconCallout } from "./templates/IconCallout";
import { TEXT_REVEAL_DEFAULT_DURATION, TextReveal } from "./templates/TextReveal";
import {
	DEFAULT_FPS,
	DEFAULT_HEIGHT,
	DEFAULT_WIDTH,
	type BeforeAfterSplitProps,
	type ChartAnimationProps,
	type IconCalloutProps,
	type TextRevealProps,
} from "./templates/types";

// Every composition's duration comes from `calculateMetadata`, reading the
// same `durationInFrames` prop the render-service spec sets — so a scene's
// length is data (part of the spec), never something hardcoded per template.
const withPropsDuration = (fallback: number) => ({
	calculateMetadata: async ({
		props,
	}: {
		props: { durationInFrames?: number };
	}) => ({
		durationInFrames: props.durationInFrames ?? fallback,
	}),
});

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Composition<React.FC<TextRevealProps>, TextRevealProps>
				id="textReveal"
				component={TextReveal}
				fps={DEFAULT_FPS}
				width={DEFAULT_WIDTH}
				height={DEFAULT_HEIGHT}
				durationInFrames={TEXT_REVEAL_DEFAULT_DURATION}
				defaultProps={{
					text: "Ship faster with Reco",
					subtext: "AI-native screen recording and editing",
					color: "#ffffff",
					backgroundColor: "#0A0A0F",
				}}
				{...withPropsDuration(TEXT_REVEAL_DEFAULT_DURATION)}
			/>
			<Composition<React.FC<IconCalloutProps>, IconCalloutProps>
				id="iconCallout"
				component={IconCallout}
				fps={DEFAULT_FPS}
				width={DEFAULT_WIDTH}
				height={DEFAULT_HEIGHT}
				durationInFrames={ICON_CALLOUT_DEFAULT_DURATION}
				defaultProps={{
					icon: "check",
					text: "Export fixed",
					subtext: "Recordings now export just like uploads",
					color: "#FF4F2E",
					backgroundColor: "#0A0A0F",
				}}
				{...withPropsDuration(ICON_CALLOUT_DEFAULT_DURATION)}
			/>
			<Composition<React.FC<ChartAnimationProps>, ChartAnimationProps>
				id="chartAnimation"
				component={ChartAnimation}
				fps={DEFAULT_FPS}
				width={DEFAULT_WIDTH}
				height={DEFAULT_HEIGHT}
				durationInFrames={CHART_ANIMATION_DEFAULT_DURATION}
				defaultProps={{
					title: "Weekly exports",
					data: [
						{ label: "Mon", value: 12 },
						{ label: "Tue", value: 18 },
						{ label: "Wed", value: 9 },
						{ label: "Thu", value: 24 },
						{ label: "Fri", value: 31 },
					],
					color: "#2F4BFF",
					backgroundColor: "#0A0A0F",
				}}
				{...withPropsDuration(CHART_ANIMATION_DEFAULT_DURATION)}
			/>
			<Composition<React.FC<BeforeAfterSplitProps>, BeforeAfterSplitProps>
				id="beforeAfterSplit"
				component={BeforeAfterSplit}
				fps={DEFAULT_FPS}
				width={DEFAULT_WIDTH}
				height={DEFAULT_HEIGHT}
				durationInFrames={BEFORE_AFTER_SPLIT_DEFAULT_DURATION}
				defaultProps={{
					beforeLabel: "Manual editing",
					afterLabel: "AI-assisted editing",
					beforeColor: "#3a3a3a",
					afterColor: "#2F4BFF",
					textColor: "#ffffff",
				}}
				{...withPropsDuration(BEFORE_AFTER_SPLIT_DEFAULT_DURATION)}
			/>
		</>
	);
};
