import {useTranslation} from "react-i18next";
import {Button, Form, InputNumber, message, Select, Space, Spin} from "antd";
import {useEffect, useState} from "react";
import {
    ChronoUnitEnum,
    type ListUserResponse,
    PaymentExpirationTypeEnum,
    type PaymentRequest,
    PaymentTypeEnum,
    PortalConfigGroupEnum,
    RoleEnum
} from "../../models";
import {paymentAPI, userAPI} from "../../services";
import {useSession} from "../../session";
import dayjs, {Dayjs} from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import {getDefaultOneTimePaymentDates, getDefaultPeriodPaymentDates} from "../../tools/DateTimeTool.ts";
import {type RangeValue, ShiftableRangePicker, useResponsiveFormLayout} from "../main";

dayjs.extend(utc);
dayjs.extend(timezone);

function paymentMatchesRequest(response: PaymentRequest, request: PaymentRequest): boolean {
    const formatDate = (value: Dayjs | string | null) => value === null ? null : dayjs(value).format("YYYY-MM-DD");

    return response.userId === request.userId &&
            response.paymentType === request.paymentType &&
            formatDate(response.startDate) === formatDate(request.startDate) &&
            formatDate(response.endDate) === formatDate(request.endDate) &&
            (request.paymentType !== PaymentTypeEnum.ONE_TIME || response.paymentCount === request.paymentCount);
}

