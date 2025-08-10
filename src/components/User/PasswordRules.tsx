import {useTranslation} from "react-i18next";

export function PasswordRules() {
    const {t} = useTranslation();

    return (
            <>
                <p>{t("PasswordRules.text")}</p>
                <ul>
                    <li>{t("PasswordRules.rule.1")}</li>
                    <li>{t("PasswordRules.rule.2")}</li>
                    <li>{t("PasswordRules.rule.3")}</li>
                    <li>{t("PasswordRules.rule.4")}</li>
                </ul>
            </>
    );
}
