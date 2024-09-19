import React, { useEffect, useState } from "react";
import { Table } from "antd";
import { fileTransferAPI } from "../../../services";
import { CertificateFileResponse } from "../../../models/responses/filetransfers";
import { commonFileColumns } from "./commonColumns";
import { useTranslation } from "react-i18next";

export function CertificateFiles() {
    const [loading, setLoading] = useState<boolean>(true);
    const [certificateFiles, setCertificateFiles] = useState<CertificateFileResponse[]>([]);
    const {t} = useTranslation();

    useEffect(() => {
        fileTransferAPI.findAllCertificateFiles()
                .then((response) => {
                    setCertificateFiles(response);
                })
                .catch((error) => {
                    console.error("Error fetching certificate files", error);
                })
                .finally(() => {
                    setLoading(false);
                });
    }, []);

    const columns = [
        {
            title: t("AdminUploads.certificate.certificate-id"),
            dataIndex: "certificateId",
            key: "certificateId",
        },
        ...commonFileColumns({showPreview: false})
    ];

    return (
            <Table
                    columns={columns}
                    dataSource={certificateFiles}
                    rowKey="id"
                    loading={loading}
                    bordered
                    pagination={{pageSize: 5}}
            />
    );
}
