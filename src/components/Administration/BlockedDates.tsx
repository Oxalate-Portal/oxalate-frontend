import {useEffect, useState} from "react";
import {Button, DatePicker, Form, Input, List, message, Popconfirm, Spin} from "antd";
import type {BlockedDateRequest, BlockedDateResponse} from "../../models";
import dayjs, {Dayjs} from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import {blockedDatesAPI} from "../../services";
import {useTranslation} from "react-i18next";

dayjs.extend(utc);
dayjs.extend(timezone);

const {Item} = Form;
const { TextArea } = Input;

function BlockedDates() {
    const [loading, setLoading] = useState<boolean>(true);
    const [blockedDates, setBlockedDates] = useState<BlockedDateResponse[]>([]);
    const [currentlyBlockedDates, setCurrentlyBlockedDates] = useState<Date[]>([]);
    const {t} = useTranslation();
    const [form] = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();

    useEffect(() => {
        loadBlockedDates();
    }, []);

    async function loadBlockedDates() {
        setLoading(true);

        blockedDatesAPI.findAll()
                .then(response => {
                    const dates = response.map((item: BlockedDateResponse) => dayjs(item.blockedDate).toDate());
                    setCurrentlyBlockedDates(dates);
                    setBlockedDates(response);
                })
                .catch(() => {
                    messageApi.error(t("BlockedDates.load.fail"));
                })
                .finally(() => {
                    setLoading(false);
                });
    }

    async function addBlockedDate(values: { blockedDate: Date, blockedReason: string }) {
        // Ensure blockedDate is a Date object
        const dateString = dayjs(values.blockedDate).format('YYYY-MM-DD');

        const blockedDate = dayjs(dateString);

        const request: BlockedDateRequest = {
            blockedDate: blockedDate,
            reason: values.blockedReason
        };

        setLoading(true);

        blockedDatesAPI.create(request)
                .then(() => {
                    messageApi.success(t("BlockedDates.popup.add-success"));
                    loadBlockedDates();
                    form.resetFields();
                })
                .catch(() => {
                    messageApi.error(t("BlockedDates.popup.add-fail"));
                })
                .finally(() => {
                    setLoading(false);
                });
    }

    async function handleRemoveBlockedDate(id: number) {
        setLoading(true);

        blockedDatesAPI.delete(id)
                .then(() => {
                    messageApi.success(t("BlockedDates.popup.remove-success"));
                    loadBlockedDates();
                })
                .catch(() => {
                    messageApi.error(t("BlockedDates.popup.remove-fail"));
                })
                .finally(() => {
                    setLoading(false);
                });
    }

    function disabledDate(current: Dayjs): boolean {
        return current && (currentlyBlockedDates.some(date => dayjs(date).isSame(current, "day")) || current < dayjs().startOf("day"));
    }

    return (
            <div className="darkDiv">
                {contextHolder}
                <h4>{t("BlockedDates.title")}</h4>

                <Spin spinning={loading}>
                    <List
                            bordered
                            dataSource={blockedDates}
                            renderItem={(item: BlockedDateResponse) => (
                                    <List.Item key={item.id}>
                                        {dayjs(item.blockedDate).format("YYYY-MM-DD")} {item.creatorName} {item.reason}
                                        <Popconfirm
                                                title={t("BlockedDates.list.confirm")}
                                                onConfirm={() => handleRemoveBlockedDate(item.id)}
                                                okText={t("common.button.yes")}
                                                cancelText={t("common.button.no")}
                                        >
                                            <Button type="link" danger>
                                                {t("common.button.delete")}
                                            </Button>
                                        </Popconfirm>
                                    </List.Item>
                            )}
                            style={{marginBottom: "16px"}}
                    />
                    <Form onFinish={addBlockedDate} layout={"vertical"} form={form}>
                        <Item label={t("BlockedDates.form.date.label")}
                              name="blockedDate"
                              rules={[{required: true, message: t("BlockedDates.form.date.rule")}]}
                        >
                            <DatePicker
                                    format="YYYY-MM-DD"
                                    placeholder={t("BlockedDates.form.date.placeholder")}
                                    disabledDate={disabledDate}
                            />
                        </Item>
                        <Item label={t("BlockedDates.form.reason.label")}
                              name={"blockedReason"}
                              rules={[{required: true, message: t("BlockedDates.form.reason.rule")}]}>
                            <TextArea
                                    placeholder={t("BlockedDates.form.reason.placeholder")}
                                    rows={2}
                                    style={{width: "600px"}}/>
                        </Item>
                        <Item>
                            <Button type="primary" htmlType="submit">
                                {t("common.button.add")}
                            </Button>
                        </Item>
                    </Form>
                </Spin>
            </div>);
}

export {BlockedDates};