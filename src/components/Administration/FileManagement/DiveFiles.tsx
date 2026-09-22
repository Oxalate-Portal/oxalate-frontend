import {Typography} from "antd";
import {fileTransferAPI} from "../../../services";
import {type DiveFileResponse, PortalConfigGroupEnum, SortDirectionEnum, UploadStatusEnum} from "../../../models";
import {commonFileColumns} from "./commonColumns";
import {type OxColumnsType, OxTable, usePagedTable} from "../../main";
import {useTranslation} from "react-i18next";
import {useSession} from "../../../session";

export function DiveFiles() {
    const {t} = useTranslation();
    const {getPortalConfigurationValue} = useSession();
    const diveFilesSupported = getPortalConfigurationValue(PortalConfigGroupEnum.FILES, "dive-files-supported") === "true";
    const diveFileTable = usePagedTable<DiveFileResponse>((request) => fileTransferAPI.findAllDiveFiles(request), {
        defaultSortBy: "created_at",
        defaultDirection: SortDirectionEnum.DESC,
        enabled: diveFilesSupported
    });

    if (!diveFilesSupported) {
        return null;
    }

    const columns: OxColumnsType<DiveFileResponse> = [
        {
            title: t("AdminUploads.dive-file.event-id"),
            dataIndex: "event_id",
            key: "event_id",
            mobile: true,
            sorter: true,
            sortDirections: ["descend", "ascend"],
            render: (id: number) => <Typography.Text>{id}</Typography.Text>
        },
        {
            title: t("AdminUploads.dive-file.dive-group-id"),
            dataIndex: "dive_group_id",
            key: "dive_group_id",
            sorter: true,
            sortDirections: ["descend", "ascend"],
            render: (id: number) => <Typography.Text>{id}</Typography.Text>
        },
        {
            title: t("AdminUploads.dive-file.status"),
            dataIndex: "status",
            key: "status",
            sorter: true,
            sortDirections: ["descend", "ascend"],
            filters: Object.values(UploadStatusEnum).map((value) => ({text: t(`UploadStatusEnum.${value.toLowerCase()}`), value})),
            render: (status: UploadStatusEnum) => (
                <Typography.Text>{status}</Typography.Text>
            )
        },
        ...commonFileColumns<DiveFileResponse>(t, {showPreview: false})
    ];

    return (
        <>
            {diveFileTable.contextHolder}
            <OxTable
                columns={columns}
                dataMode={"server"}
                paged={diveFileTable}
                rowKey="id"
                bordered
            />
        </>
    );
}
