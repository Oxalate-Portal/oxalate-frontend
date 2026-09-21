import {useParams} from "react-router-dom";
import {type SyntheticEvent, useEffect, useState} from "react";
import {type AdminUserRequest, type AdminUserResponse, ResultEnum, RoleEnum, UserStatusEnum} from "../../models";
import {useTranslation} from "react-i18next";
import {useResponsiveFormLayout} from "../main";
import {authAPI, userAPI} from "../../services";
import {Button, Checkbox, Col, Form, Input, message, Row, Select, Space, Spin} from "antd";
import {UserFields} from "../User";
import {checkRoles} from "../../tools";

export function AdminOrgUser() {
    const {paramId} = useParams();
    const [workUser, setWorkUser] = useState<AdminUserResponse | null>(null);
    const [blockSendEmail, setBlockSendEmail] = useState(false);
    const [loading, setLoading] = useState(true);
    const [invalidForm, setInvalidForm] = useState(false);
    const {t} = useTranslation();
    const formLayout = useResponsiveFormLayout(8, 12);
    const [userForm] = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();

    const statusTypes = [
        {value: UserStatusEnum.REGISTERED, label: t("common.userStatus.registered")},
        {value: UserStatusEnum.ACTIVE, label: t("common.userStatus.active")},
        {value: UserStatusEnum.LOCKED, label: t("common.userStatus.locked")},
        {value: UserStatusEnum.ANONYMIZED, label: t("common.userStatus.anonymized")}
    ];

    useEffect(() => {
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
                if (response.status === ResultEnum.OK) {
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

        const postData: AdminUserRequest = {
            id: userInfo.id,
            username: userInfo.username,
            first_name: userInfo.first_name,
            last_name: userInfo.last_name,
            status: userInfo.status,
            phone_number: userInfo.phone_number,
            next_of_kin: userInfo.next_of_kin,
            privacy: userInfo.privacy,
            registered: userInfo.registered,
            roles: userInfo.roles,
            language: userInfo.language,
            primary_user_type: userInfo.primary_user_type,
            approved_terms: userInfo.approved_terms,
            health_statement_id: userInfo.health_statement_id
        };

        userAPI.adminUpdateUser(postData)
            .then((response) => {
                setWorkUser(response);
                messageApi.success(t("AdminOrgUser.updateUser.ok"));
            })
            .catch(e => {
                console.error("Failed to update user, error: " + e.message);
                messageApi.error(t("AdminOrgUser.updateUser.fail"));
            })
            .finally(() => {
                setLoading(false);
            });
    }

    function updateUserFailed(errorInfo: { errorFields: { errors: string[] }[] }) {
        console.error("Failed:", errorInfo);
    }

    return (
        <div className={"darkDiv"}>
            {contextHolder}
            <Spin spinning={loading}>
                {workUser && workUser.id > 0 && <Form
                    form={userForm}
                    name={"admin-user-edit"}
                    {...formLayout}
                    style={{maxWidth: 800}}
                    initialValues={{
                        id: workUser.id,
                        username: workUser.username,
                        first_name: workUser.first_name,
                        last_name: workUser.last_name,
                        status: workUser.status,
                        phone_number: workUser.phone_number,
                        privacy: workUser.privacy,
                        next_of_kin: workUser.next_of_kin,
                        registered: workUser.registered,
                        roles: workUser.roles,
                        language: workUser.language,
                        // add missing fields so Select shows the current value
                        primary_user_type: workUser.primary_user_type,
                        approved_terms: workUser.approved_terms
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
                    <p>{t("User.form.certificateClassification.label")}: {workUser.certificate_classification_title || t("User.form.certificateClassification.none")}</p>
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
                                    <Checkbox value="ROLE_USER" style={{lineHeight: "32px"}}>{t("common.roles.role_user")}</Checkbox>
                                </Col>
                                <Col span={12}>
                                    <Checkbox value="ROLE_ORGANIZER" style={{lineHeight: "32px"}}>{t("common.roles.role_organizer")}</Checkbox>
                                </Col>
                                <Col span={6}>
                                    <Checkbox value="ROLE_ADMIN" style={{lineHeight: "32px"}}>{t("common.roles.role_admin")}</Checkbox>
                                </Col>
                            </Row>
                        </Checkbox.Group>
                    </Form.Item>

                    <Space orientation={"horizontal"} size={12} style={{width: "100%", justifyContent: "center"}}>
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
