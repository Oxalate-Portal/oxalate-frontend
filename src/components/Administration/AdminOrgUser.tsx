import { useNavigate, useParams } from "react-router-dom";
import { SyntheticEvent, useEffect, useState } from "react";
import { ResultEnum, RoleEnum, UpdateStatusEnum, UpdateStatusVO, UserStatusEnum } from "../../models";
import { useTranslation } from "react-i18next";
import { authAPI, userAPI } from "../../services";
import { AdminUserResponse } from "../../models/responses/AdminUserResponse";
import { Button, Checkbox, Col, Form, Input, Row, Select, Space, Spin } from "antd";
import { UserFields } from "../User";
import { checkRoles } from "../../helpers";
import { UserRequest } from "../../models/requests";
import { SubmitResult } from "../main";

export function AdminOrgUser() {
    const {paramId} = useParams();
    const [workUser, setWorkUser] = useState<AdminUserResponse | null>(null);
    const [updateStatus, setUpdateStatus] = useState<UpdateStatusVO>({status: UpdateStatusEnum.NONE, message: ""});
    const [blockSendEmail, setBlockSendEmail] = useState(false);
    const [loading, setLoading] = useState(true);
    const [invalidForm, setInvalidForm] = useState(false);
    const {t} = useTranslation();
    const [userForm] = Form.useForm();
    const navigate = useNavigate();

    const statusTypes = [
        {value: UserStatusEnum.REGISTERED, label: t("common.userStatus.registered")},
        {value: UserStatusEnum.ACTIVE, label: t("common.userStatus.active")},
        {value: UserStatusEnum.LOCKED, label: t("common.userStatus.locked")},
        {value: UserStatusEnum.ANONYMIZED, label: t("common.userStatus.anonymized")},
    ];

    useEffect(() => {
        setLoading(true);
        let tmpUserId = 0;

        if (paramId !== undefined && !Number.isNaN(parseInt(paramId))) {
            tmpUserId = parseInt(paramId);
        }

        if (tmpUserId > 0) {
            userAPI.findAdminUserById(tmpUserId)
                    .then(response => {

                        if (response == null ||
                                response.status == null ||
                                response.status === "ANONYMIZED") {
                            setInvalidForm(true);
                            setBlockSendEmail(true);
                        } else {
                            setInvalidForm(false);
                        }

                        setWorkUser(response);
                    })
                    .catch(error => {
                        console.error("Error:", error);
                    })
                    .finally(() => {
                        setLoading(false);
                    });
        } else {
            console.error("Invalid user id:", tmpUserId);
            setLoading(false);
        }
    }, [paramId]);

    function sendPasswordEmail(event: SyntheticEvent) {
        // Block default submit of the form
        event.preventDefault();

        if (blockSendEmail || workUser == null || workUser.id === 0) {
            console.warn("Email sending blocked");
            return;
        }

        setLoading(true);

        authAPI.recoverLostPassword({email: workUser.username})
                .then((response) => {
                    if (response.message === ResultEnum.OK) {
                        alert(t("AdminOrgUser.sendPasswordEmail.ok"));
                    } else {
                        alert(t("AdminOrgUser.sendPasswordEmail.fail"));
                    }
                })
                .finally(() => {
                    setLoading(false);
                });
    }

    function updateUser(userInfo: AdminUserResponse) {
        setLoading(true);

        if (userInfo.status === "ANONYMIZED") {
            if (!window.confirm(t("AdminOrgUser.updateUser.confirmAnonymize"))) {
                setLoading(false);
                return;
            }
        }

        // If the organizer role has been added for an user with privacy turned on, then we should emit a warning that it will be turned off
        if (workUser && workUser.privacy
                && userInfo.roles.includes(RoleEnum.ROLE_ORGANIZER)
                && !workUser.roles.includes(RoleEnum.ROLE_ORGANIZER)) {
            if (!window.confirm(t("AdminOrgUser.updateUser.confirmOrganizer"))) {
                setLoading(false);
                return;
            }
        }

        let postData: UserRequest = {
            id: userInfo.id,
            username: userInfo.username,
            firstName: userInfo.firstName,
            lastName: userInfo.lastName,
            status: userInfo.status,
            phoneNumber: userInfo.phoneNumber,
            nextOfKin: userInfo.nextOfKin,
            privacy: userInfo.privacy,
            registered: userInfo.registered,
            roles: userInfo.roles,
            language: userInfo.language
        };

        userAPI.update(postData)
                .then((response) => {
                        setUpdateStatus({status: UpdateStatusEnum.OK, message: t("AdminOrgUser.updateUser.ok")});
                        setWorkUser(response);
                })
                .catch(e => {
                    console.error("Failed to update user, error: " + e.message);
                    setUpdateStatus({status: UpdateStatusEnum.FAIL, message: t("AdminOrgUser.updateUser.fail")});
                })
                .finally(() => {
                    setLoading(false);
                });
    }

    function updateUserFailed(errorInfo: any) {
        console.error("Failed:", errorInfo);
    }

    if (updateStatus.status !== UpdateStatusEnum.NONE) {
        return <SubmitResult updateStatus={updateStatus} navigate={navigate}/>;
    }

    return (
            <div className={"darkDiv"}>
                <Spin spinning={loading}>
                    {workUser && workUser.id > 0 && <Form
                            form={userForm}
                            name={"admin-user-edit"}
                            labelCol={{span: 8}}
                            wrapperCol={{span: 12}}
                            style={{maxWidth: 800}}
                            initialValues={{
                                id: workUser.id,
                                username: workUser.username,
                                firstName: workUser.firstName,
                                lastName: workUser.lastName,
                                status: workUser.status,
                                phoneNumber: workUser.phoneNumber,
                                privacy: workUser.privacy,
                                nextOfKin: workUser.nextOfKin,
                                registered: workUser.registered,
                                roles: workUser.roles,
                                language: workUser.language
                            }}
                            onFinish={updateUser}
                            onFinishFailed={updateUserFailed}
                            scrollToFirstError={true}
                            autoComplete={"off"}
                            disabled={invalidForm}
                    >
                        <Form.Item name={"id"} label="ID" style={{display: "none"}}>
                            <Input type="text"/>
                        </Form.Item>
                        <Form.Item name={"username"} label="ID" style={{display: "none"}}>
                            <Input type="text"/>
                        </Form.Item>
                        <UserFields username={workUser.username} userId={workUser.id} isOrganizer={checkRoles(workUser.roles, [RoleEnum.ROLE_ORGANIZER])}/>
                        <Form.Item name={"status"} required label={t("AdminOrgUser.form.status.label")}
                                   tooltip={t("AdminOrgUser.form.status.tooltip")}
                                   rules={[
                                       {
                                           required: true,
                                           message: t("AdminOrgUser.form.status.rule1")
                                       }
                                   ]}>
                            <Select options={statusTypes}/>
                        </Form.Item>
                        <Form.Item name={"roles"} label={t("AdminOrgUser.form.roles.label")}>
                            <Checkbox.Group style={{width: "100%"}}>
                                <Row>
                                    <Col span={6}>
                                        <Checkbox value="ROLE_USER" style={{lineHeight: "32px"}}>{t("AdminOrgUser.form.roles.member")}</Checkbox>
                                    </Col>
                                    <Col span={12}>
                                        <Checkbox value="ROLE_ORGANIZER" style={{lineHeight: "32px"}}>{t("AdminOrgUser.form.roles.organizer")}</Checkbox>
                                    </Col>
                                    <Col span={6}>
                                        <Checkbox value="ROLE_ADMIN" style={{lineHeight: "32px"}}>{t("AdminOrgUser.form.roles.administrator")}</Checkbox>
                                    </Col>
                                </Row>
                            </Checkbox.Group>
                        </Form.Item>

                        <Space direction={"horizontal"} size={12} style={{width: "100%", justifyContent: "center"}}>
                            <Button
                                    type={"primary"}
                                    htmlType={"submit"}
                                    disabled={loading}
                            >{t("AdminOrgUser.form.button.update")}</Button>
                            <Button
                                    type={"default"}
                                    htmlType={"reset"}
                                    disabled={loading}
                            >{t("AdminOrgUser.form.button.reset")}</Button>
                            <Button
                                    type={"dashed"}
                                    danger onClick={sendPasswordEmail}
                                    disabled={loading}
                            >{t("AdminOrgUser.form.button.sendPasswordEmail")}</Button>
                        </Space>
                    </Form>}
                </Spin>
            </div>
    );
}