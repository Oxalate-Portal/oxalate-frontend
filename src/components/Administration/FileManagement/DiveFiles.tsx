import {useEffect, useState} from "react";
import {Table, Typography} from "antd";
import {fileTransferAPI} from "../../../services";
import {type DiveFileResponse, PortalConfigGroupEnum, UploadStatusEnum} from "../../../models";
import {commonFileColumns} from "./commonColumns";
import {useTranslation} from "react-i18next";
import {useSession} from "../../../session";

export function DiveFiles() {
    const [loading, setLoading] = useState<boolean>(true);
    const [diveFiles, setDiveFiles] = useState<DiveFileResponse[]>([]);
    const {t} = useTranslation();
    const {getPortalConfigurationValue} = useSession();
    const diveFilesSupported = getPortalConfigurationValue(PortalConfigGroupEnum.FILES, "dive-files-supported") === "true";

    useEffect(() => {
        if (!diveFilesSupported) {
            return;
        }

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
    }, [diveFilesSupported]);

    if (!diveFilesSupported) {
        return null;
    }

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
        ...commonFileColumns(t, {showPreview: false})
    ];

    return (
            <Table
                    columns={columns}
                    dataSource={diveFiles}
                    rowKey="id"
                    loading={loading}
                    bordered
                    pagination={{
                        defaultPageSize: 10,
                        hideOnSinglePage: true,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        pageSizeOptions: ["5", "10", "20", "30", "50"]
                    }}
            />
    );
}
