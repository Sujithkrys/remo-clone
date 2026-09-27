import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { DISPLAY } from "../fonts";
import type { BeforeAfterSplitProps } from "./types";

export const BEFORE_AFTER_SPLIT_DEFAULT_DURATION = 80;

export function BeforeAfterSplit({
	beforeLabel,
	afterLabel,
	beforeColor = "#3a3a3a",
	afterColor = "#2F4BFF",
	textColor = "#ffffff",
}: BeforeAfterSplitProps) {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	// The divider draws down the middle first, then each half's label slides
	// in from its own edge — reads as "here's the line, here's what's on
	// each side of it" rather than everything appearing at once.
	const dividerProgress = spring({ frame, fps, config: { damping: 200, stiffness: 160 } });
	const dividerHeight = interpolate(dividerProgress, [0, 1], [0, 100]);

	const beforeLabelProgress = spring({ frame: frame - 10, fps, config: { damping: 200 } });
	const afterLabelProgress = spring({ frame: frame - 10, fps, config: { damping: 200 } });

	return (
		<AbsoluteFill style={{ flexDirection: "row" }}>
			<Half
				color={beforeColor}
				label={beforeLabel}
				textColor={textColor}
				progress={beforeLabelProgress}
				direction={-1}
			/>
			<Half
				color={afterColor}
				label={afterLabel}
				textColor={textColor}
				progress={afterLabelProgress}
				direction={1}
			/>
			<div
				style={{
					position: "absolute",
					left: "50%",
					top: `${(100 - dividerHeight) / 2}%`,
					height: `${dividerHeight}%`,
					width: 6,
					marginLeft: -3,
					backgroundColor: "#ffffff",
					boxShadow: "0 0 40px rgba(255,255,255,0.6)",
				}}
			/>
		</AbsoluteFill>
	);
}

function Half({
	color,
	label,
	textColor,
	progress,
	direction,
}: {
	color: string;
	label: string;
	textColor: string;
	progress: number;
	direction: -1 | 1;
}) {
	const translateX = interpolate(progress, [0, 1], [60 * direction, 0]);
	const opacity = interpolate(progress, [0, 1], [0, 1]);
	return (
		// A plain flex-item div, not AbsoluteFill: the parent row already lays
		// the two halves out side by side, so `flex: 1` (normal flow) is all
		// that's needed — mixing that with an extra `left` offset (meant for
		// absolutely-positioned elements) pushed the second half fully off
		// the right edge of the frame instead of just sitting at 50%.
		<div
			style={{
				flex: 1,
				display: "flex",
				backgroundColor: color,
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<div
				style={{
					fontFamily: DISPLAY,
					fontWeight: 700,
					fontSize: 56,
					color: textColor,
					textAlign: "center",
					padding: "0 48px",
					opacity,
					transform: `translateX(${translateX}px)`,
				}}
			>
				{label}
			</div>
		</div>
	);
}
