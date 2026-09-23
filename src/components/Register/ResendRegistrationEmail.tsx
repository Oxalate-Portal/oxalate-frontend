import {useTranslation} from "react-i18next";
import {Alert, Button} from "antd";
import {useState} from "react";
import {authAPI} from "../../services";
import {useReCaptcha} from "@wojtekmaj/react-recaptcha-v3";

interface ResendRegistrationEmailProps {
    token: string;
}

export function ResendRegistrationEmail({token}: ResendRegistrationEmailProps) {
    const {t} = useTranslation();
    const [resendSuccess, setResendSuccess] = useState(true);
    const {executeRecaptcha} = useReCaptcha();

    async function requestEmailResend() {
        if (!executeRecaptcha) {
            console.error("reCAPTCHA is not available, cannot resend the confirmation email");
            setResendSuccess(false);
            return;
        }

        const recaptchaToken = await executeRecaptcha("resend_confirmation");
        authAPI.resendRegistrationEmail(token, recaptchaToken)
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
