import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import {userAPI} from "../../services";
import {message, Spin, Table} from "antd";
import {useTranslation} from "react-i18next";
import type {UserResponse} from "../../models";
import {FormPayments} from "./FormPayments";
import {formatDateTime} from "../../helpers";
import {ProfileCollapse} from "./ProfileCollapse";

export function ShowUser() {
    const {paramId} = useParams<string>();
    const [userId, setUserId] = useState<number>(0);
    const [tableData, setTableData] = useState<{ id: number, name: string, value: string | number }[]>([]);
    const [userData, setUserData] = useState<UserResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const {t} = useTranslation();
    const [messageApi, contextHolder] = message.useMessage();

    useEffect(() => {
        setLoading(true);

        let tmpUserId = 0;

        if (paramId !== undefined && !Number.isNaN(parseInt(paramId))) {
            tmpUserId = parseInt(paramId);
            setUserId(tmpUserId);
        }

        if (tmpUserId > 0) {

            userAPI.findById(tmpUserId, null)
                    .then((response) => {
                        setUserData(response);
                        setTableData([
                            {id: 1, name: t("UserDetails.table.email"), value: response.username},
                            {id: 2, name: t("UserDetails.table.phonenumber"), value: response.phoneNumber},
                            {id: 3, name: t("UserDetails.table.registered"), value: formatDateTime(response.registered)},
                            {id: 4, name: t("UserDetails.table.diveCount"), value: response.diveCount},
                            {id: 5, name: t("UserDetails.table.nextOfKin"), value: response.nextOfKin},
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
    }, [paramId, t]);

    const colums = [
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
            render: (text: any, _record: any) => (<b>{text}</b>)
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
                    {userData && <h4>{userData.lastName}, {userData.firstName}</h4>}
                    {userData && t("UserDetails.table.payments")}
                    {userData && <FormPayments userData={userData}/>}
                    {userData && <Table showHeader={false} pagination={false} rowKey={"id"} dataSource={tableData} columns={colums}/>}
                    {userData && <ProfileCollapse userId={userId} viewOnly={true}/>}
                </Spin>
            </div>
    );
}
