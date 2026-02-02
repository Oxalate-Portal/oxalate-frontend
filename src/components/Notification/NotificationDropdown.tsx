import {useCallback, useEffect, useState} from "react";
import {Badge, Button, Dropdown, Empty, List, Modal, Space, Typography} from "antd";
import {BellOutlined, LeftOutlined, RightOutlined} from "@ant-design/icons";
import {useTranslation} from "react-i18next";
import {NavLink} from "react-router-dom";
import type {MessageResponse} from "../../models";
import {notificationAPI} from "../../services";
import dayjs from "dayjs";

const {Text} = Typography;

interface NotificationDropdownProps {
    pollInterval?: number; // in milliseconds, default 5 minutes
}

export function NotificationDropdown({pollInterval = 300000}: NotificationDropdownProps) {
    const {t} = useTranslation();
    const [notifications, setNotifications] = useState<MessageResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [selectedNotificationIndex, setSelectedNotificationIndex] = useState<number>(0);
    const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

    const fetchUnreadNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const unreadNotifications = await notificationAPI.getUnreadNotifications();
            setNotifications(unreadNotifications);
        } catch (error) {
            console.error("Failed to fetch unread notifications:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUnreadNotifications();

        // Set up polling interval
        const intervalId = setInterval(fetchUnreadNotifications, pollInterval);

        return () => {
            clearInterval(intervalId);
        };
    }, [fetchUnreadNotifications, pollInterval]);

    const handleNotificationClick = async (notification: MessageResponse, index: number) => {
        setSelectedNotificationIndex(index);
        setModalOpen(true);
        setDropdownOpen(false);

        // Mark the notification as read
        try {
            await notificationAPI.markNotificationsAsRead({messageIds: [notification.id]});
            // Update local state to reflect the read status
            setNotifications(prev => prev.filter(n => n.id !== notification.id));
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        }
    };

    const handlePreviousNotification = () => {
        if (selectedNotificationIndex > 0) {
            setSelectedNotificationIndex(prev => prev - 1);
        }
    };

    const handleNextNotification = () => {
        if (selectedNotificationIndex < notifications.length - 1) {
            setSelectedNotificationIndex(prev => prev + 1);
        }
    };

    const truncateMessage = (message: string, maxLength: number = 50): string => {
        if (message.length <= maxLength) {
            return message;
        }
        return message.substring(0, maxLength) + "...";
    };

    const selectedNotification = notifications[selectedNotificationIndex];

    const dropdownContent = (
            <div style={{width: 350, maxHeight: 400, overflow: "auto", backgroundColor: "#1f1f1f", borderRadius: 8, padding: 8}}>
                <div style={{padding: "8px 16px", borderBottom: "1px solid #303030"}}>
                    <Text strong>{t("NotificationDropdown.title")}</Text>
                </div>
                {notifications.length === 0 ? (
                        <Empty
                                description={t("NotificationDropdown.noNotifications")}
                                style={{padding: 24}}
                        />
                ) : (
                        <List
                                loading={loading}
                                dataSource={notifications}
                                renderItem={(notification, index) => (
                                        <List.Item
                                                key={notification.id}
                                                onClick={() => handleNotificationClick(notification, index)}
                                                style={{
                                                    cursor: "pointer",
                                                    padding: "12px 16px",
                                                    borderBottom: "1px solid #303030"
                                                }}
                                                className="notification-item"
                                        >
                                            <List.Item.Meta
                                                    title={<Text strong>{notification.title}</Text>}
                                                    description={
                                                        <Space direction="vertical" size={0}>
                                                            <Text type="secondary">{truncateMessage(notification.message)}</Text>
                                                            <Text type="secondary" style={{fontSize: 12}}>
                                                                {dayjs(notification.createdAt).format("YYYY-MM-DD HH:mm")}
                                                            </Text>
                                                        </Space>
                                                    }
                                            />
                                        </List.Item>
                                )}
                        />
                )}
                <div style={{padding: "8px 16px", borderTop: "1px solid #303030", textAlign: "center"}}>
                    <NavLink to="/notifications" onClick={() => setDropdownOpen(false)}>
                        {t("NotificationDropdown.viewAll")}
                    </NavLink>
                </div>
            </div>
    );

    return (
            <>
                <Dropdown
                        open={dropdownOpen}
                        onOpenChange={setDropdownOpen}
                        dropdownRender={() => dropdownContent}
                        trigger={["click"]}
                        placement="bottomRight"
                >
                    <Badge count={notifications.length} size="small" offset={[-5, 5]}>
                        <BellOutlined
                                style={{
                                    fontSize: 20,
                                    cursor: "pointer",
                                    color: "#E0E0E0",
                                    padding: "8px"
                                }}
                        />
                    </Badge>
                </Dropdown>

                <Modal
                        title={selectedNotification?.title}
                        open={modalOpen}
                        onCancel={() => setModalOpen(false)}
                        footer={
                            <Space>
                                <Button
                                        icon={<LeftOutlined/>}
                                        onClick={handlePreviousNotification}
                                        disabled={selectedNotificationIndex === 0}
                                >
                                    {t("NotificationDropdown.modal.previous")}
                                </Button>
                                <Button
                                        icon={<RightOutlined/>}
                                        onClick={handleNextNotification}
                                        disabled={selectedNotificationIndex === notifications.length - 1}
                                        iconPosition="end"
                                >
                                    {t("NotificationDropdown.modal.next")}
                                </Button>
                                <Button type="primary" onClick={() => setModalOpen(false)}>
                                    {t("NotificationDropdown.modal.close")}
                                </Button>
                            </Space>
                        }
                        width={600}
                >
                    {selectedNotification && (
                            <Space direction="vertical" style={{width: "100%"}}>
                                <Text type="secondary">
                                    {dayjs(selectedNotification.createdAt).format("YYYY-MM-DD HH:mm")}
                                </Text>
                                <div style={{whiteSpace: "pre-wrap"}}>{selectedNotification.message}</div>
                            </Space>
                    )}
                </Modal>
            </>
    );
}
