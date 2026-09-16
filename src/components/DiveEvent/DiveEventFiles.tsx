import {useEffect, useMemo, useState} from "react";
import {Button, InputNumber, message, Select, Space, Table, Typography, Upload, type UploadProps} from "antd";
import {UploadOutlined} from "@ant-design/icons";
import {type DiveFileResponse, type DiveGroupResponse, PortalConfigGroupEnum, RoleEnum} from "../../models";
import {fileTransferAPI} from "../../services";
import dayjs from "dayjs";
import {useTranslation} from "react-i18next";
import {checkRoles, FileUploadValidationError, validateUploadFile} from "../../tools";
import {useSession} from "../../session";

interface DiveEventFilesProps {
    eventId: number;
    diveGroup?: DiveGroupResponse;
    diveGroups?: DiveGroupResponse[];
    currentUserId?: number;
    onUploaded?: () => void | Promise<void>;
}

export function DiveEventFiles({eventId, diveGroup, diveGroups, currentUserId, onUploaded}: DiveEventFilesProps) {
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshKey, setRefreshKey] = useState<number>(0);
    const [diveFiles, setDiveFiles] = useState<DiveFileResponse[]>([]);
    const [diveGroupId, setDiveGroupId] = useState<number>(1);
    const [messageApi, contextHolder] = message.useMessage();
    const {t} = useTranslation();
    const {getPortalConfigurationValue, userSession} = useSession();
    const availableGroups = useMemo(() => diveGroup ? [diveGroup] : diveGroups, [diveGroup, diveGroups]);
    const memberGroups = useMemo(() => availableGroups?.filter((group) =>
            group.ownerId === currentUserId
            || (group.members ?? []).some((member) => member.userId === currentUserId)
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

    useEffect(() => {
        if (!diveFilesSupported) {
            return;
        }

        if (diveGroup) {
            return;
        }

        fileTransferAPI.findAllDiveFiles()
                .then((response) => {
                    setDiveFiles(response.filter((diveFile) => diveFile.eventId === eventId));
                })
                .catch((error) => {
                    console.error("Error fetching dive files", error);
                    messageApi.error(t("UserFiles.dive.fetchFail"));
                })
                .finally(() => {
                    setLoading(false);
                });
    }, [diveFilesSupported, diveGroup, eventId, messageApi, refreshKey, t]);

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
                setLoading(true);
                if (diveGroup) {
                    await onUploaded?.();
                } else {
                    setRefreshKey((key) => key + 1);
                }
                options.onSuccess?.(uploadResponse);
                messageApi.success(t("UserFiles.dive.upload.success"));
            } catch (error) {
                options.onError?.(error as Error);
                messageApi.error(t("UserFiles.dive.upload.fail"));
            } finally {
                setLoading(false);
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

    const columns = useMemo(() => {
        return [
            {
                title: t("UserFiles.dive.table.filename"),
                dataIndex: "filename",
                key: "filename"
            },
            {
                title: t("UserFiles.dive.table.diveGroupId"),
                dataIndex: "diveGroupId",
                key: "diveGroupId"
            },
            {
                title: t("UserFiles.dive.table.createdAt"),
                dataIndex: "createdAt",
                key: "createdAt",
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
                {!diveGroup && <Table
                        rowKey="id"
                        loading={loading}
                        dataSource={diveFiles}
                        columns={columns}
                        pagination={{hideOnSinglePage: true, defaultPageSize: 5}}
                />}
            </Space>
    );
}
