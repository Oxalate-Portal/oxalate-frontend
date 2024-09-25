import React, { useCallback, useEffect, useState } from "react";
import { Button, Checkbox, Col, Divider, Input, InputNumber, message, Row, Space, Spin, Switch, Tooltip, Typography } from "antd";
import { PortalConfigurationResponse } from "../../models/responses";
import { portalConfigurationAPI } from "../../services";
import { useTranslation } from "react-i18next";
import { debounce } from "lodash";

const { Text } = Typography;

export function PortalConfigurations() {
    const [portalConfigurations, setPortalConfigurations] = useState<PortalConfigurationResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const { t } = useTranslation();

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

    const handleUpdate = useCallback(
            (config: { type: string, id: number, value: any }) => {
                if (config.type === "number") {
                    config.value = Number(config.value);
                } else if (config.type === "boolean") {
                    config.value = config.value === "true";
                }

                if ((config.type === "string" || config.type === "email") && config.value === "") {
                    config.value = null;
                }

                if (config.type === "email" && !validateEmail(config.value)) {
                    message.error(t("PortalConfigurations.invalid-email"));
                    return;
                }

                const updatedConfig = portalConfigurations.find((c) => c.id === config.id);

                if (updatedConfig) {
                    updatedConfig.runtimeValue = config.value;

                    setLoading(true);

                    portalConfigurationAPI.updateConfigurationValue({
                        id: updatedConfig.id,
                        value: config.value,
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
                            });
                }
            },
            [portalConfigurations, t]
    );

    // Debounced update for string values
    const debouncedUpdate = useCallback(debounce(handleUpdate, 1000), [handleUpdate]);

    function renderEditor(config: PortalConfigurationResponse) {
        const { valueType, settingKey, runtimeValue, defaultValue } = config;

        let selectedValue = defaultValue;

        if (runtimeValue !== null && runtimeValue.length > 0) {
            selectedValue = runtimeValue;
        }

        const required = config.requiredRuntime && runtimeValue === null;

        switch (valueType) {
            case "array":
                const options = defaultValue.split(",");
                const selectedValues = selectedValue.split(",");
                return (
                        <>
                            <Checkbox.Group
                                    options={options}
                                    key={valueType + "-" + config.id}
                                    value={selectedValues}
                                    onChange={(checkedValues) => handleUpdate({ type: config.valueType, id: config.id, value: checkedValues.join(",") })}
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
                                    checked={selectedValue === "true"}
                                    key={valueType + "-" + config.id}
                                    onChange={(checked) => handleUpdate({ type: config.valueType, id: config.id, value: checked ? "true" : "false" })}
                            />
                            {required && <Text type="danger">{t("PortalConfigurations.must-be-set")}</Text>}
                        </>
                );

            case "email":
                return (
                        <>
                            <Input
                                    defaultValue={selectedValue}
                                    key={valueType + "-" + config.id}
                                    onChange={(e) => debouncedUpdate({ type: config.valueType, id: config.id, value: e.target.value })}
                            />
                            {required && <Text type="danger">{t("PortalConfigurations.must-be-set")}</Text>}
                        </>
                );

            case "number":
                return (
                        <>
                            <InputNumber
                                    value={Number(selectedValue)}
                                    key={valueType + "-" + config.id}
                                    onChange={(value) => debouncedUpdate({ type: config.valueType, id: config.id, value: value?.toString() })}
                            />
                            {required && <Text type="danger">{t("PortalConfigurations.must-be-set")}</Text>}
                        </>
                );

            case "string":
                return (
                        <>
                            <Input
                                    defaultValue={selectedValue}
                                    key={valueType + "-" + config.id}
                                    onChange={(e) => debouncedUpdate({ type: config.valueType, id: config.id, value: e.target.value })}
                            />
                            {required && <Text type="danger">{t("PortalConfigurations.must-be-set")}</Text>}
                        </>
                );

            default:
                return null;
        }
    }

    function capitalizeFirstLetter(string: string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
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
                                        <Divider orientation="left">{capitalizeFirstLetter(groupKey)}</Divider>
                                        <Row gutter={16}
                                             style={{ marginBottom: "16px", backgroundColor: "rgba(0, 0, 0, 0.75)", padding: "8px", borderRadius: "4px" }}>
                                            <Col span={6}>
                                                <Text strong>{t("PortalConfigurations.configuration")}</Text>
                                            </Col>
                                            <Col span={6}>
                                                <Text strong>{t("PortalConfigurations.default-value")}</Text>
                                            </Col>
                                            <Col span={6}>
                                                <Text strong>{t("PortalConfigurations.current-setting")}</Text>
                                            </Col>
                                        </Row>
                                        {configs
                                                .sort((a, b) => a.settingKey.localeCompare(b.settingKey)) // Sort the settingKeys alphabetically
                                                .map(config => (
                                                        <div key={config.id} style={{ marginBottom: "16px" }}>
                                                            <Row gutter={16}>
                                                                <Col span={6}>
                                                                    <Tooltip title={t("PortalConfigurations." + config.groupKey + "." + config.settingKey + ".tooltip")}>
                                                                        <Text strong>{t("PortalConfigurations." + config.groupKey + "." + config.settingKey + ".label")}</Text>
                                                                    </Tooltip>
                                                                </Col>
                                                                <Col span={6}>
                                                                    <Text>{config.defaultValue}</Text>
                                                                </Col>
                                                                <Col span={6}>
                                                                    {renderEditor(config)}
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
