import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { DISPLAY } from "../fonts";
import { Icon } from "./icons";
import type { IconCalloutProps } from "./types";

export const ICON_CALLOUT_DEFAULT_DURATION = 75;

export function IconCallout({
	icon,
	text,
	subtext,
	color = "#FF4F2E",
	backgroundColor = "#0A0A0F",
}: IconCalloutProps) {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const badgeProgress = spring({
		frame,
		fps,
		config: { damping: 12, stiffness: 180, mass: 0.8 },
	});
	const badgeScale = interpolate(badgeProgress, [0, 1], [0, 1]);
	const badgeOpacity = interpolate(frame, [0, 6], [0, 1], { extrapolateRight: "clamp" });

	const textProgress = spring({
		frame: frame - 14,
		fps,
		config: { damping: 200 },
	});
	const textOpacity = interpolate(textProgress, [0, 1], [0, 1]);
	const textY = interpolate(textProgress, [0, 1], [24, 0]);

	const subtextProgress = spring({
		frame: frame - 24,
		fps,
		config: { damping: 200 },
	});

	return (
		<AbsoluteFill
			style={{
				backgroundColor,
				alignItems: "center",
				justifyContent: "center",
				flexDirection: "column",
				gap: 40,
			}}
		>
			<div
				style={{
					width: 220,
					height: 220,
					borderRadius: "50%",
					backgroundColor: color,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					opacity: badgeOpacity,
					transform: `scale(${badgeScale})`,
					boxShadow: `0 0 80px ${color}55`,
				}}
			>
				<Icon name={icon} color="#0A0A0F" size={110} strokeWidth={2} />
			</div>
			<div
				style={{
					fontFamily: DISPLAY,
					fontWeight: 700,
					fontSize: 64,
					color: "#ffffff",
					textAlign: "center",
					opacity: textOpacity,
					transform: `translateY(${textY}px)`,
					maxWidth: "70%",
				}}
			>
				{text}
			</div>
			{subtext ? (
				<div
					style={{
						fontFamily: DISPLAY,
						fontWeight: 500,
						fontSize: 32,
						color: "#ffffff",
						textAlign: "center",
						opacity: interpolate(subtextProgress, [0, 1], [0, 0.7]),
						maxWidth: "60%",
					}}
				>
					{subtext}
				</div>
			) : null}
		</AbsoluteFill>
	);
}
