import React, { useEffect, useState } from "react";
import { Checkbox, Col, Input, InputNumber, message, Row, Spin, Switch, Tooltip, Typography } from "antd";
import { PortalConfigurationResponse } from "../../models/responses";
import { portalConfigurationAPI } from "../../services";
import { useTranslation } from "react-i18next";

const {Text} = Typography;

export function PortalConfigurations() {
    const [portalConfigurations, setPortalConfigurations] = useState<PortalConfigurationResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const {t} = useTranslation();

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
    }, []);

    function handleUpdate(id: number, value: any): void {
        const updatedConfig = portalConfigurations.find(config => config.id === id);
        if (updatedConfig) {
            updatedConfig.runtimeValue = value;

            setLoading(true);

            portalConfigurationAPI.updateConfigurationValue({
                id: updatedConfig.id,
                value: value
            })
                    .then(() => {
                        message.success(t("Configuration updated successfully"));
                    })
                    .catch((error) => {
                        console.error("Error updating configuration:", error);
                        message.error(t("Error updating configuration"));
                    })
                    .finally(() => {
                        setPortalConfigurations([...portalConfigurations]);
                        setLoading(false);
                    });
        }
    }

    function renderEditor(config: PortalConfigurationResponse) {
        const {valueType, runtimeValue, defaultValue} = config;

        let selectedValue = defaultValue;
        if (runtimeValue !== null && runtimeValue.length > 0) {
            selectedValue = runtimeValue;
        }

        switch (valueType) {
            case "string":
                return (
                        <Input
                                value={selectedValue}
                                onChange={(e) => handleUpdate(config.id, e.target.value)}
                        />
                );

            case "boolean":
                return (
                        <Switch
                                checkedChildren="Yes" unCheckedChildren="No"
                                checked={runtimeValue === "true"}
                                onChange={(checked) => handleUpdate(config.id, checked ? "true" : "false")}
                        />
                );

            case "number":
                return (
                        <InputNumber
                                value={Number(selectedValue)}
                                onChange={(value) => handleUpdate(config.id, value?.toString())}
                        />
                );

            case "array":
                const options = defaultValue.split(",");
                const selectedValues = selectedValue.split(",");
                return (
                        <Checkbox.Group
                                options={options}
                                value={selectedValues}
                                onChange={(checkedValues) => handleUpdate(config.id, checkedValues.join(","))}
                        />
                );

            default:
                return null;
        }
    }

    function capitalizeFirstLetter(string: string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    return (
            <div className={"darkDiv"}>
                <Spin spinning={loading}>
                    <div>
                        {/* Header Row */}
                        <Row gutter={16} style={{marginBottom: "16px"}}>
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

                        {/* Configuration Rows */}
                        {!loading && portalConfigurations.map(config => (
                                <div key={config.id} style={{marginBottom: "16px"}}>
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
                </Spin>
            </div>
    );
}
