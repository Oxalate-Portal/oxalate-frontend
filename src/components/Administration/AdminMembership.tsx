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

        if (paramId !== undefined && !Number.isNaN(parseInt(paramId))) {
            const membershipId = parseInt(paramId);
            membershipAPI.findByMemberId(membershipId)
                    .then((response) => {
                        // Convert date strings to Dayjs instances (guarding nullable endDate)
                        const converted = {
                            ...response,
                            start_date: dayjs(response.start_date),
                            end_date: response.end_date ? dayjs(response.end_date) : null
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
                        // eslint-disable-next-line react-hooks/set-state-in-effect
                        setLoading(false);
                    });
        } else {
            console.error("Invalid membership id:", paramId);
            messageApi.error(t("AdminMembership.message.invalid-user-id", {defaultValue: "Invalid user ID"}));

            // eslint-disable-next-line react-hooks/set-state-in-effect
            setLoading(false);
        }
    }, [form, messageApi, paramId, t]);

    const onFinish = (values: { status: MembershipStatusEnum; type: MembershipTypeEnum }) => {
        if (!membership) {
            return;
        }

        const updatedMembership: MembershipRequest = {
            id: membership.id,
            user_id: membership.user_id,
            status: values.status,
            type: values.type,
            start_date: membership.start_date,
            end_date: membership.end_date
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
                <h3>{membership.username} {membership.start_date.format("YYYY-MM-DD")} - {(membership.end_date !== null ? membership.end_date.format("YYYY-MM-DD") : "--")} </h3>
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
                        <Select
                                options={Object.values(MembershipTypeEnum).map((type) => ({
                                    value: type,
                                    label: t("MembershipTypeEnum." + type.toLowerCase())
                                }))}
                        />
                    </Form.Item>
                    <Form.Item name={"status"}
                               label={t("AdminMembership.form.membership-status", {defaultValue: "Membership Status"})}
                               rules={[{
                                   required: true,
                                   message: t("AdminMembership.form.rule.membership-status", {defaultValue: "Please select a membership status"})
                               }]}
                    >
                        <Select
                                options={Object.values(MembershipStatusEnum).map((type) => ({
                                    value: type,
                                    label: t("MembershipStatusEnum." + type.toLowerCase())
                                }))}
                        />
                    </Form.Item>
                    <Form.Item>
                        <Button type={"primary"} htmlType="submit">
                            {t("common.button.update")}
                        </Button>
                    </Form.Item>
                </Form>
            </div>
    );
}
