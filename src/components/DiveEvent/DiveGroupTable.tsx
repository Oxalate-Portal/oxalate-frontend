import {useEffect, useState} from "react";
import {Button, Popconfirm, Space, Typography} from "antd";
import {useTranslation} from "react-i18next";
import dayjs from "dayjs";
import {useSession} from "../../session";
import {userTypeEnum2Tag} from "../../tools";
import {type DiveFileResponse, type DiveGroupMemberResponse, type DiveGroupResponse, DiveGroupTypeEnum, UserTypeEnum} from "../../models";
import {type OxColumnsType, OxTable, ProtectedImage} from "../main";
import {DiveEventFiles} from "./DiveEventFiles";
import {DiveGroupDetailsModal} from "./DiveGroupDetailsModal";

interface DiveGroupTableProps {
    diveGroups: DiveGroupResponse[];
    loading: boolean;
    currentUserId: number;
    canJoinDiveGroup: boolean;
    canReorderDiveGroups?: boolean;
    /** Whether the current user may edit every dive group of the event, which the backend grants the event organizer and administrators */
    canManageDiveGroups?: boolean;
    onJoin: (diveGroupId: number) => void;
    onLeave: (diveGroupId: number) => void;
    onDelete: (diveGroupId: number) => void;
    onReorder?: (diveGroupIds: number[]) => void;
    onFilesChanged?: () => void | Promise<void>;
    onDetailsUpdated?: (diveGroup: DiveGroupResponse) => void | Promise<void>;
}

export function isMemberOfDiveGroup(diveGroup: DiveGroupResponse, userId: number): boolean {
    return (diveGroup.members ?? []).some((member) => member.user_id === userId);
}

export function isImageDiveFile(diveFile: DiveFileResponse): boolean {
    return (diveFile.mimetype ?? "").startsWith("image/");
}

/**
 * Lists the dive files uploaded by the members of a dive group. Images are displayed inline with the shared
 * ProtectedImage component, other files are rendered as download links.
 */
export function DiveGroupFileList({diveFiles}: { diveFiles: DiveFileResponse[] }) {
    const {t} = useTranslation();

    if (diveFiles.length === 0) {
        return <Typography.Text type={"secondary"}>{t("DiveEvent.diveGroup.files.empty")}</Typography.Text>;
    }

    return (
            <Space orientation={"vertical"} size={8}>
                <Typography.Text strong>{t("DiveEvent.diveGroup.files.title")}</Typography.Text>
                {diveFiles.map((diveFile) => isImageDiveFile(diveFile)
                        ? <ProtectedImage
                                key={diveFile.id}
                                imageUrl={diveFile.url}
                                alt={diveFile.filename}
                                style={{maxWidth: 240}}/>
                        : <a key={diveFile.id} href={diveFile.url} target={"_blank"} rel={"noreferrer"}>
                            {diveFile.filename}
                        </a>)}
            </Space>
    );
}

export function findDiveGroupOfUser(diveGroups: DiveGroupResponse[], userId: number): DiveGroupResponse | null {
    return diveGroups.find((diveGroup) => isMemberOfDiveGroup(diveGroup, userId)) ?? null;
}

export function findDiveGroupOwnedByUser(diveGroups: DiveGroupResponse[], userId: number): DiveGroupResponse | null {
    return diveGroups.find((diveGroup) => diveGroup.owner_id === userId) ?? null;
}

/**
 * Sorts the dive groups by the order set by the organizer. Groups without an order keep the order in which they
 * were received, which is the creation order returned by the backend.
 */
