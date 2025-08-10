import {useTranslation} from "react-i18next";
import {Button, Form, message, Select, Space, Spin} from "antd";
import {useEffect, useState} from "react";
import {ListUserResponse, MembershipRequest, MembershipResponse, MembershipStatusEnum, MembershipTypeEnum, PortalConfigGroupEnum, RoleEnum} from "../../models";
import {membershipAPI, userAPI} from "../../services";
import {useSession} from "../../session";

interface AddMembershipsProps {
    membershipList: MembershipResponse[];
    onMembershipAdded: () => void;
}

export function AddMemberships({membershipList, onMembershipAdded}: AddMembershipsProps) {
    const {t} = useTranslation();
    const {getPortalConfigurationValue} = useSession();

    const membershipTypeString = getPortalConfigurationValue(PortalConfigGroupEnum.MEMBERSHIP, "membership-type");
    const membershipType = membershipTypeString.toUpperCase() as MembershipTypeEnum;

    if (membershipType === MembershipTypeEnum.DISABLED) {
        return <span>{t("AddMemberships.disabled")}</span>;
    }

    const [loading, setLoading] = useState<boolean>(true);
    const [users, setUsers] = useState<ListUserResponse[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<ListUserResponse[]>([]);
    const filteredOptions = users.filter((o) => !selectedUsers.includes(o) && !membershipList.some(m => m.userId === o.id));
    const [membershipForm] = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();

    useEffect(() => {
        setLoading(true);
        userAPI.findByRole(RoleEnum.ROLE_USER)
                .then((userResponses) => {
                    // Do not add users that already have a membership
                    userResponses = userResponses.filter(user => !user.membershipActive);
                    setUsers(userResponses);
                })
                .catch((error) => {
                    console.error("Failed to get users:", error);
                    messageApi.error(t("AddMemberships.errorGetUsers"));
                })
                .finally(() => {
                    setLoading(false);
                });
    }, [t]);

    function updateSelectedUsers(value: ListUserResponse[]) {
        setSelectedUsers(value);
    }

    function onFinish(values: { userIdList: number[], type: MembershipTypeEnum, membershipDuration: number }) {
        setLoading(true);

        let postData: MembershipRequest = {
            id: 0,
            userId: 0,
            status: MembershipStatusEnum.ACTIVE,
            type: membershipType
        };

        const promises = values.userIdList.map(userId => {
            postData.userId = userId;
            return membershipAPI.create(postData);
        });

        Promise.all(promises)
                .then(() => {
                    onMembershipAdded();
                    messageApi.success(t("AddMemberships.onFinish.ok"));
                })
                .catch(e => {
                    console.error("Failed to update user membership information, error: " + e.message);
                    messageApi.error(t("AddMemberships.onFinish.fail") + " " + e.message);
                })
                .finally(() => {
                    setLoading(false);
                    // Empty the list of selected users as well as the form
                    membershipForm.resetFields();
                    setSelectedUsers([]);
                });
    }

    return (
            <Spin spinning={loading}>
                {contextHolder}
                <Form
                        form={membershipForm}
                        initialValues={{userIdList: []}}
                        labelCol={{span: 8}}
                        name="membership_form"
                        onFinish={onFinish}
                        style={{maxWidth: 1000}}
                        wrapperCol={{span: 16}}
                >
                    <Form.Item name={"userIdList"} key={"userIdList"} label={t("AddMemberships.form.name.label")} required={true}>
                        <Select
                                fieldNames={{label: "name", value: "id"}}
                                labelInValue={false}
                                mode="multiple"
                                onChange={updateSelectedUsers}
                                optionFilterProp={"name"}
                                optionLabelProp={"name"}
                                options={filteredOptions.map((item) => ({id: item.id, name: item.name + " (" + item.id + ")"}))}
                                placeholder={t("AddMemberships.form.name.placeholder")}
                                showSearch={true}
                                style={{width: "100%"}}
                                value={users}
                        />
                    </Form.Item>

                    <Space direction={"horizontal"} size={12} style={{width: "100%", justifyContent: "center"}}>
                        <Button type={"primary"} htmlType={"submit"} disabled={loading}>
                            {t("AddMemberships.form.button")}
                        </Button>
                    </Space>
                </Form>
            </Spin>
    );
}