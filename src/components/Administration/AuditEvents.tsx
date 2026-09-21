import {Tag} from "antd";
import {useTranslation} from "react-i18next";
import {formatDateTimeWithMs} from "../../tools";
import {type AuditEntryResponse, AuditLevelEnum, SortDirectionEnum} from "../../models";
import {auditAPI} from "../../services";
import type {OxColumnsType} from "../main";
import {OxTable, usePagedTable} from "../main";
import Highlighter from "react-highlight-words";

export function AuditEvents() {
    const {t} = useTranslation();
    const auditTable = usePagedTable<AuditEntryResponse>((request) => auditAPI.findPagedAudits(request), {
        defaultSortBy: "created_at",
        defaultDirection: SortDirectionEnum.DESC,
        defaultPageSize: 10
    });
    const searchText = auditTable.search.trim();

    const highlighted = (text: string) =>
        searchText !== "" ? (
            <Highlighter
                highlightStyle={{backgroundColor: "#ffc069", padding: 0}}
                searchWords={[searchText]}
                autoEscape
                caseSensitive={auditTable.caseSensitive}
                textToHighlight={text ? text.toString() : ""}
            />
        ) : (
            text
        );

    const auditColumns: OxColumnsType<AuditEntryResponse> = [
        {
            title: t("AuditEvents.table.createdAt"),
            dataIndex: "created_at",
            key: "created_at",
            sorter: true,
            defaultSortOrder: "descend",
            sortDirections: ["descend", "ascend"],
            render: (_, record) => {
                return (<>{formatDateTimeWithMs(record.created_at)}</>);
            }
        },
        {
            title: t("AuditEvents.table.userName"),
            dataIndex: "user_name",
            key: "user_name",
            mobile: true,
            sorter: true,
            sortDirections: ["descend", "ascend"],
            render: highlighted
        },
        {
            title: t("AuditEvents.table.traceId"),
            dataIndex: "trace_id",
            key: "trace_id",
            sorter: true,
            sortDirections: ["descend", "ascend"],
            render: highlighted
        },
        {
            title: t("AuditEvents.table.source"),
            dataIndex: "source",
            key: "source",
            sorter: true,
            sortDirections: ["descend", "ascend"],
            render: highlighted
        },
        {
            title: t("AuditEvents.table.level"),
            dataIndex: "level",
            key: "level",
            sorter: true,
            sortDirections: ["descend", "ascend"],
            filters: Object.values(AuditLevelEnum).map((value) => ({text: t(`AuditLevelEnum.${value.toLowerCase()}`), value})),
            render: ((level) => {
                let color = "";

                if (level === AuditLevelEnum.ERROR) {
                    color = "red";
                }
                if (level === AuditLevelEnum.WARN) {
                    color = "orange";
                }
                if (level === AuditLevelEnum.INFO) {
                    color = "blue";
                }

                return (
                    <Tag color={color} key={level}>
                        {level}
                    </Tag>
                );
            })
        },
        {
            title: t("AuditEvents.table.address"),
            dataIndex: "address",
            key: "address",
            sorter: true,
            sortDirections: ["descend", "ascend"],
            render: highlighted
        },
        {
            title: t("AuditEvents.table.message"),
            dataIndex: "message",
            key: "message",
            sorter: true,
            sortDirections: ["descend", "ascend"],
            render: highlighted
        }
    ];

    return (<div className={"darkDiv"}>
        {auditTable.contextHolder}
        <h4>{t("AuditEvents.title")}</h4>

        <OxTable dataSource={auditTable.dataSource}
                 columns={auditColumns}
                 pagination={auditTable.pagination}
                 loading={auditTable.loading}
                 rowKey={"id"}
                 onChange={auditTable.handleTableChange}
        />
    </div>);
}
