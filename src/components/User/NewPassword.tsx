import {Alert, Button, Form, Space, Spin} from "antd";
import {useTranslation} from "react-i18next";
import {useResponsiveFormLayout} from "../main";
import {useParams} from "react-router-dom";
import {useState} from "react";
import {type ActionResponse, type PasswordResetRequest, UpdateStatusEnum} from "../../models";
import {authAPI} from "../../services";
import {useReCaptcha} from "@wojtekmaj/react-recaptcha-v3";
import {PasswordRules} from "./PasswordRules";
import {PasswordFields} from "./PasswordFields";

export function NewPassword() {
    const [newPasswordForm] = Form.useForm();
    const [updateStatus, setUpdateStatus] = useState<ActionResponse>({status: UpdateStatusEnum.NONE, message: ""});
    const [loading, setLoading] = useState(false);
    const {token} = useParams();
    const {executeRecaptcha} = useReCaptcha();
    const {t} = useTranslation();
    const formLayout = useResponsiveFormLayout(8, 12);

    const resetPassword = async (values: { newPassword: string; confirmPassword: string }) => {
        if (!token) {
            console.error("No token provided");
            setUpdateStatus({status: UpdateStatusEnum.FAIL, message: t("NewPassword.setUpdateStatus.update.fail")});
            return;
        }

        setLoading(true);
        const postData: PasswordResetRequest = {
            new_password: values.newPassword,
            confirm_password: values.confirmPassword,
            token: token
        };

        if (!executeRecaptcha) {
            console.error("reCAPTCHA is not available, cannot reset the password");
            setUpdateStatus({status: UpdateStatusEnum.FAIL, message: t("NewPassword.setUpdateStatus.update.fail")});
            setLoading(false);
            return;
        }

        const recaptchaToken = await executeRecaptcha("reset_password");

        authAPI.resetPassword(postData, recaptchaToken)
            .catch(e => {
                console.error(e);
                setUpdateStatus({status: UpdateStatusEnum.FAIL, message: e});
            })
            .then((response) => {
                if (response?.status === UpdateStatusEnum.OK) {
                    setUpdateStatus({status: UpdateStatusEnum.OK, message: t("NewPassword.setUpdateStatus.update.ok")});
                } else {
                    console.error("Failed to update user, error: " + response?.message);
                    setUpdateStatus({status: UpdateStatusEnum.FAIL, message: t("NewPassword.setUpdateStatus.update.fail")});
                }
            });
        setLoading(false);
    };

    const updatePasswordFailed = (errorInfo: { errorFields: { errors: string[] }[] }) => {
        console.error("Updating password failed", errorInfo);
    };

    if (updateStatus.status === UpdateStatusEnum.OK) {
        return (<div className={"darkDiv"}>
            <Alert
                type={"success"}
                showIcon={true}
                title={t("NewPassword.updateStatus.ok.text") + " " + t("NewPassword.updateStatus.ok.button")}
            />
        </div>);
    } else if (updateStatus.status === UpdateStatusEnum.FAIL) {
        return (<div className={"darkDiv"}>
            <Alert
                type={"error"}
                showIcon={true}
                title={t("NewPassword.updateStatus.fail.text")}
            />
            <div>{t("NewPassword.updateStatus.fail.button")}</div>
        </div>);
    }

    return (
        <div className={"darkDiv"}>
            <Spin spinning={loading}>
                <h4>{t("NewPassword.title")}</h4>

                <PasswordRules/>

                <Form
                    form={newPasswordForm}
                    name={"update-password"}
                    {...formLayout}
                    style={{maxWidth: 800}}
                    initialValues={{
                        oldPassword: "",
                        newPassword: "",
                        confirmPassword: ""
                    }}
                    onFinish={resetPassword}
                    onFinishFailed={updatePasswordFailed}
                    autoComplete={"off"}
                    scrollToFirstError={true}
                >
                    <PasswordFields/>
                    <Space orientation={"horizontal"} size={12} style={{width: "100%", justifyContent: "center"}}>
                        <Button
                            type={"primary"}
                            htmlType={"submit"}
                            disabled={loading}
                        >{t("common.button.update")}</Button>
                    </Space>
                </Form>
            </Spin>
        </div>);
}
