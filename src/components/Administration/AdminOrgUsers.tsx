import { useEffect, useState } from "react";
import { AdminUserResponse } from "../../models/responses/AdminUserResponse";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, Divider, Input, Space, Spin, Table, Tag } from "antd";
import { UpdateStatusEnum, UpdateStatusVO } from "../../models";
import { userAPI } from "../../services";
import { SubmitResult } from "../main";
import type { ColumnsType } from "antd/es/table";

export function AdminOrgUsers() {
    const [userList, setUserList] = useState<AdminUserResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [updateStatus, setUpdateStatus] = useState<UpdateStatusVO>({status: UpdateStatusEnum.NONE, message: ""});
    const [searchText, setSearchText] = useState<string>("");
    const navigate = useNavigate();
    const {t} = useTranslation();

    const userListColumns: ColumnsType<AdminUserResponse> = [
        {
            title: "#",
            dataIndex: "id",
            key: "id",
            render: (text: string, record: AdminUserResponse) => {
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
            render: (text: string, record: AdminUserResponse) => {
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
            title: t("AdminOrgUsers.table.role.title"),
            dataIndex: "roles",
            key: "roles",
            render: (_: any, record: AdminUserResponse) => (
                    <>
                        {record.roles.map((role) => {
                            let color = "";
                            let roleLabel = "";

                            if (role === "ROLE_ANONYMOUS") {
                                color = "red";
                                roleLabel = t("common.roles.anonymous");
                            }
                            if (role === "ROLE_USER") {
                                color = "green";
                                roleLabel = t("common.roles.user");
                            }
                            if (role === "ROLE_ORGANIZER") {
                                color = "blue";
                                roleLabel = t("common.roles.organizer");
                            }
                            if (role === "ROLE_ADMIN") {
                                color = "cyan";
                                roleLabel = t("common.roles.administrator");
                            }

                            return (
                                    <Tag color={color} key={role}>
                                        {roleLabel}
                                    </Tag>
                            );
                        })}
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

                            if (payment.paymentType === "PERIOD") {
                                color = "green";
                                paymentTypeLabel = t("common.payment.type.period");
                            }
                            if (payment.paymentType === "ONE_TIME") {
                                color = "blue";
                                paymentTypeLabel = t("common.payment.type.oneTime");
                            }

                            return (
                                    <Tag color={color} key={"payment-" + payment.paymentType}>
                                        {paymentTypeLabel}
                                    </Tag>
                            );
                        })}
                    </>
            ),
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
                            setUpdateStatus({status: UpdateStatusEnum.OK, message: t("AdminOrgUsers.invalidateTermAgreements.ok")});
                        } else {
                            setUpdateStatus({status: UpdateStatusEnum.FAIL, message: t("AdminOrgUsers.invalidateTermAgreements.fail")});
                        }
                    })
                    .catch(e => {
                        setUpdateStatus({status: UpdateStatusEnum.FAIL, message: t("AdminOrgUsers.invalidateTermAgreements.fail")});
                    })
                    .finally(() => {
                        setLoading(false);
                    });
        }
    }

    if (updateStatus.status !== UpdateStatusEnum.NONE) {
        return <SubmitResult updateStatus={updateStatus} navigate={navigate}/>;
    }

    return (
            <div className={"darkDiv"}>
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
                    <Divider orientation="left">{t("AdminOrgUsers.terms.resetDivider")}</Divider>
                    <Space direction={"horizontal"} size={12} style={{width: "100%", justifyContent: "center"}}>
                        <Button danger={true} type={"primary"} onClick={() => invalidateTermAgreements()}>{t("AdminOrgUsers.terms.resetButton")}</Button>
                    </Space>
                </Spin>
            </div>);
}