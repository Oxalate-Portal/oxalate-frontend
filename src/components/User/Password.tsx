import {useTranslation} from "react-i18next";
import {Alert, Button, Form, Input, Space, Spin} from "antd";
import {useState} from "react";
import {useSession} from "../../session";
import {UpdateStatusEnum, UpdateStatusVO} from "../../models";
import {useNavigate} from "react-router-dom";
import {PasswordFields} from "./PasswordFields";
import {PasswordRules} from "./PasswordRules";
import {authAPI} from "../../services";

export function Password() {
    const [loading, setLoading] = useState(false);
    const {userSession, logoutUser} = useSession();
    const [updateStatus, setUpdateStatus] = useState<UpdateStatusVO>({status: UpdateStatusEnum.NONE, message: ""});
    const [updatePasswordForm] = Form.useForm();
    const {t} = useTranslation();
    const navigate = useNavigate();

    const updatePassword = (values: { oldPassword: any; newPassword: any; confirmPassword: any; }) => {
        setLoading(true);
        let postData = {
            oldPassword: values.oldPassword,
            newPassword: values.newPassword,
            confirmPassword: values.confirmPassword
        };

        authAPI.updatePassword(userSession?.id, postData)
                .then((response) => {
                    console.debug("Is status " + response.status + " equal to " + UpdateStatusEnum.OK + "?: " + (response.status === UpdateStatusEnum.OK));

                    if (response && response.status === UpdateStatusEnum.OK) {
                        setUpdateStatus({
                            status: UpdateStatusEnum.OK,
                            message: t('Password.setUpdateStatus.update.ok')
                        });
                    } else {
                        console.error("Failed to update user, error: " + response?.message);
                        console.debug("Response:", response);
                        setUpdateStatus({
                            status: UpdateStatusEnum.FAIL,
                            message: t('Password.setUpdateStatus.update.fail')
                        });
                    }
                })
                .catch(e => {
                    console.log("Failed to authorize", e);
                    setUpdateStatus({status: UpdateStatusEnum.FAIL, message: e});
                });
        setLoading(false);
    }

    const updatePasswordFailed = (errorInfo: any) => {
        console.log("Updating password failed", errorInfo);
    }

    if (updateStatus.status === UpdateStatusEnum.OK) {
        return (<div className={'darkDiv'}>
            <Alert type={'success'}
                   showIcon
                   message={t('Password.updateStatus.ok.text')}
                   action={<Button type={'primary'}
                                   onClick={() => logoutUser()}>{t('Password.updateStatus.ok.button')}</Button>}
            />
        </div>);
    } else if (updateStatus.status === UpdateStatusEnum.FAIL) {
        return (<div className={'darkDiv'}>
            <Alert type={'error'}
                   showIcon
                   message={t('Password.updateStatus.fail.text')}
                   action={<Button type={'primary'}
                                   onClick={() => navigate('/')}>{t('common.button.back')}</Button>}
            />
        </div>);
    }

    return (
            <Spin spinning={loading}>
                <div className={'darkDiv'}>
                    <PasswordRules/>
                    <Form
                            form={updatePasswordForm}
                            name={'update-password'}
                            labelCol={{span: 8}}
                            wrapperCol={{span: 12}}
                            style={{maxWidth: 800}}
                            initialValues={{
                                oldPassword: '',
                                newPassword: '',
                                confirmPassword: ''
                            }}
                            onFinish={updatePassword}
                            onFinishFailed={updatePasswordFailed}
                            autoComplete={'off'}
                            scrollToFirstError={true}>
                        <Form.Item
                                name="oldPassword"
                                label={t('Password.form.oldPassword.label')}
                                wrapperCol={{span: 12}}
                                rules={[
                                    {
                                        required: true,
                                        message: t('Password.form.oldPassword.rules.required')
                                    }
                                ]}>
                            <Input.Password/>
                        </Form.Item>
                        <PasswordFields/>
                        <Space direction={'horizontal'} size={12} style={{width: '100%', justifyContent: 'center'}}>
                            <Button
                                    type={'primary'}
                                    htmlType={'submit'}
                                    disabled={loading}
                            >{t('Password.form.submitButton')}</Button>
                        </Space>
                    </Form>
                </div>
            </Spin>);
}
