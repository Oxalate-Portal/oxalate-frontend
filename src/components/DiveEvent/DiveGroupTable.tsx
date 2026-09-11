import {useEffect, useState} from "react";
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
    canReorderDiveGroups?: boolean;
    onJoin: (diveGroupId: number) => void;
    onLeave: (diveGroupId: number) => void;
    onDelete: (diveGroupId: number) => void;
    onReorder?: (diveGroupIds: number[]) => void;
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

/**
 * Sorts the dive groups by the order set by the organizer. Groups without an order keep the order in which they
 * were received, which is the creation order returned by the backend.
 */
export function sortDiveGroupsByOrder(diveGroups: DiveGroupResponse[]): DiveGroupResponse[] {
    return [...diveGroups].sort((first, second) => (first.groupOrder ?? 0) - (second.groupOrder ?? 0));
}

/**
 * Moves the dragged dive group to the position of the dive group it was dropped on and returns the new list. The
 * given list is returned unchanged when the move is a no-op.
 */
export function moveDiveGroup(diveGroups: DiveGroupResponse[], sourceId: number, targetId: number): DiveGroupResponse[] {
    if (sourceId === targetId) {
        return diveGroups;
    }

    const sourceIndex = diveGroups.findIndex((diveGroup) => diveGroup.id === sourceId);
    const targetIndex = diveGroups.findIndex((diveGroup) => diveGroup.id === targetId);

    if (sourceIndex < 0 || targetIndex < 0) {
        return diveGroups;
    }

    const reordered = [...diveGroups];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    return reordered;
}

export function DiveGroupTable({
                                   diveGroups,
                                   loading,
                                   currentUserId,
                                   canJoinDiveGroup,
                                   canReorderDiveGroups = false,
                                   onJoin,
                                   onLeave,
                                   onDelete,
                                   onReorder
                               }: DiveGroupTableProps) {
    const {t} = useTranslation();
    const {getPortalTimezone} = useSession();
    const [orderedDiveGroups, setOrderedDiveGroups] = useState<DiveGroupResponse[]>(() => sortDiveGroupsByOrder(diveGroups));
    const [draggedDiveGroupId, setDraggedDiveGroupId] = useState<number | null>(null);

    useEffect(() => {
        // The parent reloads the dive groups after every change, which is an external synchronization
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setOrderedDiveGroups(sortDiveGroupsByOrder(diveGroups));
    }, [diveGroups]);

    const belongsToAnyGroup = findDiveGroupOfUser(orderedDiveGroups, currentUserId) !== null;
    const reorderingEnabled = canReorderDiveGroups && orderedDiveGroups.length > 1;

    function dropOnDiveGroup(targetDiveGroupId: number): void {
        const sourceDiveGroupId = draggedDiveGroupId;
        setDraggedDiveGroupId(null);

        if (sourceDiveGroupId === null) {
            return;
        }

        const reordered = moveDiveGroup(orderedDiveGroups, sourceDiveGroupId, targetDiveGroupId);

        if (reordered === orderedDiveGroups) {
            return;
        }

        setOrderedDiveGroups(reordered);
        onReorder?.(reordered.map((diveGroup) => diveGroup.id));
    }

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
            title: t("DiveEvent.diveGroup.table.order"),
            key: "groupOrder",
            render: (_: string, _diveGroup: DiveGroupResponse, index: number) => index + 1
        },
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
                    dataSource={orderedDiveGroups}
                    loading={loading}
                    rowKey={"id"}
                    pagination={false}
                    title={() => reorderingEnabled
                            ? t("DiveEvent.diveGroup.table.title") + " - " + t("DiveEvent.diveGroup.table.reorderHint")
                            : t("DiveEvent.diveGroup.table.title")}
                    onRow={(diveGroup: DiveGroupResponse) => reorderingEnabled ? {
                        draggable: true,
                        onDragStart: () => setDraggedDiveGroupId(diveGroup.id),
                        onDragEnd: () => setDraggedDiveGroupId(null),
                        onDragOver: (event) => event.preventDefault(),
                        onDrop: () => dropOnDiveGroup(diveGroup.id)
                    } : {}}
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
