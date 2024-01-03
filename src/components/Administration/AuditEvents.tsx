import {Flex, Input, Select, Spin, Table, TablePaginationConfig, Tag} from "antd";
import {useTranslation} from "react-i18next";
import {formatDateTimeWithMs} from "../../helpers";
import {useCallback, useEffect, useRef, useState} from "react";
import {ColumnsType} from "antd/lib/table";
import {AuditEntryResponse} from "../../models/responses";
import {AuditLevelEnum, SortableTableParams} from "../../models";
import {auditAPI} from "../../services";
import {FilterValue, SorterResult} from "antd/es/table/interface";

export function AuditEvents() {
    const {t} = useTranslation();
    const [loading, setLoading] = useState<boolean>(true);
    const [auditEvents, setAuditEvents] = useState<AuditEntryResponse[]>([]);
    const [filterColumn, setFilterColumn] = useState<string>('userName');
    const refreshDataFromServer = useRef(true); // useRef to track whether data should be fetched or not

    const [tablePaginationConfig, setTablePaginationConfig] = useState<TablePaginationConfig>({
        current: 1,
        pageSize: 10,
        defaultPageSize: 10,
        total: 0,
        pageSizeOptions: ['5', '10', '20', '30', '50', '100'],
        showSizeChanger: true,
        hideOnSinglePage: false,
    });

    const [tableParams, setTableParams] = useState<SortableTableParams>({
        sortField: "",
        sortOrder: "",
        pagination: tablePaginationConfig,
        columnKey: 'createdAt',
        field: 'createdAt',
        order: 'descend',
        filter: '',
        filters: {},
        filterColumn: 'message'
    });

    const auditColumns: ColumnsType<AuditEntryResponse> = [
        {
            title: t('AuditEvents.table.createdAt'),
            dataIndex: 'createdAt',
            key: 'createdAt',
            sorter: true,
            sortDirections: ['descend', 'ascend'],
            render: (_, record) => {
                return (<>{formatDateTimeWithMs(record.createdAt)}</>);
            }
        },
        {
            title: t('AuditEvents.table.userName'),
            dataIndex: 'userName',
            key: 'userName',
            sorter: (a, b) => a.userName.localeCompare(b.userName),
            sortDirections: ['descend', 'ascend']
        },
        {
            title: t('AuditEvents.table.traceId'),
            dataIndex: 'traceId',
            key: 'traceId'
        },
        {
            title: t('AuditEvents.table.source'),
            dataIndex: 'source',
            key: 'source'
        },
        {
            title: t('AuditEvents.table.level'),
            dataIndex: 'level',
            key: 'level',
            render: ((level) => {
                let color = '';

                if (level === AuditLevelEnum.ERROR) {
                    color = 'red';
                }
                if (level === AuditLevelEnum.WARN) {
                    color = 'orange';
                }
                if (level === AuditLevelEnum.INFO) {
                    color = 'blue';
                }

                return (
                        <Tag color={color} key={level}>
                            {level}
                        </Tag>
                );
            })
        },
        {
            title: t('AuditEvents.table.address'),
            dataIndex: 'address',
            sorter: true,
            key: 'address'
        },
        {
            title: t('AuditEvents.table.message'),
            dataIndex: 'message',
            key: 'message',
        }
    ];


    const updateDataFromServer = useCallback(() => {
        console.debug("refreshData: got first parameter:", refreshDataFromServer.current);
        if (refreshDataFromServer.current) {
            auditAPI.findAll({
                page: tablePaginationConfig.current,
                pageSize: tablePaginationConfig.pageSize,
                sorting: tableParams.field ? `${tableParams.field},${tableParams.order}` : null,
                filter: tableParams.filter,
                filterColumn: filterColumn
            })
                    .then((response) => {
                        setAuditEvents(response.content);
                        setLoading(false);

                        setTablePaginationConfig(
                                {
                                    current: response.pageable.pageNumber,
                                    pageSize: response.pageable.pageSize,
                                    defaultPageSize: 10,
                                    total: response.totalElements,
                                    pageSizeOptions: ['5', '10', '20', '30', '50', '100'],
                                    showSizeChanger: true,
                                    hideOnSinglePage: false
                                }
                        )

                        setTableParams({
                            ...tableParams,
                            pagination: tablePaginationConfig
                        })
                    })
                    .catch((error) => {
                        console.error(error);
                        setLoading(false);
                    });
        }
    }, [filterColumn, tableParams, tablePaginationConfig]);

    useEffect(() => {
        setLoading(true);
        updateDataFromServer();
        setLoading(false);
        refreshDataFromServer.current = false;
    }, [updateDataFromServer]);

    const handleFilterColumnChange = (value: string) => {
        console.debug("handleFilterColumnChange: got first parameter:", value);
        setFilterColumn(value);
    };

    function handleTableChange(tablePaginationConfig: TablePaginationConfig, filters: Record<string, FilterValue | null>,
                               sorter: SorterResult<AuditEntryResponse> | SorterResult<AuditEntryResponse>[]) {
        console.debug("handleTableChange: got pagination parameter:", tablePaginationConfig);
        console.debug("handleTableChange: got filter parameter:", filters);
        console.debug("handleTableChange: got sorter parameter:", sorter);
        setTablePaginationConfig(tablePaginationConfig);
        refreshDataFromServer.current = true;
    }

    function handleSearch(searchText: string) {
        console.log("Searching for: " + searchText);
        setTableParams({
            ...tableParams,
            filter: searchText,
            filterColumn: filterColumn,
            pagination: {
                ...tableParams.pagination,
                current: 1, // Reset the current page to 1
            },
        });
        refreshDataFromServer.current = true;
    }


    return (<div className={'darkDiv'}>
        <h4>{t('AuditEvents.title')}</h4>

        <Flex>
            <Select
                    style={{width: 120, marginRight: 8}}
                    defaultValue={filterColumn}
                    onChange={handleFilterColumnChange}
            >
                <Select.Option value="userName">{t('AuditEvents.filter.userName')}</Select.Option>
                <Select.Option value="traceId">{t('AuditEvents.filter.traceId')}</Select.Option>
                <Select.Option value="source">{t('AuditEvents.filter.source')}</Select.Option>
                <Select.Option value="address">{t('AuditEvents.filter.address')}</Select.Option>
                <Select.Option value="message">{t('AuditEvents.filter.message')}</Select.Option>
            </Select>
            <Input.Search
                    placeholder={t('AuditEvents.search.placeholder')}
                    onSearch={value => handleSearch(value)}
                    enterButton
            />
        </Flex>
        <Spin spinning={loading}>
            <Table dataSource={auditEvents}
                   columns={auditColumns}
                   pagination={tablePaginationConfig}
                   loading={loading}
                   rowKey={'id'}
                   onChange={handleTableChange}
            />
        </Spin>
    </div>);
}
