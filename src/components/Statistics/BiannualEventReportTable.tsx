import type {EventReportResponse} from "../../models";
import {OxTable} from "../main";
import {Link} from "react-router-dom";
import {useTranslation} from "react-i18next";
import dayjs from "dayjs";

interface BiannualEventReportProps {
    events: EventReportResponse[],
    childKey?: string
}

export function BiannualEventReportTable({events, childKey}: BiannualEventReportProps) {
    const {t} = useTranslation();

    const eventColumns = [
        {
            title: "#",
            dataIndex: "event_id",
            key: childKey + "-eventId",
            render: (_text: string, record: EventReportResponse) => {
                return (<Link to={"/events/" + record.event_id}>{record.event_id}</Link>);
            }
        },
        {
            title: t("ReportEvent.table.eventDateTime"),
            dataIndex: "event_date_time",
            key: childKey + "-eventDateTime",
            mobile: true,
            sorter: (a: EventReportResponse, b: EventReportResponse) => {
                return dayjs(a.event_date_time).valueOf() - dayjs(b.event_date_time).valueOf();
            }
        },
        {
            title: t("ReportEvent.table.organizerName"),
            dataIndex: "organizer_name",
            key: childKey + "-organizerName",
            mobile: true,
            sorter: (a: EventReportResponse, b: EventReportResponse) => a.organizer_name.localeCompare(b.organizer_name)
        },
        {
            title: t("ReportEvent.table.participantCount"),
            dataIndex: "participant_count",
            key: childKey + "-participantCount",
            sorter: (a: EventReportResponse, b: EventReportResponse) => a.participant_count - b.participant_count
        },
        {
            title: t("ReportEvent.table.diveCount"),
            dataIndex: "dive_count",
            key: childKey + "-diveCount",
            sorter: (a: EventReportResponse, b: EventReportResponse) => a.dive_count - b.dive_count
        }
    ];

    return (
        <OxTable dataSource={events} columns={eventColumns} pagination={false} key={childKey + "-table"} rowKey="event_id"/>
    );
}
