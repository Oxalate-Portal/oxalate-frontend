import { EventReportResponse } from "../../models/responses";
import { Table } from "antd";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
            dataIndex: "eventId",
            key: childKey + "-eventId",
            render: (text: string, record: EventReportResponse) => {
                return (<Link to={"/events/" + record.eventId}>{record.eventId}</Link>);
            }
        },
        {
            title: t("ReportEvent.table.eventDateTime"),
            dataIndex: "eventDateTime",
            key: childKey + "-eventDateTime",
            sorter: (a: EventReportResponse, b: EventReportResponse) => {
                return dayjs(a.eventDateTime).valueOf() - dayjs(b.eventDateTime).valueOf();
            }
        },
        {
            title: t("ReportEvent.table.organizerName"),
            dataIndex: "organizerName",
            key: childKey + "-organizerName",
            sorter: (a: EventReportResponse, b: EventReportResponse) => a.organizerName.localeCompare(b.organizerName)
        },
        {
            title: t("ReportEvent.table.participantCount"),
            dataIndex: "participantCount",
            key: childKey + "-participantCount",
            sorter: (a: EventReportResponse, b: EventReportResponse) => a.participantCount - b.participantCount
        },
        {
            title: t("ReportEvent.table.diveCount"),
            dataIndex: "diveCount",
            key: childKey + "-diveCount",
            sorter: (a: EventReportResponse, b: EventReportResponse) => a.diveCount - b.diveCount
        },
    ];

    return (
            <Table dataSource={events} columns={eventColumns} pagination={false} key={childKey + "-table"} rowKey="eventId"/>
    );
}
