import { Collapse, Spin, Tooltip } from "antd";
import { ItemType } from "rc-collapse/es/interface";
import { Certificates } from "../Certificate";
import { UserEventList } from "./UserEventList";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { DiveEventListItemResponse, FrontendConfigurationResponse } from "../../models/responses";
import { diveEventAPI, portalConfigurationAPI } from "../../services";
import dayjs from "dayjs";
import { EmailSubscriptionCard } from "./EmailSubscriptionCard";
import { QuestionCircleOutlined } from "@ant-design/icons";

interface ProfileCollapseProps {
    userId: number,
    viewOnly: boolean
}

export function ProfileCollapse({userId, viewOnly}: ProfileCollapseProps) {
    const {t} = useTranslation();
    const [upcomingEvents, setUpcomingEvents] = useState<DiveEventListItemResponse[]>([]);
    const [pastEvents, setPastEvents] = useState<DiveEventListItemResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [maxCertificates, setMaxCertificates] = useState<number>(0);

    const profileItems: ItemType[] = [
        {
            key: "profile-certificates",
            label: t("UserEvents.profile-certificates-panel.header"),
            extra: <Tooltip title={t("UserEvents.profile-certificates-panel.tooltip") + maxCertificates}><QuestionCircleOutlined/></Tooltip>,
            children: <Certificates userId={userId} viewOnly={viewOnly}/>
        },
        {
            key: "email-subscriptions",
            label: t("UserEvents.email-subscription-panel.header"),
            extra: <Tooltip title={t("UserEvents.profile-email-subscription-panel.tooltip")}><QuestionCircleOutlined/></Tooltip>,
            children: <EmailSubscriptionCard userId={userId}/>
        },
        {
            key: "upcomingEvents",
            label: t("UserEvents.future-panel.header") + " (" + upcomingEvents.length + ")",
            extra: <Tooltip title={t("UserEvents.profile-upcoming-events-panel.tooltip")}><QuestionCircleOutlined/></Tooltip>,
            children: <UserEventList eventType={"upcoming"} events={upcomingEvents}/>
        },
        {
            key: "pastEvents",
            label: t("UserEvents.past-panel.header") + " (" + pastEvents.length + ")",
            extra: <Tooltip title={t("UserEvents.profile-past-events-panel.tooltip")}><QuestionCircleOutlined/></Tooltip>,
            children: <UserEventList eventType={"past"} events={pastEvents}/>
        }
    ];

    useEffect(() => {

        if (userId > 0) {
            // const diveEventAPI = new DiveEventAPI.DiveEventAPI("/events");

            Promise.all([diveEventAPI.findAllDiveEventListItemsByUser(userId),
                portalConfigurationAPI.getFrontendConfiguration()])
                    .then(([diveResponses, frontendConfigResponse]) => {
                        let oldEvents: DiveEventListItemResponse[] = [];
                        let newEvents: DiveEventListItemResponse[] = [];

                        for (let i = 0; i < diveResponses.length; i++) {
                            if (dayjs().isBefore(dayjs(diveResponses[i].startTime))) {
                                newEvents.push(diveResponses[i]);
                            } else {
                                oldEvents.push(diveResponses[i]);
                            }
                        }

                        setUpcomingEvents(newEvents);
                        setPastEvents(oldEvents);

                        const maxCertificatesConfig: FrontendConfigurationResponse | undefined = frontendConfigResponse.find(config => config.key === "max-certificates");
                        if (maxCertificatesConfig !== undefined) {
                            setMaxCertificates(parseInt(maxCertificatesConfig.value));
                        }

                    }).catch(error => {
                        console.error(error);
                    })
                    .finally(() => {
                        setLoading(false);
                    });
        }
    }, [userId]);

    return (
            <Spin spinning={loading}>
                {!loading && <Collapse items={profileItems}/>}
            </Spin>
    );
}
