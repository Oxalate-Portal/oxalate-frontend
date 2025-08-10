import {Alert, Button, Form, Space, Spin} from "antd";
import {useTranslation} from "react-i18next";
import {useParams} from "react-router-dom";
import {useState} from "react";
import {PasswordResetRequest, UpdateStatusEnum, UpdateStatusVO} from "../../models";
import {authAPI} from "../../services";
import {PasswordRules} from "./PasswordRules";
import {PasswordFields} from "./PasswordFields";

export function NewPassword() {
    const [newPasswordForm] = Form.useForm();
    const [updateStatus, setUpdateStatus] = useState<UpdateStatusVO>({status: UpdateStatusEnum.NONE, message: ""});
    const [loading, setLoading] = useState(false);
    const {token} = useParams();
    const {t} = useTranslation();

    const resetPassword = (values: { newPassword: any; confirmPassword: any; }) => {
        if (!token) {
            console.error("No token provided");
            setUpdateStatus({status: UpdateStatusEnum.FAIL, message: t("NewPassword.setUpdateStatus.update.fail")});
            return;
        }

        setLoading(true);
        const postData: PasswordResetRequest = {
            newPassword: values.newPassword,
            confirmPassword: values.confirmPassword,
            token: token
        };

        authAPI.resetPassword(postData)
                .catch(e => {
                    console.error(e);
                    setUpdateStatus({status: UpdateStatusEnum.FAIL, message: e});
                })
                .then((response) => {
                    if (response?.message === "OK") {
                        setUpdateStatus({status: UpdateStatusEnum.OK, message: t("NewPassword.setUpdateStatus.update.ok")});
                    } else {
                        console.error("Failed to update user, error: " + response?.message);
                        setUpdateStatus({status: UpdateStatusEnum.FAIL, message: t("NewPassword.setUpdateStatus.update.fail")});
                    }
                });
        setLoading(false);
    };

    const updatePasswordFailed = (errorInfo: any) => {
        console.error("Updating password failed", errorInfo);
    };

    if (updateStatus.status === "OK") {
        return (<div className={"darkDiv"}>
            <Alert
                    type={"success"}
                    showIcon={true}
                    message={t("NewPassword.updateStatus.ok.text")}
            />
            <div className="p-4">{t("NewPassword.updateStatus.ok.button")}</div>
        </div>);
    } else if (updateStatus.status === UpdateStatusEnum.FAIL) {
        return (<div className={"darkDiv"}>
            <Alert
                    type={"error"}
                    showIcon={true}
                    message={t("NewPassword.updateStatus.fail.text")}
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
                            labelCol={{span: 8}}
                            wrapperCol={{span: 12}}
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
                        <Space direction={"horizontal"} size={12} style={{width: "100%", justifyContent: "center"}}>
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