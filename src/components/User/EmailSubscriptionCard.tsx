import {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {useResponsiveFormLayout} from "../main";
import {emailNotificationSubscriptionAPI} from "../../services";
import {type EmailNotificationSubscriptionRequest, type EmailNotificationSubscriptionResponse, EmailNotificationTypeEnum} from "../../models";
import {Button, Form, Spin, Switch} from "antd";

interface EmailSubscriptionCardProps {
    userId: number;
}

export function EmailSubscriptionCard({userId}: EmailSubscriptionCardProps) {
    const [loading, setLoading] = useState<boolean>(true);
    const {t} = useTranslation();
    const formLayout = useResponsiveFormLayout(12, 12);
    const [subscriptions, setEmailSubscriptions] = useState<EmailNotificationSubscriptionResponse[]>([]);
    const [subscriptionForm] = Form.useForm();

    useEffect(() => {
        emailNotificationSubscriptionAPI.getUserEmailSubscriptions()
            .then(response => {
                setEmailSubscriptions(response);
            })
            .catch(error => {
                console.error("Error:", error);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const updateSubscriptions = (values: Record<string, boolean>) => {
        setLoading(true);
        const subscriptionRequest: EmailNotificationSubscriptionRequest = {subscription_list: []};

        for (const [key, value] of Object.entries(values)) {
            // Get the enum from the key string
            if (value) {
                const notificationEnum = EmailNotificationTypeEnum[key as keyof typeof EmailNotificationTypeEnum];
                subscriptionRequest.subscription_list.push(notificationEnum);
            }
        }

        emailNotificationSubscriptionAPI.subscribeToEmailNotification(subscriptionRequest)
            .then(response => {
                setEmailSubscriptions(response);
            })
            .catch(e => {
                console.error("Error updating email subscriptions: " + e);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    return (
        <Spin spinning={loading} description={t("common.spinner.loading")}>
            <h4>{t("EmailSubscriptionCard.header")}</h4>
            {!loading && <Form form={subscriptionForm}
                               name={userId + "-subscription-form"}
                               key={userId + "-subscription-form"}
                               {...formLayout}
                               style={{maxWidth: 800}}
                               onFinish={updateSubscriptions}>
                {Object.values(EmailNotificationTypeEnum).map((type) => {
                    const subscription = subscriptions.find(sub => sub.email_notification_type === type);

                    return (
                        <Form.Item
                            key={userId + "-subscription-" + type}
                            label={t(`common.email-subscription-type.${type}.label`)}
                            tooltip={t(`common.email-subscription-type.${type}.tooltip`)}
                            name={type}
                            valuePropName="checked"
                            initialValue={!!subscription}
                        >
                            <Switch/>
                        </Form.Item>
                    );
                })}
                <Form.Item>
                    <Button type={"primary"} htmlType="submit">
                        {t("common.button.save")}
                    </Button>
                </Form.Item>
            </Form>}
        </Spin>
    );
}
