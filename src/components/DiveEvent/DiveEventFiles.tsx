import {useMemo, useState} from "react";
import {Button, InputNumber, message, Select, Space, Typography, Upload, type UploadProps} from "antd";
import {UploadOutlined} from "@ant-design/icons";
import {type DiveFileResponse, type DiveGroupResponse, PortalConfigGroupEnum, RoleEnum} from "../../models";
import {fileTransferAPI} from "../../services";
import dayjs from "dayjs";
import {useTranslation} from "react-i18next";
import {checkRoles, FileUploadValidationError, validateUploadFile} from "../../tools";
import {useSession} from "../../session";
import {type OxColumnsType, OxTable, PAGED_TABLE_PAGE_SIZE_OPTIONS} from "../main";

interface DiveEventFilesProps {
    eventId: number;
    diveGroup?: DiveGroupResponse;
    diveGroups?: DiveGroupResponse[];
    currentUserId?: number;
    onUploaded?: () => void | Promise<void>;
}

export function DiveEventFiles({eventId, diveGroup, diveGroups, currentUserId, onUploaded}: DiveEventFilesProps) {
    const [uploading, setUploading] = useState<boolean>(false);
    const [reloadToken, setReloadToken] = useState<number>(0);
    const [diveGroupId, setDiveGroupId] = useState<number>(1);
    const [messageApi, contextHolder] = message.useMessage();
    const {t} = useTranslation();
    const {getPortalConfigurationValue, userSession} = useSession();
    const availableGroups = useMemo(() => diveGroup ? [diveGroup] : diveGroups, [diveGroup, diveGroups]);
    const memberGroups = useMemo(() => availableGroups?.filter((group) =>
        group.owner_id === currentUserId
        || (group.members ?? []).some((member) => member.user_id === currentUserId)
    ) ?? [], [availableGroups, currentUserId]);
    const canUpload = availableGroups !== undefined
            ? memberGroups.length > 0
            : userSession !== null && checkRoles(userSession.roles, [RoleEnum.ROLE_USER]);
    const diveFilesSupported = typeof getPortalConfigurationValue === "function"
            ? getPortalConfigurationValue(PortalConfigGroupEnum.FILES, "dive-files-supported") === "true"
            : true;
    const selectedDiveGroupId = diveGroup
            ? diveGroup.id
            : availableGroups !== undefined
                    ? memberGroups.some((group) => group.id === diveGroupId) ? diveGroupId : memberGroups[0]?.id ?? 0
                    : diveGroupId;

    // An event has a handful of files, so the table is in client mode: OxTable collects every file of this event
    // from the paged endpoint (100 per request) and sorts, filters and pages them in the browser. The dive group
    // variant renders no table, so nothing is fetched for it.
    const reload = () => setReloadToken((previous) => previous + 1);

    const uploadProps: UploadProps = {
        showUploadList: false,
        customRequest: async (options) => {
            if (selectedDiveGroupId <= 0) {
                messageApi.error(t("UserFiles.dive.upload.invalidDiveGroupId"));
                options.onError?.(new Error("Invalid dive group ID"));
                return;
            }

            try {
                const uploadResponse = await fileTransferAPI.uploadDiveFile(options.file as File, eventId, selectedDiveGroupId);
                setUploading(true);
                if (diveGroup) {
                    await onUploaded?.();
                } else {
                    reload();
                }
                options.onSuccess?.(uploadResponse);
                messageApi.success(t("UserFiles.dive.upload.success"));
            } catch (error) {
                options.onError?.(error as Error);
                messageApi.error(t("UserFiles.dive.upload.fail"));
            } finally {
                setUploading(false);
            }
        },
        beforeUpload: (file) => {
            const validation = validateUploadFile(file, "dive");

            if (!validation.valid) {
                if (validation.error === FileUploadValidationError.INVALID_TYPE) {
                    messageApi.error(t("UserFiles.dive.upload.invalidType"));
                } else {
                    messageApi.error(t("UserFiles.dive.upload.fileTooLarge"));
                }
                return false;
            }

            return true;
        },
        accept: "image/gif,image/jpeg,image/jpg,image/png,application/pdf"
    };

    const columns: OxColumnsType<DiveFileResponse> = useMemo(() => {
        return [
            {
                title: t("UserFiles.dive.table.filename"),
                dataIndex: "filename",
                key: "filename",
                mobile: true,
                sorter: true,
                sortDirections: ["descend", "ascend"]
            },
            {
                title: t("UserFiles.dive.table.diveGroupId"),
                dataIndex: "dive_group_id",
                key: "dive_group_id",
                sorter: true,
                sortDirections: ["descend", "ascend"]
            },
            {
                title: t("UserFiles.dive.table.createdAt"),
                dataIndex: "created_at",
                key: "created_at",
                sorter: true,
                defaultSortOrder: "descend",
                sortDirections: ["descend", "ascend"],
                render: (value: Date) => dayjs(value).format("YYYY.MM.DD HH:mm")
            },
            {
                title: t("UserFiles.dive.table.download"),
                dataIndex: "url",
                key: "url",
                render: (url: string) => (
                        <a href={url} target="_blank" rel="noreferrer">{t("UserFiles.dive.download")}</a>
                )
            }
        ];
    }, [t]);

    if (!diveFilesSupported) {
        return null;
    }

    return (
            <Space orientation={"vertical"} size={12} style={{width: "100%"}}>
                {contextHolder}
                {!diveGroup && <Typography.Title level={5}>{t("UserFiles.dive.title")}</Typography.Title>}
                {canUpload && (
                        <Space size={8} wrap>
                            {!diveGroup && <>
                                <Typography.Text>{t("UserFiles.dive.upload.diveGroupLabel")}</Typography.Text>
                                {availableGroups === undefined
                                        ? <InputNumber min={1} value={diveGroupId || 1} onChange={(value) => setDiveGroupId(value ?? 1)}/>
                                        : <Select
                                                value={selectedDiveGroupId || undefined}
                                                onChange={setDiveGroupId}
                                                options={memberGroups.map((group) => ({value: group.id, label: group.name}))}
                                                aria-label={t("UserFiles.dive.upload.diveGroupLabel")}
                                        />}
                            </>}
                            <Upload {...uploadProps}>
                                <Button icon={<UploadOutlined/>}>{t("UserFiles.dive.upload.button")}</Button>
                            </Upload>
                        </Space>
                )}
                {!diveGroup && <OxTable<DiveFileResponse>
                        rowKey="id"
                        loading={uploading}
                        fetcher={(request) => fileTransferAPI.findAllDiveFiles(request, eventId)}
                        fetchDeps={[eventId]}
                        reloadToken={reloadToken}
                        messageApi={messageApi}
                        columns={columns}
                        pagination={{defaultPageSize: 5, showSizeChanger: true, pageSizeOptions: PAGED_TABLE_PAGE_SIZE_OPTIONS}}
                />}
            </Space>
    );
}
