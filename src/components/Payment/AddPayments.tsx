import {useTranslation} from "react-i18next";
import {Button, Form, InputNumber, message, Select, Space, Spin} from "antd";
import {useEffect, useState} from "react";
import {type ListUserResponse, type PaymentRequest, PaymentTypeEnum, PortalConfigGroupEnum, RoleEnum} from "../../models";
import {paymentAPI, userAPI} from "../../services";
import {useSession} from "../../session";
import dayjs from "dayjs";

export function AddPayments() {
    const {t} = useTranslation();
    const [loading, setLoading] = useState<boolean>(true);
    const [users, setUsers] = useState<ListUserResponse[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<ListUserResponse[]>([]);
    const filteredOptions = users.filter((o) => !selectedUsers.includes(o));
    const [paymentForm] = Form.useForm();
    const [paymentType, setPaymentType] = useState<PaymentTypeEnum>(PaymentTypeEnum.PERIOD);
    const {getPortalConfigurationValue} = useSession();
    const [messageApi, contextHolder] = message.useMessage();

    const paymentTypes = [
        {id: PaymentTypeEnum.ONE_TIME, name: t("PaymentTypeEnum." + PaymentTypeEnum.ONE_TIME)},
        {id: PaymentTypeEnum.PERIOD, name: t("PaymentTypeEnum." + PaymentTypeEnum.PERIOD)},
    ];

    useEffect(() => {
        setLoading(true);
        Promise.all([
            userAPI.findByRole(RoleEnum.ROLE_USER),
            paymentAPI.getAllActivePaymentStatus(),
        ])
                .then(([userList, _paymentList]) => {
                    let participantList = [];
                    const requiresMembership = getPortalConfigurationValue(PortalConfigGroupEnum.MEMBERSHIP, "event-require-membership") === "true";

                    for (let i = 0; i < userList.length; i++) {
                        let hasActivePeriodicalPayment = false;
                        // Find if the user has any active periodical payment
                        for (let j = 0; j < userList[i].payments.length; j++) {
                            if (userList[i].payments[j].paymentType === PaymentTypeEnum.PERIOD
                            && (userList[i].payments[j].expiresAt === null
                                    || dayjs(userList[i].payments[j].expiresAt).isAfter(dayjs()))) {
                                hasActivePeriodicalPayment = true;
                            }
                        }


                        if ((requiresMembership && !userList[i].membershipActive)
                                || hasActivePeriodicalPayment) {
                            continue;
                        }

                        participantList.push(userList[i]);
                    }

                    setUsers(participantList);
                })
                .catch((error) => {
                    console.error("Failed to get users:", error);
                    messageApi.error(t("AdminPayments.errorGetUsers"));
                })
                .finally(() => setLoading(false));
    }, [t]);

    function updateSelectedUsers(value: ListUserResponse[]) {
        setSelectedUsers(value.filter(Boolean)); // Remove undefined entries
    }

    function updateSelectedPaymentType(value: PaymentTypeEnum) {
        setPaymentType(value);
    }

    function onFinish(values: { userIdList: number[]; paymentType: PaymentTypeEnum; paymentCount: number }) {
        setLoading(true);

        const postData: PaymentRequest = {
            id: 0,
            userId: 0,
            paymentType: values.paymentType,
            paymentCount: values.paymentCount,
        };

        const userPromises = values.userIdList.map((userId) =>
                paymentAPI.create({...postData, userId})
        );

        Promise.all(userPromises)
                .then(() => {
                    messageApi.success(t("AddPayments.onFinish.ok"));
                    window.dispatchEvent(new Event("updatePaymentList-" + values.paymentType));
                })
                .catch((e) => {
                    console.error("Failed to update user payment information, error: " + e.message);
                    messageApi.error(t("AddPayments.onFinish.fail"));
                })
                .finally(() => setLoading(false));
    }

    return (
            <Spin spinning={loading}>
                {contextHolder}
                <Form
                        form={paymentForm}
                        initialValues={{
                            userIdList: [],
                            paymentType: PaymentTypeEnum.PERIOD,
                            paymentCount: 1,
                        }}
                        labelCol={{span: 8}}
                        name="payment_form"
                        onFinish={onFinish}
                        style={{maxWidth: 1000}}
                        wrapperCol={{span: 16}}
                >
                    <Form.Item
                            name={"userIdList"}
                            key={"userIdList"}
                            label={t("AddPayments.form.name.label")}
                            required={true}
                    >
                        <Select
                                fieldNames={{label: "name", value: "id"}}
                                mode="multiple"
                                onChange={updateSelectedUsers}
                                optionFilterProp={"name"}
                                optionLabelProp={"name"}
                                options={filteredOptions.map((item) => ({
                                    id: item.id,
                                    name: `${item.name} (${item.id})`,
                                }))}
                                placeholder={t("AddPayments.form.name.placeholder")}
                                showSearch={true}
                                style={{width: "100%"}}
                        />
                    </Form.Item>

                    <Form.Item
                            name={"paymentType"}
                            key={"paymentType"}
                            label={t("AddPayments.form.paymentType.label")}
                            required={true}
                            wrapperCol={{span: 4}}
                    >
                        <Select
                                fieldNames={{label: "name", value: "id"}}
                                options={paymentTypes}
                                onChange={updateSelectedPaymentType}
                        />
                    </Form.Item>
                    <Form.Item
                            name={"paymentCount"}
                            key={"paymentCount"}
                            style={paymentType !== PaymentTypeEnum.ONE_TIME ? {display: "none"} : {}}
                            label={t("AddPayments.form.paymentCount.label")}
                            required={paymentType === PaymentTypeEnum.ONE_TIME}
                    >
                        <InputNumber min={1}/>
                    </Form.Item>

                    <Space
                            direction={"horizontal"}
                            size={12}
                            style={{width: "100%", justifyContent: "center"}}
                    >
                        <Button type={"primary"} htmlType={"submit"} disabled={loading}>
                            {t("AddPayments.form.button")}
                        </Button>
                    </Space>
                </Form>
            </Spin>
    );
}