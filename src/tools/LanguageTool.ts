export class LanguageTool {
    static languages = [
        {label: "Suomi 🇫🇮", value: "fi"},
        {label: "English 🇬🇧", value: "en"},
        {label: "Svenska 🇸🇪", value: "sv"},
        {label: "Deutsch 🇩🇪", value: "de"},
        {label: "Español 🇪🇸", value: "es"}
    ];

    static getLabelByValue(value: string): string {
        const language = this.languages.find((lang) => lang.value === value);
        return language ? language.label : "Valitse kieli 🌐";
    }

    static getLanguages(): { label: string; value: string }[] {
        return this.languages;
    }
}

