import {useEffect, useState} from "react";
import {Button, Checkbox, Form, Input, message, Select, Space, Spin, Typography} from "antd";
import {useTranslation} from "react-i18next";
import type {ListUserResponse, MessageRequest} from "../../models";
import {RoleEnum, UpdateStatusEnum} from "../../models";
import {notificationAPI, userAPI} from "../../services";

const {TextArea} = Input;
const {Title} = Typography;

interface AdminNotificationsProps {
    participantIds?: number[];
    onNotificationSent?: () => void;
    embedded?: boolean;
}

export function AdminNotifications({participantIds, onNotificationSent, embedded = false}: AdminNotificationsProps) {
    const {t} = useTranslation();
    const [loading, setLoading] = useState<boolean>(false);
    const [users, setUsers] = useState<ListUserResponse[]>([]);
    const [sendToAll, setSendToAll] = useState<boolean>(false);
    const [notificationForm] = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();

    // Determine if we're in participant mode (pre-selected recipients)
    const hasParticipants = participantIds && participantIds.length > 0;

    useEffect(() => {
        // Skip fetching users if we have pre-selected participants
        if (hasParticipants) {
            return;
        }

        setLoading(true);
        userAPI.findByRole(RoleEnum.ROLE_USER)
                .then((userResponses) => {
                    setUsers(userResponses);
                })
                .catch((error) => {
                    console.error("Failed to get users:", error);
                    messageApi.error(t("AdminNotifications.errorGetUsers"));
                })
                .finally(() => {
                    setLoading(false);
                });
    }, [t, messageApi, hasParticipants]);

    function onFinish(values: { recipients?: number[], title: string, message: string, sendAll: boolean }) {
        // Skip validation if we have pre-selected participants
        if (!hasParticipants && !values.sendAll && (!values.recipients || values.recipients.length === 0)) {
            messageApi.error(t("AdminNotifications.errorNoRecipients"));
            return;
        }

        setLoading(true);

        const messageRequest: MessageRequest = {
            id: 0,
            description: "",
            title: values.title,
            message: values.message,
            creator: 0, // Will be set by backend
            recipients: hasParticipants ? participantIds : (values.sendAll ? undefined : values.recipients),
            sendAll: hasParticipants ? false : values.sendAll
        };

        notificationAPI.createBulkNotifications(messageRequest)
                .then((response) => {
                    if (response.status === UpdateStatusEnum.OK) {
                        messageApi.success(t("AdminNotifications.success"));
                        notificationForm.resetFields();
                        setSendToAll(false);
                        // Call the callback if provided (e.g., to close the modal)
                        if (onNotificationSent) {
                            onNotificationSent();
                        }
                    } else {
                        messageApi.error(t("AdminNotifications.error") + " " + response.message);
                    }
                })
                .catch((error) => {
                    console.error("Failed to send notifications:", error);
                    messageApi.error(t("AdminNotifications.error") + " " + error.message);
                })
                .finally(() => {
                    setLoading(false);
                });
    }

    return (
            <div className={embedded ? "" : "darkDiv"}>
                {contextHolder}
                <Space orientation={"vertical"} size={16} style={{width: "100%"}}>
                    {!embedded && <Title level={2}>{t("AdminNotifications.title")}</Title>}
                    {hasParticipants && (
                            <Typography.Text>
                                {t("AdminNotifications.participantCount", {count: participantIds.length})}
                            </Typography.Text>
                    )}

                    <Spin spinning={loading}>
                        <Form
                                form={notificationForm}
                                layout="vertical"
                                onFinish={onFinish}
                                style={{maxWidth: 800}}
                                initialValues={{sendAll: false}}
                        >
                            {!hasParticipants && (
                                    <Form.Item
                                            name="sendAll"
                                            valuePropName="checked"
                                    >
                                        <Checkbox
                                                onChange={(e) => {
                                                    setSendToAll(e.target.checked);
                                                    if (e.target.checked) {
                                                        notificationForm.setFieldsValue({recipients: []});
                                                    }
                                                }}
                                        >
                                            {t("AdminNotifications.form.sendAll.label")}
                                        </Checkbox>
                                    </Form.Item>
                            )}

                            {!hasParticipants && (
                                    <Form.Item
                                            name="recipients"
                                            label={t("AdminNotifications.form.recipients.label")}
                                            rules={[
                                                {
                                                    validator: (_, value) => {
                                                        if (sendToAll || (value && value.length > 0)) {
                                                            return Promise.resolve();
                                                        }
                                                        return Promise.reject(new Error(t("AdminNotifications.form.recipients.required")));
                                                    }
                                                }
                                            ]}
                                    >
                                        <Select
                                                mode="multiple"
                                                disabled={sendToAll}
                                                placeholder={t("AdminNotifications.form.recipients.placeholder")}
                                                optionFilterProp="label"
                                                showSearch
                                                options={users.map(user => ({
                                                    value: user.id,
                                                    label: user.name
                                                }))}
                                                style={{width: "100%"}}
                                        />
                                    </Form.Item>
                            )}

                            <Form.Item
                                    name="title"
                                    label={t("AdminNotifications.form.title.label")}
                                    rules={[{required: true, message: t("AdminNotifications.form.title.required")}]}
                            >
                                <Input placeholder={t("AdminNotifications.form.title.placeholder")}/>
                            </Form.Item>

                            <Form.Item
                                    name="message"
                                    label={t("AdminNotifications.form.message.label")}
                                    rules={[{required: true, message: t("AdminNotifications.form.message.required")}]}
                            >
                                <TextArea
                                        rows={6}
                                        placeholder={t("AdminNotifications.form.message.placeholder")}
                                />
                            </Form.Item>

                            <Form.Item>
                                <Space>
                                    <Button type="primary" htmlType="submit" loading={loading}>
                                        {t("AdminNotifications.form.submit")}
                                    </Button>
                                    <Button onClick={() => {
                                        notificationForm.resetFields();
                                        setSendToAll(false);
                                    }}>
                                        {t("AdminNotifications.form.reset")}
                                    </Button>
                                </Space>
                            </Form.Item>
                        </Form>
                    </Spin>
                </Space>
            </div>
    );
}
