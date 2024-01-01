import {useSession} from "../../session";
import {useEffect, useState} from "react";
import {Button, Checkbox, Col, Form, Input, Row, Space, Spin} from "antd";
import {useTranslation} from "react-i18next";
import {checkRoles} from "../../helpers";
import {useNavigate} from "react-router-dom";
import {Certificates, FormatPayments, UserEvents, UserFields} from "./index";
import {RoleEnum, SessionVO, UpdateStatusEnum, UpdateStatusVO, UserStatusEnum} from "../../models";
import {UserResponse} from "../../models/responses";
import {UserRequest} from "../../models/requests";
import {SubmitResult} from "../main";
import {userAPI} from "../../services";

export function User() {
    const {userSession, logoutUser, refreshUserSession} = useSession();
    const [updateStatus, setUpdateStatus] = useState<UpdateStatusVO>({status: UpdateStatusEnum.NONE, message: ""});
    const [loading, setLoading] = useState(true);
    const {t} = useTranslation();
    const [workUser, setWorkUser] = useState<UserResponse>();
    const [userForm] = Form.useForm();

    useEffect(() => {
        const fetchMemberData = async () => {
            setLoading(true);

            if (userSession) {

                userAPI.findById(userSession?.id, null)
                        .then((response) => {
                            setWorkUser(JSON.parse(JSON.stringify(response)));
                        })
                        .catch((error) => {
                            console.error("Error fetching:", error);
                            setUpdateStatus({status: UpdateStatusEnum.FAIL, message: error});
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
                .then((response) => {
                    console.log(response);
                    setUpdateStatus({status: UpdateStatusEnum.OK, message: t('User.updateStatus.ok')});
                })
                .catch(e => {
                    console.log(e);
                    setUpdateStatus({status: UpdateStatusEnum.FAIL, message: t('User.updateStatus.fail')});
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
        let postData: UserRequest = {
            id: workUser.id,
            username: workUser.username,
            firstName: userInfo.firstName,
            lastName: userInfo.lastName,
            status: workUser.status,
            phoneNumber: userInfo.phoneNumber,
            privacy: userInfo.privacy,
            nextOfKin: userInfo.nextOfKin,
            registered: workUser.registered,
            approvedTerms: workUser.approvedTerms,
            roles: workUser.roles,
            payments: workUser.payments,
            diveCount: workUser.diveCount,
            language: userInfo.language
        };

        userAPI.update(postData)
                .then((response) => {
                    console.log("Update response:", response);

                    const newSession: SessionVO = {
                        id: response.id,
                        username: response.username,
                        firstName: response.firstName,
                        lastName: response.lastName,
                        phoneNumber: response.phoneNumber,
                        registered: response.registered,
                        diveCount: response.diveCount,
                        accessToken: userSession === null ? "" : userSession.accessToken,
                        type:  userSession === null ? "" : userSession.type,
                        expiresAt: userSession === null ? new Date() : userSession.expiresAt,
                        roles: response.roles,
                        language: response.language,
                        status: response.status,
                        approvedTerms: response.approvedTerms,
                        privacy: response.privacy,
                        payments: response.payments,
                        nextOfKin: response.nextOfKin
                    };
                    refreshUserSession(newSession);
                    setUpdateStatus({status: UpdateStatusEnum.OK, message: t("User.update.ok")});
                    setLoading(false);
                })
                .catch(e => {
                    console.log(e);
                    setUpdateStatus({status: UpdateStatusEnum.FAIL, message: t("User.update.fail")});
                    setLoading(false);
                });
    }

    function onFinishFailed(errorInfo: any) {
        console.log('Failed:', errorInfo);
        setLoading(false);
    }

    const navigate = useNavigate();

    if (updateStatus.status !== UpdateStatusEnum.NONE) {
        console.debug("Showing update result:", updateStatus);
        return <SubmitResult updateStatus={updateStatus} navigate={navigate}/>;
    } else {
        console.debug("Update status is:", updateStatus);
    }

    return (
            <div className={"darkDiv"}>
                <h4>{userSession?.username} {t("User.title")}:</h4>

                <Spin spinning={loading}>
                    {workUser && workUser.id > 0 && <Form
                            form={userForm}
                            name="user-info"
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
                            onFinish={onFinish}
                            onFinishFailed={onFinishFailed}
                            scrollToFirstError={true}
                            autoComplete="off"
                    >
                        <Form.Item name={"id"}
                                   label="ID"
                                   style={{display: "none"}}>
                            <Input type="text"/>
                        </Form.Item>
                        <Form.Item name={"username"}
                                   label="ID"
                                   style={{display: "none"}}>
                            <Input type="text"/>
                        </Form.Item>
                        {userSession && workUser && <UserFields userId={workUser.id} username={workUser.username} isOrganizer={checkRoles(userSession, [RoleEnum.ROLE_ORGANIZER])}/>}
                        <Form.Item label={t("User.form.status.label")}>
                            <span className="ant-form-text">{workUser.status}</span>
                        </Form.Item>
                        <Form.Item label={t("User.form.privacy.label")}>
                            <span className="ant-form-text">{workUser.privacy}</span>
                        </Form.Item>
                        <Form.Item name={"roles"} label={t("User.form.roles.label")}>
                            <Checkbox.Group style={{width: "100%"}}>
                                <Row>
                                    <Col span={6}>{/* These checkboxes are supposed to be disabled and are meant just for viewing */}
                                        <Checkbox value="ROLE_USER" style={{lineHeight: "32px"}} disabled>{t("common.roles.user")}</Checkbox>
                                    </Col>
                                    <Col span={12}>
                                        <Checkbox value="ROLE_ORGANIZER" style={{lineHeight: "32px"}} disabled>{t("common.roles.organizer")}</Checkbox>
                                    </Col>
                                    <Col span={6}>
                                        <Checkbox value="ROLE_ADMIN" style={{lineHeight: "32px"}} disabled>{t("common.roles.administrator")}</Checkbox>
                                    </Col>
                                </Row>
                            </Checkbox.Group>
                        </Form.Item>
                        <Form.Item name={"payments"} label={t("User.form.payments.label")}>
                            <FormatPayments userData={workUser}/>
                        </Form.Item>
                        <Space direction={"horizontal"} size={12} style={{width: "100%", justifyContent: "center"}}>
                            <Button
                                    type={"primary"}
                                    htmlType={"submit"}
                                    disabled={loading}
                            >{t("common.button.update")}</Button>
                            <Button
                                    type={"default"}
                                    htmlType={"reset"}
                                    disabled={loading}
                            >{t("common.button.reset")}</Button>
                            {!workUser.approvedTerms && <Button
                                    type={"default"}
                                    href={"/"}
                                    disabled={loading}
                            >{t("User.button.acceptTerms")}</Button>}
                            <Button
                                    type={"dashed"}
                                    danger onClick={requestLocking}
                                    disabled={loading}
                            >{t("User.button.lockAccount")}</Button>
                            <Button
                                    type={"primary"}
                                    danger onClick={requestAnonymization}
                                    disabled={loading}
                            >{t("User.button.anonymizeAccount")}</Button>
                            {!workUser.approvedTerms && <Button
                                    danger={true}
                                    type={"dashed"} onClick={logoutUser}
                                    href={"/"}
                                    disabled={loading}
                            >{t("common.button.logout")}</Button>}
                        </Space>
                    </Form>}

                    <p style={{height: 30}}></p>

                    {workUser && workUser.id && <Certificates userId={workUser?.id}/>}
                    {workUser && workUser.id && <UserEvents userId={workUser.id}/>}
                </Spin>
            </div>
    );
}
