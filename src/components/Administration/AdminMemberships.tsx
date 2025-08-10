import {useEffect, useState} from "react";
import {Link} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {Space, Table} from "antd";
import {membershipAPI} from "../../services";
import {MembershipResponse} from "../../models";
import {ColumnsType} from "antd/es/table";
import dayjs from "dayjs";
import {AddMemberships} from "./AddMemberships";
import {membershipStatusEnum2Tag, membershipTypeEnum2Tag} from "../../helpers";

export function AdminMemberships() {
    const [membershipList, setMembershipList] = useState<MembershipResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const {t} = useTranslation();

    const memberListColumns: ColumnsType<MembershipResponse> = [
        {
            title: "#",
            dataIndex: "id",
            key: "id"
        },
        {
            title: t("AdminMembers.table.userId"),
            dataIndex: "userId",
            key: "userId",
            sorter: (a: MembershipResponse, b: MembershipResponse) => a.userId - b.userId,
            sortDirections: ["descend", "ascend"],
            render: (_: string, record: MembershipResponse) => {
                return (<Link to={"/users/" + record.userId + "/show"}>{record.userId}</Link>);
            }
        },
        {
            title: t("AdminMembers.table.username"),
            dataIndex: "username",
            key: "username",
            sorter: (a: MembershipResponse, b: MembershipResponse) => a.username.localeCompare(b.username),
            sortDirections: ["descend", "ascend"],
            render: (_: string, record: MembershipResponse) => {
                return (<Link to={"/users/" + record.userId + "/show"}>{record.username}</Link>);
            }
        },
        {
            title: t("AdminMembers.table.status"),
            dataIndex: "status",
            key: "status",
            sorter: (a: MembershipResponse, b: MembershipResponse) => a.status.localeCompare(b.status),
            sortDirections: ["descend", "ascend"],
            render: (_: string, record: MembershipResponse) => membershipStatusEnum2Tag(record.status, t, record.id)
        },
        {
            title: t("AdminMembers.table.type"),
            dataIndex: "type",
            key: "type",
            sorter: (a: MembershipResponse, b: MembershipResponse) => a.type.localeCompare(b.type),
            sortDirections: ["descend", "ascend"],
            render: (_: string, record: MembershipResponse) => membershipTypeEnum2Tag(record.type, t, record.id)
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
            render: (_: string, record: MembershipResponse) => {
                return (
                        <Space size="small">
                            <Link to={"/administration/members/" + record.id + "/edit"}>{t("AdminMembers.table.actions.edit")}</Link>
                        </Space>
                );
            }
        }
    ];

    useEffect(() => {
        setLoading(true);
        Promise.all([
            membershipAPI.findAll()
        ])
                .then(([membershipResponses]) => {
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

    function fetchMembershipList() {
        setLoading(true);
        membershipAPI.findAll()
                .then((membershipResponses) => {
                    setMembershipList(membershipResponses);
                })
                .catch((error) => {
                    console.error("Failed to load members", error);
                })
                .finally(() => {
                    setLoading(false);
                });
    }

    return (
            <div className={"darkDiv"}>
                <Space direction={"vertical"} size={12} style={{width: "100%"}}>
                    <h1>{t("AdminMembers.title")}</h1>

                    <Table columns={memberListColumns} dataSource={membershipList} loading={loading} rowKey="id"/>
                    <AddMemberships membershipList={membershipList} onMembershipAdded={fetchMembershipList}/>
                </Space>
            </div>
    );
}