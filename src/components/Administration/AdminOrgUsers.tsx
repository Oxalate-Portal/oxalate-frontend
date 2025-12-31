import {useEffect, useState} from "react";
import {type AdminUserResponse, PaymentTypeEnum} from "../../models";
import {Link} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {Button, Divider, Input, message, Space, Spin, Table, Tag} from "antd";
import {userAPI} from "../../services";
import type {ColumnsType} from "antd/es/table";
import {CheckOutlined, CloseOutlined} from "@ant-design/icons";
import {roleEnum2Tag} from "../../tools";

export function AdminOrgUsers() {
    const [userList, setUserList] = useState<AdminUserResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchText, setSearchText] = useState<string>("");
    const {t} = useTranslation();
    const [messageApi, contextHolder] = message.useMessage();

    const userListColumns: ColumnsType<AdminUserResponse> = [
        {
            title: "#",
            dataIndex: "id",
            key: "id",
            render: (_: string, record: AdminUserResponse) => {
                return (<Link to={"/users/" + record.id + "/show"}>{record.id}</Link>);
            }
        },
        {
            title: t("AdminOrgUsers.table.login"),
            dataIndex: "username",
            key: "username",
            filteredValue: [searchText],
            onFilter: (value: any, record: AdminUserResponse) =>
                    record.username.toLowerCase().includes(value.toLowerCase()) ||
                    record.firstName.toLowerCase().includes(value.toLowerCase()) ||
                    record.lastName.toLowerCase().includes(value.toLowerCase()) ||
                    record.status.toLowerCase().includes(value.toLowerCase())
            ,
            sorter: (a: AdminUserResponse, b: AdminUserResponse) => a.username.localeCompare(b.username),
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
            sortDirections: ["descend", "ascend"]
        },
        {
            title: t("AdminOrgUsers.table.lastName"),
            dataIndex: "lastName",
            key: "lastName",
            sorter: (a: AdminUserResponse, b: AdminUserResponse) => a.lastName.localeCompare(b.lastName),
            sortDirections: ["descend", "ascend"]
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
                        {record.payments.map((payment) => {
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
                    <Input.Search
                            placeholder={t("AdminOrgUsers.search.placeholder")}
                            onSearch={value => setSearchText(value)}
                            onChange={e => setSearchText(e.target.value)}
                            enterButton/>
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