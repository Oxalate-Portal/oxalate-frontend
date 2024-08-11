import React, { useEffect, useState } from "react";
import { Button, DatePicker, Form, List, message, Popconfirm, Spin } from "antd";
import { BlockedDateResponse } from "../../models/responses";
import { BlockedDateRequest } from "../../models/requests";
import dayjs from "dayjs";
import { blockedDatesAPI } from "../../services";
import { useTranslation } from "react-i18next";

const {Item} = Form;

function BlockedDates() {
    const [loading, setLoading] = useState<boolean>(true);
    const [blockedDates, setBlockedDates] = useState<BlockedDateResponse[]>([]);
    const {t} = useTranslation();

    useEffect(() => {
        loadBlockedDates();
    }, []);

    async function loadBlockedDates() {
        setLoading(true);

        blockedDatesAPI.findAll()
                .then(response => {
                    setBlockedDates(response);
                })
                .catch(() => {
                    message.error("Failed to load blocked dates");
                })
                .finally(() => {
                    setLoading(false);
                });
    }

    async function handleAddBlockedDate(values: { blockedDate: Date }) {
        const request: BlockedDateRequest = {
            blockedDate: values.blockedDate,
        };

        setLoading(true);
        blockedDatesAPI.create(request)
                .then(() => {
                    message.success("Blocked date added successfully");
                    loadBlockedDates();
                })
                .catch(() => {
                    message.error("Failed to add blocked date");
                })
                .finally(() => {
                    setLoading(false);
                });
    }

    async function handleRemoveBlockedDate(id: number) {
        setLoading(true);
        blockedDatesAPI.delete(id)
                .then(() => {
                    message.success("Blocked date removed successfully");
                    loadBlockedDates();
                })
                .catch(() => {
                    message.error("Failed to remove blocked date");
                })
                .finally(() => {
                    setLoading(false);
                });
    }

    function pastDates(current: dayjs.Dayjs): boolean {
        return current && current < dayjs().startOf("day");
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
                                                okText="Yes"
                                                cancelText="No"
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
                                    disabledDate={pastDates}
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