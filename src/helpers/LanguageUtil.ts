export class LanguageUtil {
    static languages = [
        {label: "Suomi 🇫🇮", value: "fi"},
        {label: "English 🇬🇧", value: "en"},
        {label: "Svenska 🇸🇪", value: "sv"},
        {label: "Deutsch 🇩🇪", value: "de"},
    ];

    static getLabelByValue(value: string): string | undefined {
        const language = this.languages.find((lang) => lang.value === value);
        return language ? language.label : "Valitse kieli 🌐";
    }

    static getLanguages(): { label: string; value: string }[] {
        return this.languages;
    }
}

