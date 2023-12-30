import {useSession} from "../../session";
import {Alert, Button, Space} from "antd";
import Page from "../Page/Page";
import {useTranslation} from "react-i18next";
import {useState} from "react";
import userAPI from "../../services/UserAPI";

interface AcceptTermsProps {
    registration: boolean
}

export function AcceptTerms({registration}: AcceptTermsProps) {
    const {userSession, logoutUser, refreshUserSession} = useSession();
    const {t} = useTranslation();
    const [error, setError] = useState<string | null>(null);

    async function acceptTerms(answer: string) {
        let payload = {termAnswer: answer};

        userAPI.acceptTerms(payload)
                .then((response) => {
                    let newSession = JSON.parse(JSON.stringify(userSession));
                    newSession.approvedTerms = response;
                    refreshUserSession(newSession);
                })
                .catch((error) => {
                    console.log(error);
                    setError(error.message);
                });
    }

    if (error !== null) {
        return (
                <Alert type={'error'}
                       message={t('AcceptTerms.error.alert')}/>
        );
    }

    return (
            <div style={{width: '100%', textAlign: 'center'}} className={'darkDiv'}>
                <div style={{width: '50%', display: 'inline-block', textAlign: 'left'}}>

                    <Space direction={'vertical'} size={20} style={{width: '100%', margin: 12}}>
                        <Page pageId={2} showTitle={false} showDate={false}/>

                        {!registration &&
                                <Space direction={'horizontal'} size={12} style={{width: '100%', justifyContent: 'center'}}>
                                    <Button type={'primary'}
                                            onClick={() => acceptTerms('yes')}>{t('AcceptTerms.button.acceptTerms')}</Button>
                                    <Button danger={true} type={'primary'} href={'/user'}
                                            onClick={() => acceptTerms('no')}>{t('AcceptTerms.rejectTerms')}</Button>
                                    <Button danger={true} type={'dashed'} onClick={logoutUser}
                                            href="/">{t('common.buttons.logout')}</Button>
                                </Space>}
                    </Space>
                </div>
            </div>
    );
}

export default AcceptTerms;
