import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import {userAPI} from "../../services";
import {message, Space, Spin, Table} from "antd";
import {useTranslation} from "react-i18next";
import type {UserResponse} from "../../models";
import {RoleEnum} from "../../models";
import {FormPayments} from "./FormPayments";
import {checkRoles, formatDateTime} from "../../tools";
import {ProfileCollapse} from "./ProfileCollapse";
import {FormMemberships} from "./FormMemberships.tsx";
import {UserDocumentFiles} from "./UserDocumentFiles";
import {useSession} from "../../session";

export function ShowUser() {
    const {paramId} = useParams<string>();
    const [userId, setUserId] = useState<number>(0);
    const [tableData, setTableData] = useState<{ id: number, name: string, value: string | number }[]>([]);
    const [userData, setUserData] = useState<UserResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const {t} = useTranslation();
    const [messageApi, contextHolder] = message.useMessage();
    const {userSession} = useSession();

    useEffect(() => {

        let tmpUserId = 0;

        if (paramId !== undefined && !Number.isNaN(parseInt(paramId))) {
            tmpUserId = parseInt(paramId);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setUserId(tmpUserId);
        }

        if (tmpUserId > 0) {

            userAPI.findById(tmpUserId, null)
                    .then((response) => {
                        setUserData(response);
                        setTableData([
                            {id: 1, name: t("ShowUser.table.email"), value: response.username},
                            {id: 2, name: t("ShowUser.table.phonenumber"), value: response.phoneNumber},
                            {id: 3, name: t("ShowUser.table.registered"), value: formatDateTime(response.registered)},
                            {id: 4, name: t("ShowUser.table.diveCount"), value: response.diveCount},
                            {id: 5, name: t("ShowUser.table.nextOfKin"), value: response.nextOfKin},
                        ]);
                    })
                    .catch((error) => {
                        console.error(error);
                        messageApi.error(t("ShowUser.fetchUserData.fail"));
                    })
                    .finally(() => {
                        setLoading(false);
                    });
        } else {
            messageApi.error(t("ShowUser.userId.fail"));
            setLoading(false);
        }
    }, [paramId, t, messageApi]);

    const colums = [
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
            render: (text: string) => (<b>{text}</b>)
        },
        {
            title: "Value",
            dataIndex: "value",
            key: "value",
        }
    ];

    return (
            <div className={"darkDiv"}>
                {contextHolder}
                <Spin spinning={loading}>
                    <Space orientation="vertical" size="large" style={{width: "100%"}}>
                        {userData && <h4>{userData.lastName}, {userData.firstName}</h4>}
                        {userData && t("ShowUser.table.payments")}
                        {userData && <FormPayments userData={userData}/>}
                        {userData && t("ShowUser.table.memberships")}
                        {userData && <FormMemberships membershipList={userData.memberships}/>}
                        {userData && t("ShowUser.table.user-details")}
                        {userData && <Table showHeader={false} pagination={false} rowKey={"id"} dataSource={tableData} columns={colums}/>}
                        {userData && <UserDocumentFiles
                                userId={userId}
                                username={userData.username}
                                canUpload={(userSession?.id === userId) || (userSession !== null && checkRoles(userSession.roles, [RoleEnum.ROLE_ADMIN]))}
                        />}
                        {userData && <ProfileCollapse userId={userId} viewOnly={true}/>}
                    </Space>
                </Spin>
            </div>
    );
}
