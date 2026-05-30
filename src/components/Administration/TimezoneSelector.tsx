import {useEffect, useState} from "react";
import {Select, Spin} from "antd";
import {useTranslation} from "react-i18next";

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
                        showSearch={{
                            optionFilterProp: "label",
                            filterOption: (input, option) =>
                                    (String(option?.label ?? "")).toLowerCase().includes(input.toLowerCase())
                        }}
                        placeholder={t("TimezoneSelector.select.placeholder")}
                        style={{width: "100%"}}
                        options={Object.entries(groupedTimezones).map(([region, timezones]) => ({
                            label: region,
                            options: timezones
                        }))}
                        value={selectedValue}
                        onChange={(value) =>
                                onChange({
                                    target: {value},
                                })
                        }
                />
            </Spin>
    );
}
