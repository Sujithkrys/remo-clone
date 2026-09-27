import {
	AbsoluteFill,
	interpolate,
	spring,
	useCurrentFrame,
	useVideoConfig,
} from "remotion";
import { DISPLAY } from "../fonts";
import type { TextRevealProps } from "./types";

export const TEXT_REVEAL_DEFAULT_DURATION = 90;

export function TextReveal({
	text,
	subtext,
	color = "#ffffff",
	backgroundColor = "#0A0A0F",
}: TextRevealProps) {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const words = text.split(" ");

	// Each word gets its own staggered spring so longer headlines still read
	// as one deliberate motion instead of popping in all at once.
	const staggerFrames = 4;

	return (
		<AbsoluteFill
			style={{
				backgroundColor,
				alignItems: "center",
				justifyContent: "center",
				padding: 120,
			}}
		>
			<div
				style={{
					display: "flex",
					flexWrap: "wrap",
					justifyContent: "center",
					gap: "0 24px",
					fontFamily: DISPLAY,
					fontWeight: 700,
					fontSize: 96,
					color,
					textAlign: "center",
					lineHeight: 1.15,
				}}
			>
				{words.map((word, i) => {
					const delay = i * staggerFrames;
					const progress = spring({
						frame: frame - delay,
						fps,
						config: { damping: 200, stiffness: 200, mass: 0.6 },
					});
					const opacity = interpolate(progress, [0, 1], [0, 1]);
					const translateY = interpolate(progress, [0, 1], [40, 0]);
					return (
						<span
							key={`${word}-${i}`}
							style={{
								display: "inline-block",
								opacity,
								transform: `translateY(${translateY}px)`,
							}}
						>
							{word}
						</span>
					);
				})}
			</div>
			{subtext ? (
				<SubText text={subtext} color={color} startFrame={words.length * staggerFrames + 10} />
			) : null}
		</AbsoluteFill>
	);
}

function SubText({
	text,
	color,
	startFrame,
}: {
	text: string;
	color: string;
	startFrame: number;
}) {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const progress = spring({
		frame: frame - startFrame,
		fps,
		config: { damping: 200 },
	});
	return (
		<div
			style={{
				marginTop: 32,
				fontFamily: DISPLAY,
				fontWeight: 500,
				fontSize: 36,
				color,
				opacity: interpolate(progress, [0, 1], [0, 0.75]),
				textAlign: "center",
			}}
		>
			{text}
		</div>
	);
}
