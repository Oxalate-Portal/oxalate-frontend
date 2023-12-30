import {useTranslation} from "react-i18next";
import {Alert, Button} from "antd";
import authAPI from "../../services/AuthAPI";
import {useState} from "react";

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
                    console.log(response);
                })
                .catch((error) => {
                    console.log(error);
                });
    }

    return (
            <>
                <p>{t('ResendRegistrationEmail.text.notReceived')}</p>
                {resendSuccess && <Button block={true} onClick={requestEmailResend}>{t('common.button.send')}</Button>}
                {!resendSuccess && <Alert type={'error'} message={t('ResendRegistrationEmail.text.fail')}/>}
            </>    );
}

export default ResendRegistrationEmail;
