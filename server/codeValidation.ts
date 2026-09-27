// Claude writes this code, not an anonymous public user, but it still runs
// through webpack (Node.js, at bundle time) before Remotion ever gets to the
// sandboxed Chromium render step -- so a bundle-time Node.js API is the real
// risk here, not just what happens inside the rendered frame. This is a
// best-effort static scan, not a hard sandbox: it catches the obvious ways
// generated code could reach outside its intended surface (filesystem,
// process, child processes, dynamic code eval, network calls, non-Remotion
// imports), not a guarantee against a deliberately obfuscated payload.

const DISALLOWED_PATTERNS: { pattern: RegExp; reason: string }[] = [
	{ pattern: /\brequire\s*\(/, reason: "require() is not allowed" },
	{ pattern: /\bprocess\s*\./, reason: "process.* is not allowed" },
	{ pattern: /\bchild_process\b/, reason: "child_process is not allowed" },
	{ pattern: /\beval\s*\(/, reason: "eval() is not allowed" },
	{ pattern: /\bnew\s+Function\s*\(/, reason: "new Function() is not allowed" },
	{ pattern: /\bimport\s*\(/, reason: "dynamic import() is not allowed" },
	{ pattern: /\bfetch\s*\(/, reason: "fetch() is not allowed" },
	{ pattern: /\bXMLHttpRequest\b/, reason: "XMLHttpRequest is not allowed" },
	{ pattern: /\bWebSocket\b/, reason: "WebSocket is not allowed" },
	{ pattern: /\b__dirname\b/, reason: "__dirname is not allowed" },
	{ pattern: /\b__filename\b/, reason: "__filename is not allowed" },
];

// Every package the generated component is allowed to import from. Adding a
// new one here means adding it to remo-clone's own package.json first --
// generated code can only reach packages actually installed on this server,
// never install anything of its own.
const ALLOWED_IMPORT_SOURCES = [
	"react",
	"react/jsx-runtime",
	"remotion",
	"@remotion/transitions",
	"@remotion/transitions/fade",
	"@remotion/transitions/slide",
	"@remotion/transitions/wipe",
	"@remotion/transitions/flip",
	"@remotion/transitions/clock-wipe",
	"@remotion/transitions/none",
	"@remotion/shapes",
	"@remotion/animation-utils",
	"@remotion/paths",
	"@remotion/noise",
	"@remotion/motion-blur",
	"@remotion/layout-utils",
	"@remotion/google-fonts",
];

const IMPORT_SOURCE_REGEX = /\bfrom\s+["']([^"']+)["']/g;

export interface CodeValidationResult {
	valid: boolean;
	reason?: string;
}

export function validateGeneratedCode(code: string): CodeValidationResult {
	if (typeof code !== "string" || code.trim().length === 0) {
		return { valid: false, reason: "Code must be a non-empty string" };
	}
	if (code.length > 200_000) {
		return { valid: false, reason: "Code is too large" };
	}

	for (const { pattern, reason } of DISALLOWED_PATTERNS) {
		if (pattern.test(code)) {
			return { valid: false, reason };
		}
	}

	for (const match of code.matchAll(IMPORT_SOURCE_REGEX)) {
		const source = match[1];
		const isAllowed =
			ALLOWED_IMPORT_SOURCES.includes(source) ||
			// google-fonts ships one subpackage per font family, e.g.
			// "@remotion/google-fonts/Inter" -- allow the whole family.
			source.startsWith("@remotion/google-fonts/");
		if (!isAllowed) {
			return { valid: false, reason: `Import from "${source}" is not allowed` };
		}
	}

	if (!/export\s+default\s+function/.test(code) && !/export\s+default\s+\w+/.test(code)) {
		return {
			valid: false,
			reason: "Code must have a default export (the video component)",
		};
	}

	return { valid: true };
}
