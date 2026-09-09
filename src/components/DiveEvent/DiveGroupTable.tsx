import {Button, Popconfirm, Space, Table} from "antd";
import type {ColumnsType} from "antd/es/table";
import {useTranslation} from "react-i18next";
import dayjs from "dayjs";
import {useSession} from "../../session";
import {userTypeEnum2Tag} from "../../tools";
import type {DiveGroupMemberResponse, DiveGroupResponse} from "../../models";

interface DiveGroupTableProps {
    diveGroups: DiveGroupResponse[];
    loading: boolean;
    currentUserId: number;
    canJoinDiveGroup: boolean;
    onJoin: (diveGroupId: number) => void;
    onLeave: (diveGroupId: number) => void;
    onDelete: (diveGroupId: number) => void;
}

export function isMemberOfDiveGroup(diveGroup: DiveGroupResponse, userId: number): boolean {
    return (diveGroup.members ?? []).some((member) => member.userId === userId);
}

export function findDiveGroupOfUser(diveGroups: DiveGroupResponse[], userId: number): DiveGroupResponse | null {
    return diveGroups.find((diveGroup) => isMemberOfDiveGroup(diveGroup, userId)) ?? null;
}

export function findDiveGroupOwnedByUser(diveGroups: DiveGroupResponse[], userId: number): DiveGroupResponse | null {
    return diveGroups.find((diveGroup) => diveGroup.ownerId === userId) ?? null;
}

export function DiveGroupTable({diveGroups, loading, currentUserId, canJoinDiveGroup, onJoin, onLeave, onDelete}: DiveGroupTableProps) {
    const {t} = useTranslation();
    const {getPortalTimezone} = useSession();

    const belongsToAnyGroup = findDiveGroupOfUser(diveGroups, currentUserId) !== null;

    const memberColumns: ColumnsType<DiveGroupMemberResponse> = [
        {
            title: t("DiveEvent.diveGroup.members.name"),
            dataIndex: "name",
            key: "name"
        },
        {
            title: t("DiveEvent.diveGroup.members.userType"),
            dataIndex: "userType",
            key: "userType",
            render: (_: string, member: DiveGroupMemberResponse) => userTypeEnum2Tag(member.userType, t, member.userId)
        },
        {
            title: t("DiveEvent.diveGroup.members.owner"),
            dataIndex: "owner",
            key: "owner",
            render: (_: string, member: DiveGroupMemberResponse) => member.owner ? t("common.button.yes") : t("common.button.no")
        },
        {
            title: t("DiveEvent.diveGroup.members.joinedAt"),
            dataIndex: "joinedAt",
            key: "joinedAt",
            render: (_: string, member: DiveGroupMemberResponse) => member.joinedAt
                    ? dayjs(member.joinedAt).tz(getPortalTimezone()).format("YYYY-MM-DD HH:mm")
                    : ""
        }
    ];

    const diveGroupColumns: ColumnsType<DiveGroupResponse> = [
        {
            title: t("DiveEvent.diveGroup.table.name"),
            dataIndex: "name",
            key: "name"
        },
        {
            title: t("DiveEvent.diveGroup.table.owner"),
            dataIndex: "ownerName",
            key: "ownerName",
            render: (_: string, diveGroup: DiveGroupResponse) => diveGroup.ownerName ?? ""
        },
        {
            title: t("DiveEvent.diveGroup.table.memberCount"),
            dataIndex: "members",
            key: "members",
            render: (_: string, diveGroup: DiveGroupResponse) => (diveGroup.members ?? []).length
        },
        {
            title: t("DiveEvent.diveGroup.table.action"),
            key: "action",
            render: (_: string, diveGroup: DiveGroupResponse) => {
                const isOwner = diveGroup.ownerId === currentUserId;
                const isMember = isMemberOfDiveGroup(diveGroup, currentUserId);

                return (
                        <Space>
                            {isMember && !isOwner &&
                                    <Button
                                            danger
                                            onClick={() => onLeave(diveGroup.id)}
                                            key={diveGroup.id + "-leave-dive-group-button"}>
                                        {t("DiveEvent.diveGroup.table.leaveButton")}
                                    </Button>
                            }
                            {isOwner &&
                                    <Popconfirm
                                            title={t("DiveEvent.diveGroup.table.deleteConfirm")}
                                            okText={t("common.button.yes")}
                                            cancelText={t("common.button.no")}
                                            onConfirm={() => onDelete(diveGroup.id)}
                                            key={diveGroup.id + "-delete-dive-group-confirm"}>
                                        <Button danger key={diveGroup.id + "-delete-dive-group-button"}>
                                            {t("DiveEvent.diveGroup.table.deleteButton")}
                                        </Button>
                                    </Popconfirm>
                            }
                            {canJoinDiveGroup && !isMember && !belongsToAnyGroup &&
                                    <Button
                                            type={"primary"}
                                            onClick={() => onJoin(diveGroup.id)}
                                            key={diveGroup.id + "-join-dive-group-button"}>
                                        {t("DiveEvent.diveGroup.table.joinButton")}
                                    </Button>
                            }
                        </Space>
                );
            }
        }
    ];

    return (
            <Table<DiveGroupResponse>
                    columns={diveGroupColumns}
                    dataSource={diveGroups}
                    loading={loading}
                    rowKey={"id"}
                    pagination={false}
                    title={() => t("DiveEvent.diveGroup.table.title")}
                    expandable={{
                        expandedRowRender: (diveGroup: DiveGroupResponse) => (
                                <Table<DiveGroupMemberResponse>
                                        columns={memberColumns}
                                        dataSource={diveGroup.members ?? []}
                                        rowKey={"userId"}
                                        pagination={false}
                                        size={"small"}
                                        locale={{emptyText: t("DiveEvent.diveGroup.members.empty")}}
                                />
                        )
                    }}
            />
    );
}
