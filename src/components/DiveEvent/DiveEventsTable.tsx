import {useEffect, useState} from "react";
import {type DiveEventResponse, DiveEventStatusEnum, DiveTypeEnum, RoleEnum, SortDirectionEnum} from "../../models";
import {Button, Space, Spin} from "antd";
import {type OxColumnsType, OxTable, usePagedTable} from "../main";
import {checkRoles, diveEventStatusEnum2Tag, diveTypeEnum2Tag} from "../../tools";
import {Link} from "react-router-dom";
import {useSession} from "../../session";
import {useTranslation} from "react-i18next";
import {diveEventAPI} from "../../services";
import dayjs from "dayjs";

interface DiveEventsTableProps {
    diveEventType: string,
    title: string
}

type Comparator = (a: DiveEventResponse, b: DiveEventResponse) => number;

/**
 * Lists dive events. Future (`new`) and ongoing events are small bounded lists that are filtered and sorted in the
 * browser (client-mode OxTable), while the `past` events are paged, sorted, searched and filtered by the server
 * (server-mode OxTable): the allow-listed columns (startTime, title, status, type, maxDuration, maxDepth) carry
 * `sorter: true`, the `status` and `type` enum filters are served by the backend, the `title` and `organizer`
 * columns are `searchable` there, and the participants/organizer columns are not sortable there.
 */
