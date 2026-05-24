import {useEffect, useMemo, useState} from "react";
import {Button, message, Space, Table, Typography, Upload, type UploadProps} from "antd";
import {UploadOutlined} from "@ant-design/icons";
import {fileTransferAPI} from "../../services";
import {type DocumentFileResponse, PortalConfigGroupEnum} from "../../models";
import {FileUploadValidationError, validateUploadFile} from "../../tools/FileUploadValidation";
import {useTranslation} from "react-i18next";
import dayjs from "dayjs";
import {useSession} from "../../session";

interface UserDocumentFilesProps {
    userId: number;
    creatorName: string;
    canUpload: boolean;
}

export function filterDocumentsForCreator(documents: DocumentFileResponse[], creatorName: string): DocumentFileResponse[] {
    return documents.filter((document) => document.creator === creatorName);
}

export function UserDocumentFiles({userId, creatorName, canUpload}: UserDocumentFilesProps) {
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshKey, setRefreshKey] = useState<number>(0);
    const [documents, setDocuments] = useState<DocumentFileResponse[]>([]);
    const [messageApi, contextHolder] = message.useMessage();
    const {t} = useTranslation();
    const {getPortalConfigurationValue} = useSession();
    const documentsSupported = getPortalConfigurationValue(PortalConfigGroupEnum.FILES, "documents-supported") === "true";

    useEffect(() => {
        if (!documentsSupported) {
            return;
        }

        fileTransferAPI.findAllDocuments(userId)
                .then((response) => {
                    setDocuments(filterDocumentsForCreator(response, creatorName));
                })
                .catch((error) => {
                    console.error("Error fetching document files", error);
                    messageApi.error(t("UserFiles.document.fetchFail"));
                })
                .finally(() => {
                    setLoading(false);
                });
    }, [creatorName, documentsSupported, messageApi, refreshKey, t, userId]);

    const uploadProps: UploadProps = {
        showUploadList: false,
        customRequest: async (options) => {
            try {
                setLoading(true);
                const uploadResponse = await fileTransferAPI.uploadDocumentFile(options.file as File);
                setRefreshKey((key) => key + 1);
                options.onSuccess?.(uploadResponse);
                messageApi.success(t("UserFiles.document.upload.success"));
            } catch (error) {
                options.onError?.(error as Error);
                messageApi.error(t("UserFiles.document.upload.fail"));
            } finally {
                setLoading(false);
            }
        },
        beforeUpload: (file) => {
            const validation = validateUploadFile(file, "document");

            if (!validation.valid) {
                if (validation.error === FileUploadValidationError.INVALID_TYPE) {
                    messageApi.error(t("UserFiles.document.upload.invalidType"));
                } else {
                    messageApi.error(t("UserFiles.document.upload.fileTooLarge"));
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
                title: t("UserFiles.document.table.filename"),
                dataIndex: "filename",
                key: "filename"
            },
            {
                title: t("UserFiles.document.table.createdAt"),
                dataIndex: "createdAt",
                key: "createdAt",
                render: (value: Date) => dayjs(value).format("YYYY.MM.DD HH:mm")
            },
            {
                title: t("UserFiles.document.table.download"),
                dataIndex: "url",
                key: "url",
                render: (url: string) => (
                        <a href={url} target="_blank" rel="noreferrer">{t("UserFiles.document.download")}</a>
                )
            }
        ];
    }, [t]);

    if (!documentsSupported) {
        return null;
    }

    return (
            <Space orientation={"vertical"} size={12} style={{width: "100%"}}>
                {contextHolder}
                <Typography.Title level={5}>{t("UserFiles.document.title")}</Typography.Title>
                {canUpload && (
                        <Upload {...uploadProps}>
                            <Button icon={<UploadOutlined/>}>{t("UserFiles.document.upload.button")}</Button>
                        </Upload>
                )}
                <Table
                        rowKey="id"
                        loading={loading}
                        dataSource={documents}
                        columns={columns}
                        pagination={{hideOnSinglePage: true, defaultPageSize: 5}}
                />
            </Space>
    );
}

