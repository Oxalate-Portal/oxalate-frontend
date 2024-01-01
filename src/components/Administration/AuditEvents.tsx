import {Tag} from "antd";
import {useTranslation} from "react-i18next";
import {formatDateTimeWithMs} from "../../helpers";

export function AuditEvents() {
    const {t} = useTranslation();

    const auditColumns = [
        {
            title: t('AuditEvents.table.createdAt'),
            dataIndex: 'createdAt',
            key: 'createdAt',
            sorter: true,
            sortDirections: ['descend', 'ascend'],
            render: (_, record) => {
                return (<>{formatDateTimeWithMs(record.createdAt)}</>);
            }
        },
        {
            title: t('AuditEvents.table.userName'),
            dataIndex: 'userName',
            key: 'userName',
            sorter: (a, b) => a.userName.localeCompare(b.userName),
            sortDirections: ['descend', 'ascend']
        },
        {
            title: t('AuditEvents.table.traceId'),
            dataIndex: 'traceId',
            key: 'traceId'
        },
        {
            title: t('AuditEvents.table.source'),
            dataIndex: 'source',
            key: 'source'
        },
        {
            title: t('AuditEvents.table.level'),
            dataIndex: 'level',
            key: 'level',
            render: ((level) => {
                let color = '';

                if (level === 'ERROR') {
                    color = 'red';
                }
                if (level === 'WARN') {
                    color = 'orange';
                }
                if (level === 'INFO') {
                    color = 'blue';
                }

                return (
                        <Tag color={color} key={level}>
                            {level}
                        </Tag>
                );
            })
        },
        {
            title: t('AuditEvents.table.address'),
            dataIndex: 'address',
            sorter: true,
            key: 'address'
        },
        {
            title: t('AuditEvents.table.message'),
            dataIndex: 'message',
            key: 'message',
        }
    ];

    return (
            <></>
    );
}
