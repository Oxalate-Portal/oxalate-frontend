import {useTranslation} from "react-i18next";
import {Alert, Button} from "antd";
import {useState} from "react";
import {authAPI} from "../../services";

interface ResendRegistrationEmailProps {
    token: string;
}

export function ResendRegistrationEmail({token}: ResendRegistrationEmailProps) {
    const {t} = useTranslation();
    const [resendSuccess, setResendSuccess] = useState(true);

    async function requestEmailResend() {
        authAPI.resendRegistrationEmail(token)
                .then((response) => {
                    if (response) {
                        setResendSuccess(true);
                    }
                })
                .catch((error) => {
                    console.error(error);
                });
    }

    return (
            <>
                <p>{t("ResendRegistrationEmail.text.notReceived")}</p>
                {resendSuccess && <Button block={true} onClick={requestEmailResend}>{t("common.button.send")}</Button>}
                {!resendSuccess && <Alert type={"error"} title={t("ResendRegistrationEmail.text.fail")}/>}
            </>);
}
