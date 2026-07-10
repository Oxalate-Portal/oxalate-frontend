import {useEffect, useState} from "react";
import {type RadioChangeEvent, Select} from "antd";
import {Button, Form, Input, InputNumber, message, Radio, Select, Space, Spin, Typography} from "antd";
import {useTranslation} from "react-i18next";
import type {ListUserResponse, MessageRequest} from "../../models";
import {RoleEnum, UpdateStatusEnum} from "../../models";
import {NotificationGroupEnum, NotificationGroupLabels} from "../../models/NotificationGroupEnum";
import {notificationAPI, userAPI} from "../../services";

type NotificationMode = "sendAll" | "recipients" | "group";

interface AdminNotificationsProps {
    participantIds?: number[];
    onNotificationSent?: () => void;
    onCancel?: () => void;
    embedded?: boolean;
}

export function AdminNotifications({participantIds, onNotificationSent, onCancel, embedded = false}: AdminNotificationsProps) {
    const {t} = useTranslation();
    const [loading, setLoading] = useState<boolean>(false);
    const [users, setUsers] = useState<ListUserResponse[]>([]);
    const [notificationForm] = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();
    const [notificationMode, setNotificationMode] = useState<NotificationMode>("recipients");
    const [selectedGroup, setSelectedGroup] = useState<NotificationGroupEnum | undefined>();

    // Determine if we're in participant mode (pre-selected recipients)
    const hasParticipants = participantIds && participantIds.length > 0;

    useEffect(() => {
        // Skip fetching users if we have pre-selected participants
        if (hasParticipants) {
            return;
        }

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

    function onFinish(values: {
        recipients?: number[],
        title: string,
        message: string,
        notificationMode?: NotificationMode,
        notificationGroup?: NotificationGroupEnum,
        inactiveDays?: number
    }) {
        // Skip validation if we have pre-selected participants
        if (!hasParticipants) {
            const mode = values.notificationMode || notificationMode;
            if (mode === "sendAll") {
                // sendAll is allowed for admin only (enforced by backend)
            } else if (mode === "group") {
                if (!values.notificationGroup) {
                    messageApi.error(t("AdminNotifications.errorNoGroup"));
                    return;
                }
                if (values.notificationGroup === NotificationGroupEnum.INACTIVE_DAYS && !values.inactiveDays) {
                    messageApi.error(t("AdminNotifications.errorNoInactiveDays"));
                    return;
                }
            } else if (!values.recipients || values.recipients.length === 0) {
                messageApi.error(t("AdminNotifications.errorNoRecipients"));
                return;
            }
        }

        setLoading(true);

        const mode = hasParticipants ? "recipients" : (values.notificationMode || notificationMode);
        const messageRequest: MessageRequest = {
            id: 0,
            description: "",
            title: values.title,
            message: values.message,
            creator: 0, // Will be set by backend
        };

        if (mode === "sendAll") {
            messageRequest.sendAll = true;
        } else if (mode === "group") {
            messageRequest.notificationGroup = values.notificationGroup;
            messageRequest.inactiveDays = values.inactiveDays;
            messageRequest.sendAll = false;
        } else {
            messageRequest.recipients = hasParticipants ? participantIds : values.recipients;
            messageRequest.sendAll = false;
        }

        notificationAPI.createBulkNotifications(messageRequest)
                .then((response) => {
                    if (response.status === UpdateStatusEnum.OK) {
                        messageApi.success(t("AdminNotifications.success"));
                        notificationForm.resetFields();
                        setNotificationMode("recipients");
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

    const handleModeChange = (e: RadioChangeEvent) => {
        const value = e.target.value as NotificationMode;
        setNotificationMode(value);
        if (value === "sendAll") {
            notificationForm.setFieldsValue({recipients: []});
        } else if (value === "group") {
            notificationForm.setFieldsValue({recipients: []});
        } else if (value === "recipients") {
            notificationForm.setFieldsValue({notificationGroup: undefined, inactiveDays: undefined});
            setSelectedGroup(undefined);
        }
    };

    return (
            <div className={embedded ? "" : "darkDiv"}>
                {contextHolder}
                <Space orientation={"vertical"} size={16} style={{width: "100%"}}>
                    {!embedded && <Typography.Title level={2}>{t("AdminNotifications.title")}</Typography.Title>}
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
                                initialValues={{notificationMode: "recipients"}}
                        >
                            {!hasParticipants && (
                                    <Form.Item label={t("AdminNotifications.form.notificationMode.label")}>
                                        <Radio.Group value={notificationMode} onChange={handleModeChange}>
                                            <Radio value="recipients">{t("AdminNotifications.form.notificationMode.recipients")}</Radio>
                                            <Radio value="sendAll">{t("AdminNotifications.form.notificationMode.sendAll")}</Radio>
                                            <Radio value="group">{t("AdminNotifications.form.notificationMode.group")}</Radio>
                                        </Radio.Group>
                                    </Form.Item>
                            )}

                            {!hasParticipants && notificationMode === "recipients" && (
                                    <Form.Item
                                            name="recipients"
                                            label={t("AdminNotifications.form.recipients.label")}
                                            rules={[
                                                {
                                                    validator: (_, value) => {
                                                        if (value && value.length > 0) {
                                                            return Promise.resolve();
                                                        }
                                                        return Promise.reject(new Error(t("AdminNotifications.form.recipients.required")));
                                                    }
                                                }
                                            ]}
                                    >
                                        <Select
                                                mode="multiple"
                                                placeholder={t("AdminNotifications.form.recipients.placeholder")}
                                                showSearch={{optionFilterProp: "label"}}
                                                options={users.map(user => ({
                                                    value: user.id,
                                                    label: user.name
                                                }))}
                                                style={{width: "100%"}}
                                        />
                                    </Form.Item>
                            )}

                            {!hasParticipants && notificationMode === "group" && (
                                    <>
                                        <Form.Item
                                                name="notificationGroup"
                                                label={t("AdminNotifications.form.notificationGroup.label")}
                                                rules={[{required: true, message: t("AdminNotifications.form.notificationGroup.required")}]}
                                        >
                                            <Select
                                                    placeholder={t("AdminNotifications.form.notificationGroup.placeholder")}
                                                    onChange={(value: NotificationGroupEnum) => setSelectedGroup(value)}
                                                    options={Object.entries(NotificationGroupEnum).map(([, value]) => ({
                                                        value: value,
                                                        label: t(NotificationGroupLabels[value as NotificationGroupEnum])
                                                    }))}
                                                    style={{width: "100%"}}
                                            />
                                        </Form.Item>

                                        {selectedGroup === NotificationGroupEnum.INACTIVE_DAYS && (
                                                <Form.Item
                                                        name="inactiveDays"
                                                        label={t("AdminNotifications.form.inactiveDays.label")}
                                                        rules={[
                                                            {required: true, message: t("AdminNotifications.form.inactiveDays.required")},
                                                            {type: "number", min: 1, message: t("AdminNotifications.form.inactiveDays.min")}
                                                        ]}
                                                >
                                                    <InputNumber
                                                            min={1}
                                                            placeholder={t("AdminNotifications.form.inactiveDays.placeholder")}
                                                            style={{width: "100%"}}
                                                    />
                                                </Form.Item>
                                        )}
                                    </>
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
                                    rules={[
                                        {required: true, message: t("AdminNotifications.form.message.required")},
                                        {min: 5, message: t("AdminNotifications.form.message.min")}
                                    ]}
                            >
                                <Input.TextArea
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
                                        setNotificationMode("recipients");
                                        setSelectedGroup(undefined);
                                        if (onCancel) {
                                            onCancel();
                                        }
                                    }}>
                                        {embedded ? t("common.button.cancel") : t("AdminNotifications.form.reset")}
                                    </Button>
                                </Space>
                            </Form.Item>
                        </Form>
                    </Spin>
                </Space>
            </div>
    );
}
