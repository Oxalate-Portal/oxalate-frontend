import {LanguageTool} from "../tools";

describe("LanguageTool", () => {
    it("returns the correct label for a supported language", () => {
        expect(LanguageTool.getLabelByValue("en")).toBe("English 🇬🇧");
    });

    it("returns the fallback hint for unsupported languages", () => {
        expect(LanguageTool.getLabelByValue("xx")).toBe("Valitse kieli 🌐");
    });

    it("exposes the configured list of languages", () => {
        const languages = LanguageTool.getLanguages();
        expect(languages).toEqual(
            expect.arrayContaining([
                {label: "Suomi 🇫🇮", value: "fi"},
                {label: "English 🇬🇧", value: "en"},
                {label: "Svenska 🇸🇪", value: "sv"},
                {label: "Deutsch 🇩🇪", value: "de"},
                {label: "Español 🇪🇸", value: "es"}
            ])
        );
        expect(languages.length).toBe(5);
    });
});

