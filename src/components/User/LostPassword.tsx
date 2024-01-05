import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {Alert, Button, Form, Input, Row} from "antd";
import {useSession} from "../../session";
import {authAPI} from "../../services";
import {UpdateStatusEnum, UpdateStatusVO} from "../../models";

export function LostPassword() {
    const {userSession} = useSession();

    const navigate = useNavigate();
    const [updateStatus, setUpdateStatus] = useState<UpdateStatusVO>({status: UpdateStatusEnum.NONE, message: ""});
    const {t} = useTranslation();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // redirect to home if already logged in
        if (userSession && userSession.accessToken.length > 0) {
            navigate("/");
        }
    })

    function requestEmailLink(credentials: { email: string; }) {
        setLoading(true);
        authAPI.recoverLostPassword(credentials)
                .then((response) => {
                    if (response.message === 'OK') {
                        setUpdateStatus({status: UpdateStatusEnum.OK, message: t('LostPassword.setStatus.update.ok')});
                    } else {
                        setUpdateStatus({status: UpdateStatusEnum.FAIL, message: t('LostPassword.setStatus.update.fail')});
                    }

                    setLoading(false);
                })
                .catch((error) => {
                    console.error(error);
                    setUpdateStatus({status: UpdateStatusEnum.FAIL, message: error});
                    setLoading(false);
                });
    }

    if (updateStatus.status === "OK") {
        return (<div className={'darkDiv'}>
            <Alert type={'success'} message={t('LostPassword.updateStatus.ok.text')}/>
            <Button type={'default'} onClick={() => navigate('/login')}>{t('LostPassword.updateStatus.ok.button')}</Button>
        </div>)
    } else if (updateStatus.status === UpdateStatusEnum.FAIL) {
        return (<div className={'darkDiv'}>
            <Alert type={'error'} message={t('LostPassword.updateStatus.fail.text')}/>
            <Button type={'default'} onClick={() => navigate('/auth/reconfirm')}>{t('LostPassword.updateStatus.fail.button')}</Button>
        </div>)
    }

    return (
            <div className={'darkDiv'}>
                <Row justify={'center'} align={'middle'}>
                    <p>{t('LostPassword.text.top')}</p>
                </Row>
                <Row justify={'center'} align={'middle'} style={{minHeight: '15vh'}}>
                    <Form
                            name="lostPasswordForm"
                            labelCol={{span: 12}}
                            wrapperCol={{span: 16}}
                            style={{maxWidth: 600}}
                            initialValues={{remember: true}}
                            onFinish={requestEmailLink}
                            autoComplete="off"
                    >
                        <Form.Item name={'email'}
                                   label={t('LostPassword.form.email.label')}
                                   rules={[
                                       {
                                           required: true,
                                           message: t('LostPassword.form.email.rules.required')
                                       },
                                       {
                                           type: 'email',
                                           message: t('LostPassword.form.email.rules.email')
                                       }
                                   ]}>
                            <Input type="text" placeholder={t('LostPassword.form.email.placeholder')}/>
                        </Form.Item>
                        <Form.Item wrapperCol={{offset: 8, span: 16,}}>
                            <Button
                                    type={'primary'}
                                    htmlType={'submit'}
                                    disabled={loading}
                            >
                                {t('LostPassword.form.submitButton')}
                            </Button>
                        </Form.Item>
                    </Form>
                </Row>
                <Row justify={'center'} align={'middle'}>
                    <p>{t('LostPassword.text.bottom')}</p>
                </Row>
            </div>);
}