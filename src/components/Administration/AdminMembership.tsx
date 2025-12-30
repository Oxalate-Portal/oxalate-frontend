import {useEffect, useState} from "react";
import {Button, Form, message, Select, Spin} from "antd";
import {type MembershipRequest, type MembershipResponse, MembershipStatusEnum, MembershipTypeEnum} from "../../models";
import {membershipAPI} from "../../services";
import {useParams} from "react-router-dom";
import {useTranslation} from "react-i18next";
import dayjs from "dayjs";

export function AdminMembership() {
    const {t} = useTranslation();
    const {paramId} = useParams();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [membership, setMembership] = useState<MembershipResponse | null>(null);
    const [messageApi, contextHolder] = message.useMessage();

    useEffect(() => {
        setLoading(true);

        let tmpMembershipId = 0;

        if (paramId !== undefined && !Number.isNaN(parseInt(paramId))) {
            tmpMembershipId = parseInt(paramId);
        } else {
            console.error("Invalid user id:", paramId);
            messageApi.error(t("AdminMembership.message.invalid-user-id", {defaultValue: "Invalid user ID"}));
            return;
        }

        membershipAPI.findByMemberId(tmpMembershipId)
                .then((response) => {
                    // Convert date strings to Dayjs instances (guarding nullable endDate)
                    const converted = {
                        ...response,
                        startDate: dayjs(response.startDate),
                        endDate: response.endDate ? dayjs(response.endDate) : null
                    } as MembershipResponse;
                    setMembership(converted);
                    // update form values so AntD sees Dayjs values
                    form.setFieldsValue(converted);
                })
                .catch((error) => {
                    console.error("Error fetching membership:", error);
                    messageApi.error(t("AdminMembership.message.no-membership", {defaultValue: "Failed to fetch membership data"}));
                })
                .finally(() => {
                    setLoading(false);
                });
    }, []);

    const onFinish = (values: any) => {
        if (!membership) {
            return;
        }

        const updatedMembership: MembershipRequest = {
            id: membership.id,
            userId: membership.userId,
            status: values.status,
            type: values.type,
            startDate: membership.startDate.format("YYYY-MM-DD"),
            endDate: membership.endDate.format("YYYY-MM-DD")
        };

        membershipAPI.update(updatedMembership)
                .then((response) => {
                    setMembership(response);
                    messageApi.success(t("AdminMembership.message.updated-ok", {defaultValue: "Membership updated successfully"}));
                })
                .catch((error) => {
                    console.error("Error updating membership:", error);
                    messageApi.error(t("AdminMembership.message.updated-fail", {defaultValue: "Failed to update membership"}));
                });
    };

    if (loading || !membership) {
        return <Spin/>;
    }

    return (
            <div className="darkDiv">
                {contextHolder}
                <h3>{membership.username} {membership.startDate.format("YYYY-MM-DD")} - {(membership.endDate !== null ? membership.endDate.format("YYYY-MM-DD") : "--")} </h3>
                <Form form={form}
                      onFinish={onFinish}
                      layout={"vertical"}
                      initialValues={membership}
                >
                    <Form.Item name={"type"}
                               label={t("AdminMembership.form.membership-type", {defaultValue: "Membership Type"})}
                               rules={[{
                                   required: true,
                                   message: t("AdminMembership.form.rule.membership-type", {defaultValue: "Please select a membership type"})
                               }]}
                    >
                        <Select>
                            {Object.values(MembershipTypeEnum).map((type) => (
                                    <Select.Option key={type} value={type}>
                                        {t("MembershipTypeEnum." + type.toLowerCase())}
                                    </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name={"status"}
                               label={t("AdminMembership.form.membership-status", {defaultValue: "Membership Status"})}
                               rules={[{
                                   required: true,
                                   message: t("AdminMembership.form.rule.membership-status", {defaultValue: "Please select a membership status"})
                               }]}
                    >
                        <Select>
                            {Object.values(MembershipStatusEnum).map((type) => (
                                    <Select.Option key={type} value={type}>
                                        {t("MembershipStatusEnum." + type.toLowerCase())}
                                    </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit">
                            {t("common.button.update")}
                        </Button>
                    </Form.Item>
                </Form>
            </div>
    );
}
