import {Tag, Typography} from "antd";
import {fileTransferAPI} from "../../../services";
import {type PageFileResponse, SortDirectionEnum, UploadStatusEnum} from "../../../models";
import {commonFileColumns} from "./commonColumns";
import {type OxColumnsType, OxTable, usePagedTable} from "../../main";
import {useTranslation} from "react-i18next";
import {Link} from "react-router-dom";

export function PageFiles() {
    const {t} = useTranslation();
    const pageFileTable = usePagedTable<PageFileResponse>((request) => fileTransferAPI.findAllPageFiles(request), {
        defaultSortBy: "created_at",
        defaultDirection: SortDirectionEnum.DESC
    });

    const columns: OxColumnsType<PageFileResponse> = [
        {
            title: t("AdminUploads.page-file.page-id"),
            dataIndex: "page_id",
            key: "page_id",
            mobile: true,
            sorter: true,
            sortDirections: ["descend", "ascend"],
            render: (pageId: number) => <Link to={"/pages/" + pageId}>{pageId}</Link>
        },
        {
            title: t("AdminUploads.page-file.language"),
            dataIndex: "language",
            key: "language",
            sorter: true,
            sortDirections: ["descend", "ascend"],
            render: (language: string) => <Typography.Text>{language}</Typography.Text>
        },
        {
            title: t("AdminUploads.page-file.status"),
            dataIndex: "status",
            key: "status",
            sorter: true,
            sortDirections: ["descend", "ascend"],
            filters: Object.values(UploadStatusEnum).map((value) => ({text: t(`UploadStatusEnum.${value.toLowerCase()}`), value})),
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
            }
        },
        ...commonFileColumns<PageFileResponse>(t, {showPreview: true})
    ];

    return (
        <>
            {pageFileTable.contextHolder}
            <OxTable
                columns={columns}
                dataMode={"server"}
                paged={pageFileTable}
                rowKey="id"
                bordered
            />
        </>
    );
}
