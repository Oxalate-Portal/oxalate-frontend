import {Link} from "react-router-dom";
import {Button, Space} from "antd";
import type {AbstractFileResponse} from "../../../models";
import {type OxColumnsType, ProtectedImage} from "../../main";
import type {TFunction} from "i18next";
import {CloudDownloadOutlined, FileOutlined} from "@ant-design/icons";
import dayjs from "dayjs";

interface CommonFileColumnsOptions {
    showPreview?: boolean;
}

/**
 * The columns shared by every file table. The file lists are paged, sorted and searched on the server, so the sortable
 * columns carry `sorter: true`, the default order is the newest file first, and only the columns the backend searches
 * (`filename`, `creator`; `mimetype` has no column) are `searchable`.
 */
export function commonFileColumns<T extends AbstractFileResponse = AbstractFileResponse>(t: TFunction, {showPreview = true}: CommonFileColumnsOptions = {}): OxColumnsType<T> {
    return [
        {
            title: t("AdminUploads.common-file-column-title.filename"),
            dataIndex: "filename",
            key: "filename",
            mobile: true,
            searchable: true,
            sorter: true,
            sortDirections: ["descend", "ascend"],
            render: (text: string) => <span>{text}</span>
        },
        {
            title: t("AdminUploads.common-file-column-title.filesize"),
            dataIndex: "filesize",
            key: "filesize",
            sorter: true,
            sortDirections: ["descend", "ascend"],
            render: (size: number) => <span>{(size / 1024).toFixed(2)} KB</span>
        },
        {
            title: t("AdminUploads.common-file-column-title.creator"),
            dataIndex: "creator",
            key: "creator",
            searchable: true,
            sorter: true,
            sortDirections: ["descend", "ascend"]
        },
        {
            title: t("AdminUploads.common-file-column-title.created-at"),
            dataIndex: "created_at",
            key: "created_at",
            sorter: true,
            defaultSortOrder: "descend",
            sortDirections: ["descend", "ascend"],
            render: (date: Date) => <span>{dayjs(date).format("YYYY.MM.DD HH:mm")}</span>
        },
        {
            title: t("AdminUploads.common-file-column-title.download-link"),
            dataIndex: "url",
            key: "url",
            render: (url: string) => <Link to={url}><CloudDownloadOutlined style={{fontSize: "24px"}}/></Link>
        },
        {
            title: t("AdminUploads.common-file-column-title.view"),
            dataIndex: "url",
            key: "thumbnail",
            render: (url: string) => (
                    showPreview ? (
                            <ProtectedImage
                                    style={{width: "150px"}}
                                    imageUrl={url}
                                    alt={t("AdminUploads.common-file-column-title.preview")}
                                    preview={showPreview}
                            />
                    ) : (
                            <FileOutlined style={{fontSize: "24px"}}/>
                    )
            )
        }
    ];
}

export interface ActionColumnOptions {
    onEdit?: (id: number) => void;
    onDelete?: (id: number) => void;
}

export function createActionColumn<T extends AbstractFileResponse = AbstractFileResponse>(t: TFunction, {
    onEdit,
    onDelete
}: ActionColumnOptions): OxColumnsType<T> {
    return [
        {
            title: t("AdminUploads.common-file-column-title.actions"),
            key: "actions",
            render: (_, record: T) => (
                    <Space size={"middle"}>
                        {onEdit && (
                                <Button onClick={() => onEdit(record.id)} type="link">
                                    {t("common.button.update")}
                                </Button>
                        )}
                        {onDelete && (
                                <Button onClick={() => onDelete(record.id)} type="link" danger>
                                    {t("common.button.delete")}
                                </Button>
                        )}
                    </Space>
            )
        }
    ];
}
