import { Collapse, Spin } from "antd";
import { ItemType } from "rc-collapse/es/interface";
import { Certificates } from "../Certificate/Certificates";
import { UserEventList } from "./UserEventList";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { DiveEventListItemResponse } from "../../models/responses";
import { diveEventAPI } from "../../services";
import dayjs from "dayjs";

interface ProfileCollapseProps {
    userId: number,
    viewOnly: boolean
}

export function ProfileCollapse({userId, viewOnly}: ProfileCollapseProps) {
    const {t} = useTranslation();
    const [upcomingEvents, setUpcomingEvents] = useState<DiveEventListItemResponse[]>([]);
    const [pastEvents, setPastEvents] = useState<DiveEventListItemResponse[]>([]);
    const [loading, setLoading] = useState(true);

    const profileItems: ItemType[] = [
        {
            key: "profile-certificates",
            label: "Certificates",
            children: <Certificates userId={userId} viewOnly={viewOnly}/>
        },
        {
            key: "upcomingEvents",
            label: t("UserEvents.futurePanel.header") + " (" + upcomingEvents.length + ")",
            children: <UserEventList eventType={"upcoming"} events={upcomingEvents}/>
        },
        {
            key: "pastEvents",
            label: t("UserEvents.pastPanel.header") + " (" + pastEvents.length + ")",
            children: <UserEventList eventType={"past"} events={pastEvents}/>
        }

    ];

    useEffect(() => {

        if (userId > 0) {
            // const diveEventAPI = new DiveEventAPI.DiveEventAPI("/events");

            diveEventAPI.findAllDiveEventListItemsByUser(userId)
                    .then(response => {
                        let oldEvents: DiveEventListItemResponse[] = [];
                        let newEvents: DiveEventListItemResponse[] = [];

                        for (let i = 0; i < response.length; i++) {
                            if (dayjs().isBefore(dayjs(response[i].startTime))) {
                                newEvents.push(response[i]);
                            } else {
                                oldEvents.push(response[i]);
                            }
                        }

                        setUpcomingEvents(newEvents);
                        setPastEvents(oldEvents);

                        setLoading(false);
                    }).catch(error => {
                        console.error(error);
                    }
            );
        }
    }, [userId]);

    return (
            <Spin spinning={loading}>
                <Collapse items={profileItems}/>
            </Spin>
    );
}
