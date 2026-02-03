import {useEffect, useState} from "react";
import {List, Pagination, Space, Spin, Tag, Typography} from "antd";
import {useTranslation} from "react-i18next";
import {useLocation} from "react-router-dom";
import type {MessageResponse} from "../../models";
import {notificationAPI} from "../../services";
import dayjs from "dayjs";

const {Text, Title} = Typography;

const PAGE_SIZE = 100;

export function NotificationList() {
    const {t} = useTranslation();
    const location = useLocation();
    const [notifications, setNotifications] = useState<MessageResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [currentPage, setCurrentPage] = useState<number>(1);

    useEffect(() => {
        const fetchAllNotifications = async () => {
            try {
                setLoading(true);
                const allNotifications = await notificationAPI.getAllNotifications();
                setNotifications(allNotifications);
            } catch (error) {
                console.error("Failed to fetch all notifications:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllNotifications();
    }, [location.key]); // Re-fetch when navigation occurs

    const handleMarkAsRead = async (notification: MessageResponse) => {
        if (notification.read) {
            return;
        }

        try {
            await notificationAPI.markNotificationsAsRead({messageIds: [notification.id]});
            // Update local state
            setNotifications(prev =>
                    prev.map(n => n.id === notification.id ? {...n, read: true} : n)
            );
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        }
    };

    const paginatedNotifications = notifications.slice(
            (currentPage - 1) * PAGE_SIZE,
            currentPage * PAGE_SIZE
    );

    return (
            <div className="darkDiv">
                <Space orientation={"vertical"} size={16} style={{width: "100%"}}>
                    <Title level={2}>{t("NotificationList.title")}</Title>

                    <Spin spinning={loading}>
                        <List
                                dataSource={paginatedNotifications}
                                locale={{emptyText: t("NotificationList.noNotifications")}}
                                renderItem={(notification) => (
                                        <List.Item
                                                key={notification.id}
                                                onClick={() => handleMarkAsRead(notification)}
                                                style={{
                                                    cursor: notification.read ? "default" : "pointer",
                                                    backgroundColor: notification.read ? "transparent" : "rgba(80, 176, 255, 0.1)",
                                                    padding: "16px",
                                                    marginBottom: "8px",
                                                    borderRadius: "8px",
                                                    border: "1px solid #303030"
                                                }}
                                        >
                                            <List.Item.Meta
                                                    title={
                                                        <Space>
                                                            <Text strong={!notification.read}>{notification.title}</Text>
                                                            {!notification.read && (
                                                                    <Tag color="blue">{t("NotificationList.unread")}</Tag>
                                                            )}
                                                        </Space>
                                                    }
                                                    description={
                                                        <Space direction="vertical" size={4} style={{width: "100%"}}>
                                                            <div style={{whiteSpace: "pre-wrap"}}>{notification.message}</div>
                                                            <Text type="secondary" style={{fontSize: 12}}>
                                                                {dayjs(notification.createdAt).format("YYYY-MM-DD HH:mm")}
                                                            </Text>
                                                        </Space>
                                                    }
                                            />
                                        </List.Item>
                                )}
                        />

                        {notifications.length > PAGE_SIZE && (
                                <div style={{textAlign: "center", marginTop: 16}}>
                                    <Pagination
                                            current={currentPage}
                                            total={notifications.length}
                                            pageSize={PAGE_SIZE}
                                            onChange={setCurrentPage}
                                            showSizeChanger={false}
                                    />
                                </div>
                        )}
                    </Spin>
                </Space>
            </div>
    );
}
