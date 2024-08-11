import { Form, Input } from "antd";
import { useTranslation } from "react-i18next";

export function PasswordFields() {
    const {t} = useTranslation();

    return (
            <>
                <Form.Item
                        name="newPassword"
                        label={t('PasswordFields.form.newPassword.label')}
                        wrapperCol={{span: 12}}
                        rules={[
                            {
                                required: true,
                                message: t('PasswordFields.form.newPassword.rules.required')
                            },
                            {
                                min: 10,
                                message: t('PasswordFields.form.newPassword.rules.min')
                            },
                            {
                                pattern: new RegExp(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*_-])/),
                                message: t('PasswordFields.form.newPassword.rules.pattern')
                            }
                        ]}>
                    <Input.Password/>
                </Form.Item>
                <Form.Item
                        name="confirmPassword"
                        label={t('PasswordFields.form.confirmPassword.label')}
                        dependencies={['newPassword', 'oldPassword']}
                        wrapperCol={{span: 12}}
                        rules={[
                            {
                                required: true,
                                message: t('PasswordFields.form.confirmPassword.rules.required')
                            },
                            ({getFieldValue}) => ({
                                validator(_, value) {
                                    if (!value || (getFieldValue('newPassword') === value &&
                                            getFieldValue('oldPassword') !== getFieldValue('newPassword'))) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error(t('PasswordFields.form.confirmPassword.rules.validator')));
                                },
                            }),
                        ]}
                >
                    <Input.Password/>
                </Form.Item>
            </>
    );
}
