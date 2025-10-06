import {useEffect, useState} from "react";
import {Table, Typography} from "antd";
import {fileTransferAPI} from "../../../services";
import {type DiveFileResponse, UploadStatusEnum} from "../../../models";
import {commonFileColumns} from "./commonColumns";
import {useTranslation} from "react-i18next";

export function DiveFiles() {
    const [loading, setLoading] = useState<boolean>(true);
    const [diveFiles, setDiveFiles] = useState<DiveFileResponse[]>([]);
    const {t} = useTranslation();

    useEffect(() => {
        fileTransferAPI.findAllDiveFiles()
                .then((response) => {
                    setDiveFiles(response);
                })
                .catch((error) => {
                    console.error("Error fetching dive files", error);
                })
                .finally(() => {
                    setLoading(false);
                });
    }, []);

    const columns = [
        {
            title: t("AdminUploads.dive-file.event-id"),
            dataIndex: "eventId",
            key: "eventId",
            render: (id: number) => <Typography.Text>{id}</Typography.Text>,
        },
        {
            title: t("AdminUploads.dive-file.dive-group-id"),
            dataIndex: "diveGroupId",
            key: "diveGroupId",
            render: (id: number) => <Typography.Text>{id}</Typography.Text>,
        },
        {
            title: t("AdminUploads.dive-file.status"),
            dataIndex: "status",
            key: "status",
            render: (status: UploadStatusEnum) => (
                    <Typography.Text>{status}</Typography.Text>
            ),
        },
        ...commonFileColumns({showPreview: false})
    ];

    return (
            <Table
                    columns={columns}
                    dataSource={diveFiles}
                    rowKey="id"
                    loading={loading}
                    bordered
                    pagination={{pageSize: 5}}
            />
    );
}
