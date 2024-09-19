import React, { useEffect, useState } from "react";
import { Table, Tag, Typography } from "antd";
import { fileTransferAPI } from "../../../services";
import { PageFileResponse, UploadStatusEnum } from "../../../models/responses/filetransfers";
import { commonFileColumns } from "./commonColumns";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export function PageFiles() {
    const [loading, setLoading] = useState<boolean>(true);
    const [pageFiles, setPageFiles] = useState<PageFileResponse[]>([]);
    const {t} = useTranslation();

    useEffect(() => {
        fileTransferAPI.findAllPageFiles()
                .then((response) => {
                    setPageFiles(response);
                })
                .catch((error) => {
                    console.error("Error fetching page files", error);
                })
                .finally(() => {
                    setLoading(false);
                });
    }, []);

    const columns = [
        {
            title: t("AdminUploads.page-file.page-id"),
            dataIndex: "pageId",
            key: "pageId",
            render: (pageId: number) => <Link to={"/pages/" + pageId}>{pageId}</Link>,
        },
        {
            title: t("AdminUploads.page-file.language"),
            dataIndex: "language",
            key: "language",
            render: (language: string) => <Typography.Text>{language}</Typography.Text>,
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status: UploadStatusEnum) => {
                let color = "";

                if (status === UploadStatusEnum.UPLOADED) {
                    color = "blue";
                }
                if (status === UploadStatusEnum.PUBLISHED) {
                    color = "green";
                }
                if (status === UploadStatusEnum.DELETED) {
                    color = "red";
                }

                return (
                        <Tag color={color} key={status}>
                            {status}
                        </Tag>
                );
            },
        },
        ...commonFileColumns({showPreview: true})
    ];

    return (
            <Table
                    columns={columns}
                    dataSource={pageFiles}
                    rowKey="id"
                    loading={loading}
                    bordered
                    pagination={{pageSize: 5}}
            />
    );
}
