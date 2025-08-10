import {useEffect, useState} from "react";
import {DiveEventResponse, DiveEventStatusEnum, RoleEnum} from "../../models";
import {Button, Space, Spin, Table} from "antd";
import type {ColumnsType} from "antd/es/table";
import {checkRoles, diveEventStatusEnum2Tag} from "../../helpers";
import {Link} from "react-router-dom";
import {useSession} from "../../session";
import {useTranslation} from "react-i18next";
import {diveEventAPI} from "../../services";
import dayjs from "dayjs";
import {diveTypeEnum2Tag} from "../../helpers/Enum2TagTool";

interface DiveEventsTableProps {
    diveEventType: string,
    title: string
}

export function DiveEventsTable({diveEventType, title}: DiveEventsTableProps) {
    const {userSession, getPortalTimezone} = useSession();
    const {t} = useTranslation();
    const [diveEvents, setDiveEvents] = useState<DiveEventResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const diveEventColumns: ColumnsType<DiveEventResponse> = [
        {
            title: t("Events.table.startTime"),
            dataIndex: "startTime",
            key: "startTime",
            sorter: (a: DiveEventResponse, b: DiveEventResponse) => (new Date(a.startTime.toDate()).getTime() - new Date(b.startTime.toDate()).getTime()),
            sortDirections: ["descend", "ascend"],
            render: (text: string, record: DiveEventResponse) => {
                return (<div>{dayjs(record.startTime).tz(getPortalTimezone()).format("YYYY-MM-DD HH:mm")}</div>);
            }
        },
        {
            title: t("Events.table.title"),
            dataIndex: "title",
            key: "title",
            sorter: (a: DiveEventResponse, b: DiveEventResponse) => a.title.localeCompare(b.title),
            sortDirections: ["descend", "ascend"]
        },
        {
            title: t("Events.table.status"),
            dataIndex: "status",
            key: "status",
            sorter: (a: DiveEventResponse, b: DiveEventResponse) => a.title.localeCompare(b.title),
            sortDirections: ["descend", "ascend"],
            render: (text: string, record: DiveEventResponse) => diveEventStatusEnum2Tag(record.status, t, record.id)
        },
        {
            title: t("Events.table.participants"),
            dataIndex: "participants",
            key: "participants",
            sorter: (a: DiveEventResponse, b: DiveEventResponse) => a.participants.length - b.participants.length,
            sortDirections: ["descend", "ascend"],
            render: (text: string, record: DiveEventResponse) => {
                return (<>{record.participants.length} / {record.maxParticipants}</>);
            }
        },
        {
            title: t("Events.table.maxDuration"),
            dataIndex: "maxDuration",
            key: "maxDuration",
            sorter: (a: DiveEventResponse, b: DiveEventResponse) => a.eventDuration - b.eventDuration,
            sortDirections: ["descend", "ascend"]
        },
        {
            title: t("Events.table.maxDepth"),
            dataIndex: "maxDepth",
            key: "maxDepth",
            sorter: (a: DiveEventResponse, b: DiveEventResponse) => a.maxDepth - b.maxDepth,
            sortDirections: ["descend", "ascend"]
        },
        {
            title: t("Events.table.type"),
            dataIndex: "type",
            key: "type",
            sorter: (a: DiveEventResponse, b: DiveEventResponse) => a.type.localeCompare(b.type),
            sortDirections: ["descend", "ascend"],
            render: (_, record: DiveEventResponse) => diveTypeEnum2Tag(record.type, t, record.id)
        },
        {
            title: t("Events.table.organizer"),
            dataIndex: "organizer",
            key: "organizer",
            sorter: (a: DiveEventResponse, b: DiveEventResponse) => {
                if (a.organizer === b.organizer) {
                    return 0;
                }

                if (a.organizer === null) {
                    return -1;
                }
                if (b.organizer === null) {
                    return 1;
                }

                return a.organizer.lastName.localeCompare(b.organizer.lastName);
            },
            sortDirections: ["descend", "ascend"],
            render: (text: string, record: DiveEventResponse) => {
                if (record.organizer === null) {
                    return (<></>);
                }
                return (<>{record.organizer.lastName} {record.organizer.firstName}</>);
            }
        },
        {
            title: "",
            key: "action",
            render: (_: any, record: DiveEventResponse) => {
                if (diveEventType === "new" || diveEventType === "ongoing") {
                    return (<>
                        <Space size="middle">
                            {userSession && checkRoles(userSession.roles, [RoleEnum.ROLE_ORGANIZER, RoleEnum.ROLE_ADMIN]) &&
                                    <Link to={"/events/" + record.id + "/edit"}>
                                        <Button style={{
                                            background: "green",
                                            borderColor: "white"
                                        }}>{t("common.button.update")}</Button></Link>}
                            {record.status === DiveEventStatusEnum.PUBLISHED && <Link to={"/events/" + record.id}><Button
                                    type={"primary"}>{t("common.button.open")}</Button></Link>}
                        </Space>
                    </>);
                } else {
                    return (<>
                        <Space size="middle">
                            <Link to={"/events/" + record.id}><Button
                                    type={"primary"}>{t("common.button.open")}</Button></Link>
                        </Space>
                    </>);
                }
            },
        }
    ];

    useEffect(() => {
        setLoading(true);
        let diveEventResponses: Promise<DiveEventResponse[]>;
        if (diveEventType === "new") {
            diveEventResponses = diveEventAPI.findAll();
        } else if (diveEventType === "ongoing") {
            diveEventResponses = diveEventAPI.findAllOngoingDiveEvents();
        } else if (diveEventType === "past") {
            diveEventResponses = diveEventAPI.findAllPastDiveEvents();
        } else {
            console.error("Unknown dive event type: " + diveEventType);
            return;
        }

        diveEventResponses
                .then((response) => {
                    setDiveEvents(response);
                })
                .catch((error: any) => {
                    console.error("Failed to fetch events for type: " + diveEventType, error);
                })
                .finally(() => {
                    setLoading(false);
                });
    }, [diveEventType]);

    return (
            <>
                <h4>{title}</h4>
                <Spin spinning={loading}>
                    {!loading && diveEvents && diveEvents.length > 0 && <Table
                            dataSource={diveEvents}
                            rowKey={"id"}
                            columns={diveEventColumns}
                            pagination={{
                                defaultPageSize: 5,
                                hideOnSinglePage: false,
                                showSizeChanger: true,
                                showQuickJumper: true,
                                total: diveEvents.length,
                                pageSizeOptions: ["5", "10", "20", "30", "50", "100"]
                            }}/>}
                </Spin>
            </>
    );
}