export function DiveEventsTable({diveEventType, title}: DiveEventsTableProps) {
    const {userSession, getPortalTimezone} = useSession();
    const {t} = useTranslation();
    const serverPaged = diveEventType === "past";
    const [diveEvents, setDiveEvents] = useState<DiveEventResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const pastEventTable = usePagedTable<DiveEventResponse>((request) => diveEventAPI.findPastDiveEvents(request), {
        defaultSortBy: "start_time",
        defaultDirection: SortDirectionEnum.DESC,
        defaultPageSize: 10,
        enabled: serverPaged
    });

    /** Server sorting for the past events, the given client comparator otherwise. */
    const sortedOnServerOr = (comparator: Comparator): boolean | Comparator => serverPaged ? true : comparator;
    /** Columns outside the server allow-list keep their client comparator only for the client-sorted tables. */
    const clientOnlySorter = (comparator: Comparator): Comparator | undefined => serverPaged ? undefined : comparator;

    const diveEventColumns: OxColumnsType<DiveEventResponse> = [
        {
            title: t("Events.table.startTime"),
            dataIndex: "start_time",
            key: "start_time",
            mobile: true,
            sorter: sortedOnServerOr((a, b) => dayjs(a.start_time).valueOf() - dayjs(b.start_time).valueOf()),
            defaultSortOrder: serverPaged ? "descend" : undefined,
            sortDirections: ["descend", "ascend"],
            render: (_: string, record: DiveEventResponse) => {
                return (<div>{dayjs(record.start_time).tz(getPortalTimezone()).format("YYYY-MM-DD HH:mm")}</div>);
            }
        },
        {
            title: t("Events.table.title"),
            dataIndex: "title",
            key: "title",
            mobile: true,
            searchable: true,
            sorter: sortedOnServerOr((a, b) => a.title.localeCompare(b.title)),
            sortDirections: ["descend", "ascend"]
        },
        {
            title: t("Events.table.status"),
            dataIndex: "status",
            key: "status",
            sorter: sortedOnServerOr((a, b) => a.status.localeCompare(b.status)),
            sortDirections: ["descend", "ascend"],
            filters: Object.values(DiveEventStatusEnum).map((value) => ({text: t(`DiveEventStatusEnum.${value.toLowerCase()}`), value})),
            render: (_: string, record: DiveEventResponse) => diveEventStatusEnum2Tag(record.status, t, record.id)
        },
        {
            title: t("Events.table.participants"),
            dataIndex: "participants",
            key: "participants",
            sorter: clientOnlySorter((a, b) => a.participants.length - b.participants.length),
            sortDirections: ["descend", "ascend"],
            render: (_: string, record: DiveEventResponse) => {
                const participantCount = record.participants.length;
                const isFutureTable = diveEventType === "new";
                const isFull = isFutureTable && participantCount >= record.max_participants;
                const waitingListCount = record.waiting_list?.length || 0;

                return (
                    <>
                        <span style={isFull ? {color: "#ff4d4f", fontWeight: 600} : undefined}>
                            {participantCount} / {record.max_participants}
                        </span>
                        {isFutureTable && waitingListCount > 0 && (
                            <span style={{color: "#faad14", marginLeft: 6}}>
                                ({t("Events.table.waitingList")}: {waitingListCount})
                            </span>
                        )}
                    </>
                );
            }
        },
        {
            title: t("Events.table.maxDuration"),
            dataIndex: "max_duration",
            key: "max_duration",
            sorter: sortedOnServerOr((a, b) => a.event_duration - b.event_duration),
            sortDirections: ["descend", "ascend"]
        },
        {
            title: t("Events.table.maxDepth"),
            dataIndex: "max_depth",
            key: "max_depth",
            sorter: sortedOnServerOr((a, b) => a.max_depth - b.max_depth),
            sortDirections: ["descend", "ascend"]
        },
        {
            title: t("Events.table.type"),
            dataIndex: "type",
            key: "type",
            filters: Object.values(DiveTypeEnum).map((type) => ({text: t("DiveTypeEnum." + type), value: type})),
            sorter: sortedOnServerOr((a, b) => a.type.localeCompare(b.type)),
            sortDirections: ["descend", "ascend"],
            render: (_, record: DiveEventResponse) => diveTypeEnum2Tag(record.type, t, record.id)
        },
        {
            title: t("Events.table.organizer"),
            dataIndex: "organizer",
            key: "organizer",
            // The backend searches the organizer by name; the client-side substring search cannot handle the object.
            searchable: serverPaged,
            sorter: clientOnlySorter((a, b) => {
                if (a.organizer === b.organizer) {
                    return 0;
                }

                if (a.organizer === null) {
                    return -1;
                }
                if (b.organizer === null) {
                    return 1;
                }

                return a.organizer.last_name.localeCompare(b.organizer.last_name);
            }),
            sortDirections: ["descend", "ascend"],
            render: (_: string, record: DiveEventResponse) => {
                if (record.organizer === null) {
                    return (<></>);
                }
                return (<>{record.organizer.last_name} {record.organizer.first_name}</>);
            }
        },
        {
            title: "",
            key: "action",
            render: (_: string, record: DiveEventResponse) => {
                const openButton = (
                    <Link to={"/events/" + record.id}>
                        <Button type={"primary"}>{t("common.button.open")}</Button>
                    </Link>
                );

                if (diveEventType === "new" || diveEventType === "ongoing") {
                    return (<>
                        <Space size={"middle"}>
                            {userSession && checkRoles(userSession.roles, [RoleEnum.ROLE_ORGANIZER, RoleEnum.ROLE_ADMIN]) &&
                                <Link to={"/events/" + record.id + "/edit"}>
                                    <Button style={{
                                        background: "green",
                                        borderColor: "white"
                                    }}>{t("common.button.update")}</Button></Link>}
                            {record.status === DiveEventStatusEnum.PUBLISHED && openButton}
                        </Space>
                    </>);
                } else {
                    return (<>
                        <Space size={"middle"}>
                            {openButton}
                        </Space>
                    </>);
                }
            }
        }
    ];

    useEffect(() => {
        let diveEventResponses: Promise<DiveEventResponse[]>;
        if (diveEventType === "new") {
            diveEventResponses = diveEventAPI.findAll();
        } else if (diveEventType === "ongoing") {
            diveEventResponses = diveEventAPI.findAllOngoingDiveEvents();
        } else if (diveEventType === "past") {
            // Fetched by usePagedTable
            return;
        } else {
            console.error("Unknown dive event type: " + diveEventType);
            return;
        }

        diveEventResponses
            .then((response) => {
                setDiveEvents(response);
            })
            .catch((error: Error) => {
                console.error("Failed to fetch events for type: " + diveEventType, error);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [diveEventType]);

    if (serverPaged) {
        return (
            <>
                {pastEventTable.contextHolder}
                <h4>{title}</h4>
                <OxTable
                    dataMode={"server"}
                    paged={pastEventTable}
                    rowKey={"id"}
                    columns={diveEventColumns}/>
            </>
        );
    }

    return (
        <>
            <h4>{title}</h4>
            <Spin spinning={loading}>
                {!loading && diveEvents && diveEvents.length > 0 && <OxTable
                    dataSource={diveEvents}
                    rowKey={"id"}
                    columns={diveEventColumns}
                    pagination={{
                        defaultPageSize: 10,
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
