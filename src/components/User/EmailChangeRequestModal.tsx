import {Alert, Button, Form, Input, Modal, Space} from "antd";
import {useState} from "react";
import {useTranslation} from "react-i18next";
import {authAPI} from "../../services";

interface EmailChangeRequestModalProps {
    open: boolean;
    onClose: () => void;
}

interface EmailChangeFormData {
    newEmail: string;
    password: string;
}

export function EmailChangeRequestModal({open, onClose}: EmailChangeRequestModalProps) {
    const {t} = useTranslation();
    const [form] = Form.useForm<EmailChangeFormData>();
    const [loading, setLoading] = useState(false);
    const [requestAccepted, setRequestAccepted] = useState<boolean | null>(null);

    function onFinish(values: EmailChangeFormData): void {
        setLoading(true);

        authAPI.requestEmailChange(values)
                .then((requestOk) => {
                    setRequestAccepted(requestOk);

                    if (requestOk) {
                        form.setFieldsValue({password: ""});
                    }
                })
                .catch((error) => {
                    console.error("Email change request failed", error);
                    setRequestAccepted(false);
                })
                .finally(() => {
                    setLoading(false);
                });
    }

    function handleClose(): void {
        form.resetFields();
        setRequestAccepted(null);
        onClose();
    }

    return (
            <Modal
                    title={t("User.emailChange.modal.title")}
                    open={open}
                    onCancel={handleClose}
                    footer={null}
                    destroyOnHidden
            >
                <Space direction="vertical" size={12} style={{width: "100%"}}>
                    {requestAccepted === true && (
                            <Alert type="success" message={t("User.emailChange.result.success")}/>
                    )}
                    {requestAccepted === false && (
                            <Alert type="error" message={t("User.emailChange.result.fail")}/>
                    )}

                    {requestAccepted !== true && (
                            <Form<EmailChangeFormData>
                                    form={form}
                                    layout="vertical"
                                    onFinish={onFinish}
                                    autoComplete="off"
                            >
                                <Form.Item
                                        name="newEmail"
                                        label={t("User.emailChange.form.newEmail.label")}
                                        rules={[
                                            {required: true, message: t("User.emailChange.form.newEmail.rules.required")},
                                            {type: "email", message: t("User.emailChange.form.newEmail.rules.email")}
                                        ]}
                                >
                                    <Input placeholder={t("User.emailChange.form.newEmail.placeholder")}/>
                                </Form.Item>

                                <Form.Item
                                        name="password"
                                        label={t("User.emailChange.form.password.label")}
                                        rules={[
                                            {required: true, message: t("User.emailChange.form.password.rules.required")}
                                        ]}
                                >
                                    <Input.Password placeholder={t("User.emailChange.form.password.placeholder")}/>
                                </Form.Item>

                                <Space style={{display: "flex", justifyContent: "flex-end"}}>
                                    <Button onClick={handleClose}>{t("common.button.cancel")}</Button>
                                    <Button loading={loading} type="primary" htmlType="submit">
                                        {t("User.emailChange.form.submit")}
                                    </Button>
                                </Space>
                            </Form>
                    )}

                    {requestAccepted === true && (
                            <Space style={{display: "flex", justifyContent: "flex-end"}}>
                                <Button type="primary" onClick={handleClose}>{t("common.button.close")}</Button>
                            </Space>
                    )}
                </Space>
            </Modal>
    );
}

