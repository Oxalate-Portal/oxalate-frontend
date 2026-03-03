import {Button, Input, type InputRef, Space, Spin, Table, type TablePaginationConfig, Tag} from "antd";
import {useTranslation} from "react-i18next";
import {formatDateTimeWithMs} from "../../tools";
import {useEffect, useRef, useState} from "react";
import {type AuditEntryResponse, AuditLevelEnum, type SortableTableParams} from "../../models";
import {auditAPI} from "../../services";
import type {ColumnsType, ColumnType} from "antd/es/table";
import type {FilterConfirmProps, FilterValue, SorterResult} from "antd/es/table/interface";
import {SearchOutlined} from "@ant-design/icons";
import Highlighter from "react-highlight-words";

type AuditEntryIndex = keyof AuditEntryResponse;

export function AuditEvents() {
    const defaultFilterColumn: string = "userName";
    const {t} = useTranslation();
    const [loading, setLoading] = useState<boolean>(true);
    const [auditEvents, setAuditEvents] = useState<AuditEntryResponse[]>([]);
    const refreshDataFromServer = useRef(true); // useRef to track whether data should be fetched or not

    const [tablePaginationConfig, setTablePaginationConfig] = useState<TablePaginationConfig>({
        current: 1,
        pageSize: 10,
        defaultPageSize: 10,
        total: 0,
        pageSizeOptions: ["5", "10", "20", "30", "50", "100"],
        showSizeChanger: true,
        hideOnSinglePage: false,
    });

    const [tableParams, setTableParams] = useState<SortableTableParams>({
        sortField: "",
        sortOrder: "",
        pagination: tablePaginationConfig,
        columnKey: "createdAt",
        field: "createdAt",
        order: "descend",
        filter: "",
        filters: {},
        filterColumn: defaultFilterColumn
    });

    const [filterText, setFilterText] = useState("");
    const [filteredColumn, setFilteredColumn] = useState(defaultFilterColumn);
    const searchInput = useRef<InputRef>(null);

    const handleReset = (clearFilters: () => void) => {
        clearFilters();
        setFilterText("");
    };
    const getColumnSearchProps = (auditEntryKey: AuditEntryIndex): ColumnType<AuditEntryResponse> => ({
        filterDropdown: ({setSelectedKeys, selectedKeys, confirm, clearFilters, close}) => (
                <div style={{padding: 8}} onKeyDown={(e) => e.stopPropagation()}>
                    <Input
                            ref={searchInput}
                            placeholder={`Search ${auditEntryKey}`}
                            value={selectedKeys[0]}
                            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                            onPressEnter={() => handleSearch(selectedKeys as string[], confirm, auditEntryKey)}
                            style={{marginBottom: 8, display: "block"}}
                    />
                    <Space>
                        <Button
                                type={"primary"}
                                onClick={() => handleSearch(selectedKeys as string[], confirm, auditEntryKey)}
                                icon={<SearchOutlined/>}
                                size="small"
                                style={{width: 90}}
                        >
                            Search
                        </Button>
                        <Button
                                onClick={() => clearFilters && handleReset(clearFilters)}
                                size="small"
                                style={{width: 90}}
                        >
                            Reset
                        </Button>
                        <Button
                                type="link"
                                size="small"
                                onClick={() => {
                                    confirm({closeDropdown: false});
                                    setFilterText((selectedKeys as string[])[0]);
                                    setFilteredColumn(auditEntryKey);
                                }}
                        >
                            Filter
                        </Button>
                        <Button
                                type="link"
                                size="small"
                                onClick={() => {
                                    close();
                                }}
                        >
                            close
                        </Button>
                    </Space>
                </div>
        ),
        filterIcon: (filtered: boolean) => (
                <SearchOutlined style={{color: filtered ? "#1677ff" : undefined}}/>
        ),
        onFilter: (value, record) =>
                record[auditEntryKey]
                        .toString()
                        .toLowerCase()
                        .includes((value as string).toLowerCase()),
        onFilterDropdownOpenChange: (visible) => {
            if (visible) {
                setTimeout(() => searchInput.current?.select(), 100);
            }
        },
        render: (text) =>
                filteredColumn === auditEntryKey ? (
                        <Highlighter
                                highlightStyle={{backgroundColor: "#ffc069", padding: 0}}
                                searchWords={[filterText]}
                                autoEscape
                                textToHighlight={text ? text.toString() : ""}
                        />
                ) : (
                        text
                ),
    });

    const auditColumns: ColumnsType<AuditEntryResponse> = [
        {
            title: t("AuditEvents.table.createdAt"),
            dataIndex: "createdAt",
            key: "createdAt",
            sorter: true,
            sortDirections: ["descend", "ascend"],
            render: (_, record) => {
                return (<>{formatDateTimeWithMs(record.createdAt)}</>);
            }
        },
        {
            title: t("AuditEvents.table.userName"),
            dataIndex: "userName",
            key: "userName",
            sorter: (a, b) => a.userName.localeCompare(b.userName),
            sortDirections: ["descend", "ascend"],
            ...getColumnSearchProps("userName")
        },
        {
            title: t("AuditEvents.table.traceId"),
            dataIndex: "traceId",
            key: "traceId",
            ...getColumnSearchProps("traceId")
        },
        {
            title: t("AuditEvents.table.source"),
            dataIndex: "source",
            key: "source",
            ...getColumnSearchProps("source")
        },
        {
            title: t("AuditEvents.table.level"),
            dataIndex: "level",
            key: "level",
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
            }),
            ...getColumnSearchProps("level")
        },
        {
            title: t("AuditEvents.table.address"),
            dataIndex: "address",
            sorter: true,
            key: "address",
            ...getColumnSearchProps("address")
        },
        {
            title: t("AuditEvents.table.message"),
            dataIndex: "message",
            key: "message",
            ...getColumnSearchProps("message")
        }
    ];


    useEffect(() => {
        if (!refreshDataFromServer.current) {
            return;
        }

        const currentPage = Math.max(1, tablePaginationConfig.current ?? 1);
        const requestParams: Record<string, string | number> = {
            page: Math.max(0, currentPage - 1),
            pageSize: tablePaginationConfig.pageSize ?? 10,
            filter: tableParams.filter ?? "",
            filterColumn: filteredColumn
        };

        if (tableParams.field) {
            requestParams.sorting = `${tableParams.field},${tableParams.order}`;
        }

        auditAPI.findPageable(requestParams)
                .then((response) => {
                    setAuditEvents(response.content);

                    const responsePage = response.pageable?.pageNumber ?? response.number ?? response.page ?? 0;
                    const responsePageSize = response.pageable?.pageSize ?? response.size ?? tablePaginationConfig.pageSize ?? 10;
                    const responseTotal = response.totalElements ?? response.total_elements ?? response.content.length;

                    // AntD pagination is 1-based, backend page is 0-based.
                    const nextPaginationConfig: TablePaginationConfig = {
                        current: Math.max(1, responsePage + 1),
                        pageSize: responsePageSize,
                        defaultPageSize: 10,
                        total: responseTotal,
                        pageSizeOptions: ["5", "10", "20", "30", "50", "100"],
                        showSizeChanger: true,
                        hideOnSinglePage: false
                    };

                    setTablePaginationConfig(nextPaginationConfig);
                    setTableParams((previousParams) => ({
                        ...previousParams,
                        pagination: nextPaginationConfig
                    }));
                })
                .catch((error) => {
                    console.error(error);
                })
                .finally(() => {
                    setLoading(false);
                    refreshDataFromServer.current = false;
                });
    }, [filteredColumn, tablePaginationConfig, tableParams.field, tableParams.filter, tableParams.order]);

    function handleTableChange(tablePaginationConfig: TablePaginationConfig, filters: Record<string, FilterValue | null>,
                               sorter: SorterResult<AuditEntryResponse> | SorterResult<AuditEntryResponse>[]) {
        setLoading(true);

        const safePaginationConfig: TablePaginationConfig = {
            ...tablePaginationConfig,
            current: Math.max(1, tablePaginationConfig.current ?? 1)
        };

        setTablePaginationConfig(safePaginationConfig);

        if (filters) {
            setTableParams({
                ...tableParams,
                pagination: safePaginationConfig,
                filters: filters,
            });
        }

        if (sorter) {
            // At this point we only sort by one column
            let primarySorter: null | SorterResult<AuditEntryResponse>;

            if (Array.isArray(sorter)) {
                primarySorter = sorter[0];
            } else {
                primarySorter = sorter;
            }

            setTableParams({
                ...tableParams,
                pagination: safePaginationConfig,
                field: primarySorter.field === undefined ? defaultFilterColumn : primarySorter.field.toString(),
                order: primarySorter.order === "ascend" ? "asc" : "desc"
            });
        }

        refreshDataFromServer.current = true;
    }

    function handleSearch(searchText: string[], _confirm: (param?: FilterConfirmProps) => void,
                          dataIndex: AuditEntryIndex) {
        setLoading(true);
        setFilterText(searchText[0]);
        setFilteredColumn(dataIndex);
        setTableParams({
            ...tableParams,
            filter: searchText[0],
            filterColumn: dataIndex,
            pagination: {
                ...tableParams.pagination,
                current: 1, // Reset the current page to 1
            },
        });
        // We need to reset also the tablePaginationConfig.current to 1, otherwise the table will not be updated
        setTablePaginationConfig({
            ...tablePaginationConfig,
            current: 1
        });
        refreshDataFromServer.current = true;
    }

    return (<div className={"darkDiv"}>
        <h4>{t("AuditEvents.title")}</h4>

        <Spin spinning={loading}>
            <Table dataSource={auditEvents}
                   columns={auditColumns}
                   pagination={tablePaginationConfig}
                   loading={loading}
                   rowKey={"id"}
                   onChange={handleTableChange}
            />
        </Spin>
    </div>);
}