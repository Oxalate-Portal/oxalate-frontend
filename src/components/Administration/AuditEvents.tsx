import {Select, Tag} from "antd";
import {useTranslation} from "react-i18next";
import {formatDateTimeWithMs} from "../../tools";
import {useState} from "react";
import {type AuditEntryResponse, AuditLevelEnum, SortDirectionEnum} from "../../models";
import {auditAPI, type AuditFilterColumn} from "../../services";
import type {OxColumnsType} from "../main";
import {OxTable, OxTableSearch, usePagedTable} from "../main";
import Highlighter from "react-highlight-words";

const FILTER_COLUMNS: AuditFilterColumn[] = ["user_name", "trace_id", "source", "address", "message"];

/** Translation key of each filter column; the wire names are snake_case while the locale keys keep their camelCase names. */
const FILTER_COLUMN_LABEL_KEYS: Record<AuditFilterColumn, string> = {
    user_name: "AuditEvents.filter.userName",
    trace_id: "AuditEvents.filter.traceId",
    source: "AuditEvents.filter.source",
    address: "AuditEvents.filter.address",
    message: "AuditEvents.filter.message"
};

export function AuditEvents() {
    const {t} = useTranslation();
    const [filterColumn, setFilterColumn] = useState<AuditFilterColumn>("user_name");
    // The server pages, sorts and searches the audit trail; `filterColumn` picks the column the search text is
    // matched against, so changing it refetches the current page.
    const auditTable = usePagedTable<AuditEntryResponse>((request) => auditAPI.findPagedAudits(request, filterColumn), {
        defaultSortBy: "created_at",
        defaultDirection: SortDirectionEnum.DESC,
        defaultPageSize: 10,
        deps: [filterColumn]
    });
    const searchText = auditTable.search.trim();

    const highlighted = (column: AuditFilterColumn) => (text: string) =>
        filterColumn === column && searchText !== "" ? (
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
            render: highlighted("user_name")
        },
        {
            title: t("AuditEvents.table.traceId"),
            dataIndex: "trace_id",
            key: "trace_id",
            sorter: true,
            sortDirections: ["descend", "ascend"],
            render: highlighted("trace_id")
        },
        {
            title: t("AuditEvents.table.source"),
            dataIndex: "source",
            key: "source",
            sorter: true,
            sortDirections: ["descend", "ascend"],
            render: highlighted("source")
        },
        {
            title: t("AuditEvents.table.level"),
            dataIndex: "level",
            key: "level",
            sorter: true,
            sortDirections: ["descend", "ascend"],
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
            render: highlighted("address")
        },
        {
            title: t("AuditEvents.table.message"),
            dataIndex: "message",
            key: "message",
            sorter: true,
            sortDirections: ["descend", "ascend"],
            render: highlighted("message")
        }
    ];

    return (<div className={"darkDiv"}>
        {auditTable.contextHolder}
        <h4>{t("AuditEvents.title")}</h4>

        <OxTableSearch value={auditTable.search}
                       onSearch={auditTable.setSearch}
                       caseSensitive={auditTable.caseSensitive}
                       onCaseSensitiveChange={auditTable.setCaseSensitive}
                       placeholder={t("AuditEvents.search.placeholder")}>
            <Select<AuditFilterColumn>
                value={filterColumn}
                onChange={setFilterColumn}
                aria-label={t("AuditEvents.search.filterColumn")}
                style={{flex: "0 1 180px", minWidth: 140}}
                options={FILTER_COLUMNS.map((column) => ({value: column, label: t(FILTER_COLUMN_LABEL_KEYS[column])}))}
            />
        </OxTableSearch>
        <OxTable dataSource={auditTable.dataSource}
                 columns={auditColumns}
                 pagination={auditTable.pagination}
                 loading={auditTable.loading}
                 rowKey={"id"}
                 onChange={auditTable.handleTableChange}
        />
    </div>);
}
