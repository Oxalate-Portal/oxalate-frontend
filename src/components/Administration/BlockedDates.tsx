import React, { useEffect, useState } from "react";
import { Button, DatePicker, Form, List, message, Popconfirm, Spin } from "antd";
import { BlockedDateResponse } from "../../models/responses";
import { BlockedDateRequest } from "../../models/requests";
import dayjs, { Dayjs } from "dayjs";
import { blockedDatesAPI } from "../../services";
import { useTranslation } from "react-i18next";
import { localToUTCDate } from "../../helpers";

const {Item} = Form;

function BlockedDates() {
    const [loading, setLoading] = useState<boolean>(true);
    const [blockedDates, setBlockedDates] = useState<BlockedDateResponse[]>([]);
    const [currentlyBlockedDates, setCurrentlyBlockedDates] = useState<Date[]>([]);
    const {t} = useTranslation();

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
                    message.error(t("BlockedDates.load.fail"));
                })
                .finally(() => {
                    setLoading(false);
                });
    }

    async function handleAddBlockedDate(values: { blockedDate: Date }) {
        // Ensure blockedDate is a Date object
        const selectedDate = new Date(values.blockedDate);
        // We need to convert the given date to UTC since it has the time part as well and is in local timezone which may shift the selected date as
        // it becomes serialized.
        const blockedDate = localToUTCDate(selectedDate);

        const request: BlockedDateRequest = {
            blockedDate: blockedDate,
        };

        setLoading(true);

        blockedDatesAPI.create(request)
                .then(() => {
                    message.success(t("BlockedDates.popup.add-success"));
                    loadBlockedDates();
                })
                .catch(() => {
                    message.error(t("BlockedDates.popup.add-fail"));
                })
                .finally(() => {
                    setLoading(false);
                });
    }

    async function handleRemoveBlockedDate(id: number) {
        setLoading(true);

        blockedDatesAPI.delete(id)
                .then(() => {
                    message.success(t("BlockedDates.popup.remove-success"));
                    loadBlockedDates();
                })
                .catch(() => {
                    message.error(t("BlockedDates.popup.remove-fail"));
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
                <h4>{t("BlockedDates.title")}</h4>

                <Spin spinning={loading}>
                    <List
                            bordered
                            dataSource={blockedDates}
                            renderItem={(item: BlockedDateResponse) => (
                                    <List.Item key={item.id}>
                                        {dayjs(item.blockedDate).format("YYYY-MM-DD")}
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
                    <Form onFinish={handleAddBlockedDate} layout="inline">
                        <Item
                                name="blockedDate"
                                rules={[{required: true, message: t("BlockedDates.form.date.rule")}]}
                        >
                            <DatePicker
                                    format="YYYY-MM-DD"
                                    disabledDate={disabledDate}
                            />
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

export { BlockedDates };