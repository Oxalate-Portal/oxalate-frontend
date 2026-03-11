import {useEffect, useState} from "react";
import {Table} from "antd";
import {fileTransferAPI} from "../../../services";
import type {AvatarFileResponse} from "../../../models";
import {commonFileColumns} from "./commonColumns";
import {useTranslation} from "react-i18next";

export function AvatarFiles() {
    const [loading, setLoading] = useState<boolean>(true);
    const [avatarFiles, setAvatarFiles] = useState<AvatarFileResponse[]>([]);
    const {t} = useTranslation();

    useEffect(() => {
        fileTransferAPI.findAllAvatarFiles()
                .then((response) => {
                    setAvatarFiles(response);
                })
                .catch((error) => {
                    console.error("Error fetching avatar files", error);
                })
                .finally(() => {
                    setLoading(false);
                });
    }, []);

    const columns = [...commonFileColumns(t, {showPreview: true})];

    return (
            <>
                {!loading && <Table
                        columns={columns}
                        dataSource={avatarFiles}
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
                />}
            </>
    );
}
