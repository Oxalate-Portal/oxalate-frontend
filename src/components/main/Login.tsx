import {Alert, Button, Form, Input, Row, Space} from "antd";
import {useState} from "react";
import {useTranslation} from "react-i18next";
import {useNavigate} from "react-router-dom";
import {useGoogleReCaptcha} from "react-google-recaptcha-v3";
import {useSession} from "../../session";
import {LoginRequest} from "../../models/requests";
import {ActionResultEnum, LoginStatus} from "../../models";

export function Login() {
    const [loading, setLoading] = useState(false);
    const {t} = useTranslation();
    const navigate = useNavigate();
    const {executeRecaptcha} = useGoogleReCaptcha();
    const {loginUser} = useSession();
    const [updateStatus, setUpdateStatus] = useState({status: "NONE", message: ""});

    async function onFinish(credentials: any): Promise<void> {
        console.log("Called with login information:", credentials);
        setLoading(true);

        if (!executeRecaptcha) {
            setLoading(false);
            console.log("Did not executeRecaptcha");
            return;
        }

        const recaptchaResult = await executeRecaptcha('register');

        const loginRequest: LoginRequest = {
            username: credentials.username,
            password: credentials.password,
            recaptchaToken: recaptchaResult
        };

        console.log("Calling loginUser with:", loginRequest);
        const loginResult: LoginStatus = await loginUser(loginRequest);

        if (!loginResult || loginResult.status === ActionResultEnum.FAILURE) {
            console.error("Login failed", loginResult);
            setUpdateStatus({status: "ERROR", message: t('Login.updateStatus.loginFail')});
        } else {
            navigate('/');
        }

        setLoading(false);
    }

    function onFinishFailed(errorInfo: any) {
        console.log('Failed:', errorInfo);
    }

    function clearStateOnBackButton() {
        navigate('/')
    }

    if (updateStatus.status === 'ERROR') {
        return (<div>
            <Alert type={'error'}
                   message={updateStatus.message}
                   showIcon
                   action={<Button type={'primary'} onClick={() => clearStateOnBackButton()}>{ t('common.button.back')}</Button>}
            />
        </div>);
    }

    return (
            <Row justify="center" align="middle" style={{minHeight: '30vh'}}>
                <Space direction={'vertical'}>

                    <Form
                            name="basic"
                            labelCol={{span: 12}}
                            wrapperCol={{span: 16}}
                            style={{maxWidth: 600}}
                            initialValues={{remember: true}}
                            onFinish={onFinish}
                            onFinishFailed={onFinishFailed}
                            autoComplete="off"
                    >
                        <Form.Item name={'username'}
                                   label={t('Login.form.username.label')}
                                   rules={[
                                       {
                                           type: 'email',
                                           message: t('Login.form.username.rules.email'),
                                       },
                                       {
                                           required: true,
                                           message: t('Login.form.username.rules.required')
                                       },
                                   ]}>
                            <Input type="text"/>
                        </Form.Item>
                        <Form.Item
                                label={t('Login.form.password.label')}
                                name="password"
                                rules={[
                                    {
                                        required: true,
                                        message: t('Login.form.password.rules.required')
                                    },
                                ]}
                        >
                            <Input.Password/>
                        </Form.Item>
                        <Form.Item wrapperCol={{offset: 8, span: 16,}}
                        >
                            <Button
                                    type={'primary'}
                                    htmlType={'submit'}
                                    className={'g-recaptcha'}
                                    disabled={loading}
                            >
                                {t('common.button.login')}
                            </Button>
                        </Form.Item>
                    </Form>

                    <p style={{textAlign: "center"}}><Button
                            onClick={() => navigate("/auth/lost-password")}
                            disabled={loading}
                    >
                        {t('Login.form.button.forgotPassword')}</Button></p>
                </Space>
            </Row>    );
}
