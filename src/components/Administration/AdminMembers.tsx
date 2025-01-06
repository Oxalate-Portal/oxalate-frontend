import {MembershipStatusEnum, MembershipTypeEnum} from "../../models";
import {useEffect, useState} from "react";
import {Link} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {Space, Table, Tag} from "antd";
import {membershipAPI, userAPI} from "../../services";
import {MembershipResponse} from "../../models/responses";
import {ColumnsType} from "antd/es/table";
import dayjs from "dayjs";
import {AddMemberships} from "./AddMemberships";

export function AdminMembers() {
    const [membershipList, setMembershipList] = useState<MembershipResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const {t} = useTranslation();

    const memberListColumns: ColumnsType<MembershipResponse> = [
        {
            title: "#",
            dataIndex: "id",
            key: "id",
            render: (text: string, record: MembershipResponse) => {
                return (<Link to={"/members/" + record.id + "/show"}>{record.id}</Link>);
            }
        },
        {
            title: t("AdminMembers.table.userId"),
            dataIndex: "userId",
            key: "userId",
            sorter: (a: MembershipResponse, b: MembershipResponse) => a.userId - b.userId,
            sortDirections: ["descend", "ascend"],
            render: (text: string, record: MembershipResponse) => {
                return (<Link to={"/users/" + record.userId + "/show"}>{record.userId}</Link>);
            }
        },
        {
            title: t("AdminMembers.table.username"),
            dataIndex: "username",
            key: "username",
            sorter: (a: MembershipResponse, b: MembershipResponse) => a.username.localeCompare(b.username),
            sortDirections: ["descend", "ascend"],
            render: (text: string, record: MembershipResponse) => {
                return (<Link to={"/users/" + record.userId + "/show"}>{record.username}</Link>);
            }
        },
        {
            title: t("AdminMembers.table.status"),
            dataIndex: "status",
            key: "status",
            sorter: (a: MembershipResponse, b: MembershipResponse) => a.status.localeCompare(b.status),
            sortDirections: ["descend", "ascend"],
            render: (_: string, record: MembershipResponse) => {
                // Show tag with status
                let color = "green";
                let label = t("MembershipStatusEnum." + record.status.toLowerCase());

                switch (record.status) {
                    case MembershipStatusEnum.ACTIVE:
                        color = "green";
                        break;
                    case MembershipStatusEnum.EXPIRED:
                        color = "orange";
                        break;
                    case MembershipStatusEnum.CANCELLED:
                        color = "red";
                        break;
                    default:
                        color = "red";
                        break;
                }

                return (<Tag color={color} key={"membership-status-" + record.id}>{label}</Tag>);
            }
        },
        {
            title: t("AdminMembers.table.type"),
            dataIndex: "type",
            key: "type",
            sorter: (a: MembershipResponse, b: MembershipResponse) => a.type.localeCompare(b.type),
            sortDirections: ["descend", "ascend"],
            render: (_: string, record: MembershipResponse) => {
                let color = "green";
                let label = t("MembershipTypeEnum." + record.type.toLowerCase());

                switch (record.type) {
                    case MembershipTypeEnum.DISABLED:
                        color = "red";
                        break;
                    case MembershipTypeEnum.DURATIONAL:
                        color = "yellow";
                        break;
                    case MembershipTypeEnum.PERIODICAL:
                        color = "blue";
                        break;
                    case MembershipTypeEnum.PERPETUAL:
                        color = "green";
                        break;
                    default:
                        color = "red";
                        break;
                }
                return (<Tag color={color} key={"membership-type-" + record.id}>{label}</Tag>);
            }
        },
        {
            title: t("AdminMembers.table.createdAt"),
            dataIndex: "createdAt",
            key: "createdAt",
            sorter: (a: MembershipResponse, b: MembershipResponse) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf(),
            sortDirections: ["descend", "ascend"]
        },
        {
            title: t("AdminMembers.table.expiresAt"),
            dataIndex: "expiresAt",
            key: "expiresAt",
            sorter: (a: MembershipResponse, b: MembershipResponse) => dayjs(a.expiresAt).valueOf() - dayjs(b.expiresAt).valueOf(),
            sortDirections: ["descend", "ascend"]
        },
        {
            title: t("AdminMembers.table.actions.title"),
            key: "actions",
            render: (text: string, record: MembershipResponse) => {
                return (
                        <Space size="small">
                            <Link to={"/members/" + record.id + "/edit"}>{t("AdminMembers.table.actions.edit")}</Link>
                        </Space>
                );
            }
        }
    ];

    useEffect(() => {
        setLoading(true);
        Promise.all([
            membershipAPI.findAll(),
            userAPI.findAll()
        ])
                .then(([membershipResponses, userResponses]) => {
                    setMembershipList(membershipResponses);
                    setLoading(false);
                })
                .catch((error) => {
                    console.error("Failed to load members", error);
                })
                .catch((error) => {
                    console.error("Failed to load members", error);
                })
                .finally(() => {
                    setLoading(false);
                });
    }, []);

    return (
            <div className={"darkDiv"}>
                <Space direction={"vertical"} size={12} style={{width: "100%"}}>
                    <h1>{t("AdminMembers.title")}</h1>

                    <Table columns={memberListColumns} dataSource={membershipList} loading={loading} rowKey="id"/>
                    <AddMemberships/>
                </Space>
            </div>
    );
}