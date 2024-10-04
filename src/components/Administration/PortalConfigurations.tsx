import React, { useEffect, useState } from "react";
import { Button, Checkbox, Col, Divider, Input, InputNumber, message, Row, Space, Spin, Switch, Tooltip, Typography } from "antd";
import { PortalConfigurationResponse } from "../../models/responses";
import { portalConfigurationAPI } from "../../services";
import { useTranslation } from "react-i18next";

const {Text} = Typography;

export function PortalConfigurations() {
    const [portalConfigurations, setPortalConfigurations] = useState<PortalConfigurationResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [modifiedValues, setModifiedValues] = useState<Record<number, any>>({});
    const {t} = useTranslation();

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
                    message.error(t("Error loading portal configurations"));
                })
                .finally(() => {
                    setLoading(false);
                });
    }, [t]);

    function validateEmail(value: string): boolean {
        return !value || /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value);
    }

    function handleUpdate(configId: number) {
        console.log("handleUpdate called with configId", configId);
        const config = portalConfigurations.find((c) => c.id === configId);

        if (!config) {
            console.error("Configuration not found");
            return;
        }

        const valueType = config.valueType;
        console.log("Found config", config);

        const value = modifiedValues[configId];
        console.log("Found value", value);

        config.runtimeValue = value;

        if (valueType === "email" && !validateEmail(value)) {
            message.error(t("PortalConfigurations.invalid-email"));
            return;
        }

        console.log("Updated configuration", config);

        setLoading(true);

        portalConfigurationAPI.updateConfigurationValue({
            id: config.id,
            value: config.runtimeValue,
        })
                .then(() => {
                    message.success(t("PortalConfigurations.update-ok"));
                    reloadConfiguration();
                })
                .catch((error) => {
                    console.error("Error updating configuration:", error);
                    message.error(t("PortalConfigurations.update-fail"));
                })
                .finally(() => {
                    setPortalConfigurations([...portalConfigurations]);
                    setLoading(false);
                    setModifiedValues((prev) => ({...prev, [configId]: undefined}));
                });
    }

    function renderEditor(config: PortalConfigurationResponse) {
        const {valueType, runtimeValue, defaultValue} = config;

        const currentValue = modifiedValues[config.id] !== undefined ? modifiedValues[config.id] : runtimeValue ?? defaultValue;
        const required = config.requiredRuntime && currentValue === null;

        function handleChange(newValue: any) {
            setModifiedValues((prev) => ({...prev, [config.id]: newValue}));
            console.log("ModifiedValues:", modifiedValues);
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
                        message.success(t("PortalConfigurations.configuration-reloaded"));
                    } else {
                        message.error(t("PortalConfigurations.configuration-reload-failed"));
                    }
                })
                .catch((error) => {
                    console.error("Error reloading configuration:", error);
                    message.error(t("PortalConfigurations.configuration-reload-failed"));
                })
                .finally(() => {
                    setLoading(false);
                });
    }

    return (
            <div className={"darkDiv"}>
                <Space direction={"vertical"}>
                    <h4>{t("PortalConfigurations.title")}</h4>
                    <Text type="secondary">{t("PortalConfigurations.description")}</Text>
                    <Button onClick={() => reloadConfiguration()}>{t("PortalConfigurations.button.reload")}</Button>
                    <Spin spinning={loading}>
                        <div>
                            {!loading && Object.entries(groupedConfigurations).map(([groupKey, configs]) => (
                                    <div key={groupKey}>
                                        <Divider orientation="left">{groupKey}</Divider>
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
