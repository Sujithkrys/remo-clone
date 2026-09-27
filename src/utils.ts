import { Easing, interpolate } from "remotion";

export const COLORS = {
  ink: "#0A0A0F",
  paper: "#F3EEE4",
  coral: "#FF4F2E",
  blue: "#2F4BFF",
  lime: "#C8FF2E",
  violet: "#9B5CFF",
};

export const PALETTE = [COLORS.coral, COLORS.blue, COLORS.lime, COLORS.violet];

export const ease = {
  outExpo: Easing.bezier(0.16, 1, 0.3, 1),
  inExpo: Easing.bezier(0.7, 0, 0.84, 0),
  inOutExpo: Easing.bezier(0.87, 0, 0.13, 1),
  inOutCubic: Easing.bezier(0.65, 0, 0.35, 1),
  outBack: Easing.bezier(0.34, 1.56, 0.64, 1),
};

export const tween = (
  frame: number,
  range: [number, number],
  output: [number, number],
  easing: (t: number) => number = ease.outExpo,
) =>
  interpolate(frame, range, output, {
    easing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Radius of a regular polygon (circumradius 1) at a given angle; sides <= 0 means circle.
const polygonRadius = (angle: number, sides: number) => {
  if (sides <= 0) return 1;
  const seg = (2 * Math.PI) / sides;
  const a = ((angle % seg) + seg) % seg;
  return Math.cos(Math.PI / sides) / Math.cos(a - Math.PI / sides);
};

export const morphPath = (
  cx: number,
  cy: number,
  radius: number,
  sidesA: number,
  sidesB: number,
  t: number,
  rotationRad = 0,
  samples = 240,
) => {
  let d = "";
  for (let i = 0; i <= samples; i++) {
    const a = (i / samples) * Math.PI * 2;
    const r = radius * lerp(polygonRadius(a, sidesA), polygonRadius(a, sidesB), t);
    const x = cx + Math.cos(a + rotationRad - Math.PI / 2) * r;
    const y = cy + Math.sin(a + rotationRad - Math.PI / 2) * r;
    d += `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
  }
  return d + "Z";
};

export const roundedRectPath = (x: number, y: number, w: number, h: number, r: number) => {
  const rr = Math.min(r, w / 2, h / 2);
  return `M${x + rr},${y}H${x + w - rr}A${rr},${rr} 0 0 1 ${x + w},${y + rr}V${y + h - rr}A${rr},${rr} 0 0 1 ${x + w - rr},${y + h}H${x + rr}A${rr},${rr} 0 0 1 ${x},${y + h - rr}V${y + rr}A${rr},${rr} 0 0 1 ${x + rr},${y}Z`;
};

export const timecode = (frame: number, fps: number) => {
  const pad = (n: number) => String(Math.floor(n)).padStart(2, "0");
  const totalSeconds = Math.floor(frame / fps);
  return `${pad(totalSeconds / 3600)}:${pad((totalSeconds / 60) % 60)}:${pad(totalSeconds % 60)}:${pad(frame % fps)}`;
};
