import {useTranslation} from "react-i18next";
import {useEffect, useState} from "react";
import {Collapse, CollapseProps} from "antd";
import {UserEventList} from "./UserEventList";
import {UserIdProps} from "../../models/props";
import {DiveEventListItemResponse} from "../../models/responses";
import {diveEventAPI} from "../../services";

export function UserEvents(props: UserIdProps) {
    const [upcomingEvents, setUpcomingEvents] = useState<DiveEventListItemResponse[]>([]);
    const [pastEvents, setPastEvents] = useState<DiveEventListItemResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const {t} = useTranslation();

    const eventCollapses: CollapseProps['items'] = [
        {
            key: 'upcomingEvents',
            label: t('UserEvents.futurePanel.header') + ' (' + upcomingEvents.length + ')',
            children: <UserEventList eventType={'upcoming'} events={upcomingEvents}/>
        },
        {
            key: 'pastEvents',
            label: t('UserEvents.pastPanel.header') + ' (' + pastEvents.length + ')',
            children: <UserEventList eventType={'past'} events={pastEvents}/>
        }
    ];

    useEffect(() => {

        if (props.userId > 0) {
            // const diveEventAPI = new DiveEventAPI.DiveEventAPI("/events");

            diveEventAPI.findAllDiveEventListItemsByUser(props.userId)
                    .then(response => {
                        let oldEvents: DiveEventListItemResponse[] = [];
                        let newEvents: DiveEventListItemResponse[] = [];
                        let nowDate = Date.now();

                        for (let i = 0; i < response.length; i++) {
                            if (response[i].startTime.valueOf() > nowDate) {
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
    }, [props.userId]);
    return (
            <>
                {!loading && <Collapse items={eventCollapses}/>}
            </>);
}
