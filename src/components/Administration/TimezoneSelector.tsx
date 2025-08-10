import React, {useEffect, useState} from "react";
import {Select, Spin} from "antd";
import {useTranslation} from "react-i18next";

const {Option, OptGroup} = Select;

interface TimezoneSelectorProps {
    selectedValue: string;
    onChange: (event: { target: { value: string } }) => void;
}

export function TimezoneSelector({selectedValue, onChange}: TimezoneSelectorProps) {
    const [groupedTimezones, setGroupedTimezones] = useState<Record<string, { value: string; label: string }[]>>({});
    const [loading, setLoading] = useState(true);
    const {t} = useTranslation();

    useEffect(() => {
        fetch("/data/timezones.json")
                .then((response) => response.json())
                .then((data) => {
                    setGroupedTimezones(data);
                })
                .catch((error) => {
                    window.confirm("We failed to fetch the timezones, should be proceed?");
                    console.error("Error fetching timezones:", error);
                })
                .finally(() => {
                    setLoading(false);
                });
    }, []);

    return (
            <Spin spinning={loading}>
                <Select
                        showSearch
                        placeholder={t("TimezoneSelector.select.placeholder")}
                        optionFilterProp={"children"}
                        style={{width: "100%"}}
                        filterOption={(input: string, option) =>
                                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                        }
                        value={selectedValue}
                        onChange={(value) =>
                                onChange({
                                    target: {value},
                                })
                        }
                >
                    {Object.entries(groupedTimezones).map(([region, timezones]) => (
                            <OptGroup key={region} label={region}>
                                {timezones.map((tz) => (
                                        <Option key={tz.value} value={tz.value} label={tz.label}>
                                            {tz.label}
                                        </Option>
                                ))}
                            </OptGroup>
                    ))}
                </Select>
            </Spin>
    );
}
