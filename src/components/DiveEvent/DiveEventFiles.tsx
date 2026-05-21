import {useEffect, useMemo, useState} from "react";
import {Button, InputNumber, message, Space, Table, Typography, Upload, type UploadProps} from "antd";
import {UploadOutlined} from "@ant-design/icons";
import {type DiveFileResponse, RoleEnum} from "../../models";
import {fileTransferAPI} from "../../services";
import dayjs from "dayjs";
import {useTranslation} from "react-i18next";
import {checkRoles} from "../../tools";
import {FileUploadValidationError, validateUploadFile} from "../../tools/FileUploadValidation";
import {useSession} from "../../session";

interface DiveEventFilesProps {
    eventId: number;
}

export function DiveEventFiles({eventId}: DiveEventFilesProps) {
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshKey, setRefreshKey] = useState<number>(0);
    const [diveFiles, setDiveFiles] = useState<DiveFileResponse[]>([]);
    const [diveGroupId, setDiveGroupId] = useState<number>(1);
    const [messageApi, contextHolder] = message.useMessage();
    const {t} = useTranslation();
    const {userSession} = useSession();
    const canUpload = userSession !== null && checkRoles(userSession.roles, [RoleEnum.ROLE_USER]);

    useEffect(() => {
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
    }, [eventId, messageApi, refreshKey, t]);

    const uploadProps: UploadProps = {
        showUploadList: false,
        customRequest: async (options) => {
            if (diveGroupId <= 0) {
                messageApi.error(t("UserFiles.dive.upload.invalidDiveGroupId"));
                options.onError?.(new Error("Invalid dive group ID"));
                return;
            }

            try {
                const uploadResponse = await fileTransferAPI.uploadDiveFile(options.file as File, eventId, diveGroupId);
                setLoading(true);
                setRefreshKey((key) => key + 1);
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

    return (
            <Space direction={"vertical"} size={12} style={{width: "100%"}}>
                {contextHolder}
                <Typography.Title level={5}>{t("UserFiles.dive.title")}</Typography.Title>
                {canUpload && (
                        <Space size={8} wrap>
                            <Typography.Text>{t("UserFiles.dive.upload.diveGroupLabel")}</Typography.Text>
                            <InputNumber min={1} value={diveGroupId} onChange={(value) => setDiveGroupId(value ?? 1)}/>
                            <Upload {...uploadProps}>
                                <Button icon={<UploadOutlined/>}>{t("UserFiles.dive.upload.button")}</Button>
                            </Upload>
                        </Space>
                )}
                <Table
                        rowKey="id"
                        loading={loading}
                        dataSource={diveFiles}
                        columns={columns}
                        pagination={{hideOnSinglePage: true, defaultPageSize: 5}}
                />
            </Space>
    );
}