export function sortDiveGroupsByOrder(diveGroups: DiveGroupResponse[]): DiveGroupResponse[] {
    return [...diveGroups].sort((first, second) => (first.group_order ?? 0) - (second.group_order ?? 0));
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
                                   canManageDiveGroups = false,
                                   onJoin,
                                   onLeave,
                                   onDelete,
                                   onReorder,
                                   onFilesChanged,
                                   onDetailsUpdated
                               }: DiveGroupTableProps) {
    const {t} = useTranslation();
    const {getPortalTimezone} = useSession();
    const [orderedDiveGroups, setOrderedDiveGroups] = useState<DiveGroupResponse[]>(() => sortDiveGroupsByOrder(diveGroups));
    const [draggedDiveGroupId, setDraggedDiveGroupId] = useState<number | null>(null);
    const [editedDiveGroup, setEditedDiveGroup] = useState<DiveGroupResponse | null>(null);

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

    function onDiveGroupDetailsUpdated(diveGroup: DiveGroupResponse): void {
        setEditedDiveGroup(null);
        setOrderedDiveGroups((current) => current.map((existing) => existing.id === diveGroup.id ? {...existing, ...diveGroup} : existing));
        onDetailsUpdated?.(diveGroup);
    }

    const memberColumns: OxColumnsType<DiveGroupMemberResponse> = [
        {
            title: t("DiveEvent.diveGroup.members.name"),
            dataIndex: "name",
            key: "name",
            mobile: true
        },
        {
            title: t("DiveEvent.diveGroup.members.userType"),
            dataIndex: "user_type",
            key: "user_type",
            filters: Object.values(UserTypeEnum).map((value) => ({text: t(`UserTypeEnum.${value.toLowerCase()}`), value})),
            render: (_: string, member: DiveGroupMemberResponse) => userTypeEnum2Tag(member.user_type, t, member.user_id)
        },
        {
            title: t("DiveEvent.diveGroup.members.owner"),
            dataIndex: "owner",
            key: "owner",
            render: (_: string, member: DiveGroupMemberResponse) => member.owner ? t("common.button.yes") : t("common.button.no")
        },
        {
            title: t("DiveEvent.diveGroup.members.joinedAt"),
            dataIndex: "joined_at",
            key: "joined_at",
            render: (_: string, member: DiveGroupMemberResponse) => member.joined_at
                ? dayjs(member.joined_at).tz(getPortalTimezone()).format("YYYY-MM-DD HH:mm")
                    : ""
        }
    ];

    const diveGroupColumns: OxColumnsType<DiveGroupResponse> = [
        {
            title: t("DiveEvent.diveGroup.table.order"),
            key: "group_order",
            render: (_: string, _diveGroup: DiveGroupResponse, index: number) => index + 1
        },
        {
            title: t("DiveEvent.diveGroup.table.name"),
            dataIndex: "name",
            key: "name",
            mobile: true
        },
        {
            title: t("DiveEvent.diveGroup.table.owner"),
            dataIndex: "owner_name",
            key: "owner_name",
            render: (_: string, diveGroup: DiveGroupResponse) => diveGroup.owner_name ?? ""
        },
        {
            title: t("DiveEvent.diveGroup.table.groupType"),
            dataIndex: "group_type",
            key: "group_type",
            filters: Object.values(DiveGroupTypeEnum).map((value) => ({text: t(`DiveGroupTypeEnum.${value.toLowerCase()}`), value})),
            render: (_: string, diveGroup: DiveGroupResponse) =>
                t("DiveGroupTypeEnum." + (diveGroup.group_type ?? DiveGroupTypeEnum.NORMAL).toLowerCase())
        },
        {
            title: t("DiveEvent.diveGroup.table.diveFiles"),
            dataIndex: "dive_files",
            key: "dive_files",
            render: (_: string, diveGroup: DiveGroupResponse) => (diveGroup.dive_files ?? []).length > 0
                ? t("DiveEvent.diveGroup.files.uploaded") + " (" + (diveGroup.dive_files ?? []).length + ")"
                    : t("DiveEvent.diveGroup.files.none")
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
                const isOwner = diveGroup.owner_id === currentUserId;
                const isMember = isMemberOfDiveGroup(diveGroup, currentUserId);
                // Mirrors the backend rule: members, the owner, the event organizer and administrators may edit the details
                const canEditDetails = isOwner || isMember || canManageDiveGroups;

                return (
                        <Space>
                            {canEditDetails &&
                                    <Button
                                            onClick={() => setEditedDiveGroup(diveGroup)}
                                            key={diveGroup.id + "-edit-dive-group-button"}>
                                        {t("DiveEvent.diveGroup.table.editButton")}
                                    </Button>
                            }
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
            <>
                <OxTable<DiveGroupResponse>
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
                                    <Space orientation={"vertical"} size={12} style={{width: "100%"}}>
                                        {/* The description is user-entered text and is deliberately rendered as plain text, never as HTML */}
                                        {diveGroup.description
                                                ? <Typography.Paragraph style={{whiteSpace: "pre-wrap", marginBottom: 0}}
                                                                        data-testid={"dive-group-description-" + diveGroup.id}>
                                                    {diveGroup.description}
                                                </Typography.Paragraph>
                                                : <Typography.Text type={"secondary"}>{t("DiveEvent.diveGroup.table.noDescription")}</Typography.Text>}
                                        <OxTable<DiveGroupMemberResponse>
                                                columns={memberColumns}
                                                dataSource={diveGroup.members ?? []}
                                                rowKey={"user_id"}
                                                pagination={false}
                                                size={"small"}
                                                locale={{emptyText: t("DiveEvent.diveGroup.members.empty")}}
                                        />
                                        <DiveEventFiles
                                            eventId={diveGroup.event_id}
                                                diveGroup={diveGroup}
                                                currentUserId={currentUserId}
                                                onUploaded={onFilesChanged}/>
                                        <DiveGroupFileList diveFiles={diveGroup.dive_files ?? []}/>
                                    </Space>
                            )
                        }}
                />
                <DiveGroupDetailsModal
                        open={editedDiveGroup !== null}
                        diveGroup={editedDiveGroup}
                        onCancel={() => setEditedDiveGroup(null)}
                        onUpdated={onDiveGroupDetailsUpdated}/>
            </>
    );
}
