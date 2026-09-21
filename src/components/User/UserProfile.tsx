import {useSession} from "../../session";
import {useEffect, useState} from "react";
import {Button, Checkbox, Col, Form, Input, message, Modal, Row, Space, Spin} from "antd";
import {useTranslation} from "react-i18next";
import {checkRoles} from "../../tools";
import {FormMemberships} from "./FormMemberships";
import {FormPayments} from "./FormPayments";
import {ProfileCollapse} from "./ProfileCollapse";
import {UserAvatarManager} from "./UserAvatarManager";
import {UserDocumentFiles} from "./UserDocumentFiles";
import {UserFields} from "./UserFields";
import {type AdminUserRequest, type AdminUserResponse, RoleEnum, type UserResponse, type UserSessionToken, UserStatusEnum} from "../../models";
import {adminUserAPI, userAPI} from "../../services";
import {AcceptTerms, HealthStatementConfirmationModal, useResponsiveFormLayout} from "../main";

export function UserProfile() {
    const {userSession, logoutUser, refreshUserSession} = useSession();
    const [loading, setLoading] = useState(true);
    const {t} = useTranslation();
    const formLayout = useResponsiveFormLayout(8, 12);
    const [workUser, setWorkUser] = useState<AdminUserResponse>();
    const [userForm] = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [showHealthStatementModal, setShowHealthStatementModal] = useState(false);

    useEffect(() => {
        const fetchMemberData = async () => {
            setLoading(true);

            if (userSession) {

                adminUserAPI.findById(userSession?.id, null)
                        .then((response) => {
                            setWorkUser(JSON.parse(JSON.stringify(response)));
                            // Sync avatar into the shared session so NavigationBar always
                            // reflects the backend-authoritative URL (including null).
                            if (userSession.avatar_url !== response.avatar_url) {
                                refreshUserSession({...userSession, avatar_url: response.avatar_url});
                            }
                        })
                        .catch((error) => {
                            console.error("Error fetching:", error);
                            messageApi.error(error instanceof Error ? error.message : String(error));
                        });
            } else {
                console.error("No userSession found");
            }
            setLoading(false);
        };

        fetchMemberData().catch(console.error);
    }, [userSession, messageApi, refreshUserSession]);

    function requestStatusUpdate(status: UserStatusEnum) {
        setLoading(true);

        if (workUser?.id === undefined) {
            console.error("No user ID found");
            return;
        }

        userAPI.updateUserStatus(workUser?.id, status)
                .then(() => {
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

    function updateAcceptanceState(updates: Partial<Pick<AdminUserResponse, "approved_terms" | "health_statement_id">>) {
        setWorkUser((prevState) => prevState ? {...prevState, ...updates} : prevState);

        if (userSession) {
            const updatedSession: UserSessionToken = {...userSession, ...updates};
            refreshUserSession(updatedSession);
        }
    }

    async function handleTermsConfirmation(answer: boolean) {
        setLoading(true);

        try {
            await userAPI.acceptTerms({confirmation_answer: answer});
            updateAcceptanceState({approved_terms: answer});
            setShowTermsModal(false);
        } catch (error) {
            console.error(error);
            messageApi.error(t("AcceptTerms.error.alert"));
        } finally {
            setLoading(false);
        }
    }

    function onFinish(userInfo: UserResponse): void {
        setLoading(true);

        if (workUser?.id === undefined) {
            console.error("No user ID found");
            return;
        }
        // We send all data, but only some of them will in this case be used, see backend for more details when a user sends the request
        // TODO This is duplicated from adminOrgMember.jsx, refactor this
        const postData: AdminUserRequest = {
            id: workUser.id,
            username: workUser.username,
            avatar_url: workUser.avatar_url,
            first_name: userInfo.first_name,
            last_name: userInfo.last_name,
            status: workUser.status,
            phone_number: userInfo.phone_number,
            privacy: userInfo.privacy,
            approved_terms: workUser.approved_terms,
            health_statement_id: workUser.health_statement_id,
            primary_user_type: userInfo.primary_user_type,
            next_of_kin: userInfo.next_of_kin,
            registered: workUser.registered,
            roles: workUser.roles,
            language: userInfo.language
        };

        adminUserAPI.update(postData)
                .then((response) => {
                    const newUserSession: UserSessionToken = {
                        id: response.id,
                        username: response.username,
                        first_name: response.first_name,
                        last_name: response.last_name,
                        avatar_url: response.avatar_url,
                        phone_number: response.phone_number,
                        registered: response.registered,
                        dive_count: response.dive_count,
                        access_token: userSession === null ? "" : userSession.access_token,
                        type: userSession === null ? "" : userSession.type,
                        expires_at: userSession === null ? new Date() : userSession.expires_at,
                        roles: response.roles,
                        language: response.language,
                        status: response.status,
                        approved_terms: response.approved_terms,
                        health_statement_id: response.health_statement_id,
                        privacy: response.privacy,
                        next_of_kin: response.next_of_kin,
                        primary_user_type: response.primary_user_type,
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

    // @ts-expect-error Form validation error info type mismatch
    function onFinishFailed(errorInfo: ValidateErrorEntity<UserResponse>) {
        console.error("Failed:", errorInfo);
        setLoading(false);
    }

    return (
            <div className={"darkDiv"}>
                {contextHolder}
                <h4>{userSession?.username} {t("User.title")}:</h4>
                {workUser &&
                    <p>{t("User.form.certificateClassification.label")}: <b>{workUser.certificate_classification_title || t("User.form.certificateClassification.none")}</b>
                        </p>}

                <Spin spinning={loading}>
                    {workUser && workUser.id > 0 && <UserAvatarManager userId={workUser.id} initialAvatarUrl={workUser.avatar_url ?? null}/>}
                    {workUser && workUser.id > 0 && <Form
                            form={userForm}
                            name={"user-info"}
                            key={"user-info"}
                            {...formLayout}
                            style={{maxWidth: 900}}
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
                                primary_user_type: workUser.primary_user_type
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
                            <Space size={12}>
                                <span className="ant-form-text">{workUser.approved_terms ? t("User.form.terms.true") : t("User.form.terms.false")}</span>
                                {!workUser.approved_terms && <Button type={"default"}
                                                                    onClick={() => setShowTermsModal(true)}>{t("User.button.acceptTerms")}</Button>}
                            </Space>
                        </Form.Item>
                        <Form.Item label={t("User.form.healthStatement.label")} key={"healthStatement"}>
                            <Space size={12}>
                            <span
                                className="ant-form-text">{workUser.health_statement_id !== null ? t("User.form.healthStatement.true") : t("User.form.healthStatement.false")}</span>
                                {workUser.health_statement_id === null && <Button type={"default"}
                                                                                onClick={() => setShowHealthStatementModal(true)}>{t("User.button.confirmHealthStatement")}</Button>}
                            </Space>
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
                            {!workUser.approved_terms && <Button
                                    danger={true}
                                    type={"dashed"} onClick={logoutUser}
                                    href={"/"}
                                    disabled={loading}
                                    key={"logout-button"}
                            >{t("common.button.logout")}</Button>}
                        </Space>
                    </Form>}

                    <p style={{height: 30}}></p>

                    <Modal
                            cancelButtonProps={{danger: true}}
                            cancelText={t("common.button.reject")}
                            confirmLoading={loading}
                            footer={[
                                <Button danger={true} key={"reject-terms"} onClick={() => handleTermsConfirmation(false)}>
                                    {t("common.button.reject")}
                                </Button>,
                                <Button key={"confirm-terms"} loading={loading} type={"primary"} onClick={() => handleTermsConfirmation(true)}>
                                    {t("common.button.confirm")}
                                </Button>
                            ]}
                            okText={t("common.button.confirm")}
                            onCancel={() => setShowTermsModal(false)}
                            onOk={() => handleTermsConfirmation(true)}
                            open={showTermsModal}
                            title={t("User.form.terms.label")}
                            width={"80%"}
                    >
                        <AcceptTerms registration={true}/>
                    </Modal>
                    <HealthStatementConfirmationModal
                            open={showHealthStatementModal}
                            onConfirm={() => {
                                updateAcceptanceState({health_statement_id: 0});
                                setShowHealthStatementModal(false);
                            }}
                            onCancel={() => setShowHealthStatementModal(false)}
                    />

                    {workUser && <UserDocumentFiles userId={workUser.id}
                                                    creatorName={`${workUser.last_name}, ${workUser.first_name}`}
                                                    canUpload={true}/>}

                    {workUser && <ProfileCollapse userId={workUser.id} viewOnly={false}/>}
                </Spin>
            </div>
    );
}
