import {useSession} from "../../session";
import {Alert, Button, Space} from "antd";
import {useTranslation} from "react-i18next";
import {useState} from "react";
import {Page} from "../Page";
import {userAPI} from "../../services";
import type {ConfirmationRequest} from "../../models";

interface AcceptTermsProps {
    registration: boolean;
}

export function AcceptTerms({registration}: AcceptTermsProps) {
    const {userSession, logoutUser, refreshUserSession} = useSession();
    const {t} = useTranslation();
    const [error, setError] = useState<string | null>(null);

    async function acceptTerms(answer: boolean) {
        const payload: ConfirmationRequest = {confirmationAnswer: answer};

        userAPI.acceptTerms(payload)
                .then(() => {
                    const newSession = JSON.parse(JSON.stringify(userSession));
                    newSession.approvedTerms = answer;
                    refreshUserSession(newSession);
                })
                .catch((error) => {
                    console.error(error);
                    setError(error.message);
                });
    }

    if (error !== null) {
        return (
                <Alert type={"error"}
                       title={t("AcceptTerms.error.alert")}/>
        );
    }

    return (
            <div style={{textAlign: "center"}} className={"darkDiv"}>
                <div style={{width: "50%", display: "inline-block", textAlign: "left"}}>

                    <Space orientation={"vertical"} size={20} style={{width: "100%", margin: 12}}>
                        <Page pageId={2} showTitle={false} showDate={false}/>

                        {!registration &&
                                <Space orientation={"horizontal"} size={12} style={{width: "100%", justifyContent: "center"}}>
                                    <Button type={"primary"}
                                            onClick={() => acceptTerms(true)}>{t("common.button.confirm")}</Button>
                                    <Button danger={true} type={"primary"} href={"/user"}
                                            onClick={() => acceptTerms(false)}>{t("common.button.reject")}</Button>
                                    <Button danger={true} type={"dashed"} onClick={logoutUser}
                                            href="/">{t("common.button.logout")}</Button>
                                </Space>}
                    </Space>
                </div>
            </div>
    );
}
