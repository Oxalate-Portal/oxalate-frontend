import {CopyOutlined, PlusOutlined, ReloadOutlined} from "@ant-design/icons";
import {Button, DatePicker, Form, Input, message, Modal, Popconfirm, Space, Table} from "antd";
import type {ColumnsType} from "antd/es/table";
import dayjs, {type Dayjs} from "dayjs";
import {useCallback, useEffect, useMemo, useState} from "react";
import {useTranslation} from "react-i18next";
import type {TokenCreateRequest, TokenRefreshRequest, TokenResponse} from "../../models";
import {tokenAPI} from "../../services";

const PAGE_SIZE = 50;

export function AdminTokens() {
    const {t} = useTranslation();
    const [allTokens, setAllTokens] = useState<TokenResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [query, setQuery] = useState("");
    const [descriptionQuery, setDescriptionQuery] = useState("");
    const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | undefined>();
    const [createOpen, setCreateOpen] = useState(false);
    const [refreshing, setRefreshing] = useState<TokenResponse | null>(null);
    const [newToken, setNewToken] = useState<TokenResponse | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();
    const [refreshForm] = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();

    const load = useCallback(async () => {
        setLoading(true);
        try {
            setAllTokens(await tokenAPI.list());
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            messageApi.error(err.response?.data?.message || err.message || t("AdminTokens.errors.load"));
        } finally {
            setLoading(false);
        }
    }, [messageApi, t]);

    // Loading is intentionally triggered when the component mounts.
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void load();
    }, [load]);

    const filteredTokens = useMemo(() => {
        const value = query.trim().toLowerCase();
        const description = descriptionQuery.trim().toLowerCase();
        return allTokens.filter(token => {
            const tokenValue = token.tokenValue?.toLowerCase() || "";
            const tokenDescription = token.description?.toLowerCase() || "";
            const createdOrExpiry = `${token.createdAt} ${token.expiresAt}`.toLowerCase();
            const inDateRange = !dateRange ||
                    (dayjs(token.expiresAt).isAfter(dateRange[0]) && dayjs(token.expiresAt).isBefore(dateRange[1]));
            return (!value || tokenValue.includes(value) || createdOrExpiry.includes(value)) &&
                    (!description || tokenDescription.includes(description)) && inDateRange;
        });
    }, [allTokens, dateRange, descriptionQuery, query]);

    const visibleTokens = filteredTokens.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const create = async (values: { expiresAt: Dayjs; description?: string }) => {
        setSubmitting(true);
        const request: TokenCreateRequest = {
            expiresAt: values.expiresAt.toISOString(),
            description: values.description?.trim() || undefined
        };
        try {
            const created = await tokenAPI.createToken(request);
            setNewToken(created);
            setCreateOpen(false);
            form.resetFields();
            messageApi.success(t("AdminTokens.notifications.created"));
            await load();
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            messageApi.error(err.response?.data?.message || err.message || t("AdminTokens.errors.create"));
        } finally {
            setSubmitting(false);
        }
    };

    const refresh = async (values: { days: number }) => {
        if (!refreshing?.tokenValue) return;
        setSubmitting(true);
        const request: TokenRefreshRequest = {tokenValue: refreshing.tokenValue, days: Number(values.days)};
        try {
            const result = await tokenAPI.refreshToken(request);
            setNewToken(result);
            setRefreshing(null);
            refreshForm.resetFields();
            messageApi.success(t("AdminTokens.notifications.refreshed"));
            await load();
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            messageApi.error(err.response?.data?.message || err.message || t("AdminTokens.errors.refresh"));
        } finally {
            setSubmitting(false);
        }
    };

    const invalidate = useCallback(async (token: TokenResponse) => {
        if (!token.tokenValue) return;
        try {
            if (await tokenAPI.invalidateToken(token.tokenValue)) {
                messageApi.success(t("AdminTokens.notifications.invalidated"));
                await load();
            }
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            messageApi.error(err.response?.data?.message || err.message || t("AdminTokens.errors.invalidate"));
        }
    }, [load, messageApi, t]);

    const columns: ColumnsType<TokenResponse> = useMemo(() => [
        {
            title: t("AdminTokens.table.value"), dataIndex: "tokenValue", key: "tokenValue",
            render: (value: string | null | undefined, record) => record.tokenId === newToken?.tokenId ? value : `****${value?.slice(-4) || ""}`
        },
        {title: t("AdminTokens.table.created"), dataIndex: "createdAt", key: "createdAt", render: (value: string) => dayjs(value).format("YYYY-MM-DD HH:mm")},
        {
            title: t("AdminTokens.table.expiration"),
            dataIndex: "expiresAt",
            key: "expiresAt",
            render: (value: string) => dayjs(value).format("YYYY-MM-DD HH:mm")
        },
        {title: t("AdminTokens.table.description"), dataIndex: "description", key: "description", render: (value?: string) => value || "-"},
        {
            title: t("AdminTokens.table.actions"), key: "actions",
            render: (_: unknown, record) => <Space>
                <Popconfirm title={t("AdminTokens.confirm.refresh")} okText={t("common.button.yes")} cancelText={t("common.button.no")} onConfirm={() => {
                    setRefreshing(record);
                    refreshForm.resetFields();
                }}>
                    <Button type="link" icon={<ReloadOutlined/>}>{t("AdminTokens.actions.refresh")}</Button>
                </Popconfirm>
                <Popconfirm title={t("AdminTokens.confirm.invalidate")} okText={t("common.button.yes")} cancelText={t("common.button.no")}
                            onConfirm={() => void invalidate(record)}>
                    <Button type="link" danger>{t("AdminTokens.actions.invalidate")}</Button>
                </Popconfirm>
            </Space>
        }
    ], [invalidate, newToken, refreshForm, t]);

    const applyFilters = (values: { search?: string; description?: string; dateRange?: [Dayjs, Dayjs] }) => {
        setQuery(values.search || "");
        setDescriptionQuery(values.description || "");
        setDateRange(values.dateRange);
        setPage(1);
    };

    return <div className="darkDiv">
        {contextHolder}
        <h4>{t("AdminTokens.title")}</h4>
        <Form layout="inline" onFinish={applyFilters} style={{marginBottom: 16}}>
            <Form.Item name="search"><Input placeholder={t("AdminTokens.filters.value")}/></Form.Item>
            <Form.Item name="description"><Input placeholder={t("AdminTokens.filters.description")}/></Form.Item>
            <Form.Item name="dateRange"><DatePicker.RangePicker showTime
                                                                placeholder={[t("AdminTokens.filters.from"), t("AdminTokens.filters.to")]}/></Form.Item>
            <Button htmlType="submit">{t("AdminTokens.actions.search")}</Button>
        </Form>
        <Button type="primary" icon={<PlusOutlined/>} onClick={() => setCreateOpen(true)}>{t("AdminTokens.actions.create")}</Button>
        <Button icon={<ReloadOutlined/>} onClick={() => void load()} loading={loading} style={{marginLeft: 8}}>{t("AdminTokens.actions.reload")}</Button>
        <Table<TokenResponse> rowKey="tokenId" loading={loading} dataSource={visibleTokens} columns={columns}
                              pagination={{current: page, pageSize: PAGE_SIZE, total: filteredTokens.length, showSizeChanger: false}}
                              onChange={pagination => setPage(pagination.current || 1)}/>
        <Modal open={createOpen} title={t("AdminTokens.create.title")} onCancel={() => setCreateOpen(false)} footer={null} destroyOnHidden>
            <Form form={form} layout="vertical" onFinish={create}>
                <Form.Item name="expiresAt" label={t("AdminTokens.form.expiration")} rules={[{
                    required: true,
                    message: t("AdminTokens.validation.expiration")
                }, {validator: (_, value: Dayjs) => value && value.isAfter(dayjs()) ? Promise.resolve() : Promise.reject(t("AdminTokens.validation.future"))}]}>
                    <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{width: "100%"}}/>
                </Form.Item>
                <Form.Item name="description" label={t("AdminTokens.form.description")} rules={[{max: 255, message: t("AdminTokens.validation.description")}]}>
                    <Input.TextArea rows={2}/>
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={submitting}>{t("AdminTokens.actions.create")}</Button>
            </Form>
        </Modal>
        <Modal open={!!refreshing} title={t("AdminTokens.refresh.title")} onCancel={() => setRefreshing(null)} footer={null} destroyOnHidden>
            <Form form={refreshForm} layout="vertical" onFinish={refresh}>
                <Form.Item name="days" label={t("AdminTokens.form.days")} initialValue={30}
                           rules={[{required: true, message: t("AdminTokens.validation.days")}, {
                               type: "number",
                               min: 1,
                               max: 3650,
                               message: t("AdminTokens.validation.days")
                           }]}>
                    <Input type="number"/>
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={submitting}>{t("AdminTokens.actions.refresh")}</Button>
            </Form>
        </Modal>
        <Modal open={!!newToken} title={t("AdminTokens.newToken.title")} onCancel={() => setNewToken(null)}
               footer={<Button onClick={() => setNewToken(null)}>{t("common.button.close")}</Button>}>
            <p>{t("AdminTokens.newToken.warning")}</p>
            <Input value={newToken?.tokenValue || ""} readOnly
                   suffix={<CopyOutlined onClick={() => newToken?.tokenValue && void navigator.clipboard?.writeText(newToken.tokenValue)}/>}/>
        </Modal>
    </div>;
}
