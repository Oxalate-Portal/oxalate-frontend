import {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {emailNotificationSubscriptionAPI} from "../../services";
import {type EmailNotificationSubscriptionRequest, type EmailNotificationSubscriptionResponse, EmailNotificationTypeEnum} from "../../models";
import {Button, Form, Spin, Switch} from "antd";

interface EmailSubscriptionCardProps {
    userId: number;
}

export function EmailSubscriptionCard({userId}: EmailSubscriptionCardProps) {
    const [loading, setLoading] = useState<boolean>(true);
    const {t} = useTranslation();
    const [subscriptions, setSubscriptions] = useState<EmailNotificationSubscriptionResponse[]>([]);
    const [subscriptionForm] = Form.useForm();

    useEffect(() => {
        setLoading(true);

        emailNotificationSubscriptionAPI.getUserEmailSubscriptions()
                .then(response => {
                    setSubscriptions(response);
                })
                .catch(e => {
                    console.error("Email subscription fetch error: " + e);
                })
                .finally(() => {
                    setLoading(false);
                });
    }, [userId]);

    const updateSubscriptions = (values: any) => {
        setLoading(true);
        const subscriptionRequest: EmailNotificationSubscriptionRequest = {subscriptionList: []};

        for (const [key, value] of Object.entries(values)) {
            // Get the enum from the key string
            if (value === true) {
                const notificationEnum = EmailNotificationTypeEnum[key as keyof typeof EmailNotificationTypeEnum];
                subscriptionRequest.subscriptionList.push(notificationEnum);
            }
        }

        emailNotificationSubscriptionAPI.subscribeToEmailNotification(subscriptionRequest)
                .then(response => {
                    setSubscriptions(response);
                })
                .catch(e => {
                    console.error("Error updating email subscriptions: " + e);
                })
                .finally(() => {
                    setLoading(false);
                });
    };

    return (
            <Spin spinning={loading} tip={t("common.spinner.loading")}>
                <h4>{t("EmailSubscriptionCard.header")}</h4>
                {!loading && <Form form={subscriptionForm}
                                   name={userId + "-subscription-form"}
                                   key={userId + "-subscription-form"}
                                   labelCol={{span: 12}}
                                   wrapperCol={{span: 12}}
                                   style={{maxWidth: 800}}
                                   onFinish={updateSubscriptions}>
                    {Object.values(EmailNotificationTypeEnum).map((type) => {
                        const subscription = subscriptions.find(sub => sub.emailNotificationType === type);

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
                        <Button type="primary" htmlType="submit">
                            {t("common.button.save")}
                        </Button>
                    </Form.Item>
                </Form>}
            </Spin>
    );
}
