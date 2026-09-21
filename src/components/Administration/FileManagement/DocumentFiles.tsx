import {useState} from "react";
import {UploadOutlined} from "@ant-design/icons";
import {Button, message, Space, Typography, Upload, type UploadProps} from "antd";
import {fileTransferAPI, getApiBaseUrl} from "../../../services";
import {type DocumentFileResponse, PortalConfigGroupEnum, SortDirectionEnum, UploadStatusEnum} from "../../../models";
import {type ActionColumnOptions, commonFileColumns, createActionColumn} from "./commonColumns";
import {type OxColumnsType, OxTable, OxTableSearch, usePagedTable} from "../../main";
import {useSession} from "../../../session";
import {useTranslation} from "react-i18next";

export function DocumentFiles() {
    const [deleting, setDeleting] = useState<boolean>(false);
    const {getPortalConfigurationValue, userSession} = useSession();
    const [refreshKey, setRefreshKey] = useState<number>(0);
    const {t} = useTranslation();
    const [messageApi, contextHolder] = message.useMessage();
    const documentsSupported = getPortalConfigurationValue(PortalConfigGroupEnum.FILES, "documents-supported") === "true";
    const documentTable = usePagedTable<DocumentFileResponse>((request) => fileTransferAPI.findAllDocuments(request), {
        messageApi,
        defaultSortBy: "created_at",
        defaultDirection: SortDirectionEnum.DESC,
        enabled: documentsSupported
    });
    const {reload} = documentTable;

    if (!documentsSupported) {
        return null;
    }

    const actionColumnOptions: ActionColumnOptions = {
        onDelete: (id: number) => removeDocument(id)
    };
    const columns: OxColumnsType<DocumentFileResponse> = [
        ...commonFileColumns<DocumentFileResponse>(t, {showPreview: false}),
        {
            title: t("AdminUploads.document.status"),
            dataIndex: "status",
            key: "status",
            sorter: true,
            sortDirections: ["descend", "ascend"],
            render: (status: UploadStatusEnum) => (
                <Typography.Text>{status}</Typography.Text>
            )
        },
        ...createActionColumn<DocumentFileResponse>(t, actionColumnOptions)
    ];

    const uploadProps: UploadProps = {
        name: "uploadFile",
        action: `${getApiBaseUrl()}/files/documents`,
        headers: {
            authorization: "Bearer " + userSession?.access_token
        },
        onChange(info) {
            if (info.file.status === "done") {
                setRefreshKey((prevKey) => prevKey + 1);
                reload();
                messageApi.success(info.file.name + " " + t("AdminUploads.document.upload.successful"));
            } else if (info.file.status === "error") {
                messageApi.error(info.file.name + " " + t("AdminUploads.document.upload.fail"));
            }
        },
        showUploadList: false,
        accept: ".pdf"
    };

    function removeDocument(id: number) {
        setDeleting(true);
        fileTransferAPI.removeDocumentFile(id)
            .then(() => {
                reload();
                messageApi.success(t("AdminUploads.document.delete.successful"));
            })
            .catch((error) => {
                console.error("Error removing document", error);
                messageApi.error(t("AdminUploads.document.delete.fail"));
            })
            .finally(() => {
                setDeleting(false);
            });
    }

    return (
        <Space orientation={"vertical"} size={"middle"} style={{width: "100%"}}>
            {contextHolder}
            <Upload {...uploadProps} key={"upload-document-" + refreshKey}>
                <Button icon={<UploadOutlined/>}>
                    {t("AdminUploads.document.upload.button")}
                </Button>
            </Upload>
            <OxTableSearch value={documentTable.search}
                           onSearch={documentTable.setSearch}
                           caseSensitive={documentTable.caseSensitive}
                           onCaseSensitiveChange={documentTable.setCaseSensitive}/>
            <OxTable
                columns={columns}
                dataSource={documentTable.dataSource}
                rowKey="id"
                loading={documentTable.loading || deleting}
                bordered
                key={"upload-table-document"}
                pagination={documentTable.pagination}
                onChange={documentTable.handleTableChange}
            />
        </Space>
    );
}
