import React from "react";
import {Link} from "react-router-dom";
import {ColumnsType} from "antd/es/table";
import {Button, Space} from "antd";
import {AbstractFileResponse} from "../../../models";
import {ProtectedImage} from "../../main";
import {useTranslation} from "react-i18next";
import {CloudDownloadOutlined, FileOutlined} from "@ant-design/icons";
import dayjs from "dayjs";

interface CommonFileColumnsOptions {
    showPreview?: boolean;
}

export function commonFileColumns({ showPreview = true }: CommonFileColumnsOptions): ColumnsType<AbstractFileResponse> {
    const {t} = useTranslation();

    return [
        {
            title: t("AdminUploads.common-file-column-title.filename"),
            dataIndex: "filename",
            key: "filename",
            render: (text: string) => <span>{text}</span>,
        },
        {
            title: t("AdminUploads.common-file-column-title.filesize"),
            dataIndex: "filesize",
            key: "filesize",
            render: (size: number) => <span>{(size / 1024).toFixed(2)} KB</span>,
        },
        {
            title: t("AdminUploads.common-file-column-title.creator"),
            dataIndex: "creator",
            key: "creator",
        },
        {
            title: t("AdminUploads.common-file-column-title.created-at"),
            dataIndex: "createdAt",
            key: "createdAt",
            render: (date: Date) => <span>{dayjs(date).format("YYYY.MM.DD HH:mm")}</span>,
        },
        {
            title: t("AdminUploads.common-file-column-title.download-link"),
            dataIndex: "url",
            key: "url",
            render: (url: string) => <Link to={url}><CloudDownloadOutlined style={{fontSize: '24px'}} /></Link>,
        },
        {
            title: t("AdminUploads.common-file-column-title.view"),
            dataIndex: "url",
            key: "thumbnail",
            render: (url: string) => (
                    showPreview ? (
                            <ProtectedImage
                                    style={{ width: "150px" }}
                                    imageUrl={url}
                                    alt="file"
                                    preview={showPreview}
                            />
                    ) : (
                            <FileOutlined style={{ fontSize: '24px' }} />
                    )
            )
        }
    ];
}

export interface ActionColumnOptions {
    onEdit?: (id: number) => void;
    onDelete?: (id: number) => void;
}

export function createActionColumn({ onEdit, onDelete }: ActionColumnOptions): ColumnsType<AbstractFileResponse> {
    const {t} = useTranslation();

    return [
        {
            title: t("AdminUploads.common-file-column-title.actions"),
            key: "actions",
            render: (_, record: AbstractFileResponse) => (
                    <Space size="middle">
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
            ),
        },
    ];
}