import React, { useEffect, useState } from "react";
import { UploadOutlined } from "@ant-design/icons";
import { Button, message, Space, Table, Typography, Upload, UploadProps } from "antd";
import { fileTransferAPI } from "../../../services";
import { DocumentFileResponse, UploadStatusEnum } from "../../../models/responses/filetransfers";
import { ActionColumnOptions, commonFileColumns, createActionColumn } from "./commonColumns";
import { useSession } from "../../../session";
import { useTranslation } from "react-i18next";

export function DocumentFiles() {
    const [loading, setLoading] = useState<boolean>(true);
    const [documentFiles, setDocumentFiles] = useState<DocumentFileResponse[]>([]);
    const {userSession} = useSession();
    const [refreshKey, setRefreshKey] = useState<number>(0);
    const {t} = useTranslation();

    useEffect(() => {
        fileTransferAPI.findAllDocuments()
                .then((response) => {
                    setDocumentFiles(response);
                })
                .catch((error) => {
                    console.error("Error fetching document files", error);
                })
                .finally(() => {
                    setLoading(false);
                });
    }, [refreshKey]);

    const actionColumnOptions: ActionColumnOptions = {
        onDelete: (id: number) => removeDocument(id)
    };
    const columns = [
        ...commonFileColumns({showPreview: false}),
        {
            title: t("AdminUploads.document.status"),
            dataIndex: "status",
            key: "status",
            render: (status: UploadStatusEnum) => (
                    <Typography.Text>{status}</Typography.Text>
            ),
        },
        ...createActionColumn(actionColumnOptions)
    ];

    const uploadProps: UploadProps = {
        name: "uploadFile",
        action: `${import.meta.env.VITE_APP_API_URL}` + "/files/documents",
        headers: {
            authorization: "Bearer " + userSession?.accessToken,
        },
        onChange(info) {
            if (info.file.status !== "uploading") {
            }
            if (info.file.status === "done") {
                setRefreshKey((prevKey) => prevKey + 1);
                message.success(info.file.name + " " + t("AdminUploads.document.upload.successful"));
            } else if (info.file.status === "error") {
                message.error(info.file.name + " " + t("AdminUploads.document.upload.fail"));
            }
        },
        showUploadList: false,
        accept: ".pdf"
    };

    function removeDocument(id: number) {
        setLoading(true);
        fileTransferAPI.removeDocumentFile(id)
                .then(() => {
                    setRefreshKey((prevKey) => prevKey + 1);
                    message.success(t("AdminUploads.document.delete.successful"));
                })
                .catch((error) => {
                    console.error("Error removing document", error);
                    message.error(t("AdminUploads.document.delete.fail"));
                })
                .finally(() => {
                    setLoading(false);
                });
    }

    return (
            <Space direction={"vertical"} size={"middle"}>
                <Upload {...uploadProps} key={"upload-document-" + refreshKey}>
                    <Button icon={<UploadOutlined/>}>
                        {t("AdminUploads.document.upload.button")}
                    </Button>
                </Upload>
                {!loading &&
                        <Table
                                columns={columns}
                                dataSource={documentFiles}
                                rowKey="id"
                                loading={loading}
                                bordered
                                key={"upload-table-document"}
                                pagination={{pageSize: 5}}
                        />
                }
            </Space>
    );
}
