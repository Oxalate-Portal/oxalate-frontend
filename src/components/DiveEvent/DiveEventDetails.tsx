import {useTranslation} from "react-i18next";
import {useEffect, useState} from "react";
import {useSession} from "../../session";
import {type DiveEventResponse, type ListUserResponse, RoleEnum} from "../../models";
import {checkRoles, diveTypeEnum2Tag, paymentTypeEnum2Tag, userTypeEnum2Tag} from "../../tools";
import {Link} from "react-router-dom";
import {Space, Spin, Table, Tooltip} from "antd";
import {LinkOutlined} from "@ant-design/icons";
import type {ColumnsType} from "antd/es/table";
import dayjs from "dayjs";

interface DiveEventDetailsProps {
    eventInfo: DiveEventResponse | null;
}

export function DiveEventDetails({eventInfo}: DiveEventDetailsProps) {
    const [loading, setLoading] = useState(true);
    const {userSession, getPortalTimezone} = useSession();
    const {t} = useTranslation();

    const columns: ColumnsType<DiveEventResponse> = [
        {
            title: "#",
            dataIndex: "id",
            key: "eventId"
        },
        {
            title: t("EventDetails.table.startTime"),
            dataIndex: "startTime",
            key: "startTime",
            render: (_: string, record: DiveEventResponse) => {
                return (<>{dayjs(record.startTime).tz(getPortalTimezone()).format("YYYY-MM-DD HH:mm")}</>);
            }
        },
        {
            title: t("EventDetails.table.participants"),
            dataIndex: "participants",
            key: "participants",
            render: (_: string, record: DiveEventResponse) => {
                if (record.participants) {
                    return (<>{record.participants.length} / {record.maxParticipants}</>);
                }
            }
        },
        {
            title: t("EventDetails.table.maxDuration"),
            dataIndex: "maxDuration",
            key: "maxDuration",
        },
        {
            title: t("EventDetails.table.maxDepth"),
            dataIndex: "maxDepth",
            key: "maxDepth",
        },
        {
            title: t("EventDetails.table.type"),
            dataIndex: "type",
            key: "type",
            render: (_, record: DiveEventResponse) => diveTypeEnum2Tag(record.type, t, record.id)
        },
        {
            title: t("EventDetails.table.organizer"),
            dataIndex: "organizer",
            key: "organizer",
            render: (_: string, record: DiveEventResponse) => {
                if (record.organizer === null) {
                    return (<></>);
                }
                if (userSession && checkRoles(userSession.roles, [RoleEnum.ROLE_ORGANIZER, RoleEnum.ROLE_ADMIN])) {
                    return (<Link to={"/users/" + record.organizer.id + "/show"}>{record.organizer.lastName} {record.organizer.firstName}</Link>);
                }
                return (<>{record.organizer.lastName} {record.organizer.firstName}</>);
            }
        },
        {
            title: t("EventDetails.table.phoneNumber"),
            dataIndex: "phoneNumber",
            key: "phoneNumber",
            render: (_: string, record: DiveEventResponse) => {
                if (record.organizer === null) {
                    return (<></>);
                }

                return (<>{record.organizer.phoneNumber}</>);
            }
        }
    ];

    let participantColumns: ColumnsType<ListUserResponse> = [
        {
            title: "#",
            dataIndex: "id",
            key: "id",
            sorter: (a: ListUserResponse, b: ListUserResponse) => a.id - b.id,
            render: (_: string, record: ListUserResponse) => {
                if (userSession && checkRoles(userSession.roles, [RoleEnum.ROLE_ORGANIZER, RoleEnum.ROLE_ADMIN])) {
                    return (<Link to={"/users/" + record.id + "/show"} key={"user-id-link-" + record.id}>{record.id}</Link>);
                }

                return (<>{record.id}</>);
            }
        },
        {
            title: t("EventDetails.participantTable.name"),
            dataIndex: "name",
            key: "name",
            sorter: (a: ListUserResponse, b: ListUserResponse) => a.name.localeCompare(b.name),
            render: (_: string, record: ListUserResponse) => {
                if (userSession && checkRoles(userSession.roles, [RoleEnum.ROLE_ORGANIZER, RoleEnum.ROLE_ADMIN])) {
                    return (<Link to={"/users/" + record.id + "/show"} key={"user-name-" + record.id}>{record.name}</Link>);
                }

                return (<>{record.name}</>);
            }
        },
        {
            title: t("EventDetails.participantTable.userType"),
            dataIndex: "userType",
            key: "userType",
            sorter: (a: ListUserResponse, b: ListUserResponse) => a.userType.toLowerCase().localeCompare(b.userType.toLowerCase()),
            render: (_, record: ListUserResponse) => (
                    <>
                        {userTypeEnum2Tag(record.userType, t, record.id)}
                    </>
            )
        },
        {
            title: t("EventDetails.participantTable.eventDiveCount"),
            dataIndex: "eventDiveCount",
            key: "eventDiveCount",
            sorter: (a: ListUserResponse, b: ListUserResponse) => a.eventDiveCount - b.eventDiveCount,
        },
        {
            title: t("EventDetails.participantTable.createdAt"),
            dataIndex: "createdAt",
            key: "createdAt",
            sorter: (a: ListUserResponse, b: ListUserResponse) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf(),
            render: (_: string, record: ListUserResponse) => {
                return (<>{dayjs(record.createdAt).tz(getPortalTimezone()).format("YYYY-MM-DD HH:mm")}</>);
            }
        }

    ];

    if (userSession && checkRoles(userSession.roles, [RoleEnum.ROLE_ORGANIZER, RoleEnum.ROLE_ADMIN])) {
        participantColumns = [...participantColumns,
            {
                title: t("EventDetails.participantTable.payments"),
                dataIndex: "payments",
                key: "payments",
                render: (_, {payments}) => (
                        <>
                            {payments.map((payment) => paymentTypeEnum2Tag(payment.paymentType, t, payment.id))}
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

    return (<Spin spinning={loading} key={"event-spinner"}>
                {eventInfo &&
                        <Space orientation={"vertical"} size={12} key={"event-space"}>
                            <h5 key={"event-main-" + eventInfo.id}>{t("EventDetails.title")}: {eventInfo.title}
                                <Link to={"/events/" + eventInfo.id + "/show"} key={"event-link-" + eventInfo.id}>
                                    <Tooltip title={t("EventDetails.link.tooltip")} key={"tooltip-" + eventInfo.id}>
                                        <LinkOutlined key={"linkout" + eventInfo.id}/>
                                    </Tooltip>
                                </Link>
                            </h5>

                            <p key={"event-desc-" + eventInfo.id}>{t("EventDetails.description.title")}: {eventInfo.description}</p>

                            <Table columns={columns}
                                   dataSource={[eventInfo]}
                                   pagination={false}
                                   key={"dive-" + eventInfo.id}
                                   rowKey={(record) => "table-row-" + eventInfo.id + "-" + record.id}
                            />

                            <h5 key={"event-part-" + eventInfo.id}>{t("EventDetails.participants.title")}: ({eventInfo.participants.length}):</h5>

                            <Table columns={participantColumns}
                                   dataSource={eventInfo.participants}
                                   pagination={false}
                                   key={"parts" + eventInfo.id}
                                   rowKey={(record) => "participant-row-" + record.id}
                            />
                        </Space>}
            </Spin>
    );
}