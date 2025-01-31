import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useSession } from "../../session";
import { DiveEventResponse, ListUserResponse } from "../../models/responses";
import { checkRoles } from "../../helpers";
import { Link } from "react-router-dom";
import { DiveTypeEnum, PaymentTypeEnum, RoleEnum } from "../../models";
import { Space, Spin, Table, Tag, Tooltip } from "antd";
import { LinkOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
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
            render: (text: string, record: DiveEventResponse) => {
                return (<>{dayjs(record.startTime).tz(getPortalTimezone()).format("YYYY-MM-DD HH:mm")}</>);
            }
        },
        {
            title: t("EventDetails.table.participants"),
            dataIndex: "participants",
            key: "participants",
            render: (text: string, record: DiveEventResponse) => {
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
            render: (_, record: DiveEventResponse) => {
                let color: string;
                let labelText: string;

                switch (record.type) {
                    case DiveTypeEnum.BOAT:
                        color = "yellow";
                        labelText = t("EditEvent.eventTypes.boat");
                        break;
                    case DiveTypeEnum.CAVE:
                        color = "blue";
                        labelText = t("EditEvent.eventTypes.cave");
                        break;
                    case DiveTypeEnum.CURRENT:
                        color = "violet";
                        labelText = t("EditEvent.eventTypes.current");
                        break;
                    case DiveTypeEnum.OPEN_AND_CAVE:
                        color = "green";
                        labelText = t("EditEvent.eventTypes.open-and-cave");
                        break;
                    case DiveTypeEnum.OPEN_WATER:
                        color = "marine";
                        labelText = t("EditEvent.eventTypes.open-water");
                        break;
                    case DiveTypeEnum.SURFACE:
                        color = "white";
                        labelText = t("EditEvent.eventTypes.surface");
                        break;
                    default:
                        color = "red";
                        labelText = t("EditEvent.eventTypes.unknown");
                }

                return (
                        <Tag color={color} key={"divetype-" + record.id}>
                            {labelText}
                        </Tag>);
            }
        },
        {
            title: t("EventDetails.table.organizer"),
            dataIndex: "organizer",
            key: "organizer",
            render: (text: string, record: DiveEventResponse) => {
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
            render: (text: string, record: DiveEventResponse) => {
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
            render: (text: string, record: ListUserResponse) => {
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
            render: (text: string, record: ListUserResponse) => {
                if (userSession && checkRoles(userSession.roles, [RoleEnum.ROLE_ORGANIZER, RoleEnum.ROLE_ADMIN])) {
                    return (<Link to={"/users/" + record.id + "/show"}key={"user-name-" + record.id}>{record.name}</Link>);
                }

                return (<>{record.name}</>);
            }
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
            render: (text: string, record: ListUserResponse) => {
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
                            {payments.map((payment) => {
                                let color: string;
                                let labelText: string;

                                switch (payment.paymentType) {
                                    case PaymentTypeEnum.PERIOD:
                                        color = "green";
                                        labelText = t("PaymentTypeEnum." + PaymentTypeEnum.PERIOD);
                                        break;
                                    case PaymentTypeEnum.ONE_TIME:
                                        color = "blue";
                                        labelText = t("PaymentTypeEnum." + PaymentTypeEnum.ONE_TIME);
                                        break;
                                    default:
                                        color = "red";
                                        labelText = t("EventDetails.participantTable.paymentType.unknown");
                                }

                                return (
                                        <Tag color={color} key={"payment-" + payment.userId + "-" + payment.id}>
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

    return (<Spin spinning={loading} key={"event-spinner"}>
                {eventInfo &&
                        <Space direction={"vertical"} size={12} key={"event-space"}>
                            <h5 key={"eventmain-" + eventInfo.id}>{t("EventDetails.title")}: {eventInfo.title}
                                <Link to={"/events/" + eventInfo.id + "/show"} key={"event-link-" + eventInfo.id}>
                                    <Tooltip title={t("EventDetails.link.tooltip")} key={"tooltip-" + eventInfo.id}>
                                        <LinkOutlined key={"linkout" + eventInfo.id}/>
                                    </Tooltip>
                                </Link>
                            </h5>

                            <p key={"eventdesc-" + eventInfo.id}>{t("EventDetails.description.title")}: {eventInfo.description}</p>

                            <Table columns={columns}
                                   dataSource={[eventInfo]}
                                   pagination={false}
                                   key={"dive-" + eventInfo.id}
                                   rowKey={(record) => "table-row-" + eventInfo.id + "-" + record.id}
                            />

                            <h5 key={"eventpart-" + eventInfo.id}>{t("EventDetails.participants.title")}: ({eventInfo.participants.length}):</h5>

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