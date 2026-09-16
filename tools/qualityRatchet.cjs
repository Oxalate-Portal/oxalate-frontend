#!/usr/bin/env node
/*
 * Quality ratchet.
 *
 * Some quality problems in this repository are too large to fix in one change but must not be
 * allowed to grow. For each of those, this script measures the current count and compares it with
 * a pinned baseline in quality-baseline.json:
 *
 *   count >  baseline  -> exit 1 (you made it worse)
 *   count == baseline  -> exit 0
 *   count <  baseline  -> exit 0, and tell the caller to lower the baseline
 *
 * Usage:
 *   node tools/qualityRatchet.cjs                 # run every check
 *   node tools/qualityRatchet.cjs typecheck       # run one check
 *   node tools/qualityRatchet.cjs --update        # run every check and write improved baselines
 *
 * Lowering a baseline is the only edit this script makes. Raising a baseline by hand to make a
 * build pass defeats the point -- fix the code instead.
 */
const {execFileSync} = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const BASELINE_FILE = path.join(ROOT, "quality-baseline.json");
const MAX_BUFFER = 64 * 1024 * 1024;

/** Runs a command and returns its combined output, whatever the exit code. */
function capture(command, args) {
    try {
        return execFileSync(command, args, {
            cwd: ROOT,
            encoding: "utf8",
            maxBuffer: MAX_BUFFER,
            stdio: ["ignore", "pipe", "pipe"]
        });
    } catch (error) {
        if (error.stdout === undefined && error.stderr === undefined) {
            throw error;
        }
        return `${error.stdout ?? ""}${error.stderr ?? ""}`;
    }
}

/** Every .ts/.tsx file under src/, tests included. */
function sourceFiles() {
    const found = [];
    const walk = (dir) => {
        for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(full);
            } else if (/\.tsx?$/.test(entry.name)) {
                found.push(full);
            }
        }
    };
    walk(path.join(ROOT, "src"));
    return found;
}

/** Keeps a failure report readable when the underlying tool emits hundreds of lines. */
function truncate(text, maxLines) {
    const lines = text.split("\n");
    if (lines.length <= maxLines) {
        return text;
    }
    return [...lines.slice(0, maxLines), `  ... ${lines.length - maxLines} more line(s) suppressed`].join("\n");
}

const CHECKS = {
    /*
     * `vite build` transpiles without type checking and CI never runs tsc, so type errors are
     * invisible today. The baseline is the pre-existing error count; new type errors fail the build.
     */
    typecheck: {
        label: "TypeScript errors (tsconfig.app.json)",
        measure() {
            const output = capture("yarn", ["tsc", "-p", "tsconfig.app.json", "--noEmit"]);
            const matches = output.match(/error TS\d+/g) ?? [];
            return {count: matches.length, detail: output};
        }
    },

    /*
     * Formatting conformance against .editorconfig, which no tool reads. Only @stylistic/* rule ids
     * are counted so the number stays meaningful even if ESLint merges another config in.
     */
    style: {
        label: "Stylistic violations (eslint.stylistic.config.mjs)",
        measure() {
            const output = capture("yarn", [
                "eslint", "--no-config-lookup", "-c", "eslint.stylistic.config.mjs", "src/", "-f", "json"
            ]);
            const json = output.slice(output.indexOf("["), output.lastIndexOf("]") + 1);
            let results;
            try {
                results = JSON.parse(json);
            } catch {
                throw new Error(`Could not parse ESLint JSON output:\n${output.slice(0, 2000)}`);
            }
            const perRule = new Map();
            let count = 0;
            for (const file of results) {
                for (const message of file.messages) {
                    if (!message.ruleId || !message.ruleId.startsWith("@stylistic/")) {
                        continue;
                    }
                    count++;
                    perRule.set(message.ruleId, (perRule.get(message.ruleId) ?? 0) + 1);
                }
            }
            const detail = [...perRule.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([rule, n]) => `  ${String(n).padStart(6)}  ${rule}`)
                .join("\n");
            return {count, detail};
        }
    },

    /*
     * `yarn lint` is clean partly because violations are suppressed inline. 29 of the current
     * directives silence react-hooks correctness rules (set-state-in-effect, immutability,
     * exhaustive-deps), which are latent bugs rather than style noise. New suppressions need to
     * displace an old one.
     */
    suppressions: {
        label: "eslint-disable directives in src/",
        measure() {
            const perRule = new Map();
            let count = 0;
            for (const file of sourceFiles()) {
                const contents = fs.readFileSync(file, "utf8");
                for (const line of contents.split("\n")) {
                    const match = line.match(/eslint-disable(?:-next-line|-line)?\s+([^*\n]*)/);
                    if (!match) {
                        continue;
                    }
                    count++;
                    const rule = match[1].trim().split(/[\s,]+/)[0] || "(all rules)";
                    perRule.set(rule, (perRule.get(rule) ?? 0) + 1);
                }
            }
            const detail = [...perRule.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([rule, n]) => `  ${String(n).padStart(6)}  ${rule}`)
                .join("\n");
            return {count, detail};
        }
    }
};

function main() {
    const args = process.argv.slice(2);
    const update = args.includes("--update");
    const verbose = args.includes("--verbose");
    const requested = args.filter((arg) => !arg.startsWith("--"));
    const names = requested.length > 0 ? requested : Object.keys(CHECKS);

    for (const name of names) {
        if (!CHECKS[name]) {
            console.error(`Unknown check "${name}". Known checks: ${Object.keys(CHECKS).join(", ")}`);
            process.exit(2);
        }
    }

    const baseline = JSON.parse(fs.readFileSync(BASELINE_FILE, "utf8"));
    let failed = false;
    let improved = false;

    for (const name of names) {
        const check = CHECKS[name];
        const limit = baseline[name];
        if (typeof limit !== "number") {
            console.error(`quality-baseline.json has no numeric baseline for "${name}"`);
            process.exit(2);
        }

        const {count, detail} = check.measure();

        if (count > limit) {
            failed = true;
            console.error(`FAIL  ${check.label}: ${count} (baseline ${limit}, +${count - limit})`);
            if (detail) {
                console.error(truncate(detail, 40));
            }
        } else if (count < limit) {
            improved = true;
            baseline[name] = count;
            console.log(`GOOD  ${check.label}: ${count} (baseline ${limit}, -${limit - count})`);
        } else {
            console.log(`OK    ${check.label}: ${count} (at baseline)`);
            if (verbose && detail) {
                console.log(detail);
            }
        }
    }

    if (improved && update) {
        fs.writeFileSync(BASELINE_FILE, `${JSON.stringify(baseline, null, 4)}\n`);
        console.log(`\nLowered baselines written to ${path.relative(ROOT, BASELINE_FILE)}. Commit that file.`);
    } else if (improved) {
        console.log("\nThis got better. Run `yarn ratchet:update` and commit quality-baseline.json to lock the gain in.");
    }

    if (failed) {
        console.error("\nThe ratchet only moves one way. Fix the new violations rather than raising the baseline.");
        process.exit(1);
    }
}

main();
