import i18n from "../i18n";

describe("internationalization configuration", () => {
    it("initializes with Finnish fallback and locale backend", () => {
        expect(i18n.options.fallbackLng).toEqual(["fi"]);
        expect(i18n.options.backend).toEqual({loadPath: "/locales/{{lng}}.json"});
    });
});
