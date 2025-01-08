import { useTranslation } from "react-i18next";
import { Button, Form, InputNumber, message, Select, Space, Spin } from "antd";
import { useEffect, useState } from "react";
import { PaymentTypeEnum, RoleEnum } from "../../models";
import { userAPI } from "../../services";
import { DiveEventUserResponse } from "../../models/responses";
import { paymentAPI } from "../../services/PaymentAPI";
import { PaymentRequest } from "../../models/requests";

interface AddPaymentsProps {
    fetchPayments: () => void;
}

export function AddPayments({fetchPayments}: AddPaymentsProps) {
    const {t} = useTranslation();
    const [loading, setLoading] = useState<boolean>(true);
    const [users, setUsers] = useState<DiveEventUserResponse[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<DiveEventUserResponse[]>([]);
    const filteredOptions = users.filter((o) => !selectedUsers.includes(o));
    const [paymentForm] = Form.useForm();
    const [paymentType, setPaymentType] = useState<PaymentTypeEnum>(PaymentTypeEnum.PERIOD);

    const paymentTypes = [
        {id: PaymentTypeEnum.ONE_TIME, name: t("AddPayments.types.oneTime")},
        {id: PaymentTypeEnum.PERIOD, name: t("AddPayments.types.period")}
    ];

    useEffect(() => {
        setLoading(true);
        Promise.all([
            userAPI.findByRole(RoleEnum.ROLE_USER),
            paymentAPI.getAllActivePaymentStatus()
        ])
                .then(([userList, paymentList]) => {
                    // Go trough the list of payments and collect the users that have a periodical payment
                    let periodicalUsers: number[] = [];

                    for (let i = 0; i < paymentList.length; i++) {
                        let paymentListItem = paymentList[i];
                        let userId = paymentListItem.userId;

                        for (let j = 0; j < paymentListItem.payments.length; j++) {
                            let payment = paymentListItem.payments[j];
                            if (payment.paymentType === PaymentTypeEnum.PERIOD) {
                                periodicalUsers.push(userId);
                                break;
                            }
                        }

                        // Next we need to filter out the users that already have a periodical payment
                        userList = userList.filter((user) => !periodicalUsers.includes(user.id));
                        setUsers(userList);
                    }

                })
                .catch((error) => {
                    console.error("Failed to get users:", error);
                    message.error(t("AdminPayments.errorGetUsers"));
                })
                .finally(() => {
                    setLoading(false);
                });
    }, [t]);

    function updateSelectedUsers(value: DiveEventUserResponse[]) {
        let tmpArray: DiveEventUserResponse[] = [];

        for (let i = 0; i < value.length; i++) {
            if (value[i] !== undefined) {
                tmpArray.push(value[i]);
            }
        }

        setSelectedUsers(tmpArray);
    }

    function updateSelectedPaymentType(value: PaymentTypeEnum) {
        if (value !== paymentType) {
            setPaymentType(value);
        }
    }

    function onFinish(values: { userIdList: number[], paymentType: PaymentTypeEnum, paymentCount: number }) {
        setLoading(true);

        let postData: PaymentRequest = {
            id: 0,
            userId: 0,
            paymentType: values.paymentType,
            paymentCount: values.paymentCount
        };

        for (let i = 0; i < values.userIdList.length; i++) {
            postData.userId = values.userIdList[i];

            paymentAPI.create(postData)
                    .then(() => {
                        message.success(t("AddPayments.onFinish.ok"));
                        fetchPayments(); // Refresh the payment lists
                    })
                    .catch(e => {
                        console.error("Failed to update user payment information, error: " + e.message);
                        message.success(t("AddPayments.onFinish.fail"));
                    })
                    .finally(() => {
                        setLoading(false);
                    });
        }
    }

    return (
            <Spin spinning={loading}>
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
                        style={{
                            maxWidth: 1000,
                        }}
                        wrapperCol={{span: 16}}
                >
                    <Form.Item name={"userIdList"}
                               key={"userIdList"}
                               label={t("AddPayments.form.name.label")}
                               required={true}>
                        <Select
                                fieldNames={{label: "name", value: "id"}}
                                labelInValue={false}
                                mode="multiple"
                                onChange={updateSelectedUsers}
                                optionFilterProp={"name"}
                                optionLabelProp={"name"}
                                options={filteredOptions.map((item) => (
                                        {
                                            id: item.id,
                                            name: item.name + " (" + item.id + ")",
                                        }
                                ))}
                                placeholder={t("AddPayments.form.name.placeholder")}
                                showSearch={true}
                                style={{
                                    width: "100%",
                                }}
                                value={users}
                        />
                    </Form.Item>

                    <Form.Item name={"paymentType"}
                               key={"paymentType"}
                               label={t("AddPayments.form.paymentType.label")}
                               required={true}
                               wrapperCol={{span: 4}}>
                        <Select
                                fieldNames={{label: "name", value: "id"}}
                                options={paymentTypes}
                                onChange={updateSelectedPaymentType}
                        />
                    </Form.Item>
                    <Form.Item name={"paymentCount"}
                               key={"paymentCount"}
                               style={(paymentType !== PaymentTypeEnum.ONE_TIME) ? {display: "none"} : {}}
                               label={t("AddPayments.form.paymentCount.label")}
                               required={paymentType === PaymentTypeEnum.ONE_TIME}
                    >
                        <InputNumber min={1}/>
                    </Form.Item>

                    <Space direction={"horizontal"} size={12} style={{width: "100%", justifyContent: "center"}}>
                        <Button
                                type={"primary"}
                                htmlType={"submit"}
                                disabled={loading}
                        >{t("AddPayments.form.button")}</Button>
                    </Space>
                </Form>
            </Spin>
    );
}