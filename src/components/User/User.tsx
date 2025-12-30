import {useSession} from "../../session";
import {useEffect, useState} from "react";
import {Button, Checkbox, Col, Form, Input, message, Row, Space, Spin} from "antd";
import {useTranslation} from "react-i18next";
import {checkRoles} from "../../tools";
import {FormMemberships, FormPayments, ProfileCollapse, UserFields} from "./index";
import {type AdminUserRequest, type AdminUserResponse, RoleEnum, type UserResponse, type UserSessionToken, UserStatusEnum} from "../../models";
import {adminUserAPI, userAPI} from "../../services";

export function User() {
    const {userSession, logoutUser, refreshUserSession} = useSession();
    const [loading, setLoading] = useState(true);
    const {t} = useTranslation();
    const [workUser, setWorkUser] = useState<AdminUserResponse>();
    const [userForm] = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();

    useEffect(() => {
        const fetchMemberData = async () => {
            setLoading(true);

            if (userSession) {

                adminUserAPI.findById(userSession?.id, null)
                        .then((response) => {
                            setWorkUser(JSON.parse(JSON.stringify(response)));
                        })
                        .catch((error) => {
                            console.error("Error fetching:", error);
                            messageApi.error(error);
                        });
            } else {
                console.error("No userSession found");
            }
            setLoading(false);
        };

        fetchMemberData().catch(console.error);
    }, [userSession]);

    function requestStatusUpdate(status: UserStatusEnum) {
        setLoading(true);

        if (workUser?.id === undefined) {
            console.error("No user ID found");
            return;
        }

        userAPI.updateUserStatus(workUser?.id, status)
                .then((_response) => {
                    messageApi.success(t("User.updateStatus.ok"));
                })
                .catch(e => {
                    console.error(e);
                    messageApi.error(t("User.updateStatus.fail"));
                });
        setLoading(false);
    }

    const requestAnonymization = () => {
        if (window.confirm(t("User.requestAnonymization.confirm"))) {
            requestStatusUpdate(UserStatusEnum.ANONYMIZED);
            logoutUser();
        }
    };

    const requestLocking = () => {
        if (window.confirm(t("User.requestLocking.confirm"))) {
            requestStatusUpdate(UserStatusEnum.LOCKED);
            logoutUser();
        }
    };

    function onFinish(userInfo: UserResponse): void {
        setLoading(true);

        if (workUser?.id === undefined) {
            console.error("No user ID found");
            return;
        }
        // We send all data, but only some of them will in this case be used, see backend for more details when a user sends the request
        // TODO This is duplicated from adminOrgMember.jsx, refactor this
        let postData: AdminUserRequest = {
            id: workUser.id,
            username: workUser.username,
            firstName: userInfo.firstName,
            lastName: userInfo.lastName,
            status: workUser.status,
            phoneNumber: userInfo.phoneNumber,
            privacy: userInfo.privacy,
            approvedTerms: workUser.approvedTerms,
            primaryUserType: userInfo.primaryUserType,
            nextOfKin: userInfo.nextOfKin,
            registered: workUser.registered,
            roles: workUser.roles,
            language: userInfo.language
        };

        adminUserAPI.update(postData)
                .then((response) => {
                    const newUserSession: UserSessionToken = {
                        id: response.id,
                        username: response.username,
                        firstName: response.firstName,
                        lastName: response.lastName,
                        phoneNumber: response.phoneNumber,
                        registered: response.registered,
                        diveCount: response.diveCount,
                        accessToken: userSession === null ? "" : userSession.accessToken,
                        type: userSession === null ? "" : userSession.type,
                        expiresAt: userSession === null ? new Date() : userSession.expiresAt,
                        roles: response.roles,
                        language: response.language,
                        status: response.status,
                        approvedTerms: response.approvedTerms,
                        privacy: response.privacy,
                        nextOfKin: response.nextOfKin,
                        primaryUserType: response.primaryUserType,
                        payments: response.payments,
                        memberships: response.memberships
                    };
                    refreshUserSession(newUserSession);
                    messageApi.success(t("User.update.ok"));
                    setLoading(false);
                })
                .catch(e => {
                    console.error(e);
                    messageApi.error(t("User.update.fail"));
                    setLoading(false);
                });
    }

    function onFinishFailed(errorInfo: any) {
        console.error("Failed:", errorInfo);
        setLoading(false);
    }

    return (
            <div className={"darkDiv"}>
                {contextHolder}
                <h4>{userSession?.username} {t("User.title")}:</h4>

                <Spin spinning={loading}>
                    {workUser && workUser.id > 0 && <Form
                            form={userForm}
                            name={"user-info"}
                            key={"user-info"}
                            labelCol={{span: 8}}
                            wrapperCol={{span: 12}}
                            style={{maxWidth: 900}}
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
                                language: workUser.language,
                                primaryUserType: workUser.primaryUserType
                            }}
                            onFinish={onFinish}
                            onFinishFailed={onFinishFailed}
                            scrollToFirstError={true}
                            autoComplete="off"
                    >
                        <Form.Item name={"id"}
                                   label={"ID"}
                                   key={"id"}
                                   style={{display: "none"}}>
                            <Input type="text"/>
                        </Form.Item>
                        <Form.Item name={"username"}
                                   label={"username"}
                                   key={"username"}
                                   style={{display: "none"}}>
                            <Input type="text"/>
                        </Form.Item>
                        {userSession && workUser && <UserFields userId={workUser.id} username={workUser.username}
                                                                isOrganizer={checkRoles(userSession.roles, [RoleEnum.ROLE_ORGANIZER])} key={"userFields"}/>}
                        <Form.Item label={t("User.form.status.label")} key={"status"}>
                            <span className="ant-form-text">{workUser.status}</span>
                        </Form.Item>
                        <Form.Item label={t("User.form.terms.label")} key={"terms"}>
                            <span className="ant-form-text">{workUser.approvedTerms ? t("User.form.terms.true") : t("User.form.terms.false")}</span>
                        </Form.Item>
                        <Form.Item name={"roles"}
                                   label={t("User.form.roles.label")}
                                   key={"roles"}
                                   tooltip={t("User.form.roles.tooltip")}
                        >
                            <Checkbox.Group style={{width: "100%"}}>
                                <Row key={"roles-row"}>
                                    <Col span={6} key={"roles-col-user"}>{/* These checkboxes are supposed to be disabled and are meant just for viewing */}
                                        <Checkbox value="ROLE_USER" style={{lineHeight: "32px"}} disabled>{t("common.roles.role_user")}</Checkbox>
                                    </Col>
                                    <Col span={12} key={"roles-col-organizer"}>
                                        <Checkbox value="ROLE_ORGANIZER" style={{lineHeight: "32px"}} disabled>{t("common.roles.role_organizer")}</Checkbox>
                                    </Col>
                                    <Col span={6} key={"roles-col-admin"}>
                                        <Checkbox value="ROLE_ADMIN" style={{lineHeight: "32px"}} disabled>{t("common.roles.role_admin")}</Checkbox>
                                    </Col>
                                </Row>
                            </Checkbox.Group>
                        </Form.Item>
                        <Form.Item label={t("User.form.membership.label")}
                                   key={"membership"}
                                   tooltip={t("User.form.membership.tooltip")}
                        >
                            {workUser.memberships.length > 0 ? <FormMemberships membershipList={workUser.memberships} key={"membership-form"}/> :
                                    <span>{t("User.form.membership.none")}</span>}
                        </Form.Item>
                        <Form.Item name={"payments"}
                                   label={t("User.form.payments.label")}
                                   key={"payments"}
                                   tooltip={t("User.form.payments.tooltip")}
                        >
                            <FormPayments userData={workUser} key={"payments-format"}/>
                        </Form.Item>
                        <Space orientation={"horizontal"} size={12} style={{width: "100%", justifyContent: "center"}} key={"button-space"}>
                            <Button
                                    type={"primary"}
                                    htmlType={"submit"}
                                    disabled={loading}
                                    key={"submit-button"}
                            >{t("common.button.update")}</Button>
                            <Button
                                    type={"default"}
                                    htmlType={"reset"}
                                    disabled={loading}
                                    key={"reset-button"}
                            >{t("common.button.reset")}</Button>
                            {!workUser.approvedTerms && <Button
                                    type={"default"}
                                    href={"/"}
                                    disabled={loading}
                                    key={"terms-button"}
                            >{t("User.button.acceptTerms")}</Button>}
                            <Button
                                    type={"dashed"}
                                    danger onClick={requestLocking}
                                    disabled={loading}
                                    key={"lock-button"}
                            >{t("User.button.lockAccount")}</Button>
                            <Button
                                    type={"primary"}
                                    danger onClick={requestAnonymization}
                                    disabled={loading}
                                    key={"anonymize-button"}
                            >{t("User.button.anonymizeAccount")}</Button>
                            {!workUser.approvedTerms && <Button
                                    danger={true}
                                    type={"dashed"} onClick={logoutUser}
                                    href={"/"}
                                    disabled={loading}
                                    key={"logout-button"}
                            >{t("common.button.logout")}</Button>}
                        </Space>
                    </Form>}

                    <p style={{height: 30}}></p>

                    {workUser && <ProfileCollapse userId={workUser.id} viewOnly={false}/>}
                </Spin>
            </div>
    );
}
