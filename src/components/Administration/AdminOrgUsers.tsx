import {useState} from "react";
import {type AdminUserResponse, type PaymentResponse, PaymentTypeEnum, SortDirectionEnum, UserStatusEnum} from "../../models";
import {Link} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {Button, Divider, message, Space, Spin, Tag} from "antd";
import {adminUserAPI, userAPI} from "../../services";
import type {OxColumnsType} from "../main";
import {OxTable, usePagedTable} from "../main";
import {CheckOutlined, CheckSquareOutlined, CloseOutlined} from "@ant-design/icons";
import {roleEnum2Tag} from "../../tools";
import dayjs from "dayjs";

export function AdminOrgUsers() {
    const [loading, setLoading] = useState<boolean>(false);
    const {t} = useTranslation();
    const [messageApi, contextHolder] = message.useMessage();
    // Paging, sorting (id, username, firstName, lastName, status, approvedTerms, healthStatementId) and the
    // username/first name/last name search all happen on the server (`searchable: true` on those columns). The only column filter the users endpoint
    // serves is the `status` enum; `approved_terms`, `health_statement_id`, `roles` and `payments` are computed or
    // collection columns without a server filter, so they carry no `filters` in this server-mode table.
    const userTable = usePagedTable<AdminUserResponse>((request) => adminUserAPI.findPaged(request), {
        messageApi,
        defaultSortBy: "id",
        defaultDirection: SortDirectionEnum.ASC,
        defaultPageSize: 10
    });

    const userListColumns: OxColumnsType<AdminUserResponse> = [
        {
            title: t("AdminOrgUsers.table.login"),
            dataIndex: "username",
            key: "username",
            mobile: true,
            searchable: true,
            sorter: true,
            sortDirections: ["descend", "ascend"],
            render: (_: string, record: AdminUserResponse) => {
                return (<Link to={"/users/" + record.id + "/show"}>{record.username}</Link>);
            }
        },
        {
            title: t("AdminOrgUsers.table.firstName"),
            dataIndex: "first_name",
            key: "first_name",
            searchable: true,
            sorter: true,
            sortDirections: ["descend", "ascend"]
        },
        {
            title: t("AdminOrgUsers.table.lastName"),
            dataIndex: "last_name",
            key: "last_name",
            searchable: true,
            sorter: true,
            sortDirections: ["descend", "ascend"]
        },
        {
            title: t("AdminOrgUsers.table.certificateClassification"),
            dataIndex: "certificate_classification_title",
            key: "certificate_classification_title",
            render: (_: string | null, record: AdminUserResponse) =>
                record.certificate_classification_title || t("User.form.certificateClassification.none")
        },
        {
            title: t("AdminOrgUsers.table.status"),
            dataIndex: "status",
            key: "status",
            sorter: true,
            sortDirections: ["descend", "ascend"],
            filters: Object.values(UserStatusEnum).map((value) => ({text: t(`UserStatusEnum.${value.toLowerCase()}`), value}))
        },
        {
            title: t("AdminOrgUsers.table.approvedTerms"),
            dataIndex: "approved_terms",
            key: "approved_terms",
            sorter: true,
            sortDirections: ["descend", "ascend"],
            render: (_: string, record: AdminUserResponse) => {
                return record.approved_terms ? <CheckOutlined style={{fontSize: "18px", color: "green"}}/> :
                    <CloseOutlined style={{fontSize: "18px", color: "red"}}/>;
            }
        },
        {
            title: t("AdminOrgUsers.table.healthStatementId"),
            dataIndex: "health_statement_id",
            key: "health_statement_id",
            sorter: true,
            sortDirections: ["descend", "ascend"],
            render: (_: string, record: AdminUserResponse) => {
                if (record.health_statement_id === null) {
                    return <CloseOutlined style={{fontSize: "18px", color: "red"}}/>;
                }

                if (record.health_statement_id === 0) {
                    return <CheckOutlined style={{fontSize: "18px", color: "green"}}/>;
                }

                return <CheckSquareOutlined style={{fontSize: "18px", color: "green"}}/>;
            }
        },
        {
            title: t("AdminOrgUsers.table.role.title"),
            dataIndex: "roles",
            key: "roles",
            render: (_: string, record: AdminUserResponse) => (
                <>
                    {record.roles
                        .slice()
                        .sort((a, b) => a.localeCompare(b))
                        .map((role) => roleEnum2Tag(role, t, record.id))}
                </>
            )
        },
        {
            title: t("AdminOrgUsers.table.paymentStatus"),
            dataIndex: "payments",
            key: "payments",
            render: (_: string, record: AdminUserResponse) => (
                <>
                    {record.payments.map((payment: PaymentResponse) => {
                        if (dayjs(payment.start_date).isAfter(dayjs())
                            || dayjs(payment.end_date).isBefore(dayjs())) {
                            return null;
                        }

                        let color = "";
                        let paymentTypeLabel = "";

                        if (payment.payment_type === PaymentTypeEnum.PERIODICAL) {
                            color = "green";
                            paymentTypeLabel = t("PaymentTypeEnum." + PaymentTypeEnum.PERIODICAL);
                        }
                        if (payment.payment_type === PaymentTypeEnum.ONE_TIME) {
                            color = "blue";
                            paymentTypeLabel = t("PaymentTypeEnum." + PaymentTypeEnum.ONE_TIME);
                        }

                        return (
                            <Tag color={color} key={"payment-" + payment.payment_type + "-" + payment.id}>
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
            render: (_: string, record: AdminUserResponse) => (
                <Space size="middle">
                    {record.status !== "ANONYMIZED" &&
                        <Link to={"/administration/users/" + record.id}><Button>{t("AdminOrgUsers.table.action.button")}</Button></Link>}
                </Space>
            )
        }
    ];

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

    function invalidateHealthStatementAgreements() {
        if (window.confirm(t("AdminOrgUsers.invalidateHealthStatementAgreements.confirm"))) {
            setLoading(true);
            userAPI.resetHealthStatement()
                .then((response: boolean) => {
                    if (response) {
                        messageApi.success(t("AdminOrgUsers.invalidateHealthStatementAgreements.ok"));
                    } else {
                        messageApi.error(t("AdminOrgUsers.invalidateHealthStatementAgreements.fail"));
                    }
                })
                .catch((e: Error) => {
                    messageApi.error(t("AdminOrgUsers.invalidateHealthStatementAgreements.fail"));
                    console.error("Failed to reset health statement agreements, error: " + e.message);
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
                <OxTable dataMode={"server"}
                         paged={userTable}
                         rowKey="id"
                         columns={userListColumns}/>
                <Divider orientation={"horizontal"} titlePlacement={"left"}>{t("AdminOrgUsers.terms.resetDivider")}</Divider>
                <Space orientation={"horizontal"} size={12} style={{width: "100%", justifyContent: "center"}}>
                    <Button danger={true} type={"primary"} onClick={() => invalidateTermAgreements()}>{t("AdminOrgUsers.terms.resetButton")}</Button>
                </Space>
                <Divider orientation={"horizontal"} titlePlacement={"left"}>{t("AdminOrgUsers.healthStatement.resetDivider")}</Divider>
                <Space orientation={"horizontal"} size={12} style={{width: "100%", justifyContent: "center"}}>
                    <Button danger={true} type={"primary"}
                            onClick={() => invalidateHealthStatementAgreements()}>{t("AdminOrgUsers.healthStatement.resetButton")}</Button>
                </Space>
            </Spin>
        </div>);
}
