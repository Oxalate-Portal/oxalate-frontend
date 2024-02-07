import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button, Form, InputNumber, Select, Space, Spin } from "antd";
import { useEffect, useState } from "react";
import { PaymentTypeEnum, RoleEnum, UpdateStatusEnum, UpdateStatusVO } from "../../models";
import { userAPI } from "../../services";
import { DiveEventUserResponse } from "../../models/responses";
import { SubmitResult } from "../main";
import { paymentAPI } from "../../services/PaymentAPI";
import { PaymentRequest } from "../../models/requests";

export function AddPayments() {
    const navigate = useNavigate();
    const {t} = useTranslation();
    const [loading, setLoading] = useState<boolean>(true);
    const [users, setUsers] = useState<DiveEventUserResponse[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<DiveEventUserResponse[]>([]);
    const filteredOptions = users.filter((o) => !selectedUsers.includes(o));
    const [paymentForm] = Form.useForm();
    const [updateStatus, setUpdateStatus] = useState<UpdateStatusVO>({status: UpdateStatusEnum.NONE, message: ""});
    const [paymentType, setPaymentType] = useState<PaymentTypeEnum>(PaymentTypeEnum.PERIOD);

    const paymentTypes = [
        {id: PaymentTypeEnum.ONE_TIME, name: t("AddPayments.types.oneTime")},
        {id: PaymentTypeEnum.PERIOD, name: t("AddPayments.types.period")}
    ];


    useEffect(() => {
        setLoading(true);
        userAPI.findByRole(RoleEnum.ROLE_USER)
                .then((result) => {
                    setUsers(result);
                })
                .catch((error) => {
                    console.error("Failed to get users:", error);
                    setUpdateStatus({status: UpdateStatusEnum.FAIL, message: t("AdminPayments.errorGetUsers")});
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
                        setUpdateStatus({status: UpdateStatusEnum.OK, message: t("AddPayments.onFinish.ok")});
                    })
                    .catch(e => {
                        console.error("Failed to update user payment information, error: " + e.message);
                        setUpdateStatus({status: UpdateStatusEnum.FAIL, message: t("AddPayments.onFinish.fail") + e.message});
                    })
                    .finally(() => {
                        setLoading(false);
                    });
        }
    }

    if (updateStatus.status !== UpdateStatusEnum.NONE) {
        return <SubmitResult updateStatus={updateStatus} navigate={navigate}/>;
    }

    return (
            <Spin spinning={loading}>
                <Form
                        form={paymentForm}
                        initialValues={{
                            userIdList: [],
                            paymentType: "PERIOD",
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
                                            name: item.name,
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
                               style={(paymentType !== "ONE_TIME") ? {display: "none"} : {}}
                               label={t("AddPayments.form.paymentCount.label")}
                               required={paymentType === "ONE_TIME"}
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
