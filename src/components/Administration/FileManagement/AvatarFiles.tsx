import {useEffect, useState} from "react";
import {Table} from "antd";
import {fileTransferAPI} from "../../../services";
import type {AvatarFileResponse} from "../../../models";
import {commonFileColumns} from "./commonColumns";

export function AvatarFiles() {
    const [loading, setLoading] = useState<boolean>(true);
    const [avatarFiles, setAvatarFiles] = useState<AvatarFileResponse[]>([]);

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

    const columns = [...commonFileColumns({showPreview: true})];

    return (
            <>
                {!loading && <Table
                        columns={columns}
                        dataSource={avatarFiles}
                        rowKey="id"
                        loading={loading}
                        bordered
                        pagination={{pageSize: 5}}
                />}
            </>
    );
}