export function AddPayments() {
    const {t} = useTranslation();
    const formLayout = useResponsiveFormLayout(8, 16);
    const [loading, setLoading] = useState<boolean>(true);
    const [users, setUsers] = useState<ListUserResponse[]>([]);
    const [paymentForm] = Form.useForm();
    const watchedRange = Form.useWatch("dateRange", paymentForm) as RangeValue | undefined;
    const [paymentType, setPaymentType] = useState<PaymentTypeEnum>(PaymentTypeEnum.PERIODICAL);

    const {getPortalConfigurationValue} = useSession();
    const [messageApi, contextHolder] = message.useMessage();

    const oneTimeExpirationTypeString = getPortalConfigurationValue(PortalConfigGroupEnum.PAYMENT, "one-time-expiration-type");
    const oneTimeExpirationType = oneTimeExpirationTypeString.toUpperCase() as PaymentExpirationTypeEnum;
    const oneTimeUnitString = getPortalConfigurationValue(PortalConfigGroupEnum.PAYMENT, "one-time-expiration-unit");
    const oneTimeUnit = (oneTimeUnitString?.toUpperCase() as ChronoUnitEnum) ?? ChronoUnitEnum.YEARS;

    const periodExpirationTypeString = getPortalConfigurationValue(PortalConfigGroupEnum.PAYMENT, "periodical-payment-method-type");
    const periodExpirationType = periodExpirationTypeString.toUpperCase() as PaymentExpirationTypeEnum;
    const periodUnitString = getPortalConfigurationValue(PortalConfigGroupEnum.PAYMENT, "periodical-payment-method-unit");
    const periodUnit = (periodUnitString?.toUpperCase() as ChronoUnitEnum) ?? ChronoUnitEnum.YEARS;

    const [paymentExpirationType, setPaymentExpirationType] = useState<PaymentExpirationTypeEnum>(periodExpirationType);

    const defaultPeriodPaymentPeriod: { startDate: Dayjs, endDate: Dayjs | null } = getDefaultPeriodPaymentDates(getPortalConfigurationValue);
    const defaultOneTimePaymentPeriod: { startDate: Dayjs, endDate: Dayjs | null } = getDefaultOneTimePaymentDates(getPortalConfigurationValue);

    const [selectedDefaultPeriod, setSelectedDefaultPeriod] = useState<{ startDate: Dayjs, endDate: Dayjs | null }>(defaultPeriodPaymentPeriod);

    const paymentTypes = [
        {id: PaymentTypeEnum.ONE_TIME, name: t("PaymentTypeEnum." + PaymentTypeEnum.ONE_TIME)},
        {id: PaymentTypeEnum.PERIODICAL, name: t("PaymentTypeEnum." + PaymentTypeEnum.PERIODICAL)}
    ];

    useEffect(() => {
        Promise.all([
            userAPI.findByRole(RoleEnum.ROLE_USER)
        ])
                .then(([userList]) => {
                    const participantList = [];
                    const requiresMembership = getPortalConfigurationValue(PortalConfigGroupEnum.MEMBERSHIP, "event-require-membership") === "true";

                    if (requiresMembership) {
                        // We remove those users that are not active members
                        for (let i = 0; i < userList.length; i++) {
                            if (userList[i].membershipActive) {
                                participantList.push(userList[i]);
                            }
                        }
                        setUsers(participantList);
                    } else {
                        setUsers(userList);
                    }
                })
                .catch((error) => {
                    console.error("Failed to get users:", error);
                    messageApi.error(t("AdminPayments.errorGetUsers"));
                })
                .finally(() => setLoading(false));
    }, [t, getPortalConfigurationValue, messageApi]);

    function updateSelectedPaymentType(value: PaymentTypeEnum) {
        setLoading(true);
        setPaymentType(value);

        if (value === PaymentTypeEnum.PERIODICAL) {
            setSelectedDefaultPeriod(defaultPeriodPaymentPeriod);
            setPaymentExpirationType(periodExpirationType);
        } else if (value === PaymentTypeEnum.ONE_TIME) {
            setSelectedDefaultPeriod(defaultOneTimePaymentPeriod);
            setPaymentExpirationType(oneTimeExpirationType);
        }

        setLoading(false);
    }

    function onFinish(values: { userIdList: number[]; paymentType: PaymentTypeEnum; paymentCount: number, dateRange?: Dayjs[] }) {
        setLoading(true);

        const [start, end] = values.dateRange || [];

        let fallbackStart = defaultPeriodPaymentPeriod.startDate;
        let fallbackEnd = defaultPeriodPaymentPeriod.endDate;

        if (paymentType === PaymentTypeEnum.ONE_TIME) {
            fallbackStart = defaultOneTimePaymentPeriod.startDate;
            fallbackEnd = defaultOneTimePaymentPeriod.endDate;
        }

        const postData: PaymentRequest = {
            id: 0,
            userId: 0,
            paymentType: values.paymentType,
            paymentCount: values.paymentCount,
            startDate: start ?? fallbackStart,
            endDate: paymentExpirationType === PaymentExpirationTypeEnum.PERPETUAL ? null : (end ?? fallbackEnd)
        };

        const requests = values.userIdList.map((userId) => ({...postData, userId}));
        const userPromises = requests.map((request) => paymentAPI.create(request));

        Promise.all(userPromises)
                .then((responses) => {
                    let success = true;
                    let mismatch = false;

                    for (let i = 0; i < responses.length; i++) {
                        if (responses[i].created === null) {
                            success = false;
                            break;
                        }
                        if (!paymentMatchesRequest(responses[i], requests[i])) {
                            success = false;
                            mismatch = true;
                            break;
                        }
                    }

                    if (success) {
                        messageApi.success(t("AddPayments.onFinish.ok"));
                        window.dispatchEvent(new Event("updatePaymentList-" + values.paymentType));
                    } else {
                        console.error("Failed to update user payment information");
                        messageApi.error(t(mismatch ? "AddPayments.onFinish.mismatch" : "AddPayments.onFinish.fail"));
                    }
                })
                .catch((e) => {
                    console.error("Failed to update user payment information, error: " + e.message);
                    messageApi.error(t("AddPayments.onFinish.fail"));
                })
                .finally(() => setLoading(false));
    }

    function handleDateRangeChange(dates: RangeValue) {
        paymentForm.setFieldsValue({dateRange: dates ?? []});
    }

    return (
            <Spin spinning={loading}>
                {contextHolder}
                <Form
                        form={paymentForm}
                        initialValues={{
                            userIdList: [],
                            paymentType: PaymentTypeEnum.PERIODICAL,
                            paymentCount: 1,
                            dateRange: [
                                selectedDefaultPeriod.startDate,
                                selectedDefaultPeriod.endDate ?? selectedDefaultPeriod.startDate
                            ]
                        }}
                        {...formLayout}
                        name="payment_form"
                        onFinish={onFinish}
                        style={{maxWidth: 1000}}
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
                                optionLabelProp={"name"}
                                options={users.map((item) => ({
                                    id: item.id,
                                    name: `${item.name} (${item.id})`
                                }))}
                                placeholder={t("AddPayments.form.name.placeholder")}
                                showSearch={{optionFilterProp: "name"}}
                                style={{width: "100%"}}
                        />
                    </Form.Item>
                    {paymentExpirationType !== PaymentExpirationTypeEnum.PERPETUAL && <Form.Item
                            name="dateRange"
                            label={t("AddPayments.form.period.label")}
                            rules={[{required: true}]}
                    >
                        <ShiftableRangePicker
                                allowEmpty={[false, false]}
                                format={"YYYY-MM-DD"}
                                periodType={paymentType === PaymentTypeEnum.ONE_TIME ? oneTimeUnit : periodUnit}
                                value={watchedRange ?? null}
                                onChange={handleDateRangeChange}
                        />
                    </Form.Item>}
                    <Form.Item
                            name={"paymentType"}
                            key={"paymentType"}
                            label={t("AddPayments.form.paymentType.label")}
                            required={true}
                            wrapperCol={{xs: {span: 24}, sm: {span: 4}}}
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
                            orientation={"horizontal"}
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
