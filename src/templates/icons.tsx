import type { IconName } from "./types";

// Inline SVG paths, not emoji or an icon font: headless Chromium on a
// minimal Linux Docker image (Railway's target) commonly has no color-emoji
// font installed at all, so glyphs that render fine on a Windows dev machine
// can come out blank in the actual rendered video. Self-contained vector
// paths render identically everywhere Chromium runs.
const ICON_PATHS: Record<IconName, string> = {
	check: "M20 6L9 17l-5-5",
	star: "M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z",
	warning:
		"M12 2L1 21h22L12 2zM12 9v5m0 3.5h.01",
	arrowRight: "M4 12h16m-6-6l6 6-6 6",
	heart:
		"M12 21s-6.7-4.35-9.5-8.36C.8 9.9 1.6 6 5 4.7 7.2 3.85 9.6 4.7 12 7.5c2.4-2.8 4.8-3.65 7-2.8 3.4 1.3 4.2 5.2 2.5 7.94C18.7 16.65 12 21 12 21z",
	bolt: "M13 2L3 14h7l-1 8 11-14h-7l1-6z",
	info: "M12 2a10 10 0 100 20 10 10 0 000-20zm0 6v6m0 4h.01",
};

export function Icon({
	name,
	color = "#ffffff",
	size = 120,
	strokeWidth = 1.6,
}: {
	name: IconName;
	color?: string;
	size?: number;
	strokeWidth?: number;
}) {
	const filled = name === "star" || name === "heart";
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill={filled ? color : "none"}
			stroke={color}
			strokeWidth={strokeWidth}
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d={ICON_PATHS[name]} />
		</svg>
	);
}
