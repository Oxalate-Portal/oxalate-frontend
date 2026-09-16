// Stylistic-only ESLint config, used exclusively by `yarn lint:style` and the style ratchet in
// tools/qualityRatchet.cjs. It is deliberately NOT part of eslint.config.js.
//
// Why it is separate: `yarn lint` is a hard gate (zero violations allowed). The codebase does not
// currently conform to any single formatting style -- the measured baseline is ~6300 indentation
// and ~1200 quote violations -- so wiring these rules into the hard gate would red-build the repo.
// Instead the violation count is ratcheted downwards. See ../TODO-20260916.md item 2 for the decision
// on whether to do a one-time `--fix` reformat and promote these to the hard gate.
//
// The rules below encode the settings already declared in .editorconfig for TS/TSX
// (indent_size = 4, indent_style = space, max_line_length = 160), which no tool reads today.
import stylistic from "@stylistic/eslint-plugin";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default tseslint.config(
        {
            ignores: [
                "coverage/**",
                "dist/**",
                "node_modules/**",
                ".yarn/**",
                "src/buildInfo.json"
            ]
        },
        {
            files: ["src/**/*.{ts,tsx}"],
            plugins: {
                "@stylistic": stylistic,
                "@typescript-eslint": tseslint.plugin,
                "react-hooks": reactHooks
            },
            languageOptions: {
                parser: tseslint.parser,
                ecmaVersion: "latest",
                sourceType: "module",
                parserOptions: {
                    ecmaFeatures: {jsx: true}
                }
            },
            linterOptions: {
                reportUnusedDisableDirectives: "off"
            },
            rules: {
                "@stylistic/indent": ["error", 4, {SwitchCase: 1}],
                "@stylistic/semi": ["error", "always"],
                "@stylistic/quotes": ["error", "double", {avoidEscape: true}],
                "@stylistic/eol-last": ["error", "always"],
                "@stylistic/no-trailing-spaces": "error",
                "@stylistic/comma-dangle": ["error", "never"],
                "@stylistic/max-len": ["error", {
                    code: 160,
                    ignoreUrls: true,
                    ignoreStrings: true,
                    ignoreTemplateLiterals: true
                }]
            }
        }
);
