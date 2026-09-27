import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { DISPLAY, MONO } from "../fonts";
import type { ChartAnimationProps } from "./types";

export const CHART_ANIMATION_DEFAULT_DURATION = 100;

const MAX_BAR_HEIGHT = 480;
const BAR_WIDTH = 140;
const BAR_GAP = 56;

export function ChartAnimation({
	title,
	data,
	color = "#2F4BFF",
	backgroundColor = "#0A0A0F",
	unit = "",
}: ChartAnimationProps) {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const maxValue = Math.max(...data.map((d) => d.value), 1);
	const totalWidth = data.length * BAR_WIDTH + (data.length - 1) * BAR_GAP;

	const titleProgress = spring({ frame, fps, config: { damping: 200 } });

	return (
		<AbsoluteFill
			style={{
				backgroundColor,
				alignItems: "center",
				justifyContent: "center",
				flexDirection: "column",
				gap: 56,
			}}
		>
			{title ? (
				<div
					style={{
						fontFamily: DISPLAY,
						fontWeight: 700,
						fontSize: 56,
						color: "#ffffff",
						opacity: interpolate(titleProgress, [0, 1], [0, 1]),
					}}
				>
					{title}
				</div>
			) : null}
			<div
				style={{
					display: "flex",
					alignItems: "flex-end",
					gap: BAR_GAP,
					width: totalWidth,
					height: MAX_BAR_HEIGHT,
				}}
			>
				{data.map((point, i) => (
					<Bar
						key={`${point.label}-${i}`}
						point={point}
						maxValue={maxValue}
						color={color}
						unit={unit}
						delay={20 + i * 6}
					/>
				))}
			</div>
		</AbsoluteFill>
	);
}

function Bar({
	point,
	maxValue,
	color,
	unit,
	delay,
}: {
	point: { label: string; value: number };
	maxValue: number;
	color: string;
	unit: string;
	delay: number;
}) {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const progress = spring({
		frame: frame - delay,
		fps,
		config: { damping: 200, stiffness: 120 },
	});
	const heightPx = interpolate(progress, [0, 1], [0, (point.value / maxValue) * MAX_BAR_HEIGHT], {
		extrapolateRight: "clamp",
	});
	const displayedValue = Math.round(
		interpolate(progress, [0, 1], [0, point.value], { extrapolateRight: "clamp" }),
	);

	return (
		<div
			style={{
				width: BAR_WIDTH,
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "flex-end",
				height: MAX_BAR_HEIGHT,
			}}
		>
			<div
				style={{
					fontFamily: MONO,
					fontSize: 28,
					color: "#ffffff",
					marginBottom: 12,
					opacity: interpolate(progress, [0, 0.2], [0, 1], { extrapolateRight: "clamp" }),
				}}
			>
				{displayedValue}
				{unit}
			</div>
			<div
				style={{
					width: "100%",
					height: heightPx,
					backgroundColor: color,
					borderRadius: "8px 8px 0 0",
				}}
			/>
			<div
				style={{
					fontFamily: DISPLAY,
					fontSize: 26,
					color: "#ffffff",
					opacity: 0.7,
					marginTop: 16,
				}}
			>
				{point.label}
			</div>
		</div>
	);
}
