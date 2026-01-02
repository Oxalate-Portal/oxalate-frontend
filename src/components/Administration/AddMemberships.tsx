import {useTranslation} from "react-i18next";
import {Button, DatePicker, Form, message, Select, Space, Spin} from "antd";
import {useEffect, useState} from "react";
import {type ListUserResponse, type MembershipRequest, MembershipStatusEnum, MembershipTypeEnum, PortalConfigGroupEnum, RoleEnum} from "../../models";
import {membershipAPI, userAPI} from "../../services";
import {useSession} from "../../session";
import {getDefaultMembershipDates} from "../../tools";
import {Dayjs} from "dayjs";

interface AddMembershipsProps {
    onMembershipAdded: () => void;
}

const {RangePicker} = DatePicker;

export function AddMemberships({onMembershipAdded}: AddMembershipsProps) {
    const {t} = useTranslation();
    const {getPortalConfigurationValue} = useSession();
    const membershipTypeString = getPortalConfigurationValue(PortalConfigGroupEnum.MEMBERSHIP, "membership-type");
    const membershipType = membershipTypeString.toUpperCase() as MembershipTypeEnum;
    const defaultMembershipPeriod: { startDate: Dayjs, endDate: Dayjs | null } = getDefaultMembershipDates(getPortalConfigurationValue);

    if (membershipType === MembershipTypeEnum.DISABLED) {
        return <span>{t("AddMemberships.disabled")}</span>;
    }

    const [loading, setLoading] = useState<boolean>(true);
    const [users, setUsers] = useState<ListUserResponse[]>([]);
    const [membershipForm] = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();

    useEffect(() => {
        setLoading(true);
        userAPI.findByRole(RoleEnum.ROLE_USER)
                .then((userResponses) => {
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

    function onFinish(values: { userIdList: number[], dateRange?: Dayjs[] }) {
        setLoading(true);

        const [start, end] = values.dateRange || [];
        const fallbackStart = defaultMembershipPeriod.startDate?.format("YYYY-MM-DD") || null;
        const fallbackEnd = defaultMembershipPeriod.endDate?.format("YYYY-MM-DD") || null;
        const postData: MembershipRequest = {
            id: 0,
            userId: 0,
            status: MembershipStatusEnum.ACTIVE,
            type: membershipType,
            startDate: start ? start.format("YYYY-MM-DD") : fallbackStart,
            endDate: end ? end.format("YYYY-MM-DD") : fallbackEnd
        };

        const promises = values.userIdList.map(userId => {
            return membershipAPI.create({...postData, userId});
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
                });
    }

    return (
            <Spin spinning={loading}>
                {contextHolder}
                <Form
                        form={membershipForm}
                        initialValues={{
                            userIdList: [],
                            dateRange: [
                                defaultMembershipPeriod.startDate,
                                defaultMembershipPeriod.endDate ?? defaultMembershipPeriod.startDate
                            ]
                        }}
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
                                optionLabelProp={"name"}
                                options={users.map((item) => ({id: item.id, name: item.name + " (" + item.id + ")"}))}
                                placeholder={t("AddMemberships.form.name.placeholder")}
                                showSearch={{optionFilterProp: "name"}}
                                style={{width: "100%"}}
                                value={users}
                        />
                    </Form.Item>
                    <Form.Item
                            name="dateRange"
                            label={t("AddMemberships.form.membershipDuration.label")}
                            rules={[{required: true}]}
                    >
                        <RangePicker
                                allowEmpty={[false, false]}
                                format={"YYYY-MM-DD"}
                                id={{start: "startDate", end: "endDate"}}
                        />
                    </Form.Item>

                    <Space orientation={"horizontal"} size={12} style={{width: "100%", justifyContent: "center"}}>
                        <Button type={"primary"} htmlType={"submit"} disabled={loading}>
                            {t("AddMemberships.form.button")}
                        </Button>
                    </Space>
                </Form>
            </Spin>
    );
}