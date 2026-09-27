import { loadFont as loadDisplay } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

export const DISPLAY = loadDisplay("normal", {
  weights: ["500", "700"],
  subsets: ["latin"],
}).fontFamily;

export const MONO = loadMono("normal", {
  weights: ["400", "700"],
  subsets: ["latin"],
}).fontFamily;
