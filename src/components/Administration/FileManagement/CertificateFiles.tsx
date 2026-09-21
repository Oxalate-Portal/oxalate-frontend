import {fileTransferAPI} from "../../../services";
import {type CertificateFileResponse, SortDirectionEnum} from "../../../models";
import {commonFileColumns} from "./commonColumns";
import {type OxColumnsType, OxTable, usePagedTable} from "../../main";
import {useTranslation} from "react-i18next";

export function CertificateFiles() {
    const {t} = useTranslation();
    const certificateTable = usePagedTable<CertificateFileResponse>((request) => fileTransferAPI.findAllCertificateFiles(request), {
        defaultSortBy: "created_at",
        defaultDirection: SortDirectionEnum.DESC
    });

    const columns: OxColumnsType<CertificateFileResponse> = [
        {
            title: t("AdminUploads.certificate.certificate-id"),
            dataIndex: "certificate_id",
            key: "certificate_id",
            mobile: true,
            sorter: true,
            sortDirections: ["descend", "ascend"]
        },
        ...commonFileColumns<CertificateFileResponse>(t, {showPreview: true})
    ];

    return (
        <>
            {certificateTable.contextHolder}
            <OxTable
                columns={columns}
                dataSource={certificateTable.dataSource}
                rowKey="id"
                loading={certificateTable.loading}
                bordered
                pagination={certificateTable.pagination}
                onChange={certificateTable.handleTableChange}
            />
        </>
    );
}
