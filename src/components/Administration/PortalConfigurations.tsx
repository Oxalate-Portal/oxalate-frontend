import {useEffect, useState} from "react";
import {Button, Checkbox, Col, DatePicker, Divider, Input, InputNumber, message, Radio, Row, Space, Spin, Switch, Tooltip, Typography} from "antd";
import {ChronoUnitEnum, MembershipTypeEnum, PaymentExpirationTypeEnum, type PortalConfigurationResponse} from "../../models";
import {portalConfigurationAPI} from "../../services";
import {useTranslation} from "react-i18next";
import {TimezoneSelector} from "./TimezoneSelector";
import dayjs from "dayjs";

const {Text} = Typography;

export function PortalConfigurations() {
    const [portalConfigurations, setPortalConfigurations] = useState<PortalConfigurationResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [modifiedValues, setModifiedValues] = useState<Record<number, any>>({});
    const {t} = useTranslation();
    const [messageApi, contextHolder] = message.useMessage();

    const groupedConfigurations = portalConfigurations.reduce((acc, config) => {
        acc[config.groupKey] = acc[config.groupKey] || [];
        acc[config.groupKey].push(config);
        return acc;
    }, {} as Record<string, PortalConfigurationResponse[]>);

    useEffect(() => {
        setLoading(true);
        portalConfigurationAPI.findAllPortalConfigurations()
                .then((response) => {
                    setPortalConfigurations(response);
                })
                .catch((error) => {
                    console.error(error);
                    messageApi.error(t("Error loading portal configurations"));
                })
                .finally(() => {
                    setLoading(false);
                });
    }, [t]);

    function validateEmail(value: string): boolean {
        return !value || /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value);
    }

    function handleUpdate(configId: number) {
        const config = portalConfigurations.find((c) => c.id === configId);

        if (!config) {
            console.error("Configuration not found");
            return;
        }

        const valueType = config.valueType;

        const value = modifiedValues[configId];

        config.runtimeValue = value;

        if (valueType === "email" && !validateEmail(value)) {
            messageApi.error(t("PortalConfigurations.invalid-email"));
            return;
        }

        setLoading(true);

        portalConfigurationAPI.updateConfigurationValue({
            id: config.id,
            value: config.runtimeValue,
        })
                .then(() => {
                    messageApi.success(t("PortalConfigurations.update-ok"));
                    reloadConfiguration();
                })
                .catch((error) => {
                    console.error("Error updating configuration:", error);
                    messageApi.error(t("PortalConfigurations.update-fail"));
                })
                .finally(() => {
                    setPortalConfigurations([...portalConfigurations]);
                    setLoading(false);
                    setModifiedValues((prev) => ({...prev, [configId]: undefined}));
                });
    }

    function renderEditor(config: PortalConfigurationResponse) {
        const {valueType, runtimeValue, defaultValue} = config;

        let currentValue = modifiedValues[config.id] !== undefined ? modifiedValues[config.id] : runtimeValue ?? defaultValue;
        const required = config.requiredRuntime && currentValue === null;

        function handleChange(newValue: any) {
            setModifiedValues((prev) => ({...prev, [config.id]: newValue}));
        }

        switch (valueType) {
            case "array":
                const options = defaultValue.split(",");
                const selectedValues = currentValue.split(",");
                return (
                        <>
                            <Checkbox.Group
                                    options={options}
                                    value={selectedValues}
                                    onChange={(checkedValues) => handleChange(checkedValues.join(","))}
                            />
                            {required && <Text type="danger">{t("PortalConfigurations.must-be-set")}</Text>}
                        </>
                );

            case "boolean":
                return (
                        <>
                            <Switch
                                    checkedChildren={t("common.button.yes")}
                                    unCheckedChildren={t("common.button.no")}
                                    checked={currentValue === "true"}
                                    onChange={(checked) => handleChange(checked ? "true" : "false")}
                            />
                            {required && <Text type="danger">{t("PortalConfigurations.must-be-set")}</Text>}
                        </>
                );
            case "date":
                const currentDate = currentValue ? dayjs(currentValue) : dayjs();

                return (
                        <>
                            <DatePicker value={currentDate}
                                        onChange={(date) => handleChange(dayjs(date).format("YYYY-MM-DD"))}
                            />
                        </>
                );
            case "email":
                return (
                        <>
                            <Input
                                    value={currentValue}
                                    onChange={(e) => handleChange(e.target.value)}
                            />
                            {required && <Text type="danger">{t("PortalConfigurations.must-be-set")}</Text>}
                        </>
                );

            case "number":
                return (
                        <>
                            <InputNumber
                                    value={Number(currentValue)}
                                    onChange={(value) => handleChange(value?.toString())}
                            />
                            {required && <Text type="danger">{t("PortalConfigurations.must-be-set")}</Text>}
                        </>
                );

            case "string":
                return (
                        <>
                            <Input
                                    value={currentValue}
                                    onChange={(e) => handleChange(e.target.value)}
                            />
                            {required && <Text type="danger">{t("PortalConfigurations.must-be-set")}</Text>}
                        </>
                );

            case "timezone":
                return (
                        <>
                            <TimezoneSelector selectedValue={currentValue} onChange={(e) => handleChange(e.target.value)}/>
                            {required && <Text type="danger">{t("PortalConfigurations.must-be-set")}</Text>}
                        </>
                );

            case "enum":
                let enumOptions: { label: string, value: string }[] = [];

                if (config.settingKey === "membership-type") {
                    enumOptions = Object.values(MembershipTypeEnum).map((type) => ({
                        label: t("MembershipTypeEnum." + type.toLowerCase()),
                        value: type.toString(),
                    }));

                    if (currentValue === config.defaultValue) {
                        currentValue = Object.values(MembershipTypeEnum)[0];
                    }
                } else if (config.settingKey === "membership-period-unit") {
                    enumOptions = Object.values(ChronoUnitEnum).map((type) => ({
                        label: t("ChronoUnitEnum." + type.toLowerCase()),
                        value: type.toString(),
                    }));

                    if (currentValue === config.defaultValue) {
                        currentValue = Object.values(ChronoUnitEnum)[0];
                    }
                } else if ((config.settingKey === "periodical-payment-method-type")
                        || (config.settingKey === "one-time-expiration-type")) {
                    enumOptions = Object.values(PaymentExpirationTypeEnum).map((type) => ({
                        label: t("PaymentExpirationType." + type.toLowerCase()),
                        value: type.toString(),
                    }));

                    if (currentValue === config.defaultValue) {
                        currentValue = Object.values(PaymentExpirationTypeEnum)[0];
                    }
                } else if (config.settingKey === "periodical-payment-method-unit"
                        || config.settingKey === "one-time-expiration-unit") {
                    enumOptions = Object.values(ChronoUnitEnum).map((type) => ({
                        label: t("ChronoUnitEnum." + type.toLowerCase()),
                        value: type.toString(),
                    }));

                    if (currentValue === config.defaultValue) {
                        currentValue = Object.values(ChronoUnitEnum)[0];
                    }
                } else {
                    console.error("Unknown enum setting key:", config.settingKey);
                }

                return (
                        <>
                            <Radio.Group options={enumOptions}
                                         value={currentValue}
                                         onChange={(e) => handleChange(e.target.value)}
                            />
                            {required && <Text type="danger">{t("PortalConfigurations.must-be-set")}</Text>}
                        </>
                );

            default:
                return null;
        }
    }

    function reloadConfiguration() {
        setLoading(true);
        portalConfigurationAPI.reloadPortalConfiguration()
                .then((result) => {
                    if (result.length > 0) {
                        setPortalConfigurations(result);
                        messageApi.success(t("PortalConfigurations.configuration-reloaded"));
                    } else {
                        messageApi.error(t("PortalConfigurations.configuration-reload-failed"));
                    }
                })
                .catch((error) => {
                    console.error("Error reloading configuration:", error);
                    messageApi.error(t("PortalConfigurations.configuration-reload-failed"));
                })
                .finally(() => {
                    setLoading(false);
                });
    }

    return (
            <div className={"darkDiv"}>
                {contextHolder}
                <Space orientation={"vertical"}>
                    <h4>{t("PortalConfigurations.title")}</h4>
                    <Text type="secondary">{t("PortalConfigurations.description")}</Text>
                    <Button onClick={() => reloadConfiguration()}>{t("PortalConfigurations.button.reload")}</Button>
                    <Spin spinning={loading}>
                        <div>
                            {!loading && Object.entries(groupedConfigurations).map(([groupKey, configs]) => (
                                    <div key={groupKey}>
                                        <Divider orientation={"horizontal"}>{t("PortalConfigurations." + groupKey + ".title")}</Divider>
                                        {configs.sort((a, b) => a.settingKey.localeCompare(b.settingKey)).map(config => (
                                                <div key={config.id} style={{marginBottom: "16px"}}>
                                                    <Row gutter={16}>
                                                        <Col span={6}>
                                                            <Tooltip
                                                                    title={t("PortalConfigurations." + config.groupKey + "." + config.settingKey + ".tooltip")}>
                                                                <Text strong>{t("PortalConfigurations." + config.groupKey + "." + config.settingKey + ".label")}</Text>
                                                            </Tooltip>
                                                        </Col>
                                                        <Col span={6}>
                                                            <Text>{config.defaultValue}</Text>
                                                        </Col>
                                                        <Col span={6}>
                                                            {renderEditor(config)}
                                                        </Col>
                                                        <Col span={6}>
                                                            {modifiedValues[config.id] !== undefined && (
                                                                    <Button type="primary" onClick={() => handleUpdate(config.id)}>
                                                                        {t("common.button.update")}
                                                                    </Button>
                                                            )}
                                                        </Col>
                                                    </Row>
                                                </div>
                                        ))}
                                    </div>
                            ))}
                        </div>
                    </Spin>
                </Space>
            </div>
    );
}
