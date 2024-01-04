import {useTranslation} from "react-i18next";
import {useEffect, useState} from "react";
import {useSession} from "../../session";
import {DiveEventResponse, DiveEventUserResponse} from "../../models/responses";
import {checkRoles, formatDateTime} from "../../helpers";
import {Link} from "react-router-dom";
import {PaymentTypeEnum, RoleEnum} from "../../models";
import {Space, Spin, Table, Tag, Tooltip} from "antd";
import {LinkOutlined} from "@ant-design/icons";
import type {ColumnsType} from "antd/es/table";

interface DiveEventDetailsProps {
    eventInfo: DiveEventResponse | null
}

export function DiveEventDetails({eventInfo}: DiveEventDetailsProps) {
    const [loading, setLoading] = useState(true);
    const {userSession} = useSession();
    const {t} = useTranslation();

    const columns: ColumnsType<DiveEventResponse> = [
        {
            title: '#',
            dataIndex: 'id',
            key: 'id'
        },
        {
            title: t('EventDetails.table.startTime'),
            dataIndex: 'startTime',
            key: 'startTime',
            render: (text: string, record: DiveEventResponse) => {
                return (<>{formatDateTime(new Date(record.startTime))}</>);
            }
        },
        {
            title: t('EventDetails.table.participants'),
            dataIndex: 'participants',
            key: 'participants',
            render: (text: string, record: DiveEventResponse) => {
                if (record.participants) {
                    return (<>{record.participants.length} / {record.maxParticipants}</>);
                }
            }
        },
        {
            title: t('EventDetails.table.maxDuration'),
            dataIndex: 'maxDuration',
            key: 'maxDuration',
        },
        {
            title: t('EventDetails.table.maxDepth'),
            dataIndex: 'maxDepth',
            key: 'maxDepth',
        },
        {
            title: t('EventDetails.table.type'),
            dataIndex: 'type',
            key: 'type',
        },
        {
            title: t('EventDetails.table.organizer'),
            dataIndex: 'organizer',
            key: 'organizer',
            render: (text: string, record: DiveEventResponse) => {
                if (userSession && checkRoles(userSession, [RoleEnum.ROLE_ORGANIZER, RoleEnum.ROLE_ADMIN])) {
                    return (<Link to={'/users/' + record.organizer.id + '/show'}>{record.organizer.lastName} {record.organizer.firstName}</Link>);
                }
                return (<>{record.organizer.lastName} {record.organizer.firstName}</>);
            }
        },
        {
            title: t('EventDetails.table.phoneNumber'),
            dataIndex: 'phoneNumber',
            key: 'phoneNumber',
            render: (text: string, record: DiveEventResponse) => {
                return (<>{record.organizer.phoneNumber}</>);
            }
        }
    ];

    let participantColumns: ColumnsType<DiveEventUserResponse> = [
        {
            title: '#',
            dataIndex: 'id',
            key: 'id',
            render: (text: string, record: DiveEventUserResponse) => {
                if (userSession && checkRoles(userSession, [RoleEnum.ROLE_ORGANIZER, RoleEnum.ROLE_ADMIN])) {
                    return (<Link to={'/users/' + record.id + '/show'}>{record.id}</Link>);
                }

                return (<>{record.id}</>);
            }
        },
        {
            title: t('EventDetails.participantTable.name'),
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: DiveEventUserResponse) => {
                if (userSession && checkRoles(userSession, [RoleEnum.ROLE_ORGANIZER, RoleEnum.ROLE_ADMIN])) {
                    return (<Link to={'/users/' + record.id + '/show'}>{record.name}</Link>);
                }

                return (<>{record.name}</>);
            }
        },
        {
            title: t('EventDetails.participantTable.eventDiveCount'),
            dataIndex: 'eventDiveCount',
            key: 'eventDiveCount'
        }
    ];

    if (userSession && checkRoles(userSession, [RoleEnum.ROLE_ORGANIZER, RoleEnum.ROLE_ADMIN])) {
        participantColumns = [...participantColumns,
            {
                title: t('EventDetails.participantTable.payments'),
                dataIndex: 'payments',
                key: 'payments',
                render: (_, {payments}) => (
                        <>
                            {payments.map((payment, index) => {
                                let color = '';
                                let labelText = '';

                                switch (payment.paymentType) {
                                    case PaymentTypeEnum.PERIOD:
                                        color = 'green';
                                        labelText = t('EventDetails.participantTable.paymentType.period');
                                        break;
                                    case PaymentTypeEnum.ONE_TIME:
                                        color = 'blue';
                                        labelText = t('EventDetails.participantTable.paymentType.oneTime');
                                        break;
                                    default:
                                        color = 'red';
                                        labelText = t('EventDetails.participantTable.paymentType.unknown');
                                }

                                return (
                                        <Tag color={color} key={payment.id}>
                                            {labelText}
                                        </Tag>);
                            })}
                        </>
                )
            }];
    }

    useEffect(() => {
        if (!eventInfo || eventInfo.participants === undefined || eventInfo.organizer === undefined) {
            setLoading(true);
        } else {
            setLoading(false);
        }
    }, [eventInfo]);

    return (<Spin spinning={loading}>
                {eventInfo &&
                        <Space direction={'vertical'} size={12}>
                            <h5 key={'eventmain-' + eventInfo.id}>{t('EventDetails.title')}: {eventInfo.title}
                                <Link to={'/events/' + eventInfo.id + '/show'} key={'link-' + eventInfo.id}>
                                    <Tooltip title={t('EventDetails.link.tooltip')} key={'tooltip-' + eventInfo.id}>
                                        <LinkOutlined key={'linkout' + eventInfo.id}/>
                                    </Tooltip>
                                </Link>
                            </h5>

                            <p key={'eventdesc-' + eventInfo.id}>{t('EventDetails.description.title')}: {eventInfo.description}</p>

                            <Table columns={columns}
                                   dataSource={[eventInfo]}
                                   pagination={false}
                                   key={'dive-' + eventInfo.id}
                                   rowKey={(record) => 'table-row-' + eventInfo.id + '-' + record.id}
                            />

                            <h5 key={'eventpart-' + eventInfo.id}>{t('EventDetails.participants.title')}: ({eventInfo.participants.length}):</h5>

                            <Table columns={participantColumns}
                                   dataSource={eventInfo.participants}
                                   pagination={false}
                                   key={'parts' + eventInfo.id}
                            />
                        </Space>}
            </Spin>
    );
}