import { EventPeriodReportResponse, EventReportResponse } from "../../models/responses";
import { Collapse, Table } from "antd";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface BiannualEventReportProps {
    report: EventPeriodReportResponse
}

const {Panel} = Collapse;

export function BiannualEventReport({report}: BiannualEventReportProps) {
    const { t } = useTranslation();

    const eventColumns = [
        {
            title: '#',
            dataIndex: 'eventId',
            key: 'eventId',
            render: (text: string, record: EventReportResponse) => {
                return (<Link to={'/events/' + record.eventId}>{record.eventId}</Link>);
            }
        },
        {
            title: t('ReportEvent.table.eventDateTime'),
            dataIndex: 'eventDateTime',
            key: 'eventDateTime'
        },
        {
            title: t('ReportEvent.table.organizerName'),
            dataIndex: 'organizerName',
            key: 'organizerName'
        },
        {
            title: t('ReportEvent.table.participantCount'),
            dataIndex: 'participantCount',
            key: 'participantCount'
        },
        {
            title: t('ReportEvent.table.diveCount'),
            dataIndex: 'diveCount',
            key: 'diveCount'
        },
    ];

    return (
            <Collapse>
                <Panel header={report.period} key={report.period}>
                    <Table dataSource={report.events} columns={eventColumns} pagination={false} rowKey="eventId"/>
                </Panel>
            </Collapse>
    );
}
