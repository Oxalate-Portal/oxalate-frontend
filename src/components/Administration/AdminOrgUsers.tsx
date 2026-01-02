import {type Key, useEffect, useState} from "react";
import {type AdminUserResponse, type PaymentResponse, PaymentTypeEnum} from "../../models";
import {Link} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {Button, Divider, Input, message, Space, Spin, Table, Tag} from "antd";
import {userAPI} from "../../services";
import type {ColumnsType} from "antd/es/table";
import {CheckOutlined, CloseOutlined, SearchOutlined} from "@ant-design/icons";
import {roleEnum2Tag} from "../../tools";
import dayjs from "dayjs";

export function AdminOrgUsers() {
    const [userList, setUserList] = useState<AdminUserResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const {t} = useTranslation();
    const [messageApi, contextHolder] = message.useMessage();

    const userListColumns: ColumnsType<AdminUserResponse> = [
        {
            title: t("AdminOrgUsers.table.login"),
            dataIndex: "username",
            key: "username",
            filterDropdown: ({setSelectedKeys, selectedKeys, confirm, clearFilters}) => (
                    <div style={{padding: 8}}>
                        <Input
                                placeholder={t("AdminOrgUsers.table.username")}
                                value={selectedKeys[0]}
                                onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                                onPressEnter={() => confirm()}
                                style={{marginBottom: 8, display: "block"}}
                        />
                        <Space>
                            <Button
                                    type="primary"
                                    onClick={() => confirm()}
                                    icon={<SearchOutlined/>}
                                    size="small"
                                    style={{width: 90}}
                            >
                                {t("common.button.search")}
                            </Button>
                            <Button onClick={() => {
                                clearFilters?.();
                                confirm();
                            }} size="small" style={{width: 90}}>
                                {t("common.button.reset")}
                            </Button>
                        </Space>
                    </div>
            ),
            sorter: (a: AdminUserResponse, b: AdminUserResponse) => a.username.localeCompare(b.username),
            filterIcon: (filtered: boolean) => <SearchOutlined style={{color: filtered ? "#1677ff" : undefined}}/>,
            onFilter: (value: boolean | Key, record: AdminUserResponse) => record.username.toLowerCase().includes((value as string).toLowerCase()),
            sortDirections: ["descend", "ascend"],
            render: (_: string, record: AdminUserResponse) => {
                return (<Link to={"/users/" + record.id + "/show"}>{record.username}</Link>);
            }
        },
        {
            title: t("AdminOrgUsers.table.firstName"),
            dataIndex: "firstName",
            key: "firstName",
            sorter: (a: AdminUserResponse, b: AdminUserResponse) => a.firstName.localeCompare(b.firstName),
            sortDirections: ["descend", "ascend"],
            filterDropdown: ({setSelectedKeys, selectedKeys, confirm, clearFilters}) => (
                    <div style={{padding: 8}}>
                        <Input
                                placeholder={t("AdminOrgUsers.table.firstName")}
                                value={selectedKeys[0]}
                                onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                                onPressEnter={() => confirm()}
                                style={{marginBottom: 8, display: "block"}}
                        />
                        <Space>
                            <Button
                                    type="primary"
                                    onClick={() => confirm()}
                                    icon={<SearchOutlined/>}
                                    size="small"
                                    style={{width: 90}}
                            >
                                {t("common.button.search")}
                            </Button>
                            <Button onClick={() => {
                                clearFilters?.();
                                confirm();
                            }} size="small" style={{width: 90}}>
                                {t("common.button.reset")}
                            </Button>
                        </Space>
                    </div>
            ),
            filterIcon: (filtered: boolean) => <SearchOutlined style={{color: filtered ? "#1677ff" : undefined}}/>,
            onFilter: (value: boolean | Key, record: AdminUserResponse) =>
                    record.firstName.toLowerCase().includes((value as string).toLowerCase())
        },
        {
            title: t("AdminOrgUsers.table.lastName"),
            dataIndex: "lastName",
            key: "lastName",
            sorter: (a: AdminUserResponse, b: AdminUserResponse) => a.lastName.localeCompare(b.lastName),
            sortDirections: ["descend", "ascend"],
            filterDropdown: ({setSelectedKeys, selectedKeys, confirm, clearFilters}) => (
                    <div style={{padding: 8}}>
                        <Input
                                placeholder={t("AdminOrgUsers.table.lastName")}
                                value={selectedKeys[0]}
                                onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                                onPressEnter={() => confirm()}
                                style={{marginBottom: 8, display: "block"}}
                        />
                        <Space>
                            <Button
                                    type="primary"
                                    onClick={() => confirm()}
                                    icon={<SearchOutlined/>}
                                    size="small"
                                    style={{width: 90}}
                            >
                                {t("common.button.search")}
                            </Button>
                            <Button onClick={() => {
                                clearFilters?.();
                                confirm();
                            }} size="small" style={{width: 90}}>
                                {t("common.button.reset")}
                            </Button>
                        </Space>
                    </div>
            ),
            filterIcon: (filtered: boolean) => <SearchOutlined style={{color: filtered ? "#1677ff" : undefined}}/>,
            onFilter: (value: boolean | Key, record: AdminUserResponse) =>
                    record.lastName.toLowerCase().includes((value as string).toLowerCase())
        },
        {
            title: t("AdminOrgUsers.table.status"),
            dataIndex: "status",
            key: "status",
            sorter: (a: AdminUserResponse, b: AdminUserResponse) => a.status.localeCompare(b.status),
            sortDirections: ["descend", "ascend"]
        },
        {
            title: t("AdminOrgUsers.table.approvedTerms"),
            dataIndex: "approvedTerms",
            key: "approvedTerms",
            sorter: (a: AdminUserResponse) => a.approvedTerms ? 1 : -1,
            sortDirections: ["descend", "ascend"],
            render: (_: any, record: AdminUserResponse) => {
                return record.approvedTerms ? <CheckOutlined style={{fontSize: "18px", color: "green"}}/> :
                        <CloseOutlined style={{fontSize: "18px", color: "red"}}/>;
            }
        },
        {
            title: t("AdminOrgUsers.table.role.title"),
            dataIndex: "roles",
            key: "roles",
            render: (_: any, record: AdminUserResponse) => (
                    <>
                        {record.roles
                                .slice()
                                .sort((a, b) => a.localeCompare(b))
                                .map((role) => roleEnum2Tag(role, t, record.id))}
                    </>
            ),
        },
        {
            title: t("AdminOrgUsers.table.paymentStatus"),
            dataIndex: "payments",
            key: "payments",
            render: (_: any, record: AdminUserResponse) => (
                    <>
                        {record.payments.map((payment: PaymentResponse) => {
                            if (dayjs(payment.startDate).isAfter(dayjs())
                                    || dayjs(payment.endDate).isBefore(dayjs())) {
                                return null;
                            }

                            let color = "";
                            let paymentTypeLabel = "";

                            if (payment.paymentType === PaymentTypeEnum.PERIODICAL) {
                                color = "green";
                                paymentTypeLabel = t("PaymentTypeEnum." + PaymentTypeEnum.PERIODICAL);
                            }
                            if (payment.paymentType === PaymentTypeEnum.ONE_TIME) {
                                color = "blue";
                                paymentTypeLabel = t("PaymentTypeEnum." + PaymentTypeEnum.ONE_TIME);
                            }

                            return (
                                    <Tag color={color} key={"payment-" + payment.paymentType + "-" + payment.id}>
                                        {paymentTypeLabel}
                                    </Tag>
                            );
                        })}
                    </>
            )
        },
        {
            title: t("AdminOrgUsers.table.action.title"),
            key: "action",
            render: (_: any, record: AdminUserResponse) => (
                    <Space size="middle">
                        {record.status !== "ANONYMIZED" &&
                                <Link to={"/administration/users/" + record.id}><Button>{t("AdminOrgUsers.table.action.button")}</Button></Link>}
                    </Space>
            ),
        }
    ];

    useEffect(() => {
        setLoading(true);
        userAPI.findAll()
                .then(response => {
                    setUserList(response);
                })
                .catch(error => {
                    console.error("Error:", error);
                })
                .finally(() => {
                    setLoading(false);
                });
    }, []);

    function invalidateTermAgreements() {
        if (window.confirm(t("AdminOrgUsers.invalidateTermAgreements.confirm"))) {
            setLoading(true);
            userAPI.resetTerms()
                    .then(response => {
                        if (response) {
                            messageApi.success(t("AdminOrgUsers.invalidateTermAgreements.ok"));
                        } else {
                            messageApi.error(t("AdminOrgUsers.invalidateTermAgreements.fail"));
                        }
                    })
                    .catch(e => {
                        messageApi.error(t("AdminOrgUsers.invalidateTermAgreements.fail"));
                        console.error("Failed to reset term agreements, error: " + e.message);
                    })
                    .finally(() => {
                        setLoading(false);
                    });
        }
    }

    return (
            <div className={"darkDiv"}>
                {contextHolder}
                <h4>{t("AdminOrgUsers.title")}</h4>
                <Spin spinning={loading}>
                    {userList && <Table dataSource={userList}
                                        rowKey="id"
                                        columns={userListColumns}
                                        pagination={{
                                            defaultPageSize: 5,
                                            hideOnSinglePage: true,
                                            showSizeChanger: true,
                                            showQuickJumper: true,
                                            total: userList.length,
                                            pageSizeOptions: ["5", "10", "20", "30", "50", "100"]
                                        }}/>}
                    {!userList && <p>{t("AdminOrgUsers.search.spinText")}</p>}
                    <Divider orientation={"horizontal"} titlePlacement={"left"}>{t("AdminOrgUsers.terms.resetDivider")}</Divider>
                    <Space orientation={"horizontal"} size={12} style={{width: "100%", justifyContent: "center"}}>
                        <Button danger={true} type={"primary"} onClick={() => invalidateTermAgreements()}>{t("AdminOrgUsers.terms.resetButton")}</Button>
                    </Space>
                </Spin>
            </div>);
}