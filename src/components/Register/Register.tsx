import { useSession } from "../../session";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Form, Input, Modal, Row } from "antd";
import { useTranslation } from "react-i18next";
import { UserFields } from "../User";
import { AcceptTerms } from "../main";
import { ResultEnum, UpdateStatusEnum, UpdateStatusVO } from "../../models";
import { ResendRegistrationEmail } from "./ResendRegistrationEmail";
import { RegistrationResponse } from "../../models/responses";
import { authAPI } from "../../services";

export function Register() {
    const {userSession} = useSession();
    const {t} = useTranslation();
    const [registrationForm] = Form.useForm();
    const [showTerms, setShowTerms] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [loading, setLoading] = useState(false);
    const [registrationStatus, setRegistrationStatus] = useState<UpdateStatusVO>({status: UpdateStatusEnum.NONE, message: ""});
    const [registrationResult, setRegistrationResult] = useState<RegistrationResponse | null>(null);
    const navigate = useNavigate()

    useEffect(() => {
        // redirect to home if already logged in
        if (userSession) navigate('/');

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate]);

    async function onFinish(regData: {
        username: any;
        password: any;
        firstName: any;
        lastName: any;
        phoneNumber: any;
        privacy: any;
        nextOfKin: any;
        language: any;
    }) {
        setLoading(true);
        authAPI.register({
            username: regData.username,
            password: regData.password,
            firstName: regData.firstName,
            lastName: regData.lastName,
            phoneNumber: regData.phoneNumber,
            privacy: regData.privacy,
            nextOfKin: regData.nextOfKin,
            language: regData.language
        })
                .then(registrationResponse => {
                    if (registrationResponse.status === ResultEnum.OK) {
                        localStorage.setItem("oxalateRegistrationStatus", JSON.stringify(registrationResponse));
                        setRegistrationStatus({status: UpdateStatusEnum.OK, message: t('Register.success.message')} as UpdateStatusVO);
                        setRegistrationResult(registrationResponse);
                    } else {
                        console.error("The register response did not contain known status: " + JSON.stringify(registrationResponse));
                        setRegistrationStatus({status: UpdateStatusEnum.FAIL, message: t('Register.fail.message')} as UpdateStatusVO);
                    }
                })
                .catch(error => {
                    console.error("Failed to register new user: " + error);
                    setRegistrationStatus({status: UpdateStatusEnum.FAIL, message: t('Register.fail.message')} as UpdateStatusVO);
                });

        setLoading(false);
    }

    function onFinishFailed(errorInfo: any) {
        console.error('Failed:', errorInfo);
    }

    if (registrationStatus.status === UpdateStatusEnum.OK && registrationResult !== null) {
        return (
                <div className={'darkDiv'}>
                    <Row justify={'center'}>
                        <div style={{width: 400}}>
                            <Alert type={'success'}
                                   message={t('Register.success.message')}/>
                            <Row justify={'center'} align={'middle'} style={{minHeight: '10vh'}}>
                                <ResendRegistrationEmail token={registrationResult.token}/>
                            </Row>
                        </div>
                    </Row>
                </div>
        );
    } else if (registrationStatus.status === UpdateStatusEnum.FAIL) {
        return (<div className={'darkDiv'}>
            <Alert type={'error'}
                   showIcon
                   message={t('Register.fail.message')}
                   action={<Button type={'primary'}
                                   onClick={() => navigate('/register')}>{t('common.button.back')}</Button>}
            />
        </div>);
    }

    return (
            <div className={'darkDiv'}>
                <Row justify={'center'} align={'top'} style={{minHeight: '100vh'}}>
                    <Form
                            form={registrationForm}
                            name={'basic'}
                            onFinish={onFinish}
                            onFinishFailed={onFinishFailed}
                            layout={'vertical'}
                            labelCol={{span: 12}}
                            wrapperCol={{span: 24}}
                            style={{width: 600, maxWidth: 900}}
                            autoComplete={'off'}
                            scrollToFirstError={true}
                    >
                        <h4>{t('Register.form.title')}</h4>
                        <UserFields username={null} userId={0} isOrganizer={false}/>
                        <Form.Item name={'password'}
                                   label={t('Register.form.password.label')}
                                   tooltip={t('Register.form.password.tooltip')}
                                   rules={[
                                       {
                                           required: true,
                                           message: t('Register.form.password.rules.required')
                                       },
                                       {
                                           min: 10,
                                           message: t('Register.form.password.rules.min')
                                       },
                                       {
                                           pattern: new RegExp(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*_-])/),
                                           message: t('Register.form.password.rules.pattern')
                                       }
                                   ]}>
                            <Input.Password/>
                        </Form.Item>
                        <Form.Item name={'confirm'}
                                   label={t('Register.form.confirm.label')}
                                   dependencies={['password']}
                                   rules={[
                                       {
                                           required: true,
                                           message: t('Register.form.confirm.rules.required')
                                       },
                                       ({getFieldValue}) => ({
                                           validator(_, value) {
                                               if (!value || getFieldValue('password') === value) {
                                                   return Promise.resolve();
                                               }
                                               return Promise.reject(new Error(t('Register.form.confirm.rules.nomatch')));
                                           },
                                       }),
                                   ]}>
                            <Input.Password/>
                        </Form.Item>
                        <p>{t('Register.form.terms.text')} <Button type={'default'}
                                                                   onClick={() => setShowTerms(true)}>{t('Register.form.terms.button')}</Button>
                        </p>
                        <Button
                                type={'primary'}
                                htmlType={'submit'}
                                disabled={!acceptedTerms && !loading}
                        >{t('Register.form.submitButton')}</Button>
                    </Form>
                    <Modal cancelText={t('Register.form.terms.reject')}
                           okText={t('Register.form.terms.accept')}
                           onCancel={() => {
                               setAcceptedTerms(false);
                               setShowTerms(false);
                           }}
                           onOk={() => {
                               setAcceptedTerms(true);
                               setShowTerms(false);
                           }}
                           open={showTerms}
                           title={t('Register.form.terms.title')}
                           width={'80%'}>
                        <AcceptTerms registration={true}/>
                    </Modal>
                </Row>
            </div>
    );
}

